/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IConfigurationService } from "vs/platform/configuration/common/configuration";
import { IFileService } from "vs/platform/files/common/files";
import {
	InstantiationType,
	registerSingleton,
} from "vs/platform/instantiation/common/extensions";
import { ILabelService } from "vs/platform/label/common/label";
import { ILogService } from "vs/platform/log/common/log";
import { IUriIdentityService } from "vs/platform/uriIdentity/common/uriIdentity";
import { IWorkbenchEnvironmentService } from "vs/workbench/services/environment/common/environmentService";
import { IRemoteAgentService } from "vs/workbench/services/remote/common/remoteAgentService";
import { IWorkingCopyHistoryService } from "vs/workbench/services/workingCopy/common/workingCopyHistory";
import {
	IWorkingCopyHistoryModelOptions,
	WorkingCopyHistoryService,
} from "vs/workbench/services/workingCopy/common/workingCopyHistoryService";

export class BrowserWorkingCopyHistoryService extends WorkingCopyHistoryService {
	constructor(
		@IFileService fileService: IFileService,
		@IRemoteAgentService remoteAgentService: IRemoteAgentService,
		@IWorkbenchEnvironmentService
		environmentService: IWorkbenchEnvironmentService,
		@IUriIdentityService uriIdentityService: IUriIdentityService,
		@ILabelService labelService: ILabelService,
		@ILogService logService: ILogService,
		@IConfigurationService configurationService: IConfigurationService,
	) {
		super(
			fileService,
			remoteAgentService,
			environmentService,
			uriIdentityService,
			labelService,
			logService,
			configurationService,
		);
	}

	protected getModelOptions(): IWorkingCopyHistoryModelOptions {
		return {
			flushOnChange: true /* because browsers support no long running shutdown */,
		};
	}
}

// Register Service
registerSingleton(
	IWorkingCopyHistoryService,
	BrowserWorkingCopyHistoryService,
	InstantiationType.Delayed,
);
