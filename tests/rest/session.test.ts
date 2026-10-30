import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  readAccessToken,
  persistRestSession,
  expireAuthentication,
  REST_SESSION_KEY,
} from "../../src/rest/api/session";
import type { LoginResult } from "../../src/rest/types/models";

const session = new Map<string, string>();
const local = new Map<string, string>();
const storage = (map: Map<string, string>) => ({
  getItem: (key: string) => map.get(key) ?? null,
  setItem: (key: string, value: string) => {
    map.set(key, value);
  },
  removeItem: (key: string) => {
    map.delete(key);
  },
});
Object.defineProperty(globalThis, "window", {
  value: {
    sessionStorage: storage(session),
    localStorage: storage(local),
    dispatchEvent: () => true,
  },
  configurable: true,
});
beforeEach(() => {
  session.clear();
  local.clear();
});

test("existing session token takes priority over remembered local token", () => {
  session.set("MFS_PORTAL", JSON.stringify({ jwt: "Bearer current" }));
  local.set("MFS_PORTAL", JSON.stringify({ token: "remembered" }));
  assert.equal(readAccessToken(), "current");
});
test("invalid session JSON does not hide a valid remembered token", () => {
  session.set("MFS_PORTAL", "{broken");
  local.set("MFS_PORTAL", JSON.stringify({ jwt: "remembered" }));
  assert.equal(readAccessToken(), "remembered");
});
test("REST login session survives a module reload via session storage", () => {
  const payload: LoginResult = {
    accessToken: "rest-token",
    tokenType: "Bearer",
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    user: {
      id: "user-1",
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
      isActive: true,
    },
  };
  persistRestSession(payload);
  assert.equal(readAccessToken(), "rest-token");
  assert.equal(JSON.parse(session.get(REST_SESSION_KEY)!).user.id, "user-1");
});
test("an expired REST session cannot fall back to an older account token", () => {
  session.set(
    REST_SESSION_KEY,
    JSON.stringify({
      accessToken: "expired",
      expiresAt: new Date(0).toISOString(),
    }),
  );
  local.set("MFS_PORTAL", JSON.stringify({ jwt: "other-account" }));
  assert.equal(readAccessToken(), null);
});
test("unauthorized cleanup removes both REST and legacy credentials", () => {
  session.set(REST_SESSION_KEY, JSON.stringify({ accessToken: "rest" }));
  session.set("MFS_PORTAL", JSON.stringify({ jwt: "session" }));
  local.set("MFS_PORTAL", JSON.stringify({ jwt: "local" }));
  expireAuthentication();
  assert.equal(readAccessToken(), null);
  assert.equal(local.size, 0);
  assert.equal(session.size, 0);
});
