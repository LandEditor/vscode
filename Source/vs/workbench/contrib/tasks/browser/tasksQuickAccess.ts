/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationToken } from "vs/base/common/cancellation";
import { matchesFuzzy } from "vs/base/common/filters";
import { DisposableStore } from "vs/base/common/lifecycle";
import { isString } from "vs/base/common/types";
import { localize } from "vs/nls";
import { IConfigurationService } from "vs/platform/configuration/common/configuration";
import { IDialogService } from "vs/platform/dialogs/common/dialogs";
import { INotificationService } from "vs/platform/notification/common/notification";
import {
	IPickerQuickAccessItem,
	PickerQuickAccessProvider,
	TriggerAction,
} from "vs/platform/quickinput/browser/pickerQuickAccess";
import {
	IQuickInputService,
	IQuickPickSeparator,
} from "vs/platform/quickinput/common/quickInput";
import { IStorageService } from "vs/platform/storage/common/storage";
import { IThemeService } from "vs/platform/theme/common/themeService";
import {
	ITaskTwoLevelQuickPickEntry,
	TaskQuickPick,
} from "vs/workbench/contrib/tasks/browser/taskQuickPick";
import {
	ITaskService,
	Task,
} from "vs/workbench/contrib/tasks/common/taskService";
import {
	ConfiguringTask,
	ContributedTask,
	CustomTask,
} from "vs/workbench/contrib/tasks/common/tasks";
import { IExtensionService } from "vs/workbench/services/extensions/common/extensions";

export class TasksQuickAccessProvider extends PickerQuickAccessProvider<IPickerQuickAccessItem> {
	static PREFIX = "task ";

	constructor(
		@IExtensionService extensionService: IExtensionService,
		@ITaskService private _taskService: ITaskService,
		@IConfigurationService
		private _configurationService: IConfigurationService,
		@IQuickInputService private _quickInputService: IQuickInputService,
		@INotificationService
		private _notificationService: INotificationService,
		@IDialogService private _dialogService: IDialogService,
		@IThemeService private _themeService: IThemeService,
		@IStorageService private _storageService: IStorageService
	) {
		super(TasksQuickAccessProvider.PREFIX, {
			noResultsPick: {
				label: localize("noTaskResults", "No matching tasks"),
			},
		});
	}

	protected async _getPicks(
		filter: string,
		disposables: DisposableStore,
		token: CancellationToken,
	): Promise<Array<IPickerQuickAccessItem | IQuickPickSeparator>> {
		if (token.isCancellationRequested) {
			return [];
		}

		const taskQuickPick = new TaskQuickPick(
			this._taskService,
			this._configurationService,
			this._quickInputService,
			this._notificationService,
			this._themeService,
			this._dialogService,
			this._storageService,
		);
		const topLevelPicks = await taskQuickPick.getTopLevelEntries();
		const taskPicks: Array<IPickerQuickAccessItem | IQuickPickSeparator> =
			[];

		for (const entry of topLevelPicks.entries) {
			const highlights = matchesFuzzy(filter, entry.label!);
			if (!highlights) {
				continue;
			}

			if (entry.type === "separator") {
				taskPicks.push(entry);
			}

			const task: Task | ConfiguringTask | string = (<
				ITaskTwoLevelQuickPickEntry
			>entry).task!;
			const quickAccessEntry: IPickerQuickAccessItem = <
				ITaskTwoLevelQuickPickEntry
			>entry;
			quickAccessEntry.highlights = { label: highlights };
			quickAccessEntry.trigger = (index) => {
				if (index === 1 && quickAccessEntry.buttons?.length === 2) {
					const key =
						task && !isString(task) ? task.getKey() : undefined;
					if (key) {
						this._taskService.removeRecentlyUsedTask(key);
					}
					return TriggerAction.REFRESH_PICKER;
				} else {
					if (ContributedTask.is(task)) {
						this._taskService.customize(task, undefined, true);
					} else if (CustomTask.is(task)) {
						this._taskService.openConfig(task);
					}
					return TriggerAction.CLOSE_PICKER;
				}
			};
			quickAccessEntry.accept = async () => {
				if (isString(task)) {
					// switch to quick pick and show second level
					const showResult = await taskQuickPick.show(
						localize(
							"TaskService.pickRunTask",
							"Select the task to run",
						),
						undefined,
						task,
					);
					if (showResult) {
						this._taskService.run(showResult, {
							attachProblemMatcher: true,
						});
					}
				} else {
					this._taskService.run(await this._toTask(task), {
						attachProblemMatcher: true,
					});
				}
			};

			taskPicks.push(quickAccessEntry);
		}
		return taskPicks;
	}

	private async _toTask(
		task: Task | ConfiguringTask,
	): Promise<Task | undefined> {
		if (!ConfiguringTask.is(task)) {
			return task;
		}

		return this._taskService.tryResolveTask(task);
	}
}
