/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from "../../../base/common/lifecycle.js";
import {
	IInstantiationService,
	createDecorator,
} from "../../instantiation/common/instantiation.js";
import {
	ILifecycleMainService,
	LifecycleMainPhase,
} from "../../lifecycle/electron-main/lifecycleMainService.js";
import { ILogService } from "../../log/common/log.js";
import type { ICommonMenubarService, IMenubarData } from "../common/menubar.js";
import { Menubar } from "./menubar.js";

export const IMenubarMainService =
	createDecorator<IMenubarMainService>("menubarMainService");

export interface IMenubarMainService extends ICommonMenubarService {
	readonly _serviceBrand: undefined;
}

export class MenubarMainService
	extends Disposable
	implements IMenubarMainService
{
	declare readonly _serviceBrand: undefined;

	private readonly menubar = this.installMenuBarAfterWindowOpen();

	constructor(
		@IInstantiationService
		private readonly instantiationService: IInstantiationService,
		@ILifecycleMainService
		private readonly lifecycleMainService: ILifecycleMainService,
		@ILogService private readonly logService: ILogService,
	) {
		super();
	}

	private async installMenuBarAfterWindowOpen(): Promise<Menubar> {
		await this.lifecycleMainService.when(
			LifecycleMainPhase.AfterWindowOpen,
		);

		return this._register(
			this.instantiationService.createInstance(Menubar),
		);
	}

	async updateMenubar(windowId: number, menus: IMenubarData): Promise<void> {
		this.logService.trace("menubarService#updateMenubar", windowId);

		const menubar = await this.menubar;
		menubar.updateMenu(menus, windowId);
	}
}
