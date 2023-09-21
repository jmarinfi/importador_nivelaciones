from flask import Blueprint

imp_niv = Blueprint('importador', __name__)

from . import importador
