// contexts/RefetchContext.tsx
"use client"

import { createContext, useCallback, useContext, useState } from "react"

type RefetchContextType = {
  refetchKeys: Record<string, number>
  triggerRefetch: (key: string) => void
}

const RefetchContext = createContext<RefetchContextType | undefined>(undefined)

export const RefetchProvider = ({ children }: { children: React.ReactNode }) => {
  const [refetchKeys, setRefetchKeys] = useState<Record<string, number>>({})

  const triggerRefetch = useCallback((key: string) => {
    setRefetchKeys((prev) => ({
      ...prev,
      [key]: (prev[key] || 0) + 1,
    }))
  }, [])

  return (
    <RefetchContext.Provider value={{ refetchKeys, triggerRefetch }}>
      {children}
    </RefetchContext.Provider>
  )
}

export const useRefetchContext = () => {
  const context = useContext(RefetchContext)
  if (!context) throw new Error("useRefetchContext must be used inside RefetchProvider")
  return context
}
