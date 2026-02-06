const ANSWER_KEY_REGISTRY = {
  garasje: ["g1", "g2", "g3", "g4", "g5", "g6", "g7"],
  fasadeendring: ["v1", "v2", "v3", "v4", "v5"],
  tilbygg: [
    "tilbygg-area",
    "tilbygg-height",
    "tilbygg-distance",
    "tilbygg-regulated",
    "tilbygg-special",
  ],
  paabygg: [
    "paabygg-area",
    "paabygg-height",
    "paabygg-distance",
    "paabygg-regulated",
    "paabygg-special",
  ],
  terrasse: [
    "terrasse-area",
    "terrasse-height",
    "terrasse-distance",
    "terrasse-regulated",
    "terrasse-special",
  ],
  bod: ["bod-area", "bod-height", "bod-distance", "bod-regulated", "bod-special"],
  takendring: [
    "takendring-area",
    "takendring-height",
    "takendring-distance",
    "takendring-regulated",
    "takendring-special",
  ],
  stottemur: [
    "stottemur-area",
    "stottemur-height",
    "stottemur-distance",
    "stottemur-regulated",
    "stottemur-special",
  ],
  bruksendring: [
    "bruksendring-area",
    "bruksendring-height",
    "bruksendring-distance",
    "bruksendring-regulated",
    "bruksendring-special",
  ],
  riving: [
    "riving-area",
    "riving-height",
    "riving-distance",
    "riving-regulated",
    "riving-special",
  ],
};

const ALL_ANSWER_KEYS = new Set(
  Object.values(ANSWER_KEY_REGISTRY).flat(),
);

module.exports = {
  ANSWER_KEY_REGISTRY,
  ALL_ANSWER_KEYS,
};
