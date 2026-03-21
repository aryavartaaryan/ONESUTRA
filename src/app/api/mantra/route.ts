import { NextRequest, NextResponse } from 'next/server';

type MantraPayload = {
  sanskrit: string;
  meaning: string;
  deity: string;
};

type ExternalMantraPayload = {
  slok?: string;
  shloka?: string;
  et?: string;
  meaning?: string;
  siva?: { et?: string };
  tej?: { et?: string };
};

type SourceMantra = {
  sanskrit: string;
  meaning: string;
  deity: string;
};

const CHAPTER_VERSE_COUNTS = [
  47, 72, 43, 42, 29, 47, 30, 28, 34,
  42, 55, 20, 35, 27, 20, 24, 28, 78,
];

const OFFLINE_FALLBACK: MantraPayload = {
  sanskrit: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन ।',
  meaning: 'You have a right to perform your prescribed duty, but you are not entitled to the fruits of action.',
  deity: 'Bhagavad Gita (Offline Fallback)',
};

const HINDU_MANTRAS: SourceMantra[] = [
  {
    sanskrit: 'ॐ नमः शिवाय',
    meaning: 'I bow to Shiva, the auspicious and benevolent consciousness.',
    deity: 'Hindu Mantra • Shiva Panchakshari',
  },
  {
    sanskrit: 'ॐ गं गणपतये नमः',
    meaning: 'Salutations to Ganesha, remover of obstacles and lord of beginnings.',
    deity: 'Hindu Mantra • Ganesha',
  },
  {
    sanskrit: 'ॐ श्रीं महालक्ष्म्यै नमः',
    meaning: 'I invoke Goddess Lakshmi for grace, prosperity and abundance.',
    deity: 'Hindu Mantra • Mahalakshmi',
  },
];

const VEDIC_MANTRAS: SourceMantra[] = [
  {
    sanskrit: 'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं ।',
    meaning: 'We meditate upon the divine light that illumines all realms.',
    deity: 'Vedic Mantra • Gayatri',
  },
  {
    sanskrit: 'असतो मा सद्गमय । तमसो मा ज्योतिर्गमय ।',
    meaning: 'Lead me from untruth to truth, from darkness to light.',
    deity: 'Vedic Mantra • Brihadaranyaka Upanishad',
  },
  {
    sanskrit: 'सर्वे भवन्तु सुखिनः सर्वे सन्तु निरामयाः ।',
    meaning: 'May all beings be happy, healthy and free from suffering.',
    deity: 'Vedic Prayer • Universal Peace',
  },
];

function randomFrom<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

function randomChapterAndVerse() {
  const chapter = Math.floor(Math.random() * 18) + 1;
  const maxVerse = CHAPTER_VERSE_COUNTS[chapter - 1] ?? 20;
  const verse = Math.floor(Math.random() * maxVerse) + 1;
  return { chapter, verse };
}

function mapExternalToMantra(data: ExternalMantraPayload, chapter: number, verse: number): MantraPayload {
  const sanskrit = String(data?.slok || data?.shloka || '').trim();
  const englishMeaning =
    String(data?.siva?.et || data?.tej?.et || data?.et || data?.meaning || '').trim();

  return {
    sanskrit: sanskrit || OFFLINE_FALLBACK.sanskrit,
    meaning: englishMeaning || 'Translation not available for this verse.',
    deity: `Bhagavad Gita • Chapter ${chapter}, Verse ${verse}`,
  };
}

async function fetchOneMantra(): Promise<MantraPayload> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const { chapter, verse } = randomChapterAndVerse();
    const url = `https://bhagavadgitaapi.in/slok/${chapter}/${verse}`;

    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      continue;
    }

    const data = await response.json();
    return mapExternalToMantra(data, chapter, verse);
  }

  return OFFLINE_FALLBACK;
}

async function fetchMixedMantra(): Promise<MantraPayload> {
  const pick = Math.random();

  // 45% Bhagavad Gita, 27.5% Hindu, 27.5% Vedic
  if (pick < 0.45) {
    const gita = await fetchOneMantra();
    if (gita.sanskrit && gita.deity !== OFFLINE_FALLBACK.deity) {
      return gita;
    }
  }

  if (pick < 0.725) {
    return randomFrom(HINDU_MANTRAS);
  }

  return randomFrom(VEDIC_MANTRAS);
}

export async function GET(req: NextRequest) {
  const countParam = req.nextUrl.searchParams.get('count');
  const count = Math.max(1, Math.min(Number(countParam || '1') || 1, 8));

  try {
    if (count === 1) {
      const mantra = await fetchMixedMantra();
      return NextResponse.json(mantra, {
        status: 200,
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      });
    }

    const items = await Promise.all(Array.from({ length: count }, () => fetchMixedMantra()));
    return NextResponse.json(
      { items },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      }
    );
  } catch {
    const localPool = [...HINDU_MANTRAS, ...VEDIC_MANTRAS, OFFLINE_FALLBACK];
    if (count === 1) {
      return NextResponse.json(randomFrom(localPool), {
        status: 200,
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      });
    }

    const items = Array.from({ length: count }, () => randomFrom(localPool));
    return NextResponse.json(
      { items },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      }
    );
  }
}
