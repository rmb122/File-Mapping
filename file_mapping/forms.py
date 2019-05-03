from flask_wtf import FlaskForm
from wtforms import PasswordField, SubmitField, HiddenField
from wtforms.validators import DataRequired


class LoginForm(FlaskForm):
    password = PasswordField('password', validators=[DataRequired()])
    submit = SubmitField('Submit')
