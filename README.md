# omasashi531.github.io

LAST LIFE LOG の公式サイト（https://lastlifelog.com ）。GitHub Pages で無料公開。

| ファイル | 中身 |
|---|---|
| `index.html` | トップ |
| `logs.html` / `log.html?id=001` | 放送記録の一覧 / 各LOGのページ |
| `world.html` | 世界観 |
| `links.html` | リンク |
| `radio.html` / `js/radio.js` | 受信機（公開済みのLOGの動画を、新しい順にずっと流す。YouTube の IFrame Player API） |
| `privacy.html` | プライバシーポリシー（Googleの同意画面で使用。**場所を変えない**） |
| `data/logs.js` | **LOGのデータ**。新しいLOGはここに1つ足すだけ。公開日（date）が来ると自動で表示 |
| `data/reports.js` | **受信報告の数**（YouTubeのコメント数）。自動で書きかわるので、手で直さない |
| `data/world.js` | 世界観のデータ。`unlock` のLOGが公開されると表示（ノイズは LOG.004 から、北の放送塔は未公開） |
| `img/hero.svg` | トップの仮の絵（霧の街）。`img/hero.jpg` を置くと、そちらが上に表示される |
| `img/logs/` | 各LOGの背景画像（例：`001.jpg`、横1280px・300KB以下が目安） |
| `style.css` / `js/site.js` | 見た目 / 共通のプログラム |

- 動画ファイルは置かない（YouTubeを埋め込む）。
- **LOGはYouTubeから自動で作られる**：`.github/workflows/youtube-sync.yml` が1時間に1回、YouTube Data API（Secrets の `YOUTUBE_API_KEY`）でチャンネルの動画を見る。タイトルに「LOG.004」などの番号がある動画（ショートは除く）の説明文から、DAY・場所・天気・日記（日本語・英語）を読み、`data/logs.js` に新しいLOGを作る。すでにあるLOGは空の欄（動画・日記）だけ埋め、手で書いた内容は消さない。公開日はYouTubeで公開された日になる。絵はYouTubeのサムネイル（`image` を書けば、その画像が優先）。
- **受信報告**：視聴者のYouTubeコメントを「この放送を受信した報告」として扱う（彼女は知らない設定なので、ヘッダーの「返信 0件」はそのまま）。同じ自動更新が各LOGの動画のコメント数を読み、`data/reports.js` に書く。ヘッダーに合計、LOGのページにそのLOGの数と「受信報告を送る」ボタン（YouTubeへ）、World の「受信者」に合計が出る。コメントの本文はサイトに載せない。数には自分のコメント・返信も入る。
- **LOGと世界観のリンク**：`data/world.js` の `unlock` にLOG番号を書くと、World のその項目に「LOG.004 の放送で受信 →」が付き、LOGのページにも「この放送で分かったこと」として出る。`world.html#noise` のように、URLのうしろに `key` を付けるとその項目が開く。
