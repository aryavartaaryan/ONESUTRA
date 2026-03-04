export type EnergyTag = 'Tamasic' | 'Rajasic' | 'Sattvic';

export interface SutraLayer {
    simpleWords: string;
    historicalContext: string;
    impact: string;
}

export interface NewsAction {
    type: 'petition' | 'share' | 'donate';
    label: string;
    link: string;
}

export interface NewsItem {
    id: string;
    headline: string;
    summary60Words: string;
    energyTag: EnergyTag;
    category: string;
    source: string;
    timeAgo: string;
    sutraLayer: SutraLayer;
    action?: NewsAction;
    audioUrl?: string;
}

export const NEWS_FEED: NewsItem[] = [
    {
        id: 'news_001',
        headline: 'Scientists Discover Himalayan Herbs Reverse Neurodegeneration',
        summary60Words:
            'A landmark study by AIIMS and IIT Delhi reveals that Brahmi, Ashwagandha, and Shankhpushpi compounds dramatically slow Alzheimer\'s progression in 80% of trial participants. The research, published in Nature Medicine, validates centuries of Ayurvedic wisdom using modern neuroscience. Clinical trials across 12 cities begin next month, signaling a paradigm shift in brain health globally.',
        energyTag: 'Sattvic',
        category: 'Science',
        source: 'Nature Medicine',
        timeAgo: '2h ago',
        sutraLayer: {
            simpleWords:
                'Researchers found that three plants used in Ayurveda for thousands of years can protect and even repair brain cells. This is a huge deal — it could change how doctors treat memory loss and Alzheimer\'s worldwide.',
            historicalContext:
                'Brahmi (Bacopa monnieri) has been used in Indian medicine for over 3,000 years, mentioned in ancient texts like the Charaka Samhita as a brain tonic. Modern science is only now catching up to what Ayurvedic physicians knew empirically.',
            impact:
                'For you personally: these herbs are already available as supplements in India at low cost. Also, this validates the broader push for integrating Ayurveda into mainstream healthcare — a movement that could benefit millions of Indians.',
        },
        action: {
            type: 'share',
            label: 'Share This Breakthrough',
            link: 'https://example.com/share/brahmi-study',
        },
        audioUrl: '/audio/news_001.mp3',
    },
    {
        id: 'news_002',
        headline: 'Bihar Budget 2026: ₹18,000 Cr Portfolio for Rural Digital Infrastructure',
        summary60Words:
            'Bihar\'s Finance Minister unveiled a ₹18,000 crore digital transformation portfolio in the state budget 2026. The allocation prioritizes rural broadband penetration, AI-ready government schools across 38 districts, and a new Digital Nalanda Knowledge Hub modeled after the ancient university. Opposition parties have demanded transparency in fund allocation and committee oversight for the landmark initiative.',
        energyTag: 'Rajasic',
        category: 'Politics',
        source: 'The Hindu',
        timeAgo: '4h ago',
        sutraLayer: {
            simpleWords:
                'Bihar\'s government is spending a huge amount to bring fast internet and smart schools to villages. They also want to build a big knowledge center inspired by the ancient Nalanda university. Political parties want to make sure the money is used properly.',
            historicalContext:
                'Bihar was once the intellectual capital of the world — home to Nalanda University (5th–12th century CE), which attracted scholars from China, Korea, and Central Asia. The Nalanda Digital Hub is an attempt to reclaim that legacy in the information age.',
            impact:
                'If you or anyone you know lives in rural Bihar, this investment could mean affordable high-speed internet and better school infrastructure within 2–3 years. For tech entrepreneurs, Bihar\'s rural markets represent an untapped opportunity.',
        },
        audioUrl: '/audio/news_002.mp3',
    },
    {
        id: 'news_003',
        headline: 'Himalayan Glaciers Shrinking 5x Faster — Activists Demand Emergency Summit',
        summary60Words:
            'New satellite data from ISRO confirms Himalayan glaciers are retreating five times faster than IPCC projections. The Gangotri glacier lost 850 meters in the past 18 months alone. A coalition of 300 environmental organizations has filed a PIL in the Supreme Court demanding an emergency national glacier protection act, calling the situation a direct threat to India\'s water sovereignty.',
        energyTag: 'Tamasic',
        category: 'Environment',
        source: 'ISRO / Down to Earth',
        timeAgo: '1h ago',
        sutraLayer: {
            simpleWords:
                'India\'s most important glaciers — the ones that feed the Ganga and Yamuna rivers — are melting much faster than scientists predicted. 300 groups are asking courts to force the government to act immediately, as this threatens the water supply for hundreds of millions of people.',
            historicalContext:
                'The Himalayas are called the "Third Pole" — containing the largest freshwater reserves outside the Arctic and Antarctic. The Gangotri glacier has been receding since the 1780s, but the rate has accelerated sharply since 2000, directly correlated with industrial emissions.',
            impact:
                'This directly affects you: by 2040, glacial melt could disrupt water supply to Delhi, UP, and Bihar. Summers will become more extreme. Signing the petition sends a signal to policymakers that citizens demand urgent action.',
        },
        action: {
            type: 'petition',
            label: 'Protect the Himalayas',
            link: 'https://example.com/petition/himalayan-glaciers',
        },
        audioUrl: '/audio/news_003.mp3',
    },
    {
        id: 'news_004',
        headline: 'India Launches World\'s First AI-Powered Vedic Curriculum in 5,000 Schools',
        summary60Words:
            'The Ministry of Education has partnered with IIT Bombay and Google India to deploy an AI-powered Vedic knowledge curriculum in 5,000 government schools nationwide. Students will learn Vedic mathematics, Sanskrit shloka analysis, and ethical AI principles simultaneously. The program, called \'Gurukul 2.0\', is designed to blend ancient knowledge systems with 21st-century computational thinking, launching this academic year.',
        energyTag: 'Sattvic',
        category: 'Education',
        source: 'Ministry of Education',
        timeAgo: '6h ago',
        sutraLayer: {
            simpleWords:
                'India is teaching 5,000 government schools to blend old Vedic knowledge — like Vedic math and Sanskrit — with modern AI learning. A student could solve complex equations using ancient techniques AND learn how to work with AI. Both at the same time.',
            historicalContext:
                'Vedic mathematics, systematized by Bharati Krishna Tirthaji in the 20th century, is based on 16 sutras from the Atharva Veda. It enables rapid mental calculations and has been shown to improve spatial reasoning. The modern gurukul system attempts to revive India\'s pre-colonial education philosophy.',
            impact:
                'If you have children in government schools, this curriculum could give them a competitive edge in mathematics and programming. More broadly, it signals India\'s attempt to build a unique educational identity that isn\'t purely Western in its model.',
        },
        audioUrl: '/audio/news_004.mp3',
    },
    {
        id: 'news_005',
        headline: 'Tech Giants Plan Mass Layoffs as AGI Transition Accelerates',
        summary60Words:
            'Microsoft, Google, and Amazon collectively announced 45,000 layoffs this quarter, directly attributing the cuts to AI automation replacing mid-level engineering and content roles. Economists warn this is the first visible wave of an AGI-driven labor restructuring that could affect 800 million jobs globally by 2030. Labor unions are demanding a Universal Basic Income legislation in Parliament by next session.',
        energyTag: 'Tamasic',
        category: 'Technology',
        source: 'Reuters',
        timeAgo: '3h ago',
        sutraLayer: {
            simpleWords:
                'Big tech companies are firing tens of thousands of workers because AI can now do many of those jobs faster and cheaper. Experts say this is just the beginning — within 5 years, AI could change most jobs in the world. Some people want the government to give everyone a basic income just to survive this shift.',
            historicalContext:
                'Every major technological revolution — the printing press, industrialization, computers — caused short-term unemployment followed by new job categories emerging. However, AI economists argue this transition is different in speed and scope, giving workers less time to adapt.',
            impact:
                'If your job involves data processing, coding, content writing, or customer service, your role may change significantly in the next 3–5 years. Learning to work WITH AI tools (like prompt engineering, AI-assisted analysis) is becoming the critical career skill of this decade.',
        },
        audioUrl: '/audio/news_005.mp3',
    },
    {
        id: 'news_006',
        headline: '108-Year-Old Yoga Master Completes Kashi to Kedarnath Padyatra on Foot',
        summary60Words:
            'Swami Satyananda Giri, 108, completed a 650km pilgrimage on foot from Varanasi to Kedarnath in 42 days, carrying only a kamandalu and a single set of robes. Medical teams monitoring him found his biological age equivalent to a 65-year-old. He attributes his vitality to pranayama, a plant-based diet, and daily Surya Namaskar practice maintained for 90 years. His journey has inspired millions.',
        energyTag: 'Sattvic',
        category: 'Spirituality',
        source: 'Swarajya Magazine',
        timeAgo: '12h ago',
        sutraLayer: {
            simpleWords:
                'A 108-year-old monk walked 650 km from Varanasi to Kedarnath — a mountain journey — in 42 days. Doctors checked his body and found it was biologically much younger than his age. He says breathing exercises, vegetarian food, and morning yoga kept him this healthy for 90 years.',
            historicalContext:
                'The Kashi-Kedarnath corridor is one of the most ancient pilgrimage routes in Hinduism, connecting the city of Lord Shiva (Varanasi) to His Himalayan abode (Kedarnath). For thousands of years, sages have walked this path as a form of physical and spiritual tapas (austerity).',
            impact:
                'This story is a lived proof that lifestyle-based health practices from Yoga and Ayurveda produce extraordinary results. Even adopting 20% of this lifestyle — regular pranayama, plant-based meals, morning movement — can add years of healthy life for you.',
        },
        action: {
            type: 'share',
            label: 'Share This Inspiration',
            link: 'https://example.com/share/swami-padyatra',
        },
        audioUrl: '/audio/news_006.mp3',
    },
    {
        id: 'news_007',
        headline: 'Supreme Court Orders Immediate Cleanup of 38 Polluted Rivers Across India',
        summary60Words:
            'In a landmark judgment, the Supreme Court ordered complete remediation of 38 critically polluted river segments within 18 months, threatening state governments with Central fund cuts for non-compliance. The court invoked the "Right to Clean Water" as a Fundamental Right under Article 21. For the first time, industrial polluters will face criminal charges rather than civil penalties for violations reported after this ruling.',
        energyTag: 'Rajasic',
        category: 'Governance',
        source: 'LiveLaw',
        timeAgo: '5h ago',
        sutraLayer: {
            simpleWords:
                'India\'s highest court has ordered the cleanup of 38 heavily polluted rivers within 18 months. States that fail will lose government money. Companies that pollute rivers will now face criminal prosecution — meaning executives can go to jail — instead of just paying small fines.',
            historicalContext:
                'India\'s rivers have faced severe industrial and domestic pollution since liberalization in 1991. The Ganga Action Plan, launched in 1986, spent over ₹20,000 crore with limited success. This ruling shifts the approach from spending-based cleanup to enforcement-based accountability.',
            impact:
                'If you live near any major river — Ganga, Yamuna, Godavari, Krishna — this could mean significantly cleaner water and air within 2 years. You can support this by reporting local industrial discharge to the National Green Tribunal portal.',
        },
        action: {
            type: 'petition',
            label: 'Demand River Protection',
            link: 'https://example.com/petition/river-cleanup',
        },
        audioUrl: '/audio/news_007.mp3',
    },
];
