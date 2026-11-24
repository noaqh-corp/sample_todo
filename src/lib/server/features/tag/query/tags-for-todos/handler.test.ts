import { describe, it, expect, beforeEach } from "vitest";
import { attachTag } from "../../command/attach-tag/handler";
import { getTagsForTodos } from "./handler";
import Container from "../../../../shared/container";
import { TagRepositoryMock } from "../../../../adapter/repository/mock/TagRepository";

describe("getTagsForTodos", () => {
beforeEach(() => {
Container.clear();
});

it("Todoごとに付与されたタグ（絵文字含む）を取得できる", async () => {
Container.override("TagRepository", new TagRepositoryMock());
await attachTag("user-1", "todo-1", "🔥");
await attachTag("user-1", "todo-1", "仕事");
await attachTag("user-1", "todo-2", "🌊");

const result = await getTagsForTodos("user-1", ["todo-1", "todo-2"]);
expect(result["todo-1"].map((t) => t.name)).toEqual(["🔥", "仕事"]);
expect(result["todo-2"].map((t) => t.name)).toEqual(["🌊"]);
});

it("他ユーザーのタグは取得されない", async () => {
Container.override("TagRepository", new TagRepositoryMock());
await attachTag("user-2", "todo-1", "others");
const result = await getTagsForTodos("user-1", ["todo-1"]);
expect(result["todo-1"]).toBeUndefined();
});

it("todoIdsが空なら空オブジェクト", async () => {
Container.override("TagRepository", new TagRepositoryMock());
expect(await getTagsForTodos("user-1", [])).toEqual({});
});
});
