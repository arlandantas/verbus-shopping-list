import { familiaBrasileira } from './familiaBrasileira'
import type { ListModel } from './types'

export type { ListModel } from './types'

/** Models offered to new groups; future ones (república, casal, churrasco) are added here. */
export const LIST_MODELS: readonly ListModel[] = [familiaBrasileira]
export const CURRENT_MODEL: ListModel = familiaBrasileira
