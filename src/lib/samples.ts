export interface SampleBook {
  fileName: string
  url: string
}

export const sampleBooks: SampleBook[] = [
  { fileName: 'alice-in-wonderland.epub', url: '/samples/alice.epub' },
  { fileName: 'the-time-machine.epub', url: '/samples/time-machine.epub' },
]
