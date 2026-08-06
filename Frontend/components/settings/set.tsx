"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  Settings2,
  Building2,
  SlidersHorizontal,
  Mail,
  Bell,
  FileText,
  DatabaseBackup,
  ShieldCheck,
  Plug,
  ChevronRight,
  CheckCircle2,
  X
} from "lucide-react";
import SettingUpdateModal, { FieldConfig } from "./SettingUpdateModal";

// Design tokens
const INK = "#12181F";
const SLATE = "#5C6672";
const MUTED = "#8A929B";
const PAPER = "#F3F5F4";
const BLUE = "#2F6FED";
const BLUE_TINT = "#EAF1FE";
const LINE = "#E1E4E3";
const GOLD = "#B4903F";

interface SettingItem {
  label: string;
  icon: React.ComponentType<any>;
  sub: string[];
}

const items: SettingItem[] = [
  {
    label: "General settings",
    icon: Settings2,
    sub: ["Language", "Timezone", "Date and time format", "Interface theme"],
  },
  {
    label: "Company information",
    icon: Building2,
    sub: ["Company name", "Registered address", "Tax and registration ID", "Logo and branding"],
  },
  {
    label: "System preferences",
    icon: SlidersHorizontal,
    sub: ["Default currency", "Measurement units", "Auto-save behaviour", "Session timeout"],
  },
  {
    label: "Email configuration",
    icon: Mail,
    sub: ["SMTP server", "Sender address", "Reply-to address", "Email signature"],
  },
  {
    label: "Notification settings",
    icon: Bell,
    sub: ["Push notifications", "Email alerts", "SMS alerts", "Notification sound"],
  },
  {
    label: "Document templates",
    icon: FileText,
    sub: ["Invoice template", "Report template", "Letterhead", "Cover page"],
  },
  {
    label: "Backup and restore",
    icon: DatabaseBackup,
    sub: ["Automatic backups", "Backup frequency", "Restore from file", "Export all data"],
  },
  {
    label: "Security settings",
    icon: ShieldCheck,
    sub: ["Two-factor authentication", "Password policy", "Login history", "API keys"],
  },
  {
    label: "Integration settings",
    icon: Plug,
    sub: ["Connected apps", "Webhooks", "API access", "Sync settings"],
  },
];

export default function SettingsMenu() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [activeModal, setActiveModal] = useState<{ category: string; subItem: string } | null>(null);
  
  // Success Toast state
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: "",
    visible: false,
  });

  // Settings global state store with mock prefilled values
  const [settings, setSettings] = useState<Record<string, any>>({
    // General Settings
    language: "English",
    timezone: "ZAR (SAST)",
    date_format: "YYYY-MM-DD",
    theme: "Light",

    // Company info
    company_name: "FreightFlow Logistics Ltd",
    company_address: "123 Logistics Boulevard, Midrand, Johannesburg, 1685",
    tax_id: "TAX-ZA-98283928",
    company_logo: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100' height='100' fill='%232F6FED'/><text x='50%' y='55%' font-family='sans-serif' font-size='18' font-weight='bold' fill='white' text-anchor='middle'>FF</text></svg>",

    // System preferences
    currency: "ZAR (R)",
    units: "Metric",
    auto_save_enabled: true,
    auto_save_interval: "5 minutes",
    session_timeout: 30,

    // Email Config
    smtp_host: "smtp.freightflow.com",
    smtp_port: 587,
    sender_email: "notifications@freightflow.com",
    reply_email: "support@freightflow.com",
    email_signature: "Best regards,\nFreightFlow Logistics Team\nwww.freightflow.com",

    // Notification settings
    push_enabled: true,
    email_alerts: true,
    sms_alerts: false,
    notification_sound: "Chime",

    // Document templates
    invoice_template: "Standard Invoice Layout (Active)",
    report_template: "Corporate Summary Layout (Active)",
    letterhead_template: null,
    coverpage_template: null,

    // Backup & Restore
    auto_backups: true,
    backup_frequency: "Weekly",
    restore_file: null,
    export_format: "CSV",

    // Security Settings
    tfa_enabled: false,
    pwd_min_length: 8,
    pwd_req_symbols: true,
    pwd_req_numbers: true,
    pwd_expiry_days: 90,
    login_history: [
      { date: "2026-07-09 13:12:44", device: "Chrome / Ubuntu Linux", location: "Johannesburg, GP", ip: "197.242.12.34" },
      { date: "2026-07-08 09:24:10", device: "Firefox / Windows 11", location: "Pretoria, GP", ip: "196.25.43.12" },
      { date: "2026-07-07 17:45:02", device: "Safari / Apple iPad", location: "Cape Town, WC", ip: "41.13.92.110" },
      { date: "2026-07-05 11:02:19", device: "Chrome / macOS", location: "Durban, KZN", ip: "102.164.55.8" },
    ],
    api_keys: [
      { name: "Live Production API Key", token: "ff_live_k8s2839281a8b9f71c22d", status: "Active", created: "2026-04-01" },
      { name: "Staging Testing Sandbox", token: "ff_test_t8u9238923a1a9a83d211", status: "Active", created: "2026-06-15" }
    ],

    // Integration Settings
    connected_apps: [
      { name: "QuickBooks Online", description: "Automate delivery invoice syncing", connected: true },
      { name: "Shopify Storefront", description: "Import customer orders as waybills", connected: true },
      { name: "SAP ERP Connector", description: "Synchronize fleet inventory records", connected: false },
    ],
    webhooks_list: [
      "https://api.freightflow-thirdparty.com/v1/deliveries/webhook",
      "https://hooks.slack.com/services/T0123/B4567/X7890"
    ],
    api_access_enabled: true,
    api_access_token: "ff_access_token_882839281a8b9f",
    sync_frequency: "Hourly",
  });

  const toggle = (i: number) => {
    setOpenIndex((prev) => (prev === i ? null : i));
  };

  const showToastNotification = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3000);
  };

  const handleSaveSetting = (updatedData: Record<string, any>) => {
    setSettings((prev) => ({
      ...prev,
      ...updatedData,
    }));
    
    if (activeModal) {
      showToastNotification(`${activeModal.subItem} settings saved successfully!`);
    }
    setActiveModal(null);
  };

  // Generate Field Configurations dynamically for the Settings Modal
  const getFieldConfigs = (category: string, subItem: string): { fields: FieldConfig[]; description?: string } => {
    switch (subItem) {
      // General Settings
      case "Language":
        return {
          description: "Choose your primary display language. This applies across the admin panel.",
          fields: [{ key: "language", label: "Preferred Language", type: "select", value: settings.language, options: ["English", "Urdu", "Spanish", "French", "Arabic", "Chinese"] }]
        };
      case "Timezone":
        return {
          description: "Select your local timezone to align manifest dispatch and delivery logs.",
          fields: [{ key: "timezone", label: "System Timezone", type: "select", value: settings.timezone, options: ["UTC", "GMT", "EST", "PKT", "ZAR (SAST)"] }]
        };
      case "Date and time format":
        return {
          description: "Define how timestamps and document dates are rendered globally.",
          fields: [{ key: "date_format", label: "Date Format Schema", type: "select", value: settings.date_format, options: ["YYYY-MM-DD", "DD/MM/YYYY", "MM/DD/YYYY", "YYYY/MM/DD"] }]
        };
      case "Interface theme":
        return {
          description: "Customize the graphical appearance of your workspace.",
          fields: [{ key: "theme", label: "Interface Theme Mode", type: "select", value: settings.theme, options: ["Light", "Dark", "System"] }]
        };

      // Company Information
      case "Company name":
        return {
          description: "Update the registered company name printed on invoices and manifests.",
          fields: [{ key: "company_name", label: "Registered Trade Name", type: "text", value: settings.company_name, placeholder: "FreightFlow Logistics Ltd" }]
        };
      case "Registered address":
        return {
          description: "Your official business address, displayed in corporate document headers.",
          fields: [{ key: "company_address", label: "Business Location Address", type: "textarea", value: settings.company_address }]
        };
      case "Tax and registration ID":
        return {
          description: "Required registration codes for compliance invoices and tax reporting.",
          fields: [{ key: "tax_id", label: "Corporate VAT/Tax registration ID", type: "text", value: settings.tax_id, placeholder: "TAX-12345678" }]
        };
      case "Logo and branding":
        return {
          description: "Upload your business logo. Supported formats: PNG, JPG, SVG.",
          fields: [{ key: "company_logo", label: "Corporate Brand Logo", type: "file", value: settings.company_logo }]
        };

      // System Preferences
      case "Default currency":
        return {
          description: "The primary currency unit applied to financial summaries and delivery quotes.",
          fields: [{ key: "currency", label: "Billing Currency", type: "select", value: settings.currency, options: ["USD ($)", "EUR (€)", "PKR (₨)", "ZAR (R)"] }]
        };
      case "Measurement units":
        return {
          description: "Select system standard for weights, volumes, and distances.",
          fields: [{ key: "units", label: "Dimension Unit System", type: "select", value: settings.units, options: ["Metric", "Imperial"] }]
        };
      case "Auto-save behaviour":
        return {
          description: "Manage system behavior to prevent data loss on manifest creation drafts.",
          fields: [
            { key: "auto_save_enabled", label: "Enable Background Draft Saving", type: "toggle", value: settings.auto_save_enabled },
            { key: "auto_save_interval", label: "Save Frequency Interval", type: "select", value: settings.auto_save_interval, options: ["1 minute", "5 minutes", "10 minutes"] }
          ]
        };
      case "Session timeout":
        return {
          description: "Automatically log out inactive users after a threshold to prevent unauthorized access.",
          fields: [{ key: "session_timeout", label: "Inactivity Expiry Limit", type: "number", value: settings.session_timeout, unit: "minutes" }]
        };

      // Email Configuration
      case "SMTP server":
        return {
          description: "Configure your company's outbound SMTP relay server for sending alerts and reports.",
          fields: [
            { key: "smtp_host", label: "SMTP Host Address", type: "text", value: settings.smtp_host, placeholder: "smtp.example.com" },
            { key: "smtp_port", label: "SMTP Connection Port", type: "number", value: settings.smtp_port, placeholder: "587" }
          ]
        };
      case "Sender address":
        return {
          description: "The source email address showing on outgoing freight alerts.",
          fields: [{ key: "sender_email", label: "Sender Email Address", type: "text", value: settings.sender_email, placeholder: "notifications@yourdomain.com" }]
        };
      case "Reply-to address":
        return {
          description: "The default destination when clients hit reply to automated notifications.",
          fields: [{ key: "reply_email", label: "Reply-To Destination Address", type: "text", value: settings.reply_email, placeholder: "support@yourdomain.com" }]
        };
      case "Email signature":
        return {
          description: "Rich text signature appended to outgoing system notification emails.",
          fields: [{ key: "email_signature", label: "System Email Signature footer", type: "textarea", value: settings.email_signature }]
        };

      // Notification settings
      case "Push notifications":
        return {
          description: "Receive browser notifications for urgent dispatch updates and driver route updates.",
          fields: [{ key: "push_enabled", label: "In-Browser Web Push Alerts", type: "toggle", value: settings.push_enabled }]
        };
      case "Email alerts":
        return {
          description: "Send instant email notifications to dispatcher staff upon booking failures or driver incidents.",
          fields: [{ key: "email_alerts", label: "Discrepancy Email Alerts", type: "toggle", value: settings.email_alerts }]
        };
      case "SMS alerts":
        return {
          description: "Send direct SMS message updates to drivers for route modifications (carrier fees apply).",
          fields: [{ key: "sms_alerts", label: "Driver SMS Notifications", type: "toggle", value: settings.sms_alerts }]
        };
      case "Notification sound":
        return {
          description: "Assign an audio theme played on dashboard alert alerts.",
          fields: [{ key: "notification_sound", label: "Global Sound Scheme", type: "select", value: settings.notification_sound, options: ["Chime", "Bell", "Default"] }]
        };

      // Document templates
      case "Invoice template":
        return {
          description: "Upload a customized layout file (.docx or .pdf) used when generating customer invoices.",
          fields: [{ key: "invoice_template", label: "Invoice PDF Layout Template", type: "file", value: settings.invoice_template }]
        };
      case "Report template":
        return {
          description: "Upload layout templates used for weekly driver metrics summaries and fuel logs.",
          fields: [{ key: "report_template", label: "Report Sheet Template", type: "file", value: settings.report_template }]
        };
      case "Letterhead":
        return {
          description: "Configure corporate letterhead image applied to top headers of printouts.",
          fields: [{ key: "letterhead_template", label: "Print Letterhead Graphic", type: "file", value: settings.letterhead_template }]
        };
      case "Cover page":
        return {
          description: "Optional cover sheet layout applied to large export bundles.",
          fields: [{ key: "coverpage_template", label: "Report Cover Layout Page", type: "file", value: settings.coverpage_template }]
        };

      // Backup & Restore
      case "Automatic backups":
        return {
          description: "Automate data replication schedules to backup archives.",
          fields: [{ key: "auto_backups", label: "Background Automated Replications", type: "toggle", value: settings.auto_backups }]
        };
      case "Backup frequency":
        return {
          description: "Determine how often system data snapshots are replicated to cloud archives.",
          fields: [{ key: "backup_frequency", label: "Sync Backup Frequency", type: "select", value: settings.backup_frequency, options: ["Daily", "Weekly", "Monthly"] }]
        };
      case "Restore from file":
        return {
          description: "Restore previous database states. Warning: This overwrites current configurations.",
          fields: [{ key: "restore_trigger", label: "Load Database State", type: "list", value: settings.restore_file }]
        };
      case "Export all data":
        return {
          description: "Export full workspace records (waybills, manifests, drivers, vehicles) in a single bundle.",
          fields: [
            { key: "export_format", label: "Select Bundle Format", type: "select", value: settings.export_format, options: ["CSV", "JSON"] },
            { key: "export_trigger", label: "Export Workspace Bundle", type: "list", value: null }
          ]
        };

      // Security Settings
      case "Two-factor authentication":
        return {
          description: "Enhance account login security by pairing authenticator apps.",
          fields: [{ key: "tfa_enabled", label: "MFA Setup Flow", type: "list", value: settings.tfa_enabled }]
        };
      case "Password policy":
        return {
          description: "Configure global requirements for user account credentials.",
          fields: [
            { key: "pwd_min_length", label: "Minimum Character Length", type: "number", value: settings.pwd_min_length },
            { key: "pwd_req_symbols", label: "Require Special Characters (@,#...)", type: "toggle", value: settings.pwd_req_symbols },
            { key: "pwd_req_numbers", label: "Require Numbers (0-9)", type: "toggle", value: settings.pwd_req_numbers },
            { key: "pwd_expiry_days", label: "Force Expiry Duration (days)", type: "number", value: settings.pwd_expiry_days }
          ]
        };
      case "Login history":
        return {
          description: "Review recent authenticated administrative sessions for audits.",
          fields: [{ key: "login_history", label: "Administrative Active Sessions", type: "list", value: settings.login_history }]
        };
      case "API keys":
        return {
          description: "Manage integration credentials used for external services.",
          fields: [{ key: "api_keys", label: "Workspace API Keys", type: "list", value: settings.api_keys }]
        };

      // Integration Settings
      case "Connected apps":
        return {
          description: "Connect or disconnect external ERP, Accounting, or eCommerce integrations.",
          fields: [{ key: "connected_apps", label: "Platform Integration Apps", type: "list", value: settings.connected_apps }]
        };
      case "Webhooks":
        return {
          description: "Configure HTTP POST webhook callbacks triggered upon manifest changes.",
          fields: [{ key: "webhooks_list", label: "System Event Dispatch Webhooks", type: "list", value: settings.webhooks_list }]
        };
      case "API access":
        return {
          description: "Control access to the core REST developer endpoints.",
          fields: [
            { key: "api_access_enabled", label: "REST Endpoint Access Status", type: "toggle", value: settings.api_access_enabled },
            { key: "api_access_token", label: "System developer bearer token", type: "text", value: settings.api_access_token }
          ]
        };
      case "Sync settings":
        return {
          description: "Determine frequency for synchronizing offline driver logs.",
          fields: [{ key: "sync_frequency", label: "Offline Driver Log Sync Frequency", type: "select", value: settings.sync_frequency, options: ["Hourly", "Daily", "Weekly", "Manual Only"] }]
        };

      default:
        return { fields: [] };
    }
  };

  return (
    <div className="bg-[#F3F5F4] p-4 sm:p-7 min-h-[560px] text-[#12181F] font-sans">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');

        .settings-row {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 280ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        .settings-row.open {
          grid-template-rows: 1fr;
        }
        .settings-row > .settings-row-inner {
          overflow: hidden;
        }
        .settings-trigger {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 15px 20px;
          background: transparent;
          border: none;
          cursor: pointer;
          text-align: left;
          font-family: 'Inter', sans-serif;
          position: relative;
        }
        .settings-trigger:hover {
          background: #F3F5F4;
        }
        .settings-chevron {
          transition: transform 240ms cubic-bezier(0.4, 0, 0.2, 1);
          flex-shrink: 0;
        }
        .settings-chevron.open {
          transform: rotate(180deg);
        }
        
        /* Tree connector lines structure for accordion items */
        .sub-item {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 20px 12px 48px;
          font-size: 14px;
          font-weight: 500;
          color: #5c6672;
          cursor: pointer;
          transition: all 150ms ease;
          user-select: none;
        }
        .sub-item:hover {
          color: #2f6fed;
          background: rgba(47, 111, 237, 0.05);
        }
        .sub-item::before {
          content: '';
          position: absolute;
          left: 28px;
          top: 0;
          bottom: 0;
          width: 1.5px;
          background: #e1e4e3;
        }
        .sub-item:first-child::before {
          top: 0px;
        }
        .sub-item:last-child::before {
          height: 50%;
          bottom: auto;
        }
        .sub-item::after {
          content: '';
          position: absolute;
          left: 28px;
          top: 50%;
          width: 10px;
          height: 1.5px;
          background: #e1e4e3;
        }
        .sub-item-arrow {
          opacity: 0;
          transform: translateX(-6px);
          transition: opacity 150ms ease, transform 150ms ease;
          color: #2f6fed;
          flex-shrink: 0;
        }
        .sub-item:hover .sub-item-arrow {
          opacity: 1;
          transform: translateX(0);
        }

        /* Responsive tightening for small screens (phones) */
        @media (max-width: 480px) {
          .settings-trigger {
            padding: 13px 14px;
            gap: 10px;
          }
          .sub-item {
            padding: 11px 14px 11px 34px;
            font-size: 13px;
          }
          .sub-item::before {
            left: 18px;
          }
          .sub-item::after {
            left: 18px;
            width: 8px;
          }
        }
      `}</style>

      {/* Header section */}
      <div className="mb-6">
        <p className="font-['Space_Grotesk'] text-[11px] font-semibold tracking-[0.14em] text-[#B4903F] m-0 uppercase">
          Workspace
        </p>
        <h1 className="font-['Space_Grotesk'] text-xl sm:text-2xl md:text-3xl font-bold tracking-tight m-0 text-[#12181F]">
          Settings
        </h1>
      </div>

      {/* Accordion List Container */}
      <div className="border border-[#E1E4E3] rounded-xl overflow-hidden bg-white shadow-[0_1px_2px_rgba(18,24,31,0.04)]">
        {items.map((item, i) => {
          const Icon = item.icon;
          const isOpen = openIndex === i;
          return (
            <div
              key={item.label}
              className="border-b border-[#E1E4E3] last:border-b-0 transition-all duration-200"
              style={{
                borderLeft: isOpen ? `3px solid ${BLUE}` : "3px solid transparent",
                background: isOpen ? BLUE_TINT : "transparent",
              }}
            >
              {/* Category Header Row */}
              <button className="settings-trigger" onClick={() => toggle(i)}>
                <Icon
                  size={18}
                  color={isOpen ? BLUE : SLATE}
                  className="shrink-0 transition-colors duration-200"
                  aria-hidden="true"
                />
                <span
                  className="flex-1 min-w-0 truncate text-[13.5px] sm:text-[14.5px] tracking-tight transition-colors duration-200 text-left"
                  style={{
                    fontWeight: isOpen ? 600 : 400,
                    color: isOpen ? BLUE : INK,
                  }}
                >
                  {item.label}
                </span>
                <ChevronDown
                  size={16}
                  color={isOpen ? BLUE : MUTED}
                  className={`settings-chevron shrink-0 ${isOpen ? "open" : ""}`}
                />
              </button>

              {/* Sub items collapsible section */}
              <div className={`settings-row ${isOpen ? "open" : ""}`}>
                <div className="settings-row-inner">
                  <div className="pb-2.5">
                    {item.sub.map((s) => (
                      <div
                        key={s}
                        className="sub-item"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveModal({ category: item.label, subItem: s });
                        }}
                      >
                        <span className="flex-1 min-w-0 truncate pr-4">{s}</span>
                        <ChevronRight size={14} className="sub-item-arrow" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Success Notification Toast */}
      {toast.visible && (
        <div className="fixed top-4 inset-x-4 sm:inset-x-auto sm:right-4 z-50 flex items-center gap-2.5 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl animate-in slide-in-from-top-5 duration-200 sm:max-w-sm">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <div className="min-w-0 text-left">
            <p className="text-xs font-semibold text-gray-400">Success</p>
            <p className="text-sm font-medium text-white truncate">{toast.message}</p>
          </div>
          <button 
            onClick={() => setToast(prev => ({ ...prev, visible: false }))}
            className="text-gray-400 hover:text-white ml-2 shrink-0 p-0.5 hover:bg-white/10 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Setting Edit Modal */}
      {activeModal && (
        <SettingUpdateModal
          isOpen={true}
          title={activeModal.subItem}
          {...getFieldConfigs(activeModal.category, activeModal.subItem)}
          onSave={handleSaveSetting}
          onCancel={() => setActiveModal(null)}
        />
      )}
    </div>
  );
}