"use client";
import CrudPage from "../CrudPage";

export default function RateTypesPage() {
  return (
    <CrudPage
      title="Rate Types"
      apiPath="/api/master/rate-types"
      searchFields={["code", "name", "unit"]}
      addLabel="Add Rate Type"
      columns={[
        { key: "code",   label: "Code",      width: "120px" },
        { key: "name",   label: "Rate Type"  },
        { key: "unit",   label: "Unit"       },
        { key: "status", label: "Status",    width: "100px" },
      ]}
      formFields={[
        { key: "code",        label: "Code",        type: "text",    required: true, placeholder: "e.g. PER-KG" },
        { key: "name",        label: "Name",        type: "text",    required: true, placeholder: "e.g. Per KG" },
        { key: "unit",        label: "Unit",        type: "text",    placeholder: "e.g. KG, CBM, Flat Rate" },
        { key: "description", label: "Description", type: "textarea" },
        { key: "status",      label: "Status",      type: "select",  required: true, defaultValue: "Active", options: ["Active","Inactive"] },
      ]}
    />
  );
}
