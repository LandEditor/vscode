import { KeyCode } from "vs/base/common/keyCodes";
import { registerEditorAction } from "vs/editor/browser/editorExtensions";
import { EditorContextKeys } from "vs/editor/common/editorContextKeys";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as nls from "vs/nls";
import { MenuId } from "vs/platform/actions/common/actions";
import { ContextKeyExpr } from "vs/platform/contextkey/common/contextkey";
import { KeybindingWeight } from "vs/platform/keybinding/common/keybindingsRegistry";
import { EmmetEditorAction } from "vs/workbench/contrib/emmet/browser/emmetActions";

class ExpandAbbreviationAction extends EmmetEditorAction {
	constructor() {
		super({
			id: "editor.emmet.action.expandAbbreviation",
			label: nls.localize(
				"expandAbbreviationAction",
				"Emmet: Expand Abbreviation",
			),
			alias: "Emmet: Expand Abbreviation",
			precondition: EditorContextKeys.writable,
			actionName: "expand_abbreviation",
			kbOpts: {
				primary: KeyCode.Tab,
				kbExpr: ContextKeyExpr.and(
					EditorContextKeys.editorTextFocus,
					EditorContextKeys.tabDoesNotMoveFocus,
					ContextKeyExpr.has("config.emmet.triggerExpansionOnTab"),
				),
				weight: KeybindingWeight.EditorContrib,
			},
			menuOpts: {
				menuId: MenuId.MenubarEditMenu,
				group: "5_insert",
				title: nls.localize(
					{
						key: "miEmmetExpandAbbreviation",
						comment: ["&& denotes a mnemonic"],
					},
					"Emmet: E&&xpand Abbreviation",
				),
				order: 3,
			},
		});
	}
}

registerEditorAction(ExpandAbbreviationAction);
