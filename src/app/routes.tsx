import React, { Suspense } from 'react';
import { IonRouterOutlet, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Redirect, Switch } from 'react-router-dom';
import { homeOutline, cameraOutline, documentTextOutline, settingsOutline } from 'ionicons/icons';
import type { User } from '../types';

const LoginPage           = React.lazy(() => import('../features/auth/LoginPage'));
const HomeTab             = React.lazy(() => import('../features/assignments/HomeTab'));
const CameraPage          = React.lazy(() => import('../features/capture/CameraPage'));
const ReviewPage          = React.lazy(() => import('../features/review/ReviewSubmissionPage'));
const AssessmentListPage  = React.lazy(() => import('../features/assignments/AssignmentListPage'));
const AssignmentDetail    = React.lazy(() => import('../features/assignments/AssignmentDetailPage'));
const SettingsPage        = React.lazy(() => import('../features/auth/SettingsPage'));

interface Props { user: User | null; }

export const AppRoutes: React.FC<Props> = ({ user }) => (
  <IonReactRouter>
    <Suspense fallback={null}>
      <Switch>
        {/* Public */}
        <Route exact path="/login" component={LoginPage} />

        {/* Authenticated */}
        <Route path="/app">
          {!user ? <Redirect to="/login" /> : (
            <IonTabs>
              <IonRouterOutlet>
                <Route exact path="/app/home"                     component={HomeTab} />
                <Route exact path="/app/camera"                   component={CameraPage} />
                <Route exact path="/app/camera/review/:sessionId" component={ReviewPage} />
                <Route exact path="/app/assessments"              component={AssessmentListPage} />
                <Route exact path="/app/assessments/:id"          component={AssignmentDetail} />
                <Route exact path="/app/settings"                 component={SettingsPage} />
                <Redirect exact from="/app"                       to="/app/home" />
              </IonRouterOutlet>

              <IonTabBar slot="bottom">
                <IonTabButton tab="home" href="/app/home">
                  <IonIcon icon={homeOutline} />
                  <IonLabel>Home</IonLabel>
                </IonTabButton>

                <IonTabButton tab="camera" href="/app/camera">
                  <IonIcon icon={cameraOutline} />
                  <IonLabel>Capture</IonLabel>
                </IonTabButton>

                <IonTabButton tab="assessments" href="/app/assessments">
                  <IonIcon icon={documentTextOutline} />
                  <IonLabel>Assessments</IonLabel>
                </IonTabButton>

                <IonTabButton tab="settings" href="/app/settings">
                  <IonIcon icon={settingsOutline} />
                  <IonLabel>Settings</IonLabel>
                </IonTabButton>
              </IonTabBar>
            </IonTabs>
          )}
        </Route>

        <Redirect exact from="/" to={user ? '/app/home' : '/login'} />
      </Switch>
    </Suspense>
  </IonReactRouter>
);
