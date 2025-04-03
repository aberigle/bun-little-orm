import { Collection, Field } from "./core"
import { fromTypebox, Model, ModelReference } from "./typebox"

export const sqlitype = {
  fromTypebox,
  Model,
  ModelReference,
  core : {
    Collection,
    Field
  },
  useClient: (client) => Model.reload(client)
}

export default sqlitype