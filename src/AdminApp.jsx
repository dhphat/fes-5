import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Trash2, Plus, LogOut, Edit2 } from 'lucide-react';
import './index.css';

export default function AdminApp() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [projects, setProjects] = useState([]);
  const [wishes, setWishes] = useState([]);
  const [defaultAvatar, setDefaultAvatar] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Form add/edit
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [label, setLabel] = useState('');
  const [file, setFile] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchProjects();
      fetchWishes();
    }
  }, [session]);

  const fetchProjects = async () => {
    const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: true });
    if (!error && data) {
      const defaultAva = data.find(p => p.label === 'DEFAULT_AVATAR');
      setDefaultAvatar(defaultAva || null);
      setProjects(data.filter(p => p.label !== 'DEFAULT_AVATAR'));
    }
  };

  const fetchWishes = async () => {
    const { data, error } = await supabase.from('wishes').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setWishes(data);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    let imageUrl = null;
    
    // Upload image if file exists
    if (file) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('images').upload(fileName, file);
      
      if (uploadError) {
        alert('Lỗi tải ảnh lên: ' + uploadError.message);
        setLoading(false);
        return;
      }
      
      const { data } = supabase.storage.from('images').getPublicUrl(fileName);
      imageUrl = data.publicUrl;
    }

    if (isEditing) {
      const updateData = { label };
      if (imageUrl) updateData.image_url = imageUrl;
      
      const { error } = await supabase.from('projects').update(updateData).eq('id', editId);
      if (error) alert(error.message);
    } else {
      if (!imageUrl) {
        alert('Vui lòng chọn ảnh');
        setLoading(false);
        return;
      }
      const { error } = await supabase.from('projects').insert([{ label, image_url: imageUrl }]);
      if (error) alert(error.message);
    }

    setLabel('');
    setFile(null);
    setIsEditing(false);
    setEditId(null);
    fetchProjects();
    setLoading(false);
  };

  const handleDelete = async (id, imageUrl) => {
    if (!window.confirm('Bạn có chắc chắn muốn xoá?')) return;
    
    // Xoá ảnh trong storage (optional but good practice)
    try {
      const fileName = imageUrl.split('/').pop();
      await supabase.storage.from('images').remove([fileName]);
    } catch(e) {}

    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchProjects();
  };

  const handleDeleteWish = async (id) => {
    if (!window.confirm('Xoá lời chúc này?')) return;
    const { error } = await supabase.from('wishes').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchWishes();
  };

  const handleEditClick = (p) => {
    setIsEditing(true);
    setEditId(p.id);
    setLabel(p.label);
    setFile(null); // Force choose new if they want, else keep old
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!session) {
    return (
      <div className="admin-login-container">
        <form className="admin-login-form" onSubmit={handleLogin}>
          <h2>Trang Quản Trị</h2>
          <input 
            type="email" 
            placeholder="Email..." 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
          />
          <input 
            type="password" 
            placeholder="Mật khẩu..." 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h2>Quản lý Project Nodes</h2>
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={16} /> Thoát
        </button>
      </div>

      <div className="admin-content">
        {/* Default Avatar Config Box */}
        <div className="admin-form-card" style={{ marginBottom: '20px' }}>
          <h3>Avatar Mặc Định Của Website</h3>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            {defaultAvatar ? (
              <img src={defaultAvatar.image_url} alt="Default Avatar" style={{ width: 80, height: 80, borderRadius: '50%', border: '2px solid #00d2ff', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems:'center', justifyContent: 'center' }}>Trống</div>
            )}
            <div style={{ flex: 1 }}>
              <button 
                className="btn-save" 
                onClick={() => {
                  setLabel('DEFAULT_AVATAR');
                  setEditId(defaultAvatar ? defaultAvatar.id : null);
                  setIsEditing(!!defaultAvatar);
                  setFile(null);
                }}
              >
                {defaultAvatar ? 'Thay đổi Avatar' : 'Thiết lập Avatar'}
              </button>
            </div>
          </div>
        </div>
        <div className="admin-form-card">
          <h3>
            {label === 'DEFAULT_AVATAR' ? 'Cập nhật Avatar Mặc Định' : (isEditing ? 'Chỉnh sửa Project' : 'Thêm mới Project')}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Tên dự án (Label):</label>
              <input type="text" value={label} onChange={e => setLabel(e.target.value)} required disabled={label === 'DEFAULT_AVATAR'} />
            </div>
            <div className="form-group">
              <label>Hình ảnh (Image):</label>
              <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} required={!isEditing} />
            </div>
            <div className="form-actions">
              {isEditing && (
                <button type="button" className="btn-cancel" onClick={() => { setIsEditing(false); setLabel(''); setFile(null); }}>
                  Hủy
                </button>
              )}
              <button type="submit" className="btn-save" disabled={loading}>
                {loading ? 'Đang lưu...' : (isEditing ? 'Cập nhật' : 'Thêm mới')}
              </button>
            </div>
          </form>
        </div>

        <div className="admin-list-card">
          <h3>Danh sách Projects ({projects.length})</h3>
          <div className="admin-projects-grid">
            {projects.map(p => (
              <div key={p.id} className="admin-project-item">
                <img src={p.image_url} alt={p.label} />
                <div className="admin-project-info">
                  <p>{p.label}</p>
                </div>
                <div className="admin-project-actions">
                  <button onClick={() => handleEditClick(p)} className="btn-edit"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(p.id, p.image_url)} className="btn-delete"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Wishes Moderation Section */}
        <div className="admin-list-card wishes-moderation-card">
          <h3>Quản lý Lời chúc ({wishes.length})</h3>
          <div className="admin-wishes-list">
            {wishes.map(w => (
              <div key={w.id} className="admin-wish-item">
                <div className="admin-wish-content">
                  <p>{w.content}</p>
                  <small>{new Date(w.created_at).toLocaleString()}</small>
                </div>
                <button onClick={() => handleDeleteWish(w.id)} className="btn-delete-wish">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
