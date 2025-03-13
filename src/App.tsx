import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { DoodleOfTheDay } from './pages/DoodleOfTheDay';
import { Footer } from './components/Footer';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/doodleoftheday" element={<DoodleOfTheDay />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;