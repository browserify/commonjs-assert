'use strict';

var webpack = require('webpack');

module.exports = {
    entry: {
        assert: './index.js',
        'assert.min': './index.js'
    },

    output: {
        library: 'assert',
        libraryTarget: 'umd',
        umdNamedDefine: true,
        filename: '[name].js',
        path: './dist/',
        sourcePrefix: '  '
    },

    plugins: [
        new webpack.optimize.UglifyJsPlugin({
            include: /\.min\.js$/,
            minimize: true
        })
    ]
};
