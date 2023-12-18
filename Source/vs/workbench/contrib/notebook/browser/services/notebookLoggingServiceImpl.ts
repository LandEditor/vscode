/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from "vs/base/common/lifecycle";
import * as nls from "vs/nls";
import { ILogger, ILoggerService } from "vs/platform/log/common/log";
import { INotebookLoggingService } from "vs/workbench/contrib/notebook/common/notebookLoggingService";

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
				name: nls.localize("renderChannelName", "Notebook rendering"),
			})
		);
	}

	debug(category: string, output: string): void {
		this._logger.debug(`[${category}] ${output}`);
	}

	info(category: string, output: string): void {
		this._logger.info(`[${category}] ${output}`);
	}
}
