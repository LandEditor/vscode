/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { Event } from "../../../base/common/event.js";
import type { URI } from "../../../base/common/uri.js";
import { createDecorator } from "../../../platform/instantiation/common/instantiation.js";
import type { IMarker } from "../../../platform/markers/common/markers.js";
import type { Range } from "../core/range.js";
import type { IModelDecoration, ITextModel } from "../model.js";

export const IMarkerDecorationsService =
	createDecorator<IMarkerDecorationsService>("markerDecorationsService");

export interface IMarkerDecorationsService {
	readonly _serviceBrand: undefined;

	onDidChangeMarker: Event<ITextModel>;

	getMarker(uri: URI, decoration: IModelDecoration): IMarker | null;

	getLiveMarkers(uri: URI): [Range, IMarker][];
}
