import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'fs';

const SCREENSHOT_DIR = './screenshots';
const BASE_URL = 'http://localhost:5007';
mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function screenshot(page: any, name: string, description: string = '') {
  const path = `${SCREENSHOT_DIR}/${name}.png`;
  await page.screenshot({ path, fullPage: true });
  console.log(`📸 [${name}] ${description}`);
}

async function waitForText(page: any, text: string, timeout: number = 10000) {
  await page.waitForFunction(
    (t: string) => document.body.innerText.includes(t),
    { timeout },
    text
  );
}

async function waitForTextGone(page: any, text: string, timeout: number = 10000) {
  await page.waitForFunction(
    (t: string) => !document.body.innerText.includes(t),
    { timeout },
    text
  );
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--window-size=1280,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const results: { test: string; passed: boolean; detail: string }[] = [];

  // ========== 1. トップページ ==========
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
  await screenshot(page, '01-top-page', 'トップページ（未ログイン）');

  const hasLoginLink = await page.$('a[href="/login"]');
  const hasRegisterLink = await page.$('a[href="/register"]');
  results.push({
    test: 'トップページ表示',
    passed: !!(hasLoginLink && hasRegisterLink),
    detail: `ログインリンク: ${!!hasLoginLink}, 新規登録リンク: ${!!hasRegisterLink}`
  });

  // ========== 2. ログイン ==========
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
  await screenshot(page, '02-login-page', 'ログインページ');

  await page.type('input#email', 'test@example.com');
  await page.type('input#password', 'password123');
  await screenshot(page, '03-login-filled', 'ログインフォーム入力後');

  await page.click('button[type="submit"]');
  // ログイン成功後、Todo作成またはユーザー情報が表示されるまで待つ
  try {
    await waitForText(page, 'Todo作成', 15000);
  } catch (e) {
    console.log('   ログイン後テキスト待機失敗:', e);
  }
  await screenshot(page, '04-after-login', 'ログイン後');

  const afterLoginText = await page.evaluate(() => document.body.innerText);
  const loginOk = afterLoginText.includes('テストユーザー') || afterLoginText.includes('Todo作成');
  results.push({
    test: 'ログイン',
    passed: loginOk,
    detail: loginOk ? 'ログイン成功、ユーザー情報とTodo作成フォーム表示' : `本文: ${afterLoginText.substring(0, 200)}`
  });

  // ========== 3. 既存Todoを削除（クリーンアップ） ==========
  let existingDeleteForms = await page.$$('form[action="?/delete"]');
  if (existingDeleteForms.length > 0) {
    console.log(`   既存Todo ${existingDeleteForms.length}個を削除中...`);
    for (let i = 0; i < 10; i++) {
      const forms = await page.$$('form[action="?/delete"]');
      if (forms.length === 0) break;
      await forms[0].click();
      await new Promise(r => setTimeout(r, 1000));
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  await screenshot(page, '05-cleaned', '既存Todoクリーンアップ後');

  // ========== 4. Todo作成 ==========
  const inputBefore = await page.$('input[name="title"]');
  if (inputBefore) {
    await page.type('input[name="title"]', 'E2EテストTodo1');
    await page.click('form[action="?/create"] button[type="submit"]');
    // Todoが作成されて表示されるまで待つ
    try {
      await waitForText(page, 'E2EテストTodo1', 10000);
    } catch (e) {
      console.log('   Todo作成後テキスト待機失敗');
    }
    await new Promise(r => setTimeout(r, 500));
    await screenshot(page, '06-after-create-1', 'Todo1作成後');

    const bodyText1 = await page.evaluate(() => document.body.innerText);
    const createOk1 = bodyText1.includes('E2EテストTodo1');
    results.push({
      test: 'Todo作成（1つ目）',
      passed: createOk1,
      detail: createOk1 ? '「E2EテストTodo1」が一覧に表示' : `本文: ${bodyText1.substring(0, 300)}`
    });

    // 2つ目作成
    const input2 = await page.$('input[name="title"]');
    if (input2) {
      await page.type('input[name="title"]', 'E2EテストTodo2');
      await page.click('form[action="?/create"] button[type="submit"]');
      try {
        await waitForText(page, 'E2EテストTodo2', 10000);
      } catch (e) {
        console.log('   Todo2作成後テキスト待機失敗');
      }
      await new Promise(r => setTimeout(r, 500));
      await screenshot(page, '07-after-create-2', 'Todo2作成後');

      const bodyText2 = await page.evaluate(() => document.body.innerText);
      const createOk2 = bodyText2.includes('E2EテストTodo1') && bodyText2.includes('E2EテストTodo2');
      results.push({
        test: 'Todo作成（2つ目）',
        passed: createOk2,
        detail: createOk2 ? '両方のTodoが一覧に表示' : `本文: ${bodyText2.substring(0, 300)}`
      });
    }
  } else {
    results.push({ test: 'Todo作成', passed: false, detail: 'input[name="title"]が見つからない' });
  }

  // ========== 5. Todoトグル（完了/未完了） ==========
  const toggleForm = await page.$('form[action="?/toggle"]');
  if (toggleForm) {
    const beforeSpan = await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('span.flex-1'));
      return spans.map(s => ({ text: s.textContent, class: s.className }));
    });
    console.log('   トグル前の状態:', JSON.stringify(beforeSpan));

    // 最初のTodoのトグルボタンをクリック
    await page.click('form[action="?/toggle"] button[type="submit"]');
    await new Promise(r => setTimeout(r, 3000));
    await screenshot(page, '08-after-toggle', 'トグル後');

    const afterSpan = await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('span.flex-1'));
      return spans.map(s => ({ text: s.textContent, class: s.className }));
    });
    console.log('   トグル後の状態:', JSON.stringify(afterSpan));

    const hasLineThrough = afterSpan.some(s => s.class.includes('line-through'));
    const toggleWorked = afterSpan[0]?.class !== beforeSpan[0]?.class;
    results.push({
      test: 'Todoトグル(完了)',
      passed: hasLineThrough && toggleWorked,
      detail: `クラス変化: ${toggleWorked}, 打ち消し線: ${hasLineThrough}, 状態: ${JSON.stringify(afterSpan)}`
    });

    // もう1度トグルして未完了に戻す
    await page.click('form[action="?/toggle"] button[type="submit"]');
    await new Promise(r => setTimeout(r, 3000));
    await screenshot(page, '09-after-toggle-undo', 'トグル元に戻す');
  } else {
    results.push({ test: 'Todoトグル(完了)', passed: false, detail: 'form[action="?/toggle"]が見つからない' });
  }

  // ========== 6. Todo削除 ==========
  const deleteForms = await page.$$('form[action="?/delete"]');
  console.log('   削除ボタン数:', deleteForms.length);

  if (deleteForms.length > 0) {
    const todosBefore = deleteForms.length;

    // 最初の削除ボタンをクリック
    await deleteForms[0].click();
    await new Promise(r => setTimeout(r, 3000));
    await screenshot(page, '10-after-delete', '1つ削除後');

    const deleteFormsAfter = await page.$$('form[action="?/delete"]');
    const todosAfter = deleteFormsAfter.length;
    const deleteOk = todosAfter < todosBefore;

    results.push({
      test: 'Todo削除',
      passed: deleteOk,
      detail: `削除前: ${todosBefore}個, 削除後: ${todosAfter}個`
    });
  } else {
    results.push({ test: 'Todo削除', passed: false, detail: 'form[action="?/delete"]が見つからない' });
  }

  // ========== 7. ログアウト ==========
  const logoutExists = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, a'));
    return buttons.some(b => b.textContent?.includes('ログアウト'));
  });

  if (logoutExists) {
    await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('button, a'));
      const logout = elements.find(b => b.textContent?.includes('ログアウト'));
      logout?.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    await screenshot(page, '11-after-logout', 'ログアウト後');

    const afterLogoutText = await page.evaluate(() => document.body.innerText);
    const logoutOk = afterLogoutText.includes('ログインしてください') || afterLogoutText.includes('新規登録');
    results.push({
      test: 'ログアウト',
      passed: logoutOk,
      detail: `ログアウト後テキストに「ログインしてください」: ${afterLogoutText.includes('ログインしてください')}`
    });
  } else {
    results.push({ test: 'ログアウト', passed: false, detail: 'ログアウトボタンが見つからない（おそらく既にログアウト状態）' });
  }

  // ========== 結果表示 ==========
  console.log('\n========================================');
  console.log('E2Eテスト結果');
  console.log('========================================');
  let passed = 0;
  let failed = 0;
  for (const r of results) {
    const icon = r.passed ? '✅' : '❌';
    if (r.passed) passed++; else failed++;
    console.log(`${icon} ${r.test}: ${r.detail}`);
  }
  console.log('----------------------------------------');
  console.log(`合計: ${passed}パス / ${failed}失敗 / ${results.length}テスト`);
  console.log('========================================\n');
  console.log('📁 スクリーンショット: ' + SCREENSHOT_DIR);

  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => {
  console.error('エラー:', e);
  process.exit(2);
});
