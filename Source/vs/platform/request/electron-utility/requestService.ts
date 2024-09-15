/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { net } from "electron";
import type { CancellationToken } from "../../../base/common/cancellation.js";
import type {
	IRequestContext,
	IRequestOptions,
} from "../../../base/parts/request/common/request.js";
import {
	type IRawRequestFunction,
	RequestService as NodeRequestService,
} from "../node/requestService.js";

function getRawRequest(options: IRequestOptions): IRawRequestFunction {
	return net.request as any as IRawRequestFunction;
}

export class RequestService extends NodeRequestService {
	override request(
		options: IRequestOptions,
		token: CancellationToken,
	): Promise<IRequestContext> {
		return super.request(
			{ ...(options || {}), getRawRequest, isChromiumNetwork: true },
			token,
		);
	}
}
