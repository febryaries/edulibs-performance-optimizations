import { z } from "zod"

export const gen3Schema = z.object({
  serial_number: z.number().optional(),
  title: z.string().optional(),
  discipline: z.string().optional(),
  class: z.string().optional(),
  author: z.string().optional(),
  duration: z.string().optional(),
  description: z.string().optional(),
  comments: z.string().optional(),
  today: z.date().optional(),
  competency: z.string().optional(),
  aggregate: z.string().optional(),
})


