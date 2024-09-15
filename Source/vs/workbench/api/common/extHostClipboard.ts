/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type * as vscode from "vscode";

import { MainContext, type IMainContext } from "./extHost.protocol.js";

export class ExtHostClipboard {
	readonly value: vscode.Clipboard;

	constructor(mainContext: IMainContext) {
		const proxy = mainContext.getProxy(MainContext.MainThreadClipboard);
		this.value = Object.freeze({
			readText() {
				return proxy.$readText();
			},
			writeText(value: string) {
				return proxy.$writeText(value);
			},
		});
	}
}
