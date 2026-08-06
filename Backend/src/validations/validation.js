import mongoose from 'mongoose';

/**
 * Validate Customer Creation/Update
 */
export const validateCustomer = (req, res, next) => {
  const { name, contact, email, address } = req.body;

  if (!name || String(name).trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'Customer name is required',
    });
  }

  next();
};

/**
 * Validate Waybill Creation/Update
 *
 * Notes:
 * - billingAccount is optional; when supplied it must be a valid MongoDB ObjectId.
 * - rateType is still required on the document, but may be auto-populated from the
 *   billing account. Validation only enforces it when neither the request nor a
 *   billingAccount is present (the controller resolves defaults before saving).
 * - billingContactPerson / billingEmail / billingPhone / paymentCollectionType /
 *   extraCharges are all optional — the controller back-fills them from the account.
 * - extraCharges, when supplied, must be a valid array of objects with chargeName
 *   and a numeric amount/defaultAmount.
 */
export const validateWaybill = (req, res, next) => {
  const {
    billingAccount,
    sender,
    pickupPoint,
    receiver,
    receiverAddress,
    quantity,
    rateType,
    billingEmail,
    paymentCollectionType,
    extraCharges,
  } = req.body;

  // ── Required core fields — only sender + receiver + quantity + receiverAddress ──
  if (!sender || String(sender).trim() === '') {
    return res.status(400).json({ success: false, error: 'Sender name is required' });
  }

  if (!receiver || String(receiver).trim() === '') {
    return res.status(400).json({ success: false, error: 'Receiver name is required' });
  }

  if (!quantity || parseInt(quantity) < 1) {
    return res.status(400).json({ success: false, error: 'Quantity must be at least 1' });
  }

  // ── Receiver address ────────────────────────────────────────────────────────
  if (!receiverAddress) {
    return res.status(400).json({ success: false, error: 'Receiver address is required' });
  }

  const { building, street, suburb, city, province, postalCode } = receiverAddress;
  if (!building || !street || !suburb || !city || !province || !postalCode) {
    return res.status(400).json({
      success: false,
      error: 'Receiver address requires building, street, suburb, city, province and postalCode',
    });
  }

  // ── Optional field format checks ────────────────────────────────────────────

  // billingAccount — must be a valid ObjectId when supplied
  if (billingAccount && !/^[a-f\d]{24}$/i.test(String(billingAccount))) {
    return res.status(400).json({ success: false, error: 'billingAccount must be a valid ID' });
  }

  // billingEmail — basic format check when supplied
  if (billingEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(billingEmail))) {
    return res.status(400).json({ success: false, error: 'billingEmail must be a valid email address' });
  }

  // paymentCollectionType — must be one of the allowed values when supplied
  const validCollectionTypes = ['Cash on Delivery', 'Cash on Collection', ''];
  if (paymentCollectionType !== undefined && !validCollectionTypes.includes(String(paymentCollectionType))) {
    return res.status(400).json({
      success: false,
      error: 'paymentCollectionType must be "Cash on Delivery" or "Cash on Collection"',
    });
  }

  // extraCharges — when supplied must be an array; each item needs chargeName and a numeric amount
  if (extraCharges !== undefined && extraCharges !== null) {
    if (!Array.isArray(extraCharges)) {
      return res.status(400).json({ success: false, error: 'extraCharges must be an array' });
    }
    for (let i = 0; i < extraCharges.length; i++) {
      const charge = extraCharges[i];
      const name = charge.chargeName || charge.description;
      if (!name || String(name).trim() === '') {
        return res.status(400).json({
          success: false,
          error: `extraCharges[${i}]: chargeName is required`,
        });
      }
      const amt = charge.amount ?? charge.defaultAmount;
      if (amt === undefined || amt === null || isNaN(Number(amt))) {
        return res.status(400).json({
          success: false,
          error: `extraCharges[${i}]: amount must be a number`,
        });
      }
    }
  }

  next();
};

/**
 * Validate Manifest Creation/Update
 */
export const validateManifest = (req, res, next) => {
  const { driver, vehicle, route, waybills } = req.body;

  if (!driver || String(driver).trim() === '') {
    return res.status(400).json({ success: false, error: 'Driver is required' });
  }

  if (!vehicle || String(vehicle).trim() === '') {
    return res.status(400).json({ success: false, error: 'Vehicle is required' });
  }

  if (!route || String(route).trim() === '') {
    return res.status(400).json({ success: false, error: 'Route is required' });
  }

  if (waybills && !Array.isArray(waybills)) {
    return res.status(400).json({ success: false, error: 'Waybills must be an array of identifiers' });
  }

  next();
};
