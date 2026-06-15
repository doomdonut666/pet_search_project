// Защита страниц от неавторизованных пользователей и обычных пользователей от админ-панели

import { Navigate, useLocation } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import Loader from './Loader'

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  const isGuest = !user
  const hasNoAdminAccess = adminOnly && !user?.isAdmin

  if (loading) {
    return <Loader text="Проверяем авторизацию" />
  }

  // Если гость, то на страницу входа, с сохранением текущего пути для редиректа
  if (isGuest) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Защита панели от обычных пользователей
  if (hasNoAdminAccess) {
    return <Navigate to="/profile" replace />
  }

  return children
}