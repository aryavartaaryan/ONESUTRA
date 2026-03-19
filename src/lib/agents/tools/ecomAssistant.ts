import type {
    EcomAssistantRequest,
    EcomAssistantResult,
    ToolExecutionContext,
} from '@/lib/agents/types';
import { findAmazonTopChoices } from '@/lib/agents/browser/playwrightAdapter';

export async function ecomAssistantTool(
    args: EcomAssistantRequest,
    _ctx: ToolExecutionContext
): Promise<EcomAssistantResult> {
    const liveChoices = await findAmazonTopChoices(args.query);
    if (liveChoices && liveChoices.length > 0) {
        const selected = liveChoices[0];
        return {
            topChoices: liveChoices,
            selectedChoiceIndex: 0,
            cartAction: 'simulated',
            notes: 'Live browser shortlist generated from Amazon search results. Opening best match for final user checkout.',
            webViewAction: selected?.productUrl
                ? {
                    action: 'OPEN_WEBVIEW',
                    url: selected.productUrl,
                    title: selected.title,
                }
                : undefined,
        };
    }

    const base = encodeURIComponent(args.query.trim().replace(/\s+/g, ' '));
    const topChoices = [
        {
            title: `${args.query} Pro Choice`,
            rating: 4.7,
            priceText: 'Rs. 1,999',
            productUrl: `https://www.amazon.in/s?k=${base}`,
        },
        {
            title: `${args.query} Budget Pick`,
            rating: 4.5,
            priceText: 'Rs. 1,299',
            productUrl: `https://www.amazon.in/s?k=${base}`,
        },
        {
            title: `${args.query} Premium Build`,
            rating: 4.6,
            priceText: 'Rs. 2,499',
            productUrl: `https://www.amazon.in/s?k=${base}`,
        },
    ];

    const fallbackUrl = `https://www.amazon.in/s?k=${base}`;

    return {
        topChoices,
        selectedChoiceIndex: 0,
        cartAction: 'simulated',
        notes: 'Fallback shortlist used. Opening Amazon search results in WebView so user can proceed manually.',
        webViewAction: {
            action: 'OPEN_WEBVIEW',
            url: fallbackUrl,
            title: `${args.query} · Amazon Search`,
        },
    };
}
