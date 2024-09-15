/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { setFullscreen } from "../../base/browser/browser.js";
import { domContentLoaded } from "../../base/browser/dom.js";
import { mainWindow } from "../../base/browser/window.js";
import { onUnexpectedError } from "../../base/common/errors.js";
import { Disposable } from "../../base/common/lifecycle.js";
import { Schemas } from "../../base/common/network.js";
import { safeStringify } from "../../base/common/objects.js";
import {
	isBigSurOrNewer,
	isCI,
	isMacintosh,
} from "../../base/common/platform.js";
import { URI } from "../../base/common/uri.js";
import { ProxyChannel } from "../../base/parts/ipc/common/ipc.js";
import { localize } from "../../nls.js";
import type { IConfigurationService } from "../../platform/configuration/common/configuration.js";
import { IFileService } from "../../platform/files/common/files.js";
import { FileService } from "../../platform/files/common/fileService.js";
import { ServiceCollection } from "../../platform/instantiation/common/serviceCollection.js";
import { IMainProcessService } from "../../platform/ipc/common/mainProcessService.js";
import { ElectronIPCMainProcessService } from "../../platform/ipc/electron-sandbox/mainProcessService.js";
import { ISharedProcessService } from "../../platform/ipc/electron-sandbox/services.js";
import {
	ILoggerService,
	ILogService,
	LogLevel,
} from "../../platform/log/common/log.js";
import { LoggerChannelClient } from "../../platform/log/common/logIpc.js";
import {
	IPolicyService,
	NullPolicyService,
} from "../../platform/policy/common/policy.js";
import { PolicyChannelClient } from "../../platform/policy/common/policyIpc.js";
import product from "../../platform/product/common/product.js";
import { IProductService } from "../../platform/product/common/productService.js";
import { BrowserSocketFactory } from "../../platform/remote/browser/browserSocketFactory.js";
import {
	IRemoteAuthorityResolverService,
	RemoteConnectionType,
} from "../../platform/remote/common/remoteAuthorityResolver.js";
import {
	IRemoteSocketFactoryService,
	RemoteSocketFactoryService,
} from "../../platform/remote/common/remoteSocketFactoryService.js";
import { ElectronRemoteResourceLoader } from "../../platform/remote/electron-sandbox/electronRemoteResourceLoader.js";
import { RemoteAuthorityResolverService } from "../../platform/remote/electron-sandbox/remoteAuthorityResolverService.js";
import { ISignService } from "../../platform/sign/common/sign.js";
import { IStorageService } from "../../platform/storage/common/storage.js";
import { IUriIdentityService } from "../../platform/uriIdentity/common/uriIdentity.js";
import { UriIdentityService } from "../../platform/uriIdentity/common/uriIdentityService.js";
import { FileUserDataProvider } from "../../platform/userData/common/fileUserDataProvider.js";
import {
	IUserDataProfilesService,
	reviveProfile,
} from "../../platform/userDataProfile/common/userDataProfile.js";
import { UserDataProfilesService } from "../../platform/userDataProfile/common/userDataProfileIpc.js";
import type {
	INativeWindowConfiguration,
	IWindowsConfiguration,
} from "../../platform/window/common/window.js";
import { applyZoom } from "../../platform/window/electron-sandbox/window.js";
import {
	isSingleFolderWorkspaceIdentifier,
	isWorkspaceIdentifier,
	IWorkspaceContextService,
	reviveIdentifier,
	toWorkspaceIdentifier,
	type IAnyWorkspaceIdentifier,
} from "../../platform/workspace/common/workspace.js";
import {
	IWorkspaceTrustEnablementService,
	IWorkspaceTrustManagementService,
} from "../../platform/workspace/common/workspaceTrust.js";
import { Workbench } from "../browser/workbench.js";
import { WorkspaceService } from "../services/configuration/browser/configurationService.js";
import { IWorkbenchConfigurationService } from "../services/configuration/common/configuration.js";
import { ConfigurationCache } from "../services/configuration/common/configurationCache.js";
import {
	INativeWorkbenchEnvironmentService,
	NativeWorkbenchEnvironmentService,
} from "../services/environment/electron-sandbox/environmentService.js";
import { DiskFileSystemProvider } from "../services/files/electron-sandbox/diskFileSystemProvider.js";
import {
	INativeKeyboardLayoutService,
	NativeKeyboardLayoutService,
} from "../services/keybinding/electron-sandbox/nativeKeyboardLayoutService.js";
import { NativeLogService } from "../services/log/electron-sandbox/logService.js";
import { IRemoteAgentService } from "../services/remote/common/remoteAgentService.js";
import { RemoteFileSystemProviderClient } from "../services/remote/common/remoteFileSystemProviderClient.js";
import { RemoteAgentService } from "../services/remote/electron-sandbox/remoteAgentService.js";
import { SharedProcessService } from "../services/sharedProcess/electron-sandbox/sharedProcessService.js";
import { NativeWorkbenchStorageService } from "../services/storage/electron-sandbox/storageService.js";
import { IUserDataProfileService } from "../services/userDataProfile/common/userDataProfile.js";
import { UserDataProfileService } from "../services/userDataProfile/common/userDataProfileService.js";
import {
	IUtilityProcessWorkerWorkbenchService,
	UtilityProcessWorkerWorkbenchService,
} from "../services/utilityProcess/electron-sandbox/utilityProcessWorkerWorkbenchService.js";
import {
	WorkspaceTrustEnablementService,
	WorkspaceTrustManagementService,
} from "../services/workspaces/common/workspaceTrust.js";
import { NativeWindow } from "./window.js";

export class DesktopMain extends Disposable {
	constructor(private readonly configuration: INativeWindowConfiguration) {
		super();

		this.init();
	}

	private init(): void {
		// Massage configuration file URIs
		this.reviveUris();

		// Apply fullscreen early if configured
		setFullscreen(!!this.configuration.fullscreen, mainWindow);
	}

	private reviveUris() {
		// Workspace
		const workspace = reviveIdentifier(this.configuration.workspace);
		if (
			isWorkspaceIdentifier(workspace) ||
			isSingleFolderWorkspaceIdentifier(workspace)
		) {
			this.configuration.workspace = workspace;
		}

		// Files
		const filesToWait = this.configuration.filesToWait;
		const filesToWaitPaths = filesToWait?.paths;
		for (const paths of [
			filesToWaitPaths,
			this.configuration.filesToOpenOrCreate,
			this.configuration.filesToDiff,
			this.configuration.filesToMerge,
		]) {
			if (Array.isArray(paths)) {
				for (const path of paths) {
					if (path.fileUri) {
						path.fileUri = URI.revive(path.fileUri);
					}
				}
			}
		}

		if (filesToWait) {
			filesToWait.waitMarkerFileUri = URI.revive(
				filesToWait.waitMarkerFileUri,
			);
		}
	}

	async open(): Promise<void> {
		// Init services and wait for DOM to be ready in parallel
		const [services] = await Promise.all([
			this.initServices(),
			domContentLoaded(mainWindow),
		]);

		// Apply zoom level early once we have a configuration service
		// and before the workbench is created to prevent flickering.
		// We also need to respect that zoom level can be configured per
		// workspace, so we need the resolved configuration service.
		// Finally, it is possible for the window to have a custom
		// zoom level that is not derived from settings.
		// (fixes https://github.com/microsoft/vscode/issues/187982)
		this.applyWindowZoomLevel(services.configurationService);

		// Create Workbench
		const workbench = new Workbench(
			mainWindow.document.body,
			{ extraClasses: this.getExtraClasses() },
			services.serviceCollection,
			services.logService,
		);

		// Listeners
		this.registerListeners(workbench, services.storageService);

		// Startup
		const instantiationService = workbench.startup();

		// Window
		this._register(instantiationService.createInstance(NativeWindow));
	}

	private applyWindowZoomLevel(configurationService: IConfigurationService) {
		let zoomLevel: number | undefined;
		if (
			this.configuration.isCustomZoomLevel &&
			typeof this.configuration.zoomLevel === "number"
		) {
			zoomLevel = this.configuration.zoomLevel;
		} else {
			const windowConfig =
				configurationService.getValue<IWindowsConfiguration>();
			zoomLevel =
				typeof windowConfig.window?.zoomLevel === "number"
					? windowConfig.window.zoomLevel
					: 0;
		}

		applyZoom(zoomLevel, mainWindow);
	}

	private getExtraClasses(): string[] {
		if (isMacintosh && isBigSurOrNewer(this.configuration.os.release)) {
			return ["macos-bigsur-or-newer"];
		}

		return [];
	}

	private registerListeners(
		workbench: Workbench,
		storageService: NativeWorkbenchStorageService,
	): void {
		// Workbench Lifecycle
		this._register(
			workbench.onWillShutdown((event) =>
				event.join(storageService.close(), {
					id: "join.closeStorage",
					label: localize("join.closeStorage", "Saving UI state"),
				}),
			),
		);
		this._register(workbench.onDidShutdown(() => this.dispose()));
	}

	private async initServices(): Promise<{
		serviceCollection: ServiceCollection;
		logService: ILogService;
		storageService: NativeWorkbenchStorageService;
		configurationService: IConfigurationService;
	}> {
		const serviceCollection = new ServiceCollection();

		// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
		//
		// NOTE: Please do NOT register services here. Use `registerSingleton()`
		//       from `workbench.common.main.ts` if the service is shared between
		//       desktop and web or `workbench.desktop.main.ts` if the service
		//       is desktop only.
		//
		// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

		// Main Process
		const mainProcessService = this._register(
			new ElectronIPCMainProcessService(this.configuration.windowId),
		);
		serviceCollection.set(IMainProcessService, mainProcessService);

		// Policies
		const policyService = this.configuration.policiesData
			? new PolicyChannelClient(
					this.configuration.policiesData,
					mainProcessService.getChannel("policy"),
				)
			: new NullPolicyService();
		serviceCollection.set(IPolicyService, policyService);

		// Product
		const productService: IProductService = {
			_serviceBrand: undefined,
			...product,
		};
		serviceCollection.set(IProductService, productService);

		// Environment
		const environmentService = new NativeWorkbenchEnvironmentService(
			this.configuration,
			productService,
		);
		serviceCollection.set(
			INativeWorkbenchEnvironmentService,
			environmentService,
		);

		// Logger
		const loggers = [
			...this.configuration.loggers.global.map((loggerResource) => ({
				...loggerResource,
				resource: URI.revive(loggerResource.resource),
			})),
			...this.configuration.loggers.window.map((loggerResource) => ({
				...loggerResource,
				resource: URI.revive(loggerResource.resource),
				hidden: true,
			})),
		];
		const loggerService = new LoggerChannelClient(
			this.configuration.windowId,
			this.configuration.logLevel,
			environmentService.windowLogsPath,
			loggers,
			mainProcessService.getChannel("logger"),
		);
		serviceCollection.set(ILoggerService, loggerService);

		// Log
		const logService = this._register(
			new NativeLogService(loggerService, environmentService),
		);
		serviceCollection.set(ILogService, logService);
		if (isCI) {
			logService.info("workbench#open()"); // marking workbench open helps to diagnose flaky integration/smoke tests
		}
		if (logService.getLevel() === LogLevel.Trace) {
			logService.trace(
				"workbench#open(): with configuration",
				safeStringify({
					...this.configuration,
					nls: undefined /* exclude large property */,
				}),
			);
		}

		// Shared Process
		const sharedProcessService = new SharedProcessService(
			this.configuration.windowId,
			logService,
		);
		serviceCollection.set(ISharedProcessService, sharedProcessService);

		// Utility Process Worker
		const utilityProcessWorkerWorkbenchService =
			new UtilityProcessWorkerWorkbenchService(
				this.configuration.windowId,
				logService,
				mainProcessService,
			);
		serviceCollection.set(
			IUtilityProcessWorkerWorkbenchService,
			utilityProcessWorkerWorkbenchService,
		);

		// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
		//
		// NOTE: Please do NOT register services here. Use `registerSingleton()`
		//       from `workbench.common.main.ts` if the service is shared between
		//       desktop and web or `workbench.desktop.main.ts` if the service
		//       is desktop only.
		//
		// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

		// Sign
		const signService = ProxyChannel.toService<ISignService>(
			mainProcessService.getChannel("sign"),
		);
		serviceCollection.set(ISignService, signService);

		// Files
		const fileService = this._register(new FileService(logService));
		serviceCollection.set(IFileService, fileService);

		// Remote
		const remoteAuthorityResolverService =
			new RemoteAuthorityResolverService(
				productService,
				new ElectronRemoteResourceLoader(
					environmentService.window.id,
					mainProcessService,
					fileService,
				),
			);
		serviceCollection.set(
			IRemoteAuthorityResolverService,
			remoteAuthorityResolverService,
		);

		// Local Files
		const diskFileSystemProvider = this._register(
			new DiskFileSystemProvider(
				mainProcessService,
				utilityProcessWorkerWorkbenchService,
				logService,
				loggerService,
			),
		);
		fileService.registerProvider(Schemas.file, diskFileSystemProvider);

		// URI Identity
		const uriIdentityService = new UriIdentityService(fileService);
		serviceCollection.set(IUriIdentityService, uriIdentityService);

		// User Data Profiles
		const userDataProfilesService = new UserDataProfilesService(
			this.configuration.profiles.all,
			URI.revive(this.configuration.profiles.home).with({
				scheme: environmentService.userRoamingDataHome.scheme,
			}),
			mainProcessService.getChannel("userDataProfiles"),
		);
		serviceCollection.set(
			IUserDataProfilesService,
			userDataProfilesService,
		);
		const userDataProfileService = new UserDataProfileService(
			reviveProfile(
				this.configuration.profiles.profile,
				userDataProfilesService.profilesHome.scheme,
			),
		);
		serviceCollection.set(IUserDataProfileService, userDataProfileService);

		// Use FileUserDataProvider for user data to
		// enable atomic read / write operations.
		fileService.registerProvider(
			Schemas.vscodeUserData,
			this._register(
				new FileUserDataProvider(
					Schemas.file,
					diskFileSystemProvider,
					Schemas.vscodeUserData,
					userDataProfilesService,
					uriIdentityService,
					logService,
				),
			),
		);

		// Remote Agent
		const remoteSocketFactoryService = new RemoteSocketFactoryService();
		remoteSocketFactoryService.register(
			RemoteConnectionType.WebSocket,
			new BrowserSocketFactory(null),
		);
		serviceCollection.set(
			IRemoteSocketFactoryService,
			remoteSocketFactoryService,
		);
		const remoteAgentService = this._register(
			new RemoteAgentService(
				remoteSocketFactoryService,
				userDataProfileService,
				environmentService,
				productService,
				remoteAuthorityResolverService,
				signService,
				logService,
			),
		);
		serviceCollection.set(IRemoteAgentService, remoteAgentService);

		// Remote Files
		this._register(
			RemoteFileSystemProviderClient.register(
				remoteAgentService,
				fileService,
				logService,
			),
		);

		// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
		//
		// NOTE: Please do NOT register services here. Use `registerSingleton()`
		//       from `workbench.common.main.ts` if the service is shared between
		//       desktop and web or `workbench.desktop.main.ts` if the service
		//       is desktop only.
		//
		// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

		// Create services that require resolving in parallel
		const workspace = this.resolveWorkspaceIdentifier(environmentService);
		const [configurationService, storageService] = await Promise.all([
			this.createWorkspaceService(
				workspace,
				environmentService,
				userDataProfileService,
				userDataProfilesService,
				fileService,
				remoteAgentService,
				uriIdentityService,
				logService,
				policyService,
			).then((service) => {
				// Workspace
				serviceCollection.set(IWorkspaceContextService, service);

				// Configuration
				serviceCollection.set(IWorkbenchConfigurationService, service);

				return service;
			}),

			this.createStorageService(
				workspace,
				environmentService,
				userDataProfileService,
				userDataProfilesService,
				mainProcessService,
			).then((service) => {
				// Storage
				serviceCollection.set(IStorageService, service);

				return service;
			}),

			this.createKeyboardLayoutService(mainProcessService).then(
				(service) => {
					// KeyboardLayout
					serviceCollection.set(
						INativeKeyboardLayoutService,
						service,
					);

					return service;
				},
			),
		]);

		// Workspace Trust Service
		const workspaceTrustEnablementService =
			new WorkspaceTrustEnablementService(
				configurationService,
				environmentService,
			);
		serviceCollection.set(
			IWorkspaceTrustEnablementService,
			workspaceTrustEnablementService,
		);

		const workspaceTrustManagementService =
			new WorkspaceTrustManagementService(
				configurationService,
				remoteAuthorityResolverService,
				storageService,
				uriIdentityService,
				environmentService,
				configurationService,
				workspaceTrustEnablementService,
				fileService,
			);
		serviceCollection.set(
			IWorkspaceTrustManagementService,
			workspaceTrustManagementService,
		);

		// Update workspace trust so that configuration is updated accordingly
		configurationService.updateWorkspaceTrust(
			workspaceTrustManagementService.isWorkspaceTrusted(),
		);
		this._register(
			workspaceTrustManagementService.onDidChangeTrust(() =>
				configurationService.updateWorkspaceTrust(
					workspaceTrustManagementService.isWorkspaceTrusted(),
				),
			),
		);

		// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
		//
		// NOTE: Please do NOT register services here. Use `registerSingleton()`
		//       from `workbench.common.main.ts` if the service is shared between
		//       desktop and web or `workbench.desktop.main.ts` if the service
		//       is desktop only.
		//
		// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

		return {
			serviceCollection,
			logService,
			storageService,
			configurationService,
		};
	}

	private resolveWorkspaceIdentifier(
		environmentService: INativeWorkbenchEnvironmentService,
	): IAnyWorkspaceIdentifier {
		// Return early for when a folder or multi-root is opened
		if (this.configuration.workspace) {
			return this.configuration.workspace;
		}

		// Otherwise, workspace is empty, so we derive an identifier
		return toWorkspaceIdentifier(
			this.configuration.backupPath,
			environmentService.isExtensionDevelopment,
		);
	}

	private async createWorkspaceService(
		workspace: IAnyWorkspaceIdentifier,
		environmentService: INativeWorkbenchEnvironmentService,
		userDataProfileService: IUserDataProfileService,
		userDataProfilesService: IUserDataProfilesService,
		fileService: FileService,
		remoteAgentService: IRemoteAgentService,
		uriIdentityService: IUriIdentityService,
		logService: ILogService,
		policyService: IPolicyService,
	): Promise<WorkspaceService> {
		const configurationCache = new ConfigurationCache(
			[
				Schemas.file,
				Schemas.vscodeUserData,
			] /* Cache all non native resources */,
			environmentService,
			fileService,
		);
		const workspaceService = new WorkspaceService(
			{
				remoteAuthority: environmentService.remoteAuthority,
				configurationCache,
			},
			environmentService,
			userDataProfileService,
			userDataProfilesService,
			fileService,
			remoteAgentService,
			uriIdentityService,
			logService,
			policyService,
		);

		try {
			await workspaceService.initialize(workspace);

			return workspaceService;
		} catch (error) {
			onUnexpectedError(error);

			return workspaceService;
		}
	}

	private async createStorageService(
		workspace: IAnyWorkspaceIdentifier,
		environmentService: INativeWorkbenchEnvironmentService,
		userDataProfileService: IUserDataProfileService,
		userDataProfilesService: IUserDataProfilesService,
		mainProcessService: IMainProcessService,
	): Promise<NativeWorkbenchStorageService> {
		const storageService = new NativeWorkbenchStorageService(
			workspace,
			userDataProfileService,
			userDataProfilesService,
			mainProcessService,
			environmentService,
		);

		try {
			await storageService.initialize();

			return storageService;
		} catch (error) {
			onUnexpectedError(error);

			return storageService;
		}
	}

	private async createKeyboardLayoutService(
		mainProcessService: IMainProcessService,
	): Promise<NativeKeyboardLayoutService> {
		const keyboardLayoutService = new NativeKeyboardLayoutService(
			mainProcessService,
		);

		try {
			await keyboardLayoutService.initialize();

			return keyboardLayoutService;
		} catch (error) {
			onUnexpectedError(error);

			return keyboardLayoutService;
		}
	}
}

export function main(configuration: INativeWindowConfiguration): Promise<void> {
	const workbench = new DesktopMain(configuration);

	return workbench.open();
}
