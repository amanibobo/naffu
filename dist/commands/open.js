"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openDocs = openDocs;
const express_1 = __importDefault(require("express"));
const open_1 = __importDefault(require("open"));
const path_1 = __importDefault(require("path"));
async function openDocs(cwd) {
    const app = (0, express_1.default)();
    const naffuDir = path_1.default.join(cwd, ".naffu");
    const uiPath = path_1.default.join(__dirname, "..", "..", "ui");
    app.use(express_1.default.static(naffuDir));
    app.use(express_1.default.static(uiPath));
    // Serve index.html for root
    app.get("/", (_req, res) => {
        res.sendFile(path_1.default.join(uiPath, "index.html"));
    });
    await new Promise((resolve) => {
        const server = app.listen(4242, "localhost", async () => {
            await (0, open_1.default)("http://localhost:4242");
            resolve();
        });
        process.on("SIGINT", () => server.close());
    });
}
