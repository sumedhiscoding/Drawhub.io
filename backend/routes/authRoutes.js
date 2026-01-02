import { Router } from 'express';
import { hashPassword } from '../utils/hashing.js';
import validateUser from '../utils/validator.js';
import registerUser from '../controllers/UserControllers/register.js';
import loginUser from '../controllers/UserControllers/login.js';
import getUser from '../controllers/UserControllers/getUser.js';
import getAllUsersController from '../controllers/UserControllers/getAllUsers.js';
import updateUserController from '../controllers/UserControllers/updateUser.js';
import updatePassword from '../controllers/UserControllers/updatePassword.js';
import deleteUserController from '../controllers/UserControllers/deleteUser.js';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import logger from '../config/logger.js';
const router = Router();

// Public routes
router.post('/register', validateUser, async (req, res) => {
	try {
		const { name, email, password } = req.body;
		const hashedPassword = await hashPassword(password);
		logger.info(`Registering user: ${name}, ${email}`);
		const user = await registerUser(name, email, hashedPassword);
		if (!user) {
			return res.status(500).json({ error: 'Failed to register user' });
		}
		logger.info(`User registered successfully: ${user.id}`);
		res.status(201).json({ message: 'User registered successfully', user });
	} catch (error) {
		logger.error(error, "Error registering user");
		return res.status(500).json({ error: error.message });
	}
});
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
			process.env.JWT_SECRET || 'secret',
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
// Protected routes (require JWT authentication)
router.get('/profile', passport.authenticate('jwt', { session: false }), async (req, res) => {
	try {
		return res.json(req.user);
	} catch (error) {
		logger.error(error, "Error getting profile");
		return res.status(500).json({ error: error.message });
	}
});

// Get current user (same as profile but more explicit)
router.get('/me', passport.authenticate('jwt', { session: false }), async (req, res) => {
	try {
		return res.json(req.user);
	} catch (error) {
		logger.error(error, "Error getting current user");
		return res.status(500).json({ error: error.message });
	}
});

// Get all users (with pagination) - must come before /:id route
router.get('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
	try {
		const from = parseInt(req.query.from) || 0;
		const to = parseInt(req.query.to) || 10;
		const orderBy = req.query.orderBy || 'name';
		const order = req.query.order || 'ASC';
		
		const result = await getAllUsersController(from, to, orderBy, order);
		return res.json(result);
	} catch (error) {
		logger.error(error, "Error getting all users");
		return res.status(500).json({ error: error.message });
	}
});

// Get user by ID
router.get('/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
	try {
		const { id } = req.params;
		const user = await getUser(id);
		
		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}
		
		return res.json(user);
	} catch (error) {
		logger.error(error, "Error getting user");
		return res.status(500).json({ error: error.message });
	}
});

// Update user
router.put('/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
	try {
		const { id } = req.params;
		const { name, email } = req.body;
		
		// Only allow users to update their own profile unless admin
		if (req.user.id !== parseInt(id)) {
			return res.status(403).json({ error: 'You can only update your own profile' });
		}
		
		if (!name && !email) {
			return res.status(400).json({ error: 'Name or email is required' });
		}
		
		const updatedUser = await updateUserController(id, { name, email });
		return res.json({ message: 'User updated successfully', user: updatedUser });
	} catch (error) {
		logger.error(error, "Error updating user");
		return res.status(500).json({ error: error.message });
	}
});

// Update password
router.put('/:id/password', passport.authenticate('jwt', { session: false }), async (req, res) => {
	try {
		const { id } = req.params;
		const { oldPassword, newPassword } = req.body;
		
		// Only allow users to update their own password
		if (req.user.id !== parseInt(id)) {
			return res.status(403).json({ error: 'You can only update your own password' });
		}
		
		if (!oldPassword || !newPassword) {
			return res.status(400).json({ error: 'Old password and new password are required' });
		}
		
		const updatedUser = await updatePassword(id, oldPassword, newPassword);
		return res.json({ message: 'Password updated successfully', user: updatedUser });
	} catch (error) {
		logger.error(error, "Error updating password");
		return res.status(500).json({ error: error.message });
	}
});

// Delete user
router.delete('/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
	try {
		const { id } = req.params;
		
		// Only allow users to delete their own account unless admin
		if (req.user.id !== parseInt(id)) {
			return res.status(403).json({ error: 'You can only delete your own account' });
		}
		
		await deleteUserController(id);
		return res.json({ message: 'User deleted successfully' });
	} catch (error) {
		logger.error(error, "Error deleting user");
		return res.status(500).json({ error: error.message });
	}
});

export default router;
