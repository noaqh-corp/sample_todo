import Container from "../../../../shared/container";
import type { Category } from "../../types";

export async function updateCategory(
  id: string,
  userId: string,
  data: { name?: string; color?: string }
): Promise<Category> {
  if (!id) {
    throw new Error("カテゴリIDは必須です");
  }

  const repository = Container.getCategoryRepository();
  const existing = await repository.get(id, userId);

  if (!existing) {
    throw new Error("カテゴリが見つかりません");
  }

  const updateData: { name?: string; color?: string } = {};

  if (data.name !== undefined) {
    if (data.name.trim() === "") {
      throw new Error("カテゴリ名は必須です");
    }
    updateData.name = data.name.trim();
  }

  if (data.color !== undefined) {
    if (data.color.trim() === "") {
      throw new Error("カラーは必須です");
    }
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (!hexColorRegex.test(data.color)) {
      throw new Error("カラーは有効なHEXカラーコードである必要があります");
    }
    updateData.color = data.color.trim();
  }

  return await repository.update(id, userId, updateData);
}
