/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { VSDataTransfer } from "vs/base/common/dataTransfer";
import {
	ITreeViewsDnDService as ITreeViewsDnDServiceCommon,
	TreeViewsDnDService,
} from "vs/editor/common/services/treeViewsDnd";
import {
	InstantiationType,
	registerSingleton,
} from "vs/platform/instantiation/common/extensions";
import { createDecorator } from "vs/platform/instantiation/common/instantiation";

export type ITreeViewsDnDService = ITreeViewsDnDServiceCommon<VSDataTransfer>;
export const ITreeViewsDnDService = createDecorator<ITreeViewsDnDService>(
	"treeViewsDndService",
);
registerSingleton(
	ITreeViewsDnDService,
	TreeViewsDnDService,
	InstantiationType.Delayed,
);
