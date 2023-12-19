/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { mnemonicButtonLabel } from "vs/base/common/labels";
import { isWindows } from "vs/base/common/platform";
import { URI } from "vs/base/common/uri";
import { localize } from "vs/nls";
import { Categories } from "vs/platform/action/common/actionCommonCategories";
import {
	Action2,
	MenuId,
	registerAction2,
} from "vs/platform/actions/common/actions";
import { ContextKeyExpr } from "vs/platform/contextkey/common/contextkey";
import { IsWebContext } from "vs/platform/contextkey/common/contextkeys";
import { IFileDialogService } from "vs/platform/dialogs/common/dialogs";
import {
	IInstantiationService,
	ServicesAccessor,
} from "vs/platform/instantiation/common/instantiation";
import { IOpenerService } from "vs/platform/opener/common/opener";
import product from "vs/platform/product/common/product";
import { IProductService } from "vs/platform/product/common/productService";
import { Registry } from "vs/platform/registry/common/platform";
import { IUpdateService, StateType } from "vs/platform/update/common/update";
import "vs/platform/update/common/update.config.contribution";
import {
	Extensions as WorkbenchExtensions,
	IWorkbenchContributionsRegistry,
} from "vs/workbench/common/contributions";
import {
	CONTEXT_UPDATE_STATE,
	DOWNLOAD_URL,
	ProductContribution,
	RELEASE_NOTES_URL,
	SwitchProductQualityContribution,
	UpdateContribution,
	showReleaseNotesInEditor,
} from "vs/workbench/contrib/update/browser/update";
import { ShowCurrentReleaseNotesActionId } from "vs/workbench/contrib/update/common/update";
import { LifecyclePhase } from "vs/workbench/services/lifecycle/common/lifecycle";

const workbench = Registry.as<IWorkbenchContributionsRegistry>(
	WorkbenchExtensions.Workbench,
);

workbench.registerWorkbenchContribution(
	ProductContribution,
	LifecyclePhase.Restored,
);
workbench.registerWorkbenchContribution(
	UpdateContribution,
	LifecyclePhase.Restored,
);
workbench.registerWorkbenchContribution(
	SwitchProductQualityContribution,
	LifecyclePhase.Restored,
);

// Release notes

export class ShowCurrentReleaseNotesAction extends Action2 {
	constructor() {
		super({
			id: ShowCurrentReleaseNotesActionId,
			title: {
				value: localize("showReleaseNotes", "Show Release Notes"),
				mnemonicTitle: localize(
					{
						key: "mshowReleaseNotes",
						comment: ["&& denotes a mnemonic"],
					},
					"Show &&Release Notes",
				),
				original: "Show Release Notes",
			},
			category: { value: product.nameShort, original: product.nameShort },
			f1: true,
			precondition: RELEASE_NOTES_URL,
			menu: [
				{
					id: MenuId.MenubarHelpMenu,
					group: "1_welcome",
					order: 5,
					when: RELEASE_NOTES_URL,
				},
			],
		});
	}

	async run(accessor: ServicesAccessor): Promise<void> {
		const instantiationService = accessor.get(IInstantiationService);
		const productService = accessor.get(IProductService);
		const openerService = accessor.get(IOpenerService);

		try {
			await showReleaseNotesInEditor(
				instantiationService,
				productService.version,
			);
		} catch (err) {
			if (productService.releaseNotesUrl) {
				await openerService.open(
					URI.parse(productService.releaseNotesUrl),
				);
			} else {
				throw new Error(
					localize(
						"update.noReleaseNotesOnline",
						"This version of {0} does not have release notes online",
						productService.nameLong,
					),
				);
			}
		}
	}
}

registerAction2(ShowCurrentReleaseNotesAction);

// Update

export class CheckForUpdateAction extends Action2 {
	constructor() {
		super({
			id: "update.checkForUpdate",
			title: {
				value: localize("checkForUpdates", "Check for Updates..."),
				original: "Check for Updates...",
			},
			category: { value: product.nameShort, original: product.nameShort },
			f1: true,
			precondition: CONTEXT_UPDATE_STATE.isEqualTo(StateType.Idle),
		});
	}

	async run(accessor: ServicesAccessor): Promise<void> {
		const updateService = accessor.get(IUpdateService);
		return updateService.checkForUpdates(true);
	}
}

class DownloadUpdateAction extends Action2 {
	constructor() {
		super({
			id: "update.downloadUpdate",
			title: {
				value: localize("downloadUpdate", "Download Update"),
				original: "Download Update",
			},
			category: { value: product.nameShort, original: product.nameShort },
			f1: true,
			precondition: CONTEXT_UPDATE_STATE.isEqualTo(
				StateType.AvailableForDownload,
			),
		});
	}

	async run(accessor: ServicesAccessor): Promise<void> {
		await accessor.get(IUpdateService).downloadUpdate();
	}
}

class InstallUpdateAction extends Action2 {
	constructor() {
		super({
			id: "update.installUpdate",
			title: {
				value: localize("installUpdate", "Install Update"),
				original: "Install Update",
			},
			category: { value: product.nameShort, original: product.nameShort },
			f1: true,
			precondition: CONTEXT_UPDATE_STATE.isEqualTo(StateType.Downloaded),
		});
	}

	async run(accessor: ServicesAccessor): Promise<void> {
		await accessor.get(IUpdateService).applyUpdate();
	}
}

class RestartToUpdateAction extends Action2 {
	constructor() {
		super({
			id: "update.restartToUpdate",
			title: {
				value: localize("restartToUpdate", "Restart to Update"),
				original: "Restart to Update",
			},
			category: { value: product.nameShort, original: product.nameShort },
			f1: true,
			precondition: CONTEXT_UPDATE_STATE.isEqualTo(StateType.Ready),
		});
	}

	async run(accessor: ServicesAccessor): Promise<void> {
		await accessor.get(IUpdateService).quitAndInstall();
	}
}

class DownloadAction extends Action2 {
	static readonly ID = "workbench.action.download";

	constructor() {
		super({
			id: DownloadAction.ID,
			title: {
				value: localize(
					"openDownloadPage",
					"Download {0}",
					product.nameLong,
				),
				original: `Download ${product.downloadUrl}`,
			},
			precondition: ContextKeyExpr.and(IsWebContext, DOWNLOAD_URL), // Only show when running in a web browser and a download url is available
			f1: true,
			menu: [
				{
					id: MenuId.StatusBarWindowIndicatorMenu,
					when: ContextKeyExpr.and(IsWebContext, DOWNLOAD_URL),
				},
			],
		});
	}

	run(accessor: ServicesAccessor): void {
		const productService = accessor.get(IProductService);
		const openerService = accessor.get(IOpenerService);

		if (productService.downloadUrl) {
			openerService.open(URI.parse(productService.downloadUrl));
		}
	}
}

registerAction2(DownloadAction);
registerAction2(CheckForUpdateAction);
registerAction2(DownloadUpdateAction);
registerAction2(InstallUpdateAction);
registerAction2(RestartToUpdateAction);

if (isWindows) {
	class DeveloperApplyUpdateAction extends Action2 {
		constructor() {
			super({
				id: "_update.applyupdate",
				title: {
					value: localize("applyUpdate", "Apply Update..."),
					original: "Apply Update...",
				},
				category: Categories.Developer,
				f1: true,
				precondition: CONTEXT_UPDATE_STATE.isEqualTo(StateType.Idle),
			});
		}

		async run(accessor: ServicesAccessor): Promise<void> {
			const updateService = accessor.get(IUpdateService);
			const fileDialogService = accessor.get(IFileDialogService);

			const updatePath = await fileDialogService.showOpenDialog({
				title: localize("pickUpdate", "Apply Update"),
				filters: [{ name: "Setup", extensions: ["exe"] }],
				canSelectFiles: true,
				openLabel: mnemonicButtonLabel(
					localize(
						{
							key: "updateButton",
							comment: ["&& denotes a mnemonic"],
						},
						"&&Update",
					),
				),
			});

			if (!updatePath?.[0]) {
				return;
			}

			await updateService._applySpecificUpdate(updatePath[0].fsPath);
		}
	}

	registerAction2(DeveloperApplyUpdateAction);
}
