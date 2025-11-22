# 🎛️ EDU APPS - Documentație Dashboard & Panou Administrare

## 📋 Cuprins

1. [Structură Dashboard](#structură-dashboard)
2. [Panou Creare Administrator](#panou-creare-administrator)
3. [Management Utilizatori](#management-utilizatori)
4. [Management Nomenclatoare](#management-nomenclatoare)
5. [Management Resurse](#management-resurse)
6. [Management Grupe](#management-grupe)
7. [Setări](#setări)
8. [Securitate și Permisiuni](#securitate-și-permisiuni)

---

## 🏗️ Structură Dashboard

### **Layout Principal**

📁 **Fișier:** `src/app/dashboard/layout.tsx`

**Componente:**

- **Header** - Logo, meniu navigare, notificări, avatar
- **Main Content** - Conținut dinamic pe pagină
- **Footer** - Copyright, link-uri (Contact, Terms, Privacy)

### **Meniu Dinamic pe Roluri**

📁 **Fișier:** `src/hooks/use-menu.ts`

| Rol               | Meniu Vizibil                                    |
| ----------------- | ------------------------------------------------ |
| **STUDENT**       | Resurse, Setări                                  |
| **EVALUATOR**     | Resurse, Setări                                  |
| **FORMATOR**      | Resurse, Grupe, Setări                           |
| **MODERATOR**     | Resurse, Utilizatori, Setări                     |
| **ADMINISTRATOR** | Resurse, Grupe, Utilizatori, Nomenclator, Setări |

**Badge-uri Număr:**

- 📖 Resurse: Total resurse în sistem
- 👥 Grupe: Total grupe
- 👤 Utilizatori: Total utilizatori

---

## 🔐 Panou Creare Administrator

📁 **Locație:** `/admin/sign-up`
📄 **Fișier:** `src/app/(auth-pages)/admin/sign-up/page.tsx`

### **Scop:**

Creare **primul administrator** al platformei (one-time setup)

### **Funcționalități:**

- ✅ Înregistrare cu email + parolă
- ✅ Înregistrare cu Google OAuth
- ✅ Validare parolă (min 8 caractere)
- ✅ Confirmare parolă
- ✅ **Protecție:** Dacă există deja admin → redirect `/forbidden`

### **Flow:**

```
1. Acces /admin/sign-up
2. Verificare: checkFirstAdminCreated()
   → DA (există admin): Redirect /forbidden
   → NU: Permite înregistrare
3. Completare formular
4. Creare cont cu rol ADMINISTRATOR
5. Email confirmare
6. Complete profile
7. Acces dashboard
```

---

## 👥 Management Utilizatori

📁 **Locație:** `/dashboard/utilizatori`
📄 **Fișier:** `src/app/dashboard/utilizatori/page.tsx`
🔒 **Acces:** MODERATOR, ADMINISTRATOR

### **Funcționalități Principale**

#### **1. Tabel Utilizatori (DataTable)**

**Coloane:**

- ☑️ **Select** - Checkbox selecție
- 👤 **Nume** - Avatar colorat + Nume complet (sau email)
- 📧 **Email** - Adresa email
- 🟢 **Status** - Badge colorat (ACTIVE, INACTIVE, SUSPENDED, INVITED)
- 🎓 **Nivel** - Nivel educațional (placeholder: N/A)
- 👔 **Rol** - ADMINISTRATOR, MODERATOR, FORMATOR, EVALUATOR, STUDENT
- 📅 **Data** - Data înregistrare (format: dd MMM yyyy)
- ⚙️ **Acțiuni** - Dropdown menu

**Filtre:**

- Rol (dropdown multi-select)

**Căutare:**

- Email, Nume, Prenume

**Features:**

- Paginare
- Sortare pe coloane
- Selecție multiplă
- Export date

#### **2. Adăugare Utilizator Individual**

**Buton:** "Adaugă utilizator" (+ icon)

**Dialog:**

- Input: Email (obligatoriu)
- Select: Rol (obligatoriu)
- Buton: "Trimite invitație"

**Proces:**

```typescript
1. Validare: email + rol
2. Apel: inviteUser(email, role)
3. Creare user cu status: INVITED
4. Trimitere email invitație
5. Toast: "Utilizator invitat cu succes"
6. Refresh tabel
```

#### **3. Adăugare în Masă (Bulk Upload)**

**Buton:** "Adaugă în masă" (Upload icon)

**Dialog:**

- Upload CSV/Excel
- Preview date
- Validare

**Format CSV:**

```csv
email,role
user1@example.com,FORMATOR
user2@example.com,EVALUATOR
```

**Proces:**

```typescript
1. Parse CSV/Excel
2. Validare fiecare rând
3. Verificare: email există deja?
   → DA: Skip + warning
   → NU: Continuă
4. Invitare secvențială (500ms delay)
5. Raportare:
   - X utilizatori invitați
   - Y utilizatori există deja
   - Z erori
```

#### **4. Acțiuni pe Utilizator**

**Dropdown Menu (3 dots):**

**Pentru ACTIVE:**

- 🚫 **Dezactivează** → Status: INACTIVE

**Pentru INACTIVE:**

- ✅ **Activează** → Status: ACTIVE

**Pentru INVITED:**

- 🔄 **Retrimite invitație** → Email nou
- 🗑️ **Elimină** → Ștergere utilizator

### **Status Badges**

| Status        | Culoare     | Descriere             |
| ------------- | ----------- | --------------------- |
| **ACTIVE**    | 🟢 Verde    | Utilizator activ      |
| **INACTIVE**  | ⚪ Gri      | Utilizator dezactivat |
| **SUSPENDED** | 🔴 Roșu     | Utilizator suspendat  |
| **INVITED**   | 🔵 Albastru | Invitație trimisă     |

### **Avatar Colorat**

**Generare:**

```typescript
// Culoare bazată pe ID utilizator
const colors = [
  "#4F7FFF",
  "#4CAF50",
  "#FF9800",
  "#E91E63",
  "#9C27B0",
  "#3F51B5",
];
const index = userId.charCodeAt(0) % colors.length;

// Inițiale din nume
const initials = `${firstName[0]}${lastName[0]}`.toUpperCase();
```

---

## 📚 Management Nomenclatoare

📁 **Locație:** `/dashboard/nomenclator/*`
📄 **Layout:** `src/app/dashboard/nomenclator/layout.tsx`
🔒 **Acces:** DOAR ADMINISTRATOR

### **Sidebar Navigare**

```
📚 Nomenclatoare
  ├── 🎓 Nivele Educaționale
  ├── 🏫 Clase
  ├── 📊 Arii Curriculare
  ├── 📖 Discipline
  ├── 🔗 Clase-Discipline
  └── 📝 Competențe Specifice
```

### **1. Nivele Educaționale** (`/nivele`)

**Structură:**

- **Primar** (I-IV)
- **Gimnazial** (V-VIII)
- **Liceal** (IX-XII)

**Câmpuri:**

- id, name, parent_id, number

**Relații:**

- Ierarhic (parent_id → nivele)

### **2. Clase** (`/clase`)

**Exemple:**

- Clasa I, II, III, IV (Primar)
- Clasa a V-a, VI-a, VII-a, VIII-a (Gimnazial)
- Clasa a IX-a, X-a, XI-a, XII-a (Liceal)

**Câmpuri:**

- id, name, level_id, number

**Relații:**

- level_id → educational_levels

### **3. Arii Curriculare** (`/ariicurriculare`)

📄 **Fișier:** `src/app/dashboard/nomenclator/ariicurriculare/page.tsx`

**Exemple:**

- Limbă și comunicare
- Matematică și științe ale naturii
- Om și societate
- Arte
- Educație fizică și sport
- Tehnologii

**Tabel:**

- Nume
- Data actualizare

**Filtre:**

- Nume (select)
- Data (date picker)

**Căutare:**

- Nume

**Acțiuni:**

- ➕ Adaugă (inline)
- ✏️ Editează
- 🗑️ Șterge
- 📤 Adaugă în masă (bulk upload)

### **4. Discipline** (`/discipline`)

**Exemple:**

- Matematică
- Limba română
- Istorie
- Geografie
- Fizică
- Chimie
- Biologie
- Informatică

**Câmpuri:**

- id, name, curricular_area_id

**Relații:**

- curricular_area_id → curricular_areas

### **5. Clase-Discipline** (`/clase-discipline`)

**Scop:**
Asociere Many-to-Many între Clase și Discipline

**Câmpuri:**

- id, code, area_id, class_id, discipline_id

**Relații:**

- class_id → classes
- discipline_id → disciplines
- area_id → curricular_areas

**Exemplu:**

```
Clasa a V-a + Matematică + Matematică și științe = Cod: MAT-V
```

### **6. Competențe Specifice** (`/competente-specifice`)

**Structură:**

- Competență generală (per disciplină + nivel)
  - Competență specifică 1 (per clasă)
  - Competență specifică 2
  - ...

**Câmpuri:**

- id, name, class_id, competency_id, number, internal_code

**Relații:**

- class_id → classes
- competency_id → general_competencies

### **Pattern Comun Toate Nomenclatoarele**

```typescript
// 1. Controller & CRUD
const { useList } = useXxxCrud()
const useController = useXxxController

// 2. Coloane
const columns = useMemo<ColumnDef[]>(() => [
  { accessorKey: "name", header: "Nume" },
  { accessorKey: "updated_at", header: "Data" }
], [])

// 3. Filtre
const filters = useMemo<Filter[]>(() => [
  { id: "name", type: "select" },
  { id: "updated_at", type: "date" }
], [])

// 4. DataTable
<DataTable
  columns={columns}
  useQueryHook={useList}
  useController={useController}
  filters={filters}
  searchColumns={["name"]}
/>
```

---

## 📖 Management Resurse

📁 **Locație:** `/dashboard` (pagina principală)
📄 **Fișier:** `src/app/dashboard/page.tsx`
🔒 **Acces:** TOȚI utilizatorii (permisiuni diferite)

### **Permisiuni pe Roluri**

| Rol               | Permisiuni                       |
| ----------------- | -------------------------------- |
| **STUDENT**       | Vizualizare resurse publice      |
| **EVALUATOR**     | + Evaluare resurse IN_REVIEW     |
| **FORMATOR**      | + Creare/editare resurse proprii |
| **MODERATOR**     | + Vizualizare toate resursele    |
| **ADMINISTRATOR** | + Editare/ștergere orice resursă |

### **Componente Principale**

#### **1. ResourceViewer** - Vizualizare Resursă

📄 **Fișier:** `src/components/resources/resource-viewer.tsx`

**Afișare:**

- Titlu, descriere
- Disciplină, clasă
- Competențe specifice
- Link extern
- Durata, comentarii
- Autor, mentor, evaluator
- Status (badge colorat)
- Comentarii utilizatori

**Acțiuni:**

- ✏️ Editează (doar autor sau admin)
- 🗑️ Șterge (doar autor sau admin)
- 📤 Trimite spre evaluare (autor)
- ⭐ Adaugă la favorite

#### **2. ResourceForm** - Creare/Editare Resursă

📄 **Fișier:** `src/components/resources/resource-form.tsx`

**Câmpuri:**

- Titlu (obligatoriu)
- Descriere
- Disciplină (dropdown sau text liber)
- Clasă (dropdown)
- Competențe specifice (multi-select)
- Link extern (URL)
- Durata activității
- Comentarii
- Mentor (opțional)
- Evaluator (opțional)

**Validare:** Zod Schema

#### **3. ResourceReview** - Evaluare Resursă

📄 **Fișier:** `src/components/resources/resource-review.tsx`

**Criterii Evaluare (6):**

1. **Concordanță** - Aliniere curriculum
2. **Relevanță** - Relevanță subiect
3. **Accesibilitate** - Accesibilitate elevi
4. **Corectitudine** - Corectitudine factuală
5. **Valoare** - Valoare educațională
6. **Calitate** - Calitate design

**Pentru fiecare criteriu:**

- ✅ Checkbox (OK/Not OK)
- 💬 Comentariu text

**Rezultat:**

- Toate OK → Status: CONFORMABLE
- Cel puțin 1 Not OK → Status: UNCONFORMABLE

### **Workflow Status Resurse**

```
DRAFT (Ciornă)
  ↓ Formator: "Trimite spre evaluare"
SUBMITTED (Trimisă)
  ↓ Evaluator: "Preia resursa"
IN_REVIEW (În evaluare)
  ↓ Evaluator: "Aprobă/Respinge"
CONFORMABLE (Aprobată) sau UNCONFORMABLE (Respinsă)
```

### **Filtre Resurse**

- Status (DRAFT, SUBMITTED, IN_REVIEW, CONFORMABLE, UNCONFORMABLE)
- Disciplină
- Clasă
- Autor
- Evaluator
- Data creare

---

## 👥 Management Grupe

📁 **Locație:** `/dashboard/grupe`
🔒 **Acces:** FORMATOR, ADMINISTRATOR

### **Funcționalități**

#### **1. Creare Grup**

- Nume grup
- Descriere
- Creator devine OWNER

#### **2. Adăugare Membri**

- Căutare utilizatori
- Adăugare cu rol:
  - **OWNER** - Creator grup
  - **ADMIN** - Administrator grup
  - **MEMBER** - Membru simplu

#### **3. Partajare Resurse**

- Selectare resurse proprii
- Partajare cu grupul
- Membri primesc notificare

#### **4. Vizualizare Resurse Partajate**

- Listă resurse din grup
- Comentarii pe resurse
- NU editare (doar autorul)

### **Permisiuni Grup**

| Rol Grup   | Permisiuni                                   |
| ---------- | -------------------------------------------- |
| **OWNER**  | Toate (editare, ștergere grup, membri)       |
| **ADMIN**  | Adăugare/eliminare membri, partajare resurse |
| **MEMBER** | Vizualizare, comentarii                      |

---

## ⚙️ Setări

📁 **Locație:** `/dashboard/setari`
🔒 **Acces:** TOȚI utilizatorii

### **Secțiuni**

#### **1. Profil Personal**

- Nume, prenume
- Email (cu verificare)
- Avatar (upload imagine)
- Nivel educațional

#### **2. Securitate**

- Schimbare parolă
- Autentificare cu 2 factori (placeholder)

#### **3. Notificări**

- Email notificări
- Notificări push
- Frecvență notificări

#### **4. Preferințe**

- Temă (light/dark) - momentan doar light
- Limbă (doar română)

---

## 🔐 Securitate și Permisiuni

### **1. Middleware Next.js**

📄 **Fișier:** `src/middleware.ts`

**Funcție:**

- Verifică sesiune Supabase pe fiecare request
- Redirect la `/sign-in` dacă neautentificat
- Refresh token automat

### **2. AuthRedirectGuard**

📄 **Fișier:** `src/components/auth-guard.tsx`

**Funcție:**

- Component React verificare autentificare
- Redirect automat la login
- Loading state

### **3. Row Level Security (RLS)**

**Politici Supabase:**

```sql
-- Utilizatorii văd doar resursele proprii sau publice
CREATE POLICY "users_own_resources"
ON resources FOR SELECT
USING (
  auth.uid() = author_id
  OR is_public = true
  OR auth.uid() IN (
    SELECT id FROM users
    WHERE role IN ('ADMINISTRATOR', 'MODERATOR')
  )
);

-- Doar administratorii modifică nomenclatoare
CREATE POLICY "admin_only_nomenclature"
ON disciplines FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'ADMINISTRATOR'
  )
);

-- Evaluatorii văd resurse IN_REVIEW
CREATE POLICY "evaluators_review"
ON resources FOR SELECT
USING (
  status = 'IN_REVIEW'
  AND auth.uid() IN (
    SELECT id FROM users
    WHERE role IN ('EVALUATOR', 'ADMINISTRATOR')
  )
);
```

### **4. useAuth Hook**

📄 **Fișier:** `src/lib/auth-context.tsx`

**Funcții:**

- `session` - Sesiune curentă
- `user` - User Supabase Auth
- `profile` - Profil din tabel users
- `signUpWithEmail()`
- `forgotPassword()`
- `updateUserStatus()`
- `inviteUser()`
- `removeInvitedUser()`
- `resendInvitation()`
- `completeProfile()`

### **5. useMenu Hook**

📄 **Fișier:** `src/hooks/use-menu.ts`

**Funcție:**

- Meniu dinamic bazat pe rol
- Filtrare secțiuni pe permisiuni
- Badge-uri număr entități

---

## 📊 Componente UI Reutilizabile

### **DataTable**

📁 **Locație:** `src/components/ui/data-table/`

**Features:**

- Paginare (cursor sau offset)
- Sortare multi-coloană
- Filtrare avansată
- Căutare full-text
- Vizibilitate coloane
- Selecție rânduri
- Export date
- Responsive mobile

### **Header**

📄 **Fișier:** `src/components/ui/header.tsx`

**Componente:**

- Logo (link la dashboard)
- Meniu navigare (desktop)
- Hamburger menu (mobile)
- Notificări (badge număr)
- Avatar + dropdown

### **Footer**

📄 **Fișier:** `src/components/ui/footer.tsx`

**Variante:**

- `admin` - Pentru dashboard
- `public` - Pentru pagini publice

---

## 🎯 Rezumat Dashboard

| Secțiune          | Acces            | Funcționalități                 |
| ----------------- | ---------------- | ------------------------------- |
| **Utilizatori**   | MODERATOR, ADMIN | Invitare, Activare, Bulk Upload |
| **Nomenclatoare** | ADMIN            | CRUD complet toate entitățile   |
| **Resurse**       | TOȚI             | Creare, evaluare, partajare     |
| **Grupe**         | FORMATOR, ADMIN  | Colaborare, partajare resurse   |
| **Setări**        | TOȚI             | Profil, securitate, preferințe  |

**Dashboard-ul este complet funcțional și scalabil!** 🚀
