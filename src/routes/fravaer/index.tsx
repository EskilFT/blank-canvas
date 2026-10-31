import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Plus, Trash2, Calendar } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/fravaer/")({
  component: FravaerPage,
});

function FravaerPage() {
  const qc = useQueryClient();
  const { isAdmin, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    employee_id: "",
    start_date: "",
    end_date: "",
    reason: "",
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data } = await supabase.from("employees").select("*").order("name");
      return data ?? [];
    },
  });

  const { data: absences = [], isLoading } = useQuery({
    queryKey: ["absences"],
    queryFn: async () => {
      let query = supabase
        .from("absences")
        .select("*, employees(name, color)")
        .order("start_date");

      // Ansatte ser kun eget fravær
      if (!isAdmin && profile?.employee_id) {
        query = query.eq("employee_id", profile.employee_id);
      }

      const { data } = await query;
      return data ?? [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const data = {
        ...form,
        employee_id: isAdmin ? form.employee_id : (profile?.employee_id ?? ""),
      };
      await supabase.from("absences").insert(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["absences"] });
      setOpen(false);
      setForm({ employee_id: isAdmin ? "" : (profile?.employee_id ?? ""), start_date: "", end_date: "", reason: "" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("absences").delete().eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["absences"] }),
  });

  const today = new Date().toISOString().split("T")[0];

  const upcoming = absences.filter((a: any) => a.end_date >= today);
  const past = absences.filter((a: any) => a.end_date < today);

  const inputCls = "w-full bg-white border rounded-lg px-3.5 py-2.5 text-sm outline-none";
  const inputStyle = { borderColor: "oklch(0.9 0.008 75)", color: "oklch(0.16 0.01 60)" };

  return (
    <Layout>
      <div className="p-8 max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: "oklch(0.16 0.01 60)" }}>Fravær</h1>
            <p className="text-sm" style={{ color: "oklch(0.48 0.01 60)" }}>Registrer og administrer fravær</p>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white"
            style={{ background: "oklch(0.16 0.01 60)" }}
          >
            <Plus className="w-4 h-4" /> Registrer fravær
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-14 bg-white rounded-xl animate-pulse" style={{ border: "1px solid oklch(0.9 0.008 75)" }} />)}
          </div>
        ) : (
          <>
            <FrSection title="Kommende og pågående" items={upcoming} onDelete={(id) => deleteMutation.mutate(id)} />
            {past.length > 0 && (
              <div className="mt-8">
                <FrSection title="Tidligere fravær" items={past} onDelete={(id) => deleteMutation.mutate(id)} muted />
              </div>
            )}
            {absences.length === 0 && (
              <div className="text-center py-16">
                <Calendar className="w-10 h-10 mx-auto mb-4" style={{ color: "oklch(0.8 0.01 60)" }} />
                <p className="text-sm" style={{ color: "oklch(0.65 0.01 60)" }}>Ingen fravær registrert</p>
              </div>
            )}
          </>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.3)" }} onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold" style={{ color: "oklch(0.16 0.01 60)" }}>Registrer fravær</h2>
              <button onClick={() => setOpen(false)} style={{ color: "oklch(0.65 0.01 60)" }}>✕</button>
            </div>
            <div className="space-y-4">
              {isAdmin && (
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "oklch(0.16 0.01 60)" }}>Ansatt *</label>
                  <select className={inputCls} style={inputStyle} value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })}>
                    <option value="">Velg ansatt</option>
                    {employees.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "oklch(0.16 0.01 60)" }}>Fra *</label>
                  <input type="date" className={inputCls} style={inputStyle} value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "oklch(0.16 0.01 60)" }}>Til *</label>
                  <input type="date" className={inputCls} style={inputStyle} value={form.end_date} min={form.start_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "oklch(0.16 0.01 60)" }}>Årsak</label>
                <input className={inputCls} style={inputStyle} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Ferie, syk, permisjon..." />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setOpen(false)} className="flex-1 border rounded-lg py-2.5 text-sm" style={{ borderColor: "oklch(0.9 0.008 75)", color: "oklch(0.48 0.01 60)" }}>Avbryt</button>
              <button
                onClick={() => addMutation.mutate()}
                disabled={!form.employee_id || !form.start_date || !form.end_date || addMutation.isPending}
                className="flex-1 rounded-lg py-2.5 text-sm font-medium text-white disabled:opacity-50"
                style={{ background: "oklch(0.16 0.01 60)" }}
              >
                {addMutation.isPending ? "Lagrer..." : "Registrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

function FrSection({ title, items, onDelete, muted }: { title: string; items: any[]; onDelete: (id: string) => void; muted?: boolean }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: muted ? "oklch(0.72 0.01 60)" : "oklch(0.48 0.01 60)" }}>{title}</h2>
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "oklch(0.9 0.008 75)" }}>
        {items.map((a, i) => (
          <div key={a.id} className="flex items-center px-5 py-3.5" style={{ borderBottom: i < items.length - 1 ? "1px solid oklch(0.95 0.008 75)" : "none" }}>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: a.employees?.color ?? "oklch(0.16 0.01 60)" }} />
              <span className="font-medium text-sm" style={{ color: muted ? "oklch(0.55 0.01 60)" : "oklch(0.16 0.01 60)" }}>{a.employees?.name}</span>
              {a.reason && <span className="text-sm" style={{ color: "oklch(0.65 0.01 60)" }}>· {a.reason}</span>}
            </div>
            <span className="text-sm tabular-nums mr-4" style={{ color: "oklch(0.48 0.01 60)" }}>{a.start_date} – {a.end_date}</span>
            <button onClick={() => onDelete(a.id)} style={{ color: "oklch(0.8 0.01 60)" }} onMouseEnter={e => (e.currentTarget.style.color = "oklch(0.577 0.245 27)")} onMouseLeave={e => (e.currentTarget.style.color = "oklch(0.8 0.01 60)")}>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
