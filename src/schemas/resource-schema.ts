import { z } from "zod"

// Define the schema with conditional validation
export const resourceCompetencySchema = z.object({
  id: z.number().optional(),
  resource_id: z.number(),
  competency_id: z.number(),
  created_at: z.date().optional(),
})


// Define the base schema
export const resourceSchema = z.object({
  title: z.string()
    .min(3, { message: "Titlul trebuie să conțină cel puțin 3 caractere" })
    .refine((val) => val !== "Resursă Nouă", {
      message: "Trebuie să modifici titlul din 'Resursă Nouă' în ceva mai specific"
    }),
  discipline_id: z.number({ required_error: "Disciplina este obligatorie" }),
  discipline_text: z.string().optional(),
  class_id: z.number({ required_error: "Clasa este obligatorie" }).min(1, "Clasa este obligatorie"),
  created_at: z.date().optional(),
  status: z.string().default("DRAFT"),
  mentor_id: z.string().optional(),
  evaluator_id: z.string().optional(),
  specific_competence_text: z.string().optional(),
  specific_competencies: z.array(resourceCompetencySchema).optional(),
  durata: z.string().optional(),
  description: z.string().optional(),
  comentarii: z.string().optional(),
  link: z.string().url({ message: "Link-ul trebuie să fie valid" }).optional().or(z.literal("")),
  aggregate: z.string().optional()
}).superRefine((data, ctx) => {
  if (data.discipline_id === -1) {
    if (!data.discipline_text || data.discipline_text.trim() === "") {
      ctx.addIssue({
        path: ["discipline_text"],
        code: z.ZodIssueCode.custom,
        message: "Trebuie să specifici disciplina dacă alegi 'Altă disciplină'",
      });
    }
  } else if (data.discipline_id < 1) {
    ctx.addIssue({
      path: ["discipline_id"],
      code: z.ZodIssueCode.custom,
      message: "Disciplina este obligatorie",
    });
  }
});

export type ResourceFormValues = z.infer<typeof resourceSchema>
