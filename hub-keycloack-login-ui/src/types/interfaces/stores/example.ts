export interface ExampleStore {
  lorem: string
  ipsum: number
  dolor: boolean
  record: Record<string, unknown>
}

export interface ExampleStoreValues {
  storeData: ExampleStore
  updateStoreData: (values: ExampleStore) => void
}
