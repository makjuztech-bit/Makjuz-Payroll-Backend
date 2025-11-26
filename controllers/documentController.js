const documentService = require('../services/documentService');

const documentController = {
  uploadDocument: async (req, res) => {
    try {
      const { employeeId } = req.params;
      const { fileName, fileContent, fileType } = req.body;
      
      if (!fileName || !fileContent || !fileType || !employeeId) {
        return res.status(400).json({ 
          message: 'Missing required fields: fileName, fileContent, fileType, or employeeId' 
        });
      }

      const result = await documentService.uploadDocument(employeeId, {
        fileName,
        fileContent,
        fileType
      });

      res.status(201).json(result);
    } catch (error) {
      console.error('Error uploading document:', error);
      res.status(500).json({ 
        message: 'Failed to upload document',
        error: error.message 
      });
    }
  },

  getDocument: async (req, res) => {
    try {
      const { employeeId } = req.params;
      const document = await documentService.getEmployeeDocument(employeeId);
      
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
      
      res.json(document);
    } catch (error) {
      console.error('Error fetching document:', error);
      res.status(500).json({ 
        message: 'Failed to fetch document',
        error: error.message 
      });
    }
  },

  deleteDocument: async (req, res) => {
    try {
      const { employeeId } = req.params;
      const document = await documentService.deleteDocument(employeeId);
      
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting document:', error);
      res.status(500).json({ 
        message: 'Failed to delete document',
        error: error.message 
      });
    }
  }
};

module.exports = documentController;