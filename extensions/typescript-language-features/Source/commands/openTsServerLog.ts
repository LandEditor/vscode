/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type TypeScriptServiceClientHost from "../typeScriptServiceClientHost";
import type { Lazy } from "../utils/lazy";
import type { Command } from "./commandManager";

export class OpenTsServerLogCommand implements Command {
	public readonly id = "typescript.openTsServerLog";

	public constructor(
		private readonly lazyClientHost: Lazy<TypeScriptServiceClientHost>,
	) {}

	public execute() {
		this.lazyClientHost.value.serviceClient.openTsServerLogFile();
	}
}
