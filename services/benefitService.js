const Benefit = require('../models/Benefit');

const benefitService = {
  createBenefit: async (benefitData) => {
    try {
      const benefit = new Benefit(benefitData);
      return await benefit.save();
    } catch (error) {
      throw error;
    }
  },

  getBenefits: async (companyId) => {
    try {
      return await Benefit.find({ company: companyId });
    } catch (error) {
      throw error;
    }
  },

  getBenefitById: async (id) => {
    try {
      return await Benefit.findById(id);
    } catch (error) {
      throw error;
    }
  },

  updateBenefit: async (id, updateData) => {
    try {
      return await Benefit.findByIdAndUpdate(id, updateData, { new: true });
    } catch (error) {
      throw error;
    }
  },

  deleteBenefit: async (id) => {
    try {
      return await Benefit.findByIdAndDelete(id);
    } catch (error) {
      throw error;
    }
  }
};

module.exports = benefitService;