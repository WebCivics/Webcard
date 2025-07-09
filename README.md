# WebCard Utility

The WebCard Utility is a React-based single-page application (SPA) that allows users to view and create Agent Discovery Protocol (ADP) profiles, with support for Solid POD integration. It combines the functionality of the `WebCard Viewer` (for viewing ADP profiles) and the `IPFS-ADP` project (for creating ADP records). The app is deployed on GitHub Pages and uses a Tailwind CSS-based UI with a modern, responsive design.

## Features

- **View Tab**:
  - Look up ADP profiles by domain (e.g., `sailingdigital.com`) using DNS TXT records and IPFS-hosted Turtle data.
  - Displays profile information: name, image, social accounts (e.g., Twitter, LinkedIn, GitHub), eCash address, and WebID (if available).
  - Social accounts are configured via `src/data/services.js`, with customizable display names, URL patterns, and icons.
  - Supports API-like queries for specific fields (e.g., `?domain=sailingdigital.com&field=adp:hasEcashAccount&format=json`).
  - Includes a button to send access requests to a Solid POD's inbox if a WebID is present.
  - Shows raw ADP Turtle data for transparency.

- **Create Tab**:
  - Generate ADP Turtle files for domains, with customizable agent types (e.g., Natural Person, Organization) and properties.
  - Supports adding trusted domains for a web of trust.
  - Generates DNS TXT records for IPFS CIDs.
  - Allows copying RDF or downloading as `adp.ttl`.

- **Solid Tab**:
  - Displays public Solid POD data (name, email, homepage) for a WebID found in the ADP profile.
  - Supports Turtle and JSON-LD formats, parsed with `n3.js`.
  - Includes a button to send access requests to the POD's inbox.

## Prerequisites

- Node.js (v14 or later) and npm.
- A domain with a configured `_adp.<domain>` TXT record pointing to an IPFS-hosted ADP Turtle file (for viewing).
- Access to an IPFS pinning service or node (for creating/uploading ADP files).
- Optional: A Solid POD with a WebID (e.g., `https://id.inrupt.com/ubiquitous`) for Solid tab testing.

## Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/WebCivics/Webcard.git
   cd Webcard
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Tailwind CSS** (if not already present):
   ```bash
   npx tailwindcss init
   ```
   Ensure `tailwind.config.js` includes:
   ```javascript
   module.exports = {
     content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
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
         },
       },
     },
     plugins: [],
   };
   ```

4. **Run the Development Server**:
   ```bash
   npm start
   ```
   The app will be available at `http://localhost:3000`.

5. **Deploy to GitHub Pages**:
   - Update `package.json` with the correct `homepage`:
     ```json
     "homepage": "https://webcivics.github.io/Webcard"
     ```
   - Deploy:
     ```bash
     npm run deploy
     ```
   - Configure GitHub Pages in the repository settings to use the `gh-pages` branch.

## Usage

### View Tab
- **Access**: Default tab at `http://localhost:3000`.
- **Input**: Enter a domain (e.g., `sailingdigital.com`) and click "Look Up".
- **Output**:
  - Profile name, image, eCash address, and WebID (if available).
  - Social accounts (e.g., Twitter, LinkedIn) as clickable buttons with icons, configured in `src/data/services.js`.
  - Raw ADP Turtle data.
  - A "Send Access Request" button for Solid PODs if a WebID is present.
- **API Queries**:
  - JSON: `http://localhost:3000/?domain=sailingdigital.com&field=adp:hasEcashAccount`
    - Output: `{"adp:hasEcashAccount":"ecash:q123..."}`
  - Turtle: `http://localhost:3000/?domain=sailingdigital.com&field=foaf:name&format=turtle`
    - Output: `<#this> foaf:name "Alex Doe" .`
  - eCash: `http://localhost:3000/?domain=sailingdigital.com&ecash`
    - Output: `{"eCashAddress":"ecash:q123..."}`

### Create Tab
- **Access**: Click the "Create" tab.
- **Steps**:
  1. Enter a domain (e.g., `your-domain.com`).
  2. Select an agent type (