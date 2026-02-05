const benefitService = require('../services/benefitService');

const benefitController = {
  createBenefit: async (req, res) => {
    try {
      const benefit = await benefitService.createBenefit(req.body);
      res.status(201).json(benefit);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getBenefits: async (req, res) => {
    try {
      const companyId = req.params.companyId || req.query.companyId;
      if (!companyId) {
        return res.status(400).json({ message: 'Company ID is required' });
      }
      const benefits = await benefitService.getBenefits(companyId);
      res.json(benefits);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getBenefitById: async (req, res) => {
    try {
      const benefit = await benefitService.getBenefitById(req.params.id);
      if (!benefit) {
        return res.status(404).json({ message: 'Benefit not found' });
      }
      res.json(benefit);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  updateBenefit: async (req, res) => {
    try {
      const benefit = await benefitService.updateBenefit(req.params.id, req.body);
      if (!benefit) {
        return res.status(404).json({ message: 'Benefit not found' });
      }
      res.json(benefit);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  deleteBenefit: async (req, res) => {
    try {
      const benefit = await benefitService.deleteBenefit(req.params.id);
      if (!benefit) {
        return res.status(404).json({ message: 'Benefit not found' });
      }
      res.json({ message: 'Benefit deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = benefitController;