"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"

export default function NomenclatorPage() {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Nomenclatoare</h1>
      <p className="mt-2 text-gray-500">
        Selectați un nomenclator din meniul lateral pentru a vizualiza și edita datele.
      </p>
    </>
  )
}
