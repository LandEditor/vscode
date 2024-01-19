/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { URI } from "vs/base/common/uri";
import { localize } from "vs/nls";
import { IFileService } from "vs/platform/files/common/files";
import {
	InstantiationType,
	registerSingleton,
} from "vs/platform/instantiation/common/extensions";
import { ILogService } from "vs/platform/log/common/log";
import { Registry } from "vs/platform/registry/common/platform";
import {
	Extensions as WorkbenchExtensions,
	IWorkbenchContributionsRegistry,
} from "vs/workbench/common/contributions";
import { INativeWorkbenchEnvironmentService } from "vs/workbench/services/environment/electron-sandbox/environmentService";
import {
	ILifecycleService,
	LifecyclePhase,
} from "vs/workbench/services/lifecycle/common/lifecycle";
import { IWorkingCopyBackupService } from "vs/workbench/services/workingCopy/common/workingCopyBackup";
import { WorkingCopyBackupService } from "vs/workbench/services/workingCopy/common/workingCopyBackupService";
import { NativeWorkingCopyBackupTracker } from "vs/workbench/services/workingCopy/electron-sandbox/workingCopyBackupTracker";

export class NativeWorkingCopyBackupService extends WorkingCopyBackupService {
	constructor(
		@INativeWorkbenchEnvironmentService environmentService: INativeWorkbenchEnvironmentService,
		@IFileService fileService: IFileService,
		@ILogService logService: ILogService,
		@ILifecycleService private readonly lifecycleService: ILifecycleService
	) {
		super(environmentService.backupPath ? URI.file(environmentService.backupPath).with({ scheme: environmentService.userRoamingDataHome.scheme }) : undefined, fileService, logService);

		this.registerListeners();
	}

	private registerListeners(): void {
		// Lifecycle: ensure to prolong the shutdown for as long
		// as pending backup operations have not finished yet.
		// Otherwise, we risk writing partial backups to disk.
		this._register(
			this.lifecycleService.onWillShutdown((event) =>
				event.join(this.joinBackups(), {
					id: "join.workingCopyBackups",
					label: localize(
						"join.workingCopyBackups",
						"Backup working copies",
					),
				}),
			),
		);
	}
}

// Register Service
registerSingleton(
	IWorkingCopyBackupService,
	NativeWorkingCopyBackupService,
	InstantiationType.Eager,
);

// Register Backup Tracker
Registry.as<IWorkbenchContributionsRegistry>(
	WorkbenchExtensions.Workbench,
).registerWorkbenchContribution(
	NativeWorkingCopyBackupTracker,
	LifecyclePhase.Starting,
);
