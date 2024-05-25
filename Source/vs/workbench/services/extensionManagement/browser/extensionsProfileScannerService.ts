/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
	AbstractExtensionsProfileScannerService,
	IExtensionsProfileScannerService,
} from "vs/platform/extensionManagement/common/extensionsProfileScannerService";
import { IFileService } from "vs/platform/files/common/files";
import {
	InstantiationType,
	registerSingleton,
} from "vs/platform/instantiation/common/extensions";
import { ILogService } from "vs/platform/log/common/log";
import { ITelemetryService } from "vs/platform/telemetry/common/telemetry";
import { IUriIdentityService } from "vs/platform/uriIdentity/common/uriIdentity";
import { IUserDataProfilesService } from "vs/platform/userDataProfile/common/userDataProfile";
import { IWorkbenchEnvironmentService } from "vs/workbench/services/environment/common/environmentService";

export class ExtensionsProfileScannerService extends AbstractExtensionsProfileScannerService {
	constructor(
		@IWorkbenchEnvironmentService environmentService: IWorkbenchEnvironmentService,
		@IFileService fileService: IFileService,
		@IUserDataProfilesService userDataProfilesService: IUserDataProfilesService,
		@IUriIdentityService uriIdentityService: IUriIdentityService,
		@ITelemetryService telemetryService: ITelemetryService,
		@ILogService logService: ILogService,
	) {
		super(
			environmentService.userRoamingDataHome,
			fileService,
			userDataProfilesService,
			uriIdentityService,
			telemetryService,
			logService,
		);
	}
}

registerSingleton(
	IExtensionsProfileScannerService,
	ExtensionsProfileScannerService,
	InstantiationType.Delayed,
);
