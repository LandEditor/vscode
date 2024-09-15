/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
	AccessibleContentProvider,
	AccessibleViewProviderId,
	AccessibleViewType,
} from "../../../../../platform/accessibility/browser/accessibleView.js";
import type { IAccessibleViewImplentation } from "../../../../../platform/accessibility/browser/accessibleViewRegistry.js";
import type { ServicesAccessor } from "../../../../../platform/instantiation/common/instantiation.js";
import { AccessibilityVerbositySettingId } from "../../../accessibility/browser/accessibilityConfiguration.js";
import { ITerminalService } from "../../../terminal/browser/terminal.js";
import { TerminalChatContextKeys } from "../../../terminal/terminalContribExports.js";
import { TerminalChatController } from "./terminalChatController.js";

export class TerminalInlineChatAccessibleView
	implements IAccessibleViewImplentation
{
	readonly priority = 105;
	readonly name = "terminalInlineChat";
	readonly type = AccessibleViewType.View;
	readonly when = TerminalChatContextKeys.focused;
	getProvider(accessor: ServicesAccessor) {
		const terminalService = accessor.get(ITerminalService);
		const controller: TerminalChatController | undefined =
			terminalService.activeInstance?.getContribution(
				TerminalChatController.ID,
			) ?? undefined;
		if (!controller?.lastResponseContent) {
			return;
		}
		const responseContent = controller.lastResponseContent;
		return new AccessibleContentProvider(
			AccessibleViewProviderId.TerminalChat,
			{ type: AccessibleViewType.View },
			() => {
				return responseContent;
			},
			() => {
				controller.focus();
			},
			AccessibilityVerbositySettingId.InlineChat,
		);
	}
}
