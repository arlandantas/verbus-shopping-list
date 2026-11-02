/** A starter list: categories with item names (S-111). One data file per model. */
export interface ListModel {
  id: string
  name: string
  categories: { name: string; items: string[] }[]
}
