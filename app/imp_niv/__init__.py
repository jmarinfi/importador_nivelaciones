from flask import Blueprint


imp_niv_bp = Blueprint('imp_niv', __name__)

from . import imp_niv_routes
