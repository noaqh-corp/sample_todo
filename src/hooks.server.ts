import { auth } from "$lib/server/auth";
import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
  if (import.meta.env.BUILDING) {
    return resolve(event);
  }

  // better-authのAPIルートを処理
  const authPath = "/api/auth";
  if (event.url.pathname.startsWith(authPath)) {
    const response = await auth.handler(event.request);
    return response || resolve(event);
  }

  // サーバーサイドでセッションを取得
  try {
    const response = await auth.api.getSession({
      headers: event.request.headers,
    });
    // better-authのgetSessionは { data: Session } 形式で返す
    event.locals.session = response?.session || null;
  } catch (error) {
    // セッション取得に失敗した場合はnullを設定
    event.locals.session = null;
  }

  return resolve(event);
};
