"use client";
import CrudPage from "../CrudPage";
export default function CurrenciesPage() {
  return (
    <CrudPage title="Currencies" apiPath="/api/master/currencies"
      searchFields={["code","name","symbol"]} addLabel="Add Currency"
      columns={[
        { key:"code",          label:"Code",     width:"90px" },
        { key:"symbol",        label:"Symbol",   width:"80px" },
        { key:"name",          label:"Currency Name" },
        { key:"decimalPlaces", label:"Decimals", width:"90px" },
        { key:"isBase",        label:"Base?",    width:"80px", render:(r)=>(r as any).isBase?"Yes":"No" },
        { key:"status",        label:"Status",   width:"100px" },
      ]}
      formFields={[
        { key:"code",          label:"Currency Code",      type:"text",    required:true, placeholder:"e.g. ZAR" },
        { key:"symbol",        label:"Symbol",        type:"text",    required:true, placeholder:"e.g. R" },
        { key:"name",          label:"Currency Name", type:"text",    required:true, placeholder:"e.g. South African Rand" },
        { key:"decimalPlaces", label:"Decimal Places",type:"number",  defaultValue:2 },
        { key:"isBase",        label:"Base Currency", type:"boolean", defaultValue:false },
        { key:"status",        label:"Status",        type:"select",  required:true, defaultValue:"Active", options:["Active","Inactive"] },
      ]}
    />
  );
}
