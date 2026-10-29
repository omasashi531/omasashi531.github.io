// ===============================================================
// 受信機ページ（radio.html）
// ・公開済みで YouTube の動画があるLOGを、新しい順に並べて、順番にずっと流す
// ・最初の1回は「受信を開始する」を押してもらう（ブラウザは音の出る自動再生を止めるため）
// ・動画は YouTube の埋め込み（IFrame Player API）。規約どおり、プレーヤーは隠さずに見せる
// ===============================================================
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function today() {
    return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
  }

  // 流せるLOG（公開日が来ていて、YouTube の動画があるもの）を新しい順に
  var t = today();
  var queue = (window.LLL_LOGS || [])
    .filter(function (l) { return l.date && l.date <= t && l.youtube; })
    .sort(function (a, b) { return b.id.localeCompare(a.id); });

  var player = null, current = 0, playing = false, typingTimer = null;

  // ---------- 画面の表示 ----------
  function renderQueue() {
    $("rd-queue").innerHTML = queue.map(function (l, i) {
      return '<li><button type="button" class="row band' + (i === current && player ? " is-active" : "") + '" data-i="' + i + '">' +
        '<span class="no">LOG.' + esc(l.id) + '</span><span class="ttl">' + esc(l.place.ja) + '</span><span class="day">DAY ' + esc(l.day) + "</span></button></li>";
    }).join("");
  }

  function showLog(l) {
    $("rd-status").textContent = (playing ? "受信中" : "一時停止") + " // LOG." + l.id;
    $("rd-day").textContent = "DAY " + l.day;
    var place = $("rd-place");
    place.textContent = l.place.ja;
    place.setAttribute("data-text", l.place.ja);
    $("rd-meta").textContent = [l.place.en, l.weather.en || l.weather.ja].filter(Boolean).join(" ・ ");
    typeDiary(l);
    renderQueue();
  }

  // 日記を1文字ずつ打ち出す
  function typeDiary(l) {
    clearTimeout(typingTimer);
    var ja = (l.diary && l.diary.ja) || l.summary.ja;
    var en = (l.diary && l.diary.en) || l.summary.en || "";
    var lines = ["こちら、LAST LIFE LOG。"].concat(ja.split("\n"), ["今日の放送はここまで。"]);
    var box = $("rd-diary");
    // 最初と最後の決まり文句は、うすい色にする
    box.innerHTML = lines.map(function (_, i) { return i === 0 || i === lines.length - 1 ? '<p class="fixed"></p>' : "<p></p>"; }).join("") + (en ? '<p class="en">' + esc(en).replace(/\n/g, "<br>") + "</p>" : "");
    var ps = box.querySelectorAll("p");
    if (calm) { lines.forEach(function (s, i) { ps[i].textContent = s; }); return; }
    var li = 0, ci = 0;
    (function step() {
      if (li >= lines.length) return;
      ps[li].textContent = lines[li].slice(0, ++ci);
      if (ci >= lines[li].length) { li++; ci = 0; typingTimer = setTimeout(step, 500); }
      else typingTimer = setTimeout(step, 60);
    })();
  }

  function setPlaying(on) {
    playing = on;
    $("rd-toggle").textContent = on ? "一時停止" : "▶ 再開";
    $("rd-status").textContent = (on ? "受信中" : "一時停止") + " // LOG." + queue[current].id;
    document.body.classList.toggle("is-receiving", on);
  }

  // ---------- 再生 ----------
  function play(i) {
    current = (i + queue.length) % queue.length; // 最後まで行ったら最初（最新）へ戻る
    showLog(queue[current]);
    if (player && player.loadVideoById) player.loadVideoById(queue[current].youtube);
  }

  function loadApi(cb) {
    if (window.YT && window.YT.Player) return cb();
    window.onYouTubeIframeAPIReady = cb;
    var s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    s.onerror = function () { $("rd-status").textContent = "受信できませんでした // 通信を確認してください"; };
    document.head.appendChild(s);
  }

  function start() {
    $("rd-start").disabled = true;
    $("rd-status").textContent = "周波数を合わせています…";
    loadApi(function () {
      $("rd-standby").hidden = true;
      player = new YT.Player("rd-player", {
        videoId: queue[current].youtube,
        playerVars: { autoplay: 1, playsinline: 1, rel: 0 },
        events: {
          onReady: function (e) { e.target.playVideo(); },
          onStateChange: function (e) {
            if (e.data === YT.PlayerState.PLAYING) setPlaying(true);
            else if (e.data === YT.PlayerState.PAUSED) setPlaying(false);
            else if (e.data === YT.PlayerState.ENDED) play(current + 1); // 次の放送へ
          },
          // 埋め込みできない動画などは、少し待って次へ
          onError: function () {
            $("rd-status").textContent = "ノイズが強く、受信できません // 次の放送へ";
            setTimeout(function () { play(current + 1); }, 3000);
          }
        }
      });
      ["rd-prev", "rd-toggle", "rd-next"].forEach(function (id) { $(id).disabled = false; });
      showLog(queue[current]);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!queue.length) {
      $("rd-start").disabled = true;
      $("rd-status").textContent = "受信できる放送がまだありません";
      $("rd-diary").innerHTML = '<p class="radio-wait">最初の放送を準備しています。</p>';
      return;
    }
    renderQueue();
    $("rd-day").textContent = "DAY " + queue[0].day;
    $("rd-start").addEventListener("click", start);
    $("rd-prev").addEventListener("click", function () { play(current - 1); });
    $("rd-next").addEventListener("click", function () { play(current + 1); });
    $("rd-toggle").addEventListener("click", function () {
      if (!player || !player.getPlayerState) return;
      if (playing) player.pauseVideo(); else player.playVideo();
    });
    // 「放送の順番」から選ぶ（受信前なら、そこから受信を始める）
    $("rd-queue").addEventListener("click", function (e) {
      var b = e.target.closest("[data-i]");
      if (!b) return;
      var i = +b.getAttribute("data-i");
      if (player) play(i);
      else { current = i; start(); }
    });
  });
})();
