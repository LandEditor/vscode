/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { CancellationToken } from "vs/base/common/cancellation";
import type { IDisposable } from "vs/base/common/lifecycle";
import type { URI } from "vs/base/common/uri";
import {
	InstantiationType,
	registerSingleton,
} from "vs/platform/instantiation/common/extensions";
import {
	type ICanonicalUriProvider,
	ICanonicalUriService,
} from "vs/platform/workspace/common/canonicalUri";

export class CanonicalUriService implements ICanonicalUriService {
	declare readonly _serviceBrand: undefined;

	private readonly _providers = new Map<string, ICanonicalUriProvider>();

	registerCanonicalUriProvider(provider: ICanonicalUriProvider): IDisposable {
		this._providers.set(provider.scheme, provider);
		return {
			dispose: () => this._providers.delete(provider.scheme),
		};
	}

	async provideCanonicalUri(
		uri: URI,
		targetScheme: string,
		token: CancellationToken,
	): Promise<URI | undefined> {
		const provider = this._providers.get(uri.scheme);
		if (provider) {
			return provider.provideCanonicalUri(uri, targetScheme, token);
		}
		return undefined;
	}
}

registerSingleton(
	ICanonicalUriService,
	CanonicalUriService,
	InstantiationType.Delayed,
);
