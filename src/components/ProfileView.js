import React, { useState, useEffect } from 'react';
import N3 from 'n3';
import { PayButton } from '@paybutton/react';

/**
 * ProfileView Component
 * This is the core of the application. It takes a domain, fetches the data,
 * parses it, and renders the profile card or an error/loading state.
 */
function ProfileView({ domain }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEcashView, setIsEcashView] = useState(false);

    useEffect(() => {
        // Check for ?ecash query parameter in the URL
        const queryParams = new URLSearchParams(window.location.search);
        if (queryParams.has('ecash')) {
            setIsEcashView(true);
        }

        const fetchProfile = async () => {
            try {
                setLoading(true);
                setError(null);

                // Step 1: Use DNS-over-HTTPS (DoH) to get the TXT record for _adp.<domain>
                const dohResponse = await fetch(`https://cloudflare-dns.com/dns-query?name=_adp.${domain}&type=TXT`, {
                    headers: { 'accept': 'application/dns-json' },
                });
                if (!dohResponse.ok) throw new Error('DNS query failed. Check the domain and network connection.');
                
                const dohData = await dohResponse.json();
                const txtRecord = dohData.Answer?.find(ans => ans.type === 16)?.data.replace(/"/g, '');
                if (!txtRecord) throw new Error(`No ADP TXT record found for ${domain}.`);

                // Step 2: Extract the IPFS Content Identifier (CID) from the TXT record
                const cidMatch = txtRecord.match(/ipfs=([a-zA-Z0-9]+)/);
                if (!cidMatch || !cidMatch[1]) throw new Error('Could not find a valid IPFS CID in the TXT record.');
                const cid = cidMatch[1];

                // Step 3: Fetch the profile data from a public IPFS gateway
                const ipfsResponse = await fetch(`https://ipfs.io/ipfs/${cid}`);
                if (!ipfsResponse.ok) throw new Error('Failed to fetch data from IPFS gateway.');
                const turtleData = await ipfsResponse.text();

                // Step 4: Parse the Turtle (RDF) data using N3.js
                const parser = new N3.Parser();
                const quads = [];
                await new Promise((resolve, reject) => {
                    parser.parse(turtleData, (err, quad, prefixes) => {
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
                <a href="/" className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md mt-4 transition-colors">
                    Try Again
                </a>
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
