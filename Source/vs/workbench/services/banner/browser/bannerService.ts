/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { MarkdownString } from "vs/base/common/htmlContent";
import type { ThemeIcon } from "vs/base/common/themables";
import type { URI } from "vs/base/common/uri";
import { createDecorator } from "vs/platform/instantiation/common/instantiation";
import type { ILinkDescriptor } from "vs/platform/opener/browser/link";

export interface IBannerItem {
	readonly id: string;
	readonly icon: ThemeIcon | URI | undefined;
	readonly message: string | MarkdownString;
	readonly actions?: ILinkDescriptor[];
	readonly ariaLabel?: string;
	readonly onClose?: () => void;
	readonly closeLabel?: string;
}

export const IBannerService = createDecorator<IBannerService>("bannerService");

export interface IBannerService {
	readonly _serviceBrand: undefined;

	focus(): void;
	focusNextAction(): void;
	focusPreviousAction(): void;
	hide(id: string): void;
	show(item: IBannerItem): void;
}
