# app/services/map_service.py

import folium
from app.models.location import Location



def get_map():
    map_center = [10.032, 105.729]
    map_ = folium.Map(location=map_center, zoom_start=13)

    for location in locations:
        folium.Marker([location.latitude, location.longitude], popup=location.name).add_to(map_)

    return map_._repr_html_()  # Trả về HTML của bản đồ
