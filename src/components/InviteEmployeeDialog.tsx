import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, Mail } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  employees: { id: string; name: string }[];
};

export function InviteEmployeeDialog({ open, onClose, employees }: Props) {
  const [email, setEmail] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleInvite() {
    if (!email || !employeeId) return;
    setStatus("loading");
    setErrorMsg("");

    const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: { role: "employee", employee_id: employeeId },
    });

    if (error) {
      setErrorMsg(error.message);
      setStatus("error");
    } else {
      setStatus("success");
    }
  }

  function handleClose() {
    setEmail("");
    setEmployeeId("");
    setStatus("idle");
    setErrorMsg("");
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">Inviter ansatt</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {status === "success" ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Mail className="w-6 h-6 text-green-600" />
            </div>
            <p className="font-medium text-gray-900">Invitasjon sendt!</p>
            <p className="text-sm text-gray-500 mt-1">
              Den ansatte vil motta en e-post med lenke for å sette passord.
            </p>
            <button
              onClick={handleClose}
              className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              Lukk
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Den ansatte mottar en e-post der de kan sette sitt eget passord og logge inn.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Velg ansatt *</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
              >
                <option value="">Velg ansatt</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-postadresse *</label>
              <input
                type="email"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ansatt@bedrift.no"
              />
            </div>

            {errorMsg && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{errorMsg}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleClose}
                className="flex-1 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Avbryt
              </button>
              <button
                onClick={handleInvite}
                disabled={!email || !employeeId || status === "loading"}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {status === "loading" ? "Sender..." : "Send invitasjon"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
