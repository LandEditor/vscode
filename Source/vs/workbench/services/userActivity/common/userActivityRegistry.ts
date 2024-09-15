/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { IInstantiationService } from "../../../../platform/instantiation/common/instantiation.js";
import type { IUserActivityService } from "./userActivityService.js";

class UserActivityRegistry {
	private todo: { new (s: IUserActivityService, ...args: any[]): any }[] = [];

	public add = (ctor: {
		new (s: IUserActivityService, ...args: any[]): any;
	}) => {
		this.todo.push(ctor);
	};

	public take(
		userActivityService: IUserActivityService,
		instantiation: IInstantiationService,
	) {
		this.add = (ctor) =>
			instantiation.createInstance(ctor, userActivityService);
		this.todo.forEach(this.add);
		this.todo = [];
	}
}

export const userActivityRegistry = new UserActivityRegistry();
