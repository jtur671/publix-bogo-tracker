import type { Category } from "@/types";

export const CATEGORIES: Category[] = [
  {
    name: "Household",
    icon: "🏠",
    keywords: [
      "paper towel", "toilet paper", "tissue", "trash bag", "aluminum",
      "plastic wrap", "zip lock", "ziploc", "glad", "hefty", "swiffer",
      "cleaning", "detergent", "soap", "bleach", "lysol", "clorox",
      "febreze", "air freshener", "laundry", "arm & hammer", "arm &amp",
    ],
  },
  {
    name: "Personal Care",
    icon: "🧴",
    keywords: [
      "shampoo", "conditioner", "body wash", "lotion", "deodorant",
      "toothpaste", "toothbrush", "mouthwash", "razor", "shaving",
      "sunscreen", "feminine", "tampon", "pad",
    ],
  },
  {
    name: "Baby & Pet",
    icon: "🐾",
    keywords: [
      "baby", "diaper", "formula", "wipes", "dog food", "cat food", "pet food",
      "puppy", "kitten", "litter",
    ],
  },
  {
    name: "Health",
    icon: "💊",
    keywords: [
      "vitamin", "supplement", "medicine", "pain relief", "allergy",
      "bandage", "first aid", "antacid", "probiotic",
    ],
  },
  {
    name: "Pantry",
    icon: "🥫",
    keywords: [
      "sauce", "pasta", "rice", "soup", "canned", "bean", "cereal",
      "oatmeal", "flour", "sugar", "olive oil", "cooking oil", "vinegar",
      "condiment", "ketchup", "mustard", "mayo", "dressing", "salsa",
      "broth", "seasoning", "spice", "syrup", "jam", "jelly",
      "peanut butter", "nutella", "bread crumb",
    ],
  },
  {
    name: "Meat & Seafood",
    icon: "🥩",
    keywords: [
      "chicken", "beef", "pork", "steak", "ground beef", "ground turkey",
      "sausage", "bacon", "turkey", "salmon", "shrimp", "tilapia", "fish",
      "crab", "lobster", "ribs", "roast", "tenderloin", "meatball",
      "hot dog", "brat", "deli meat", "lunch meat", "baked ham", "ham",
    ],
  },
  {
    name: "Dairy & Eggs",
    icon: "🥛",
    keywords: [
      "milk", "cheese", "yogurt", "butter", "cream", "egg", "sour cream",
      "cottage cheese", "creamer", "half & half", "half and half",
      "whipped", "string cheese", "shredded cheese",
    ],
  },
  {
    name: "Frozen",
    icon: "🧊",
    keywords: [
      "frozen", "ice cream", "pizza", "freezer", "popsicle", "gelato",
      "sorbet", "frozen fruit", "frozen vegeta", "frozen meal", "frozen dinner",
      "waffles", "frozen bread",
    ],
  },
  {
    name: "Beverages",
    icon: "🥤",
    keywords: [
      "water", "soda", "juice", "tea", "coffee", "drink", "sparkling",
      "lemonade", "gatorade", "powerade", "cola", "pepsi", "coke",
      "monster", "red bull", "energy", "kombucha",
    ],
  },
  {
    name: "Snacks",
    icon: "🍿",
    keywords: [
      "potato chip", "tortilla chip", "chip", "cracker", "cookie", "pretzel",
      "popcorn", "nut", "trail mix", "granola bar", "snack", "goldfish",
      "cheez", "oreo", "doritos", "lay's", "pringles", "rice cake",
    ],
  },
  {
    name: "Bakery & Bread",
    icon: "🍞",
    keywords: [
      "butter bread", "wheat bread", "white bread", "bread", "bagel",
      "muffin", "roll", "bun", "tortilla", "wrap", "croissant", "cake",
      "pie", "donut", "pastry", "bakery",
    ],
  },
  {
    name: "Produce",
    icon: "🥬",
    keywords: [
      "salad", "lettuce", "tomato", "potato", "onion", "pepper",
      "fruit", "apple", "banana", "berry", "grape", "orange",
      "avocado", "mushroom", "carrot", "celery", "broccoli",
      "spinach", "kale", "cucumber",
    ],
  },
  {
    name: "Other",
    icon: "🏷️",
    keywords: [],
  },
];

// Keywords that need word-boundary matching to avoid false positives
const BOUNDARY_KEYWORDS = new Set(["ham", "steak", "oil", "rice", "egg"]);

export function classifyDeal(name: string, description: string): string {
  const text = `${name} ${description}`.toLowerCase();

  // Collect all matching keywords across all categories,
  // then pick the category with the longest keyword match.
  // This prevents "butter" (Dairy) from beating "butter bread" (Bakery)
  // or "cream" (Dairy) from beating "ice cream" (Frozen).
  let bestCategory = "Other";
  let bestKeywordLength = 0;

  for (const category of CATEGORIES) {
    if (category.name === "Other") continue;
    for (const keyword of category.keywords) {
      let matched = false;
      if (BOUNDARY_KEYWORDS.has(keyword)) {
        const regex = new RegExp(`\\b${keyword}s?\\b`);
        matched = regex.test(text);
      } else {
        matched = text.includes(keyword);
      }
      if (matched && keyword.length > bestKeywordLength) {
        bestKeywordLength = keyword.length;
        bestCategory = category.name;
      }
    }
  }

  return bestCategory;
}
