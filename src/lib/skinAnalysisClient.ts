/**
 * Web client for skin analysis — mirrors client.py send_to_server() output shape.
 */

export interface SkinRecommendations {
    summary: string;
    daily_routine: {
        morning: string[];
        evening: string[];
    };
    products: {
        affordable: string[];
        high_end: string[];
    };
    ingredients: {
        look_for: string[];
        avoid: string[];
    };
    lifestyle_tips: string[];
}

export interface SkinAnalysisResult {
    success: boolean;
    skin_type: string;
    confidence: string;
    recommendations: SkinRecommendations;
}

function asStringList(value: unknown): string[] {
    if (!value) return [];
    if (Array.isArray(value)) {
        return value
            .map((item) => (typeof item === 'string' ? item : JSON.stringify(item)))
            .filter(Boolean);
    }
    if (typeof value === 'string' && value.trim()) return [value];
    return [];
}

function conditionFlags(condition: string) {
    const text = (condition || '').toLowerCase();
    return {
        acne: /acne|breakout|pimple|whitehead|blackhead/.test(text),
        sensitive: /sensit|redness|reactive|irritat/.test(text),
        dry: /dry|flak|tight|peel/.test(text),
        pigment: /pigment|dark spot|uneven|sun spot/.test(text),
    };
}

/** Client-side fallback — same data as recommendation.get_fallback_recommendations() */
export function getClientFallbackRecommendations(
    skinType: string,
    condition = 'no condition detected'
): SkinRecommendations {
    const valid = ['Dry', 'Oily', 'Normal', 'Combination'];
    let skin = (skinType || 'Combination').trim();
    skin = skin.charAt(0).toUpperCase() + skin.slice(1).toLowerCase();
    if (!valid.includes(skin)) skin = 'Combination';

    const flags = conditionFlags(condition);

    const routines: Record<string, { morning: string[]; evening: string[] }> = {
        Dry: {
            morning: [
                'Step 1: Cleanser — Use a creamy, non-foaming cleanser (CeraVe Hydrating Cleanser).',
                'Step 2: Serum — Apply hyaluronic acid on damp skin.',
                'Step 3: Moisturizer — Rich ceramide cream to lock in hydration.',
                'Step 4: SPF — Mineral sunscreen SPF 30+ every morning.',
            ],
            evening: [
                'Step 1: Cleanser — Gentle oil or cream cleanser; avoid hot water.',
                'Step 2: Treatment — Niacinamide or panthenol if skin feels tight.',
                'Step 3: Moisturizer — Occlusive night balm on cheeks and dry zones.',
            ],
        },
        Oily: {
            morning: [
                'Step 1: Cleanser — Gel cleanser with salicylic acid or zinc (La Roche-Posay Effaclar).',
                'Step 2: Toner — Alcohol-free niacinamide toner to balance sebum.',
                'Step 3: Moisturizer — Lightweight oil-free gel moisturizer.',
                'Step 4: SPF — Mattifying fluid sunscreen SPF 50.',
            ],
            evening: [
                'Step 1: Cleanser — Double cleanse if wearing sunscreen or makeup.',
                'Step 2: Treatment — BHA 2% on T-zone 3–4 nights per week.',
                'Step 3: Moisturizer — Oil-free gel; avoid heavy balms on oily areas.',
            ],
        },
        Normal: {
            morning: [
                'Step 1: Cleanser — Gentle pH-balanced cleanser.',
                'Step 2: Serum — Vitamin C or antioxidant serum.',
                'Step 3: Moisturizer — Lightweight daily lotion.',
                'Step 4: SPF — Broad-spectrum SPF 30+.',
            ],
            evening: [
                'Step 1: Cleanser — Remove SPF and daily buildup.',
                'Step 2: Treatment — Retinol or peptide serum 2–3 nights per week.',
                'Step 3: Moisturizer — Balanced night cream.',
            ],
        },
        Combination: {
            morning: [
                'Step 1: Cleanser — Gentle gel cleanser for full face.',
                'Step 2: Serum — Niacinamide on T-zone; hyaluronic acid on cheeks.',
                'Step 3: Moisturizer — Gel-cream; lighter on forehead/nose, richer on cheeks.',
                'Step 4: SPF — Non-comedogenic SPF 50.',
            ],
            evening: [
                'Step 1: Cleanser — Focus on T-zone; soft cleanse on dry cheeks.',
                'Step 2: Treatment — BHA on T-zone only; avoid dry patches.',
                'Step 3: Moisturizer — Layer richer cream on cheeks if needed.',
            ],
        },
    };

    const routine = {
        morning: [...routines[skin].morning],
        evening: [...routines[skin].evening],
    };

    if (flags.acne) {
        routine.evening.splice(
            1,
            0,
            'Step 2 (Acne): Spot treatment — Benzoyl peroxide 2.5% or salicylic acid on active breakouts.'
        );
    }
    if (flags.sensitive) {
        routine.morning[0] = 'Step 1: Cleanser — Fragrance-free micellar or cream cleanser only.';
    }
    if (flags.pigment) {
        routine.morning.splice(
            2,
            0,
            'Step 2 (Pigmentation): Vitamin C serum — Stable L-ascorbic or THD ascorbate in AM.'
        );
    }

    const productsMap: Record<string, { affordable: string[]; high_end: string[] }> = {
        Dry: {
            affordable: ['CeraVe Hydrating Cleanser', 'The Ordinary Hyaluronic Acid 2% + B5', 'CeraVe Moisturizing Cream'],
            high_end: ['La Roche-Posay Toleriane Hydrating Cleanser', 'Vichy Minéral 89', 'SkinCeuticals Triple Lipid Restore'],
        },
        Oily: {
            affordable: ['CeraVe Foaming Cleanser', 'The Ordinary Niacinamide 10% + Zinc 1%', 'Neutrogena Hydro Boost Gel'],
            high_end: ["La Roche-Posay Effaclar Duo", "Paula's Choice 2% BHA", 'Drunk Elephant Protini'],
        },
        Normal: {
            affordable: ['Cetaphil Gentle Cleanser', 'The Ordinary Vitamin C 23%', 'CeraVe PM Lotion'],
            high_end: ['SkinCeuticals C E Ferulic', 'Tatcha Dewy Cream', 'Drunk Elephant Lala Retro'],
        },
        Combination: {
            affordable: ['CeraVe Foaming Cleanser', 'The Ordinary Niacinamide 10%', 'Neutrogena Hydro Boost'],
            high_end: ['La Roche-Posay Effaclar H ISO-Biome', "Paula's Choice 2% BHA", "Kiehl's Ultra Facial Cream"],
        },
    };

    const avoidMap: Record<string, string[]> = {
        Dry: ['Alcohol denat. in toners', 'Harsh sulfates', 'Over-exfoliating acids daily'],
        Oily: ['Heavy mineral oils on T-zone', 'Coconut oil if acne-prone', 'Thick balms all over face'],
        Normal: ['Aggressive scrubs daily', 'Unbuffered high-strength acids without SPF'],
        Combination: ['One heavy moisturizer on entire face', 'Alcohol-heavy toners on dry cheeks'],
    };

    let summary = `Your scan indicates ${skin} skin`;
    if (condition && condition !== 'no condition detected') {
        summary += ` with noted concerns: ${condition}.`;
    } else {
        summary += ' with no major concerns flagged in your questionnaire.';
    }
    summary += ' Follow the AM/PM protocol below and patch-test new actives.';

    return {
        summary,
        daily_routine: routine,
        products: productsMap[skin],
        ingredients: {
            look_for: ['Ceramides', 'Niacinamide', 'Hyaluronic acid', 'SPF 30+'],
            avoid: avoidMap[skin],
        },
        lifestyle_tips: [
            'Change pillowcases twice weekly if you have acne or sensitivity.',
            'Apply SPF as the last AM step — reapply outdoors every 2 hours.',
            'Introduce one new active product at a time; wait 2 weeks before adding another.',
        ],
    };
}

export function recommendationsAreComplete(recs: SkinRecommendations): boolean {
    return (
        recs.daily_routine.morning.length > 0 &&
        recs.daily_routine.evening.length > 0 &&
        recs.products.affordable.length > 0 &&
        recs.lifestyle_tips.length > 0
    );
}

/** Fill empty routines/products when API or cached session is incomplete */
export function ensureRecommendations(
    result: SkinAnalysisResult,
    condition = 'no condition detected'
): SkinAnalysisResult {
    if (recommendationsAreComplete(result.recommendations)) {
        return result;
    }
    const fallback = getClientFallbackRecommendations(result.skin_type, condition);
    const current = result.recommendations;
    return {
        ...result,
        recommendations: {
            summary: current.summary && current.summary.length > 20 ? current.summary : fallback.summary,
            daily_routine: {
                morning: current.daily_routine.morning.length ? current.daily_routine.morning : fallback.daily_routine.morning,
                evening: current.daily_routine.evening.length ? current.daily_routine.evening : fallback.daily_routine.evening,
            },
            products: {
                affordable: current.products.affordable.length ? current.products.affordable : fallback.products.affordable,
                high_end: current.products.high_end.length ? current.products.high_end : fallback.products.high_end,
            },
            ingredients: {
                look_for: current.ingredients.look_for.length ? current.ingredients.look_for : fallback.ingredients.look_for,
                avoid: current.ingredients.avoid.length ? current.ingredients.avoid : fallback.ingredients.avoid,
            },
            lifestyle_tips: current.lifestyle_tips.length ? current.lifestyle_tips : fallback.lifestyle_tips,
        },
    };
}

/** Normalize API JSON the same way client.py reads recs = data.get("recommendations", {}) */
export function normalizeAnalysisResponse(
    data: Record<string, unknown>,
    condition = 'no condition detected'
): SkinAnalysisResult {
    const rawRecs = (data.recommendations as Record<string, unknown>) || {};
    const daily = (rawRecs.daily_routine as Record<string, unknown>) || {};
    const products = (rawRecs.products as Record<string, unknown>) || {};
    const ingredients = (rawRecs.ingredients as Record<string, unknown>) || {};
    const productAvoid = asStringList(products.avoid);

    const result: SkinAnalysisResult = {
        success: Boolean(data.success ?? true),
        skin_type: String(data.skin_type || 'Combination'),
        confidence: String(data.confidence || '—'),
        recommendations: {
            summary: String(rawRecs.summary || 'Personalized skincare protocol generated from your scan.'),
            daily_routine: {
                morning: asStringList(daily.morning),
                evening: asStringList(daily.evening),
            },
            products: {
                affordable: asStringList(products.affordable),
                high_end: asStringList(products.high_end),
            },
            ingredients: {
                look_for: asStringList(ingredients.look_for),
                avoid: [
                    ...asStringList(ingredients.avoid),
                    ...productAvoid.filter((a) => !asStringList(ingredients.avoid).includes(a)),
                ],
            },
            lifestyle_tips: asStringList(rawRecs.lifestyle_tips),
        },
    };

    return ensureRecommendations(result, condition);
}

/** POST image + condition — same data as client.py send_to_server (multipart → JSON for web) */
export async function predictSkin(
    imageDataUrl: string,
    condition: string,
    backendUrl?: string
): Promise<SkinAnalysisResult> {
    const base =
        backendUrl ||
        import.meta.env.VITE_BACKEND_URL ||
        `http://${typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1'}:5000`;

    const response = await fetch(`${base}/api/predict-skin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            image: imageDataUrl,
            condition: condition.trim() || 'no condition detected',
        }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || `Analysis failed (${response.status})`);
    }

    const data = (await response.json()) as Record<string, unknown>;
    return normalizeAnalysisResponse(data, condition);
}
