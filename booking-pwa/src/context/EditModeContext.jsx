import { createContext, useContext } from 'react'
import useEditMode from '../hooks/useEditMode'

const EditModeContext = createContext(null)

export function EditModeProvider({ children }) {
  const editMode = useEditMode()
  return <EditModeContext.Provider value={editMode}>{children}</EditModeContext.Provider>
}

export function useEditModeContext() {
  return useContext(EditModeContext)
}
