/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from "vs/base/common/lifecycle";
import { IRemoteAuthorityResolverService } from "vs/platform/remote/common/remoteAuthorityResolver";
import { IWorkbenchEnvironmentService } from "vs/workbench/services/environment/common/environmentService";
import {
	IExtHostContext,
	extHostCustomer,
} from "vs/workbench/services/extensions/common/extHostCustomers";
import {
	ExtHostContext,
	ExtHostExtensionServiceShape,
} from "../common/extHost.protocol";

@extHostCustomer
export class MainThreadRemoteConnectionData extends Disposable {
	private readonly _proxy: ExtHostExtensionServiceShape;

	constructor(
		extHostContext: IExtHostContext,
		@IWorkbenchEnvironmentService
		protected readonly _environmentService: IWorkbenchEnvironmentService,
		@IRemoteAuthorityResolverService
		remoteAuthorityResolverService: IRemoteAuthorityResolverService
	) {
		super();
		this._proxy = extHostContext.getProxy(
			ExtHostContext.ExtHostExtensionService
		);

		const remoteAuthority = this._environmentService.remoteAuthority;
		if (remoteAuthority) {
			this._register(
				remoteAuthorityResolverService.onDidChangeConnectionData(() => {
					const connectionData =
						remoteAuthorityResolverService.getConnectionData(
							remoteAuthority
						);
					if (connectionData) {
						this._proxy.$updateRemoteConnectionData(connectionData);
					}
				})
			);
		}
	}
}
