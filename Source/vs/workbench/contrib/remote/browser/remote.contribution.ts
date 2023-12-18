/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Registry } from "vs/platform/registry/common/platform";
import {
	Extensions as WorkbenchExtensions,
	IWorkbenchContributionsRegistry,
} from "vs/workbench/common/contributions";
import {
	RemoteAgentConnectionStatusListener,
	RemoteMarkers,
} from "vs/workbench/contrib/remote/browser/remote";
import {
	AutomaticPortForwarding,
	ForwardedPortsView,
	PortRestore,
} from "vs/workbench/contrib/remote/browser/remoteExplorer";
import { RemoteStatusIndicator } from "vs/workbench/contrib/remote/browser/remoteIndicator";
import { ShowCandidateContribution } from "vs/workbench/contrib/remote/browser/showCandidate";
import { TunnelFactoryContribution } from "vs/workbench/contrib/remote/browser/tunnelFactory";
import { LifecyclePhase } from "vs/workbench/services/lifecycle/common/lifecycle";

const workbenchContributionsRegistry =
	Registry.as<IWorkbenchContributionsRegistry>(WorkbenchExtensions.Workbench);
workbenchContributionsRegistry.registerWorkbenchContribution(
	ShowCandidateContribution,
	LifecyclePhase.Ready,
);
workbenchContributionsRegistry.registerWorkbenchContribution(
	TunnelFactoryContribution,
	LifecyclePhase.Ready,
);
workbenchContributionsRegistry.registerWorkbenchContribution(
	RemoteAgentConnectionStatusListener,
	LifecyclePhase.Eventually,
);
workbenchContributionsRegistry.registerWorkbenchContribution(
	RemoteStatusIndicator,
	LifecyclePhase.Starting,
);
workbenchContributionsRegistry.registerWorkbenchContribution(
	ForwardedPortsView,
	LifecyclePhase.Restored,
);
workbenchContributionsRegistry.registerWorkbenchContribution(
	PortRestore,
	LifecyclePhase.Eventually,
);
workbenchContributionsRegistry.registerWorkbenchContribution(
	AutomaticPortForwarding,
	LifecyclePhase.Eventually,
);
workbenchContributionsRegistry.registerWorkbenchContribution(
	RemoteMarkers,
	LifecyclePhase.Eventually,
);
