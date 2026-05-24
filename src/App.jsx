import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import menuVideo from './assets/circletransition.mp4'
import main1 from './assets/main1.mp4'
import main2 from './assets/main1.mp4'
import main3 from './assets/main1.mp4'
import P3Menu from './P3Menu'
import VideoPage from './VideoPage'
import ResumePage from './ResumePage'
import PageTransition from './PageTransition'
import Socials from './Socials'
import AboutMe from './AboutMe'
import BlogPage from './BlogPage'
import BlogPost from './BlogPost'
import AdminPage from './AdminPage'
import './App.css'

function MenuScreen() {
  const navigate = useNavigate()
  return (
    <div id="menu-screen">
      <video src={menuVideo} autoPlay loop muted playsInline />
      <P3Menu onNavigate={(page) => {
        if (page === 'github') {
          window.open('https://github.com/souls-syntax', '_blank')
        } else {
          navigate(`/${page}`)
        }
      }} />
    </div>
  )
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <PageTransition><MenuScreen /></PageTransition>
        } />
        <Route path="/about" element={
          <PageTransition variant="about"><AboutMe /></PageTransition>
        } />
        <Route path="/resume" element={
          <PageTransition><ResumePage src={main2} /></PageTransition>
        } />
        <Route path="/socials" element={
          <PageTransition variant="socials"><Socials /></PageTransition>
        } />
        <Route path="/sideproj" element={
          <PageTransition><ResumePage src={main3} mode="projects" /></PageTransition>
        } />
        <Route path="/blog" element={
          <PageTransition><BlogPage /></PageTransition>
        } />
        <Route path="/blog/:id" element={
          <PageTransition><BlogPost /></PageTransition>
        } />
        <Route path="/admin" element={
          <PageTransition><AdminPage /></PageTransition>
        } />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return <AnimatedRoutes />
}
