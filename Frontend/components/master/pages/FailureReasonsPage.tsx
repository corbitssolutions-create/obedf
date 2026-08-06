"use client";
import CrudPage from "../CrudPage";
export default function FailureReasonsPage() {
  return (
    <CrudPage title="Failure Reason Codes" apiPath="/api/master/failure-reasons"
      searchFields={["code","name"]} addLabel="Add Failure Reason"
      columns={[
        { key:"code", label:"Code", width:"120px" },
        { key:"name", label:"Reason" },
        { key:"requiresReschedule", label:"Reschedule?", width:"120px", render:(r)=>(r as any).requiresReschedule?"Yes":"No" },
        { key:"requiresReturn",     label:"Return?",     width:"100px", render:(r)=>(r as any).requiresReturn?"Yes":"No" },
        { key:"status", label:"Status", width:"100px" },
      ]}
      formFields={[
        { key:"code", label:"Code", type:"text", required:true, placeholder:"e.g. NO-ACCESS" },
        { key:"name", label:"Name", type:"text", required:true, placeholder:"e.g. No access to premises" },
        { key:"description", label:"Description", type:"textarea" },
        { key:"requiresReschedule", label:"Requires Reschedule", type:"boolean", defaultValue:false },
        { key:"requiresReturn",     label:"Requires Return",     type:"boolean", defaultValue:false },
        { key:"status", label:"Status", type:"select", required:true, defaultValue:"Active", options:["Active","Inactive"] },
      ]}
    />
  );
}
