type BrowserChoice = {
    title: string;
    rating: number;
    priceText: string;
    productUrl: string;
};

export async function findTravelPayNowLink(_params: {
    provider: 'Yatra' | 'IRCTC';
    source: string;
    destination: string;
    date: string;
}): Promise<string | null> {
    return null;
}

export async function findAmazonTopChoices(_query: string): Promise<BrowserChoice[] | null> {
    return null;
}
