import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Plus, Pencil, Trash2, Mail, Phone, Briefcase, UserPlus } from "lucide-react";
import { useState } from "react";
import { EmployeeDialog } from "@/components/EmployeeDialog";
import { InviteEmployeeDialog } from "@/components/InviteEmployeeDialog";

export const Route = createFileRoute("/ansatte/")({
  component: AnsattePage,
});

function AnsattePage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data } = await supabase.from("employees").select("*").order("name");
      return data ?? [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("employees").delete().eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employees"] }),
  });

  const employmentLabel: Record<string, string> = {
    full_time: "Fulltid",
    part_time: "Deltid",
    hourly: "Timebasert",
  };

  return (
    <Layout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ansatte</h1>
            <p className="text-gray-500">{employees.length} ansatte registrert</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setInviteOpen(true)}
              className="flex items-center gap-2 border border-indigo-200 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-50"
            >
              <UserPlus className="w-4 h-4" /> Inviter ansatt
            </button>
            <button
              onClick={() => { setEditing(null); setOpen(true); }}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4" /> Legg til ansatt
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : employees.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">Ingen ansatte ennå</p>
            <button
              onClick={() => { setEditing(null); setOpen(true); }}
              className="mt-4 text-indigo-600 text-sm hover:underline"
            >
              Legg til din første ansatt
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {employees.map((emp) => (
              <div key={emp.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                      style={{ backgroundColor: emp.color ?? "#6366f1" }}
                    >
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{emp.name}</p>
                      <p className="text-sm text-gray-500">{emp.position}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditing(emp); setOpen(true); }}
                      className="p-1.5 text-gray-400 hover:text-gray-700 rounded"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => { if (confirm(`Slett ${emp.name}?`)) deleteMutation.mutate(emp.id); }}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>{employmentLabel[emp.employment_type] ?? emp.employment_type} · {emp.hours_per_week}t/uke</span>
                  </div>
                  {emp.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="truncate">{emp.email}</span>
                    </div>
                  )}
                  {emp.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{emp.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <EmployeeDialog
        open={open}
        onClose={() => setOpen(false)}
        employee={editing}
      />
      <InviteEmployeeDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        employees={employees}
      />
    </Layout>
  );
}
