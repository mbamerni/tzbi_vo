const fs = require('fs');

async function fetchSurahs() {
    try {
        const response = await fetch('https://api.quran.com/api/v4/chapters?language=ar');
        const data = await response.json();

        if (data && data.chapters) {
            const mapped = data.chapters.map(c => ({
                id: c.id,
                revelation_place: c.revelation_place, // makkah / madinah
                revelation_order: c.revelation_order,
                bismillah_pre: c.bismillah_pre,
                name_simple: c.name_simple, // English simple
                name_complex: c.name_complex,
                name_arabic: c.name_arabic,
                verses_count: c.verses_count,
                pages: c.pages // [start, end]
            }));

            const content = `// Auto-generated Surah metadata from quran.com api
export interface SurahMeta {
    id: number;
    revelation_place: 'makkah' | 'madinah';
    revelation_order: number;
    bismillah_pre: boolean;
    name_simple: string;
    name_complex: string;
    name_arabic: string;
    verses_count: number;
    pages: number[];
}

export const QURAN_SURAHS: SurahMeta[] = ${JSON.stringify(mapped, null, 4)};
`;
            fs.writeFileSync('lib/quran-surahs.ts', content, 'utf8');
            console.log('Successfully wrote lib/quran-surahs.ts');
        } else {
            console.log('No chapters found', data);
        }
    } catch (e) {
        console.error('Failed to fetch', e);
    }
}

fetchSurahs();
