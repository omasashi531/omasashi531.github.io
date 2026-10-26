// ===============================================================
// LAST LIFE LOG 公式サイトの共通プログラム
// ・ヘッダー（メニュー）、電波のテロップ、フッターを全ページに入れる
// ・data/logs.js と data/world.js から、一覧やカードを作る
// ページごとの処理は <body data-page="..."> の名前で切り替える
// ===============================================================
(function () {
  "use strict";

  var YT_CHANNEL = "https://www.youtube.com/@lastlifelog";
  var LOGS = window.LLL_LOGS || [];
  var WORLD = window.LLL_WORLD || [];

  // ---------- 小さな道具 ----------
  // 文章をHTMLに入れても安全なようにする
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  // 今日の日付（日本時間）を "2026-10-24" の形で
  function today() {
    var d = new Date(Date.now() + 9 * 3600 * 1000);
    return d.toISOString().slice(0, 10);
  }
  // 公開日が来たLOGだけを、新しい順に並べる
  function publishedLogs() {
    var t = today();
    return LOGS.filter(function (l) { return l.date && l.date <= t; })
      .sort(function (a, b) { return b.id.localeCompare(a.id); });
  }
  // 世界観の項目を表示してよいか（unlock のLOGが公開済みか）
  function isUnlocked(item, published) {
    if (item.unlock === "000") return true;
    if (!item.unlock) return false;
    return published.some(function (l) { return l.id >= item.unlock; });
  }
  function para(s) {
    return esc(s).split(/\n+/).map(function (p) { return "<p>" + p + "</p>"; }).join("");
  }
  function fmtDate(s) { return s ? s.replace(/-/g, ".") : ""; }

  // ---------- 絵の部分 ----------
  // 背景画像があれば画像、なければLOG番号入りの色の帯
  function logVisual(l) {
    if (l.image) return '<img src="' + esc(l.image) + '" alt="" loading="lazy">';
    if (l.youtube) return '<img src="https://i.ytimg.com/vi/' + esc(l.youtube) + '/hqdefault.jpg" alt="" loading="lazy">';
    var hue = (parseInt(l.id, 10) * 47) % 360;
    return '<div class="ph" style="--h:' + hue + '"><span>LOG.' + esc(l.id) + "</span></div>";
  }

  function logCard(l, i) {
    return '<a class="card" href="log.html?id=' + esc(l.id) + '" style="--tilt:' + (i % 2 ? 1.2 : -1.2) + 'deg">' +
      '<span class="tape" aria-hidden="true"></span>' +
      '<div class="card-img">' + logVisual(l) + "</div>" +
      '<p class="meta">LOG.' + esc(l.id) + " ・ DAY " + esc(l.day) + " ・ " + esc(fmtDate(l.date)) + "</p>" +
      "<h3>" + esc(l.place.ja) + "</h3>" +
      '<p class="card-text">' + esc(l.summary.ja) + "</p>" +
      '<p class="card-en">' + esc(l.place.en) + " — " + esc(l.weather.en) + "</p>" +
      "</a>";
  }

  function filmItem(l) {
    var href = l.youtube ? "https://www.youtube.com/watch?v=" + esc(l.youtube) : "log.html?id=" + esc(l.id);
    return '<a class="film" href="' + href + '"' + (l.youtube ? ' target="_blank" rel="noopener"' : "") + ">" +
      '<div class="film-img">' + logVisual(l) + '<span class="play" aria-hidden="true">▶</span></div>' +
      '<p class="meta">LOG.' + esc(l.id) + " ・ " + esc(fmtDate(l.date)) + "</p>" +
      "<p>" + esc(l.place.ja) + (l.youtube ? "" : '<span class="soon">まもなく放送</span>') + "</p>" +
      "</a>";
  }

  function worldCard(w) {
    var items = w.items ? '<ul class="items">' + w.items.ja.map(function (s, i) {
      return "<li>" + esc(s) + '<span class="en">' + esc(w.items.en[i]) + "</span></li>";
    }).join("") + "</ul>" : "";
    return '<article class="world-card" id="' + esc(w.key) + '">' +
      '<p class="stamp">' + esc(w.label) + "</p>" +
      "<h3>" + esc(w.name.ja) + ' <span class="en">' + esc(w.name.en) + "</span></h3>" +
      para(w.text.ja) + items +
      '<p class="en-block">' + esc(w.text.en) + "</p>" +
      "</article>";
  }

  // ---------- 共通部分 ----------
  function renderChrome(page, published) {
    var nav = [["index.html", "Home", "home"], ["logs.html", "Logs", "logs"], ["world.html", "World", "world"], ["links.html", "Links", "links"]];
    var header = document.getElementById("site-header");
    if (header) {
      var latest = published[0];
      var tick = latest
        ? "こちら、LAST LIFE LOG。　LOG." + latest.id + "　DAY " + latest.day + "　" + latest.place.ja + "　" + latest.weather.ja + "　—　This is LAST LIFE LOG. Still broadcasting.　"
        : "こちら、LAST LIFE LOG。　—　This is LAST LIFE LOG. Signal searching...　";
      header.innerHTML =
        '<div class="ticker" aria-label="放送中"><span class="onair">● ON AIR</span><div class="ticker-track"><span>' + esc(tick) + "</span><span aria-hidden=\"true\">" + esc(tick) + "</span></div></div>" +
        '<nav class="nav"><a class="logo" href="index.html">LAST LIFE LOG<small>radio from the end of the world</small></a><ul>' +
        nav.map(function (n) {
          return '<li><a href="' + n[0] + '"' + (page === n[2] ? ' aria-current="page"' : "") + ">" + n[1] + "</a></li>";
        }).join("") + "</ul></nav>";
    }
    var footer = document.getElementById("site-footer");
    if (footer) {
      footer.innerHTML =
        '<div class="footer-inner">' +
        '<p class="logo">LAST LIFE LOG</p>' +
        '<p class="end">今日の放送はここまで。<span>End of today\'s broadcast.</span></p>' +
        '<ul class="footer-nav">' + nav.map(function (n) { return '<li><a href="' + n[0] + '">' + n[1] + "</a></li>"; }).join("") +
        '<li><a href="' + YT_CHANNEL + '" target="_blank" rel="noopener">YouTube</a></li><li><a href="privacy.html">Privacy</a></li></ul>' +
        '<p class="ai">このチャンネルでは、AIで生成したイラストと音楽を使用しています。<br>This channel uses AI-generated illustrations and music.</p>' +
        '<p class="copy">© 2026 LAST LIFE LOG</p></div>';
    }
  }

  // ---------- ページごと ----------
  function renderHome(published) {
    var cards = document.getElementById("home-logs");
    if (cards) {
      cards.innerHTML = published.length
        ? published.slice(0, 4).map(logCard).join("")
        : '<p class="empty">最初の放送を準備しています。</p>';
    }
    var films = document.getElementById("home-films");
    if (films) films.innerHTML = published.map(filmItem).join("") || '<p class="empty">まもなく放送</p>';
    var day = document.getElementById("hero-day");
    if (day && published[0]) day.textContent = "DAY " + published[0].day;
  }

  function renderLogs(published) {
    var el = document.getElementById("all-logs");
    if (el) el.innerHTML = published.map(logCard).join("") || '<p class="empty">最初の放送を準備しています。</p>';
  }

  function renderLog(published) {
    var el = document.getElementById("log-detail");
    if (!el) return;
    var id = new URLSearchParams(location.search).get("id");
    var idx = -1;
    published.forEach(function (l, i) { if (l.id === id) idx = i; });
    if (idx < 0) {
      el.innerHTML = '<p class="empty">この放送は、まだ届いていません。<br><a href="logs.html">放送記録へ戻る</a></p>';
      return;
    }
    var l = published[idx];
    document.title = "LOG." + l.id + " " + l.place.ja + " | LAST LIFE LOG";
    var media = l.youtube
      ? '<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/' + esc(l.youtube) + '" title="LOG.' + esc(l.id) + '" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>'
      : '<div class="video">' + logVisual(l) + "</div>";
    var ja = l.diary && l.diary.ja ? l.diary.ja : l.summary.ja;
    var en = l.diary && l.diary.en ? l.diary.en : l.summary.en;
    var newer = published[idx - 1], older = published[idx + 1];
    el.innerHTML =
      '<p class="sec-ja">放送記録 / Broadcast log</p>' +
      '<h1 class="log-title"><span>LOG.' + esc(l.id) + "</span>" + esc(l.place.ja) + "</h1>" +
      '<dl class="log-meta"><div><dt>DAY</dt><dd>' + esc(l.day) + "</dd></div><div><dt>PLACE</dt><dd>" + esc(l.place.en) +
      "</dd></div><div><dt>WEATHER</dt><dd>" + esc(l.weather.ja) + " / " + esc(l.weather.en) + "</dd></div><div><dt>ON AIR</dt><dd>" + esc(fmtDate(l.date)) + "</dd></div></dl>" +
      media +
      '<article class="diary"><span class="tape" aria-hidden="true"></span>' +
      '<p class="diary-open">こちら、LAST LIFE LOG。</p>' + para(ja) +
      '<p class="diary-close">今日の放送はここまで。</p>' +
      '<div class="diary-en">' + para(en) + "</div></article>" +
      '<nav class="pager">' +
      (older ? '<a href="log.html?id=' + esc(older.id) + '">← LOG.' + esc(older.id) + "</a>" : "<span></span>") +
      '<a href="logs.html">一覧 / All logs</a>' +
      (newer ? '<a href="log.html?id=' + esc(newer.id) + '">LOG.' + esc(newer.id) + " →</a>" : "<span></span>") +
      "</nav>";
  }

  function renderWorld(published) {
    var el = document.getElementById("world-list");
    if (!el) return;
    el.innerHTML = WORLD.filter(function (w) { return isUnlocked(w, published); }).map(worldCard).join("");
    var locked = WORLD.filter(function (w) { return !isUnlocked(w, published); }).length;
    var note = document.getElementById("world-locked");
    if (note) note.hidden = locked === 0;
  }

  document.addEventListener("DOMContentLoaded", function () {
    var page = document.body.getAttribute("data-page");
    var published = publishedLogs();
    renderChrome(page, published);
    if (page === "home") renderHome(published);
    if (page === "logs") renderLogs(published);
    if (page === "log") renderLog(published);
    if (page === "world") renderWorld(published);
  });
})();
