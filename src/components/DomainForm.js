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