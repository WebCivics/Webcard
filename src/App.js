import React, { useState, useEffect } from 'react';
import './App.css';
import DomainForm from './components/DomainForm';
import ProfileView from './components/ProfileView';

function App() {
  const [domain, setDomain] = useState('');

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const domainFromQuery = queryParams.get('domain');
    if (domainFromQuery) {
      setDomain(domainFromQuery);
    }
  }, []);

  const handleDomainSubmit = (submittedDomain) => {
    const baseUrl = window.location.pathname;
    const newUrl = `${baseUrl}?domain=${encodeURIComponent(submittedDomain)}`;
    window.location.href = newUrl;
  };

  const handleReset = () => {
    const baseUrl = window.location.pathname;
    window.location.href = baseUrl;
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