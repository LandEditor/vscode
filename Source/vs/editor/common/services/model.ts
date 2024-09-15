/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { Event } from "../../../base/common/event.js";
import type { URI } from "../../../base/common/uri.js";
import { createDecorator } from "../../../platform/instantiation/common/instantiation.js";
import type {
	DocumentRangeSemanticTokensProvider,
	DocumentSemanticTokensProvider,
} from "../languages.js";
import type { ILanguageSelection } from "../languages/language.js";
import type {
	ITextBufferFactory,
	ITextModel,
	ITextModelCreationOptions,
} from "../model.js";

export const IModelService = createDecorator<IModelService>("modelService");

export type DocumentTokensProvider =
	| DocumentSemanticTokensProvider
	| DocumentRangeSemanticTokensProvider;

export interface IModelService {
	readonly _serviceBrand: undefined;

	createModel(
		value: string | ITextBufferFactory,
		languageSelection: ILanguageSelection | null,
		resource?: URI,
		isForSimpleWidget?: boolean,
	): ITextModel;

	updateModel(model: ITextModel, value: string | ITextBufferFactory): void;

	destroyModel(resource: URI): void;

	getModels(): ITextModel[];

	getCreationOptions(
		language: string,
		resource: URI,
		isForSimpleWidget: boolean,
	): ITextModelCreationOptions;

	getModel(resource: URI): ITextModel | null;

	onModelAdded: Event<ITextModel>;

	onModelRemoved: Event<ITextModel>;

	onModelLanguageChanged: Event<{ model: ITextModel; oldLanguageId: string }>;
}
