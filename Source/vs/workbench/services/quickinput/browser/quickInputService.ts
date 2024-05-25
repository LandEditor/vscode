/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IConfigurationService } from "vs/platform/configuration/common/configuration";
import { IContextKeyService } from "vs/platform/contextkey/common/contextkey";
import {
	InstantiationType,
	registerSingleton,
} from "vs/platform/instantiation/common/extensions";
import { IInstantiationService } from "vs/platform/instantiation/common/instantiation";
import { IKeybindingService } from "vs/platform/keybinding/common/keybinding";
import { ILayoutService } from "vs/platform/layout/browser/layoutService";
import type { QuickInputController } from "vs/platform/quickinput/browser/quickInputController";
import { QuickInputService as BaseQuickInputService } from "vs/platform/quickinput/browser/quickInputService";
import { IQuickInputService } from "vs/platform/quickinput/common/quickInput";
import { IThemeService } from "vs/platform/theme/common/themeService";
import { InQuickPickContextKey } from "vs/workbench/browser/quickaccess";

export class QuickInputService extends BaseQuickInputService {
	private readonly inQuickInputContext = InQuickPickContextKey.bindTo(
		this.contextKeyService,
	);

	constructor(
		@IConfigurationService configurationService: IConfigurationService,
		@IInstantiationService instantiationService: IInstantiationService,
		@IKeybindingService private readonly keybindingService: IKeybindingService,
		@IContextKeyService contextKeyService: IContextKeyService,
		@IThemeService themeService: IThemeService,
		@ILayoutService layoutService: ILayoutService,
	) {
		super(instantiationService, contextKeyService, themeService, layoutService, configurationService);

		this.registerListeners();
	}

	private registerListeners(): void {
		this._register(this.onShow(() => this.inQuickInputContext.set(true)));
		this._register(this.onHide(() => this.inQuickInputContext.set(false)));
	}

	protected override createController(): QuickInputController {
		return super.createController(this.layoutService, {
			ignoreFocusOut: () =>
				!this.configurationService.getValue(
					"workbench.quickOpen.closeOnFocusLost",
				),
			backKeybindingLabel: () =>
				this.keybindingService
					.lookupKeybinding("workbench.action.quickInputBack")
					?.getLabel() || undefined,
		});
	}
}

registerSingleton(
	IQuickInputService,
	QuickInputService,
	InstantiationType.Delayed,
);
