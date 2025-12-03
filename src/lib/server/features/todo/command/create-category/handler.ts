import Container from "../../../../shared/container";
import type { Category } from "../../types";

export async function createCategory(
  userId: string,
  name: string,
  color: string
): Promise<Category> {
  if (!name || name.trim() === "") {
    throw new Error("カテゴリ名は必須です");
  }

  if (!color || color.trim() === "") {
    throw new Error("カラーは必須です");
  }

  const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
  if (!hexColorRegex.test(color)) {
    throw new Error("カラーは有効なHEXカラーコードである必要があります");
  }

  const repository = Container.getCategoryRepository();
  return await repository.create(userId, name.trim(), color.trim());
}
