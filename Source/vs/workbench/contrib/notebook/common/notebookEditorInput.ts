/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { VSBuffer } from "../../../../base/common/buffer.js";
import { onUnexpectedError } from "../../../../base/common/errors.js";
import * as glob from "../../../../base/common/glob.js";
import type { IMarkdownString } from "../../../../base/common/htmlContent.js";
import type {
	IDisposable,
	IReference,
} from "../../../../base/common/lifecycle.js";
import { Schemas } from "../../../../base/common/network.js";
import { isEqual, joinPath } from "../../../../base/common/resources.js";
import type { URI } from "../../../../base/common/uri.js";
import { ITextResourceConfigurationService } from "../../../../editor/common/services/textResourceConfiguration.js";
import { localize } from "../../../../nls.js";
import { IFileDialogService } from "../../../../platform/dialogs/common/dialogs.js";
import type { IResourceEditorInput } from "../../../../platform/editor/common/editor.js";
import { IFileService } from "../../../../platform/files/common/files.js";
import type { IInstantiationService } from "../../../../platform/instantiation/common/instantiation.js";
import { ILabelService } from "../../../../platform/label/common/label.js";
import {
	EditorInputCapabilities,
	type GroupIdentifier,
	type IFileLimitedEditorInputOptions,
	type IMoveResult,
	type IRevertOptions,
	type ISaveOptions,
	type IUntypedEditorInput,
	Verbosity,
} from "../../../common/editor.js";
import type { EditorInput } from "../../../common/editor/editorInput.js";
import { AbstractResourceEditorInput } from "../../../common/editor/resourceEditorInput.js";
import { ICustomEditorLabelService } from "../../../services/editor/common/customEditorLabelService.js";
import { IEditorService } from "../../../services/editor/common/editorService.js";
import { IExtensionService } from "../../../services/extensions/common/extensions.js";
import { IFilesConfigurationService } from "../../../services/filesConfiguration/common/filesConfigurationService.js";
import type { IWorkingCopyIdentifier } from "../../../services/workingCopy/common/workingCopy.js";
import {
	CellEditType,
	type IResolvedNotebookEditorModel,
} from "./notebookCommon.js";
import { INotebookEditorModelResolverService } from "./notebookEditorModelResolverService.js";
import type { NotebookPerfMarks } from "./notebookPerformance.js";
import type { NotebookProviderInfo } from "./notebookProvider.js";
import {
	INotebookService,
	SimpleNotebookProviderInfo,
} from "./notebookService.js";

export interface NotebookEditorInputOptions {
	startDirty?: boolean;
	/**
	 * backupId for webview
	 */
	_backupId?: string;
	_workingCopy?: IWorkingCopyIdentifier;
}

export class NotebookEditorInput extends AbstractResourceEditorInput {
	static getOrCreate(
		instantiationService: IInstantiationService,
		resource: URI,
		preferredResource: URI | undefined,
		viewType: string,
		options: NotebookEditorInputOptions = {},
	) {
		const editor = instantiationService.createInstance(
			NotebookEditorInput,
			resource,
			preferredResource,
			viewType,
			options,
		);
		if (preferredResource) {
			editor.setPreferredResource(preferredResource);
		}
		return editor;
	}

	static readonly ID: string = "workbench.input.notebook";

	protected editorModelReference: IReference<IResolvedNotebookEditorModel> | null =
		null;
	private _sideLoadedListener: IDisposable;
	private _defaultDirtyState = false;

	constructor(
		resource: URI,
		preferredResource: URI | undefined,
		public readonly viewType: string,
		public readonly options: NotebookEditorInputOptions,
		@INotebookService private readonly _notebookService: INotebookService,
		@INotebookEditorModelResolverService
		private readonly _notebookModelResolverService: INotebookEditorModelResolverService,
		@IFileDialogService
		private readonly _fileDialogService: IFileDialogService,
		@ILabelService labelService: ILabelService,
		@IFileService fileService: IFileService,
		@IFilesConfigurationService
		filesConfigurationService: IFilesConfigurationService,
		@IExtensionService extensionService: IExtensionService,
		@IEditorService editorService: IEditorService,
		@ITextResourceConfigurationService
		textResourceConfigurationService: ITextResourceConfigurationService,
		@ICustomEditorLabelService
		customEditorLabelService: ICustomEditorLabelService,
	) {
		super(
			resource,
			preferredResource,
			labelService,
			fileService,
			filesConfigurationService,
			textResourceConfigurationService,
			customEditorLabelService,
		);
		this._defaultDirtyState = !!options.startDirty;

		// Automatically resolve this input when the "wanted" model comes to life via
		// some other way. This happens only once per input and resolve disposes
		// this listener
		this._sideLoadedListener = _notebookService.onDidAddNotebookDocument(
			(e) => {
				if (
					e.viewType === this.viewType &&
					e.uri.toString() === this.resource.toString()
				) {
					this.resolve().catch(onUnexpectedError);
				}
			},
		);

		this._register(
			extensionService.onWillStop((e) => {
				if (!e.auto && !this.isDirty()) {
					return;
				}

				const reason = e.auto
					? localize(
							"vetoAutoExtHostRestart",
							"One of the opened editors is a notebook editor.",
						)
					: localize(
							"vetoExtHostRestart",
							"Notebook '{0}' could not be saved.",
							this.resource.path,
						);

				e.veto(
					(async () => {
						const editors = editorService.findEditors(this);
						if (e.auto) {
							return true;
						}
						if (editors.length > 0) {
							const result = await editorService.save(editors[0]);
							if (result.success) {
								return false; // Don't Veto
							}
						}
						return true; // Veto
					})(),
					reason,
				);
			}),
		);
	}

	override dispose() {
		this._sideLoadedListener.dispose();
		this.editorModelReference?.dispose();
		this.editorModelReference = null;
		super.dispose();
	}

	override get typeId(): string {
		return NotebookEditorInput.ID;
	}

	override get editorId(): string | undefined {
		return this.viewType;
	}

	override get capabilities(): EditorInputCapabilities {
		let capabilities = EditorInputCapabilities.None;

		if (this.resource.scheme === Schemas.untitled) {
			capabilities |= EditorInputCapabilities.Untitled;
		}

		if (this.editorModelReference) {
			if (this.editorModelReference.object.isReadonly()) {
				capabilities |= EditorInputCapabilities.Readonly;
			}
		} else if (this.filesConfigurationService.isReadonly(this.resource)) {
			capabilities |= EditorInputCapabilities.Readonly;
		}

		if (!(capabilities & EditorInputCapabilities.Readonly)) {
			capabilities |= EditorInputCapabilities.CanDropIntoEditor;
		}

		return capabilities;
	}

	override getDescription(verbosity = Verbosity.MEDIUM): string | undefined {
		if (
			!this.hasCapability(EditorInputCapabilities.Untitled) ||
			this.editorModelReference?.object.hasAssociatedFilePath()
		) {
			return super.getDescription(verbosity);
		}

		return undefined; // no description for untitled notebooks without associated file path
	}

	override isReadonly(): boolean | IMarkdownString {
		if (!this.editorModelReference) {
			return this.filesConfigurationService.isReadonly(this.resource);
		}
		return this.editorModelReference.object.isReadonly();
	}

	override isDirty() {
		if (!this.editorModelReference) {
			return this._defaultDirtyState;
		}
		return this.editorModelReference.object.isDirty();
	}

	override isSaving(): boolean {
		const model = this.editorModelReference?.object;
		if (
			!model ||
			!model.isDirty() ||
			model.hasErrorState ||
			this.hasCapability(EditorInputCapabilities.Untitled)
		) {
			return false; // require the model to be dirty, file-backed and not in an error state
		}

		// if a short auto save is configured, treat this as being saved
		return this.filesConfigurationService.hasShortAutoSaveDelay(this);
	}

	override async save(
		group: GroupIdentifier,
		options?: ISaveOptions,
	): Promise<EditorInput | IUntypedEditorInput | undefined> {
		if (this.editorModelReference) {
			if (this.hasCapability(EditorInputCapabilities.Untitled)) {
				return this.saveAs(group, options);
			} else {
				await this.editorModelReference.object.save(options);
			}

			return this;
		}

		return undefined;
	}

	override async saveAs(
		group: GroupIdentifier,
		options?: ISaveOptions,
	): Promise<IUntypedEditorInput | undefined> {
		if (!this.editorModelReference) {
			return undefined;
		}

		const provider = this._notebookService.getContributedNotebookType(
			this.viewType,
		);

		if (!provider) {
			return undefined;
		}

		const pathCandidate = this.hasCapability(
			EditorInputCapabilities.Untitled,
		)
			? await this._suggestName(
					provider,
					this.labelService.getUriBasenameLabel(this.resource),
				)
			: this.editorModelReference.object.resource;
		let target: URI | undefined;
		if (this.editorModelReference.object.hasAssociatedFilePath()) {
			target = pathCandidate;
		} else {
			target = await this._fileDialogService.pickFileToSave(
				pathCandidate,
				options?.availableFileSystems,
			);
			if (!target) {
				return undefined; // save cancelled
			}
		}

		if (!provider.matches(target)) {
			const patterns = provider.selectors
				.map((pattern) => {
					if (typeof pattern === "string") {
						return pattern;
					}

					if (glob.isRelativePattern(pattern)) {
						return `${pattern} (base ${pattern.base})`;
					}

					if (pattern.exclude) {
						return `${pattern.include} (exclude: ${pattern.exclude})`;
					} else {
						return `${pattern.include}`;
					}
				})
				.join(", ");
			throw new Error(
				`File name ${target} is not supported by ${provider.providerDisplayName}.\n\nPlease make sure the file name matches following patterns:\n${patterns}`,
			);
		}

		return await this.editorModelReference.object.saveAs(target);
	}

	private async _suggestName(
		provider: NotebookProviderInfo,
		suggestedFilename: string,
	) {
		// guess file extensions
		const firstSelector = provider.selectors[0];
		let selectorStr =
			firstSelector && typeof firstSelector === "string"
				? firstSelector
				: undefined;
		if (!selectorStr && firstSelector) {
			const include = (firstSelector as { include?: string }).include;
			if (typeof include === "string") {
				selectorStr = include;
			}
		}

		if (selectorStr) {
			const matches = /^\*\.([A-Za-z_-]*)$/.exec(selectorStr);
			if (matches && matches.length > 1) {
				const fileExt = matches[1];
				if (!suggestedFilename.endsWith(fileExt)) {
					return joinPath(
						await this._fileDialogService.defaultFilePath(),
						suggestedFilename + "." + fileExt,
					);
				}
			}
		}

		return joinPath(
			await this._fileDialogService.defaultFilePath(),
			suggestedFilename,
		);
	}

	// called when users rename a notebook document
	override async rename(
		group: GroupIdentifier,
		target: URI,
	): Promise<IMoveResult | undefined> {
		if (this.editorModelReference) {
			return {
				editor: { resource: target },
				options: { override: this.viewType },
			};
		}
		return undefined;
	}

	override async revert(
		_group: GroupIdentifier,
		options?: IRevertOptions,
	): Promise<void> {
		if (
			this.editorModelReference &&
			this.editorModelReference.object.isDirty()
		) {
			await this.editorModelReference.object.revert(options);
		}
	}

	override async resolve(
		_options?: IFileLimitedEditorInputOptions,
		perf?: NotebookPerfMarks,
	): Promise<IResolvedNotebookEditorModel | null> {
		if (!(await this._notebookService.canResolve(this.viewType))) {
			return null;
		}

		perf?.mark("extensionActivated");

		// we are now loading the notebook and don't need to listen to
		// "other" loading anymore
		this._sideLoadedListener.dispose();

		if (this.editorModelReference) {
			this.editorModelReference.object.load({
				limits: this.ensureLimits(_options),
			});
		} else {
			const scratchpad =
				this.capabilities & EditorInputCapabilities.Scratchpad
					? true
					: false;
			const ref = await this._notebookModelResolverService.resolve(
				this.resource,
				this.viewType,
				{ limits: this.ensureLimits(_options), scratchpad },
			);
			if (this.editorModelReference) {
				// Re-entrant, double resolve happened. Dispose the addition references and proceed
				// with the truth.
				ref.dispose();
				return (<IReference<IResolvedNotebookEditorModel>>(
					this.editorModelReference
				)).object;
			}
			this.editorModelReference = ref;
			if (this.isDisposed()) {
				this.editorModelReference.dispose();
				this.editorModelReference = null;
				return null;
			}
			this._register(
				this.editorModelReference.object.onDidChangeDirty(() =>
					this._onDidChangeDirty.fire(),
				),
			);
			this._register(
				this.editorModelReference.object.onDidChangeReadonly(() =>
					this._onDidChangeCapabilities.fire(),
				),
			);
			this._register(
				this.editorModelReference.object.onDidRevertUntitled(() =>
					this.dispose(),
				),
			);
			if (this.editorModelReference.object.isDirty()) {
				this._onDidChangeDirty.fire();
			}
		}

		if (this.options._backupId) {
			const info = await this._notebookService.withNotebookDataProvider(
				this.editorModelReference.object.notebook.viewType,
			);
			if (!(info instanceof SimpleNotebookProviderInfo)) {
				throw new Error("CANNOT open file notebook with this provider");
			}

			const data = await info.serializer.dataToNotebook(
				VSBuffer.fromString(
					JSON.stringify({
						__webview_backup: this.options._backupId,
					}),
				),
			);
			this.editorModelReference.object.notebook.applyEdits(
				[
					{
						editType: CellEditType.Replace,
						index: 0,
						count: this.editorModelReference.object.notebook.length,
						cells: data.cells,
					},
				],
				true,
				undefined,
				() => undefined,
				undefined,
				false,
			);

			if (this.options._workingCopy) {
				this.options._backupId = undefined;
				this.options._workingCopy = undefined;
				this.options.startDirty = undefined;
			}
		}

		return this.editorModelReference.object;
	}

	override toUntyped(): IResourceEditorInput {
		return {
			resource: this.resource,
			options: {
				override: this.viewType,
			},
		};
	}

	override matches(otherInput: EditorInput | IUntypedEditorInput): boolean {
		if (super.matches(otherInput)) {
			return true;
		}
		if (otherInput instanceof NotebookEditorInput) {
			return (
				this.editorId === otherInput.editorId &&
				isEqual(this.resource, otherInput.resource)
			);
		}
		return false;
	}
}

export interface ICompositeNotebookEditorInput {
	readonly editorInputs: NotebookEditorInput[];
}

export function isCompositeNotebookEditorInput(
	thing: unknown,
): thing is ICompositeNotebookEditorInput {
	return (
		!!thing &&
		typeof thing === "object" &&
		Array.isArray((<ICompositeNotebookEditorInput>thing).editorInputs) &&
		(<ICompositeNotebookEditorInput>thing).editorInputs.every(
			(input) => input instanceof NotebookEditorInput,
		)
	);
}

export function isNotebookEditorInput(
	thing: EditorInput | undefined,
): thing is NotebookEditorInput {
	return (
		!!thing &&
		typeof thing === "object" &&
		thing.typeId === NotebookEditorInput.ID
	);
}
