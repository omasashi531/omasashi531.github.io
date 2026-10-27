// ===============================================================
// LAST LIFE LOG 公式サイトの共通プログラム
// ・ヘッダー（メニューと ON AIR）、フッターを全ページに入れる
// ・data/logs.js と data/world.js から、一覧やページの中身を作る
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
    return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
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
  function para(s, cls) {
    return esc(s).split(/\n+/).map(function (p) { return "<p" + (cls ? ' class="' + cls + '"' : "") + ">" + p + "</p>"; }).join("");
  }
  function fmtDate(s) { return s ? s.replace(/-/g, ".") : ""; }

  // 背景画像があれば画像、なければ霧のグラデーション
  function logVisual(l) {
    if (l.image) return '<img src="' + esc(l.image) + '" alt="LOG.' + esc(l.id) + " " + esc(l.place.ja) + '" loading="lazy">';
    if (l.youtube) return '<img src="https://i.ytimg.com/vi/' + esc(l.youtube) + '/maxresdefault.jpg" alt="" loading="lazy">';
    return '<div class="ph"><span>LOG.' + esc(l.id) + "</span></div>";
  }

  function logCard(l) {
    return '<a class="card reveal" href="log.html?id=' + esc(l.id) + '">' +
      '<div class="card-img">' + logVisual(l) + "</div>" +
      '<p class="label"><span>LOG.' + esc(l.id) + "</span><span>" + esc(fmtDate(l.date)) + "</span></p>" +
      "<h3>" + esc(l.place.ja) + "</h3>" +
      '<p class="card-text">' + esc(l.summary.ja) + "</p>" +
      "</a>";
  }

  function worldItem(w) {
    var items = w.items ? '<ul class="items">' + w.items.ja.map(function (s, i) {
      return "<li>" + esc(s) + '<span class="en">' + esc(w.items.en[i]) + "</span></li>";
    }).join("") + "</ul>" : "";
    return '<section class="world-item reveal" id="' + esc(w.key) + '">' +
      '<div><p class="label">' + esc(w.label) + "</p><h3>" + esc(w.name.ja) + '<span class="en">' + esc(w.name.en) + "</span></h3></div>" +
      '<div class="world-body">' + para(w.text.ja) + items + '<p class="en">' + esc(w.text.en) + "</p></div>" +
      "</section>";
  }

  // ---------- 共通部分 ----------
  function renderChrome(page, published) {
    var nav = [["logs.html", "Logs", "logs"], ["world.html", "World", "world"], ["links.html", "Links", "links"]];
    var header = document.getElementById("site-header");
    if (header) {
      var latest = published[0];
      header.innerHTML =
        '<nav class="nav"><a class="logo" href="index.html">Last Life Log</a>' +
        '<p class="onair"><b>On Air</b>' + (latest ? "LOG." + esc(latest.id) + " ・ DAY " + esc(latest.day) : "Signal searching") + "</p>" +
        "<ul>" + nav.map(function (n) {
          return '<li><a href="' + n[0] + '"' + (page === n[2] ? ' aria-current="page"' : "") + ">" + n[1] + "</a></li>";
        }).join("") + "</ul></nav>";
    }
    var footer = document.getElementById("site-footer");
    if (footer) {
      footer.innerHTML =
        '<div class="footer-inner">' +
        '<div><a class="logo" href="index.html">Last Life Log</a><p class="end">今日の放送はここまで。<span class="en">End of today\'s broadcast.</span></p></div>' +
        '<ul class="footer-nav">' + nav.map(function (n) { return '<li><a href="' + n[0] + '">' + n[1] + "</a></li>"; }).join("") +
        '<li><a href="' + YT_CHANNEL + '" target="_blank" rel="noopener">YouTube</a></li><li><a href="privacy.html">Privacy</a></li></ul>' +
        '<p class="ai">このチャンネルでは、AIで生成したイラストと音楽を使用しています。 This channel uses AI-generated illustrations and music. © 2026 LAST LIFE LOG</p></div>';
    }
  }

  // ---------- ページごと ----------
  function renderHome(published) {
    var cards = document.getElementById("home-logs");
    if (cards) {
      cards.innerHTML = published.length
        ? published.slice(0, 3).map(logCard).join("")
        : '<p class="empty">最初の放送を準備しています。</p>';
    }
    var cap = document.getElementById("hero-caption");
    if (cap && published[0]) {
      var l = published[0];
      cap.innerHTML = '<span>LOG.' + esc(l.id) + " ・ DAY " + esc(l.day) + "</span><span>" + esc(l.place.en) + "</span>";
    }
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
      el.innerHTML = '<p class="empty">この放送は、まだ届いていません。<br><a href="logs.html">← Logs</a></p>';
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
      '<header class="log-head"><p class="label">Broadcast log ・ LOG.' + esc(l.id) + "</p><h1>" + esc(l.place.ja) + "</h1></header>" +
      '<dl class="log-meta">' +
      '<div><dt class="label">Day</dt><dd>' + esc(l.day) + "</dd></div>" +
      '<div><dt class="label">Place</dt><dd>' + esc(l.place.en) + "</dd></div>" +
      '<div><dt class="label">Weather</dt><dd>' + esc(l.weather.ja) + "</dd></div>" +
      '<div><dt class="label">On air</dt><dd>' + esc(fmtDate(l.date)) + "</dd></div></dl>" +
      media +
      '<article class="diary">' +
      '<p class="open">こちら、LAST LIFE LOG。</p>' + para(ja) +
      '<p class="close">今日の放送はここまで。</p>' +
      '<div class="diary-en">' + para(en) + "</div></article>" +
      '<nav class="pager label">' +
      (older ? '<a href="log.html?id=' + esc(older.id) + '">← LOG.' + esc(older.id) + "</a>" : "<span></span>") +
      '<a href="logs.html">All logs</a>' +
      (newer ? '<a href="log.html?id=' + esc(newer.id) + '">LOG.' + esc(newer.id) + " →</a>" : "<span></span>") +
      "</nav>";
  }

  function renderWorld(published) {
    var el = document.getElementById("world-list");
    if (!el) return;
    el.innerHTML = WORLD.filter(function (w) { return isUnlocked(w, published); }).map(worldItem).join("");
    var locked = WORLD.filter(function (w) { return !isUnlocked(w, published); }).length;
    var note = document.getElementById("world-locked");
    if (note) note.hidden = locked === 0;
  }

  // 画面に入ったものを、ふわっと表示する
  function reveal() {
    var items = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (e) { e.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    items.forEach(function (e) { io.observe(e); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var page = document.body.getAttribute("data-page");
    var published = publishedLogs();
    renderChrome(page, published);
    if (page === "home") renderHome(published);
    if (page === "logs") renderLogs(published);
    if (page === "log") renderLog(published);
    if (page === "world") renderWorld(published);
    reveal();
  });
})();
