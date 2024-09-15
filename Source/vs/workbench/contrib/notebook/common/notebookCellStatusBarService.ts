/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { CancellationToken } from "../../../../base/common/cancellation.js";
import type { Event } from "../../../../base/common/event.js";
import type { IDisposable } from "../../../../base/common/lifecycle.js";
import type { URI } from "../../../../base/common/uri.js";
import { createDecorator } from "../../../../platform/instantiation/common/instantiation.js";
import type {
	INotebookCellStatusBarItemList,
	INotebookCellStatusBarItemProvider,
} from "./notebookCommon.js";

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
