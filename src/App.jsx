import React, { useState, useEffect, useRef } from 'react';
import * as htmlToImage from 'html-to-image';
import './index.css';

const projectsData = [
  { id: 'p1', image: '/images/project_1.png', label: 'Project Alpha' },
  { id: 'p2', image: '/images/project_2.png', label: 'Cube Matrix' },
  { id: 'p3', image: '/images/project_3.png', label: 'Starlight' },
  { id: 'p4', image: '/images/project_1.png', label: 'Project Delta' },
  { id: 'p5', image: '/images/project_2.png', label: 'Cube Nexus' },
  { id: 'p6', image: '/images/project_3.png', label: 'Starlight Nova' },
];

export default function App() {
  const [connections, setConnections] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  
  const connectionsRef = useRef(connections);
  const isDrawingRef = useRef(isDrawing);
  
  useEffect(() => {
    connectionsRef.current = connections;
  }, [connections]);
  
  useEffect(() => {
    isDrawingRef.current = isDrawing;
  }, [isDrawing]);

  const nodePos = useRef({}); 
  const basePos = useRef({}); 
  const mousePos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const dragInfo = useRef({ activeId: null, offsetX: 0, offsetY: 0, moved: false, startX: 0, startY: 0 });
  const reqRef = useRef();
  
  const avatarRef = useRef(null);
  const projectRefs = useRef({});
  const drawingLineRef = useRef(null);
  
  const orbitParams = useRef({});

  useEffect(() => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    
    basePos.current['avatar'] = { x: cx, y: cy };
    orbitParams.current['avatar'] = {
      speedX: 0.0003, speedY: 0.0004,
      phaseX: 0, phaseY: 0,
      ampX: 10, ampY: 10
    };

    projectsData.forEach((p, idx) => {
      const angle = (idx / projectsData.length) * Math.PI * 2;
      basePos.current[p.id] = { x: cx, y: cy };
      
      orbitParams.current[p.id] = {
        baseAngle: angle,
        distX: 250 + Math.random() * 150,
        distY: 200 + Math.random() * 150,
        speedX: 0.0004 + Math.random() * 0.0004,
        speedY: 0.0006 + Math.random() * 0.0004,
      };
    });

    const animate = (time) => {
      const avBase = basePos.current['avatar'];
      const av = orbitParams.current['avatar'];
      let ax = avBase.x + Math.sin(time * av.speedX + av.phaseX) * av.ampX;
      let ay = avBase.y + Math.cos(time * av.speedY + av.phaseY) * av.ampY;
      
      if (dragInfo.current.activeId === 'avatar') {
        ax = mousePos.current.x - dragInfo.current.offsetX;
        ay = mousePos.current.y - dragInfo.current.offsetY;
        basePos.current['avatar'] = { x: ax, y: ay };
      }
      
      nodePos.current['avatar'] = { x: ax, y: ay };
      if (avatarRef.current) {
        avatarRef.current.style.transform = `translate(${ax - 60}px, ${ay - 60}px)`;
      }

      projectsData.forEach(p => {
        const pb = basePos.current[p.id];
        const op = orbitParams.current[p.id];
        let px = pb.x + Math.cos(op.baseAngle + time * op.speedX) * op.distX;
        let py = pb.y + Math.sin(op.baseAngle + time * op.speedY) * op.distY;
        
        if (dragInfo.current.activeId === p.id) {
          px = mousePos.current.x - dragInfo.current.offsetX;
          py = mousePos.current.y - dragInfo.current.offsetY;
          basePos.current[p.id] = {
             x: px - Math.cos(op.baseAngle + time * op.speedX) * op.distX,
             y: py - Math.sin(op.baseAngle + time * op.speedY) * op.distY
          };
        }
        
        nodePos.current[p.id] = { x: px, y: py };
        if (projectRefs.current[p.id]) {
          projectRefs.current[p.id].style.transform = `translate(${px - 45}px, ${py - 45}px)`;
        }
      });

      projectsData.forEach(p => {
        const pathEl = document.getElementById(`line-${p.id}`);
        const hitEl = document.getElementById(`hit-${p.id}`);
        if (pathEl && hitEl) {
          if (connectionsRef.current.includes(p.id)) {
            const pathData = drawCurve(nodePos.current['avatar'], nodePos.current[p.id]);
            pathEl.setAttribute('d', pathData);
            hitEl.setAttribute('d', pathData);
            pathEl.style.display = 'block';
            hitEl.style.display = 'block';
          } else {
            pathEl.style.display = 'none';
            hitEl.style.display = 'none';
          }
        }
      });

      if (drawingLineRef.current) {
        if (isDrawingRef.current && !dragInfo.current.activeId) {
          drawingLineRef.current.setAttribute('d', drawCurve(nodePos.current['avatar'], mousePos.current));
          drawingLineRef.current.style.display = 'block';
        } else {
          drawingLineRef.current.style.display = 'none';
        }
      }

      reqRef.current = requestAnimationFrame(animate);
    };

    reqRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(reqRef.current);
  }, []); 

  useEffect(() => {
    const handlePointerMove = (e) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      if (dragInfo.current.activeId) {
        const dx = e.clientX - dragInfo.current.startX;
        const dy = e.clientY - dragInfo.current.startY;
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
           dragInfo.current.moved = true;
        }
      }
    };
    const handlePointerUp = () => {
      if (dragInfo.current.activeId) {
        dragInfo.current.activeId = null; 
      }
    };
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  const drawCurve = (start, end) => {
    if (!start || !end) return '';
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const cx = start.x + dx / 2;
    const cy = start.y + dy / 2 + 100;
    return `M ${start.x} ${start.y} Q ${cx} ${cy} ${end.x} ${end.y}`;
  };

  const handleNodePointerDown = (e, id) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    dragInfo.current = {
      activeId: id,
      offsetX: e.clientX - cx,
      offsetY: e.clientY - cy,
      startX: e.clientX,
      startY: e.clientY,
      moved: false
    };
  };

  const handleAvatarClick = () => {
    if (!dragInfo.current.moved) {
      setIsDrawing((prev) => !prev);
    }
  };

  const handleProjectClick = (pId) => {
    // Only connect if we didn't drag it
    if (!dragInfo.current.moved && isDrawing) {
      if (!connections.includes(pId)) {
        setConnections([...connections, pId]);
      }
      setIsDrawing(false); 
    }
  };

  const handleRemoveConnection = (pId) => {
    setConnections(prev => prev.filter(id => id !== pId));
  };

  const downloadImage = async () => {
    try {
      const btn = document.querySelector('.download-container');
      if(btn) btn.style.display = 'none';
      
      const dataUrl = await htmlToImage.toJpeg(document.body, { 
        quality: 0.95, 
        pixelRatio: window.devicePixelRatio || 2,
        backgroundColor: '#0B192C'
      });
      
      if(btn) btn.style.display = 'flex';

      const link = document.createElement('a');
      link.download = 'fpt-ses-moment.jpg';
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download image', err);
    }
  };

  return (
    <div className="app-container">
      <div className="space-bg"></div>
      <div className="aurora"></div>

      <svg className="canvas-layer">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        {projectsData.map(p => (
          <g key={p.id}>
             <path 
               id={`line-${p.id}`} 
               className="connection-path" 
               filter="url(#glow)" 
               fill="none" 
               stroke="#00d2ff" 
               strokeWidth="4" 
             />
             <path 
               id={`hit-${p.id}`} 
               className="connection-hitpath" 
               fill="none" 
               stroke="transparent" 
               strokeWidth="25"
               onClick={() => handleRemoveConnection(p.id)}
               onPointerEnter={() => {
                 document.getElementById(`line-${p.id}`).classList.add('path-hovered');
               }}
               onPointerLeave={() => {
                 document.getElementById(`line-${p.id}`).classList.remove('path-hovered');
               }}
             />
          </g>
        ))}
        <path 
          ref={drawingLineRef} 
          className="drawing-path" 
          fill="none" 
          stroke="#00d2ff" 
          strokeWidth="4" 
        />
      </svg>

      {/* Avatar */}
      <div 
        ref={avatarRef}
        className={`node avatar-node ${isDrawing ? 'avatar-active' : ''}`}
        onPointerDown={(e) => handleNodePointerDown(e, 'avatar')}
        onClick={handleAvatarClick}
        style={{ touchAction: 'none' }}
      >
        <img src="/images/avatar.png" alt="Avatar" className="avatar-img" draggable="false" />
      </div>

      {/* Projects */}
      {projectsData.map((p) => (
        <div
          key={p.id}
          id={p.id}
          ref={el => projectRefs.current[p.id] = el}
          className={`node project-node ${connections.includes(p.id) ? 'project-connected' : ''}`}
          onPointerDown={(e) => handleNodePointerDown(e, p.id)}
          onClick={() => handleProjectClick(p.id)}
          onPointerEnter={() => {
            if(isDrawing && projectRefs.current[p.id]) {
               projectRefs.current[p.id].style.boxShadow = '0 0 40px #00d2ff, inset 0 0 20px #00d2ff';
               projectRefs.current[p.id].style.borderColor = '#00d2ff';
            }
          }}
          onPointerLeave={() => {
            if(projectRefs.current[p.id] && !connections.includes(p.id)) {
               projectRefs.current[p.id].style.boxShadow = '';
               projectRefs.current[p.id].style.borderColor = 'rgba(255, 255, 255, 0.3)';
            }
          }}
          style={{ touchAction: 'none' }}
        >
          <img src={p.image} alt={p.label} className="project-img" draggable="false" />
        </div>
      ))}

      {connections.length > 0 && (
        <div className="download-container">
          <button className="download-btn" onClick={downloadImage}>
            Chụp khoảnh khắc
          </button>
        </div>
      )}
    </div>
  );
}
