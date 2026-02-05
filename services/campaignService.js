const Campaign = require('../models/Campaign');

const createCampaign = async (campaignData) => {
    try {
        // console.log('Creating campaign with data:', campaignData);
        const campaign = new Campaign(campaignData);
        const savedCampaign = await campaign.save();
        // console.log('Campaign saved successfully:', savedCampaign);
        return savedCampaign;
    } catch (error) {
        console.error('Error creating campaign:', error);
        throw error;
    }
};

const getAllCampaigns = async () => {
    try {
        // console.log('Fetching all campaigns...');
        const campaigns = await Campaign.find().sort({ createdAt: -1 });
        // console.log('Found campaigns:', campaigns);
        return campaigns;
    } catch (error) {
        console.error('Error fetching campaigns:', error);
        throw error;
    }
};

module.exports = {
    createCampaign,
    getAllCampaigns
};