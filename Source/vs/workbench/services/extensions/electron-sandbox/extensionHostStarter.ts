/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
	IExtensionHostStarter,
	ipcExtensionHostStarterChannelName,
} from "vs/platform/extensions/common/extensionHostStarter";
import { registerMainProcessRemoteService } from "vs/platform/ipc/electron-sandbox/services";

registerMainProcessRemoteService(
	IExtensionHostStarter,
	ipcExtensionHostStarterChannelName,
);
