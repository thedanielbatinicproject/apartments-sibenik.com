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
    const companies = [
        {
            name: 'Apartmani Ivica',
            dataPath: path.join(__dirname, '../../data/private/invoices/apartmani-ivica.json'),
            companyData: {
                companyName: 'Apartmani Ivica',
                companyInfo: {
                    owner: 'Ivica Batinić',
                    oib: '91783900722',
                    address: 'Obala Jerka Šižgorića 13',
                    city: '22000 Šibenik',
                    country: 'Croatia',
                    phone: '+385 99 563 7343',
                    email: 'ivicaba@gmail.com',
                    iban: 'HR1234567890123456789'
                },
                constants: {
                    disclaimer1: 'Ovaj račun je valjan bez potpisa i bez pečata.',
                    disclaimer2: 'Boravišna pristojba uključena u cijenu usluge. - Sojourn tax included in the price of service.'
                }
            }
        },
        {
            name: 'Apartmani Brigita',
            dataPath: path.join(__dirname, '../../data/private/invoices/apartmani-brigita.json'),
            companyData: {
                companyName: 'Apartmani Brigita',
                companyInfo: {
                    owner: 'Brigita Batinić',
                    oib: '12345678901',
                    address: 'Obala Jerka Šižgorića 13',
                    city: '22000 Šibenik',
                    country: 'Croatia',
                    phone: '+385 99 563 7343',
                    email: 'brigita@gmail.com',
                    iban: 'HR0987654321098765432'
                },
                constants: {
                    disclaimer1: 'Ovaj račun je valjan bez potpisa i bez pečata.',
                    disclaimer2: 'Boravišna pristojba uključena u cijenu usluge. - Sojourn tax included in the price of service.'
                }
            }
        }
    ];

    for (const company of companies) {
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
                    company: company.companyData
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
