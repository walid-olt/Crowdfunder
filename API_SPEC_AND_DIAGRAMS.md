# Crowdfunding Platform - API Specification & UML Diagrams

---

## Part 1: REST API Specification

### API Base URL
```
http://localhost:5000/api
```

---

### Authentication Endpoints

#### 1.1 Register User
```
POST /auth/register
```
**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "role": "enum[OWNER, INVESTOR]"
}
```
**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "ObjectId",
    "name": "string",
    "email": "string",
    "role": "enum[OWNER, INVESTOR]",
    "balance": 0,
    "createdAt": "ISO8601"
  }
}
```
**Error Responses:**
- `400`: Invalid input / Email already exists
- `500`: Internal server error

---

#### 1.2 Login User
```
POST /auth/login
```
**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```
**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "JWT_TOKEN",
    "user": {
      "id": "ObjectId",
      "name": "string",
      "email": "string",
      "role": "enum[OWNER, INVESTOR, ADMIN]",
      "balance": "number"
    }
  }
}
```
**Error Responses:**
- `401`: Invalid email or password
- `400`: Missing required fields
- `500`: Internal server error

---

### Project Endpoints

#### 2.1 Create Project (OWNER only)
```
POST /projects
Authorization: Bearer {JWT_TOKEN}
```
**Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "targetCapital": "number",
  "selfInvestmentAmount": "number",
  "maxInvestmentPercentage": "number (0-100, default: 50)"
}
```
**Response (201):**
```json
{
  "success": true,
  "message": "Project created successfully",
  "data": {
    "id": "ObjectId",
    "title": "string",
    "description": "string",
    "owner": "ObjectId",
    "targetCapital": "number",
    "currentCapital": "number (= selfInvestmentAmount)",
    "maxInvestmentPercentage": "number",
    "status": "OPEN",
    "createdAt": "ISO8601"
  }
}
```
**Error Responses:**
- `400`: Invalid input / Insufficient balance for self-investment
- `401`: Unauthorized / Not authenticated
- `403`: Forbidden (User is not OWNER)
- `500`: Internal server error

---

#### 2.2 Get Own Projects (OWNER only)
```
GET /projects
Authorization: Bearer {JWT_TOKEN}
```
**Query Parameters:**
- `status`: Optional filter by status (OPEN, CLOSED)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "ObjectId",
      "title": "string",
      "description": "string",
      "targetCapital": "number",
      "currentCapital": "number",
      "maxInvestmentPercentage": "number",
      "status": "enum[OPEN, CLOSED]",
      "createdAt": "ISO8601"
    }
  ]
}
```

---

#### 2.3 Get All Open Projects (INVESTOR, ADMIN)
```
GET /projects/public
```
**Query Parameters:**
- `page`: Optional (default: 1)
- `limit`: Optional (default: 10)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "ObjectId",
      "title": "string",
      "description": "string",
      "owner": {
        "id": "ObjectId",
        "name": "string"
      },
      "targetCapital": "number",
      "currentCapital": "number",
      "remainingCapital": "number (= targetCapital - currentCapital)",
      "maxInvestmentPercentage": "number",
      "status": "OPEN",
      "createdAt": "ISO8601"
    }
  ],
  "pagination": {
    "currentPage": "number",
    "totalPages": "number",
    "totalProjects": "number"
  }
}
```

---

#### 2.4 Get Project Details
```
GET /projects/{projectId}
```
**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "ObjectId",
    "title": "string",
    "description": "string",
    "owner": {
      "id": "ObjectId",
      "name": "string",
      "email": "string"
    },
    "targetCapital": "number",
    "currentCapital": "number",
    "remainingCapital": "number",
    "maxInvestmentPercentage": "number",
    "status": "enum[OPEN, CLOSED]",
    "createdAt": "ISO8601",
    "investorCount": "number",
    "fundingPercentage": "number (currentCapital / targetCapital * 100)"
  }
}
```
**Error Responses:**
- `404`: Project not found

---

#### 2.5 Update Project (OWNER only, only if OPEN)
```
PUT /projects/{projectId}
Authorization: Bearer {JWT_TOKEN}
```
**Request Body:**
```json
{
  "title": "string (optional)",
  "description": "string (optional)",
  "maxInvestmentPercentage": "number (optional)"
}
```
**Response (200):**
```json
{
  "success": true,
  "message": "Project updated successfully",
  "data": {
    "id": "ObjectId",
    "title": "string",
    "description": "string",
    "maxInvestmentPercentage": "number",
    "status": "OPEN",
    "updatedAt": "ISO8601"
  }
}
```
**Error Responses:**
- `400`: Invalid input
- `401`: Unauthorized
- `403`: Forbidden (Not project owner / Project is CLOSED)
- `404`: Project not found

---

#### 2.6 Delete Project (OWNER only, only if OPEN)
```
DELETE /projects/{projectId}
Authorization: Bearer {JWT_TOKEN}
```
**Response (200):**
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```
**Error Responses:**
- `401`: Unauthorized
- `403`: Forbidden (Not project owner / Project is CLOSED)
- `404`: Project not found

---

#### 2.7 Manually Close Project (OWNER only)
```
POST /projects/{projectId}/close
Authorization: Bearer {JWT_TOKEN}
```
**Response (200):**
```json
{
  "success": true,
  "message": "Project closed successfully",
  "data": {
    "id": "ObjectId",
    "status": "CLOSED",
    "currentCapital": "number",
    "targetCapital": "number",
    "closedAt": "ISO8601"
  }
}
```
**Error Responses:**
- `400`: Project already closed
- `401`: Unauthorized
- `403`: Forbidden (Not project owner)
- `404`: Project not found

---

#### 2.8 Get Capitalization Table (OWNER only)
```
GET /projects/{projectId}/capitalization-table
Authorization: Bearer {JWT_TOKEN}
```
**Response (200):**
```json
{
  "success": true,
  "data": {
    "projectId": "ObjectId",
    "projectTitle": "string",
    "targetCapital": "number",
    "currentCapital": "number",
    "investors": [
      {
        "investorId": "ObjectId",
        "investorName": "string",
        "investorEmail": "string",
        "amountInvested": "number",
        "percentageOwned": "number",
        "investmentDate": "ISO8601"
      }
    ]
  }
}
```
**Error Responses:**
- `401`: Unauthorized
- `403`: Forbidden (Not project owner)
- `404`: Project not found

---

### Investment Endpoints

#### 3.1 Create Investment (INVESTOR only)
```
POST /investments
Authorization: Bearer {JWT_TOKEN}
```
**Request Body:**
```json
{
  "projectId": "ObjectId",
  "amount": "number"
}
```
**Response (201):**
```json
{
  "success": true,
  "message": "Investment successful",
  "data": {
    "id": "ObjectId",
    "investorId": "ObjectId",
    "projectId": "ObjectId",
    "amount": "number",
    "percentageOwned": "number",
    "createdAt": "ISO8601",
    "projectStatus": "enum[OPEN, CLOSED]"
  }
}
```
**Error Responses:**
- `400`: Invalid input / Insufficient investor balance / Investment exceeds max percentage / Investment would exceed target capital / Project is CLOSED
- `401`: Unauthorized / Not authenticated as INVESTOR
- `404`: Project not found

---

#### 3.2 Get Investments History (INVESTOR only)
```
GET /investments
Authorization: Bearer {JWT_TOKEN}
```
**Query Parameters:**
- `projectId`: Optional filter by project

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "ObjectId",
      "projectId": "ObjectId",
      "projectTitle": "string",
      "projectOwner": "string",
      "amount": "number",
      "percentageOwned": "number",
      "createdAt": "ISO8601"
    }
  ]
}
```

---

### Wallet Endpoints

#### 4.1 Add Funds (INVESTOR only)
```
POST /wallet/add-funds
Authorization: Bearer {JWT_TOKEN}
```
**Request Body:**
```json
{
  "amount": "number (must be positive)"
}
```
**Response (200):**
```json
{
  "success": true,
  "message": "Funds added successfully",
  "data": {
    "userId": "ObjectId",
    "newBalance": "number",
    "amountAdded": "number",
    "createdAt": "ISO8601"
  }
}
```
**Error Responses:**
- `400`: Invalid amount / Amount must be positive
- `401`: Unauthorized / Not authenticated as INVESTOR

---

#### 4.2 Get Wallet Balance (INVESTOR only)
```
GET /wallet/balance
Authorization: Bearer {JWT_TOKEN}
```
**Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": "ObjectId",
    "balance": "number"
  }
}
```

---

### Portfolio Endpoints

#### 5.1 Get Investor Portfolio (INVESTOR)
```
GET /portfolio
Authorization: Bearer {JWT_TOKEN}
```
**Response (200):**
```json
{
  "success": true,
  "data": {
    "investorId": "ObjectId",
    "investorName": "string",
    "totalInvested": "number",
    "investments": [
      {
        "projectId": "ObjectId",
        "projectTitle": "string",
        "projectOwner": "string",
        "amountInvested": "number",
        "percentageOwned": "number",
        "projectStatus": "enum[OPEN, CLOSED]",
        "investmentDate": "ISO8601"
      }
    ]
  }
}
```

---

#### 5.2 Get Owner Portfolio (OWNER)
```
GET /portfolio/owner
Authorization: Bearer {JWT_TOKEN}
```
**Response (200):**
```json
{
  "success": true,
  "data": {
    "ownerId": "ObjectId",
    "ownerName": "string",
    "projectsCreated": "number",
    "totalCapitalRaised": "number",
    "projects": [
      {
        "projectId": "ObjectId",
        "projectTitle": "string",
        "targetCapital": "number",
        "currentCapital": "number",
        "status": "enum[OPEN, CLOSED]",
        "investorCount": "number",
        "createdAt": "ISO8601"
      }
    ]
  }
}
```

---

### Admin Endpoints

#### 6.1 Get All Investors (ADMIN only)
```
GET /admin/users/investors
Authorization: Bearer {JWT_TOKEN}
```
**Query Parameters:**
- `page`: Optional (default: 1)
- `limit`: Optional (default: 10)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "ObjectId",
      "name": "string",
      "email": "string",
      "balance": "number",
      "totalInvested": "number",
      "investmentCount": "number",
      "createdAt": "ISO8601"
    }
  ],
  "pagination": {
    "currentPage": "number",
    "totalPages": "number",
    "totalInvestors": "number"
  }
}
```
**Error Responses:**
- `401`: Unauthorized
- `403`: Forbidden (Not ADMIN)

---

#### 6.2 Get All Project Owners (ADMIN only)
```
GET /admin/users/owners
Authorization: Bearer {JWT_TOKEN}
```
**Query Parameters:**
- `page`: Optional (default: 1)
- `limit`: Optional (default: 10)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "ObjectId",
      "name": "string",
      "email": "string",
      "projectsCreated": "number",
      "totalCapitalRaised": "number",
      "createdAt": "ISO8601"
    }
  ],
  "pagination": {
    "currentPage": "number",
    "totalPages": "number",
    "totalOwners": "number"
  }
}
```
**Error Responses:**
- `401`: Unauthorized
- `403`: Forbidden (Not ADMIN)

---

#### 6.3 Get Specific Investor Details (ADMIN only)
```
GET /admin/investors/{investorId}/portfolio
Authorization: Bearer {JWT_TOKEN}
```
**Response (200):**
```json
{
  "success": true,
  "data": {
    "investorId": "ObjectId",
    "investorName": "string",
    "investorEmail": "string",
    "balance": "number",
    "totalInvested": "number",
    "investments": [
      {
        "projectId": "ObjectId",
        "projectTitle": "string",
        "projectOwner": "string",
        "amountInvested": "number",
        "percentageOwned": "number",
        "investmentDate": "ISO8601"
      }
    ]
  }
}
```
**Error Responses:**
- `401`: Unauthorized
- `403`: Forbidden (Not ADMIN)
- `404`: Investor not found

---

#### 6.4 Get Specific Owner Details (ADMIN only)
```
GET /admin/owners/{ownerId}/portfolio
Authorization: Bearer {JWT_TOKEN}
```
**Response (200):**
```json
{
  "success": true,
  "data": {
    "ownerId": "ObjectId",
    "ownerName": "string",
    "ownerEmail": "string",
    "projectsCreated": "number",
    "totalCapitalRaised": "number",
    "projects": [
      {
        "projectId": "ObjectId",
        "projectTitle": "string",
        "targetCapital": "number",
        "currentCapital": "number",
        "investorCount": "number",
        "status": "enum[OPEN, CLOSED]",
        "createdAt": "ISO8601"
      }
    ]
  }
}
```
**Error Responses:**
- `401`: Unauthorized
- `403`: Forbidden (Not ADMIN)
- `404`: Owner not found

---

## Part 2: UML Diagrams - Creation Steps

### Use Case Diagram

**Purpose:** Illustrates the interactions between actors (OWNER, INVESTOR, ADMIN) and the system, showing what each role can do.

**Steps to Create:**

1. **Identify Actors:**
   - Project Owner (OWNER)
   - Investor (INVESTOR)
   - Administrator (ADMIN)

2. **Identify Primary Use Cases:**

   **Authentication & Profile:**
   - Register
   - Login
   - View Profile

   **Project Owner Flows:**
   - Create Project
   - Update Project
   - Delete Project
   - Close Project (Manually)
   - View Own Projects
   - View Capitalization Table
   - View Project Analytics

   **Investor Flows:**
   - Add Funds to Wallet
   - Browse Open Projects
   - View Project Details
   - Invest in Project
   - View Investment Portfolio
   - View Investment History

   **Admin Flows:**
   - View All Investors
   - View All Project Owners
   - Inspect Investor Portfolio
   - Inspect Owner Portfolio
   - View Platform Analytics

   **System (Auto) Actions:**
   - Auto-Close Project (when target capital reached)
   - Calculate Ownership Percentage
   - Validate Investment Limits

3. **Draw Associations:**
   - Connect OWNER → Create Project, Update Project, Delete Project, Close Project, View Capitalization Table
   - Connect INVESTOR → Add Funds, Browse Projects, Invest, View Portfolio
   - Connect ADMIN → View All Users, Inspect Portfolios
   - Include System actors for Auto-Close Project, Calculate Percentages

4. **Diagram Tools Recommended:**
   - **Lucidchart**, **Draw.io**, **PlantUML**, **Miro**

5. **Example PlantUML Code:**
```
@startuml
actor OWNER
actor INVESTOR
actor ADMIN
usecase UC1 as "Register & Login"
usecase UC2 as "Create Project"
usecase UC3 as "Update Project"
usecase UC4 as "View Capitalization Table"
usecase UC5 as "Add Funds"
usecase UC6 as "Browse Open Projects"
usecase UC7 as "Invest in Project"
usecase UC8 as "View Portfolio"
usecase UC9 as "View All Users"
usecase UC10 as "Inspect Portfolio"

OWNER --> UC1
OWNER --> UC2
OWNER --> UC3
OWNER --> UC4

INVESTOR --> UC1
INVESTOR --> UC5
INVESTOR --> UC6
INVESTOR --> UC7
INVESTOR --> UC8

ADMIN --> UC1
ADMIN --> UC9
ADMIN --> UC10
@enduml
```

---

### Class Diagram

**Purpose:** Shows the data models and their relationships, including attributes and methods.

**Steps to Create:**

1. **Define Core Classes:**

   **User Class**
   - Attributes: id, name, email, password, role, balance, createdAt
   - Methods: register(), login(), authenticate()

   **Project Class**
   - Attributes: id, title, description, owner (FK), targetCapital, currentCapital, maxInvestmentPercentage, status, createdAt
   - Methods: create(), update(), delete(), close(), calculateFundingPercentage()

   **Investment Class**
   - Attributes: id, investor (FK), project (FK), amount, percentageOwned, createdAt
   - Methods: create(), calculatePercentageOwned()

2. **Define Relationships:**
   - User (1) ← → (Many) Project (One owner creates many projects)
   - User (1) ← → (Many) Investment (One investor makes many investments)
   - Project (1) ← → (Many) Investment (One project receives many investments)

3. **Add Cardinality:**
   - User to Project: 1 to *
   - User to Investment: 1 to *
   - Project to Investment: 1 to *

4. **Example PlantUML Code:**
```
@startuml
class User {
  - id: ObjectId
  - name: String
  - email: String
  - password: String (hashed)
  - role: Enum [OWNER, INVESTOR, ADMIN]
  - balance: Number
  - createdAt: Date
  + register()
  + login()
  + updateProfile()
}

class Project {
  - id: ObjectId
  - title: String
  - description: String
  - owner: ObjectId (FK)
  - targetCapital: Number
  - currentCapital: Number
  - maxInvestmentPercentage: Number
  - status: Enum [OPEN, CLOSED]
  - createdAt: Date
  + create()
  + update()
  + delete()
  + close()
  + calculateFundingPercentage()
}

class Investment {
  - id: ObjectId
  - investor: ObjectId (FK)
  - project: ObjectId (FK)
  - amount: Number
  - percentageOwned: Number
  - createdAt: Date
  + create()
  + calculatePercentageOwned()
}

User "1" --> "*" Project : owns
User "1" --> "*" Investment : makes
Project "1" --> "*" Investment : receives
@enduml
```

---

### Sequence Diagram - Investment Flow

**Purpose:** Illustrates the chronological flow of a complete investment transaction, including validation checks and auto-close logic.

**Steps to Create:**

1. **Define Participants:**
   - Investor (Actor)
   - API (Controller)
   - Service Layer
   - Database (MongoDB)
   - Notification System (Optional)

2. **Sequence Steps:**

   1. **Investor initiates investment request**
      - POST /investments with projectId and amount

   2. **Controller receives request**
      - Validates JWT token
      - Extracts investor ID from token
      - Validates request body

   3. **Service validates business rules**
      - Check if project exists and is OPEN
      - Check if investor has sufficient balance
      - Calculate max allowed investment (50% or owner-set limit)
      - Check if investment would exceed remaining capital

   4. **Service calculates ownership percentage**
      - percentageOwned = (amount / targetCapital) * 100

   5. **Service deducts funds from investor wallet**
      - investor.balance -= amount

   6. **Service creates investment record**
      - Insert Investment document in MongoDB

   7. **Service updates project currentCapital**
      - project.currentCapital += amount

   8. **Auto-Close Logic**
      - IF currentCapital >= targetCapital
      - THEN project.status = CLOSED

   9. **Return success response to investor**
      - Investment ID, amount, percentage owned

3. **Error Flows (Alternative Paths):**
   - Invalid JWT → 401 Unauthorized
   - Insufficient balance → 400 Bad Request
   - Project CLOSED → 400 Bad Request
   - Investment exceeds max percentage → 400 Bad Request
   - Project not found → 404 Not Found

4. **Example PlantUML Code:**
```
@startuml
actor Investor
participant Controller
participant Service
participant Database

Investor -> Controller: POST /investments\n{projectId, amount}
Controller -> Controller: Validate JWT
Controller -> Service: validateInvestment(projectId, amount)
Service -> Database: Get Project
Database -> Service: Project data
Service -> Service: Check if OPEN
Service -> Service: Verify max investment %
Service -> Database: Get Investor
Database -> Service: Investor data
Service -> Service: Check balance
alt Insufficient Balance
  Service -> Controller: Error 400
  Controller -> Investor: Error response
else Validation Successful
  Service -> Database: Deduct from investor.balance
  Service -> Database: Create Investment record
  Service -> Database: Update project.currentCapital
  Service -> Service: Calculate percentageOwned
  alt Auto-Close Condition
    Service -> Database: Update project.status = CLOSED
    Service -> Investor: Notification (Optional)
  end
  Service -> Controller: Investment success
  Controller -> Investor: 201 Created + Investment data
end
@enduml
```

---

### Sequence Diagram - Project Auto-Close Flow

**Purpose:** Shows how the system automatically closes a project when funding target is reached.

**Steps to Create:**

1. **Participants:**
   - Investor
   - API
   - Service
   - Database
   - Event System (Optional)

2. **Flow:**
   1. Investor makes final investment
   2. Service updates project.currentCapital
   3. Service checks if currentCapital >= targetCapital
   4. If true, Service updates project.status to CLOSED
   5. Database saves updated project
   6. System triggers optional notifications (Project fully funded)
   7. Subsequent investment attempts on this project are rejected

3. **Example PlantUML Code:**
```
@startuml
participant Investor
participant Service
participant Database

Investor -> Service: Invest in Project
activate Service
Service -> Database: Fetch Project
Service -> Database: Update currentCapital
Service -> Service: Check Auto-Close Condition\n(currentCapital >= targetCapital)

alt Target Reached
  Service -> Database: Update status = CLOSED
  Service -> Investor: Success + "Project Funded"
  deactivate Service
else Target Not Yet Reached
  Service -> Investor: Success + "Project Still Open"
  deactivate Service
end
@enduml
```

---

### Deployment Diagram (Optional)

**Purpose:** Shows the architecture and deployment environment.

**Components:**
- Client (Web/Mobile)
- Express.js API Server (Node.js)
- MongoDB Database (Cloud or Local)
- JWT Authentication Service

**Example Setup:**
- Frontend → API Server (HTTPS)
- API Server → MongoDB (Encrypted connection)
- Environment variables for secrets (DB_URI, JWT_SECRET)

---

## Summary of Deliverables

| Diagram Type | Purpose | Actors/Entities | Audience |
|---|---|---|---|
| **Use Case** | Show what each actor can do | OWNER, INVESTOR, ADMIN | Stakeholders, Product Managers |
| **Class** | Show data models & relationships | User, Project, Investment | Developers, Architects |
| **Sequence (Investment)** | Show investment transaction flow | Investor, Controller, Service, DB | Developers, QA |
| **Sequence (Auto-Close)** | Show auto-close mechanism | Service, Database | Developers |
| **Deployment** | Show architecture | API Server, Database, Client | DevOps, Architects |

---

## Tools Recommended

1. **PlantUML** - Free, text-based, version-control friendly
2. **Draw.io** - Intuitive, free, browser-based
3. **Lucidchart** - Professional, collaborative
4. **Miro** - Whiteboarding, real-time collaboration
5. **Visual Studio Code + PlantUML Extension** - Integrated development

---



