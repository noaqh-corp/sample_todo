/**
 * 実行中のアプリを実 HTTP で検証する（依存追加・DB 直接操作なし）。
 * bun docs/plans/rename-todo/http-smoke.ts
 * RENAME_ENABLED=1 bun docs/plans/rename-todo/http-smoke.ts
 * BASE_URL の既定値は http://localhost:5007。
 * 毎回2人の検証ユーザーを登録するため、隔離した検証DBで実行する。
 * 作成したTodoは終了時に削除する。検証ユーザーはDBに残る。
 */

const baseUrl = new URL(process.env.BASE_URL ?? "http://localhost:5007");
const renameEnabled = process.env.RENAME_ENABLED === "1";
const runId = crypto.randomUUID();
let checks = 0;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
  checks += 1;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function decodeHtml(value: string): string {
  return value.replace(/&(?:amp|quot|apos|lt|gt|#\d+|#x[\da-f]+);/gi, (entity) => {
    const named: Record<string, string> = {
      "&amp;": "&", "&quot;": '"', "&apos;": "'", "&lt;": "<", "&gt;": ">",
    };
    if (entity.startsWith("&#")) {
      return String.fromCodePoint(entity[2].toLowerCase() === "x"
        ? Number.parseInt(entity.slice(3, -1), 16)
        : Number.parseInt(entity.slice(2, -1), 10));
    }
    return named[entity.toLowerCase()] ?? entity;
  });
}

function attribute(tag: string, name: string): string | undefined {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i"));
  return match ? decodeHtml(match[1] ?? match[2]) : undefined;
}

type HtmlForm = { action: string; method: string; body: string };

function forms(html: string): HtmlForm[] {
  return [...html.matchAll(/<form\b([^>]*)>([\s\S]*?)<\/form>/gi)].map((match) => ({
    action: attribute(match[1], "action") ?? "",
    method: (attribute(match[1], "method") ?? "GET").toUpperCase(),
    body: match[2],
  }));
}

function inputValue(form: HtmlForm, name: string, hidden = false): string | undefined {
  for (const match of form.body.matchAll(/<input\b[^>]*>/gi)) {
    if (attribute(match[0], "name") === name
      && (!hidden || attribute(match[0], "type") === "hidden")) {
      return attribute(match[0], "value");
    }
  }
  return undefined;
}

function actionForm(html: string, action: string, id?: string): HtmlForm | undefined {
  return forms(html).find((form) => form.action === `?/${action}`
    && form.method === "POST"
    && (id === undefined || inputValue(form, "id", true) === id));
}

function todoIds(html: string): string[] {
  return forms(html).filter((form) => form.action === "?/toggle")
    .map((form) => {
      const id = inputValue(form, "id", true);
      assert(id, "一覧のtoggleフォームにhidden idが存在する");
      return id;
    });
}

function assertTodo(html: string, id: string, title: string, completed: boolean): void {
  const toggle = actionForm(html, "toggle", id);
  assert(toggle, "一覧に対象Todoのtoggleフォームが存在する");
  assert(inputValue(toggle, "completed", true) === String(!completed), "完了状態が永続化される");
  assert(actionForm(html, "delete", id), "一覧に対象Todoのdeleteフォームが存在する");
  if (renameEnabled) {
    const rename = actionForm(html, "rename", id);
    assert(rename, "一覧に対象Todoのrenameフォームが存在する");
    assert(inputValue(rename, "title") === title, "正規化済みタイトルが永続化される");
  } else {
    assert(decodeHtml(html).includes(title), "作成したタイトルがSSR一覧に表示される");
  }
}

class Client {
  private cookies = new Map<string, string>();

  async request(path: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    headers.set("origin", baseUrl.origin);
    if (this.cookies.size) {
      headers.set("cookie", [...this.cookies].map(([name, value]) => `${name}=${value}`).join("; "));
    }
    let response: Response;
    try {
      response = await fetch(new URL(path, baseUrl), {
        ...init, headers, redirect: "manual", signal: AbortSignal.timeout(10_000),
      });
    } catch {
      throw new Error(`${init.method ?? "GET"} ${path}: 接続失敗または10秒タイムアウト`);
    }
    for (const cookie of response.headers.getSetCookie()) {
      const pair = cookie.split(";", 1)[0];
      const separator = pair.indexOf("=");
      if (separator < 0) continue;
      const name = pair.slice(0, separator);
      const value = pair.slice(separator + 1);
      if (!value || /;\s*max-age=0(?:;|$)/i.test(cookie)) this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
    return response;
  }

  async html(path = "/"): Promise<string> {
    const response = await this.request(path);
    assert(response.status === 200, `GET ${path}: HTTP 200（実際: ${response.status}）`);
    assert(response.headers.get("content-type")?.includes("text/html"), `GET ${path}: HTML応答`);
    return response.text();
  }

  async auth(path: string, body: Record<string, string>): Promise<unknown> {
    const response = await this.request(`/api/auth/${path}`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
    });
    assert(response.status === 200, `認証 ${path}: HTTP 200（実際: ${response.status}）`);
    try {
      return await response.json();
    } catch {
      throw new Error(`認証 ${path}: JSON応答ではありません`);
    }
  }

  async action(name: string, values: Record<string, string>, expectedStatus = 200): Promise<void> {
    const response = await this.request(`/?/${name}`, {
      method: "POST",
      headers: { accept: "application/json", "x-sveltekit-action": "true" },
      body: new URLSearchParams(values),
    });
    // SvelteKitのenhance用JSONはfailureもHTTP 200で包み、拒否コードをresult.statusに置く。
    assert(response.status === 200,
      `action ${name}: HTTP 200のaction応答（実際: ${response.status}）`);
    let result: unknown;
    try {
      result = await response.json();
    } catch {
      throw new Error(`action ${name}: JSON応答ではありません`);
    }
    assert(isRecord(result), `action ${name}: action結果が存在する`);
    assert(result.status === expectedStatus, `action ${name}: action結果のstatusが一致する`);
    assert(result.type === (expectedStatus === 200 ? "success" : "failure"),
      `action ${name}: action結果のtypeが一致する`);
  }
}

async function registerAndSignIn(client: Client, suffix: string): Promise<string> {
  const email = `http-smoke-${runId}-${suffix}@example.com`;
  const password = `Smoke-${crypto.randomUUID()}`;
  const result = await client.auth("sign-up/email", { email, password, name: `HTTP smoke ${suffix}` });
  assert(isRecord(result) && isRecord(result.user) && typeof result.user.id === "string",
    "新規登録がユーザーIDを返す");
  const userId = result.user.id;
  assert(actionForm(await client.html(), "create"), "新規登録のCookieで認証済みSSRを取得できる");
  await client.auth("sign-out", {});
  assert(!actionForm(await client.html(), "create"), "sign-out後は未認証表示になる");
  await client.auth("sign-in/email", { email, password });
  const html = await client.html();
  assert(actionForm(html, "create"), "sign-inのCookieで作成フォームが表示される");
  assert(html.includes("Todo一覧"), "認証済みSSRに一覧が表示される");
  assert(todoIds(html).length === 0, "新規ユーザーの一覧は空である");
  return userId;
}

async function main(): Promise<void> {
  assert(["http:", "https:"].includes(baseUrl.protocol) && !baseUrl.username && !baseUrl.password,
    "BASE_URLには資格情報のないHTTP(S) URLを指定する");
  const anonymous = new Client();
  for (const path of ["/register", "/login"]) {
    const html = await anonymous.html(path);
    assert(forms(html).some((form) => /type="email"/.test(form.body)
      && /type="password"/.test(form.body)), `${path}: 認証フォームがSSRされる`);
  }
  const guestHtml = await anonymous.html();
  assert(guestHtml.includes('href="/login"') && guestHtml.includes('href="/register"'),
    "未認証SSRにログイン・登録リンクが存在する");
  assert(!actionForm(guestHtml, "create"), "未認証SSRにTodo作成フォームを表示しない");

  const owner = new Client();
  const other = new Client();
  const cleanup: { client: Client; id: string }[] = [];
  let cleanupFailed = false;
  try {
    const ownerId = await registerAndSignIn(owner, "owner");
    const otherId = await registerAndSignIn(other, "other");
    assert(ownerId !== otherId, "2人の独立したユーザーを作成する");
    const ownerTitle = `Owner Todo ${runId}`;
    const otherTitle = `Other Todo ${runId}`;
    await owner.action("create", { title: ownerTitle });
    const ownerHtml = await owner.html();
    const ownerIds = todoIds(ownerHtml);
    assert(ownerIds.length === 1, "作成後の再読込でTodoが1件存在する");
    const id = ownerIds[0];
    cleanup.push({ client: owner, id });
    assertTodo(ownerHtml, id, ownerTitle, false);
    assert(todoIds(await other.html()).length === 0, "他人の一覧に所有者のTodoが表示されない");

    await other.action("create", { title: otherTitle });
    const otherHtml = await other.html();
    const otherIds = todoIds(otherHtml);
    assert(otherIds.length === 1, "2人目のTodoが1件作成される");
    const otherTodoId = otherIds[0];
    cleanup.push({ client: other, id: otherTodoId });
    assertTodo(otherHtml, otherTodoId, otherTitle, false);
    assert(!todoIds(await owner.html()).includes(otherTodoId), "所有者の一覧に他人のTodoが表示されない");
    await other.action("toggle", { id, completed: "true" }, 404);
    await other.action("delete", { id }, 404);
    assertTodo(await owner.html(), id, ownerTitle, false);

    let title = ownerTitle;
    if (renameEnabled) {
      title = `Renamed Todo ${runId}`;
      await owner.action("rename", { id, title: `  ${title} \t\n` });
      assertTodo(await owner.html(), id, title, false);
      for (const invalidTitle of ["", " \t\n "]) {
        await owner.action("rename", { id, title: invalidTitle }, 400);
        assertTodo(await owner.html(), id, title, false);
      }
      await anonymous.action("rename", { id, title: "Unauthorized" }, 401);
      await other.action("rename", { id, title: "Not mine" }, 404);
      await owner.action("rename", { id: `missing-${runId}`, title: "Missing" }, 404);
      assertTodo(await owner.html(), id, title, false);
      await owner.action("rename", { id, title, userId: otherId, completed: "true" });
      assertTodo(await owner.html(), id, title, false);
      assert(!todoIds(await other.html()).includes(id), "renameでuserIdを偽装しても所有者を変更できない");
    }

    await owner.action("toggle", { id, completed: "true" });
    assertTodo(await owner.html(), id, title, true);
    if (renameEnabled) {
      title = `Completed Todo ${runId}`;
      await owner.action("rename", { id, title: ` ${title} `, userId: otherId, completed: "false" });
      assertTodo(await owner.html(), id, title, true);
      assert(!todoIds(await other.html()).includes(id), "完了済みTodoのrenameでも所有者は維持される");
    }
    await owner.action("toggle", { id, completed: "false" });
    assertTodo(await owner.html(), id, title, false);
    await owner.action("delete", { id });
    cleanup.splice(cleanup.findIndex((item) => item.id === id), 1);
    assert(!todoIds(await owner.html()).includes(id), "削除後の再読込でTodoが消える");
    assertTodo(await other.html(), otherTodoId, otherTitle, false);
    await other.action("delete", { id: otherTodoId });
    cleanup.splice(cleanup.findIndex((item) => item.id === otherTodoId), 1);
    assert(todoIds(await other.html()).length === 0, "2人目のTodoも削除が永続化される");
  } finally {
    for (const item of cleanup) {
      try {
        await item.client.action("delete", { id: item.id });
      } catch {
        cleanupFailed = true;
        console.error("HTTP smoke: 検証Todoの後片付けに失敗しました");
      }
    }
  }
  assert(!cleanupFailed, "検証Todoの後片付けが成功する");
  console.log(`HTTP smoke PASS: ${checks} checks; CRUD / 認証 / 所有者隔離${renameEnabled ? " / rename" : ""}`);
}

main().catch((error: unknown) => {
  console.error(`HTTP smoke FAIL: ${error instanceof Error ? error.message : "予期しないエラー"}`);
  process.exitCode = 1;
});
