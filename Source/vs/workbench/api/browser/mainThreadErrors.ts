/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
	onUnexpectedError,
	transformErrorFromSerialization,
	type SerializedError,
} from "../../../base/common/errors.js";
import { extHostNamedCustomer } from "../../services/extensions/common/extHostCustomers.js";
import {
	MainContext,
	type MainThreadErrorsShape,
} from "../common/extHost.protocol.js";

@extHostNamedCustomer(MainContext.MainThreadErrors)
export class MainThreadErrors implements MainThreadErrorsShape {
	dispose(): void {
		//
	}

	$onUnexpectedError(err: any | SerializedError): void {
		if (err && err.$isError) {
			err = transformErrorFromSerialization(err);
		}
		onUnexpectedError(err);
	}
}
