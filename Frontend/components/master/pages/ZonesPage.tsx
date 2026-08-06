"use client";
import CrudPage from "../CrudPage";

export default function ZonesPage() {
  return (
    <CrudPage
      title="Zones"
      apiPath="/api/master/zones"
      searchFields={["code", "name", "description"]}
      addLabel="Add Zone"
      columns={[
        { key: "code",        label: "Code",        width: "120px" },
        { key: "name",        label: "Zone Name"    },
        { key: "description", label: "Description"  },
        { key: "status",      label: "Status",      width: "100px" },
      ]}
      formFields={[
        { key: "code",        label: "Zone Code",        type: "text",     required: true, placeholder: "e.g. ZONE-JHB" },
        { key: "name",        label: "Zone Name",        type: "text",     required: true, placeholder: "e.g. Johannesburg Metro" },
        { key: "description", label: "Description",      type: "textarea"  },
        { key: "status",      label: "Status",           type: "select",   required: true, defaultValue: "Active", options: ["Active","Inactive"] },
      ]}
    />
  );
}
