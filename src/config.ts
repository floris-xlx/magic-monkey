const rawPort = Number(process.env.PORT);

export const PORT = Number.isFinite(rawPort) && rawPort > 0 ? rawPort : 8080;
export const GRAPH_BASE = "https://graph.microsoft.com/v1.0";
export const DB_PATH = process.env.OUTLOOK_DB_PATH || "./outlook.db";

export function getOutlookToken(): string {
	const token = process.env.OUTLOOK_TOKEN;
	if (!token) throw new Error("Missing OUTLOOK_TOKEN");
	return token;
}


