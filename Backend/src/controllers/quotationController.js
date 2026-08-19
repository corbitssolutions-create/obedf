import Quotation from '../models/Quotation.js';
import { buildQuery } from '../utils/queryHelper.js';
import { getNextQuotationNumber } from '../utils/counterHelper.js';

const SEARCH_FIELDS = ['quoteNo', 'customer', 'route', 'notes', 'status'];

/** Calculate quotation totals safely */
function calculateQuotationTotals(lineItems = [], overallDiscount = 0) {
  const subtotal = lineItems.reduce((sum, item) => sum + (Number(item.qty || 0) * Number(item.rate || 0)), 0);
  const itemDiscounts = lineItems.reduce((sum, item) => sum + (Number(item.discount || 0)), 0);
  const totalDiscount = itemDiscounts + Number(overallDiscount || 0);

  const discountedSubtotal = Math.max(0, subtotal - totalDiscount);
  const taxTotal = lineItems.reduce((sum, item) => {
    const itemSub = Number(item.qty || 0) * Number(item.rate || 0) - Number(item.discount || 0);
    const taxPct = Number(item.taxPct || 0);
    return sum + (Math.max(0, itemSub) * (taxPct / 100));
  }, 0);

  const grandTotal = discountedSubtotal + taxTotal;
  return { subtotal, taxTotal, totalDiscount, grandTotal };
}

/**
 * @desc    Get all quotations (paginated, searchable, filterable)
 * @route   GET /api/quotations
 * @access  Protected
 */
export const getQuotations = async (req, res, next) => {
  try {
    const result = await buildQuery(Quotation, req.query, SEARCH_FIELDS);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single quotation by ID
 * @route   GET /api/quotations/:id
 * @access  Protected
 */
export const getQuotationById = async (req, res, next) => {
  try {
    const quotation = await Quotation.findById(req.params.id).lean();
    if (!quotation) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }
    res.status(200).json({ success: true, data: quotation });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new quotation
 * @route   POST /api/quotations
 * @access  Protected
 */
export const createQuotation = async (req, res, next) => {
  try {
    let { quoteNo, customer, lineItems, rate, discount, ...rest } = req.body;

    if (!customer || !customer.trim()) {
      return res.status(400).json({ success: false, error: 'Customer is required' });
    }

    if (!quoteNo || !quoteNo.trim()) {
      quoteNo = await getNextQuotationNumber();
    } else {
      quoteNo = quoteNo.trim();
      const existing = await Quotation.findOne({ quoteNo });
      if (existing) {
        return res.status(400).json({ success: false, error: `Quotation number '${quoteNo}' already exists` });
      }
    }

    const { subtotal, taxTotal, totalDiscount, grandTotal } = calculateQuotationTotals(lineItems || [], discount);
    const finalRate = rate || grandTotal;

    const quotation = await Quotation.create({
      ...rest,
      quoteNo,
      customer: customer.trim(),
      lineItems: (lineItems || []).map((item) => ({
        ...item,
        amount: Number(item.qty || 0) * Number(item.rate || 0),
      })),
      subtotal,
      taxTotal,
      discount: totalDiscount,
      rate: finalRate,
      createdBy: req.user ? req.user.fullName : (rest.createdBy || 'Admin User'),
    });

    res.status(201).json({
      success: true,
      message: 'Quotation created successfully',
      data: quotation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update quotation
 * @route   PUT /api/quotations/:id
 * @access  Protected
 */
export const updateQuotation = async (req, res, next) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }

    const updateData = { ...req.body };

    if (updateData.lineItems) {
      const { subtotal, taxTotal, totalDiscount, grandTotal } = calculateQuotationTotals(
        updateData.lineItems,
        updateData.discount || quotation.discount
      );
      updateData.subtotal = subtotal;
      updateData.taxTotal = taxTotal;
      updateData.discount = totalDiscount;
      if (!updateData.rate) {
        updateData.rate = grandTotal;
      }
    }

    const updated = await Quotation.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Quotation updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete quotation
 * @route   DELETE /api/quotations/:id
 * @access  Protected
 */
export const deleteQuotation = async (req, res, next) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }

    await quotation.deleteOne();
    res.status(200).json({ success: true, message: 'Quotation deleted successfully' });
  } catch (error) {
    next(error);
  }
};
