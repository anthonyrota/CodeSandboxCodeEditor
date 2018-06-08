import { of } from './StreamConstructorOf'

export const range = (length: number) =>
  of(...Array.from({ length }, (_, i) => i))
