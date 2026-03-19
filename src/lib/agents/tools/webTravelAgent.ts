import type {
    ToolExecutionContext,
    WebTravelAgentRequest,
    WebTravelAgentResult,
} from '@/lib/agents/types';
import { findTravelPayNowLink } from '@/lib/agents/browser/playwrightAdapter';

export async function webTravelAgentTool(
    args: WebTravelAgentRequest,
    _ctx: ToolExecutionContext
): Promise<WebTravelAgentResult> {
    const provider: 'Yatra' | 'IRCTC' = /train|irctc/i.test(`${args.source} ${args.destination}`) ? 'IRCTC' : 'Yatra';

    const payNowLink = await findTravelPayNowLink({
        provider,
        source: args.source,
        destination: args.destination,
        date: args.date,
    });

    if (payNowLink) {
        return {
            provider,
            payNowLink,
            notes: `Live browser execution completed for ${provider}. Pay Now link captured and ready for confirmation.`,
            webViewAction: {
                action: 'OPEN_WEBVIEW',
                url: payNowLink,
                title: `${provider} · Final Booking`,
            },
        };
    }

    return {
        provider,
        payNowLink: null,
        notes:
            `Browser automation fallback used for ${provider}. ` +
            `Search request captured: ${args.source} -> ${args.destination} on ${args.date}. ` +
            'Set ENABLE_BROWSER_TOOLS=true and install Playwright browsers to return a live Pay Now URL.',
    };
}
