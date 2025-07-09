# **WebCard Viewer: Project Plan and Instructions**

This document outlines the complete plan, architecture, and setup instructions for creating the WebCard Viewer application.

This project was built with the assistance of an AI assistant.

## **1\. Project Goal & Architecture**

The primary goal is to build a decentralized "link-in-bio" style application that dynamically fetches and displays profile information from Agent Discovery Protocol (ADP) records. The application will be a **single-page application (SPA)** built with **React** and deployed on **GitHub Pages**, ensuring it remains fully decentralized with no server-side backend.

The entire data fetching and processing workflow happens client-side:

1. **URL Parsing**: The app reads the browser URL to identify the target domain (e.g., `sailingdigital.com`).  
2. **DNS over HTTPS (DoH)**: The app uses a public DoH service (e.g., Cloudflare) to perform a `TXT` record lookup for `_adp.<domain>`. This is a standard web `fetch` call.  
3. **IPFS Gateway**: After extracting the IPFS Content Identifier (CID) from the DNS record, the app makes another `fetch` call to a public IPFS gateway to retrieve the ADP file, which is in Turtle (`.ttl`) format.  
4. **RDF Parsing**: The fetched Turtle data is parsed into a structured data graph in the browser using the `n3.js` library.  
5. **Dynamic Rendering**: React components query the in-memory graph to extract the user's profile information (name, links, eCash address) and render it in a clean, "linktree-style" UI.  
6. **Conditional Views**: The app checks for a `?ecash` query parameter in the URL to conditionally render either the full profile or a simple JSON object with the eCash address.

## **2\. Core Technologies**

* **React:** v17, to maintain compatibility with key dependencies.  
* **React Scripts:** v4.0.3, which is compatible with React 17\.  
* **DNS-over-HTTPS (DoH):** For browser-based DNS queries.  
* **IPFS:** For decentralized data storage and retrieval.  
* **N3.js:** For parsing Turtle/RDF data in JavaScript.  
* **Tailwind CSS:** For utility-first styling.  
* **PayButton:** The `@paybutton/react` component for eCash integration.

## **3\. Setup and Installation Instructions**

Follow these steps to get a local development environment running.

### **Step 3.1: Clone the Repository**

git clone \[https://github.com/WebCivics/Webcard.git\](https://github.com/WebCivics/Webcard.git)

cd Webcard

### **Step 3.2: Install Dependencies**

The `package.json` file in the repository is pre-configured with compatible versions of all necessary libraries to avoid dependency conflicts.

Run the following command to install all required packages:

npm install

## **4\. Running the Development Server**

To run the application locally for development, use the following command:

npm start

This will start the React development server and open the app in your browser, typically at `http://localhost:3000`. The page will automatically reload when you save changes to the source code.

## **5\. How to Use the App**

The application's behavior is determined by the URL.

* **Domain Input Form:** Visiting the base URL (`http://localhost:3000`) will display a form where you can enter a domain to look up.  
* **Profile View:** To view a specific profile, append a domain name to the URL path: `http://localhost:3000/sailingdigital.com`  
* **JSON eCash View:** To get a raw JSON response for a user's eCash address, add the `?ecash` query parameter to the URL: `http://localhost:3000/sailingdigital.com?ecash`

## **6\. Deployment to GitHub Pages**

The project is already configured for easy deployment.

### **Step 6.1: Deploy the App**

Run the following command in your terminal. This will build a production version of your app and push it to the `gh-pages` branch on your GitHub repository.

npm run deploy

### **Step 6.2: Configure GitHub Repository Settings**

The final step is to tell GitHub to serve your website from the new branch.

1. Go to your repository on GitHub.  
2. Click on the **"Settings"** tab.  
3. In the left sidebar, click on **"Pages"**.  
4. Under the "Build and deployment" section, for the **Source**, select **"Deploy from a branch"**.  
5. Under the "Branch" dropdown, select **`gh-pages`** as the source branch and leave the folder as `/ (root)`.  
6. Click **"Save"**.

After a minute or two, your application will be live at the URL specified in the `homepage` property of your `package.json` file (e.g., `https://webcivics.github.io/Webcard`).