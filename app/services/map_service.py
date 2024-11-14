import folium
from folium import plugins
from app.models.location import Location

def get_map(locations):
    # Tạo bản đồ với tọa độ trung tâm Cần Thơ
    map_center = [10.032, 105.729]
    map_ = folium.Map(location=map_center, zoom_start=13)

    # Thêm công cụ vẽ bản đồ
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
    draw.add_to(map_)

    # Thêm các marker từ danh sách locations
    for location in locations:
        folium.Marker(
            [location.latitude, location.longitude],
            popup=location.name
        ).add_to(map_)

    # Lưu bản đồ vào file HTML để hiển thị trong ứng dụng
    map_file_path = 'app/templates/map.html'
    map_.save(map_file_path)

    return map_file_path  # Trả về đường dẫn tới file HTML của bản đồ
