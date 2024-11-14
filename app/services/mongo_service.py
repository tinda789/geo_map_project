from pymongo import MongoClient
from bson.objectid import ObjectId
import logging

class MongoService:
    def __init__(self, db_name='geo_hospital_db', collection_name='locations'):
        # Kết nối đến MongoDB
        try:
            self.client = MongoClient('mongodb://localhost:27017/')  # Địa chỉ MongoDB của bạn
            self.db = self.client[db_name]  # Tên cơ sở dữ liệu
            self.collection = self.db[collection_name]  # Tên collection
        except Exception as e:
            logging.error(f"Error connecting to MongoDB: {e}")
            raise e

    def save_location(self, lat, lon, name, type_):
        """Lưu thông tin vị trí vào MongoDB"""
        location = {
            "lat": lat,
            "lon": lon,
            "name": name,
            "type": type_
        }
        try:
            result = self.collection.insert_one(location)
            return str(result.inserted_id)  # Trả về ObjectId dưới dạng string
        except Exception as e:
            logging.error(f"Error saving location: {e}")
            return None

    def get_all_locations(self):
        """Lấy tất cả các vị trí từ MongoDB"""
        try:
            locations = list(self.collection.find())
            for location in locations:
                location["_id"] = str(location["_id"])  # Convert ObjectId to string
            return locations
        except Exception as e:
            logging.error(f"Error retrieving locations: {e}")
            return []

    def delete_location(self, lat, lon):
        """Xóa một vị trí dựa trên lat và lon"""
        try:
            result = self.collection.delete_one({"lat": lat, "lon": lon})
            return result.deleted_count > 0
        except Exception as e:
            logging.error(f"Error deleting location: {e}")
            return False

    def get_location_by_id(self, location_id):
        """Lấy thông tin một vị trí theo ObjectId"""
        try:
            location = self.collection.find_one({"_id": ObjectId(location_id)})
            if location:
                location["_id"] = str(location["_id"])  # Convert ObjectId to string
            return location
        except Exception as e:
            logging.error(f"Error retrieving location by ID: {e}")
            return None
