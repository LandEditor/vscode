/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
	ErrorNoTelemetry,
	SerializedError,
	onUnexpectedError,
} from "vs/base/common/errors";
import {
	MainContext,
	MainThreadErrorsShape,
} from "vs/workbench/api/common/extHost.protocol";
import { extHostNamedCustomer } from "vs/workbench/services/extensions/common/extHostCustomers";

@extHostNamedCustomer(MainContext.MainThreadErrors)
export class MainThreadErrors implements MainThreadErrorsShape {
	dispose(): void {
		//
	}

	$onUnexpectedError(err: any | SerializedError): void {
		if (err?.$isError) {
			const { name, message, stack } = err;
			err = err.noTelemetry ? new ErrorNoTelemetry() : new Error();
			err.message = message;
			err.name = name;
			err.stack = stack;
		}
		onUnexpectedError(err);
	}
}
