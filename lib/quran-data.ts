export interface QuranAyah {
    verse_key: string; // e.g. "1:1"
    surah_number: number;
    ayah_number: number;
    text_uthmani: string;
    page_number: number;
}

export interface QuranPageMap {
    page_number: number;
    verse_keys: string[];
}

export interface QuranProgress {
    verse_key: string;
    is_memorized: boolean;
    last_reviewed_at: number;
}

const DB_NAME = "quran_memorization_db";
const DB_VERSION = 1;

export const STORES = {
    AYAHS: "quran_ayahs",
    PAGES: "quran_pages",
    PROGRESS: "quran_progress",
};

export function openQuranDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
            const db = (event.target as IDBOpenDBRequest).result;

            // Create Ayahs store
            if (!db.objectStoreNames.contains(STORES.AYAHS)) {
                const ayahsStore = db.createObjectStore(STORES.AYAHS, { keyPath: "verse_key" });
                ayahsStore.createIndex("page_number", "page_number", { unique: false });
                ayahsStore.createIndex("surah_number", "surah_number", { unique: false });
            }

            // Create Pages store
            if (!db.objectStoreNames.contains(STORES.PAGES)) {
                db.createObjectStore(STORES.PAGES, { keyPath: "page_number" });
            }

            // Create Progress store
            if (!db.objectStoreNames.contains(STORES.PROGRESS)) {
                db.createObjectStore(STORES.PROGRESS, { keyPath: "verse_key" });
            }
        };
    });
}

// Function to fetch and initialize Quran data
export async function initializeQuranData(onProgress?: (msg: string) => void): Promise<boolean> {
    try {
        const db = await openQuranDB();

        // Check if empty
        const count = await new Promise<number>((resolve, reject) => {
            const tx = db.transaction(STORES.AYAHS, "readonly");
            const store = tx.objectStore(STORES.AYAHS);
            const req = store.count();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });

        if (count > 0) {
            if (onProgress) onProgress("Data already exists locally.");
            return true; // Already initialized
        }

        if (onProgress) onProgress("Fetching Quran text (Tanzil)...");

        // 1. Fetch Tanzil Uthmani Text (Simple version without marks for now or Uthmani)
        // Using a reliable CDN for Tanzil Uthmani text (JSON format)
        // The structure usually is: data.data.surahs array
        // Since direct Tanzil download requires login or parsing raw text, we will use Alquran.cloud API which provides Tanzil Uthmani text
        const response = await fetch("https://api.alquran.cloud/v1/quran/quran-uthmani");
        if (!response.ok) throw new Error("Failed to fetch Quran text");
        const quranData = await response.json();

        if (onProgress) onProgress("Processing Ayahs...");

        const ayahsToInsert: QuranAyah[] = [];
        const surahs = quranData.data.surahs;

        for (const surah of surahs) {
            for (const ayah of surah.ayahs) {
                ayahsToInsert.push({
                    verse_key: `${surah.number}:${ayah.numberInSurah}`,
                    surah_number: surah.number,
                    ayah_number: ayah.numberInSurah,
                    text_uthmani: ayah.text,
                    page_number: ayah.page
                });
            }
        }

        // Since Alquran.cloud also provides page numbers from Madani mushaf directly on the ayah object, 
        // we can skip calling the Quran Foundation API for page mapping and just use this mapped data!

        if (onProgress) onProgress("Saving to local database...");

        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction([STORES.AYAHS, STORES.PAGES], "readwrite");

            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);

            const ayahsStore = tx.objectStore(STORES.AYAHS);
            const pagesStore = tx.objectStore(STORES.PAGES);

            const pageMap = new Map<number, string[]>();

            for (const ayah of ayahsToInsert) {
                ayahsStore.put(ayah);

                const existing = pageMap.get(ayah.page_number) || [];
                existing.push(ayah.verse_key);
                pageMap.set(ayah.page_number, existing);
            }

            for (const [pageNum, keys] of Array.from(pageMap.entries())) {
                pagesStore.put({
                    page_number: pageNum,
                    verse_keys: keys
                });
            }
        });

        // Save flag
        localStorage.setItem("quran_initialized", "true");
        if (onProgress) onProgress("Initialization complete.");
        return true;

    } catch (error) {
        console.error("Error initializing Quran data:", error);
        return false;
    }
}

export async function getAyahsByPage(pageNumber: number): Promise<QuranAyah[]> {
    const db = await openQuranDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORES.AYAHS, "readonly");
        const store = tx.objectStore(STORES.AYAHS);
        const index = store.index("page_number");
        const request = index.getAll(pageNumber);

        request.onsuccess = () => {
            // IndexedDB getAll from index might not be perfectly ordered by ayah_number if not careful,
            // but usually insertion order or primary key order (verse_key as string) might mess up "2:9" vs "2:10"
            // Let's sort them programmatically just in case
            const ayahs = request.result as QuranAyah[];
            ayahs.sort((a, b) => {
                if (a.surah_number !== b.surah_number) {
                    return a.surah_number - b.surah_number;
                }
                return a.ayah_number - b.ayah_number;
            });
            resolve(ayahs);
        };
        request.onerror = () => reject(request.error);
    });
}

export async function getQuranProgress(): Promise<Record<string, boolean>> {
    const db = await openQuranDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORES.PROGRESS, "readonly");
        const store = tx.objectStore(STORES.PROGRESS);
        const request = store.getAll();

        request.onsuccess = () => {
            const records = request.result as QuranProgress[];
            const progressMap: Record<string, boolean> = {};
            records.forEach(r => {
                progressMap[r.verse_key] = r.is_memorized;
            });
            resolve(progressMap);
        };
        request.onerror = () => reject(request.error);
    });
}

export async function toggleAyahMemorized(verseKey: string, isMemorized: boolean): Promise<void> {
    const db = await openQuranDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORES.PROGRESS, "readwrite");
        const store = tx.objectStore(STORES.PROGRESS);

        const data: QuranProgress = {
            verse_key: verseKey,
            is_memorized: isMemorized,
            last_reviewed_at: Date.now()
        };

        const request = store.put(data);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}
