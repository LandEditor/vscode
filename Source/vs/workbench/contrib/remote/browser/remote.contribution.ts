/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Registry } from "vs/platform/registry/common/platform";
import {
	type IWorkbenchContributionsRegistry,
	Extensions as WorkbenchExtensions,
	WorkbenchPhase,
	registerWorkbenchContribution2,
} from "vs/workbench/common/contributions";
import {
	RemoteAgentConnectionStatusListener,
	RemoteMarkers,
} from "vs/workbench/contrib/remote/browser/remote";
import { InitialRemoteConnectionHealthContribution } from "vs/workbench/contrib/remote/browser/remoteConnectionHealth";
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
registerWorkbenchContribution2(
	ShowCandidateContribution.ID,
	ShowCandidateContribution,
	WorkbenchPhase.BlockRestore,
);
registerWorkbenchContribution2(
	TunnelFactoryContribution.ID,
	TunnelFactoryContribution,
	WorkbenchPhase.BlockRestore,
);
workbenchContributionsRegistry.registerWorkbenchContribution(
	RemoteAgentConnectionStatusListener,
	LifecyclePhase.Eventually,
);
registerWorkbenchContribution2(
	RemoteStatusIndicator.ID,
	RemoteStatusIndicator,
	WorkbenchPhase.BlockStartup,
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
workbenchContributionsRegistry.registerWorkbenchContribution(
	InitialRemoteConnectionHealthContribution,
	LifecyclePhase.Restored,
);
