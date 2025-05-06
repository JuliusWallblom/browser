const DB_NAME = "merlin-preferences";
const STORE_NAME = "preferences";
const DB_VERSION = 1;

interface Preference<T> {
	id: string;
	value: T;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function initDB(): Promise<IDBDatabase> {
	if (dbPromise) {
		return dbPromise;
	}

	dbPromise = new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				db.createObjectStore(STORE_NAME, { keyPath: "id" });
			}
		};

		request.onsuccess = (event) => {
			resolve((event.target as IDBOpenDBRequest).result);
		};

		request.onerror = (event) => {
			console.error(
				"IndexedDB error:",
				(event.target as IDBOpenDBRequest).error,
			);
			reject((event.target as IDBOpenDBRequest).error);
			dbPromise = null; // Reset promise on error
		};
	});
	return dbPromise;
}

export async function getPreference<T>(
	id: string,
	defaultValue: T,
): Promise<T> {
	try {
		const db = await initDB();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction(STORE_NAME, "readonly");
			const store = transaction.objectStore(STORE_NAME);
			const request = store.get(id);

			request.onsuccess = (event) => {
				const result = (event.target as IDBRequest<Preference<T>>).result;
				if (result) {
					resolve(result.value);
				} else {
					resolve(defaultValue);
				}
			};

			request.onerror = (event) => {
				console.error(
					"Error getting preference:",
					(event.target as IDBRequest).error,
				);
				resolve(defaultValue); // Resolve with default on error
			};
		});
	} catch (error) {
		console.error("Failed to initialize DB for getPreference:", error);
		return defaultValue; // Return default if DB init fails
	}
}

export async function setPreference<T>(id: string, value: T): Promise<void> {
	try {
		const db = await initDB();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction(STORE_NAME, "readwrite");
			const store = transaction.objectStore(STORE_NAME);
			const request = store.put({ id, value });

			request.onsuccess = () => {
				resolve();
			};

			request.onerror = (event) => {
				console.error(
					"Error setting preference:",
					(event.target as IDBRequest).error,
				);
				reject((event.target as IDBRequest).error);
			};
		});
	} catch (error) {
		console.error("Failed to initialize DB for setPreference:", error);
		// Optionally re-throw or handle as appropriate
	}
}

// // Initialize DB on load -- Re-commenting this out as PreferencesProvider handles init
// initDB().catch((error) => {
// 	console.error("Failed to initialize preferences DB on load:", error);
// });
