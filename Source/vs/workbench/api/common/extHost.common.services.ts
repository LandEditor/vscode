/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
	InstantiationType,
	registerSingleton,
} from "vs/platform/instantiation/common/extensions";
import { ILoggerService } from "vs/platform/log/common/log";
import {
	ExtHostApiDeprecationService,
	IExtHostApiDeprecationService,
} from "vs/workbench/api/common/extHostApiDeprecationService";
import {
	ExtHostCommands,
	IExtHostCommands,
} from "vs/workbench/api/common/extHostCommands";
import {
	ExtHostConfiguration,
	IExtHostConfiguration,
} from "vs/workbench/api/common/extHostConfiguration";
import {
	IExtHostDebugService,
	WorkerExtHostDebugService,
} from "vs/workbench/api/common/extHostDebugService";
import {
	ExtHostDecorations,
	IExtHostDecorations,
} from "vs/workbench/api/common/extHostDecorations";
import {
	ExtHostDocumentsAndEditors,
	IExtHostDocumentsAndEditors,
} from "vs/workbench/api/common/extHostDocumentsAndEditors";
import {
	ExtHostEditorTabs,
	IExtHostEditorTabs,
} from "vs/workbench/api/common/extHostEditorTabs";
import {
	ExtHostConsumerFileSystem,
	IExtHostConsumerFileSystem,
} from "vs/workbench/api/common/extHostFileSystemConsumer";
import {
	ExtHostFileSystemInfo,
	IExtHostFileSystemInfo,
} from "vs/workbench/api/common/extHostFileSystemInfo";
import {
	ExtHostLocalizationService,
	IExtHostLocalizationService,
} from "vs/workbench/api/common/extHostLocalizationService";
import { ExtHostLoggerService } from "vs/workbench/api/common/extHostLoggerService";
import {
	ExtHostManagedSockets,
	IExtHostManagedSockets,
} from "vs/workbench/api/common/extHostManagedSockets";
import {
	ExtHostOutputService,
	IExtHostOutputService,
} from "vs/workbench/api/common/extHostOutput";
import {
	ExtHostSearch,
	IExtHostSearch,
} from "vs/workbench/api/common/extHostSearch";
import {
	ExtHostSecretState,
	IExtHostSecretState,
} from "vs/workbench/api/common/extHostSecretState";
import {
	ExtHostStorage,
	IExtHostStorage,
} from "vs/workbench/api/common/extHostStorage";
import {
	IExtHostTask,
	WorkerExtHostTask,
} from "vs/workbench/api/common/extHostTask";
import {
	ExtHostTelemetry,
	IExtHostTelemetry,
} from "vs/workbench/api/common/extHostTelemetry";
import {
	IExtHostTerminalService,
	WorkerExtHostTerminalService,
} from "vs/workbench/api/common/extHostTerminalService";
import {
	ExtHostTunnelService,
	IExtHostTunnelService,
} from "vs/workbench/api/common/extHostTunnelService";
import {
	ExtHostVariableResolverProviderService,
	IExtHostVariableResolverProvider,
} from "vs/workbench/api/common/extHostVariableResolverService";
import {
	ExtHostWindow,
	IExtHostWindow,
} from "vs/workbench/api/common/extHostWindow";
import {
	ExtHostWorkspace,
	IExtHostWorkspace,
} from "vs/workbench/api/common/extHostWorkspace";

registerSingleton(
	IExtHostLocalizationService,
	ExtHostLocalizationService,
	InstantiationType.Delayed,
);
registerSingleton(
	ILoggerService,
	ExtHostLoggerService,
	InstantiationType.Delayed,
);
registerSingleton(
	IExtHostApiDeprecationService,
	ExtHostApiDeprecationService,
	InstantiationType.Delayed,
);
registerSingleton(IExtHostCommands, ExtHostCommands, InstantiationType.Eager);
registerSingleton(
	IExtHostConfiguration,
	ExtHostConfiguration,
	InstantiationType.Eager,
);
registerSingleton(
	IExtHostConsumerFileSystem,
	ExtHostConsumerFileSystem,
	InstantiationType.Eager,
);
registerSingleton(
	IExtHostDebugService,
	WorkerExtHostDebugService,
	InstantiationType.Eager,
);
registerSingleton(
	IExtHostDecorations,
	ExtHostDecorations,
	InstantiationType.Eager,
);
registerSingleton(
	IExtHostDocumentsAndEditors,
	ExtHostDocumentsAndEditors,
	InstantiationType.Eager,
);
registerSingleton(
	IExtHostManagedSockets,
	ExtHostManagedSockets,
	InstantiationType.Eager,
);
registerSingleton(
	IExtHostFileSystemInfo,
	ExtHostFileSystemInfo,
	InstantiationType.Eager,
);
registerSingleton(
	IExtHostOutputService,
	ExtHostOutputService,
	InstantiationType.Delayed,
);
registerSingleton(IExtHostSearch, ExtHostSearch, InstantiationType.Eager);
registerSingleton(IExtHostStorage, ExtHostStorage, InstantiationType.Eager);
registerSingleton(IExtHostTask, WorkerExtHostTask, InstantiationType.Eager);
registerSingleton(
	IExtHostTerminalService,
	WorkerExtHostTerminalService,
	InstantiationType.Eager,
);
registerSingleton(
	IExtHostTunnelService,
	ExtHostTunnelService,
	InstantiationType.Eager,
);
registerSingleton(IExtHostWindow, ExtHostWindow, InstantiationType.Eager);
registerSingleton(IExtHostWorkspace, ExtHostWorkspace, InstantiationType.Eager);
registerSingleton(
	IExtHostSecretState,
	ExtHostSecretState,
	InstantiationType.Eager,
);
registerSingleton(IExtHostTelemetry, ExtHostTelemetry, InstantiationType.Eager);
registerSingleton(
	IExtHostEditorTabs,
	ExtHostEditorTabs,
	InstantiationType.Eager,
);
registerSingleton(
	IExtHostVariableResolverProvider,
	ExtHostVariableResolverProviderService,
	InstantiationType.Eager,
);
