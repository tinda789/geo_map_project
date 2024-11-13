# app/controllers/map_controller.py

from flask import Blueprint, render_template
from app.services.map_service import get_map

map_blueprint = Blueprint('map', __name__)

@map_blueprint.route('/')
def index():
    map_html = get_map()  # Lấy HTML của bản đồ từ service
    return render_template("index.html", map_html=map_html)
