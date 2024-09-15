/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as DOM from "../../../../../base/browser/dom.js";
import type {
	IMouseWheelEvent,
	StandardMouseEvent,
} from "../../../../../base/browser/mouseEvent.js";
import { PixelRatio } from "../../../../../base/browser/pixelRatio.js";
import { findLastIdx } from "../../../../../base/common/arraysFind.js";
import { SequencerByKey } from "../../../../../base/common/async.js";
import {
	CancellationTokenSource,
	type CancellationToken,
} from "../../../../../base/common/cancellation.js";
import { Emitter, Event } from "../../../../../base/common/event.js";
import {
	DisposableStore,
	toDisposable,
	type IDisposable,
} from "../../../../../base/common/lifecycle.js";
import type { URI } from "../../../../../base/common/uri.js";
import { generateUuid } from "../../../../../base/common/uuid.js";
import { FontMeasurements } from "../../../../../editor/browser/config/fontMeasurements.js";
import type { IEditorOptions as ICodeEditorOptions } from "../../../../../editor/common/config/editorOptions.js";
import {
	BareFontInfo,
	type FontInfo,
} from "../../../../../editor/common/config/fontInfo.js";
import { IEditorWorkerService } from "../../../../../editor/common/services/editorWorker.js";
import { ITextModelService } from "../../../../../editor/common/services/resolverService.js";
import { ITextResourceConfigurationService } from "../../../../../editor/common/services/textResourceConfiguration.js";
import * as nls from "../../../../../nls.js";
import { IConfigurationService } from "../../../../../platform/configuration/common/configuration.js";
import { IContextKeyService } from "../../../../../platform/contextkey/common/contextkey.js";
import type { IEditorOptions } from "../../../../../platform/editor/common/editor.js";
import { IInstantiationService } from "../../../../../platform/instantiation/common/instantiation.js";
import {
	registerZIndex,
	ZIndex,
} from "../../../../../platform/layout/browser/zIndexRegistry.js";
import { IStorageService } from "../../../../../platform/storage/common/storage.js";
import { ITelemetryService } from "../../../../../platform/telemetry/common/telemetry.js";
import {
	diffDiagonalFill,
	editorBackground,
	focusBorder,
	foreground,
} from "../../../../../platform/theme/common/colorRegistry.js";
import {
	IThemeService,
	registerThemingParticipant,
} from "../../../../../platform/theme/common/themeService.js";
import { EditorPane } from "../../../../browser/parts/editor/editorPane.js";
import {
	EditorPaneSelectionChangeReason,
	EditorPaneSelectionCompareResult,
	type IEditorOpenContext,
	type IEditorPaneScrollPosition,
	type IEditorPaneSelection,
	type IEditorPaneSelectionChangeEvent,
	type IEditorPaneWithScrolling,
	type IEditorPaneWithSelection,
} from "../../../../common/editor.js";
import type { IEditorGroup } from "../../../../services/editor/common/editorGroupsService.js";
import {
	CellUri,
	NOTEBOOK_DIFF_EDITOR_ID,
	NotebookSetting,
	type INotebookDiffEditorModel,
} from "../../common/notebookCommon.js";
import type { NotebookDiffEditorInput } from "../../common/notebookDiffEditorInput.js";
import {
	cellIndexesToRanges,
	cellRangesToIndexes,
} from "../../common/notebookRange.js";
import { INotebookService } from "../../common/notebookService.js";
import { INotebookEditorWorkerService } from "../../common/services/notebookWorkerService.js";
import type {
	CellEditState,
	ICellOutputViewModel,
	IDisplayOutputLayoutUpdateRequest,
	IGenericCellViewModel,
	IInsetRenderOutput,
	INotebookEditorCreationOptions,
	INotebookEditorOptions,
} from "../notebookBrowser.js";
import { getDefaultNotebookCreationOptions } from "../notebookEditorWidget.js";
import { NotebookOptions } from "../notebookOptions.js";
import type { NotebookLayoutInfo } from "../notebookViewEvents.js";
import {
	BackLayerWebView,
	type INotebookDelegateForWebview,
} from "../view/renderers/backLayerWebView.js";
import {
	SideBySideDiffElementViewModel,
	type DiffElementCellViewModelBase,
	type IDiffElementViewModelBase,
} from "./diffElementViewModel.js";
import type { DiffNestedCellViewModel } from "./diffNestedCellViewModel.js";
import {
	NotebookDiffEditorEventDispatcher,
	NotebookDiffLayoutChangedEvent,
} from "./eventDispatcher.js";
import {
	DIFF_CELL_MARGIN,
	DiffSide,
	type IDiffCellInfo,
	type INotebookDiffViewModel,
	type INotebookTextDiffEditor,
} from "./notebookDiffEditorBrowser.js";
import {
	CellDiffPlaceholderRenderer,
	CellDiffSideBySideRenderer,
	CellDiffSingleSideRenderer,
	NotebookCellTextDiffListDelegate,
	NotebookTextDiffList,
} from "./notebookDiffList.js";
import { NotebookDiffOverviewRuler } from "./notebookDiffOverviewRuler.js";
import { NotebookDiffViewModel } from "./notebookDiffViewModel.js";
import { UnchangedEditorRegionsService } from "./unchangedEditorRegions.js";

const $ = DOM.$;

class NotebookDiffEditorSelection implements IEditorPaneSelection {
	constructor(private readonly selections: number[]) {}

	compare(other: IEditorPaneSelection): EditorPaneSelectionCompareResult {
		if (!(other instanceof NotebookDiffEditorSelection)) {
			return EditorPaneSelectionCompareResult.DIFFERENT;
		}

		if (this.selections.length !== other.selections.length) {
			return EditorPaneSelectionCompareResult.DIFFERENT;
		}

		for (let i = 0; i < this.selections.length; i++) {
			if (this.selections[i] !== other.selections[i]) {
				return EditorPaneSelectionCompareResult.DIFFERENT;
			}
		}

		return EditorPaneSelectionCompareResult.IDENTICAL;
	}

	restore(options: IEditorOptions): INotebookEditorOptions {
		const notebookOptions: INotebookEditorOptions = {
			cellSelections: cellIndexesToRanges(this.selections),
		};

		Object.assign(notebookOptions, options);
		return notebookOptions;
	}
}

export class NotebookTextDiffEditor
	extends EditorPane
	implements
		INotebookTextDiffEditor,
		INotebookDelegateForWebview,
		IEditorPaneWithSelection,
		IEditorPaneWithScrolling
{
	public static readonly ENTIRE_DIFF_OVERVIEW_WIDTH = 30;
	creationOptions: INotebookEditorCreationOptions =
		getDefaultNotebookCreationOptions();
	static readonly ID: string = NOTEBOOK_DIFF_EDITOR_ID;

	private _rootElement!: HTMLElement;
	private _listViewContainer!: HTMLElement;
	private _overflowContainer!: HTMLElement;
	private _overviewRulerContainer!: HTMLElement;
	private _overviewRuler!: NotebookDiffOverviewRuler;
	private _dimension: DOM.Dimension | null = null;
	private notebookDiffViewModel?: INotebookDiffViewModel;
	private _list!: NotebookTextDiffList;
	private _modifiedWebview: BackLayerWebView<IDiffCellInfo> | null = null;
	private _originalWebview: BackLayerWebView<IDiffCellInfo> | null = null;
	private _webviewTransparentCover: HTMLElement | null = null;
	private _fontInfo: FontInfo | undefined;

	private readonly _onMouseUp = this._register(
		new Emitter<{
			readonly event: MouseEvent;
			readonly target: IDiffElementViewModelBase;
		}>(),
	);
	public readonly onMouseUp = this._onMouseUp.event;
	private readonly _onDidScroll = this._register(new Emitter<void>());
	readonly onDidScroll: Event<void> = this._onDidScroll.event;
	readonly onDidChangeScroll: Event<void> = this._onDidScroll.event;
	private _eventDispatcher: NotebookDiffEditorEventDispatcher | undefined;
	protected _scopeContextKeyService!: IContextKeyService;
	private _model: INotebookDiffEditorModel | null = null;
	private readonly _modifiedResourceDisposableStore = this._register(
		new DisposableStore(),
	);

	get textModel() {
		return this._model?.modified.notebook;
	}

	private _revealFirst: boolean;
	private readonly _insetModifyQueueByOutputId = new SequencerByKey<string>();

	protected _onDidDynamicOutputRendered = this._register(
		new Emitter<{
			cell: IGenericCellViewModel;
			output: ICellOutputViewModel;
		}>(),
	);
	onDidDynamicOutputRendered = this._onDidDynamicOutputRendered.event;

	private _notebookOptions: NotebookOptions;

	get notebookOptions() {
		return this._notebookOptions;
	}

	private readonly _localStore = this._register(new DisposableStore());

	private _layoutCancellationTokenSource?: CancellationTokenSource;

	private readonly _onDidChangeSelection = this._register(
		new Emitter<IEditorPaneSelectionChangeEvent>(),
	);
	readonly onDidChangeSelection = this._onDidChangeSelection.event;

	private _isDisposed = false;

	get isDisposed() {
		return this._isDisposed;
	}

	constructor(
		group: IEditorGroup,
		@IInstantiationService
		private readonly instantiationService: IInstantiationService,
		@IThemeService themeService: IThemeService,
		@IContextKeyService
		private readonly contextKeyService: IContextKeyService,
		@INotebookEditorWorkerService
		private readonly notebookEditorWorkerService: INotebookEditorWorkerService,
		@IConfigurationService
		private readonly configurationService: IConfigurationService,
		@ITelemetryService telemetryService: ITelemetryService,
		@IStorageService storageService: IStorageService,
		@INotebookService private readonly notebookService: INotebookService,
		@IEditorWorkerService
		private readonly editorWorkerService: IEditorWorkerService,
		@ITextModelService
		private readonly textModelResolverService: ITextModelService,
		@ITextResourceConfigurationService
		private readonly textConfigurationService: ITextResourceConfigurationService,
	) {
		super(
			NotebookTextDiffEditor.ID,
			group,
			telemetryService,
			themeService,
			storageService,
		);
		this._notebookOptions = instantiationService.createInstance(
			NotebookOptions,
			this.window,
			false,
			undefined,
		);
		this._register(this._notebookOptions);
		this._revealFirst = true;
	}

	private get fontInfo() {
		if (!this._fontInfo) {
			this._fontInfo = this.createFontInfo();
		}

		return this._fontInfo;
	}

	private createFontInfo() {
		const editorOptions =
			this.configurationService.getValue<ICodeEditorOptions>("editor");
		return FontMeasurements.readFontInfo(
			this.window,
			BareFontInfo.createFromRawSettings(
				editorOptions,
				PixelRatio.getInstance(this.window).value,
			),
		);
	}

	private isOverviewRulerEnabled(): boolean {
		return (
			this.configurationService.getValue(
				NotebookSetting.diffOverviewRuler,
			) ?? false
		);
	}

	getSelection(): IEditorPaneSelection | undefined {
		const selections = this._list.getFocus();
		return new NotebookDiffEditorSelection(selections);
	}

	toggleNotebookCellSelection(cell: IGenericCellViewModel) {
		// throw new Error('Method not implemented.');
	}

	updatePerformanceMetadata(
		cellId: string,
		executionId: string,
		duration: number,
		rendererId: string,
	): void {
		// throw new Error('Method not implemented.');
	}

	async focusNotebookCell(
		cell: IGenericCellViewModel,
		focus: "output" | "editor" | "container",
	): Promise<void> {
		// throw new Error('Method not implemented.');
	}

	async focusNextNotebookCell(
		cell: IGenericCellViewModel,
		focus: "output" | "editor" | "container",
	): Promise<void> {
		// throw new Error('Method not implemented.');
	}

	didFocusOutputInputChange(inputFocused: boolean): void {
		// noop
	}

	getScrollTop() {
		return this._list?.scrollTop ?? 0;
	}

	getScrollHeight() {
		return this._list?.scrollHeight ?? 0;
	}

	getScrollPosition(): IEditorPaneScrollPosition {
		return {
			scrollTop: this.getScrollTop(),
			scrollLeft: this._list?.scrollLeft ?? 0,
		};
	}

	setScrollPosition(scrollPosition: IEditorPaneScrollPosition): void {
		if (!this._list) {
			return;
		}

		this._list.scrollTop = scrollPosition.scrollTop;
		if (scrollPosition.scrollLeft !== undefined) {
			this._list.scrollLeft = scrollPosition.scrollLeft;
		}
	}

	delegateVerticalScrollbarPointerDown(browserEvent: PointerEvent) {
		this._list?.delegateVerticalScrollbarPointerDown(browserEvent);
	}

	updateOutputHeight(
		cellInfo: IDiffCellInfo,
		output: ICellOutputViewModel,
		outputHeight: number,
		isInit: boolean,
	): void {
		const diffElement = cellInfo.diffElement;
		const cell = this.getCellByInfo(cellInfo);
		const outputIndex = cell.outputsViewModels.indexOf(output);

		if (diffElement instanceof SideBySideDiffElementViewModel) {
			const info = CellUri.parse(cellInfo.cellUri);
			if (!info) {
				return;
			}

			diffElement.updateOutputHeight(
				info.notebook.toString() ===
					this._model?.original.resource.toString()
					? DiffSide.Original
					: DiffSide.Modified,
				outputIndex,
				outputHeight,
			);
		} else {
			diffElement.updateOutputHeight(
				diffElement.type === "insert"
					? DiffSide.Modified
					: DiffSide.Original,
				outputIndex,
				outputHeight,
			);
		}

		if (isInit) {
			this._onDidDynamicOutputRendered.fire({ cell, output });
		}
	}

	setMarkupCellEditState(cellId: string, editState: CellEditState): void {
		// throw new Error('Method not implemented.');
	}
	didStartDragMarkupCell(
		cellId: string,
		event: { dragOffsetY: number },
	): void {
		// throw new Error('Method not implemented.');
	}
	didDragMarkupCell(cellId: string, event: { dragOffsetY: number }): void {
		// throw new Error('Method not implemented.');
	}
	didEndDragMarkupCell(cellId: string): void {
		// throw new Error('Method not implemented.');
	}
	didDropMarkupCell(cellId: string) {
		// throw new Error('Method not implemented.');
	}
	didResizeOutput(cellId: string): void {
		// throw new Error('Method not implemented.');
	}

	protected createEditor(parent: HTMLElement): void {
		this._rootElement = DOM.append(
			parent,
			DOM.$(".notebook-text-diff-editor"),
		);
		this._overflowContainer = document.createElement("div");
		this._overflowContainer.classList.add(
			"notebook-overflow-widget-container",
			"monaco-editor",
		);
		DOM.append(parent, this._overflowContainer);

		const renderers = [
			this.instantiationService.createInstance(
				CellDiffSingleSideRenderer,
				this,
			),
			this.instantiationService.createInstance(
				CellDiffSideBySideRenderer,
				this,
			),
			this.instantiationService.createInstance(
				CellDiffPlaceholderRenderer,
				this,
			),
		];

		this._listViewContainer = DOM.append(
			this._rootElement,
			DOM.$(".notebook-diff-list-view"),
		);

		this._list = this.instantiationService.createInstance(
			NotebookTextDiffList,
			"NotebookTextDiff",
			this._listViewContainer,
			this.instantiationService.createInstance(
				NotebookCellTextDiffListDelegate,
				this.window,
			),
			renderers,
			this.contextKeyService,
			{
				setRowLineHeight: false,
				setRowHeight: false,
				supportDynamicHeights: true,
				horizontalScrolling: false,
				keyboardSupport: false,
				mouseSupport: true,
				multipleSelectionSupport: false,
				typeNavigationEnabled: true,
				paddingBottom: 0,
				// transformOptimization: (isMacintosh && isNative) || getTitleBarStyle(this.configurationService, this.environmentService) === 'native',
				styleController: (_suffix: string) => {
					return this._list;
				},
				overrideStyles: {
					listBackground: editorBackground,
					listActiveSelectionBackground: editorBackground,
					listActiveSelectionForeground: foreground,
					listFocusAndSelectionBackground: editorBackground,
					listFocusAndSelectionForeground: foreground,
					listFocusBackground: editorBackground,
					listFocusForeground: foreground,
					listHoverForeground: foreground,
					listHoverBackground: editorBackground,
					listHoverOutline: focusBorder,
					listFocusOutline: focusBorder,
					listInactiveSelectionBackground: editorBackground,
					listInactiveSelectionForeground: foreground,
					listInactiveFocusBackground: editorBackground,
					listInactiveFocusOutline: editorBackground,
				},
				accessibilityProvider: {
					getAriaLabel() {
						return null;
					},
					getWidgetAriaLabel() {
						return nls.localize(
							"notebookTreeAriaLabel",
							"Notebook Text Diff",
						);
					},
				},
				// focusNextPreviousDelegate: {
				// 	onFocusNext: (applyFocusNext: () => void) => this._updateForCursorNavigationMode(applyFocusNext),
				// 	onFocusPrevious: (applyFocusPrevious: () => void) => this._updateForCursorNavigationMode(applyFocusPrevious),
				// }
			},
		);

		this._register(this._list);
		this._register(
			this._list.onMouseUp((e) => {
				if (e.element) {
					if (typeof e.index === "number") {
						this._list.setFocus([e.index]);
					}
					this._onMouseUp.fire({
						event: e.browserEvent,
						target: e.element,
					});
				}
			}),
		);

		this._register(
			this._list.onDidScroll(() => {
				this._onDidScroll.fire();
			}),
		);

		this._register(
			this._list.onDidChangeFocus(() =>
				this._onDidChangeSelection.fire({
					reason: EditorPaneSelectionChangeReason.USER,
				}),
			),
		);

		this._overviewRulerContainer = document.createElement("div");
		this._overviewRulerContainer.classList.add(
			"notebook-overview-ruler-container",
		);
		this._rootElement.appendChild(this._overviewRulerContainer);
		this._registerOverviewRuler();

		// transparent cover
		this._webviewTransparentCover = DOM.append(
			this._list.rowsContainer,
			$(".webview-cover"),
		);
		this._webviewTransparentCover.style.display = "none";

		this._register(
			DOM.addStandardDisposableGenericMouseDownListener(
				this._overflowContainer,
				(e: StandardMouseEvent) => {
					if (
						e.target.classList.contains("slider") &&
						this._webviewTransparentCover
					) {
						this._webviewTransparentCover.style.display = "block";
					}
				},
			),
		);

		this._register(
			DOM.addStandardDisposableGenericMouseUpListener(
				this._overflowContainer,
				() => {
					if (this._webviewTransparentCover) {
						// no matter when
						this._webviewTransparentCover.style.display = "none";
					}
				},
			),
		);

		this._register(
			this._list.onDidScroll((e) => {
				this._webviewTransparentCover!.style.top = `${e.scrollTop}px`;
			}),
		);
	}

	private _registerOverviewRuler() {
		this._overviewRuler = this._register(
			this.instantiationService.createInstance(
				NotebookDiffOverviewRuler,
				this,
				NotebookTextDiffEditor.ENTIRE_DIFF_OVERVIEW_WIDTH,
				this._overviewRulerContainer,
			),
		);
	}

	private _updateOutputsOffsetsInWebview(
		scrollTop: number,
		scrollHeight: number,
		activeWebview: BackLayerWebView<IDiffCellInfo>,
		getActiveNestedCell: (
			diffElement: DiffElementCellViewModelBase,
		) => DiffNestedCellViewModel | undefined,
		diffSide: DiffSide,
	) {
		activeWebview.element.style.height = `${scrollHeight}px`;

		if (activeWebview.insetMapping) {
			const updateItems: IDisplayOutputLayoutUpdateRequest[] = [];
			const removedItems: ICellOutputViewModel[] = [];
			activeWebview.insetMapping.forEach((value, key) => {
				const cell = getActiveNestedCell(value.cellInfo.diffElement);
				if (!cell) {
					return;
				}

				const viewIndex = this._list.indexOf(
					value.cellInfo.diffElement,
				);

				if (viewIndex === undefined) {
					return;
				}

				if (cell.outputsViewModels.indexOf(key) < 0) {
					// output is already gone
					removedItems.push(key);
				} else {
					const cellTop = this._list.getCellViewScrollTop(
						value.cellInfo.diffElement,
					);
					const outputIndex = cell.outputsViewModels.indexOf(key);
					const outputOffset =
						value.cellInfo.diffElement.getOutputOffsetInCell(
							diffSide,
							outputIndex,
						);
					updateItems.push({
						cell,
						output: key,
						cellTop: cellTop,
						outputOffset: outputOffset,
						forceDisplay: false,
					});
				}
			});

			activeWebview.removeInsets(removedItems);

			if (updateItems.length) {
				activeWebview.updateScrollTops(updateItems, []);
			}
		}
	}

	override async setInput(
		input: NotebookDiffEditorInput,
		options: INotebookEditorOptions | undefined,
		context: IEditorOpenContext,
		token: CancellationToken,
	): Promise<void> {
		await super.setInput(input, options, context, token);

		const model = await input.resolve();
		if (this._model !== model) {
			this._detachModel();
			this._model = model;
			this._attachModel();
		}

		this._model = model;
		if (this._model === null) {
			return;
		}

		this._revealFirst = true;

		this._modifiedResourceDisposableStore.clear();

		this._layoutCancellationTokenSource = new CancellationTokenSource();

		this._modifiedResourceDisposableStore.add(
			Event.any(
				this._model.original.notebook.onDidChangeContent,
				this._model.modified.notebook.onDidChangeContent,
			)((e) => {
				if (this._model !== null) {
					this._layoutCancellationTokenSource?.dispose();
					this._layoutCancellationTokenSource =
						new CancellationTokenSource();
					this.updateLayout(
						this._layoutCancellationTokenSource.token,
					);
				}
			}),
		);

		await this._createOriginalWebview(
			generateUuid(),
			this._model.original.viewType,
			this._model.original.resource,
		);
		if (this._originalWebview) {
			this._modifiedResourceDisposableStore.add(this._originalWebview);
		}
		await this._createModifiedWebview(
			generateUuid(),
			this._model.modified.viewType,
			this._model.modified.resource,
		);
		if (this._modifiedWebview) {
			this._modifiedResourceDisposableStore.add(this._modifiedWebview);
		}

		await this.updateLayout(
			this._layoutCancellationTokenSource.token,
			options?.cellSelections
				? cellRangesToIndexes(options.cellSelections)
				: undefined,
		);
	}

	private _detachModel() {
		this._localStore.clear();
		this._originalWebview?.dispose();
		this._originalWebview?.element.remove();
		this._originalWebview = null;
		this._modifiedWebview?.dispose();
		this._modifiedWebview?.element.remove();
		this._modifiedWebview = null;

		this.notebookDiffViewModel?.dispose();
		this.notebookDiffViewModel = undefined;

		this._modifiedResourceDisposableStore.clear();
		this._list.clear();
	}
	private _attachModel() {
		this._eventDispatcher = new NotebookDiffEditorEventDispatcher();
		const updateInsets = () => {
			DOM.scheduleAtNextAnimationFrame(this.window, () => {
				if (this._isDisposed) {
					return;
				}

				if (this._modifiedWebview) {
					this._updateOutputsOffsetsInWebview(
						this._list.scrollTop,
						this._list.scrollHeight,
						this._modifiedWebview,
						(diffElement: DiffElementCellViewModelBase) => {
							return diffElement.modified;
						},
						DiffSide.Modified,
					);
				}

				if (this._originalWebview) {
					this._updateOutputsOffsetsInWebview(
						this._list.scrollTop,
						this._list.scrollHeight,
						this._originalWebview,
						(diffElement: DiffElementCellViewModelBase) => {
							return diffElement.original;
						},
						DiffSide.Original,
					);
				}
			});
		};

		this._localStore.add(
			this._list.onDidChangeContentHeight(() => {
				updateInsets();
			}),
		);

		this._localStore.add(
			this._eventDispatcher.onDidChangeCellLayout(() => {
				updateInsets();
			}),
		);

		if (this._model) {
			const unchangedEditorRegions = this._localStore.add(
				new UnchangedEditorRegionsService(
					this.configurationService,
					this.editorWorkerService,
					this.textModelResolverService,
					this.textConfigurationService,
					this.fontInfo.lineHeight,
				),
			);
			const vm = (this.notebookDiffViewModel = this._register(
				new NotebookDiffViewModel(
					this._model,
					this.notebookEditorWorkerService,
					this.configurationService,
					this._eventDispatcher!,
					this.notebookService,
					unchangedEditorRegions,
					this.fontInfo,
					undefined,
				),
			));
			this._localStore.add(
				this.notebookDiffViewModel.onDidChangeItems((e) => {
					this._list.splice(e.start, e.deleteCount, e.elements);
					if (this.isOverviewRulerEnabled()) {
						this._overviewRuler.updateViewModels(
							vm.items,
							this._eventDispatcher,
						);
					}
				}),
			);
		}
	}

	private async _createModifiedWebview(
		id: string,
		viewType: string,
		resource: URI,
	): Promise<void> {
		this._modifiedWebview?.dispose();

		this._modifiedWebview = this.instantiationService.createInstance(
			BackLayerWebView,
			this,
			id,
			viewType,
			resource,
			{
				...this._notebookOptions.computeDiffWebviewOptions(),
				fontFamily: this._generateFontFamily(),
			},
			undefined,
		) as BackLayerWebView<IDiffCellInfo>;
		// attach the webview container to the DOM tree first
		this._list.rowsContainer.insertAdjacentElement(
			"afterbegin",
			this._modifiedWebview.element,
		);
		this._modifiedWebview.createWebview(this.window);
		this._modifiedWebview.element.style.width = `calc(50% - 16px)`;
		this._modifiedWebview.element.style.left = `calc(50%)`;
	}
	_generateFontFamily(): string {
		return (
			this.fontInfo.fontFamily ??
			`"SF Mono", Monaco, Menlo, Consolas, "Ubuntu Mono", "Liberation Mono", "DejaVu Sans Mono", "Courier New", monospace`
		);
	}

	private async _createOriginalWebview(
		id: string,
		viewType: string,
		resource: URI,
	): Promise<void> {
		this._originalWebview?.dispose();

		this._originalWebview = this.instantiationService.createInstance(
			BackLayerWebView,
			this,
			id,
			viewType,
			resource,
			{
				...this._notebookOptions.computeDiffWebviewOptions(),
				fontFamily: this._generateFontFamily(),
			},
			undefined,
		) as BackLayerWebView<IDiffCellInfo>;
		// attach the webview container to the DOM tree first
		this._list.rowsContainer.insertAdjacentElement(
			"afterbegin",
			this._originalWebview.element,
		);
		this._originalWebview.createWebview(this.window);
		this._originalWebview.element.style.width = `calc(50% - 16px)`;
		this._originalWebview.element.style.left = `16px`;
	}

	override setOptions(options: INotebookEditorOptions | undefined): void {
		const selections = options?.cellSelections
			? cellRangesToIndexes(options.cellSelections)
			: undefined;
		if (selections) {
			this._list.setFocus(selections);
		}
	}

	async updateLayout(token: CancellationToken, selections?: number[]) {
		if (!this._model || !this.notebookDiffViewModel) {
			return;
		}

		const diffResult = await this.notebookDiffViewModel.computeDiff(token);
		if (token.isCancellationRequested) {
			// after await the editor might be disposed.
			return;
		}

		if (diffResult) {
			this._originalWebview?.removeInsets([
				...this._originalWebview?.insetMapping.keys(),
			]);
			this._modifiedWebview?.removeInsets([
				...this._modifiedWebview?.insetMapping.keys(),
			]);

			if (
				this._revealFirst &&
				diffResult.firstChangeIndex !== -1 &&
				diffResult.firstChangeIndex < this._list.length
			) {
				this._revealFirst = false;
				this._list.setFocus([diffResult.firstChangeIndex]);
				this._list.reveal(diffResult.firstChangeIndex, 0.3);
			}
		}

		if (selections) {
			this._list.setFocus(selections);
		}
	}

	scheduleOutputHeightAck(
		cellInfo: IDiffCellInfo,
		outputId: string,
		height: number,
	) {
		const diffElement = cellInfo.diffElement;
		// const activeWebview = diffSide === DiffSide.Modified ? this._modifiedWebview : this._originalWebview;
		let diffSide = DiffSide.Original;

		if (diffElement instanceof SideBySideDiffElementViewModel) {
			const info = CellUri.parse(cellInfo.cellUri);
			if (!info) {
				return;
			}

			diffSide =
				info.notebook.toString() ===
				this._model?.original.resource.toString()
					? DiffSide.Original
					: DiffSide.Modified;
		} else {
			diffSide =
				diffElement.type === "insert"
					? DiffSide.Modified
					: DiffSide.Original;
		}

		const webview =
			diffSide === DiffSide.Modified
				? this._modifiedWebview
				: this._originalWebview;

		DOM.scheduleAtNextAnimationFrame(
			this.window,
			() => {
				webview?.ackHeight([
					{ cellId: cellInfo.cellId, outputId, height },
				]);
			},
			10,
		);
	}

	private pendingLayouts = new WeakMap<
		IDiffElementViewModelBase,
		IDisposable
	>();

	layoutNotebookCell(cell: IDiffElementViewModelBase, height: number) {
		const relayout = (cell: IDiffElementViewModelBase, height: number) => {
			this._list.updateElementHeight2(cell, height);
		};

		if (this.pendingLayouts.has(cell)) {
			this.pendingLayouts.get(cell)!.dispose();
		}

		let r: () => void;
		const layoutDisposable = DOM.scheduleAtNextAnimationFrame(
			this.window,
			() => {
				this.pendingLayouts.delete(cell);

				relayout(cell, height);
				r();
			},
		);

		this.pendingLayouts.set(
			cell,
			toDisposable(() => {
				layoutDisposable.dispose();
				r();
			}),
		);

		return new Promise<void>((resolve) => {
			r = resolve;
		});
	}

	setScrollTop(scrollTop: number): void {
		this._list.scrollTop = scrollTop;
	}

	triggerScroll(event: IMouseWheelEvent) {
		this._list.triggerScrollFromMouseWheelEvent(event);
	}

	previousChange(): void {
		if (!this.notebookDiffViewModel) {
			return;
		}
		let currFocus = this._list.getFocus()[0];

		if (isNaN(currFocus) || currFocus < 0) {
			currFocus = 0;
		}

		// find the index of previous change
		let prevChangeIndex = currFocus - 1;
		const currentViewModels = this.notebookDiffViewModel.items;
		while (prevChangeIndex >= 0) {
			const vm = currentViewModels[prevChangeIndex];
			if (vm.type !== "unchanged" && vm.type !== "placeholder") {
				break;
			}

			prevChangeIndex--;
		}

		if (prevChangeIndex >= 0) {
			this._list.setFocus([prevChangeIndex]);
			this._list.reveal(prevChangeIndex);
		} else {
			// go to the last one
			const index = findLastIdx(
				currentViewModels,
				(vm) => vm.type !== "unchanged" && vm.type !== "placeholder",
			);
			if (index >= 0) {
				this._list.setFocus([index]);
				this._list.reveal(index);
			}
		}
	}

	nextChange(): void {
		if (!this.notebookDiffViewModel) {
			return;
		}
		let currFocus = this._list.getFocus()[0];

		if (isNaN(currFocus) || currFocus < 0) {
			currFocus = 0;
		}

		// find the index of next change
		let nextChangeIndex = currFocus + 1;
		const currentViewModels = this.notebookDiffViewModel.items;
		while (nextChangeIndex < currentViewModels.length) {
			const vm = currentViewModels[nextChangeIndex];
			if (vm.type !== "unchanged" && vm.type !== "placeholder") {
				break;
			}

			nextChangeIndex++;
		}

		if (nextChangeIndex < currentViewModels.length) {
			this._list.setFocus([nextChangeIndex]);
			this._list.reveal(nextChangeIndex);
		} else {
			// go to the first one
			const index = currentViewModels.findIndex(
				(vm) => vm.type !== "unchanged" && vm.type !== "placeholder",
			);
			if (index >= 0) {
				this._list.setFocus([index]);
				this._list.reveal(index);
			}
		}
	}

	createOutput(
		cellDiffViewModel: DiffElementCellViewModelBase,
		cellViewModel: DiffNestedCellViewModel,
		output: IInsetRenderOutput,
		getOffset: () => number,
		diffSide: DiffSide,
	): void {
		this._insetModifyQueueByOutputId.queue(
			output.source.model.outputId +
				(diffSide === DiffSide.Modified ? "-right" : "left"),
			async () => {
				const activeWebview =
					diffSide === DiffSide.Modified
						? this._modifiedWebview
						: this._originalWebview;
				if (!activeWebview) {
					return;
				}

				if (activeWebview.insetMapping.has(output.source)) {
					const cellTop =
						this._list.getCellViewScrollTop(cellDiffViewModel);
					const outputIndex = cellViewModel.outputsViewModels.indexOf(
						output.source,
					);
					const outputOffset =
						cellDiffViewModel.getOutputOffsetInCell(
							diffSide,
							outputIndex,
						);
					activeWebview.updateScrollTops(
						[
							{
								cell: cellViewModel,
								output: output.source,
								cellTop,
								outputOffset,
								forceDisplay: true,
							},
						],
						[],
					);
				} else {
					const cellTop =
						this._list.getCellViewScrollTop(cellDiffViewModel);
					await activeWebview.createOutput(
						{
							diffElement: cellDiffViewModel,
							cellHandle: cellViewModel.handle,
							cellId: cellViewModel.id,
							cellUri: cellViewModel.uri,
						},
						output,
						cellTop,
						getOffset(),
					);
				}
			},
		);
	}

	updateMarkupCellHeight() {
		// TODO
	}

	getCellByInfo(cellInfo: IDiffCellInfo): IGenericCellViewModel {
		return cellInfo.diffElement.getCellByUri(cellInfo.cellUri);
	}

	getCellById(cellId: string): IGenericCellViewModel | undefined {
		throw new Error("Not implemented");
	}

	removeInset(
		cellDiffViewModel: DiffElementCellViewModelBase,
		cellViewModel: DiffNestedCellViewModel,
		displayOutput: ICellOutputViewModel,
		diffSide: DiffSide,
	) {
		this._insetModifyQueueByOutputId.queue(
			displayOutput.model.outputId +
				(diffSide === DiffSide.Modified ? "-right" : "left"),
			async () => {
				const activeWebview =
					diffSide === DiffSide.Modified
						? this._modifiedWebview
						: this._originalWebview;
				if (!activeWebview) {
					return;
				}

				if (!activeWebview.insetMapping.has(displayOutput)) {
					return;
				}

				activeWebview.removeInsets([displayOutput]);
			},
		);
	}

	showInset(
		cellDiffViewModel: DiffElementCellViewModelBase,
		cellViewModel: DiffNestedCellViewModel,
		displayOutput: ICellOutputViewModel,
		diffSide: DiffSide,
	) {
		this._insetModifyQueueByOutputId.queue(
			displayOutput.model.outputId +
				(diffSide === DiffSide.Modified ? "-right" : "left"),
			async () => {
				const activeWebview =
					diffSide === DiffSide.Modified
						? this._modifiedWebview
						: this._originalWebview;
				if (!activeWebview) {
					return;
				}

				if (!activeWebview.insetMapping.has(displayOutput)) {
					return;
				}

				const cellTop =
					this._list.getCellViewScrollTop(cellDiffViewModel);
				const outputIndex =
					cellViewModel.outputsViewModels.indexOf(displayOutput);
				const outputOffset = cellDiffViewModel.getOutputOffsetInCell(
					diffSide,
					outputIndex,
				);
				activeWebview.updateScrollTops(
					[
						{
							cell: cellViewModel,
							output: displayOutput,
							cellTop,
							outputOffset,
							forceDisplay: true,
						},
					],
					[],
				);
			},
		);
	}

	hideInset(
		cellDiffViewModel: DiffElementCellViewModelBase,
		cellViewModel: DiffNestedCellViewModel,
		output: ICellOutputViewModel,
	) {
		this._modifiedWebview?.hideInset(output);
		this._originalWebview?.hideInset(output);
	}

	// private async _resolveWebview(rightEditor: boolean): Promise<BackLayerWebView | null> {
	// 	if (rightEditor) {

	// 	}
	// }

	getDomNode() {
		return this._rootElement;
	}

	getOverflowContainerDomNode(): HTMLElement {
		return this._overflowContainer;
	}

	override getControl(): INotebookTextDiffEditor | undefined {
		return this;
	}

	override clearInput(): void {
		super.clearInput();

		this._modifiedResourceDisposableStore.clear();
		this._list?.splice(0, this._list?.length || 0);
		this._model = null;
		this.notebookDiffViewModel?.dispose();
		this.notebookDiffViewModel = undefined;
	}

	deltaCellOutputContainerClassNames(
		diffSide: DiffSide,
		cellId: string,
		added: string[],
		removed: string[],
	) {
		if (diffSide === DiffSide.Original) {
			this._originalWebview?.deltaCellContainerClassNames(
				cellId,
				added,
				removed,
			);
		} else {
			this._modifiedWebview?.deltaCellContainerClassNames(
				cellId,
				added,
				removed,
			);
		}
	}

	getLayoutInfo(): NotebookLayoutInfo {
		if (!this._list) {
			throw new Error("Editor is not initalized successfully");
		}

		return {
			width: this._dimension!.width,
			height: this._dimension!.height,
			fontInfo: this.fontInfo,
			scrollHeight: this._list?.getScrollHeight() ?? 0,
			stickyHeight: 0,
		};
	}

	layout(dimension: DOM.Dimension, _position: DOM.IDomPosition): void {
		this._rootElement.classList.toggle(
			"mid-width",
			dimension.width < 1000 && dimension.width >= 600,
		);
		this._rootElement.classList.toggle(
			"narrow-width",
			dimension.width < 600,
		);
		const overviewRulerEnabled = this.isOverviewRulerEnabled();
		this._dimension = dimension.with(
			dimension.width -
				(overviewRulerEnabled
					? NotebookTextDiffEditor.ENTIRE_DIFF_OVERVIEW_WIDTH
					: 0),
		);

		this._listViewContainer.style.height = `${dimension.height}px`;
		this._listViewContainer.style.width = `${this._dimension.width}px`;

		this._list?.layout(this._dimension.height, this._dimension.width);

		if (this._modifiedWebview) {
			this._modifiedWebview.element.style.width = `calc(50% - 16px)`;
			this._modifiedWebview.element.style.left = `calc(50%)`;
		}

		if (this._originalWebview) {
			this._originalWebview.element.style.width = `calc(50% - 16px)`;
			this._originalWebview.element.style.left = `16px`;
		}

		if (this._webviewTransparentCover) {
			this._webviewTransparentCover.style.height = `${this._dimension.height}px`;
			this._webviewTransparentCover.style.width = `${this._dimension.width}px`;
		}

		if (overviewRulerEnabled) {
			this._overviewRuler.layout();
		}

		this._eventDispatcher?.emit([
			new NotebookDiffLayoutChangedEvent(
				{ width: true, fontInfo: true },
				this.getLayoutInfo(),
			),
		]);
	}

	override dispose() {
		this._isDisposed = true;
		this._layoutCancellationTokenSource?.dispose();
		this._detachModel();
		super.dispose();
	}
}

registerZIndex(ZIndex.Base, 10, "notebook-diff-view-viewport-slider");

registerThemingParticipant((theme, collector) => {
	const diffDiagonalFillColor = theme.getColor(diffDiagonalFill);
	collector.addRule(`
	.notebook-text-diff-editor .diagonal-fill {
		background-image: linear-gradient(
			-45deg,
			${diffDiagonalFillColor} 12.5%,
			#0000 12.5%, #0000 50%,
			${diffDiagonalFillColor} 50%, ${diffDiagonalFillColor} 62.5%,
			#0000 62.5%, #0000 100%
		);
		background-size: 8px 8px;
	}
	`);

	collector.addRule(
		`.notebook-text-diff-editor .cell-body { margin: ${DIFF_CELL_MARGIN}px; }`,
	);
	// We do not want a left margin, as we add an overlay for expanind the collapsed/hidden cells.
	collector.addRule(
		`.notebook-text-diff-editor .cell-placeholder-body { margin: ${DIFF_CELL_MARGIN}px 0; }`,
	);
});
