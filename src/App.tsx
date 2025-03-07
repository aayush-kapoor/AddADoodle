import React from 'react';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { ZoomControls } from './components/ZoomControls';
import { UndoRedo } from './components/UndoRedo';
import { useStore } from './store/useStore';

function App() {
  const { theme, tool } = useStore();

  return (
    <div className={`min-h-screen ${
      theme === 'dark' ? 'bg-black text-white theme-dark' : 'bg-white text-black theme-light'
    } ${tool === 'select' ? 'cursor-select' : tool === 'line' ? 'cursor-line' : tool === 'hand' ? 'cursor-hand' : 'cursor-eraser'}`}>
      <Canvas />
      <Toolbar />
      <ZoomControls />
      <UndoRedo />
    </div>
  );
}

export default App;