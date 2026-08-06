/**
 * Shared query builder for pagination, search, filtering, and sorting.
 * Keeps every controller DRY and consistent.
 *
 * @param {Object} Model          - Mongoose model
 * @param {Object} queryParams    - req.query
 * @param {Array}  searchFields   - fields to apply the $regex search against
 * @param {Object} extraFilter    - additional hard filter to always apply (e.g. { status: 'Active' })
 * @param {Object} populateOpts   - optional populate config
 * @returns {Object}              - { data, pagination }
 */
export const buildQuery = async (
  Model,
  queryParams = {},
  searchFields = [],
  extraFilter = {},
  populateOpts = null
) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    sort = 'createdAt:desc',
    status,
    ...rest
  } = queryParams;

  const filter = { ...extraFilter };

  // Status filter
  if (status) {
    filter.status = status;
  }

  // Dynamic additional filters from query string (e.g. ?branch=xxx&vehicleType=Truck)
  const reservedKeys = new Set(['page', 'limit', 'search', 'sort', 'status']);
  for (const [key, value] of Object.entries(rest)) {
    if (!reservedKeys.has(key) && value !== '' && value !== undefined) {
      filter[key] = value;
    }
  }

  // Search across defined fields
  if (search && searchFields.length > 0) {
    filter.$or = searchFields.map((field) => ({
      [field]: { $regex: search, $options: 'i' },
    }));
  }

  // Sort parsing — e.g. "createdAt:desc" or "name:asc"
  let sortBy = { createdAt: -1 };
  if (sort) {
    const parts = sort.split(':');
    sortBy = { [parts[0]]: parts[1] === 'desc' ? -1 : 1 };
  }

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(200, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const total = await Model.countDocuments(filter);

  let query = Model.find(filter).sort(sortBy).skip(skip).limit(limitNum);

  if (populateOpts) {
    if (Array.isArray(populateOpts)) {
      populateOpts.forEach((opt) => { query = query.populate(opt); });
    } else {
      query = query.populate(populateOpts);
    }
  }

  const data = await query.lean();

  return {
    data,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  };
};
