


cd GeoHospitalMap
 Cài đặt Môi trường Ảo (Virtual Environment)
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



bash
Sao chép mã
python run.py
Mặc định, ứng dụng sẽ chạy tại http://127.0.0.1:5000/. Bạn có thể truy cập và thử nghiệm bản đồ tại đây.
