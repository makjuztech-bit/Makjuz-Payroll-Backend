const Document = require('../models/Document');
const mongoose = require('mongoose');

const documentService = {
  uploadDocument: async (employeeId, fileData) => {
    try {
      // Remove any existing document for this employee
      await Document.findOneAndDelete({ employeeId: new mongoose.Types.ObjectId(employeeId) });
      
      // Create new document with proper ObjectId
      const document = new Document({
        ...fileData,
        employeeId: new mongoose.Types.ObjectId(employeeId)
      });
      
      const savedDocument = await document.save();
      return {
        fileName: savedDocument.fileName,
        uploadedAt: savedDocument.uploadedAt,
        fileType: savedDocument.fileType
      };
    } catch (error) {
      console.error('Error in uploadDocument:', error);
      throw error;
    }
  },

  getEmployeeDocument: async (employeeId) => {
    try {
      const document = await Document.findOne({ 
        employeeId: new mongoose.Types.ObjectId(employeeId) 
      }).sort({ uploadedAt: -1 });
      return document;
    } catch (error) {
      console.error('Error in getEmployeeDocument:', error);
      throw error;
    }
  },

  deleteDocument: async (employeeId) => {
    try {
      const result = await Document.findOneAndDelete({ 
        employeeId: new mongoose.Types.ObjectId(employeeId) 
      });
      return result;
    } catch (error) {
      console.error('Error in deleteDocument:', error);
      throw error;
    }
  }
};

module.exports = documentService;