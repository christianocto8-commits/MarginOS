import { describe, it } from "node:test";
import assert from "node:assert/strict";

const BASE_URL = "http://localhost:3000";

describe("MarginOS Live API Security Integration Tests", () => {
  it("GET / returns 200 OK (Public Landing Page)", async () => {
    const res = await fetch(`${BASE_URL}`);
    assert.equal(res.status, 200);
  });

  it("POST /api/super-admin/impersonate rejects unauthenticated callers with 403", async () => {
    const res = await fetch(`${BASE_URL}/api/super-admin/impersonate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId: "test-biz" }),
    });
    assert.equal(res.status, 403);
    const data = await res.json();
    assert.ok(data.error.includes("Super Admin"));
  });

  it("GET /api/super-admin/tenants rejects unauthenticated callers with 403", async () => {
    const res = await fetch(`${BASE_URL}/api/super-admin/tenants`);
    assert.equal(res.status, 403);
  });

  it("DELETE /api/super-admin/tenants rejects unauthenticated callers with 403", async () => {
    const res = await fetch(`${BASE_URL}/api/super-admin/tenants?id=arbitrary-id`, {
      method: "DELETE",
    });
    assert.equal(res.status, 403);
  });

  it("GET /api/admin/users rejects unauthenticated callers with 401 (No findFirst data leak)", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/users`);
    assert.equal(res.status, 401);
  });

  it("GET /api/admin/crm rejects unauthenticated callers with 401", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/crm`);
    assert.equal(res.status, 401);
  });

  it("GET /api/admin/business rejects unauthenticated callers with 401", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/business`);
    assert.equal(res.status, 401);
  });

  it("GET /api/dashboard rejects unauthenticated callers with 401", async () => {
    const res = await fetch(`${BASE_URL}/api/dashboard`);
    assert.equal(res.status, 401);
  });

  it("GET /api/menus rejects unauthenticated callers with 401", async () => {
    const res = await fetch(`${BASE_URL}/api/menus`);
    assert.equal(res.status, 401);
  });

  it("GET /api/ingredients rejects unauthenticated callers with 401", async () => {
    const res = await fetch(`${BASE_URL}/api/ingredients`);
    assert.equal(res.status, 401);
  });

  it("GET /api/purchases rejects unauthenticated callers with 401", async () => {
    const res = await fetch(`${BASE_URL}/api/purchases`);
    assert.equal(res.status, 401);
  });

  it("POST /api/billing/webhook rejects unauthenticated/unsigned requests with 401", async () => {
    const res = await fetch(`${BASE_URL}/api/billing/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: "FAKE-INV", status: "PAID" }),
    });
    assert.equal(res.status, 401);
  });

  it("GET /api/billing/check-status rejects unauthenticated callers with 401", async () => {
    const res = await fetch(`${BASE_URL}/api/billing/check-status?invoiceId=INV-123`);
    assert.equal(res.status, 401);
  });

  it("GET /portal redirects unauthenticated callers with 307 to /login", async () => {
    const res = await fetch(`${BASE_URL}/portal`, { redirect: "manual" });
    assert.equal(res.status, 307);
    assert.ok(res.headers.get("location")?.includes("/login"));
  });

  it("GET /pos redirects unauthenticated callers with 307 to /login", async () => {
    const res = await fetch(`${BASE_URL}/pos`, { redirect: "manual" });
    assert.equal(res.status, 307);
    assert.ok(res.headers.get("location")?.includes("/login"));
  });

  it("GET /settings redirects unauthenticated callers with 307 to /login", async () => {
    const res = await fetch(`${BASE_URL}/settings`, { redirect: "manual" });
    assert.equal(res.status, 307);
    assert.ok(res.headers.get("location")?.includes("/login"));
  });
});
