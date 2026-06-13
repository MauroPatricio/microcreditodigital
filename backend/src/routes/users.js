import express from 'express';
import { getUsers, getUser, createUser, updateUser, deleteUser } from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';
import { auditAction } from '../middleware/auditMiddleware.js';

const router = express.Router();

// Todas as rotas de gestão de utilizadores requerem proteção e privilégios administrativos
router.use(protect);
router.use(authorize('owner', 'super_admin', 'admin', 'manager'));

router.route('/')
    .get(getUsers)
    .post(auditAction('User', 'create_user', 'high'), createUser);

router.route('/:id')
    .get(getUser)
    .put(auditAction('User', 'update_user', 'high'), updateUser)
    .delete(auditAction('User', 'delete_user', 'critical'), deleteUser);

export default router;
