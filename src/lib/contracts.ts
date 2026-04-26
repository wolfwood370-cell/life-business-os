import {
  ContractDurationMonths,
  ServiceType,
  SHORT_DURATION_SERVICES,
  NO_DURATION_SERVICES,
} from '@/types/crm';

export const parseCurrencyInput = (value: string): number | undefined => {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
};

// Un "mese commerciale" dura 28 giorni (4 settimane).
export const DAYS_PER_MONTH = 28;

export const computeContractEndDate = (
  startYmd: string,
  service: ServiceType | undefined,
  months: ContractDurationMonths,
): string | undefined => {
  if (!startYmd) return undefined;
  if (service && NO_DURATION_SERVICES.includes(service)) return undefined;

  const [year, month, day] = startYmd.split('-').map(Number);
  if (!year || !month || !day) return undefined;

  const end = new Date(Date.UTC(year, month - 1, day));
  const days = (service && SHORT_DURATION_SERVICES.includes(service))
    ? DAYS_PER_MONTH
    : months * DAYS_PER_MONTH;
  end.setUTCDate(end.getUTCDate() + days);

  return `${end.getUTCFullYear()}-${String(end.getUTCMonth() + 1).padStart(2, '0')}-${String(end.getUTCDate()).padStart(2, '0')}`;
};
