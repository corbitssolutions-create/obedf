"use client";

import React, { useState, useEffect } from "react";
import { ModalShell, Field, Select, inputClass } from "../ui/FormControls";
import { 
  Play, 
  Trash2, 
  Copy, 
  Plus, 
  Check, 
  Shield, 
  Laptop, 
  MapPin, 
  Key, 
  Upload, 
  FileCheck,
  CheckCircle2
} from "lucide-react";

export interface FieldConfig {
  key: string;
  label: string;
  type: "text" | "select" | "textarea" | "toggle" | "number" | "file" | "password" | "list";
  value: any;
  options?: (string | { label: string; value: string })[];
  placeholder?: string;
  unit?: string;
  helpText?: string;
}

interface SettingUpdateModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  fields: FieldConfig[];
  onSave: (data: Record<string, any>) => void;
  onCancel: () => void;
}

export default function SettingUpdateModal({
  isOpen,
  title,
  description,
  fields,
  onSave,
  onCancel,
}: SettingUpdateModalProps) {
  const [formState, setFormState] = useState<Record<string, any>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  // Custom states for list operations (local changes inside the modal)
  const [newWebhook, setNewWebhook] = useState("");
  const [is2faSetupStep, setIs2faSetupStep] = useState(false);
  const [tfaVerificationCode, setTfaVerificationCode] = useState("");
  const [tfaError, setTfaError] = useState("");
  const [tfaSuccess, setTfaSuccess] = useState(false);

  // Initialize form state
  useEffect(() => {
    if (isOpen) {
      const initial: Record<string, any> = {};
      fields.forEach((f) => {
        initial[f.key] = f.value;
      });
      setFormState(initial);
      
      // Reset temporary states
      setCopiedKey(null);
      setPreviewPlaying(false);
      setNewWebhook("");
      setIs2faSetupStep(false);
      setTfaVerificationCode("");
      setTfaError("");
      setTfaSuccess(false);
    }
  }, [isOpen, fields]);

  if (!isOpen) return null;

  const handleFieldChange = (key: string, value: any) => {
    setFormState((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleCopy = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(identifier);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handlePlaySound = (sound: string) => {
    if (previewPlaying) return;
    setPreviewPlaying(true);
    // Simulate playing audio
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    if (sound === "Chime") {
      oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      oscillator.frequency.setValueAtTime(880.00, audioCtx.currentTime + 0.15); // A5
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } else if (sound === "Bell") {
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(987.77, audioCtx.currentTime); // B5
      gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.8);
    } else {
      oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.3);
    }

    setTimeout(() => setPreviewPlaying(false), 800);
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formState);
  };

  // Rendering Helper for custom fields
  const renderFieldInput = (field: FieldConfig) => {
    const value = formState[field.key];
    const key = field.key;

    switch (field.type) {
      case "text":
        // Grouped SMTP host and port fields
        if (key === "smtp_host" || key === "smtp_port") {
          return null; // Handle together in custom container
        }
        return (
          <input
            type="text"
            value={value || ""}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            placeholder={field.placeholder}
            className={inputClass}
          />
        );

      case "password":
        return (
          <input
            type="password"
            value={value || ""}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            placeholder={field.placeholder || "••••••••"}
            className={inputClass}
          />
        );

      case "textarea":
        return (
          <textarea
            value={value || ""}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            placeholder={field.placeholder}
            rows={field.key === "email_signature" ? 4 : 3}
            className={`${inputClass} resize-none`}
          />
        );

      case "select":
        return (
          <div className="flex items-center gap-2 w-full">
            <div className="flex-1">
              <Select
                value={value || ""}
                onChange={(val) => handleFieldChange(key, val)}
                placeholder={field.placeholder || "Select option"}
                options={field.options || []}
              />
            </div>
            {key === "notification_sound" && (
              <button
                type="button"
                onClick={() => handlePlaySound(value)}
                disabled={!value || previewPlaying}
                className={`p-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition flex items-center justify-center shrink-0 ${previewPlaying ? "animate-pulse" : ""}`}
                title="Preview sound"
              >
                <Play className={`h-4 w-4 ${previewPlaying ? "fill-gray-600" : ""}`} />
              </button>
            )}
          </div>
        );

      case "toggle":
        return (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleFieldChange(key, !value)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                value ? "bg-blue-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  value ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <span className="text-sm text-gray-500">
              {value ? "Enabled" : "Disabled"}
            </span>
          </div>
        );

      case "number":
        return (
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={value === undefined ? "" : value}
              onChange={(e) => handleFieldChange(key, e.target.value === "" ? "" : Number(e.target.value))}
              placeholder={field.placeholder}
              className={inputClass}
            />
            {field.unit && (
              <span className="text-sm font-semibold text-gray-500 shrink-0">
                {field.unit}
              </span>
            )}
          </div>
        );

      case "file":
        const hasPreview = typeof value === "string" && value.startsWith("data:image") || (value && typeof value === "object");
        const fileName = value && typeof value === "object" ? (value as File).name : (typeof value === "string" ? value : "");

        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
              handleFieldChange(key, reader.result); // Save as base64 string
            };
            reader.readAsDataURL(file);
          }
        };

        const triggerRemoveFile = () => {
          handleFieldChange(key, "");
        };

        return (
          <div className="w-full">
            {value ? (
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl bg-gray-50/50">
                <div className="flex items-center gap-3 overflow-hidden">
                  {hasPreview ? (
                    <img 
                      src={value} 
                      alt="Preview" 
                      className="h-12 w-12 rounded-lg object-contain border border-gray-100 bg-white" 
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-lg border border-gray-100 bg-white flex items-center justify-center text-blue-600">
                      <FileCheck className="h-6 w-6" />
                    </div>
                  )}
                  <div className="text-left overflow-hidden">
                    <p className="text-sm font-medium text-gray-700 truncate max-w-[200px] sm:max-w-xs">
                      {fileName.includes("data:image") ? "branding-logo.png" : (fileName || "uploaded-file.pdf")}
                    </p>
                    <p className="text-xs text-gray-400">Ready to save</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={triggerRemoveFile}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div 
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => handleFieldChange(key, reader.result);
                    reader.readAsDataURL(file);
                  }
                }}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${dragActive ? "border-blue-500 bg-blue-50/30" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"}`}
              >
                <input
                  type="file"
                  id={`file-upload-${key}`}
                  className="hidden"
                  accept={key.includes("logo") || key.includes("letterhead") ? "image/*" : ".pdf,.docx,.xlsx"}
                  onChange={handleFileChange}
                />
                <label htmlFor={`file-upload-${key}`} className="cursor-pointer">
                  <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm font-semibold text-gray-700">Click to upload or drag & drop</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {key.includes("logo") || key.includes("letterhead") ? "PNG, JPG, SVG up to 2MB" : "PDF, DOCX, XLSX up to 5MB"}
                  </p>
                </label>
              </div>
            )}
          </div>
        );

      case "list":
        // ---------------- CUSTOM LIST STRUCTURES ----------------
        if (key === "connected_apps") {
          const appsList = value || [];
          const toggleAppConnection = (appName: string) => {
            const updated = appsList.map((app: any) => {
              if (app.name === appName) {
                return { ...app, connected: !app.connected };
              }
              return app;
            });
            handleFieldChange(key, updated);
          };
          return (
            <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-100">
              {appsList.map((app: any) => (
                <div key={app.name} className="flex items-center justify-between p-4 bg-white hover:bg-gray-50/30 transition">
                  <div className="text-left">
                    <p className="font-semibold text-sm text-gray-900">{app.name}</p>
                    <p className="text-xs text-gray-400">{app.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleAppConnection(app.name)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                      app.connected
                        ? "bg-red-50 text-red-600 border-red-100 hover:bg-red-100/50"
                        : "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100/50"
                    }`}
                  >
                    {app.connected ? "Disconnect" : "Connect"}
                  </button>
                </div>
              ))}
            </div>
          );
        }

        if (key === "webhooks_list") {
          const webhooks = value || [];
          const removeWebhookUrl = (idx: number) => {
            const updated = webhooks.filter((_: any, i: number) => i !== idx);
            handleFieldChange(key, updated);
          };
          const addWebhookUrl = () => {
            if (!newWebhook.trim()) return;
            handleFieldChange(key, [...webhooks, newWebhook.trim()]);
            setNewWebhook("");
          };
          return (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={newWebhook}
                  onChange={(e) => setNewWebhook(e.target.value)}
                  placeholder="https://api.yourdomain.com/webhook"
                  className={`${inputClass} flex-1`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addWebhookUrl();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={addWebhookUrl}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition shrink-0 flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" /> Add
                </button>
              </div>
              <div className="border border-gray-100 rounded-xl divide-y divide-gray-100 overflow-hidden bg-white">
                {webhooks.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4 px-3 text-center">No active webhooks configured</p>
                ) : (
                  webhooks.map((url: string, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 hover:bg-gray-50/50 transition">
                      <span className="text-sm font-mono text-gray-600 truncate mr-4 flex-1 text-left">{url}</span>
                      <button
                        type="button"
                        onClick={() => removeWebhookUrl(idx)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        }

        if (key === "login_history") {
          const history = value || [];
          return (
            <div className="border border-gray-100 rounded-xl overflow-hidden bg-white max-h-[300px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-4 font-semibold">Date & Time</th>
                    <th className="py-2.5 px-4 font-semibold">Device</th>
                    <th className="py-2.5 px-4 font-semibold">Location</th>
                    <th className="py-2.5 px-4 font-semibold">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {history.map((h: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50/30 transition">
                      <td className="py-3 px-4 font-medium text-xs whitespace-nowrap">{h.date}</td>
                      <td className="py-3 px-4 text-xs whitespace-nowrap flex items-center gap-1.5">
                        <Laptop className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        {h.device}
                      </td>
                      <td className="py-3 px-4 text-xs whitespace-nowrap">
                        <span className="inline-flex items-center gap-0.5">
                          <MapPin className="h-3 w-3 text-red-400 shrink-0" />
                          {h.location}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-gray-500 whitespace-nowrap">{h.ip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        if (key === "api_keys") {
          const keys = value || [];
          const generateKey = () => {
            const rand = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
            const newKey = {
              name: `Generated Key (${new Date().toLocaleDateString()})`,
              token: `ff_live_${rand}`,
              status: "Active",
              created: new Date().toISOString().split("T")[0]
            };
            handleFieldChange(key, [newKey, ...keys]);
          };
          const revokeKey = (tokenToRevoke: string) => {
            const updated = keys.map((k: any) => {
              if (k.token === tokenToRevoke) {
                return { ...k, status: "Revoked" };
              }
              return k;
            });
            handleFieldChange(key, updated);
          };
          const deleteKey = (tokenToDelete: string) => {
            const updated = keys.filter((k: any) => k.token !== tokenToDelete);
            handleFieldChange(key, updated);
          };
          return (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={generateKey}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition flex items-center gap-1.5 shadow-sm"
                >
                  <Key className="h-4 w-4" /> Generate New Key
                </button>
              </div>
              <div className="border border-gray-100 rounded-xl divide-y divide-gray-100 overflow-hidden bg-white">
                {keys.map((k: any) => {
                  const isRevoked = k.status === "Revoked";
                  const displayToken = isRevoked ? "••••••••••••••••" : `${k.token.slice(0, 12)}••••••••${k.token.slice(-4)}`;
                  return (
                    <div key={k.token} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-gray-50/30 transition">
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm text-gray-900">{k.name}</p>
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                            isRevoked 
                              ? "bg-red-50 text-red-600 border border-red-100" 
                              : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          }`}>
                            {k.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="font-mono text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100 select-all">{displayToken}</span>
                          {!isRevoked && (
                            <button
                              type="button"
                              onClick={() => handleCopy(k.token, k.token)}
                              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                              title="Copy API key"
                            >
                              {copiedKey === k.token ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1">Created: {k.created}</p>
                      </div>
                      
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {!isRevoked ? (
                          <button
                            type="button"
                            onClick={() => revokeKey(k.token)}
                            className="px-2.5 py-1.5 text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-100 hover:bg-orange-100/50 rounded-lg transition"
                          >
                            Revoke
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => deleteKey(k.token)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete record"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        if (key === "tfa_setup") {
          const isEnabled = value;
          const verifyTfaCode = () => {
            if (tfaVerificationCode.length !== 6) {
              setTfaError("Verification code must be 6 digits.");
              return;
            }
            setTfaError("");
            setTfaSuccess(true);
            setTimeout(() => {
              handleFieldChange(key, true); // Complete flow
              setIs2faSetupStep(false);
            }, 1500);
          };

          if (tfaSuccess) {
            return (
              <div className="py-6 text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3 animate-bounce" />
                <p className="text-base font-bold text-gray-800">Two-Factor Authentication Setup Successful!</p>
                <p className="text-sm text-gray-500 mt-1">Your account is now secured.</p>
              </div>
            );
          }

          if (is2faSetupStep) {
            return (
              <div className="space-y-4 border border-blue-100 bg-blue-50/20 p-5 rounded-xl text-center">
                <p className="text-sm font-semibold text-gray-700">Scan QR Code with your Authenticator App</p>
                
                {/* Simulated QR Code */}
                <div className="mx-auto bg-white p-3 rounded-lg border border-gray-200 h-40 w-40 flex items-center justify-center shadow-inner">
                  <svg className="h-32 w-32 text-slate-800" viewBox="0 0 100 100">
                    <rect x="0" y="0" width="30" height="30" fill="currentColor" />
                    <rect x="5" y="5" width="20" height="20" fill="white" />
                    <rect x="10" y="10" width="10" height="10" fill="currentColor" />
                    
                    <rect x="70" y="0" width="30" height="30" fill="currentColor" />
                    <rect x="75" y="5" width="20" height="20" fill="white" />
                    <rect x="80" y="10" width="10" height="10" fill="currentColor" />
                    
                    <rect x="0" y="70" width="30" height="30" fill="currentColor" />
                    <rect x="5" y="75" width="20" height="20" fill="white" />
                    <rect x="10" y="80" width="10" height="10" fill="currentColor" />
                    
                    <rect x="40" y="5" width="10" height="15" fill="currentColor" />
                    <rect x="40" y="25" width="20" height="5" fill="currentColor" />
                    <rect x="15" y="40" width="25" height="10" fill="currentColor" />
                    <rect x="70" y="45" width="15" height="15" fill="currentColor" />
                    <rect x="55" y="60" width="10" height="25" fill="currentColor" />
                    <rect x="45" y="75" width="5" height="10" fill="currentColor" />
                    <rect x="75" y="75" width="20" height="20" fill="currentColor" />
                    <rect x="80" y="80" width="10" height="10" fill="white" />
                  </svg>
                </div>
                
                <div className="text-left max-w-xs mx-auto">
                  <p className="text-xs text-gray-500 text-center mb-3">Or enter manual key: <span className="font-mono font-bold text-gray-700">JBSWY3DPEHPK3PXP</span></p>
                  
                  <Field label="Verification Code" required>
                    <input
                      type="text"
                      maxLength={6}
                      value={tfaVerificationCode}
                      onChange={(e) => setTfaVerificationCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="000 000"
                      className={`${inputClass} text-center tracking-widest font-bold text-lg`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          verifyTfaCode();
                        }
                      }}
                    />
                  </Field>
                  {tfaError && <p className="text-xs text-red-500 mt-1 text-center font-medium">{tfaError}</p>}
                </div>
                
                <div className="flex gap-2 justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => setIs2faSetupStep(false)}
                    className="px-3 py-1.5 border border-gray-200 text-xs font-semibold text-gray-600 rounded-lg hover:bg-gray-100 transition"
                  >
                    Cancel Setup
                  </button>
                  <button
                    type="button"
                    onClick={verifyTfaCode}
                    className="px-4 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition"
                  >
                    Verify & Activate
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div className="flex items-center justify-between p-4 border border-gray-100 bg-gray-50/50 rounded-xl">
              <div className="text-left flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${isEnabled ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"}`}>
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">Two-Factor Authentication (2FA)</p>
                  <p className="text-xs text-gray-400">{isEnabled ? "Active protection on your account" : "Adds an extra layer of security"}</p>
                </div>
              </div>
              <div>
                {isEnabled ? (
                  <button
                    type="button"
                    onClick={() => handleFieldChange(key, false)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-100 hover:bg-red-100/50 rounded-lg transition"
                  >
                    Deactivate
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIs2faSetupStep(true)}
                    className="px-4 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-100/50 rounded-lg transition"
                  >
                    Set Up 2FA
                  </button>
                )}
              </div>
            </div>
          );
        }

        if (key === "restore_trigger") {
          return (
            <div className="space-y-4">
              <div className="border border-dashed border-gray-200 rounded-xl p-5 text-center bg-gray-50/30">
                <input
                  type="file"
                  id="backup-restore-file"
                  className="hidden"
                  accept=".json,.zip"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFieldChange(key, file.name);
                  }}
                />
                {value ? (
                  <div className="flex items-center justify-between p-2 border border-gray-200 bg-white rounded-lg">
                    <span className="text-sm font-mono text-gray-600 truncate select-all">{value}</span>
                    <button
                      type="button"
                      onClick={() => handleFieldChange(key, "")}
                      className="p-1 text-gray-400 hover:text-red-500 transition shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <label htmlFor="backup-restore-file" className="cursor-pointer">
                    <Upload className="mx-auto h-7 w-7 text-gray-400 mb-1" />
                    <p className="text-xs font-semibold text-gray-700">Choose a backup file (.json, .zip)</p>
                  </label>
                )}
              </div>
              <button
                type="button"
                disabled={!value}
                onClick={() => {
                  if (confirm(`Are you sure you want to restore data from backup file "${value}"? This will overwrite existing data.`)) {
                    alert("System data restored successfully!");
                    handleFieldChange(key, "");
                  }
                }}
                className={`w-full py-2.5 rounded-lg text-sm font-semibold transition ${
                  value 
                    ? "bg-orange-600 hover:bg-orange-700 text-white cursor-pointer" 
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                Restore System Data
              </button>
            </div>
          );
        }

        if (key === "export_trigger") {
          const exportFormat = formState["export_format"] || "CSV";
          const triggerExport = () => {
            const dataStr = JSON.stringify({ version: "1.0.0", exportDate: new Date().toISOString() });
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            const exportFileDefaultName = `freightflow-export-${new Date().toISOString().split("T")[0]}.${exportFormat.toLowerCase()}`;
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
          };
          return (
            <div className="space-y-4">
              <Field label="Export Format">
                <Select
                  value={exportFormat}
                  onChange={(val) => handleFieldChange("export_format", val)}
                  placeholder="Select Format"
                  options={["CSV", "JSON"]}
                />
              </Field>
              <button
                type="button"
                onClick={triggerExport}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition flex items-center justify-center gap-1.5"
              >
                <Copy className="h-4 w-4" /> Download Export Bundle
              </button>
            </div>
          );
        }

        return null;

      default:
        return null;
    }
  };

  const footer = (
    <>
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
      >
        Cancel
      </button>
      <button
        type="submit"
        form="setting-update-form"
        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition"
      >
        Save Changes
      </button>
    </>
  );

  // Grouped SMTP Host and Port custom container rendering
  const hasSmtpFields = fields.some(f => f.key === "smtp_host" || f.key === "smtp_port");

  return (
    <ModalShell 
      isOpen={isOpen} 
      onClose={onCancel} 
      title={title} 
      footer={footer}
      size="max-w-xl"
    >
      <form id="setting-update-form" onSubmit={handleSubmit} className="space-y-5 text-left">
        {description && (
          <p className="text-sm text-gray-500 mb-2 border-b border-gray-50 pb-3">{description}</p>
        )}
        
        {/* Render normal fields */}
        {fields.map((field) => {
          // Skip SMTP fields as we render them as a group below
          if (field.key === "smtp_host" || field.key === "smtp_port") return null;
          // Skip export_format as it's rendered inline with export_trigger
          if (field.key === "export_format") return null;

          return (
            <Field key={field.key} label={field.label}>
              {renderFieldInput(field)}
              {field.helpText && (
                <p className="text-[11px] text-gray-400 mt-1">{field.helpText}</p>
              )}
            </Field>
          );
        })}

        {/* Grouped SMTP rendering */}
        {hasSmtpFields && (
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 text-left">
              <Field label="SMTP Host">
                <input
                  type="text"
                  value={formState["smtp_host"] || ""}
                  onChange={(e) => handleFieldChange("smtp_host", e.target.value)}
                  placeholder="smtp.example.com"
                  className={inputClass}
                />
              </Field>
            </div>
            <div className="text-left">
              <Field label="SMTP Port">
                <input
                  type="number"
                  value={formState["smtp_port"] || ""}
                  onChange={(e) => handleFieldChange("smtp_port", Number(e.target.value))}
                  placeholder="587"
                  className={inputClass}
                />
              </Field>
            </div>
          </div>
        )}
      </form>
    </ModalShell>
  );
}
