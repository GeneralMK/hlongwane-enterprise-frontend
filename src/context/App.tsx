import * as React from 'react'

interface Props {
  children?: React.ReactNode
}

type AppProviderProps = {}

const AppContext = React.createContext<AppProviderProps>({})

export const useAppContext = (): AppProviderProps => React.useContext(AppContext)

export default function AppProvider({ children }: Props) {
  const context = React.useMemo(() => ({}), [])

  return <AppContext.Provider value={context}>{children}</AppContext.Provider>
}
