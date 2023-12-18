/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import {
	InstantiationType,
	registerSingleton,
} from "vs/platform/instantiation/common/extensions";
import { Registry } from "vs/platform/registry/common/platform";
import {
	Extensions as WorkbenchExtensions,
	IWorkbenchContributionsRegistry,
} from "vs/workbench/common/contributions";
import { IReplaceService } from "vs/workbench/contrib/search/browser/replace";
import {
	ReplacePreviewContentProvider,
	ReplaceService,
} from "vs/workbench/contrib/search/browser/replaceService";
import { LifecyclePhase } from "vs/workbench/services/lifecycle/common/lifecycle";

export function registerContributions(): void {
	registerSingleton(
		IReplaceService,
		ReplaceService,
		InstantiationType.Delayed,
	);
	Registry.as<IWorkbenchContributionsRegistry>(
		WorkbenchExtensions.Workbench,
	).registerWorkbenchContribution(
		ReplacePreviewContentProvider,
		LifecyclePhase.Starting,
	);
}
