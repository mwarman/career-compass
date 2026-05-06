import React from 'react';
import ReactDOM from 'react-dom/client';
import './globals.css';

// Placeholder for App component - to be implemented in future milestones
function App() {
  return (
    <div>
      <h1>Career Compass</h1>
    </div>
  );
}

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
