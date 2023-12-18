/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { alert } from "vs/base/browser/ui/aria/aria";
import { KeyCode, KeyMod } from "vs/base/common/keyCodes";
import "vs/css!./accessibility";
import { AccessibilityHelpNLS } from "vs/editor/common/standaloneStrings";
import * as nls from "vs/nls";
import { IAccessibilityService } from "vs/platform/accessibility/common/accessibility";
import { Action2, registerAction2 } from "vs/platform/actions/common/actions";
import {
	ConfigurationTarget,
	IConfigurationService,
} from "vs/platform/configuration/common/configuration";
import { ServicesAccessor } from "vs/platform/instantiation/common/instantiation";
import { KeybindingWeight } from "vs/platform/keybinding/common/keybindingsRegistry";
import { accessibilityHelpIsShown } from "vs/workbench/contrib/accessibility/browser/accessibilityConfiguration";

class ToggleScreenReaderMode extends Action2 {
	constructor() {
		super({
			id: "editor.action.toggleScreenReaderAccessibilityMode",
			title: {
				value: nls.localize(
					"toggleScreenReaderMode",
					"Toggle Screen Reader Accessibility Mode",
				),
				original: "Toggle Screen Reader Accessibility Mode",
			},
			f1: true,
			keybinding: [
				{
					primary: KeyMod.CtrlCmd | KeyCode.KeyE,
					weight: KeybindingWeight.WorkbenchContrib + 10,
					when: accessibilityHelpIsShown,
				},
				{
					primary: KeyMod.Alt | KeyCode.F1 | KeyMod.Shift,
					linux: { primary: KeyMod.Alt | KeyCode.F4 | KeyMod.Shift },
					weight: KeybindingWeight.WorkbenchContrib + 10,
				},
			],
		});
	}

	async run(accessor: ServicesAccessor): Promise<void> {
		const accessibiiltyService = accessor.get(IAccessibilityService);
		const configurationService = accessor.get(IConfigurationService);
		const isScreenReaderOptimized =
			accessibiiltyService.isScreenReaderOptimized();
		configurationService.updateValue(
			"editor.accessibilitySupport",
			isScreenReaderOptimized ? "off" : "on",
			ConfigurationTarget.USER,
		);
		alert(
			isScreenReaderOptimized
				? AccessibilityHelpNLS.screenReaderModeDisabled
				: AccessibilityHelpNLS.screenReaderModeEnabled,
		);
	}
}

registerAction2(ToggleScreenReaderMode);
