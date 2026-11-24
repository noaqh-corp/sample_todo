import { describe, it, expect, beforeEach } from "vitest";
import { attachTag } from "./handler";
import Container from "../../../../shared/container";
import { TagRepositoryMock } from "../../../../adapter/repository/mock/TagRepository";

describe("attachTag", () => {
beforeEach(() => {
Container.clear();
});

it("通常のタグ名でタグを作成して付与できる", async () => {
Container.override("TagRepository", new TagRepositoryMock());
const tag = await attachTag("user-1", "todo-1", "仕事");
expect(tag.name).toBe("仕事");
});

it("絵文字を含むタグ名でタグを作成できる", async () => {
Container.override("TagRepository", new TagRepositoryMock());
const tag = await attachTag("user-1", "todo-1", "🔥重要");
expect(tag.name).toBe("🔥重要");
});

it("サロゲートペアの絵文字タグ名が壊れずに保存される", async () => {
Container.override("TagRepository", new TagRepositoryMock());
const tag = await attachTag("user-1", "todo-1", "😊🍀🎉");
const repo = Container.getTagRepository();
const relations = await repo.listByTodoIds(["todo-1"], "user-1");
expect(relations.length).toBe(1);
expect(relations[0].tag.name).toBe("😊🍀🎉");
// サロゲートペアを含むこと（絵文字はlength>1のコードユニット構成）
expect("😊".length).toBe(2);
});

it("ZWJシーケンス・肌色バリエーションの絵文字タグ名を扱える", async () => {
Container.override("TagRepository", new TagRepositoryMock());
const family = "👨‍👩‍👧‍👦 家族";
const wave = "👋🏻 挨拶";
const t1 = await attachTag("user-1", "todo-1", family);
const t2 = await attachTag("user-1", "todo-2", wave);
expect(t1.name).toBe(family);
expect(t2.name).toBe(wave);
});

it("同じ名前のタグは再利用される", async () => {
Container.override("TagRepository", new TagRepositoryMock());
const t1 = await attachTag("user-1", "todo-1", "🌟");
const t2 = await attachTag("user-1", "todo-2", "🌟");
expect(t1.id).toBe(t2.id);
});

it("空のタグ名はエラー", async () => {
Container.override("TagRepository", new TagRepositoryMock());
await expect(attachTag("user-1", "todo-1", "  ")).rejects.toThrow("タグ名は必須です");
});

it("絵文字を含む33文字のタグ名はエラー、32文字以内ならOK", async () => {
Container.override("TagRepository", new TagRepositoryMock());
const long32 = "🌟".repeat(32);
const long33 = "🌟".repeat(33);
// [...str].length で数えるため33個の絵文字は33文字
await expect(attachTag("user-1", "todo-1", long33)).rejects.toThrow();
const tag = await attachTag("user-1", "todo-1", long32);
expect(tag.name).toBe(long32);
});
});
