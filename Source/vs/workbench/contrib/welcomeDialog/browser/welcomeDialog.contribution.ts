/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { RunOnceScheduler } from "vs/base/common/async";
import { Disposable } from "vs/base/common/lifecycle";
import { ICodeEditorService } from "vs/editor/browser/services/codeEditorService";
import { localize } from "vs/nls";
import { ICommandService } from "vs/platform/commands/common/commands";
import { IConfigurationService } from "vs/platform/configuration/common/configuration";
import {
	ConfigurationScope,
	Extensions as ConfigurationExtensions,
	IConfigurationRegistry,
} from "vs/platform/configuration/common/configurationRegistry";
import {
	ContextKeyExpr,
	IContextKeyService,
} from "vs/platform/contextkey/common/contextkey";
import { IInstantiationService } from "vs/platform/instantiation/common/instantiation";
import { IOpenerService } from "vs/platform/opener/common/opener";
import { Registry } from "vs/platform/registry/common/platform";
import {
	IStorageService,
	StorageScope,
} from "vs/platform/storage/common/storage";
import { ITelemetryService } from "vs/platform/telemetry/common/telemetry";
import { applicationConfigurationNodeBase } from "vs/workbench/common/configuration";
import {
	Extensions as WorkbenchExtensions,
	IWorkbenchContribution,
	IWorkbenchContributionsRegistry,
} from "vs/workbench/common/contributions";
import { WelcomeWidget } from "vs/workbench/contrib/welcomeDialog/browser/welcomeWidget";
import { IEditorService } from "vs/workbench/services/editor/common/editorService";
import { IBrowserWorkbenchEnvironmentService } from "vs/workbench/services/environment/browser/environmentService";
import { LifecyclePhase } from "vs/workbench/services/lifecycle/common/lifecycle";

const configurationKey = "workbench.welcome.experimental.dialog";

class WelcomeDialogContribution
	extends Disposable
	implements IWorkbenchContribution
{
	private isRendered = false;

	constructor(
		@IStorageService storageService: IStorageService,
		@IBrowserWorkbenchEnvironmentService
		environmentService: IBrowserWorkbenchEnvironmentService,
		@IConfigurationService configurationService: IConfigurationService,
		@IContextKeyService readonly contextService: IContextKeyService,
		@ICodeEditorService readonly codeEditorService: ICodeEditorService,
		@IInstantiationService
		readonly instantiationService: IInstantiationService,
		@ICommandService readonly commandService: ICommandService,
		@ITelemetryService readonly telemetryService: ITelemetryService,
		@IOpenerService readonly openerService: IOpenerService,
		@IEditorService readonly editorService: IEditorService
	) {
		super();

		if (!storageService.isNew(StorageScope.APPLICATION)) {
			return; // do not show if this is not the first session
		}

		const setting = configurationService.inspect<boolean>(configurationKey);
		if (!setting.value) {
			return;
		}

		const welcomeDialog = environmentService.options?.welcomeDialog;
		if (!welcomeDialog) {
			return;
		}

		this._register(
			editorService.onDidActiveEditorChange(() => {
				if (!this.isRendered) {
					const codeEditor = codeEditorService.getActiveCodeEditor();
					if (codeEditor?.hasModel()) {
						const scheduler = new RunOnceScheduler(() => {
							const notificationsVisible =
								contextService.contextMatchesRules(
									ContextKeyExpr.deserialize(
										"notificationCenterVisible"
									)
								) ||
								contextService.contextMatchesRules(
									ContextKeyExpr.deserialize(
										"notificationToastsVisible"
									)
								);
							if (
								codeEditor ===
									codeEditorService.getActiveCodeEditor() &&
								!notificationsVisible
							) {
								this.isRendered = true;

								const welcomeWidget = new WelcomeWidget(
									codeEditor,
									instantiationService,
									commandService,
									telemetryService,
									openerService
								);

								welcomeWidget.render(
									welcomeDialog.title,
									welcomeDialog.message,
									welcomeDialog.buttonText,
									welcomeDialog.buttonCommand
								);
							}
						}, 3000);

						this._register(
							codeEditor.onDidChangeModelContent((e) => {
								if (!this.isRendered) {
									scheduler.schedule();
								}
							})
						);
					}
				}
			})
		);
	}
}

Registry.as<IWorkbenchContributionsRegistry>(
	WorkbenchExtensions.Workbench,
).registerWorkbenchContribution(
	WelcomeDialogContribution,
	LifecyclePhase.Eventually,
);

const configurationRegistry = Registry.as<IConfigurationRegistry>(
	ConfigurationExtensions.Configuration,
);
configurationRegistry.registerConfiguration({
	...applicationConfigurationNodeBase,
	properties: {
		"workbench.welcome.experimental.dialog": {
			scope: ConfigurationScope.APPLICATION,
			type: "boolean",
			default: false,
			tags: ["experimental"],
			description: localize(
				"workbench.welcome.dialog",
				"When enabled, a welcome widget is shown in the editor",
			),
		},
	},
});
