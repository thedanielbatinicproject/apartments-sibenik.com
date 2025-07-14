// Reservation form functionality
(function() {
  'use strict';
  
  // Initialize form when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    initializeReservationForm();
  });
  
  function initializeReservationForm() {
    const form = document.getElementById('reservationForm');
    const clearBtn = document.getElementById('clearForm');
    const submitBtn = document.getElementById('submitForm');
    const apartmentSelect = document.getElementById('apartment');
    const checkInInput = document.getElementById('checkIn');
    const checkOutInput = document.getElementById('checkOut');
    const conflictWarning = document.getElementById('dateConflictWarning');
    const messageDiv = document.getElementById('reservation-message');
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    checkInInput.setAttribute('min', today);
    checkOutInput.setAttribute('min', today);
    
    // Form validation setup
    const requiredFields = ['fullName', 'phone', 'apartment', 'checkIn', 'checkOut'];
    
    // Add blur event listeners for required fields
    requiredFields.forEach(fieldName => {
      const field = document.getElementById(fieldName);
      if (field) {
        field.addEventListener('blur', function() {
          validateField(field);
        });
      }
    });

    // Add change event listeners to all form fields to clear warning message
    const allFormFields = ['fullName', 'email', 'phone', 'apartment', 'checkIn', 'checkOut', 'message', 'countryCode'];
    allFormFields.forEach(fieldName => {
      const field = document.getElementById(fieldName);
      if (field) {
        field.addEventListener('input', function() {
          // Clear warning message when user starts typing/changing form
          if (messageDiv.classList.contains('warning')) {
            hideMessage();
            forceSubmit = false; // Reset force submit flag
          }
        });
        
        field.addEventListener('change', function() {
          // Clear warning message when user changes any field
          if (messageDiv.classList.contains('warning')) {
            hideMessage();
            forceSubmit = false; // Reset force submit flag
          }
        });
      }
    });
    
    // Email validation
    const emailField = document.getElementById('email');
    emailField.addEventListener('blur', function() {
      if (this.value && !isValidEmail(this.value)) {
        showFieldError(this, 'Please enter a valid email address');
      } else {
        hideFieldError(this);
      }
    });
    
    // Phone validation
    const phoneField = document.getElementById('phone');
    phoneField.addEventListener('blur', function() {
      if (this.value && !isValidPhone(this.value)) {
        showFieldError(this, 'Please enter a valid phone number');
      } else if (this.value) {
        hideFieldError(this);
      }
    });
    
    // Check-in date change
    checkInInput.addEventListener('change', function() {
      const checkInDate = new Date(this.value);
      const checkOutDate = new Date(checkOutInput.value);
      
      // Set minimum check-out date to day after check-in
      if (this.value) {
        const minCheckOut = new Date(checkInDate);
        minCheckOut.setDate(minCheckOut.getDate() + 1);
        checkOutInput.setAttribute('min', minCheckOut.toISOString().split('T')[0]);
        
        // If check-out is before check-in, clear it
        if (checkOutInput.value && checkOutDate <= checkInDate) {
          checkOutInput.value = '';
        }
      }
      
      // Delay the conflict check to allow for proper date setting
      setTimeout(() => {
        checkDateConflicts();
      }, 100);
    });
    
    // Check-out date change
    checkOutInput.addEventListener('change', function() {
      const checkInDate = new Date(checkInInput.value);
      const checkOutDate = new Date(this.value);
      
      // Validate check-out is after check-in
      if (checkInInput.value && checkOutDate <= checkInDate) {
        showFieldError(this, 'Check-out date must be after check-in date');
        return;
      } else {
        hideFieldError(this);
      }
      
      // Delay the conflict check to allow for proper date setting
      setTimeout(() => {
        checkDateConflicts();
      }, 100);
    });
    
    // Apartment selection change
    apartmentSelect.addEventListener('change', function() {
      // Delay the conflict check to allow for proper apartment setting
      setTimeout(() => {
        checkDateConflicts();
      }, 100);
    });
    
    // Clear form
    clearBtn.addEventListener('click', function() {
      form.reset();
      clearAllErrors();
      hideConflictWarning();
      hideMessage();
      forceSubmit = false; // Reset force submit flag
    });
    
    // Form submission
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      handleFormSubmit();
    });
    
    let forceSubmit = false; // Flag to track if user confirmed submission despite conflict
    
    // Field validation
    function validateField(field) {
      const value = field.value.trim();
      
      if (field.hasAttribute('required') && !value) {
        showFieldError(field, 'This field is required');
        return false;
      } else {
        hideFieldError(field);
        return true;
      }
    }
    
    function isValidEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    }
    
    function isValidPhone(phone) {
      const phoneRegex = /^\d{6,15}$/;
      return phoneRegex.test(phone.replace(/\s+/g, ''));
    }
    
    function showFieldError(field, message) {
      field.classList.add('error');
      const errorDiv = document.getElementById(field.id + '-error');
      if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.add('show');
      }
    }
    
    function hideFieldError(field) {
      field.classList.remove('error');
      const errorDiv = document.getElementById(field.id + '-error');
      if (errorDiv) {
        errorDiv.textContent = '';
        errorDiv.classList.remove('show');
      }
    }
    
    function clearAllErrors() {
      const errorMessages = document.querySelectorAll('.error-message');
      const errorFields = document.querySelectorAll('.form-input.error, .form-select.error, .form-textarea.error');
      
      errorMessages.forEach(msg => {
        msg.textContent = '';
        msg.classList.remove('show');
      });
      
      errorFields.forEach(field => {
        field.classList.remove('error');
      });
    }
    
    function checkDateConflicts() {
      const apartment = apartmentSelect.value;
      const checkIn = checkInInput.value;
      const checkOut = checkOutInput.value;
      
      // Clear any existing field errors for dates
      hideFieldError(checkInInput);
      hideFieldError(checkOutInput);
      
      if (!apartment || !checkIn || !checkOut) {
        hideConflictWarning();
        return;
      }
      
      // Only check for apartments 1 and 2 (Studio and Garden)
      if (apartment !== '1' && apartment !== '2') {
        hideConflictWarning();
        return;
      }
      
      // Validate dates first
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      
      if (checkOutDate <= checkInDate) {
        hideConflictWarning();
        return;
      }
      
      // Show loading state briefly
      conflictWarning.style.display = 'block';
      conflictWarning.innerHTML = '<span class="warning-icon">⏳</span><span class="warning-text">Checking availability...</span>';
      
      // Fetch calendar data and check for conflicts
      fetch('/check-availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apartment: apartment,
          checkIn: checkIn,
          checkOut: checkOut
        })
      })
      .then(response => response.json())
      .then(data => {
        if (data.hasConflict) {
          showConflictWarning();
        } else {
          hideConflictWarning();
        }
      })
      .catch(error => {
        console.error('Error checking availability:', error);
        hideConflictWarning();
      });
    }
    
    function showConflictWarning() {
      conflictWarning.innerHTML = '<span class="warning-icon">⚠️</span><span class="warning-text">These reservation dates conflict with an existing reservation!</span>';
      conflictWarning.style.display = 'block';
    }
    
    function hideConflictWarning() {
      conflictWarning.style.display = 'none';
    }
    
    function showMessage(message, type) {
      messageDiv.textContent = message;
      messageDiv.className = `reservation-message ${type}`;
      messageDiv.style.display = 'block';
      
      // Auto-hide success messages after 5 seconds
      if (type === 'success') {
        setTimeout(() => {
          hideMessage();
        }, 5000);
      }
    }
    
    function hideMessage() {
      messageDiv.style.display = 'none';
    }

    function scrollToMessage() {
      if (messageDiv.style.display !== 'none') {
        messageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    
    function handleFormSubmit() {
      // Validate all fields
      let isValid = true;
      
      requiredFields.forEach(fieldName => {
        const field = document.getElementById(fieldName);
        if (!validateField(field)) {
          isValid = false;
        }
      });
      
      // Additional validations
      const emailField = document.getElementById('email');
      if (emailField.value && !isValidEmail(emailField.value)) {
        showFieldError(emailField, 'Please enter a valid email address');
        isValid = false;
      }
      
      const phoneField = document.getElementById('phone');
      if (!isValidPhone(phoneField.value)) {
        showFieldError(phoneField, 'Please enter a valid phone number');
        isValid = false;
      }
      
      const checkInDate = new Date(checkInInput.value);
      const checkOutDate = new Date(checkOutInput.value);
      if (checkOutDate <= checkInDate) {
        showFieldError(checkOutInput, 'Check-out date must be after check-in date');
        isValid = false;
      }
      
      if (!isValid) {
        showMessage('Please fix the errors in the form', 'error');
        return;
      }
      
      // Show loading state
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';
      
      // Prepare form data
      const formData = {
        fullName: document.getElementById('fullName').value.trim(),
        email: document.getElementById('email').value.trim(),
        countryCode: document.getElementById('countryCode').value,
        phone: document.getElementById('phone').value.trim(),
        apartment: document.getElementById('apartment').value,
        checkIn: document.getElementById('checkIn').value,
        checkOut: document.getElementById('checkOut').value,
        message: document.getElementById('message').value.trim()
      };
      
      // Add forceSubmit flag if user is confirming despite conflict
      if (forceSubmit) {
        formData.forceSubmit = true;
      }
      
      // Submit form
      fetch('/submit-reservation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          showMessage('Reservation request submitted successfully! We will contact you soon.', 'success');
          form.reset();
          clearAllErrors();
          hideConflictWarning();
          forceSubmit = false; // Reset flag
        } else if (data.warning) {
          // Show warning message and scroll to it
          showMessage(data.message, 'warning');
          scrollToMessage();
          forceSubmit = true; // Set flag so next submission goes through
        } else {
          showMessage(data.message || 'There was an error submitting your request. Please try again.', 'error');
          forceSubmit = false; // Reset flag
        }
      })
      .catch(error => {
        console.error('Error submitting form:', error);
        showMessage('There was an error submitting your request. Please try again.', 'error');
        forceSubmit = false; // Reset flag
      })
      .finally(() => {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Reservation';
      });
    }
  }
})();
