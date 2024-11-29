/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import type { Terminal } from "@xterm/xterm";

import { timeout } from "../../../../base/common/async.js";

export async function writeP(terminal: Terminal, data: string): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		const failTimeout = timeout(2000);

		failTimeout.then(() =>
			reject("Writing to xterm is taking longer than 2 seconds"),
		);

		terminal.write(data, () => {
			failTimeout.cancel();

			resolve();
		});
	});
}
