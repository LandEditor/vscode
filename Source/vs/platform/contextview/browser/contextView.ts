/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { IContextMenuDelegate } from "../../../base/browser/contextmenu.js";
import type { StandardMouseEvent } from "../../../base/browser/mouseEvent.js";
import type {
	AnchorAlignment,
	AnchorAxisAlignment,
	IAnchor,
	IContextViewProvider,
} from "../../../base/browser/ui/contextview/contextview.js";
import type { IAction } from "../../../base/common/actions.js";
import type { Event } from "../../../base/common/event.js";
import type { IDisposable } from "../../../base/common/lifecycle.js";
import type {
	IMenuActionOptions,
	MenuId,
} from "../../actions/common/actions.js";
import type { IContextKeyService } from "../../contextkey/common/contextkey.js";
import { createDecorator } from "../../instantiation/common/instantiation.js";

export const IContextViewService =
	createDecorator<IContextViewService>("contextViewService");

export interface IContextViewService extends IContextViewProvider {
	readonly _serviceBrand: undefined;

	showContextView(
		delegate: IContextViewDelegate,
		container?: HTMLElement,
		shadowRoot?: boolean,
	): IOpenContextView;
	hideContextView(data?: any): void;
	getContextViewElement(): HTMLElement;
	layout(): void;
	anchorAlignment?: AnchorAlignment;
}

export interface IContextViewDelegate {
	canRelayout?: boolean; // Default: true

	/**
	 * The anchor where to position the context view.
	 * Use a `HTMLElement` to position the view at the element,
	 * a `StandardMouseEvent` to position it at the mouse position
	 * or an `IAnchor` to position it at a specific location.
	 */
	getAnchor(): HTMLElement | StandardMouseEvent | IAnchor;
	render(container: HTMLElement): IDisposable;
	onDOMEvent?(e: any, activeElement: HTMLElement): void;
	onHide?(data?: any): void;
	focus?(): void;
	anchorAlignment?: AnchorAlignment;
	anchorAxisAlignment?: AnchorAxisAlignment;

	// context views with higher layers are rendered over contet views with lower layers
	layer?: number; // Default: 0
}

export interface IOpenContextView {
	close: () => void;
}

export const IContextMenuService =
	createDecorator<IContextMenuService>("contextMenuService");

export interface IContextMenuService {
	readonly _serviceBrand: undefined;

	readonly onDidShowContextMenu: Event<void>;
	readonly onDidHideContextMenu: Event<void>;

	showContextMenu(
		delegate: IContextMenuDelegate | IContextMenuMenuDelegate,
	): void;
}

export type IContextMenuMenuDelegate = {
	/**
	 * The MenuId that should be used to populate the context menu.
	 */
	menuId?: MenuId;
	/**
	 * Optional options how menu actions are invoked
	 */
	menuActionOptions?: IMenuActionOptions;
	/**
	 * Optional context key service which drives the given menu
	 */
	contextKeyService?: IContextKeyService;

	/**
	 * Optional getter for extra actions. They will be prepended to the menu actions.
	 */
	getActions?(): IAction[];
} & Omit<IContextMenuDelegate, "getActions">;
