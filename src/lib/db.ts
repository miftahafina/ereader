import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { BookMeta, BookRecord, ProgressRecord } from './types'

interface EReaderDB extends DBSchema {
  books: {
    key: string
    value: BookRecord
    indexes: { 'by-addedAt': number }
  }
  progress: {
    key: string
    value: ProgressRecord
  }
}

const DB_NAME = 'ereader-web'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<EReaderDB>> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<EReaderDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const books = db.createObjectStore('books', { keyPath: 'id' })
        books.createIndex('by-addedAt', 'addedAt')
        db.createObjectStore('progress', { keyPath: 'id' })
      },
    })
  }
  return dbPromise
}

export async function listBooks(): Promise<BookMeta[]> {
  const db = await getDB()
  const books = await db.getAllFromIndex('books', 'by-addedAt')
  return books
    .map<BookMeta>((b) => ({
      id: b.id,
      title: b.title,
      author: b.author,
      fileName: b.fileName,
      size: b.size,
      addedAt: b.addedAt,
      cover: b.cover,
    }))
    .sort((a, b) => b.addedAt - a.addedAt)
}

export async function getBook(id: string): Promise<BookRecord | undefined> {
  const db = await getDB()
  return db.get('books', id)
}

export async function addBook(book: BookRecord): Promise<void> {
  const db = await getDB()
  await db.put('books', book)
}

export async function deleteBook(id: string): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(['books', 'progress'], 'readwrite')
  await Promise.all([
    tx.objectStore('books').delete(id),
    tx.objectStore('progress').delete(id),
    tx.done,
  ])
}

export async function getAllProgress(): Promise<Record<string, ProgressRecord>> {
  const db = await getDB()
  const records = await db.getAll('progress')
  return Object.fromEntries(records.map((r) => [r.id, r]))
}

export async function getProgress(id: string): Promise<ProgressRecord | undefined> {
  const db = await getDB()
  return db.get('progress', id)
}

export async function saveProgress(record: ProgressRecord): Promise<void> {
  const db = await getDB()
  await db.put('progress', record)
}
