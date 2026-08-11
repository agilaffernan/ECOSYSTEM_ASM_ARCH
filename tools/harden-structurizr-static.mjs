import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const site = path.join(root, "structurizr-site");
const indexPath = path.join(site, "index.html");
const initPath = path.join(site, "js", "structurizr-static-init.js");
const cryptoJsSource = path.join(root, "tools", "vendor", "crypto-js-4.2.0.js");
const cryptoJsTarget = path.join(site, "js", "crypto-js-4.2.0.js");

let html = fs.readFileSync(indexPath, "utf8");
const quickNavigationTag = '<script type="text/javascript" src="./js/structurizr-quick-navigation.js"></script>';
const tailStart = html.indexOf(quickNavigationTag);
const inlineStart = html.lastIndexOf("<script>");
const inlineEnd = html.lastIndexOf("</script>");

if (tailStart !== -1 && inlineStart !== -1 && inlineEnd > inlineStart && inlineStart > tailStart) {
  const init = html.slice(inlineStart + "<script>".length, inlineEnd).trim();
  const externalScripts = html.slice(tailStart, inlineStart).trim();
  const document = html.slice(0, tailStart).trimEnd();

  if (!document.endsWith("</html>")) {
    throw new Error("Structurizr static-site document does not end with </html>.");
  }

  const bodyClosed = document.replace(/\s*<\/body>\s*<\/html>\s*$/, "");
  if (bodyClosed === document) {
    throw new Error("Unable to locate the Structurizr closing body and html tags.");
  }

  const meta = [
    '    <meta charset="utf-8">',
    '    <meta name="viewport" content="width=device-width, initial-scale=1">',
    '    <meta name="referrer" content="no-referrer">'
  ].join("\n");

  html = bodyClosed.replace("<head>", `<head>\n${meta}`);
  html += `\n\n${externalScripts}\n<script type="text/javascript" src="./js/structurizr-static-init.js"></script>\n</body>\n</html>\n`;
  fs.writeFileSync(initPath, `${init}\n`, "utf8");
} else if (!html.includes("./js/structurizr-static-init.js") || !fs.existsSync(initPath)) {
  throw new Error("Unexpected Structurizr static-site layout; refusing to rewrite index.html.");
}

html = html
  .replace("./js/crypto-js-4.1.1.min.js", "./js/crypto-js-4.2.0.js")
  .replaceAll('target="_blank"', 'target="_blank" rel="noopener noreferrer"');

fs.writeFileSync(indexPath, html, "utf8");
fs.copyFileSync(cryptoJsSource, cryptoJsTarget);
for (const obsolete of [
  "js/backbone-1.4.1.js",
  "js/crypto-js-4.1.1.min.js",
  "js/joint-3.6.5.js",
  "js/lodash-4.17.21.js",
  "css/joint-3.6.5.css",
  "css/open-sans.css",
  "css/fonts"
]) {
  fs.rmSync(path.join(site, ...obsolete.split("/")), { recursive: true, force: true });
}

const executableInlineScript = /<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/i;
if (executableInlineScript.test(html)) {
  throw new Error("An executable inline script remains after hardening.");
}

console.log("Hardened Structurizr static export: externalized initialization, removed executable inline script, and installed CryptoJS 4.2.0.");
