import json
import os
from pathlib import Path
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field

# 1. THE DATA STRUCTURE
class DailyRoutine(BaseModel):
    morning: list[str] = Field(description="Morning skincare steps")
    evening: list[str] = Field(description="Evening skincare steps")

# --- CHANGED: Split products into two price categories ---
class ProductRecommendations(BaseModel):
    affordable: list[str] = Field(description="Affordable/drugstore real-world products (e.g., CeraVe, The Ordinary, Cetaphil)")
    high_end: list[str] = Field(description="High-end/luxury real-world products (e.g., SkinCeuticals, Drunk Elephant, Tatcha)")
    avoid: list[str] = Field(description="Types of products to avoid")

class IngredientGuide(BaseModel):
    look_for: list[str] = Field(description="Beneficial ingredients")
    avoid: list[str] = Field(description="Ingredients to avoid")

class SkinRecommendation(BaseModel):
    summary: str = Field(description="Short summary of analysis")
    daily_routine: DailyRoutine = Field(description="Routines")
    products: ProductRecommendations = Field(description="Products")
    ingredients: IngredientGuide = Field(description="Ingredients")
    lifestyle_tips: list[str] = Field(description="3 lifestyle tips")

# 2. SETUP
def _load_env_value(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if value:
        return value

    env_path = Path(__file__).resolve().parent / ".env"
    if not env_path.exists():
        return ""

    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, raw_value = line.split("=", 1)
        if key.strip() == name:
            return raw_value.strip().strip('"').strip("'")
    return ""


API_KEY = _load_env_value("GROQ_API_KEY") or "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"
llm = (
    ChatGroq(api_key=API_KEY, model="llama-3.3-70b-versatile", temperature=0.5)
    if API_KEY
    else None
)
parser = PydanticOutputParser(pydantic_object=SkinRecommendation)

conversation_history = []


def _is_auth_error(error: Exception) -> bool:
    text = str(error).lower()
    return "401" in text or "invalid_api_key" in text or "invalid api key" in text

# 3. ANALYSIS FUNCTION
def get_recommendation(skin_type: str, condition: str) -> dict:
    print(f"Analyzing {skin_type}...")
    if llm is None:
        print("[INFO] GROQ_API_KEY is not configured. Using local clinical recommendations.")
        return get_fallback_recommendations(skin_type, condition)
    
    prompt = ChatPromptTemplate.from_template(
        "You are SkinE, a top dermatologist. Analyze this:\n"
        "Type: {skin_type}\nCondition: {condition}\n\n"
        "CRITICAL RULE: For recommended products, you MUST provide REAL brand names and specific products. "
        "Divide them strictly into 'affordable' (budget/drugstore) and 'high_end' (luxury/expensive) options.\n\n"
        "Return ONLY JSON based on these instructions: {format_instructions}"
    )
    
    chain = prompt | llm | parser

    try:
        result = chain.invoke({
            "skin_type": skin_type, 
            "condition": condition,
            "format_instructions": parser.get_format_instructions()
        })
        data = result.model_dump()
        daily = data.get("daily_routine") or {}
        if not (daily.get("morning") and daily.get("evening")):
            print("[WARN] Groq returned incomplete routine — using fallback.")
            return get_fallback_recommendations(skin_type, condition)
        return data
    except Exception as e:
        print(f"Error: {e}")
        if _is_auth_error(e):
            print("[WARN] GROQ_API_KEY is invalid or expired. Using local clinical recommendations.")
        return get_fallback_recommendations(skin_type, condition)

# 4. CHAT FUNCTION
def _build_chat_context(context: dict | None = None) -> str:
    context = context or {}
    skin_type = context.get("skin_type") or context.get("skinType") or context.get("type") or "Combination"
    recommendations = context.get("recommendations") or {}
    routine = recommendations.get("daily_routine") or {}
    products = recommendations.get("products") or {}
    ingredients = recommendations.get("ingredients") or {}

    return "\n".join([
        f"Detected skin type: {skin_type}",
        f"Confidence: {context.get('confidence') or 'unknown'}",
        f"User concerns: {context.get('condition') or 'no condition detected'}",
        f"Scan summary: {recommendations.get('summary') or 'not available'}",
        f"Morning routine: {', '.join(routine.get('morning') or []) or 'not available'}",
        f"Evening routine: {', '.join(routine.get('evening') or []) or 'not available'}",
        f"Recommended affordable products: {', '.join(products.get('affordable') or []) or 'not available'}",
        f"Recommended high-end products: {', '.join(products.get('high_end') or []) or 'not available'}",
        f"Ingredients to look for: {', '.join(ingredients.get('look_for') or []) or 'not available'}",
        f"Ingredients to avoid: {', '.join(ingredients.get('avoid') or []) or 'not available'}",
    ])


def local_chat(user_message: str, context: dict | None = None) -> str:
    """Small local skincare assistant used when Groq is not configured."""
    text = (user_message or "").lower()
    context = context or {}
    skin_type = context.get("skin_type") or context.get("skinType") or context.get("type") or "Combination"
    condition = context.get("condition") or "your current concerns"
    prefix = f"For {skin_type} skin with {condition}: "

    if any(word in text for word in ("vitamin c", "dark spot", "pigment", "brighten")):
        return prefix + (
            "Yes, vitamin C can help with dullness and pigmentation. Use it in the morning after cleansing, "
            "then moisturizer and broad-spectrum SPF. Start 2-3 times weekly if your skin is sensitive."
        )
    if any(word in text for word in ("retinol", "retinoid", "adapalene")):
        return prefix + (
            "Use retinol at night only, starting 1-2 nights per week. Apply moisturizer after it, avoid using it "
            "on the same night as strong exfoliating acids, and use SPF every morning."
        )
    if any(word in text for word in ("acne", "pimple", "breakout", "blackhead", "whitehead")):
        return prefix + (
            "For breakouts, keep the routine simple: gentle cleanser, lightweight non-comedogenic moisturizer, "
            "and SPF. A 2% salicylic acid product or 2.5% benzoyl peroxide spot treatment can help, introduced slowly."
        )
    if any(word in text for word in ("dry", "flaky", "tight", "peeling")):
        return prefix + (
            "For dryness, use a creamy cleanser, apply hyaluronic acid on damp skin, then seal with a ceramide-rich "
            "moisturizer. Avoid hot water and daily exfoliation while the barrier feels tight."
        )
    if any(word in text for word in ("sensitive", "red", "burn", "irritat", "rosacea")):
        return prefix + (
            "For sensitivity or redness, pause strong actives and fragrance. Use a gentle cleanser, bland moisturizer, "
            "and mineral SPF. If burning, swelling, or persistent rash continues, check with a dermatologist."
        )

    return prefix + (
        "I can help with routine order, ingredients, acne, dryness, sensitivity, pigmentation, SPF, and product use. "
        "Ask about one step or ingredient, and I will tailor it to your scan."
    )


def chat(user_message: str, context: dict | None = None) -> str:
    global llm
    if llm is None:
        return local_chat(user_message, context)

    try:
        prompt = ChatPromptTemplate.from_template(
            "You are SkinE AI, a skincare-focused assistant. Answer ONLY about skincare, the user's scan, "
            "routine order, ingredients, products, and safe general skin guidance.\n"
            "Use the scan context below to make the answer specific. If the user asks about anything unrelated, "
            "briefly redirect them back to skincare.\n"
            "The scan context is authoritative. Never say you do not know the user's skin type when the scan context "
            "contains a detected skin type. Mention the detected skin type in the first sentence.\n"
            "Do not diagnose disease or replace a dermatologist. Recommend professional care for severe, painful, "
            "spreading, bleeding, infected, or persistent symptoms.\n"
            "Keep the answer practical, specific, and under 120 words.\n\n"
            "SCAN CONTEXT:\n{scan_context}\n\n"
            "USER QUESTION:\n{question}"
        )
        chain = prompt | llm
        response = chain.invoke({
            "scan_context": _build_chat_context(context),
            "question": user_message,
        })
        return response.content
    except Exception as e:
        if _is_auth_error(e):
            llm = None
            print("[WARN] GROQ_API_KEY is invalid or expired. Falling back to local chat.")
            return local_chat(user_message, context)
        print(f"Chat Error: {e}")
        return "SkinE AI is temporarily unavailable. Please try again in a moment."

def reset_session():
    global conversation_history
    conversation_history = []


def _condition_flags(condition: str) -> dict:
    text = (condition or "").lower()
    return {
        "acne": any(k in text for k in ("acne", "breakout", "pimple", "whitehead", "blackhead")),
        "sensitive": any(k in text for k in ("sensit", "redness", "reactive", "irritat")),
        "dry": any(k in text for k in ("dry", "flak", "tight", "peel")),
        "pigment": any(k in text for k in ("pigment", "dark spot", "uneven", "sun spot")),
    }


def get_fallback_recommendations(skin_type: str, condition: str = "no condition detected") -> dict:
    """Rule-based routines when Groq is unavailable or returns empty."""
    skin = (skin_type or "Combination").strip().capitalize()
    if skin not in ("Dry", "Oily", "Normal", "Combination"):
        skin = "Combination"
    flags = _condition_flags(condition)

    routines = {
        "Dry": {
            "morning": [
                "Step 1: Cleanser — Use a creamy, non-foaming cleanser (CeraVe Hydrating Cleanser).",
                "Step 2: Serum — Apply hyaluronic acid on damp skin.",
                "Step 3: Moisturizer — Rich ceramide cream to lock in hydration.",
                "Step 4: SPF — Mineral sunscreen SPF 30+ every morning.",
            ],
            "evening": [
                "Step 1: Cleanser — Gentle oil or cream cleanser; avoid hot water.",
                "Step 2: Treatment — Niacinamide or panthenol if skin feels tight.",
                "Step 3: Moisturizer — Occlusive night balm on cheeks and dry zones.",
            ],
        },
        "Oily": {
            "morning": [
                "Step 1: Cleanser — Gel cleanser with salicylic acid or zinc (La Roche-Posay Effaclar).",
                "Step 2: Toner — Alcohol-free niacinamide toner to balance sebum.",
                "Step 3: Moisturizer — Lightweight oil-free gel moisturizer.",
                "Step 4: SPF — Mattifying fluid sunscreen SPF 50.",
            ],
            "evening": [
                "Step 1: Cleanser — Double cleanse if wearing sunscreen or makeup.",
                "Step 2: Treatment — BHA 2% on T-zone 3–4 nights per week.",
                "Step 3: Moisturizer — Oil-free gel; avoid heavy balms on oily areas.",
            ],
        },
        "Normal": {
            "morning": [
                "Step 1: Cleanser — Gentle pH-balanced cleanser.",
                "Step 2: Serum — Vitamin C or antioxidant serum.",
                "Step 3: Moisturizer — Lightweight daily lotion.",
                "Step 4: SPF — Broad-spectrum SPF 30+.",
            ],
            "evening": [
                "Step 1: Cleanser — Remove SPF and daily buildup.",
                "Step 2: Treatment — Retinol or peptide serum 2–3 nights per week.",
                "Step 3: Moisturizer — Balanced night cream.",
            ],
        },
        "Combination": {
            "morning": [
                "Step 1: Cleanser — Gentle gel cleanser for full face.",
                "Step 2: Serum — Niacinamide on T-zone; hyaluronic acid on cheeks.",
                "Step 3: Moisturizer — Gel-cream; lighter on forehead/nose, richer on cheeks.",
                "Step 4: SPF — Non-comedogenic SPF 50.",
            ],
            "evening": [
                "Step 1: Cleanser — Focus on T-zone; soft cleanse on dry cheeks.",
                "Step 2: Treatment — BHA on T-zone only; avoid dry patches.",
                "Step 3: Moisturizer — Layer richer cream on cheeks if needed.",
            ],
        },
    }

    if flags["acne"]:
        routines[skin]["evening"].insert(
            1, "Step 2 (Acne): Spot treatment — Benzoyl peroxide 2.5% or salicylic acid on active breakouts."
        )
    if flags["sensitive"]:
        routines[skin]["morning"][0] = "Step 1: Cleanser — Fragrance-free micellar or cream cleanser only."
    if flags["pigment"]:
        routines[skin]["morning"].insert(
            2, "Step 2 (Pigmentation): Vitamin C serum — Stable L-ascorbic or THD ascorbate in AM."
        )

    products = {
        "Dry": {
            "affordable": ["CeraVe Hydrating Cleanser", "The Ordinary Hyaluronic Acid 2% + B5", "CeraVe Moisturizing Cream"],
            "high_end": ["La Roche-Posay Toleriane Hydrating Cleanser", "Vichy Minéral 89", "SkinCeuticals Triple Lipid Restore"],
        },
        "Oily": {
            "affordable": ["CeraVe Foaming Cleanser", "The Ordinary Niacinamide 10% + Zinc 1%", "Neutrogena Hydro Boost Gel"],
            "high_end": ["La Roche-Posay Effaclar Duo", "Paula's Choice 2% BHA", "Drunk Elephant Protini"],
        },
        "Normal": {
            "affordable": ["Cetaphil Gentle Cleanser", "The Ordinary Vitamin C 23%", "CeraVe PM Lotion"],
            "high_end": ["SkinCeuticals C E Ferulic", "Tatcha Dewy Cream", "Drunk Elephant Lala Retro"],
        },
        "Combination": {
            "affordable": ["CeraVe Foaming Cleanser", "The Ordinary Niacinamide 10%", "Neutrogena Hydro Boost"],
            "high_end": ["La Roche-Posay Effaclar H ISO-Biome", "Paula's Choice 2% BHA", "Kiehl's Ultra Facial Cream"],
        },
    }

    avoid_ingredients = {
        "Dry": ["Alcohol denat. in toners", "Harsh sulfates", "Over-exfoliating acids daily"],
        "Oily": ["Heavy mineral oils on T-zone", "Coconut oil if acne-prone", "Thick balms all over face"],
        "Normal": ["Aggressive scrubs daily", "Unbuffered high-strength acids without SPF"],
        "Combination": ["One heavy moisturizer on entire face", "Alcohol-heavy toners on dry cheeks"],
    }

    summary = f"Your scan indicates {skin} skin"
    if condition and condition != "no condition detected":
        summary += f" with noted concerns: {condition}."
    else:
        summary += " with no major concerns flagged in your questionnaire."
    summary += " Follow the AM/PM protocol below and patch-test new actives."

    return {
        "summary": summary,
        "daily_routine": routines[skin],
        "products": products[skin],
        "ingredients": {
            "look_for": ["Ceramides", "Niacinamide", "Hyaluronic acid", "SPF 30+"],
            "avoid": avoid_ingredients[skin],
        },
        "lifestyle_tips": [
            "Change pillowcases twice weekly if you have acne or sensitivity.",
            "Apply SPF as the last AM step — reapply outdoors every 2 hours.",
            "Introduce one new active product at a time; wait 2 weeks before adding another.",
        ],
    }


if __name__ == "__main__":
    print("--- TESTING ENGINE ---")
    res = get_recommendation("Oily", "Acne")
    print(json.dumps(res, indent=2))
