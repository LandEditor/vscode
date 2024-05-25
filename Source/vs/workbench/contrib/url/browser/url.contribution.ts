/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { URI } from "vs/base/common/uri";
import { localize, localize2 } from "vs/nls";
import { Categories } from "vs/platform/action/common/actionCommonCategories";
import {
	Action2,
	MenuId,
	MenuRegistry,
	registerAction2,
} from "vs/platform/actions/common/actions";
import { CommandsRegistry } from "vs/platform/commands/common/commands";
import {
	Extensions as ConfigurationExtensions,
	ConfigurationScope,
	type IConfigurationRegistry,
} from "vs/platform/configuration/common/configurationRegistry";
import {
	InstantiationType,
	registerSingleton,
} from "vs/platform/instantiation/common/extensions";
import type { ServicesAccessor } from "vs/platform/instantiation/common/instantiation";
import { IQuickInputService } from "vs/platform/quickinput/common/quickInput";
import { Registry } from "vs/platform/registry/common/platform";
import { IURLService } from "vs/platform/url/common/url";
import { workbenchConfigurationNodeBase } from "vs/workbench/common/configuration";
import {
	type IWorkbenchContributionsRegistry,
	Extensions as WorkbenchExtensions,
	WorkbenchPhase,
	registerWorkbenchContribution2,
} from "vs/workbench/common/contributions";
import { ExternalUriResolverContribution } from "vs/workbench/contrib/url/browser/externalUriResolver";
import {
	ITrustedDomainService,
	TrustedDomainService,
} from "vs/workbench/contrib/url/browser/trustedDomainService";
import { manageTrustedDomainSettingsCommand } from "vs/workbench/contrib/url/browser/trustedDomains";
import { TrustedDomainsFileSystemProvider } from "vs/workbench/contrib/url/browser/trustedDomainsFileSystemProvider";
import { OpenerValidatorContributions } from "vs/workbench/contrib/url/browser/trustedDomainsValidator";
import { LifecyclePhase } from "vs/workbench/services/lifecycle/common/lifecycle";

class OpenUrlAction extends Action2 {
	constructor() {
		super({
			id: "workbench.action.url.openUrl",
			title: localize2("openUrl", "Open URL"),
			category: Categories.Developer,
			f1: true,
		});
	}

	async run(accessor: ServicesAccessor): Promise<void> {
		const quickInputService = accessor.get(IQuickInputService);
		const urlService = accessor.get(IURLService);

		return quickInputService
			.input({ prompt: localize("urlToOpen", "URL to open") })
			.then((input) => {
				if (input) {
					const uri = URI.parse(input);
					urlService.open(uri, { originalUrl: input });
				}
			});
	}
}

registerAction2(OpenUrlAction);

/**
 * Trusted Domains Contribution
 */

CommandsRegistry.registerCommand(manageTrustedDomainSettingsCommand);
MenuRegistry.appendMenuItem(MenuId.CommandPalette, {
	command: {
		id: manageTrustedDomainSettingsCommand.id,
		title: manageTrustedDomainSettingsCommand.description.description,
	},
});

Registry.as<IWorkbenchContributionsRegistry>(
	WorkbenchExtensions.Workbench,
).registerWorkbenchContribution(
	OpenerValidatorContributions,
	LifecyclePhase.Restored,
);
registerWorkbenchContribution2(
	TrustedDomainsFileSystemProvider.ID,
	TrustedDomainsFileSystemProvider,
	WorkbenchPhase.BlockRestore, // registration only
);
registerWorkbenchContribution2(
	ExternalUriResolverContribution.ID,
	ExternalUriResolverContribution,
	WorkbenchPhase.BlockRestore, // registration only
);

const configurationRegistry = Registry.as<IConfigurationRegistry>(
	ConfigurationExtensions.Configuration,
);
configurationRegistry.registerConfiguration({
	...workbenchConfigurationNodeBase,
	properties: {
		"workbench.trustedDomains.promptInTrustedWorkspace": {
			scope: ConfigurationScope.APPLICATION,
			type: "boolean",
			default: false,
			description: localize(
				"workbench.trustedDomains.promptInTrustedWorkspace",
				"When enabled, trusted domain prompts will appear when opening links in trusted workspaces.",
			),
		},
	},
});

registerSingleton(
	ITrustedDomainService,
	TrustedDomainService,
	InstantiationType.Delayed,
);
