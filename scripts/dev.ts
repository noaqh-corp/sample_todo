import { appendFile, mkdir } from "node:fs/promises";

await mkdir("logs", { recursive: true });
const port = process.env.PORT ?? "5007";
const server = Bun.spawn([process.execPath, "--bun", "run", "vite", "dev", "--port", port, "--strictPort"], {
  stdout: "pipe", stderr: "pipe",
});

async function log(stream: ReadableStream<Uint8Array>): Promise<void> {
  const decoder = new TextDecoder();
  for await (const chunk of stream) {
    const text = decoder.decode(chunk, { stream: true });
    process.stdout.write(text);
    await appendFile("logs/app.log", text.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, ""));
  }
}
process.on("SIGINT", () => server.kill());
process.on("SIGTERM", () => server.kill());
await Promise.all([log(server.stdout), log(server.stderr)]);
process.exit(await server.exited);
