import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Send, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './index.css';

export default function WishesScreen() {
  const [wishes, setWishes] = useState([]);
  const [newWish, setNewWish] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWishes = async () => {
      const { data, error } = await supabase.from('wishes').select('*').order('created_at', { ascending: false }).limit(60);
      if (data && !error) {
        const wishesWithMeta = data.map(wish => ({
          ...wish,
          left: Math.random() * 90, // 0% to 90%
          fontSize: Math.random() * 14 + 16, // 16px to 30px
          duration: Math.random() * 15 + 10, // 10s to 25s
          delay: -(Math.random() * 20), // negative delay so they start immediately at different positions
          opacityBase: Math.random() * 0.5 + 0.5 // 0.5 to 1
        }));
        setWishes(wishesWithMeta);
      }
    };

    fetchWishes();

    const channel = supabase
      .channel('schema-db-changes-wishes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'wishes' }, (payload) => {
        setWishes(prev => {
          const newW = {
            ...payload.new,
            left: Math.random() * 90,
            fontSize: Math.random() * 14 + 16,
            duration: Math.random() * 15 + 10,
            delay: 0, // starts from bottom when newly added
            opacityBase: 1
          };
          return [newW, ...prev];
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const submitWish = async (e) => {
    e.preventDefault();
    if (!newWish.trim()) return;
    const w = newWish;
    setNewWish('');
    
    // Optimistic UI push
    const tempId = Math.random().toString();
    const optimisticWish = {
      id: tempId,
      content: w,
      left: Math.random() * 90,
      fontSize: Math.random() * 14 + 16,
      duration: Math.random() * 15 + 10,
      delay: 0,
      opacityBase: 1
    };
    
    setWishes(prev => [optimisticWish, ...prev]);

    const { error } = await supabase.from('wishes').insert([{ content: w }]);
    if (error) {
      console.error(error);
      alert('Không thể gửi lời chúc, vui lòng thử lại.');
      // Remove optimistic if failed
      setWishes(prev => prev.filter(wish => wish.id !== tempId));
    }
  };

  return (
    <div className="wishes-screen-container">
      <div className="space-bg"></div>
      <div className="aurora export-aurora"></div>

      {/* Nút quay lại */}
      <button className="back-btn" onClick={() => navigate('/')}>
        <ArrowLeft size={24} /> Trở về
      </button>

      {/* Vùng bay lời chúc */}
      <div className="wishes-fullscreen-area">
        {wishes.map(wish => (
          <div 
            key={wish.id} 
            className="fullscreen-floating-wish"
            style={{
              left: `${wish.left}%`,
              fontSize: `${wish.fontSize}px`,
              animationDuration: `${wish.duration}s`,
              animationDelay: `${wish.delay}s`,
              opacity: wish.opacityBase
            }}
          >
            {wish.content}
          </div>
        ))}
      </div>

      {/* Ô nhập lời chúc bên dưới */}
      <div className="wishes-bottom-bar">
        <form onSubmit={submitWish} className="wishes-bottom-form">
          <input 
            type="text" 
            placeholder="Viết lời chúc của bạn gửi vào không gian..." 
            value={newWish} 
            onChange={(e) => setNewWish(e.target.value)}
            maxLength={100}
            required
          />
          <button type="submit" className="btn-send-fullscreen">
            <Send size={20} /> Gửi
          </button>
        </form>
      </div>
    </div>
  );
}
