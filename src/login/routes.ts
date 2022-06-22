import express from 'express';
import rootEndpoint from './root/endpoint';

const router = express.Router();

router.get('/', rootEndpoint);

export default router;
