import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import MoviesPage from './pages/MoviesPage'
import MovieDetailPage from './pages/MovieDetailPage'
import PlayerPage from './pages/PlayerPage'
import SearchPage from './pages/SearchPage'
import AuthPage from './pages/AuthPage'
import PricingPage from './pages/PricingPage'
import AdminLogin from './admin/AdminLogin'
import AdminLayout from './admin/AdminLayout'
import AdminDashboard from './admin/AdminDashboard'
import AdminMovies from './admin/AdminMovies'
import AdminMovieForm from './admin/AdminMovieForm'
import AdminEpisodes from './admin/AdminEpisodes'
import AdminSliders from './admin/AdminSliders'
import AdminUsers from './admin/AdminUsers'

function PublicLayout() {
  return (
    <>
      <Navbar />
      <main><Outlet /></main>
      <Footer />
    </>
  )
}

function AdminGuard() {
  return sessionStorage.getItem('dxadmin')
    ? <Outlet />
    : <Navigate to="/admin/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/"              element={<HomePage />} />
        <Route path="/movies"        element={<MoviesPage />} />
        <Route path="/movie/:slug"    element={<MovieDetailPage />} />
        <Route path="/search"        element={<SearchPage />} />
        <Route path="/pricing"       element={<PricingPage />} />
      </Route>

      <Route path="/login"    element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route path="/watch/:slug" element={<PlayerPage />} />

      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminGuard />}>
        <Route element={<AdminLayout />}>
          <Route index               element={<AdminDashboard />} />
          <Route path="movies"       element={<AdminMovies />} />
          <Route path="movies/new"   element={<AdminMovieForm />} />
          <Route path="movies/:id/edit" element={<AdminMovieForm />} />
          <Route path="movies/:id/episodes" element={<AdminEpisodes />} />
          <Route path="users"        element={<AdminUsers />} />
          <Route path="sliders"      element={<AdminSliders />} />
        </Route>
      </Route>
    </Routes>
  )
}
