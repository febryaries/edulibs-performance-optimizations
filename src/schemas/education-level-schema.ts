import { z } from "zod"

// Define the schema for educational level form
export const educationLevelSchema = z.object({
  name: z.string().min(3, { message: "Numele trebuie să conțină cel puțin 3 caractere" }),
  number: z.number().min(0, { message: "Numărul trebuie să fie mai mare sau egal cu 0" }),
  parent_id: z.number().optional().nullable(),
});

export type EducationLevelFormValues = z.infer<typeof educationLevelSchema>
