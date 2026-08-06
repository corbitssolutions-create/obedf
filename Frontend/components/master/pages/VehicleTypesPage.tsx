"use client";
import CrudPage from "../CrudPage";

export default function VehicleTypesPage() {
  return (
    <CrudPage
      title="Vehicle Types"
      apiPath="/api/master/vehicle-types"
      searchFields={["code", "name"]}
      addLabel="Add Vehicle Type"
      columns={[
        { key: "code",           label: "Code",            width: "120px" },
        { key: "name",           label: "Vehicle Type"     },
        { key: "maxCapacityKg",  label: "Max Capacity (kg)", width: "160px" },
        { key: "maxVolumeCbm",   label: "Max Volume (cbm)", width: "160px" },
        { key: "status",         label: "Status",           width: "100px" },
      ]}
      formFields={[
        { key: "code",           label: "Code",             type: "text",   required: true, placeholder: "e.g. TRUCK" },
        { key: "name",           label: "Name",             type: "text",   required: true, placeholder: "e.g. Truck" },
        { key: "description",    label: "Description",      type: "textarea" },
        { key: "maxCapacityKg",  label: "Max Capacity (kg)",type: "number",  defaultValue: 0 },
        { key: "maxVolumeCbm",   label: "Max Volume (cbm)", type: "number",  defaultValue: 0 },
        { key: "status",         label: "Status",           type: "select",  required: true, defaultValue: "Active", options: ["Active","Inactive"] },
      ]}
    />
  );
}
