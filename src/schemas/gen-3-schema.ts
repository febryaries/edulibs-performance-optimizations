import { z } from "zod"

export const gen3Schema = z.object({
  serial_number: z.number().optional(),
  title: z.string().min(3, { message: "Titlul trebuie să conțină cel puțin 3 caractere" }),
  discipline: z.string().min(3, { message: "Disciplina trebuie să conțină cel puțin 3 caractere" }),
  class: z.string().min(3, { message: "Clasa trebuie să conțină cel puțin 3 caractere" }),
  author: z.string().min(3, { message: "Formatorul trebuie să conțină cel puțin 3 caractere" }),
  duration: z.string(),
  description: z.string().min(3, { message: "Descrierea trebuie să conțină cel puțin 3 caractere" }),
  comments: z.string().min(3, { message: "Comentariile trebuie să conțină cel puțin 3 caractere" }),
  today: z.date().optional(),
  competency: z.string().min(3, { message: "Competența trebuie să conțină cel puțin 3 caractere" }),
  aggregate: z.string().optional(),
})


