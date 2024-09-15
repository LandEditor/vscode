/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { DisposableStore } from "../../../../base/common/lifecycle.js";
import { localize } from "../../../../nls.js";
import {
	ConsoleLogger,
	type ILogger,
} from "../../../../platform/log/common/log.js";
import type { LoggerChannelClient } from "../../../../platform/log/common/logIpc.js";
import { LogService } from "../../../../platform/log/common/logService.js";
import type { INativeWorkbenchEnvironmentService } from "../../environment/electron-sandbox/environmentService.js";
import { windowLogId } from "../common/logConstants.js";

export class NativeLogService extends LogService {
	constructor(
		loggerService: LoggerChannelClient,
		environmentService: INativeWorkbenchEnvironmentService,
	) {
		const disposables = new DisposableStore();

		const fileLogger = disposables.add(
			loggerService.createLogger(environmentService.logFile, {
				id: windowLogId,
				name: localize("rendererLog", "Window"),
			}),
		);

		let consoleLogger: ILogger;
		if (
			environmentService.isExtensionDevelopment &&
			!!environmentService.extensionTestsLocationURI
		) {
			// Extension development test CLI: forward everything to main side
			consoleLogger = loggerService.createConsoleMainLogger();
		} else {
			// Normal mode: Log to console
			consoleLogger = new ConsoleLogger(fileLogger.getLevel());
		}

		super(fileLogger, [consoleLogger]);

		this._register(disposables);
	}
}
