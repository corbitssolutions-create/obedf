"use client";
import CrudPage from "../CrudPage";
export default function CountriesPage() {
  return (
    <CrudPage title="Countries" apiPath="/api/master/countries"
      searchFields={["code","name","dialingCode"]} addLabel="Add Country"
      columns={[
        { key:"code",        label:"ISO Code",      width:"100px" },
        { key:"name",        label:"Country Name"   },
        { key:"dialingCode", label:"Dialing Code",  width:"130px" },
        { key:"status",      label:"Status",        width:"100px" },
      ]}
      formFields={[
        { key:"code",        label:"ISO Code (2-letter)", type:"text", required:true, placeholder:"e.g. ZA" },
        { key:"name",        label:"Country Name",        type:"text", required:true, placeholder:"e.g. South Africa" },
        { key:"dialingCode", label:"Dialing Code",        type:"text", placeholder:"+27" },
        { key:"status",      label:"Status", type:"select", required:true, defaultValue:"Active", options:["Active","Inactive"] },
      ]}
    />
  );
}
