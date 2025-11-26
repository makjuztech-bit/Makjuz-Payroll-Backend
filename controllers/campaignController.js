const campaignService = require('../services/campaignService');

const createCampaign = async (req, res) => {
    try {
        console.log('Received campaign data:', req.body);
        const campaign = await campaignService.createCampaign(req.body);
        console.log('Campaign created:', campaign);
        res.status(201).json(campaign);
    } catch (error) {
        console.error('Error creating campaign:', error);
        res.status(500).json({ message: error.message, stack: error.stack });
    }
};

const getAllCampaigns = async (req, res) => {
    try {
        const campaigns = await campaignService.getAllCampaigns();
        res.status(200).json(campaigns);
    } catch (error) {
        console.error('Error fetching campaigns:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createCampaign,
    getAllCampaigns
};