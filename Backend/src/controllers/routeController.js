import Route from '../models/Route.js';
import { buildQuery } from '../utils/queryHelper.js';

const SEARCH_FIELDS = ['name', 'routeCode', 'startPoint', 'destination', 'origin'];

const POPULATE = [
  { path: 'zone',              select: 'code name' },
  { path: 'originBranch',      select: 'code name city' },
  { path: 'destinationBranch', select: 'code name city' },
  { path: 'branches',          select: '_id code name' },
  { path: 'driver',            select: '_id fullName employeeId status' },
  { path: 'vehicle',           select: '_id vehicleCode registrationNumber status' },
];

/** GET /api/routes */
export const getRoutes = async (req, res, next) => {
  try {
    const result = await buildQuery(Route, req.query, SEARCH_FIELDS, {}, POPULATE);
    res.status(200).json({ success: true, ...result });
  } catch (e) { next(e); }
};

/** GET /api/routes/lookup */
export const lookupRoutes = async (req, res, next) => {
  try {
    const routes = await Route.find({ status: 'Active' })
      .select('_id routeCode name startPoint destination distanceKm estimatedHours')
      .sort({ name: 1 }).lean();
    res.status(200).json({ success: true, data: routes });
  } catch (e) { next(e); }
};

/** GET /api/routes/:id */
export const getRouteById = async (req, res, next) => {
  try {
    const route = await Route.findById(req.params.id).populate(POPULATE).lean();
    if (!route) return res.status(404).json({ success: false, error: 'Route not found' });
    res.status(200).json({ success: true, data: route });
  } catch (e) { next(e); }
};

/** POST /api/routes */
export const createRoute = async (req, res, next) => {
  try {
    const { name, routeCode } = req.body;

    if (!name?.trim())     return res.status(400).json({ success: false, error: 'Route name is required' });
    if (!routeCode?.trim()) return res.status(400).json({ success: false, error: 'Route code is required' });

    const route = await Route.create({
      ...req.body,
      routeCode: routeCode.trim().toUpperCase(),
      name: name.trim(),
      createdBy: req.user?._id,
    });

    res.status(201).json({ success: true, message: 'Route created successfully', data: route });
  } catch (e) { next(e); }
};

/** PUT /api/routes/:id */
export const updateRoute = async (req, res, next) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) return res.status(404).json({ success: false, error: 'Route not found' });

    const updated = await Route.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: false })
      .populate(POPULATE);
    res.status(200).json({ success: true, message: 'Route updated successfully', data: updated });
  } catch (e) { next(e); }
};

/** DELETE /api/routes/:id */
export const deleteRoute = async (req, res, next) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) return res.status(404).json({ success: false, error: 'Route not found' });
    await route.deleteOne();
    res.status(200).json({ success: true, message: 'Route deleted successfully' });
  } catch (e) { next(e); }
};
