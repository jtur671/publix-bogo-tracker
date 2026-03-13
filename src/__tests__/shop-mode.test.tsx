import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ShopMode } from "@/components/shop-mode";
import type { ShoppingTripItem, Deal } from "@/types";

// ---------------------------------------------------------------------------
// Mock next/navigation
// ---------------------------------------------------------------------------
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeItem(overrides: Partial<ShoppingTripItem> = {}): ShoppingTripItem {
  return {
    id: crypto.randomUUID(),
    name: "Test Item",
    checked: false,
    checked_at: null,
    has_bogo: false,
    added_at: new Date().toISOString(),
    ...overrides,
  };
}

function makeDeal(overrides: Partial<Deal> = {}): Deal {
  return {
    id: Math.floor(Math.random() * 100000),
    name: "Test Deal",
    description: "",
    imageUrl: "",
    price: null,
    priceText: null,
    saleStory: null,
    validFrom: "2026-03-10",
    validTo: "2026-03-17",
    category: "Other",
    daysLeft: 5,
    isExpiringSoon: false,
    merchantName: "Publix",
    ...overrides,
  };
}

const defaultProps = {
  deals: [] as Deal[],
  zipCode: "34695",
  onToggleItem: vi.fn(),
  onAddItem: vi.fn(),
  onRemoveItem: vi.fn(),
  onDone: vi.fn(),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ShopMode", () => {
  it("renders unchecked items before checked items", () => {
    const items = [
      makeItem({ name: "Milk", checked: true, checked_at: new Date().toISOString() }),
      makeItem({ name: "Bread", checked: false }),
      makeItem({ name: "Eggs", checked: true, checked_at: new Date().toISOString() }),
      makeItem({ name: "Cheese", checked: false }),
    ];

    render(<ShopMode {...defaultProps} items={items} />);

    const listItems = screen.getAllByRole("listitem");
    // First 2 should be unchecked (Bread, Cheese), last 2 should be checked (Milk, Eggs)
    expect(listItems).toHaveLength(4);

    // Unchecked items rendered first
    expect(listItems[0]).toHaveTextContent("Bread");
    expect(listItems[1]).toHaveTextContent("Cheese");
  });

  it("renders BOGO items before non-BOGO items in unchecked section", () => {
    const items = [
      makeItem({ name: "Milk", has_bogo: false }),
      makeItem({ name: "Cheerios", has_bogo: true }),
      makeItem({ name: "Bread", has_bogo: false }),
      makeItem({ name: "Chips", has_bogo: true }),
    ];

    render(<ShopMode {...defaultProps} items={items} />);

    const listItems = screen.getAllByRole("listitem");
    // BOGO items should come first
    expect(listItems[0]).toHaveTextContent("Cheerios");
    expect(listItems[1]).toHaveTextContent("Chips");
    expect(listItems[2]).toHaveTextContent("Milk");
    expect(listItems[3]).toHaveTextContent("Bread");
  });

  it("shows strikethrough on checked items", () => {
    const items = [
      makeItem({ name: "Bought Item", checked: true, checked_at: new Date().toISOString() }),
    ];

    render(<ShopMode {...defaultProps} items={items} />);

    // The bought item should have the shop-strike class
    const strikeEl = document.querySelector(".shop-strike");
    expect(strikeEl).not.toBeNull();
    expect(strikeEl!.textContent).toBe("Bought Item");
  });

  it("shows Bought (N) divider with correct count", () => {
    const items = [
      makeItem({ name: "Bread" }),
      makeItem({ name: "Milk", checked: true, checked_at: new Date().toISOString() }),
      makeItem({ name: "Eggs", checked: true, checked_at: new Date().toISOString() }),
    ];

    render(<ShopMode {...defaultProps} items={items} />);

    const divider = screen.getByTestId("bought-divider");
    expect(divider).toHaveTextContent("Bought (2)");
  });

  it("shows item count header correctly", () => {
    const items = [
      makeItem({ name: "Bread" }),
      makeItem({ name: "Milk", checked: true, checked_at: new Date().toISOString() }),
      makeItem({ name: "Eggs" }),
    ];

    render(<ShopMode {...defaultProps} items={items} />);

    const count = screen.getByTestId("item-count");
    expect(count).toHaveTextContent("1 of 3");
  });

  it("calls onToggleItem when row is tapped", () => {
    const onToggle = vi.fn();
    const items = [makeItem({ name: "Milk" })];

    render(
      <ShopMode {...defaultProps} items={items} onToggleItem={onToggle} />
    );

    fireEvent.click(screen.getByText("Milk"));
    expect(onToggle).toHaveBeenCalledWith(items[0].id);
  });

  it("shows BOGO pill on items with has_bogo", () => {
    const items = [
      makeItem({ name: "Cheerios", has_bogo: true }),
      makeItem({ name: "Milk", has_bogo: false }),
    ];

    render(<ShopMode {...defaultProps} items={items} />);

    const bogoPills = screen.getAllByText("BOGO");
    expect(bogoPills).toHaveLength(1);
  });

  it("shows quick-add input", () => {
    render(<ShopMode {...defaultProps} items={[]} />);

    const input = screen.getByPlaceholderText("Add an item...");
    expect(input).toBeInTheDocument();
  });

  it("calls onAddItem when form is submitted", () => {
    const onAdd = vi.fn();
    render(
      <ShopMode {...defaultProps} items={[]} onAddItem={onAdd} />
    );

    const input = screen.getByPlaceholderText("Add an item...");
    fireEvent.change(input, { target: { value: "bananas" } });
    fireEvent.submit(input.closest("form")!);

    expect(onAdd).toHaveBeenCalledWith("bananas");
  });

  it("calls onDone when Done button is clicked", () => {
    const onDone = vi.fn();
    const items = [makeItem({ name: "Milk" })];

    render(<ShopMode {...defaultProps} items={items} onDone={onDone} />);

    fireEvent.click(screen.getByTestId("done-button"));
    expect(onDone).toHaveBeenCalled();
  });

  it("renders empty state when no items", () => {
    render(<ShopMode {...defaultProps} items={[]} />);

    expect(
      screen.getByText("No items yet. Add some above!")
    ).toBeInTheDocument();
  });
});
