// ===============================================================
// 世界観ページのデータ
// ---------------------------------------------------------------
// unlock に LOG番号を書くと、そのLOGが公開された日から表示される。
// unlock が null のものは、まだ表示しない（書き直すまで隠れたまま）。
// unlock が "000" のものは、最初から表示する。
// ===============================================================
window.LLL_WORLD = [
  {
    key: "girl",
    unlock: "000",
    label: "THE GIRL",
    name: { ja: "彼女", en: "Her" },
    text: {
      ja: "文明が終わったあとの世界で、ひとりで生きている少女。名前は、まだ誰も知らない。短い銀髪に、大きすぎるオリーブ色の軍用ジャケット。首にはヘッドホン。淡々としていて、たまに少しだけユーモアがある。",
      en: "A girl living alone in a world after the end of civilization. No one knows her name yet. Short silver hair, an oversized olive military jacket, headphones around her neck. Calm and plain, with a little humor now and then."
    },
    items: {
      ja: ["誰のものだったか分からないヘッドホン", "日記帳（LOGの元になる）", "小さな送信機", "何でも直すドライバー1本"],
      en: ["Headphones that once belonged to someone", "A diary (where every LOG begins)", "A small transmitter", "One screwdriver that fixes anything"]
    }
  },
  {
    key: "radio",
    unlock: "000",
    label: "THE BROADCAST",
    name: { ja: "放送", en: "The broadcast" },
    text: {
      ja: "彼女は毎日、見たもの・したこと・感じたことを短い記録にして、音楽にして電波に流している。誰かに届くと信じているけれど、返事はまだ一度もない。——このページを見ているあなたが、その「誰か」かもしれない。",
      en: "Every day she turns what she saw, did and felt into a short log, makes it into music and sends it out over the air. She believes it reaches someone, though no reply has ever come. — You, reading this, might be that someone."
    }
  },
  {
    key: "rooftop",
    unlock: "000",
    label: "THE ROOFTOP",
    name: { ja: "屋上の放送室", en: "The rooftop studio" },
    text: {
      ja: "古いビルの屋上にある、彼女の拠点。アンテナと、拾い集めた機材と、いくつかの植木鉢。昼は街を歩き、夜はここから放送する。",
      en: "Her base on the roof of an old building. An antenna, scavenged equipment and a few flowerpots. She walks the town by day and broadcasts from here at night."
    }
  },
  {
    key: "world",
    unlock: "000",
    label: "THE WORLD",
    name: { ja: "終わった世界", en: "The ended world" },
    text: {
      ja: "なぜ文明が終わったのかは、誰も知らない。街は静かで、季節だけがきちんと進んでいく。いまは晩秋。もうすぐ冬が来る。",
      en: "No one knows why civilization ended. The towns are quiet, and only the seasons keep moving on time. It is late autumn now. Winter is coming soon."
    }
  },
  {
    key: "noise",
    unlock: "004",
    label: "THE CAT",
    name: { ja: "ノイズ", en: "Noise" },
    text: {
      ja: "黒猫。鳴き声がかすれているから、ノイズ。いつもそばにいるわけではなく、来たり、いなくなったりする。",
      en: "A black cat, named Noise for its raspy meow. It isn't always around — it comes and goes as it pleases."
    }
  },
  {
    key: "tower",
    unlock: null,
    label: "THE TOWER",
    name: { ja: "北の放送塔", en: "The northern tower" },
    text: {
      ja: "もっと遠くまで届く、北にある大きな放送塔。",
      en: "A great broadcast tower in the north that reaches much farther."
    }
  }
];
