import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainScreen from './MainScreen';
import AdminApp from './AdminApp';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainScreen />} />
        <Route path="/admin" element={<AdminApp />} />
      </Routes>
    </BrowserRouter>
  );
}
