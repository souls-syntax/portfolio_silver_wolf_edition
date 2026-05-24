import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import bgVideo from './assets/main1.mp4';

export default function AdminPage() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  
  // Blog form state
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [tags, setTags] = useState('');
  const [content, setContent] = useState('');
  const [seriesId, setSeriesId] = useState('');
  const [chapterIndex, setChapterIndex] = useState('');
  
  const [status, setStatus] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsAuthenticated(true);
    } else {
      setStatus('Invalid password');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Submitting...');
    
    const blogData = {
      id: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
      title,
      excerpt,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      content,
      date: new Date().toISOString().split('T')[0],
      seriesId: seriesId || null,
      chapterIndex: chapterIndex ? parseInt(chapterIndex, 10) : null
    };

    try {
      const res = await fetch('/api/blogs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin123'
        },
        body: JSON.stringify(blogData)
      });
      
      if (res.ok) {
        setStatus('Blog published successfully!');
        setTitle('');
        setExcerpt('');
        setTags('');
        setContent('');
        setSeriesId('');
        setChapterIndex('');
      } else {
        const err = await res.json();
        setStatus(`Error: ${err.error}`);
      }
    } catch (err) {
      setStatus(`Network error: ${err.message}`);
    }
  };

  return (
    <div id="menu-screen">
      <video src={bgVideo} autoPlay loop muted playsInline />
      <div className="admin-overlay" style={{
        position: 'absolute', inset: 0, zIndex: 10,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', color: 'white',
        fontFamily: 'Inter, sans-serif'
      }}>
        {!isAuthenticated ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 10, background: '#111', padding: 30, border: '1px solid #c4001a' }}>
            <h2 style={{ fontFamily: 'Anton, sans-serif', color: '#c4001a', fontSize: 32, margin: 0 }}>ADMIN ACCESS</h2>
            <input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              style={{ padding: 10, background: '#222', color: 'white', border: '1px solid #444' }}
            />
            <button type="submit" style={{ padding: 10, background: '#c4001a', color: 'white', border: 'none', cursor: 'pointer', fontFamily: 'Bebas Neue, sans-serif', letterSpacing: 2, fontSize: 18 }}>LOGIN</button>
            {status && <p style={{ color: '#ff4444', margin: 0 }}>{status}</p>}
          </form>
        ) : (
          <div style={{ width: '100%', maxWidth: 800, background: '#111', padding: 30, border: '1px solid #c4001a', overflowY: 'auto', maxHeight: '90vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'Anton, sans-serif', color: '#c4001a', fontSize: 32, margin: 0 }}>NEW POST</h2>
              <button onClick={() => navigate('/blog')} style={{ background: 'none', border: '1px solid #c4001a', color: '#c4001a', padding: '5px 10px', cursor: 'pointer' }}>BACK TO BLOG</button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} required style={{ padding: 10, background: '#222', color: 'white', border: '1px solid #444' }} />
              <textarea placeholder="Excerpt" value={excerpt} onChange={e => setExcerpt(e.target.value)} required style={{ padding: 10, background: '#222', color: 'white', border: '1px solid #444', minHeight: 60 }} />
              <input type="text" placeholder="Tags (comma separated)" value={tags} onChange={e => setTags(e.target.value)} style={{ padding: 10, background: '#222', color: 'white', border: '1px solid #444' }} />
              <div style={{ display: 'flex', gap: 10 }}>
                <input type="text" placeholder="Series ID (optional)" value={seriesId} onChange={e => setSeriesId(e.target.value)} style={{ padding: 10, background: '#222', color: 'white', border: '1px solid #444', flex: 1 }} />
                <input type="number" placeholder="Chapter Index" value={chapterIndex} onChange={e => setChapterIndex(e.target.value)} style={{ padding: 10, background: '#222', color: 'white', border: '1px solid #444', width: 150 }} />
              </div>
              <textarea placeholder="Markdown Content" value={content} onChange={e => setContent(e.target.value)} required style={{ padding: 10, background: '#222', color: 'white', border: '1px solid #444', minHeight: 300, fontFamily: 'monospace' }} />
              <button type="submit" style={{ padding: 15, background: '#c4001a', color: 'white', border: 'none', cursor: 'pointer', fontFamily: 'Bebas Neue, sans-serif', letterSpacing: 2, fontSize: 20 }}>PUBLISH</button>
              {status && <p style={{ color: status.includes('Error') ? '#ff4444' : '#44ff44', textAlign: 'center' }}>{status}</p>}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
