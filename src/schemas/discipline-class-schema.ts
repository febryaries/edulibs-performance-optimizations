import { z } from "zod"

// Define the schema for discipline-class form
export const disciplineClassSchema = z.object({
  class_id: z.number({
    required_error: "Clasa este obligatorie",
    invalid_type_error: "Clasa trebuie să fie un număr"
  }),
  discipline_id: z.number({
    required_error: "Disciplina este obligatorie",
    invalid_type_error: "Disciplina trebuie să fie un număr"
  }),
  area_id: z.union([
    z.number({
      required_error: "Aria curriculară este obligatorie",
      invalid_type_error: "Aria curriculară trebuie să fie un număr"
    }),
    z.undefined()
  ]),
  code: z.string().optional(),
});

export type DisciplineClassFormValues = z.infer<typeof disciplineClassSchema>
