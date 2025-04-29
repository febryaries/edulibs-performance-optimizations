"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function PrivacyPage() {
  return (
    <div className="flex flex-col items-center justify-center bg-gray-50 p-4 min-h-screen">
      <div className="w-full max-w-4xl">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm mb-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 text-center">Politica de Confidențialitate</h1>
            <p className="text-gray-500 text-center mt-2">Ultima actualizare: 25 Aprilie 2025</p>
          </div>

          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Introducere</h2>
              <p className="text-gray-700">
                La EDU Apps, respectăm confidențialitatea dumneavoastră și ne angajăm să protejăm datele dumneavoastră personale. Această Politică de Confidențialitate explică modul în care colectăm, utilizăm, dezvăluim și protejăm informațiile dumneavoastră atunci când utilizați platforma noastră.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Informațiile pe care le colectăm</h2>
              <p className="text-gray-700">
                Putem colecta următoarele tipuri de informații:
              </p>
              <ul className="list-disc pl-6 mt-2 text-gray-700">
                <li><strong>Informații de identificare personală</strong>: nume, adresă de email, număr de telefon, etc.</li>
                <li><strong>Informații de autentificare</strong>: numele de utilizator și parola (stocată în mod securizat)</li>
                <li><strong>Informații de utilizare</strong>: date despre modul în care utilizați platforma noastră</li>
                <li><strong>Informații tehnice</strong>: adresa IP, tipul browserului, dispozitivul utilizat, etc.</li>
                <li><strong>Informații furnizate voluntar</strong>: feedback, răspunsuri la sondaje, etc.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Cum utilizăm informațiile dumneavoastră</h2>
              <p className="text-gray-700">
                Utilizăm informațiile dumneavoastră pentru:
              </p>
              <ul className="list-disc pl-6 mt-2 text-gray-700">
                <li>Furnizarea, menținerea și îmbunătățirea platformei noastre</li>
                <li>Procesarea și completarea tranzacțiilor</li>
                <li>Comunicarea cu dumneavoastră, inclusiv trimiterea de notificări și actualizări</li>
                <li>Personalizarea experienței dumneavoastră pe platformă</li>
                <li>Analizarea și înțelegerea modului în care platforma noastră este utilizată</li>
                <li>Detectarea, prevenirea și abordarea problemelor tehnice și de securitate</li>
                <li>Respectarea obligațiilor legale</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Partajarea informațiilor</h2>
              <p className="text-gray-700">
                Putem partaja informațiile dumneavoastră cu:
              </p>
              <ul className="list-disc pl-6 mt-2 text-gray-700">
                <li><strong>Furnizori de servicii</strong>: companii care ne ajută să furnizăm serviciile noastre (de exemplu, servicii de găzduire, procesare plăți)</li>
                <li><strong>Parteneri de afaceri</strong>: terțe părți cu care colaborăm pentru a oferi anumite servicii sau funcționalități</li>
                <li><strong>Autorități legale</strong>: când suntem obligați prin lege sau pentru a proteja drepturile noastre</li>
              </ul>
              <p className="text-gray-700 mt-2">
                Nu vom vinde sau închiria informațiile dumneavoastră personale către terțe părți pentru scopuri de marketing.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Securitatea datelor</h2>
              <p className="text-gray-700">
                Implementăm măsuri de securitate adecvate pentru a proteja informațiile dumneavoastră împotriva accesului neautorizat, modificării, dezvăluirii sau distrugerii. Aceste măsuri includ criptarea datelor, accesul limitat la date și proceduri de securitate fizică pentru sistemele unde sunt stocate informațiile dumneavoastră.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Drepturile dumneavoastră</h2>
              <p className="text-gray-700">
                În conformitate cu legislația aplicabilă privind protecția datelor, aveți următoarele drepturi:
              </p>
              <ul className="list-disc pl-6 mt-2 text-gray-700">
                <li>Dreptul de a accesa informațiile dumneavoastră personale</li>
                <li>Dreptul de a corecta informațiile inexacte</li>
                <li>Dreptul de a șterge informațiile dumneavoastră personale</li>
                <li>Dreptul de a restricționa procesarea informațiilor dumneavoastră</li>
                <li>Dreptul la portabilitatea datelor</li>
                <li>Dreptul de a obiecta la procesarea informațiilor dumneavoastră</li>
                <li>Dreptul de a retrage consimțământul în orice moment</li>
              </ul>
              <p className="text-gray-700 mt-2">
                Pentru a vă exercita aceste drepturi, vă rugăm să ne contactați utilizând informațiile de contact furnizate mai jos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Cookie-uri și tehnologii similare</h2>
              <p className="text-gray-700">
                Utilizăm cookie-uri și tehnologii similare pentru a îmbunătăți experiența dumneavoastră pe platforma noastră. Puteți configura browserul dumneavoastră să refuze toate sau unele cookie-uri, sau să vă alerteze când site-urile web setează sau accesează cookie-uri.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Modificări ale Politicii de Confidențialitate</h2>
              <p className="text-gray-700">
                Ne rezervăm dreptul de a actualiza această Politică de Confidențialitate periodic. Vă vom notifica despre orice modificări semnificative prin postarea noii Politici de Confidențialitate pe această pagină și, dacă este necesar, prin email.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Contact</h2>
              <p className="text-gray-700">
                Dacă aveți întrebări sau preocupări cu privire la această Politică de Confidențialitate sau la practicile noastre de confidențialitate, vă rugăm să ne contactați la:
              </p>
              <p className="text-gray-700 mt-2">
                Email: <a href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}`} className="text-blue-600 hover:text-blue-800">{process.env.NEXT_PUBLIC_SUPPORT_EMAIL}</a><br />
                Adresă: Str. Exemplu nr. 123, București, România<br />
                Telefon: +40 123 456 789
              </p>
            </section>
          </div>

          <div className="mt-8 flex justify-center">
            <Link href="/">
              <Button className="bg-blue-600 hover:bg-blue-700">Înapoi la pagina principală</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
