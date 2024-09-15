/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { CancellationToken } from "../../../../base/common/cancellation.js";
import type { Event } from "../../../../base/common/event.js";
import { isLinux } from "../../../../base/common/platform.js";
import type { ReadableStreamEvents } from "../../../../base/common/stream.js";
import type { URI } from "../../../../base/common/uri.js";
import { localize } from "../../../../nls.js";
import { AbstractDiskFileSystemProvider } from "../../../../platform/files/common/diskFileSystemProvider.js";
import {
	DiskFileSystemProviderClient,
	LOCAL_FILE_SYSTEM_CHANNEL_NAME,
} from "../../../../platform/files/common/diskFileSystemProviderClient.js";
import type {
	FileSystemProviderCapabilities,
	FileType,
	IFileAtomicReadOptions,
	IFileChange,
	IFileDeleteOptions,
	IFileOpenOptions,
	IFileOverwriteOptions,
	IFileReadStreamOptions,
	IFileSystemProviderWithFileAtomicReadCapability,
	IFileSystemProviderWithFileCloneCapability,
	IFileSystemProviderWithFileFolderCopyCapability,
	IFileSystemProviderWithFileReadStreamCapability,
	IFileSystemProviderWithFileReadWriteCapability,
	IFileSystemProviderWithOpenReadWriteCloseCapability,
	IFileWriteOptions,
	IStat,
} from "../../../../platform/files/common/files.js";
import type {
	AbstractUniversalWatcherClient,
	ILogMessage,
} from "../../../../platform/files/common/watcher.js";
import type { IMainProcessService } from "../../../../platform/ipc/common/mainProcessService.js";
import type {
	ILogService,
	ILoggerService,
} from "../../../../platform/log/common/log.js";
import { LogService } from "../../../../platform/log/common/logService.js";
import type { IUtilityProcessWorkerWorkbenchService } from "../../utilityProcess/electron-sandbox/utilityProcessWorkerWorkbenchService.js";
import { UniversalWatcherClient } from "./watcherClient.js";

/**
 * A sandbox ready disk file system provider that delegates almost all calls
 * to the main process via `DiskFileSystemProviderServer` except for recursive
 * file watching that is done via shared process workers due to CPU intensity.
 */
export class DiskFileSystemProvider
	extends AbstractDiskFileSystemProvider
	implements
		IFileSystemProviderWithFileReadWriteCapability,
		IFileSystemProviderWithOpenReadWriteCloseCapability,
		IFileSystemProviderWithFileReadStreamCapability,
		IFileSystemProviderWithFileFolderCopyCapability,
		IFileSystemProviderWithFileAtomicReadCapability,
		IFileSystemProviderWithFileCloneCapability
{
	private readonly provider = this._register(
		new DiskFileSystemProviderClient(
			this.mainProcessService.getChannel(LOCAL_FILE_SYSTEM_CHANNEL_NAME),
			{ pathCaseSensitive: isLinux, trash: true },
		),
	);

	constructor(
		private readonly mainProcessService: IMainProcessService,
		private readonly utilityProcessWorkerWorkbenchService: IUtilityProcessWorkerWorkbenchService,
		logService: ILogService,
		private readonly loggerService: ILoggerService,
	) {
		super(logService, {
			watcher: {
				forceUniversal: true /* send all requests to universal watcher process */,
			},
		});

		this.registerListeners();
	}

	setUseNextWatcher(): void {
		this.options = {
			watcher: {
				forceUniversal: true,
				recursive: { useNext: true, usePolling: false },
			},
		};
	}

	private registerListeners(): void {
		// Forward events from the embedded provider
		this._register(
			this.provider.onDidChangeFile((changes) =>
				this._onDidChangeFile.fire(changes),
			),
		);
		this._register(
			this.provider.onDidWatchError((error) =>
				this._onDidWatchError.fire(error),
			),
		);
	}

	//#region File Capabilities

	get onDidChangeCapabilities(): Event<void> {
		return this.provider.onDidChangeCapabilities;
	}

	get capabilities(): FileSystemProviderCapabilities {
		return this.provider.capabilities;
	}

	//#endregion

	//#region File Metadata Resolving

	stat(resource: URI): Promise<IStat> {
		return this.provider.stat(resource);
	}

	readdir(resource: URI): Promise<[string, FileType][]> {
		return this.provider.readdir(resource);
	}

	//#endregion

	//#region File Reading/Writing

	readFile(
		resource: URI,
		opts?: IFileAtomicReadOptions,
	): Promise<Uint8Array> {
		return this.provider.readFile(resource, opts);
	}

	readFileStream(
		resource: URI,
		opts: IFileReadStreamOptions,
		token: CancellationToken,
	): ReadableStreamEvents<Uint8Array> {
		return this.provider.readFileStream(resource, opts, token);
	}

	writeFile(
		resource: URI,
		content: Uint8Array,
		opts: IFileWriteOptions,
	): Promise<void> {
		return this.provider.writeFile(resource, content, opts);
	}

	open(resource: URI, opts: IFileOpenOptions): Promise<number> {
		return this.provider.open(resource, opts);
	}

	close(fd: number): Promise<void> {
		return this.provider.close(fd);
	}

	read(
		fd: number,
		pos: number,
		data: Uint8Array,
		offset: number,
		length: number,
	): Promise<number> {
		return this.provider.read(fd, pos, data, offset, length);
	}

	write(
		fd: number,
		pos: number,
		data: Uint8Array,
		offset: number,
		length: number,
	): Promise<number> {
		return this.provider.write(fd, pos, data, offset, length);
	}

	//#endregion

	//#region Move/Copy/Delete/Create Folder

	mkdir(resource: URI): Promise<void> {
		return this.provider.mkdir(resource);
	}

	delete(resource: URI, opts: IFileDeleteOptions): Promise<void> {
		return this.provider.delete(resource, opts);
	}

	rename(from: URI, to: URI, opts: IFileOverwriteOptions): Promise<void> {
		return this.provider.rename(from, to, opts);
	}

	copy(from: URI, to: URI, opts: IFileOverwriteOptions): Promise<void> {
		return this.provider.copy(from, to, opts);
	}

	//#endregion

	//#region Clone File

	cloneFile(from: URI, to: URI): Promise<void> {
		return this.provider.cloneFile(from, to);
	}

	//#endregion

	//#region File Watching

	protected createUniversalWatcher(
		onChange: (changes: IFileChange[]) => void,
		onLogMessage: (msg: ILogMessage) => void,
		verboseLogging: boolean,
	): AbstractUniversalWatcherClient {
		return new UniversalWatcherClient(
			(changes) => onChange(changes),
			(msg) => onLogMessage(msg),
			verboseLogging,
			this.utilityProcessWorkerWorkbenchService,
		);
	}

	protected createNonRecursiveWatcher(): never {
		throw new Error("Method not implemented in sandbox."); // we never expect this to be called given we set `forceUniversal: true`
	}

	private _watcherLogService: ILogService | undefined = undefined;
	private get watcherLogService(): ILogService {
		if (!this._watcherLogService) {
			this._watcherLogService = new LogService(
				this.loggerService.createLogger("fileWatcher", {
					name: localize("fileWatcher", "File Watcher"),
				}),
			);
		}

		return this._watcherLogService;
	}

	protected override logWatcherMessage(msg: ILogMessage): void {
		this.watcherLogService[msg.type](msg.message);

		if (msg.type !== "trace" && msg.type !== "debug") {
			super.logWatcherMessage(msg); // allow non-verbose log messages in window log
		}
	}

	//#endregion
}
