import { ValueError } from "@sinclair/typebox/build/cjs/value";

export class ValidationException extends Error {

  constructor(
    public errors: Array<ValueError>
  ) {
    super(`Validation error`)
  }
}