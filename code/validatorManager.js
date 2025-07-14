const { body } = require('express-validator');

// Reservation form validation rules
const reservationValidationRules = [
  body('fullName')
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({min: 2})
    .withMessage('Full name must be at least 2 characters'),
  
  body('email')
    .optional({ nullable: true, checkFalsy: true })
    .isEmail()
    .withMessage('Please enter a valid email address'),
  
  body('countryCode')
    .notEmpty()
    .withMessage('Country code is required'),
  
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^\d{6,15}$/)
    .withMessage('Phone number must be 6-15 digits'),
  
  body('apartment')
    .notEmpty()
    .withMessage('Apartment selection is required')
    .isIn(['1', '2', '3'])
    .withMessage('Invalid apartment selection'),
  
  body('checkIn')
    .notEmpty()
    .withMessage('Check-in date is required')
    .isISO8601()
    .withMessage('Invalid check-in date'),
  
  body('checkOut')
    .notEmpty()
    .withMessage('Check-out date is required')
    .isISO8601()
    .withMessage('Invalid check-out date'),
  
  body('message')
    .optional()
    .isLength({max: 1000})
    .withMessage('Message must be less than 1000 characters')
];

module.exports = {
  reservationValidationRules
};
