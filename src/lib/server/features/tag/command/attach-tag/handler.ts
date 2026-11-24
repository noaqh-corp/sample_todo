import Container from "../../../../shared/container";
import { validateTagName } from "../../types";
import type { Tag } from "../../types";

/**
 * タグを付与する（存在しない場合は作成する）。
 * タグ名は絵文字を含む任意のUnicode文字列を許容する。
 */
export async function attachTag(
userId: string,
todoId: string,
name: string
): Promise<Tag> {
const validation = validateTagName(name);
if (!validation.valid) {
throw new Error(validation.error);
}

const repository = Container.getTagRepository();
const trimmed = name.trim();

let tag = await repository.findByName(userId, trimmed);
if (!tag) {
tag = await repository.create(userId, trimmed);
}

await repository.attach(todoId, tag.id);
return tag;
}
