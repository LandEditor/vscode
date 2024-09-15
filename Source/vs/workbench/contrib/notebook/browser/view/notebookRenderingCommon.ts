/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { FastDomNode } from "../../../../../base/browser/fastDomNode.js";
import type { IMouseWheelEvent } from "../../../../../base/browser/mouseEvent.js";
import type {
	IListContextMenuEvent,
	IListEvent,
	IListMouseEvent,
} from "../../../../../base/browser/ui/list/list.js";
import type { IListStyles } from "../../../../../base/browser/ui/list/listWidget.js";
import type { Event } from "../../../../../base/common/event.js";
import type { DisposableStore } from "../../../../../base/common/lifecycle.js";
import type { ScrollEvent } from "../../../../../base/common/scrollable.js";
import type { ICodeEditor } from "../../../../../editor/browser/editorBrowser.js";
import type { Range } from "../../../../../editor/common/core/range.js";
import type { Selection } from "../../../../../editor/common/core/selection.js";
import type { IContextKeyService } from "../../../../../platform/contextkey/common/contextkey.js";
import type { IInstantiationService } from "../../../../../platform/instantiation/common/instantiation.js";
import type { IWorkbenchListOptionsUpdate } from "../../../../../platform/list/browser/listService.js";
import type { ICellRange } from "../../common/notebookRange.js";
import type {
	CellRevealRangeType,
	CellRevealType,
	ICellOutputViewModel,
	ICellViewModel,
	INotebookViewZoneChangeAccessor,
} from "../notebookBrowser.js";
import type {
	CellViewModel,
	NotebookViewModel,
} from "../viewModel/notebookViewModelImpl.js";
import type { CellPartsCollection } from "./cellPart.js";

export interface INotebookCellList extends ICoordinatesConverter {
	isDisposed: boolean;
	inRenderingTransaction: boolean;
	viewModel: NotebookViewModel | null;
	webviewElement: FastDomNode<HTMLElement> | null;
	readonly contextKeyService: IContextKeyService;
	element(index: number): ICellViewModel | undefined;
	elementAt(position: number): ICellViewModel | undefined;
	elementHeight(element: ICellViewModel): number;
	onWillScroll: Event<ScrollEvent>;
	onDidScroll: Event<ScrollEvent>;
	onDidChangeFocus: Event<IListEvent<ICellViewModel>>;
	onDidChangeContentHeight: Event<number>;
	onDidChangeVisibleRanges: Event<void>;
	visibleRanges: ICellRange[];
	scrollTop: number;
	scrollHeight: number;
	scrollLeft: number;
	length: number;
	rowsContainer: HTMLElement;
	scrollableElement: HTMLElement;
	ariaLabel: string;
	readonly onDidRemoveOutputs: Event<readonly ICellOutputViewModel[]>;
	readonly onDidHideOutputs: Event<readonly ICellOutputViewModel[]>;
	readonly onDidRemoveCellsFromView: Event<readonly ICellViewModel[]>;
	readonly onMouseUp: Event<IListMouseEvent<CellViewModel>>;
	readonly onMouseDown: Event<IListMouseEvent<CellViewModel>>;
	readonly onContextMenu: Event<IListContextMenuEvent<CellViewModel>>;
	detachViewModel(): void;
	attachViewModel(viewModel: NotebookViewModel): void;
	attachWebview(element: HTMLElement): void;
	clear(): void;
	focusElement(element: ICellViewModel): void;
	selectElements(elements: ICellViewModel[]): void;
	getFocusedElements(): ICellViewModel[];
	getSelectedElements(): ICellViewModel[];
	scrollToBottom(): void;
	revealCell(cell: ICellViewModel, revealType: CellRevealType): Promise<void>;
	revealCells(range: ICellRange): void;
	revealRangeInCell(
		cell: ICellViewModel,
		range: Selection | Range,
		revealType: CellRevealRangeType,
	): Promise<void>;
	revealCellOffsetInCenter(element: ICellViewModel, offset: number): void;
	revealOffsetInCenterIfOutsideViewport(offset: number): void;
	setHiddenAreas(_ranges: ICellRange[], triggerViewUpdate: boolean): boolean;
	changeViewZones(
		callback: (accessor: INotebookViewZoneChangeAccessor) => void,
	): void;
	domElementOfElement(element: ICellViewModel): HTMLElement | null;
	focusView(): void;
	triggerScrollFromMouseWheelEvent(browserEvent: IMouseWheelEvent): void;
	updateElementHeight2(
		element: ICellViewModel,
		size: number,
		anchorElementIndex?: number | null,
	): void;
	domFocus(): void;
	focusContainer(clearSelection: boolean): void;
	setCellEditorSelection(element: ICellViewModel, range: Range): void;
	style(styles: IListStyles): void;
	getRenderHeight(): number;
	getScrollHeight(): number;
	updateOptions(options: IWorkbenchListOptionsUpdate): void;
	layout(height?: number, width?: number): void;
	dispose(): void;
}

export interface BaseCellRenderTemplate {
	readonly rootContainer: HTMLElement;
	readonly editorPart: HTMLElement;
	readonly cellInputCollapsedContainer: HTMLElement;
	readonly instantiationService: IInstantiationService;
	readonly container: HTMLElement;
	readonly cellContainer: HTMLElement;
	readonly templateDisposables: DisposableStore;
	readonly elementDisposables: DisposableStore;
	currentRenderedCell?: ICellViewModel;
	cellParts: CellPartsCollection;
	toJSON: () => object;
}

export interface MarkdownCellRenderTemplate extends BaseCellRenderTemplate {
	readonly editorContainer: HTMLElement;
	readonly foldingIndicator: HTMLElement;
	currentEditor?: ICodeEditor;
}

export interface CodeCellRenderTemplate extends BaseCellRenderTemplate {
	outputContainer: FastDomNode<HTMLElement>;
	cellOutputCollapsedContainer: HTMLElement;
	outputShowMoreContainer: FastDomNode<HTMLElement>;
	focusSinkElement: HTMLElement;
	editor: ICodeEditor;
}

export interface ICoordinatesConverter {
	getCellViewScrollTop(cell: ICellViewModel): number;
	getCellViewScrollBottom(cell: ICellViewModel): number;
	getViewIndex(cell: ICellViewModel): number | undefined;
	getViewIndex2(modelIndex: number): number | undefined;
	getModelIndex(cell: CellViewModel): number | undefined;
	getModelIndex2(viewIndex: number): number | undefined;
	getVisibleRangesPlusViewportAboveAndBelow(): ICellRange[];
	modelIndexIsVisible(modelIndex: number): boolean;
	convertModelIndexToViewIndex(modelIndex: number): number;
}
