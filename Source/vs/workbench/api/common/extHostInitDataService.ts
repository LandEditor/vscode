/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createDecorator } from "vs/platform/instantiation/common/instantiation";
import { IExtensionHostInitData } from "vs/workbench/services/extensions/common/extensionHostProtocol";

export const IExtHostInitDataService = createDecorator<IExtHostInitDataService>(
	"IExtHostInitDataService",
);

export interface IExtHostInitDataService
	extends Readonly<IExtensionHostInitData> {
	readonly _serviceBrand: undefined;
}
