/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { URI } from "vs/base/common/uri";
import { INativeEnvironmentService } from "vs/platform/environment/common/environment";
import { AbstractExtensionsProfileScannerService } from "vs/platform/extensionManagement/common/extensionsProfileScannerService";
import { IFileService } from "vs/platform/files/common/files";
import { ILogService } from "vs/platform/log/common/log";
import { ITelemetryService } from "vs/platform/telemetry/common/telemetry";
import { IUriIdentityService } from "vs/platform/uriIdentity/common/uriIdentity";
import { IUserDataProfilesService } from "vs/platform/userDataProfile/common/userDataProfile";

export class ExtensionsProfileScannerService extends AbstractExtensionsProfileScannerService {
	constructor(
		@INativeEnvironmentService
		environmentService: INativeEnvironmentService,
		@IFileService fileService: IFileService,
		@IUserDataProfilesService
		userDataProfilesService: IUserDataProfilesService,
		@IUriIdentityService uriIdentityService: IUriIdentityService,
		@ITelemetryService telemetryService: ITelemetryService,
		@ILogService logService: ILogService,
	) {
		super(
			URI.file(environmentService.extensionsPath),
			fileService,
			userDataProfilesService,
			uriIdentityService,
			telemetryService,
			logService,
		);
	}
}
