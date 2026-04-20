const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole, parserAuth } = require('../middleware/auth.middleware');
const authCtrl = require('../controllers/auth.controller');
const commentsCtrl = require('../controllers/comments.controller');
const accountsCtrl = require('../controllers/accounts.controller');
const settingsCtrl = require('../controllers/settings.controller');

// Auth
router.post('/auth/login', authCtrl.login);
router.get('/auth/me', authMiddleware, authCtrl.getMe);

// Users (admin only)
router.get('/users', authMiddleware, requireRole('admin'), authCtrl.getUsers);
router.post('/users', authMiddleware, requireRole('admin'), authCtrl.createUser);
router.delete('/users/:id', authMiddleware, requireRole('admin'), authCtrl.deleteUser);

// Comments
router.get('/comments', authMiddleware, commentsCtrl.getComments);
router.get('/comments/stats', authMiddleware, commentsCtrl.getStats);
router.post('/comments/bulk', parserAuth, commentsCtrl.bulkCreateComments); // Parser жөнөтөт (internal)
router.patch('/comments/:id/process', authMiddleware, commentsCtrl.processComment);
router.delete('/comments/cleanup', authMiddleware, requireRole('admin'), commentsCtrl.cleanupComments);

// Target accounts
router.get('/accounts/targets', authMiddleware, accountsCtrl.getTargets);
router.post('/accounts/targets', authMiddleware, requireRole('admin'), accountsCtrl.createTarget);
router.patch('/accounts/targets/:id/toggle', authMiddleware, requireRole('admin'), accountsCtrl.toggleTarget);
router.delete('/accounts/targets/:id', authMiddleware, requireRole('admin'), accountsCtrl.deleteTarget);

// Parser accounts
router.get('/accounts/parsers', authMiddleware, requireRole('admin'), accountsCtrl.getParsers);
router.post('/accounts/parsers', authMiddleware, requireRole('admin'), accountsCtrl.createParser);
router.delete('/accounts/parsers/:id', authMiddleware, requireRole('admin'), accountsCtrl.deleteParser);
router.post('/accounts/parsers/:id/cookies', authMiddleware, requireRole('admin'), accountsCtrl.uploadCookies);
router.post('/accounts/parsers/:id/instagram-login', authMiddleware, requireRole('admin'), accountsCtrl.instagramLogin);

// Settings (admin only)
router.get('/settings', authMiddleware, requireRole('admin'), settingsCtrl.getSettings);
router.put('/settings', authMiddleware, requireRole('admin'), settingsCtrl.updateSettings);

// Parser internal routes — настройкаларды парсер алсын
router.get('/parser/settings', parserAuth, settingsCtrl.getSettings);

// Parser internal routes (X-Parser-Token менен)
router.get('/parser/targets', parserAuth, accountsCtrl.getTargets);
router.get('/parser/parsers', parserAuth, accountsCtrl.getParsers);
router.patch('/parser/parsers/:id/status', parserAuth, accountsCtrl.updateParserStatus);
router.get('/parser/parsers/:id/cookies', parserAuth, accountsCtrl.getParserWithCookies);
router.post('/parser/parsers/:id/cookies', parserAuth, accountsCtrl.uploadCookies);

module.exports = router;
