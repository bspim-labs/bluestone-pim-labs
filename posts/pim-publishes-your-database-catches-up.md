---
title: PIM Publishes. Your Database Catches Up.
date: 2026-10-21
description: A product page usually wants your own shape, joined with data PIM does not own. How and where should you maintain that? The solutions are as many as there are developers, but here is an overview of one way to solve this.
tags: papi, integration, publishing
author: Viktor Lövgren
authorUrl: https://github.com/leafleaf90/
heroImage: /public/posts/pim-publishes-your-database-catches-up/banner.webp
---

All data for a real product page rarely lives solely in Bluestone PIM. More often you need **your own projection of it**, joined with data PIM does not own, like stock, a regional price list, or a search index.

PIM is a good place to manage edits, and a painful place to render a page from. What has worked for me is keeping a copy in a database I control, and letting a publication update that copy. The host and the database can be whatever you already run. I use different pairings depending on the requirements, but Vercel and Neon Postgres would be one example.

## Why the frontend should not read PAPI live

PAPI hands you the published product in Bluestone's own shape, but the page usually wants something tailored: a clean slug, a spec table in an order you chose, or values you calculated on the way in. Rather than doing that work on every request, you run the transform once when the publication arrives, store the result, and let the page read your row.

When you then add your second and third (and beyond) frontend, it makes this even more pertinent. A website, a partner catalogue, and a product feed do not want the same shape. If each one calls PAPI itself, each one grows its own transform, and an attribute rename has to be taught three times. One copy, updated when someone publishes, is what those front ends should read from.

The other half is data that never lived in PIM at all. Your price, your stock, a warehouse feed. In practice those join cleanly once the product copy sits in the same database. If the frontend reads PAPI live, it still has to call those other sources and stitch them together against a payload you do not control.

Here is where an admin rename hurts if you skipped the copy. When someone renames an attribute in PIM, that new name lands in one transform, and I would rather fix the job than teach every client what it is called now.

## What a PAPI sync is

Saving a product in the PIM UI or via the Bluestone PIM Management API does not update your external database, at least if this is for downstream systems. Someone has to publish the PIM changes, and that publication is what Bluestone PIM calls a sync. At that point, the working-state data gets published and accessible via the Public API. If you have subscribed to the webhook, Bluestone sends an event with the sync id. The poll later in this post is what notices the publication when that subscription is not there.

The "New sync done" webhook even carries the sync id, and your application then asks PAPI what changed. Each returned row is a product id plus `ADD`, `CHANGE`, or `DELETE`.

## How a publication becomes rows

You will want two ways to notice a sync, and one function that applies it. I call the table `pim_syncs`. Both paths insert a row, then call the same processor, so seeing the same sync twice does nothing the second time.

```
Editor publishes in PIM
        │
        ├─ Bluestone calls your webhook  ──┐
        │                                   ├─ insert pim_syncs (pending)
        └─ Scheduled job lists closed syncs ┘
                                            │
                                            ▼
                         one worker per sync id
                                            │
              GET diffs → POST products by id → upsert your copy
              DELETE → mark your row discontinued
```

Webhooks are the fast path. When Bluestone hits your endpoint, something like `POST /api/hooks/pim`, verify the signature, insert the `pim_syncs` row as `pending`, and return `200`. That is the accept. Fetching and applying products happens after the response. On this host that continuation is `waitUntil`. [Bluestone's delivery guide](https://docs.api.bluestonepim.com/docs/webhook-events-and-delivery) says to return a successful 2xx only after the message is safely accepted, with the signature checked and the payload stored or queued, and to answer quickly.

A handler that tries to apply 400 products before it answers has not accepted the message. Whether Bluestone delivers it again depends on the status you return:

| Your response | What Bluestone does |
|---|---|
| 2xx | Success. Delivery stops. |
| 401 or 403 | No retry. Use these for a permanent authentication or authorization failure, such as a bad signature. |
| 429 or 503 | Retry after the `Retry-After` header. If that header is missing, no retry. |
| Any other non-success status, such as 500 | Two retries, ten minutes apart. |

Enough failed deliveries can block the webhook for a while. The threshold and the block duration vary by environment. Retries reuse `x-bs-notification`, so a delivery you have already stored should get `200` again and stop. The sync id insert no-ops, so the same publication is not applied twice.

If the host kills that work after the `200`, the row should still be sitting there as `pending`, or stuck in `processing`. That is what the poll is for.

The poll is a scheduled read, not a full catalogue reload. Every 30 minutes is a sane cadence: short enough that you are likely to beat diff retention, and long enough that you will not notice it when the webhook is healthy. It does two things.

First it discovers. You read the newest sync time you have stored and ask PAPI for `CLOSED` syncs created after that. If the table is empty, look back 24 hours. New ids go in as `pending`. If the context is one you do not serve, store it as `skipped` so you stop discovering it.

Then it drains. Anything `pending` gets processed, and so does anything that has been `processing` for more than five minutes, because five minutes means the last attempt died. Leave `error` rows alone until a person retries them. A retry sets the row back to `pending` and runs the publication again from the start.

Most polls find nothing, and that is the job working. The poll exists for the delivery your webhook handler did not finish.

You also want one worker per sync. On Postgres, an advisory lock keyed by the sync id is enough, held until the job finishes or gives up. If the lock is already taken, skip. The webhook and the poll will both see a busy minute, and only one of them should write products. On another database, a row lock or a lease follows the same rule.

In practice the processor is dull, which is what you want:

1. `GET /syncs/{id}`. Defer if the state is not ready. Stop on `CANCELLED`. A 404 means PAPI has already thrown the sync away.
2. Page through `GET /differences/sync/{id}/products`. If a product shows up twice, the last operation wins.
3. For `ADD` and `CHANGE`, call `POST /products/by-ids` and upsert your shape.
4. For `DELETE`, mark your row discontinued. There is nothing to fetch.
5. Write `completed` or `error` on the sync row, with counts.

Those steps only apply product diffs. The same sync also lists category, attribute, and relation changes: `GET /differences/sync/{id}/categories`, `GET /differences/sync/{id}/attributes`, and `GET /differences/sync/{id}/relations`. The [help center](https://help.bluestonepim.com/sync-product-information) says catalog structure, attribute definitions, and relations are updated in PAPI when a product is published. If you keep a category tree, read those diffs too. A copy that is only product rows can skip them.

`POST /products/by-ids` is in the OpenAPI. The [help center example](https://help.bluestonepim.com/typical-usage-scenarios) fetches the same products with `POST /products/list` and an `ids` array. Both work.

If one product fails, record that failure on the product and leave the ones you already committed. A publication is a batch of independent upserts, not one sacred transaction.

It is better to store your own shape than the raw PAPI document. The transform is the only place that should know Bluestone's current payload, and your pages read columns you named.

You will want the PIM product id, `Product.id`, as the primary key, because that is the identifier PAPI treats as stable. Item numbers and barcodes live as attribute values. They are handy for search and for matching a spreadsheet, and they are a bad primary key, because PIM will happily contain two products with the same code. If your app needs one of those codes to be unique, enforce it in your database and flag the collision, then let the rest of the publication land.

Images and video can stay on `media.bluestonepim.com`, with the URLs stored on your row. Otherwise you are running an asset pipeline just to hold bytes Bluestone is already serving.

## The only webhook event this needs

The event to subscribe to is **New sync done**, and the payload type is `PRODUCT_SYNC_DONE`. Other events exist, and they do not belong in this processor. A category change or an asset change is a different contract. If you route one of those through the sync-id path, you will apply the wrong thing, or nothing, with great confidence.

| Header | What you do with it |
|---|---|
| `x-bs-signature` | `sha256=` plus HMAC-SHA256 of the raw body, using the webhook secret. Verify this before you parse JSON. |
| `x-bs-notification` | Delivery id. Retries reuse it. If you have already stored it, return `200` and stop. |
| `x-bs-event` | A hint. Decide from `events[].changes.eventType`. |

You will want to reject a missing secret, a bad signature, and a body that is not JSON, and compare the signature in constant time. If you parse the JSON, re-serialize it, and hash that, the signature will not match, and you will think Bluestone is sending garbage. They are sending bytes. Hash the bytes.

`events` is an array, and one delivery can carry more than one. For `PRODUCT_SYNC_DONE`, the sync id is `events[].changes.syncDoneData.value` when `syncDoneData.field` is `PAPI_SYNC_ID`. `entityIds` is empty, so do not get clever and treat it as a product list. `syncDoneData.context` is the language context. Contexts you do not serve can be recorded as `skipped`.

```json
{
  "timestamp": 1776829908820,
  "events": [
    {
      "changes": {
        "eventType": "PRODUCT_SYNC_DONE",
        "entityIds": [],
        "syncDoneData": {
          "field": "PAPI_SYNC_ID",
          "value": "69e845ce2f03537a6cf6be9a",
          "context": "en"
        }
      }
    }
  ]
}
```

The insert should be `pending`, and it should do nothing if that sync id already exists, because the poll may have written it first. Then you start the processor.

## The PAPI calls, in the order you will actually make them

The base URL is `https://api.bluestonepim.com/v1/`. You send `x-api-key` and a `context` header for the context you serve. The docs are at [docs.api.bluestonepim.com](https://docs.api.bluestonepim.com).

| Call | Why you make it |
|---|---|
| `GET /syncs/{id}` | State and context, when the webhook arrives and again when processing starts. Any 2xx with a JSON body is the record. I have seen this succeed as 201. |
| `GET /syncs` | Poll discovery. `createdAfter` is epoch milliseconds, `publishStates=CLOSED`, `itemsOnPage` capped at 50, `pageNo` from 0. |
| `GET /differences/sync/{id}/products` | The product change list. `pageNo` from 0. Category, attribute, and relation diffs are separate calls on the same sync id. |
| `POST /products/by-ids` | The documents for adds and changes. Batch them. The help center example is `POST /products/list` with an `ids` array. Both work. |

A first load, or a repair after a sync that 404'd, is `POST /products/list` with whatever filter selects your catalogue, again with `pageNo` from 0. That is a run you start on purpose. It is separate from the webhook and from the poll.

You do not need the Management API to receive publications. You reach for it when you also read or edit attribute definitions. That API is `https://api.bluestonepim.com/pim`, and it wants a service token from `POST https://idp.bluestonepim.com/op/token`. The PAPI key will not open it.

## One way to host it

The flow above does not care where it runs. Vercel with Neon Postgres is a convenient pair for a smaller app, when you want a quick setup and do not care to optimize every part or roll the infrastructure yourself. You can put the same jobs on another platform and another database.

On Neon I use two connection strings. The pooled URL is for page reads, and the direct URL is for the publication job, because that job holds a Postgres advisory lock across a lot of statements. A pooled HTTP call does not keep one session for the whole job. If your database cannot do that, hold the lock on a connection that outlives a single query.

Vercel functions in this setup are allowed 300 seconds, and a fat publication can still die halfway. `waitUntil` keeps working after the webhook returns `200`, which is also how you find out your host has opinions about how long "after" is allowed to be. Treat the poll as the plan. A host that promises to finish the work after the response will still cut it off.

Vercel Cron is what hits the poll route here. Any scheduler can do the same job.

## FAQ

### Can I just fetch the product from PAPI in the page component?

You can, for a demo that only shows PIM attributes. The moment the page needs your own shape, or a join with price, stock, or some other feed, you are assembling that in the browser on top of a payload you do not own. It is worth building the copy on purpose.

### What if Bluestone retries the webhook?

A 2xx stops delivery. 401 and 403 are not retried. 429 and 503 are retried only when you send `Retry-After`. Any other non-success status is retried twice, ten minutes apart. You will see the same `x-bs-notification` and the same sync id. Return `200` if you have already stored the delivery, and let the insert on sync id no-op.

### The diff endpoint returned 404. Is the pipeline broken?

Maybe the sync was garbage-collected. PAPI will not reconstruct a diff it has thrown away, so the recovery is a full `POST /products/list` for the catalogue you keep, and a tighter poll if this keeps happening. Also check the boring failure first: did anyone publish?

## If a product is missing

Before you tail a log, check whether the product was published. PAPI will not show editor state, and this pipeline will not invent it.

If it was published and your database is still old, you have a sync id to find: a webhook row, a poll row, or a 404 that means you were late. That is a smaller debugging surface than a frontend that sometimes calls Bluestone.
