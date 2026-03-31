import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainScreen from './MainScreen';
import AdminApp from './AdminApp';
import WishesScreen from './WishesScreen';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainScreen />} />
        <Route path="/admin" element={<AdminApp />} />
        <Route path="/wishes" element={<WishesScreen />} />
      </Routes>
    </BrowserRouter>
  );
}
