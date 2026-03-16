# 🔌 CompB — NestJS Backend API

A **NestJS** REST API backend that serves data from the scraper project's MongoDB database. It exposes endpoints to browse products and track price history across 3 Tunisian e-commerce stores.

## Tech Stack

| Technology | Purpose |
|---|---|
| NestJS | Backend framework |
| Mongoose + `@nestjs/mongoose` | MongoDB ODM & integration |
| `@nestjs/config` | `.env` configuration management |
| TypeScript | Language |

---

## Folder Structure

```
compb/
├── src/
│   ├── products/
│   │   ├── product.schema.ts          # Mongoose schema for Product
│   │   ├── products.service.ts        # Business logic (filtering, pagination)
│   │   ├── products.controller.ts     # HTTP route handlers for /api/products
│   │   ├── products.module.ts         # NestJS module wiring
│   │   └── dto/
│   │       └── query-product.dto.ts   # Query param types (filters, pagination)
│   ├── price-history/
│   │   ├── price-history.schema.ts    # Mongoose schema for PriceHistory
│   │   ├── price-history.service.ts   # Business logic (fetch by productId)
│   │   ├── price-history.controller.ts# HTTP route handlers for /api/price-history
│   │   └── price-history.module.ts    # NestJS module wiring
│   ├── app.module.ts                  # Root module — wires all modules + MongoDB
│   └── main.ts                        # Entry point — sets prefix, CORS, port
├── .env                               # MONGO_URI + PORT
├── nest-cli.json
├── tsconfig.json
└── package.json
```

---

## API Endpoints

Base URL: `http://localhost:3001/api`

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products` | List all products (paginated + filterable) |
| GET | `/products/stores` | Get list of available store names |
| GET | `/products/:id` | Get a single product by its MongoDB ID |

#### Query Parameters for `GET /products`

| Param | Type | Description |
|-------|------|-------------|
| `store` | string | Filter by store (`MyTek`, `Tunisianet`, `Scoop`) |
| `search` | string | Search by product name (case-insensitive) |
| `minPrice` | number | Minimum price filter |
| `maxPrice` | number | Maximum price filter |
| `page` | number | Page number (default: `1`) |
| `limit` | number | Results per page (default: `20`) |

**Example:**
```
GET /api/products?store=MyTek&search=laptop&minPrice=1000&maxPrice=5000&page=1&limit=10
```

**Response:**
```json
{
  "data": [...],
  "total": 245,
  "page": 1,
  "limit": 10,
  "totalPages": 25
}
```

---

### Price History

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/price-history/:productId` | Get full price history for a product, sorted by date ascending |

**Example:**
```
GET /api/price-history/65f3a1b2c4d5e6f7a8b9c0d1
```

**Response:**
```json
[
  { "productId": "...", "price": 1899, "date": "2025-01-10T00:00:00Z" },
  { "productId": "...", "price": 1749, "date": "2025-02-01T00:00:00Z" }
]
```

---

## File Descriptions

### `src/products/product.schema.ts`
Defines the **Product** Mongoose schema using NestJS decorators. Maps to the `products` collection in MongoDB (same collection the scraper writes to).

Fields: `name`, `store`, `price`, `url`, `image`, `description`, `lastUpdated`

---

### `src/products/products.service.ts`
Contains all business logic for products:
- `findAll(query)` — Builds a dynamic MongoDB filter from query params, runs a paginated query with `skip` + `limit`
- `findById(id)` — Fetches a single product by `_id`
- `getStores()` — Runs `Product.distinct('store')` to return unique store names

---

### `src/products/products.controller.ts`
Exposes the HTTP routes for `/api/products`. Delegates all logic to `ProductsService`.

**Route order matters:** `/stores` is registered before `/:id` to prevent NestJS from treating the literal string `"stores"` as a product ID.

---

### `src/products/dto/query-product.dto.ts`
A plain TypeScript class that types the query parameters accepted by `GET /products`. Used for type safety in the controller and service.

---

### `src/price-history/price-history.schema.ts`
Defines the **PriceHistory** Mongoose schema. Maps to the `pricehistories` collection.

Fields: `productId` (ref → Product), `price`, `date`

---

### `src/price-history/price-history.service.ts`
Contains business logic for price history:
- `findByProduct(productId)` — Fetches all price history entries for a given product ID, sorted chronologically (oldest first — ideal for charting)

---

### `src/price-history/price-history.controller.ts`
Exposes the HTTP route `GET /api/price-history/:productId`. Delegates to `PriceHistoryService`.

---

### `src/app.module.ts`
The **root NestJS module**. Wires together:
- `ConfigModule` (global, reads `.env`)
- `MongooseModule` (async, uses `MONGO_URI` from config)
- `ProductsModule`
- `PriceHistoryModule`

---

### `src/main.ts`
The **application entry point**.
- Sets global route prefix: `/api`
- Enables **CORS** (open to all origins — ready for any frontend)
- Listens on port `3001` (configurable via `PORT` in `.env`)

---

## Environment Variables

Create a `.env` file at the project root:

```env
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>
PORT=3001
```

---

## Running the App

```bash
# Install dependencies
npm install

# Development (hot reload)
npm run start:dev

# Production
npm run build
npm run start:prod
```

Server starts at: **`http://localhost:3001/api`**
