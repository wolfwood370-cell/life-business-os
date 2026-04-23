import { LeadSource } from '@/types/crm';

export const baseLeadScore = (source: LeadSource): number => {
  switch (source) {
    case 'Referral': return 85;
    case 'PT Pack 99€': return 70;
    case 'Gym-provided': return 50;
    case 'Gym Floor': return 40;
    case 'Social Media': return 25;
    default: return 50;
  }
};
