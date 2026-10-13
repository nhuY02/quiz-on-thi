# Quiz Ôn Thi - Tự Động Tạo Đề Trắc Nghiệm Thông Minh Từ Tài Liệu

Ứng dụng web giúp bạn tải lên tài liệu học tập (PDF, Word .docx, Văn bản .txt) và dùng AI (Google Gemini, OpenAI, Groq...) để tự động chia nhỏ tài liệu, trích xuất các khái niệm chính, sinh bộ câu hỏi trắc nghiệm chất lượng cao và kiểm tra độ phủ kiến thức toàn diện.

---

## 🌟 Tính Năng Nổi Bật

1. **Trích xuất văn bản phía Client (Không cần gửi file lên server)**
   - Hỗ trợ file **PDF** (thư viện `pdfjs-dist`), phát hiện và cảnh báo thông minh nếu file PDF là dạng ảnh scan không có text.
   - Hỗ trợ file **Word (.docx)** (thư viện `mammoth`).
   - Hỗ trợ file **Text (.txt, .md)**.

2. **Bao quát nội dung & Kiểm tra độ phủ (Quan trọng nhất)**
   - **Chia nhỏ tài liệu thông minh**: Tự động phát hiện tiêu đề/chương mục hoặc phân đoạn 2-3 trang/khối văn bản độc lập (~1000 - 1500 từ).
   - **Quy trình 2 bước với AI**:
     - *Bước 1*: Trích xuất danh sách thuật ngữ/khái niệm cốt lõi (`keyConcepts`) và sinh câu hỏi trắc nghiệm tương ứng với dung lượng phần (3 - 8 câu/phần).
     - *Bước 2 (Kiểm tra độ phủ)*: Đối chiếu các khái niệm đã có câu hỏi với danh sách khái niệm. Nếu còn sót khái niệm nào, AI tự động sinh thêm câu hỏi bổ sung.
   - Hiển thị **Tỷ lệ độ phủ nội dung** (ví dụ: *19/19 khái niệm - 100%*) và danh sách chi tiết các khái niệm đã phủ hoặc còn thiếu.
   - **Xử lý lỗi từng phần**: Nếu một phần gặp lỗi mạng/rate limit, bạn có thể bấm **"Thử lại"** riêng phần đó mà không phải làm lại từ đầu.

3. **Chất lượng câu hỏi chuẩn học thuật**
   - 4 đáp án (A, B, C, D) với 1 đáp án đúng duy nhất, các phương án nhiễu hợp lý và có tính sư phạm cao.
   - **Giữ nguyên thuật ngữ tiếng Anh gốc** trong tài liệu (ví dụ: *Overfitting, Deadlock, Throughput, gRPC, Eventual Consistency...*).
   - Giải thích chi tiết bằng tiếng Việt: nêu rõ vì sao đáp án đúng là đúng VÀ vì sao các phương án khác chưa chính xác.
   - Ghi rõ nguồn tham chiếu ngữ cảnh / số trang trong tài liệu (`sourceRef`).

4. **Giao diện 4 màn hình mượt mà**
   - **Màn hình 1 - Upload**: Kéo thả file lớn, hiển thị tên & dung lượng file, nút **"Trải nghiệm ngay với đề mẫu"** (không cần nhập key ngay).
   - **Màn hình 2 - Cấu hình**: Chọn các phần/chương muốn ôn, chọn chế độ **"Luyện tập"** (xem đáp án và giải thích ngay) hoặc **"Thi thử"** (nộp bài mới xem kết quả), tùy chọn xáo trộn câu hỏi và xáo trộn đáp án A/B/C/D.
   - **Màn hình 3 - Làm bài**: Hiển thị 1 câu/lần, thanh tiến độ, đánh dấu câu cần xem lại (Flag/Bookmark), bảng điều hướng nhanh tất cả câu hỏi.
   - **Màn hình 4 - Kết quả**: Điểm số, % đúng, pháo hoa ăn mừng khi đạt điểm cao, phân tích điểm yếu theo từng chương/chủ đề, danh sách xem lại lời giải chi tiết (lọc câu sai/câu đã đánh dấu).
   - Nút **"Làm lại các câu sai"** (tự động tạo một bài thi mới chỉ gồm những câu làm sai), **"Xuất file JSON"**, và **"Kho đề đã lưu"** trong LocalStorage.
   - Hỗ trợ chế độ **Sáng (Light) / Tối (Dark)** và responsive trên cả điện thoại di động lẫn máy tính.

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Ứng Dụng

### Yêu cầu
- Đã cài đặt **Node.js** (khuyến nghị phiên bản 18+ trở lên).

### Các bước chạy:
1. Mở terminal tại thư mục dự án:
   ```bash
   cd e:\BuildAppHoc
   ```

2. Cài đặt các gói phụ thuộc (nếu chưa cài):
   ```bash
   npm install
   ```

3. Khởi động môi trường phát triển (Development):
   ```bash
   npm run dev
   ```
   Ứng dụng sẽ chạy tại địa chỉ: **`http://localhost:5173/`**

4. (Tùy chọn) Đóng gói ứng dụng để triển khai:
   ```bash
   npm run build
   npm run preview
   ```

---

## 🔑 Hướng Dẫn Điền API Key AI

1. Trên thanh điều hướng (góc trên bên phải), bấm vào nút **"Cấu hình AI"**.
2. Chọn nhà cung cấp:
   - **Google Gemini** *(Khuyên dùng - Miễn phí, phản hồi nhanh và chính xác nhất)*:
     - Nhận key miễn phí tại: [Google AI Studio](https://aistudio.google.com/app/apikey).
     - Bấm **"Create API key"** -> Sao chép và dán vào ô API Key trong ứng dụng.
     - Model mặc định: `gemini-2.5-flash` hoặc `gemini-2.0-flash`.
   - **OpenAI** / **Groq** / **Tùy chỉnh (DeepSeek, OpenRouter, Ollama)**:
     - Nhập API Key tương ứng và (nếu cần) điền `Custom API Base URL`.
3. Bấm **"Lưu cấu hình"**.
   > *Lưu ý an toàn*: API Key được lưu trực tiếp trong LocalStorage của trình duyệt bạn và gửi thẳng đến máy chủ của Google/OpenAI, không qua bất kỳ bên trung gian nào.
