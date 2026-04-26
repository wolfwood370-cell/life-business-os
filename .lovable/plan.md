## Diagnosi

Il messaggio resta visibile perché la sezione **Registra pagamento** legge esclusivamente `client.service_sold` dal profilo cliente. Per il cliente attuale (`Alan Spagnolo`) il database contiene ancora:

```text
service_sold: null
actual_price: null
training_start_date: null
training_end_date: null
```

Il pagamento è stato invece salvato correttamente come transazione:

```text
amount: 450
payment_type: Unica Soluzione
status: Saldato
```

ma il movimento contabile generato ha ereditato un contratto vuoto:

```text
description: Rata - Servizio
service_sold: null
actual_price: 450
```

### Perché succede

Ci sono due cause principali:

1. **Registrare un pagamento non assegna automaticamente un contratto.**
   La funzione `handleRegisterPayment` crea solo una transazione. Il servizio viene recuperato dal profilo cliente già salvato. Se il profilo ha `service_sold = null`, anche la transazione e il ledger restano senza servizio.

2. **Possibile UX disallineata tra campi modificati e stato salvato.**
   Se l’utente seleziona un servizio nella tab Commerciale ma poi clicca direttamente **Registra Pagamento** nella stessa schermata, il pagamento parte prima che i campi contratto vengano persistiti sul cliente. Il sistema quindi legge ancora `service_sold = null` e mostra “Nessun servizio assegnato”.

Nota tecnica aggiuntiva: nei log c’è anche un warning React sui `<Select>` che passano da uncontrolled a controlled. Non è la causa primaria del bug, ma può rendere meno affidabile la percezione dello stato del form e va ripulito.

## Soluzione proposta

### 1. Rendere “Registra Pagamento” contract-aware

In `ClientDetail.tsx`, prima di creare la transazione:

- calcolare un `effectiveService` usando prima il valore salvato su `client.service_sold`, poi il valore appena selezionato nel form `serviceSold`;
- se esiste un servizio selezionato ma non ancora salvato, salvare prima il profilo cliente con:
  - `service_sold`
  - `actual_price`
  - `training_start_date`
  - `training_end_date`
- attendere il completamento di `updateClient` prima di chiamare `addTransaction`.

Flusso corretto:

```text
Utente seleziona servizio/prezzo/date
        ↓
Clicca “Registra Pagamento”
        ↓
Salva contratto cliente se necessario
        ↓
Crea pagamento
        ↓
Ledger eredita il servizio corretto
        ↓
UI mostra “Contratto Attivo”
```

### 2. Bloccare il pagamento se manca davvero il servizio

Se non esiste né `client.service_sold` né `serviceSold` nel form:

- mostrare un messaggio chiaro: “Seleziona prima un servizio nella sezione Dati Commerciali.”
- non registrare il pagamento con contratto vuoto.

Questo evita altri movimenti “Rata - Servizio” senza contesto.

### 3. Aggiornare `addTransaction` per accettare il servizio effettivo come fallback sicuro

In `crmContext.ts` e `crmStore.tsx`, estendere il payload interno di `addTransaction` con campi opzionali:

- `service_sold?: string`
- `actual_price?: number`

Poi in `addTransactionMutation`:

- leggere comunque il contratto dal cliente come fonte principale;
- usare il servizio passato dal form solo come fallback quando il database non è ancora aggiornato;
- aggiornare `financial_movements.description` in modo professionale: `Rata - [Nome Servizio]`.

Questo rende la logica robusta anche in caso di latenza/invalidation della cache.

### 4. Aggiornare subito la cache cliente dopo `updateClient`

Dopo il salvataggio del contratto, invalidare e/o aggiornare in modo ottimistico la query `['crm', 'clients']`, così la schermata non continua a leggere il vecchio `client.service_sold = null` fino al refetch successivo.

### 5. Correggere i warning UI correlati

- Normalizzare i valori dei `<Select>` per non passare `undefined` come `value` controllato.
- Sistemare l’uso di `AlertDialogFooter` dentro componenti Radix con `asChild` o ref, perché il log mostra: “Function components cannot be given refs”.

### 6. Verifica finale

Dopo la correzione controllerò che:

- assegnando un servizio e registrando pagamento nella stessa sessione, il cliente abbia `service_sold` salvato;
- la sezione **Registra Pagamento** mostri “Contratto Attivo: [servizio]”;
- il movimento contabile non sia più `Rata - Servizio`, ma `Rata - [servizio]`;
- il caso `Percorso Online` / `Founders Circle` continui a funzionare con prezzo custom editabile;
- non compaiano più warning React principali nella console per questa schermata.