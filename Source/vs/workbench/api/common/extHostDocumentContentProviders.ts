/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type * as vscode from "vscode";

import { CancellationToken } from "../../../base/common/cancellation.js";
import { onUnexpectedError } from "../../../base/common/errors.js";
import type { IDisposable } from "../../../base/common/lifecycle.js";
import { Schemas } from "../../../base/common/network.js";
import { splitLines } from "../../../base/common/strings.js";
import { URI, type UriComponents } from "../../../base/common/uri.js";
import type { ILogService } from "../../../platform/log/common/log.js";
import {
	MainContext,
	type ExtHostDocumentContentProvidersShape,
	type IMainContext,
	type MainThreadDocumentContentProvidersShape,
} from "./extHost.protocol.js";
import type { ExtHostDocumentsAndEditors } from "./extHostDocumentsAndEditors.js";
import { Disposable } from "./extHostTypes.js";

export class ExtHostDocumentContentProvider
	implements ExtHostDocumentContentProvidersShape
{
	private static _handlePool = 0;

	private readonly _documentContentProviders = new Map<
		number,
		vscode.TextDocumentContentProvider
	>();
	private readonly _proxy: MainThreadDocumentContentProvidersShape;

	constructor(
		mainContext: IMainContext,
		private readonly _documentsAndEditors: ExtHostDocumentsAndEditors,
		private readonly _logService: ILogService,
	) {
		this._proxy = mainContext.getProxy(
			MainContext.MainThreadDocumentContentProviders,
		);
	}

	registerTextDocumentContentProvider(
		scheme: string,
		provider: vscode.TextDocumentContentProvider,
	): vscode.Disposable {
		// todo@remote
		// check with scheme from fs-providers!
		if (Object.keys(Schemas).indexOf(scheme) >= 0) {
			throw new Error(`scheme '${scheme}' already registered`);
		}

		const handle = ExtHostDocumentContentProvider._handlePool++;

		this._documentContentProviders.set(handle, provider);
		this._proxy.$registerTextContentProvider(handle, scheme);

		let subscription: IDisposable | undefined;
		if (typeof provider.onDidChange === "function") {
			let lastEvent: Promise<void> | undefined;

			subscription = provider.onDidChange(async (uri) => {
				if (uri.scheme !== scheme) {
					this._logService.warn(
						`Provider for scheme '${scheme}' is firing event for schema '${uri.scheme}' which will be IGNORED`,
					);
					return;
				}
				if (!this._documentsAndEditors.getDocument(uri)) {
					// ignore event if document isn't open
					return;
				}

				if (lastEvent) {
					await lastEvent;
				}

				const thisEvent = this.$provideTextDocumentContent(handle, uri)
					.then(async (value) => {
						if (!value && typeof value !== "string") {
							return;
						}

						const document =
							this._documentsAndEditors.getDocument(uri);
						if (!document) {
							// disposed in the meantime
							return;
						}

						// create lines and compare
						const lines = splitLines(value);

						// broadcast event when content changed
						if (!document.equalLines(lines)) {
							return this._proxy.$onVirtualDocumentChange(
								uri,
								value,
							);
						}
					})
					.catch(onUnexpectedError)
					.finally(() => {
						if (lastEvent === thisEvent) {
							lastEvent = undefined;
						}
					});

				lastEvent = thisEvent;
			});
		}
		return new Disposable(() => {
			if (this._documentContentProviders.delete(handle)) {
				this._proxy.$unregisterTextContentProvider(handle);
			}
			if (subscription) {
				subscription.dispose();
				subscription = undefined;
			}
		});
	}

	$provideTextDocumentContent(
		handle: number,
		uri: UriComponents,
	): Promise<string | null | undefined> {
		const provider = this._documentContentProviders.get(handle);
		if (!provider) {
			return Promise.reject(
				new Error(`unsupported uri-scheme: ${uri.scheme}`),
			);
		}
		return Promise.resolve(
			provider.provideTextDocumentContent(
				URI.revive(uri),
				CancellationToken.None,
			),
		);
	}
}
