# API Specification — Increment 2: Market Data API

* **Tác giả:** TV1 — Backend Lead
* **Dự án:** Used-Car-Smart-System
* **Phiên bản:** v2.0.0 (Increment 2 Final)
* **Giao thức:** HTTP REST JSON
* **Base URL:** `http://localhost:8080/api/v1`
* **Swagger UI:** `http://localhost:8080/swagger-ui.html`

---

## 1. Tổng quan Endpoint

| Phương thức | Endpoint | Mô tả | Đối tượng trả về |
|---|---|---|---|
| `GET` | `/api/v1/vehicles` | Lấy danh sách xe kèm tìm kiếm, lọc đa tiêu chí, phân trang và sắp xếp | `PageResponse<ListingResponseDto>` |
| `GET` | `/api/v1/vehicles/{id}` | Lấy chi tiết thông số và tin đăng của 1 xe theo ID | `ListingResponseDto` |
| `GET` | `/api/v1/listings` | Endpoint tương đương (alias) cho tìm kiếm và phân trang | `PageResponse<ListingResponseDto>` |
| `GET` | `/api/v1/listings/{id}` | Lấy chi tiết tin đăng theo ID | `ListingResponseDto` |

---

## 2. Chi tiết API Tìm kiếm & Lọc (`GET /api/v1/vehicles`)

### Query Parameters

| Tham số | Kiểu dữ liệu | Bắt buộc | Mặc định | Ý nghĩa & Ví dụ |
|---|---|:---:|:---:|---|
| `keyword` | String | Không | - | Tìm kiếm từ khóa tự do trong hãng, dòng xe, phiên bản, địa điểm |
| `brand` | String | Không | - | Hãng xe (không phân biệt hoa thường, VD: `Toyota`, `Mazda`) |
| `model` | String | Không | - | Dòng xe (VD: `Vios`, `Camry`, `CX-5`) |
| `variant` | String | Không | - | Phiên bản (VD: `1.5G`, `2.0 Premium`) |
| `minPrice` | Decimal | Không | - | Giá bán tối thiểu, VND (VD: `400000000`) |
| `maxPrice` | Decimal | Không | - | Giá bán tối đa, VND (VD: `800000000`) |
| `minYear` | Integer | Không | - | Năm sản xuất tối thiểu (VD: `2018`) |
| `maxYear` | Integer | Không | - | Năm sản xuất tối đa (VD: `2024`) |
| `minMileage`| Integer | Không | - | Số km ODO tối thiểu, km (VD: `10000`) |
| `maxMileage`| Integer | Không | - | Số km ODO tối đa, km (VD: `60000`) |
| `fuelType` | String | Không | - | `Gasoline` (Xăng), `Diesel` (Dầu), `Hybrid`, `Electric` (Điện) |
| `transmission` | String | Không | - | `Automatic` (Tự động), `Manual` (Số sàn), `CVT` |
| `bodyType` | String | Không | - | `Sedan`, `SUV / Crossover`, `Hatchback`, `Pickup`, `MPV`... |
| `origin` | String | Không | - | `Domestic` (Lắp ráp trong nước), `Imported` (Nhập khẩu) |
| `location` | String | Không | - | Tỉnh thành / địa điểm (VD: `Hà Nội`, `Hồ Chí Minh`) |
| `page` | Integer | Không | `0` | Chỉ số trang hiện tại (0-indexed) |
| `size` | Integer | Không | `20` | Số bản ghi trên mỗi trang |
| `sort` | String | Không | `id,desc` | Tiêu chí sắp xếp: `price,asc`, `price,desc`, `manufactureYear,desc`, `mileage,asc` |

### Ví dụ Request
```http
GET /api/v1/vehicles?brand=Toyota&minPrice=400000000&maxPrice=700000000&fuelType=Gasoline&page=0&size=10&sort=price,asc HTTP/1.1
Host: localhost:8080
Accept: application/json
```

### Cấu trúc Response (`200 OK`)
```json
{
  "content": [
    {
      "id": 1,
      "price": 495000000.00,
      "mileage": 38000,
      "color": "Trắng",
      "location": "TP. Hồ Chí Minh",
      "sourceUrl": "https://bonbanh.com/xe-toyota-vios-123",
      "source_url": "https://bonbanh.com/xe-toyota-vios-123",
      "imageUrl": "https://images.unsplash.com/photo-1617814076367-b759c7d7e738",
      "image_url": "https://images.unsplash.com/photo-1617814076367-b759c7d7e738",
      "vehicleId": 10,
      "brand": "Toyota",
      "model": "Vios",
      "variant": "1.5G CVT",
      "manufactureYear": 2021,
      "manufacture_year": 2021,
      "fuelType": "Gasoline",
      "fuel_type": "Gasoline",
      "transmission": "Automatic",
      "bodyType": "Sedan",
      "body_type": "Sedan",
      "engineSize": 1.5,
      "engine_size": 1.5,
      "seatCount": 5,
      "seat_count": 5,
      "origin": "Domestic",
      "sourceId": 1,
      "sourceName": "bonbanh",
      "source_name": "bonbanh",
      "listedAtRaw": "2 ngày trước",
      "listed_at": "2 ngày trước",
      "crawledAt": "2026-09-07T08:25:55Z",
      "crawled_at": "2026-09-07T08:25:55Z"
    }
  ],
  "page": 0,
  "size": 10,
  "totalElements": 10813,
  "totalPages": 1082,
  "first": true,
  "last": false
}
```

---

## 3. Chi tiết API Lấy thông tin 1 xe (`GET /api/v1/vehicles/{id}`)

### Request
```http
GET /api/v1/vehicles/1 HTTP/1.1
Host: localhost:8080
Accept: application/json
```

### Cấu trúc Response (`200 OK`)
Trả về trực tiếp đối tượng `ListingResponseDto` phẳng (chứa đầy đủ thông số dòng xe, thông tin tin đăng, ảnh đại diện và link nguồn).

### Cấu trúc Error Response (`404 Not Found`)
```json
{
  "timestamp": "2026-09-19T10:20:00Z",
  "status": 404,
  "error": "Not Found",
  "message": "Khong tim thay tin dang voi ID: 99999",
  "path": "/api/v1/vehicles/99999"
}
```
