/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { RawContextKey } from "vs/platform/contextkey/common/contextkey";
import type { IView } from "vs/workbench/common/views";

export enum OutlineSortOrder {
	ByPosition = 0,
	ByName = 1,
	ByKind = 2,
}

export interface IOutlineViewState {
	followCursor: boolean;
	filterOnType: boolean;
	sortBy: OutlineSortOrder;
}

export namespace IOutlinePane {
	export const Id = "outline";
}

export interface IOutlinePane extends IView {
	outlineViewState: IOutlineViewState;
	collapseAll(): void;
	expandAll(): void;
}

// --- context keys

export const ctxFollowsCursor = new RawContextKey<boolean>(
	"outlineFollowsCursor",
	false,
);
export const ctxFilterOnType = new RawContextKey<boolean>(
	"outlineFiltersOnType",
	false,
);
export const ctxSortMode = new RawContextKey<OutlineSortOrder>(
	"outlineSortMode",
	OutlineSortOrder.ByPosition,
);
export const ctxAllCollapsed = new RawContextKey<boolean>(
	"outlineAllCollapsed",
	false,
);
