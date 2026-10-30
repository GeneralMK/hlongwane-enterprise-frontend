import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  ApiError,
  configureApi,
  request,
  segment,
} from "../../src/rest/api/client";
import { getProducts } from "../../src/rest/queries/products";
import { getFile } from "../../src/rest/queries/files";
import { createSignedUpload, uploadFile } from "../../src/rest/mutations/files";
import { removeCartItem } from "../../src/rest/mutations/carts";
import { login } from "../../src/rest/mutations/auth";

Object.defineProperty(globalThis, "window", {
  value: { location: { origin: "http://frontend.test" } },
  configurable: true,
});
const originalFetch = globalThis.fetch;
configureApi({ baseUrl: "/api" });
afterEach(() => {
  globalThis.fetch = originalFetch;
  configureApi({
    baseUrl: "/api",
    getToken: () => null,
    setToken: () => {},
    onUnauthorized: undefined,
  });
});
function mockFetch(
  payload: unknown,
  status = 200,
  inspect?: (url: string, init?: RequestInit) => void,
) {
  globalThis.fetch = (async (url, init) => {
    inspect?.(String(url), init);
    return new Response(JSON.stringify(payload), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;
}
test("products preserve pagination, serialize filters and forward cancellation", async () => {
  const controller = new AbortController();
  const data = {
    items: [],
    pagination: { page: 2, limit: 10, total: 0, pages: 0 },
  };
  mockFetch({ success: true, data }, 200, (url, init) => {
    const parsed = new URL(url);
    assert.equal(parsed.pathname, "/api/products");
    assert.equal(parsed.searchParams.get("page"), "2");
    assert.equal(parsed.searchParams.get("isFeatured"), "false");
    assert.equal(parsed.searchParams.get("search"), "phone & tablet");
    assert.equal(parsed.searchParams.has("brandId"), false);
    assert.equal(init?.signal, controller.signal);
  });
  assert.deepEqual(
    await getProducts(
      { params: { page: 2, isFeatured: false, search: "phone & tablet" } },
      controller.signal,
    ),
    data,
  );
});
test("normal requests send Bearer token; login omits stale token", async () => {
  configureApi({ baseUrl: "http://api.test/v1/", getToken: () => "old-token" });
  mockFetch({ success: true, data: {} }, 200, (url, init) => {
    assert.equal(url, "http://api.test/v1/test");
    assert.equal(
      new Headers(init?.headers).get("Authorization"),
      "Bearer old-token",
    );
  });
  await request("GET", "/test");
  mockFetch({ success: true, data: {} }, 200, (_, init) =>
    assert.equal(new Headers(init?.headers).get("Authorization"), null),
  );
  await login({ body: { email: "test@example.com", password: "password" } });
});
test("401 preserves backend error and invokes unauthorized handler", async () => {
  let called = 0;
  configureApi({
    onUnauthorized: () => {
      called++;
    },
  });
  mockFetch(
    {
      success: false,
      error: { message: "Session expired", code: "UNAUTHORIZED" },
    },
    401,
  );
  await assert.rejects(
    request("GET", "/auth/me"),
    (error) =>
      error instanceof ApiError &&
      error.status === 401 &&
      error.code === "UNAUTHORIZED" &&
      error.message === "Session expired",
  );
  assert.equal(called, 1);
});
test("business failures remain errors even when status is 200", async () => {
  mockFetch({ success: false, message: "Stock unavailable", code: "NO_STOCK" });
  await assert.rejects(
    request("POST", "/test"),
    (error) => error instanceof ApiError && error.code === "NO_STOCK",
  );
});
test("file endpoints use file and root wrappers rather than data wrapper", async () => {
  mockFetch({ success: true, file: { id: 12, originalName: "image.png" } });
  assert.equal((await getFile({ id: 12 })).id, 12);
  mockFetch({
    success: true,
    fileUpload: { id: 12 },
    signedUrl: "https://upload.test",
    path: "image.png",
    token: "",
  });
  assert.equal(
    (
      await createSignedUpload({
        body: {
          purpose: "PRODUCT_IMAGE",
          originalName: "image.png",
          mimeType: "image/png",
        },
      })
    ).signedUrl,
    "https://upload.test",
  );
});
test("multipart upload leaves Content-Type boundary to the browser", async () => {
  mockFetch({ success: true, file: { id: 1 } }, 201, (_, init) => {
    assert.ok(init?.body instanceof FormData);
    assert.equal(new Headers(init.headers).has("Content-Type"), false);
    assert.equal(init.body.get("purpose"), "PRODUCT_IMAGE");
    assert.equal(init.body.get("metadata"), '{"alt":"phone"}');
  });
  await uploadFile({
    body: {
      file: new File(["image"], "image.png", { type: "image/png" }),
      purpose: "PRODUCT_IMAGE",
      metadata: { alt: "phone" },
    },
  });
});
test("empty body responses and encoded route IDs are handled", async () => {
  globalThis.fetch = (async (url, init) => {
    assert.equal(String(url), "http://frontend.test/api/carts/me/items/a%2Fb");
    assert.equal(init?.method, "DELETE");
    return new Response(null, { status: 204 });
  }) as typeof fetch;
  assert.equal(await removeCartItem({ itemId: "a/b" }), undefined);
  assert.throws(() => segment(" "), ApiError);
});
test("non-JSON errors do not leak raw HTML into the UI", async () => {
  globalThis.fetch = (async () =>
    new Response("<html>proxy error</html>", { status: 502 })) as typeof fetch;
  await assert.rejects(
    request("GET", "/test"),
    (error) =>
      error instanceof ApiError &&
      error.status === 502 &&
      !error.message.includes("<html>"),
  );
});
