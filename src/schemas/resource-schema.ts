import { z } from "zod"

export const resourceSchema = z.object({
  title: z.string().min(3, { message: "Titlul trebuie să conțină cel puțin 3 caractere" }),
  discipline_id: z.string({ required_error: "Disciplina este obligatorie" }),
  class_id: z.string({ required_error: "Clasa este obligatorie" }),
  created_at: z.date().optional(),
  status: z.string().default("DRAFT"),
  mentor_id: z.string().optional(),
  specific_competency_id: z.string({ required_error: "Competența specifică este obligatorie" }),
  durata: z.string().optional(),
  description: z.string().optional(),
  comentarii: z.string().optional(),
  link: z.string().url({ message: "Link-ul trebuie să fie valid" }).optional().or(z.literal(""))
})

export type ResourceFormValues = z.infer<typeof resourceSchema>
