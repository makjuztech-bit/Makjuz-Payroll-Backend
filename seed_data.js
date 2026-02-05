const mongoose = require('mongoose');
require('dotenv').config();
const Employee = require('./models/Employee');
const Company = require('./models/Company');

const MONGODB_URI = process.env.MONGO_URI;

const sampleEmployees = [
    {
        emp_id_no: "EMP1001",
        name: "John Doe",
        date_of_joining: "2023-01-15",
        department: "Engineering",
        designation: "Software Engineer",
        gender: "Male",
        fixed_stipend: 25000,
        father_name: "Robert Doe",
        permanent_address: "123 Tech Park, Bangalore",
        communication_address: "123 Tech Park, Bangalore",
        contact_number: "9876543210",
        emergency_contact_number: "9876543211",
        qualification: "B.Tech",
        qualification_trade: "Computer Science",
        blood_group: "O+",
        adhar_number: "123456789012",
        pan_number: "ABCDE1234F",
        bank_name: "HDFC Bank",
        account_number: "1234567890",
        ifsc_code: "HDFC0001234",
        branch: "Koramangala",
        category: "General",
        status: "Active",
        DOB: new Date("1995-05-15"),
        salaryType: "Stipend",
        employeeCategory: "NAPS"
    },
    {
        emp_id_no: "EMP1002",
        name: "Jane Smith",
        date_of_joining: "2023-02-01",
        department: "HR",
        designation: "HR Associate",
        gender: "Female",
        fixed_stipend: 22000,
        father_name: "William Smith",
        permanent_address: "456 Business Hub, Mumbai",
        communication_address: "456 Business Hub, Mumbai",
        contact_number: "8765432109",
        emergency_contact_number: "8765432108",
        qualification: "MBA",
        qualification_trade: "HR",
        blood_group: "A+",
        adhar_number: "987654321098",
        pan_number: "VWXYZ9876A",
        bank_name: "ICICI Bank",
        account_number: "0987654321",
        ifsc_code: "ICIC0005678",
        branch: "Andheri",
        category: "General",
        status: "Active",
        DOB: new Date("1996-08-20"),
        salaryType: "Stipend",
        employeeCategory: "NATS"
    },
    {
        emp_id_no: "EMP1003",
        name: "Michael Johnson",
        date_of_joining: "2023-03-10",
        department: "Marketing",
        designation: "Marketing Exec",
        gender: "Male",
        fixed_stipend: 20000,
        father_name: "James Johnson",
        permanent_address: "789 Market Road, Delhi",
        communication_address: "789 Market Road, Delhi",
        contact_number: "7654321098",
        emergency_contact_number: "7654321097",
        qualification: "BBA",
        qualification_trade: "Marketing",
        blood_group: "B+",
        adhar_number: "456789012345",
        pan_number: "LMNOP5678Q",
        bank_name: "SBI",
        account_number: "5678901234",
        ifsc_code: "SBIN0009012",
        branch: "Connaught Place",
        category: "OBC",
        status: "Active",
        DOB: new Date("1998-12-05"),
        salaryType: "Stipend",
        employeeCategory: "NON-NAPS"
    },
    {
        emp_id_no: "EMP1004",
        name: "Emily Brown",
        date_of_joining: "2023-04-05",
        department: "Finance",
        designation: "Finance Analyst",
        gender: "Female",
        fixed_stipend: 28000,
        father_name: "David Brown",
        permanent_address: "321 Finance St, Chennai",
        communication_address: "321 Finance St, Chennai",
        contact_number: "6543210987",
        emergency_contact_number: "6543210986",
        qualification: "B.Com",
        qualification_trade: "Finance",
        blood_group: "AB+",
        adhar_number: "789012345678",
        pan_number: "RSTUV3456W",
        bank_name: "Axis Bank",
        account_number: "3456789012",
        ifsc_code: "UTIB0003456",
        branch: "T Nagar",
        category: "General",
        status: "Active",
        DOB: new Date("1994-03-25"),
        salaryType: "Salary",
        employeeCategory: "NON-NATS"
    },
    {
        emp_id_no: "EMP1005",
        name: "Chris Wilson",
        date_of_joining: "2023-05-20",
        department: "Operations",
        designation: "Ops Executive",
        gender: "Male",
        fixed_stipend: 18000,
        father_name: "Thomas Wilson",
        permanent_address: "654 Ops Ave, Hyderabad",
        communication_address: "654 Ops Ave, Hyderabad",
        contact_number: "5432109876",
        emergency_contact_number: "5432109875",
        qualification: "B.Sc",
        qualification_trade: "General",
        blood_group: "O-",
        adhar_number: "234567890123",
        pan_number: "GHIJK9012L",
        bank_name: "Kotak Bank",
        account_number: "9012345678",
        ifsc_code: "KKBK0007890",
        branch: "Banjara Hills",
        category: "SC",
        status: "Active",
        DOB: new Date("1997-07-10"),
        salaryType: "Stipend",
        employeeCategory: "NAPS"
    }
];

// Helper to generate payrun details
const generatePayrunDetails = (employee, month, year) => {
    const workingDays = 24;
    const holidays = 4; // Assuming 4 Sundays
    const fixedStipend = employee.fixed_stipend;

    // Randomize some present days (between 20 and 24)
    const presentDays = 20 + Math.floor(Math.random() * 5);
    const totalPayableDays = presentDays + holidays;

    const perDayStipend = fixedStipend / workingDays;
    const earnedStipend = Math.round(perDayStipend * presentDays);

    const specialAllowance = 1000;
    const earnedSpecialAllowance = Math.round((specialAllowance / workingDays) * presentDays);

    const transport = 500;
    const managementFee = 500;
    const insurance = 100;
    const canteen = 300;

    const totalEarning = earnedStipend + earnedSpecialAllowance + transport;
    const totalDeductions = canteen + managementFee + insurance;
    const netEarning = totalEarning - totalDeductions;

    const billableTotal = netEarning + 1000;
    const gst = billableTotal * 0.18;
    const grandTotal = billableTotal + gst;

    return {
        presentDays,
        holidays,
        otHours: 0,
        totalFixedDays: workingDays,
        totalPayableDays: presentDays + holidays,
        fixedStipend,
        earnedStipend,
        earningsOt: 0,
        earnedSpecialAllowance,
        specialAllowance,
        attendanceIncentive: 0,
        transport,
        managementFee,
        insurance,
        canteen,
        lop: 0,
        totalEarning,
        totalDeductions,
        netEarning: netEarning,
        finalNetpay: netEarning,
        billableTotal,
        gst,
        grandTotal,
        dbt: 0,
        remarks: "Auto Generated",
        bankAccount: employee.account_number
    };
};

const seedData = async () => {
    try {
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // 1. Ensure "Demo Company" exists
        let demoCompany = await Company.findOne({ name: 'Demo Company' });
        if (!demoCompany) {
            demoCompany = await Company.create({
                name: 'Demo Company',
                type: 'Corporation',
                active: true
            });
            console.log('Created Demo Company');
        }

        // 2. Get all companies
        const companies = await Company.find();
        console.log(`Found ${companies.length} companies to seed.`);

        // 3. Prepare Payrun dates
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const currentYear = new Date().getFullYear();
        const currentMonthIndex = new Date().getMonth();
        const targetMonths = [
            { month: months[currentMonthIndex], year: currentYear },
            { month: months[currentMonthIndex - 1 < 0 ? 11 : currentMonthIndex - 1], year: currentMonthIndex - 1 < 0 ? currentYear - 1 : currentYear }
        ];

        // 4. Seed each company
        for (const company of companies) {
            console.log(`Seeding company: ${company.name} (${company._id})`);

            // Delete existing employees for this company
            await Employee.deleteMany({ company: company._id });

            for (const empData of sampleEmployees) {
                const payrunMap = new Map();

                // Add payrun details for target months
                targetMonths.forEach(({ month, year }) => {
                    const details = generatePayrunDetails(empData, month, year);
                    payrunMap.set(`${month}_${year}`, details);
                });

                // Generate a unique ID per company to avoid global index collisions
                const companyPrefix = company._id.toString().substring(18).toUpperCase();
                const uniqueEmpId = `${companyPrefix}-${empData.emp_id_no}`;

                const employee = new Employee({
                    ...empData,
                    emp_id_no: uniqueEmpId,
                    company: company._id,
                    payrun_details: payrunMap
                });

                await employee.save();
            }
            console.log(`Successfully seeded 5 employees for ${company.name}`);
        }

        console.log('Seeding completed successfully for all companies!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};

seedData();
