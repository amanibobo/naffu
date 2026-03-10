"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openDocs = openDocs;
const express_1 = __importDefault(require("express"));
const open_1 = __importDefault(require("open"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
async function openDocs(cwd) {
    const app = (0, express_1.default)();
    const naffuDir = path_1.default.join(cwd, ".naffu");
    const pkgRoot = path_1.default.join(__dirname, "..", "..");
    // Next.js static export outputs to ui/out
    const uiOutPath = path_1.default.join(pkgRoot, "ui", "out");
    const uiPath = fs_1.default.existsSync(uiOutPath) ? uiOutPath : path_1.default.join(pkgRoot, "ui");
    app.use(express_1.default.static(naffuDir));
    app.use(express_1.default.static(uiPath));
    // Serve index.html for root
    app.get("/", (_req, res) => {
        const indexPath = path_1.default.join(uiPath, "index.html");
        if (fs_1.default.existsSync(indexPath)) {
            res.sendFile(indexPath);
        }
        else {
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
    await new Promise((resolve) => {
        const server = app.listen(4242, "localhost", async () => {
            await (0, open_1.default)("http://localhost:4242");
            resolve();
        });
        process.on("SIGINT", () => server.close());
    });
}
