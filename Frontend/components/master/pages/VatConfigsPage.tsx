"use client";
import CrudPage from "../CrudPage";
export default function VatConfigsPage() {
  return (
    <CrudPage title="VAT Configurations" apiPath="/api/master/vat-configs"
      searchFields={["code","name"]} addLabel="Add VAT Config"
      columns={[
        { key:"code",  label:"Code",     width:"120px" },
        { key:"name",  label:"VAT Name"  },
        { key:"rate",  label:"Rate (%)", width:"100px", render:(r)=>`${(r as any).rate??0}%` },
        { key:"status",label:"Status",   width:"100px" },
      ]}
      formFields={[
        { key:"code",          label:"Code",          type:"text",   required:true, placeholder:"e.g. STD" },
        { key:"name",          label:"Name",          type:"text",   required:true, placeholder:"e.g. Standard Rate (15%)" },
        { key:"rate",          label:"VAT Rate (%)",  type:"number", defaultValue:15 },
        { key:"effectiveDate", label:"Effective Date",type:"date" },
        { key:"status",        label:"Status",        type:"select", required:true, defaultValue:"Active", options:["Active","Inactive"] },
      ]}
    />
  );
}
