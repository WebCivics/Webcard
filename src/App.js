import React, { useState, useEffect } from 'react';
import './App.css';
import DomainForm from './components/DomainForm';
import ProfileView from './components/ProfileView';

/**
 * Main App Component
 * This component now manages the view (form or profile) using internal state
 * to avoid full-page reloads that break GitHub Pages routing.
 */
function App() {
  const [domain, setDomain] = useState('');

  // This effect runs once on mount to handle direct links
  useEffect(() => {
    const path = window.location.pathname;
    // This logic gets the last part of the URL path, which will be the domain
    // It correctly handles the base path of the repo (e.g., /Webcard/)
    const pathSegments = path.split('/').filter(Boolean);
    const potentialDomain = pathSegments[pathSegments.length - 1];

    if (potentialDomain) {
      // A simple check to avoid treating the repo name ('Webcard') as a domain
      if (potentialDomain.toLowerCase() !== 'webcard') {
        setDomain(decodeURIComponent(potentialDomain));
      }
    }
  }, []); // Empty dependency array means this runs once on mount

  // This handler is passed to the DomainForm to update the state
  const handleDomainSubmit = (submittedDomain) => {
    // Update the state to show the ProfileView without changing the URL
    setDomain(submittedDomain);
  };

  // This handler is passed to the ProfileView to allow resetting the app
  const handleReset = () => {
    // Reset the state to show the DomainForm
    setDomain('');
  };

  return (
    <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center text-white font-sans p-4">
      {domain ? (
        <ProfileView domain={domain} onReset={handleReset} />
      ) : (
        <DomainForm onDomainSubmit={handleDomainSubmit} />
      )}
       <footer className="absolute bottom-4 text-gray-500 text-sm">
        Built with the assistance of an AI assistant.
      </footer>
    </div>
  );
}

export default App;