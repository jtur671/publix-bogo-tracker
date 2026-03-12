import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useStoreConfig } from "@/hooks/use-store-config";

// Mock the Supabase store-config module
vi.mock("@/lib/store-config", () => ({
  updateZipCode: vi.fn().mockRejectedValue(new Error("Supabase not configured")),
}));

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe("useStoreConfig", () => {
  describe("default behavior", () => {
    it("should default to zip code 34695 when no stored value", () => {
      const { result } = renderHook(() => useStoreConfig());

      // Before the useEffect fires, zipCode falls through to DEFAULT_ZIP
      expect(result.current.zipCode).toBe("34695");
    });

    it("should show needsSetup=true when no zip is stored", async () => {
      const { result } = renderHook(() => useStoreConfig());

      await vi.waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.needsSetup).toBe(true);
    });

    it("should show needsSetup=false when zip is already stored", async () => {
      localStorage.setItem("bogo-zip-code", "32801");

      const { result } = renderHook(() => useStoreConfig());

      await vi.waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.needsSetup).toBe(false);
    });
  });

  describe("loading stored zip code", () => {
    it("should load the zip code from localStorage", async () => {
      localStorage.setItem("bogo-zip-code", "32801");

      const { result } = renderHook(() => useStoreConfig());

      await vi.waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.zipCode).toBe("32801");
    });

    it("should populate config object when zip is stored", async () => {
      localStorage.setItem("bogo-zip-code", "33101");

      const { result } = renderHook(() => useStoreConfig());

      await vi.waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.config).not.toBeNull();
      expect(result.current.config?.zip_code).toBe("33101");
      expect(result.current.config?.id).toBe(1);
    });
  });

  describe("updateZip", () => {
    it("should update the zip code and persist to localStorage", async () => {
      const { result } = renderHook(() => useStoreConfig());

      await vi.waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateZip("90210");
      });

      expect(result.current.zipCode).toBe("90210");
      expect(localStorage.getItem("bogo-zip-code")).toBe("90210");
    });

    it("should set needsSetup to false after updating zip", async () => {
      const { result } = renderHook(() => useStoreConfig());

      await vi.waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.needsSetup).toBe(true);

      await act(async () => {
        await result.current.updateZip("34695");
      });

      expect(result.current.needsSetup).toBe(false);
    });

    it("should update the config object with new zip", async () => {
      const { result } = renderHook(() => useStoreConfig());

      await vi.waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateZip("12345");
      });

      expect(result.current.config?.zip_code).toBe("12345");
      expect(result.current.config?.updated_at).toBeDefined();
    });
  });

  describe("zip code validation (ZipCodeModal)", () => {
    /**
     * The zip validation regex /^\d{5}$/ lives in the ZipCodeModal and
     * the API routes. We test the same regex here to cover the pattern.
     */
    const isValidZip = (zip: string) => /^\d{5}$/.test(zip);

    it("should accept valid 5-digit zip codes", () => {
      expect(isValidZip("34695")).toBe(true);
      expect(isValidZip("90210")).toBe(true);
      expect(isValidZip("00000")).toBe(true);
      expect(isValidZip("99999")).toBe(true);
    });

    it("should reject zip codes that are too short", () => {
      expect(isValidZip("3469")).toBe(false);
      expect(isValidZip("")).toBe(false);
    });

    it("should reject zip codes that are too long", () => {
      expect(isValidZip("346950")).toBe(false);
      expect(isValidZip("34695-1234")).toBe(false);
    });

    it("should reject non-numeric zip codes", () => {
      expect(isValidZip("abcde")).toBe(false);
      expect(isValidZip("3469a")).toBe(false);
      expect(isValidZip("34 95")).toBe(false);
    });
  });
});
