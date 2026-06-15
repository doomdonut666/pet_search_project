// главный файл маршрутов приложения

import { Navigate, Route, Routes } from 'react-router-dom'

import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import AddPetPage from './pages/AddPetPage'
import AdminPage from './pages/AdminPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'
import PetPage from './pages/PetPage'
import ProfilePage from './pages/ProfilePage'
import RegisterPage from './pages/RegisterPage'
import SearchPage from './pages/SearchPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Основные страницы сайта */}
        <Route index element={<HomePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="pets/:id" element={<PetPage />} />
        <Route path="add-pet" element={<AddPetPage />} />

        {/* Страницы авторизации */}
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />

        {/* ЛК */}
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Админка */}
        <Route
          path="admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminPage />
            </ProtectedRoute>
          }
        />

        {/* Страница ошибки */}
        <Route path="404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Route>
    </Routes>
  )
}