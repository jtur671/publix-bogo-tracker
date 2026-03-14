import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePublixAccount } from "@/hooks/use-publix-account";

const LOCAL_KEY = "publix-email";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe("usePublixAccount", () => {
  describe("initial state (no stored email)", () => {
    it("should return hasEmail=false and email=null when nothing stored", () => {
      const { result } = renderHook(() => usePublixAccount());

      expect(result.current.hasEmail).toBe(false);
      expect(result.current.email).toBeNull();
    });
  });

  describe("loading stored email on mount", () => {
    it("should hydrate state from localStorage", async () => {
      localStorage.setItem(LOCAL_KEY, "user@example.com");

      const { result } = renderHook(() => usePublixAccount());

      await vi.waitFor(() => {
        expect(result.current.hasEmail).toBe(true);
      });

      expect(result.current.email).toBe("user@example.com");
    });
  });

  describe("saveEmail flow", () => {
    it("should store email and update state", () => {
      const { result } = renderHook(() => usePublixAccount());

      act(() => {
        result.current.saveEmail("test@publix.com");
      });

      expect(result.current.hasEmail).toBe(true);
      expect(result.current.email).toBe("test@publix.com");
      expect(localStorage.getItem(LOCAL_KEY)).toBe("test@publix.com");
    });

    it("should overwrite previous email", () => {
      const { result } = renderHook(() => usePublixAccount());

      act(() => {
        result.current.saveEmail("first@example.com");
      });

      act(() => {
        result.current.saveEmail("second@example.com");
      });

      expect(result.current.email).toBe("second@example.com");
      expect(localStorage.getItem(LOCAL_KEY)).toBe("second@example.com");
    });
  });

  describe("clearEmail flow", () => {
    it("should clear email and reset state", () => {
      const { result } = renderHook(() => usePublixAccount());

      act(() => {
        result.current.saveEmail("user@example.com");
      });

      expect(result.current.hasEmail).toBe(true);

      act(() => {
        result.current.clearEmail();
      });

      expect(result.current.hasEmail).toBe(false);
      expect(result.current.email).toBeNull();
      expect(localStorage.getItem(LOCAL_KEY)).toBeNull();
    });

    it("should be safe to call clearEmail when no email saved", () => {
      const { result } = renderHook(() => usePublixAccount());

      expect(result.current.hasEmail).toBe(false);

      act(() => {
        result.current.clearEmail();
      });

      expect(result.current.hasEmail).toBe(false);
      expect(result.current.email).toBeNull();
    });
  });

  describe("no password stored anywhere", () => {
    it("should never store a password in localStorage", () => {
      const { result } = renderHook(() => usePublixAccount());

      act(() => {
        result.current.saveEmail("user@example.com");
      });

      // The stored value should be a plain email string, no password
      const stored = localStorage.getItem(LOCAL_KEY);
      expect(stored).toBe("user@example.com");
      expect(stored).not.toContain("password");
    });
  });

  describe("function reference stability", () => {
    it("should return stable function references across renders", () => {
      const { result, rerender } = renderHook(() => usePublixAccount());

      const firstSaveEmail = result.current.saveEmail;
      const firstClearEmail = result.current.clearEmail;

      rerender();

      expect(result.current.saveEmail).toBe(firstSaveEmail);
      expect(result.current.clearEmail).toBe(firstClearEmail);
    });
  });
});
