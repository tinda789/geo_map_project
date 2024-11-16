# app/__init__.py

from flask import Flask
from app.extensions import mongo
from .controllers.map_controller import map_blueprint

def create_app():
    app = Flask(__name__)
    
    # Cấu hình MongoDB
    app.config["MONGO_URI"] = "mongodb://localhost:27017/geo_hospital"

    # Khởi tạo MongoDB
    mongo.init_app(app)

    # Đăng ký blueprint
    app.register_blueprint(map_blueprint)

    return app
