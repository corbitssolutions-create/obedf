"use client";
import CrudPage from "../CrudPage";
export default function PackagingTypesPage() {
  return (
    <CrudPage title="Packaging Types" apiPath="/api/master/packaging-types"
      searchFields={["code","name"]} addLabel="Add Packaging Type"
      columns={[
        { key:"code", label:"Code", width:"120px" },
        { key:"name", label:"Packaging Type" },
        { key:"description", label:"Description" },
        { key:"status", label:"Status", width:"100px" },
      ]}
      formFields={[
        { key:"code", label:"Code", type:"text", required:true, placeholder:"e.g. BOX" },
        { key:"name", label:"Name", type:"text", required:true, placeholder:"e.g. Cardboard Box" },
        { key:"description", label:"Description", type:"textarea" },
        { key:"status", label:"Status", type:"select", required:true, defaultValue:"Active", options:["Active","Inactive"] },
      ]}
    />
  );
}
