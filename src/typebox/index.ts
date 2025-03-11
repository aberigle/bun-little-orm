import { TSchema } from "@sinclair/typebox"
import { Model } from "./model"

export { Model }
export function fromTypebox<T extends TSchema>(
  db: any,
  object: T,
  name: string | undefined = object.$id,
) {
  if (!name) throw new Error("Missing $id or name")

  return new Model<T>(
    db,
    name,
    object
  )
}