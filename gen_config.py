from file_mapping.utils import urandom, generaterSalt, generaterPass

password = 'modify this to your own password here'
salt = generaterSalt()
hash = generaterPass(password, salt)
print(f"SECRET_KEY = {urandom(16)}")
print(f"ADMIN_PASSWORD = '{hash}'")
print(f"LOGIN_SALT = '{salt}'")