// ===============================================================
// LAST LIFE LOG 公式サイトの共通プログラム
// ・ヘッダー（メニューと ON AIR）、フッターを全ページに入れる
// ・data/logs.js と data/world.js から、一覧（アーカイブ）や中身を作る
// ・文字のノイズ、1文字ずつ打ち出す動き
// ページごとの処理は <body data-page="..."> の名前で切り替える
// ===============================================================
(function () {
  "use strict";

  var YT_CHANNEL = "https://www.youtube.com/@lastlifelog";
  var LOGS = window.LLL_LOGS || [];
  var WORLD = window.LLL_WORLD || [];
  var REPLIES = 0; // 受信者からの返事の数（いまは0件。世界観の小ネタ）
  var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
  function para(s) {
    return esc(s).split(/\n+/).map(function (p) { return "<p>" + p + "</p>"; }).join("");
  }
  function fmtDate(s) { return s ? s.replace(/-/g, ".") : ""; }
  function pad2(n) { return (n < 10 ? "0" : "") + n; }

  // 背景画像があれば画像、なければ「NO SIGNAL」
  function logVisual(l) {
    if (l.image) return '<img src="' + esc(l.image) + '" alt="LOG.' + esc(l.id) + " " + esc(l.place.ja) + '" loading="lazy">';
    // YouTubeのサムネイル（大きいサイズが無い動画は、ふつうのサイズに切り替える）
    if (l.youtube) return '<img src="https://i.ytimg.com/vi/' + esc(l.youtube) + '/maxresdefault.jpg" alt="LOG.' + esc(l.id) + " " + esc(l.place.ja) + '" loading="lazy"' +
      ' onerror="this.onerror=null;this.src=\'https://i.ytimg.com/vi/' + esc(l.youtube) + '/hqdefault.jpg\'">';
    return '<div class="ph"><span>LOG.' + esc(l.id) + "</span></div>";
  }

  // ---------- アーカイブ（左に一覧、右に中身） ----------
  // rows: [{ html: 行の中身, href: 行のリンク（なければボタン）, panel: 右に出すHTML, broken: 壊れた行 }]
  function archive(el, rows) {
    var list = '<ul class="rows">' + rows.map(function (r, i) {
      if (r.broken) return '<li><div class="row band is-broken" aria-disabled="true">' + r.html + "</div></li>";
      return "<li>" + (r.href
        ? '<a class="row band" data-i="' + i + '" href="' + r.href + '">' + r.html + "</a>"
        : '<button type="button" class="row band" data-i="' + i + '">' + r.html + "</button>") + "</li>";
    }).join("") + "</ul>";
    el.innerHTML = list + '<div class="panel frame"></div>';
    var panel = el.querySelector(".panel");
    var buttons = el.querySelectorAll(".row[data-i]");
    var current = -1;
    function select(i) {
      if (i === current) return;
      current = i;
      buttons.forEach(function (b) { b.classList.toggle("is-active", +b.getAttribute("data-i") === i); });
      panel.innerHTML = rows[i].panel;
      panel.classList.remove("is-swap"); void panel.offsetWidth; panel.classList.add("is-swap");
      setupGlitch(panel);
    }
    buttons.forEach(function (b) {
      var i = +b.getAttribute("data-i");
      b.addEventListener("mouseenter", function () { select(i); });
      b.addEventListener("focus", function () { select(i); });
      if (!rows[i].href) b.addEventListener("click", function () { select(i); });
    });
    if (buttons.length) select(+buttons[0].getAttribute("data-i"));
  }

  function logRows(list, withBroken) {
    var n = list.length;
    var rows = list.map(function (l, i) {
      return {
        href: "log.html?id=" + esc(l.id),
        html: '<span class="no">' + pad2(n - i) + '</span><span class="ttl">' + esc(l.place.ja) + '</span><span class="day">DAY ' + esc(l.day) + "</span>",
        panel:
          '<div class="panel-head"><span class="label sq">LOG.' + esc(l.id) + '</span><span class="label">DAY ' + esc(l.day) + "</span></div>" +
          '<div class="panel-img">' + logVisual(l) + "</div>" +
          '<div class="panel-body"><h3>' + esc(l.place.ja) + "</h3>" +
          '<p class="panel-meta label">' + (l.place.en ? "<span>" + esc(l.place.en) + "</span>" : "") + "<span>" + esc(l.weather.en || l.weather.ja) + "</span><span>受信 " + esc(fmtDate(l.date)) + "</span></p>" +
          "<p>" + esc(l.summary.ja) + (l.summary.en ? '<span class="en">' + esc(l.summary.en) + "</span>" : "") + "</p>" +
          '<a class="go band" href="log.html?id=' + esc(l.id) + '">記録を読む →</a></div>'
      };
    });
    // 読めない記録は、いつも一覧のいちばん上に置く（その下に、新しい順のLOG）
    if (withBroken) {
      rows.unshift({ broken: true, html: '<span class="no">--</span><span class="ttl">░░░ データ破損</span><span class="day">DAY ???</span>' });
    }
    return rows;
  }

  // ---------- 共通部分 ----------
  function renderChrome(page, published) {
    var nav = [["logs.html", "Logs", "logs"], ["world.html", "World", "world"], ["links.html", "Links", "links"]];
    var header = document.getElementById("site-header");
    if (header) {
      var latest = published[0];
      header.innerHTML =
        '<nav class="nav"><a class="logo" href="index.html" data-glitch>Last Life Log</a>' +
        '<p class="status"><b>On Air</b><span>' + (latest ? "DAY " + esc(latest.day) : "Signal searching") + "</span><span>返信 " + REPLIES + "件</span></p>" +
        '<ul class="menu">' + nav.map(function (n) {
          return '<li><a class="band" href="' + n[0] + '"' + (page === n[2] ? ' aria-current="page"' : "") + ">" + n[1] + "</a></li>";
        }).join("") + "</ul></nav>";
    }
    var footer = document.getElementById("site-footer");
    if (footer) {
      footer.innerHTML =
        '<div class="footer-inner">' +
        '<div><p class="label sq" style="margin:0">End of transmission</p><p class="end">今日の放送はここまで。<span class="en">End of today\'s broadcast.</span></p></div>' +
        '<ul class="footer-nav">' + nav.map(function (n) { return '<li><a class="band" href="' + n[0] + '">' + n[1] + "</a></li>"; }).join("") +
        '<li><a class="band" href="' + YT_CHANNEL + '" target="_blank" rel="noopener">YouTube</a></li><li><a class="band" href="privacy.html">Privacy</a></li></ul>' +
        '<p class="ai">このチャンネルでは、AIで生成したイラストと音楽を使用しています。 This channel uses AI-generated illustrations and music. © 2026 LAST LIFE LOG</p></div>';
    }
  }

  // ---------- ページごと ----------
  function renderHome(published) {
    var el = document.getElementById("home-archive");
    if (el) {
      if (published.length) archive(el, logRows(published.slice(0, 5), true));
      else el.innerHTML = '<p class="empty">最初の放送を準備しています。</p>';
    }
    var bar = document.getElementById("hero-bar");
    if (bar && published[0]) {
      bar.innerHTML = '<span class="label sq">受信映像 // LOG.' + esc(published[0].id) + '</span><span class="label">DAY ' + esc(published[0].day) + "</span>";
    }
  }

  function renderLogs(published) {
    var el = document.getElementById("all-logs");
    if (!el) return;
    if (published.length) archive(el, logRows(published, true));
    else el.innerHTML = '<p class="empty">最初の放送を準備しています。</p>';
  }

  function renderLog(published) {
    var el = document.getElementById("log-detail");
    if (!el) return;
    var id = new URLSearchParams(location.search).get("id");
    var idx = -1;
    published.forEach(function (l, i) { if (l.id === id) idx = i; });
    if (idx < 0) {
      el.innerHTML = '<p class="empty">この記録は、まだ受信できていません。<br><a class="u" href="logs.html">Logs へ戻る</a></p>';
      return;
    }
    var l = published[idx];
    document.title = "LOG." + l.id + " " + l.place.ja + " | LAST LIFE LOG";
    var media = l.youtube
      ? '<iframe src="https://www.youtube-nocookie.com/embed/' + esc(l.youtube) + '" title="LOG.' + esc(l.id) + '" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>'
      : logVisual(l);
    var ja = l.diary && l.diary.ja ? l.diary.ja : l.summary.ja;
    var en = l.diary && l.diary.en ? l.diary.en : l.summary.en;
    var newer = published[idx - 1], older = published[idx + 1];
    el.innerHTML =
      '<header class="log-head"><p class="label sq">記録データ // LOG.' + esc(l.id) + '</p><h1 data-glitch>' + esc(l.place.ja) + "</h1></header>" +
      '<dl class="log-meta">' +
      '<div><dt class="label">Day</dt><dd>' + esc(l.day) + "</dd></div>" +
      '<div><dt class="label">Place</dt><dd>' + esc(l.place.en || l.place.ja) + "</dd></div>" +
      '<div><dt class="label">Weather</dt><dd>' + esc(l.weather.ja) + "</dd></div>" +
      '<div><dt class="label">Received</dt><dd>' + esc(fmtDate(l.date)) + "</dd></div></dl>" +
      '<div class="media frame"><div class="hero-bar"><span class="label sq">受信映像</span><span class="label">LOG.' + esc(l.id) + '</span></div><div class="video">' + media + "</div></div>" +
      '<article class="diary">' +
      '<p class="open">こちら、LAST LIFE LOG。</p>' + para(ja) +
      '<p class="close">今日の放送はここまで。</p>' +
      '<div class="diary-en">' + para(en) + "</div></article>" +
      '<nav class="pager">' +
      (older ? '<a class="band" href="log.html?id=' + esc(older.id) + '">← LOG.' + esc(older.id) + "</a>" : "<span></span>") +
      '<a class="band" href="logs.html">All logs</a>' +
      (newer ? '<a class="band" href="log.html?id=' + esc(newer.id) + '">LOG.' + esc(newer.id) + " →</a>" : "<span></span>") +
      "</nav>";
  }

  function renderWorld(published) {
    var el = document.getElementById("world-list");
    if (!el) return;
    var n = 0;
    var rows = WORLD.map(function (w) {
      n++;
      if (!isUnlocked(w, published)) {
        return { broken: true, html: '<span class="no">' + pad2(n) + '</span><span class="ttl">？？？ ── 未受信</span><span class="day">LOCKED</span>' };
      }
      var items = w.items ? '<ul class="items">' + w.items.ja.map(function (s, i) {
        return "<li>" + esc(s) + '<span class="en">' + esc(w.items.en[i]) + "</span></li>";
      }).join("") + "</ul>" : "";
      return {
        html: '<span class="no">' + pad2(n) + '</span><span class="ttl">' + esc(w.name.ja) + '</span><span class="day">' + esc(w.label) + "</span>",
        panel:
          '<div class="panel-head"><span class="label sq">' + esc(w.label) + '</span><span class="label">' + pad2(n) + "</span></div>" +
          '<div class="panel-body" style="padding-top:20px"><h3>' + esc(w.name.ja) + '<span class="en">' + esc(w.name.en) + "</span></h3>" +
          para(w.text.ja) + items + '<p class="en">' + esc(w.text.en) + "</p></div>"
      };
    });
    el.classList.add("archive", "world-panel");
    archive(el, rows);
  }

  // ---------- 文字のノイズ ----------
  var glitchTargets = [];
  function setupGlitch(root) {
    (root || document).querySelectorAll("[data-glitch]").forEach(function (e) {
      if (e.classList.contains("glitch")) return;
      e.classList.add("glitch");
      e.setAttribute("data-text", e.textContent);
      glitchTargets.push(e);
    });
  }
  var NOISE = "░▒▓#%&/<>_=+*";
  function scramble(e) {
    var orig = e.getAttribute("data-text");
    if (!orig || e.children.length) return;
    var chars = orig.split("");
    for (var k = 0; k < Math.min(3, chars.length); k++) {
      var p = Math.floor(Math.random() * chars.length);
      if (chars[p] !== " ") chars[p] = NOISE.charAt(Math.floor(Math.random() * NOISE.length));
    }
    e.textContent = chars.join("");
    setTimeout(function () { e.textContent = orig; }, 140);
  }
  function noiseLoop() {
    var live = glitchTargets.filter(function (e) {
      if (!document.body.contains(e)) return false;
      var r = e.getBoundingClientRect();
      return r.bottom > 0 && r.top < innerHeight;
    });
    if (live.length) {
      var e = live[Math.floor(Math.random() * live.length)];
      e.classList.add("is-noise");
      if (Math.random() < .5) scramble(e);
      setTimeout(function () { e.classList.remove("is-noise"); }, 340);
    }
    setTimeout(noiseLoop, 2500 + Math.random() * 4500); // 2.5〜7秒に1回
  }

  // ---------- 1文字ずつ打ち出す ----------
  function typeOut() {
    document.querySelectorAll("[data-type]").forEach(function (e) {
      var text = e.textContent;
      if (calm) return;
      e.textContent = "";
      e.classList.add("typing");
      var i = 0;
      (function step() {
        e.textContent = text.slice(0, ++i);
        if (i < text.length) setTimeout(step, 70 + Math.random() * 60);
        else setTimeout(function () { e.classList.remove("typing"); e.setAttribute("data-text", text); }, 1200);
      })();
    });
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

  // メールアドレスは、迷惑メールの業者に集められにくいように、ページを開いたときに組み立てる
  function setupMail() {
    document.querySelectorAll("[data-mail]").forEach(function (a) {
      var addr = a.getAttribute("data-mail") + "@" + "lastlifelog.com";
      a.href = "mailto:" + addr;
      var t = a.querySelector(".mail-text");
      if (t) t.textContent = addr;
      // メールアプリが入っていない端末では何も起きないので、押したらアドレスもコピーして知らせる
      a.addEventListener("click", function () {
        copyText(addr);
        if (!t) return;
        t.textContent = "アドレスをコピーしました。メールアプリが開かないときは、貼り付けて送ってください";
        clearTimeout(a._timer);
        a._timer = setTimeout(function () { t.textContent = addr; }, 5000);
      });
    });
  }
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).catch(function () { copyFallback(text); });
    } else {
      copyFallback(text);
    }
  }
  function copyFallback(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    ta.remove();
  }

  document.addEventListener("DOMContentLoaded", function () {
    setupMail();
    var page = document.body.getAttribute("data-page");
    // 背景の電波の輪・砂ぼこり（ページのいちばん後ろ）
    var atmos = document.createElement("div");
    atmos.className = "atmos";
    atmos.setAttribute("aria-hidden", "true");
    atmos.innerHTML = "<span></span><span></span><span></span>";
    document.body.insertBefore(atmos, document.body.firstChild);
    var published = publishedLogs();
    renderChrome(page, published);
    if (page === "home") renderHome(published);
    if (page === "logs") renderLogs(published);
    if (page === "log") renderLog(published);
    if (page === "world") renderWorld(published);
    setupGlitch();
    typeOut();
    reveal();
    if (!calm) setTimeout(noiseLoop, 2000);
  });
})();
