"use client";
import CrudPage from "../CrudPage";

export default function ServiceTypesPage() {
  return (
    <CrudPage
      title="Service Types"
      apiPath="/api/master/service-types"
      searchFields={["code", "name"]}
      addLabel="Add Service Type"
      columns={[
        { key: "code",        label: "Code",          width: "120px" },
        { key: "name",        label: "Service Type"   },
        { key: "transitDays", label: "Transit Days",  width: "120px" },
        { key: "description", label: "Description"    },
        { key: "status",      label: "Status",        width: "100px" },
      ]}
      formFields={[
        { key: "code",        label: "Code",         type: "text",    required: true, placeholder: "e.g. EXPR" },
        { key: "name",        label: "Name",         type: "text",    required: true, placeholder: "e.g. Express Overnight" },
        { key: "transitDays", label: "Transit Days", type: "number",  placeholder: "1", defaultValue: 1 },
        { key: "description", label: "Description",  type: "textarea" },
        { key: "status",      label: "Status",       type: "select",  required: true, defaultValue: "Active", options: ["Active","Inactive"] },
      ]}
    />
  );
}
