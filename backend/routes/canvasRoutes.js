import { Router } from 'express';
import passport from 'passport';
import logger from '../config/logger.js';
import {createCanvas} from '../controllers/CanvasControllers/createCanvas.js';
import {findCanvasById} from '../controllers/CanvasControllers/findCanvasById.js';
import {findAllCanvases} from '../controllers/CanvasControllers/findAllCanvases.js';
import {findAllCanvasesByOwnerId} from '../controllers/CanvasControllers/findAllCanvasesByOwnerId.js';
import {findAllCanvasesBySharedWithIds} from '../controllers/CanvasControllers/findAllCanvasesBySharedWithIds.js';

const router = Router();

// All canvas routes require JWT authentication
router.use(passport.authenticate('jwt', { session: false }));

router.post('/create', async (req, res) => {
    try {
        const { name, description, shared_with_ids, elements, background_color, background_image_url } = req.body;
        // Use authenticated user's ID as owner_id
        const owner_id = req.user.id;
        const canvas = await createCanvas(name, description, owner_id, shared_with_ids, elements, background_color, background_image_url);
        return res.status(201).json({ message: 'Canvas created successfully', canvas });
    } catch (error) {
        logger.error(error, "Error creating canvas");
        return res.status(500).json({ error: error.message });
    }
});

router.get('/get/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const canvas = await findCanvasById(id);
        if (!canvas) {
            return res.status(404).json({ error: 'Canvas not found' });
        }
        return res.status(200).json({ message: 'Canvas fetched successfully', canvas });
    } catch (error) {
        logger.error(error, "Error fetching canvas");
        return res.status(500).json({ error: error.message });
    }
});


router.get('/get-all', async (req, res) => {
    try {
        const canvases = await findAllCanvases();
        return res.status(200).json({ message: 'Canvases fetched successfully', canvases });
    } catch (error) {
        logger.error(error, "Error fetching canvases");
        return res.status(500).json({ error: error.message });
    }
});


router.get('/get-all-by-owner-id', async (req, res) => {
    try {
        // Use authenticated user's ID as owner_id
        const owner_id = req.user.id;
        const canvases = await findAllCanvasesByOwnerId(owner_id);
        return res.status(200).json({ message: 'Canvases fetched successfully', canvases });
    } catch (error) {
        logger.error(error, "Error fetching canvases");
        return res.status(500).json({ error: error.message });
    }
});

router.get('/get-all-by-shared-with-ids', async (req, res) => {
    try {
        // Use authenticated user's ID
        const user_id = req.user.id;
        const canvases = await findAllCanvasesBySharedWithIds(user_id);
        return res.status(200).json({ message: 'Canvases fetched successfully', canvases });
    } catch (error) {
        logger.error(error, "Error fetching canvases");
        return res.status(500).json({ error: error.message });
    }
});

export default router;