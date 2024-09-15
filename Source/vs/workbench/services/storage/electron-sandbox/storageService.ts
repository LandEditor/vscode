/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { IEnvironmentService } from "../../../../platform/environment/common/environment.js";
import type { IMainProcessService } from "../../../../platform/ipc/common/mainProcessService.js";
import { RemoteStorageService } from "../../../../platform/storage/common/storageService.js";
import type { IUserDataProfilesService } from "../../../../platform/userDataProfile/common/userDataProfile.js";
import type { IAnyWorkspaceIdentifier } from "../../../../platform/workspace/common/workspace.js";
import type { IUserDataProfileService } from "../../userDataProfile/common/userDataProfile.js";

export class NativeWorkbenchStorageService extends RemoteStorageService {
	constructor(
		workspace: IAnyWorkspaceIdentifier | undefined,
		private readonly userDataProfileService: IUserDataProfileService,
		userDataProfilesService: IUserDataProfilesService,
		mainProcessService: IMainProcessService,
		environmentService: IEnvironmentService,
	) {
		super(
			workspace,
			{
				currentProfile: userDataProfileService.currentProfile,
				defaultProfile: userDataProfilesService.defaultProfile,
			},
			mainProcessService,
			environmentService,
		);

		this.registerListeners();
	}

	private registerListeners(): void {
		this._register(
			this.userDataProfileService.onDidChangeCurrentProfile((e) =>
				e.join(this.switchToProfile(e.profile)),
			),
		);
	}
}
