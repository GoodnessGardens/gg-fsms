// Friendly text format <-> structured content blocks, for the admin editors.
//   ## Heading            → section heading
//   - item                → bullet (consecutive bullets group into one list)
//   ! Title :: text       → orange warning callout
//   [VIDEO] url | label   → video link button
//   anything else         → paragraph

export function blocksToText(blocks) {
  const out = [];
  for (const b of blocks || []) {
    if (b[0] === "link") out.push(`[VIDEO] ${b[1]} | ${b[2]}`);
    else if (b[0] === "h") out.push(`## ${b[2]}`);
    else if (b[0] === "p") out.push(b[1]);
    else if (b[0] === "ul") for (const it of b[1]) out.push(`- ${it}`);
    else if (b[0] === "call") out.push(`! ${b[2]} :: ${b[3]}`);
    out.push("");
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function textToBlocks(text) {
  const blocks = [];
  let ul = null;
  const flush = () => { if (ul && ul.length) blocks.push(["ul", ul]); ul = null; };
  for (const raw of (text || "").split("\n")) {
    const l = raw.trim();
    if (!l) { flush(); continue; }
    if (l.startsWith("- ") || l.startsWith("• ")) { (ul = ul || []).push(l.slice(2).trim()); continue; }
    flush();
    if (l.toUpperCase().startsWith("[VIDEO]")) {
      const rest = l.slice(7).trim();
      const i = rest.indexOf("|");
      blocks.push(["link", (i >= 0 ? rest.slice(0, i) : rest).trim(), (i >= 0 ? rest.slice(i + 1) : "Watch the video").trim()]);
    } else if (l.startsWith("## ")) blocks.push(["h", 3, l.slice(3).trim()]);
    else if (l.startsWith("! ")) {
      const rest = l.slice(2);
      const i = rest.indexOf("::");
      blocks.push(["call", "warning", (i >= 0 ? rest.slice(0, i) : "Note").trim(), (i >= 0 ? rest.slice(i + 2) : rest).trim()]);
    } else blocks.push(["p", l]);
  }
  flush();
  return blocks;
}

// FS document sections: [["HEADING", ["item", ...]], ...]
export function secsToText(sections) {
  return (sections || []).map(([h, items]) => ["## " + h, ...items.map((i) => "- " + i)].join("\n")).join("\n\n");
}

export function textToSecs(text) {
  const out = [];
  let cur = null;
  for (const raw of (text || "").split("\n")) {
    const l = raw.trim();
    if (!l) continue;
    if (l.startsWith("## ")) { cur = [l.slice(3).trim(), []]; out.push(cur); }
    else if (cur) cur[1].push(l.startsWith("- ") || l.startsWith("• ") ? l.slice(2).trim() : l);
  }
  return out.filter(([, items]) => items.length);
}
