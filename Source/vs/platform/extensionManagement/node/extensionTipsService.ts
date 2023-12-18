/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { INativeEnvironmentService } from "vs/platform/environment/common/environment";
import { IExtensionManagementService } from "vs/platform/extensionManagement/common/extensionManagement";
import { AbstractNativeExtensionTipsService } from "vs/platform/extensionManagement/common/extensionTipsService";
import { IExtensionRecommendationNotificationService } from "vs/platform/extensionRecommendations/common/extensionRecommendations";
import { IFileService } from "vs/platform/files/common/files";
import { INativeHostService } from "vs/platform/native/common/native";
import { IProductService } from "vs/platform/product/common/productService";
import { IStorageService } from "vs/platform/storage/common/storage";
import { ITelemetryService } from "vs/platform/telemetry/common/telemetry";

export class ExtensionTipsService extends AbstractNativeExtensionTipsService {
	constructor(
		@INativeEnvironmentService
		environmentService: INativeEnvironmentService,
		@ITelemetryService telemetryService: ITelemetryService,
		@IExtensionManagementService
		extensionManagementService: IExtensionManagementService,
		@IStorageService storageService: IStorageService,
		@INativeHostService nativeHostService: INativeHostService,
		@IExtensionRecommendationNotificationService
		extensionRecommendationNotificationService: IExtensionRecommendationNotificationService,
		@IFileService fileService: IFileService,
		@IProductService productService: IProductService,
	) {
		super(
			environmentService.userHome,
			nativeHostService,
			telemetryService,
			extensionManagementService,
			storageService,
			extensionRecommendationNotificationService,
			fileService,
			productService,
		);
	}
}
