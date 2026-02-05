/**
 * Filter object to only include allowed fields
 * @param {Object} data - Input data
 * @param {Array} allowedFields - Array of allowed field names
 * @returns {Object} Filtered object
 */
const filterFields = (data, allowedFields) => {
    const filtered = {};

    allowedFields.forEach(field => {
        if (data[field] !== undefined) {
            filtered[field] = data[field];
        }
    });

    return filtered;
};

/**
 * Get allowed fields based on user role
 * @param {string} role - User role
 * @param {string} context - Context (create, update, etc.)
 * @returns {Array} Allowed fields
 */
const getAllowedFields = (role, context = 'update') => {
    const baseFields = [
        'name', 'department', 'designation', 'gender', 'fixed_stipend',
        'father_name', 'permanent_address', 'communication_address',
        'contact_number', 'emergency_contact_number', 'qualification',
        'qualification_trade', 'blood_group', 'adhar_number', 'pan_number',
        'bank_name', 'account_number', 'ifsc_code', 'branch', 'photo',
        'experience', 'company', 'uan', 'esi_number', 'insurance_number',
        'category', 'DOB', 'salaryType', 'employeeCategory', 'location'
    ];

    const adminFields = [...baseFields, 'status', 'payrun_details'];

    const fieldMap = {
        create: {
            user: baseFields,
            hr: baseFields,
            manager: baseFields,
            admin: adminFields,
            superadmin: adminFields
        },
        update: {
            user: ['contact_number', 'permanent_address', 'communication_address', 'emergency_contact_number'],
            hr: baseFields,
            manager: baseFields,
            admin: adminFields,
            superadmin: adminFields
        }
    };

    return fieldMap[context]?.[role] || baseFields;
};

module.exports = { filterFields, getAllowedFields };
