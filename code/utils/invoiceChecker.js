const fs = require('fs').promises;
const path = require('path');

/**
 * Check invoice page handler
 */
const handleCheckInvoice = (req, res) => {
    res.render('management/check-invoice', {
        title: 'Check Invoice - Apartments Šibenik',
        error: null
    });
};

/**
 * Process invoice check request
 */
const processInvoiceCheck = async (req, res) => {
    const { uid } = req.body;
    
    if (!uid || uid.trim() === '') {
        return res.render('management/check-invoice', {
            title: 'Check Invoice - Apartments Šibenik',
            error: 'Please enter an Invoice UID'
        });
    }

    try {
        // Search for invoice in both companies' data
        const invoiceData = await findInvoiceByUID(uid.trim());
        
        if (!invoiceData) {
            return res.render('management/check-invoice', {
                title: 'Check Invoice - Apartments Šibenik',
                error: 'Invoice not found. Please check the UID and try again.'
            });
        }

        // Render invoice with guest mode
        res.render('management/templates/invoice', {
            ...invoiceData,
            isGuest: true
        });

    } catch (error) {
        console.error('Error checking invoice:', error);
        res.render('management/check-invoice', {
            title: 'Check Invoice - Apartments Šibenik',
            error: 'An error occurred while checking the invoice. Please try again.'
        });
    }
};

/**
 * Find invoice by UID in both companies' data
 */
const findInvoiceByUID = async (uid) => {
    const companyFiles = [
        {
            name: 'Apartmani Ivica',
            dataPath: path.join(__dirname, '../../data/private/invoices/apartmani-ivica.json')
        },
        {
            name: 'Apartmani Brigita',
            dataPath: path.join(__dirname, '../../data/private/invoices/apartmani-brigita.json')
        }
    ];

    for (const company of companyFiles) {
        try {
            // Check if file exists
            const fileExists = await fs.access(company.dataPath).then(() => true).catch(() => false);
            if (!fileExists) {
                console.log(`Invoice file not found: ${company.dataPath}`);
                continue;
            }

            const fileContent = await fs.readFile(company.dataPath, 'utf8');
            const data = JSON.parse(fileContent);

            // Search for invoice with matching UID in the invoices array
            const invoice = data.invoices && data.invoices.find(inv => inv.uid === uid);
            
            if (invoice) {
                return {
                    invoice,
                    company: {
                        companyName: data.companyName,
                        companyInfo: data.companyInfo,
                        constants: data.constants
                    }
                };
            }
        } catch (error) {
            console.error(`Error reading ${company.name} invoices:`, error);
            // Continue searching in other companies
        }
    }

    return null;
};

module.exports = {
    handleCheckInvoice,
    processInvoiceCheck
};
