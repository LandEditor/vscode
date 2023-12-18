/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Schemas } from "vs/base/common/network";
import { isMacintosh, isWindows } from "vs/base/common/platform";
import { ServicesAccessor } from "vs/editor/browser/editorExtensions";
import { localize } from "vs/nls";
import {
	Action2,
	MenuId,
	registerAction2,
} from "vs/platform/actions/common/actions";
import { ContextKeyExpr } from "vs/platform/contextkey/common/contextkey";
import { INativeHostService } from "vs/platform/native/common/native";
import { ResourceContextKey } from "vs/workbench/common/contextkeys";
import { LOCAL_HISTORY_MENU_CONTEXT_KEY } from "vs/workbench/contrib/localHistory/browser/localHistory";
import {
	ITimelineCommandArgument,
	findLocalHistoryEntry,
} from "vs/workbench/contrib/localHistory/browser/localHistoryCommands";
import { IWorkingCopyHistoryService } from "vs/workbench/services/workingCopy/common/workingCopyHistory";

//#region Delete

registerAction2(
	class extends Action2 {
		constructor() {
			super({
				id: "workbench.action.localHistory.revealInOS",
				title: {
					value: isWindows
						? localize("revealInWindows", "Reveal in File Explorer")
						: isMacintosh
						  ? localize("revealInMac", "Reveal in Finder")
						  : localize("openContainer", "Open Containing Folder"),
					original: isWindows
						? "Reveal in File Explorer"
						: isMacintosh
						  ? "Reveal in Finder"
						  : "Open Containing Folder",
				},
				menu: {
					id: MenuId.TimelineItemContext,
					group: "4_reveal",
					order: 1,
					when: ContextKeyExpr.and(
						LOCAL_HISTORY_MENU_CONTEXT_KEY,
						ResourceContextKey.Scheme.isEqualTo(Schemas.file),
					),
				},
			});
		}
		async run(
			accessor: ServicesAccessor,
			item: ITimelineCommandArgument,
		): Promise<void> {
			const workingCopyHistoryService = accessor.get(
				IWorkingCopyHistoryService,
			);
			const nativeHostService = accessor.get(INativeHostService);

			const { entry } = await findLocalHistoryEntry(
				workingCopyHistoryService,
				item,
			);
			if (entry) {
				await nativeHostService.showItemInFolder(
					entry.location.with({ scheme: Schemas.file }).fsPath,
				);
			}
		}
	},
);

//#endregion
