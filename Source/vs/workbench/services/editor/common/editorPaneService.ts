/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { Event } from "vs/base/common/event";
import { createDecorator } from "vs/platform/instantiation/common/instantiation";
import type { IWillInstantiateEditorPaneEvent } from "vs/workbench/common/editor";

export const IEditorPaneService =
	createDecorator<IEditorPaneService>("editorPaneService");

export interface IEditorPaneService {
	readonly _serviceBrand: undefined;

	/**
	 * Emitted when an editor pane is about to be instantiated.
	 */
	readonly onWillInstantiateEditorPane: Event<IWillInstantiateEditorPaneEvent>;

	/**
	 * Returns whether a editor pane with the given type id has been instantiated.
	 */
	didInstantiateEditorPane(typeId: string): boolean;
}
