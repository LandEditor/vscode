/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { addMatchMediaChangeListener } from "vs/base/browser/browser";
import { mainWindow } from "vs/base/browser/window";
import { Emitter, Event } from "vs/base/common/event";
import { Disposable } from "vs/base/common/lifecycle";
import {
	InstantiationType,
	registerSingleton,
} from "vs/platform/instantiation/common/extensions";
import { IHostColorSchemeService } from "vs/workbench/services/themes/common/hostColorSchemeService";

export class BrowserHostColorSchemeService
	extends Disposable
	implements IHostColorSchemeService
{
	declare readonly _serviceBrand: undefined;

	private readonly _onDidSchemeChangeEvent = this._register(
		new Emitter<void>(),
	);

	constructor() {
		super();

		this.registerListeners();
	}

	private registerListeners(): void {
		addMatchMediaChangeListener("(prefers-color-scheme: dark)", () => {
			this._onDidSchemeChangeEvent.fire();
		});
		addMatchMediaChangeListener("(forced-colors: active)", () => {
			this._onDidSchemeChangeEvent.fire();
		});
	}

	get onDidChangeColorScheme(): Event<void> {
		return this._onDidSchemeChangeEvent.event;
	}

	get dark(): boolean {
		if (mainWindow.matchMedia("(prefers-color-scheme: light)").matches) {
			return false;
		} else if (
			mainWindow.matchMedia("(prefers-color-scheme: dark)").matches
		) {
			return true;
		}
		return false;
	}

	get highContrast(): boolean {
		if (mainWindow.matchMedia("(forced-colors: active)").matches) {
			return true;
		}
		return false;
	}
}

registerSingleton(
	IHostColorSchemeService,
	BrowserHostColorSchemeService,
	InstantiationType.Delayed,
);
