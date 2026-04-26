import { LeadSource } from '@/types/crm';

export const baseLeadScore = (source: LeadSource): number => {
  switch (source) {
    case 'Referral': return 85;
    case 'Gym-provided': return 50;
    case 'Gym Floor': return 40;
    case 'Social Media': return 25;
    case 'Other': return 30;
    default: return 50;
  }
};
