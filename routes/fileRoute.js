const express = require('express');
const { body, validationResult } = require('express-validator');

const router = express.Router();

const fileControllers = require('../controllers/fileControllers')

router.post('/upload',[
    body('name').not().isEmpty(),
    body('description').not().isEmpty(),
    body('emailTo').not().isEmpty().isEmail(),
], fileControllers.uploadS3);
router.get('/file/:slug', fileControllers.getFile);

module.exports = router;
