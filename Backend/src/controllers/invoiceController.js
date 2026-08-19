import Invoice from '../models/Invoice.js';
import { buildQuery } from '../utils/queryHelper.js';
import { getNextInvoiceNumber } from '../utils/counterHelper.js';

const SEARCH_FIELDS = ['invoiceNo', 'customer', 'branch', 'notes', 'status'];

/** Calculate totals safely */
function calculateInvoiceTotals(lineItems = []) {
  const subtotal = lineItems.reduce((sum, item) => sum + (Number(item.qty || 0) * Number(item.rate || 0)), 0);
  const taxTotal = lineItems.reduce((sum, item) => {
    const itemSub = Number(item.qty || 0) * Number(item.rate || 0);
    const taxPct = Number(item.taxPct || 0);
    return sum + (itemSub * (taxPct / 100));
  }, 0);
  const amount = subtotal + taxTotal;
  return { subtotal, taxTotal, amount };
}

/**
 * @desc    Get all invoices (paginated, searchable, filterable)
 * @route   GET /api/invoices
 * @access  Protected
 */
export const getInvoices = async (req, res, next) => {
  try {
    const result = await buildQuery(Invoice, req.query, SEARCH_FIELDS);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single invoice by ID
 * @route   GET /api/invoices/:id
 * @access  Protected
 */
export const getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id).lean();
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }
    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new invoice
 * @route   POST /api/invoices
 * @access  Protected
 */
export const createInvoice = async (req, res, next) => {
  try {
    let { invoiceNo, customer, lineItems, amount, balance, ...rest } = req.body;

    if (!customer || !customer.trim()) {
      return res.status(400).json({ success: false, error: 'Customer is required' });
    }

    if (!invoiceNo || !invoiceNo.trim()) {
      invoiceNo = await getNextInvoiceNumber();
    } else {
      invoiceNo = invoiceNo.trim();
      const existing = await Invoice.findOne({ invoiceNo });
      if (existing) {
        return res.status(400).json({ success: false, error: `Invoice number '${invoiceNo}' already exists` });
      }
    }

    const { subtotal, taxTotal, amount: calculatedAmount } = calculateInvoiceTotals(lineItems || []);
    const finalAmount = amount || calculatedAmount;
    const finalBalance = balance !== undefined ? balance : finalAmount;

    const invoice = await Invoice.create({
      ...rest,
      invoiceNo,
      customer: customer.trim(),
      lineItems: (lineItems || []).map((item) => ({
        ...item,
        amount: Number(item.qty || 0) * Number(item.rate || 0) * (1 + (Number(item.taxPct || 0) / 100)),
      })),
      subtotal,
      taxTotal,
      amount: finalAmount,
      balance: finalBalance,
      createdBy: req.user ? req.user.fullName : (rest.createdBy || 'Admin User'),
    });

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update invoice
 * @route   PUT /api/invoices/:id
 * @access  Protected
 */
export const updateInvoice = async (req, res, next) => {
  try {
    const existingInvoice = await Invoice.findById(req.params.id);
    if (!existingInvoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    const updateData = { ...req.body };

    if (updateData.lineItems) {
      const { subtotal, taxTotal, amount: calculatedAmount } = calculateInvoiceTotals(updateData.lineItems);
      updateData.subtotal = subtotal;
      updateData.taxTotal = taxTotal;
      if (!updateData.amount) {
        updateData.amount = calculatedAmount;
      }
      // Re-calculate balance if total paid exists
      const totalPaid = (existingInvoice.payments || []).reduce((s, p) => s + p.amount, 0);
      updateData.balance = Math.max(0, updateData.amount - totalPaid);
    }

    const updated = await Invoice.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Invoice updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete invoice
 * @route   DELETE /api/invoices/:id
 * @access  Protected
 */
export const deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }
    await invoice.deleteOne();
    res.status(200).json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Record payment for invoice
 * @route   POST /api/invoices/:id/payment
 * @access  Protected
 */
export const recordPayment = async (req, res, next) => {
  try {
    const { amount, paymentMethod, reference, notes } = req.body;
    const paymentAmount = Number(amount);

    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Valid payment amount is required' });
    }

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    invoice.payments.push({
      amount: paymentAmount,
      paymentMethod: paymentMethod || 'EFT',
      reference: reference || '',
      notes: notes || '',
      recordedBy: req.user ? req.user.fullName : 'Admin User',
    });

    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    invoice.balance = Math.max(0, invoice.amount - totalPaid);

    if (invoice.balance === 0) {
      invoice.status = 'Paid';
    } else if (totalPaid > 0) {
      invoice.status = 'Partially Paid';
    }

    await invoice.save();

    res.status(200).json({
      success: true,
      message: 'Payment recorded successfully',
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};
