import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { contactName, userId } = await request.json();

        const DYTE_ORG_ID = process.env.DYTE_ORG_ID;
        const DYTE_API_KEY = process.env.DYTE_API_KEY;
        const DYTE_API_SECRET = process.env.DYTE_API_SECRET;
        const DYTE_PRESET_NAME = process.env.DYTE_PRESET_NAME;

        if (!DYTE_API_KEY) {
            return NextResponse.json({ error: 'Dyte API key missing' }, { status: 500 });
        }

        // Support both common Dyte auth styles:
        // 1) apiKey:apiSecret (preferred when secret is configured)
        // 2) orgId:apiKey (legacy style used in some setups)
        const basicAuthValue = DYTE_API_SECRET
            ? `${DYTE_API_KEY}:${DYTE_API_SECRET}`
            : `${DYTE_ORG_ID || ''}:${DYTE_API_KEY}`;
        const encodedCredentials = Buffer.from(basicAuthValue).toString('base64');

        const parseJSON = async (res: Response) => {
            try {
                return await res.json();
            } catch {
                return null;
            }
        };

        // 1. Create a Meeting
        const meetingResponse = await fetch('https://api.dyte.io/v2/meetings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${encodedCredentials}`
            },
            body: JSON.stringify({
                title: `SUTRAConnect Call - ${contactName}`,
                preferred_region: 'ap-south-1',
                record_on_start: false
            })
        });

        const meetingData = await parseJSON(meetingResponse);
        
        if (!meetingResponse.ok) {
            console.error('Failed to create Dyte meeting:', meetingData);
            return NextResponse.json({
                error: 'Failed to create meeting',
                dyte: meetingData,
                hint: 'Verify DYTE credentials (key/secret or org/key) and project access.'
            }, { status: 500 });
        }

        const meetingId = meetingData.data.id;

        // 2. Add Participant to the meeting.
        const participantPayload: Record<string, string> = {
            name: 'User',
            custom_participant_id: userId || 'anonymous',
        };
        if (DYTE_PRESET_NAME) {
            participantPayload.preset_name = DYTE_PRESET_NAME;
        }

        let participantResponse = await fetch(`https://api.dyte.io/v2/meetings/${meetingId}/participants`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${encodedCredentials}`
            },
            body: JSON.stringify(participantPayload)
        });

        let participantData = await parseJSON(participantResponse);

        // If preset is wrong/missing in Dyte project, retry once without preset.
        if (!participantResponse.ok && participantPayload.preset_name) {
            const fallbackPayload = {
                name: 'User',
                custom_participant_id: userId || 'anonymous',
            };
            participantResponse = await fetch(`https://api.dyte.io/v2/meetings/${meetingId}/participants`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${encodedCredentials}`
                },
                body: JSON.stringify(fallbackPayload)
            });
            participantData = await parseJSON(participantResponse);
        }

        // Some Dyte orgs enforce preset_name. If missing, auto-discover presets and retry.
        if (!participantResponse.ok && !participantPayload.preset_name) {
            const participantError = String(participantData?.error?.message || '');
            if (participantError.includes('"preset_name" is required')) {
                const presetsRes = await fetch('https://api.dyte.io/v2/presets', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Basic ${encodedCredentials}`
                    },
                });
                const presetsData = await parseJSON(presetsRes);
                const firstPresetName = presetsData?.data?.[0]?.name;

                if (firstPresetName) {
                    const fallbackPayload = {
                        name: 'User',
                        custom_participant_id: userId || 'anonymous',
                        preset_name: firstPresetName,
                    };
                    participantResponse = await fetch(`https://api.dyte.io/v2/meetings/${meetingId}/participants`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Basic ${encodedCredentials}`
                        },
                        body: JSON.stringify(fallbackPayload)
                    });
                    participantData = await parseJSON(participantResponse);
                } else {
                    return NextResponse.json({
                        error: 'No Dyte preset configured',
                        hint: 'Create at least one preset in Dyte dashboard and set DYTE_PRESET_NAME in .env.local.'
                    }, { status: 500 });
                }
            }
        }

        if (!participantResponse.ok) {
            console.error('Failed to add participant:', participantData);
            return NextResponse.json({
                error: 'Failed to add participant',
                dyte: participantData,
                hint: 'Set DYTE_PRESET_NAME to an existing preset in Dyte dashboard, or verify participant API permissions.'
            }, { status: 500 });
        }

        return NextResponse.json({ 
            meetingId: meetingId, 
            token: participantData.data.token 
        });

    } catch (error) {
        console.error('Error in create-meeting API:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}