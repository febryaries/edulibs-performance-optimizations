import { z } from "zod"

// Define the schema for discipline form
export const disciplineSchema = z.object({
  name: z.string().min(3, { message: "Numele trebuie să conțină cel puțin 3 caractere" }),
  domain_id: z.number({
    required_error: "Domeniul este obligatoriu",
    invalid_type_error: "Domeniul trebuie să fie un număr"
  }),
});

export type DisciplineFormValues = z.infer<typeof disciplineSchema>
