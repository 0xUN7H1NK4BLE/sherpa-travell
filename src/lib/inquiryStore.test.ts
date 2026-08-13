import { test } from "node:test";
import assert from "node:assert/strict";
import { insertInquiry, listInquiries, updateInquiryStatus } from "./inquiryStore";

test("insertInquiry persists and listInquiries returns it newest-first", async () => {
  const created = await insertInquiry({ name: "Test User", email: "test@example.com", trek: "everest-base-camp" });
  assert.equal(created.name, "Test User");
  assert.equal(created.status, "new");

  const all = await listInquiries();
  assert.equal(all[0]?.id, created.id);
});

test("updateInquiryStatus updates status and returns the row", async () => {
  const created = await insertInquiry({ name: "Status Test", email: "status@example.com" });
  const updated = await updateInquiryStatus(created.id, "contacted");
  assert.equal(updated?.status, "contacted");
});

test("updateInquiryStatus returns null for missing id", async () => {
  const result = await updateInquiryStatus(999999, "closed");
  assert.equal(result, null);
});
