# API Specification

**Project:** Used-Car Smart System
**Backend:** Spring Boot
**Frontend:** ReactJS
**Database:** PostgreSQL
**API base path:** `/api/v1`

> This document describes the current API contract based on the implemented backend structure.
>
> The API specification must remain synchronized with the actual Spring Boot controller, service, DTO, repository, and frontend API client implementations.

---

## 1. API Base

```text
/api/v1
```

Current resource groups:

```text
/api/v1/listings
/api/v1/vehicles
```

---

# 2. Listing API

Listings represent marketplace/source-specific vehicle postings.

## 2.1. GET /api/v1/listings

**Purpose:** Return a paginated list of vehicle listings with optional search, filtering, and sorting.

### Query parameters

Pagination:

```text
page
size
sort
```

Search/filter:

```text
keyword
vehicleId
brand
model
variant
minPrice
maxPrice
minYear
maxYear
minMileage
maxMileage
fuelType
transmission
bodyType
origin
location
```

### Example request

```http
GET /api/v1/listings?page=0&size=20&sort=createdAt,desc
```

### Example filtered request

```http
GET /api/v1/listings?keyword=Toyota&minPrice=500000000&maxPrice=1000000000&minYear=2020&page=0&size=20
```

### Response concept

```json
{
  "content": [],
  "page": 0,
  "size": 20,
  "totalElements": 0,
  "totalPages": 0,
  "first": true,
  "last": true
}
```

### Status codes

```text
200 OK
400 Bad Request
500 Internal Server Error
```

---

## 2.2. GET /api/v1/listings/{listingId}

**Purpose:** Return detail of a specific listing.

### Path parameter

```text
listingId
```

### Success

```text
200 OK
```

### Not found

```text
404 Not Found
```

### Response concept

```json
{
  "id": 1,
  "price": 850000000,
  "mileage": 45000,
  "color": "White",
  "location": "Ho Chi Minh City",
  "sourceUrl": "...",
  "imageUrl": "...",
  "vehicleId": 1,
  "brand": "Toyota",
  "model": "Camry",
  "variant": "2.5Q",
  "manufactureYear": 2022,
  "fuelType": "Gasoline",
  "transmission": "Automatic",
  "engineSize": 2.5,
  "seatCount": 5,
  "origin": "Vietnam",
  "bodyType": "Sedan",
  "sourceId": 1,
  "sourceName": "..."
}
```

> Exact DTO fields must remain synchronized with `ListingResponseDto`.

---

## 2.3. POST /api/v1/listings

**Purpose:** Create a new listing.

### Status

```text
201 Created
```

### Validation error

```text
400 Bad Request
```

### Resource not found

```text
404 Not Found
```

> Exact request body and authorization rules must follow the current Spring Boot implementation.

---

## 2.4. DELETE /api/v1/listings/{listingId}

**Purpose:** Delete an existing listing.

### Path parameter

```text
listingId
```

### Success

```text
200 OK
```

### Not found

```text
404 Not Found
```

> Authorization requirements must follow the integrated security implementation.

---

# 3. Vehicle API

Vehicle represents the normalized vehicle entity associated with listings.

## 3.1. GET /api/v1/vehicles

**Purpose:** Return the vehicle collection.

### Query parameters

```text
page
size
sort
```

### Success

```text
200 OK
```

### Response concept

```json
{
  "content": [],
  "page": 0,
  "size": 20,
  "totalElements": 0,
  "totalPages": 0,
  "first": true,
  "last": true
}
```

---

## 3.2. GET /api/v1/vehicles/{vehicleId}

**Purpose:** Return vehicle detail.

### Path parameter

```text
vehicleId
```

### Success

```text
200 OK
```

### Not found

```text
404 Not Found
```

---

## 3.3. POST /api/v1/vehicles

**Purpose:** Create a vehicle.

### Status

```text
201 Created
```

### Invalid request

```text
400 Bad Request
```

> This operation is intended for authorized users according to the final authentication/authorization implementation.

---

## 3.4. PUT /api/v1/vehicles/{vehicleId}

**Purpose:** Update an existing vehicle.

### Path parameter

```text
vehicleId
```

### Success

```text
200 OK
```

### Invalid request

```text
400 Bad Request
```

### Not found

```text
404 Not Found
```

---

## 3.5. DELETE /api/v1/vehicles/{vehicleId}

**Purpose:** Delete an existing vehicle.

### Path parameter

```text
vehicleId
```

### Success

```text
200 OK
```

### Not found

```text
404 Not Found
```

---

# 4. Search and Filter Convention

Search and filtering are implemented through the listing endpoint rather than through a separate `/search` endpoint.

### Current convention

```http
GET /api/v1/listings
```

with optional query parameters.

### Example

```http
GET /api/v1/listings?brand=Toyota&model=Camry&minYear=2020&maxYear=2025
```

### Current supported filter concepts

| Parameter      | Purpose                    |
| -------------- | -------------------------- |
| `keyword`      | General keyword search     |
| `vehicleId`    | Filter by vehicle ID       |
| `brand`        | Filter by brand            |
| `model`        | Filter by model            |
| `variant`      | Filter by variant          |
| `minPrice`     | Minimum listing price      |
| `maxPrice`     | Maximum listing price      |
| `minYear`      | Minimum manufacture year   |
| `maxYear`      | Maximum manufacture year   |
| `minMileage`   | Minimum mileage            |
| `maxMileage`   | Maximum mileage            |
| `fuelType`     | Fuel type                  |
| `transmission` | Transmission type          |
| `bodyType`     | Body type                  |
| `origin`       | Vehicle origin             |
| `location`     | Listing location           |
| `page`         | Page index                 |
| `size`         | Number of records per page |
| `sort`         | Sorting expression         |

---

# 5. Removed / Out-of-Scope APIs

The following APIs belonged to the previous Increment 1 / older project scope and are **not part of the current API contract**.

## 5.1. Comparison

Removed:

```text
POST /api/comparisons
GET  /api/comparisons/{comparisonId}
```

Reason:

Vehicle comparison is no longer part of the current submission scope.

---

## 5.2. Valuation

Removed:

```text
POST /api/valuation
```

The following concepts are therefore not part of the current API contract:

```text
predictedPrice
differencePercent
modelVersion
regression_v1
```

---

## 5.3. Recommendation

Removed:

```text
GET /api/recommendations
```

Recommendation ranking and recommendation score are not part of the current submission scope.

---

## 5.4. Separate vehicle search endpoint

Removed:

```text
GET /api/vehicles/search
```

Search/filter is performed through:

```text
GET /api/v1/listings
```

with query parameters.

---

# 6. Future API Areas

The final system scope includes additional P0/P1 modules that must be documented after their actual backend implementation is available.

Expected areas:

```text
Authentication
Authorization / RBAC
Deposit
Appointment
Customer
Favorites
Admin
Staff
```

These endpoints must **not be invented in this document before the corresponding Spring Boot implementation and team contract are available**.

For each future module, TV5 must synchronize:

```text
Controller
→ Endpoint
→ Request DTO
→ Response DTO
→ HTTP status
→ Authorization
→ Business rule
→ Test case
```

---

# 7. HTTP Status Conventions

The API uses the following general conventions:

| Status                      | Meaning                                     |
| --------------------------- | ------------------------------------------- |
| `200 OK`                    | Successful read/update/delete/request       |
| `201 Created`               | Successful resource creation                |
| `400 Bad Request`           | Invalid input or request                    |
| `401 Unauthorized`          | Authentication required or invalid          |
| `403 Forbidden`             | Authenticated user does not have permission |
| `404 Not Found`             | Requested resource does not exist           |
| `409 Conflict`              | Resource/business-state conflict            |
| `500 Internal Server Error` | Unexpected server-side error                |

For business-specific operations such as Deposit and Appointment, exact status codes must follow the final implementation and business contract.

---

# 8. API Documentation Rules

The API specification must satisfy the following rules:

1. Endpoint paths must match the actual Spring Boot `@RequestMapping` / `@GetMapping` / `@PostMapping` / `@PutMapping` / `@DeleteMapping` definitions.
2. DTO names must match the actual Java DTO classes.
3. Request and response fields must match the implemented DTOs.
4. HTTP status codes must match the actual controller behavior.
5. Authorization requirements must match the integrated Spring Security configuration.
6. Removed features must not reappear in current UML, SRS, test plan, or API documentation.
7. Pending modules must be marked `PENDING` rather than represented as implemented.

---

# 9. Current Implementation Status

| API Area                     | Status              |
| ---------------------------- | ------------------- |
| Listing list                 | IMPLEMENTED         |
| Listing detail               | IMPLEMENTED         |
| Listing create               | IMPLEMENTED         |
| Listing delete               | IMPLEMENTED         |
| Listing search/filter        | IMPLEMENTED         |
| Vehicle list                 | IMPLEMENTED         |
| Vehicle detail               | IMPLEMENTED         |
| Vehicle create               | IMPLEMENTED         |
| Vehicle update               | IMPLEMENTED         |
| Vehicle delete               | IMPLEMENTED         |
| Authentication               | PENDING integration |
| Authorization / RBAC         | PENDING integration |
| Deposit                      | PENDING             |
| Appointment                  | PENDING             |
| Favorites                    | PENDING             |
| Admin account management     | PENDING             |
| Staff appointment management | PENDING             |

---

# 10. Synchronization Requirement

Before Final Gate, TV5 must cross-check this document against:

```text
Spring Boot Controllers
        ↓
DTOs
        ↓
Services
        ↓
Repositories
        ↓
Database schema
        ↓
React API clients
        ↓
Test Plan / Test Evidence
        ↓
SRS / UML / Traceability Matrix
```

Any endpoint, DTO, field, class, or business rule that exists only in documentation and not in the implementation must be marked `PENDING` or removed.
