/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { Command } from "../commandManager";
import type { MarkdownPreviewManager } from "../preview/previewManager";

export class ToggleLockCommand implements Command {
	public readonly id = "markdown.preview.toggleLock";

	public constructor(
		private readonly _previewManager: MarkdownPreviewManager,
	) {}

	public execute() {
		this._previewManager.toggleLock();
	}
}
