const session = require('express-session');

// Session configuration
const sessionConfig = {
    secret: 'whirlpool_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 3600000 } // 1 hour
};

module.exports = sessionConfig;