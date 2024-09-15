/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { hash } from "../../../../base/common/hash.js";
import { Disposable } from "../../../../base/common/lifecycle.js";
import {
	INotificationService,
	type NotificationMessage,
	NotificationPriority,
} from "../../../../platform/notification/common/notification.js";
import { ITelemetryService } from "../../../../platform/telemetry/common/telemetry.js";
import type { IWorkbenchContribution } from "../../../common/contributions.js";

export interface NotificationMetrics {
	readonly id: string;
	readonly silent: boolean;
	readonly source?: string;
}

export type NotificationMetricsClassification = {
	id: {
		classification: "SystemMetaData";
		purpose: "FeatureInsight";
		comment: "The identifier of the source of the notification.";
	};
	silent: {
		classification: "SystemMetaData";
		purpose: "FeatureInsight";
		comment: "Whether the notification is silent or not.";
	};
	source?: {
		classification: "SystemMetaData";
		purpose: "FeatureInsight";
		comment: "The source of the notification.";
	};
	owner: "bpasero";
	comment: "Helps us gain insights to what notifications are being shown, how many, and if they are silent or not.";
};

export function notificationToMetrics(
	message: NotificationMessage,
	source: string | undefined,
	silent: boolean,
): NotificationMetrics {
	return {
		id: hash(message.toString()).toString(),
		silent,
		source: source || "core",
	};
}

export class NotificationsTelemetry
	extends Disposable
	implements IWorkbenchContribution
{
	constructor(
		@ITelemetryService private readonly telemetryService: ITelemetryService,
		@INotificationService private readonly notificationService: INotificationService
	) {
		super();
		this.registerListeners();
	}

	private registerListeners(): void {
		this._register(
			this.notificationService.onDidAddNotification((notification) => {
				const source =
					notification.source &&
					typeof notification.source !== "string"
						? notification.source.id
						: notification.source;
				this.telemetryService.publicLog2<
					NotificationMetrics,
					NotificationMetricsClassification
				>(
					"notification:show",
					notificationToMetrics(
						notification.message,
						source,
						notification.priority === NotificationPriority.SILENT,
					),
				);
			}),
		);

		this._register(
			this.notificationService.onDidRemoveNotification((notification) => {
				const source =
					notification.source &&
					typeof notification.source !== "string"
						? notification.source.id
						: notification.source;
				this.telemetryService.publicLog2<
					NotificationMetrics,
					NotificationMetricsClassification
				>(
					"notification:close",
					notificationToMetrics(
						notification.message,
						source,
						notification.priority === NotificationPriority.SILENT,
					),
				);
			}),
		);
	}
}
