/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
	InstantiationType,
	registerSingleton,
} from "vs/platform/instantiation/common/extensions";
import { IWorkingCopyHistoryService } from "vs/workbench/services/workingCopy/common/workingCopyHistory";
import { NativeWorkingCopyHistoryService } from "vs/workbench/services/workingCopy/common/workingCopyHistoryService";

// Register Service
registerSingleton(
	IWorkingCopyHistoryService,
	NativeWorkingCopyHistoryService,
	InstantiationType.Delayed,
);
