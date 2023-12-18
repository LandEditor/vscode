/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { SyncDescriptor } from "vs/platform/instantiation/common/descriptors";
import {
	InstantiationType,
	registerSingleton,
} from "vs/platform/instantiation/common/extensions";
import { ILogService, ILoggerService } from "vs/platform/log/common/log";
import { ISignService } from "vs/platform/sign/common/sign";
import { SignService } from "vs/platform/sign/node/signService";
import { IExtHostDebugService } from "vs/workbench/api/common/extHostDebugService";
import { IExtHostExtensionService } from "vs/workbench/api/common/extHostExtensionService";
import { ExtHostLogService } from "vs/workbench/api/common/extHostLogService";
import { IExtHostSearch } from "vs/workbench/api/common/extHostSearch";
import { IExtensionStoragePaths } from "vs/workbench/api/common/extHostStoragePaths";
import { IExtHostTask } from "vs/workbench/api/common/extHostTask";
import { IExtHostTerminalService } from "vs/workbench/api/common/extHostTerminalService";
import { IExtHostTunnelService } from "vs/workbench/api/common/extHostTunnelService";
import { IExtHostVariableResolverProvider } from "vs/workbench/api/common/extHostVariableResolverService";
import { ExtHostDebugService } from "vs/workbench/api/node/extHostDebugService";
import { ExtHostExtensionService } from "vs/workbench/api/node/extHostExtensionService";
import { ExtHostLoggerService } from "vs/workbench/api/node/extHostLoggerService";
import { NativeExtHostSearch } from "vs/workbench/api/node/extHostSearch";
import { ExtensionStoragePaths } from "vs/workbench/api/node/extHostStoragePaths";
import { ExtHostTask } from "vs/workbench/api/node/extHostTask";
import { ExtHostTerminalService } from "vs/workbench/api/node/extHostTerminalService";
import { NodeExtHostTunnelService } from "vs/workbench/api/node/extHostTunnelService";
import { NodeExtHostVariableResolverProviderService } from "vs/workbench/api/node/extHostVariableResolverService";

// #########################################################################
// ###                                                                   ###
// ### !!! PLEASE ADD COMMON IMPORTS INTO extHost.common.services.ts !!! ###
// ###                                                                   ###
// #########################################################################

registerSingleton(
	IExtHostExtensionService,
	ExtHostExtensionService,
	InstantiationType.Eager,
);
registerSingleton(
	ILoggerService,
	ExtHostLoggerService,
	InstantiationType.Delayed,
);
registerSingleton(
	ILogService,
	new SyncDescriptor(ExtHostLogService, [false], true),
);
registerSingleton(ISignService, SignService, InstantiationType.Delayed);
registerSingleton(
	IExtensionStoragePaths,
	ExtensionStoragePaths,
	InstantiationType.Eager,
);

registerSingleton(
	IExtHostDebugService,
	ExtHostDebugService,
	InstantiationType.Eager,
);
registerSingleton(IExtHostSearch, NativeExtHostSearch, InstantiationType.Eager);
registerSingleton(IExtHostTask, ExtHostTask, InstantiationType.Eager);
registerSingleton(
	IExtHostTerminalService,
	ExtHostTerminalService,
	InstantiationType.Eager,
);
registerSingleton(
	IExtHostTunnelService,
	NodeExtHostTunnelService,
	InstantiationType.Eager,
);
registerSingleton(
	IExtHostVariableResolverProvider,
	NodeExtHostVariableResolverProviderService,
	InstantiationType.Eager,
);
