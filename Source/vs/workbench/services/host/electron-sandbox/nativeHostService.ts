/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
	disposableWindowInterval,
	getActiveDocument,
	getWindowId,
	getWindowsCount,
	hasWindow,
	onDidRegisterWindow,
} from "../../../../base/browser/dom.js";
import { isAuxiliaryWindow } from "../../../../base/browser/window.js";
import { memoize } from "../../../../base/common/decorators.js";
import { Emitter, Event } from "../../../../base/common/event.js";
import { Disposable } from "../../../../base/common/lifecycle.js";
import { webUtils } from "../../../../base/parts/sandbox/electron-sandbox/globals.js";
import {
	InstantiationType,
	registerSingleton,
} from "../../../../platform/instantiation/common/extensions.js";
import { IMainProcessService } from "../../../../platform/ipc/common/mainProcessService.js";
import {
	ILabelService,
	Verbosity,
} from "../../../../platform/label/common/label.js";
import { INativeHostService } from "../../../../platform/native/common/native.js";
import { NativeHostService } from "../../../../platform/native/common/nativeHostService.js";
import {
	isFolderToOpen,
	isWorkspaceToOpen,
	type IOpenEmptyWindowOptions,
	type IOpenWindowOptions,
	type IPoint,
	type IRectangle,
	type IWindowOpenable,
} from "../../../../platform/window/common/window.js";
import { IWorkbenchEnvironmentService } from "../../environment/common/environmentService.js";
import { INativeWorkbenchEnvironmentService } from "../../environment/electron-sandbox/environmentService.js";
import { IHostService } from "../browser/host.js";

class WorkbenchNativeHostService extends NativeHostService {
	constructor(
		@INativeWorkbenchEnvironmentService
		environmentService: INativeWorkbenchEnvironmentService,
		@IMainProcessService mainProcessService: IMainProcessService,
	) {
		super(environmentService.window.id, mainProcessService);
	}
}

class WorkbenchHostService extends Disposable implements IHostService {
	declare readonly _serviceBrand: undefined;

	constructor(
		@INativeHostService
		private readonly nativeHostService: INativeHostService,
		@ILabelService private readonly labelService: ILabelService,
		@IWorkbenchEnvironmentService
		private readonly environmentService: IWorkbenchEnvironmentService,
	) {
		super();
	}

	//#region Focus

	readonly onDidChangeFocus = Event.latch(
		Event.any(
			Event.map(
				Event.filter(
					this.nativeHostService.onDidFocusMainOrAuxiliaryWindow,
					(id) => hasWindow(id),
					this._store,
				),
				() => this.hasFocus,
				this._store,
			),
			Event.map(
				Event.filter(
					this.nativeHostService.onDidBlurMainOrAuxiliaryWindow,
					(id) => hasWindow(id),
					this._store,
				),
				() => this.hasFocus,
				this._store,
			),
			Event.map(
				this.onDidChangeActiveWindow,
				() => this.hasFocus,
				this._store,
			),
		),
		undefined,
		this._store,
	);

	get hasFocus(): boolean {
		return getActiveDocument().hasFocus();
	}

	async hadLastFocus(): Promise<boolean> {
		const activeWindowId = await this.nativeHostService.getActiveWindowId();

		if (typeof activeWindowId === "undefined") {
			return false;
		}

		return activeWindowId === this.nativeHostService.windowId;
	}

	//#endregion

	//#region Window

	@memoize
	get onDidChangeActiveWindow(): Event<number> {
		const emitter = this._register(new Emitter<number>());

		// Emit via native focus tracking
		this._register(
			Event.filter(
				this.nativeHostService.onDidFocusMainOrAuxiliaryWindow,
				(id) => hasWindow(id),
				this._store,
			)((id) => emitter.fire(id)),
		);

		this._register(
			onDidRegisterWindow(({ window, disposables }) => {
				// Emit via interval: immediately when opening an auxiliary window,
				// it is possible that document focus has not yet changed, so we
				// poll for a while to ensure we catch the event.
				disposables.add(
					disposableWindowInterval(
						window,
						() => {
							const hasFocus = window.document.hasFocus();
							if (hasFocus) {
								emitter.fire(window.vscodeWindowId);
							}

							return hasFocus;
						},
						100,
						20,
					),
				);
			}),
		);

		return Event.latch(emitter.event, undefined, this._store);
	}

	readonly onDidChangeFullScreen = Event.filter(
		this.nativeHostService.onDidChangeWindowFullScreen,
		(e) => hasWindow(e.windowId),
		this._store,
	);

	openWindow(options?: IOpenEmptyWindowOptions): Promise<void>;
	openWindow(
		toOpen: IWindowOpenable[],
		options?: IOpenWindowOptions,
	): Promise<void>;
	openWindow(
		arg1?: IOpenEmptyWindowOptions | IWindowOpenable[],
		arg2?: IOpenWindowOptions,
	): Promise<void> {
		if (Array.isArray(arg1)) {
			return this.doOpenWindow(arg1, arg2);
		}

		return this.doOpenEmptyWindow(arg1);
	}

	private doOpenWindow(
		toOpen: IWindowOpenable[],
		options?: IOpenWindowOptions,
	): Promise<void> {
		const remoteAuthority = this.environmentService.remoteAuthority;
		if (!!remoteAuthority) {
			toOpen.forEach(
				(openable) =>
					(openable.label =
						openable.label || this.getRecentLabel(openable)),
			);

			if (options?.remoteAuthority === undefined) {
				// set the remoteAuthority of the window the request came from.
				// It will be used when the input is neither file nor vscode-remote.
				options = options
					? { ...options, remoteAuthority }
					: { remoteAuthority };
			}
		}

		return this.nativeHostService.openWindow(toOpen, options);
	}

	private getRecentLabel(openable: IWindowOpenable): string {
		if (isFolderToOpen(openable)) {
			return this.labelService.getWorkspaceLabel(openable.folderUri, {
				verbose: Verbosity.LONG,
			});
		}

		if (isWorkspaceToOpen(openable)) {
			return this.labelService.getWorkspaceLabel(
				{ id: "", configPath: openable.workspaceUri },
				{ verbose: Verbosity.LONG },
			);
		}

		return this.labelService.getUriLabel(openable.fileUri);
	}

	private doOpenEmptyWindow(
		options?: IOpenEmptyWindowOptions,
	): Promise<void> {
		const remoteAuthority = this.environmentService.remoteAuthority;
		if (!!remoteAuthority && options?.remoteAuthority === undefined) {
			// set the remoteAuthority of the window the request came from
			options = options
				? { ...options, remoteAuthority }
				: { remoteAuthority };
		}
		return this.nativeHostService.openWindow(options);
	}

	toggleFullScreen(targetWindow: Window): Promise<void> {
		return this.nativeHostService.toggleFullScreen({
			targetWindowId: isAuxiliaryWindow(targetWindow)
				? targetWindow.vscodeWindowId
				: undefined,
		});
	}

	async moveTop(targetWindow: Window): Promise<void> {
		if (getWindowsCount() <= 1) {
			return; // does not apply when only one window is opened
		}

		return this.nativeHostService.moveWindowTop(
			isAuxiliaryWindow(targetWindow)
				? { targetWindowId: targetWindow.vscodeWindowId }
				: undefined,
		);
	}

	getCursorScreenPoint(): Promise<{
		readonly point: IPoint;
		readonly display: IRectangle;
	}> {
		return this.nativeHostService.getCursorScreenPoint();
	}

	//#endregion

	//#region Lifecycle

	focus(targetWindow: Window, options?: { force: boolean }): Promise<void> {
		return this.nativeHostService.focusWindow({
			force: options?.force,
			targetWindowId: getWindowId(targetWindow),
		});
	}

	restart(): Promise<void> {
		return this.nativeHostService.relaunch();
	}

	reload(options?: { disableExtensions?: boolean }): Promise<void> {
		return this.nativeHostService.reload(options);
	}

	close(): Promise<void> {
		return this.nativeHostService.closeWindow();
	}

	async withExpectedShutdown<T>(
		expectedShutdownTask: () => Promise<T>,
	): Promise<T> {
		return await expectedShutdownTask();
	}

	//#endregion

	//#region File

	getPathForFile(file: File): string {
		return webUtils.getPathForFile(file);
	}

	//#endregion
}

registerSingleton(
	IHostService,
	WorkbenchHostService,
	InstantiationType.Delayed,
);
registerSingleton(
	INativeHostService,
	WorkbenchNativeHostService,
	InstantiationType.Delayed,
);
