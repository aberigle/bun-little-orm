
export function isEmpty(
  object : any
) : boolean {
  for (const key in object) return false
  return true
}