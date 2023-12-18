/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IInstantiationService } from "vs/platform/instantiation/common/instantiation";
import { Registry } from "vs/platform/registry/common/platform";
import {
	Extensions as WorkbenchExtensions,
	IWorkbenchContribution,
	IWorkbenchContributionsRegistry,
} from "vs/workbench/common/contributions";
import { DefaultConfigurationExportHelper } from "vs/workbench/contrib/configExporter/electron-sandbox/configurationExportHelper";
import { INativeWorkbenchEnvironmentService } from "vs/workbench/services/environment/electron-sandbox/environmentService";
import { LifecyclePhase } from "vs/workbench/services/lifecycle/common/lifecycle";

export class ExtensionPoints implements IWorkbenchContribution {
	constructor(
		@IInstantiationService instantiationService: IInstantiationService,
		@INativeWorkbenchEnvironmentService
		environmentService: INativeWorkbenchEnvironmentService,
	) {
		// Config Exporter
		if (environmentService.args["export-default-configuration"]) {
			instantiationService.createInstance(
				DefaultConfigurationExportHelper,
			);
		}
	}
}

Registry.as<IWorkbenchContributionsRegistry>(
	WorkbenchExtensions.Workbench,
).registerWorkbenchContribution(ExtensionPoints, LifecyclePhase.Restored);
