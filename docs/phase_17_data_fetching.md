# Phase 17: Server-Side Data Fetching

## Objective
Implement a mechanism for server-side data fetching (similar to `getServerSideProps` in Next.js) to supply data to components before they are rendered to HTML.

## Architecture
In a meta-framework, data is often fetched securely on the server (e.g., from a database) and passed directly to the React component. This data must also be serialized and sent to the client so the hydration process matches the server render.

## Implementation Details
1. **Page Data Loading**: 
   - Allow files in `src/pages/` to export an async `getServerSideProps` function.
   - During the SSR Pipeline (Phase 16), the server `await`s this function before calling `renderToString`.
2. **Prop Injection**: Pass the returned data as `props` to the Page component during SSR.
3. **Data Serialization**: 
   - Serialize the fetched data into JSON.
   - Inject it into the HTML document inside a `<script>` tag (e.g., `window.__FULLSTACK_DATA__ = {...}`).
4. **Hydration Syncing**: Modify the Client Entrypoint (Phase 14) to read `window.__FULLSTACK_DATA__` and pass it as initial props during the `hydrateRoot` call, ensuring the client DOM matches the server HTML exactly.
