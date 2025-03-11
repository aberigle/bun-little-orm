# bun-little-orm
> English below

Un mini ORM para bun:sqlite con soporte para lo típico:
* Crear la tabla
* Insertar
* Buscar
* Actualizar

Para instanciarlo es necesario un instancia de `Database` y el nombre de la colección.

````js
import { Database } from 'bun:sqlite';

let col = new Collection(new Database("mydb.sqlite"), "test")
````

O con @libsql/client

````js
import { createClient } from "@libsql/client";

let col = new Collection(createClient({
  url : "file::mydb.sqlite"
}), "test")
````

Luego es tan fácil como hacer

````js
let result = await col.insert({ hello : "world"})
console.log(result.id) // el id de la instancia en la BD
````

Se pueden ir añadiendo campos adicionales, y se encargará de actualizar la tabla en consecuencia.

````js
let result = await col.insert({ hello : "field", count : 1})
````

Los tipos soportados de momento son los siguientes.

````ts
enum TypeMap {
  "number"  = "REAL",
  "string"  = "TEXT",
  "boolean" = "INTEGER",
  "date"    = "INTEGER",
  "object"  = "TEXT",
  "array"   = "TEXT"
}
````

Soporta búsquedas sencillas y con wilcards, también búsquedas por id.
````js
let result1 = await col.find({ count : 1 })
let result2 = await col.find({  hello : "%eld"})
let result3 = await col.findById(1) // devuelve solo un element o null
````

También se pueden hacer actualizaciones por id
````js
await col.update(1, { hello : "updates" })
````

## Soporte para TypeBox
Con TypeBox, puedes definir esquemas de validación para tus modelos y aprovechar la inferencia de tipos en TypeScript.

### Definir un esquema con TypeBox
```typescript
import { Type, Static } from '@sinclair/typebox';
import { fromTypebox } from 'bun-little-orm';

// Define el esquema
const UserSchema = Type.Object({
  id: Type.Optional(Type.Number()),
  name: Type.String(),
  email: Type.String()
}, {
  $id : "User"
});

// Inferir el tipo TypeScript
type User = Static<typeof UserSchema>;

// Crear la colección con el esquema
let Users = fromTypebox(new Database("mydb.sqlite"), UserSchema);

// Insertar un nuevo usuario
let newUser = await Users.insert({
  name: "Alice",
  email: "alice@example.com",
  age: 25
});

```
En caso de error de validación, los errores tienen el [formato de TypeBox](https://github.com/sinclairzx81/typebox?tab=readme-ov-file#values-errors).

De momento no se puede borrar. Pero para ir tirando yo creo que está bien.

Espero que sea de utilidad. Para cualquer sugerencia me comentáis.


## English

A mini ORM for bun:sqlite with support for the basics:
* Create table
* Insert
* Search
* Update

To instantiate it, you need an instance of Database and the name of the collection.

````js
import { Database } from 'bun:sqlite';

let col = new Collection(new Database("mydb.sqlite"), "test");
````

Or with @libsql/client

````js
import { createClient } from "@libsql/client";

let col = new Collection(createClient({
  url : "file::mydb.sqlite"
}), "test")
````


Then it's as easy as doing:

````js
let result = await col.insert({ hello : "world" });
console.log(result.id); // the id of the instance in the database
````

You can add additional fields, and it will take care of updating the table accordingly.

````js
let result = await col.insert({ hello : "field", count : 1 });
````

The supported types are

````ts
enum TypeMap {
  "number"  = "REAL",
  "string"  = "TEXT",
  "boolean" = "INTEGER",
  "date"    = "INTEGER",
  "object"  = "TEXT",
  "array"   = "TEXT"
}
````

It supports simple and wildcard searches, as well as searches by id.

````js
let result1 = await col.find({ count : 1 });
let result2 = await col.find({ hello : "%eld" });
let result3 = await col.findById(1); // returns only one element or null
````

Updates can also be made by id.

````js
col.update(1, { hello : "updates" });
````

## TypeBox Support
With TypeBox, you can define validation schemas for your models and leverage TypeScript type inference.

### Define a Schema with TypeBox

```typescript
import { Type, Static } from '@sinclair/typebox';
import { fromTypebox } from 'bun-little-orm';

// Define the schema
const UserSchema = Type.Object({
  id: Type.Optional(Type.Number()),
  name: Type.String(),
  email: Type.String()
}, {
  $id : "User"
});

// Infer the TypeScript type
type User = Static<typeof UserSchema>;

// Create the collection with the schema
let Users = fromTypebox(new Database("mydb.sqlite"), UserSchema);

// Insert a new user
let newUser = await Users.insert({
  name: "Alice",
  email: "alice@example.com",
  age: 25
});
```

In case of a validation error, the errors follow the [TypeBox error format](https://github.com/sinclairzx81/typebox?tab=readme-ov-file#values-errors).



For now you cannot delete. But for getting started, I think it's fine.

I hope this is helpful! Let me know if you have any other questions.
