/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { isEqual } from '../../../../base/common/resources.js';
import { AsyncReferenceCollection, Disposable, DisposableStore, dispose, IDisposable, IReference, ReferenceCollection, toDisposable } from '../../../../base/common/lifecycle.js';
import { autorun, autorunWithStore, derived, observableFromEvent, observableValue } from '../../../../base/common/observable.js';
import { IChatEditingService, WorkingSetEntryState, IModifiedFileEntry, ChatEditingSessionState } from '../../chat/common/chatEditingService.js';
import { INotebookService } from '../common/notebookService.js';
import { bufferToStream, VSBuffer } from '../../../../base/common/buffer.js';
import { NotebookTextModel } from '../common/model/notebookTextModel.js';
import { INotebookEditor, INotebookEditorContribution } from './notebookBrowser.js';
import { createDecorator, IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';
import { raceCancellation, ThrottledDelayer } from '../../../../base/common/async.js';
import { CellDiffInfo, computeDiff, prettyChanges } from './diff/notebookDiffViewModel.js';
import { CancellationToken, CancellationTokenSource } from '../../../../base/common/cancellation.js';
import { INotebookEditorWorkerService } from '../common/services/notebookWorkerService.js';
import { ChatEditingModifiedFileEntry } from '../../chat/browser/chatEditing/chatEditingModifiedFileEntry.js';
import { CellEditType, CellKind, CellUri, ICellDto2, ICellReplaceEdit } from '../common/notebookCommon.js';
import { URI } from '../../../../base/common/uri.js';
import { Emitter } from '../../../../base/common/event.js';
import { ICodeEditor, IViewZone } from '../../../../editor/browser/editorBrowser.js';
import { IModelService } from '../../../../editor/common/services/model.js';
import { IEditorWorkerService } from '../../../../editor/common/services/editorWorker.js';
import { ILanguageService } from '../../../../editor/common/languages/language.js';
import { EditorOption } from '../../../../editor/common/config/editorOptions.js';
import { themeColorFromId } from '../../../../base/common/themables.js';
import { RenderOptions, LineSource, renderLines } from '../../../../editor/browser/widget/diffEditor/components/diffEditorViewZones/renderLines.js';
import { diffAddDecoration, diffWholeLineAddDecoration, diffDeleteDecoration } from '../../../../editor/browser/widget/diffEditor/registrations.contribution.js';
import { IDocumentDiff } from '../../../../editor/common/diff/documentDiffProvider.js';
import { ITextModel, TrackedRangeStickiness, MinimapPosition, IModelDeltaDecoration, OverviewRulerLane } from '../../../../editor/common/model.js';
import { ModelDecorationOptions } from '../../../../editor/common/model/textModel.js';
import { InlineDecoration, InlineDecorationType } from '../../../../editor/common/viewModel.js';
import { overviewRulerModifiedForeground, minimapGutterModifiedBackground, overviewRulerAddedForeground, minimapGutterAddedBackground, overviewRulerDeletedForeground, minimapGutterDeletedBackground } from '../../scm/browser/dirtydiffDecorator.js';
import { Range } from '../../../../editor/common/core/range.js';
import { NotebookCellTextModel } from '../common/model/notebookCellTextModel.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';


export const INotebookOriginalModelReferenceFactory = createDecorator<INotebookOriginalModelReferenceFactory>('INotebookOriginalModelReferenceFactory');

export interface INotebookOriginalModelReferenceFactory {
	readonly _serviceBrand: undefined;
	getOrCreate(fileEntry: IModifiedFileEntry, viewType: string): Promise<IReference<NotebookTextModel>>;
}


export class NotebookChatEditorControllerContrib extends Disposable implements INotebookEditorContribution {

	public static readonly ID: string = 'workbench.notebook.chatEditorController';
	readonly _serviceBrand: undefined;
	constructor(
		notebookEditor: INotebookEditor,
		@IInstantiationService instantiationService: IInstantiationService,
		@IConfigurationService configurationService: IConfigurationService,

	) {
		super();
		if (configurationService.getValue<boolean>('notebook.experimental.chatEdits')) {
			this._register(instantiationService.createInstance(NotebookChatEditorController, notebookEditor));
		}
	}
}


class NotebookChatEditorController extends Disposable {
	constructor(
		private readonly notebookEditor: INotebookEditor,
		@IChatEditingService private readonly _chatEditingService: IChatEditingService,
		@INotebookOriginalModelReferenceFactory private readonly originalModelRefFactory: INotebookOriginalModelReferenceFactory,
		@IInstantiationService private readonly instantiationService: IInstantiationService,
	) {
		super();

		const notebookModel = observableFromEvent(this.notebookEditor.onDidChangeModel, e => e);
		const entryObs = observableValue<IModifiedFileEntry | undefined>('fileentry', undefined);
		const notebookDiff = observableValue<{ cellDiff: CellDiffInfo[]; modelVersion: number } | undefined>('cellDiffInfo', undefined);
		const originalModel = observableValue<NotebookTextModel | undefined>('originalModel', undefined);
		this._register(autorun(r => {
			const session = this._chatEditingService.currentEditingSessionObs.read(r);
			const model = notebookModel.read(r);
			if (!model || !session) {
				return;
			}
			const entry = session.entries.read(r).find(e => isEqual(e.modifiedURI, model.uri));

			if (!entry || entry.state.read(r) !== WorkingSetEntryState.Modified) {
				dispose(Array.from(decorators.values()));
				return;
			}
			entryObs.set(entry, undefined);
		}));

		this._register(autorunWithStore(async (r, store) => {
			const entry = entryObs.read(r);
			const model = notebookModel.read(r);
			if (!entry || !model) {
				return;
			}
			const notebookSynchronizer = store.add(this.instantiationService.createInstance(NotebookModelSynchronizer, this.notebookEditor, entry, model.viewType));
			notebookDiff.set(undefined, undefined);
			store.add(notebookSynchronizer.onDidUpdateNotebookModel(e => {
				notebookDiff.set(e, undefined);
			}));
			const result = this._register(await this.getOriginalNotebookModel(entry, model));
			originalModel.set(result.object, undefined);
		}));

		const onDidChangeVisibleRanges = observableFromEvent(this.notebookEditor.onDidChangeVisibleRanges, () => this.notebookEditor.visibleRanges);
		const decorators = new Map<NotebookCellTextModel, NotebookCellDiffDecorator>();
		const editors = new WeakMap<ICodeEditor, IDisposable>();
		this._register(autorun(r => {
			const entry = entryObs.read(r);
			const diffInfo = notebookDiff.read(r);
			const modified = notebookModel.read(r);
			const original = originalModel.read(r);
			onDidChangeVisibleRanges.read(r);
			if (!entry || !modified || !original || !diffInfo || diffInfo.modelVersion !== modified.versionId) {
				return;
			}
			diffInfo.cellDiff.forEach((diff) => {
				if (diff.type === 'modified') {
					const modifiedCell = modified.cells[diff.modifiedCellIndex];
					const originalCell = original.cells[diff.originalCellIndex];
					const editor = this.notebookEditor.codeEditors.find(([vm,]) => vm.handle === modifiedCell.handle)?.[1];
					if (editor && decorators.get(modifiedCell)?.editor !== editor) {
						decorators.get(modifiedCell)?.dispose();
						const decorator = this.instantiationService.createInstance(NotebookCellDiffDecorator, editor, originalCell.getValue(), modifiedCell.cellKind);
						editors.set(editor, decorator);
						this._register(editor.onDidDispose(() => {
							decorator.dispose();
						}));
					}
				}
			});
		}));
	}
	private async getOriginalNotebookModel(entry: IModifiedFileEntry, modified: NotebookTextModel): Promise<IReference<NotebookTextModel>> {
		return this._register(await this.originalModelRefFactory.getOrCreate(entry, modified.viewType));
	}

}


class NotebookCellDiffDecorator extends DisposableStore {
	private readonly _sessionStore = this.add(new DisposableStore());
	private readonly _decorations = this.editor.createDecorationsCollection();
	private _viewZones: string[] = [];

	constructor(
		public readonly editor: ICodeEditor,
		private readonly originalCellValue: string | undefined,
		private readonly cellKind: CellKind,
		@IChatEditingService private readonly _chatEditingService: IChatEditingService,
		@IModelService private readonly modelService: IModelService,
		@IEditorWorkerService private readonly _editorWorkerService: IEditorWorkerService,
		@ILanguageService private readonly _languageService: ILanguageService,

	) {
		super();
		this.add(this.editor.onDidChangeModel(() => this._update()));
		this.add(this.editor.onDidChangeConfiguration((e) => {
			if (e.hasChanged(EditorOption.fontInfo) || e.hasChanged(EditorOption.lineHeight)) {
				this._update();
			}
		}));
		this.add(toDisposable(() => this._clearRendering()));

		const shouldBeReadOnly = derived(this, r => {
			const value = this._chatEditingService.currentEditingSessionObs.read(r);
			if (!value || value.state.read(r) !== ChatEditingSessionState.StreamingEdits) {
				return false;
			}
			return value.entries.read(r).some(e => isEqual(e.modifiedURI, this.editor.getModel()?.uri));
		});


		let actualReadonly: boolean | undefined;
		let actualDeco: 'off' | 'editable' | 'on' | undefined;

		this.add(autorun(r => {
			const value = shouldBeReadOnly.read(r);
			if (value) {
				actualReadonly ??= this.editor.getOption(EditorOption.readOnly);
				actualDeco ??= this.editor.getOption(EditorOption.renderValidationDecorations);

				this.editor.updateOptions({
					readOnly: true,
					renderValidationDecorations: 'off'
				});
			} else {
				if (actualReadonly !== undefined && actualDeco !== undefined) {
					this.editor.updateOptions({
						readOnly: actualReadonly,
						renderValidationDecorations: actualDeco
					});
					actualReadonly = undefined;
					actualDeco = undefined;
				}
			}
		}));
		this.update();
	}

	private _update(): void {
		this._sessionStore.clear();
		if (!this.editor.hasModel()) {
			return;
		}
		if (this.editor.getOption(EditorOption.inDiffEditor)) {
			return;
		}
		if (this.editor.getOption(EditorOption.inDiffEditor)) {
			this._clearRendering();
			return;
		}
		this.update();
	}
	public update(): void {
		if (this.isDisposed) {
			return;
		}
		const model = this.editor.getModel();
		if (!model) {
			this._clearRendering();
			return;
		}

		const version = model.getVersionId();
		this.computeDiff().then((diff) => {
			if (diff && this.editor.getModel()?.getVersionId() === version && !this.isDisposed) {
				this._updateWithDiff(diff);
			}
		});
	}

	private _clearRendering() {
		this.editor.changeViewZones((viewZoneChangeAccessor) => {
			for (const id of this._viewZones) {
				viewZoneChangeAccessor.removeZone(id);
			}
		});
		this._viewZones = [];
		this._decorations.clear();
	}

	private _originalModel?: ITextModel;
	private getOrCreateOriginalModel() {
		if (this._originalModel) {
			return this._originalModel;
		}
		if (!this.originalCellValue) {
			return;
		}
		const model = this.editor.getModel();
		if (!model) {
			return;
		}
		const cellUri = model.uri;
		const languageId = model.getLanguageId();

		const scheme = `${CellUri.scheme}-chat-edit-${Date.now()}`;
		const originalCellUri = URI.from({ scheme, path: cellUri.path });
		const languageSelection = this._languageService.getLanguageIdByLanguageName(languageId) ? this._languageService.createById(languageId) : this.cellKind === CellKind.Markup ? this._languageService.createById('markdown') : null;
		return this._originalModel = this.add(this.modelService.createModel(this.originalCellValue, languageSelection, originalCellUri));
	}
	private async computeDiff() {
		const model = this.editor.getModel();
		if (!model) {
			return;
		}
		const originalModel = this.getOrCreateOriginalModel();
		if (!originalModel) {
			return;
		}

		return this._editorWorkerService.computeDiff(
			originalModel.uri,
			model.uri,
			{ computeMoves: true, ignoreTrimWhitespace: false, maxComputationTimeMs: Number.MAX_SAFE_INTEGER },
			'advanced'
		);
	}

	private _updateWithDiff(diff: IDocumentDiff): void {
		const originalModel = this.getOrCreateOriginalModel();
		if (!originalModel) {
			this._clearRendering();
			return;
		}

		const chatDiffAddDecoration = ModelDecorationOptions.createDynamic({
			...diffAddDecoration,
			stickiness: TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
		});
		const chatDiffWholeLineAddDecoration = ModelDecorationOptions.createDynamic({
			...diffWholeLineAddDecoration,
			stickiness: TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
		});
		const createOverviewDecoration = (overviewRulerColor: string, minimapColor: string) => {
			return ModelDecorationOptions.createDynamic({
				description: 'chat-editing-decoration',
				overviewRuler: { color: themeColorFromId(overviewRulerColor), position: OverviewRulerLane.Left },
				minimap: { color: themeColorFromId(minimapColor), position: MinimapPosition.Gutter },
			});
		};
		const modifiedDecoration = createOverviewDecoration(overviewRulerModifiedForeground, minimapGutterModifiedBackground);
		const addedDecoration = createOverviewDecoration(overviewRulerAddedForeground, minimapGutterAddedBackground);
		const deletedDecoration = createOverviewDecoration(overviewRulerDeletedForeground, minimapGutterDeletedBackground);

		this.editor.changeViewZones((viewZoneChangeAccessor) => {
			for (const id of this._viewZones) {
				viewZoneChangeAccessor.removeZone(id);
			}
			this._viewZones = [];
			const modifiedDecorations: IModelDeltaDecoration[] = [];
			const mightContainNonBasicASCII = originalModel.mightContainNonBasicASCII();
			const mightContainRTL = originalModel.mightContainRTL();
			const renderOptions = RenderOptions.fromEditor(this.editor);

			for (const diffEntry of diff.changes) {
				const originalRange = diffEntry.original;
				originalModel.tokenization.forceTokenization(Math.max(1, originalRange.endLineNumberExclusive - 1));
				const source = new LineSource(
					originalRange.mapToLineArray(l => originalModel.tokenization.getLineTokens(l)),
					[],
					mightContainNonBasicASCII,
					mightContainRTL,
				);
				const decorations: InlineDecoration[] = [];
				for (const i of diffEntry.innerChanges || []) {
					decorations.push(new InlineDecoration(
						i.originalRange.delta(-(diffEntry.original.startLineNumber - 1)),
						diffDeleteDecoration.className!,
						InlineDecorationType.Regular
					));
					modifiedDecorations.push({
						range: i.modifiedRange, options: chatDiffAddDecoration
					});
				}
				if (!diffEntry.modified.isEmpty) {
					modifiedDecorations.push({
						range: diffEntry.modified.toInclusiveRange()!, options: chatDiffWholeLineAddDecoration
					});
				}

				if (diffEntry.original.isEmpty) {
					// insertion
					modifiedDecorations.push({
						range: diffEntry.modified.toInclusiveRange()!,
						options: addedDecoration
					});
				} else if (diffEntry.modified.isEmpty) {
					// deletion
					modifiedDecorations.push({
						range: new Range(diffEntry.modified.startLineNumber - 1, 1, diffEntry.modified.startLineNumber, 1),
						options: deletedDecoration
					});
				} else {
					// modification
					modifiedDecorations.push({
						range: diffEntry.modified.toInclusiveRange()!,
						options: modifiedDecoration
					});
				}
				const domNode = document.createElement('div');
				domNode.className = 'chat-editing-original-zone view-lines line-delete monaco-mouse-cursor-text';
				const result = renderLines(source, renderOptions, decorations, domNode);

				const isCreatedContent = decorations.length === 1 && decorations[0].range.isEmpty() && decorations[0].range.startLineNumber === 1;
				if (!isCreatedContent) {
					const viewZoneData: IViewZone = {
						afterLineNumber: diffEntry.modified.startLineNumber - 1,
						heightInLines: result.heightInLines,
						domNode,
						ordinal: 50000 + 2 // more than https://github.com/microsoft/vscode/blob/bf52a5cfb2c75a7327c9adeaefbddc06d529dcad/src/vs/workbench/contrib/inlineChat/browser/inlineChatZoneWidget.ts#L42
					};

					this._viewZones.push(viewZoneChangeAccessor.addZone(viewZoneData));
				}
			}

			this._decorations.set(modifiedDecorations);
		});
	}
}


class NotebookModelSynchronizer extends Disposable {
	private readonly throttledUpdateNotebookModel = new ThrottledDelayer(200);
	private readonly _onDidUpdateNotebookModel = this._register(new Emitter<{ cellDiff: CellDiffInfo[]; modelVersion: number }>);
	public readonly onDidUpdateNotebookModel = this._onDidUpdateNotebookModel.event;
	constructor(
		private readonly notebookEditor: INotebookEditor,
		public readonly entry: IModifiedFileEntry,
		viewType: string,
		@INotebookOriginalModelReferenceFactory private readonly originalModelRefFactory: INotebookOriginalModelReferenceFactory,
		@INotebookService private readonly notebookService: INotebookService,
		@INotebookEditorWorkerService private readonly notebookEditorWorkerService: INotebookEditorWorkerService
	) {
		super();
		const cancellationTokenStore = this._register(new DisposableStore());
		let cancellationToken = cancellationTokenStore.add(new CancellationTokenSource());

		const updateNotebookModel = (entry: IModifiedFileEntry, viewType: string, token: CancellationToken) => {
			this.throttledUpdateNotebookModel.trigger(() => this.updateNotebookModel(entry, viewType, token));
		};
		this._register((entry as ChatEditingModifiedFileEntry).modifiedModel.onDidChangeContent(() => {
			cancellationTokenStore.clear();
			cancellationToken = this._register(new CancellationTokenSource());
			updateNotebookModel(entry, viewType, cancellationToken.token);
		}));

		updateNotebookModel(entry, viewType, cancellationToken.token);
	}

	private async updateNotebookModel(entry: IModifiedFileEntry, viewType: string, token: CancellationToken) {
		const model = await this.getModifiedModelForDiff(entry, viewType, token);
		if (!model || token.isCancellationRequested) {
			return;
		}
		const diffResult = await this.computeDiff(entry, model, token);
		if (!diffResult || token.isCancellationRequested) {
			return;
		}
		const { cellDiffInfo, original } = diffResult;
		if (cellDiffInfo.some(d => d.type !== 'unchanged')) {
			// Replace all cells starting from firstChangeIndex
			const activeModel = this.notebookEditor.textModel;
			if (activeModel) {
				const edits: ICellReplaceEdit[] = [
					{
						editType: CellEditType.Replace,
						index: 0,
						count: original.object.cells.length,
						cells: model.cells.map(cell => ({
							source: cell.getValue(),
							cellKind: cell.cellKind,
							language: cell.language,
							outputs: cell.outputs.map(output => output.asDto()),
							mime: cell.mime,
							metadata: cell.metadata,
							collapseState: cell.collapseState,
							internalMetadata: cell.internalMetadata
						} satisfies ICellDto2))
					}
				];
				activeModel.applyEdits(edits, true, undefined, () => undefined, undefined, false);
				this._onDidUpdateNotebookModel.fire({ cellDiff: cellDiffInfo, modelVersion: activeModel.versionId });
			}
		}
	}
	private previousUriOfModelForDiff?: URI;

	private async getModifiedModelForDiff(entry: IModifiedFileEntry, viewType: string, token: CancellationToken): Promise<NotebookTextModel | undefined> {
		const text = (entry as ChatEditingModifiedFileEntry).modifiedModel.getValue();
		const bytes = VSBuffer.fromString(text);
		const uri = entry.modifiedURI.with({ scheme: `NotebookChatEditorController.modifiedScheme${Date.now().toString()}` });
		const stream = bufferToStream(bytes);
		if (this.previousUriOfModelForDiff) {
			this.notebookService.getNotebookTextModel(this.previousUriOfModelForDiff)?.dispose();
		}
		this.previousUriOfModelForDiff = uri;
		try {
			const model = await this.notebookService.createNotebookTextModel(viewType, uri, stream);
			if (token.isCancellationRequested) {
				model.dispose();
				return;
			}
			this._register(model);
			return model;
		} catch (ex) {
			console.error(ex);
			return;
		}
	}

	private async getOriginalNotebookModel(entry: IModifiedFileEntry, modified: NotebookTextModel): Promise<IReference<NotebookTextModel>> {
		return this._register(await this.originalModelRefFactory.getOrCreate(entry, modified.viewType));
	}

	async computeDiff(entry: IModifiedFileEntry, modified: NotebookTextModel, token: CancellationToken) {
		const original = await this.getOriginalNotebookModel(entry, modified);
		const diffResult = await raceCancellation(this.notebookEditorWorkerService.computeDiff(original.object.uri, modified.uri), token);
		if (!diffResult || token.isCancellationRequested) {
			// after await the editor might be disposed.
			return;
		}

		prettyChanges(original.object, modified, diffResult.cellsDiff);

		return { original, ...computeDiff(original.object, modified, diffResult) };
	}
}


export class OriginalNotebookModelReferenceCollection extends ReferenceCollection<Promise<NotebookTextModel>> {
	private readonly modelsToDispose = new Set<string>();
	constructor(@INotebookService private readonly notebookService: INotebookService) {
		super();
	}

	protected override async createReferencedObject(key: string, fileEntry: IModifiedFileEntry, viewType: string): Promise<NotebookTextModel> {
		this.modelsToDispose.delete(key);
		const uri = fileEntry.originalURI;
		const model = this.notebookService.getNotebookTextModel(uri);
		if (model) {
			return model;
		}
		const bytes = VSBuffer.fromString(fileEntry.originalModel.getValue());
		const stream = bufferToStream(bytes);

		return this.notebookService.createNotebookTextModel(viewType, uri, stream);
	}
	protected override destroyReferencedObject(key: string, modelPromise: Promise<NotebookTextModel>): void {
		this.modelsToDispose.add(key);

		(async () => {
			try {
				const model = await modelPromise;

				if (!this.modelsToDispose.has(key)) {
					// return if model has been acquired again meanwhile
					return;
				}

				// Finally we can dispose the model
				model.dispose();
			} catch (error) {
				// ignore
			} finally {
				this.modelsToDispose.delete(key); // Untrack as being disposed
			}
		})();
	}
}


export class NotebookOriginalModelReferenceFactory implements INotebookOriginalModelReferenceFactory {
	readonly _serviceBrand: undefined;
	private _resourceModelCollection: OriginalNotebookModelReferenceCollection & ReferenceCollection<Promise<NotebookTextModel>> /* TS Fail */ | undefined = undefined;
	private get resourceModelCollection() {
		if (!this._resourceModelCollection) {
			this._resourceModelCollection = this.instantiationService.createInstance(OriginalNotebookModelReferenceCollection);
		}

		return this._resourceModelCollection;
	}

	private _asyncModelCollection: AsyncReferenceCollection<NotebookTextModel> | undefined = undefined;
	private get asyncModelCollection() {
		if (!this._asyncModelCollection) {
			this._asyncModelCollection = new AsyncReferenceCollection(this.resourceModelCollection);
		}

		return this._asyncModelCollection;
	}

	constructor(@IInstantiationService private readonly instantiationService: IInstantiationService) {
	}

	getOrCreate(fileEntry: IModifiedFileEntry, viewType: string): Promise<IReference<NotebookTextModel>> {
		return this.asyncModelCollection.acquire(fileEntry.originalURI.toString(), fileEntry, viewType);
	}
}

