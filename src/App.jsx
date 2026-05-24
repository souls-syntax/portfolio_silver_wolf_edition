import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'
import menuVideo from './assets/silver-wolf-honkai-star-rail-4k-wallpaperwaifu-com.mp4'
import P3Menu from './P3Menu'
import VideoPage from './VideoPage'
import ResumePage from './ResumePage'
import PageTransition from './PageTransition'
import Socials from './Socials'
import AboutMe from './AboutMe'
import BlogPage from './BlogPage'
import BlogPost from './BlogPost'
import AdminPage from './AdminPage'
import ProjectPage from './projects'
import BackgroundVideo from './BackgroundVideo'
import { prefetchBlogs } from './blogCache'
import { prefetchImages, prefetchVideo } from './assetCache'
import './App.css'

// Import heavy assets for prefetching
import char1 from './assets/Silverwolf_Render1_Hoyo-transparents.png'
import char2 from './assets/Silverwolf_Render2_Hoyo-transparents.png'
import char3 from './assets/Silverwolf_Render3_Hoyo-transparents.png'
import logo from './assets/silver_wold_curtrated_souls_syntax_logo.png'
import card from './assets/card.png'
import newsign from './assets/newsign.png'

function MenuScreen() {
  const navigate = useNavigate()
  return (
    <div id="menu-screen">
      <BackgroundVideo src={menuVideo} style={{ filter: 'blur(10px) brightness(0.4) saturate(1.2)' }} />
      <div className="hsr-dim-overlay" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 50%, transparent 20%, rgba(6,3,15,0.8) 100%)', zIndex: 1 }} />
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
          <PageTransition><ResumePage src={menuVideo} /></PageTransition>
        } />
        <Route path="/socials" element={
          <PageTransition variant="socials"><Socials /></PageTransition>
        } />
        <Route path="/sideproj" element={
          <PageTransition><ProjectPage src={menuVideo} mode="projects" /></PageTransition>
        } />
        <Route path="/blog" element={
          <PageTransition><BlogPage src={menuVideo} /></PageTransition>
        } />
        <Route path="/blog/:id" element={
          <PageTransition><BlogPost src={menuVideo} /></PageTransition>
        } />
        <Route path="/admin" element={
          <PageTransition><AdminPage src={menuVideo} /></PageTransition>
        } />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  useEffect(() => {
    // Prefetch API data
    prefetchBlogs();
    
    // Prefetch background video
    prefetchVideo(menuVideo);
    
    // Prefetch heavy images
    prefetchImages([
      char1,
      char2,
      char3,
      logo,
      card,
      newsign
    ]);
  }, []);
  
  return <AnimatedRoutes />
}
