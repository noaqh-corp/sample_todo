// サーバーとHTTP検証を同じ実行環境内で起動し、自分で起動したサーバーだけ停止する。
// CHECKPOINT_DISABLE=1 bun docs/plans/rename-todo/run-http-smoke.ts
// RENAME_ENABLED=1 CHECKPOINT_DISABLE=1 bun docs/plans/rename-todo/run-http-smoke.ts
const server = Bun.spawn([process.execPath, "run", "dev"], {
  stdout: "inherit", stderr: "inherit",
});
let exitCode = 1;
try {
  await Bun.sleep(5_000);
  if (server.exitCode !== null) throw new Error("検証サーバーを起動できませんでした");
  const smoke = Bun.spawn([process.execPath, "docs/plans/rename-todo/http-smoke.ts"], {
    stdout: "inherit", stderr: "inherit",
  });
  exitCode = await smoke.exited;
} finally {
  server.kill("SIGTERM");
  await server.exited;
}
process.exit(exitCode);
