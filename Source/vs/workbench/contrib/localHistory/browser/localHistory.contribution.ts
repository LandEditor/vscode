/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Registry } from "vs/platform/registry/common/platform";
import {
	Extensions as WorkbenchExtensions,
	IWorkbenchContributionsRegistry,
} from "vs/workbench/common/contributions";
import "vs/workbench/contrib/localHistory/browser/localHistoryCommands";
import { LocalHistoryTimeline } from "vs/workbench/contrib/localHistory/browser/localHistoryTimeline";
import { LifecyclePhase } from "vs/workbench/services/lifecycle/common/lifecycle";

// Register Local History Timeline
Registry.as<IWorkbenchContributionsRegistry>(
	WorkbenchExtensions.Workbench,
).registerWorkbenchContribution(LocalHistoryTimeline, LifecyclePhase.Ready);
