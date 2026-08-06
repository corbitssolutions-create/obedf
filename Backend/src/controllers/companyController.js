import Company from '../models/Company.js';
import path from 'path';
import fs from 'fs';

// Populate config reused across reads
const DEFAULTS_POPULATE = [
  { path: 'defaultRateType',    select: 'code name unit' },
  { path: 'defaultServiceType', select: 'code name transitDays' },
  { path: 'companyExtraCharges.extraCharge', select: 'chargeCode chargeName chargeType defaultAmount' },
];

/** GET /api/company */
export const getCompany = async (req, res, next) => {
  try {
    const company = await Company.findOne({})
      .populate('currency',      'code name symbol')
      .populate('branches',      'code name city')
      .populate('defaultBranch', 'code name city')
      .populate(DEFAULTS_POPULATE)
      .lean();
    res.status(200).json({ success: true, data: company || null });
  } catch (e) { next(e); }
};

/**
 * @desc  Return only the fields needed to auto-populate a Waybill form
 * @route GET /api/company/defaults
 */
export const getCompanyDefaults = async (req, res, next) => {
  try {
    const company = await Company.findOne({})
      .select('defaultRateType defaultServiceType defaultPaymentType defaultPaymentCollectionType companyExtraCharges')
      .populate('defaultRateType',    'code name unit')
      .populate('defaultServiceType', 'code name transitDays')
      .populate('companyExtraCharges.extraCharge', 'chargeCode chargeName chargeType defaultAmount')
      .lean();

    if (!company) return res.status(404).json({ success: false, error: 'Company record not found' });

    const activeCharges = (company.companyExtraCharges || [])
      .filter(c => c.status === 'Active')
      .map(c => ({
        extraChargeId: c.extraCharge?._id,
        chargeCode:    c.extraCharge?.chargeCode,
        chargeName:    c.extraCharge?.chargeName,
        chargeType:    c.extraCharge?.chargeType,
        defaultAmount: c.extraCharge?.defaultAmount,
        amount:        c.amount,
      }));

    res.status(200).json({
      success: true,
      data: {
        defaultRateType:              company.defaultRateType              || null,
        defaultServiceType:           company.defaultServiceType           || null,
        defaultPaymentType:           company.defaultPaymentType           || '',
        defaultPaymentCollectionType: company.defaultPaymentCollectionType || '',
        companyExtraCharges:          activeCharges,
      },
    });
  } catch (e) { next(e); }
};

/** POST /api/company — create (first-time setup) */
export const createCompany = async (req, res, next) => {
  try {
    const existing = await Company.findOne({});
    if (existing) return res.status(400).json({ success: false, error: 'Company record already exists. Use PUT to update.' });
    const company = await Company.create({ ...req.body, createdBy: req.user?._id });
    res.status(201).json({ success: true, message: 'Company created', data: company });
  } catch (e) { next(e); }
};

/** PUT /api/company/:id */
export const updateCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ success: false, error: 'Company not found' });
    const updated = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, message: 'Company updated', data: updated });
  } catch (e) { next(e); }
};

/** POST /api/company/:id/departments */
export const addDepartment = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ success: false, error: 'Company not found' });
    company.departments.push(req.body);
    await company.save();
    res.status(201).json({ success: true, message: 'Department added', data: company });
  } catch (e) { next(e); }
};

/** DELETE /api/company/:id/departments/:deptId */
export const removeDepartment = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ success: false, error: 'Company not found' });
    company.departments = company.departments.filter(d => d._id.toString() !== req.params.deptId);
    await company.save();
    res.status(200).json({ success: true, message: 'Department removed', data: company });
  } catch (e) { next(e); }
};

/** POST /api/company/:id/cost-centres */
export const addCostCentre = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ success: false, error: 'Company not found' });
    company.costCentres.push(req.body);
    await company.save();
    res.status(201).json({ success: true, message: 'Cost centre added', data: company });
  } catch (e) { next(e); }
};

/** POST /api/company/:id/business-units */
export const addBusinessUnit = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ success: false, error: 'Company not found' });
    company.businessUnits.push(req.body);
    await company.save();
    res.status(201).json({ success: true, message: 'Business unit added', data: company });
  } catch (e) { next(e); }
};

/** POST /api/company/upload-logo */
export const uploadLogo = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
    const url = `/uploads/logos/${req.file.filename}`;
    res.status(200).json({ success: true, url });
  } catch (e) { next(e); }
};
