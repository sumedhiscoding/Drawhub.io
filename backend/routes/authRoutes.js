import { Router } from 'express';
import { hashPassword } from '../utils/hashing.js';
import validateUser from '../utils/validator.js';
import registerUser from '../controllers/register.js';
import loginUser from '../controllers/login.js';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import logger from '../config/logger.js';
const router = Router();

router.post('/register', validateUser, async (req, res) => {
	try {
		const { name, email, password } = req.body;
		const hashedPassword = await hashPassword(password);
		logger.info(`Registering user: ${name}, ${email}, ${hashedPassword}`);
		const user = await registerUser(name, email, hashedPassword);
		logger.info(`User registered successfully: ${user}`);
		res.status(201).json({ message: 'User registered successfully' });
	} catch (error) {
		logger.error(error, "Error registering user");
		return res.status(500).json({ error: error.message });
	}
})
router.post('/login', async (req, res) => {
	try {
		const { email, password } = req.body;
		
		if (!email || !password) {
			return res.status(400).json({ 
				message: 'Email and password are required' 
			});
		}
		const user = await loginUser(email, password);
		
		if (!user) {
			return res.status(401).json({ 
				message: 'Invalid email or password' 
			});
		}
		
		// Generate JWT token with user ID in 'sub' field (as expected by JWT strategy)
		const token = jwt.sign(
			{ sub: user.id }, 
			'secret',
			{ expiresIn: '7d' }
		);
		
		return res.json({ 
			user, 
			token 
		});
	} catch (error) {
		logger.error(error, "Login error");
		return res.status(500).json({ 
			error: error.message 
		});
	}
});
router.get('/profile', passport.authenticate('jwt', { session: false }), (req, res) => {
	try {
		return res.json(req.user);
	} catch (error) {
		logger.error(error, "Error getting profile");
		return res.status(500).json({ error: error.message });
	}
});

export default router;
