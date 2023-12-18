/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Event } from "vs/base/common/event";
import { URI } from "vs/base/common/uri";
import {
	DocumentRangeSemanticTokensProvider,
	DocumentSemanticTokensProvider,
} from "vs/editor/common/languages";
import { ILanguageSelection } from "vs/editor/common/languages/language";
import {
	ITextBufferFactory,
	ITextModel,
	ITextModelCreationOptions,
} from "vs/editor/common/model";
import { createDecorator } from "vs/platform/instantiation/common/instantiation";

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
