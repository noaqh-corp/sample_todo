import Container from "../../../../shared/container";
import type { Category } from "../../types";

export async function listCategories(userId: string): Promise<Category[]> {
  if (!userId) {
    return [];
  }

  const repository = Container.getCategoryRepository();
  const result = await repository.search(userId);
  return result.items;
}
