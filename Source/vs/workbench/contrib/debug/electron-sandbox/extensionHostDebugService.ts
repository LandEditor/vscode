/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IExtensionHostDebugService } from "vs/platform/debug/common/extensionHostDebug";
import {
	ExtensionHostDebugBroadcastChannel,
	ExtensionHostDebugChannelClient,
} from "vs/platform/debug/common/extensionHostDebugIpc";
import { registerMainProcessRemoteService } from "vs/platform/ipc/electron-sandbox/services";

registerMainProcessRemoteService(
	IExtensionHostDebugService,
	ExtensionHostDebugBroadcastChannel.ChannelName,
	{ channelClientCtor: ExtensionHostDebugChannelClient },
);
