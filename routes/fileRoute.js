const express = require('express');
const router = express.Router();

const fileControllers = require('../controllers/fileControllers')

router.post('/upload', fileControllers.uploadFile);
router.get('/file/:slug', fileControllers.getFile);

module.exports = router;
