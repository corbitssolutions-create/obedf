import CreditDebitNote from '../models/CreditDebitNote.js';
import { buildQuery } from '../utils/queryHelper.js';
import { getNextCreditNoteNumber, getNextDebitNoteNumber } from '../utils/counterHelper.js';

const SEARCH_FIELDS = ['noteNo', 'customer', 'invoiceRef', 'description', 'reason', 'type', 'status'];

/**
 * @desc    Get all Credit/Debit Notes (paginated, searchable, filterable)
 * @route   GET /api/credit-debit-notes
 * @access  Protected
 */
export const getNotes = async (req, res, next) => {
  try {
    const { type, ...queryParams } = req.query;
    const extraFilter = {};
    if (type) {
      extraFilter.type = type;
    }
    const result = await buildQuery(CreditDebitNote, queryParams, SEARCH_FIELDS, extraFilter);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single Credit/Debit Note by ID
 * @route   GET /api/credit-debit-notes/:id
 * @access  Protected
 */
export const getNoteById = async (req, res, next) => {
  try {
    const note = await CreditDebitNote.findById(req.params.id).lean();
    if (!note) {
      return res.status(404).json({ success: false, error: 'Credit/Debit Note not found' });
    }
    res.status(200).json({ success: true, data: note });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new Credit/Debit Note
 * @route   POST /api/credit-debit-notes
 * @access  Protected
 */
export const createNote = async (req, res, next) => {
  try {
    let { noteNo, type, customer, amount, ...rest } = req.body;

    if (!type || !['Credit', 'Debit'].includes(type)) {
      return res.status(400).json({ success: false, error: "Note type must be either 'Credit' or 'Debit'" });
    }

    if (!customer || !customer.trim()) {
      return res.status(400).json({ success: false, error: 'Customer is required' });
    }

    if (!noteNo || !noteNo.trim()) {
      if (type === 'Credit') {
        noteNo = await getNextCreditNoteNumber();
      } else {
        noteNo = await getNextDebitNoteNumber();
      }
    } else {
      noteNo = noteNo.trim();
      const existing = await CreditDebitNote.findOne({ noteNo });
      if (existing) {
        return res.status(400).json({ success: false, error: `Note number '${noteNo}' already exists` });
      }
    }

    const note = await CreditDebitNote.create({
      ...rest,
      noteNo,
      type,
      customer: customer.trim(),
      amount: Number(amount || 0),
      createdBy: req.user ? req.user.fullName : (rest.createdBy || 'Admin User'),
    });

    res.status(201).json({
      success: true,
      message: `${type} Note created successfully`,
      data: note,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update Credit/Debit Note
 * @route   PUT /api/credit-debit-notes/:id
 * @access  Protected
 */
export const updateNote = async (req, res, next) => {
  try {
    const note = await CreditDebitNote.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ success: false, error: 'Credit/Debit Note not found' });
    }

    const updated = await CreditDebitNote.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Note updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete Credit/Debit Note
 * @route   DELETE /api/credit-debit-notes/:id
 * @access  Protected
 */
export const deleteNote = async (req, res, next) => {
  try {
    const note = await CreditDebitNote.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ success: false, error: 'Credit/Debit Note not found' });
    }

    await note.deleteOne();
    res.status(200).json({ success: true, message: 'Note deleted successfully' });
  } catch (error) {
    next(error);
  }
};
