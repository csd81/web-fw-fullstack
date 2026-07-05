# Phase 16: The Dev Server & SSR Pipeline

## Objective
Build the core **fullstack.js** server runtime that intercepts HTTP requests, server-side renders the React application, and serves the interactive client bundle.

## Architecture
The server is the orchestrator of the meta-framework. It marries the File-System Router, the Server React Engine, and the Client Bundle into a seamless request/response cycle.

## Implementation Details
1. **HTTP Server**: Initialize a Bun HTTP server (`src/framework/server.ts`).
2. **Request Handling**: 
   - On incoming requests, match the URL against the Route Manifest (from Phase 15).
   - Load the corresponding Page component.
3. **SSR Injection**: 
   - Render the Page to an HTML string using our custom `renderToString`.
   - Wrap the string in a standard HTML document (`<!DOCTYPE html><html>...</html>`).
   - Critically, inject a `<script src="/_fullstack/client.js"></script>` tag pointing to the client bundle generated in Phase 14.
4. **Static Asset Serving**: Configure the server to serve the compiled client-side JavaScript and CSS assets.
