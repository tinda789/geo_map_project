from flask import Blueprint, render_template, jsonify, request
import folium
from folium import plugins
from geopy.geocoders import Nominatim
import json

map_blueprint = Blueprint('map', __name__)
geolocator = Nominatim(user_agent="geo_hospital_app")

# Lưu trữ các địa điểm (Có thể thay bằng cơ sở dữ liệu trong thực tế)
locations_db = []

@map_blueprint.route('/')
def index():
    # Tạo bản đồ với tọa độ trung tâm Cần Thơ
    m = folium.Map(location=[10.0452, 105.7469], zoom_start=12)

    # Thêm tính năng vẽ bản đồ
    draw = plugins.Draw(
        export=True,
        position="topleft",
        draw_options={
            'polyline': {'shapeOptions': {'color': 'red'}},
            'polygon': {'shapeOptions': {'color': 'blue'}},
            'circle': {'shapeOptions': {'color': 'green'}},
            'marker': {},
        }
    )
    draw.add_to(m)

    # Thêm sự kiện nhấp chuột để lấy tọa độ
    m.add_child(folium.LatLngPopup())

    # Thêm lớp dữ liệu GeoJSON nếu có vị trí đã lưu
    if locations_db:
        geojson_data = convert_to_geojson(locations_db)
        folium.GeoJson(geojson_data, name="GeoJSON Data").add_to(m)

    # Lưu bản đồ vào file HTML
    m.save('app/templates/map.html')

    return render_template('index.html')

@map_blueprint.route('/get_address', methods=['POST'])
def get_address():
    data = request.json
    lat, lon = data.get("lat"), data.get("lon")

    try:
        location = geolocator.reverse((lat, lon))
        address = location.address if location else "Không tìm thấy địa chỉ"
    except Exception as e:
        print(f"Lỗi khi lấy địa chỉ: {e}")
        address = "Lỗi khi lấy địa chỉ"

    return jsonify({"address": address})

@map_blueprint.route('/save_location', methods=['POST'])
def save_location():
    data = request.json
    lat = data.get("lat")
    lon = data.get("lon")
    name = data.get("name")
    type_ = data.get("type")

    # Thêm địa điểm mới vào danh sách locations_db
    new_location = {"lat": lat, "lon": lon, "name": name, "type": type_}
    locations_db.append(new_location)

    return jsonify({"message": "Địa điểm đã được lưu", "location": new_location})

@map_blueprint.route('/delete_location', methods=['POST'])
def delete_location():
    data = request.json
    lat = data.get("lat")
    lon = data.get("lon")

    # Tìm và xóa địa điểm khỏi danh sách locations_db
    global locations_db
    locations_db = [location for location in locations_db if location['lat'] != lat or location['lon'] != lon]

    return jsonify({"message": "Địa điểm đã bị xóa"})

def convert_to_geojson(locations):
    """Chuyển danh sách địa điểm sang định dạng GeoJSON."""
    geojson = {
        "type": "FeatureCollection",
        "features": []
    }
    for location in locations:
        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [location["lon"], location["lat"]]
            },
            "properties": {
                "name": location["name"],
                "type": location["type"]
            }
        }
        geojson["features"].append(feature)
    return geojson
