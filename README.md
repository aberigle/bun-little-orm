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
console.log(result._id) // el id de la instancia en la BD
````

Se pueden ir añadiendo campos adicionales, y se encargará de actualizar la tabla en consecuencia.

````js
let result = await col.insert({ hello : "field", count : 1})
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
console.log(result._id); // the id of the instance in the database
````

You can add additional fields, and it will take care of updating the table accordingly.

````js
let result = await col.insert({ hello : "field", count : 1 });
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

For now you cannot delete. But for getting started, I think it's fine.

I hope this is helpful! Let me know if you have any other questions.