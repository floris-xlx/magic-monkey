import express, { Request, Response } from "express";
import axios from "axios";
import { GRAPH_BASE, PORT, getOutlookToken } from "./config.js";
import { saveMessage, saveSubscription } from "./db.js";

const app = express();
app.use(express.json());

type SubscribeRequest = {
	notificationUrl?: string;
};

type GraphSubscription = {
	id: string;
	resource: string;
	changeType: string;
	expirationDateTime: string;
};

type GraphNotification = {
	resource?: string;
	resourceData?: {
		id?: string;
	};
};

type GraphMessage = {
	id: string;
	subject?: string | null;
	bodyPreview?: string | null;
	body?: {
		content?: string | null;
	};
};

function authHeaders() {
	return { Authorization: `Bearer ${getOutlookToken()}` };
}

app.post(
	"/subscribe",
	async (req: Request<unknown, unknown, SubscribeRequest>, res: Response) => {
		try {
			const { notificationUrl } = req.body || {};
			if (!notificationUrl || typeof notificationUrl !== "string") {
				return res.status(400).json({ error: "notificationUrl required" });
			}

			const expirationDateTime = new Date(Date.now() + 59 * 60 * 1000).toISOString();
			const payload = {
				changeType: "created",
				notificationUrl,
				resource: "/me/messages",
				expirationDateTime
			};

			const response = await axios.post<GraphSubscription>(
				`${GRAPH_BASE}/subscriptions`,
				payload,
				{
					headers: {
						...authHeaders(),
						"Content-Type": "application/json"
					},
					timeout: 10000
				}
			);

			const data = response.data;
			saveSubscription({
				id: data.id,
				resource: data.resource,
				changeType: data.changeType,
				expirationDateTime: data.expirationDateTime,
				notificationUrl,
				createdAt: new Date().toISOString()
			});

			return res.status(200).json(data);
		} catch (error: any) {
			const status = error?.response?.status ?? 500;
			const message = error?.response?.data ?? { error: "subscribe_failed" };
			return res.status(status).json(message);
		}
	}
);

app.post("/outlook/webhook", async (req, res) => {
	try {
		const validationToken = req.query?.validationToken;
		if (typeof validationToken === "string" && validationToken.length > 0) {
			res.set("Content-Type", "text/plain");
			return res.status(200).send(validationToken);
		}

		res.sendStatus(202);

		const notifications: GraphNotification[] = Array.isArray(req.body?.value)
			? req.body.value
			: [];
		if (!notifications.length) return;

		const first = notifications[0];
		const resourceDataId = first.resourceData?.id;
		const resourceId = first.resource?.split("/").pop() || null;
		const messageId = resourceDataId || resourceId;
		if (!messageId) return;

		const messageResp = await axios.get<GraphMessage>(
			`${GRAPH_BASE}/me/messages/${encodeURIComponent(messageId)}?$select=id,subject,bodyPreview,body`,
			{
				headers: authHeaders(),
				timeout: 10000
			}
		);

		const message = messageResp.data;
		const bodyPreview = message.bodyPreview || "";
		const bodyContent = message.body?.content || "";
		const codeRegex = /\b\d{6}\b/;
		const match = bodyPreview.match(codeRegex) || bodyContent.match(codeRegex);

		if (match) {
			console.log("Outlook 6-digit code:", match[0]);
		}

		saveMessage({
			messageId: message.id,
			subject: message.subject ?? null,
			code: match ? match[0] : null,
			receivedAt: new Date().toISOString()
		});
	} catch (error: any) {
		console.error("Webhook handling error:", error?.response?.data || error?.message || error);
	}
});

app.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`);
});


