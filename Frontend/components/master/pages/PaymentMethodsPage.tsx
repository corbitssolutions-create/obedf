"use client";
import CrudPage from "../CrudPage";
export default function PaymentMethodsPage() {
  return (
    <CrudPage title="Payment Methods" apiPath="/api/master/payment-methods"
      searchFields={["code","name"]} addLabel="Add Payment Method"
      columns={[
        { key:"code", label:"Code", width:"120px" },
        { key:"name", label:"Payment Method" },
        { key:"description", label:"Description" },
        { key:"status", label:"Status", width:"100px" },
      ]}
      formFields={[
        { key:"code", label:"Code", type:"text", required:true, placeholder:"e.g. EFT" },
        { key:"name", label:"Name", type:"text", required:true, placeholder:"e.g. Electronic Funds Transfer" },
        { key:"description", label:"Description", type:"textarea" },
        { key:"status", label:"Status", type:"select", required:true, defaultValue:"Active", options:["Active","Inactive"] },
      ]}
    />
  );
}
