/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { CancellationToken } from "vs/base/common/cancellation";
import type { Event } from "vs/base/common/event";
import type { IDisposable } from "vs/base/common/lifecycle";
import type { URI } from "vs/base/common/uri";
import { createDecorator } from "vs/platform/instantiation/common/instantiation";
import type {
	INotebookCellStatusBarItemList,
	INotebookCellStatusBarItemProvider,
} from "vs/workbench/contrib/notebook/common/notebookCommon";

export const INotebookCellStatusBarService =
	createDecorator<INotebookCellStatusBarService>(
		"notebookCellStatusBarService",
	);

export interface INotebookCellStatusBarService {
	readonly _serviceBrand: undefined;

	readonly onDidChangeProviders: Event<void>;
	readonly onDidChangeItems: Event<void>;

	registerCellStatusBarItemProvider(
		provider: INotebookCellStatusBarItemProvider,
	): IDisposable;

	getStatusBarItemsForCell(
		docUri: URI,
		cellIndex: number,
		viewType: string,
		token: CancellationToken,
	): Promise<INotebookCellStatusBarItemList[]>;
}
