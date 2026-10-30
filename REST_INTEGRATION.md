# REST queries, mutations, fragments and hooks

This update integrates a REST data layer into the supplied frontend. It preserves the existing design and screens, installs a TanStack Query provider in `src/main.tsx`, and adds an example product catalogue at `/catalogue`.

## Start

```bash
nvm install
nvm use
npm install --global yarn@1.22.22
yarn install
```

Add this entry to your local `.env`:

```env
VITE_API_BASE_URL=http://localhost:1337/api/v1
```

The base URL includes the backend router mount. All operation paths are relative to it. Configure backend CORS to allow `http://localhost:3000` (the existing Vite port).

```bash
yarn develop
```

Open `http://localhost:3000/catalogue` to see a component using the REST queries, enquiry mutation and fragments. It displays loading, empty and error states; it does not substitute demo data when the API fails. The existing `/shop` screen is preserved.

`VITE_APP_API_HOST` remains the separate host used by existing legacy authentication and GraphQL screens. A Google client ID is only needed when using the existing Google sign-in feature; its absence no longer blocks the whole app at startup.

## REST and GraphQL

GraphQL query documents and GraphQL fragments require a GraphQL endpoint. The newly added queries and mutations are TypeScript functions calling your REST endpoints, and their hooks use TanStack Query. The new fragments are reusable local selectors; they do not reduce server response fields.

Existing `src/graphql`, `src/generated/graphql.tsx`, ApolloProvider, and Apollo consumers remain in place because the supplied rental, support, reviews, account and admin screens still import them. Adding this REST layer does not convert those screens automatically. The old auth service also still calls older login, OTP, Google and password-reset routes, which differ from the `/auth/login` contract in the supplied API archive. Their migration needs the corresponding backend contracts; no unsupported endpoints have been fabricated.

## Structure

```text
src/
  queries/index.ts        # Public exports for REST GET functions
  mutations/index.ts     # Public exports for REST write functions
  fragments/index.ts     # Public exports for local field selectors
  hooks/index.ts         # Existing UI hooks plus REST hooks
  rest/
    api/client.ts        # Fetch, base URL, errors, AbortSignal, envelopes
    api/session.ts       # REST sessions and existing token compatibility
    queries/             # GET functions grouped by resource
    mutations/           # POST/PATCH/DELETE functions grouped by resource
    fragments/index.ts   # Product, user, order, file selectors
    hooks/               # React hooks, caching and invalidation
    types/               # Input, response and model wire types
    providers/           # QueryClient lifecycle
  components/rest/ProductCatalogue.tsx
  pages/catalogue/index.tsx
```

`REST_ENDPOINTS.md` lists 61 operations across 17 modules: auth, users, roles, products, variants, brands, categories, inventory, carts, orders, payments, returns, shipments, files, enquiries, notifications and audit. Browser-facing webhooks are deliberately excluded; payment providers call the server directly.

## Query

```tsx
import { useProducts, useProduct } from '../hooks';
import { productCardFragment } from '../fragments';

// Call hooks at the top level of a component.
const products = useProducts({
  params: { page: 1, limit: 12, status: 'ACTIVE', search: 'Samsung' },
});
const cards = products.data?.items.map(productCardFragment);
const product = useProduct({ id: productId }, { enabled: Boolean(productId) });
```

Queries expose `data`, `isPending`, `isFetching`, `error` and `refetch`. List endpoints keep `{ items, pagination }` where the backend supplies it. Each cache key includes the resource, operation and arguments. Hooks requiring an ID accept a nonempty ID; for a not-yet-selected resource, pass `''` and disable the hook.

Low-level functions are available for event handlers or non-React callers:

```ts
import { getProducts } from '../queries';
const result = await getProducts({ params: { page: 1 } }, abortController.signal);
```

## Mutations

```tsx
import { useCreateProduct, useUpdateProduct, useArchiveProduct, useAddCartItem } from '../hooks';

const create = useCreateProduct();
const update = useUpdateProduct();
const archive = useArchiveProduct();
const addItem = useAddCartItem();

// Within a submit/click handler:
await create.mutateAsync({ body: { name: 'Phone', brandId, categoryId } });
await update.mutateAsync({ id: productId, body: { status: 'ACTIVE' } });
await archive.mutateAsync({ id: productId });
await addItem.mutateAsync({ body: { variantId, quantity: 1 } });
```

Successful mutations invalidate relevant data, including product availability after inventory/order changes. Mutations are not automatically retried, which avoids automatic duplicate checkout/refund submissions. GET queries retry transient errors at most twice and never retry HTTP 4xx errors.

## Authentication integration

The REST client reads a REST session first, then the existing `MFS_PORTAL` session-storage token, then the remembered local-storage token. This fixes the previous helper's local-storage-only lookup. Existing sign-out clears the REST cache and REST session. A REST 401 clears stored credentials and notifies the existing AuthProvider.

The new REST login and logout hooks call `/auth/login` and `/auth/logout`:

```tsx
import { useLogin, useMe, useLogout, useRestSession } from '../hooks';

const login = useLogin();
const logout = useLogout();
const session = useRestSession();
const me = useMe({ enabled: session.isAuthenticated });

// In a handler:
await login.mutateAsync({ body: { email, password } });
// At sign-out:
await logout.mutateAsync();
```

REST login stores the full REST session (including `expiresAt`) in session storage, clears the old query cache and updates REST session subscribers. The old `useAuthContext()` and its GraphQL `User | AdminUser` shape remain a separate legacy UI contract; the new login hook does not pretend its REST user has the old GraphQL fields. Use `useRestSession` and `useMe` for new REST screens. Existing login pages still use the old AuthService until explicitly migrated. Avoid signing into two different accounts through legacy and REST forms at the same time.

Protected query hooks should be gated with `{ enabled: session.isAuthenticated }`. The backend enforces permissions. Tokens are never put in query keys or URLs. Only requests to the configured API base URL receive Bearer authentication; signed storage URLs must be uploaded to directly without the application's Bearer token.

## Files and enquiries

```tsx
const upload = useUploadFile();
const enquiry = useCreateProductEnquiry();

await upload.mutateAsync({ body: { file, purpose: 'PRODUCT_IMAGE' } });
const result = await enquiry.mutateAsync({ body: { productId, variantId } });
// Display result.whatsappUrl as a link for the customer to open.
```

Multipart upload uses `file` and `purpose`; the browser sets its boundary. Signed-upload, completion, download-link and delete hooks are also included. Signed-upload initialization alone does not transfer bytes: PUT the actual file to `signedUrl`, then complete the upload with `fileUpload.id`.

The supplied file controllers use `{ success, file }` and top-level signed URL fields rather than `{ success, data }`; the client handles those wrappers explicitly. Decimal/date wire values remain serialized. Reusable model types make endpoint-dependent fields optional rather than claiming every endpoint includes every database field or relation.

The API archive currently disables `/payments/checkout` with `PAYMENTS_DISABLED`. The matching mutation preserves that error and has no invented success contract. The enquiry flow prepares a WhatsApp URL, but never sends messages itself.

## Backend alignment

The supplied API snapshot accepts numeric IDs for users/files in some places; your newer MySQL Prisma schema uses UUIDs. Frontend wire IDs preserve strings or numbers, but the numeric-only backend validators must be updated for UUIDs. Its file service also mentions DigitalOcean while your new schema specifies Supabase; storage-provider changes belong in the backend.

## Verification

```bash
yarn typecheck:rest
yarn test:rest
yarn build:bundle
yarn typecheck
```

The first command checks the new REST layer and reusable catalogue component. `build:bundle` runs Vite's production bundler. Full `typecheck` checks both the application and Vite/codegen configuration. The default `build` keeps the full typecheck gate; it does not silently hide legacy errors.

See `REST_VALIDATION.md` for the actual validation results and the comparison with the original upload. Tests mock the HTTP boundary; no live server credentials were supplied.
