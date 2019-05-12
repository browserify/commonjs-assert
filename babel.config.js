const presets = [
  [
    "@babel/env",
    {
      targets: {
        edge: "18",
        firefox: "66",
        chrome: "73",
        safari: "12",
        ie: "11"
      }
    },
  ],
];

module.exports = {presets};
