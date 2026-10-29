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

  if (isLoading) return <Layout><div className="p-8 text-gray-400">Laster...</div></Layout>;

  return (
    <Layout>
      <div className="p-8 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Innstillinger</h1>
            <p className="text-gray-500">Bedriftens arbeidstider og kalender</p>
          </div>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saved ? "Lagret!" : saveMutation.isPending ? "Lagrer..." : "Lagre"}
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <Section title="Bedrift">
            <Field label="Bedriftsnavn">
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={form.business_name}
                onChange={(e) => setForm({ ...form, business_name: e.target.value })}
              />
            </Field>
          </Section>

          <div className="border-t border-gray-100" />

          <Section title="Åpningstider">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Åpner">
                <input
                  type="time"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={form.open_time}
                  onChange={(e) => setForm({ ...form, open_time: e.target.value })}
                />
              </Field>
              <Field label="Stenger">
                <input
                  type="time"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={form.close_time}
                  onChange={(e) => setForm({ ...form, close_time: e.target.value })}
                />
              </Field>
            </div>
          </Section>

          <div className="border-t border-gray-100" />

          <Section title="Åpningsdager">
            <div className="flex gap-2 flex-wrap">
              {DAY_LABELS.map((day, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleDay(i)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    form.open_days.includes(i)
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </Section>

          <div className="border-t border-gray-100" />

          <Section title="Bemanning">
            <Field label="Minimum ansatte per vakt">
              <input
                type="number"
                min={1}
                max={20}
                className="w-32 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={form.min_employees_per_shift}
                onChange={(e) =>
                  setForm({ ...form, min_employees_per_shift: parseInt(e.target.value) })
                }
              />
            </Field>
          </Section>
        </div>
      </div>
    </Layout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  );
}
