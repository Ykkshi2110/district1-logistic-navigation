# District 1 Map — Ứng dụng đồ thị đường phố (Java 21)

Ứng dụng CLI mô phỏng bản đồ Quận 1 (TP.HCM): tìm đường tối ưu (Dijkstra), tối ưu lộ trình giao hàng nhỏ (TSP + backtracking), chặn/mở chặn cạnh, và xem danh sách địa điểm.

## Yêu cầu

- JDK **21** (Gradle toolchain sẽ gợi ý tải nếu thiếu).

## Build & chạy nhanh (≈ 5 phút)

```bash
git clone <repo-url>
cd Final-Exam
./gradlew run
```

- Lần đầu Gradle có thể tải phân phối và dependency — chờ đến khi menu hiện.
- Dữ liệu mặc định: `app/src/main/resources/district1_map.csv` (đưa lên classpath; `App` resolve đường dẫn tự động).
- Chạy với file CSV tùy chọn:

```bash
./gradlew run --args="/đường/dẫn/tới/map.csv"
```

Chạy test:

```bash
./gradlew test
```

## Định dạng CSV

File UTF-8, dòng bắt đầu bằng `#` là comment (bỏ qua). Dòng đầu (không phải comment) là **header**, các dòng sau là cạnh.

Cột (đúng **7** trường, phân tách bằng dấu phẩy):

| Cột | Ý nghĩa |
|-----|---------|
| `from_id` | Id đỉnh nguồn |
| `to_id` | Id đỉnh đích |
| `from_name` | Tên hiển thị đỉnh nguồn |
| `to_name` | Tên hiển thị đỉnh đích |
| `distance_m` | Khoảng cách mét (> 0) |
| `speed_kmh` | Tốc độ giả định km/h (> 0) |
| `is_oneway` | `true`/`1`/`yes` = một chiều; còn lại = hai chiều (thêm cạnh ngược) |

Dòng sai định dạng hoặc `distance_m`/`speed_kmh` không dương: **bỏ qua** và ghi log cảnh báo (ứng dụng không crash). File không tồn tại: ném `AppException` kèm đường dẫn.

## Thuật toán (tóm tắt)

1. **Dijkstra** — Trọng số cạnh theo `WeightMode.DISTANCE` (mét) hoặc `WeightMode.TIME` (giây, \(d / (v \cdot 1000/3600)\)). Hàng đợi ưu tiên theo chi phí tích lũy; bỏ qua cạnh `blocked` hoặc không còn tối ưu (bản ghi cũ trong PQ). Đường đi dựng ngược từ `prev[]` rồi đảo bằng `LinkedList.addFirst` để thứ tự nguồn → đích.

2. **TSP (≤ 5 điểm giao)** — Dựng ma trận chi phí cặp đỉnh bằng Dijkstra. Nếu một cặp không liên thông → lỗi. Sau đó **backtracking** thử mọi hoán vị điểm giao, có **pruning** khi chi phí nhánh ≥ tốt nhất hiện tại; khi thăm hết các điểm giao, cộng thêm chi phí **quay về kho** (`matrix[last][depot]`).

## Tính năng CLI

1. Tìm đường ngắn nhất / nhanh nhất (in path, chi phí theo chế độ, km và phút ước lượng).
2. Tối ưu lộ trình giao hàng (1–5 điểm, không trùng depot).
3. Chặn / mở chặn cạnh có hướng (cạnh vẫn liệt kê nhưng không đi qua được khi chặn).
4. In bảng địa điểm (id, tên, bậc ra).
5. Thoát.

Lỗi đầu vào (menu không phải số, id sai, quá nhiều điểm giao, cạnh không tồn tại, …) hiển thị **tiếng Việt**; menu hiện lại, không crash.

## Cấu trúc mã (gói chính)

- `model` — `Graph`, `Node`, `Edge`, `WeightMode`, `RouteResult`
- `io` — `CsvMapLoader`
- `service` — `DijkstraService`, `TspService`
- `validation` — `InputValidator`
- `ui` — `ConsoleUI`
- `App` — `main`
