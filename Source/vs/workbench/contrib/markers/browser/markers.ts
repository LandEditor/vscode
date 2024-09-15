/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { IView } from "../../../common/views.js";
import type { MarkersViewMode } from "../common/markers.js";
import type { MarkerElement, ResourceMarkers } from "./markersModel.js";
import type { MarkersFilters } from "./markersViewActions.js";

export interface IMarkersView extends IView {
	readonly filters: MarkersFilters;
	focusFilter(): void;
	clearFilterText(): void;
	getFilterStats(): { total: number; filtered: number };

	getFocusElement(): MarkerElement | undefined;
	getFocusedSelectedElements(): MarkerElement[] | null;
	getAllResourceMarkers(): ResourceMarkers[];

	collapseAll(): void;
	setMultiline(multiline: boolean): void;
	setViewMode(viewMode: MarkersViewMode): void;
}
