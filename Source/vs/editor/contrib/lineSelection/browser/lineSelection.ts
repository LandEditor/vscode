/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KeyCode, KeyMod } from "../../../../base/common/keyCodes.js";
import * as nls from "../../../../nls.js";
import { KeybindingWeight } from "../../../../platform/keybinding/common/keybindingsRegistry.js";
import type { ICodeEditor } from "../../../browser/editorBrowser.js";
import {
	EditorAction,
	registerEditorAction,
	type ServicesAccessor,
} from "../../../browser/editorExtensions.js";
import { CursorMoveCommands } from "../../../common/cursor/cursorMoveCommands.js";
import { CursorChangeReason } from "../../../common/cursorEvents.js";
import { EditorContextKeys } from "../../../common/editorContextKeys.js";

export class ExpandLineSelectionAction extends EditorAction {
	constructor() {
		super({
			id: "expandLineSelection",
			label: nls.localize("expandLineSelection", "Expand Line Selection"),
			alias: "Expand Line Selection",
			precondition: undefined,
			kbOpts: {
				weight: KeybindingWeight.EditorCore,
				kbExpr: EditorContextKeys.textInputFocus,
				primary: KeyMod.CtrlCmd | KeyCode.KeyL,
			},
		});
	}

	public run(
		_accessor: ServicesAccessor,
		editor: ICodeEditor,
		args: any,
	): void {
		args = args || {};
		if (!editor.hasModel()) {
			return;
		}
		const viewModel = editor._getViewModel();
		viewModel.model.pushStackElement();
		viewModel.setCursorStates(
			args.source,
			CursorChangeReason.Explicit,
			CursorMoveCommands.expandLineSelection(
				viewModel,
				viewModel.getCursorStates(),
			),
		);
		viewModel.revealAllCursors(args.source, true);
	}
}

registerEditorAction(ExpandLineSelectionAction);
