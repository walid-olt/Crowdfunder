# 🚀 Crowdfunding REST API - Developer Specification

## 1. Project Overview
A secure, scalable backend API designed to manage a crowdfunding platform. The system connects **Project Owners** looking to raise capital with **Investors** looking to fund projects. The API enforces strict business rules regarding funding limits, automated state management (opening/closing projects), and role-based access control.

## 2. Tech Stack & Technical Constraints
* **Runtime & Framework:** Node.js with Express.js
* **Database:** MongoDB via Mongoose ORM
* **Architecture:** Async/Await pattern, Layered architecture (Routes -> Controllers -> Services -> Models)
* **Security & Auth:** JWT (JSON Web Tokens) for authentication, `bcrypt` for password hashing.
* **Validation:** `Joi` or `express-validator` for payload validation.
* **Standardization:** Consistent JSON responses and appropriate RESTful HTTP status codes (200, 201, 400, 401, 403, 404, 500).

---

## 3. Actor Roles & User Stories (Access Control)

### 🧑‍💼 Project Owner (`OWNER`)
* **Auth:** Register and Authenticate.
* **Project Management:** * Create a project (title, description, target capital).
    * Set an initial self-investment amount during creation.
    * Set a dynamic `maxInvestmentPercentage` (e.g., maximum % of the total capital a single investor can contribute).
    * Update or Delete projects (ONLY if the project is still `OPEN`).
    * Manually close a project.
* **Analytics:**
    * View their own list of created projects.
    * View the capitalization table (list of investors, amounts, and ownership %) for a specific project.
    * View a specific investor's portfolio (their total investments across the platform).

### 💸 Investor (`INVESTOR`)
* **Auth:** Register and Authenticate.
* **Wallet:** Add funds to their account balance.
* **Exploration:** View a list of `OPEN` projects and their granular details.
* **Action:** Invest in an open project.
* **Analytics:** View their own portfolio (list of investments, amounts invested, and percentage owned per project).

### 🛡️ Administrator (`ADMIN`)
* **Auth:** Authenticate (usually created via database seeding).
* **Supervision:**
    * View all registered Investors and Project Owners.
    * Inspect any Investor's portfolio (funded projects, total capital deployed).
    * Inspect any Project Owner's portfolio (created projects, total capital raised).

---

## 4. Core Business Rules (Domain Logic)
1.  **Investment Limits:** An investor *cannot* invest more than 50% of the total target capital of a single project (or the specific limit set by the owner).
2.  **Capital Overflow:** An investment transaction must be rejected if the amount exceeds the remaining capital needed.
3.  **State Machine:** * Investments are ONLY allowed if the project status is `OPEN`.
    * **Auto-Close Trigger:** The system MUST automatically update the project status to `CLOSED` the moment `currentCapital` reaches `targetCapital`.
4.  **Dynamic Calculations:** Ownership percentages must be calculated dynamically based on `amount_invested / target_capital`.
5.  **Financial Consistency:** Verify the Investor has sufficient balance before processing an investment, and deduct the amount from their wallet upon success.

*Optional Bonus Features:* Aggregation pipelines to fetch the Top 3 investors per project, ranking the most-funded projects, and implementing a simple rewards tier.

---

## 5. System Architecture Proposal

### A. Recommended Folder Structure
```text
/src
 ├── config/           # Environment vars, DB connections (mongoose.connect)
 ├── controllers/      # Handles incoming requests, extracts data, calls services, sends JSON response
 ├── middlewares/      # Auth (verifyJWT), Role Checks (isAdmin), Error Handling, Validation
 ├── models/           # Mongoose schemas
 ├── routes/           # Express routes mapping HTTP verbs to controllers
 ├── services/         # Business logic, calculations, DB queries
 └── utils/            # Helper functions, constants
```

### B. Core Data Models (Mongoose Schemas)

**1. User (`User`)**
Handles the core entity for Authentication and Authorization.
* **_id**: ObjectId
* **name**: String
* **email**: String (Unique, Indexed)
* **password**: String (Hashed)
* **role**: Enum ['OWNER', 'INVESTOR', 'ADMIN']
* **balance**: Number (For Investors, Default: 0)
* **createdAt**: Date

**2. Project (`Project`)**
The central entity for the crowdfunding campaign.
* **_id**: ObjectId
* **title**: String
* **description**: String
* **owner**: ObjectId (ref: 'User')
* **targetCapital**: Number
* **currentCapital**: Number (Default: 0)
* **maxInvestmentPercentage**: Number (Default: 50, Maximum: 100)
* **status**: Enum ['OPEN', 'CLOSED'] (Default: 'OPEN')
* **createdAt**: Date

**3. Investment (`Investment`)**
The transaction ledger bridging an Investor and a Project.
* **_id**: ObjectId
* **investor**: ObjectId (ref: 'User')
* **project**: ObjectId (ref: 'Project')
* **amount**: Number
* **percentageOwned**: Number (Calculated dynamically upon creation)
* **createdAt**: Date

---

## 6. Deliverables Checklist & Timeline
Given your deadline of **April 3, 2026 before 23:59**, here is a checklist of the required artifacts:

* [ ] **Trello/Planner Link:** Proof of project management setup.
* [ ] **Presentation Link:** Slides covering the solution.
* [ ] **UML Diagrams:** Screenshots embedded in the GitHub `README.md`.
    * *Use Case Diagram:* Shows who does what.
    * *Class Diagram:* Visualizes the data models above.
    * *Sequence Diagram:* Shows the chronological flow of an API request (e.g., an Investor making a payment and the project auto-closing).
* [ ] **GitHub Repository:**
    * Last push strictly on Sunday before 23:59.
    * Contains the complete backend source code with structured commits.

---
