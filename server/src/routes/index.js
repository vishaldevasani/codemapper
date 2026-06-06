const express = require('express');
const router = express.Router();
const analyzeController = require('../controllers/analyzeController');
const summaryController = require('../controllers/summaryController');
const searchController = require('../controllers/searchController');

router.post('/analyze', analyzeController.analyze);
router.post('/summary', summaryController.summary);
router.post('/search', searchController.search);

module.exports = router;
