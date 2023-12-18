/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationToken } from "vs/base/common/cancellation";
import { URI } from "vs/base/common/uri";
import { IConfigurationService } from "vs/platform/configuration/common/configuration";
import { IEnvironmentService } from "vs/platform/environment/common/environment";
import {
	AbstractExtensionResourceLoaderService,
	IExtensionResourceLoaderService,
} from "vs/platform/extensionResourceLoader/common/extensionResourceLoader";
import { IFileService } from "vs/platform/files/common/files";
import {
	InstantiationType,
	registerSingleton,
} from "vs/platform/instantiation/common/extensions";
import { IProductService } from "vs/platform/product/common/productService";
import {
	IRequestService,
	asTextOrError,
} from "vs/platform/request/common/request";
import { IStorageService } from "vs/platform/storage/common/storage";

export class ExtensionResourceLoaderService extends AbstractExtensionResourceLoaderService {
	constructor(
		@IFileService fileService: IFileService,
		@IStorageService storageService: IStorageService,
		@IProductService productService: IProductService,
		@IEnvironmentService environmentService: IEnvironmentService,
		@IConfigurationService configurationService: IConfigurationService,
		@IRequestService private readonly _requestService: IRequestService
	) {
		super(
			fileService,
			storageService,
			productService,
			environmentService,
			configurationService
		);
	}

	async readExtensionResource(uri: URI): Promise<string> {
		if (this.isExtensionGalleryResource(uri)) {
			const headers = await this.getExtensionGalleryRequestHeaders();
			const requestContext = await this._requestService.request(
				{ url: uri.toString(), headers },
				CancellationToken.None,
			);
			return (await asTextOrError(requestContext)) || "";
		}
		const result = await this._fileService.readFile(uri);
		return result.value.toString();
	}
}

registerSingleton(
	IExtensionResourceLoaderService,
	ExtensionResourceLoaderService,
	InstantiationType.Delayed,
);
