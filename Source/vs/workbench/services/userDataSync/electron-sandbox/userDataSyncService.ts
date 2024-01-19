/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { registerSharedProcessRemoteService } from "vs/platform/ipc/electron-sandbox/services";
import {
	IUserDataSyncResourceProviderService,
	IUserDataSyncService,
	IUserDataSyncStoreManagementService,
} from "vs/platform/userDataSync/common/userDataSync";
import { IUserDataSyncAccountService } from "vs/platform/userDataSync/common/userDataSyncAccount";
import {
	UserDataSyncAccountServiceChannelClient,
	UserDataSyncStoreManagementServiceChannelClient,
} from "vs/platform/userDataSync/common/userDataSyncIpc";
import { IUserDataSyncMachinesService } from "vs/platform/userDataSync/common/userDataSyncMachines";
import { UserDataSyncServiceChannelClient } from "vs/platform/userDataSync/common/userDataSyncServiceIpc";

registerSharedProcessRemoteService(IUserDataSyncService, "userDataSync", {
	channelClientCtor: UserDataSyncServiceChannelClient,
});
registerSharedProcessRemoteService(
	IUserDataSyncResourceProviderService,
	"IUserDataSyncResourceProviderService",
);
registerSharedProcessRemoteService(
	IUserDataSyncMachinesService,
	"userDataSyncMachines",
);
registerSharedProcessRemoteService(
	IUserDataSyncAccountService,
	"userDataSyncAccount",
	{ channelClientCtor: UserDataSyncAccountServiceChannelClient },
);
registerSharedProcessRemoteService(
	IUserDataSyncStoreManagementService,
	"userDataSyncStoreManagement",
	{ channelClientCtor: UserDataSyncStoreManagementServiceChannelClient },
);
