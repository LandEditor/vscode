/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { IBaseCellEditorOptions } from "../notebookBrowser.js";
import type { NotebookOptions } from "../notebookOptions.js";
import type { NotebookEventDispatcher } from "./eventDispatcher.js";

export class ViewContext {
	constructor(
		readonly notebookOptions: NotebookOptions,
		readonly eventDispatcher: NotebookEventDispatcher,
		readonly getBaseCellEditorOptions: (
			language: string,
		) => IBaseCellEditorOptions,
	) {}
}
