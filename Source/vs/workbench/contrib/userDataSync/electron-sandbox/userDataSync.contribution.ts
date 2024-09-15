/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from "../../../../base/common/lifecycle.js";
import { Schemas } from "../../../../base/common/network.js";
import { ProxyChannel } from "../../../../base/parts/ipc/common/ipc.js";
import { localize, localize2 } from "../../../../nls.js";
import {
	Action2,
	MenuId,
	registerAction2,
} from "../../../../platform/actions/common/actions.js";
import { IEnvironmentService } from "../../../../platform/environment/common/environment.js";
import { IFileService } from "../../../../platform/files/common/files.js";
import type { ServicesAccessor } from "../../../../platform/instantiation/common/instantiation.js";
import { ISharedProcessService } from "../../../../platform/ipc/electron-sandbox/services.js";
import { INativeHostService } from "../../../../platform/native/common/native.js";
import {
	INotificationService,
	Severity,
} from "../../../../platform/notification/common/notification.js";
import {
	IUserDataSyncUtilService,
	SyncStatus,
} from "../../../../platform/userDataSync/common/userDataSync.js";
import {
	type IWorkbenchContribution,
	WorkbenchPhase,
	registerWorkbenchContribution2,
} from "../../../common/contributions.js";
import {
	CONTEXT_SYNC_STATE,
	DOWNLOAD_ACTIVITY_ACTION_DESCRIPTOR,
	IUserDataSyncWorkbenchService,
	SYNC_TITLE,
} from "../../../services/userDataSync/common/userDataSync.js";

class UserDataSyncServicesContribution
	extends Disposable
	implements IWorkbenchContribution
{
	static readonly ID = "workbench.contrib.userDataSyncServices";

	constructor(
		@IUserDataSyncUtilService
		userDataSyncUtilService: IUserDataSyncUtilService,
		@ISharedProcessService sharedProcessService: ISharedProcessService,
	) {
		super();
		sharedProcessService.registerChannel(
			"userDataSyncUtil",
			ProxyChannel.fromService(userDataSyncUtilService, this._store),
		);
	}
}

registerWorkbenchContribution2(
	UserDataSyncServicesContribution.ID,
	UserDataSyncServicesContribution,
	WorkbenchPhase.BlockStartup,
);

registerAction2(
	class OpenSyncBackupsFolder extends Action2 {
		constructor() {
			super({
				id: "workbench.userData.actions.openSyncBackupsFolder",
				title: localize2(
					"Open Backup folder",
					"Open Local Backups Folder",
				),
				category: SYNC_TITLE,
				menu: {
					id: MenuId.CommandPalette,
					when: CONTEXT_SYNC_STATE.notEqualsTo(
						SyncStatus.Uninitialized,
					),
				},
			});
		}
		async run(accessor: ServicesAccessor): Promise<void> {
			const syncHome = accessor.get(IEnvironmentService).userDataSyncHome;
			const nativeHostService = accessor.get(INativeHostService);
			const fileService = accessor.get(IFileService);
			const notificationService = accessor.get(INotificationService);
			if (await fileService.exists(syncHome)) {
				const folderStat = await fileService.resolve(syncHome);
				const item =
					folderStat.children && folderStat.children[0]
						? folderStat.children[0].resource
						: syncHome;
				return nativeHostService.showItemInFolder(
					item.with({ scheme: Schemas.file }).fsPath,
				);
			} else {
				notificationService.info(
					localize(
						"no backups",
						"Local backups folder does not exist",
					),
				);
			}
		}
	},
);

registerAction2(
	class DownloadSyncActivityAction extends Action2 {
		constructor() {
			super(DOWNLOAD_ACTIVITY_ACTION_DESCRIPTOR);
		}

		async run(accessor: ServicesAccessor): Promise<void> {
			const userDataSyncWorkbenchService = accessor.get(
				IUserDataSyncWorkbenchService,
			);
			const notificationService = accessor.get(INotificationService);
			const hostService = accessor.get(INativeHostService);
			const folder =
				await userDataSyncWorkbenchService.downloadSyncActivity();
			if (folder) {
				notificationService.prompt(
					Severity.Info,
					localize(
						"download sync activity complete",
						"Successfully downloaded Settings Sync activity.",
					),
					[
						{
							label: localize("open", "Open Folder"),
							run: () =>
								hostService.showItemInFolder(folder.fsPath),
						},
					],
				);
			}
		}
	},
);
