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
