"use client";
import CrudPage from "../CrudPage";
import { apiGet } from "@/lib/api";

export default function RateCardsPage() {
  const loadCustomers    = async () => { const r = await apiGet<any>("/api/customers/lookup");    return (r.data||[]).map((x:any)=>({ label:x.name,             value:x._id })); };
  const loadServiceTypes = async () => { const r = await apiGet<any>("/api/master/service-types/lookup"); return (r.data||[]).map((x:any)=>({ label:`${x.code} — ${x.name}`, value:x._id })); };
  const loadRateTypes    = async () => { const r = await apiGet<any>("/api/master/rate-types/lookup");    return (r.data||[]).map((x:any)=>({ label:`${x.code} — ${x.name}`, value:x._id })); };
  const loadCurrencies   = async () => { const r = await apiGet<any>("/api/master/currencies/lookup");   return (r.data||[]).map((x:any)=>({ label:`${x.code} — ${x.name}`, value:x._id })); };

  return (
    <CrudPage title="Rate Cards" apiPath="/api/master/rate-cards"
      searchFields={["code","name","origin","destination"]} addLabel="Add Rate Card"
      columns={[
        { key:"code",        label:"Code",        width:"120px" },
        { key:"name",        label:"Rate Card Name" },
        { key:"customer",    label:"Customer",    render:(r)=>(r as any).customer?.name||"—" },
        { key:"origin",      label:"From",        width:"130px" },
        { key:"destination", label:"To",          width:"130px" },
        { key:"price",       label:"Price (R)",   width:"110px", render:(r)=>`R ${((r as any).price||0).toFixed(2)}` },
        { key:"status",      label:"Status",      width:"100px" },
      ]}
      formFields={[
        { key:"code",          label:"Rate Card Code", type:"text",   required:true, placeholder:"e.g. RC-001" },
        { key:"name",          label:"Name",           type:"text",   required:true, placeholder:"e.g. Alpha JHB-PTA Express" },
        { key:"customer",      label:"Customer",       type:"select", required:true, loadOptions:loadCustomers },
        { key:"origin",        label:"Origin",         type:"text",   required:true, placeholder:"e.g. Johannesburg" },
        { key:"destination",   label:"Destination",    type:"text",   required:true, placeholder:"e.g. Pretoria" },
        { key:"serviceType",   label:"Service Type",   type:"select", required:true, loadOptions:loadServiceTypes },
        { key:"rateType",      label:"Rate Type",      type:"select", required:true, loadOptions:loadRateTypes },
        { key:"currency",      label:"Currency",       type:"select", loadOptions:loadCurrencies },
        { key:"price",         label:"Price",          type:"number", required:true, defaultValue:0 },
        { key:"fuelLevy",      label:"Fuel Levy (%)",  type:"number", defaultValue:0 },
        { key:"tollCharges",   label:"Toll Charges",   type:"number", defaultValue:0 },
        { key:"minimumCharge", label:"Minimum Charge", type:"number", defaultValue:0 },
        { key:"effectiveDate", label:"Effective Date", type:"date",   required:true },
        { key:"expiryDate",    label:"Expiry Date",    type:"date" },
        { key:"notes",         label:"Notes",          type:"textarea" },
        { key:"status",        label:"Status",         type:"select", required:true, defaultValue:"Active", options:["Active","Inactive","Expired"] },
      ]}
    />
  );
}
