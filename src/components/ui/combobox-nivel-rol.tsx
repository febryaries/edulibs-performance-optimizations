"use client"
import { cn } from "@/lib/utils"
import { ComboboxMulti } from "./combobox-multi"

// Education level options
export const educationLevels = [
  { id: "primar", label: "Primar", color: "bg-[#EFF6FF]" },
  { id: "gimnaziu", label: "Gimnaziu", color: "bg-[#EFF6FF]" },
  { id: "liceu", label: "Liceu", color: "bg-[#ECFDF5]" },
]

// Role options
export const roles = [
  { id: "cursant", label: "Cursant", color: "bg-[#EFF6FF]" },
  { id: "formator", label: "Formator", color: "bg-[#ECFDF5]" },
  { id: "evaluator", label: "Evaluator", color: "bg-[#EFF6FF]" },
  { id: "moderator", label: "Moderator", color: "bg-[#EFF6FF]" },
  { id: "admin", label: "Admin", color: "bg-[#FFFBEB]" },
]

export interface ComboboxNivelRolProps {
  selectedLevels: any[]
  onLevelsChange: (levels: any[]) => void
  selectedRoles: any[]
  onRolesChange: (roles: any[]) => void
  className?: string
  disabled?: boolean
}

export interface Option {
  id: string
  label: string
  color: string
}

export function ComboboxNivelRol({
  selectedLevels,
  onLevelsChange,
  selectedRoles,
  onRolesChange,
  className,
  disabled = false,
}: ComboboxNivelRolProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Education Level Selection */}
      <ComboboxMulti
        options={educationLevels}
        value={selectedLevels}
        onChange={onLevelsChange}
        placeholder="Selectează nivel"
        searchPlaceholder="Caută nivel"
        disabled={disabled}
        showSearch={false}
      />

      {/* Role Selection */}
      <ComboboxMulti
        options={roles}
        value={selectedRoles}
        onChange={onRolesChange}
        placeholder="Selectează rol"
        searchPlaceholder="Caută rol"
        disabled={disabled}
      />
    </div>
  )
}
