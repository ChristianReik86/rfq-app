import React, { useMemo, useRef, useState } from "react";

/**
 * RFQ App – monochrom/techy (schwarz/weiß)
 * Kompakte, build-sichere Version (alle Tags sauber geschlossen).
 */

const ACCEPTED_FILES = [".step",".stp",".iges",".igs",".dxf",".pdf",".png",".jpg",".jpeg"];

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
  lineItems: [{ ...DEFAULT_LINE_ITEM }],
};

export default function ManufacturingRFQApp() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef(null);

  const totalQty = useMemo(
    () => form.lineItems.reduce((s, li) => s + Number(li.qty || 0), 0),
    [form.lineItems]
  );

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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Ungültige E-Mail.";
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
    return files.map((f) => ({ name: f.name, size: f.size, type: f.type }));
  }

  function buildPayload() {
    return {
      meta: { createdAt: new Date().toISOString(), app: "ManufacturingRFQApp", version: 1 },
      ...form,
      files: toSerializableFiles(form.files),
    };
  }

  async function submitRFQ(payload) {
    // TODO: API Call
    return new Promise((resolve) => setTimeout(resolve, 300));
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
    a.download = `rfq_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function printSummary() {
    window.print();
  }

  return (
    <div className="app">
      <div className="grid-overlay" aria-hidden="true"></div>

      <header className="app-header">
        <div className="container header-row">
          <div className="brand">
            <Logo />
            <h1 className="h1">Fertigungs­teilanfrage</h1>
          </div>
          <div className="actions">
            <button onClick={exportJSON} className="btn-secondary">Export JSON</button>
            <button onClick={printSummary} className="btn-primary">Print Summary</button>
          </div>
        </div>
      </header>

      <main className="container main">
        <form onSubmit={onSubmit} className="grid grid-3">
          {/* Kundendaten */}
          <section className="card span-2">
            <h2 className="card-title">Kundendaten</h2>
            <div className="grid grid-2 gap">
              <Field label="Firma" error={errors.company}>
                <input className="input" value={form.company} onChange={(e) => updateField("company", e.target.value)} placeholder="z. B. Muster GmbH" />
              </Field>
              <Field label="Ansprechpartner" error={errors.contact}>
                <input className="input" value={form.contact} onChange={(e) => updateField("contact", e.target.value)} placeholder="Vor- und Nachname" />
              </Field>
              <Field label="E-Mail" error={errors.email}>
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
                  {["Best Available","Express","Economy","Abholung"].map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </Field>
              <label className="checkbox">
                <input type="checkbox" checked={form.NDA} onChange={(e) => updateField("NDA", e.target.checked)} />
                <span>NDA erforderlich</span>
              </label>
            </div>
          </section>

          {/* Dateien */}
          <section className="card tall">
            <h2 className="card-title">Dateien</h2>
            <FileDropzone onFiles={onFilesSelected} accept={ACCEPTED_FILES.join(",")} />
            <div className="files">
              {form.files.length === 0 ? (
                <p className="muted">Bitte CAD/Zeichnungen hochladen (STEP/STP/IGES/DXF/PDF/Bilder).</p>
              ) : (
                form.files.map((f, idx) => (
                  <div key={idx} className="file-row">
                    <div className="file-info">
                      <p className="file-name">{f.name}</p>
                      <p className="meta">{(f.size/1024).toFixed(1)} KB · {f.type || "Datei"}</p>
                    </div>
                    <button type="button" className="btn-ghost" onClick={() => removeFile(idx)}>Entfernen</button>
                  </div>
                ))
              )}
            </div>
            <div className="actions-row">
              <button type="button" className="btn-secondary" onClick={() => fileInputRef.current && fileInputRef.current.click()}>Dateien wählen</button>
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

          {/* Positionen */}
          <section className="card span-2">
            <div className="between">
              <h2 className="card-title">
                Positionen <span className="hint">(Gesamtmenge: {totalQty})</span>
              </h2>
              <button type="button" className="btn-primary" onClick={addLineItem}>Position hinzufügen</button>
            </div>

            <div className="space-y">
              {errors.lineItems && <p className="error">{errors.lineItems}</p>}

              {form.lineItems.map((li, i) => (
                <div key={i} className="card-ghost">
                  <div className="between">
                    <h3 className="h3">Pos. {i + 1}</h3>
                    {form.lineItems.length > 1 && (
                      <button type="button" className="btn-ghost" onClick={() => removeLineItem(i)}>Entfernen</button>
                    )}
                  </div>

                  <div className="grid grid-3 gap">
                    <Field label="Benennung" error={errors[`li_${i}_partName`]}>
                      <input
                        className="input"
                        value={li.partName}
                        onChange={(e) => updateLineItem(i, { partName: e.target.value })}
                        placeholder="z. B. Wellengehäuse"
                      />
                    </Field>

                    <Field label="Material">
                      <input
                        className="input"
                        value={li.material}
                        onChange={(e) => updateLineItem(i, { material: e.target.value })}
                        placeholder="z. B. 1.4301, AlSi10Mg…"
                      />
                    </Field>

                    <Field label="Menge" error={errors[`li_${i}_qty`]}>
                      <input
                        className="input"
                        type="number"
                        min={1}
                        value={li.qty}
                        onChange={(e) => updateLineItem(i, { qty: Number(e.target.value) })}
                      />
                    </Field>

                    <Field label="Toleranz">
                      <input
                        className="input"
                        value={li.tolerance}
                        onChange={(e) => updateLineItem(i, { tolerance: e.target.value })}
                        placeholder="z. B. IT7 / ±0,02 mm"
                      />
                    </Field>

                    <Field label="Oberfläche">
                      <input
                        className="input"
                        value={li.surface}
                        onChange={(e) => updateLineItem(i, { surface: e.target.value })}
                        placeholder="z. B. Eloxal, Verzinken, Ra ≤ 1,6 μm"
                      />
                    </Field>

                    <Field label="Wärmebehandlung">
                      <input
                        className="input"
                        value={li.heatTreatment}
                        onChange={(e) => updateLineItem(i, { heatTreatment: e.target.value })}
                        placeholder="z. B. Härten, Anlassen"
                      />
                    </Field>
                  </div>

                  <Field label="Anmerkungen">
                    <textarea
                      className="input textarea"
                      value={li.notes}
                      onChange={(e) => updateLineItem(i, { notes: e.target.value })}
                      placeholder="Besondere Hinweise, Maßskizzen, Referenzen…"
                    />
                  </Field>
                </div>
              ))}
            </div>
          </section>

          {/* Vorschau + Submit */}
          <section className="card span-3">
            <h2 className="card-title">Vorschau (JSON)</h2>
            <pre className="code">{JSON.stringify(buildPayload(), null, 2)}</pre>

            <div className="stack">
              <p className="muted">
                Hinweis: Dies ist eine Demo – beim Absenden würdest du die Daten an deine API übertragen.
              </p>
              <div className="actions">
                <button type="submit" className="btn-primary">Anfrage absenden</button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => { setForm(EMPTY_FORM); setErrors({}); setSubmitted(false); }}
                >
                  Zurücksetzen
                </button>
              </div>
            </div>

            {submitted ? <p className="success">✓ Anfrage vorbereitet. (Ersetze submitRFQ() mit echtem Backend-Call.)</p> : null}
          </section>
        </form>
      </main>

      <Footer />

      {/* Kompakter, sicherer CSS-Block */}
      <style>{`
        :root{
          --bg: #0b0b0c; --panel: #111214; --panel2:#0f1012;
          --border:#26282c; --border2:#2f3237; --text:#e6e7eb; --muted:#a6a8ad;
          --danger:#ff5c5c;
        }
        html,body,#root{height:100%;}
        .app{min-height:100vh;background:var(--bg);color:var(--text);}
        .grid-overlay{position:fixed;inset:0;pointer-events:none;background-image:
          linear-gradient(to right, rgba(255,255,255,.03) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255,255,255,.03) 1px, transparent 1px);
          background-size:24px 24px,24px 24px;}
        .app-header{position:sticky;top:0;z-index:30;background:rgba(11,11,12,.75);
          backdrop-filter:blur(8px);border-bottom:1px solid var(--border);}
        .container{max-width:1120px;margin:0 auto;padding:0 16px;}
        .header-row{display:flex;align-items:center;justify-content:space-between;height:60px;}
        .brand{display:flex;align-items:center;gap:10px;}
        .h1{font-size:18px;font-weight:700;letter-spacing:.02em;}
        .main{padding:16px;}
        .grid{display:grid;gap:14px;}
        .grid-2{grid-template-columns:1fr;}
        .grid-3{grid-template-columns:1fr;}
        .span-2{grid-column:span 1;}
        .span-3{grid-column:span 1;}
        .tall{align-self:start;}
        .gap{gap:14px;}
        @media(min-width:1024px){
          .grid-2{grid-template-columns:repeat(2,1fr);}
          .grid-3{grid-template-columns:repeat(3,1fr);}
          .span-2{grid-column:span 2;}
          .span-3{grid-column:span 3;}
          .tall{grid-row:span 2;}
        }
        .card{background:linear-gradient(180deg,var(--panel),var(--panel2));border:1px solid var(--border);
          border-radius:14px;padding:16px;box-shadow:0 0 0 1px rgba(255,255,255,.02) inset, 0 8px 24px rgba(0,0,0,.45);}
        .card-ghost{background:transparent;border:1px dashed var(--border2);border-radius:14px;padding:12px;}
        .card-title{font-size:14px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;}
        .hint{font-weight:400;color:var(--muted);margin-left:8px;font-size:12px;}
        .input{width:100%;background:#0a0b0c;color:var(--text);border:1px solid var(--border);
          border-radius:12px;padding:10px 12px;outline:none;}
        .input:focus{border-color:#fff;box-shadow:0 0 0 3px rgba(255,255,255,.12);}
        .textarea{min-height:92px;}
        .btn-primary,.btn-secondary,.btn-ghost{border-radius:12px;padding:10px 14px;font-weight:700;
          border:1px solid var(--border2);background:#0b0b0c;color:var(--text);}
        .btn-primary:hover,.btn-secondary:hover,.btn-ghost:hover{background:#0e0f11;}
        .muted{color:var(--muted);font-size:13px;}
        .success{color:#9be29b;font-size:13px;margin-top:6px;}
        .error{color:var(--danger);font-size:13px;}
        .code{background:#000;color:#e8e8e8;font-size:12px;border-radius:12px;border:1px solid var(--border);
          padding:12px;max-height:320px;overflow:auto;}
        .files{margin-top:12px;display:flex;flex-direction:column;gap:8px;}
        .file-row{display:flex;align-items:center;justify-content:space-between;border:1px solid var(--border);
          border-radius:12px;padding:10px 12px;background:#0b0c0e;}
        .file-info{min-width:0;margin-right:8px;}
        .file-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600;}
        .meta{font-size:12px;color:var(--muted);}
        .actions-row{display:flex;gap:8px;margin-top:10px;}
        .between{display:flex;align-items:center;justify-content:space-between;}
        .space-y > * + *{margin-top:12px;}
        .stack{display:flex;flex-direction:column;gap:12px;align-items:flex-start;justify-content:space-between;}
        @media(min-width:640px){.stack{flex-direction:row;align-items:center;}}
        .actions{display:flex;gap:8px;}
        .checkbox{display:flex;align-items:center;gap:10px;}
        .dropzone{border:2px dashed var(--border2);border-radius:16px;padding:24px;text-align:center;background:#0e0f11;}
        .dropzone.over{background:#121316;border-color:#fff;}
        @media print {
          .btn-primary,.btn-secondary,.btn-ghost,header,.input,select,textarea{display:none !important;}
          pre{white-space:pre-wrap;}
          .grid-overlay{display:none;}
        }
        .hidden{display:none;}
      `}</style>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="field">
      <span className="muted" style={{ display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 12 }}>
        {label}
      </span>
      {children}
      {error ? <span className="error" style={{ display: "block", marginTop: 6 }}>{error}</span> : null}
    </label>
  );
}

function FileDropzone({ onFiles, accept }) {
  const [isOver, setIsOver] = useState(false);

  function onDragOver(e) { e.preventDefault(); setIsOver(true); }
  function onDragLeave(e) { e.preventDefault(); setIsOver(false); }
  function onDrop(e) {
    e.preventDefault(); setIsOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFiles(e.dataTransfer.files);
    }
  }

  return (
    <div
      className={`dropzone${isOver ? " over" : ""}`}
      role="button"
      tabIndex={0}
      aria-label="Dateien hierher ziehen oder klicken"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          const input = e.currentTarget.querySelector('input[type="file"]');
          if (input) input.click();
        }
      }}
    >
      <p style={{ fontWeight: 600, marginBottom: 4 }}>Dateien hierher ziehen</p>
      <p className="muted" style={{ marginBottom: 10 }}>oder klicken, um Dateien auszuwählen</p>
      <input
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={(e) => e.target.files && onFiles(e.target.files)}
      />
      <small className="muted">Erlaubte Endungen: {accept}</small>
    </div>
  );
}

function Logo() {
  return (
    <div aria-label="RFQ Logo" style={{
      width: 36, height: 36, borderRadius: 10, background: "#0b0b0c",
      border: "1px solid #2f3237", display: "grid", placeItems: "center",
      color: "#ffffff", fontWeight: 900, letterSpacing: ".06em",
      boxShadow: "0 0 0 1px rgba(255,255,255,.03) inset"
    }}>
      RFQ
    </div>
  );
}

function Footer() {
  return (
    <footer className="container" style={{ padding: "16px 16px 24px", textAlign: "center" }}>
      <hr style={{ borderColor: "var(--border)", opacity: 0.8, margin: "16px 0" }} />
      <p className="muted">
        © {new Date().getFullYear()} Muster GmbH <code>/api/rfq</code> für den Live-Betrieb.
      </p>
    </footer>
  );
}
