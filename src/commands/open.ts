import express from "express";
import open from "open";
import path from "path";
import fs from "fs";

export async function openDocs(cwd: string) {
  const app = express();
  const naffuDir = path.join(cwd, ".naffu");
  const pkgRoot = path.join(__dirname, "..", "..");
  // Next.js static export outputs to ui/out
  const uiOutPath = path.join(pkgRoot, "ui", "out");
  const uiPath = fs.existsSync(uiOutPath) ? uiOutPath : path.join(pkgRoot, "ui");

  app.use(express.static(naffuDir));
  app.use(express.static(uiPath));

  // Serve index.html for root
  app.get("/", (_req: express.Request, res: express.Response) => {
    const indexPath = path.join(uiPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.send(`
        <!DOCTYPE html>
        <html><head><title>Naffu</title></head>
        <body>
          <h1>Naffu</h1>
          <p>UI not built. Run <code>npm run build:ui</code> in the naffu package.</p>
        </body></html>
      `);
    }
  });

  await new Promise<void>((resolve) => {
    const server = app.listen(4242, "localhost", async () => {
      await open("http://localhost:4242");
      resolve();
    });
    process.on("SIGINT", () => server.close());
  });
}
