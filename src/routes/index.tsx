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
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Velkommen 👋</h1>
        <p className="text-gray-500 mb-8">Oversikt over bedriften din</p>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard
            icon={<Users className="w-5 h-5 text-indigo-600" />}
            label="Ansatte"
            value={employees.length}
            bg="bg-indigo-50"
          />
          <StatCard
            icon={<Calendar className="w-5 h-5 text-emerald-600" />}
            label="Vakter denne uken"
            value={shifts.length}
            bg="bg-emerald-50"
          />
          <StatCard
            icon={<Clock className="w-5 h-5 text-amber-600" />}
            label="Fravær kommende"
            value={absences.length}
            bg="bg-amber-50"
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Vakter i dag</h2>
              <Link to="/vakter" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
                Se alle <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {todayShifts.length === 0 ? (
              <p className="text-sm text-gray-400">Ingen vakter registrert i dag</p>
            ) : (
              <div className="space-y-2">
                {todayShifts.map((s) => {
                  const emp = employees.find((e) => e.id === s.employee_id);
                  return (
                    <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: emp?.color ?? "#6366f1" }}
                        />
                        <span className="text-sm text-gray-900">{emp?.name ?? "Ukjent"}</span>
                      </div>
                      <span className="text-sm text-gray-500">{s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Kommende fravær</h2>
              <Link to="/fravaer" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
                Se alle <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {absences.length === 0 ? (
              <p className="text-sm text-gray-400">Ingen registrert fravær</p>
            ) : (
              <div className="space-y-2">
                {absences.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="text-sm text-gray-900">{a.employees?.name}</span>
                    <span className="text-sm text-gray-500">
                      {a.start_date} – {a.end_date}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {employees.length === 0 && (
          <div className="mt-8 bg-indigo-50 border border-indigo-200 rounded-xl p-6 text-center">
            <p className="text-indigo-700 font-medium mb-2">Kom i gang!</p>
            <p className="text-indigo-600 text-sm mb-4">Legg til ansatte for å begynne å planlegge vakter.</p>
            <Link
              to="/ansatte"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              <Users className="w-4 h-4" /> Legg til ansatte
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}

function StatCard({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: number; bg: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}
