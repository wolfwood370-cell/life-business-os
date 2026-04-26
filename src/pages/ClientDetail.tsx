import { useParams, useNavigate } from 'react-router-dom';
import { useCrm, daysSince } from '@/store/useCrm';
import {
  ChevronLeft, Heart, Shield, Eye, Phone, Euro, CalendarClock,
  Sparkles, Activity, Plus, Trash2, MessageSquare, AlertTriangle, TrendingUp, Receipt, Loader2, CreditCard, Repeat, Ban, CheckCircle2, Clock, Pencil,
} from 'lucide-react';
import { SourceBadge } from '@/components/crm/SourceBadge';
import { ChurnBadge, LeadScoreBadge } from '@/components/crm/ScoreBadges';
import { AiFollowupGenerator } from '@/components/crm/AiFollowupGenerator';
import { RoiChart } from '@/components/crm/RoiChart';
import { ClientDetailSkeleton } from '@/components/crm/skeletons';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

import {
  PIPELINE_STAGES, PipelineStage, stageColorMap, pipelineStageLabel,
  CHURN_RISKS, ChurnRisk, RoiMetric,
  LEAD_SOURCES, LeadSource, leadSourceLabel,
  GENDERS, Gender, genderLabel,
  PaymentType, PaymentMethod, PAYMENT_METHODS,
  Transaction, TransactionStatus, TRANSACTION_STATUSES,
  SERVICE_GROUPS, ServiceType, CUSTOM_PRICE_SERVICES,
  SHORT_DURATION_SERVICES, CONTRACT_DURATION_OPTIONS, ContractDurationMonths,
  formatEuro,
} from '@/types/crm';
import { baseLeadScore } from '@/lib/leadScore';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ShieldCheck } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { todayIso, dateInputToIso } from '@/lib/date';

const ClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { clients, updateClient, deleteClient, moveClient, addRoiMetric, removeRoiMetric, isLoading, transactions, services, addTransaction, stopRecurringPayment, markTransactionPaid, updateTransaction, deleteTransaction, bankAccounts, addMovement } = useCrm();
  const client = clients.find(c => c.id === id);

  // Inline payment form state
  const [payServiceId, setPayServiceId] = useState<string | undefined>(undefined);
  const [payAmount, setPayAmount] = useState('');
  const [payType, setPayType] = useState<PaymentType>('Unica Soluzione');
  const [payInstallments, setPayInstallments] = useState(2);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('Stripe');
  const [payDate, setPayDate] = useState<string>(todayIso());
  const [paySubmitting, setPaySubmitting] = useState(false);

  // Edit & delete transaction state
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editPaymentDate, setEditPaymentDate] = useState('');
  const [editStatus, setEditStatus] = useState<TransactionStatus>('Saldato');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);

  const openEditTx = (t: Transaction) => {
    setEditingTx(t);
    setEditAmount(String(t.amount));
    setEditDueDate(t.due_date ? t.due_date.slice(0, 10) : '');
    setEditPaymentDate(t.payment_date ? t.payment_date.slice(0, 10) : '');
    setEditStatus(t.status);
  };

  const handleSaveEditTx = async () => {
    if (!editingTx) return;
    const amt = Number(editAmount);
    if (!editAmount || isNaN(amt) || amt <= 0) {
      toast.error('Inserisci un importo valido');
      return;
    }
    setEditSubmitting(true);
    try {
      await updateTransaction(editingTx.id, {
        amount: amt,
        due_date: dateInputToIso(editDueDate),
        payment_date: editStatus === 'Saldato' ? dateInputToIso(editPaymentDate) : undefined,
        status: editStatus,
      });
      toast.success('Pagamento aggiornato');
      setEditingTx(null);
    } catch {
      toast.error("Errore nell'aggiornamento del pagamento");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteTx = async (transactionId: string) => {
    try {
      await deleteTransaction(transactionId);
      toast.success('Pagamento eliminato');
    } catch {
      toast.error("Errore durante l'eliminazione");
    } finally {
      setDeletingTxId(null);
    }
  };

  const clientTransactions = useMemo(
    () => transactions.filter(t => t.client_id === id).sort((a, b) =>
      new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    ),
    [transactions, id]
  );
  const totalPaid = useMemo(
    () => clientTransactions.filter(t => t.status === 'Saldato').reduce((s, t) => s + t.amount, 0),
    [clientTransactions]
  );
  const totalPending = useMemo(
    () => clientTransactions.filter(t => t.status === 'In Attesa').reduce((s, t) => s + t.amount, 0),
    [clientTransactions]
  );
  const contractTotal = client?.actual_price ?? 0;
  const contractRemaining = Math.max(0, contractTotal - totalPaid);
  const contractProgressPct = contractTotal > 0 ? Math.min(100, Math.round((totalPaid / contractTotal) * 100)) : 0;

  const [motivator, setMotivator] = useState('');
  const [stated, setStated] = useState('');
  const [real, setReal] = useState('');
  const [monthlyValue, setMonthlyValue] = useState('');
  const [renewal, setRenewal] = useState('');
  const [lastContact, setLastContact] = useState('');
  
  const [churn, setChurn] = useState<ChurnRisk>('Basso');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<Gender | undefined>(undefined);
  const [gymSignup, setGymSignup] = useState('');
  const [gymExpiry, setGymExpiry] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gdprConsent, setGdprConsent] = useState(false);
  const [serviceSold, setServiceSold] = useState<ServiceType | undefined>(undefined);
  const [actualPrice, setActualPrice] = useState('');
  const [trainingStart, setTrainingStart] = useState('');
  const [trainingEnd, setTrainingEnd] = useState('');
  const [contractDuration, setContractDuration] = useState<ContractDurationMonths>(3);
  const [incassatoOggi, setIncassatoOggi] = useState('');

  // Lead score behavior checklist (objective scoring)
  const [behaviorResponsive, setBehaviorResponsive] = useState(false);
  const [behaviorBookedSession, setBehaviorBookedSession] = useState(false);
  const [behaviorNoMoneyObjection, setBehaviorNoMoneyObjection] = useState(false);
  const [behaviorUrgency, setBehaviorUrgency] = useState(false);

  // ROI metric form
  const [metricName, setMetricName] = useState('');
  const [metricValue, setMetricValue] = useState('');
  const [metricNote, setMetricNote] = useState('');
  const [formInitialized, setFormInitialized] = useState(false);

  useEffect(() => {
    if (client) {
      setMotivator(client.root_motivator);
      setStated(client.objection_stated);
      setReal(client.objection_real);
      setMonthlyValue(client.monthly_value ? String(client.monthly_value) : '');
      setRenewal(client.next_renewal_date ? client.next_renewal_date.slice(0, 10) : '');
      setLastContact(client.last_contacted_at ? client.last_contacted_at.slice(0, 10) : '');
      // Decode behavior checklist from saved lead_score (best-effort)
      const base = baseLeadScore(client.lead_source);
      const delta = Math.max(0, (client.lead_score ?? base) - base);
      // Greedy decode: booked(20) > responsive(10) > noMoney(10) > urgency(10)
      let remaining = delta;
      const booked = remaining >= 20; if (booked) remaining -= 20;
      const responsive = remaining >= 10; if (responsive) remaining -= 10;
      const noMoney = remaining >= 10; if (noMoney) remaining -= 10;
      const urgency = remaining >= 10; if (urgency) remaining -= 10;
      setBehaviorBookedSession(booked);
      setBehaviorResponsive(responsive);
      setBehaviorNoMoneyObjection(noMoney);
      setBehaviorUrgency(urgency);
      setChurn(client.churn_risk ?? 'Basso');
      setBirthDate(client.birth_date ? client.birth_date.slice(0, 10) : '');
      setGender(client.gender ?? undefined);
      setGymSignup(client.gym_signup_date ? client.gym_signup_date.slice(0, 10) : '');
      setGymExpiry(client.gym_expiry_date ? client.gym_expiry_date.slice(0, 10) : '');
      setPhone(client.phone ?? '');
      setEmail(client.email ?? '');
      setFirstName(client.first_name ?? '');
      setLastName(client.last_name ?? '');
      setGdprConsent(!!client.gdpr_consent);
      setServiceSold((client.service_sold as ServiceType | undefined) ?? undefined);
      setActualPrice(client.actual_price !== undefined && client.actual_price !== null ? String(client.actual_price) : '');
      setTrainingStart(client.training_start_date ? client.training_start_date.slice(0, 10) : '');
      setTrainingEnd(client.training_end_date ? client.training_end_date.slice(0, 10) : '');

      // Phase 37 polish: derive contractDuration from existing dates so the select
      // reflects the real saved contract length when re-opening a client.
      if (client.training_start_date && client.training_end_date) {
        const ms = new Date(client.training_end_date).getTime() - new Date(client.training_start_date).getTime();
        const days = Math.round(ms / 86_400_000);
        // Months ≈ days/30.44; snap to nearest available option (3,6,12).
        const months = days / 30.44;
        const snapped: ContractDurationMonths = months <= 4 ? 3 : months <= 9 ? 6 : 12;
        setContractDuration(snapped);
      } else {
        setContractDuration(3);
      }
      setIncassatoOggi('');
      setFormInitialized(true);
    }
    // Reset transient inputs when switching to a different client.
    return () => {
      setFormInitialized(false);
      setPayAmount('');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client?.id]);

  // SMART AMOUNT: prefill remaining balance once form is initialized
  useEffect(() => {
    if (formInitialized && !payAmount && contractRemaining > 0) {
      setPayAmount(String(contractRemaining));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formInitialized, contractRemaining]);

  if (isLoading) {
    return <ClientDetailSkeleton />;
  }

  if (!client) {
    return (
      <div className="px-4 pt-6">
        <p className="text-muted-foreground">Cliente non trovato.</p>
        <Button onClick={() => navigate('/clients')} className="mt-4">Torna ai clienti</Button>
      </div>
    );
  }

  // Derive lead_score from base (lead source) + objective behavior checklist, capped at 100
  const baseScore = baseLeadScore(client.lead_source);
  const behaviorBonus =
    (behaviorResponsive ? 10 : 0) +
    (behaviorBookedSession ? 20 : 0) +
    (behaviorNoMoneyObjection ? 10 : 0) +
    (behaviorUrgency ? 10 : 0);
  const score = Math.min(100, baseScore + behaviorBonus);

  // Smart end-date computation: 28 days for short-duration services, N months otherwise.
  const computeEndDate = (startYmd: string, svc: ServiceType | undefined, months: ContractDurationMonths): string | undefined => {
    if (!startYmd) return undefined;
    const [y, m, d] = startYmd.split('-').map(Number);
    if (!y || !m || !d) return undefined;
    const start = new Date(Date.UTC(y, m - 1, d));
    const end = new Date(start);
    if (svc && SHORT_DURATION_SERVICES.includes(svc)) {
      end.setUTCDate(end.getUTCDate() + 28);
    } else {
      end.setUTCMonth(end.getUTCMonth() + months);
    }
    return `${end.getUTCFullYear()}-${String(end.getUTCMonth() + 1).padStart(2, '0')}-${String(end.getUTCDate()).padStart(2, '0')}`;
  };

  const handleSave = async () => {
    const fn = firstName.trim();
    const ln = lastName.trim();
    const fullName = [fn, ln].filter(Boolean).join(' ').trim() || client!.name;

    // Smart Dates: default trainingStart to today if missing; auto-compute end.
    const effectiveStart = trainingStart || (serviceSold ? todayIso() : '');
    const effectiveEnd = serviceSold && effectiveStart
      ? computeEndDate(effectiveStart, serviceSold, contractDuration)
      : (trainingEnd || undefined);

    const priceNum = actualPrice ? Number(actualPrice.replace(',', '.')) : undefined;
    const upfrontNum = incassatoOggi ? Number(incassatoOggi.replace(',', '.')) : 0;

    try {
      await updateClient(client!.id, {
        name: fullName,
        first_name: fn || undefined,
        last_name: ln || undefined,
        root_motivator: motivator,
        objection_stated: stated,
        objection_real: real,
        monthly_value: monthlyValue ? Number(monthlyValue) : undefined,
        next_renewal_date: dateInputToIso(renewal),
        last_contacted_at: dateInputToIso(lastContact),
        lead_score: score,
        churn_risk: client!.pipeline_stage === 'Closed Won' ? churn : undefined,
        birth_date: birthDate || undefined,
        gender: (gender || undefined) as Gender | undefined,
        gym_signup_date: gymSignup || undefined,
        gym_expiry_date: gymExpiry || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        gdpr_consent: gdprConsent,
        // Phase 37: contract fields explicitly included in payload
        service_sold: serviceSold || undefined,
        actual_price: priceNum,
        training_start_date: effectiveStart || undefined,
        training_end_date: effectiveEnd,
      });

      // One-Click First Payment: register an upfront ledger entry if user typed a value.
      if (upfrontNum > 0 && !isNaN(upfrontNum)) {
        const account = bankAccounts.find(a => a.type === 'business') ?? bankAccounts[0];
        if (!account) {
          toast.error('Nessun conto bancario configurato per registrare l\'incasso');
        } else {
          await addMovement({
            account_id: account.id,
            date: new Date().toISOString(),
            description: `Prima rata / Saldo - ${serviceSold ?? 'Servizio'}`,
            amount: upfrontNum,
            type: 'credit',
            classification: 'business',
            client_id: client!.id,
            is_recurring: false,
            is_reviewed: true,
            source: 'manual',
            recurrence_type: 'none',
            service_sold: serviceSold,
            actual_price: priceNum,
          });
          toast.success(`Profilo salvato + incasso di ${formatEuro(upfrontNum)} registrato`);
          setIncassatoOggi('');
          return;
        }
      }
      toast.success('Profilo aggiornato');
    } catch {
      toast.error('Errore nel salvataggio');
    }
  };

  const handleRegisterPayment = async () => {
    const value = Number(payAmount);
    if (!payAmount || isNaN(value) || value <= 0) {
      toast.error('Inserisci un importo valido');
      return;
    }
    setPaySubmitting(true);
    try {
      await addTransaction({
        client_id: client!.id,
        amount: value,
        payment_type: payType,
        payment_method: payMethod,
        installments_count: payType === 'A Rate' ? payInstallments : 1,
        payment_date: dateInputToIso(payDate),
      });
      const perInstallment = payType === 'A Rate' ? value / payInstallments : value;
      toast.success(
        payType === 'A Rate'
          ? `Registrato: ${payInstallments} rate da ${formatEuro(perInstallment)} (${payMethod})`
          : payType === 'Ricorrente'
            ? `Pagamento ricorrente di ${formatEuro(value)} attivato (ogni 28 giorni)`
            : `Pagamento di ${formatEuro(value)} registrato (${payMethod})`
      );
      // After saving, prefill the new remaining balance (or empty if fully paid)
      const newRemaining = Math.max(0, contractTotal - (totalPaid + value));
      setPayAmount(newRemaining > 0 ? String(newRemaining) : '');
      setPayServiceId(undefined);
      setPayType('Unica Soluzione');
      setPayInstallments(2);
      setPayDate(todayIso());
    } catch {
      toast.error('Errore nel salvataggio del pagamento');
    } finally {
      setPaySubmitting(false);
    }
  };

  const handleDeleteClient = async () => {
    try {
      await deleteClient(client!.id);
      toast.success('Cliente eliminato');
      navigate('/clients');
    } catch {
      toast.error("Errore durante l'eliminazione");
    }
  };

  const handleStopRecurring = async (transactionId: string) => {
    try {
      await stopRecurringPayment(transactionId);
      toast.success('Pagamento ricorrente interrotto');
    } catch {
      toast.error("Errore nell'interruzione del pagamento");
    }
  };

  const handleMarkPaid = async (transactionId: string) => {
    try {
      await markTransactionPaid(transactionId);
      toast.success('Rata saldata con successo!');
    } catch {
      toast.error('Errore nel salvataggio della rata');
    }
  };

  const handleSourceChange = (s: LeadSource) => {
    updateClient(client!.id, { lead_source: s });
    toast.success(`Fonte aggiornata: ${leadSourceLabel[s]}`);
  };

  const handleStageChange = (s: PipelineStage) => {
    moveClient(client.id, s);
    toast.success(`Spostato in "${pipelineStageLabel[s]}"`);
  };

  const handleAddRoi = async () => {
    if (!metricName.trim() || !metricValue.trim()) {
      toast.error('Inserisci metrica e valore');
      return;
    }
    await addRoiMetric(client.id, {
      metric: metricName.trim(),
      value: metricValue.trim(),
      note: metricNote.trim() || undefined,
    });
    setMetricName('');
    setMetricValue('');
    setMetricNote('');
    toast.success('Metrica ROI aggiunta');
  };

  const handleRemoveRoi = async (metricId: string) => {
    await removeRoiMetric(client.id, metricId);
  };

  const stageColor = stageColorMap[client.pipeline_stage];
  const isActiveClient = client.pipeline_stage === 'Closed Won';

  return (
    <div className="pb-4 animate-fade-in">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border px-4 md:px-0 py-3 flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary active:scale-95 transition-smooth">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-base font-semibold truncate flex-1 text-foreground">{client.name}</h1>
      </header>

      <div className="px-4 md:px-0 pt-5 space-y-5">
        {/* Profile header con score + churn */}
        <div className="rounded-3xl gradient-card border border-border p-5 shadow-card">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl gradient-primary text-xl font-bold text-primary-foreground">
              {client.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold truncate text-foreground">{client.name}</h2>
              <div className="mt-1.5 flex flex-wrap gap-2">
                <SourceBadge source={client.lead_source} />
                {client.pipeline_stage === 'Closed Won' && client.churn_risk && <ChurnBadge risk={client.churn_risk} />}
              </div>
            </div>
            {typeof client.lead_score === 'number' && (
              <LeadScoreBadge score={client.lead_score} />
            )}
          </div>

          {client.phone && (
            <a href={`tel:${client.phone}`} className="mt-4 flex items-center gap-2 text-sm text-primary font-medium">
              <Phone className="h-4 w-4" /> {client.phone}
            </a>
          )}

          <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
            <div className="rounded-xl bg-secondary/60 p-3">
              <p className="text-muted-foreground uppercase tracking-wider">In Fase</p>
              <p className="mt-1 font-bold text-foreground">{daysSince(client.stage_updated_at)}g</p>
            </div>
            <div className="rounded-xl bg-secondary/60 p-3">
              <p className="text-muted-foreground uppercase tracking-wider">Età Lead</p>
              <p className="mt-1 font-bold text-foreground">{daysSince(client.created_at)}g</p>
            </div>
            <div className="rounded-xl bg-secondary/60 p-3">
              <p className="text-muted-foreground uppercase tracking-wider">Ultimo Contatto</p>
              <p className="mt-1 font-bold text-foreground">
                {client.last_contacted_at ? `${daysSince(client.last_contacted_at)}g fa` : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Contratto Attivo — Snapshot di servizio, prezzo e progresso pagamenti */}
        {(client.service_sold || contractTotal > 0 || client.training_start_date || client.training_end_date) && (
          <section className="rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-card to-card p-5 shadow-card space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Contratto Attivo</p>
                <h3 className="mt-1 text-lg font-bold text-foreground truncate">
                  {client.service_sold ?? 'Servizio non assegnato'}
                </h3>
                {(client.training_start_date || client.training_end_date) && (
                  <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <CalendarClock className="h-3.5 w-3.5" />
                    <span>
                      {client.training_start_date
                        ? new Date(client.training_start_date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
                      {' → '}
                      {client.training_end_date
                        ? new Date(client.training_end_date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
                    </span>
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Valore</p>
                <p className="text-xl font-bold text-foreground tabular-nums">{formatEuro(contractTotal)}</p>
              </div>
            </div>

            {contractTotal > 0 && (
              <div className="space-y-2">
                <div className="flex items-baseline justify-between gap-2 text-[11px]">
                  <span className="text-muted-foreground">
                    Incassato <span className="font-bold text-primary tabular-nums">{formatEuro(totalPaid)}</span>
                  </span>
                  <span className="text-muted-foreground">
                    Residuo <span className="font-bold text-foreground tabular-nums">{formatEuro(contractRemaining)}</span>
                  </span>
                </div>
                <Progress value={contractProgressPct} className="h-2" />
                <p className="text-[10px] text-right text-muted-foreground">{contractProgressPct}% saldato</p>
              </div>
            )}

            {!client.service_sold && (
              <p className="text-[11px] text-muted-foreground rounded-lg bg-secondary/50 p-2">
                Nessun servizio assegnato. Apri la tab <span className="font-semibold text-foreground">Commerciale</span> per impostare servizio e prezzo del contratto.
              </p>
            )}
          </section>
        )}

        {/* Stage + Source selectors */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Fase pipeline</label>
            <Select value={client.pipeline_stage} onValueChange={(v) => handleStageChange(v as PipelineStage)}>
              <SelectTrigger className="mt-2 h-14 rounded-xl border border-border bg-card text-base font-semibold">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: `hsl(var(--${stageColor}))` }} />
                  <SelectValue>{pipelineStageLabel[client.pipeline_stage]}</SelectValue>
                </div>
              </SelectTrigger>
              <SelectContent>
                {PIPELINE_STAGES.map(s => <SelectItem key={s} value={s}>{pipelineStageLabel[s]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Fonte contatto</label>
            <Select value={client.lead_source} onValueChange={(v) => handleSourceChange(v as LeadSource)}>
              <SelectTrigger className="mt-2 h-14 rounded-xl border border-border bg-card text-base font-semibold">
                <SelectValue>{leadSourceLabel[client.lead_source]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {LEAD_SOURCES.map(s => <SelectItem key={s} value={s}>{leadSourceLabel[s]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </section>

        {/* Tabs */}
        <Tabs defaultValue="strategia" className="w-full">
          <TabsList className="grid grid-cols-3 w-full h-12 rounded-xl bg-secondary p-1">
            <TabsTrigger value="strategia" className="rounded-lg text-xs font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm">
              Strategia
            </TabsTrigger>
            <TabsTrigger value="commerciale" className="rounded-lg text-xs font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm">
              Commerciale
            </TabsTrigger>
            <TabsTrigger value="roi" className="rounded-lg text-xs font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm">
              ROI
            </TabsTrigger>
          </TabsList>

          {/* TAB 1 — Strategia / Psicografica */}
          <TabsContent value="strategia" className="space-y-4 mt-4">
            {/* Motivazione Profonda */}
            <section className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-4 space-y-3 shadow-card">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Heart className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">Motivazione Profonda</h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">I 5 Perché</p>
                </div>
              </div>
              <div className="privacy-blur-target">
                <Textarea
                  value={motivator}
                  onChange={(e) => setMotivator(e.target.value)}
                  placeholder="Cosa lo muove davvero? Scava fino al 5° perché…"
                  className="min-h-[90px] rounded-xl bg-card border-border text-sm"
                />
              </div>
            </section>

            {/* Win/Loss */}
            <section className="rounded-2xl border border-border bg-card p-4 space-y-4 shadow-card">
              <h3 className="font-bold text-sm text-foreground">Analisi Win / Loss</h3>

              <div className="rounded-xl border-2 border-warning/30 bg-warning/5 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-warning text-warning-foreground">
                    <Eye className="h-3.5 w-3.5" />
                  </div>
                  <label className="text-xs font-bold uppercase tracking-wider text-warning">Obiezione Dichiarata</label>
                </div>
                <div className="privacy-blur-target">
                  <Textarea
                    value={stated}
                    onChange={(e) => setStated(e.target.value)}
                    placeholder="La scusa di superficie…"
                    className="min-h-[60px] rounded-xl bg-card border-border text-sm"
                  />
                </div>
              </div>

              <div className="rounded-xl border-2 border-destructive/30 bg-destructive/5 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-destructive text-destructive-foreground">
                    <Shield className="h-3.5 w-3.5" />
                  </div>
                  <label className="text-xs font-bold uppercase tracking-wider text-destructive">Obiezione Reale</label>
                </div>
                <div className="privacy-blur-target">
                  <Textarea
                    value={real}
                    onChange={(e) => setReal(e.target.value)}
                    placeholder="La vera causa radice isolata…"
                    className="min-h-[60px] rounded-xl bg-card border-border text-sm"
                  />
                </div>
              </div>
            </section>

            {/* Lead Score guidato + Churn (solo per clienti attivi) */}
            <section className="rounded-2xl border border-border bg-card p-4 space-y-5 shadow-card">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-sm text-foreground">Temperatura Lead Guidata</h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Punteggio Calcolato
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Base fonte ({leadSourceLabel[client.lead_source]}): <span className="font-semibold text-foreground">{baseScore}</span> + Comportamenti: <span className="font-semibold text-foreground">+{behaviorBonus}</span>
                    </p>
                  </div>
                  <LeadScoreBadge score={score} />
                </div>

                {/* Progress bar visiva */}
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${score}%` }}
                  />
                </div>

                {/* Checklist comportamenti oggettivi */}
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Comportamenti osservati
                  </p>

                  <label
                    htmlFor="behavior-responsive"
                    className="flex items-start gap-3 rounded-xl border border-border bg-secondary/40 p-3 cursor-pointer active:bg-secondary transition-smooth"
                  >
                    <Checkbox
                      id="behavior-responsive"
                      checked={behaviorResponsive}
                      onCheckedChange={(v) => setBehaviorResponsive(v === true)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground leading-tight">Risponde tempestivamente (entro poche ore)</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">+10 pt</p>
                    </div>
                  </label>

                  <label
                    htmlFor="behavior-booked"
                    className="flex items-start gap-3 rounded-xl border border-border bg-secondary/40 p-3 cursor-pointer active:bg-secondary transition-smooth"
                  >
                    <Checkbox
                      id="behavior-booked"
                      checked={behaviorBookedSession}
                      onCheckedChange={(v) => setBehaviorBookedSession(v === true)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground leading-tight">Ha fissato la sessione di prova / chiamata</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">+20 pt</p>
                    </div>
                  </label>

                  <label
                    htmlFor="behavior-nomoney"
                    className="flex items-start gap-3 rounded-xl border border-border bg-secondary/40 p-3 cursor-pointer active:bg-secondary transition-smooth"
                  >
                    <Checkbox
                      id="behavior-nomoney"
                      checked={behaviorNoMoneyObjection}
                      onCheckedChange={(v) => setBehaviorNoMoneyObjection(v === true)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground leading-tight">Non ha espresso forti obiezioni sui soldi</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">+10 pt</p>
                    </div>
                  </label>

                  <label
                    htmlFor="behavior-urgency"
                    className="flex items-start gap-3 rounded-xl border border-border bg-secondary/40 p-3 cursor-pointer active:bg-secondary transition-smooth"
                  >
                    <Checkbox
                      id="behavior-urgency"
                      checked={behaviorUrgency}
                      onCheckedChange={(v) => setBehaviorUrgency(v === true)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground leading-tight">Mostra urgenza o forte dolore / motivazione</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">+10 pt</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Rischio di Abbandono — solo per clienti paganti (Closed Won) */}
              {isActiveClient && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" /> Rischio di Abbandono
                  </label>
                  <Select value={churn} onValueChange={(v) => setChurn(v as ChurnRisk)}>
                    <SelectTrigger className="h-12 rounded-xl border border-border bg-card text-sm font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CHURN_RISKS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </section>

            {/* AI Sales Assistant */}
            <AiFollowupGenerator client={client} />
          </TabsContent>

          {/* TAB 2 — Commerciale */}
          <TabsContent value="commerciale" className="space-y-4 mt-4">
            <section className="rounded-2xl border border-border bg-card p-4 space-y-4 shadow-card">
              <h3 className="font-bold text-sm text-foreground">Dati Commerciali</h3>

              {/* Servizio Venduto + Prezzo Effettivo (indipendente dalla Fonte) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl border border-border bg-secondary/30 p-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3" /> Servizio Venduto
                  </label>
                  <Select
                    key={`svc-${formInitialized ? 'r' : 'i'}`}
                    value={serviceSold}
                    onValueChange={(v) => {
                      const next = v as ServiceType;
                      setServiceSold(next);
                      if (CUSTOM_PRICE_SERVICES.includes(next)) {
                        setActualPrice('');
                      }
                    }}
                  >
                    <SelectTrigger className="h-12 rounded-xl bg-card border border-border text-sm font-semibold">
                      <SelectValue placeholder="Seleziona servizio…" />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_GROUPS.map(group => (
                        <SelectGroup key={group.label}>
                          <SelectLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">{group.label}</SelectLabel>
                          {group.items.map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Euro className="h-3 w-3" /> Valore Totale del Contratto (€)
                  </label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={actualPrice}
                    onChange={(e) => setActualPrice(e.target.value)}
                    placeholder="es. 1250"
                    className="h-12 rounded-xl bg-card border border-border text-base font-semibold"
                  />
                </div>

                {/* Incassato Oggi (Acconto o Saldo) — Anti-Double Entry UX */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Receipt className="h-3 w-3" /> Incassato Oggi (Acconto o Saldo)
                  </label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={incassatoOggi}
                    onChange={(e) => setIncassatoOggi(e.target.value)}
                    placeholder="0,00 — opzionale"
                    className="h-12 rounded-xl bg-card border border-border text-base font-semibold"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Se valorizzato, salvando il profilo verrà registrato un movimento d'incasso oggi.
                  </p>
                </div>

                {/* Periodo Percorso */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <CalendarClock className="h-3 w-3" /> Inizio Percorso
                  </label>
                  <Input
                    type="date"
                    value={trainingStart}
                    onChange={(e) => setTrainingStart(e.target.value)}
                    className="h-12 rounded-xl bg-card border border-border text-sm font-semibold"
                  />
                </div>

                {/* Smart Duration: 28gg fissi per servizi short, altrimenti select Mesi */}
                {serviceSold && SHORT_DURATION_SERVICES.includes(serviceSold) ? (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <CalendarClock className="h-3 w-3" /> Durata Percorso
                    </label>
                    <div className="h-12 rounded-xl bg-primary/5 border border-primary/20 flex items-center px-3 text-sm font-semibold text-foreground">
                      28 giorni (auto)
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Durata fissa per <span className="font-semibold text-foreground">{serviceSold}</span>.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <CalendarClock className="h-3 w-3" /> Durata Percorso
                    </label>
                    <Select
                      value={String(contractDuration)}
                      onValueChange={(v) => setContractDuration(Number(v) as ContractDurationMonths)}
                    >
                      <SelectTrigger className="h-12 rounded-xl bg-card border border-border text-sm font-semibold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTRACT_DURATION_OPTIONS.map(o => (
                          <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <p className="sm:col-span-2 text-[10px] text-muted-foreground">
                  La data di fine viene calcolata automaticamente in base al servizio e alla durata. Premi "Salva profilo" in fondo.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3 sm:col-span-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Receipt className="h-3.5 w-3.5" /> Registra Pagamento
                      {clientTransactions.length > 0 && (
                        <span className="ml-1 normal-case tracking-normal text-primary font-bold">
                          · Totale {formatEuro(totalPaid)}
                        </span>
                      )}
                    </label>
                  </div>

                  {/* Contratto Attivo o Warning (eredita strict dal profilo cliente) */}
                  {client.service_sold ? (
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                        <p className="text-[11px] text-foreground leading-tight flex-1 min-w-0">
                          <span className="text-muted-foreground uppercase tracking-wider text-[10px] font-semibold">Contratto Attivo:</span>{' '}
                          <span className="font-bold">{client.service_sold}</span>
                        </p>
                        {contractTotal > 0 && (
                          <span className="text-[10px] font-bold text-primary tabular-nums shrink-0">{contractProgressPct}%</span>
                        )}
                      </div>
                      {contractTotal > 0 && (
                        <>
                          <Progress value={contractProgressPct} className="h-1.5" />
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground tabular-nums">
                            <span>Versato <span className="font-semibold text-foreground">{formatEuro(totalPaid)}</span></span>
                            <span>Residuo <span className="font-semibold text-foreground">{formatEuro(contractRemaining)}</span></span>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-warning/30 bg-warning/10 p-3 flex items-start gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />
                      <p className="text-[11px] text-foreground leading-snug">
                        Nessun servizio assegnato. Modifica il profilo del cliente per attivare il contratto.
                      </p>
                    </div>
                  )}

                  {/* Importo Totale */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Euro className="h-3 w-3" /> Importo Totale
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        placeholder="0,00"
                        className="h-14 rounded-xl bg-secondary border-0 text-2xl font-bold pr-10"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">€</span>
                    </div>
                  </div>

                  {/* Tipo Pagamento */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tipo Pagamento</label>
                    <ToggleGroup
                      type="single"
                      value={payType}
                      onValueChange={(v) => v && setPayType(v as PaymentType)}
                      className="w-full grid grid-cols-3 gap-2"
                    >
                      <ToggleGroupItem
                        value="Unica Soluzione"
                        className="h-12 rounded-xl border border-border data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary text-[11px] font-semibold"
                      >
                        Unica
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value="A Rate"
                        className="h-12 rounded-xl border border-border data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary text-[11px] font-semibold"
                      >
                        A Rate
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value="Ricorrente"
                        className="h-12 rounded-xl border border-border data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary text-[11px] font-semibold"
                      >
                        <Repeat className="h-3 w-3 mr-1" /> Ricorrente
                      </ToggleGroupItem>
                    </ToggleGroup>
                    {payType === 'A Rate' && (
                      <Select value={String(payInstallments)} onValueChange={(v) => setPayInstallments(Number(v))}>
                        <SelectTrigger className="h-11 rounded-xl bg-secondary border-0 text-sm font-semibold mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[2, 3, 4, 5, 6].map(n => (
                            <SelectItem key={n} value={String(n)}>{n} rate</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {payType === 'Ricorrente' && (
                      <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1.5">
                        <Repeat className="h-3 w-3" /> Si ripete automaticamente ogni 28 giorni dal primo pagamento.
                      </p>
                    )}
                  </div>

                  {/* Metodo di Pagamento */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <CreditCard className="h-3 w-3" /> Metodo di Pagamento
                    </label>
                    <Select value={payMethod} onValueChange={(v) => setPayMethod(v as PaymentMethod)}>
                      <SelectTrigger className="h-12 rounded-xl bg-secondary border-0 text-base font-semibold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map(m => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Data del Pagamento */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <CalendarClock className="h-3 w-3" /> Data del Pagamento
                    </label>
                    <Input
                      type="date"
                      value={payDate}
                      max={todayIso()}
                      onChange={(e) => setPayDate(e.target.value)}
                      className="h-12 rounded-xl bg-secondary border-0 text-base font-semibold"
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={handleRegisterPayment}
                    disabled={paySubmitting || !payAmount}
                    className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-semibold"
                  >
                    {paySubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Plus className="h-4 w-4 mr-1.5" />}
                    Registra Pagamento
                  </Button>

                  {/* Piano Pagamenti */}
                  {clientTransactions.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
                          Piano Pagamenti{client.service_sold ? <> · <span className="text-foreground normal-case tracking-normal">{client.service_sold}</span></> : null}
                        </p>
                        {totalPending > 0 && (
                          <p className="text-[10px] font-semibold text-warning shrink-0">
                            In attesa: {formatEuro(totalPending)}
                          </p>
                        )}
                      </div>
                      {clientTransactions.map(t => {
                        const isRecurring = t.payment_type === 'Ricorrente';
                        const isStopped = isRecurring && !t.recurring_active;
                        const isPaid = t.status === 'Saldato';
                        const dueDate = new Date(t.due_date);
                        const todayMid = new Date();
                        todayMid.setHours(0, 0, 0, 0);
                        const dueMid = new Date(dueDate);
                        dueMid.setHours(0, 0, 0, 0);
                        const diff = Math.round((dueMid.getTime() - todayMid.getTime()) / 86400000);
                        const isOverdue = !isPaid && diff < 0;
                        const isImminent = !isPaid && diff >= 0 && diff <= 3;

                        const wrap = isPaid
                          ? 'border-border bg-secondary/40'
                          : isOverdue
                            ? 'border-destructive/40 bg-destructive/5'
                            : isImminent
                              ? 'border-warning/40 bg-warning/5'
                              : 'border-border bg-card';
                        const iconWrap = isPaid
                          ? 'bg-primary/15 text-primary'
                          : isOverdue
                            ? 'bg-destructive/15 text-destructive'
                            : 'bg-warning/15 text-warning';

                        return (
                          <div key={t.id} className={`flex items-center gap-3 rounded-xl border p-2.5 ${wrap}`}>
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconWrap}`}>
                              {isPaid ? <CheckCircle2 className="h-3.5 w-3.5" /> : isRecurring ? <Repeat className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline justify-between gap-2">
                                <p className="font-semibold text-xs text-foreground truncate">
                                  {t.payment_type === 'A Rate'
                                    ? `Rata ${t.installments_count}× ${formatEuro(t.amount)}`
                                    : isRecurring
                                      ? `Ricorrente${isStopped ? ' (interrotto)' : ' · ogni 28g'}`
                                      : 'Unica Soluzione'}
                                  <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">· {t.payment_method}</span>
                                </p>
                                <p className={`font-bold text-xs shrink-0 ${isPaid ? 'text-primary' : 'text-foreground'}`}>{formatEuro(t.amount)}</p>
                              </div>
                              <p className="text-[10px] text-muted-foreground">
                                {isPaid ? 'Saldato il ' : 'Scadenza '}
                                {(isPaid ? new Date(t.payment_date) : dueDate).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
                                {!isPaid && (
                                  <span className={`ml-1.5 font-semibold ${isOverdue ? 'text-destructive' : isImminent ? 'text-warning' : ''}`}>
                                    {isOverdue ? `· in ritardo di ${Math.abs(diff)}g` : diff === 0 ? '· oggi' : `· tra ${diff}g`}
                                  </span>
                                )}
                              </p>
                            </div>
                            {!isPaid && (
                              <button
                                type="button"
                                onClick={() => handleMarkPaid(t.id)}
                                className="flex h-8 shrink-0 items-center gap-1 rounded-lg bg-primary px-2 text-[10px] font-bold uppercase tracking-wider text-primary-foreground hover:bg-primary/90 transition-smooth"
                                aria-label="Segna come saldato"
                              >
                                <CheckCircle2 className="h-3 w-3" /> Salda
                              </button>
                            )}
                            {isRecurring && !isStopped && isPaid && (
                              <button
                                type="button"
                                onClick={() => handleStopRecurring(t.id)}
                                className="flex h-8 shrink-0 items-center gap-1 rounded-lg bg-destructive/10 px-2 text-[10px] font-bold uppercase tracking-wider text-destructive hover:bg-destructive/20 transition-smooth"
                                aria-label="Interrompi pagamento ricorrente"
                              >
                                <Ban className="h-3 w-3" /> Stop
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => openEditTx(t)}
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-smooth"
                              aria-label="Modifica pagamento"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingTxId(t.id)}
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-smooth"
                              aria-label="Elimina pagamento"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        );
                      })}

                      {/* Riepilogo Contratto */}
                      <div className="mt-2 grid grid-cols-3 gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3">
                        <div>
                          <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Totale Contratto</p>
                          <p className="mt-0.5 text-sm font-bold text-foreground tabular-nums">{formatEuro(contractTotal)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Versato</p>
                          <p className="mt-0.5 text-sm font-bold text-primary tabular-nums">{formatEuro(totalPaid)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Residuo</p>
                          <p className={`mt-0.5 text-sm font-bold tabular-nums ${contractRemaining > 0 ? 'text-warning' : 'text-foreground'}`}>{formatEuro(contractRemaining)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" /> Ultimo Contatto
                  </label>
                  <Input
                    type="date"
                    value={lastContact}
                    onChange={(e) => setLastContact(e.target.value)}
                    className="h-12 rounded-xl bg-secondary border-0 text-base"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Usato dal motore di automazione per i follow-up a 1, 3, 7 giorni.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-4 space-y-4 shadow-card">
              <h3 className="font-bold text-sm text-foreground">Anagrafica & Iscrizione</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nome</label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="es. Mario"
                    className="h-12 rounded-xl bg-secondary border-0 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cognome</label>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="es. Rossi"
                    className="h-12 rounded-xl bg-secondary border-0 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Telefono</label>
                  <Input
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="es. +39 333 1234567"
                    className="h-12 rounded-xl bg-secondary border-0 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</label>
                  <Input
                    type="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="es. mario@email.it"
                    className="h-12 rounded-xl bg-secondary border-0 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data di nascita</label>
                  <Input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="h-12 rounded-xl bg-secondary border-0 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sesso</label>
                  <Select key={`gnd-${formInitialized ? 'r' : 'i'}`} value={gender} onValueChange={(v) => setGender(v as Gender)}>
                    <SelectTrigger className="h-12 rounded-xl bg-secondary border-0 text-base font-semibold">
                      <SelectValue placeholder="Seleziona…" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDERS.map(g => <SelectItem key={g} value={g}>{genderLabel[g]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Iscrizione palestra</label>
                  <Input
                    type="date"
                    value={gymSignup}
                    onChange={(e) => setGymSignup(e.target.value)}
                    className="h-12 rounded-xl bg-secondary border-0 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Scadenza abbonamento</label>
                  <Input
                    type="date"
                    value={gymExpiry}
                    onChange={(e) => setGymExpiry(e.target.value)}
                    className="h-12 rounded-xl bg-secondary border-0 text-base"
                  />
                </div>
              </div>

              <label className="flex items-start gap-3 rounded-xl border border-border bg-secondary/40 p-3 cursor-pointer hover:bg-secondary/60 transition-smooth mt-2">
                <Checkbox
                  checked={gdprConsent}
                  onCheckedChange={(v) => setGdprConsent(v === true)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    <span className="text-sm font-semibold text-foreground">Consenso Privacy & Marketing Acquisito</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Necessario per attivare l'AI Sales Assistant e l'invio di follow-up.
                  </p>
                </div>
              </label>
            </section>
          </TabsContent>

          {/* TAB 3 — ROI */}
          <TabsContent value="roi" className="space-y-4 mt-4">
            <section className="rounded-2xl border border-border bg-card p-4 space-y-4 shadow-card">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">Risultati Quantificabili</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Prove concrete del valore. Mostrale al cliente prima del rinnovo.
                  </p>
                </div>
              </div>

              {/* Grafico progressi */}
              {(client.roi_metrics?.length ?? 0) > 0 && (
                <RoiChart metrics={client.roi_metrics!} clientName={client.name} />
              )}

              {/* Lista metriche */}
              <div className="space-y-2">
                {(client.roi_metrics?.length ?? 0) === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-6 text-center">
                    <p className="text-xs text-muted-foreground">
                      Nessuna metrica registrata. Aggiungi il primo risultato qui sotto.
                    </p>
                  </div>
                ) : (
                  client.roi_metrics!.map(m => (
                    <div key={m.id} className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 p-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="font-semibold text-sm text-foreground truncate">{m.metric}</p>
                          <p className="font-bold text-sm text-primary shrink-0">{m.value}</p>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(m.date).toLocaleDateString('it-IT')}
                          {m.note ? ` · ${m.note}` : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveRoi(m.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-smooth"
                        aria-label="Rimuovi metrica"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Form aggiunta */}
              <div className="rounded-xl border border-border bg-secondary/30 p-3 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nuova metrica</p>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={metricName}
                    onChange={(e) => setMetricName(e.target.value)}
                    placeholder="Metrica (es. Squat 1RM)"
                    className="h-11 rounded-xl bg-card border-border text-sm"
                  />
                  <Input
                    value={metricValue}
                    onChange={(e) => setMetricValue(e.target.value)}
                    placeholder="Valore (es. +10kg)"
                    className="h-11 rounded-xl bg-card border-border text-sm"
                  />
                </div>
                <Input
                  value={metricNote}
                  onChange={(e) => setMetricNote(e.target.value)}
                  placeholder="Nota (opzionale)"
                  className="h-11 rounded-xl bg-card border-border text-sm"
                />
                <Button
                  onClick={handleAddRoi}
                  className="w-full h-11 rounded-xl gradient-primary text-primary-foreground font-semibold"
                >
                  <Plus className="h-4 w-4 mr-1.5" /> Aggiungi Risultato
                </Button>
              </div>

              {!isActiveClient && (
                <p className="text-[11px] text-muted-foreground text-center">
                  Il modulo ROI ha massimo impatto quando il lead è già "Cliente Attivo".
                </p>
              )}
            </section>
          </TabsContent>
        </Tabs>

        <Button
          onClick={handleSave}
          className="w-full h-14 rounded-xl text-base font-semibold gradient-primary text-primary-foreground shadow-glow"
        >
          Salva Modifiche
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 rounded-xl text-sm font-semibold border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-1.5" /> Elimina cliente
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminare {client.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                L'operazione è irreversibile. Verranno cancellati anche pagamenti, metriche ROI e dati anagrafici associati.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Annulla</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteClient}
                className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Elimina definitivamente
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit Transaction Dialog */}
        <Dialog open={!!editingTx} onOpenChange={(o) => !o && setEditingTx(null)}>
          <DialogContent className="rounded-2xl max-w-md">
            <DialogHeader>
              <DialogTitle>Modifica pagamento</DialogTitle>
              <DialogDescription>
                Aggiorna importo, date e stato di questa transazione. Le modifiche aggiornano subito i grafici e i widget Lordo/Netto.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Euro className="h-3 w-3" /> Importo
                </label>
                <Input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="h-12 rounded-xl bg-secondary border-0 text-base font-semibold"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Stato</label>
                <Select value={editStatus} onValueChange={(v) => setEditStatus(v as TransactionStatus)}>
                  <SelectTrigger className="h-12 rounded-xl bg-secondary border-0 text-base font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSACTION_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <CalendarClock className="h-3 w-3" /> Scadenza prevista
                </label>
                <Input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="h-12 rounded-xl bg-secondary border-0 text-base"
                />
              </div>
              {editStatus === 'Saldato' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3" /> Data incasso effettivo
                  </label>
                  <Input
                    type="date"
                    value={editPaymentDate}
                    onChange={(e) => setEditPaymentDate(e.target.value)}
                    className="h-12 rounded-xl bg-secondary border-0 text-base"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Modificare questa data ricalcola Fatturato Lordo e Netto del mese corrispondente.
                  </p>
                </div>
              )}
              {editingTx && editingTx.installments_count > 1 && (
                <p className="text-[10px] text-muted-foreground rounded-lg bg-secondary/60 p-2">
                  Questa è una rata di un piano da {editingTx.installments_count}. Le modifiche si applicano solo a questa rata.
                </p>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setEditingTx(null)} className="rounded-xl">Annulla</Button>
              <Button
                onClick={handleSaveEditTx}
                disabled={editSubmitting}
                className="rounded-xl gradient-primary text-primary-foreground"
              >
                {editSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                Salva modifiche
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Transaction AlertDialog */}
        <AlertDialog open={!!deletingTxId} onOpenChange={(o) => !o && setDeletingTxId(null)}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminare questo pagamento?</AlertDialogTitle>
              <AlertDialogDescription>
                Sei sicuro di voler eliminare questo pagamento? L'operazione è irreversibile e aggiornerà immediatamente i totali e i grafici.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Annulla</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deletingTxId && handleDeleteTx(deletingTxId)}
                className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Elimina pagamento
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default ClientDetail;
