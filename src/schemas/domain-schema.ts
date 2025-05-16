import { z } from "zod"

// Define the schema for domain form
export const domainSchema = z.object({
  name: z.string().min(3, { message: "Numele trebuie să conțină cel puțin 3 caractere" }),
});

export type DomainFormValues = z.infer<typeof domainSchema>
