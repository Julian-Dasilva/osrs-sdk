/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  extensionsToTreatAsEsm: [".ts"],
  globals: {
    "ts-jest": {
      useESM: true,
    },
  },
  setupFiles: ["./test/setupFiles.ts"],
  transform: { "\\.png$": "<rootDir>/test/__mocks__/assetTransform.cjs" },
  moduleNameMapper: {
    "assets/images/potions/([^/]+\\([1-4]\\))\\.png$": "<rootDir>/src/assets/images/potions/$1.png",
    "^osrs-sdk$": "<rootDir>/src/index.ts",
    "^osrs-sdk-react$": "<rootDir>/packages/osrs-sdk-react/src/index.ts",
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "\\.(jpg|ico|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|ogg|glb)$":
      "<rootDir>/test/__mocks__/assetMock.js",
    "\\.(css|less)$": "<rootDir>/test/__mocks__/cssMock.js",
    three: require.resolve("three"),
  },
};
