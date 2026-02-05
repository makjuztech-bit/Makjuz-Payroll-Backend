
const Income = require('../models/Income');

// Add new income
exports.addIncome = async (req, res) => {
    try {
        const { companyId, date, amount, source, description, referenceParams } = req.body;

        if (!companyId || !date || !amount || !source) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const newIncome = new Income({
            company: companyId,
            date,
            amount,
            source,
            description,
            referenceParams
        });

        const savedIncome = await newIncome.save();
        res.status(201).json(savedIncome);
    } catch (error) {
        console.error('Error adding income:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all income for a company
exports.getIncomes = async (req, res) => {
    try {
        const { companyId } = req.query;
        if (!companyId) {
            return res.status(400).json({ message: 'Company ID required' });
        }

        const incomes = await Income.find({ company: companyId }).sort({ date: -1 });
        res.status(200).json(incomes);
    } catch (error) {
        console.error('Error fetching incomes:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete income
exports.deleteIncome = async (req, res) => {
    try {
        const { id } = req.params;
        await Income.findByIdAndDelete(id);
        res.status(200).json({ message: 'Income deleted' });
    } catch (error) {
        console.error('Error deleting income:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
