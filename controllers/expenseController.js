
const Expense = require('../models/Expense');

// Add new expense
exports.addExpense = async (req, res) => {
    try {
        const { companyId, date, amount, category, description, merchant, paymentMethod, receiptUrl } = req.body;

        if (!companyId || !date || !amount || !category) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const newExpense = new Expense({
            company: companyId,
            date,
            amount,
            category,
            description,
            merchant,
            paymentMethod,
            receiptUrl
        });

        const savedExpense = await newExpense.save();
        res.status(201).json(savedExpense);
    } catch (error) {
        console.error('Error adding expense:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all expenses for a company
exports.getExpenses = async (req, res) => {
    try {
        const { companyId } = req.query;
        if (!companyId) {
            return res.status(400).json({ message: 'Company ID required' });
        }

        const expenses = await Expense.find({ company: companyId }).sort({ date: -1 });
        res.status(200).json(expenses);
    } catch (error) {
        console.error('Error fetching expenses:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get single expense detail
exports.getExpenseById = async (req, res) => {
    try {
        const { id } = req.params;
        const expense = await Expense.findById(id);
        if (!expense) return res.status(404).json({ message: 'Expense not found' });
        res.status(200).json(expense);
    } catch (error) {
        console.error('Error fetching expense:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

// Delete expense
exports.deleteExpense = async (req, res) => {
    try {
        const { id } = req.params;
        await Expense.findByIdAndDelete(id);
        res.status(200).json({ message: 'Expense deleted' });
    } catch (error) {
        console.error('Error deleting expense:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
