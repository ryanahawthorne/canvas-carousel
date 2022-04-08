const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: [
        `${__dirname}/src/index.js`
    ],
    output: {
        path: `${__dirname}/dist`,
        filename: 'index.js'
    },
    module: {
        rules: [
          {
            test: /\.js$/,
            exclude: /(node_modules)/,
            use: {
              loader: "babel-loader",
              options: {
                presets: ["@babel/preset-env"]
              }
            }
          }
        ]
    },
    plugins: [    
        new HtmlWebpackPlugin({
          template: `${__dirname}/src/index.html`,
        })
    ]
}