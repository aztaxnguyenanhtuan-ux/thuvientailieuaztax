import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LoginModal from './components/auth/LoginModal'
import ProtectedRoute from './components/auth/ProtectedRoute'
import RegisterModal from './components/auth/RegisterModal'
import ResetPasswordModal from './components/auth/ResetPasswordModal'
import DownloadModal from './components/DownloadModal'
import Footer from './components/Footer'
import Header from './components/Header'
import Lightbox from './components/Lightbox'
import Toast from './components/Toast'
import { AuthProvider } from './context/AuthContext'
import { AppProvider } from './context/AppContext'
import { ROLES } from './lib/roles'
import AdminCMS from './pages/AdminCMS'
import DocumentDetail from './pages/DocumentDetail'
import Home from './pages/Home'
import InfographicPage from './pages/InfographicPage'
import MyLibrary from './pages/MyLibrary'
import './App.css'

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <div className="app-shell">
            <Header />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/tai-lieu/:id" element={<DocumentDetail />} />
                <Route path="/infographic" element={<InfographicPage />} />
                <Route path="/thu-vien" element={<MyLibrary />} />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute roles={ROLES.ADMIN}>
                      <AdminCMS />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
            <DownloadModal />
            <LoginModal />
            <RegisterModal />
            <ResetPasswordModal />
            <Lightbox />
            <Toast />
          </div>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  )
}
