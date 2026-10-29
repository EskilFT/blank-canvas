import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"];

type Props = {
  open: boolean;
  onClose: () => void;
  employee?: any;
};

export function EmployeeDialog({ open, onClose, employee }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    position: "",
    hours_per_week: 37.5,
    employment_type: "full_time",
    color: COLORS[0],
  });

  useEffect(() => {
    if (employee) {
      setForm({
        name: employee.name ?? "",
        email: employee.email ?? "",
        phone: employee.phone ?? "",
        position: employee.position ?? "",
        hours_per_week: employee.hours_per_week ?? 37.5,
        employment_type: employee.employment_type ?? "full_time",
        color: employee.color ?? COLORS[0],
      });
    } else {
      setForm({ name: "", email: "", phone: "", position: "", hours_per_week: 37.5, employment_type: "full_time", color: COLORS[0] });
    }
  }, [employee, open]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (employee) {
        await supabase.from("employees").update(form).eq("id", employee.id);
      } else {
        await supabase.from("employees").insert(form);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      onClose();
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">{employee ? "Rediger ansatt" : "Ny ansatt"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4">
          <Field label="Navn *">
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ola Nordmann"
            />
          </Field>

          <Field label="Stilling *">
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
              placeholder="Kassermedarbeider"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Ansettelsestype">
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={form.employment_type}
                onChange={(e) => setForm({ ...form, employment_type: e.target.value })}
              >
                <option value="full_time">Fulltid</option>
                <option value="part_time">Deltid</option>
                <option value="hourly">Timebasert</option>
              </select>
            </Field>
            <Field label="Timer/uke">
              <input
                type="number"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={form.hours_per_week}
                onChange={(e) => setForm({ ...form, hours_per_week: parseFloat(e.target.value) })}
                min={1}
                max={60}
                step={0.5}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="E-post">
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="ola@bedrift.no"
              />
            </Field>
            <Field label="Telefon">
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="900 00 000"
              />
            </Field>
          </div>

          <Field label="Farge">
            <div className="flex gap-2 mt-1">
              {COLORS.map((c) => (
                <button
                  key={c}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${form.color === c ? "border-gray-800 scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setForm({ ...form, color: c })}
                  type="button"
                />
              ))}
            </div>
          </Field>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            Avbryt
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!form.name || !form.position || mutation.isPending}
            className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {mutation.isPending ? "Lagrer..." : employee ? "Oppdater" : "Legg til"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
