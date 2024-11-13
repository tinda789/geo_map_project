# app/controllers/map_controller.py

from flask import Blueprint, render_template, jsonify
import folium
from folium import plugins

map_blueprint = Blueprint('map', __name__)

@map_blueprint.route('/')
def index():
    # Tạo bản đồ với tọa độ trung tâm Cần Thơ
    m = folium.Map(location=[10.0452, 105.7469], zoom_start=12)

    # Thêm tính năng vẽ bản đồ
   

    # Lưu bản đồ vào file HTML
    m.save('app/templates/index.html')

    return render_template('index.html')

@map_blueprint.route('/get_geojson', methods=['POST'])
def get_geojson():
    # Giả sử người dùng vẽ hình dạng và chúng ta lấy dữ liệu GeoJSON
    geojson_data = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [105.7469, 10.0452]  # Tọa độ của một marker ví dụ
                },
                "properties": {
                    "name": "Hospital A",
                    "type": "Hospital"
                }
            }
        ]
    }

    return jsonify(geojson_data)
