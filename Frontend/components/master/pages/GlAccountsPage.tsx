"use client";
import CrudPage from "../CrudPage";
export default function GlAccountsPage() {
  return (
    <CrudPage title="GL Accounts" apiPath="/api/master/gl-accounts"
      searchFields={["accountCode","accountName","accountType"]} addLabel="Add GL Account"
      columns={[
        { key:"accountCode", label:"Account Code", width:"140px" },
        { key:"accountName", label:"Account Name" },
        { key:"accountType", label:"Type",         width:"110px" },
        { key:"isControlAccount", label:"Control?", width:"90px", render:(r)=>(r as any).isControlAccount?"Yes":"No" },
        { key:"status",      label:"Status",       width:"100px" },
      ]}
      formFields={[
        { key:"accountCode", label:"Account Code", type:"text",   required:true, placeholder:"e.g. 4000" },
        { key:"accountName", label:"Account Name", type:"text",   required:true, placeholder:"e.g. Revenue — Freight" },
        { key:"accountType", label:"Account Type", type:"select", required:true,
          options:["Asset","Liability","Equity","Revenue","Expense"] },
        { key:"description",      label:"Description",    type:"textarea" },
        { key:"isControlAccount", label:"Control Account",type:"boolean", defaultValue:false },
        { key:"status",           label:"Status",         type:"select", required:true, defaultValue:"Active", options:["Active","Inactive"] },
      ]}
    />
  );
}
