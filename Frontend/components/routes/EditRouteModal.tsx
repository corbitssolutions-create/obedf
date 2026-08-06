"use client";

import React, { useState, useEffect } from "react";
import { ModalShell, Field, Select, inputClass } from "../ui/FormControls";
import { apiPut } from "@/lib/api";
import type { Route } from "./route";

interface EditRouteModalProps {
  isOpen: boolean;
  route: Route;
  onClose: () => void;
  onUpdated: () => void;
}

export default function EditRouteModal({ isOpen, route, onClose, onUpdated }: EditRouteModalProps) {
  const [name, setName]               = useState(route.name);
  const [code, setCode]               = useState(route.routeCode ?? (route as any).code ?? "");
  const [origin, setOrigin]           = useState(route.startPoint ?? (route as any).origin ?? "");
  const [destination, setDest]        = useState(route.destination);
  const [distanceKm, setDistance]     = useState(route.distanceKm?.toString() ?? "");
  const [estimatedHours, setEstHours] = useState(route.estimatedHours?.toString() ?? "");
  const [tollCost, setTollCost]       = useState(route.tollCost?.toString() ?? "");
  const [status, setStatus]           = useState(route.status);
  const [notes, setNotes]             = useState(route.notes ?? "");
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState("");

  useEffect(() => {
    setName(route.name); setCode(route.routeCode ?? (route as any).code ?? "");
    setOrigin(route.startPoint ?? (route as any).origin ?? ""); setDest(route.destination);
    setDistance(route.distanceKm?.toString() ?? "");
    setEstHours(route.estimatedHours?.toString() ?? "");
    setTollCost(route.tollCost?.toString() ?? "");
    setStatus(route.status); setNotes(route.notes ?? "");
    setError("");
  }, [route]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await apiPut(`/api/routes/${route._id}`, {
        name: name.trim(),
        code: code.toUpperCase().trim() || undefined,
        origin: origin.trim(), destination: destination.trim(),
        distanceKm: distanceKm ? parseFloat(distanceKm) : undefined,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined,
        tollCost: tollCost ? parseFloat(tollCost) : undefined,
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
      <button type="submit" form="edit-route-form" disabled={submitting}
        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
        {submitting ? "Saving…" : "Save Changes"}
      </button>
    </>
  );

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title={`Edit Route — ${route.name}`} footer={footer}>
      {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm font-medium text-red-600">{error}</div>}
      <form id="edit-route-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label="Route Name" required><input type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} /></Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Route Code"><input type="text" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className={inputClass} /></Field>
          <Field label="Status" required><Select value={status} onChange={(v) => setStatus(v as any)} placeholder="Select status" options={["Active","Inactive"]} required /></Field>
          <Field label="Origin" required><input type="text" value={origin} onChange={(e) => setOrigin(e.target.value)} required className={inputClass} /></Field>
          <Field label="Destination" required><input type="text" value={destination} onChange={(e) => setDest(e.target.value)} required className={inputClass} /></Field>
          <Field label="Distance (km)"><input type="number" step="0.1" value={distanceKm} onChange={(e) => setDistance(e.target.value)} className={inputClass} /></Field>
          <Field label="Estimated Hours"><input type="number" step="0.5" value={estimatedHours} onChange={(e) => setEstHours(e.target.value)} className={inputClass} /></Field>
          <Field label="Toll Cost (R)"><input type="number" step="0.01" value={tollCost} onChange={(e) => setTollCost(e.target.value)} className={inputClass} /></Field>
        </div>
        <Field label="Notes"><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={`${inputClass} resize-none`} /></Field>
      </form>
    </ModalShell>
  );
}
