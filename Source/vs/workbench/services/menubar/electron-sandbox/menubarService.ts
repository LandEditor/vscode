/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { registerMainProcessRemoteService } from "vs/platform/ipc/electron-sandbox/services";
import { IMenubarService } from "vs/platform/menubar/electron-sandbox/menubar";

registerMainProcessRemoteService(IMenubarService, "menubar");
