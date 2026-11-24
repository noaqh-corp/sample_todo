import { describe, it, expect, beforeEach } from "vitest";
import { attachTag } from "../attach-tag/handler";
import { removeTag } from "./handler";
import Container from "../../../../shared/container";
import { TagRepositoryMock } from "../../../../adapter/repository/mock/TagRepository";

describe("removeTag", () => {
beforeEach(() => {
Container.clear();
});

it("付与した絵文字タグを外せる", async () => {
const mock = new TagRepositoryMock();
Container.override("TagRepository", mock);
const tag = await attachTag("user-1", "todo-1", "🚀");
await removeTag("user-1", "todo-1", tag.id);
const relations = await mock.listByTodoIds(["todo-1"], "user-1");
expect(relations.length).toBe(0);
});

it("ユーザーが所有しないタグは外せない", async () => {
Container.override("TagRepository", new TagRepositoryMock());
await expect(removeTag("user-1", "todo-1", "unknown")).rejects.toThrow(
"タグが見つかりません"
);
});
});
