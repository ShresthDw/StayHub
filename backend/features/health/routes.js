import express from 'express';
import { getHealthStatus, getPing } from './healthController.js';

const router = express.Router();

router.get('/', getHealthStatus);
router.get('/ping', getPing);

// Support HEAD requests for lightweight uptime probes
router.head('/', (req, res) => res.status(200).end());
router.head('/ping', (req, res) => res.status(200).end());

export default router;
