import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h2 className="text-2xl font-bold mb-4">Pagina nu a fost găsită</h2>
      <p className="text-gray-600 mb-4">
        Nu am putut găsi pagina pe care o cauți.
      </p>
      <Link
        href="/dashboard"
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Înapoi la Dashboard
      </Link>
    </div>
  );
}
