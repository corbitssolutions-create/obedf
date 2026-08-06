"use client";
import CrudPage from "../CrudPage";
export default function DocumentTemplatesPage() {
  return (
    <CrudPage title="Document Templates" apiPath="/api/master/document-templates"
      searchFields={["code","name","documentType"]} addLabel="Add Template"
      columns={[
        { key:"code",         label:"Code",     width:"120px" },
        { key:"name",         label:"Name"      },
        { key:"documentType", label:"Doc Type", width:"130px" },
        { key:"paperSize",    label:"Paper",    width:"90px"  },
        { key:"isDefault",    label:"Default",  width:"90px", render:(r)=>(r as any).isDefault?"Yes":"No" },
        { key:"status",       label:"Status",   width:"100px" },
      ]}
      formFields={[
        { key:"code",         label:"Code",         type:"text",   required:true, placeholder:"e.g. WB-A4" },
        { key:"name",         label:"Name",         type:"text",   required:true, placeholder:"e.g. Waybill A4 Portrait" },
        { key:"documentType", label:"Document Type",type:"select", required:true,
          options:["Waybill","Manifest","POD","Invoice","Credit Note","Delivery Note"] },
        { key:"paperSize",    label:"Paper Size",   type:"select", defaultValue:"A4", options:["A4","A5","Letter","Label"] },
        { key:"orientation",  label:"Orientation",  type:"select", defaultValue:"Portrait", options:["Portrait","Landscape"] },
        { key:"isDefault",    label:"Set as Default",type:"boolean", defaultValue:false },
        { key:"status",       label:"Status",       type:"select", required:true, defaultValue:"Active", options:["Active","Inactive"] },
      ]}
    />
  );
}
