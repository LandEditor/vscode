/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
	IListContextMenuEvent,
	IListEvent,
	IListGestureEvent,
	IListMouseEvent,
	IListRenderer,
	IListTouchEvent,
} from "vs/base/browser/ui/list/list";
import { Event } from "vs/base/common/event";

export interface ITableColumn<TRow, TCell> {
	readonly label: string;
	readonly tooltip?: string;
	readonly weight: number;
	readonly templateId: string;

	readonly minimumWidth?: number;
	readonly maximumWidth?: number;
	readonly onDidChangeWidthConstraints?: Event<void>;

	project(row: TRow): TCell;
}

export interface ITableVirtualDelegate<TRow> {
	readonly headerRowHeight: number;
	getHeight(row: TRow): number;
}

export type ITableRenderer<TCell, TTemplateData> = IListRenderer<
	TCell,
	TTemplateData
>;

export type ITableEvent<TRow> = IListEvent<TRow>;
export type ITableMouseEvent<TRow> = IListMouseEvent<TRow>;
export type ITableTouchEvent<TRow> = IListTouchEvent<TRow>;
export type ITableGestureEvent<TRow> = IListGestureEvent<TRow>;
export type ITableContextMenuEvent<TRow> = IListContextMenuEvent<TRow>;

export class TableError extends Error {
	constructor(user: string, message: string) {
		super(`TableError [${user}] ${message}`);
	}
}
