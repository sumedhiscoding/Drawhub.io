import { Router } from 'express';
import passport from 'passport';
import logger from '../config/logger.js';
import {createCanvas} from '../controllers/CanvasControllers/createCanvas.js';
import {findCanvasById} from '../controllers/CanvasControllers/findCanvasById.js';
import {findAllCanvases} from '../controllers/CanvasControllers/findAllCanvases.js';
import {findAllCanvasesByOwnerId} from '../controllers/CanvasControllers/findAllCanvasesByOwnerId.js';
import {findAllCanvasesBySharedWithIds} from '../controllers/CanvasControllers/findAllCanvasesBySharedWithIds.js';
import {updateCanvas} from '../controllers/CanvasControllers/updateCanvas.js';

const router = Router();

// All canvas routes require JWT authentication
router.use(passport.authenticate('jwt', { session: false }));

router.post('/create', async (req, res) => {
    try {
        const { name, description, shared_with_ids, elements, background_color, background_image_url } = req.body;
        
        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Canvas name is required' });
        }
        
        // Use authenticated user's ID as owner_id
        const owner_id = req.user.id;
        const canvas = await createCanvas(name.trim(), owner_id, {
            description,
            shared_with_ids,
            elements,
            background_color,
            background_image_url
        });
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

router.put('/update/:id', async (req, res) => {
 
    try {
        const { id } = req.params;
        const { name, description, shared_with_ids, elements, background_color, background_image_url } = req.body;
        const owner_id = req.user.id;
        console.log(name, description, shared_with_ids, elements, background_color, background_image_url);
        // Build update object with only provided fields
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (shared_with_ids !== undefined) updateData.shared_with_ids = shared_with_ids;
        if (elements !== undefined) updateData.elements = elements;
        if (background_color !== undefined) updateData.background_color = background_color;
        if (background_image_url !== undefined) updateData.background_image_url = background_image_url;
        console.log(updateData);
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'At least one field must be provided for update' });
        }
        
        const canvas = await updateCanvas(id, owner_id, updateData);
        return res.status(200).json({ message: 'Canvas updated successfully', canvas });
    } catch (error) {
        logger.error(error, "Error updating canvas");
        if (error.message.includes('permission')) {
            return res.status(403).json({ error: error.message });
        }
        return res.status(500).json({ error: error.message });
    }
});

export default router;