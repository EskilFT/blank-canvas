import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Plus, Trash2, Calendar } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/fravaer/")({
  component: FravaerPage,
});

function FravaerPage() {
  const qc = useQueryClient();
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
      const { data } = await supabase
        .from("absences")
        .select("*, employees(name, color)")
        .order("start_date");
      return data ?? [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      await supabase.from("absences").insert(form);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["absences"] });
      setOpen(false);
      setForm({ employee_id: "", start_date: "", end_date: "", reason: "" });
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

  return (
    <Layout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fravær</h1>
            <p className="text-gray-500">Registrer fravær for ansatte</p>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" /> Registrer fravær
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <>
            <Section title="Kommende og pågående" items={upcoming} onDelete={(id) => deleteMutation.mutate(id)} />
            {past.length > 0 && (
              <div className="mt-8">
                <Section title="Tidligere fravær" items={past} onDelete={(id) => deleteMutation.mutate(id)} muted />
              </div>
            )}
            {absences.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">Ingen fravær registrert</p>
              </div>
            )}
          </>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-5">Registrer fravær</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ansatt *</label>
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={form.employee_id}
                  onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                >
                  <option value="">Velg ansatt</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fra *</label>
                  <input
                    type="date"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Til *</label>
                  <input
                    type="date"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={form.end_date}
                    min={form.start_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Årsak</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="Ferie, syk, permisjon..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Avbryt
              </button>
              <button
                onClick={() => addMutation.mutate()}
                disabled={!form.employee_id || !form.start_date || !form.end_date || addMutation.isPending}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
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

function Section({ title, items, onDelete, muted }: { title: string; items: any[]; onDelete: (id: string) => void; muted?: boolean }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h2 className={`text-sm font-semibold mb-3 ${muted ? "text-gray-400" : "text-gray-700"}`}>{title}</h2>
      <div className="space-y-2">
        {items.map((a) => (
          <div key={a.id} className="bg-white rounded-xl border border-gray-200 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: a.employees?.color ?? "#6366f1" }}
              />
              <span className="font-medium text-gray-900 text-sm">{a.employees?.name}</span>
              {a.reason && <span className="text-sm text-gray-400">· {a.reason}</span>}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                {a.start_date} → {a.end_date}
              </span>
              <button
                onClick={() => onDelete(a.id)}
                className="text-gray-300 hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
