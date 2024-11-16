from flask import Blueprint, render_template, jsonify, request
import folium
from folium import plugins
from bson import ObjectId
from app.extensions import mongo

map_blueprint = Blueprint('map', __name__)

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

    # Lấy dữ liệu từ MongoDB và thêm vào bản đồ
    collection = mongo.db.locations
    geojson_data = {
        "type": "FeatureCollection",
        "features": []
    }

    data = collection.find()
    for location in data:
        feature = {
            "type": "Feature",
            "geometry": location['geometry'],
            "properties": location['properties']
        }
        geojson_data['features'].append(feature)

    if geojson_data['features']:
        folium.GeoJson(geojson_data, name="GeoJSON Data").add_to(m)

    # Lưu bản đồ vào HTML tạm thời để truyền vào template
    map_html = m._repr_html_()

    return render_template('index.html', map_html=map_html)

@map_blueprint.route('/save_location', methods=['POST'])
def save_location():
    data = request.json  # Nhận danh sách các đối tượng từ client

    if not isinstance(data, list):  # Kiểm tra dữ liệu phải là danh sách
        return jsonify({"error": "Dữ liệu không hợp lệ"}), 400

    locations_to_save = []

    for item in data:
        geometry = item.get("geometry")
        properties = item.get("properties", {})

        # Kiểm tra các thông tin cơ bản
        if not geometry:
            return jsonify({"error": "Dữ liệu hình học bị thiếu"}), 400

        # Thêm dữ liệu mới vào danh sách để lưu
        locations_to_save.append({
            "geometry": geometry,
            "properties": properties
        })

    # Lưu tất cả vào MongoDB
    collection = mongo.db.locations
    result = collection.insert_many(locations_to_save)

    # Trả về danh sách các ID đã lưu
    return jsonify({
        "message": "Đã lưu thành công",
        "ids": [str(_id) for _id in result.inserted_ids]
    })

@map_blueprint.route('/delete_location', methods=['POST'])
def delete_location():
    data = request.json
    location_id = data.get("id")  # Lấy ID từ request

    if not location_id:
        return jsonify({"error": "Không có ID để xóa"}), 400  # Kiểm tra ID có tồn tại không

    try:
        # Chuyển ID thành ObjectId và xóa khỏi MongoDB
        result = mongo.db.locations.delete_one({"_id": ObjectId(location_id)})

        if result.deleted_count > 0:
            return jsonify({"message": "Địa điểm đã bị xóa"})
        else:
            return jsonify({"message": "Không tìm thấy địa điểm để xóa"}), 404
    except Exception as e:
        print(f"Lỗi khi xóa địa điểm: {e}")
        return jsonify({"error": "Lỗi khi xóa địa điểm"}), 500

# Endpoint mới để lấy dữ liệu từ MongoDB và trả về GeoJSON
@map_blueprint.route('/get_locations', methods=['GET'])
def get_locations():
    collection = mongo.db.locations
    geojson_data = {
        "type": "FeatureCollection",
        "features": []
    }

    data = collection.find()
    for location in data:
        feature = {
            "type": "Feature",
            "_id": str(location["_id"]),
            "geometry": location['geometry'],
            "properties": location['properties']
        }
        geojson_data['features'].append(feature)

    return jsonify({"geojson": geojson_data})
@map_blueprint.route('/update_location', methods=['POST'])
def update_location():
    data = request.json  # Nhận dữ liệu từ client

    location_id = data.get('id')  # ID của địa điểm cần cập nhật
    new_name = data.get('name')   # Tên mới của địa điểm

    # Kiểm tra nếu thiếu ID hoặc tên
    if not location_id or not new_name:
        return jsonify({"error": "Cần cung cấp cả ID và tên mới"}), 400

    try:
        # Chuyển ID thành ObjectId để MongoDB nhận diện
        location_object_id = ObjectId(location_id)

        # Cập nhật tên trong MongoDB
        result = mongo.db.locations.update_one(
            {"_id": location_object_id},
            {"$set": {"properties.name": new_name}}  # Cập nhật trường 'name' trong 'properties'
        )

        if result.matched_count > 0:
            return jsonify({"message": "Cập nhật thành công"}), 200
        else:
            return jsonify({"error": "Không tìm thấy địa điểm để cập nhật"}), 404

    except Exception as e:
        print(f"Lỗi khi cập nhật địa điểm: {e}")
        return jsonify({"error": "Lỗi khi cập nhật địa điểm"}), 500
@map_blueprint.route('/search', methods=['GET'])
def search_locations():
    query = request.args.get('query', '').strip()  # Lấy từ khóa tìm kiếm từ query string

    if not query:
        return jsonify({"error": "Từ khóa tìm kiếm không được để trống"}), 400

    collection = mongo.db.locations

    # Tìm kiếm trong MongoDB theo `name` hoặc `address`
    results = collection.find({
        "$or": [
            {"properties.name": {"$regex": query, "$options": "i"}},  # Tìm kiếm không phân biệt hoa thường
            {"properties.address": {"$regex": query, "$options": "i"}}
        ]
    })

    # Chuyển kết quả thành danh sách GeoJSON
    geojson_data = {
        "type": "FeatureCollection",
        "features": []
    }

    for location in results:
        feature = {
            "type": "Feature",
            "_id": str(location["_id"]),
            "geometry": location['geometry'],
            "properties": location['properties']
        }
        geojson_data['features'].append(feature)

    return jsonify({"geojson": geojson_data})
