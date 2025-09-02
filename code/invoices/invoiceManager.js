/**
 * Invoice Management Helper
 * Handles reading and writing invoice data for different companies
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const INVOICES_DIR = path.join(__dirname, '../../data/private/invoices');

/**
 * Generate invoice UID based on invoice number
 * @param {string} invoiceNumber - Invoice number
 * @param {string} companyId - Company identifier
 * @returns {string} Generated UID
 */
function generateInvoiceUID(invoiceNumber, companyId) {
    // Create a simple hash based on invoice number and company
    const baseString = `${companyId}-${invoiceNumber}`;
    const hash = crypto.createHash('md5').update(baseString).digest('hex');
    
    // Take first 8 characters and format as XXXX-XXXX
    const shortHash = hash.substring(0, 8).toUpperCase();
    return `${shortHash.substring(0, 4)}-${shortHash.substring(4, 8)}`;
}

/**
 * Get available companies
 * @returns {Array} Array of company objects with id and name
 */
function getAvailableCompanies() {
    return [
        { id: 'apartmani-ivica', name: 'Apartmani Ivica' },
        { id: 'apartmani-brigita', name: 'Apartmani Brigita' }
    ];
}

/**
 * Get company data by ID
 * @param {string} companyId - Company identifier
 * @returns {Object|null} Company data or null if not found
 */
async function getCompanyData(companyId) {
    try {
        const filePath = path.join(INVOICES_DIR, `${companyId}.json`);
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading company data for ${companyId}:`, error);
        return null;
    }
}

/**
 * Save company data
 * @param {string} companyId - Company identifier
 * @param {Object} data - Company data to save
 * @returns {boolean} Success status
 */
async function saveCompanyData(companyId, data) {
    try {
        const filePath = path.join(INVOICES_DIR, `${companyId}.json`);
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Error saving company data for ${companyId}:`, error);
        return false;
    }
}

/**
 * Validate company ID
 * @param {string} companyId - Company identifier to validate
 * @returns {boolean} True if valid company ID
 */
function isValidCompanyId(companyId) {
    const validIds = getAvailableCompanies().map(c => c.id);
    return validIds.includes(companyId);
}

/**
 * Get company name by ID
 * @param {string} companyId - Company identifier
 * @returns {string|null} Company name or null if not found
 */
function getCompanyName(companyId) {
    const company = getAvailableCompanies().find(c => c.id === companyId);
    return company ? company.name : null;
}

/**
 * Initialize company data if it doesn't exist
 * @param {string} companyId - Company identifier
 * @returns {boolean} Success status
 */
async function initializeCompanyData(companyId) {
    if (!isValidCompanyId(companyId)) {
        return false;
    }

    const existingData = await getCompanyData(companyId);
    if (existingData) {
        return true; // Already exists
    }

    const companyName = getCompanyName(companyId);
    const isIvica = companyId === 'apartmani-ivica';
    
    const initialData = {
        companyName: companyName,
        companyInfo: {
            fullName: companyName,
            owner: isIvica ? "Ivica Batinić" : "Brigita Batinić",
            oib: "",
            vatId: "",
            address: "Slobodana Macure 13",
            city: "22000 Šibenik",
            country: "Croatia",
            phone: "",
            email: "",
            website: "apartments-sibenik.com",
            iban: ""
        },
        invoices: [],
        nextInvoiceNumber: 1,
        settings: {
            currency: "EUR",
            language: "hr",
            taxRate: 25,
            defaultService: isIvica ? "Soba" : "Studio",
            defaultRoomNumber: isIvica ? 1 : 2
        },
        constants: {
            disclaimer1: "Boravišna pristojba uključena u cijenu usluga. - Sojourn tax included in the price of service.",
            disclaimer2: "Po čl. 90 oslobođeno od plaćanja PDV-a"
        }
    };

    return await saveCompanyData(companyId, initialData);
}

/**
 * Get next invoice number for company
 * @param {string} companyId - Company identifier
 * @returns {string} Next invoice number in format "number/year"
 */
async function getNextInvoiceNumber(companyId) {
    const companyData = await getCompanyData(companyId);
    if (!companyData) return "1/2025";

    const currentYear = new Date().getFullYear();
    
    // Find all invoices for current year
    const invoicesThisYear = companyData.invoices.filter(invoice => {
        const invoiceYear = parseInt(invoice.invoiceNumber.split('/')[1]);
        return invoiceYear === currentYear;
    });

    // Find the highest invoice number for this year
    let highestNumber = 0;
    invoicesThisYear.forEach(invoice => {
        const number = parseInt(invoice.invoiceNumber.split('/')[0]);
        if (number > highestNumber) {
            highestNumber = number;
        }
    });

    const nextNumber = highestNumber + 1;
    return `${nextNumber}/${currentYear}`;
}

/**
 * Add new invoice to company
 * @param {string} companyId - Company identifier
 * @param {Object} invoiceData - Invoice data
 * @returns {boolean} Success status
 */
async function addInvoice(companyId, invoiceData) {
    try {
        const companyData = await getCompanyData(companyId);
        if (!companyData) return false;

        // Generate unique invoice ID and UID
        const invoiceId = Date.now().toString();
        const invoiceUID = generateInvoiceUID(invoiceData.invoiceNumber, companyId);
        
        const invoice = {
            id: invoiceId,
            uid: invoiceUID,
            ...invoiceData,
            createdAt: new Date().toISOString()
        };

        companyData.invoices.push(invoice);
        
        // Update next invoice number if needed
        const invoiceYear = new Date(invoice.issueDate).getFullYear();
        const currentYear = new Date().getFullYear();
        if (invoiceYear === currentYear) {
            const invoicesThisYear = companyData.invoices.filter(inv => {
                const year = new Date(inv.issueDate).getFullYear();
                return year === currentYear;
            });
            companyData.nextInvoiceNumber = Math.max(companyData.nextInvoiceNumber, invoicesThisYear.length + 1);
        }

        return await saveCompanyData(companyId, companyData);
    } catch (error) {
        console.error(`Error adding invoice for ${companyId}:`, error);
        return false;
    }
}

/**
 * Update existing invoice
 * @param {string} companyId - Company identifier
 * @param {string} invoiceId - Invoice ID
 * @param {Object} invoiceData - Updated invoice data
 * @returns {boolean} Success status
 */
async function updateInvoice(companyId, invoiceId, invoiceData) {
    try {
        const companyData = await getCompanyData(companyId);
        if (!companyData) return false;

        const invoiceIndex = companyData.invoices.findIndex(inv => inv.id === invoiceId);
        if (invoiceIndex === -1) return false;

        companyData.invoices[invoiceIndex] = {
            ...companyData.invoices[invoiceIndex],
            ...invoiceData,
            updatedAt: new Date().toISOString()
        };

        return await saveCompanyData(companyId, companyData);
    } catch (error) {
        console.error(`Error updating invoice ${invoiceId} for ${companyId}:`, error);
        return false;
    }
}

/**
 * Delete invoice
 * @param {string} companyId - Company identifier
 * @param {string} invoiceId - Invoice ID
 * @returns {boolean} Success status
 */
async function deleteInvoice(companyId, invoiceId) {
    try {
        const companyData = await getCompanyData(companyId);
        if (!companyData) return false;

        const invoiceIndex = companyData.invoices.findIndex(inv => inv.id === invoiceId);
        if (invoiceIndex === -1) return false;

        companyData.invoices.splice(invoiceIndex, 1);
        return await saveCompanyData(companyId, companyData);
    } catch (error) {
        console.error(`Error deleting invoice ${invoiceId} for ${companyId}:`, error);
        return false;
    }
}

/**
 * Get invoice by ID
 * @param {string} companyId - Company identifier
 * @param {string} invoiceId - Invoice ID
 * @returns {Object|null} Invoice data or null if not found
 */
async function getInvoice(companyId, invoiceId) {
    try {
        const companyData = await getCompanyData(companyId);
        if (!companyData) return null;

        return companyData.invoices.find(inv => inv.id === invoiceId) || null;
    } catch (error) {
        console.error(`Error getting invoice ${invoiceId} for ${companyId}:`, error);
        return null;
    }
}

/**
 * Add UIDs to existing invoices that don't have them
 * @param {string} companyId - Company identifier
 * @returns {boolean} Success status
 */
async function addUIDsToExistingInvoices(companyId) {
    try {
        const companyData = await getCompanyData(companyId);
        if (!companyData) return false;

        let updated = false;
        companyData.invoices.forEach(invoice => {
            if (!invoice.uid && invoice.invoiceNumber) {
                invoice.uid = generateInvoiceUID(invoice.invoiceNumber, companyId);
                updated = true;
            }
        });

        if (updated) {
            return await saveCompanyData(companyId, companyData);
        }
        return true;
    } catch (error) {
        console.error(`Error adding UIDs to existing invoices for ${companyId}:`, error);
        return false;
    }
}

module.exports = {
    getAvailableCompanies,
    getCompanyData,
    saveCompanyData,
    isValidCompanyId,
    getCompanyName,
    initializeCompanyData,
    getNextInvoiceNumber,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    getInvoice,
    generateInvoiceUID,
    addUIDsToExistingInvoices
};
