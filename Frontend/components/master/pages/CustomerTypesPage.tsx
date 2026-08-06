"use client";
import CrudPage from "../CrudPage";

export default function CustomerTypesPage() {
  return (
    <CrudPage
      title="Customer Types"
      apiPath="/api/master/customer-types"
      searchFields={["code", "name", "description"]}
      addLabel="Add Customer Type"
      columns={[
        { key: "code",        label: "Code",         width: "120px" },
        { key: "name",        label: "Customer Type" },
        { key: "description", label: "Description"   },
        { key: "status",      label: "Status",       width: "100px" },
      ]}
      formFields={[
        { key: "code",        label: "Code",        type: "text",    required: true, placeholder: "e.g. CORP" },
        { key: "name",        label: "Name",        type: "text",    required: true, placeholder: "e.g. Corporate" },
        { key: "description", label: "Description", type: "textarea" },
        { key: "status",      label: "Status",      type: "select",  required: true, defaultValue: "Active", options: ["Active", "Inactive"] },
      ]}
    />
  );
}
