import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Save } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/innstillinger/")({
  component: InnstillingerPage,
});

const DAY_LABELS = ["Søndag", "Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag"];

function InnstillingerPage() {
  const qc = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    business_name: "Min Bedrift",
    open_time: "08:00",
    close_time: "17:00",
    open_days: [1, 2, 3, 4, 5],
    min_employees_per_shift: 1,
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data } = await supabase.from("business_settings").select("*").single();
      return data;
    },
  });

  useEffect(() => {
    if (settings) {
      setForm({
        business_name: settings.business_name,
        open_time: settings.open_time,
        close_time: settings.close_time,
        open_days: settings.open_days,
        min_employees_per_shift: settings.min_employees_per_shift,
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (settings) {
        await supabase.from("business_settings").update(form).eq("id", settings.id);
      } else {
        await supabase.from("business_settings").insert(form);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const toggleDay = (day: number) => {
    setForm((f) => ({
      ...f,
      open_days: f.open_days.includes(day)
        ? f.open_days.filter((d) => d !== day)
        : [...f.open_days, day].sort(),
    }));
  };

  const inputCls = "bg-white border rounded-lg px-3.5 py-2.5 text-sm outline-none";
  const inputStyle = { borderColor: "oklch(0.9 0.008 75)", color: "oklch(0.16 0.01 60)" };

  if (isLoading) return <Layout><div className="p-8 text-sm" style={{ color: "oklch(0.65 0.01 60)" }}>Laster...</div></Layout>;

  return (
    <Layout>
      <div className="p-8 max-w-xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: "oklch(0.16 0.01 60)" }}>Innstillinger</h1>
            <p className="text-sm" style={{ color: "oklch(0.48 0.01 60)" }}>Bedriftens arbeidstider og kalender</p>
          </div>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white disabled:opacity-50"
            style={{ background: saved ? "oklch(0.55 0.15 145)" : "oklch(0.16 0.01 60)" }}
          >
            <Save className="w-4 h-4" />
            {saved ? "Lagret!" : saveMutation.isPending ? "Lagrer..." : "Lagre"}
          </button>
        </div>

        <div className="bg-white rounded-xl border p-6 space-y-6" style={{ borderColor: "oklch(0.9 0.008 75)" }}>
          <div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: "oklch(0.16 0.01 60)" }}>Bedrift</h3>
            <label className="block text-sm mb-1.5" style={{ color: "oklch(0.48 0.01 60)" }}>Bedriftsnavn</label>
            <input className={`w-full ${inputCls}`} style={inputStyle} value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} onFocus={e => (e.target.style.borderColor = "oklch(0.65 0.18 42)")} onBlur={e => (e.target.style.borderColor = "oklch(0.9 0.008 75)")} />
          </div>

          <div className="border-t" style={{ borderColor: "oklch(0.95 0.008 75)" }} />

          <div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: "oklch(0.16 0.01 60)" }}>Åpningstider</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1.5" style={{ color: "oklch(0.48 0.01 60)" }}>Åpner</label>
                <input type="time" className={`w-full ${inputCls}`} style={inputStyle} value={form.open_time} onChange={(e) => setForm({ ...form, open_time: e.target.value })} onFocus={e => (e.target.style.borderColor = "oklch(0.65 0.18 42)")} onBlur={e => (e.target.style.borderColor = "oklch(0.9 0.008 75)")} />
              </div>
              <div>
                <label className="block text-sm mb-1.5" style={{ color: "oklch(0.48 0.01 60)" }}>Stenger</label>
                <input type="time" className={`w-full ${inputCls}`} style={inputStyle} value={form.close_time} onChange={(e) => setForm({ ...form, close_time: e.target.value })} onFocus={e => (e.target.style.borderColor = "oklch(0.65 0.18 42)")} onBlur={e => (e.target.style.borderColor = "oklch(0.9 0.008 75)")} />
              </div>
            </div>
          </div>

          <div className="border-t" style={{ borderColor: "oklch(0.95 0.008 75)" }} />

          <div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: "oklch(0.16 0.01 60)" }}>Åpningsdager</h3>
            <div className="flex gap-2 flex-wrap">
              {DAY_LABELS.map((day, i) => {
                const active = form.open_days.includes(i);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDay(i)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors"
                    style={active ? { background: "oklch(0.16 0.01 60)", color: "white", borderColor: "oklch(0.16 0.01 60)" } : { background: "white", color: "oklch(0.48 0.01 60)", borderColor: "oklch(0.9 0.008 75)" }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t" style={{ borderColor: "oklch(0.95 0.008 75)" }} />

          <div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: "oklch(0.16 0.01 60)" }}>Bemanning</h3>
            <label className="block text-sm mb-1.5" style={{ color: "oklch(0.48 0.01 60)" }}>Minimum ansatte per vakt</label>
            <input type="number" min={1} max={20} className={`w-24 ${inputCls}`} style={inputStyle} value={form.min_employees_per_shift} onChange={(e) => setForm({ ...form, min_employees_per_shift: parseInt(e.target.value) })} onFocus={e => (e.target.style.borderColor = "oklch(0.65 0.18 42)")} onBlur={e => (e.target.style.borderColor = "oklch(0.9 0.008 75)")} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
