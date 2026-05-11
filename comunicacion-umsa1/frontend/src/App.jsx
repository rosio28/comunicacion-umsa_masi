import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'

// Layout
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import AdminLayout from './components/admin/AdminLayout'

// Páginas públicas
import HomePage from './pages/HomePage'
import {
  NoticiasPage, NoticiaDetallePage,
  EventosPage, DocentesPage,
  MejoresAlumnosPage, EgresadosPage,
  MultimediaPage, GaleriaPage,
  WhatsappPage, MallaCurricularPage,
  TramitesPage, ConvocatoriasPage,
  ContactoPage, BibliotecaPage,
  IpicomPage, QuienesSomosPage,
  TransparenciaPage, StreamingPage,
} from './pages/PublicPages'

// Páginas admin
import { AdminLoginPage, RecuperarPasswordPage } from './pages/admin/LoginPage'
import DashboardPage from './pages/admin/DashboardPage'
import {
  AdminNoticiasPage, NoticiaFormPage,
  AdminDocentesPage,
  AdminAlumnosPage,
  AdminEgresadosPage,
  AdminEventosPage,
  AdminConvocatoriasPage,
  AdminMultimediaPage,
  AdminGaleriaPage,
  AdminWhatsappPage,
  AdminMallaPage,
  AdminInstitucionalPage,
  AdminUsuariosPage,
  AdminTramitesPage,
} from './pages/admin/AdminPages'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } }
})

// Protección de rutas admin
function RequireAuth({ children }) {
  const { token, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
  return token ? children : <Navigate to="/admin/login" replace />
}

// Layout público
function PublicLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* ─── PÚBLICAS ─────────────────────────────── */}
            <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
            <Route path="/quienes-somos"    element={<PublicLayout><QuienesSomosPage /></PublicLayout>} />
            <Route path="/docentes"         element={<PublicLayout><DocentesPage /></PublicLayout>} />
            <Route path="/malla-curricular" element={<PublicLayout><MallaCurricularPage /></PublicLayout>} />
            <Route path="/ipicom"           element={<PublicLayout><IpicomPage /></PublicLayout>} />
            <Route path="/transparencia"    element={<PublicLayout><TransparenciaPage /></PublicLayout>} />
            <Route path="/tramites"         element={<PublicLayout><TramitesPage /></PublicLayout>} />
            <Route path="/convocatorias"    element={<PublicLayout><ConvocatoriasPage /></PublicLayout>} />
            <Route path="/eventos"          element={<PublicLayout><EventosPage /></PublicLayout>} />
            <Route path="/whatsapp"         element={<PublicLayout><WhatsappPage /></PublicLayout>} />
            <Route path="/biblioteca"       element={<PublicLayout><BibliotecaPage /></PublicLayout>} />
            <Route path="/noticias"         element={<PublicLayout><NoticiasPage /></PublicLayout>} />
            <Route path="/noticias/:slug"   element={<PublicLayout><NoticiaDetallePage /></PublicLayout>} />
            <Route path="/multimedia"       element={<PublicLayout><MultimediaPage /></PublicLayout>} />
            <Route path="/galeria"          element={<PublicLayout><GaleriaPage /></PublicLayout>} />
            <Route path="/mejores-alumnos"  element={<PublicLayout><MejoresAlumnosPage /></PublicLayout>} />
            <Route path="/egresados"        element={<PublicLayout><EgresadosPage /></PublicLayout>} />
            <Route path="/streaming"        element={<PublicLayout><StreamingPage /></PublicLayout>} />
            <Route path="/contacto"         element={<PublicLayout><ContactoPage /></PublicLayout>} />

            {/* ─── AUTH ─────────────────────────────────── */}
            <Route path="/admin/login"      element={<AdminLoginPage />} />
            <Route path="/admin/recuperar"  element={<RecuperarPasswordPage />} />

            {/* ─── ADMIN (protegidas) ───────────────────── */}
            <Route path="/admin" element={<RequireAuth><AdminLayout><DashboardPage /></AdminLayout></RequireAuth>} />
            <Route path="/admin/noticias"                element={<RequireAuth><AdminLayout><AdminNoticiasPage /></AdminLayout></RequireAuth>} />
            <Route path="/admin/noticias/nueva"          element={<RequireAuth><AdminLayout><NoticiaFormPage /></AdminLayout></RequireAuth>} />
            <Route path="/admin/noticias/:id/editar"     element={<RequireAuth><AdminLayout><NoticiaFormPage /></AdminLayout></RequireAuth>} />
            <Route path="/admin/eventos"                 element={<RequireAuth><AdminLayout><AdminEventosPage /></AdminLayout></RequireAuth>} />
            <Route path="/admin/convocatorias"           element={<RequireAuth><AdminLayout><AdminConvocatoriasPage /></AdminLayout></RequireAuth>} />
            <Route path="/admin/docentes"                element={<RequireAuth><AdminLayout><AdminDocentesPage /></AdminLayout></RequireAuth>} />
            <Route path="/admin/alumnos"                 element={<RequireAuth><AdminLayout><AdminAlumnosPage /></AdminLayout></RequireAuth>} />
            <Route path="/admin/egresados"               element={<RequireAuth><AdminLayout><AdminEgresadosPage /></AdminLayout></RequireAuth>} />
            <Route path="/admin/multimedia"              element={<RequireAuth><AdminLayout><AdminMultimediaPage /></AdminLayout></RequireAuth>} />
            <Route path="/admin/galeria"                 element={<RequireAuth><AdminLayout><AdminGaleriaPage /></AdminLayout></RequireAuth>} />
            <Route path="/admin/whatsapp"                element={<RequireAuth><AdminLayout><AdminWhatsappPage /></AdminLayout></RequireAuth>} />
            <Route path="/admin/malla"                   element={<RequireAuth><AdminLayout><AdminMallaPage /></AdminLayout></RequireAuth>} />
            <Route path="/admin/tramites"                element={<RequireAuth><AdminLayout><AdminTramitesPage /></AdminLayout></RequireAuth>} />
            <Route path="/admin/institucional"           element={<RequireAuth><AdminLayout><AdminInstitucionalPage /></AdminLayout></RequireAuth>} />
            <Route path="/admin/usuarios"                element={<RequireAuth><AdminLayout><AdminUsuariosPage /></AdminLayout></RequireAuth>} />

            {/* 404 */}
            <Route path="*" element={
              <PublicLayout>
                <div className="section text-center">
                  <p className="text-6xl font-bold text-gray-200 mb-4">404</p>
                  <h1 className="text-2xl font-bold text-gray-700 mb-2">Página no encontrada</h1>
                  <p className="text-gray-500 mb-6">La dirección que buscas no existe.</p>
                  <a href="/" className="btn btn-primary">Ir al inicio</a>
                </div>
              </PublicLayout>
            } />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3500, style: { fontSize: '14px' } }} />
      </AuthProvider>
    </QueryClientProvider>
  )
}
