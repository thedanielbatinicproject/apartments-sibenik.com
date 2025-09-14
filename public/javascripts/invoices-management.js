/**
 * Invoices Management Dashboard JavaScript
 * Handles company selection and invoice management functionality
 */

class InvoicesManager {
    constructor() {
        this.currentCompany = null;
        this.currentInvoiceId = null;
        this.invoiceToDelete = null;
        this.formDataKey = 'invoiceFormData';
        this.currentPage = 0;
        this.paginationInfo = null;
        this.allLoadedInvoices = [];
        this.init();
    }

    init() {
        this.setupCompanySelector();
        this.setupFormHandlers();
        this.setupModalHandlers();
        this.loadSelectedCompany();
        this.setTodayDate();
    }

    setupCompanySelector() {
        const companyButtons = document.querySelectorAll('.company-btn');
        
        companyButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const companyId = button.dataset.company;
                this.selectCompany(companyId);
            });
        });
    }

    setupFormHandlers() {
        const form = document.getElementById('invoiceForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
            
            // Add input event listeners to save data on change
            const inputs = form.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                input.addEventListener('input', () => this.saveFormData());
                input.addEventListener('change', () => this.saveFormData());
            });
        }

        // Setup auto-calculations
        this.setupAutoCalculations();
    }

    setupAutoCalculations() {
        // Date change handlers
        const checkInDate = document.getElementById('checkInDate');
        const checkOutDate = document.getElementById('checkOutDate');
        
        if (checkInDate && checkOutDate) {
            checkInDate.addEventListener('change', () => this.calculateDays());
            checkOutDate.addEventListener('change', () => this.calculateDays());
        }

        // Service type change handler
        const serviceType = document.getElementById('serviceType');
        if (serviceType) {
            serviceType.addEventListener('change', () => this.updateRoomNumber());
        }

        // Pricing calculation handlers - now totalPrice drives unit price
        const quantity = document.getElementById('quantity');
        const totalPrice = document.getElementById('totalPrice');
        const discount = document.getElementById('discount');
        
        if (quantity) quantity.addEventListener('input', () => this.calculateUnitPrice());
        if (totalPrice) totalPrice.addEventListener('input', () => this.calculateUnitPrice());
        if (discount) discount.addEventListener('input', () => this.calculateFinalPrice());

        // Sync quantity with total days
        const totalDays = document.getElementById('totalDays');
        if (totalDays) {
            totalDays.addEventListener('input', () => {
                const daysCount = document.getElementById('daysCount');
                const quantity = document.getElementById('quantity');
                if (daysCount) daysCount.value = totalDays.value;
                if (quantity) quantity.value = totalDays.value;
                this.calculateUnitPrice();
            });
        }
    }

    setupModalHandlers() {
        // Close modal when clicking outside
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeAllModals();
                }
            });
        });

        // Prevent scrolling when modal is open
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    calculateDays() {
        const checkInDate = document.getElementById('checkInDate');
        const checkOutDate = document.getElementById('checkOutDate');
        const totalDays = document.getElementById('totalDays');

        if (checkInDate && checkOutDate && totalDays && checkInDate.value && checkOutDate.value) {
            const checkIn = new Date(checkInDate.value);
            const checkOut = new Date(checkOutDate.value);
            const diffTime = checkOut - checkIn;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 0) {
                totalDays.value = diffDays;
                
                // Update quantity and days count
                const quantity = document.getElementById('quantity');
                const daysCount = document.getElementById('daysCount');
                if (quantity) quantity.value = diffDays;
                if (daysCount) daysCount.value = diffDays;
                
                this.calculatePricing();
                this.saveFormData(); // Save data after calculation
            }
        }
    }

    updateRoomNumber() {
        const serviceType = document.getElementById('serviceType');
        const roomNumber = document.getElementById('roomNumber');

        if (serviceType && roomNumber && !roomNumber.value) {
            const serviceValue = serviceType.value;
            switch (serviceValue) {
                case 'Soba':
                    roomNumber.value = 1;
                    break;
                case 'Studio':
                    roomNumber.value = 2;
                    break;
                case 'Apartman':
                    roomNumber.value = 3;
                    break;
            }
        }
    }

    calculateUnitPrice() {
        const quantity = document.getElementById('quantity');
        const price = document.getElementById('price');
        const totalPrice = document.getElementById('totalPrice');

        if (quantity && price && totalPrice) {
            const quantityVal = parseFloat(quantity.value) || 1; // Avoid division by zero
            const totalPriceVal = parseFloat(totalPrice.value) || 0;

            // Calculate unit price = total price / quantity
            const unitPrice = quantityVal > 0 ? totalPriceVal / quantityVal : 0;
            price.value = unitPrice.toFixed(2);
            
            // Update final price after discount
            this.calculateFinalPrice();
            this.saveFormData(); // Save data after calculation
        }
    }

    calculateFinalPrice() {
        const totalPrice = document.getElementById('totalPrice');
        const discount = document.getElementById('discount');
        const finalPrice = document.getElementById('finalPrice');

        if (totalPrice && discount && finalPrice) {
            const totalPriceVal = parseFloat(totalPrice.value) || 0;
            const discountVal = parseFloat(discount.value) || 0;

            const final = Math.max(0, totalPriceVal - discountVal);
            finalPrice.value = final.toFixed(2);
            
            this.saveFormData(); // Save data after calculation
        }
    }

    // Keep the old calculatePricing for backward compatibility 
    calculatePricing() {
        this.calculateUnitPrice();
    }

    saveFormData() {
        // Only save when creating new invoice, not editing
        if (this.currentInvoiceId) return;
        
        const form = document.getElementById('invoiceForm');
        if (!form) return;
        
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        localStorage.setItem(this.formDataKey, JSON.stringify(data));
    }

    loadFormData() {
        // Only load when creating new invoice, not editing
        if (this.currentInvoiceId) return;
        
        const savedData = localStorage.getItem(this.formDataKey);
        if (!savedData) return;
        
        try {
            const data = JSON.parse(savedData);
            const form = document.getElementById('invoiceForm');
            if (!form) return;
            
            // Restore form values
            Object.keys(data).forEach(key => {
                const field = form.querySelector(`[name="${key}"]`);
                if (field && data[key]) {
                    field.value = data[key];
                }
            });
            
            // Recalculate after loading data
            this.calculateDays();
            this.calculatePricing();
        } catch (error) {
            console.error('Error loading saved form data:', error);
        }
    }

    clearSavedFormData() {
        localStorage.removeItem(this.formDataKey);
    }

    setTodayDate() {
        const today = new Date().toISOString().split('T')[0];
        const checkOutDate = document.getElementById('checkOutDate');
        const issueDate = document.getElementById('issueDate');
        
        if (checkOutDate && !checkOutDate.value) checkOutDate.value = today;
        if (issueDate && !issueDate.value) issueDate.value = today;
    }

    async selectCompany(companyId) {
        try {
            // Remove active class from all buttons
            document.querySelectorAll('.company-btn').forEach(btn => {
                btn.classList.remove('active');
            });

            // Add active class to selected button
            const selectedButton = document.querySelector(`[data-company="${companyId}"]`);
            if (selectedButton) {
                selectedButton.classList.add('active');
            }

            // Save selection to session
            const response = await fetch('/management/api/invoices/select-company', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ companyId })
            });

            if (response.ok) {
                const data = await response.json();
                this.currentCompany = data.company;
                this.updateSubtitle(data.company.companyName);
                
                this.resetAndLoadInvoices();
            } else {
                console.error('Failed to select company');
            }
        } catch (error) {
            console.error('Error selecting company:', error);
        }
    }

    updateSubtitle(companyName) {
        const subtitle = document.querySelector('.invoices-subtitle');
        if (subtitle) {
            subtitle.textContent = `Trenutno odabrana firma: ${companyName}`;
        }
    }

    async loadSelectedCompany() {
        try {
            const response = await fetch('/management/api/invoices/selected-company');
            if (response.ok) {
                const data = await response.json();
                if (data.company) {
                    this.currentCompany = data.company;
                    
                    // Update UI to show selected company
                    const companyButton = document.querySelector(`[data-company="${data.companyId}"]`);
                    if (companyButton) {
                        companyButton.classList.add('active');
                    }
                    
                    this.updateSubtitle(data.company.companyName);
                    this.resetAndLoadInvoices();
                }
            }
        } catch (error) {
            console.error('Error loading selected company:', error);
        }
    }

    resetAndLoadInvoices() {
        // Reset pagination when we want to reload from the beginning
        this.currentPage = 0;
        this.allLoadedInvoices = [];
        this.paginationInfo = null;
        this.loadInvoices();
    }

    async loadInvoices(loadMore = false) {
        try {
            const page = loadMore ? this.currentPage + 1 : 0;
            const response = await fetch(`/management/api/invoices/list?page=${page}&limit=5`);
            if (response.ok) {
                const data = await response.json();
                
                if (loadMore) {
                    // Append new invoices to existing ones
                    this.allLoadedInvoices = [...this.allLoadedInvoices, ...data.invoices];
                    this.currentPage = page;
                } else {
                    // Replace all invoices (fresh load)
                    this.allLoadedInvoices = data.invoices;
                    this.currentPage = 0;
                }
                
                this.paginationInfo = data.pagination;
                this.displayInvoices(this.allLoadedInvoices);
            } else {
                console.error('Failed to load invoices');
            }
        } catch (error) {
            console.error('Error loading invoices:', error);
        }
    }

    displayInvoices(invoices) {
        const tbody = document.getElementById('invoicesTableBody');
        const emptyState = document.getElementById('emptyState');
        const tableContainer = document.querySelector('.invoices-table-container');

        if (!tbody) return;

        tbody.innerHTML = '';

        if (invoices.length === 0) {
            if (tableContainer) tableContainer.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';
            this.removeLoadMoreButton();
        } else {
            if (tableContainer) tableContainer.style.display = 'block';
            if (emptyState) emptyState.style.display = 'none';

            invoices.forEach(invoice => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${invoice.invoiceNumber || 'N/A'}</td>
                    <td>
                        <div class="invoice-actions">
                            <button class="print-btn" onclick="invoicesManager.printInvoice('${invoice.invoiceNumber}')">
                                ISPIŠI RAČUN
                            </button>
                            <button class="edit-btn" onclick="invoicesManager.editInvoice('${invoice.id}')">
                                UREDI RAČUN
                            </button>
                            <button class="delete-btn" onclick="invoicesManager.deleteInvoice('${invoice.id}')">
                                IZBRIŠI RAČUN
                            </button>
                        </div>
                    </td>
                    <td>${invoice.guestName || 'N/A'}</td>
                    <td>${invoice.totalDays || 'N/A'}</td>
                    <td>${invoice.finalPrice ? parseFloat(invoice.finalPrice).toFixed(2) + ' EUR' : 'N/A'}</td>
                `;
                tbody.appendChild(row);
            });
            
            // Add or update load more button
            this.updateLoadMoreButton();
        }
    }

    updateLoadMoreButton() {
        this.removeLoadMoreButton();
        
        if (this.paginationInfo && this.paginationInfo.hasMore) {
            const tableContainer = document.querySelector('.invoices-table-container');
            if (tableContainer) {
                const loadMoreContainer = document.createElement('div');
                loadMoreContainer.className = 'load-more-container';
                loadMoreContainer.style.cssText = `
                    text-align: center;
                    margin: 20px 0;
                    padding: 20px;
                `;
                
                const loadMoreBtn = document.createElement('button');
                loadMoreBtn.id = 'loadMoreBtn';
                loadMoreBtn.className = 'btn-primary';
                loadMoreBtn.textContent = `Učitaj više (${this.paginationInfo.loaded}/${this.paginationInfo.total})`;
                loadMoreBtn.style.cssText = `
                    background: #4CAF50;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: background-color 0.3s;
                `;
                
                loadMoreBtn.addEventListener('click', () => this.loadMoreInvoices());
                loadMoreBtn.addEventListener('mouseenter', () => {
                    loadMoreBtn.style.backgroundColor = '#45a049';
                });
                loadMoreBtn.addEventListener('mouseleave', () => {
                    loadMoreBtn.style.backgroundColor = '#4CAF50';
                });
                
                loadMoreContainer.appendChild(loadMoreBtn);
                tableContainer.appendChild(loadMoreContainer);
            }
        }
    }

    removeLoadMoreButton() {
        const existingContainer = document.querySelector('.load-more-container');
        if (existingContainer) {
            existingContainer.remove();
        }
    }

    async loadMoreInvoices() {
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            const originalText = loadMoreBtn.textContent;
            loadMoreBtn.textContent = 'Učitavanje...';
            loadMoreBtn.disabled = true;
            
            await this.loadInvoices(true);
            
            loadMoreBtn.disabled = false;
        }
    }

    async editInvoice(invoiceId) {
        try {
            const response = await fetch(`/management/api/invoices/${invoiceId}`);
            if (response.ok) {
                const data = await response.json();
                this.populateForm(data.invoice);
                this.currentInvoiceId = invoiceId;
                document.getElementById('modalTitle').textContent = 'Uredi račun';
                document.getElementById('submitBtn').textContent = 'Ažuriraj račun';
                document.getElementById('submitBtn').className = 'btn-warning';
                this.openInvoiceForm();
            } else {
                console.error('Failed to load invoice');
            }
        } catch (error) {
            console.error('Error loading invoice:', error);
        }
    }

    populateForm(invoice) {
        const fields = [
            'invoiceNumber', 'landlord', 'address1', 'address2', 'address3',
            'guestName', 'guestCountry', 'checkInDate', 'checkOutDate',
            'guestCount', 'childrenCount', 'totalDays', 'serviceType',
            'roomNumber', 'serviceCategory', 'quantity', 'price',
            'daysCount', 'totalPrice', 'discount', 'finalPrice', 'issueDate',
            'paymentMethod'
        ];

        fields.forEach(field => {
            const element = document.getElementById(field);
            if (element && invoice[field] !== undefined) {
                element.value = invoice[field];
            }
        });
    }

    deleteInvoice(invoiceId) {
        this.invoiceToDelete = invoiceId;
        document.getElementById('deleteModal').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    async confirmDelete() {
        if (!this.invoiceToDelete) return;

        try {
            const response = await fetch(`/management/api/invoices/${this.invoiceToDelete}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.resetAndLoadInvoices();
                this.closeDeleteModal();
            } else {
                console.error('Failed to delete invoice');
            }
        } catch (error) {
            console.error('Error deleting invoice:', error);
        }
    }

    closeDeleteModal() {
        document.getElementById('deleteModal').classList.remove('active');
        document.body.style.overflow = '';
        this.invoiceToDelete = null;
    }

    async openInvoiceForm() {
        // Reset form for new invoice
        if (!this.currentInvoiceId) {
            document.getElementById('invoiceForm').reset();
            document.getElementById('modalTitle').textContent = 'Novi račun';
            document.getElementById('submitBtn').textContent = 'Dodaj račun';
            document.getElementById('submitBtn').className = 'btn-primary';
            
            // Set default values
            if (this.currentCompany) {
                document.getElementById('landlord').value = this.currentCompany.companyInfo.owner;
                
                // Set default service type based on company
                const serviceType = document.getElementById('serviceType');
                if (serviceType) {
                    serviceType.value = this.currentCompany.settings.defaultService;
                    this.updateRoomNumber();
                }
            }

            // Set default payment method
            const paymentMethod = document.getElementById('paymentMethod');
            if (paymentMethod) {
                paymentMethod.value = 'Gotovina';
            }

            // Get next invoice number
            try {
                const response = await fetch('/management/api/invoices/next-number');
                if (response.ok) {
                    const data = await response.json();
                    document.getElementById('invoiceNumber').value = data.invoiceNumber;
                }
            } catch (error) {
                console.error('Error getting next invoice number:', error);
            }

            this.setTodayDate();
            
            // Set default values for pricing
            document.getElementById('quantity').value = '1';
            document.getElementById('totalPrice').value = '50.00';
            document.getElementById('discount').value = '0';
            
            // Calculate unit price based on defaults
            setTimeout(() => {
                this.calculateUnitPrice();
            }, 100);
            
            // Load saved form data if available
            setTimeout(() => {
                this.loadFormData();
            }, 100);
        }

        document.getElementById('invoiceModal').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeInvoiceForm() {
        document.getElementById('invoiceModal').classList.remove('active');
        document.body.style.overflow = '';
        this.currentInvoiceId = null;
    }

    closeAllModals() {
        this.closeInvoiceForm();
        this.closeDeleteModal();
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const invoiceData = Object.fromEntries(formData.entries());

        try {
            let response;
            if (this.currentInvoiceId) {
                // Update existing invoice
                response = await fetch(`/management/api/invoices/${this.currentInvoiceId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(invoiceData)
                });
            } else {
                // Create new invoice
                response = await fetch('/management/api/invoices/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(invoiceData)
                });
            }

            if (response.ok) {
                // Clear saved form data on successful submission
                if (!this.currentInvoiceId) {
                    this.clearSavedFormData();
                }
                
                this.resetAndLoadInvoices();
                this.closeInvoiceForm();
                
                // Auto-redirect to print page for new invoices
                if (!this.currentInvoiceId) {
                    const selectedCompanyId = await this.getSelectedCompanyId();
                    if (selectedCompanyId && invoiceData.invoiceNumber) {
                        setTimeout(() => {
                            window.location.href = `/management/invoices/print?company=${selectedCompanyId}&invoice=${encodeURIComponent(invoiceData.invoiceNumber)}`;
                        }, 500);
                    }
                }
            } else {
                console.error('Failed to save invoice');
                alert('Greška prilikom spremanja računa. Molimo pokušajte ponovo.');
            }
        } catch (error) {
            console.error('Error saving invoice:', error);
            alert('Greška prilikom spremanja računa. Molimo pokušajte ponovo.');
        }
    }

    async getSelectedCompanyId() {
        try {
            const response = await fetch('/management/api/invoices/selected-company');
            if (response.ok) {
                const data = await response.json();
                return data.companyId;
            }
        } catch (error) {
            console.error('Error getting selected company ID:', error);
        }
        return null;
    }

    async printInvoice(invoiceNumber) {
        const selectedCompanyId = await this.getSelectedCompanyId();
        if (selectedCompanyId && invoiceNumber) {
            window.location.href = `/management/invoices/print?company=${selectedCompanyId}&invoice=${encodeURIComponent(invoiceNumber)}`;
        }
    }
}

// Number input control functions
function incrementValue(fieldId) {
    const field = document.getElementById(fieldId);
    if (field) {
        const currentValue = parseInt(field.value) || 0;
        const min = parseInt(field.min) || 0;
        field.value = Math.max(min, currentValue + 1);
        
        // Trigger change event for calculations
        field.dispatchEvent(new Event('input'));
    }
}

function decrementValue(fieldId) {
    const field = document.getElementById(fieldId);
    if (field) {
        const currentValue = parseInt(field.value) || 0;
        const min = parseInt(field.min) || 0;
        field.value = Math.max(min, currentValue - 1);
        
        // Trigger change event for calculations
        field.dispatchEvent(new Event('input'));
    }
}

// Global functions for onclick handlers
function openInvoiceForm() {
    window.invoicesManager.openInvoiceForm();
}

function closeInvoiceForm() {
    window.invoicesManager.closeInvoiceForm();
}

function closeDeleteModal() {
    window.invoicesManager.closeDeleteModal();
}

function confirmDelete() {
    window.invoicesManager.confirmDelete();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.invoicesManager = new InvoicesManager();
});
