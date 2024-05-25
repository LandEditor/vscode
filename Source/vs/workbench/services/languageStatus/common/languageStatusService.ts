/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { CancellationToken } from "vs/base/common/cancellation";
import type { Event } from "vs/base/common/event";
import type { IDisposable } from "vs/base/common/lifecycle";
import type Severity from "vs/base/common/severity";
import { compare } from "vs/base/common/strings";
import { LanguageFeatureRegistry } from "vs/editor/common/languageFeatureRegistry";
import type { LanguageSelector } from "vs/editor/common/languageSelector";
import type { Command } from "vs/editor/common/languages";
import type { ITextModel } from "vs/editor/common/model";
import type { IAccessibilityInformation } from "vs/platform/accessibility/common/accessibility";
import {
	InstantiationType,
	registerSingleton,
} from "vs/platform/instantiation/common/extensions";
import { createDecorator } from "vs/platform/instantiation/common/instantiation";

export interface ILanguageStatus {
	readonly id: string;
	readonly name: string;
	readonly selector: LanguageSelector;
	readonly severity: Severity;
	readonly label: string | { value: string; shortValue: string };
	readonly detail: string;
	readonly busy: boolean;
	readonly source: string;
	readonly command: Command | undefined;
	readonly accessibilityInfo: IAccessibilityInformation | undefined;
}

export interface ILanguageStatusProvider {
	provideLanguageStatus(
		langId: string,
		token: CancellationToken,
	): Promise<ILanguageStatus | undefined>;
}

export const ILanguageStatusService = createDecorator<ILanguageStatusService>(
	"ILanguageStatusService",
);

export interface ILanguageStatusService {
	_serviceBrand: undefined;

	onDidChange: Event<void>;

	addStatus(status: ILanguageStatus): IDisposable;

	getLanguageStatus(model: ITextModel): ILanguageStatus[];
}

class LanguageStatusServiceImpl implements ILanguageStatusService {
	declare _serviceBrand: undefined;

	private readonly _provider = new LanguageFeatureRegistry<ILanguageStatus>();

	readonly onDidChange: Event<any> = this._provider.onDidChange;

	addStatus(status: ILanguageStatus): IDisposable {
		return this._provider.register(status.selector, status);
	}

	getLanguageStatus(model: ITextModel): ILanguageStatus[] {
		return this._provider.ordered(model).sort((a, b) => {
			let res = b.severity - a.severity;
			if (res === 0) {
				res = compare(a.source, b.source);
			}
			if (res === 0) {
				res = compare(a.id, b.id);
			}
			return res;
		});
	}
}

registerSingleton(
	ILanguageStatusService,
	LanguageStatusServiceImpl,
	InstantiationType.Delayed,
);
