export type Tag = {
	id: string;
	userId: string;
	name: string;
	createdAt: Date;
	updatedAt: Date;
};

/** タグ名の最大長（絵文字のサロゲートペア等も1文字として数える） */
export const TAG_NAME_MAX_LENGTH = 32;

/**
 * タグ名をバリデーションする。
 * 絵文字（サロゲートペア・ZWJシーケンス・肌色バリエーション等）も
 * コードポイント単位で正しく1文字として扱う。
 */
export function validateTagName(name: string): { valid: boolean; error?: string } {
	const trimmed = name.trim();
	if (!trimmed) {
		return { valid: false, error: "タグ名は必須です" };
	}
	// [...str] はコードポイント単位で分割するため絵文字を含んでも壊れない
	const length = [...trimmed].length;
	if (length > TAG_NAME_MAX_LENGTH) {
		return {
			valid: false,
			error: `タグ名は${TAG_NAME_MAX_LENGTH}文字以内にしてください`,
		};
	}
	return { valid: true };
}
