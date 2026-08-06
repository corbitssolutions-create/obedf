"use client";
import CrudPage from "../CrudPage";
export default function ProductTypesPage() {
  return (
    <CrudPage title="Product Types" apiPath="/api/master/product-types"
      searchFields={["code","name"]} addLabel="Add Product Type"
      columns={[
        { key:"code", label:"Code", width:"120px" },
        { key:"name", label:"Product Type" },
        { key:"hazardous", label:"Hazardous", width:"110px", render:(r)=>(r as any).hazardous?"Yes":"No" },
        { key:"requiresColdChain", label:"Cold Chain", width:"110px", render:(r)=>(r as any).requiresColdChain?"Yes":"No" },
        { key:"status", label:"Status", width:"100px" },
      ]}
      formFields={[
        { key:"code", label:"Code", type:"text", required:true, placeholder:"e.g. FMCG" },
        { key:"name", label:"Name", type:"text", required:true, placeholder:"e.g. Dry Goods" },
        { key:"description", label:"Description", type:"textarea" },
        { key:"hazardous", label:"Hazardous", type:"boolean", defaultValue:false },
        { key:"requiresColdChain", label:"Requires Cold Chain", type:"boolean", defaultValue:false },
        { key:"status", label:"Status", type:"select", required:true, defaultValue:"Active", options:["Active","Inactive"] },
      ]}
    />
  );
}
