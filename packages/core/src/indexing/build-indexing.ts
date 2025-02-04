import type { DatabaseIndexApi } from './database-index-api.js'
import type { StreamID } from '@ceramicnetwork/streamid'
import { SqliteIndexApi } from './sqlite/sqlite-index-api.js'
import knex from 'knex'

export type IndexingConfig = {
  /**
   * Database connection string.
   */
  db: string

  /**
   * List of models to index.
   */
  models: Array<StreamID>
}

export class UnsupportedDatabaseProtocolError extends Error {
  constructor(protocol: string) {
    super(`Not supported database protocol ${protocol}`)
  }
}

class InvalidConnectionStringError extends Error {
  constructor(connectionString: string) {
    super(`Invalid database connection string: ${connectionString}`)
  }
}

function parseURL(input: string) {
  try {
    return new URL(input)
  } catch {
    throw new InvalidConnectionStringError(input)
  }
}

/**
 * Build DatabaseIndexAPI instance based on passed indexing configuration.
 */
export function buildIndexing(indexingConfig: IndexingConfig): DatabaseIndexApi {
  const connectionString = parseURL(indexingConfig.db)
  const protocol = connectionString.protocol.replace(/:$/, '')
  switch (protocol) {
    case 'sqlite':
    case 'sqlite3': {
      const dbConnection = knex({
        client: 'sqlite3',
        useNullAsDefault: true,
        connection: {
          filename: connectionString.pathname,
        },
      })
      return new SqliteIndexApi(dbConnection, indexingConfig.models)
    }
    default:
      throw new UnsupportedDatabaseProtocolError(protocol)
  }
}
