import React, { useState, useEffect } from 'react';
import './App.css';
import DomainForm from './components/DomainForm';
import ProfileView from './components/ProfileView';

/**
 * Main App Component
 * This component acts as a router. It checks the URL path on load.
 * - If the path is empty, it renders the DomainForm.
 * - If the path contains a domain, it renders the ProfileView.
 */
function App() {
  const [domain, setDomain] = useState('');

  // On component mount, parse the domain from the URL path
  useEffect(() => {
    const path = window.location.pathname;
    // Remove the leading slash and decode any special characters
    const domainFromPath = decodeURIComponent(path.substring(1));
    if (domainFromPath) {
      setDomain(domainFromPath);
    }
  }, []); // Empty dependency array means this runs once on mount

  return (
    <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center text-white font-sans p-4">
      {domain ? (
        <ProfileView domain={domain} />
      ) : (
        <DomainForm />
      )}
       <footer className="absolute bottom-4 text-gray-500 text-sm">
        Built with the assistance of an AI assistant.
      </footer>
    </div>
  );
}

export default App;
