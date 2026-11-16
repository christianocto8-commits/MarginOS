import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, comparePassword, signToken, verifyToken } from "../src/lib/auth";

describe("MarginOS Auth & Security Tests", () => {
  it("hashPassword and comparePassword correctly hash and verify passwords", async () => {
    const raw = "SecurePassword123!";
    const hash = await hashPassword(raw);

    assert.notEqual(raw, hash);
    assert.equal(hash.startsWith("$2"), true); // bcrypt hash prefix

    const isValid = await comparePassword(raw, hash);
    assert.equal(isValid, true);

    const isInvalid = await comparePassword("WrongPassword", hash);
    assert.equal(isInvalid, false);
  });

  it("signToken produces a verifiable JWT with expected claims", () => {
    const payload = {
      userId: "user_test_123",
      businessId: "biz_test_456",
      role: "OWNER",
    };

    const token = signToken(payload);
    assert.equal(typeof token, "string");
    assert.equal(token.split(".").length, 3); // JWT 3 parts

    const verified = verifyToken(token);
    assert.ok(verified);
    assert.equal(verified?.userId, payload.userId);
    assert.equal(verified?.businessId, payload.businessId);
    assert.equal(verified?.role, payload.role);
  });

  it("verifyToken returns null on tampered or invalid token", () => {
    const token = signToken({
      userId: "u1",
      businessId: "b1",
      role: "STAFF",
    });

    const tampered = token.slice(0, -5) + "abcde";
    const result = verifyToken(tampered);
    assert.equal(result, null);

    const invalid = verifyToken("not-a-token");
    assert.equal(invalid, null);
  });
});
