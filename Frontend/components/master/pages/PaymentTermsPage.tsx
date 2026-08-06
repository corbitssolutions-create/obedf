"use client";
import CrudPage from "../CrudPage";
export default function PaymentTermsPage() {
  return (
    <CrudPage title="Payment Terms" apiPath="/api/master/payment-terms"
      searchFields={["code","name"]} addLabel="Add Payment Term"
      columns={[
        { key:"code", label:"Code", width:"120px" },
        { key:"name", label:"Term Name" },
        { key:"days", label:"Days",    width:"80px" },
        { key:"description", label:"Description" },
        { key:"status", label:"Status", width:"100px" },
      ]}
      formFields={[
        { key:"code", label:"Code", type:"text",   required:true, placeholder:"e.g. NET30" },
        { key:"name", label:"Name", type:"text",   required:true, placeholder:"e.g. Net 30 Days" },
        { key:"days", label:"Days", type:"number", defaultValue:30 },
        { key:"description", label:"Description", type:"textarea" },
        { key:"status", label:"Status", type:"select", required:true, defaultValue:"Active", options:["Active","Inactive"] },
      ]}
    />
  );
}
