/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
	toDisposable,
	type IDisposable,
} from "../../../base/common/lifecycle.js";
import type { ResourceLabelFormatter } from "../../../platform/label/common/label.js";
import {
	MainContext,
	type ExtHostLabelServiceShape,
	type IMainContext,
	type MainThreadLabelServiceShape,
} from "./extHost.protocol.js";

export class ExtHostLabelService implements ExtHostLabelServiceShape {
	private readonly _proxy: MainThreadLabelServiceShape;
	private _handlePool = 0;

	constructor(mainContext: IMainContext) {
		this._proxy = mainContext.getProxy(MainContext.MainThreadLabelService);
	}

	$registerResourceLabelFormatter(
		formatter: ResourceLabelFormatter,
	): IDisposable {
		const handle = this._handlePool++;
		this._proxy.$registerResourceLabelFormatter(handle, formatter);

		return toDisposable(() => {
			this._proxy.$unregisterResourceLabelFormatter(handle);
		});
	}
}
