# 📚 EDU APPS - Documentație Completă Platformă

## 🎯 Scop General

**EDU APPS** este o platformă educațională pentru **managementul resurselor didactice** în sistemul de învățământ românesc. Permite profesorilor (formatori) să creeze, să partajeze și să evalueze resurse educaționale aliniate la curriculum național.

---

## 👥 Roluri și Permisiuni

### 1. **STUDENT**

- Acces minimal
- Vizualizare resurse publice
- Setări personale

### 2. **EVALUATOR**

- Toate permisiunile STUDENT +
- Evaluare resurse trimise spre aprobare
- Comentarii și feedback pe resurse

### 3. **FORMATOR** (Profesor)

- Toate permisiunile EVALUATOR +
- Creare resurse educaționale
- Management grupe de lucru
- Partajare resurse cu grupele

### 4. **MODERATOR**

- Toate permisiunile FORMATOR +
- Management utilizatori
- Aprobare/respingere utilizatori noi
- Invitare utilizatori

### 5. **ADMINISTRATOR**

- Acces complet la platformă
- Management nomenclatoare (discipline, clase, competențe)
- Management utilizatori și grupe
- Configurare sistem

---

## 🗄️ Structura Bazei de Date

### **Tabele Principale**

#### 1. **users** - Utilizatori

- id (uuid) - ID unic utilizator (din Supabase Auth)
- first_name, last_name, email
- avatar_url
- role (ADMINISTRATOR | MODERATOR | FORMATOR | EVALUATOR | STUDENT)
- status (ACTIVE | INACTIVE | SUSPENDED | INVITED)
- education_level_id - Nivel educațional

#### 2. **resources** - Resurse Educaționale

- id (uuid) - ID unic resursă
- serial_number (serial) - Număr secvențial unic
- title - Titlu resursă
- description - Descriere detaliată
- status (DRAFT | SUBMITTED | IN_REVIEW | CONFORMABLE | UNCONFORMABLE)
- author_id - Creatorul resursei
- mentor_id - Mentorul (opțional)
- evaluator_id - Evaluatorul asignat
- discipline_id - Disciplina
- discipline_text - Text liber pentru discipline
- class_id - Clasa
- specific_competence_text - Text liber competență
- link - Link extern către resursă
- durata - Durata activității
- comentarii - Comentarii generale

**Workflow Status:**

1. DRAFT - Ciornă
2. SUBMITTED - Trimisă spre evaluare
3. IN_REVIEW - În evaluare
4. CONFORMABLE - Aprobată
5. UNCONFORMABLE - Respinsă

#### 3. **educational_levels** - Nivele Educaționale

- Primar, Gimnazial, Liceal

#### 4. **classes** - Clase

- Clasa I, II, III, IV, etc.

#### 5. **curricular_areas** - Arii Curriculare

- Limbă și comunicare
- Matematică și științe
- Om și societate
- Arte, Educație fizică, Tehnologii

#### 6. **disciplines** - Discipline

- Matematică, Română, Istorie, etc.

#### 7. **general_competencies** - Competențe Generale

- Per disciplină și nivel

#### 8. **specific_competencies** - Competențe Specifice

- Per competență generală și clasă

#### 9. **resource_competencies** - Relație Resurse-Competențe

- Many-to-Many

#### 10. **resource_evaluations** - Evaluări Resurse

- Criterii: concordanță, relevanță, accesibilitate, corectitudine, valoare, calitate
- Status: CONFORMABLE | UNCONFORMABLE | IN_PROGRESS

#### 11. **groups** - Grupe de Lucru

- Colaborare între formatori

#### 12. **group_members** - Membri Grupe

- Role: OWNER | ADMIN | MEMBER

#### 13. **group_resources** - Resurse Partajate

- Many-to-Many

#### 14. **comments** - Comentarii

- Pe resurse

#### 15. **notifications** - Notificări

- Status: READ | UNREAD

---

## 🏗️ Stack Tehnologic

### Frontend

- Next.js 15.2.5 (App Router, React 19)
- TypeScript
- Tailwind CSS + Radix UI
- TanStack Query + TanStack Table
- React Hook Form + Zod
- Framer Motion, Lucide React

### Backend

- Supabase (PostgreSQL + Auth + Storage + RLS)
- Row Level Security (RLS)

### Integrări

- OpenAI SDK + Vercel AI SDK
- React Email + Nodemailer + Resend
- easy-template-x (generare DOCX)

---

## 📂 Structura Proiectului

```
edu/
├── src/
│   ├── app/
│   │   ├── (auth-pages)/         # Autentificare
│   │   ├── dashboard/            # Dashboard principal
│   │   │   ├── page.tsx          # Resurse
│   │   │   ├── grupe/            # Grupe
│   │   │   ├── utilizatori/      # Utilizatori
│   │   │   ├── nomenclator/      # Nomenclatoare
│   │   │   └── setari/           # Setări
│   │   └── api/                  # API Routes
│   ├── components/               # Componente React
│   ├── hooks/                    # Custom Hooks
│   ├── lib/                      # Utilități
│   ├── schemas/                  # Zod Schemas
│   └── utils/                    # Supabase utils
├── supabase/migrations/          # Migrații DB (20 fișiere)
└── public/                       # Fișiere statice
```

---

## 🔐 Autentificare

### Flow

1. Sign Up → Email confirmare → Complete Profile
2. Sign In → Email + Parolă
3. Forgot Password → Email reset → Update Password
4. OAuth Google

### Protecție

- Middleware Next.js
- AuthRedirectGuard
- Row Level Security (RLS)

---

## 🎨 Funcționalități Principale

### 1. Management Resurse

- Creare/editare resurse
- Workflow: DRAFT → SUBMITTED → IN_REVIEW → CONFORMABLE/UNCONFORMABLE
- Evaluare pe 6 criterii
- Bulk upload

### 2. Management Grupe

- Creare grupe
- Adăugare membri
- Partajare resurse

### 3. Management Utilizatori

- Invitare utilizatori
- Aprobare/respingere
- Schimbare rol/status

### 4. Nomenclatoare

- CRUD complet pentru:
  - Arii curriculare
  - Nivele educaționale
  - Clase
  - Discipline
  - Competențe generale
  - Competențe specifice

### 5. Generare Documente

- API: `/api/generate-annex`
- Template-uri: anexa_3.docx, anexa_6.docx

### 6. Sistem Email

- Gmail SMTP + Resend
- Webhook: `/api/send-email`

---

## 🔄 Flow-uri Principale

### Creare și Evaluare Resursă

```
FORMATOR → DRAFT → SUBMITTED → EVALUATOR → IN_REVIEW
→ CONFORMABLE/UNCONFORMABLE
```

### Invitare Utilizator

```
MODERATOR → Email invitație → Sign up → Complete profile
→ Aprobare → ACTIVE
```

### Partajare în Grup

```
FORMATOR → Creare grup → Adăugare membri → Partajare resurse
→ Notificare membri
```

---

## 🎨 Componente UI

### DataTable

- Paginare, sortare, filtrare
- Vizibilitate coloane
- Responsive

### Header

- Logo, meniu dinamic pe rol
- Notificări, avatar

### Footer

- Copyright, link-uri

---

## 🔧 Arhitectură Tehnică

### Query Controller Pattern

- Controller generic per tabel
- CRUD operations
- Type-safe

### CRUD Hooks

- useList, useById, useCreate, useUpdate, useDelete
- TanStack Query integration
- Cache management

### TanStack Query

- Caching (staleTime: 5min, gcTime: 10min)
- Optimistic updates
- Refetch strategies

---

## 📊 Metrici și Performanță

### Probleme Actuale

- 50-100 req/sec cu 100 useri
- Platformă pică la 100-150 useri

### Soluții (vezi MUST_FIX_URGENT.md)

- Activare caching
- Invalidare selectivă
- Debounce mai lung
- Lazy loading relații
- Indexuri DB

---

## 📞 Contact și Suport

- Email: support@eduapps.ro
- Domeniu producție: https://red.g4e.ro
- Supabase: romyzniamifzigqfnfoa.supabase.co
