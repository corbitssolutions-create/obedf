"use client";

import React, { useState, useEffect } from "react";
import { ModalShell, Field, Select, inputClass } from "../ui/FormControls";
import { apiPut } from "@/lib/api";
import type { POD } from "./pod";

interface EditPodModalProps {
  isOpen: boolean;
  pod: POD;
  onClose: () => void;
  onUpdated: () => void;
}

export default function EditPodModal({ isOpen, pod, onClose, onUpdated }: EditPodModalProps) {
  const [receiverName, setReceiver] = useState(pod.receiverName);
  const [deliveryDate, setDate]     = useState(pod.deliveryDate?.slice(0, 10) ?? "");
  const [deliveryTime, setTime]     = useState(pod.deliveryTime ?? "");
  const [status, setStatus]         = useState(pod.status);
  const [notes, setNotes]           = useState(pod.notes ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");

  useEffect(() => {
    setReceiver(pod.receiverName);
    setDate(pod.deliveryDate?.slice(0, 10) ?? "");
    setTime(pod.deliveryTime ?? "");
    setStatus(pod.status);
    setNotes(pod.notes ?? "");
    setError("");
  }, [pod]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await apiPut(`/api/pod/${pod._id}`, {
        receiverName, deliveryDate, deliveryTime: deliveryTime || undefined,
        status, notes: notes || undefined,
      });
      onUpdated();
      onClose();
    } catch (e: any) {
      setError(e.message ?? "Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  const footer = (
    <>
      <button type="button" onClick={onClose}
        className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
      <button type="submit" form="edit-pod-form" disabled={submitting}
        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
        {submitting ? "Saving…" : "Save Changes"}
      </button>
    </>
  );

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title={`Edit POD — ${pod.waybillNo}`} footer={footer}>
      {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm font-medium text-red-600">{error}</div>}
      <form id="edit-pod-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label="Received By" required>
          <input type="text" value={receiverName} onChange={(e) => setReceiver(e.target.value)} required className={inputClass} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Delivery Date" required>
            <input type="date" value={deliveryDate} onChange={(e) => setDate(e.target.value)} required className={inputClass} />
          </Field>
          <Field label="Delivery Time">
            <input type="time" value={deliveryTime} onChange={(e) => setTime(e.target.value)} className={inputClass} />
          </Field>
        </div>
        <Field label="Status">
          <Select value={status} onChange={(v) => setStatus(v as any)} placeholder="Select status"
            options={["Pending", "Captured", "Verified", "Disputed"]} />
        </Field>
        <Field label="Notes">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={`${inputClass} resize-none`} />
        </Field>
      </form>
    </ModalShell>
  );
}
