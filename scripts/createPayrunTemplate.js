const xlsx = require('xlsx');
const path = require('path');

// Define the columns for the payrun template
const columns = [
  'SR.NO',
  'ID',
  'TRAINEE NAME',
  'Category',
  'PRESENT DAYS',
  'HOLIDAYS',
  'OT HOURS',
  'EARNINGS OF OT',
  'TOTAL FIXED DAYS',
  'TOTAL PAYABLE DAYS',
  'FIXED STIPEND',
  'SPECIAL ALLOWANCE',
  'EARNED STIPEND',
  'EARNED SPECIAL ALLOWANCE',
  'EARNINGS OF OT',
  'ATTENDANCE INCENTIVE',
  'TRANSPORT',
  'CANTEEN',
  'TOTAL EARNING',
  'TOTAL DEDUCTIONS',
  'NET EARNING',
  'MANAGEMENT FEE',
  'INSURANCE',
  'BILLABLE TOTAL',
  'GST@ 18%',
  'GRAND TOTAL',
  'dbt',
  'final netpay',
  'lop',
  'Remarks',
  'Bank Accout'
];

// Sample data for the template
const sampleData = [
  [
    1, 'LEV017', 'MANIKANDAN M', 'naps', 21.5, 0, 0, 0, 24, 21.5, 15146, 1273, 13568, 1140, 0, 0, 175, 591, 14709, 766, 13943, 700, 150, 15559, 2801, 18359, 1500, 15443, 28, '', '1234567890'
  ]
];

// Create a workbook with headers
const wb = xlsx.utils.book_new();
const ws = xlsx.utils.aoa_to_sheet([columns, ...sampleData]);

// Add worksheet to workbook
xlsx.utils.book_append_sheet(wb, ws, 'Payrun Template');

// Save the template file
const templatePath = path.join(__dirname, '..', 'templates', 'payrun_template.xlsx');
xlsx.writeFile(wb, templatePath);

console.log(`Payrun template created at: ${templatePath}`); 