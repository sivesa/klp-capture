import React, { useEffect } from 'react';
import { IonApp, setupIonicReact } from '@ionic/react';
import { AppRoutes } from './routes';
import { useAuth } from '../hooks';
import { syncQueue } from '../services/sync/queue';
import '../theme/variables.css';
import '../theme/global.css';

setupIonicReact({ mode: 'md', animated: true });

const App: React.FC = () => {
  const { user, loading } = useAuth();

  useEffect(() => {
    // Drain any queued submissions on launch
    syncQueue.processQueue();
  }, []);

  if (loading) return null;

  return (
    <IonApp>
      <AppRoutes user={user} />
    </IonApp>
  );
};

export default App;
