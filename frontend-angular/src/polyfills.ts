// Browser polyfills required by SockJS/transitive dependencies.
const browserGlobal = window as unknown as {
  global?: unknown;
  process?: { env: Record<string, string> };
};

browserGlobal.global = browserGlobal;
browserGlobal.process = browserGlobal.process ?? { env: {} };

