"use client";
import CrudPage from "../CrudPage";

export default function FuelTypesPage() {
  return (
    <CrudPage
      title="Fuel Types"
      apiPath="/api/master/fuel-types"
      searchFields={["code", "name"]}
      addLabel="Add Fuel Type"
      columns={[
        { key: "code",      label: "Code",        width: "120px" },
        { key: "name",      label: "Fuel Type"    },
        { key: "unitPrice", label: "Unit Price",  width: "130px", render: (r) => (r as any).unitPrice ? `R ${(r as any).unitPrice.toFixed(2)}` : "—" },
        { key: "status",    label: "Status",      width: "100px" },
      ]}
      formFields={[
        { key: "code",      label: "Code",       type: "text",   required: true, placeholder: "e.g. DIESEL" },
        { key: "name",      label: "Name",       type: "text",   required: true, placeholder: "e.g. Diesel" },
        { key: "unitPrice", label: "Unit Price (R/L)", type: "number", defaultValue: 0 },
        { key: "description", label: "Description", type: "textarea" },
        { key: "status",    label: "Status",     type: "select", required: true, defaultValue: "Active", options: ["Active","Inactive"] },
      ]}
    />
  );
}
