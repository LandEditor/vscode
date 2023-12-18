/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IRemoteConsoleLog, log } from "vs/base/common/console";
import { IEnvironmentService } from "vs/platform/environment/common/environment";
import { ILogService } from "vs/platform/log/common/log";
import {
	MainContext,
	MainThreadConsoleShape,
} from "vs/workbench/api/common/extHost.protocol";
import {
	IExtHostContext,
	extHostNamedCustomer,
} from "vs/workbench/services/extensions/common/extHostCustomers";
import { parseExtensionDevOptions } from "vs/workbench/services/extensions/common/extensionDevOptions";
import {
	logRemoteEntry,
	logRemoteEntryIfError,
} from "vs/workbench/services/extensions/common/remoteConsoleUtil";

@extHostNamedCustomer(MainContext.MainThreadConsole)
export class MainThreadConsole implements MainThreadConsoleShape {
	private readonly _isExtensionDevTestFromCli: boolean;

	constructor(
		_extHostContext: IExtHostContext,
		@IEnvironmentService
		private readonly _environmentService: IEnvironmentService,
		@ILogService private readonly _logService: ILogService
	) {
		const devOpts = parseExtensionDevOptions(this._environmentService);
		this._isExtensionDevTestFromCli = devOpts.isExtensionDevTestFromCli;
	}

	dispose(): void {
		//
	}

	$logExtensionHostMessage(entry: IRemoteConsoleLog): void {
		if (this._isExtensionDevTestFromCli) {
			// If running tests from cli, log to the log service everything
			logRemoteEntry(this._logService, entry);
		} else {
			// Log to the log service only errors and log everything to local console
			logRemoteEntryIfError(this._logService, entry, "Extension Host");
			log(entry, "Extension Host");
		}
	}
}
