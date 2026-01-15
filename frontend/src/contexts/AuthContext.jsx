import { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '../services/api'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('token'))

  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        try {
          // Get user info
          const response = await authApi.getMe()
          setUser(response.data)
        } catch (error) {
          console.error('Auth initialization error:', error)
          // Clear invalid token
          localStorage.removeItem('token')
          setToken(null)
          setUser(null)
        } finally {
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    }
    
    initializeAuth()
  }, [token])

  const login = async (username, password) => {
    try {
      const formData = new FormData()
      formData.append('username', username)
      formData.append('password', password)
      const response = await authApi.login(formData)
      const { access_token, role, user_id } = response.data
      
      localStorage.setItem('token', access_token)
      setToken(access_token)
      
      // Get user info
      const userResponse = await authApi.getMe()
      setUser(userResponse.data)
      
      return { success: true, role, user_id }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Login failed' 
      }
    }
  }

  const register = async (customerData) => {
    try {
      const response = await authApi.register(customerData)
      return { success: true, data: response.data }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Registration failed' 
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!token,
    isAdmin: user?.role === 'Admin',
    isCustomer: user?.role === 'Customer',
    isAccountant: user?.role === 'Accountant',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

