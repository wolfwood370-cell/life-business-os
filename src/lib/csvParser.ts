// ============ Phase 28: CSV Parser estendibile ============
// Mock parser generico CSV con architettura pronta per parser banca-specifici.
// Futuri parser: parseBancaSella(rows), parseHype(rows), ecc.

export interface ParsedRow {
  date: string;          // ISO
  description: string;
  amount: number;        // sempre positivo
  type: 'credit' | 'debit';
  external_ref?: string;
}

export type BankFormat = 'generic' | 'banca-sella' | 'hype';

// Parsing CSV semplice: gestisce virgolette e virgole interne.
const parseCsvLine = (line: string): string[] => {
  const out: string[] = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuote = !inQuote;
    } else if ((c === ',' || c === ';') && !inQuote) {
      out.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out.map(s => s.trim());
};

// Tenta di parsare un numero in formato italiano (1.234,56) o internazionale (1234.56)
const parseAmount = (raw: string): number => {
  const s = raw.replace(/[^0-9,.\-]/g, '').trim();
  if (!s) return 0;
  const hasComma = s.includes(',');
  const hasDot = s.includes('.');
  let normalized = s;
  if (hasComma && hasDot) {
    // formato IT: 1.234,56  → rimuovo punti, sostituisco virgola
    normalized = s.replace(/\./g, '').replace(',', '.');
  } else if (hasComma) {
    normalized = s.replace(',', '.');
  }
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
};

// Tenta di parsare la data (DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD)
const parseDate = (raw: string): string | null => {
  const s = raw.trim();
  if (!s) return null;
  // ISO già pronto
  const iso = new Date(s);
  if (!Number.isNaN(iso.getTime()) && /^\d{4}-\d{2}-\d{2}/.test(s)) {
    return iso.toISOString();
  }
  // DD/MM/YYYY o DD-MM-YYYY
  const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (m) {
    let [_, dd, mm, yyyy] = m;
    if (yyyy.length === 2) yyyy = '20' + yyyy;
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd), 12, 0, 0);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return null;
};

// Identifica colonne in un header generico
const detectColumns = (headers: string[]): {
  date?: number; description?: number; amount?: number; credit?: number; debit?: number;
} => {
  const lower = headers.map(h => h.toLowerCase().trim());
  const find = (...keys: string[]) => lower.findIndex(h => keys.some(k => h.includes(k)));
  return {
    date: find('data', 'date'),
    description: find('descri', 'causale', 'desc', 'memo'),
    amount: find('importo', 'amount', 'totale'),
    credit: find('entrate', 'accredito', 'credit', 'avere'),
    debit: find('uscite', 'addebito', 'debit', 'dare'),
  };
};

export const parseCsv = (text: string, _format: BankFormat = 'generic'): ParsedRow[] => {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]);
  const cols = detectColumns(headers);

  if (cols.date === -1 || cols.date === undefined) {
    // Fallback: prima colonna = data, seconda = descrizione, terza = importo
    cols.date = 0;
    cols.description = 1;
    cols.amount = 2;
  }

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    const dateRaw = cells[cols.date!] ?? '';
    const date = parseDate(dateRaw);
    if (!date) continue;

    const description = (cells[cols.description ?? -1] ?? '').trim() || 'Movimento';

    let amount = 0;
    let type: 'credit' | 'debit' = 'debit';
    if (cols.credit !== undefined && cols.credit !== -1 && cells[cols.credit]) {
      const c = parseAmount(cells[cols.credit]);
      if (c > 0) { amount = c; type = 'credit'; }
    }
    if (amount === 0 && cols.debit !== undefined && cols.debit !== -1 && cells[cols.debit]) {
      const d = parseAmount(cells[cols.debit]);
      if (d > 0) { amount = d; type = 'debit'; }
    }
    if (amount === 0 && cols.amount !== undefined && cols.amount !== -1) {
      const raw = parseAmount(cells[cols.amount]);
      amount = Math.abs(raw);
      type = raw < 0 ? 'debit' : 'credit';
    }

    if (amount === 0) continue;

    rows.push({
      date,
      description,
      amount,
      type,
      external_ref: `${dateRaw}|${description}|${amount}`,
    });
  }

  return rows;
};
