import Database from "better-sqlite3";
import { DB_PATH } from "./config.js";

const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");
db.exec(`
	CREATE TABLE IF NOT EXISTS subscriptions (
		id TEXT PRIMARY KEY,
		resource TEXT NOT NULL,
		changeType TEXT NOT NULL,
		expirationDateTime TEXT NOT NULL,
		notificationUrl TEXT NOT NULL,
		createdAt TEXT NOT NULL
	);
	CREATE TABLE IF NOT EXISTS message_codes (
		messageId TEXT PRIMARY KEY,
		subject TEXT,
		code TEXT,
		receivedAt TEXT NOT NULL
	);
`);

type SubscriptionRecord = {
	id: string;
	resource: string;
	changeType: string;
	expirationDateTime: string;
	notificationUrl: string;
	createdAt: string;
};

type MessageRecord = {
	messageId: string;
	subject: string | null;
	code: string | null;
	receivedAt: string;
};

const upsertSubscriptionStmt = db.prepare<SubscriptionRecord>(`
	INSERT INTO subscriptions (id, resource, changeType, expirationDateTime, notificationUrl, createdAt)
	VALUES (@id, @resource, @changeType, @expirationDateTime, @notificationUrl, @createdAt)
	ON CONFLICT(id) DO UPDATE SET
		resource = excluded.resource,
		changeType = excluded.changeType,
		expirationDateTime = excluded.expirationDateTime,
		notificationUrl = excluded.notificationUrl,
		createdAt = excluded.createdAt
`);

const upsertMessageStmt = db.prepare<MessageRecord>(`
	INSERT INTO message_codes (messageId, subject, code, receivedAt)
	VALUES (@messageId, @subject, @code, @receivedAt)
	ON CONFLICT(messageId) DO UPDATE SET
		subject = excluded.subject,
		code = excluded.code,
		receivedAt = excluded.receivedAt
`);

export function saveSubscription(record: SubscriptionRecord): void {
	upsertSubscriptionStmt.run(record);
}

export function saveMessage(record: MessageRecord): void {
	upsertMessageStmt.run(record);
}


