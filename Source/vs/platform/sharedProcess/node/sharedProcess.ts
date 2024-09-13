/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { IStringDictionary } from "../../../base/common/collections.js";
import type { UriComponents, UriDto } from "../../../base/common/uri.js";
import type { NativeParsedArgs } from "../../environment/common/argv.js";
import type { ILoggerResource, LogLevel } from "../../log/common/log.js";
import type {
	PolicyDefinition,
	PolicyValue,
} from "../../policy/common/policy.js";
import type { IUserDataProfile } from "../../userDataProfile/common/userDataProfile.js";

export interface ISharedProcessConfiguration {
	readonly machineId: string;

	readonly sqmId: string;

	readonly devDeviceId: string;

	readonly codeCachePath: string | undefined;

	readonly args: NativeParsedArgs;

	readonly logLevel: LogLevel;

	readonly loggers: UriDto<ILoggerResource>[];

	readonly profiles: {
		readonly home: UriComponents;
		readonly all: readonly UriDto<IUserDataProfile>[];
	};

	readonly policiesData?: IStringDictionary<{
		definition: PolicyDefinition;
		value: PolicyValue;
	}>;
}
