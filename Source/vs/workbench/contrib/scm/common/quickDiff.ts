/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Event } from "vs/base/common/event";
import { IDisposable } from "vs/base/common/lifecycle";
import { URI } from "vs/base/common/uri";
import { LanguageSelector } from "vs/editor/common/languageSelector";
import { createDecorator } from "vs/platform/instantiation/common/instantiation";

export const IQuickDiffService =
	createDecorator<IQuickDiffService>("quickDiff");

export interface QuickDiffProvider {
	label: string;
	rootUri: URI | undefined;
	selector?: LanguageSelector;
	isSCM: boolean;
	getOriginalResource(uri: URI): Promise<URI | null>;
}

export interface QuickDiff {
	label: string;
	originalResource: URI;
	isSCM: boolean;
}

export interface IQuickDiffService {
	readonly _serviceBrand: undefined;

	readonly onDidChangeQuickDiffProviders: Event<void>;
	addQuickDiffProvider(quickDiff: QuickDiffProvider): IDisposable;
	getQuickDiffs(
		uri: URI,
		language?: string,
		isSynchronized?: boolean,
	): Promise<QuickDiff[]>;
}
