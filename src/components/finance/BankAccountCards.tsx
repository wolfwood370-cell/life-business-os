import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { useCrm } from '@/store/useCrm';
import { formatEuro, BankAccount, FinancialMovement } from '@/types/crm';
import { PrivacyMask } from '@/components/crm/PrivacyMask';
import { Wallet, Building2, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccountStat {
  account: BankAccount;
  credits: number;
  debits: number;
  net: number;
  count: number;
}

const accountIcon = (name: string) => {
  if (name.toLowerCase().includes('business')) return Building2;
  return Wallet;
};

interface Props {
  year: number;
  month: number; // 0-11
}

export const BankAccountCards = ({ year, month }: Props) => {
  const { bankAccounts, movements } = useCrm();

  const stats = useMemo<AccountStat[]>(() => {
    const monthStart = new Date(year, month, 1).getTime();
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999).getTime();
    const inMonth = movements.filter((mv: FinancialMovement) => {
      const t = new Date(mv.date).getTime();
      return t >= monthStart && t <= monthEnd;
    });
    return bankAccounts.map(account => {
      const list = inMonth.filter(mv => mv.account_id === account.id);
      const credits = list.filter(mv => mv.type === 'credit').reduce((s, mv) => s + mv.amount, 0);
      const debits = list.filter(mv => mv.type === 'debit').reduce((s, mv) => s + mv.amount, 0);
      return {
        account,
        credits,
        debits,
        net: credits - debits,
        count: list.length,
      };
    });
  }, [bankAccounts, movements, year, month]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {stats.map(({ account, credits, debits, net, count }) => {
        const Icon = accountIcon(account.name);
        const isBusiness = account.type === 'business';
        return (
          <Card
            key={account.id}
            className={cn(
              'p-4 border-l-4 transition-shadow hover:shadow-md',
              isBusiness ? 'border-l-primary' : 'border-l-muted-foreground/40',
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Icon className="h-4 w-4 text-muted-foreground" />
                {account.name}
              </div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
                {count} mov.
              </span>
            </div>

            <div className="space-y-1.5 mb-3">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <ArrowUp className="h-3 w-3 text-emerald-600" /> Entrate
                </span>
                <PrivacyMask>
                  <span className="font-mono tabular-nums text-emerald-600">
                    +{formatEuro(credits)}
                  </span>
                </PrivacyMask>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <ArrowDown className="h-3 w-3 text-rose-600" /> Uscite
                </span>
                <PrivacyMask>
                  <span className="font-mono tabular-nums text-rose-600">
                    −{formatEuro(debits)}
                  </span>
                </PrivacyMask>
              </div>
            </div>

            <div className="pt-3 border-t flex items-baseline justify-between">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Saldo mese</span>
              <PrivacyMask>
                <span className={cn(
                  'font-mono tabular-nums text-lg font-semibold',
                  net >= 0 ? 'text-emerald-600' : 'text-rose-600',
                )}>
                  {net >= 0 ? '+' : '−'}{formatEuro(Math.abs(net))}
                </span>
              </PrivacyMask>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
