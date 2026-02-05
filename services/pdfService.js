
const PDFDocument = require('pdfkit');

const generateOfferLetterPDF = (candidate) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument();
            const buffers = [];

            doc.on('data', (chunk) => buffers.push(chunk));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            // -- PDF Content --

            // Header
            doc.fontSize(20).text('LEVIVAAN', { align: 'center', underline: true });
            doc.moveDown();
            doc.fontSize(12).text('Date: ' + new Date().toLocaleDateString(), { align: 'right' });

            doc.moveDown(2);
            doc.fontSize(14).text('OFFER LETTER', { align: 'center', underline: true });
            doc.moveDown(2);

            // Body
            doc.fontSize(12).text(`Dear ${candidate.name},`);
            doc.moveDown();
            doc.text(`We are pleased to offer you the position of ${candidate.role} at Levivaan.`);
            doc.moveDown();
            doc.text(`Your annual Cost to Company (CTC) will be ${candidate.salary}.`);
            doc.moveDown();
            doc.text(`Your joining date is confirmed for ${candidate.joinDate}.`);
            doc.moveDown(2);
            doc.text('We look forward to welcoming you to the team.');
            doc.moveDown(2);

            // Footer
            doc.text('Sincerely,');
            doc.moveDown();
            doc.text('HR Department');
            doc.text('Levivaan Inc.');

            doc.end();

        } catch (error) {
            reject(error);
        }
    });
};

module.exports = { generateOfferLetterPDF };
