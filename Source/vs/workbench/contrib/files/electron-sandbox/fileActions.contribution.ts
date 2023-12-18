/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KeyChord, KeyCode, KeyMod } from "vs/base/common/keyCodes";
import { Schemas } from "vs/base/common/network";
import { isMacintosh, isWindows } from "vs/base/common/platform";
import { URI } from "vs/base/common/uri";
import { EditorContextKeys } from "vs/editor/common/editorContextKeys";
import * as nls from "vs/nls";
import { MenuId, MenuRegistry } from "vs/platform/actions/common/actions";
import { ContextKeyExpr } from "vs/platform/contextkey/common/contextkey";
import { ServicesAccessor } from "vs/platform/instantiation/common/instantiation";
import {
	KeybindingWeight,
	KeybindingsRegistry,
} from "vs/platform/keybinding/common/keybindingsRegistry";
import { IListService } from "vs/platform/list/browser/listService";
import { INativeHostService } from "vs/platform/native/common/native";
import { IWorkspaceContextService } from "vs/platform/workspace/common/workspace";
import { ResourceContextKey } from "vs/workbench/common/contextkeys";
import {
	EditorResourceAccessor,
	SideBySideEditor,
} from "vs/workbench/common/editor";
import {
	appendEditorTitleContextMenuItem,
	appendToCommandPalette,
} from "vs/workbench/contrib/files/browser/fileActions.contribution";
import {
	IExplorerService,
	getMultiSelectedResources,
} from "vs/workbench/contrib/files/browser/files";
import { revealResourcesInOS } from "vs/workbench/contrib/files/electron-sandbox/fileCommands";
import { IEditorService } from "vs/workbench/services/editor/common/editorService";

const REVEAL_IN_OS_COMMAND_ID = "revealFileInOS";
const REVEAL_IN_OS_LABEL = isWindows
	? nls.localize("revealInWindows", "Reveal in File Explorer")
	: isMacintosh
	  ? nls.localize("revealInMac", "Reveal in Finder")
	  : nls.localize("openContainer", "Open Containing Folder");
const REVEAL_IN_OS_WHEN_CONTEXT = ContextKeyExpr.or(
	ResourceContextKey.Scheme.isEqualTo(Schemas.file),
	ResourceContextKey.Scheme.isEqualTo(Schemas.vscodeUserData),
);

KeybindingsRegistry.registerCommandAndKeybindingRule({
	id: REVEAL_IN_OS_COMMAND_ID,
	weight: KeybindingWeight.WorkbenchContrib,
	when: EditorContextKeys.focus.toNegated(),
	primary: KeyMod.CtrlCmd | KeyMod.Alt | KeyCode.KeyR,
	win: {
		primary: KeyMod.Shift | KeyMod.Alt | KeyCode.KeyR,
	},
	handler: (accessor: ServicesAccessor, resource: URI | object) => {
		const resources = getMultiSelectedResources(
			resource,
			accessor.get(IListService),
			accessor.get(IEditorService),
			accessor.get(IExplorerService),
		);
		revealResourcesInOS(
			resources,
			accessor.get(INativeHostService),
			accessor.get(IWorkspaceContextService),
		);
	},
});

const REVEAL_ACTIVE_FILE_IN_OS_COMMAND_ID =
	"workbench.action.files.revealActiveFileInWindows";

KeybindingsRegistry.registerCommandAndKeybindingRule({
	weight: KeybindingWeight.WorkbenchContrib,
	when: undefined,
	primary: KeyChord(KeyMod.CtrlCmd | KeyCode.KeyK, KeyCode.KeyR),
	id: REVEAL_ACTIVE_FILE_IN_OS_COMMAND_ID,
	handler: (accessor: ServicesAccessor) => {
		const editorService = accessor.get(IEditorService);
		const activeInput = editorService.activeEditor;
		const resource = EditorResourceAccessor.getOriginalUri(activeInput, {
			filterByScheme: Schemas.file,
			supportSideBySide: SideBySideEditor.PRIMARY,
		});
		const resources = resource ? [resource] : [];
		revealResourcesInOS(
			resources,
			accessor.get(INativeHostService),
			accessor.get(IWorkspaceContextService),
		);
	},
});

appendEditorTitleContextMenuItem(
	REVEAL_IN_OS_COMMAND_ID,
	REVEAL_IN_OS_LABEL,
	REVEAL_IN_OS_WHEN_CONTEXT,
	"2_files",
	0,
);

// Menu registration - open editors

const revealInOsCommand = {
	id: REVEAL_IN_OS_COMMAND_ID,
	title: REVEAL_IN_OS_LABEL,
};
MenuRegistry.appendMenuItem(MenuId.OpenEditorsContext, {
	group: "navigation",
	order: 20,
	command: revealInOsCommand,
	when: REVEAL_IN_OS_WHEN_CONTEXT,
});
MenuRegistry.appendMenuItem(MenuId.OpenEditorsContextShare, {
	title: nls.localize("miShare", "Share"),
	submenu: MenuId.MenubarShare,
	group: "share",
	order: 3,
});

// Menu registration - explorer

MenuRegistry.appendMenuItem(MenuId.ExplorerContext, {
	group: "navigation",
	order: 20,
	command: revealInOsCommand,
	when: REVEAL_IN_OS_WHEN_CONTEXT,
});

// Command Palette

const category = {
	value: nls.localize("filesCategory", "File"),
	original: "File",
};
appendToCommandPalette(
	{
		id: REVEAL_IN_OS_COMMAND_ID,
		title: {
			value: REVEAL_IN_OS_LABEL,
			original: isWindows
				? "Reveal in File Explorer"
				: isMacintosh
				  ? "Reveal in Finder"
				  : "Open Containing Folder",
		},
		category: category,
	},
	REVEAL_IN_OS_WHEN_CONTEXT,
);
