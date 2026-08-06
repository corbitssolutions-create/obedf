"use client";

import React, { useState, useEffect } from "react";
import { ModalShell, Field, Select, inputClass } from "../ui/FormControls";
import { apiPost, apiGet } from "@/lib/api";

interface WaybillLookup { _id: string; waybillNo: string; receiver: string; status: string; }
interface DriverLookup  { _id: string; fullName: string; }

interface AddPodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function AddPodModal({ isOpen, onClose, onCreated }: AddPodModalProps) {
  const [waybillId, setWaybillId]     = useState("");
  const [driverId, setDriverId]       = useState("");
  const [driverName, setDriverName]   = useState("");
  const [receiverName, setReceiver]   = useState("");
  const [deliveryDate, setDate]       = useState(new Date().toISOString().slice(0, 10));
  const [deliveryTime, setTime]       = useState("");
  const [notes, setNotes]             = useState("");
  const [status, setStatus]           = useState("Captured");
  const [waybills, setWaybills]       = useState<WaybillLookup[]>([]);
  const [drivers, setDrivers]         = useState<DriverLookup[]>([]);
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState("");

  useEffect(() => {
    if (!isOpen) return;
    Promise.all([
      apiGet<{ success: boolean; data: WaybillLookup[] }>("/api/waybills?limit=500&status=Active"),
      apiGet<{ success: boolean; data: DriverLookup[] }>("/api/drivers/lookup"),
    ]).then(([wbRes, drRes]) => {
      setWaybills(wbRes.data ?? []);
      setDrivers(drRes.data ?? []);
    }).catch(() => {});
  }, [isOpen]);

  // Auto-fill receiver when waybill is selected
  useEffect(() => {
    if (!waybillId) return;
    const wb = waybills.find((w) => w._id === waybillId);
    if (wb) setReceiver(wb.receiver);
  }, [waybillId, waybills]);

  // Auto-fill driver name from lookup
  useEffect(() => {
    if (!driverId) return;
    const d = drivers.find((dr) => dr._id === driverId);
    if (d) setDriverName(d.fullName);
  }, [driverId, drivers]);

  const reset = () => {
    setWaybillId(""); setDriverId(""); setDriverName(""); setReceiver("");
    setDate(new Date().toISOString().slice(0, 10)); setTime("");
    setNotes(""); setStatus("Captured"); setError("");
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waybillId || !receiverName) return;
    setSubmitting(true);
    setError("");
    try {
      await apiPost("/api/pod", {
        waybillId,
        driverName: driverName || undefined,
        driver: driverId || undefined,
        receiverName,
        deliveryDate,
        deliveryTime: deliveryTime || undefined,
        notes: notes || undefined,
        status,
      });
      reset();
      onCreated();
      onClose();
    } catch (e: any) {
      setError(e.message ?? "Failed to create POD");
    } finally {
      setSubmitting(false);
    }
  };

  const waybillOptions = waybills.map((w) => ({
    label: `${w.waybillNo} — ${w.receiver} (${w.status})`,
    value: w._id,
  }));

  const driverOptions = drivers.map((d) => ({ label: d.fullName, value: d._id }));

  const footer = (
    <>
      <button type="button" onClick={handleClose}
        className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
      <button type="submit" form="add-pod-form" disabled={submitting}
        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
        {submitting ? "Capturing…" : "Capture POD"}
      </button>
    </>
  );

  return (
    <ModalShell isOpen={isOpen} onClose={handleClose} title="Capture Proof of Delivery" footer={footer}>
      {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm font-medium text-red-600">{error}</div>}
      <form id="add-pod-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label="Waybill" required>
          <Select value={waybillId} onChange={setWaybillId}
            placeholder="Select waybill…" options={waybillOptions} required />
        </Field>
        <Field label="Driver">
          <Select value={driverId} onChange={setDriverId}
            placeholder="Select driver…" options={driverOptions} />
        </Field>
        <Field label="Received By" required>
          <input type="text" value={receiverName} onChange={(e) => setReceiver(e.target.value)}
            placeholder="Person who signed for delivery" required className={inputClass} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Delivery Date" required>
            <input type="date" value={deliveryDate} onChange={(e) => setDate(e.target.value)}
              required className={inputClass} />
          </Field>
          <Field label="Delivery Time">
            <input type="time" value={deliveryTime} onChange={(e) => setTime(e.target.value)}
              className={inputClass} />
          </Field>
        </div>
        <Field label="Status">
          <Select value={status} onChange={setStatus} placeholder="Select status"
            options={["Pending", "Captured", "Verified", "Disputed"]} />
        </Field>
        <Field label="Notes">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            rows={2} placeholder="Any delivery notes…" className={`${inputClass} resize-none`} />
        </Field>
      </form>
    </ModalShell>
  );
}
