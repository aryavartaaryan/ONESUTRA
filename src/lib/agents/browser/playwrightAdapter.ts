type BrowserChoice = {
    title: string;
    rating: number;
    priceText: string;
    productUrl: string;
};

async function getPlaywrightOrNull() {
    const moduleName = 'playwright';
    try {
        // Keep playwright truly optional: avoid static bundler resolution.
        const dynamicImporter = new Function('modulePath', 'return import(modulePath)') as (modulePath: string) => Promise<any>;
        const mod = await dynamicImporter(moduleName);
        return mod;
    } catch {
        return null;
    }
}

export async function findTravelPayNowLink(params: {
    provider: 'Yatra' | 'IRCTC';
    source: string;
    destination: string;
    date: string;
}): Promise<string | null> {
    if (process.env.ENABLE_BROWSER_TOOLS !== 'true') return null;

    const playwright = await getPlaywrightOrNull();
    if (!playwright?.chromium) return null;

    const browser = await playwright.chromium.launch({
        headless: process.env.BROWSER_AUTOMATION_HEADLESS !== 'false',
    });

    try {
        const page = await browser.newPage();
        const url =
            params.provider === 'Yatra'
                ? 'https://www.yatra.com/'
                : 'https://www.irctc.co.in/nget/train-search';

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 });

        const link = await page.evaluate(() => {
            const anchors = Array.from(document.querySelectorAll('a'));
            const candidate = anchors.find((a) => /pay\s*now|book\s*now|continue/i.test(a.textContent || ''));
            return candidate?.getAttribute('href') || null;
        });

        if (!link) return null;
        if (/^https?:\/\//i.test(link)) return link;

        const origin = new URL(page.url()).origin;
        return `${origin}${link.startsWith('/') ? '' : '/'}${link}`;
    } finally {
        await browser.close();
    }
}

export async function findAmazonTopChoices(query: string): Promise<BrowserChoice[] | null> {
    if (process.env.ENABLE_BROWSER_TOOLS !== 'true') return null;

    const playwright = await getPlaywrightOrNull();
    if (!playwright?.chromium) return null;

    const browser = await playwright.chromium.launch({
        headless: process.env.BROWSER_AUTOMATION_HEADLESS !== 'false',
    });

    try {
        const page = await browser.newPage();
        const searchUrl = `https://www.amazon.in/s?k=${encodeURIComponent(query)}`;
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 });

        const choices: BrowserChoice[] = await page.evaluate(() => {
            const cards = Array.from(document.querySelectorAll('[data-component-type="s-search-result"]')).slice(0, 10);

            const parsed = cards
                .map((card) => {
                    const titleEl = card.querySelector('h2 span');
                    const linkEl = card.querySelector('h2 a') as HTMLAnchorElement | null;
                    const ratingEl = card.querySelector('[aria-label*="out of 5 stars"]') as HTMLElement | null;
                    const priceWhole = card.querySelector('.a-price-whole')?.textContent?.trim() ?? '';

                    if (!titleEl || !linkEl || !priceWhole) return null;

                    const title = titleEl.textContent?.trim() ?? '';
                    const ratingRaw = ratingEl?.getAttribute('aria-label') ?? '';
                    const ratingMatch = ratingRaw.match(/([0-9.]+)\s*out\s*of\s*5/i);
                    const rating = ratingMatch ? Number(ratingMatch[1]) : 0;

                    return {
                        title,
                        rating,
                        priceText: `Rs. ${priceWhole.replace(/,/g, '')}`,
                        productUrl: linkEl.href,
                    };
                })
                .filter(Boolean) as Array<{ title: string; rating: number; priceText: string; productUrl: string }>;

            return parsed;
        });

        if (!choices.length) return null;

        return choices
            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
            .slice(0, 3);
    } finally {
        await browser.close();
    }
}
