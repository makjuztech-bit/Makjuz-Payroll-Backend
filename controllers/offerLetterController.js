
const { generateOfferLetterPDF } = require('../services/pdfService');
const { sendEmail } = require('../services/emailService');
const Candidate = require('../models/Candidate');

// Get all candidates
exports.getCandidates = async (req, res) => {
    try {
        const isAdminOrHr = ['admin', 'hr', 'superadmin'].includes(req.user?.role);

        // Filter by company if needed, for now all
        let query = Candidate.find().sort({ createdAt: -1 });

        if (!isAdminOrHr) {
            query = query.select('-salary');
        }

        const candidates = await query;
        res.status(200).json(candidates);
    } catch (error) {
        console.error('Error fetching candidates:', error);
        res.status(500).json({ message: 'Error fetching candidates' });
    }
};

// Add single candidate
exports.addCandidate = async (req, res) => {
    try {
        const candidateData = req.body;

        // simple validation
        if (!candidateData.email || !candidateData.name) {
            return res.status(400).json({ message: 'Name and Email are required' });
        }

        // Check duplicate
        const existing = await Candidate.findOne({ email: candidateData.email });
        if (existing) {
            // Update existing
            Object.assign(existing, candidateData);
            await existing.save();
            return res.status(200).json(existing);
        }

        const newCandidate = new Candidate(candidateData);
        await newCandidate.save();
        res.status(201).json(newCandidate);
    } catch (error) {
        console.error('Error adding candidate:', error);
        res.status(500).json({ message: 'Error adding candidate' });
    }
};

// Bulk add candidates (e.g. from Excel)
exports.addCandidatesBulk = async (req, res) => {
    try {
        const { candidates } = req.body;
        if (!Array.isArray(candidates)) {
            return res.status(400).json({ message: 'Candidates must be an array' });
        }

        const results = [];
        for (const c of candidates) {
            if (!c.email) continue;
            // Upsert
            const updated = await Candidate.findOneAndUpdate(
                { email: c.email },
                { ...c, status: 'Pending' },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            results.push(updated);
        }

        res.status(200).json(results);
    } catch (error) {
        console.error('Error bulk adding candidates:', error);
        res.status(500).json({ message: 'Error bulk adding candidates' });
    }
};

// Delete candidate
exports.deleteCandidate = async (req, res) => {
    try {
        const { id } = req.params;
        await Candidate.findByIdAndDelete(id);
        res.status(200).json({ message: 'Candidate deleted' });
    } catch (error) {
        console.error('Error deleting candidate:', error);
        res.status(500).json({ message: 'Error deleting candidate' });
    }
};

exports.sendBatchOfferLetters = async (req, res) => {
    const { candidates } = req.body; // Expects array of candidate objects

    if (!candidates || !Array.isArray(candidates)) {
        return res.status(400).json({ message: 'Invalid candidates data' });
    }

    const results = {
        success: [],
        failed: []
    };

    for (const candidateData of candidates) {
        try {
            console.log(`Processing offer letter for ${candidateData.name}...`);
            const pdfBuffer = await generateOfferLetterPDF(candidateData);
            const safeName = (candidateData.name || 'Candidate').replace(/[^a-zA-Z0-9]/g, '_');

            await sendEmail(
                candidateData.email,
                'Your Offer Letter from Levivaan',
                `Dear ${candidateData.name},\n\nPlease find attached your offer letter.\n\nBest Regards,\nHR Team`,
                [
                    {
                        filename: `Offer_Letter_${safeName}.pdf`,
                        content: pdfBuffer,
                        contentType: 'application/pdf'
                    }
                ]
            );

            // Update status in DB if exists
            await Candidate.findOneAndUpdate({ email: candidateData.email }, { status: 'Sent' });

            results.success.push(candidateData.email);
        } catch (error) {
            console.error(`Failed for ${candidateData.email}:`, error);
            results.failed.push({ email: candidateData.email, error: error.message });
        }
    }

    res.status(200).json({
        message: 'Batch processing completed',
        results
    });
};

exports.downloadOfferLetter = async (req, res) => {
    try {
        const { candidate } = req.body;
        if (!candidate) return res.status(400).json({ message: 'Candidate data required' });

        const safeName = (candidate.name || 'Candidate').replace(/[^a-zA-Z0-9]/g, '_');
        const pdfBuffer = await generateOfferLetterPDF(candidate);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Offer_Letter_${safeName}.pdf`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error generating PDF download:', error);
        res.status(500).json({ message: 'Error generating PDF' });
    }
};
