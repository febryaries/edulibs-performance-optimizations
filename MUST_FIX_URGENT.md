# 🚨 PROBLEME CRITICE DE PERFORMANȚĂ - URGENT

## 📊 Situația Actuală

**Problema**: Platforma pică la 100-150 utilizatori online simultan.

**Cauza**: Număr excesiv de requesturi către baza de date Supabase.

**Impact**:

- ~50-100 requesturi/secundă cu 100 useri activi
- Timeout-uri și erori la încărcarea datelor
- Experiență utilizator foarte slabă
- Costuri Supabase crescute (probabil depășire limită)

---

## 🔍 Problemele Identificate

### 1. **Lipsă Caching în TanStack Query**

**Locație**: `src/hooks/use-crud.ts`

**Problema**: Fiecare interacțiune face un query nou la baza de date, chiar dacă datele nu s-au schimbat.

**Impact**: 10x mai multe requesturi decât necesar

**Cod actual**:

```typescript
const useList = (params, controllerConfig) =>
  useQuery({
    queryKey: [queryKey, params, controllerConfig],
    queryFn: async () => {
      /* ... */
    },
    placeholderData: (prev: any) => prev,
    // LIPSEȘTE: staleTime și gcTime
  });
```

---

### 2. **Invalidare Agresivă a Cache-ului**

**Locație**: `src/hooks/use-crud.ts` (liniile 93-125)

**Problema**: La orice update/create/delete, se invalidează TOATE query-urile, nu doar cele afectate.

**Impact**: La fiecare modificare, toți userii reîncarcă toate datele

**Cod actual**:

```typescript
const useUpdate = useMutation({
  mutationFn: ({ id, record }) => controller.update(id, record),
  onSuccess: (_, vars) => {
    queryClient.invalidateQueries({ queryKey: [queryKey, vars.id] });
    queryClient.invalidateQueries({ queryKey: [queryKey] }); // ❌ INVALIDEAZĂ TOT
  },
});
```

---

### 3. **Debounce Prea Scurt pentru Search**

**Locație**: `src/hooks/use-data.ts` (linia 129)

**Problema**: La fiecare 300ms de typing, se face un request la DB.

**Impact**: 5-10 requesturi pentru o singură căutare

**Cod actual**:

```typescript
const debouncedQueryParams = useDebounce(constructedQueryParams, 300); // ❌ Prea scurt
```

---

### 4. **Relații Excesive Încărcate**

**Locație**: `src/hooks/use-controllers.ts` (liniile 403-415)

**Problema**: Pentru fiecare resursă din listă, se încarcă autor, mentor, evaluator, clasă, disciplină, competențe.

**Impact**: N+1 query problem - pentru 20 resurse = 100+ queries

**Cod actual**:

```typescript
export const resourceRelationMap = {
  resources_author_id_fkey: {
    alias: "author",
    referencedTable: "users",
    isOneToMany: false,
  },
  resources_mentor_id_fkey: {
    alias: "mentor",
    referencedTable: "users",
    isOneToMany: false,
  },
  resources_evaluator_id_fkey: {
    alias: "evaluator",
    referencedTable: "users",
    isOneToMany: false,
  },
  resources_class_id_fkey: {
    alias: "class",
    referencedTable: "classes",
    isOneToMany: false,
  },
  resources_discipline_id_fkey: {
    alias: "discipline",
    referencedTable: "disciplines",
    isOneToMany: false,
  },
  resource_competency_resource_id_fkey: {
    alias: "specific_competencies",
    referencedTable: "resource_competency",
    isOneToMany: true,
    nested: "competency:specific_competencies(*)", // ❌ Nested query
  },
};
```

---

### 5. **Select \* (Toate Câmpurile)**

**Locație**: `src/app/dashboard/page.tsx`, `src/hooks/use-controllers.ts`

**Problema**: Se selectează toate câmpurile (`*`) în loc doar de cele necesare.

**Impact**: Transfer de date inutil, încărcare mai lentă

**Exemplu**:

```typescript
super(client, "resources", {
  fields: ["*"], // ❌ Toate câmpurile
  relationMap: resourceRelationMap,
});
```

---

### 6. **Lipsă Indexuri în Baza de Date**

**Locație**: Supabase Database

**Problema**: Probabil nu există indexuri pe coloanele frecvent filtrate/sortate.

**Impact**: Query-uri lente, full table scan

**Coloane care necesită indexuri**:

- `resources.status`
- `resources.author_id`
- `resources.evaluator_id`
- `resources.created_at`
- `resources.updated_at`
- `resources.discipline_id`
- `resources.class_id`

---

### 7. **Refetch pe Fiecare URL Change**

**Locație**: `src/app/dashboard/page.tsx` (liniile 151-187)

**Problema**: La fiecare schimbare de URL (resource_id), se face un fetch nou.

**Impact**: Requesturi duplicate când utilizatorul navighează înainte/înapoi

---

## 🔧 SOLUȚII URGENTE (2-3 ore implementare)

### ✅ FIX 1: Activare Caching (PRIORITATE 1)

**Fișier**: `src/hooks/use-crud.ts`

**Modificare**:

```typescript
const useList = (params, controllerConfig) =>
  useQuery({
    queryKey: [queryKey, params, controllerConfig],
    queryFn: async () => {
      /* ... */
    },
    placeholderData: (prev: any) => prev,
    staleTime: 5 * 60 * 1000, // ✅ 5 minute - datele rămân fresh
    gcTime: 10 * 60 * 1000, // ✅ 10 minute - păstrare în cache
  });

const useById = (id) =>
  useQuery({
    queryKey: [queryKey, id],
    queryFn: () => controller.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // ✅ 5 minute cache
    gcTime: 10 * 60 * 1000, // ✅ 10 minute
  });
```

**Impact**: Reducere 70-80% requesturi

---

### ✅ FIX 2: Invalidare Selectivă (PRIORITATE 1)

**Fișier**: `src/hooks/use-crud.ts`

**Modificare**:

```typescript
const useUpdate = useMutation({
  mutationFn: ({ id, record }) => controller.update(id, record),
  onSuccess: (_, vars) => {
    // ✅ Doar invalidează query-ul specific
    queryClient.invalidateQueries({ queryKey: [queryKey, vars.id] });
    // ❌ NU mai invalida tot cache-ul
    // queryClient.invalidateQueries({ queryKey: [queryKey] });
  },
});

const useCreate = useMutation({
  mutationFn: (record) => controller.create(record),
  onSuccess: () => {
    // ✅ Doar pentru create, invalidăm lista (pentru a apărea noul item)
    queryClient.invalidateQueries({ queryKey: [queryKey], exact: false });
  },
});

const useDelete = useMutation({
  mutationFn: (id) => controller.delete?.(id),
  onSuccess: (_, id) => {
    // ✅ Invalidăm item-ul șters și lista
    queryClient.removeQueries({ queryKey: [queryKey, id] });
    queryClient.invalidateQueries({ queryKey: [queryKey], exact: false });
  },
});
```

**Impact**: Reducere 50% requesturi la modificări

---

### ✅ FIX 3: Debounce Mai Lung (PRIORITATE 1)

**Fișier**: `src/hooks/use-data.ts`

**Modificare**:

```typescript
// Linia 129
const debouncedQueryParams = useDebounce(constructedQueryParams, 800); // ✅ 300ms → 800ms
```

**Impact**: Reducere 60% requesturi la search

---

## 🟡 SOLUȚII IMPORTANTE (1 zi implementare)

### ✅ FIX 4: Lazy Loading Relații

**Fișier**: `src/hooks/use-controllers.ts`

**Creează două map-uri separate**:

```typescript
// Pentru listă (minimal)
export const resourceListRelationMap = {
  resources_author_id_fkey: {
    alias: "author",
    referencedTable: "users",
    isOneToMany: false,
  },
  // Doar autor, fără mentor, evaluator, competențe
} as const;

// Pentru detalii (complet)
export const resourceDetailRelationMap = {
  resources_author_id_fkey: {
    alias: "author",
    referencedTable: "users",
    isOneToMany: false,
  },
  resources_mentor_id_fkey: {
    alias: "mentor",
    referencedTable: "users",
    isOneToMany: false,
  },
  resources_evaluator_id_fkey: {
    alias: "evaluator",
    referencedTable: "users",
    isOneToMany: false,
  },
  resources_class_id_fkey: {
    alias: "class",
    referencedTable: "classes",
    isOneToMany: false,
  },
  resources_discipline_id_fkey: {
    alias: "discipline",
    referencedTable: "disciplines",
    isOneToMany: false,
  },
  resource_competency_resource_id_fkey: {
    alias: "specific_competencies",
    referencedTable: "resource_competency",
    isOneToMany: true,
    nested: "competency:specific_competencies(*)",
  },
} as const;
```

**Folosire**:

```typescript
// În listă
<DataTable
  controllerConfig={{
    relations: resourceListRelationMap, // ✅ Minimal
  }}
/>;

// În viewer/form
const resource = useResourceById(id, {
  relations: resourceDetailRelationMap, // ✅ Complet
});
```

**Impact**: Reducere 70% date transferate în listă

---

### ✅ FIX 5: Select Doar Câmpuri Necesare

**Fișier**: `src/app/dashboard/page.tsx`

**Modificare**:

```typescript
<DataTable
  controllerConfig={{
    fields: [
      "id",
      "title",
      "status",
      "created_at",
      "updated_at",
      "author_id",
      "discipline_id",
      "class_id",
    ], // ✅ Nu '*'
    relations: resourceListRelationMap,
  }}
/>
```

**Impact**: Reducere 40% dimensiune răspuns

---

### ✅ FIX 6: Indexuri în Supabase

**Creează migrație nouă**:

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_add_performance_indexes.sql

-- Index pentru status (filtru frecvent)
CREATE INDEX IF NOT EXISTS idx_resources_status
ON resources(status);

-- Index pentru author_id (filtru + join)
CREATE INDEX IF NOT EXISTS idx_resources_author_id
ON resources(author_id);

-- Index pentru evaluator_id (filtru)
CREATE INDEX IF NOT EXISTS idx_resources_evaluator_id
ON resources(evaluator_id);

-- Index pentru created_at (sortare)
CREATE INDEX IF NOT EXISTS idx_resources_created_at
ON resources(created_at DESC);

-- Index pentru discipline_id (filtru)
CREATE INDEX IF NOT EXISTS idx_resources_discipline_id
ON resources(discipline_id);

-- Index pentru class_id (filtru)
CREATE INDEX IF NOT EXISTS idx_resources_class_id
ON resources(class_id);

-- Index compus pentru filtrări multiple
CREATE INDEX IF NOT EXISTS idx_resources_status_author
ON resources(status, author_id);

-- Index pentru search text (dacă există câmp title)
CREATE INDEX IF NOT EXISTS idx_resources_title_gin
ON resources USING gin(to_tsvector('romanian', title));
```

**Rulare**:

```bash
supabase db push
```

**Impact**: Reducere 80% timp query

---

## 🟢 OPTIMIZĂRI SUPLIMENTARE (2-3 zile)

### 7. Virtual Scrolling pentru Liste Mari

**Library**: `@tanstack/react-virtual`

### 8. Service Worker pentru Cache Static

**Tool**: Workbox

### 9. Prefetch pentru Navigare

**TanStack Query**: `prefetchQuery`

### 10. Compression Gzip/Brotli

**Next.js**: Activat automat în producție

---

## 📈 Rezultate Așteptate

### Înainte de Fix:

- ❌ 50-100 requesturi/secundă (100 useri)
- ❌ Platformă pică la 100-150 useri
- ❌ Timp încărcare: 3-5 secunde
- ❌ Cost Supabase: ~$100-150/lună

### După Fix Urgent (2-3 ore):

- ✅ 10-20 requesturi/secundă (100 useri) → **Reducere 80%**
- ✅ Platformă stabilă până la 200-300 useri
- ✅ Timp încărcare: 0.5-1 secundă
- ✅ Cost Supabase: ~$30-50/lună → **Economie $70-100/lună**

### După Fix Complet (5-7 zile):

- ✅ 5-10 requesturi/secundă (100 useri) → **Reducere 90%**
- ✅ Platformă stabilă până la 500-1000 useri
- ✅ Timp încărcare: <0.5 secunde
- ✅ Cost Supabase: ~$20-30/lună → **Economie $80-130/lună**

---

## 🎯 Plan de Acțiune

### Faza 1: URGENT (Astăzi - 2-3 ore)

- [ ] FIX 1: Activare caching TanStack Query
- [ ] FIX 2: Invalidare selectivă
- [ ] FIX 3: Debounce mai lung pentru search
- [ ] Test cu 50-100 useri simulați

### Faza 2: IMPORTANT (Mâine - 1 zi)

- [ ] FIX 4: Lazy loading relații
- [ ] FIX 5: Select doar câmpuri necesare
- [ ] FIX 6: Creeare indexuri în Supabase
- [ ] Test cu 100-200 useri simulați

### Faza 3: NICE TO HAVE (Săptămâna viitoare - 2-3 zile)

- [ ] Virtual scrolling
- [ ] Service Worker
- [ ] Prefetch
- [ ] Monitoring și alerting
- [ ] Test cu 500+ useri simulați

---

## 🔍 Monitoring După Fix

### Metrici de urmărit:

1. **Supabase Dashboard**:

   - Requesturi/secundă
   - Query duration
   - Connection pool usage

2. **Browser DevTools**:

   - Network requests count
   - Time to Interactive (TTI)
   - First Contentful Paint (FCP)

3. **TanStack Query DevTools**:
   - Cache hit rate
   - Query invalidations
   - Stale queries

### Alerte:

- Requesturi/secundă > 20 (cu 100 useri)
- Query duration > 500ms
- Cache hit rate < 70%

---

## 📞 Contact

Pentru implementare sau întrebări:

- **Urgent**: Începe cu Faza 1 (2-3 ore)
- **Important**: Continuă cu Faza 2 (1 zi)
- **Monitoring**: Verifică metrici zilnic prima săptămână

**Notă**: Aceste fix-uri sunt CRITICE pentru funcționarea platformei. Fără ele, platforma va continua să pice la 100+ useri.
