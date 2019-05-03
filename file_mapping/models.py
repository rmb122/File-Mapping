from flask_login import UserMixin
from file_mapping import loginManager
from flask import redirect, url_for, flash
from file_mapping import db


class User(UserMixin):
    def __init__(self, id):
        self.id = id


class Rule(db.Model):
    __tablename__ = 'rules'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    route = db.Column(db.String(255), index=True)
    filename = db.Column(db.Text())
    record = db.Column(db.Boolean())
    memo = db.Column(db.Text())


class Log(db.Model):
    __tablename__ = 'logs'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    route = db.Column(db.String(255), index=True)
    ip = db.Column(db.VARCHAR(15))
    method = db.Column(db.VARCHAR(6))
    get = db.Column(db.Text())
    post = db.Column(db.Text())
    header = db.Column(db.Text())
    time = db.Column(db.DateTime, server_default=db.text('CURRENT_TIMESTAMP'))


@loginManager.user_loader
def loadUser(id):
    return User(id)


@loginManager.unauthorized_handler
def redirectLogin():
    flash('Please login first')
    return redirect(url_for('login'))
