from flask_login import login_required, login_user
from flask_login.login_manager import LoginManager
from flask_sqlalchemy import SQLAlchemy
from flask_wtf import CSRFProtect

from file_mapping.asserts.ip2region import Ip2Region
from file_mapping.config import URL_PREFIX
from file_mapping.utils import NoServerHeaderFlask

app = NoServerHeaderFlask(__name__, static_folder=None)
app.config.from_pyfile('config.py')
app.config['SESSION_COOKIE_PATH'] = f'{URL_PREFIX}/admin/'

csrf = CSRFProtect()
csrf.init_app(app)
db = SQLAlchemy(app)
loginManager = LoginManager()
loginManager.init_app(app)
ip2Region = Ip2Region(f'{app.root_path}/asserts/ip2region.db')

from file_mapping.models import Log, Rule
db.create_all()
from file_mapping import admin_views, index_views