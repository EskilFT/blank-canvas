import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Users, Calendar, Clock, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Dashboard() {
  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data } = await supabase.from("employees").select("*");
      return data ?? [];
    },
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ["shifts-week"],
    queryFn: async () => {
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay() + 1);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      const { data } = await supabase
        .from("shifts")
        .select("*")
        .gte("date", weekStart.toISOString().split("T")[0])
        .lte("date", weekEnd.toISOString().split("T")[0]);
      return data ?? [];
    },
  });

  const { data: absences = [] } = useQuery({
    queryKey: ["absences-upcoming"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("absences")
        .select("*, employees(name)")
        .gte("end_date", today)
        .order("start_date")
        .limit(5);
      return data ?? [];
    },
  });

  const todayStr = new Date().toISOString().split("T")[0];
  const todayShifts = shifts.filter((s) => s.date === todayStr);

  return (
    <Layout>
      <div className="p-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1" style={{ color: "oklch(0.16 0.01 60)" }}>Oversikt</h1>
          <p className="text-sm" style={{ color: "oklch(0.48 0.01 60)" }}>
            {new Date().toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: Users, label: "Ansatte", value: employees.length },
            { icon: Calendar, label: "Vakter denne uken", value: shifts.length },
            { icon: Clock, label: "Kommende fravær", value: absences.length },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-white rounded-xl border p-5" style={{ borderColor: "oklch(0.9 0.008 75)" }}>
              <p className="text-3xl font-bold mb-1" style={{ color: "oklch(0.16 0.01 60)" }}>{value}</p>
              <p className="text-sm" style={{ color: "oklch(0.48 0.01 60)" }}>{label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card title="Vakter i dag" to="/vakter">
            {todayShifts.length === 0 ? (
              <p className="text-sm py-4 text-center" style={{ color: "oklch(0.65 0.01 60)" }}>Ingen vakter i dag</p>
            ) : (
              todayShifts.map((s) => {
                const emp = employees.find((e) => e.id === s.employee_id);
                return (
                  <div key={s.id} className="flex items-center justify-between py-2.5 border-b last:border-0" style={{ borderColor: "oklch(0.95 0.008 75)" }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: emp?.color ?? "#1C1917" }} />
                      <span className="text-sm" style={{ color: "oklch(0.16 0.01 60)" }}>{emp?.name ?? "Ukjent"}</span>
                    </div>
                    <span className="text-sm tabular-nums" style={{ color: "oklch(0.48 0.01 60)" }}>
                      {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                    </span>
                  </div>
                );
              })
            )}
          </Card>

          <Card title="Kommende fravær" to="/fravaer">
            {absences.length === 0 ? (
              <p className="text-sm py-4 text-center" style={{ color: "oklch(0.65 0.01 60)" }}>Ingen registrert fravær</p>
            ) : (
              absences.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between py-2.5 border-b last:border-0" style={{ borderColor: "oklch(0.95 0.008 75)" }}>
                  <span className="text-sm" style={{ color: "oklch(0.16 0.01 60)" }}>{a.employees?.name}</span>
                  <span className="text-sm tabular-nums" style={{ color: "oklch(0.48 0.01 60)" }}>
                    {a.start_date} – {a.end_date}
                  </span>
                </div>
              ))
            )}
          </Card>
        </div>

        {employees.length === 0 && (
          <div className="mt-6 border rounded-xl p-6" style={{ borderColor: "oklch(0.9 0.008 75)", background: "white" }}>
            <p className="font-medium mb-1" style={{ color: "oklch(0.16 0.01 60)" }}>Start med å legge til ansatte</p>
            <p className="text-sm mb-4" style={{ color: "oklch(0.48 0.01 60)" }}>Legg til dine ansatte for å begynne å generere vaktplaner.</p>
            <Link
              to="/ansatte"
              className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg text-white"
              style={{ background: "oklch(0.16 0.01 60)" }}
            >
              Legg til ansatte <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}

function Card({ title, to, children }: { title: string; to: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border p-5" style={{ borderColor: "oklch(0.9 0.008 75)" }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold" style={{ color: "oklch(0.16 0.01 60)" }}>{title}</h2>
        <Link to={to} className="text-xs flex items-center gap-1" style={{ color: "oklch(0.48 0.01 60)" }}>
          Se alle <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      {children}
    </div>
  );
}
