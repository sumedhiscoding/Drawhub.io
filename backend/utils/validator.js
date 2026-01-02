import { check, validationResult } from 'express-validator';
import logger from '../config/logger.js';

const validateUser = [
  check('email').isEmail().withMessage('Invalid email format'),
  check('password').isStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1
  }).withMessage('Password must be at least 8 characters long and include an uppercase letter, a number, and a special character.'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error(errors.array(), "Validation errors");
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

export default validateUser;