/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { CancellationToken } from "../../../../base/common/cancellation.js";
import type { ResourceSet } from "../../../../base/common/map.js";
import { createDecorator } from "../../../../platform/instantiation/common/instantiation.js";
import type {
	ISearchComplete,
	ISearchProgressItem,
	ITextQuery,
} from "../../../services/search/common/search.js";

export const INotebookSearchService = createDecorator<INotebookSearchService>(
	"notebookSearchService",
);

export interface INotebookSearchService {
	readonly _serviceBrand: undefined;

	notebookSearch(
		query: ITextQuery,
		token: CancellationToken | undefined,
		searchInstanceID: string,
		onProgress?: (result: ISearchProgressItem) => void,
	): {
		openFilesToScan: ResourceSet;
		completeData: Promise<ISearchComplete>;
		allScannedFiles: Promise<ResourceSet>;
	};
}
