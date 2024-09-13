/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { ViewportData } from "../../common/viewLayout/viewLinesViewportData.js";
import type { ViewLineOptions } from "../viewParts/lines/viewLineOptions.js";

export enum BindingId {
	GlyphInfo0 = 0,
	GlyphInfo1 = 1,
	Cells = 2,
	TextureSampler = 3,
	Texture = 4,
	ViewportUniform = 5,
	AtlasDimensionsUniform = 6,
	ScrollOffset = 7,
}

export interface IGpuRenderStrategy {
	readonly wgsl: string;
	readonly bindGroupEntries: GPUBindGroupEntry[];

	update(
		viewportData: ViewportData,
		viewLineOptions: ViewLineOptions,
	): number;
	draw?(pass: GPURenderPassEncoder, viewportData: ViewportData): void;
}
