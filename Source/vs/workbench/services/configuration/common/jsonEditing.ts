/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { JSONPath } from "../../../../base/common/json.js";
import type { URI } from "../../../../base/common/uri.js";
import { createDecorator } from "../../../../platform/instantiation/common/instantiation.js";

export const IJSONEditingService =
	createDecorator<IJSONEditingService>("jsonEditingService");

export enum JSONEditingErrorCode {
	/**
	 * Error when trying to write to a file that contains JSON errors.
	 */
	ERROR_INVALID_FILE = 0,
}

export class JSONEditingError extends Error {
	constructor(
		message: string,
		public code: JSONEditingErrorCode,
	) {
		super(message);
	}
}

export interface IJSONValue {
	path: JSONPath;
	value: any;
}

export interface IJSONEditingService {
	readonly _serviceBrand: undefined;

	write(resource: URI, values: IJSONValue[], save: boolean): Promise<void>;
}
