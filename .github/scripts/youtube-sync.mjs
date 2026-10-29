// ===============================================================
// YouTubeに公開されたLOGの動画から、サイトのLOGを自動で作るプログラム
// ---------------------------------------------------------------
// ・YouTube Data API（APIキーだけで使える、公開情報の読み取り）で、
//   チャンネルのアップロード動画の一覧（タイトル・説明文・公開日）を読む
// ・タイトルに「LOG.004」のような番号がある動画を探す（ショートは使わない）
// ・説明文の日記の形から、DAY・場所・天気・日本語と英語の日記を読む
//     LOG.004 ／ DAY 430 ／ 水に沈んだ図書館 ／ 雨
//     こちら、LAST LIFE LOG。 … 今日の放送はここまで。
//     This is LAST LIFE LOG. … End of today's broadcast.
// ・data/logs.js に
//     同じ番号のLOGが無い → 新しく作る（絵はYouTubeのサムネイルを使う）
//     同じ番号のLOGがある → 空の欄（動画・日記など）だけを埋める。手で書いた内容は消さない
//   動画を初めて入れるときは、公開日をYouTubeで公開された日（日本時間）に直す
// 使い方：YOUTUBE_API_KEY=… node .github/scripts/youtube-sync.mjs
//   お試し：ITEMS_FILE=APIの返事.json node .github/scripts/youtube-sync.mjs
// ===============================================================
import { readFileSync, writeFileSync, appendFileSync } from "node:fs";

const CHANNEL_ID = process.env.CHANNEL_ID || "UCXAhPdphsnY6_ez3-jxC4dA"; // @lastlifelog
const LOGS_FILE = "data/logs.js";

// 結果をGitHubの画面（Actionsのまとめ）にも出す
function report(line) {
  console.log(line);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, line + "\n");
}

/* ---------- YouTubeから読む ---------- */
async function fetchItems() {
  if (process.env.ITEMS_FILE) return JSON.parse(readFileSync(process.env.ITEMS_FILE, "utf8")).items || [];
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("APIキー（Secrets の YOUTUBE_API_KEY）がありません");
  const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=UU${CHANNEL_ID.slice(2)}&key=${key}`;
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`YouTube APIで読めませんでした（${res.status} ${data.error?.message || ""}）`);
  return data.items || [];
}

// { "004": { vid, title, description, published } }（同じ番号が複数あれば、いちばん古い動画）
function videosByLog(items) {
  const found = {};
  for (const it of [...items].reverse()) { // APIは新しい順なので、古い順に見る
    const s = it.snippet || {};
    const vid = s.resourceId?.videoId;
    const title = String(s.title || "");
    const num = (title.match(/LOG\s*[.．・]?\s*(\d{1,4})/i) || [])[1];
    if (!vid || !num || /#shorts/i.test(title)) continue;
    const id = String(Number(num)).padStart(3, "0");
    if (!found[id]) found[id] = { vid, title, description: String(s.description || ""), published: it.contentDetails?.videoPublishedAt || s.publishedAt || "" };
  }
  return found;
}

/* ---------- 説明文からLOGを読む ---------- */
function firstSentences(text, max, joiner = "") {
  const parts = String(text).replace(/\n+/g, joiner).match(/[^。．.!?！？]+[。．.!?！？]?/g) || [];
  let out = "";
  for (const p of parts) {
    if (out && (out + p).length > max) break;
    out += p;
  }
  return out.trim();
}

function parseDescription(desc) {
  const lines = desc.replace(/\r/g, "").split("\n").map((x) => x.trim());
  const h = lines.findIndex((x) => /^LOG\s*[.．]?\s*\d+\s*[／/]\s*DAY\s*\d+/i.test(x));
  if (h < 0) return null;
  const head = lines[h].match(/DAY\s*(\d+)\s*[／/]\s*(.+?)\s*[／/]\s*(.+?)\s*$/i);
  if (!head) return null;
  // 見出しの次から、空行・区切り線・締めのひとことまでを1つのまとまりとして読む
  const block = (from, endRe) => {
    const out = [];
    let i = from;
    while (i < lines.length && !lines[i]) i++; // 先頭の空行はとばす
    for (; i < lines.length; i++) {
      const x = lines[i];
      if (!x || /^━/.test(x) || endRe.test(x)) break;
      out.push(x);
    }
    return { lines: out, next: i + 1 };
  };
  // 決まり文句と、英語の見出し（「LOG.002 / DAY 416 / …」）は日記に入れない
  const drop = (x) => !/^こちら、/.test(x) && !/^This is /i.test(x) && !/^LOG\s*[.．]?\s*\d+\s*[／/]/i.test(x);
  // 日本語の日記（「今日の放送はここまで。」まで。なければ空行まで）
  const jaPart = block(h + 1, /^今日の放送はここまで/);
  // 英語の日記（日本語のあとのまとまり。「End of today's broadcast.」まで）
  const enPart = block(jaPart.next, /^End of today'?s broadcast/i);
  const isEnglish = (x) => /^[\x20-\x7E‘’“”—–…]+$/.test(x);
  const ja = jaPart.lines.filter(drop).join("\n");
  const en = enPart.lines.every(isEnglish) ? enPart.lines.filter(drop).join("\n") : "";
  return { day: Number(head[1]), place: head[2], weather: head[3], ja, en };
}

const jstDay = (iso) => { const t = Date.parse(iso); return t ? new Date(t + 9 * 3600e3).toISOString().slice(0, 10) : ""; };

/* ---------- data/logs.js を書きかえる ---------- */
const q = (v) => JSON.stringify(v);
function entryText(e) {
  return [
    "  {",
    `    id: ${q(e.id)},`,
    `    day: ${e.day},`,
    `    date: ${q(e.date)},`,
    `    place:   { ja: ${q(e.place.ja)}, en: ${q(e.place.en)} },`,
    `    weather: { ja: ${q(e.weather.ja)}, en: ${q(e.weather.en)} },`,
    "    summary: {",
    `      ja: ${q(e.summary.ja)},`,
    `      en: ${q(e.summary.en)}`,
    "    },",
    `    diary: { ja: ${q(e.diary.ja)}, en: ${q(e.diary.en)} },`,
    `    youtube: ${q(e.youtube)},`,
    `    image: ${q(e.image)}`,
    "  }",
  ].join("\n");
}

// 1つのLOGの範囲（"id:" から次のLOGの手前まで）
function blockRange(text, id) {
  const start = text.indexOf(`id: "${id}"`);
  if (start < 0) return null;
  const next = text.indexOf('id: "', start + 5);
  return { start, end: next < 0 ? text.length : next };
}

// 空の欄だけを埋める（"key: \"\"" の形のところ）
function fillEmpty(block, key, value) {
  if (!value) return block;
  const re = new RegExp(`(${key}:\\s*)""`);
  return re.test(block) ? block.replace(re, `$1${q(value)}`) : block;
}

function sync(text, videos) {
  let changed = 0;
  for (const [id, v] of Object.entries(videos)) {
    const log = parseDescription(v.description);
    const range = blockRange(text, id);

    if (!range) {
      // サイトにまだ無いLOG → 説明文から新しく作る
      if (!log) { report(`- LOG.${id}：説明文の1行目が「LOG.${id} ／ DAY ○○ ／ 場所 ／ 天気」の形ではないので、作れませんでした（${v.title}）`); continue; }
      const entry = {
        id, day: log.day, date: jstDay(v.published) || new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10),
        place: { ja: log.place, en: "" }, weather: { ja: log.weather, en: "" },
        summary: { ja: firstSentences(log.ja, 70), en: firstSentences(log.en, 160, " ") },
        diary: { ja: log.ja, en: log.en }, youtube: v.vid, image: "",
      };
      const end = text.lastIndexOf("];");
      text = `${text.slice(0, end).replace(/\s*$/, "")},\n${entryText(entry)}\n${text.slice(end)}`;
      report(`- LOG.${id}：新しく作りました（DAY ${log.day}・${log.place}・${entry.date}）→ https://youtu.be/${v.vid}`);
      changed++;
      continue;
    }

    // すでにあるLOG → 空の欄だけ埋める
    let block = text.slice(range.start, range.end);
    const before = block;
    const firstVideo = /youtube:\s*""/.test(block);
    block = fillEmpty(block, "youtube", v.vid);
    if (firstVideo && jstDay(v.published)) block = block.replace(/date:\s*"[^"]*"/, `date: "${jstDay(v.published)}"`);
    if (log) {
      block = block.replace(/diary:\s*\{\s*ja:\s*""/, `diary: { ja: ${q(log.ja)}`);
      block = block.replace(/(diary:\s*\{\s*ja:\s*"(?:[^"\\]|\\.)*",\s*en:\s*)""/, `$1${q(log.en)}`);
    }
    if (block !== before) {
      text = text.slice(0, range.start) + block + text.slice(range.end);
      report(`- LOG.${id}：${firstVideo ? "動画" : ""}${firstVideo && log ? "と" : ""}${log ? "空いていた欄" : ""}を入れました → https://youtu.be/${v.vid}`);
      changed++;
    }
  }
  return { text, changed };
}

let items;
try {
  items = await fetchItems();
} catch (e) {
  // 1時間後にまた試すので、ここでは「注意」として止める（毎時間の失敗メールを防ぐ）
  report(`::warning::${e.message}。次の回（1時間後）にもう一度試します。`);
  process.exit(0);
}
const videos = videosByLog(items);
report(`YouTubeで見つかったLOGの動画：${Object.keys(videos).length}本`);
const { text, changed } = sync(readFileSync(LOGS_FILE, "utf8"), videos);
if (changed) writeFileSync(LOGS_FILE, text);
report(changed ? `サイトのLOGを${changed}本更新しました。` : "サイトに変更はありませんでした。");
