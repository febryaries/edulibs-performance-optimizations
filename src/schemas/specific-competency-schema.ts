import { z } from "zod"

export const specificCompetencySchema = z.object({
  name: z.string().min(3, { message: "Numele trebuie să conțină cel puțin 3 caractere" }),
  class_id: z.number({ required_error: "Clasa este obligatorie" }).min(1, "Clasa este obligatorie"),
  competency_id: z.number({ required_error: "Competența generală este obligatorie" }).min(1, "Competența generală este obligatorie"),
})

export type SpecificCompetencyFormValues = z.infer<typeof specificCompetencySchema>
