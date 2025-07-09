// ========================================================================
// FILE: package.json
// PURPOSE: Defines the project, its dependencies, and its scripts.
// This is the most critical file for deployment. The `homepage` and `scripts`
// are essential for GitHub Pages to work correctly.
// ========================================================================
{
  "name": "webcard",
  "homepage": "https://webcivics.github.io/Webcard",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@paybutton/react": "^4.2.0",
    "@testing-library/jest-dom": "^5.11.4",
    "@testing-library/react": "^11.1.0",
    "@testing-library/user-event": "^12.1.10",
    "n3": "^1.26.0",
    "react": "^17.0.2",
    "react-dom": "^17.0.2",
    "react-scripts": "4.0.3",
    "web-vitals": "^1.0.1"
  },
  "devDependencies": {
    "autoprefixer": "^9.8.8",
    "cross-env": "^7.0.3",
    "gh-pages": "^6.3.0",
    "postcss": "^7.0.39",
    "tailwindcss": "npm:@tailwindcss/postcss7-compat@^2.2.17"
  },
  "scripts": {
    "start": "cross-env NODE_OPTIONS=--openssl-legacy-provider react-scripts start",
    "build": "cross-env NODE_OPTIONS=--openssl-legacy-provider react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject",
    "predeploy": "npm run build",
    "deploy": "gh-pages -d build"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}

// ========================================================================
// FILE: tailwind.config.js
// PURPOSE: Configures Tailwind CSS, telling it which files to scan for
// CSS classes so it can generate the necessary styles.
// ========================================================================
module.exports = {
  purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  darkMode: false,
  theme: {
    extend: {
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-in-out',
      }
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};

// ========================================================================
// FILE: postcss.config.js
// PURPOSE: Hooks Tailwind and Autoprefixer into the build process.
// ========================================================================
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

// ========================================================================
// FILE: src/App.js
// PURPOSE: Main application component. It uses URL query parameters
// (`?domain=...`) to decide which view to show. This is the correct
// pattern for a single-page app on GitHub Pages.
// ========================================================================
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


// ========================================================================
// FILE: src/components/DomainForm.js
// PURPOSE: Renders the input form. When submitted, it calls a function
// from the parent App component to handle navigation correctly.
// ========================================================================
import React, { useState } from 'react';

function DomainForm({ onDomainSubmit }) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue) {
      onDomainSubmit(inputValue);
    }
  };

  return (
    <div className="w-full max-w-md text-center">
      <h1 className="text-4xl font-bold mb-2">WebCard Viewer</h1>
      <p className="text-gray-400 mb-6">Enter a domain to look up its Agent Discovery Protocol (ADP) record.</p>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <label htmlFor="domain-input" className="sr-only">Domain Name</label>
        <input
          id="domain-input"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="sailingdigital.com"
          className="flex-grow bg-gray-800 border border-gray-700 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
        >
          Look Up
        </button>
      </form>
    </div>
  );
}

export default DomainForm;


// ========================================================================
// FILE: src/components/ProfileView.js
// PURPOSE: Fetches and displays the profile data. No changes needed here,
// but included for completeness.
// ========================================================================
import React, { useState, useEffect } from 'react';
import N3 from 'n3';
import { PayButton } from '@paybutton/react';

function ProfileView({ domain, onReset }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEcashView, setIsEcashView] = useState(false);

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        setIsEcashView(queryParams.has('ecash'));

        const fetchProfile = async () => {
            setLoading(true);
            setError(null);
            setProfile(null);

            try {
                const dohResponse = await fetch(`https://cloudflare-dns.com/dns-query?name=_adp.${domain}&type=TXT`, {
                    headers: { 'accept': 'application/dns-json' },
                });
                if (!dohResponse.ok) throw new Error('DNS query failed. Check the domain and network connection.');
                
                const dohData = await dohResponse.json();
                const txtRecord = dohData.Answer?.find(ans => ans.type === 16)?.data.replace(/"/g, '');
                if (!txtRecord) throw new Error(`No ADP TXT record found for ${domain}.`);

                const cidMatch = txtRecord.match(/ipfs=([a-zA-Z0-9]+)/);
                if (!cidMatch || !cidMatch[1]) throw new Error('Could not find a valid IPFS CID in the TXT record.');
                const cid = cidMatch[1];

                const ipfsResponse = await fetch(`https://ipfs.io/ipfs/${cid}`);
                if (!ipfsResponse.ok) throw new Error('Failed to fetch data from IPFS gateway.');
                const turtleData = await ipfsResponse.text();

                const parser = new N3.Parser();
                const quads = [];
                await new Promise((resolve, reject) => {
                    parser.parse(turtleData, (err, quad) => {
                        if (err) return reject(new Error(`RDF Parsing Error: ${err.message}`));
                        if (quad) {
                            quads.push(quad);
                        } else {
                            const store = new N3.Store(quads);
                            const FOAF = 'http://xmlns.com/foaf/0.1/';
                            const ADP = 'https://webcivics.github.io/adp/ontdev/adp#';
                            
                            const serviceMap = {
                                'hasTwitterAccount': { name: 'Twitter', url: 'https://twitter.com/' },
                                'hasLinkedinAccount': { name: 'LinkedIn', url: 'https://www.linkedin.com/in/' },
                                'hasGithubAccount': { name: 'GitHub', url: 'https://github.com/' },
                            };
                            
                            const name = store.getObjects(null, `${FOAF}name`, null)[0]?.value;
                            const img = store.getObjects(null, `${FOAF}img`, null)[0]?.id;
                            const eCashAddress = store.getObjects(null, `${ADP}hasEcashAccount`, null)[0]?.value;
                            
                            const serviceLinks = [];
                            for (const property in serviceMap) {
                                const usernameLiteral = store.getObjects(null, `${ADP}${property}`, null)[0];
                                if (usernameLiteral) {
                                    serviceLinks.push({
                                        name: serviceMap[property].name,
                                        url: `${serviceMap[property].url}${usernameLiteral.value}`
                                    });
                                }
                            }

                            const genericLinks = store.getObjects(null, `${FOAF}page`, null).map(link => ({
                                name: (() => { try { return new URL(link.id).hostname; } catch { return link.id; } })(),
                                url: link.id
                            }));

                            setProfile({
                                name,
                                img,
                                eCashAddress,
                                links: [...serviceLinks, ...genericLinks]
                            });
                            resolve();
                        }
                    });
                });

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [domain]);

    if (loading) {
        return (
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p>Fetching profile for <span className="font-bold">{domain}</span>...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-900 border border-red-500 text-red-200 px-4 py-3 rounded-md w-full max-w-lg text-center">
                <h2 className="font-bold text-lg mb-2">Error</h2>
                <p>{error}</p>
                <button
                  onClick={onReset}
                  className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md mt-4 transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (!profile) {
        return <div className="text-center"><p>Could not load profile data.</p></div>;
    }
    
    if (isEcashView) {
        return (
            <pre className="bg-gray-800 p-4 rounded-md w-full max-w-lg whitespace-pre-wrap break-all text-left">
                {JSON.stringify({ eCashAddress: profile.eCashAddress || null }, null, 2)}
            </pre>
        );
    }

    return (
        <div className="bg-gray-800 shadow-lg rounded-lg p-6 w-full max-w-md text-center animate-fade-in">
            {profile.img && <img src={profile.img} alt={profile.name} className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-gray-700 object-cover" />}
            <h1 className="text-2xl font-bold">{profile.name || 'No Name Found'}</h1>
            <div className="mt-6 w-full flex flex-col gap-4">
                {profile.links?.map((link, index) => (
                    <a key={index} href={link.url} target="_blank" rel="noopener noreferrer" className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-md transition-colors w-full">
                        {link.name}
                    </a>
                ))}
            </div>
            {profile.eCashAddress && (
                <div className="mt-6">
                    <PayButton
                        to={profile.eCashAddress}
                        text="Tip with eCash"
                        theme={{
                            colors: {
                                primary: '#0ea5e9',
                                secondary: '#334155',
                                tertiary: 'white',
                            }
                        }}
                    />
                </div>
            )}
        </div>
    );
}

export default ProfileView;
