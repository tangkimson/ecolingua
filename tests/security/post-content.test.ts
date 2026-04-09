import assert from "node:assert/strict";
import test from "node:test";

import { normalizePostContent } from "@/lib/post-content";

test("removes script tags and event handlers", () => {
  const dirty = `<p onclick="alert(1)">Hello</p><script>alert("xss")</script>`;
  const cleaned = normalizePostContent(dirty);
  assert.match(cleaned, /<p>Hello<\/p>/);
  assert.doesNotMatch(cleaned, /script/i);
  assert.doesNotMatch(cleaned, /onclick=/i);
});

test("rejects javascript href payloads", () => {
  const dirty = `<a href="javascript:alert(1)" target="_blank">Click me</a>`;
  const cleaned = normalizePostContent(dirty);
  assert.doesNotMatch(cleaned, /javascript:/i);
  assert.match(cleaned, /<a[^>]*>Click me<\/a>/);
});

test("keeps safe links and adds rel on target blank", () => {
  const dirty = `<a href="https://example.com" target="_blank">Example</a>`;
  const cleaned = normalizePostContent(dirty);
  assert.match(cleaned, /href="https:\/\/example\.com"/);
  assert.match(cleaned, /target="_blank"/);
  assert.match(cleaned, /rel="noopener noreferrer nofollow"/);
});

test("escapes plain text input", () => {
  const cleaned = normalizePostContent(`Hello <img src=x onerror=alert(1)>`);
  assert.match(cleaned, /<img src="x" \/>/);
  assert.doesNotMatch(cleaned, /onerror=/i);
});
