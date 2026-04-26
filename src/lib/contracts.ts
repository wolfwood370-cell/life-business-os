import {
  ContractDurationMonths,
  ServiceType,
  SHORT_DURATION_SERVICES,
} from '@/types/crm';

export const parseCurrencyInput = (value: string): number | undefined => {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const computeContractEndDate = (
  startYmd: string,
  service: ServiceType | undefined,
  months: ContractDurationMonths,
): string | undefined => {
  if (!startYmd) return undefined;
  const [year, month, day] = startYmd.split('-').map(Number);
  if (!year || !month || !day) return undefined;

  const end = new Date(Date.UTC(year, month - 1, day));
  if (service && SHORT_DURATION_SERVICES.includes(service)) {
    end.setUTCDate(end.getUTCDate() + 28);
  } else {
    end.setUTCMonth(end.getUTCMonth() + months);
  }

  return `${end.getUTCFullYear()}-${String(end.getUTCMonth() + 1).padStart(2, '0')}-${String(end.getUTCDate()).padStart(2, '0')}`;
};