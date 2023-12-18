/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
	InstantiationType,
	registerSingleton,
} from "vs/platform/instantiation/common/extensions";
import { IWorkspaceContextService } from "vs/platform/workspace/common/workspace";
import { INativeWorkbenchEnvironmentService } from "vs/workbench/services/environment/electron-sandbox/environmentService";
import {
	AbstractPathService,
	IPathService,
} from "vs/workbench/services/path/common/pathService";
import { IRemoteAgentService } from "vs/workbench/services/remote/common/remoteAgentService";

export class NativePathService extends AbstractPathService {
	constructor(
		@IRemoteAgentService remoteAgentService: IRemoteAgentService,
		@INativeWorkbenchEnvironmentService
		environmentService: INativeWorkbenchEnvironmentService,
		@IWorkspaceContextService contextService: IWorkspaceContextService,
	) {
		super(
			environmentService.userHome,
			remoteAgentService,
			environmentService,
			contextService,
		);
	}
}

registerSingleton(IPathService, NativePathService, InstantiationType.Delayed);
