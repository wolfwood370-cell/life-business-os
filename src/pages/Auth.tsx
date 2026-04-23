import { useEffect, useState } from "react";
import { Navigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/store/useAuth";
import { Dumbbell, ArrowRight, Lock, Mail, Loader2 } from "lucide-react";

type AuthView = "login" | "register" | "recovery";

const Auth = () => {
  const { session, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<AuthView>(searchParams.get("signup") === "true" ? "register" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    document.title = "Accedi · PT CRM";
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (session) return <Navigate to="/" replace />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ title: "Errore di accesso", description: "Credenziali non valide.", variant: "destructive" });
    } else {
      toast({ title: "Bentornato!", description: "Accesso effettuato con successo." });
    }
    setIsSubmitting(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    if (error) {
      const lower = error.message.toLowerCase();
      const msg = lower.includes("non autorizzata") || lower.includes("not allowed") || lower.includes("unauthorized")
        ? "Email non autorizzata ad accedere a questa piattaforma."
        : lower.includes("already registered")
          ? "Questa email è già registrata. Prova ad accedere."
          : error.message;
      toast({ title: "Errore di registrazione", description: msg, variant: "destructive" });
    } else {
      toast({ title: "Account creato!", description: "Ora puoi accedere." });
      setView("login");
    }
    setIsSubmitting(false);
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Email di recupero inviata", description: "Controlla la tua casella per le istruzioni di reset." });
      setView("login");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Pannello sinistro - branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-glow">
              <Dumbbell className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-bold text-foreground">PT CRM</h1>
          </div>
          <p className="text-muted-foreground text-sm">Centro di Comando</p>
        </div>
        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl font-bold leading-tight text-foreground">
            Il tuo CRM<br />
            <span className="text-primary">commerciale.</span>
          </h2>
          <p className="text-muted-foreground max-w-md leading-relaxed">
            Accedi per gestire pipeline, clienti e performance del tuo studio di personal training.
          </p>
        </div>
        <div className="relative z-10">
          <p className="text-xs text-muted-foreground">© 2026 NC Training Systems. Tutti i diritti riservati.</p>
        </div>
      </div>

      {/* Pannello destro - form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Logo mobile */}
          <div className="lg:hidden flex items-center gap-3 justify-center mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-glow">
              <Dumbbell className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <h1 className="text-xl font-bold text-foreground">PT CRM</h1>
          </div>

          {view === "recovery" ? (
            <Card className="border-border">
              <CardHeader className="space-y-1">
                <CardTitle className="text-xl">Reimposta Password</CardTitle>
                <CardDescription>Inserisci la tua email per ricevere un link di reset</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRecovery} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="recovery-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="recovery-email"
                        type="email"
                        placeholder="tu@esempio.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 bg-secondary border-border"
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Invio in corso..." : "Invia Link di Reset"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-muted-foreground"
                    onClick={() => setView("login")}
                  >
                    Torna al Login
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Tabs value={view} onValueChange={(v) => setView(v as AuthView)} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 bg-secondary">
                <TabsTrigger value="login">Accedi</TabsTrigger>
                <TabsTrigger value="register">Registrati</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Card className="border-border">
                  <CardHeader className="space-y-1">
                    <CardTitle className="text-xl">Bentornato</CardTitle>
                    <CardDescription>Inserisci le tue credenziali per continuare</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="login-email"
                            type="email"
                            placeholder="tu@esempio.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10 bg-secondary border-border"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="login-password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="login-password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10 bg-secondary border-border"
                            required
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setView("recovery")}
                          className="text-xs text-primary hover:underline"
                        >
                          Password dimenticata?
                        </button>
                      </div>
                      <Button type="submit" className="w-full group" disabled={isSubmitting}>
                        {isSubmitting ? "Accesso in corso..." : (
                          <span className="flex items-center gap-2">
                            Accedi <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </span>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="register">
                <Card className="border-border">
                  <CardHeader className="space-y-1">
                    <CardTitle className="text-xl">Crea un account</CardTitle>
                    <CardDescription>Solo email autorizzate possono registrarsi</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="reg-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="reg-email"
                            type="email"
                            placeholder="tu@esempio.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10 bg-secondary border-border"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reg-password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="reg-password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10 bg-secondary border-border"
                            required
                            minLength={8}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">Minimo 8 caratteri</p>
                      </div>
                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? "Creazione account..." : "Crea Account"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
