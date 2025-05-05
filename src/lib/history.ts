/** @typedef {import('idb').DBSchema} DBSchema */
/** @typedef {import('idb').IDBPDatabase} IDBPDatabase */

/**
 * @typedef {Object} HistoryDBSchema
 * @property {Object} history
 * @property {string} history.key
 * @property {Object} history.value
 * @property {string} history.value.url
 * @property {string} history.value.title
 * @property {string} [history.value.favicon]
 * @property {number} history.value.visitTime
 * @property {number} history.value.lastVisitTime
 * @property {number} history.value.visitCount
 * @property {Object} history.indexes
 * @property {number} history.indexes.by-visit-time
 * @property {string} history.indexes.by-url
 */

/** @extends {DBSchema} */
const HistoryDB = /** @type {HistoryDBSchema} */ ({});

class HistoryService {
	/** @type {Promise<IDBPDatabase<typeof HistoryDB>>} */
	db;

	constructor() {
		// Use dynamic import for the actual module
		this.db = import("idb").then(({ openDB }) =>
			openDB("browser-history", 1, {
				upgrade(db) {
					const historyStore = db.createObjectStore("history", {
						keyPath: "url",
					});
					historyStore.createIndex("by-visit-time", "lastVisitTime");
					historyStore.createIndex("by-url", "url");
				},
			}),
		);
	}

	async addVisit(url: string, title: string, favicon?: string) {
		if (!url || url === "about:blank") return;

		const db = await this.db;
		const tx = db.transaction("history", "readwrite");
		const store = tx.objectStore("history");

		const existing = await store.get(url);
		const now = Date.now();

		if (existing) {
			await store.put({
				...existing,
				title: title || existing.title,
				favicon: favicon || existing.favicon,
				lastVisitTime: now,
				visitCount: existing.visitCount + 1,
			});
		} else {
			await store.add({
				url,
				title,
				favicon,
				visitTime: now,
				lastVisitTime: now,
				visitCount: 1,
			});
		}

		await tx.done;
	}

	async searchHistory(
		query: string,
		limit = 5,
	): Promise<
		Array<{
			url: string;
			title: string;
			subtitle: string;
			favicon?: string;
		}>
	> {
		if (!query) return [];

		const db = await this.db;
		const tx = db.transaction("history", "readonly");
		const index = tx.store.index("by-visit-time");

		const results: Array<{
			url: string;
			title: string;
			favicon?: string;
			lastVisitTime: number;
			visitCount: number;
		}> = [];

		// Get all entries and filter/sort in memory for better search
		let cursor = await index.openCursor(null, "prev");
		while (cursor && results.length < limit * 2) {
			const { url, title } = cursor.value;

			// Simple search in URL and title
			if (
				url.toLowerCase().includes(query.toLowerCase()) ||
				title.toLowerCase().includes(query.toLowerCase())
			) {
				results.push(cursor.value);
			}

			cursor = await cursor.continue();
		}

		// Sort by visit count and recency
		results.sort((a, b) => {
			// Prioritize visit count (70% weight)
			const visitScore = b.visitCount - a.visitCount;
			// Consider recency (30% weight)
			const recencyScore = b.lastVisitTime - a.lastVisitTime;

			return visitScore * 0.7 + recencyScore * 0.3;
		});

		// Return only what we need
		return results.slice(0, limit).map(({ url, title, favicon }) => ({
			url,
			title,
			subtitle: "",
			favicon,
		}));
	}

	async deleteHistory(url: string) {
		const db = await this.db;
		await db.delete("history", url);
	}

	async clearHistory() {
		const db = await this.db;
		await db.clear("history");
	}
}

export const historyService = new HistoryService();
