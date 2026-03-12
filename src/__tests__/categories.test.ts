import { describe, it, expect } from "vitest";
import { classifyDeal } from "@/lib/categories";

describe("classifyDeal", () => {
  // Household
  it("classifies paper towels as Household", () => {
    expect(classifyDeal("Bounty Paper Towels", "BOGO")).toBe("Household");
  });

  it("classifies detergent as Household", () => {
    expect(classifyDeal("Tide Laundry Detergent", "")).toBe("Household");
  });

  it("classifies cleaning products as Household", () => {
    expect(classifyDeal("Clorox Bleach", "cleaning spray")).toBe("Household");
  });

  // Personal Care
  it("classifies shampoo as Personal Care", () => {
    expect(classifyDeal("Pantene Shampoo", "BOGO")).toBe("Personal Care");
  });

  it("classifies toothpaste as Personal Care", () => {
    expect(classifyDeal("Colgate Toothpaste", "")).toBe("Personal Care");
  });

  // Baby & Pet
  it("classifies dog food as Baby & Pet", () => {
    expect(classifyDeal("Purina Dog Food", "BOGO")).toBe("Baby & Pet");
  });

  it("classifies diapers as Baby & Pet", () => {
    expect(classifyDeal("Huggies Diapers", "baby wipes")).toBe("Baby & Pet");
  });

  // Health
  it("classifies vitamins as Health", () => {
    expect(classifyDeal("Nature Made Vitamin D", "supplement")).toBe("Health");
  });

  // Pantry
  it("classifies pasta sauce as Pantry", () => {
    expect(classifyDeal("Ragu Pasta Sauce", "")).toBe("Pantry");
  });

  it("classifies cereal as Pantry", () => {
    expect(classifyDeal("Cheerios Cereal", "BOGO")).toBe("Pantry");
  });

  // Meat & Seafood
  it("classifies chicken as Meat & Seafood", () => {
    expect(classifyDeal("Perdue Chicken Breast", "BOGO")).toBe("Meat & Seafood");
  });

  it("classifies salmon as Meat & Seafood", () => {
    expect(classifyDeal("Atlantic Salmon Fillet", "")).toBe("Meat & Seafood");
  });

  // Boundary keyword matching - "ham" should not match "shampoo"
  it("does not classify shampoo as Meat & Seafood (boundary keyword 'ham')", () => {
    expect(classifyDeal("Head & Shoulders Shampoo", "")).not.toBe("Meat & Seafood");
  });

  it("classifies actual ham as Meat & Seafood", () => {
    expect(classifyDeal("Honey Baked Ham", "spiral cut ham")).toBe("Meat & Seafood");
  });

  // Boundary keyword matching - "steak" should not match substring
  it("classifies steak properly with boundary", () => {
    expect(classifyDeal("USDA Choice Steak", "")).toBe("Meat & Seafood");
  });

  // Dairy & Eggs
  it("classifies yogurt as Dairy & Eggs", () => {
    expect(classifyDeal("Chobani Greek Yogurt", "BOGO")).toBe("Dairy & Eggs");
  });

  it("classifies eggs with boundary matching", () => {
    expect(classifyDeal("Large Eggs, Dozen", "fresh eggs")).toBe("Dairy & Eggs");
  });

  // Frozen
  it("classifies frozen pizza as Frozen", () => {
    expect(classifyDeal("DiGiorno Frozen Pizza", "")).toBe("Frozen");
  });

  it("classifies ice cream as Frozen", () => {
    expect(classifyDeal("Haagen-Dazs Ice Cream", "BOGO")).toBe("Frozen");
  });

  // Beverages
  it("classifies soda as Beverages", () => {
    expect(classifyDeal("Coca-Cola 12 Pack", "coke soda")).toBe("Beverages");
  });

  it("classifies coffee as Beverages", () => {
    expect(classifyDeal("Folgers Coffee", "BOGO")).toBe("Beverages");
  });

  // Snacks
  it("classifies chips as Snacks", () => {
    expect(classifyDeal("Lay's Potato Chips", "BOGO")).toBe("Snacks");
  });

  it("classifies crackers as Snacks", () => {
    expect(classifyDeal("Goldfish Crackers", "snack")).toBe("Snacks");
  });

  // Bakery & Bread
  it("classifies bread as Bakery & Bread", () => {
    expect(classifyDeal("Sara Lee Butter Bread", "")).toBe("Bakery & Bread");
  });

  it("classifies bagels as Bakery & Bread", () => {
    expect(classifyDeal("Thomas Bagels", "BOGO")).toBe("Bakery & Bread");
  });

  // Produce
  it("classifies salad as Produce", () => {
    expect(classifyDeal("Dole Salad Mix", "fresh salad")).toBe("Produce");
  });

  // Other (fallback)
  it("returns Other for unrecognized items", () => {
    expect(classifyDeal("Mystery Product XYZ", "unknown item")).toBe("Other");
  });

  // Case insensitivity
  it("is case insensitive", () => {
    expect(classifyDeal("BOUNTY PAPER TOWELS", "BOGO")).toBe("Household");
  });

  // Matches description when name doesn't match
  it("matches keywords in description", () => {
    expect(classifyDeal("Brand X Product", "fresh salmon fillet")).toBe("Meat & Seafood");
  });
});
