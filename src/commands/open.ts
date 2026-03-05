import express from "express";
import open from "open";
import path from "path";

export async function openDocs(cwd: string) {
  const app = express();
  const naffuDir = path.join(cwd, ".naffu");
  const uiPath = path.join(__dirname, "..", "..", "ui");

  app.use(express.static(naffuDir));
  app.use(express.static(uiPath));

  // Serve index.html for root
  app.get("/", (_req: express.Request, res: express.Response) => {
    res.sendFile(path.join(uiPath, "index.html"));
  });

  await new Promise<void>((resolve) => {
    const server = app.listen(4242, "localhost", async () => {
      await open("http://localhost:4242");
      resolve();
    });
    process.on("SIGINT", () => server.close());
  });
}
