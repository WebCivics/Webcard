# WebCard Viewer

A decentralized "link-in-bio" style application that dynamically fetches and displays profile information from Agent Discovery Protocol (ADP) records stored on IPFS and referenced in DNS.

This project was built with the assistance of an AI assistant.

---

## Features

-   **Decentralized Identity:** Fetches data directly from DNS `TXT` records and IPFS, requiring no central server.
-   **Dynamic Profile Rendering:** Parses Turtle RDF data to display a user's name, domain, and social links.
-   **Linktree-Style UI:** Presents the user's links in a clean, modern, and mobile-friendly interface.
-   **eCash Integration:** Automatically renders a PayButton for any eCash address found in the ADP record.
-   **JSON API View:** Can serve a simple JSON response for the eCash address, suitable for machine-to-machine interaction.
-   **GitHub Pages Ready:** Comes pre-configured for easy deployment as a static site.

---

## Core Technologies

-   **React:** The user interface is built as a single-page application using React (v17).
-   **DNS-over-HTTPS (DoH):** Uses the Cloudflare DoH service to perform DNS lookups directly from the browser.
-   **IPFS:** Retrieves ADP data files from the InterPlanetary File System via a public gateway.
-   **N3.js:** A JavaScript library for parsing and handling RDF data in Turtle format.
-   **Tailwind CSS:** For modern, utility-first styling.
-   **PayButton:** Integrates the `@paybutton/react` component for eCash payments.

---

## Prerequisites

Before you begin, ensure you have the following installed on your local machine:
-   [Node.js](https://nodejs.org/) (which includes npm)

---

## Setup and Installation

Follow these steps to get your development environment set up.

**1. Clone the Repository:**
```bash
git clone [https://github.com/WebCivics/Webcard.git](https://github.com/WebCivics/Webcard.git)
cd Webcard
```

**2\. Install Dependencies:** The `package.json` file in this project is pre-configured with compatible versions of all necessary libraries to avoid dependency conflicts (like `ERESOLVE` errors between `react-scripts` and `@paybutton/react`).

Run the following command to install all the required packages:

```Bash  
npm install
```
---

## **Running the Development Server**

To run the application locally for development and testing, use the following command:

```Bash  
npm start
```
This will start the React development server and automatically open the application in your default web browser, typically at `http://localhost:3000`. The page will automatically reload if you make any changes to the source code.

---

## **How to Use the App**

The application's behavior is determined by the URL you visit.

* **Domain Input Form:** Visiting the base URL (`http://localhost:3000`) will display a form where you can enter a domain to look up.  
* **Profile View:** To view a specific profile, append a domain name to the URL path: `http://localhost:3000/sailingdigital.com`  
* **JSON eCash View:** To get a raw JSON response for a user's eCash address, add the `?ecash` query parameter to the URL: `http://localhost:3000/sailingdigital.com?ecash`

---

## **Deployment to GitHub Pages**

The `package.json` is already configured for easy deployment to GitHub Pages.

**1\. Deploy the App:** Run the following command in your terminal. This will build a production version of your app and push it to the `gh-pages` branch on your GitHub repository.

```Bash  
npm run deploy
```
**2\. Configure GitHub Repository:** The final step is to tell GitHub to serve your website from the new branch.

* Go to your repository on GitHub.  
* Click on the **"Settings"** tab.  
* In the left sidebar, click on **"Pages"**.  
* Under the "Build and deployment" section, for the **Source**, select **"Deploy from a branch"**.  
* Under the "Branch" dropdown, select **`gh-pages`** as the source branch and leave the folder as `/ (root)`.  
* Click **"Save"**.

After a minute or two, your application will be live at the URL specified in the `homepage` property of your `package.json` file (e.g., `https://webcivics.github.io/Webcard`).

---