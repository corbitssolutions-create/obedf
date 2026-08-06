"use client";

/**
 * Reusable Address Section — matches the design exactly:
 * Row 1: Building / Unit | Street | Suburb
 * Row 2: City            | Province (dropdown) | Postal Code
 *
 * Used in: Customer, Driver, Supplier, Contractor, Branch, Billing Account, Company
 */

import { Field, inputClass, Select } from "./FormControls";

export interface AddressData {
  building?:   string;
  street?:     string;
  suburb?:     string;
  city:        string;
  province:    string;
  postalCode:  string;
  country?:    string;
  addressLine1?: string;
  addressLine2?: string;
}

interface AddressSectionProps {
  title?: string;
  values: AddressData;
  onChange: (field: keyof AddressData, value: string) => void;
  required?: boolean;
}

const SA_PROVINCES = [
  "Gauteng",
  "Western Cape",
  "KwaZulu-Natal",
  "Eastern Cape",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Free State",
  "Northern Cape",
];

export default function AddressSection({
  title = "Address",
  values,
  onChange,
  required = false,
}: AddressSectionProps) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50/40 p-4">
      {title && (
        <p className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">
          {title}
        </p>
      )}

      {/* Row 1: Building / Unit | Street | Suburb */}
      <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Building / Unit">
          <input
            type="text"
            value={values.building}
            onChange={(e) => onChange("building", e.target.value)}
            placeholder="e.g. Makro Warehouse 3"
            className={inputClass}
          />
        </Field>

        <Field label="Street">
          <input
            type="text"
            value={values.street}
            onChange={(e) => onChange("street", e.target.value)}
            placeholder="e.g. 1 Power Rd"
            className={inputClass}
          />
        </Field>

        <Field label="Suburb">
          <input
            type="text"
            value={values.suburb}
            onChange={(e) => onChange("suburb", e.target.value)}
            placeholder="e.g. Midrand"
            className={inputClass}
          />
        </Field>
      </div>

      {/* Row 2: City | Province | Postal Code */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="City" required={required}>
          <input
            type="text"
            value={values.city}
            onChange={(e) => onChange("city", e.target.value)}
            placeholder="e.g. Midrand"
            className={inputClass}
          />
        </Field>

        <Field label="Province">
          <Select
            value={values.province}
            onChange={(v) => onChange("province", v)}
            placeholder="Select province"
            options={SA_PROVINCES}
          />
        </Field>

        <Field label="Postal Code">
          <input
            type="text"
            value={values.postalCode}
            onChange={(e) => onChange("postalCode", e.target.value)}
            placeholder="e.g. 1685"
            className={inputClass}
          />
        </Field>
      </div>
    </div>
  );
}

/** Helper to create a blank AddressData object */
export function emptyAddress(): AddressData {
  return {
    building:   "",
    street:     "",
    suburb:     "",
    city:       "",
    province:   "",
    postalCode: "",
    country:    "South Africa",
  };
}

/** Helper to create an address updater for useState */
export function makeAddressUpdater(
  setter: React.Dispatch<React.SetStateAction<AddressData>>
) {
  return (field: keyof AddressData, value: string) =>
    setter((prev) => ({ ...prev, [field]: value }));
}
