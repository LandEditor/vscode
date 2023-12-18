/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Schemas } from "vs/base/common/network";
import { joinPath } from "vs/base/common/resources";
import { URI } from "vs/base/common/uri";
import { generateUuid } from "vs/base/common/uuid";
import { IConfigurationService } from "vs/platform/configuration/common/configuration";
import { IDialogService } from "vs/platform/dialogs/common/dialogs";
import { IDownloadService } from "vs/platform/download/common/download";
import {
	IExtensionGalleryService,
	ILocalExtension,
	InstallVSIXOptions,
} from "vs/platform/extensionManagement/common/extensionManagement";
import { IFileService } from "vs/platform/files/common/files";
import {
	InstantiationType,
	registerSingleton,
} from "vs/platform/instantiation/common/extensions";
import { IInstantiationService } from "vs/platform/instantiation/common/instantiation";
import { ILogService } from "vs/platform/log/common/log";
import { IProductService } from "vs/platform/product/common/productService";
import { IUserDataSyncEnablementService } from "vs/platform/userDataSync/common/userDataSync";
import { IWorkspaceTrustRequestService } from "vs/platform/workspace/common/workspaceTrust";
import { INativeWorkbenchEnvironmentService } from "vs/workbench/services/environment/electron-sandbox/environmentService";
import {
	IExtensionManagementServer,
	IExtensionManagementServerService,
	IWorkbenchExtensionManagementService,
} from "vs/workbench/services/extensionManagement/common/extensionManagement";
import { ExtensionManagementService as BaseExtensionManagementService } from "vs/workbench/services/extensionManagement/common/extensionManagementService";
import { IExtensionManifestPropertiesService } from "vs/workbench/services/extensions/common/extensionManifestPropertiesService";
import { IUserDataProfileService } from "vs/workbench/services/userDataProfile/common/userDataProfile";

export class ExtensionManagementService extends BaseExtensionManagementService {
	constructor(
		@INativeWorkbenchEnvironmentService
		private readonly environmentService: INativeWorkbenchEnvironmentService,
		@IExtensionManagementServerService
		extensionManagementServerService: IExtensionManagementServerService,
		@IExtensionGalleryService
		extensionGalleryService: IExtensionGalleryService,
		@IUserDataProfileService
		userDataProfileService: IUserDataProfileService,
		@IConfigurationService configurationService: IConfigurationService,
		@IProductService productService: IProductService,
		@IDownloadService downloadService: IDownloadService,
		@IUserDataSyncEnablementService
		userDataSyncEnablementService: IUserDataSyncEnablementService,
		@IDialogService dialogService: IDialogService,
		@IWorkspaceTrustRequestService
		workspaceTrustRequestService: IWorkspaceTrustRequestService,
		@IExtensionManifestPropertiesService
		extensionManifestPropertiesService: IExtensionManifestPropertiesService,
		@IFileService fileService: IFileService,
		@ILogService logService: ILogService,
		@IInstantiationService instantiationService: IInstantiationService
	) {
		super(
			extensionManagementServerService,
			extensionGalleryService,
			userDataProfileService,
			configurationService,
			productService,
			downloadService,
			userDataSyncEnablementService,
			dialogService,
			workspaceTrustRequestService,
			extensionManifestPropertiesService,
			fileService,
			logService,
			instantiationService
		);
	}

	protected override async installVSIXInServer(
		vsix: URI,
		server: IExtensionManagementServer,
		options: InstallVSIXOptions | undefined,
	): Promise<ILocalExtension> {
		if (
			vsix.scheme === Schemas.vscodeRemote &&
			server ===
				this.extensionManagementServerService
					.localExtensionManagementServer
		) {
			const downloadedLocation = joinPath(
				this.environmentService.tmpDir,
				generateUuid(),
			);
			await this.downloadService.download(vsix, downloadedLocation);
			vsix = downloadedLocation;
		}
		return super.installVSIXInServer(vsix, server, options);
	}
}

registerSingleton(
	IWorkbenchExtensionManagementService,
	ExtensionManagementService,
	InstantiationType.Delayed,
);
