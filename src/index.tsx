import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';

/* Ionic required CSS */
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');
createRoot(container).render(<React.StrictMode><App /></React.StrictMode>);
