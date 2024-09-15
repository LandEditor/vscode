/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { URI } from "../../../base/common/uri.js";
import { generateUuid } from "../../../base/common/uuid.js";
import {
	AbstractLoggerService,
	type ILogger,
	type ILoggerOptions,
	type ILoggerService,
	type LogLevel,
} from "../common/log.js";
import { SpdLogLogger } from "./spdlogLog.js";

export class LoggerService
	extends AbstractLoggerService
	implements ILoggerService
{
	protected doCreateLogger(
		resource: URI,
		logLevel: LogLevel,
		options?: ILoggerOptions,
	): ILogger {
		return new SpdLogLogger(
			generateUuid(),
			resource.fsPath,
			!options?.donotRotate,
			!!options?.donotUseFormatters,
			logLevel,
		);
	}
}
