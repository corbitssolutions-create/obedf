"use client";
import CrudPage from "../CrudPage";
export default function NotificationTemplatesPage() {
  return (
    <CrudPage title="Notification Templates" apiPath="/api/master/notification-templates"
      searchFields={["code","name","type","module"]} addLabel="Add Template"
      columns={[
        { key:"code",   label:"Code",    width:"120px" },
        { key:"name",   label:"Name"     },
        { key:"type",   label:"Channel", width:"100px" },
        { key:"module", label:"Module",  width:"110px" },
        { key:"status", label:"Status",  width:"100px" },
      ]}
      formFields={[
        { key:"code",    label:"Code",    type:"text",   required:true, placeholder:"e.g. WB-DELIVERED" },
        { key:"name",    label:"Name",    type:"text",   required:true, placeholder:"e.g. Waybill Delivered SMS" },
        { key:"type",    label:"Channel", type:"select", required:true, options:["SMS","Email","WhatsApp"] },
        { key:"module",  label:"Module",  type:"select", options:["Waybill","Manifest","POD","Invoice","Trip","General"] },
        { key:"subject", label:"Subject (Email)", type:"text", placeholder:"e.g. Your delivery is on its way" },
        { key:"body",    label:"Message Body",    type:"textarea", required:true },
        { key:"status",  label:"Status",          type:"select", required:true, defaultValue:"Active", options:["Active","Inactive"] },
      ]}
    />
  );
}
