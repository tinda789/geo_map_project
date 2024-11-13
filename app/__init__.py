# app/__init__.py

from flask import Flask
from .controllers.map_controller import map_blueprint

def create_app():
    app = Flask(__name__)
    app.config.from_object('app.config.Config')
    
    # Register blueprints
    app.register_blueprint(map_blueprint)

    return app
