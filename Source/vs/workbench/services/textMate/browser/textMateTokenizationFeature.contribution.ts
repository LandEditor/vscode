/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
	InstantiationType,
	registerSingleton,
} from "vs/platform/instantiation/common/extensions";
import {
	type IWorkbenchContribution,
	WorkbenchPhase,
	registerWorkbenchContribution2,
} from "vs/workbench/common/contributions";
import { ITextMateTokenizationService } from "vs/workbench/services/textMate/browser/textMateTokenizationFeature";
import { TextMateTokenizationFeature } from "vs/workbench/services/textMate/browser/textMateTokenizationFeatureImpl";

/**
 * Makes sure the ITextMateTokenizationService is instantiated
 */
class TextMateTokenizationInstantiator implements IWorkbenchContribution {
	static readonly ID = "workbench.contrib.textMateTokenizationInstantiator";

	constructor(
		@ITextMateTokenizationService _textMateTokenizationService: ITextMateTokenizationService
	) { }
}

registerSingleton(
	ITextMateTokenizationService,
	TextMateTokenizationFeature,
	InstantiationType.Eager,
);

registerWorkbenchContribution2(
	TextMateTokenizationInstantiator.ID,
	TextMateTokenizationInstantiator,
	WorkbenchPhase.BlockRestore,
);
