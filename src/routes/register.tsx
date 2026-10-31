import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isLoading && user) navigate({ to: "/" });
  }, [user, isLoading]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, role: "admin" } },
    });
    if (error) setError(error.message);
    else setSuccess(true);
    setLoading(false);
  }

  const inputStyle = {
    borderColor: "oklch(0.9 0.008 75)",
    color: "oklch(0.16 0.01 60)",
  };

  return (
    <div className="min-h-screen flex" style={{ background: "oklch(0.975 0.008 75)" }}>
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-sm">
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-6 h-6 rounded bg-[oklch(0.16_0.01_60)] flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-sm font-semibold tracking-tight" style={{ color: "oklch(0.16 0.01 60)" }}>ShiftPlan</span>
            </div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "oklch(0.16 0.01 60)" }}>Kom i gang</h1>
            <p className="text-sm" style={{ color: "oklch(0.48 0.01 60)" }}>Opprett din bedriftskonto — første bruker blir administrator</p>
          </div>

          {success ? (
            <div className="bg-white border rounded-xl p-6 text-center" style={{ borderColor: "oklch(0.9 0.008 75)" }}>
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-medium mb-1" style={{ color: "oklch(0.16 0.01 60)" }}>Sjekk e-posten din</p>
              <p className="text-sm mb-4" style={{ color: "oklch(0.48 0.01 60)" }}>Vi har sendt en bekreftelseslenke til {email}</p>
              <Link to="/login" className="text-sm font-medium underline underline-offset-2" style={{ color: "oklch(0.16 0.01 60)" }}>
                Gå til innlogging
              </Link>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "oklch(0.16 0.01 60)" }}>Navn</label>
                <input
                  type="text"
                  className="w-full bg-white border rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all"
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = "oklch(0.65 0.18 42)")}
                  onBlur={e => (e.target.style.borderColor = "oklch(0.9 0.008 75)")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ola Nordmann"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "oklch(0.16 0.01 60)" }}>E-post *</label>
                <input
                  type="email"
                  required
                  className="w-full bg-white border rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all"
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = "oklch(0.65 0.18 42)")}
                  onBlur={e => (e.target.style.borderColor = "oklch(0.9 0.008 75)")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="din@epost.no"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "oklch(0.16 0.01 60)" }}>Passord *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="w-full bg-white border rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all"
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = "oklch(0.65 0.18 42)")}
                  onBlur={e => (e.target.style.borderColor = "oklch(0.9 0.008 75)")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minst 6 tegn"
                />
              </div>

              {error && (
                <p className="text-sm px-3.5 py-2.5 rounded-lg bg-red-50 text-red-600">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-50"
                style={{ background: "oklch(0.16 0.01 60)" }}
              >
                {loading ? "Oppretter konto..." : "Opprett konto"}
              </button>

              <p className="text-sm text-center" style={{ color: "oklch(0.48 0.01 60)" }}>
                Har du konto?{" "}
                <Link to="/login" className="font-medium underline underline-offset-2" style={{ color: "oklch(0.16 0.01 60)" }}>
                  Logg inn
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>

      <div className="hidden lg:flex flex-1 items-center justify-center p-12" style={{ background: "oklch(0.16 0.01 60)" }}>
        <div className="max-w-sm text-center">
          <p className="text-2xl font-bold text-white mb-3">Smart vaktplanlegging</p>
          <p className="text-sm" style={{ color: "oklch(0.7 0.01 60)" }}>AI fordeler vakter rettferdig basert på ansattes timekrav og tilgjengelighet.</p>
        </div>
      </div>
    </div>
  );
}
