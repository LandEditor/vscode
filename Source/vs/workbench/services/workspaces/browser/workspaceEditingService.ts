/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { URI } from "../../../../base/common/uri.js";
import { ICommandService } from "../../../../platform/commands/common/commands.js";
import {
	IDialogService,
	IFileDialogService,
} from "../../../../platform/dialogs/common/dialogs.js";
import { IFileService } from "../../../../platform/files/common/files.js";
import {
	InstantiationType,
	registerSingleton,
} from "../../../../platform/instantiation/common/extensions.js";
import { INotificationService } from "../../../../platform/notification/common/notification.js";
import { IUriIdentityService } from "../../../../platform/uriIdentity/common/uriIdentity.js";
import { IUserDataProfilesService } from "../../../../platform/userDataProfile/common/userDataProfile.js";
import { IWorkspaceContextService } from "../../../../platform/workspace/common/workspace.js";
import { IWorkspaceTrustManagementService } from "../../../../platform/workspace/common/workspaceTrust.js";
import { IWorkspacesService } from "../../../../platform/workspaces/common/workspaces.js";
import type { WorkspaceService } from "../../configuration/browser/configurationService.js";
import { IWorkbenchConfigurationService } from "../../configuration/common/configuration.js";
import { IJSONEditingService } from "../../configuration/common/jsonEditing.js";
import { IWorkbenchEnvironmentService } from "../../environment/common/environmentService.js";
import { IHostService } from "../../host/browser/host.js";
import { ITextFileService } from "../../textfile/common/textfiles.js";
import { IUserDataProfileService } from "../../userDataProfile/common/userDataProfile.js";
import { IWorkspaceEditingService } from "../common/workspaceEditing.js";
import { AbstractWorkspaceEditingService } from "./abstractWorkspaceEditingService.js";

export class BrowserWorkspaceEditingService extends AbstractWorkspaceEditingService {
	constructor(
		@IJSONEditingService jsonEditingService: IJSONEditingService,
		@IWorkspaceContextService contextService: WorkspaceService,
		@IWorkbenchConfigurationService
		configurationService: IWorkbenchConfigurationService,
		@INotificationService notificationService: INotificationService,
		@ICommandService commandService: ICommandService,
		@IFileService fileService: IFileService,
		@ITextFileService textFileService: ITextFileService,
		@IWorkspacesService workspacesService: IWorkspacesService,
		@IWorkbenchEnvironmentService
		environmentService: IWorkbenchEnvironmentService,
		@IFileDialogService fileDialogService: IFileDialogService,
		@IDialogService dialogService: IDialogService,
		@IHostService hostService: IHostService,
		@IUriIdentityService uriIdentityService: IUriIdentityService,
		@IWorkspaceTrustManagementService
		workspaceTrustManagementService: IWorkspaceTrustManagementService,
		@IUserDataProfilesService
		userDataProfilesService: IUserDataProfilesService,
		@IUserDataProfileService
		userDataProfileService: IUserDataProfileService,
	) {
		super(
			jsonEditingService,
			contextService,
			configurationService,
			notificationService,
			commandService,
			fileService,
			textFileService,
			workspacesService,
			environmentService,
			fileDialogService,
			dialogService,
			hostService,
			uriIdentityService,
			workspaceTrustManagementService,
			userDataProfilesService,
			userDataProfileService,
		);
	}

	async enterWorkspace(workspaceUri: URI): Promise<void> {
		const result = await this.doEnterWorkspace(workspaceUri);
		if (result) {
			// Open workspace in same window
			await this.hostService.openWindow([{ workspaceUri }], {
				forceReuseWindow: true,
			});
		}
	}
}

registerSingleton(
	IWorkspaceEditingService,
	BrowserWorkspaceEditingService,
	InstantiationType.Delayed,
);
