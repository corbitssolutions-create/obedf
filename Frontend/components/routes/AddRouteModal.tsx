"use client";

import React, { useState } from "react";
import { ModalShell, Field, Select, inputClass } from "../ui/FormControls";
import { apiPost } from "@/lib/api";

interface AddRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function AddRouteModal({ isOpen, onClose, onCreated }: AddRouteModalProps) {
  const [name, setName]               = useState("");
  const [code, setCode]               = useState("");
  const [origin, setOrigin]           = useState("");
  const [destination, setDest]        = useState("");
  const [distanceKm, setDistance]     = useState("");
  const [estimatedHours, setEstHours] = useState("");
  const [tollCost, setTollCost]       = useState("");
  const [status, setStatus]           = useState("Active");
  const [notes, setNotes]             = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState("");

  const reset = () => {
    setName(""); setCode(""); setOrigin(""); setDest("");
    setDistance(""); setEstHours(""); setTollCost("");
    setStatus("Active"); setNotes(""); setError("");
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !origin.trim() || !destination.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      await apiPost("/api/routes", {
        name: name.trim(),
        code: code.toUpperCase().trim() || undefined,
        origin: origin.trim(),
        destination: destination.trim(),
        distanceKm: distanceKm ? parseFloat(distanceKm) : undefined,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined,
        tollCost: tollCost ? parseFloat(tollCost) : undefined,
        status,
        notes: notes || undefined,
      });
      reset();
      onCreated();
      onClose();
    } catch (e: any) {
      setError(e.message ?? "Failed to create route");
    } finally {
      setSubmitting(false);
    }
  };

  const footer = (
    <>
      <button type="button" onClick={handleClose}
        className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
      <button type="submit" form="add-route-form" disabled={submitting}
        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
        {submitting ? "Creating…" : "Create Route"}
      </button>
    </>
  );

  return (
    <ModalShell isOpen={isOpen} onClose={handleClose} title="Add New Route" footer={footer}>
      {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm font-medium text-red-600">{error}</div>}
      <form id="add-route-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label="Route Name" required>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Johannesburg - Pretoria" required className={inputClass} />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Route Code">
            <input type="text" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. JHB-PTA" className={inputClass} />
          </Field>
          <Field label="Status" required>
            <Select value={status} onChange={setStatus} placeholder="Select status"
              options={["Active", "Inactive"]} required />
          </Field>
          <Field label="Origin (From)" required>
            <input type="text" value={origin} onChange={(e) => setOrigin(e.target.value)}
              placeholder="e.g. Johannesburg" required className={inputClass} />
          </Field>
          <Field label="Destination (To)" required>
            <input type="text" value={destination} onChange={(e) => setDest(e.target.value)}
              placeholder="e.g. Pretoria" required className={inputClass} />
          </Field>
          <Field label="Distance (km)">
            <input type="number" step="0.1" min="0" value={distanceKm}
              onChange={(e) => setDistance(e.target.value)} placeholder="e.g. 56" className={inputClass} />
          </Field>
          <Field label="Estimated Hours">
            <input type="number" step="0.5" min="0" value={estimatedHours}
              onChange={(e) => setEstHours(e.target.value)} placeholder="e.g. 1.5" className={inputClass} />
          </Field>
          <Field label="Toll Cost (R)">
            <input type="number" step="0.01" min="0" value={tollCost}
              onChange={(e) => setTollCost(e.target.value)} placeholder="e.g. 250.00" className={inputClass} />
          </Field>
        </div>
        <Field label="Notes">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            rows={2} placeholder="Any notes about this route…" className={`${inputClass} resize-none`} />
        </Field>
      </form>
    </ModalShell>
  );
}
