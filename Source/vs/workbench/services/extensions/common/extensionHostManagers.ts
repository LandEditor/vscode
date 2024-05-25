/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { Event } from "vs/base/common/event";
import type { URI } from "vs/base/common/uri";
import type {
	ExtensionIdentifier,
	IExtensionDescription,
} from "vs/platform/extensions/common/extensions";
import type { ExtensionHostKind } from "vs/workbench/services/extensions/common/extensionHostKind";
import type { IExtensionDescriptionDelta } from "vs/workbench/services/extensions/common/extensionHostProtocol";
import type { IResolveAuthorityResult } from "vs/workbench/services/extensions/common/extensionHostProxy";
import type { ExtensionRunningLocation } from "vs/workbench/services/extensions/common/extensionRunningLocation";
import type {
	ActivationKind,
	ExtensionActivationReason,
	ExtensionHostStartup,
} from "vs/workbench/services/extensions/common/extensions";
import type { ResponsiveState } from "vs/workbench/services/extensions/common/rpcProtocol";

export interface IExtensionHostManager {
	readonly pid: number | null;
	readonly kind: ExtensionHostKind;
	readonly startup: ExtensionHostStartup;
	readonly friendyName: string;
	readonly onDidExit: Event<[number, string | null]>;
	readonly onDidChangeResponsiveState: Event<ResponsiveState>;
	dispose(): void;
	ready(): Promise<void>;
	representsRunningLocation(
		runningLocation: ExtensionRunningLocation,
	): boolean;
	deltaExtensions(extensionsDelta: IExtensionDescriptionDelta): Promise<void>;
	containsExtension(extensionId: ExtensionIdentifier): boolean;
	activate(
		extension: ExtensionIdentifier,
		reason: ExtensionActivationReason,
	): Promise<boolean>;
	activateByEvent(
		activationEvent: string,
		activationKind: ActivationKind,
	): Promise<void>;
	activationEventIsDone(activationEvent: string): boolean;
	getInspectPort(
		tryEnableInspector: boolean,
	): Promise<{ port: number; host: string } | undefined>;
	resolveAuthority(
		remoteAuthority: string,
		resolveAttempt: number,
	): Promise<IResolveAuthorityResult>;
	/**
	 * Returns `null` if no resolver for `remoteAuthority` is found.
	 */
	getCanonicalURI(remoteAuthority: string, uri: URI): Promise<URI | null>;
	start(
		extensionRegistryVersionId: number,
		allExtensions: readonly IExtensionDescription[],
		myExtensions: ExtensionIdentifier[],
	): Promise<void>;
	extensionTestsExecute(): Promise<number>;
	setRemoteEnvironment(env: { [key: string]: string | null }): Promise<void>;
}
