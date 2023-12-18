/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from "vs/base/common/lifecycle";
import { URI, UriComponents } from "vs/base/common/uri";
import { IDownloadService } from "vs/platform/download/common/download";
import {
	MainContext,
	MainThreadDownloadServiceShape,
} from "vs/workbench/api/common/extHost.protocol";
import {
	IExtHostContext,
	extHostNamedCustomer,
} from "vs/workbench/services/extensions/common/extHostCustomers";

@extHostNamedCustomer(MainContext.MainThreadDownloadService)
export class MainThreadDownloadService
	extends Disposable
	implements MainThreadDownloadServiceShape
{
	constructor(
		extHostContext: IExtHostContext,
		@IDownloadService private readonly downloadService: IDownloadService
	) {
		super();
	}

	$download(uri: UriComponents, to: UriComponents): Promise<void> {
		return this.downloadService.download(URI.revive(uri), URI.revive(to));
	}
}
