import React, { useState, useEffect } from 'react';
import WelcomeScreen from './screens/WelcomeScreen';
import LoginRegistration from './screens/LoginRegistration';
import LanguageSelection from './screens/LanguageSelection';
import Dashboard from './screens/Dashboard';
import AIAdvisoryChatbot from './screens/AIAdvisoryChatbot';
import FarmActionCenter from './screens/FarmActionCenter';
import NotificationCentre from './screens/NotificationCentre';
import AccountInformation from './screens/AccountInformation';
import ProfileSettings from './screens/ProfileSettings';
import CropAnalysisResults from './screens/CropAnalysisResults';
import WeatherInsights from './screens/WeatherInsights';
import FarmSelectionList from './screens/FarmSelectionList';
import FarmCreationWizard from './screens/FarmCreationWizard';
import FarmCreatedSuccess from './screens/FarmCreatedSuccess';
import QuickFarmSwitcher from './screens/QuickFarmSwitcher';
import SchemesDashboard from './screens/SchemesDashboard';
import RiskAlertDetails from './screens/RiskAlertDetails';
import TodayPriorityTasks from './screens/TodayPriorityTasks';
import CropScannerViewfinder from './screens/CropScannerViewfinder';
import AICopilotProcessingState from './screens/AICopilotProcessingState';
import FarmerProfileSetup from './screens/FarmerProfileSetup';
import SatelliteImagery from './screens/SatelliteImagery';
import LiveMarketPrices from './screens/LiveMarketPrices';
import SoilHealthReport from './screens/SoilHealthReport';
import FertilizerMarketplace from './screens/FertilizerMarketplace';
import AMIInsightCenter from './screens/AMIInsightCenter';

import { authAPI } from './api';
import { supabase, signInWithGoogle } from './supabaseClient';

function App() {
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user');
      return (localStorage.getItem('token') && storedUser) ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });
  const [currentScreen, setCurrentScreen] = useState(() => {
    return (localStorage.getItem('token') && localStorage.getItem('user')) ? 'dashboard' : 'welcome';
  });
  const [language, setLanguage] = useState(() => localStorage.getItem('kisan_lang') || 'en');
  const [userLocation, setUserLocation] = useState(() => {
    try {
      const stored = localStorage.getItem('kisan_location');
      return stored ? JSON.parse(stored) : { state: 'Madhya Pradesh', district: 'Indore', city: 'Indore' };
    } catch {
      return { state: 'Madhya Pradesh', district: 'Indore', city: 'Indore' };
    }
  });
  const [scanResult, setScanResult] = useState(null);
  const [chatContext, setChatContext] = useState(null);
  const [selectedFarmId, setSelectedFarmId] = useState(null);

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    localStorage.setItem('kisan_lang', newLang);
  };

  const handleLocationChange = (newLoc) => {
    setUserLocation(newLoc);
    try {
      localStorage.setItem('kisan_location', JSON.stringify(newLoc));
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    // Check for incoming Supabase OAuth callback in URL hash or session
    const checkOAuthSession = async () => {
      try {
        // Direct Hash Extraction (Handles both Supabase JS client and direct redirect flows)
        let accessToken = null;
        if (window.location.hash && window.location.hash.includes('access_token=')) {
          const hashStr = window.location.hash.substring(1);
          const hashParams = new URLSearchParams(hashStr);
          accessToken = hashParams.get('access_token');
        }

        // Try getting session from Supabase client if available
        let sessionUser = null;
        if (supabase?.auth?.getSession) {
          const { data } = await supabase.auth.getSession();
          if (data?.session) {
            accessToken = accessToken || data.session.access_token;
            sessionUser = data.session.user;
          }
        }

        if (accessToken) {
          console.log('Detected Google OAuth token, syncing session...');
          const syncRes = await authAPI.syncGoogleUser(accessToken, sessionUser);
          const loggedInUser = syncRes.data.user;
          const authToken = syncRes.data.token || accessToken;

          localStorage.setItem('token', authToken);
          localStorage.setItem('user', JSON.stringify(loggedInUser));
          setUserProfile(loggedInUser);

          if (window.location.hash || window.location.search.includes('code=')) {
            window.history.replaceState(null, '', window.location.pathname);
          }
          setCurrentScreen('dashboard');
        }
      } catch (err) {
        console.error('Error handling OAuth callback:', err);
      }
    };

    checkOAuthSession();

    // 3. Listen for real-time auth state changes from Supabase
    let authListener = null;
    if (supabase?.auth?.onAuthStateChange) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
          try {
            const syncRes = await authAPI.syncGoogleUser(session.access_token, session.user);
            const loggedInUser = syncRes.data.user;
            const authToken = syncRes.data.token || session.access_token;
            localStorage.setItem('token', authToken);
            localStorage.setItem('user', JSON.stringify(loggedInUser));
            setUserProfile(loggedInUser);
            if (window.location.hash) {
              window.history.replaceState(null, '', window.location.pathname);
            }
          } catch (e) {
            console.error('Auth state change sync failed:', e);
          }
        }
      });
      authListener = data;
    }

    return () => {
      authListener?.subscription?.unsubscribe?.();
    };
  }, []);

  const navigateTo = (screen) => {
    // Handle logout specially
    if (screen === 'logout') {
      handleLogout();
      return;
    }

    // Implement strict auth blocking per user requirements
    const publicScreens = ['welcome', 'language', 'login'];
    const token = localStorage.getItem('token');

    if (!publicScreens.includes(screen) && !token) {
      console.warn(`Blocked navigation to ${screen} without auth token. Redirecting to login.`);
      setCurrentScreen('login');
      return;
    }
    setCurrentScreen(screen);
  };

  const [authInitialTab, setAuthInitialTab] = useState('login');

  // --- Auth Handlers ---
  const handleLogin = async (email, password) => {
    const { data } = await authAPI.login(email, password);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUserProfile(data.user);
    navigateTo('dashboard');
    return data;
  };

  const handleRegister = async (payloadOrEmail, password, name) => {
    const { data } = await authAPI.register(payloadOrEmail, password, name);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUserProfile(data.user);
    navigateTo('dashboard');
    return data;
  };

  const handleGoogleLogin = async () => {
    try {
      const res = await signInWithGoogle(window.location.origin);
      if (!res) {
        // Fallback to direct auth URL endpoint
        const { data } = await authAPI.getGoogleAuthUrl(window.location.origin);
        if (data?.url) {
          window.location.href = data.url;
        }
      }
    } catch (err) {
      console.error('Google Sign In trigger error, falling back to direct URL:', err);
      const { data } = await authAPI.getGoogleAuthUrl(window.location.origin);
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw err;
      }
    }
  };

  const handleProfileComplete = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      const updatedUser = response.data.user;
      setUserProfile(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      navigateTo('dashboard');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUserProfile(null);
    setSelectedFarmId(null);
    navigateTo('welcome');
  };

  const handleScanCapture = (result) => {
    setScanResult(result);
    navigateTo('scan-results');
  };

  return (
    <div className="min-h-[100dvh] bg-slate-900 md:bg-gray-800 dark:bg-black flex justify-center items-center">
      <div className="w-full max-w-md h-[100dvh] md:h-[90dvh] md:max-h-[850px] md:rounded-[2.5rem] bg-background-light dark:bg-background-dark overflow-hidden relative shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] flex flex-col transform translate-x-0">
        <div className="flex-1 w-full h-full overflow-y-auto no-scrollbar relative flex flex-col">
          {currentScreen === 'welcome' && (
            <WelcomeScreen
              language={language}
              onLanguageChange={handleLanguageChange}
              onGetStarted={() => navigateTo('language')}
              onLogin={() => {
                setAuthInitialTab('login');
                navigateTo('login');
              }}
              onRegister={() => {
                setAuthInitialTab('register');
                navigateTo('login');
              }}
            />
          )}
          {currentScreen === 'language' && (
            <LanguageSelection 
              currentLanguage={language}
              onContinue={(lang) => {
                handleLanguageChange(lang || 'en');
                setAuthInitialTab('register');
                navigateTo('login');
              }} 
            />
          )}
          {currentScreen === 'login' && (
            <LoginRegistration
              initialTab={authInitialTab}
              language={language}
              onLanguageChange={handleLanguageChange}
              onLogin={handleLogin}
              onRegister={handleRegister}
              onGoogleLogin={handleGoogleLogin}
              onBack={() => navigateTo('welcome')}
            />
          )}
          {currentScreen === 'profile-setup' && (
            <FarmerProfileSetup
              onComplete={handleProfileComplete}
              onBack={() => navigateTo('dashboard')}
            />
          )}
          {currentScreen === 'dashboard' && (
            <Dashboard
              onAICopilotClick={() => {
                setChatContext(null);
                navigateTo('chat');
              }}
              onNotificationClick={() => navigateTo('notifications')}
              onProfileClick={() => navigateTo('account-info')}
              onScanClick={() => navigateTo('scanner')}
              onWeatherClick={() => navigateTo('weather')}
              onFarmSwitcherClick={() => navigateTo('farm-switcher')}
              onSchemesClick={() => navigateTo('schemes')}
              onTodayFocusClick={() => navigateTo('priority-tasks')}
              onMandiPricesClick={() => navigateTo('mandi-prices')}
              onSoilTestClick={() => navigateTo('soil-test')}
              onNavigate={navigateTo}
              userProfile={userProfile}
              selectedFarmId={selectedFarmId}
              userLocation={userLocation}
              onLocationChange={handleLocationChange}
            />
          )}
          {currentScreen === 'farm-list' && (
            <FarmSelectionList
              onBack={() => navigateTo('dashboard')}
              onFarmClick={(id) => {
                setSelectedFarmId(id);
                navigateTo('farm-center');
              }}
              onNotificationClick={() => navigateTo('notifications')}
              onAddFarm={() => navigateTo('farm-wizard')}
              onNavigate={navigateTo}
              userProfile={userProfile}
            />
          )}
          {currentScreen === 'farm-wizard' && (
            <FarmCreationWizard
              onBack={() => navigateTo('farm-list')}
              onComplete={(newFarm) => {
                if (newFarm && newFarm._id) {
                  setSelectedFarmId(newFarm._id);
                }
                navigateTo('farm-success');
              }}
            />
          )}
          {currentScreen === 'farm-success' && (
            <FarmCreatedSuccess
              onGoToDashboard={() => navigateTo('dashboard')}
              onAddAnother={() => navigateTo('farm-wizard')}
            />
          )}
          {currentScreen === 'weather' && (
            <WeatherInsights
              onBack={() => navigateTo('dashboard')}
              onNavigate={navigateTo}
              selectedFarmId={selectedFarmId}
            />
          )}
          {currentScreen === 'farm-center' && (
            <FarmActionCenter
              onBack={() => navigateTo('farm-list')}
              onAICopilotClick={() => {
                setChatContext(null);
                navigateTo('chat');
              }}
              onNavigate={(screen) => {
                if (screen === 'satellite') navigateTo('satellite');
                else navigateTo(screen);
              }}
            />
          )}
          {currentScreen === 'satellite' && (
            <SatelliteImagery
              onBack={() => navigateTo('farm-center')}
              farmId={selectedFarmId}
            />
          )}
          {currentScreen === 'chat' && (
            <AIAdvisoryChatbot
              onBack={() => navigateTo('dashboard')}
              selectedFarmId={selectedFarmId}
              userProfile={userProfile}
              userLocation={userLocation}
              chatContext={chatContext}
              clearContext={() => setChatContext(null)}
            />
          )}
          {currentScreen === 'notifications' && (
            <NotificationCentre
              onBack={() => navigateTo('dashboard')}
              onAlertClick={() => navigateTo('risk-alert')}
              onNavigate={navigateTo}
            />
          )}
          {currentScreen === 'account-info' && (
            <AccountInformation
              onBack={() => navigateTo('dashboard')}
              onEdit={() => navigateTo('settings')}
              onNavigate={navigateTo}
              userProfile={userProfile}
              onLogout={handleLogout}
            />
          )}
          {currentScreen === 'settings' && (
            <ProfileSettings
              onBack={() => navigateTo('account-info')}
              onSave={() => navigateTo('account-info')}
              onNavigate={navigateTo}
              userProfile={userProfile}
              setUserProfile={setUserProfile}
              onLogout={handleLogout}
            />
          )}
          {currentScreen === 'scan-results' && (
            <CropAnalysisResults
              onBack={() => navigateTo('dashboard')}
              onViewTreatment={() => {
                setChatContext({ type: 'crop_scan', data: scanResult });
                navigateTo('chat');
              }}
              scanResult={scanResult}
            />
          )}
          {currentScreen === 'farm-switcher' && (
            <QuickFarmSwitcher
              onBack={() => navigateTo('dashboard')}
              onAddFarm={() => navigateTo('farm-wizard')}
              onFarmSelect={(id) => {
                setSelectedFarmId(id);
                navigateTo('dashboard');
              }}
            />
          )}
          {currentScreen === 'schemes' && (
            <SchemesDashboard
              onBack={() => navigateTo('dashboard')}
              onNotificationClick={() => navigateTo('notifications')}
              onNavigate={navigateTo}
              userProfile={userProfile}
            />
          )}
          {currentScreen === 'risk-alert' && (
            <RiskAlertDetails onBack={() => navigateTo('dashboard')} />
          )}
          {currentScreen === 'fertilizer-marketplace' && (
            <FertilizerMarketplace
              onBack={() => navigateTo('dashboard')}
              userProfile={userProfile}
              selectedFarmId={selectedFarmId}
            />
          )}
          {currentScreen === 'scanner' && (
            <CropScannerViewfinder
              onBack={() => navigateTo('dashboard')}
              onCapture={handleScanCapture}
              selectedFarmId={selectedFarmId}
            />
          )}
          {currentScreen === 'mandi-prices' && (
            <LiveMarketPrices
              onBack={() => navigateTo('dashboard')}
              userProfile={userProfile}
              selectedFarmId={selectedFarmId}
              userLocation={userLocation}
              onLocationChange={handleLocationChange}
            />
          )}
          {currentScreen === 'soil-test' && (
            <SoilHealthReport
              onBack={() => navigateTo('dashboard')}
              onNavigate={navigateTo}
              userProfile={userProfile}
              selectedFarmId={selectedFarmId}
            />
          )}
          {currentScreen === 'ami-insights' && (
            <AMIInsightCenter
              onBack={() => navigateTo('dashboard')}
              onNavigate={navigateTo}
              userProfile={userProfile}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
