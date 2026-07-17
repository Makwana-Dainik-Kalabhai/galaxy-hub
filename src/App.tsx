import { useState } from 'react';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Profile } from './pages/Profile';
import { GamePage } from './pages/GamePage';

function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'profile'>('home');
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [profileRefreshTrigger, setProfileRefreshTrigger] = useState(0);

  const handleProfileUpdate = () => {
    setProfileRefreshTrigger(prev => prev + 1);
  };

  const handleSelectGame = (gameId: string) => {
    setSelectedGameId(gameId);
  };

  const handleBackToDashboard = () => {
    setSelectedGameId(null);
  };

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={(tab) => {
        setActiveTab(tab);
        setSelectedGameId(null); // return to lists if selecting tab
      }}
      profileRefreshTrigger={profileRefreshTrigger}
    >
      {selectedGameId ? (
        <GamePage
          gameId={selectedGameId}
          onBack={handleBackToDashboard}
          onProfileUpdated={handleProfileUpdate}
        />
      ) : activeTab === 'home' ? (
        <Home onSelectGame={handleSelectGame} />
      ) : (
        <Profile onProfileUpdated={handleProfileUpdate} />
      )}
    </Layout>
  );
}

export default App;
