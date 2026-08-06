import BillingAccount from '../models/BillingAccount.js';
import { buildQuery } from '../utils/queryHelper.js';

const SEARCH = ['billingAccountCode', 'billingAccountName', 'contactPerson', 'email', 'vatNumber', 'billingContactPerson', 'billingEmail'];

const POPULATE = [
  { path: 'customer',           select: 'customerCode name email phone' },
  { path: 'branch',             select: 'code name city' },
  { path: 'currency',           select: 'code symbol name' },
  { path: 'defaultRateCard',    select: 'code name' },
  { path: 'paymentTerms',       select: 'code name days' },
  { path: 'defaultRateType',    select: 'code name unit' },
  { path: 'defaultServiceType', select: 'code name transitDays' },
];

export const getBillingAccounts = async (req, res, next) => {
  try {
    const result = await buildQuery(BillingAccount, req.query, SEARCH, {}, POPULATE);
    res.status(200).json({ success: true, ...result });
  } catch (e) { next(e); }
};

export const lookupBillingAccounts = async (req, res, next) => {
  try {
    const filter = { accountStatus: 'Active' };
    if (req.query.customer) filter.customer = req.query.customer;
    const items = await BillingAccount.find(filter)
      .select('_id billingAccountCode billingAccountName customer currency creditLimit billingContactPerson billingEmail billingPhone defaultPaymentType paymentCollectionType defaultRateType defaultServiceType extraCharges senderName senderContactPerson senderPhone senderEmail senderAddress')
      .populate('customer',           'customerCode name')
      .populate('defaultRateType',    'code name unit')
      .populate('defaultServiceType', 'code name transitDays')
      .sort({ billingAccountName: 1 })
      .lean();
    res.status(200).json({ success: true, data: items });
  } catch (e) { next(e); }
};

export const getBillingAccountById = async (req, res, next) => {
  try {
    const doc = await BillingAccount.findById(req.params.id).populate(POPULATE).lean();
    if (!doc) return res.status(404).json({ success: false, error: 'Billing account not found' });
    res.status(200).json({ success: true, data: doc });
  } catch (e) { next(e); }
};

/**
 * @desc  Return only the fields needed to auto-populate a Waybill form
 * @route GET /api/billing-accounts/:id/defaults
 * @access Protected
 */
export const getBillingAccountDefaults = async (req, res, next) => {
  try {
    const doc = await BillingAccount.findById(req.params.id)
      .select('billingContactPerson billingEmail billingPhone defaultRateType defaultServiceType defaultPaymentType paymentCollectionType extraCharges senderName senderContactPerson senderPhone senderEmail senderAddress')
      .populate('defaultRateType',    'code name unit')
      .populate('defaultServiceType', 'code name transitDays')
      .lean();

    if (!doc) return res.status(404).json({ success: false, error: 'Billing account not found' });

    // Only return active extra charges for Waybill pre-population
    const activeExtraCharges = (doc.extraCharges || []).filter(c => c.status === 'Active');

    res.status(200).json({
      success: true,
      data: {
        billingContactPerson:         doc.billingContactPerson  || '',
        billingEmail:                 doc.billingEmail          || '',
        billingPhone:                 doc.billingPhone          || '',
        defaultRateType:              doc.defaultRateType       || null,
        defaultServiceType:           doc.defaultServiceType    || null,
        defaultPaymentType:           doc.defaultPaymentType    || '',
        defaultPaymentCollectionType: doc.paymentCollectionType || '',
        extraCharges:                 activeExtraCharges,
        // ── Sender auto-population ──────────────────────────────────────────
        senderName:          doc.senderName          || '',
        senderContactPerson: doc.senderContactPerson || '',
        senderPhone:         doc.senderPhone         || '',
        senderEmail:         doc.senderEmail         || '',
        senderAddress:       doc.senderAddress       || null,
      },
    });
  } catch (e) { next(e); }
};

export const createBillingAccount = async (req, res, next) => {
  try {
    const { billingAccountCode } = req.body;
    if (!billingAccountCode) return res.status(400).json({ success: false, error: 'Billing account code is required' });
    const exists = await BillingAccount.findOne({ billingAccountCode: billingAccountCode.trim().toUpperCase() });
    if (exists) return res.status(400).json({ success: false, error: `Code '${billingAccountCode}' already in use` });
    const doc = await BillingAccount.create({ ...req.body, createdBy: req.user?._id });
    res.status(201).json({ success: true, message: 'Billing account created', data: doc });
  } catch (e) { next(e); }
};

export const updateBillingAccount = async (req, res, next) => {
  try {
    const doc = await BillingAccount.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Billing account not found' });
    const updated = await BillingAccount.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, message: 'Billing account updated', data: updated });
  } catch (e) { next(e); }
};

export const deleteBillingAccount = async (req, res, next) => {
  try {
    const doc = await BillingAccount.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Billing account not found' });
    await doc.deleteOne();
    res.status(200).json({ success: true, message: 'Billing account deleted' });
  } catch (e) { next(e); }
};
