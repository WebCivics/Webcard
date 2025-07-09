# WebCard Utility

The WebCard Utility is a React-based web application implementing the Agent Discovery Protocol (ADP), a protocol for discovering metadata and services associated with a domain or subdomain acting as an agent. ADP enables machine-readable descriptions using RDF, leveraging W3C standards such as WebID and Solid for decentralized, user-centric web ecosystems. The WebCard Utility allows users to create and view ADP profiles, supporting agent types like natural persons, organizations, AI agents, humanitarian services, and content providers.

The project is hosted at [https://webcivics.github.io/Webcard](https://webcivics.github.io/Webcard) and the source code is available at [https://github.com/WebCivics/Webcard](https://github.com/WebCivics/Webcard). 

The ADP specification is being drafted and documented to support potential advancement via IETF (see draft-webcivics-adp-protocol-01](https://mediaprophet.github.io/init-draft-standards-wip/draft-webcivics-adp-protocol-01.txt) ) and via W3C (see Draft [Agent Discovery Protocol (ADP) Ontology Document](https://mediaprophet.github.io/init-draft-standards-wip/ADP/)).

## Features

- **Create Tab**: Generate ADP profiles with customizable properties (e.g., `foaf:name`, `adp:hasWebID`, `adp:sparqlEndpoint`) and download them as Turtle files.
- **View Tab**: Retrieve and display profile data from a domain’s DNS TXT record and IPFS, including Solid POD data if a WebID is present.
- **API Queries**: Query specific fields (e.g., `adp:hasGithubAccount`) or eCash addresses using URL parameters.
- **Comprehensive Ontologies**: Supports multiple agent types with properties for identity verification, humanitarian services, adult content filtering, and AI agent metadata.
- **Solid Integration**: Fetches data from Solid PODs (e.g., `https://ubiquitous.solidcommunity.net/profile/card#me`) for enhanced profile information.

## Setup

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)
- Git

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/WebCivics/Webcard.git
   cd Webcard
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm start
   ```
   The app will be available at `http://localhost:3000`.

### Deployment
To deploy to GitHub Pages:
1. Ensure the `package.json` has the correct `homepage` field:
   ```json
   "homepage": "https://webcivics.github.io/Webcard"
   ```
2. Deploy the app:
   ```bash
   npm run deploy
   ```
   The app will be published to `https://webcivics.github.io/Webcard`.

## Usage

### Create Tab
1. Navigate to the "Create" tab.
2. **Step 1: Set Your Domain**:
   - Enter your domain (e.g., `sailingdigital.com`).
3. **Step 2: Choose Agent Type**:
   - Select an agent type (e.g., `Natural Person`, `Organization`, `AI Agent`).
   - For `Natural Person`, the form starts with `foaf:name`. Other types include additional default properties (e.g., `adp:serviceEndpoint` for `AI Agent`).
4. **Step 3: Define Agent Properties**:
   - Select a **Prefix** (e.g., `adp`, `foaf`) from the dropdown (defaults to "Select").
   - Choose a **Property** from the dropdown, populated based on the prefix (e.g., `hasTwitterAccount`, `hasWebID` for `adp`).
   - Select a **Type** (`literal`, `uri`, `date`).
   - Enter a **Value** (e.g., `SailingDigital` for `adp:hasTwitterAccount`).
   - Add or remove properties as needed.
5. **Step 4: Establish Web of Trust (Optional)**:
   - Add trusted domain names (e.g., `another-domain.com`) to create `adp:trusts` relationships.
6. **Step 5: Generate & Upload File**:
   - Preview the generated Turtle file.
   - Copy the RDF or download it as `YYYY-MM-DD_adp.ttl`.
   - Upload the file to an IPFS pinning service (e.g., Pinata) to obtain a CID.
7. **Step 6: Provide IPFS CID**:
   - Enter the CID to generate a DNS TXT record (e.g., `_adp.sailingdigital.com TXT "adp:signer <https://ipfs.io/ipfs/Qm...#this>"`).
8. **Step 7: Update DNS**:
   - Copy the DNS record values and add them to your domain’s DNS settings.

### View Tab
1. Navigate to the "View" tab.
2. Enter a domain (e.g., `sailingdigital.com`).
3. Click "Look Up" to fetch the profile data from the DNS TXT record and IPFS.
4. View the profile in a table with columns: **Identifier**, **Entry**, **ADP**, **Solid**, **Conflict**.
   - Social accounts (Twitter, LinkedIn, GitHub) display as "Visit" links with icons.
   - If a WebID is present, a "Solid" tab appears to show Solid POD data.
5. Click "Send Access Request to Solid POD" to request access to the Solid inbox (if available).
6. Click "Back" to reset the form.

### API Usage
The WebCard Utility supports API-like queries for ADP metadata using URL parameters.

#### Query Specific Fields
- **Endpoint**: `/?domain=<domain>&field=<prefix:property>[&format=<json|turtle>]`
- **Description**: Retrieves the value of a specific field for the given domain.
- **Parameters**:
  - `domain`: The domain name (e.g., `sailingdigital.com`).
  - `field`: The property to query (e.g., `adp:hasGithubAccount`, `foaf:name`).
  - `format`: Optional, either `json` (default) or `turtle`.
- **Examples**:
  ```bash
  curl https://webcivics.github.io/Webcard/?domain=sailingdigital.com&field=foaf:name
  ```
  **Response (JSON)**:
  ```json
  {"foaf:name":"Timothy Holborn"}
  ```
  ```bash
  curl https://webcivics.github.io/Webcard/?domain=sailingdigital.com&field=adp:hasGithubAccount&format=turtle
  ```
  **Response (Turtle)**:
  ```turtle
  <#this> adp:hasGithubAccount "timothy-holborn" .
  ```

#### Query eCash Address
- **Endpoint**: `/?domain=<domain>&ecash`
- **Description**: Retrieves the eCash address for the given domain.
- **Parameters**:
  - `domain`: The domain name (e.g., `sailingdigital.com`).
  - `ecash`: Flag to query the eCash address.
- **Example**:
  ```bash
  curl https://webcivics.github.io/Webcard/?domain=sailingdigital.com&ecash
  ```
  **Response**:
  ```json
  {"eCashAddress":"ecash:q..."}
  ```

#### Notes
- Queries fetch data from the domain’s DNS TXT record and IPFS content.
- If the field or eCash address is not found, the response returns `null`.
- Local testing uses `http://localhost:3000`.

## Supported Agent Types
- **Natural Person**: For individuals, with properties like `foaf:name`, `adp:hasWebID`, `adp:hasTwitterAccount`.
- **Organization**: For businesses, with properties like `schema:url`, `adp:sparqlEndpoint` to verify legitimacy.
- **AI Agent**: For AI services, with properties like `adp:serviceEndpoint`, `schema:provider`.
- **Humanitarian Service**: For emergency services, with `adp:EssentialService` to ensure visibility.
- **Adult Website**: For content providers, with `schema:isAdultOriented` for filtering.

## Contributing
Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature`).
3. Commit your changes (`git commit -m "Add your feature"`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a Pull Request.

## Credits
Developed by Timothy Holborn, Founder of WebCivics, with assistance from
[xAI Grok 3](https://x.ai/grok) and
[Google Gemini 2.5 Pro](https://deepmind.google/technologies/gemini/).
Source code available at [GitHub](https://github.com/WebCivics/Webcard/).