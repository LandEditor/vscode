/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { raceCancellationError } from "../../../base/common/async.js";
import type { CancellationToken } from "../../../base/common/cancellation.js";
import type { IDisposable } from "../../../base/common/lifecycle.js";
import { localize } from "../../../nls.js";
import { IInstantiationService } from "../../../platform/instantiation/common/instantiation.js";
import {
	IEditSessionIdentityService,
	type IEditSessionIdentityCreateParticipant,
} from "../../../platform/workspace/common/editSessions.js";
import type { WorkspaceFolder } from "../../../platform/workspace/common/workspace.js";
import {
	extHostCustomer,
	type IExtHostContext,
} from "../../services/extensions/common/extHostCustomers.js";
import {
	ExtHostContext,
	type ExtHostWorkspaceShape,
} from "../common/extHost.protocol.js";

class ExtHostEditSessionIdentityCreateParticipant
	implements IEditSessionIdentityCreateParticipant
{
	private readonly _proxy: ExtHostWorkspaceShape;
	private readonly timeout = 10000;

	constructor(extHostContext: IExtHostContext) {
		this._proxy = extHostContext.getProxy(ExtHostContext.ExtHostWorkspace);
	}

	async participate(
		workspaceFolder: WorkspaceFolder,
		token: CancellationToken,
	): Promise<void> {
		const p = new Promise<any>((resolve, reject) => {
			setTimeout(
				() =>
					reject(
						new Error(
							localize(
								"timeout.onWillCreateEditSessionIdentity",
								"Aborted onWillCreateEditSessionIdentity-event after 10000ms",
							),
						),
					),
				this.timeout,
			);
			this._proxy
				.$onWillCreateEditSessionIdentity(
					workspaceFolder.uri,
					token,
					this.timeout,
				)
				.then(resolve, reject);
		});

		return raceCancellationError(p, token);
	}
}

@extHostCustomer
export class EditSessionIdentityCreateParticipant {
	private _saveParticipantDisposable: IDisposable;

	constructor(
		extHostContext: IExtHostContext,
		@IInstantiationService instantiationService: IInstantiationService,
		@IEditSessionIdentityService
		private readonly _editSessionIdentityService: IEditSessionIdentityService,
	) {
		this._saveParticipantDisposable =
			this._editSessionIdentityService.addEditSessionIdentityCreateParticipant(
				instantiationService.createInstance(
					ExtHostEditSessionIdentityCreateParticipant,
					extHostContext,
				),
			);
	}

	dispose(): void {
		this._saveParticipantDisposable.dispose();
	}
}
