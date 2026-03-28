import { Recipe } from '@/lib/types';

// Knowledge Base for Procedural Generation
const INGREDIENT_TAGS: Record<string, string[]> = {
    'potato': ['veg', 'heavy'], 'aloo': ['veg', 'heavy'],
    'flour': ['grain', 'base'], 'atta': ['grain', 'base'], 'maida': ['grain', 'base'],
    'rice': ['grain', 'base'], 'chawal': ['grain', 'base'],
    'paneer': ['protein', 'dairy'], 'tofu': ['protein'],
    'spinach': ['veg', 'leafy'], 'palak': ['veg', 'leafy'],
    'tomato': ['veg', 'acidic'],
    'onion': ['veg', 'aromatic'],
    'chickpeas': ['protein', 'legume'], 'chana': ['protein', 'legume'],
    'lentil': ['protein', 'legume'], 'dal': ['protein', 'legume'],
    'yogurt': ['dairy', 'liquid'], 'curd': ['dairy', 'liquid'], 'dahi': ['dairy', 'liquid'],
    'milk': ['dairy', 'liquid']
};

const TEMPLATES = [
    {
        requires: ['veg', 'grain'],
        title: (i: string[]) => `Stuffed ${capitalize(i[0])} Paratha`,
        description: 'A crispy whole wheat flatbread stuffed with a spiced vegetable filling.',
        method: (i: string[]) => [
            `Boil and mash the ${i[0]}.`,
            `Mix with spices (cumin, chili, coriander).`,
            `Stuff inside dough made from ${i[1] || 'wheat flour'}.`,
            `Roll out and roast on a tawa with ghee.`
        ]
    },
    {
        requires: ['veg', 'veg'],
        title: (i: string[]) => `Mixed ${capitalize(i[0])} & ${capitalize(i[1])} Sabzi`,
        description: 'A homestyle dry vegetable curry.',
        method: (i: string[]) => [
            `Chop ${i[0]} and ${i[1]} into small cubes.`,
            `Heat oil cumin seeds.`,
            `Sauté veggies with turmeric and salt.`,
            `Steam covered until tender.`
        ]
    },
    {
        requires: ['grain', 'veg'],
        title: (i: string[]) => `${capitalize(i[1])} ${capitalize(i[0])} Pulao`,
        description: 'Aromatic rice cooked with fresh vegetables.',
        method: (i: string[]) => [
            `Soak ${i[0]}.`,
            `Sauté whole spices and sliced ${i[1]}.`,
            `Add rice and water (1:2 ratio).`,
            `Cook until fluffy.`
        ]
    },
    {
        requires: ['protein', 'veg'],
        title: (i: string[]) => `${capitalize(i[0])} with ${capitalize(i[1])} Masala`,
        description: 'Rich protein curry with vegetables.',
        method: (i: string[]) => [
            `Fry the ${i[0]} cubes until golden.`,
            `Make a gravy with onion, tomato, and pureed ${i[1]}.`,
            `Simmer everything together for 10 minutes.`,
            `Garnish with cream.`
        ]
    }
];

function capitalize(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function classifyIngredients(inputs: string[]): { name: string, tags: string[] }[] {
    return inputs.map(input => {
        const lower = input.toLowerCase().trim();
        // Simple partial match check
        const matchedKey = Object.keys(INGREDIENT_TAGS).find(k => lower.includes(k));
        return {
            name: input,
            tags: matchedKey ? INGREDIENT_TAGS[matchedKey] : ['general']
        };
    });
}

export function generateFusionRecipes(ingredients: string[]): Recipe[] {
    const classified = classifyIngredients(ingredients);
    const generated: Recipe[] = [];

    // Try to match templates
    // Strategy: Pick 2 distinct ingredients and see if they fit a template
    if (classified.length >= 2) {
        for (const template of TEMPLATES) {
            // Find ingredients matching requirements
            const slot1 = classified.find(c => c.tags.some(t => template.requires.includes(t)));
            const slot2 = classified.find(c => c !== slot1 && c.tags.some(t => template.requires.includes(t)));

            if (slot1 && slot2) {
                generated.push({
                    id: `gen-${Math.random().toString(36).substr(2, 9)}`,
                    title: template.title([slot1.name, slot2.name]),
                    slug: `gen-${slot1.name}-${slot2.name}`,
                    region: 'Fusion Kitchen',
                    state: 'AI Generated',
                    description: template.description,
                    heritageStory: 'A unique creation from your Vedic Smart Kitchen, blending flavors for a quick nutritious meal.',
                    images: { hero: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&q=80' }, // Generic food image
                    prepTime: 15,
                    cookTime: 20,
                    servings: 2,
                    difficulty: 'Easy',
                    ingredients: [
                        { name: slot1.name, quantity: '1 cup' },
                        { name: slot2.name, quantity: '1 cup' },
                        { name: 'Spices', quantity: 'to taste' }
                    ],
                    instructions: template.method([slot1.name, slot2.name]),
                    dietaryTags: ['Vegetarian'],
                    mealType: ['Dinner'],
                    rating: 4.5,
                    isFeatured: false
                });
            }
        }
    }

    // Fallback: The "Mystery Curry"
    if (generated.length === 0 && ingredients.length > 0) {
        generated.push({
            id: 'gen-mystery',
            title: `Vedic ${capitalize(ingredients[0])} Fry`,
            slug: `vedic-${ingredients[0]}-fry`,
            region: 'Fusion Kitchen',
            state: 'AI Generated',
            description: `A quick stir-fry using ${ingredients.join(' and ')}.`,
            heritageStory: 'Created on the fly for your specific pantry needs.',
            images: { hero: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&q=80' },
            prepTime: 10,
            cookTime: 15,
            servings: 2,
            difficulty: 'Easy',
            ingredients: ingredients.map(i => ({ name: i, quantity: 'as needed' })),
            instructions: [
                'Heat oil in a pan.',
                'Add cumin and mustard seeds.',
                `Add chopped ${ingredients.join(', ')}.`,
                'Sauté with turmeric, chili powder, and salt.',
                'Cover and cook until tender.'
            ],
            dietaryTags: ['Vegetarian'],
            mealType: ['Lunch'],
            rating: 4.0
        });
    }

    return generated.slice(0, 3); // Return top 3
}
