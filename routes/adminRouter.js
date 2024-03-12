const express = require('express');
const router = express.Router();

router.get('/', function(req, res, next) {
    res.render('user/login'); // Ensure this path is correct relative to your views directory
});

module.exports = router;
