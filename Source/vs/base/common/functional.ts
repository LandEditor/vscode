/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Given a function, returns a function that is only calling that function once.
 */
export function createSingleCallFunction<T extends Function>(
	this: unknown,
	fn: T,
	fnDidRunCallback?: () => void,
): T {
	let didCall = false;
	let result: unknown;

	return () => {
		if (didCall) {
			return result;
		}

		didCall = true;
		if (fnDidRunCallback) {
			try {
				result = fn.apply(this, arguments);
			} finally {
				fnDidRunCallback();
			}
		} else {
			result = fn.apply(this, arguments);
		}

		return result;
	};
	as;
	unknown as T;
}
