"use client";
import CrudPage from "../CrudPage";
import { apiGet } from "@/lib/api";

export default function SuppliersPage() {
  const loadPaymentTerms = async () => {
    const r = await apiGet<{success:boolean;data:any[]}>("/api/master/payment-terms/lookup");
    return (r.data||[]).map((x:any)=>({ label:`${x.code} — ${x.name}`, value:x._id }));
  };
  const loadCurrencies = async () => {
    const r = await apiGet<{success:boolean;data:any[]}>("/api/master/currencies/lookup");
    return (r.data||[]).map((x:any)=>({ label:`${x.code} — ${x.name}`, value:x._id }));
  };

  return (
    <CrudPage title="Suppliers" apiPath="/api/suppliers"
      searchFields={["supplierCode","supplierName","contactPerson","email","phoneNumber"]}
      addLabel="Add Supplier"
      columns={[
        { key:"supplierCode", label:"Code",         width:"120px" },
        { key:"supplierName", label:"Supplier Name" },
        { key:"contactPerson",label:"Contact",      width:"150px" },
        { key:"phoneNumber",  label:"Phone",        width:"140px" },
        { key:"email",        label:"Email" },
        { key:"status",       label:"Status",       width:"100px" },
      ]}
      formFields={[
        { key:"supplierCode",      label:"Supplier Code",     type:"text",   required:true,  placeholder:"e.g. SUP-001" },
        { key:"supplierName",      label:"Supplier Name",     type:"text",   required:true,  placeholder:"e.g. ABC Tyres Ltd" },
        { key:"supplierType",      label:"Supplier Type",     type:"select", options:["Transporter","Fuel","Parts & Repairs","Tyres","IT","Stationery","Other"] },
        { key:"registrationNumber",label:"Reg. Number",       type:"text",   placeholder:"e.g. 2020/123456/07" },
        { key:"vatNumber",         label:"VAT Number",        type:"text",   placeholder:"e.g. 4560000000" },
        { key:"contactPerson",     label:"Contact Person",    type:"text" },
        { key:"phoneNumber",       label:"Phone Number",      type:"text" },
        { key:"email",             label:"Email",             type:"email" },
        { key:"website",           label:"Website",           type:"text",   placeholder:"https://..." },
        { key:"bankName",          label:"Bank Name",         type:"text" },
        { key:"bankAccountNumber", label:"Bank Account No.",  type:"text" },
        { key:"bankBranchCode",    label:"Branch Code",       type:"text" },
        { key:"bankAccountType",   label:"Account Type",      type:"select", options:["Current","Savings","Transmission"] },
        { key:"paymentTerm",       label:"Payment Term",      type:"select", loadOptions: loadPaymentTerms },
        { key:"currency",          label:"Currency",          type:"select", loadOptions: loadCurrencies },
        { key:"creditLimit",       label:"Credit Limit (R)",  type:"number", defaultValue:0 },
        { key:"notes",             label:"Notes",             type:"textarea" },
        { key:"status",            label:"Status",            type:"select", required:true, defaultValue:"Active", options:["Active","Inactive","Blacklisted"] },
      ]}
    />
  );
}
