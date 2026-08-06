"use client";
import CrudPage from "../CrudPage";
import { apiGet } from "@/lib/api";
export default function ProvincesPage() {
  return (
    <CrudPage title="Provinces" apiPath="/api/master/provinces"
      searchFields={["code","name"]} addLabel="Add Province"
      columns={[
        { key:"code",    label:"Code",         width:"100px" },
        { key:"name",    label:"Province Name" },
        { key:"country", label:"Country",      render:(r)=>(r as any).country?.name || "—" },
        { key:"status",  label:"Status",       width:"100px" },
      ]}
      formFields={[
        { key:"code",    label:"Province Code", type:"text",   required:true, placeholder:"e.g. GP" },
        { key:"name",    label:"Province Name", type:"text",   required:true, placeholder:"e.g. Gauteng" },
        { key:"country", label:"Country",       type:"select", required:true,
          loadOptions: async () => {
            const res = await apiGet<{success:boolean;data:any[]}>("/api/master/countries/lookup");
            return (res.data||[]).map((c:any)=>({ label:c.name, value:c._id }));
          }
        },
        { key:"status",  label:"Status", type:"select", required:true, defaultValue:"Active", options:["Active","Inactive"] },
      ]}
    />
  );
}
