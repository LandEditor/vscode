/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Registry } from "vs/platform/registry/common/platform";
import {
	type IWorkbenchContributionsRegistry,
	Extensions as WorkbenchExtensions,
} from "vs/workbench/common/contributions";
import { RemoteStartEntry } from "vs/workbench/contrib/remote/browser/remoteStartEntry";
import { LifecyclePhase } from "vs/workbench/services/lifecycle/common/lifecycle";

Registry.as<IWorkbenchContributionsRegistry>(
	WorkbenchExtensions.Workbench,
).registerWorkbenchContribution(RemoteStartEntry, LifecyclePhase.Restored);
