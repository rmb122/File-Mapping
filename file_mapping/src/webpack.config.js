module.exports = {
    entry: {
        'login': './login/login.js',
        'panel': './panel/main.js'
    },
    output: {
        path: __dirname + '/../static/js/',
        filename: '[name].min.js'
    },
};