# omasashi531.github.io

LAST LIFE LOG の公式サイト（https://lastlifelog.com ）。GitHub Pages で無料公開。

| ファイル | 中身 |
|---|---|
| `index.html` | トップ |
| `logs.html` / `log.html?id=001` | 放送記録の一覧 / 各LOGのページ |
| `world.html` | 世界観 |
| `links.html` | リンク |
| `privacy.html` | プライバシーポリシー（Googleの同意画面で使用。**場所を変えない**） |
| `data/logs.js` | **LOGのデータ**。新しいLOGはここに1つ足すだけ。公開日（date）が来ると自動で表示 |
| `data/world.js` | 世界観のデータ。`unlock` のLOGが公開されると表示（ノイズは LOG.004 から、北の放送塔は未公開） |
| `img/hero.svg` | トップの仮の絵（霧の街）。`img/hero.jpg` を置くと、そちらが上に表示される |
| `img/logs/` | 各LOGの背景画像（例：`001.jpg`、横1280px・300KB以下が目安） |
| `style.css` / `js/site.js` | 見た目 / 共通のプログラム |

- 動画ファイルは置かない（YouTubeを埋め込む）。
- **YouTubeの動画は自動で入る**：`.github/workflows/youtube-sync.yml` が1時間に1回、チャンネルの新着を見て、タイトルに「LOG.004」などの番号がある動画を、同じ番号のLOGに入れる（youtube が空のときだけ。ショートは使わない）。
