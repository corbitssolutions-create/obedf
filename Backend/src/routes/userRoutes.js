import express from 'express';
import {
  getUsers,
  lookupUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Lookup before /:id
router.get('/lookup', lookupUsers);

router.route('/')
  .get(authorize('Super Admin', 'Administrator'), getUsers)
  .post(authorize('Super Admin', 'Administrator'), createUser);

router.route('/:id')
  // Allow any authenticated user to fetch their OWN profile (needed for AT Branch lookup)
  // Admins can fetch any user's profile
  .get((req, res, next) => {
    if (req.params.id === req.user._id.toString()) return next(); // self-access always allowed
    return authorize('Super Admin', 'Administrator')(req, res, next);
  }, getUserById)
  .put(authorize('Super Admin', 'Administrator'), updateUser)
  .delete(authorize('Super Admin', 'Administrator'), deleteUser);

export default router;
