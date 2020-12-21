import { listenAndServe } from "https://deno.land/std@0.81.0/http/server.ts";
import { serveFile } from "https://deno.land/std@0.81.0/http/file_server.ts";
import { acceptWebSocket, acceptable } from "https://deno.land/std@0.81.0/ws/mod.ts";
import { parse } from "https://deno.land/std@0.81.0/flags/mod.ts";
import chat from "./chat.js";

const DEFAULT_PORT = 3000;
const argPort = parse(Deno.args).port;
const port = argPort ? parseInt(argPort) : DEFAULT_PORT;

listenAndServe({port: port}, async (req) => {
    let url = req.url;
    const position = url.indexOf('?');
    if (position > -1) {
        url = url.substring(0, position);
    }

    const path = `${Deno.cwd()}/public${url}`;
    if (await fileExists(path)) {
        const content = await serveFile(req, path);
        req.respond(content);
        return;
    }
    if (acceptable(req)) {
        acceptWebSocket({
            conn: req.conn,
            bufReader: req.r,
            bufWriter: req.w,
            headers: req.headers,   
        }).then(chat);
    }
});

console.log("Server started on port 3000")

async function fileExists(path) {
    try {
        const stats = await Deno.lstat(path);
        return stats && stats.isFile;
    } catch (e) {
        if (e && e instanceof Deno.errors.NotFound) {
            return false;
        } else {
            throw e;
        }
    }
}
