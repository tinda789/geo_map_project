# app/config.py

class Config:
    MONGODB_URI = "mongodb://localhost:27017"
    DATABASE_NAME = "my_geospatial_app_db"
    SECRET_KEY = 'acgdghtdda'  # Thay đổi giá trị này thành một key bảo mật
    DEBUG = True
