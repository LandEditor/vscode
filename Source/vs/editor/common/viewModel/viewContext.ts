/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { IColorTheme } from "../../../platform/theme/common/themeService.js";
import type { IEditorConfiguration } from "../config/editorConfiguration.js";
import { EditorTheme } from "../editorTheme.js";
import type { ViewEventHandler } from "../viewEventHandler.js";
import type { IViewLayout, IViewModel } from "../viewModel.js";

export class ViewContext {
	public readonly configuration: IEditorConfiguration;
	public readonly viewModel: IViewModel;
	public readonly viewLayout: IViewLayout;
	public readonly theme: EditorTheme;

	constructor(
		configuration: IEditorConfiguration,
		theme: IColorTheme,
		model: IViewModel,
	) {
		this.configuration = configuration;
		this.theme = new EditorTheme(theme);
		this.viewModel = model;
		this.viewLayout = model.viewLayout;
	}

	public addEventHandler(eventHandler: ViewEventHandler): void {
		this.viewModel.addViewEventHandler(eventHandler);
	}

	public removeEventHandler(eventHandler: ViewEventHandler): void {
		this.viewModel.removeViewEventHandler(eventHandler);
	}
}
