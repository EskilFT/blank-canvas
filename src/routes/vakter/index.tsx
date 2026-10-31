import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Wand2, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { useState } from "react";
import { generateSchedule } from "@/lib/scheduler";

export const Route = createFileRoute("/vakter/")({
  component: VakterPage,
});

const DAYS = ["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"];
const DAY_NUMS = [1, 2, 3, 4, 5, 6, 0]; // Mon-Sun

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function formatDateDisplay(date: Date): string {
  return date.toLocaleDateString("nb-NO", { day: "numeric", month: "short" });
}

export default function VakterPage() {
  const qc = useQueryClient();
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const weekEnd = addDays(weekStart, 6);

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data } = await supabase.from("employees").select("*");
      return data ?? [];
    },
  });

  const { data: shifts = [], isLoading } = useQuery({
    queryKey: ["shifts", formatDate(weekStart)],
    queryFn: async () => {
      const { data } = await supabase
        .from("shifts")
        .select("*")
        .gte("date", formatDate(weekStart))
        .lte("date", formatDate(weekEnd));
      return data ?? [];
    },
  });

  const { data: absences = [] } = useQuery({
    queryKey: ["absences"],
    queryFn: async () => {
      const { data } = await supabase.from("absences").select("*");
      return data ?? [];
    },
  });

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data } = await supabase.from("business_settings").select("*").single();
      return data;
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!settings) throw new Error("Ingen innstillinger funnet");

      // Slett eksisterende vakter for uken
      await supabase
        .from("shifts")
        .delete()
        .gte("date", formatDate(weekStart))
        .lte("date", formatDate(weekEnd));

      const generated = generateSchedule(
        employees,
        absences,
        settings,
        weekStart,
        weekEnd
      );

      if (generated.length > 0) {
        await supabase.from("shifts").insert(generated);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shifts", formatDate(weekStart)] }),
  });

  const deleteShiftMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("shifts").delete().eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shifts", formatDate(weekStart)] }),
  });

  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const btnBase = { borderColor: "oklch(0.9 0.008 75)", color: "oklch(0.48 0.01 60)", background: "white" };

  return (
    <Layout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: "oklch(0.16 0.01 60)" }}>Vaktplan</h1>
            <p className="text-sm" style={{ color: "oklch(0.48 0.01 60)" }}>
              {formatDateDisplay(weekStart)} – {formatDateDisplay(weekEnd)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setWeekStart(addDays(weekStart, -7))} className="p-2 border rounded-lg" style={btnBase}>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setWeekStart(getWeekStart(new Date()))} className="px-3 py-2 border rounded-lg text-sm" style={btnBase}>
              Denne uken
            </button>
            <button onClick={() => setWeekStart(addDays(weekStart, 7))} className="p-2 border rounded-lg" style={btnBase}>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending || employees.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 ml-2"
              style={{ background: "oklch(0.16 0.01 60)" }}
            >
              <Wand2 className="w-4 h-4" />
              {generateMutation.isPending ? "Genererer..." : "Generer med AI"}
            </button>
          </div>
        </div>

        {employees.length === 0 && (
          <div className="border rounded-xl p-4 text-sm mb-6" style={{ borderColor: "oklch(0.9 0.008 75)", background: "white", color: "oklch(0.48 0.01 60)" }}>
            Legg til ansatte før du genererer vakter.
          </div>
        )}

        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "oklch(0.9 0.008 75)" }}>
          <div className="grid grid-cols-8" style={{ borderBottom: "1px solid oklch(0.95 0.008 75)" }}>
            <div className="p-3" style={{ background: "oklch(0.975 0.008 75)" }} />
            {weekDates.map((date, i) => {
              const isToday = formatDate(date) === formatDate(new Date());
              return (
                <div key={i} className="p-3 text-center" style={{ background: isToday ? "oklch(0.97 0.015 75)" : "oklch(0.975 0.008 75)", borderLeft: "1px solid oklch(0.95 0.008 75)" }}>
                  <p className="text-xs font-medium" style={{ color: isToday ? "oklch(0.65 0.18 42)" : "oklch(0.48 0.01 60)" }}>{DAYS[i]}</p>
                  <p className="text-sm font-semibold" style={{ color: isToday ? "oklch(0.55 0.18 42)" : "oklch(0.16 0.01 60)" }}>{date.getDate()}</p>
                </div>
              );
            })}
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-sm" style={{ color: "oklch(0.65 0.01 60)" }}>Laster...</div>
          ) : employees.length === 0 ? (
            <div className="p-8 text-center text-sm" style={{ color: "oklch(0.65 0.01 60)" }}>Ingen ansatte</div>
          ) : (
            employees.map((emp) => (
              <div key={emp.id} className="grid grid-cols-8" style={{ borderBottom: "1px solid oklch(0.97 0.008 75)" }}>
                <div className="p-3 flex items-center gap-2" style={{ borderRight: "1px solid oklch(0.97 0.008 75)" }}>
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: emp.color ?? "oklch(0.16 0.01 60)" }} />
                  <span className="text-sm font-medium truncate" style={{ color: "oklch(0.16 0.01 60)" }}>{emp.name}</span>
                </div>
                {weekDates.map((date, i) => {
                  const dateStr = formatDate(date);
                  const dayShifts = shifts.filter((s) => s.employee_id === emp.id && s.date === dateStr);
                  const isAbsent = absences.some((a) => a.employee_id === emp.id && dateStr >= a.start_date && dateStr <= a.end_date);
                  return (
                    <div key={i} className="p-1.5 min-h-[56px]" style={{ borderLeft: "1px solid oklch(0.97 0.008 75)" }}>
                      {isAbsent ? (
                        <div className="h-full rounded flex items-center justify-center" style={{ background: "oklch(0.97 0.02 25)" }}>
                          <span className="text-xs" style={{ color: "oklch(0.55 0.12 25)" }}>Fravær</span>
                        </div>
                      ) : (
                        dayShifts.map((s) => (
                          <div key={s.id} className="rounded p-1.5 text-xs text-white flex items-center justify-between group mb-1" style={{ backgroundColor: emp.color ?? "oklch(0.16 0.01 60)" }}>
                            <span>{s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}</span>
                            <button onClick={() => deleteShiftMutation.mutate(s.id)} className="opacity-0 group-hover:opacity-100 ml-1">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
