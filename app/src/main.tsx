import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { Act1Preview } from './components/story/Act1Preview';
import './styles.css';

const params = new URLSearchParams(window.location.search);
const previewMode = params.get('preview');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {previewMode === 'act1' ? <Act1Preview /> : <App />}
  </StrictMode>
);
