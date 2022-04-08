const HtmlWebpackPlugin = require('html-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');

module.exports = (env, argv) => {
    const config = {
        entry: [
            `${__dirname}/src/index.js`
        ],
        output: {
            path: `${__dirname}/dist`,
            filename: 'index.js'
        },
        devServer: {
            contentBase: './dist',
            hot: true,
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
                template: `${__dirname}/src/index.html`
            }),
            new ESLintPlugin()
        ]
    };

    return config
};