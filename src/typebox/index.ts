import { type TObject } from "@sinclair/typebox"
import { Model } from "./model"

export function fromTypebox(
  db: any,
  object: TObject,
  name: string | undefined = object.$id,
) {
  if (!name) throw new Error("Missing $id or name")

  return new Model(
    db,
    name,
    object
  )
}