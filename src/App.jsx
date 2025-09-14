import React, { useMemo, useRef, useState } from "react";

/**
 * Responsive React app for a manufacturing part RFQ (Fertigungs­teilanfrage).
 * - Pure React (no external UI libs)
 * - Mobile‑first responsive layout
 * - Drag & drop file upload (STEP/STP/IGES/DXF/PDF/PNG/JPG)
 * - Client-side validation with inline errors
 * - Dynamic line items (multiple positions)
 * - Instant JSON preview of the payload
 * - "Export JSON" + "Print Summary" actions
 *
 * To use:
 * 1) Drop this file into your React project (e.g., src/App.jsx) and ensure it's the default export.
 * 2) Start your dev server (e.g., Vite or CRA).
 * 3) Hook up submitRFQ(payload) to your backend/API.
 */

const ACCEPTED_FILES = [
  ".step",
  ".stp",
  ".iges",
  ".igs",
  ".dxf",
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
];

const DEFAULT_LINE_ITEM = {
  partName: "",
  material: "",
  qty: 1,
  tolerance: "",
  surface: "",
  heatTreatment: "",
  notes: "",
};

const EMPTY_FORM = {
  company: "",
  contact: "",
  email: "",
  phone: "",
  address: "",
  incoterms: "DAP",
  deliveryDate: "",
  currency: "EUR",
  NDA: false,
  shippingPreference: "Best Available",
  files: [],
  lineItems: [ { ...DEFAULT_LINE_ITEM } ],
};

export default function ManufacturingRFQApp() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef(null);

  const totalQty = useMemo(() => form.lineItems.reduce((s, li) => s + Number(li.qty || 0), 0), [form.lineItems]);

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function updateLineItem(index, patch) {
    setForm((f) => ({
      ...f,
      lineItems: f.lineItems.map((li, i) => (i === index ? { ...li, ...patch } : li)),
    }));
  }

  function addLineItem() {
    setForm((f) => ({ ...f, lineItems: [...f.lineItems, { ...DEFAULT_LINE_ITEM }] }));
  }

  function removeLineItem(index) {
    setForm((f) => ({ ...f, lineItems: f.lineItems.filter((_, i) => i !== index) }));
  }

  function onFilesSelected(files) {
    const valid = Array.from(files).filter((f) =>
      ACCEPTED_FILES.some((ext) => f.name.toLowerCase().endsWith(ext))
    );
    const rejected = Array.from(files).filter((f) => !valid.includes(f));

    if (rejected.length) {
      alert(
        `Einige Dateien wurden wegen nicht unterstützter Endungen abgelehnt (erlaubt: ${ACCEPTED_FILES.join(", ")}).`
      );
    }

    setForm((f) => ({ ...f, files: [...f.files, ...valid] }));
  }

  function removeFile(idx) {
    setForm((f) => ({ ...f, files: f.files.filter((_, i) => i !== idx) }));
  }

  function validate() {
    const e = {};
    if (!form.company.trim()) e.company = "Bitte Firmenname angeben.";
    if (!form.contact.trim()) e.contact = "Bitte Ansprechpartner angeben.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Ungültige E‑Mail.";
    if (!form.deliveryDate) e.deliveryDate = "Bitte Liefertermin wählen.";
    if (!form.lineItems.length) e.lineItems = "Mindestens eine Position erforderlich.";
    form.lineItems.forEach((li, i) => {
      if (!li.partName.trim()) e[`li_${i}_partName`] = "Benennung erforderlich.";
      if (!li.qty || Number(li.qty) <= 0) e[`li_${i}_qty`] = "Menge > 0 erforderlich.";
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function toSerializableFiles(files) {
    // For preview only; do not transmit file contents here.
    return files.map((f) => ({ name: f.name, size: f.size, type: f.type }));
  }

  function buildPayload() {
    return {
      meta: {
        createdAt: new Date().toISOString(),
        app: "ManufacturingRFQApp",
        version: 1,
      },
      ...form,
      files: toSerializableFiles(form.files),
    };
  }

  async function submitRFQ(payload) {
    // TODO: Replace with your API call. Example:
    // await fetch("/api/rfq", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    return new Promise((resolve) => setTimeout(resolve, 600));
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    const payload = buildPayload();
    try {
      await submitRFQ(payload);
      setSubmitted(true);
      alert("Anfrage erfolgreich vorbereitet (Demo). Hier könntest du jetzt an deine API senden.");
    } catch (err) {
      console.error(err);
      alert("Senden fehlgeschlagen. Siehe Konsole für Details.");
    }
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(buildPayload(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rfq_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function printSummary() {
    window.print();
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo />
            <h1 className="text-lg font-semibold">Fertigungs­teilanfrage</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportJSON} className="btn-secondary">Export JSON</button>
            <button onClick={printSummary} className="btn-primary">Print Summary</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4">
        <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-4 print:grid-cols-1">
          {/* Left Column: Customer */}
          <section className="card lg:col-span-2">
            <h2 className="card-title">Kundendaten</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Firma" error={errors.company}>
                <input className="input" value={form.company} onChange={(e) => updateField("company", e.target.value)} placeholder="z. B. thinver GmbH" />
              </Field>
              <Field label="Ansprechpartner" error={errors.contact}>
                <input className="input" value={form.contact} onChange={(e) => updateField("contact", e.target.value)} placeholder="Vor- und Nachname" />
              </Field>
              <Field label="E‑Mail" error={errors.email}>
                <input className="input" type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} placeholder="name@firma.de" />
              </Field>
              <Field label="Telefon">
                <input className="input" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="+49 …" />
              </Field>
              <Field label="Adresse">
                <input className="input" value={form.address} onChange={(e) => updateField("address", e.target.value)} placeholder="Straße, PLZ Ort, Land" />
              </Field>
              <Field label="Incoterms">
                <select className="input" value={form.incoterms} onChange={(e) => updateField("incoterms", e.target.value)}>
                  {["EXW","FCA","CPT","CIP","DAP","DDP"].map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </Field>
              <Field label="Gewünschter Liefertermin" error={errors.deliveryDate}>
                <input className="input" type="date" value={form.deliveryDate} onChange={(e) => updateField("deliveryDate", e.target.value)} />
              </Field>
              <Field label="Währung">
                <select className="input" value={form.currency} onChange={(e) => updateField("currency", e.target.value)}>
                  {["EUR","USD","GBP","AED","INR"].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Versandpräferenz">
                <select className="input" value={form.shippingPreference} onChange={(e) => updateField("shippingPreference", e.target.value)}>
                  {["Best Available","Express","Economy","Abholung"]
                    .map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </Field>
              <label className="flex items-center gap-2 mt-2">
                <input type="checkbox" checked={form.NDA} onChange={(e) => updateField("NDA", e.target.checked)} />
                <span>NDA erforderlich</span>
              </label>
            </div>
          </section>

          {/* Right Column: Files */}
          <section className="card lg:row-span-2">
            <h2 className="card-title">Dateien</h2>
            <FileDropzone onFiles={onFilesSelected} accept={ACCEPTED_FILES.join(",")} />

            <div className="mt-3 space-y-2">
              {form.files.length === 0 && (
                <p className="text-sm text-gray-500">Bitte CAD/Zeichnungen hochladen (STEP/STP/IGES/DXF/PDF/Bilder).</p>
              )}
              {form.files.map((f, idx) => (
                <div key={idx} className="flex items-center justify-between rounded border p-2 bg-white">
                  <div className="min-w-0 mr-2">
                    <p className="truncate font-medium">{f.name}</p>
                    <p className="text-xs text-gray-500">{(f.size/1024).toFixed(1)} KB · {f.type || "Datei"}</p>
                  </div>
                  <button type="button" className="btn-ghost" onClick={() => removeFile(idx)}>Entfernen</button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-3">
              <button type="button" className="btn-secondary" onClick={() => fileInputRef.current?.click()}>Dateien wählen</button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                accept={ACCEPTED_FILES.join(",")}
                onChange={(e) => e.target.files && onFilesSelected(e.target.files)}
              />
            </div>
          </section>

          {/* Line Items */}
          <section className="card lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="card-title">Positionen <span className="text-sm font-normal text-gray-500">(Gesamtmenge: {totalQty})</span></h2>
              <button type="button" className="btn-primary" onClick={addLineItem}>Position hinzufügen</button>
            </div>

            <div className="space-y-4 mt-2">
              {errors.lineItems && <p className="error">{errors.lineItems}</p>}
              {form.lineItems.map((li, i) => (
                <div key={i} className="rounded-lg border p-3 bg-white">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold">Pos. {i + 1}</h3>
                    {form.lineItems.length > 1 && (
                      <button type="button" className="btn-ghost" onClick={() => removeLineItem(i)}>Entfernen</button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                    <Field label="Benennung" error={errors[`li_${i}_partName`]}>
                      <input className="input" value={li.partName} onChange={(e) => updateLineItem(i, { partName: e.target.value })} placeholder="z. B. Wellengehäuse" />
                    </Field>
                    <Field label="Material">
                      <input className="input" value={li.material} onChange={(e) => updateLineItem(i, { material: e.target.value })} placeholder="z. B. 1.4301, AlSi10Mg…" />
                    </Field>
                    <Field label="Menge" error={errors[`li_${i}_qty`]}>
                      <input className="input" type="number" min={1} value={li.qty} onChange={(e) => updateLineItem(i, { qty: Number(e.target.value) })} />
                    </Field>
                    <Field label="Toleranz">
                      <input className="input" value={li.tolerance} onChange={(e) => updateLineItem(i, { tolerance: e.target.value })} placeholder="z. B. IT7 / ±0,02 mm" />
                    </Field>
                    <Field label="Oberfläche">
                      <input className="input" value={li.surface} onChange={(e) => updateLineItem(i, { surface: e.target.value })} placeholder="z. B. Eloxal, Verzinken, Ra ≤ 1,6 μm" />
                    </Field>
                    <Field label="Wärmebehandlung">
                      <input className="input" value={li.heatTreatment} onChange={(e) => updateLineItem(i, { heatTreatment: e.target.value })} placeholder="z. B. Härten, Anlassen" />
                    </Field>
                  </div>
                  <Field label="Anmerkungen" className="mt-2">
                    <textarea className="input min-h-[80px]" value={li.notes} onChange={(e) => updateLineItem(i, { notes: e.target.value })} placeholder="Besondere Hinweise, Maßskizzen, Referenzen…" />
                  </Field>
                </div>
              ))}
            </div>
          </section>

          {/* Preview + Submit */}
          <section className="card lg:col-span-3">
            <h2 className="card-title">Vorschau (JSON)</h2>
            <pre className="bg-gray-900 text-gray-100 text-xs rounded-lg p-3 overflow-auto max-h-72">
{JSON.stringify(buildPayload(), null, 2)}
            </pre>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between mt-3">
              <p className="text-sm text-gray-600">
                Hinweis: Dies ist eine Demo – beim Absenden würdest du die Daten an deine API übertragen.
              </p>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary">Anfrage absenden</button>
                <button type="button" className="btn-secondary" onClick={() => { setForm(EMPTY_FORM); setErrors({}); setSubmitted(false); }}>Zurücksetzen</button>
              </div>
            </div>
            {submitted && (
              <p className="mt-2 text-green-700 text-sm">✓ Anfrage vorbereitet. (Ersetze submitRFQ() mit echtem Backend‑Call.)</p>
            )}
          </section>
        </form>
      </main>

      <Footer />

      {/* Minimal CSS utility classes */}
      <style>{`
        :root { color-scheme: light; }
        .card { background: white; border: 1px solid #e5e7eb; border-radius: 1rem; padding: 1rem; }
        .card-title { font-size: 1rem; font-weight: 600; display: flex; align-items: center; gap: .5rem; }
        .input { width: 100%; border: 1px solid #e5e7eb; border-radius: .75rem; padding: .625rem .75rem; outline: none; }
        .input:focus { border-color: #0ea5e9; box-shadow: 0 0 0 3px rgba(14,165,233,.2); }
        .btn-primary { background: #0ea5e9; color: white; border-radius: .75rem; padding: .6rem .9rem; font-weight: 600; }
        .btn-primary:hover { filter: brightness(0.95); }
        .btn-secondary { background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: .75rem; padding: .6rem .9rem; font-weight: 600; }
        .btn-secondary:hover { filter: brightness(0.98); }
        .btn-ghost { background: transparent; border: 1px solid #e5e7eb; border-radius: .6rem; padding: .35rem .6rem; font-weight: 600; }
        .error { color: #b91c1c; font-size: .85rem; }
        @media print { .btn-primary, .btn-secondary, .btn-ghost, header, .input, select, textarea { display: none !important; } pre { white-space: pre-wrap; } }
      `}</style>
    </div>
  );
}

function Field({ label, error, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-sm font-medium mb-1">{label}</span>
      {children}
      {error && <span className="error mt-1 block">{error}</span>}
    </label>
  );
}

function FileDropzone({ onFiles, accept }) {
  const [isOver, setIsOver] = useState(false);

  function onDragOver(e) { e.preventDefault(); setIsOver(true); }
  function onDragLeave(e) { e.preventDefault(); setIsOver(false); }
  function onDrop(e) {
    e.preventDefault(); setIsOver(false);
    if (e.dataTransfer.files?.length) onFiles(e.dataTransfer.files);
  }

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      role="button"
      tabIndex={0}
      className={`rounded-xl border-2 border-dashed p-6 text-center ${isOver ? "bg-blue-50 border-blue-400" : "bg-gray-50 border-gray-300"}`}
      aria-label="Dateien hierher ziehen oder klicken"
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.querySelector('input[type="file"]').click()}
    >
      <p className="font-medium mb-1">Dateien hierher ziehen</p>
      <p className="text-sm text-gray-600 mb-3">oder klicken, um Dateien auszuwählen</p>
      <input
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={(e) => e.target.files && onFiles(e.target.files)}
      />
      <small className="text-xs text-gray-500">Erlaubte Endungen: {accept}</small>
    </div>
  );
}

function Logo() {
  return (
    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 grid place-items-center text-white font-black">RFQ</div>
  );
}

function Footer() {
  return (
    <footer className="max-w-6xl mx-auto p-4 pb-8 text-center text-sm text-gray-500">
      <hr className="my-4 border-gray-200" />
      <p>
        © {new Date().getFullYear()} RFQ App · Demo. Verbinde <code>/api/rfq</code> für den Live‑Betrieb.
      </p>
    </footer>
  );
}
