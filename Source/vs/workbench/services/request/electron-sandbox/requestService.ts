/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { CancellationToken } from "../../../../base/common/cancellation.js";
import { request } from "../../../../base/parts/request/browser/request.js";
import type {
	IRequestContext,
	IRequestOptions,
} from "../../../../base/parts/request/common/request.js";
import { IConfigurationService } from "../../../../platform/configuration/common/configuration.js";
import {
	InstantiationType,
	registerSingleton,
} from "../../../../platform/instantiation/common/extensions.js";
import { ILogService } from "../../../../platform/log/common/log.js";
import { INativeHostService } from "../../../../platform/native/common/native.js";
import {
	AbstractRequestService,
	IRequestService,
	type AuthInfo,
	type Credentials,
} from "../../../../platform/request/common/request.js";

export class NativeRequestService
	extends AbstractRequestService
	implements IRequestService
{
	declare readonly _serviceBrand: undefined;

	constructor(
		@INativeHostService
		private readonly nativeHostService: INativeHostService,
		@IConfigurationService
		private readonly configurationService: IConfigurationService,
		@ILogService logService: ILogService,
	) {
		super(logService);
	}

	async request(
		options: IRequestOptions,
		token: CancellationToken,
	): Promise<IRequestContext> {
		if (!options.proxyAuthorization) {
			options.proxyAuthorization =
				this.configurationService.getValue<string>(
					"http.proxyAuthorization",
				);
		}
		return this.logAndRequest(options, () => request(options, token));
	}

	async resolveProxy(url: string): Promise<string | undefined> {
		return this.nativeHostService.resolveProxy(url);
	}

	async lookupAuthorization(
		authInfo: AuthInfo,
	): Promise<Credentials | undefined> {
		return this.nativeHostService.lookupAuthorization(authInfo);
	}

	async lookupKerberosAuthorization(
		url: string,
	): Promise<string | undefined> {
		return this.nativeHostService.lookupKerberosAuthorization(url);
	}

	async loadCertificates(): Promise<string[]> {
		return this.nativeHostService.loadCertificates();
	}
}

registerSingleton(
	IRequestService,
	NativeRequestService,
	InstantiationType.Delayed,
);
