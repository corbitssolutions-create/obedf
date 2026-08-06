"use client";
import CrudPage from "../CrudPage";
export default function StatusCodesPage() {
  return (
    <CrudPage title="Status Codes" apiPath="/api/master/status-codes"
      searchFields={["code","name","module"]} addLabel="Add Status Code"
      columns={[
        { key:"code", label:"Code", width:"120px" },
        { key:"name", label:"Status Name" },
        { key:"module", label:"Module", width:"120px" },
        { key:"colour", label:"Colour", width:"90px", render:(r)=>(
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3.5 w-3.5 rounded-full border border-gray-200" style={{background:(r as any).colour||"#6B7280"}} />
            {(r as any).colour||"—"}
          </span>
        )},
        { key:"isFinal", label:"Final?", width:"80px", render:(r)=>(r as any).isFinal?"Yes":"No" },
        { key:"status", label:"Status", width:"100px" },
      ]}
      formFields={[
        { key:"code", label:"Code", type:"text", required:true, placeholder:"e.g. DEL" },
        { key:"name", label:"Name", type:"text", required:true, placeholder:"e.g. Delivered" },
        { key:"module", label:"Module", type:"select", options:["Waybill","Manifest","Trip","POD","Invoice","General"] },
        { key:"colour", label:"Colour (hex)", type:"text", placeholder:"#10B981" },
        { key:"isFinal", label:"Is Final Status", type:"boolean", defaultValue:false },
        { key:"description", label:"Description", type:"textarea" },
        { key:"status", label:"Status", type:"select", required:true, defaultValue:"Active", options:["Active","Inactive"] },
      ]}
    />
  );
}
