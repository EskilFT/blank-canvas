import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Plus, Mail, Phone, Pencil, Trash2, UserPlus } from "lucide-react";

export const Route = createFileRoute("/ansatte/")({
  component: AnsattePage,
});

type Employee = {
  id: string;
  name: string;
  position: string;
  employment_type: string;
  hours_per_week: number;
  email?: string;
  phone?: string;
  color?: string;
};

function AnsattePage() {
  const qc = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data } = await supabase.from("employees").select("*").order("name");
      return data ?? [];
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("employees").delete().eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employees"] }),
  });

  return (
    <Layout>
      <div className="p-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: "oklch(0.16 0.01 60)" }}>Ansatte</h1>
            <p className="text-sm" style={{ color: "oklch(0.48 0.01 60)" }}>{employees.length} ansatte totalt</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors"
              style={{ borderColor: "oklch(0.9 0.008 75)", color: "oklch(0.16 0.01 60)", background: "white" }}
            >
              <UserPlus className="w-4 h-4" /> Inviter
            </button>
            <button
              onClick={() => { setEditing(null); setShowDialog(true); }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white"
              style={{ background: "oklch(0.16 0.01 60)" }}
            >
              <Plus className="w-4 h-4" /> Legg til ansatt
            </button>
          </div>
        </div>

        {employees.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center" style={{ borderColor: "oklch(0.9 0.008 75)" }}>
            <p className="font-medium mb-2" style={{ color: "oklch(0.16 0.01 60)" }}>Ingen ansatte ennå</p>
            <p className="text-sm mb-6" style={{ color: "oklch(0.48 0.01 60)" }}>Legg til ansatte for å begynne med vaktplanlegging.</p>
            <button
              onClick={() => { setEditing(null); setShowDialog(true); }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white"
              style={{ background: "oklch(0.16 0.01 60)" }}
            >
              <Plus className="w-4 h-4" /> Legg til første ansatt
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "oklch(0.9 0.008 75)" }}>
            {employees.map((emp, i) => (
              <div
                key={emp.id}
                className="flex items-center gap-4 px-5 py-4"
                style={{ borderBottom: i < employees.length - 1 ? "1px solid oklch(0.95 0.008 75)" : "none" }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
                  style={{ background: emp.color ?? "oklch(0.16 0.01 60)" }}
                >
                  {emp.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm" style={{ color: "oklch(0.16 0.01 60)" }}>{emp.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "oklch(0.48 0.01 60)" }}>
                    {emp.position} · {emp.hours_per_week}t/uke
                  </p>
                </div>
                <div className="flex items-center gap-4 mr-4">
                  {emp.email && (
                    <a href={`mailto:${emp.email}`} className="flex items-center gap-1.5 text-xs" style={{ color: "oklch(0.48 0.01 60)" }}>
                      <Mail className="w-3.5 h-3.5" /> {emp.email}
                    </a>
                  )}
                  {emp.phone && (
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: "oklch(0.48 0.01 60)" }}>
                      <Phone className="w-3.5 h-3.5" /> {emp.phone}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setEditing(emp); setShowDialog(true); }}
                    className="p-1.5 rounded-md"
                    style={{ color: "oklch(0.65 0.01 60)" }}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => { if (confirm(`Fjern ${emp.name}?`)) deleteMut.mutate(emp.id); }}
                    className="p-1.5 rounded-md"
                    style={{ color: "oklch(0.65 0.01 60)" }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showDialog && (
        <EmployeeDialog
          employee={editing}
          onClose={() => setShowDialog(false)}
          onSave={() => { setShowDialog(false); qc.invalidateQueries({ queryKey: ["employees"] }); }}
        />
      )}
      {showInvite && (
        <InviteDialog onClose={() => setShowInvite(false)} employees={employees} />
      )}
    </Layout>
  );
}

function EmployeeDialog({ employee, onClose, onSave }: { employee: Employee | null; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    name: employee?.name ?? "",
    position: employee?.position ?? "",
    employment_type: employee?.employment_type ?? "full_time",
    hours_per_week: employee?.hours_per_week ?? 37.5,
    email: employee?.email ?? "",
    phone: employee?.phone ?? "",
    color: employee?.color ?? "#1C1917",
  });
  const [loading, setLoading] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    if (employee) {
      await supabase.from("employees").update(form).eq("id", employee.id);
    } else {
      await supabase.from("employees").insert(form);
    }
    setLoading(false);
    onSave();
  }

  const inputCls = "w-full bg-white border rounded-lg px-3.5 py-2.5 text-sm outline-none";
  const inputStyle = { borderColor: "oklch(0.9 0.008 75)", color: "oklch(0.16 0.01 60)" };
  const focusBorder = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => (e.target.style.borderColor = "oklch(0.65 0.18 42)");
  const blurBorder = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => (e.target.style.borderColor = "oklch(0.9 0.008 75)");

  return (
    <Modal title={employee ? "Rediger ansatt" : "Legg til ansatt"} onClose={onClose}>
      <form onSubmit={handleSave} className="space-y-4">
        <Field label="Navn *">
          <input required className={inputCls} style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ola Nordmann" onFocus={focusBorder} onBlur={blurBorder} />
        </Field>
        <Field label="Stilling *">
          <input required className={inputCls} style={inputStyle} value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} placeholder="Butikkmedarbeider" onFocus={focusBorder} onBlur={blurBorder} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Ansettelsestype">
            <select className={inputCls} style={inputStyle} value={form.employment_type} onChange={e => setForm(f => ({ ...f, employment_type: e.target.value }))} onFocus={focusBorder} onBlur={blurBorder}>
              <option value="full_time">Heltid</option>
              <option value="part_time">Deltid</option>
            </select>
          </Field>
          <Field label="Timer/uke">
            <input type="number" step="0.5" min="1" max="40" className={inputCls} style={inputStyle} value={form.hours_per_week} onChange={e => setForm(f => ({ ...f, hours_per_week: parseFloat(e.target.value) }))} onFocus={focusBorder} onBlur={blurBorder} />
          </Field>
        </div>
        <Field label="E-post">
          <input type="email" className={inputCls} style={inputStyle} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="ola@bedrift.no" onFocus={focusBorder} onBlur={blurBorder} />
        </Field>
        <Field label="Telefon">
          <input type="tel" className={inputCls} style={inputStyle} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="900 00 000" onFocus={focusBorder} onBlur={blurBorder} />
        </Field>
        <Field label="Farge">
          <div className="flex items-center gap-3">
            <input type="color" className="w-10 h-10 rounded-lg border cursor-pointer p-0.5" style={{ borderColor: "oklch(0.9 0.008 75)" }} value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} />
            <span className="text-sm" style={{ color: "oklch(0.48 0.01 60)" }}>Velg farge for ansatt</span>
          </div>
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border" style={{ borderColor: "oklch(0.9 0.008 75)", color: "oklch(0.48 0.01 60)" }}>Avbryt</button>
          <button type="submit" disabled={loading} className="px-4 py-2 text-sm rounded-lg font-medium text-white disabled:opacity-50" style={{ background: "oklch(0.16 0.01 60)" }}>
            {loading ? "Lagrer..." : employee ? "Lagre endringer" : "Legg til"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function InviteDialog({ onClose, employees }: { onClose: () => void; employees: Employee[] }) {
  const [email, setEmail] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.functions.invoke("invite-employee", { body: { email, employee_id: employeeId || null } });
    if (error) setError("Kunne ikke sende invitasjon. Prøv igjen.");
    else setDone(true);
    setLoading(false);
  }

  return (
    <Modal title="Inviter ansatt" onClose={onClose}>
      {done ? (
        <div className="text-center py-4">
          <p className="font-medium mb-1" style={{ color: "oklch(0.16 0.01 60)" }}>Invitasjon sendt!</p>
          <p className="text-sm mb-4" style={{ color: "oklch(0.48 0.01 60)" }}>En invitasjons-e-post er sendt til {email}.</p>
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg text-white" style={{ background: "oklch(0.16 0.01 60)" }}>Lukk</button>
        </div>
      ) : (
        <form onSubmit={handleInvite} className="space-y-4">
          <Field label="E-postadresse *">
            <input required type="email" className="w-full bg-white border rounded-lg px-3.5 py-2.5 text-sm outline-none" style={{ borderColor: "oklch(0.9 0.008 75)", color: "oklch(0.16 0.01 60)" }} value={email} onChange={e => setEmail(e.target.value)} placeholder="ansatt@bedrift.no" onFocus={e => (e.target.style.borderColor = "oklch(0.65 0.18 42)")} onBlur={e => (e.target.style.borderColor = "oklch(0.9 0.008 75)")} />
          </Field>
          <Field label="Koble til ansatt (valgfri)">
            <select className="w-full bg-white border rounded-lg px-3.5 py-2.5 text-sm outline-none" style={{ borderColor: "oklch(0.9 0.008 75)", color: "oklch(0.16 0.01 60)" }} value={employeeId} onChange={e => setEmployeeId(e.target.value)}>
              <option value="">Ingen kobling</option>
              {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
            </select>
          </Field>
          {error && <p className="text-sm px-3 py-2 bg-red-50 text-red-600 rounded-lg">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border" style={{ borderColor: "oklch(0.9 0.008 75)", color: "oklch(0.48 0.01 60)" }}>Avbryt</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm rounded-lg font-medium text-white disabled:opacity-50" style={{ background: "oklch(0.16 0.01 60)" }}>
              {loading ? "Sender..." : "Send invitasjon"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.3)" }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold" style={{ color: "oklch(0.16 0.01 60)" }}>{title}</h2>
          <button onClick={onClose} className="text-sm p-1" style={{ color: "oklch(0.65 0.01 60)" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: "oklch(0.16 0.01 60)" }}>{label}</label>
      {children}
    </div>
  );
}
