import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock Supabase server client — controls auth state per test
// ---------------------------------------------------------------------------
const mockGetUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: () => mockGetUser(),
    },
  }),
}));

// ---------------------------------------------------------------------------
// Mock global fetch — simulates the clipper service
// ---------------------------------------------------------------------------
const mockFetch = vi.fn();

// ---------------------------------------------------------------------------
// NextRequest shim
// ---------------------------------------------------------------------------
function makeNextRequest(url: string, init?: RequestInit) {
  const parsed = new URL(url);
  const req = new Request(url, init);
  (req as any).nextUrl = parsed;
  return req;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("/api/clip-coupons route (proxy to clipper service)", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    mockGetUser.mockReset();
    mockFetch.mockReset();
    vi.stubGlobal("fetch", mockFetch);
    process.env.CLIPPER_URL = "https://clipper.example.com";
    process.env.CLIPPER_API_KEY = "test-api-key";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = { ...originalEnv };
  });

  it("should return 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });

    const { POST } = await import("@/app/api/clip-coupons/route");
    const req = makeNextRequest("http://localhost:3000/api/clip-coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "a@b.com", password: "pass" }),
    });
    const response = await POST(req as any);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should return 400 when email is missing", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-1" } },
    });

    const { POST } = await import("@/app/api/clip-coupons/route");
    const req = makeNextRequest("http://localhost:3000/api/clip-coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "pass" }),
    });
    const response = await POST(req as any);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Email and password are required");
  });

  it("should return 400 when password is missing", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-1" } },
    });

    const { POST } = await import("@/app/api/clip-coupons/route");
    const req = makeNextRequest("http://localhost:3000/api/clip-coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "a@b.com" }),
    });
    const response = await POST(req as any);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Email and password are required");
  });

  it("should return 503 when clipper service is not configured", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-1" } },
    });
    delete process.env.CLIPPER_URL;
    delete process.env.CLIPPER_API_KEY;

    const { POST } = await import("@/app/api/clip-coupons/route");
    const req = makeNextRequest("http://localhost:3000/api/clip-coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "a@b.com", password: "pass" }),
    });
    const response = await POST(req as any);
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toBe("Clipper service not configured");
  });

  it("should proxy successful response from clipper service", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-1" } },
    });
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ clipped: 5, total: 20 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const { POST } = await import("@/app/api/clip-coupons/route");
    const req = makeNextRequest("http://localhost:3000/api/clip-coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "a@b.com", password: "pass" }),
    });
    const response = await POST(req as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.clipped).toBe(5);
    expect(body.total).toBe(20);

    // Verify correct URL and headers sent to clipper
    expect(mockFetch).toHaveBeenCalledWith(
      "https://clipper.example.com/clip",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "test-api-key",
        },
      })
    );
  });

  it("should proxy 422 error from clipper service", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-1" } },
    });
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ error: "Login failed: incorrect password" }),
        { status: 422, headers: { "Content-Type": "application/json" } }
      )
    );

    const { POST } = await import("@/app/api/clip-coupons/route");
    const req = makeNextRequest("http://localhost:3000/api/clip-coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "a@b.com", password: "wrong" }),
    });
    const response = await POST(req as any);
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error).toBe("Login failed: incorrect password");
  });

  it("should return 502 when clipper returns non-JSON response", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-1" } },
    });
    mockFetch.mockResolvedValueOnce(
      new Response("<html>502 Bad Gateway</html>", {
        status: 502,
        headers: { "Content-Type": "text/html" },
      })
    );

    const { POST } = await import("@/app/api/clip-coupons/route");
    const req = makeNextRequest("http://localhost:3000/api/clip-coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "a@b.com", password: "pass" }),
    });
    const response = await POST(req as any);
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.error).toBe("Clipper service returned an invalid response");
  });

  it("should return 500 when fetch throws a network error", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-1" } },
    });
    mockFetch.mockRejectedValueOnce(new Error("ECONNREFUSED"));

    const { POST } = await import("@/app/api/clip-coupons/route");
    const req = makeNextRequest("http://localhost:3000/api/clip-coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "a@b.com", password: "pass" }),
    });
    const response = await POST(req as any);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("An unexpected error occurred");
  });

  it("should return clipped=0 when all coupons already clipped", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-1" } },
    });
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ clipped: 0, total: 15 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const { POST } = await import("@/app/api/clip-coupons/route");
    const req = makeNextRequest("http://localhost:3000/api/clip-coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "a@b.com", password: "pass" }),
    });
    const response = await POST(req as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.clipped).toBe(0);
    expect(body.total).toBe(15);
  });
});
