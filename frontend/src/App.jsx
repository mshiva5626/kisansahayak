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

import { authAPI } from './api';

function App() {
  const [currentScreen, setCurrentScreen] = useState('welcome');
  const [language, setLanguage] = useState('en');
  const [userProfile, setUserProfile] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [scanResult, setScanResult] = useState(null);
  const [chatContext, setChatContext] = useState(null);
  const [selectedFarmId, setSelectedFarmId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setUserProfile(JSON.parse(storedUser));
      setIsLoggedIn(true);
      setCurrentScreen('dashboard');
    }
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

  // --- Auth Handlers ---
  const handleLogin = async (email, password) => {
    try {
      const { data } = await authAPI.login(email, password);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUserProfile(data.user);
      setIsLoggedIn(true);
      navigateTo('dashboard');
    } catch (error) {
      alert(error.response?.data?.message || 'Login failed');
      throw error;
    }
  };

  const handleRegister = async (email, password, name) => {
    try {
      const { data } = await authAPI.register(email, password, name);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUserProfile(data.user);
      setIsLoggedIn(true);
      navigateTo('profile-setup');
    } catch (error) {
      alert(error.response?.data?.message || 'Registration failed');
      throw error;
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUserProfile(null);
    setIsLoggedIn(false);
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
              onGetStarted={() => navigateTo('language')}
              onLogin={() => navigateTo('login')}
            />
          )}
          {currentScreen === 'language' && (
            <LanguageSelection onContinue={(lang) => {
              setLanguage(lang || 'en');
              navigateTo('login');
            }} />
          )}
          {currentScreen === 'login' && (
            <LoginRegistration
              onLogin={handleLogin}
              onRegister={handleRegister}
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
          {currentScreen === 'priority-tasks' && (
            <TodayPriorityTasks
              onBack={() => navigateTo('dashboard')}
              onTaskDone={() => console.log('Task done')}
              onViewTreatment={() => {
                setChatContext(null);
                navigateTo('chat');
              }}
              onNavigate={navigateTo}
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
        </div>
      </div>
    </div>
  );
}

export default App;
