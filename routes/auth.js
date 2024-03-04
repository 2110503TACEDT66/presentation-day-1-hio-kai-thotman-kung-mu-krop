const express = require('express');
const { register, login,getMe, logout,Update} = require('../controllers/auth');

const router = express.Router();

const {protect,authorize} = require('../middleware/auth');

router.post('/register', register);
router.post('/login',login);
router.get('/me',protect,getMe);
router.get('/logout',logout);

router.route('/:id').put(protect,authorize('admin','user'),Update);

module.exports = router;