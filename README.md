# http support in TypeScript

This is an experiment to add native http:// support to TypeScript.  When the resolver is asked to resolve an http(s):// module,
we can download it to a cache and resolve to the path in cache.  TypeScript should be able to read and typecheck against this
file in cache.

TypeScript's APIs are all synchronous, but we can use node worker_threads to do asynchronous things behind a synchronous facade.
So even though TypeScript expects the resolver to return synchronously, we can use a worker thread to download remote HTTP
assets into cache.
