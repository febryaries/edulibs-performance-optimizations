"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function TermsPage() {
  return (
    <div className="flex flex-col items-center justify-center bg-gray-50 p-4 min-h-screen">
      <div className="w-full max-w-4xl">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm mb-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 text-center">Termeni și Condiții</h1>
            <p className="text-gray-500 text-center mt-2">Ultima actualizare: 25 Aprilie 2025</p>
          </div>

          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Introducere</h2>
              <p className="text-gray-700">
                Bine ați venit la EDU Apps. Acești Termeni și Condiții guvernează utilizarea platformei noastre și serviciile oferite prin intermediul acesteia. Prin accesarea sau utilizarea platformei noastre, sunteți de acord să respectați acești termeni. Vă rugăm să citiți cu atenție acești termeni înainte de a utiliza platforma noastră.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Definiții</h2>
              <p className="text-gray-700">
                <strong>"Platforma"</strong> se referă la aplicația web EDU Apps, inclusiv toate funcționalitățile și serviciile oferite prin intermediul acesteia.<br />
                <strong>"Utilizator"</strong> se referă la orice persoană care accesează sau utilizează Platforma.<br />
                <strong>"Conținut"</strong> se referă la toate materialele, textele, imaginile, videoclipurile, documentele și alte informații disponibile pe Platformă.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Înregistrare și Cont</h2>
              <p className="text-gray-700">
                Pentru a utiliza anumite funcționalități ale Platformei, este necesară crearea unui cont. Sunteți responsabil pentru menținerea confidențialității informațiilor de autentificare și pentru toate activitățile care au loc sub contul dumneavoastră. Vă angajați să furnizați informații corecte, complete și actualizate în timpul procesului de înregistrare și să actualizați aceste informații atunci când este necesar.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Utilizarea Platformei</h2>
              <p className="text-gray-700">
                Sunteți de acord să utilizați Platforma doar în scopuri legale și în conformitate cu acești Termeni. Este interzisă utilizarea Platformei pentru:
              </p>
              <ul className="list-disc pl-6 mt-2 text-gray-700">
                <li>Încălcarea oricăror legi sau reglementări aplicabile</li>
                <li>Încălcarea drepturilor de proprietate intelectuală sau a altor drepturi ale terților</li>
                <li>Transmiterea de conținut ilegal, ofensator, defăimător sau fraudulos</li>
                <li>Interferența cu funcționarea normală a Platformei</li>
                <li>Colectarea neautorizată de date ale utilizatorilor</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Proprietate Intelectuală</h2>
              <p className="text-gray-700">
                Toate drepturile de proprietate intelectuală asupra Platformei și a conținutului acesteia (cu excepția conținutului furnizat de utilizatori) aparțin EDU Apps sau licențiatorilor săi. Nicio prevedere din acești Termeni nu vă transferă niciun drept de proprietate intelectuală asupra Platformei sau a conținutului acesteia.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Confidențialitate</h2>
              <p className="text-gray-700">
                Utilizarea datelor dumneavoastră personale este guvernată de <Link href="/privacy" className="text-blue-600 hover:text-blue-800">Politica noastră de Confidențialitate</Link>, care face parte integrantă din acești Termeni.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Limitarea Răspunderii</h2>
              <p className="text-gray-700">
                În măsura permisă de lege, EDU Apps nu va fi răspunzătoare pentru niciun fel de daune directe, indirecte, incidentale, speciale sau consecvente care rezultă din utilizarea sau incapacitatea de a utiliza Platforma.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Modificări ale Termenilor</h2>
              <p className="text-gray-700">
                Ne rezervăm dreptul de a modifica acești Termeni în orice moment. Modificările vor intra în vigoare imediat după publicarea Termenilor actualizați pe Platformă. Utilizarea continuă a Platformei după publicarea modificărilor constituie acceptarea acestora.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Legea Aplicabilă</h2>
              <p className="text-gray-700">
                Acești Termeni sunt guvernați și interpretați în conformitate cu legile din România, fără a ține cont de principiile conflictului de legi.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Contact</h2>
              <p className="text-gray-700">
                Pentru orice întrebări sau preocupări legate de acești Termeni, vă rugăm să ne contactați la adresa de email: <a href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}`} className="text-blue-600 hover:text-blue-800">{process.env.NEXT_PUBLIC_SUPPORT_EMAIL}</a>
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
