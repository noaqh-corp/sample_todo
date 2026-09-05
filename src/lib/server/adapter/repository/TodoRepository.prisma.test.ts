import { PrismaClient } from "@prisma/client";
import { afterAll } from "vitest";
import { TodoRepositoryPrisma } from "./TodoRepository.prisma";
import { repositoryContract } from "../../../../../tests/repository-contract";

// scripts/test.ts が実行ごとに作った一時 DB にだけ接続する。
if (!process.env.NOAQH_TEST_DATABASE_URL || process.env.DATABASE_URL !== process.env.NOAQH_TEST_DATABASE_URL) {
  throw new Error("DBテストは bun run test で実行してください（一時DBが必要です）");
}
const prisma = new PrismaClient();
afterAll(() => prisma.$disconnect());

repositoryContract("TodoRepositoryPrisma", async () => {
  const owner = await prisma.user.create({ data: { email: `${crypto.randomUUID()}@example.test` } });
  const other = await prisma.user.create({ data: { email: `${crypto.randomUUID()}@example.test` } });
  return { repository: new TodoRepositoryPrisma(prisma), ownerId: owner.id, otherId: other.id };
});
