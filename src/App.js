import React, { useState, useEffect } from 'react';
import Input from './components/Input';
import Button from './components/Button';
import TabButton from './components/TabButton';
import ProfileView from './components/ProfileView';
import { initialOntologiesDb } from './data/ontologies';
import { agentTypeTemplates } from './data/templates';
import Select from './components/Select';

function CreatorView() {
  const [domainName, setDomainName] = useState('example.com');
  const [agentType, setAgentType] = useState('naturalPerson');
  const [properties, setProperties] = useState(agentTypeTemplates.naturalPerson.properties);
  const [trusts, setTrusts] = useState([]);
  const [userProvidedCid, setUserProvidedCid] = useState('');
  const [ontologiesDb] = useState(initialOntologiesDb);
  const [selectedOntologies, setSelectedOntologies] = useState(['adp', 'foaf', 'schema', 'dcterms', 'vc', 'xsd']);
  const [rdfOutput, setRdfOutput] = useState('');
  const [dnsRecord, setDnsRecord] = useState({ type: '', name: '', content: '' });
  const [message, setMessage] = useState(null);

  const getFormattedDate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const generateOutputs = () => {
    const activePrefixes = selectedOntologies.map(key => ontologiesDb[key]).filter(Boolean);
    const prefixLines = activePrefixes.map(p => `@prefix ${p.prefix}: <${p.uri}> .`).join('\n');
    const agentTypes = agentTypeTemplates[agentType].types.join(' , ');
    const propertyLines = properties
      .filter(p => p.prefix && p.property && p.value)
      .map(p => {
        const value = p.type === 'uri' ? `<${p.value}>` : `"${p.value.replace(/"/g, '\\"')}"${p.type === 'date' ? '^^xsd:date' : ''}`;
        return `    ${p.prefix}:${p.property} ${value} ;`;
      })
      .join('\n');
    const trustLines = trusts
      .filter(t => t.value)
      .map(t => {
        const trustedAdpUrl = `https://${t.value}/.well-known/adp#this`;
        return `    adp:trusts <${trustedAdpUrl}> ;`;
      })
      .join('\n');
    
    const creationDate = getFormattedDate();
    const dateLine = `    dcterms:created "${creationDate}"^^xsd:date ;`;

    const fullRdf = `${prefixLines}\n\n<#this>\n    a ${agentTypes} ;\n    schema:domain "${domainName}" ;\n${dateLine}\n${propertyLines}\n${trustLines}\n.`;
    setRdfOutput(fullRdf.replace(/;\s*\n\./, ' .'));
    
    if (userProvidedCid) {
      const fileUrl = `https://ipfs.io/ipfs/${userProvidedCid}`;
      setDnsRecord({
        type: 'TXT',
        name: '_adp',
        content: `"adp:signer <${fileUrl}#this>"`
      });
    } else {
      setDnsRecord({ type: 'TXT', name: '_adp', content: 'Enter an IPFS CID to generate the full record.' });
    }
  };

  useEffect(() => {
    generateOutputs();
  }, [properties, domainName, agentType, trusts, selectedOntologies, userProvidedCid]);

  const handleAgentTypeChange = (newType) => {
    setAgentType(newType);
    setProperties(agentTypeTemplates[newType].properties.map(p => ({ ...p, id: Date.now() + p.id })));
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleCopy = (text, successMessage) => {
    navigator.clipboard.writeText(text).then(() => showMessage(successMessage, 'success')).catch(() => showMessage('Failed to copy text.', 'error'));
  };
  
  const handleDownload = () => {
    const fileName = `${getFormattedDate()}_adp.ttl`;
    const blob = new Blob([rdfOutput], { type: 'text/turtle;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showMessage(`File '${fileName}' download started!`);
  };

  const handlePropertyChange = (id, field, value) => {
    setProperties(props => props.map(p => p.id === id ? { ...p, [field]: value } : p));
    if (field === 'prefix' && value) {
      setProperties(props => props.map(p => p.id === id ? { ...p, property: '' } : p));
    }
  };

  const handleAddProperty = () => {
    setProperties(props => [...props, { id: Date.now(), prefix: '', property: '', value: '', type: 'literal' }]);
  };

  const handleRemoveProperty = (id) => {
    setProperties(props => props.filter(p => p.id !== id));
  };

  const handleTrustChange = (id, value) => {
    setTrusts(current => current.map(t => t.id === id ? { ...t, value } : t));
  };

  const handleAddTrust = () => {
    setTrusts(current => [...current, { id: Date.now(), value: '' }]);
  };

  const handleRemoveTrust = (id) => {
    setTrusts(current => current.filter(t => t.id !== id));
  };

  return (
    <div className="space-y-12">
      <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-blue-500/30">
        <h2 className="text-2xl font-semibold mb-4 text-blue-300">Step 1: Set Your Domain</h2>
        <Input label="Domain Name" value={domainName} onChange={(e) => setDomainName(e.target.value)} placeholder="your-domain.com" />
      </div>
      <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-blue-500/30">
        <h2 className="text-2xl font-semibold mb-4 text-blue-300">Step 2: Choose Agent Type</h2>
        <Select label="Select a template for your agent" value={agentType} onChange={e => handleAgentTypeChange(e.target.value)}>
          <option value="naturalPerson">Natural Person</option>
          <option value="organization">Organization / Business</option>
          <option value="aiAgent">AI Agent / Service</option>
          <option value="humanitarian">Humanitarian Service</option>
          <option value="adultWebsite">Adult Content Website</option>
        </Select>
      </div>
      <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-blue-500/30">
        <h2 className="text-2xl font-semibold mb-4 text-blue-300">Step 3: Define Agent Properties</h2>
        <div className="space-y-3 p-4 bg-gray-800/50 rounded-md">
          {properties.map(prop => {
            const availableProperties = prop.prefix ? ontologiesDb[prop.prefix]?.terms || [] : [];
            return (
              <div key={prop.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                <div className="md:col-span-3">
                  <Select
                    label="Prefix"
                    value={prop.prefix}
                    onChange={e => handlePropertyChange(prop.id, 'prefix', e.target.value)}
                  >
                    <option value="">Select</option>
                    {selectedOntologies.map(key => (
                      <option key={key} value={ontologiesDb[key].prefix}>
                        {ontologiesDb[key].prefix}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="md:col-span-3">
                  <Select
                    label="Property"
                    value={prop.property}
                    onChange={e => handlePropertyChange(prop.id, 'property', e.target.value)}
                    disabled={!prop.prefix}
                  >
                    <option value="">Select</option>
                    {availableProperties.map(term => (
                      <option key={term} value={term}>{term}</option>
                    ))}
                  </Select>
                </div>
                <div className="md:col-span-3">
                  <Select
                    label="Type"
                    value={prop.type}
                    onChange={e => handlePropertyChange(prop.id, 'type', e.target.value)}
                  >
                    <option value="literal">Literal</option>
                    <option value="uri">URI</option>
                    <option value="date">Date</option>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Input
                    label="Value"
                    value={prop.value}
                    onChange={e => handlePropertyChange(prop.id, 'value', e.target.value)}
                    placeholder="Enter value"
                  />
                </div>
                <div className="md:col-span-1">
                  <Button variant="secondary" onClick={() => handleRemoveProperty(prop.id)} className="w-full h-10">×</Button>
                </div>
              </div>
            );
          })}
          <Button onClick={handleAddProperty}>Add Custom Property</Button>
        </div>
      </div>
      <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-teal-500/30">
        <h2 className="text-2xl font-semibold mb-4 text-teal-300">Step 4: Establish Web of Trust (Optional)</h2>
        <p className="text-gray-400 text-sm mb-4">Add the domain names of other agents you trust to vouch for them.</p>
        <div className="space-y-3 p-4 bg-gray-800/50 rounded-md">
          {trusts.map(trust => (
            <div key={trust.id} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-11">
                <Input
                  label="Trusted Domain Name"
                  value={trust.value}
                  onChange={e => handleTrustChange(trust.id, e.target.value)}
                  placeholder="another-domain.com"
                />
              </div>
              <div className="col-span-1">
                <Button variant="secondary" onClick={() => handleRemoveTrust(trust.id)} className="w-full h-10">×</Button>
              </div>
            </div>
          ))}
          <Button onClick={handleAddTrust} variant="secondary">Add Trusted Agent</Button>
        </div>
      </div>
      <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-green-500/30">
        <h2 className="text-2xl font-semibold mb-4 text-green-300">Step 5: Generate & Upload File</h2>
        <p className="text-gray-400 mb-4">Download the generated `adp.ttl` file and upload it to your preferred IPFS pinning service or your own node.</p>
        <div className="relative">
          <pre className="bg-gray-900 text-green-300 p-4 rounded-md overflow-x-auto h-80 whitespace-pre-wrap font-mono text-sm leading-relaxed">
            <code>{rdfOutput}</code>
          </pre>
        </div>
        <div className="mt-4 flex space-x-4">
          <Button onClick={() => handleCopy(rdfOutput, 'RDF copied to clipboard!')}>Copy RDF</Button>
          <Button onClick={handleDownload} variant="secondary">Download File</Button>
        </div>
      </div>
      <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-purple-500/30">
        <h2 className="text-2xl font-semibold mb-4 text-purple-300">Step 6: Provide IPFS CID</h2>
        <p className="text-gray-400 mb-4">After uploading your file to IPFS, paste the Content ID (CID) below to generate your DNS record.</p>
        <Input label="IPFS Content ID (CID)" value={userProvidedCid} onChange={e => setUserProvidedCid(e.target.value)} placeholder="Qm..." />
      </div>
      {userProvidedCid && (
        <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-yellow-500/30">
          <h2 className="text-2xl font-semibold mb-4 text-yellow-300">Step 7: Update DNS</h2>
          <p className="text-gray-400 mb-4">Add the following TXT record to your domain's DNS settings. The values are separated for easy copying into your DNS provider's interface.</p>
          <div className="space-y-3 mt-4">
            <div className="flex items-center space-x-2">
              <div className="w-1/4"><Input label="Type" value={dnsRecord.type} readOnly={true} /></div>
              <div className="w-1/4"><Input label="Name" value={dnsRecord.name} readOnly={true} /></div>
              <div className="w-2/4 flex-grow"><Input label="Content" value={dnsRecord.content} readOnly={true} /></div>
              <div className="self-end"><Button onClick={() => handleCopy(dnsRecord.content, 'Content Copied!')} variant="secondary" className="h-10">Copy</Button></div>
            </div>
          </div>
        </div>
      )}
      {message && (
        <div className={`fixed bottom-5 right-5 p-4 rounded-lg shadow-2xl text-white ${
          message.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState('view');
  const [domain, setDomain] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [webId, setWebId] = useState(null);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const domainFromQuery = queryParams.get('domain');
    if (domainFromQuery) {
      setDomain(domainFromQuery);
      setInputValue(domainFromQuery);
      setActiveTab('view');
    }
  }, []);

  const handleDomainSubmit = (e) => {
    e.preventDefault();
    if (inputValue) {
      const baseUrl = window.location.pathname;
      const newUrl = `${baseUrl}?domain=${encodeURIComponent(inputValue)}`;
      window.location.href = newUrl;
    }
  };

  const handleReset = () => {
    setInputValue('');
    setDomain('');
    setWebId(null);
    const baseUrl = window.location.pathname;
    window.location.href = baseUrl;
    setActiveTab('view');
  };

  return (
    <div className="bg-gray-800 text-white min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-5xl font-bold text-blue-400">WebCard Utility</h1>
          <p className="text-gray-400 mt-2 text-lg">View and create Agent Discovery Protocol profiles.</p>
        </header>
        <div className="border-b border-gray-700 mb-8">
          <nav className="-mb-px flex justify-center space-x-4">
            <TabButton onClick={() => setActiveTab('view')} isActive={activeTab === 'view'}>View</TabButton>
            <TabButton onClick={() => setActiveTab('create')} isActive={activeTab === 'create'}>Create</TabButton>
            {webId && (
              <TabButton onClick={() => setActiveTab('solid')} isActive={activeTab === 'solid'}>Solid</TabButton>
            )}
          </nav>
        </div>
        {activeTab === 'view' && (
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-blue-500/30 mb-8">
            <form onSubmit={handleDomainSubmit} className="flex space-x-4">
              <div className="flex-grow">
                <Input
                  label="Domain Name"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="sailingdigital.com"
                />
              </div>
              <Button type="submit" className="self-end">Look Up</Button>
            </form>
          </div>
        )}
        {activeTab === 'view' && domain && <ProfileView domain={domain} onReset={handleReset} setWebId={setWebId} />}
        {activeTab === 'create' && <CreatorView />}
        {activeTab === 'solid' && webId && <ProfileView domain={domain} webId={webId} onReset={handleReset} />}
        <footer className="text-center mt-12 text-gray-500 text-sm">
          Developed in React with the assistance of{' '}
          <a href="https://x.ai/grok" className="text-blue-400 hover:underline">xAI Grok 3</a> and{' '}
          <a href="https://deepmind.google/technologies/gemini/" className="text-blue-400 hover:underline">Google Gemini 2.5 Pro</a>.{' '}
          Source code available at{' '}
          <a href="https://github.com/WebCivics/Webcard/" className="text-blue-400 hover:underline">GitHub</a>.
        </footer>
      </div>
    </div>
  );
}

export default App;