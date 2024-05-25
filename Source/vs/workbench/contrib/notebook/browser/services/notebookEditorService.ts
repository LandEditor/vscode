/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { Dimension } from "vs/base/browser/dom";
import type { CodeWindow } from "vs/base/browser/window";
import type { Event } from "vs/base/common/event";
import type { URI } from "vs/base/common/uri";
import {
	type ServicesAccessor,
	createDecorator,
} from "vs/platform/instantiation/common/instantiation";
import type {
	INotebookEditor,
	INotebookEditorCreationOptions,
} from "vs/workbench/contrib/notebook/browser/notebookBrowser";
import type { NotebookEditorWidget } from "vs/workbench/contrib/notebook/browser/notebookEditorWidget";
import type { NotebookEditorInput } from "vs/workbench/contrib/notebook/common/notebookEditorInput";
import type { IEditorGroup } from "vs/workbench/services/editor/common/editorGroupsService";

export const INotebookEditorService = createDecorator<INotebookEditorService>(
	"INotebookEditorWidgetService",
);

export interface IBorrowValue<T> {
	readonly value: T | undefined;
}

export interface INotebookEditorService {
	_serviceBrand: undefined;

	retrieveWidget(
		accessor: ServicesAccessor,
		group: IEditorGroup,
		input: NotebookEditorInput,
		creationOptions?: INotebookEditorCreationOptions,
		dimension?: Dimension,
		codeWindow?: CodeWindow,
	): IBorrowValue<INotebookEditor>;

	retrieveExistingWidgetFromURI(
		resource: URI,
	): IBorrowValue<NotebookEditorWidget> | undefined;
	retrieveAllExistingWidgets(): IBorrowValue<NotebookEditorWidget>[];
	onDidAddNotebookEditor: Event<INotebookEditor>;
	onDidRemoveNotebookEditor: Event<INotebookEditor>;
	addNotebookEditor(editor: INotebookEditor): void;
	removeNotebookEditor(editor: INotebookEditor): void;
	getNotebookEditor(editorId: string): INotebookEditor | undefined;
	listNotebookEditors(): readonly INotebookEditor[];
}
