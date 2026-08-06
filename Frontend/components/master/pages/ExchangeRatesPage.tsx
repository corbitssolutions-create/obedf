"use client";
import CrudPage from "../CrudPage";
import { apiGet } from "@/lib/api";

export default function ExchangeRatesPage() {
  const loadCurrencies = async () => {
    const r = await apiGet<{success:boolean;data:any[]}>("/api/master/currencies/lookup");
    return (r.data||[]).map((x:any)=>({ label:`${x.code} — ${x.name}`, value:x._id }));
  };

  return (
    <CrudPage title="Exchange Rates" apiPath="/api/exchange-rates"
      searchFields={["source"]} addLabel="Add Exchange Rate"
      columns={[
        { key:"fromCurrency", label:"From",          render:(r)=>(r as any).fromCurrency?.code||"—" },
        { key:"toCurrency",   label:"To",            render:(r)=>(r as any).toCurrency?.code||"—" },
        { key:"rate",         label:"Rate",          render:(r)=>(r as any).rate?.toFixed(6)||"—" },
        { key:"effectiveDate",label:"Effective",     render:(r)=>(r as any).effectiveDate ? new Date((r as any).effectiveDate).toLocaleDateString("en-ZA") : "—" },
        { key:"source",       label:"Source",        width:"130px" },
        { key:"status",       label:"Status",        width:"100px" },
      ]}
      formFields={[
        { key:"fromCurrency",  label:"From Currency",  type:"select", required:true, loadOptions:loadCurrencies },
        { key:"toCurrency",    label:"To Currency",    type:"select", required:true, loadOptions:loadCurrencies },
        { key:"rate",          label:"Exchange Rate",  type:"number", required:true },
        { key:"effectiveDate", label:"Effective Date", type:"date",   required:true },
        { key:"expiryDate",    label:"Expiry Date",    type:"date" },
        { key:"source",        label:"Source",         type:"select", options:["Manual","SARB","OANDA","Reuters","Other"] },
        { key:"status",        label:"Status",         type:"select", required:true, defaultValue:"Active", options:["Active","Inactive"] },
      ]}
    />
  );
}
