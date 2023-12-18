/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { isActiveElement } from "vs/base/browser/dom";
import { List } from "vs/base/browser/ui/list/listWidget";
import { AsyncDataTree } from "vs/base/browser/ui/tree/asyncDataTree";
import { coalesce } from "vs/base/common/arrays";
import { URI } from "vs/base/common/uri";
import { ResourceFileEdit } from "vs/editor/browser/services/bulkEditService";
import { createDecorator } from "vs/platform/instantiation/common/instantiation";
import { IListService } from "vs/platform/list/browser/listService";
import { ProgressLocation } from "vs/platform/progress/common/progress";
import {
	EditorResourceAccessor,
	IEditorIdentifier,
	SideBySideEditor,
} from "vs/workbench/common/editor";
import { IEditableData } from "vs/workbench/common/views";
import { ExplorerItem } from "vs/workbench/contrib/files/common/explorerModel";
import {
	ISortOrderConfiguration,
	OpenEditor,
} from "vs/workbench/contrib/files/common/files";
import { IEditorGroupsService } from "vs/workbench/services/editor/common/editorGroupsService";
import { IEditorService } from "vs/workbench/services/editor/common/editorService";

export interface IExplorerService {
	readonly _serviceBrand: undefined;
	readonly roots: ExplorerItem[];
	readonly sortOrderConfiguration: ISortOrderConfiguration;

	getContext(
		respectMultiSelection: boolean,
		ignoreNestedChildren?: boolean,
	): ExplorerItem[];
	hasViewFocus(): boolean;
	setEditable(stat: ExplorerItem, data: IEditableData | null): Promise<void>;
	getEditable(): { stat: ExplorerItem; data: IEditableData } | undefined;
	getEditableData(stat: ExplorerItem): IEditableData | undefined;
	// If undefined is passed checks if any element is currently being edited.
	isEditable(stat: ExplorerItem | undefined): boolean;
	findClosest(resource: URI): ExplorerItem | null;
	findClosestRoot(resource: URI): ExplorerItem | null;
	refresh(): Promise<void>;
	setToCopy(stats: ExplorerItem[], cut: boolean): Promise<void>;
	isCut(stat: ExplorerItem): boolean;
	applyBulkEdit(
		edit: ResourceFileEdit[],
		options: {
			undoLabel: string;
			progressLabel: string;
			confirmBeforeUndo?: boolean;
			progressLocation?:
				| ProgressLocation.Explorer
				| ProgressLocation.Window;
		},
	): Promise<void>;

	/**
	 * Selects and reveal the file element provided by the given resource if its found in the explorer.
	 * Will try to resolve the path in case the explorer is not yet expanded to the file yet.
	 */
	select(resource: URI, reveal?: boolean | string): Promise<void>;

	registerView(contextAndRefreshProvider: IExplorerView): void;
}

export const IExplorerService =
	createDecorator<IExplorerService>("explorerService");

export interface IExplorerView {
	autoReveal: boolean | "force" | "focusNoScroll";
	getContext(respectMultiSelection: boolean): ExplorerItem[];
	refresh(recursive: boolean, item?: ExplorerItem): Promise<void>;
	selectResource(
		resource: URI | undefined,
		reveal?: boolean | string,
	): Promise<void>;
	setTreeInput(): Promise<void>;
	itemsCopied(
		tats: ExplorerItem[],
		cut: boolean,
		previousCut: ExplorerItem[] | undefined,
	): void;
	setEditable(stat: ExplorerItem, isEditing: boolean): Promise<void>;
	isItemVisible(item: ExplorerItem): boolean;
	isItemCollapsed(item: ExplorerItem): boolean;
	hasFocus(): boolean;
}

function getFocus(listService: IListService): unknown | undefined {
	const list = listService.lastFocusedList;
	const element = list?.getHTMLElement();
	if (element && isActiveElement(element)) {
		let focus: unknown;
		if (list instanceof List) {
			const focused = list.getFocusedElements();
			if (focused.length) {
				focus = focused[0];
			}
		} else if (list instanceof AsyncDataTree) {
			const focused = list.getFocus();
			if (focused.length) {
				focus = focused[0];
			}
		}

		return focus;
	}

	return undefined;
}

// Commands can get executed from a command palette, from a context menu or from some list using a keybinding
// To cover all these cases we need to properly compute the resource on which the command is being executed
export function getResourceForCommand(
	resource: URI | object | undefined,
	listService: IListService,
	editorService: IEditorService,
): URI | undefined {
	if (URI.isUri(resource)) {
		return resource;
	}

	const focus = getFocus(listService);
	if (focus instanceof ExplorerItem) {
		return focus.resource;
	} else if (focus instanceof OpenEditor) {
		return focus.getResource();
	}

	return EditorResourceAccessor.getOriginalUri(editorService.activeEditor, {
		supportSideBySide: SideBySideEditor.PRIMARY,
	});
}

export function getMultiSelectedResources(
	resource: URI | object | undefined,
	listService: IListService,
	editorService: IEditorService,
	explorerService: IExplorerService,
): Array<URI> {
	const list = listService.lastFocusedList;
	const element = list?.getHTMLElement();
	if (element && isActiveElement(element)) {
		// Explorer
		if (
			list instanceof AsyncDataTree &&
			list.getFocus().every((item) => item instanceof ExplorerItem)
		) {
			// Explorer
			const context = explorerService.getContext(true, true);
			if (context.length) {
				return context.map((c) => c.resource);
			}
		}

		// Open editors view
		if (list instanceof List) {
			const selection = coalesce(
				list
					.getSelectedElements()
					.filter((s) => s instanceof OpenEditor)
					.map((oe: OpenEditor) => oe.getResource()),
			);
			const focusedElements = list.getFocusedElements();
			const focus = focusedElements.length
				? focusedElements[0]
				: undefined;
			let mainUriStr: string | undefined = undefined;
			if (URI.isUri(resource)) {
				mainUriStr = resource.toString();
			} else if (focus instanceof OpenEditor) {
				const focusedResource = focus.getResource();
				mainUriStr = focusedResource
					? focusedResource.toString()
					: undefined;
			}
			// We only respect the selection if it contains the main element.
			if (selection.some((s) => s.toString() === mainUriStr)) {
				return selection;
			}
		}
	}

	const result = getResourceForCommand(resource, listService, editorService);
	return !!result ? [result] : [];
}

export function getOpenEditorsViewMultiSelection(
	listService: IListService,
	editorGroupService: IEditorGroupsService,
): Array<IEditorIdentifier> | undefined {
	const list = listService.lastFocusedList;
	const element = list?.getHTMLElement();
	if (element && isActiveElement(element)) {
		// Open editors view
		if (list instanceof List) {
			const selection = coalesce(
				list
					.getSelectedElements()
					.filter((s) => s instanceof OpenEditor),
			);
			const focusedElements = list.getFocusedElements();
			const focus = focusedElements.length
				? focusedElements[0]
				: undefined;
			let mainEditor: IEditorIdentifier | undefined = undefined;
			if (focus instanceof OpenEditor) {
				mainEditor = focus;
			}
			// We only respect the selection if it contains the main element.
			if (selection.some((s) => s === mainEditor)) {
				return selection;
			}
			return mainEditor ? [mainEditor] : undefined;
		}
	}

	return undefined;
}
