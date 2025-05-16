import { z } from "zod"

// Define the schema for class form
export const classSchema = z.object({
  name: z.string().min(3, { message: "Numele trebuie să conțină cel puțin 3 caractere" }),
  level_id: z.number({
    required_error: "Nivelul educațional este obligatoriu",
    invalid_type_error: "Nivelul educațional trebuie să fie un număr"
  }),
  number: z.number().min(0, { message: "Numărul trebuie să fie mai mare sau egal cu 0" }).default(0),
});

export type ClassFormValues = z.infer<typeof classSchema>
