/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
	DocumentRangeSemanticTokensProvider,
	DocumentSemanticTokensProvider,
} from "vs/editor/common/languages";
import { SemanticTokensProviderStyling } from "vs/editor/common/services/semanticTokensProviderStyling";
import { createDecorator } from "vs/platform/instantiation/common/instantiation";

export const ISemanticTokensStylingService =
	createDecorator<ISemanticTokensStylingService>(
		"semanticTokensStylingService",
	);

export type DocumentTokensProvider =
	| DocumentSemanticTokensProvider
	| DocumentRangeSemanticTokensProvider;

export interface ISemanticTokensStylingService {
	readonly _serviceBrand: undefined;

	getStyling(provider: DocumentTokensProvider): SemanticTokensProviderStyling;
}
