import Customer from '../models/Customer.js';
import { buildQuery } from '../utils/queryHelper.js';

const SEARCH_FIELDS = ['name', 'contact', 'email', 'address'];

/**
 * @desc    Get all customers (paginated, searchable, filterable)
 * @route   GET /api/customers
 * @access  Protected
 */
export const getCustomers = async (req, res, next) => {
  try {
    const result = await buildQuery(Customer, req.query, SEARCH_FIELDS);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lightweight list for dropdowns — returns all active customers with full details
 *          so the frontend can auto-populate waybill forms on selection
 * @route   GET /api/customers/lookup
 * @access  Protected
 */
export const lookupCustomers = async (req, res, next) => {
  try {
    const customers = await Customer.find({ status: 'Active' })
      .select('_id name pickupPoints contact email address wechat')
      .sort({ name: 1 })
      .lean();
    res.status(200).json({ success: true, data: customers });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single customer details
 * @route   GET /api/customers/:id
 * @access  Protected
 */
export const getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id).lean();

    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new customer
 * @route   POST /api/customers
 * @access  Protected
 */
export const createCustomer = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Customer name is required' });
    }

    const existing = await Customer.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: `Customer with name '${name}' already exists`,
      });
    }

    // Auto-generate customerCode if not provided
    let customerCode = req.body.customerCode?.trim().toUpperCase();
    if (!customerCode) {
      const count = await Customer.countDocuments({});
      customerCode = `CUST-${String(count + 1).padStart(4, '0')}`;
      // Ensure uniqueness
      let suffix = count + 1;
      while (await Customer.findOne({ customerCode })) {
        suffix++;
        customerCode = `CUST-${String(suffix).padStart(4, '0')}`;
      }
    }

    const customer = await Customer.create({
      ...req.body,
      name: name.trim(),
      customerCode,
    });

    res.status(201).json({
      success: true,
      message: 'Customer registered successfully',
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update customer details
 * @route   PUT /api/customers/:id
 * @access  Protected
 */
export const updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    const updated = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a customer
 * @route   DELETE /api/customers/:id
 * @access  Protected
 */
export const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    await customer.deleteOne();

    res.status(200).json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    next(error);
  }
};
