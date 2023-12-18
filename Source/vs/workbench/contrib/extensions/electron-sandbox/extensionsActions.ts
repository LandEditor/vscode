/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Schemas } from "vs/base/common/network";
import { URI } from "vs/base/common/uri";
import { localize } from "vs/nls";
import { Categories } from "vs/platform/action/common/actionCommonCategories";
import { Action2 } from "vs/platform/actions/common/actions";
import {
	ExtensionsLocalizedLabel,
	IExtensionManagementService,
} from "vs/platform/extensionManagement/common/extensionManagement";
import { IFileService } from "vs/platform/files/common/files";
import { ServicesAccessor } from "vs/platform/instantiation/common/instantiation";
import { INativeHostService } from "vs/platform/native/common/native";
import { INativeWorkbenchEnvironmentService } from "vs/workbench/services/environment/electron-sandbox/environmentService";

export class OpenExtensionsFolderAction extends Action2 {
	constructor() {
		super({
			id: "workbench.extensions.action.openExtensionsFolder",
			title: {
				value: localize(
					"openExtensionsFolder",
					"Open Extensions Folder",
				),
				original: "Open Extensions Folder",
			},
			category: ExtensionsLocalizedLabel,
			f1: true,
		});
	}

	async run(accessor: ServicesAccessor): Promise<void> {
		const nativeHostService = accessor.get(INativeHostService);
		const fileService = accessor.get(IFileService);
		const environmentService = accessor.get(
			INativeWorkbenchEnvironmentService,
		);

		const extensionsHome = URI.file(environmentService.extensionsPath);
		const file = await fileService.resolve(extensionsHome);

		let itemToShow: URI;
		if (file.children && file.children.length > 0) {
			itemToShow = file.children[0].resource;
		} else {
			itemToShow = extensionsHome;
		}

		if (itemToShow.scheme === Schemas.file) {
			return nativeHostService.showItemInFolder(itemToShow.fsPath);
		}
	}
}

export class CleanUpExtensionsFolderAction extends Action2 {
	constructor() {
		super({
			id: "_workbench.extensions.action.cleanUpExtensionsFolder",
			title: {
				value: localize(
					"cleanUpExtensionsFolder",
					"Cleanup Extensions Folder",
				),
				original: "Cleanup Extensions Folder",
			},
			category: Categories.Developer,
			f1: true,
		});
	}

	async run(accessor: ServicesAccessor): Promise<void> {
		const extensionManagementService = accessor.get(
			IExtensionManagementService,
		);
		return extensionManagementService.cleanUp();
	}
}
