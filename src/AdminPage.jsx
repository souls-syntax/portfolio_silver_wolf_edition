import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BackgroundVideo from './BackgroundVideo';
import { invalidateBlogCache } from './blogCache';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';

export default function AdminPage({ src }) {
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
  const [blogs, setBlogs] = useState([]);

  useEffect(() => {
    if (isAuthenticated) {
      fetch('/api/blogs')
        .then(res => res.json())
        .then(data => {
          if (data.blogs) setBlogs(data.blogs);
        })
        .catch(err => console.error(err));
    }
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
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
          'Authorization': `Bearer ${ADMIN_PASSWORD}`
        },
        body: JSON.stringify(blogData)
      });
      
      if (res.ok) {
        invalidateBlogCache(); // force fresh fetch next time blog page opens
        setStatus('Blog published successfully!');
        setTitle(''); setExcerpt(''); setTags(''); setContent(''); setSeriesId(''); setChapterIndex('');
      } else {
        const err = await res.json();
        setStatus(`Error: ${err.error}`);
      }
    } catch (err) {
      setStatus(`Network error: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Are you sure you want to delete blog "${id}"?`)) return;
    setStatus(`Deleting ${id}...`);
    try {
      const res = await fetch(`/api/blogs?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${ADMIN_PASSWORD}` }
      });
      if (res.ok) {
        invalidateBlogCache(); // force fresh fetch next time blog page opens
        setStatus(`Deleted ${id} successfully!`);
        setBlogs(blogs.filter(b => b.id !== id));
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
      <BackgroundVideo src={src} />
      <div className="admin-overlay" style={{
        position: 'absolute', inset: 0, zIndex: 10,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', color: 'white',
        fontFamily: 'Inter, sans-serif'
      }}>
        {!isAuthenticated ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 10, background: '#111', padding: 40, border: '1px solid #a855f7', borderRadius: 8, boxShadow: '0 0 30px rgba(168,85,247,0.2)' }}>
            <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, color: '#39ff14', fontSize: 24, margin: '0 0 10px 0', letterSpacing: 4 }}>SYSTEM ACCESS</h2>
            <input 
              type="password" 
              placeholder="Enter Access Code..." 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              style={{ padding: 12, background: 'rgba(34,211,238,0.1)', color: 'white', border: '1px solid #a855f7', fontFamily: 'JetBrains Mono, monospace', outline: 'none' }}
            />
            <button type="submit" style={{ padding: 12, background: 'linear-gradient(90deg, #39ff14, #a855f7)', color: 'black', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 800, letterSpacing: 2, fontSize: 16 }}>AUTHENTICATE</button>
            {status && <p style={{ color: '#ff3366', margin: 0, fontFamily: 'JetBrains Mono, monospace', fontSize: 14 }}>{status}</p>}
          </form>
        ) : (
          <div style={{ width: '100%', maxWidth: 800, background: 'rgba(10,5,20,0.9)', padding: 40, border: '1px solid #a855f7', overflowY: 'auto', maxHeight: '90vh', boxShadow: '0 0 40px rgba(168,85,247,0.3)', borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
              <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, color: '#39ff14', fontSize: 28, margin: 0, letterSpacing: 4 }}>ADMIN CONSOLE</h2>
              <button onClick={() => navigate('/blog')} style={{ background: 'none', border: '1px solid #39ff14', color: '#39ff14', padding: '8px 16px', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace' }}>BACK TO BLOG</button>
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
              <button type="submit" style={{ padding: 15, background: '#a855f7', color: 'white', border: 'none', cursor: 'pointer', fontFamily: 'Bebas Neue, sans-serif', letterSpacing: 2, fontSize: 20 }}>PUBLISH</button>
              {status && <p style={{ color: status.includes('Error') ? '#ff4444' : '#44ff44', textAlign: 'center' }}>{status}</p>}
            </form>

            <hr style={{ borderColor: '#444', margin: '40px 0 30px' }} />
            <h3 style={{ fontFamily: 'Anton, sans-serif', color: '#a855f7', fontSize: 28, margin: '0 0 20px 0', letterSpacing: 2 }}>MANAGE POSTS</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {blogs.map(blog => (
                <div key={blog.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1a0d2e', padding: 15, border: '1px solid #a855f7' }}>
                  <div>
                    <strong style={{ color: 'white', display: 'block', fontSize: 18, fontFamily: 'Inter, sans-serif' }}>{blog.title}</strong>
                    <small style={{ color: '#a855f7', fontFamily: 'JetBrains Mono, monospace' }}>{blog.id} • {blog.date}</small>
                  </div>
                  <button onClick={() => handleDelete(blog.id)} style={{ background: 'transparent', color: '#ff3366', border: '1px solid #ff3366', padding: '8px 16px', cursor: 'pointer', fontFamily: 'Bebas Neue, sans-serif', letterSpacing: 1, transition: 'all 0.2s' }} onMouseOver={e => {e.target.style.background = '#ff3366'; e.target.style.color = 'white'}} onMouseOut={e => {e.target.style.background = 'transparent'; e.target.style.color = '#ff3366'}}>DELETE</button>
                </div>
              ))}
              {blogs.length === 0 && <p style={{ color: '#888', fontStyle: 'italic' }}>No blogs found.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
