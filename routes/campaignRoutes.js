const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');
const auth = require('../middleware/auth');

router.post('/', auth, campaignController.createCampaign);
router.get('/', auth, campaignController.getAllCampaigns);

module.exports = router;