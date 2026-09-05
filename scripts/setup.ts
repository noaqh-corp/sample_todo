const envFile = Bun.file(".env");
if (!(await envFile.exists())) {
  await Bun.write(envFile, [
    'DATABASE_URL="file:./dev.db"',
    `BETTER_AUTH_SECRET="${crypto.randomUUID()}${crypto.randomUUID()}"`,
    'BETTER_AUTH_URL="http://localhost:5007"',
    "",
  ].join("\n"));
  console.log("開発用 .env を作成しました。");
}
for (const command of ["db:generate", "db:deploy"]) {
  const child = Bun.spawn([process.execPath, "--bun", "run", command], { stdout: "inherit", stderr: "inherit" });
  const code = await child.exited;
  if (code !== 0) process.exit(code);
}
console.log("準備完了: bun run dev で起動できます。");
