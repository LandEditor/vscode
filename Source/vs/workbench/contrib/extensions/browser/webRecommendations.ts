/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize } from "../../../../nls.js";
import { IProductService } from "../../../../platform/product/common/productService.js";
import { IExtensionManagementServerService } from "../../../services/extensionManagement/common/extensionManagement.js";
import { ExtensionRecommendationReason } from "../../../services/extensionRecommendations/common/extensionRecommendations.js";
import {
	type ExtensionRecommendation,
	ExtensionRecommendations,
} from "./extensionRecommendations.js";

export class WebRecommendations extends ExtensionRecommendations {
	private _recommendations: ExtensionRecommendation[] = [];
	get recommendations(): ReadonlyArray<ExtensionRecommendation> {
		return this._recommendations;
	}

	constructor(
		@IProductService private readonly productService: IProductService,
		@IExtensionManagementServerService
		private readonly extensionManagementServerService: IExtensionManagementServerService,
	) {
		super();
	}

	protected async doActivate(): Promise<void> {
		const isOnlyWeb =
			this.extensionManagementServerService
				.webExtensionManagementServer &&
			!this.extensionManagementServerService
				.localExtensionManagementServer &&
			!this.extensionManagementServerService
				.remoteExtensionManagementServer;
		if (isOnlyWeb && Array.isArray(this.productService.webExtensionTips)) {
			this._recommendations = this.productService.webExtensionTips.map(
				(extensionId): ExtensionRecommendation => ({
					extension: extensionId.toLowerCase(),
					reason: {
						reasonId: ExtensionRecommendationReason.Application,
						reasonText: localize(
							"reason",
							"This extension is recommended for {0} for the Web",
							this.productService.nameLong,
						),
					},
				}),
			);
		}
	}
}
