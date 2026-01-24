const Document = require('../models/Document');
const mongoose = require('mongoose');

const documentService = {
  uploadDocument: async (employeeId, fileData) => {
    try {
      // Create new document with proper ObjectId
      const document = new Document({
        ...fileData,
        employeeId: new mongoose.Types.ObjectId(employeeId)
      });

      const savedDocument = await document.save();
      return {
        _id: savedDocument._id,
        fileName: savedDocument.fileName,
        uploadedAt: savedDocument.uploadedAt,
        fileType: savedDocument.fileType,
        fileContent: savedDocument.fileContent,
        employeeId: savedDocument.employeeId
      };
    } catch (error) {
      console.error('Error in uploadDocument:', error);
      throw error;
    }
  },

  getEmployeeDocuments: async (employeeId) => {
    try {
      const documents = await Document.find({
        employeeId: new mongoose.Types.ObjectId(employeeId)
      }).sort({ uploadedAt: -1 });
      return documents;
    } catch (error) {
      console.error('Error in getEmployeeDocuments:', error);
      throw error;
    }
  },

  deleteDocument: async (documentId) => {
    try {
      const result = await Document.findByIdAndDelete(documentId);
      return result;
    } catch (error) {
      console.error('Error in deleteDocument:', error);
      throw error;
    }
  },

  getDocumentsByEmployeeIds: async (employeeIds) => {
    try {
      // Convert string IDs to ObjectIds
      const objectIds = employeeIds.map(id => new mongoose.Types.ObjectId(id));

      const documents = await Document.find({
        employeeId: { $in: objectIds }
      });

      return documents;
    } catch (error) {
      console.error('Error in getDocumentsByEmployeeIds:', error);
      throw error;
    }
  }
};


module.exports = documentService;