GeoHospital Map - Hướng dẫn cài đặt và phát triển
Hướng dẫn này sẽ giúp bạn cài đặt và chạy ứng dụng GeoHospital Map tại máy tính của mình, cũng như cách đóng gói ứng dụng để triển khai.

Yêu cầu trước khi cài đặt
Trước khi bắt đầu, đảm bảo rằng bạn đã cài đặt những công cụ sau:

Python 3.8+ (để chạy server backend)
Node.js (để cài đặt các thư viện frontend)
Docker (tuỳ chọn, nếu muốn triển khai ứng dụng qua Docker)
Bước 1: Clone Repository
Clone repository về máy của bạn bằng Git:

bash
Sao chép mã
git clone https://github.com/username-cua-ban/GeoHospitalMap.git
cd GeoHospitalMap
Bước 2: Cài đặt Môi trường Ảo (Virtual Environment)
Để tránh xung đột thư viện, bạn nên sử dụng môi trường ảo cho dự án:

Windows
bash
Sao chép mã
python -m venv venv
venv\Scripts\activate
macOS/Linux
bash
Sao chép mã
python3 -m venv venv
source venv/bin/activate
Bước 3: Cài đặt Phụ thuộc cho Backend
Sau khi tạo môi trường ảo, bạn cần cài đặt các thư viện cho backend. Chạy lệnh sau:

bash
Sao chép mã
pip install -r requirements.txt
Lệnh này sẽ cài đặt tất cả các thư viện cần thiết cho backend.

Bước 4: Cài đặt Phụ thuộc cho Frontend
Nếu ứng dụng của bạn có phụ thuộc frontend (JavaScript), hãy đảm bảo rằng Node.js đã được cài đặt, rồi chạy lệnh sau:

bash
Sao chép mã
npm install
Lệnh này sẽ cài đặt các thư viện hoặc công cụ JavaScript cần thiết cho frontend.

Bước 5: Chạy Backend
Sau khi cài đặt xong các phụ thuộc backend, bạn có thể chạy server Flask với lệnh sau:

bash
Sao chép mã
python run.py
Mặc định, ứng dụng sẽ chạy tại http://127.0.0.1:5000/. Bạn có thể truy cập và thử nghiệm bản đồ tại đây.
