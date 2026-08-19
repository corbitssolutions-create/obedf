import Counter from '../models/Counter.js';

/**
 * Atomic counter generator for auto-incrementing serial values in MongoDB.
 */
export const getNextSequenceValue = async (sequenceName) => {
  const sequenceDocument = await Counter.findOneAndUpdate(
    { id: sequenceName },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return sequenceDocument.seq;
};

/**
 * Returns formatted sequential Waybill Number: WB000001, WB000002...
 */
export const getNextWaybillNumber = async () => {
  const seq = await getNextSequenceValue('waybill');
  return `WB${String(seq).padStart(6, '0')}`;
};

/**
 * Returns formatted sequential Product Code: PC000001, PC000002...
 */
export const getNextProductCode = async () => {
  const seq = await getNextSequenceValue('product');
  return `PC${String(seq).padStart(6, '0')}`;
};

/**
 * Returns formatted sequential Manifest Number: MF000001, MF000002...
 */
export const getNextManifestNumber = async () => {
  const seq = await getNextSequenceValue('manifest');
  return `MF${String(seq).padStart(6, '0')}`;
};

/**
 * Returns formatted sequential Invoice Number: INV-2026-00891...
 */
export const getNextInvoiceNumber = async () => {
  const seq = await getNextSequenceValue('invoice');
  const year = new Date().getFullYear();
  return `INV-${year}-${String(seq).padStart(5, '0')}`;
};

/**
 * Returns formatted sequential Credit Note Number: CN-2026-00124...
 */
export const getNextCreditNoteNumber = async () => {
  const seq = await getNextSequenceValue('credit_note');
  const year = new Date().getFullYear();
  return `CN-${year}-${String(seq).padStart(5, '0')}`;
};

/**
 * Returns formatted sequential Debit Note Number: DN-2026-00087...
 */
export const getNextDebitNoteNumber = async () => {
  const seq = await getNextSequenceValue('debit_note');
  const year = new Date().getFullYear();
  return `DN-${year}-${String(seq).padStart(5, '0')}`;
};

/**
 * Returns formatted sequential Quotation Number: QT-8801...
 */
export const getNextQuotationNumber = async () => {
  const seq = await getNextSequenceValue('quotation');
  return `QT-${String(8800 + seq)}`;
};

