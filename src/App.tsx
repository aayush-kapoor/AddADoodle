import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { DoodleOfTheDay } from './pages/DoodleOfTheDay';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/doodleoftheday" element={<DoodleOfTheDay />} />
      </Routes>
    </Router>
  );
}

export default App;