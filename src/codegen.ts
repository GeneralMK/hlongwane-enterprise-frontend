import 'dotenv/config'
import type { CodegenConfig } from '@graphql-codegen/cli'

const API_HOST = (
  import.meta.env.VITE_APP_API_HOST || 'http://localhost:1337'
).replace(/\/+$/, '')

const GRAPHQL_API_HOST = `${API_HOST}/graphql`

console.log('Codegen schema URL:', GRAPHQL_API_HOST)

const config: CodegenConfig = {
  schema: GRAPHQL_API_HOST,

  documents: ['src/graphql/**/*.graphql'],

  generates: {
    './src/generated/graphql.tsx': {
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-react-apollo'
      ],
      config: {
        withHooks: true,
        withComponent: false,
        withHOC: false,
        scalars: {
          DateTime: 'string',
          BigInt: 'string',
          JSON: 'unknown'
        }
      }
    }
  },

  overwrite: true
}

export default config