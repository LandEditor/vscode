/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Event } from "vs/base/common/event";
import { Platform } from "vs/base/common/platform";
import { TerminateResponse } from "vs/base/common/processes";
import Severity from "vs/base/common/severity";
import { URI } from "vs/base/common/uri";
import { ConfigurationTarget } from "vs/platform/configuration/common/configuration";
import { IWorkspaceFolder } from "vs/platform/workspace/common/workspace";
import { ITaskEvent, KeyedTaskIdentifier, Task } from "./tasks";

export enum TaskErrors {
	NotConfigured = 0,
	RunningTask = 1,
	NoBuildTask = 2,
	NoTestTask = 3,
	ConfigValidationError = 4,
	TaskNotFound = 5,
	NoValidTaskRunner = 6,
	UnknownError = 7,
}

export class TaskError {
	public severity: Severity;
	public message: string;
	public code: TaskErrors;

	constructor(severity: Severity, message: string, code: TaskErrors) {
		this.severity = severity;
		this.message = message;
		this.code = code;
	}
}

export namespace Triggers {
	export const shortcut: string = "shortcut";
	export const command: string = "command";
	export const reconnect: string = "reconnect";
}

export interface ITaskSummary {
	/**
	 * Exit code of the process.
	 */
	exitCode?: number;
}

export enum TaskExecuteKind {
	Started = 1,
	Active = 2,
}

export interface ITaskExecuteResult {
	kind: TaskExecuteKind;
	promise: Promise<ITaskSummary>;
	task: Task;
	started?: {
		restartOnFileChanges?: string;
	};
	active?: {
		same: boolean;
		background: boolean;
	};
}

export interface ITaskResolver {
	resolve(
		uri: URI | string,
		identifier: string | KeyedTaskIdentifier | undefined,
	): Promise<Task | undefined>;
}

export interface ITaskTerminateResponse extends TerminateResponse {
	task: Task | undefined;
}

export interface IResolveSet {
	process?: {
		name: string;
		cwd?: string;
		path?: string;
	};
	variables: Set<string>;
}

export interface IResolvedVariables {
	process?: string;
	variables: Map<string, string>;
}

export interface ITaskSystemInfo {
	platform: Platform;
	context: any;
	uriProvider: (this: void, path: string) => URI;
	resolveVariables(
		workspaceFolder: IWorkspaceFolder,
		toResolve: IResolveSet,
		target: ConfigurationTarget,
	): Promise<IResolvedVariables | undefined>;
	findExecutable(
		command: string,
		cwd?: string,
		paths?: string[],
	): Promise<string | undefined>;
}

export interface ITaskSystemInfoResolver {
	(workspaceFolder: IWorkspaceFolder | undefined):
		| ITaskSystemInfo
		| undefined;
}

export interface ITaskSystem {
	onDidStateChange: Event<ITaskEvent>;
	reconnect(task: Task, resolver: ITaskResolver): ITaskExecuteResult;
	run(task: Task, resolver: ITaskResolver): ITaskExecuteResult;
	rerun(): ITaskExecuteResult | undefined;
	isActive(): Promise<boolean>;
	isActiveSync(): boolean;
	getActiveTasks(): Task[];
	getLastInstance(task: Task): Task | undefined;
	getBusyTasks(): Task[];
	canAutoTerminate(): boolean;
	terminate(task: Task): Promise<ITaskTerminateResponse>;
	terminateAll(): Promise<ITaskTerminateResponse[]>;
	revealTask(task: Task): boolean;
	customExecutionComplete(task: Task, result: number): Promise<void>;
	isTaskVisible(task: Task): boolean;
}
