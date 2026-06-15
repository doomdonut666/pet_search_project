// Данные авторизации хранятся в контексте, чтобы их было удобно использовать

import { createContext, useContext, useEffect, useState } from 'react'

import { apiRequest } from '../api'

const AuthContext = createContext(null)
const TOKEN_KEY = 'petToken'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  async function refreshUser() {
    const token = localStorage.getItem(TOKEN_KEY)

    if (!token) {
      setUser(null)
      setLoading(false)
      return null
    }

    try {
      // Если токен есть, пробуем получить данные текущего пользователя
      // если нет, то возвращается null
      const response = await apiRequest('/users/')
      const profile = response.data.user?.[0] || null

      setUser(profile)
      return profile
    } catch {
      localStorage.removeItem(TOKEN_KEY)
      setUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshUser()
  }, [])

  async function login(email, password) {
    const response = await apiRequest('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    localStorage.setItem(TOKEN_KEY, response.data.token)

    return refreshUser()
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }

  const value = {
    user,
    loading,
    login,
    logout,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}