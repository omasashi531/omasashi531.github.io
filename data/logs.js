// ===============================================================
// 放送記録（LOG）のデータ
// ---------------------------------------------------------------
// 新しいLOGを足すときは、いちばん下の { ... } をまねして1つ追加するだけ。
// ・date（公開日）が来るまで、サイトには表示されない（予約投稿と同じ考え方）
// ・youtube には動画URLの「v=」のうしろ（11文字）を入れる。空なら「まもなく放送」
// ・image には背景画像の場所（例："img/logs/001.jpg"）。空なら色の帯で代わりに表示
// ・diary（日記）が空のときは、summary（あらすじ）を表示する
// ===============================================================
window.LLL_LOGS = [
  {
    id: "001",
    day: 412,
    date: "2026-10-24",
    place:   { ja: "旧市街の高架道路", en: "The old town overpass" },
    weather: { ja: "朝靄のち晴れ", en: "Morning mist, then clear" },
    summary: {
      ja: "街が白い靄に沈む朝。錆びた線路に朝露。霧が晴れたら、遠くまで歩くと決めた。",
      en: "A morning when the town sank into white mist. Dew on the rusted rails. When the fog lifts, I'll walk somewhere far."
    },
    diary: { ja: "", en: "" },
    youtube: "",
    image: ""
  },
  {
    id: "002",
    day: 416,
    date: "2026-10-31",
    place:   { ja: "廃遊園地", en: "The abandoned amusement park" },
    weather: { ja: "快晴", en: "Clear sky" },
    summary: {
      ja: "はじめての霜。メリーゴーランドの馬が白くなっていた。冬が近い。",
      en: "The first frost. The carousel horses had turned white. Winter is close."
    },
    diary: { ja: "", en: "" },
    youtube: "",
    image: ""
  },
  {
    id: "003",
    day: 423,
    date: "2026-11-07",
    place:   { ja: "風車の丘", en: "The windmill hill" },
    weather: { ja: "秋晴れ", en: "Clear autumn sky" },
    summary: {
      ja: "雲ひとつない高い空。止まった風車の下で寝ころんだ。もう少し遠くまで歩ける気がする。",
      en: "A high sky without a single cloud. I lay down under the stopped windmill. I feel like I can walk a little farther."
    },
    diary: { ja: "", en: "" },
    youtube: "",
    image: ""
  }
];
