import { beforeEach, describe, expect, it } from "vitest";
import type { TodoRepository } from "../src/lib/server/port/repository/TodoRepository";

export function repositoryContract(
  name: string,
  setup: () => Promise<{ repository: TodoRepository; ownerId: string; otherId: string }>,
): void {
  describe(name, () => {
    let repository: TodoRepository;
    let ownerId: string;
    let otherId: string;
    beforeEach(async () => {
      ({ repository, ownerId, otherId } = await setup());
    });

    it("作成・取得・更新・削除が永続状態に反映される", async () => {
      const todo = await repository.create({ userId: ownerId, title: "仕様を書く", completed: false });
      expect(await repository.find({ id: todo.id, userId: ownerId })).toEqual(todo);
      expect(await repository.update({ id: todo.id, userId: ownerId }, { completed: true })).toBe(true);
      expect((await repository.find({ id: todo.id, userId: ownerId }))?.completed).toBe(true);
      expect(await repository.delete({ id: todo.id, userId: ownerId })).toBe(true);
      expect(await repository.find({ id: todo.id, userId: ownerId })).toBeNull();
    });

    it("他人の Todo は一覧・取得・更新・削除のすべてで隔離される", async () => {
      const todo = await repository.create({ userId: ownerId, title: "所有者のTodo", completed: false });
      expect(await repository.search({ userId: otherId })).toEqual([]);
      expect(await repository.find({ id: todo.id, userId: otherId })).toBeNull();
      expect(await repository.update({ id: todo.id, userId: otherId }, { title: "改変" })).toBe(false);
      expect(await repository.delete({ id: todo.id, userId: otherId })).toBe(false);
      expect(await repository.find({ id: todo.id, userId: ownerId })).toEqual(todo);
    });

    it("存在しない Todo の変更は false を返す", async () => {
      expect(await repository.update({ id: "missing", userId: ownerId }, { completed: true })).toBe(false);
      expect(await repository.delete({ id: "missing", userId: ownerId })).toBe(false);
    });

    it("呼び出し側が指定したソートとページ範囲を適用する", async () => {
      for (const title of ["a", "b", "c"]) {
        await repository.create({ userId: ownerId, title, completed: false });
      }
      const asc = await repository.search({ userId: ownerId }, { orderBy: { createdAt: "asc", id: "asc" } });
      const desc = await repository.search({ userId: ownerId }, { orderBy: { createdAt: "desc", id: "desc" } });
      expect(desc.map((todo) => todo.id)).toEqual(asc.map((todo) => todo.id).reverse());
      const page = await repository.search({ userId: ownerId }, {
        orderBy: { createdAt: "asc", id: "asc" }, limit: 1, offset: 1,
      });
      expect(page.map((todo) => todo.id)).toEqual([asc[1].id]);
    });

    it("返却値の変更が保存済みデータを書き換えない", async () => {
      const todo = await repository.create({ userId: ownerId, title: "original", completed: false });
      todo.title = "changed outside repository";
      const loaded = await repository.find({ id: todo.id, userId: ownerId });
      expect(loaded?.title).toBe("original");
    });
  });
}
