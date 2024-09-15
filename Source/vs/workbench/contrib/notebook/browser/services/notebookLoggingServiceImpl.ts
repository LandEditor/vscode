/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from "../../../../../base/common/lifecycle.js";
import * as nls from "../../../../../nls.js";
import {
	type ILogger,
	ILoggerService,
} from "../../../../../platform/log/common/log.js";
import type { INotebookLoggingService } from "../../common/notebookLoggingService.js";

const logChannelId = "notebook.rendering";

export class NotebookLoggingService
	extends Disposable
	implements INotebookLoggingService
{
	_serviceBrand: undefined;

	static ID = "notebook";
	private readonly _logger: ILogger;

	constructor(@ILoggerService loggerService: ILoggerService) {
		super();
		this._logger = this._register(
			loggerService.createLogger(logChannelId, {
				name: nls.localize("renderChannelName", "Notebook"),
			}),
		);
	}

	debug(category: string, output: string): void {
		this._logger.debug(`[${category}] ${output}`);
	}

	info(category: string, output: string): void {
		this._logger.info(`[${category}] ${output}`);
	}

	warn(category: string, output: string): void {
		this._logger.warn(`[${category}] ${output}`);
	}

	error(category: string, output: string): void {
		this._logger.error(`[${category}] ${output}`);
	}
}
