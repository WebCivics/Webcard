import React, { useState, useEffect, useCallback } from 'react';
import { Parser, Store } from 'n3';
import { PayButton } from '@paybutton/react'; // CORRECTED: Import from the React-specific package

// --- Configuration for Social Links ---
// This object defines how to render different ADP properties.
const SERVICE_CONFIG = {
    'https://webcivics.github.io/adp/ontdev/adp#hasLinkedinAccount': {
        name: 'LinkedIn',
        baseUrl: 'https://www.linkedin.com/in/',
        icon: (
            <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
            </svg>
        )
    },
    'https://webcivics.github.io/adp/ontdev/adp#hasTwitterAccount': {
        name: 'Twitter',
        baseUrl: 'https://x.com/',
        icon: (
            <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.617l-5.21-6.817-6.044 6.817h-3.308l7.73-8.805-7.993-10.69h6.77l4.61 6.245 5.46-6.245zm-1.161 17.52h1.839l-10.123-13.65h-1.990l10.274 13.65z"/>
            </svg>
        )
    }
    // Add other services here in the future
};

const NAME_PREDICATE = 'http://xmlns.com/foaf/0.1/name';
const DOMAIN_PREDICATE = 'https://schema.org/domain';
const ECASH_PREDICATE = 'https://webcivics.github.io/adp/ontdev/adp#hasEcashAccount';

// --- Helper: ADP Parser Utility ---
const adpParser = (turtleText) => {
    return new Promise((resolve, reject) => {
        const store = new Store();
        const parser = new Parser();
        parser.parse(turtleText, (error, quad, prefixes) => {
            if (error) return reject(error);
            
            if (quad) {
                store.addQuad(quad);
            } else {
                // Parsing is complete
                const profile = { name: null, domain: null, ecash: null, properties: [] };
                const subject = store.getSubjects(null, null, null)[0];
                if (!subject) return reject(new Error("No subject found in RDF data."));

                const quads = store.getQuads(subject, null, null);
                quads.forEach(q => {
                    const predicate = q.predicate.value;
                    const value = q.object.value;

                    if (predicate === NAME_PREDICATE) {
                        profile.name = value;
                    } else if (predicate === DOMAIN_PREDICATE) {
                        profile.domain = value;
                    } else if (predicate === ECASH_PREDICATE) {
                        profile.ecash = value;
                    } else if (SERVICE_CONFIG[predicate]) {
                        profile.properties.push({
                            type: SERVICE_CONFIG[predicate].name,
                            user: value,
                            url: `${SERVICE_CONFIG[predicate].baseUrl}${value}`,
                            icon: SERVICE_CONFIG[predicate].icon
                        });
                    }
                });
                resolve(profile);
            }
        });
    });
};

// --- Custom Hook: useAdpData ---
const useAdpData = (domain) => {
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        if (!domain) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        setProfileData(null);

        try {
            // 1. Fetch DNS TXT record
            const dnsResponse = await fetch(`https://cloudflare-dns.com/dns-query?name=_adp.${domain}&type=TXT`, {
                headers: { 'accept': 'application/dns-json' },
            });
            if (!dnsResponse.ok) throw new Error(`DNS query failed with status: ${dnsResponse.status}`);
            const dnsData = await dnsResponse.json();

            if (!dnsData.Answer || dnsData.Answer.length === 0) {
                throw new Error(`No ADP record found for ${domain}.`);
            }
            
            const txtRecord = dnsData.Answer[0].data.replace(/"/g, ''); // Clean quotes
            const cidMatch = txtRecord.match(/dnslink=\/ipfs\/(\S+)/); // More robust regex
            if (!cidMatch || !cidMatch[1]) throw new Error("Could not find a valid IPFS CID in the DNS record.");
            const cid = cidMatch[1];

            // 2. Fetch data from IPFS gateway
            const ipfsResponse = await fetch(`https://ipfs.io/ipfs/${cid}`);
            if (!ipfsResponse.ok) throw new Error(`IPFS fetch failed with status: ${ipfsResponse.status}`);
            const turtleText = await ipfsResponse.text();

            // 3. Parse the Turtle data
            const parsedData = await adpParser(turtleText);
            setProfileData(parsedData);

        } catch (err) {
            console.error("Error fetching ADP data:", err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [domain]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { profileData, loading, error };
};

// --- UI Components ---

const Loader = () => (
    <div className="flex justify-center items-center p-10">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white"></div>
    </div>
);

const ErrorMessage = ({ message }) => (
    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-md" role="alert">
        <p className="font-bold">Error</p>
        <p>{message}</p>
    </div>
);

const LinkButton = ({ type, url, icon }) => (
    <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full bg-white/20 hover:bg-white/30 text-white font-bold py-3 px-4 rounded-lg shadow-lg flex items-center justify-center transition-all duration-300 ease-in-out transform hover:scale-105"
    >
        {icon || null}
        <span>{type}</span>
    </a>
);

const Profile = ({ domain }) => {
    const { profileData, loading, error } = useAdpData(domain);

    if (loading) return <Loader />;
    if (error) return <ErrorMessage message={error.message} />;
    if (!profileData) return <ErrorMessage message="Could not load profile data." />;

    return (
        <div className="w-full max-w-md mx-auto p-6 md:p-8 bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl text-white text-center">
            <div className="mb-6">
                <img 
                    src={`https://placehold.co/128x128/764ba2/ffffff?text=${profileData.name ? profileData.name.charAt(0) : 'A'}`} 
                    alt="Profile" 
                    className="w-32 h-32 rounded-full mx-auto border-4 border-white/50 shadow-lg"
                />
                <h1 className="text-3xl font-bold mt-4">{profileData.name || 'Anonymous'}</h1>
                <p className="text-gray-300">{profileData.domain}</p>
            </div>

            <div className="space-y-4 mb-6">
                {profileData.properties.map(prop => (
                    <LinkButton key={prop.type} type={prop.type} url={prop.url} icon={prop.icon} />
                ))}
            </div>

            {profileData.ecash && (
                <div className="border-t border-white/20 pt-6">
                    <h2 className="text-lg font-semibold mb-3">Support Me</h2>
                    <div className="flex justify-center">
                        <PayButton to={profileData.ecash} text="Send a Tip" />
                    </div>
                </div>
            )}
        </div>
    );
};

const JsonView = ({ domain }) => {
    const { profileData, loading, error } = useAdpData(domain);

    if (loading) {
        return <pre className="text-white bg-black/20 p-4 rounded-lg">Loading...</pre>;
    }
    if (error) {
        return <pre className="text-white bg-black/20 p-4 rounded-lg">{JSON.stringify({ error: error.message }, null, 2)}</pre>;
    }
    
    const jsonData = {
        ecash: profileData?.ecash || null
    };

    return <pre className="text-white bg-black/20 p-4 rounded-lg">{JSON.stringify(jsonData, null, 2)}</pre>;
};

const DomainInput = ({ onDomainSubmit }) => {
    const [inputValue, setInputValue] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (inputValue.trim()) {
            onDomainSubmit(inputValue.trim());
        }
    };

    return (
        <div className="w-full max-w-md mx-auto p-8 bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl text-white text-center">
            <h1 className="text-4xl font-bold mb-4">WebCard Viewer</h1>
            <p className="text-lg mb-6">Enter a domain to look up an Agent Discovery Profile.</p>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="example.com"
                    className="flex-grow px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
                <button type="submit" className="bg-white/30 hover:bg-white/40 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                    Look Up
                </button>
            </form>
        </div>
    );
};

// --- Main App Component ---
function App() {
    const [domain, setDomain] = useState(null);
    const [view, setView] = useState('profile'); // 'profile' or 'ecash'

    useEffect(() => {
        const pathParts = window.location.pathname.split('/').filter(p => p && p.toLowerCase() !== 'webcard');
        const queryParams = new URLSearchParams(window.location.search);
        
        const potentialDomain = pathParts.pop();

        if (potentialDomain && potentialDomain.includes('.')) {
            setDomain(potentialDomain);
        }

        if (queryParams.has('ecash')) {
            setView('ecash');
        } else {
            setView('profile');
        }
    }, []);

    const handleDomainSubmit = (submittedDomain) => {
        // Update the URL to reflect the new domain, which will trigger a re-render
        window.location.pathname = `/Webcard/${submittedDomain}`;
    };

    // Main rendering logic
    if (view === 'ecash') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <JsonView domain={domain} />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            {domain ? <Profile domain={domain} /> : <DomainInput onDomainSubmit={handleDomainSubmit} />}
            <footer className="text-center text-white/70 mt-8 text-sm">
                <p>Powered by WebCivics ADP</p>
            </footer>
        </div>
    );
}

export default App;
