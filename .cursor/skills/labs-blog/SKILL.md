---
name: labs-blog
description: >-
  Draft and revise Bluestone PIM Labs blog posts in a peer voice: specific,
  direct, and technically careful without lecturing. Use when writing or
  editing posts/*.md, a Labs blog, a dev-log post, or when the user asks to
  match the Labs tone.
---

# Labs blog

Write as a senior developer talking to a peer. Use "you". First person is fine when it is something you actually did. Open on the problem or the conclusion. Do not open with a product tour, a disclaimer stack, or "in this post we will".

Instructions only. No scripts.

## Voice

- Mix short sentences with longer ones. Read it out loud. A run of 6 to 10 word sentences feels generated.
- Connect the turn. "In practice", "rather than", "here is where that hurts" are enough. Do not jump fact, fact, fact.
- Prefer "you will want" and "what has worked" over bare orders ("Store the URLs.", "Do that transform.").
- One joke in the whole post, and only if it is a real mistake. Then move on.
- No em dashes. Commas, periods, or a new sentence.

Skip these words: seamless, leverage, unlock, empower, robust, streamline, best-in-class, excited to announce.

## What made this voice, and what to cut

State the useful consequence. Do not tour the machinery.

| Cut | Write instead |
|---|---|
| Calling Bluestone costs a round trip, or PIM is slow | The page wants your own shape, joined with data PIM does not own (price, stock, another feed) |
| "Bluestone calls these attributes, not fields." | Say attribute when an admin renames one. Do not stop to define the word |
| A list of every sync state | The trap: waiting for `CLOSED` while the diff is already valid at `PUBLISH` |
| "I keep saying that, because the payload looks like it might." | Name the event. "`PRODUCT_SYNC_DONE` does not list products. It carries the sync id." |
| Diff retention, `pageNo` anecdotes, "I lost an afternoon" | Leave them out of the narrative. `pageNo` from 0 belongs in the call list, if you have one |

A negative claim needs a scope. "The webhook does not list products" is too wide. "The New sync done webhook, `PRODUCT_SYNC_DONE`, does not list products" is the claim.

An example host (Vercel, Neon, or anything else) comes after the idea. Say it is one way you have run it. Do not make the opening a stack pitch.

## Shape of a post

File: `posts/slug.md` in the Labs repo. Frontmatter: `title`, `date`, `description` (one sentence), `tags` (2 to 4), `author`, `authorUrl`. Optional `heroImage` as WebP under `public/posts/slug/banner.webp`. Then `npm run build`.

- Headings say what the section decides, not "Background" or "Architecture".
- The first half teaches the pattern. The specific host is the second half.
- A diagram if more than two systems interact. Real names on the boxes.
- FAQ only for questions a reader actually hits. Three or four, no more.
- End on what to check next. Do not recap the post.

## Before you finish

- [ ] The first two sentences state a problem or a conclusion.
- [ ] A paragraph is not a stack of equal-length sentences.
- [ ] Imperatives are comments, not a command list, except a real procedure (headers, calls).
- [ ] No glossary aside, no cost-of-calling-Bluestone framing, no state-machine tour.
- [ ] Each "does not" says which event, call, or case.
