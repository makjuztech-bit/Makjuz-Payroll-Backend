const Company = require('../models/Company');

exports.getAllCompanies = async () => {
  return await Company.find().sort({ name: 1 });
};

exports.getCompanyById = async (id) => {
  return await Company.findById(id);
};

exports.createCompany = async (companyData) => {
  const company = new Company(companyData);
  return await company.save();
};

exports.updateCompany = async (id, companyData) => {
  return await Company.findByIdAndUpdate(id, companyData, { new: true });
};

exports.deleteCompany = async (id) => {
  return await Company.findByIdAndDelete(id);
};

exports.getEmployeesByCompanyId = async (companyId) => {
  const Employee = require('../models/Employee');
  return await Employee.find({ company: companyId });
};
