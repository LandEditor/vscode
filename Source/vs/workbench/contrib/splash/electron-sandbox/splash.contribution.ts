/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
	InstantiationType,
	registerSingleton,
} from "vs/platform/instantiation/common/extensions";
import { INativeHostService } from "vs/platform/native/common/native";
import type { IPartsSplash } from "vs/platform/theme/common/themeService";
import {
	WorkbenchPhase,
	registerWorkbenchContribution2,
} from "vs/workbench/common/contributions";
import { PartsSplash } from "vs/workbench/contrib/splash/browser/partsSplash";
import { ISplashStorageService } from "vs/workbench/contrib/splash/browser/splash";

class SplashStorageService implements ISplashStorageService {
	_serviceBrand: undefined;
	readonly saveWindowSplash: (splash: IPartsSplash) => Promise<void>;

	constructor(@INativeHostService nativeHostService: INativeHostService) {
		this.saveWindowSplash = nativeHostService.saveWindowSplash.bind(nativeHostService);
	}
}

registerSingleton(
	ISplashStorageService,
	SplashStorageService,
	InstantiationType.Delayed,
);

registerWorkbenchContribution2(
	PartsSplash.ID,
	PartsSplash,
	WorkbenchPhase.BlockStartup,
);
