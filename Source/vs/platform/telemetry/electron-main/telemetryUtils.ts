/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { getdevDeviceId } from "../../../base/node/id.js";
import { ILogService } from "../../log/common/log.js";
import { IStateService } from "../../state/node/state.js";
import { devDeviceIdKey, machineIdKey, sqmIdKey } from "../common/telemetry.js";
import {
	resolvedevDeviceId as resolveNodedevDeviceId,
	resolveMachineId as resolveNodeMachineId,
	resolveSqmId as resolveNodeSqmId,
} from "../node/telemetryUtils.js";

export async function resolveMachineId(
	stateService: IStateService,
	logService: ILogService,
): Promise<string> {
	// Call the node layers implementation to avoid code duplication
	const machineId = await resolveNodeMachineId(stateService, logService);

	stateService.setItem(machineIdKey, machineId);

	return machineId;
}
export async function resolveSqmId(
	stateService: IStateService,
	logService: ILogService,
): Promise<string> {
	const sqmId = await resolveNodeSqmId(stateService, logService);

	stateService.setItem(sqmIdKey, sqmId);

	return sqmId;
}
export async function resolvedevDeviceId(
	stateService: IStateService,
	logService: ILogService,
): Promise<string> {
	const devDeviceId = await resolveNodedevDeviceId(stateService, logService);

	stateService.setItem(devDeviceIdKey, devDeviceId);

	return devDeviceId;
}

export async function validatedevDeviceId(
	stateService: IStateService,
	logService: ILogService,
): Promise<void> {
	const actualDeviceId = await getdevDeviceId(
		logService.error.bind(logService),
	);

	const currentDeviceId = await resolveNodedevDeviceId(
		stateService,
		logService,
	);

	if (actualDeviceId !== currentDeviceId) {
		stateService.setItem(devDeviceIdKey, actualDeviceId);
	}
}
