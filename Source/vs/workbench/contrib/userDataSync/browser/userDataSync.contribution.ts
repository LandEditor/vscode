/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from "vs/base/common/actions";
import { Disposable } from "vs/base/common/lifecycle";
import { isWeb } from "vs/base/common/platform";
import { localize } from "vs/nls";
import { ICommandService } from "vs/platform/commands/common/commands";
import {
	INotificationService,
	Severity,
} from "vs/platform/notification/common/notification";
import { IProductService } from "vs/platform/product/common/productService";
import { Registry } from "vs/platform/registry/common/platform";
import {
	IUserDataAutoSyncService,
	UserDataSyncError,
	UserDataSyncErrorCode,
} from "vs/platform/userDataSync/common/userDataSync";
import {
	Extensions as WorkbenchExtensions,
	IWorkbenchContribution,
	IWorkbenchContributionsRegistry,
} from "vs/workbench/common/contributions";
import { UserDataSyncWorkbenchContribution } from "vs/workbench/contrib/userDataSync/browser/userDataSync";
import { UserDataSyncTrigger } from "vs/workbench/contrib/userDataSync/browser/userDataSyncTrigger";
import { IHostService } from "vs/workbench/services/host/browser/host";
import { LifecyclePhase } from "vs/workbench/services/lifecycle/common/lifecycle";
import { SHOW_SYNC_LOG_COMMAND_ID } from "vs/workbench/services/userDataSync/common/userDataSync";

class UserDataSyncReportIssueContribution
	extends Disposable
	implements IWorkbenchContribution
{
	constructor(
		@IUserDataAutoSyncService
		userDataAutoSyncService: IUserDataAutoSyncService,
		@INotificationService
		private readonly notificationService: INotificationService,
		@IProductService private readonly productService: IProductService,
		@ICommandService private readonly commandService: ICommandService,
		@IHostService private readonly hostService: IHostService
	) {
		super();
		this._register(
			userDataAutoSyncService.onError((error) =>
				this.onAutoSyncError(error)
			)
		);
	}

	private onAutoSyncError(error: UserDataSyncError): void {
		switch (error.code) {
			case UserDataSyncErrorCode.LocalTooManyRequests: {
				const message = isWeb
					? localize(
							{
								key: "local too many requests - reload",
								comment: [
									"Settings Sync is the name of the feature",
								],
							},
							"Settings sync is suspended temporarily because the current device is making too many requests. Please reload {0} to resume.",
							this.productService.nameLong,
					  )
					: localize(
							{
								key: "local too many requests - restart",
								comment: [
									"Settings Sync is the name of the feature",
								],
							},
							"Settings sync is suspended temporarily because the current device is making too many requests. Please restart {0} to resume.",
							this.productService.nameLong,
					  );
				this.notificationService.notify({
					severity: Severity.Error,
					message,
					actions: {
						primary: [
							new Action(
								"Show Sync Logs",
								localize("show sync logs", "Show Log"),
								undefined,
								true,
								() =>
									this.commandService.executeCommand(
										SHOW_SYNC_LOG_COMMAND_ID,
									),
							),
							new Action(
								"Restart",
								isWeb
									? localize("reload", "Reload")
									: localize("restart", "Restart"),
								undefined,
								true,
								() => this.hostService.restart(),
							),
						],
					},
				});
				return;
			}
			case UserDataSyncErrorCode.TooManyRequests: {
				const operationId = error.operationId
					? localize(
							"operationId",
							"Operation Id: {0}",
							error.operationId,
					  )
					: undefined;
				const message = localize(
					{
						key: "server too many requests",
						comment: ["Settings Sync is the name of the feature"],
					},
					"Settings sync is disabled because the current device is making too many requests. Please wait for 10 minutes and turn on sync.",
				);
				this.notificationService.notify({
					severity: Severity.Error,
					message: operationId
						? `${message} ${operationId}`
						: message,
					source: error.operationId
						? localize(
								"settings sync",
								"Settings Sync. Operation Id: {0}",
								error.operationId,
						  )
						: undefined,
					actions: {
						primary: [
							new Action(
								"Show Sync Logs",
								localize("show sync logs", "Show Log"),
								undefined,
								true,
								() =>
									this.commandService.executeCommand(
										SHOW_SYNC_LOG_COMMAND_ID,
									),
							),
						],
					},
				});
				return;
			}
		}
	}
}

const workbenchRegistry = Registry.as<IWorkbenchContributionsRegistry>(
	WorkbenchExtensions.Workbench,
);
workbenchRegistry.registerWorkbenchContribution(
	UserDataSyncWorkbenchContribution,
	LifecyclePhase.Restored,
);
workbenchRegistry.registerWorkbenchContribution(
	UserDataSyncTrigger,
	LifecyclePhase.Eventually,
);
workbenchRegistry.registerWorkbenchContribution(
	UserDataSyncReportIssueContribution,
	LifecyclePhase.Eventually,
);
