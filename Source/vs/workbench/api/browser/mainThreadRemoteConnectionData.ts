/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Disposable } from "../../../base/common/lifecycle.js";
import { IRemoteAuthorityResolverService } from "../../../platform/remote/common/remoteAuthorityResolver.js";
import { IWorkbenchEnvironmentService } from "../../services/environment/common/environmentService.js";
import {
	extHostCustomer,
	IExtHostContext,
} from "../../services/extensions/common/extHostCustomers.js";
import {
	ExtHostContext,
	ExtHostExtensionServiceShape,
} from "../common/extHost.protocol.js";

@extHostCustomer
export class MainThreadRemoteConnectionData extends Disposable {
	private readonly _proxy: ExtHostExtensionServiceShape;

	constructor(
		extHostContext: IExtHostContext,
		@IWorkbenchEnvironmentService
		protected readonly _environmentService: IWorkbenchEnvironmentService,
		@IRemoteAuthorityResolverService
		remoteAuthorityResolverService: IRemoteAuthorityResolverService,
	) {
		super();

		this._proxy = extHostContext.getProxy(
			ExtHostContext.ExtHostExtensionService,
		);

		const remoteAuthority = this._environmentService.remoteAuthority;

		if (remoteAuthority) {
			this._register(
				remoteAuthorityResolverService.onDidChangeConnectionData(() => {
					const connectionData =
						remoteAuthorityResolverService.getConnectionData(
							remoteAuthority,
						);

					if (connectionData) {
						this._proxy.$updateRemoteConnectionData(connectionData);
					}
				}),
			);
		}
	}
}
