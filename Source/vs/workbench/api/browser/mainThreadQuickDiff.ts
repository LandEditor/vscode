/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationToken } from "../../../base/common/cancellation.js";
import {
	DisposableMap,
	type IDisposable,
} from "../../../base/common/lifecycle.js";
import { URI, type UriComponents } from "../../../base/common/uri.js";
import {
	IQuickDiffService,
	type QuickDiffProvider,
} from "../../contrib/scm/common/quickDiff.js";
import {
	type IExtHostContext,
	extHostNamedCustomer,
} from "../../services/extensions/common/extHostCustomers.js";
import {
	ExtHostContext,
	type ExtHostQuickDiffShape,
	type IDocumentFilterDto,
	MainContext,
	type MainThreadQuickDiffShape,
} from "../common/extHost.protocol.js";

@extHostNamedCustomer(MainContext.MainThreadQuickDiff)
export class MainThreadQuickDiff implements MainThreadQuickDiffShape {
	private readonly proxy: ExtHostQuickDiffShape;
	private providerDisposables = new DisposableMap<number, IDisposable>();

	constructor(
		extHostContext: IExtHostContext,
		@IQuickDiffService private readonly quickDiffService: IQuickDiffService
	) {
		this.proxy = extHostContext.getProxy(ExtHostContext.ExtHostQuickDiff);
	}

	async $registerQuickDiffProvider(
		handle: number,
		selector: IDocumentFilterDto[],
		label: string,
		rootUri: UriComponents | undefined,
	): Promise<void> {
		const provider: QuickDiffProvider = {
			label,
			rootUri: URI.revive(rootUri),
			selector,
			isSCM: false,
			getOriginalResource: async (uri: URI) => {
				return URI.revive(
					await this.proxy.$provideOriginalResource(
						handle,
						uri,
						CancellationToken.None,
					),
				);
			},
		};
		const disposable = this.quickDiffService.addQuickDiffProvider(provider);
		this.providerDisposables.set(handle, disposable);
	}

	async $unregisterQuickDiffProvider(handle: number): Promise<void> {
		if (this.providerDisposables.has(handle)) {
			this.providerDisposables.deleteAndDispose(handle);
		}
	}

	dispose(): void {
		this.providerDisposables.dispose();
	}
}
