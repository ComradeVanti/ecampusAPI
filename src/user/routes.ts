import express from 'express';
import coursesEndpoint from './courses/endpoint';

const router = express.Router();

router.get('/courses', coursesEndpoint);

export default router;
