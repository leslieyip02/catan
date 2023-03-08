const path = require("path");

module.exports = {
    entry: "./src/index.tsx",
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "index.js",
    },
    module: {
        rules: [
            {
                use: "ts-loader",
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        alias: {
            react: path.resolve("./node_modules/react"),
        },
        extensions: [".js", ".jsx", ".ts", ".tsx"],
    },
    devtool: "eval-source-map",
};