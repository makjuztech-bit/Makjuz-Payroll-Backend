const CryptoJS = require('crypto-js');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-fallback-secret-key-change-in-prod';

/**
 * Encrypt data object to base64 string
 */
const encryptData = (data) => {
    if (!data) return null;
    try {
        const jsonString = JSON.stringify(data);
        const encrypted = CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString();
        return { _enc: encrypted };
    } catch (error) {
        console.error('Encryption error:', error);
        return data;
    }
};

/**
 * Decrypt data (if needed for incoming requests, usually mostly for responses)
 */
const decryptData = (ciphertext) => {
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
        const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        return decryptedData;
    } catch (error) {
        console.error('Decryption error:', error);
        return null;
    }
};

/**
 * Middleware to intercept res.json and encrypt the payload
 */
const responseEncryptor = (req, res, next) => {
    // Save original json method
    const originalJson = res.json;

    // Override json method
    res.json = function (body) {
        // Skip encryption for errors or if explicitly disabled
        if (res.statusCode >= 400 || req.skipEncryption) {
            return originalJson.call(this, body);
        }

        // Encrypt the body
        const encryptedBody = encryptData(body);
        return originalJson.call(this, encryptedBody);
    };

    next();
};

module.exports = {
    encryptData,
    decryptData,
    responseEncryptor
};
