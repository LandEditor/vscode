/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { DisposableStore, type IDisposable } from "../common/lifecycle.js";
import { type IObservable, autorun } from "../common/observable.js";
import { createStyleSheet2 } from "./dom.js";

export function createStyleSheetFromObservable(
	css: IObservable<string>,
): IDisposable {
	const store = new DisposableStore();
	const w = store.add(createStyleSheet2());
	store.add(
		autorun((reader) => {
			w.setStyle(css.read(reader));
		}),
	);
	return store;
}
