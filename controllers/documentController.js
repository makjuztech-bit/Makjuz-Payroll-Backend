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

  getDocuments: async (req, res) => {
    try {
      const { employeeId } = req.params;
      const documents = await documentService.getEmployeeDocuments(employeeId);
      res.json(documents);
    } catch (error) {
      console.error('Error fetching documents:', error);
      res.status(500).json({
        message: 'Failed to fetch documents',
        error: error.message
      });
    }
  },

  deleteDocument: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await documentService.deleteDocument(id);

      if (!result) {
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
  },

  getDocumentsBatch: async (req, res) => {
    try {
      let employeeIds = req.body.employeeIds;

      // If body itself is the array
      if (Array.isArray(req.body)) {
        employeeIds = req.body;
      }

      // Fallback: Check if body keys contain the data (rare parsing edge case)
      if (!employeeIds && typeof req.body === 'object') {
        const keys = Object.keys(req.body);
        for (const key of keys) {
          try {
            const parsed = JSON.parse(key);
            if (Array.isArray(parsed)) {
              employeeIds = parsed;
              break;
            }
          } catch (e) { }
        }
      }

      // Ensure it is an array
      if (typeof employeeIds === 'string') {
        try { employeeIds = JSON.parse(employeeIds); } catch (e) { }
      }

      if (!Array.isArray(employeeIds)) {
        console.error('Final employeeIds is not an array:', employeeIds);
        return res.status(400).json({
          message: 'Invalid employeeIds provided',
          received: req.body
        });
      }

      const documents = await documentService.getDocumentsByEmployeeIds(employeeIds);
      res.json(documents);
    } catch (error) {
      console.error('Error fetching batch documents:', error);
      res.status(500).json({
        message: 'Failed to fetch documents batch',
        error: error.message
      });
    }
  }
};

module.exports = documentController;