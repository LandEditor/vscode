/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { CancellationToken } from "../../../../base/common/cancellation.js";
import type { IDisposable } from "../../../../base/common/lifecycle.js";
import type { URI } from "../../../../base/common/uri.js";
import type { Selection } from "../../../../editor/common/core/selection.js";
import type { LanguageSelector } from "../../../../editor/common/languageSelector.js";
import type { ISubmenuItem } from "../../../../platform/actions/common/actions.js";
import { createDecorator } from "../../../../platform/instantiation/common/instantiation.js";

export interface IShareableItem {
	resourceUri: URI;
	selection?: Selection;
}

export interface IShareProvider {
	readonly id: string;
	readonly label: string;
	readonly priority: number;
	readonly selector: LanguageSelector;
	prepareShare?(
		item: IShareableItem,
		token: CancellationToken,
	): Thenable<boolean | undefined>;
	provideShare(
		item: IShareableItem,
		token: CancellationToken,
	): Thenable<URI | string | undefined>;
}

export const IShareService = createDecorator<IShareService>("shareService");
export interface IShareService {
	_serviceBrand: undefined;

	registerShareProvider(provider: IShareProvider): IDisposable;
	getShareActions(): ISubmenuItem[];
	provideShare(
		item: IShareableItem,
		token: CancellationToken,
	): Thenable<URI | string | undefined>;
}
