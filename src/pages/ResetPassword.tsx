import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Dumbbell, Lock } from "lucide-react";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Reimposta password · PT CRM";
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get("type");
    if (type === "recovery") {
      setIsValidSession(true);
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) setIsValidSession(true);
      });
    }
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setIsValidSession(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Errore", description: "Le password non corrispondono.", variant: "destructive" });
      return;
    }
    if (password.length < 8) {
      toast({ title: "Errore", description: "La password deve avere almeno 8 caratteri.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password aggiornata!", description: "Ora puoi accedere con la nuova password." });
      navigate("/");
    }
    setIsSubmitting(false);
  };

  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Card className="border-border w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto h-10 w-10 rounded-xl gradient-primary shadow-glow flex items-center justify-center mb-2">
              <Dumbbell className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <CardTitle className="text-xl">Link non valido</CardTitle>
            <CardDescription>
              Il link di recupero password non è valido o è scaduto. Richiedi un nuovo link dalla pagina di accesso.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate("/auth")}>
              Torna al Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="border-border w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-3 justify-center mb-2">
            <div className="h-10 w-10 rounded-xl gradient-primary shadow-glow flex items-center justify-center">
              <Dumbbell className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold text-foreground">PT CRM</span>
          </div>
          <CardTitle className="text-xl text-center">Nuova Password</CardTitle>
          <CardDescription className="text-center">Inserisci la tua nuova password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nuova Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-secondary border-border"
                  required
                  minLength={8}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Conferma Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 bg-secondary border-border"
                  required
                  minLength={8}
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Aggiornamento..." : "Aggiorna Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
