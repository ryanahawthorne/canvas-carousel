module.exports = {
  plugins: [
    "@babel/plugin-syntax-dynamic-import",
    "@babel/plugin-proposal-class-properties",
    "@babel/plugin-proposal-optional-chaining"
  ],
  presets: [
    [
      '@babel/preset-env', // enables es6+ things
      {
        targets: {
          node: 'current',
        },
      },
    ],
    '@babel/preset-react', // jest cannot understand jsx syntax without this
  ],
};