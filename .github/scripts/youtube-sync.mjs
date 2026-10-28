// ===============================================================
// YouTubeの新着動画を見て、サイトのLOGに動画を自動で入れるプログラム
// ---------------------------------------------------------------
// ・チャンネルの公開されている新着一覧（RSS）を読む。Googleのログインは不要
// ・タイトルに「LOG.004」のような番号がある動画を探す
// ・data/logs.js の同じ番号のLOGで、youtube が空のものにだけ動画のIDを入れる
//   （すでに入っているIDは書き換えない。LOGがまだ無い番号は何もしない）
// 使い方：node .github/scripts/youtube-sync.mjs
//   お試し：FEED_FILE=手元のRSS.xml node .github/scripts/youtube-sync.mjs
// ===============================================================
import { readFileSync, writeFileSync, appendFileSync } from "node:fs";

const HANDLE = "lastlifelog";          // YouTubeのハンドル名（@のあと）
const LOGS_FILE = "data/logs.js";

// 結果をGitHubの画面（Actionsのまとめ）にも出す
function report(line) {
  console.log(line);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, line + "\n");
}

// チャンネルID（UCから始まる文字）を、ハンドル名のページから調べる
async function findChannelId() {
  if (process.env.CHANNEL_ID) return process.env.CHANNEL_ID;
  const res = await fetch(`https://www.youtube.com/@${HANDLE}`, {
    headers: { "accept-language": "ja,en;q=0.8", "user-agent": "Mozilla/5.0 (last-life-log site sync)" },
  });
  if (!res.ok) throw new Error(`チャンネルのページを開けませんでした（${res.status}）`);
  const html = await res.text();
  const m = html.match(/"(?:externalId|channelId)":"(UC[\w-]{22})"/) || html.match(/youtube\.com\/channel\/(UC[\w-]{22})/);
  if (!m) throw new Error("チャンネルIDが見つかりませんでした");
  return m[1];
}

async function readFeed() {
  if (process.env.FEED_FILE) return readFileSync(process.env.FEED_FILE, "utf8");
  const id = await findChannelId();
  const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${id}`);
  if (!res.ok) throw new Error(`新着一覧を読めませんでした（${res.status}）`);
  return res.text();
}

// RSSから { 番号: 動画ID } を作る（同じ番号が複数あれば、いちばん古い動画を使う）
function videosByLog(xml) {
  const found = {};
  const entries = xml.split("<entry>").slice(1);
  for (const e of entries.reverse()) { // RSSは新しい順なので、古い順に見る
    const vid = (e.match(/<yt:videoId>([\w-]{11})<\/yt:videoId>/) || [])[1];
    const title = ((e.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || "").trim();
    const num = (title.match(/LOG\s*[.．・]?\s*(\d{1,4})/i) || [])[1];
    if (!vid || !num) continue;
    // ショート（#shorts）は本編ではないので使わない
    if (/#shorts/i.test(title)) continue;
    const id = String(Number(num)).padStart(3, "0");
    if (!found[id]) found[id] = { vid, title };
  }
  return found;
}

// data/logs.js の、指定したLOGの youtube: "" を書き換える
function fillLogs(text, videos) {
  let changed = 0;
  for (const [id, v] of Object.entries(videos)) {
    const start = text.indexOf(`id: "${id}"`);
    if (start < 0) { report(`- LOG.${id}：サイトにまだLOGが無いので、そのままにしました（${v.title}）`); continue; }
    const next = text.indexOf("id: \"", start + 5);
    const end = next < 0 ? text.length : next;
    const block = text.slice(start, end);
    const m = block.match(/youtube:\s*"([^"]*)"/);
    if (!m) { report(`- LOG.${id}：youtube の欄が見つかりませんでした`); continue; }
    if (m[1]) continue; // すでに入っている
    const newBlock = block.replace(m[0], `youtube: "${v.vid}"`);
    text = text.slice(0, start) + newBlock + text.slice(end);
    report(`- LOG.${id}：動画を追加しました → https://youtu.be/${v.vid}（${v.title}）`);
    changed++;
  }
  return { text, changed };
}

const xml = await readFeed();
const videos = videosByLog(xml);
report(`YouTubeで見つかったLOGの動画：${Object.keys(videos).length}本`);
const before = readFileSync(LOGS_FILE, "utf8");
const { text, changed } = fillLogs(before, videos);
if (changed) writeFileSync(LOGS_FILE, text);
report(changed ? `サイトに${changed}本の動画を入れました。` : "新しく入れる動画はありませんでした。");
