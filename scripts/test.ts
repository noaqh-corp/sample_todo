import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const directory = await mkdtemp(join(tmpdir(), "noaqh-todo-test-"));
const databaseUrl = `file:${join(directory, "test.db")}`;
const env = { ...process.env, DATABASE_URL: databaseUrl, NOAQH_TEST_DATABASE_URL: databaseUrl };
let exitCode = 1;
try {
  const migrate = Bun.spawn([process.execPath, "--bun", "run", "db:deploy"], { env, stdout: "inherit", stderr: "inherit" });
  if (await migrate.exited === 0) {
    const tests = Bun.spawn([process.execPath, "--bun", "run", "vitest", "run", ...process.argv.slice(2)], {
      env, stdout: "inherit", stderr: "inherit",
    });
    exitCode = await tests.exited;
  }
} finally {
  await rm(directory, { recursive: true, force: true });
}
process.exit(exitCode);
