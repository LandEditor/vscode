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
	Extensions,
	IWorkbenchContribution,
	IWorkbenchContributionsRegistry,
} from "vs/workbench/common/contributions";
import { LifecyclePhase } from "vs/workbench/services/lifecycle/common/lifecycle";
import { ITextMateTokenizationService } from "vs/workbench/services/textMate/browser/textMateTokenizationFeature";
import { TextMateTokenizationFeature } from "vs/workbench/services/textMate/browser/textMateTokenizationFeatureImpl";

/**
 * Makes sure the ITextMateTokenizationService is instantiated
 */
class TextMateTokenizationInstantiator implements IWorkbenchContribution {
	constructor(
		@ITextMateTokenizationService
		_textMateTokenizationService: ITextMateTokenizationService
	) {}
}

registerSingleton(
	ITextMateTokenizationService,
	TextMateTokenizationFeature,
	InstantiationType.Eager,
);

const workbenchRegistry = Registry.as<IWorkbenchContributionsRegistry>(
	Extensions.Workbench,
);
workbenchRegistry.registerWorkbenchContribution(
	TextMateTokenizationInstantiator,
	LifecyclePhase.Ready,
);
