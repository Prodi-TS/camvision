import { createContext, useContext, useState } from 'react'
import { findAccount, checkCredentials } from './data/accounts.js'

// Login tahap ini hanya di sisi tampilan (frontend): username dicocokkan
// dan password dicocokkan dengan src/data/accounts.js. Belum ada server.
const AuthContext = createContext(null)
const STORAGE_KEY = 'cv-amr-session'

function loadSession() {
  try {
    const username = sessionStorage.getItem(STORAGE_KEY)
    return username ? findAccount(username) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadSession)

  // Mengembalikan true jika username dan password benar.
  function login(username, password) {
    const account = checkCredentials(username, password)
    if (!account) return false
    try {
      sessionStorage.setItem(STORAGE_KEY, account.username)
    } catch {
      /* abaikan jika penyimpanan browser tidak tersedia */
    }
    setUser(account)
    return true
  }

  function logout() {
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      /* abaikan */
    }
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
