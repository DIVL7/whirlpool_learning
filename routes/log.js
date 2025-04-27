const express = require('express');
const router = express.Router();

// Simple logging endpoint
router.post('/', (req, res) => {
    const { level, module, message, data, timestamp } = req.body;
    
    // Format the log message for the terminal
    let terminalMessage = `[${timestamp}] [${level}] [${module}] ${message}`;
    
    // Add color based on log level (works in most terminals)
    switch(level) {
        case 'ERROR':
            console.error('\x1b[31m%s\x1b[0m', terminalMessage);
            break;
        case 'WARNING':
            console.warn('\x1b[33m%s\x1b[0m', terminalMessage);
            break;
        case 'SUCCESS':
            console.log('\x1b[32m%s\x1b[0m', terminalMessage);
            break;
        case 'INFO':
        default:
            console.log('\x1b[36m%s\x1b[0m', terminalMessage);
    }
    
    // If there's additional data, log it separately
    if (data) {
        console.log(data);
    }
    
    // Send a simple response
    res.status(200).send({ success: true });
});

module.exports = router;