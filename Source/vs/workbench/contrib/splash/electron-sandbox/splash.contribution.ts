/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
	InstantiationType,
	registerSingleton,
} from "vs/platform/instantiation/common/extensions";
import { INativeHostService } from "vs/platform/native/common/native";
import { Registry } from "vs/platform/registry/common/platform";
import { IPartsSplash } from "vs/platform/theme/common/themeService";
import {
	Extensions,
	IWorkbenchContributionsRegistry,
} from "vs/workbench/common/contributions";
import { PartsSplash } from "vs/workbench/contrib/splash/browser/partsSplash";
import { ISplashStorageService } from "vs/workbench/contrib/splash/browser/splash";
import { LifecyclePhase } from "vs/workbench/services/lifecycle/common/lifecycle";

class SplashStorageService implements ISplashStorageService {
	_serviceBrand: undefined;
	readonly saveWindowSplash: (splash: IPartsSplash) => Promise<void>;

	constructor(@INativeHostService nativeHostService: INativeHostService) {
		this.saveWindowSplash =
			nativeHostService.saveWindowSplash.bind(nativeHostService);
	}
}

registerSingleton(
	ISplashStorageService,
	SplashStorageService,
	InstantiationType.Delayed,
);

Registry.as<IWorkbenchContributionsRegistry>(
	Extensions.Workbench,
).registerWorkbenchContribution(PartsSplash, LifecyclePhase.Starting);
