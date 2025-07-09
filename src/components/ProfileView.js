import React, { useState, useEffect } from 'react';
import N3 from 'n3';
import Button from './Button';
import { services } from '../data/services';

function ProfileView({ domain, webId, onReset, setWebId }) {
  const [status, setStatus] = useState('idle'); // idle, loading, found, error
  const [profileData, setProfileData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isEcashView, setIsEcashView] = useState(false);
  const [fieldView, setFieldView] = useState(null);
  const [outputFormat, setOutputFormat] = useState('json');
  const [solidData, setSolidData] = useState(null);
  const [solidError, setSolidError] = useState('');

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    setIsEcashView(queryParams.has('ecash'));
    setFieldView(queryParams.get('field'));
    setOutputFormat(queryParams.get('format')?.toLowerCase() || 'json');

    const fetchProfile = async () => {
      setStatus('loading');
      setProfileData(null);
      setErrorMessage('');
      setSolidData(null);
      setSolidError('');

      let webIdValue = null;

      try {
        // Step 1: Fetch DNS TXT record
        const dnsResponse = await fetch(`https://dns.google/resolve?name=_adp.${domain}&type=TXT`);
        const dnsData = await dnsResponse.json();

        if (dnsData.Status !== 0 || !dnsData.Answer) {
          throw new Error('DNS record not found or query failed.');
        }

        const txtRecord = dnsData.Answer[0].data.replace(/"/g, '');
        const urlMatch = txtRecord.match(/adp:signer\s*<([^>]+)>/);
        if (!urlMatch) {
          throw new Error('Could not find a valid adp:signer in the TXT record.');
        }
        const adpUrl = urlMatch[1];

        // Step 2: Extract IPFS CID
        const cidMatch = adpUrl.match(/ipfs\/(Qm[a-zA-Z0-9]{44})/);
        if (!cidMatch) {
          throw new Error('Could not extract a valid IPFS CID from the ADP URL.');
        }
        const cid = cidMatch[1];
        const ipfsGatewayUrl = `https://ipfs.io/ipfs/${cid}`;

        // Step 3: Fetch IPFS content
        const ipfsResponse = await fetch(ipfsGatewayUrl);
        if (!ipfsResponse.ok) {
          throw new Error(`Failed to fetch from IPFS gateway (status: ${ipfsResponse.status})`);
        }
        const content = await ipfsResponse.text();

        // Step 4: Parse Turtle data with n3.js
        const parser = new N3.Parser();
        const quads = [];
        await new Promise((resolve, reject) => {
          parser.parse(content, (error, quad, prefixes) => {
            if (error) {
              reject(new Error(`RDF Parsing Error: ${error.message}`));
            }
            if (quad) {
              quads.push(quad);
            } else {
              const store = new N3.Store(quads);
              const FOAF = 'http://xmlns.com/foaf/0.1/';
              const ADP = 'https://webcivics.github.io/adp/ontdev/adp#';
              const SCHEMA = 'https://schema.org/';
              const VCARD = 'http://www.w3.org/2006/vcard/ns#';

              // Debug: Log parsed quads
              console.log('Parsed ADP Quads:', quads);

              // Extract key fields
              const name = store.getObjects(null, `${FOAF}name`, null)[0]?.value;
              const img = store.getObjects(null, `${FOAF}img`, null)[0]?.id;
              const eCashAddress = store.getObjects(null, `${ADP}hasEcashAccount`, null)[0]?.value;
              webIdValue = store.getObjects(null, `${ADP}hasWebID`, null)[0]?.id;

              // Set WebID for Solid tab
              if (webIdValue && setWebId) {
                setWebId(webIdValue);
              }

              // Extract social accounts from services config
              const links = [];
              services.forEach(service => {
                const predicate = `${ADP}${service.predicate.split(':')[1]}`;
                const username = store.getObjects(null, predicate, null)[0]?.value;
                if (username) {
                  links.push({
                    name: service.name,
                    url: `${service.urlPrefix}${username}`,
                    icon: service.icon,
                    predicate: service.predicate,
                    source: 'ADP',
                  });
                }
              });

              const genericLinks = store.getObjects(null, `${FOAF}page`, null).map(link => ({
                name: (() => {
                  try {
                    return new URL(link.id).hostname;
                  } catch {
                    return link.id;
                  }
                })(),
                url: link.id,
                predicate: 'foaf:page',
                source: 'ADP',
              }));

              // Debug: Log extracted links
              console.log('Extracted ADP Links:', [...links, ...genericLinks]);

              // Extract field value for fieldView
              let fieldValue = null;
              if (fieldView) {
                const [prefix, property] = fieldView.split(':');
                const prefixMap = {
                  adp: ADP,
                  foaf: FOAF,
                  schema: SCHEMA,
                  vcard: VCARD,
                };
                if (prefixMap[prefix]) {
                  fieldValue = store.getObjects(null, `${prefixMap[prefix]}${property}`, null)[0]?.value || null;
                }
              }

              setProfileData({
                raw: content,
                name: name || 'No Name Found',
                img,
                eCashAddress,
                webId: webIdValue,
                links: [...links, ...genericLinks],
                fieldValue,
              });
              resolve();
            }
          });
        });

        // Step 5: Fetch Solid POD data if webIdValue exists
        if (webIdValue) {
          try {
            console.log('Fetching Solid POD:', webIdValue);
            const response = await fetch(webIdValue, {
              headers: { Accept: 'text/turtle, application/ld+json' },
              mode: 'cors',
            });
            console.log('Solid Response Status:', response.status, 'Content-Type:', response.headers.get('Content-Type'));
            if (!response.ok) {
              throw new Error(`Failed to fetch Solid profile (status: ${response.status}, ${response.statusText})`);
            }
            const contentType = response.headers.get('Content-Type') || '';
            let solidContent = await response.text();
            console.log('Solid Content:', solidContent);

            const solidQuads = [];
            const solidParser = new N3.Parser();
            await new Promise((resolve, reject) => {
              solidParser.parse(solidContent, (error, quad, prefixes) => {
                if (error) {
                  if (contentType.includes('application/ld+json')) {
                    try {
                      const jsonld = JSON.parse(solidContent);
                      console.log('Solid JSON-LD:', jsonld);
                      const jsonldParser = new N3.Parser();
                      jsonldParser.parse(
                        `@prefix foaf: <http://xmlns.com/foaf/0.1/> .
                         @prefix vcard: <http://www.w3.org/2006/vcard/ns#> .
                         @prefix ldp: <http://www.w3.org/ns/ldp#> .
                         <#me> foaf:name "${jsonld['foaf:name'] || ''}" ;
                               vcard:hasEmail "${jsonld['vcard:hasEmail'] || ''}" ;
                               foaf:homepage <${jsonld['foaf:homepage'] || ''}> ;
                               ldp:inbox <${jsonld['ldp:inbox'] || ''}> .`,
                        (err, quad, prefixes) => {
                          if (err) reject(new Error(`JSON-LD Parsing Error: ${err.message}`));
                          if (quad) solidQuads.push(quad);
                          else resolve();
                        }
                      );
                    } catch (e) {
                      reject(new Error(`JSON-LD Parsing Error: ${e.message}`));
                    }
                  } else {
                    reject(new Error(`Turtle Parsing Error: ${error.message}`));
                  }
                }
                if (quad) solidQuads.push(quad);
                else resolve();
              });
            });

            console.log('Parsed Solid Quads:', solidQuads);
            const solidStore = new N3.Store(solidQuads);
            const FOAF = 'http://xmlns.com/foaf/0.1/';
            const VCARD = 'http://www.w3.org/2006/vcard/ns#';
            const LDP = 'http://www.w3.org/ns/ldp#';

            const solidName = solidStore.getObjects(null, `${FOAF}name`, null)[0]?.value;
            const solidEmail = solidStore.getObjects(null, `${VCARD}hasEmail`, null)[0]?.value;
            const solidHomepage = solidStore.getObjects(null, `${FOAF}homepage`, null)[0]?.id;
            const inbox = solidStore.getObjects(null, `${LDP}inbox`, null)[0]?.id;

            // Extract Solid social accounts
            const solidLinks = [];
            services.forEach(service => {
              const predicate = `${FOAF}account`;
              const accounts = solidStore.getObjects(null, predicate, null);
              accounts.forEach(account => {
                const accountName = account.id.split('/').pop();
                if (account.id.includes(service.urlPrefix)) {
                  solidLinks.push({
                    name: service.name,
                    url: `${service.urlPrefix}${accountName}`,
                    icon: service.icon,
                    predicate: service.predicate,
                    source: 'Solid',
                  });
                }
              });
            });

            console.log('Extracted Solid Links:', solidLinks);

            setSolidData({
              name: solidName || 'No Name Found',
              email: solidEmail,
              homepage: solidHomepage,
              inbox,
              links: solidLinks,
            });
          } catch (error) {
            console.error('Solid Fetch Error:', error);
            setSolidError(`Failed to fetch Solid data: ${error.message}`);
          }
        }

        setStatus('found');
      } catch (error) {
        console.error("Profile Fetch Error:", error);
        setErrorMessage(error.message);
        setStatus('error');
      }
    };

    if (domain) {
      fetchProfile();
    }
  }, [domain, fieldView, setWebId]);

  const handleAccessRequest = async () => {
    if (!solidData?.inbox) {
      alert('No inbox available for this WebID.');
      return;
    }

    try {
      const accessRequest = `
        @prefix acl: <http://www.w3.org/ns/auth/acl#>.
        @prefix foaf: <http://xmlns.com/foaf/0.1/>.
        <#request>
          a acl:Authorization ;
          acl:agent <https://example.com/webcard-user#me> ;
          acl:accessTo <${webId}> ;
          acl:mode acl:Read .
      `;
      const response = await fetch(solidData.inbox, {
        method: 'POST',
        headers: { 'Content-Type': 'text/turtle' },
        body: accessRequest,
      });
      if (!response.ok) {
        throw new Error(`Failed to send access request (status: ${response.status})`);
      }
      alert('Access request sent successfully!');
    } catch (error) {
      alert(`Error sending access request: ${error.message}`);
    }
  };

  // Merge ADP and Solid data for table display
  const getTableData = () => {
    const tableData = [];
    const addRow = (field, adpValue, solidValue, predicate) => {
      const hasConflict = adpValue && solidValue && adpValue !== solidValue;
      tableData.push({
        field,
        adpValue,
        solidValue,
        predicate,
        hasConflict,
      });
    };

    // Name
    addRow('Name', profileData?.name, solidData?.name, 'foaf:name');

    // Social accounts
    services.forEach(service => {
      const adpLink = profileData?.links.find(link => link.predicate === service.predicate && link.source === 'ADP');
      const solidLink = solidData?.links.find(link => link.predicate === service.predicate && link.source === 'Solid');
      addRow(
        service.name,
        adpLink ? { value: adpLink.url, icon: adpLink.icon } : null,
        solidLink ? { value: solidLink.url, icon: solidLink.icon } : null,
        service.predicate
      );
    });

    // eCash Address
    addRow('eCash Address', profileData?.eCashAddress, null, 'adp:hasEcashAccount');

    // WebID
    addRow('WebID', profileData?.webId, webId, 'adp:hasWebID');

    // Email (from Solid only)
    addRow('Email', null, solidData?.email, 'vcard:hasEmail');

    // Homepage
    const adpHomepage = profileData?.links.find(link => link.predicate === 'foaf:page');
    addRow('Homepage', adpHomepage ? adpHomepage.url : null, solidData?.homepage, 'foaf:homepage');

    return tableData.filter(row => row.adpValue || row.solidValue);
  };

  // API-like raw output for fieldView
  if (status === 'found' && fieldView) {
    if (outputFormat === 'turtle') {
      document.body.innerHTML = '';
      document.write(`<#this> ${fieldView} "${profileData.fieldValue || ''}" .`);
      return null;
    } else {
      document.body.innerHTML = '';
      document.write(JSON.stringify({ [fieldView]: profileData.fieldValue || null }));
      return null;
    }
  }

  // API-like raw output for ecash view
  if (status === 'found' && isEcashView) {
    document.body.innerHTML = '';
    document.write(JSON.stringify({ eCashAddress: profileData.eCashAddress || null }));
    return null;
  }

  if (status === 'loading') {
    return (
      <div className="bg-gray-900 p-6 rounded-lg shadow-lg text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
        <p className="text-gray-400">Fetching profile for <span className="font-bold">{domain}</span>...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-red-500/30 text-center">
        <h2 className="text-2xl font-semibold mb-4 text-red-400">Error</h2>
        <p className="text-gray-400">{errorMessage}</p>
        <Button onClick={onReset} variant="secondary" className="mt-4">Try Again</Button>
      </div>
    );
  }

  if (status === 'found' && profileData && !webId) {
    const tableData = getTableData();
    return (
      <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-blue-500/30 text-center animate-fade-in">
        {profileData.img && (
          <img
            src={profileData.img}
            alt={profileData.name}
            className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-gray-700 object-cover"
          />
        )}
        <h1 className="text-2xl font-bold text-blue-300 mb-6">Contact Card for {domain}</h1>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-gray-200">
            <thead>
              <tr className="bg-gray-800">
                <th className="p-3">Identifier</th>
                <th className="p-3">Entry</th>
                <th className="p-3">ADP</th>
                <th className="p-3">Solid</th>
                <th className="p-3">Conflict</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, index) => (
                <tr key={index} className="border-b border-gray-700">
                  <td className="p-3">{row.field}</td>
                  <td className="p-3">
                    {row.adpValue && typeof row.adpValue === 'object' ? (
                      <a
                        href={row.adpValue.value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline flex items-center gap-2"
                      >
                        {row.adpValue.icon && (
                          <img
                            src={row.adpValue.icon}
                            alt={`${row.field} icon`}
                            className="w-5 h-5"
                            onError={(e) => (e.target.style.display = 'none')}
                          />
                        )}
                        Visit
                      </a>
                    ) : row.solidValue && typeof row.solidValue === 'object' ? (
                      <a
                        href={row.solidValue.value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline flex items-center gap-2"
                      >
                        {row.solidValue.icon && (
                          <img
                            src={row.solidValue.icon}
                            alt={`${row.field} icon`}
                            className="w-5 h-5"
                            onError={(e) => (e.target.style.display = 'none')}
                          />
                        )}
                        Visit
                      </a>
                    ) : (
                      row.adpValue || row.solidValue || '-'
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <input type="checkbox" checked={!!row.adpValue} readOnly className="text-blue-500" />
                  </td>
                  <td className="p-3 text-center">
                    <input type="checkbox" checked={!!row.solidValue} readOnly className="text-blue-500" />
                  </td>
                  <td className="p-3 text-center">
                    {row.hasConflict && (
                      <span className="text-red-400 font-semibold" title="Entries differ between ADP and Solid">
                        ⚠
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {profileData.webId && (
          <div className="mt-6">
            <Button onClick={handleAccessRequest} className="bg-blue-600 hover:bg-blue-500">
              Send Access Request to Solid POD
            </Button>
          </div>
        )}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-green-300 mb-2">Raw ADP Data</h3>
          <pre className="bg-gray-800 text-green-300 p-4 rounded-md overflow-x-auto h-64 whitespace-pre-wrap font-mono text-sm">
            <code>{profileData.raw}</code>
          </pre>
        </div>
        <Button onClick={onReset} variant="secondary" className="mt-4">Back</Button>
      </div>
    );
  }

  if (status === 'found' && webId && solidData) {
    const tableData = getTableData();
    return (
      <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-blue-500/30 text-center animate-fade-in">
        <h2 className="text-2xl font-bold text-blue-300 mb-4">Solid Contact Card</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-gray-200">
            <thead>
              <tr className="bg-gray-800">
                <th className="p-3">Identifier</th>
                <th className="p-3">Entry</th>
                <th className="p-3">ADP</th>
                <th className="p-3">Solid</th>
                <th className="p-3">Conflict</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, index) => (
                <tr key={index} className="border-b border-gray-700">
                  <td className="p-3">{row.field}</td>
                  <td className="p-3">
                    {row.solidValue && typeof row.solidValue === 'object' ? (
                      <a
                        href={row.solidValue.value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline flex items-center gap-2"
                      >
                        {row.solidValue.icon && (
                          <img
                            src={row.solidValue.icon}
                            alt={`${row.field} icon`}
                            className="w-5 h-5"
                            onError={(e) => (e.target.style.display = 'none')}
                          />
                        )}
                        Visit
                      </a>
                    ) : (
                      row.solidValue || row.adpValue || '-'
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <input type="checkbox" checked={!!row.adpValue} readOnly className="text-blue-500" />
                  </td>
                  <td className="p-3 text-center">
                    <input type="checkbox" checked={!!row.solidValue} readOnly className="text-blue-500" />
                  </td>
                  <td className="p-3 text-center">
                    {row.hasConflict && (
                      <span className="text-red-400 font-semibold" title="Entries differ between ADP and Solid">
                        ⚠
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {solidError && (
          <div className="mt-4 text-red-400">
            <p>Error fetching Solid data: {solidError}</p>
          </div>
        )}
        {solidData?.inbox && (
          <div className="mt-6">
            <Button onClick={handleAccessRequest} className="bg-blue-600 hover:bg-blue-500">
              Send Access Request to Inbox
            </Button>
          </div>
        )}
        <Button onClick={onReset} variant="secondary" className="mt-4">Back</Button>
      </div>
    );
  }

  return null;
}

export default ProfileView;