import socket
import os
import time
import re

def wait_for_mysql(host):
    success = False
    while not success:
        print('[*] Waiting mysql start...')
        time.sleep(1)
        try:
            sck = socket.socket()
            sck.settimeout(1)
            sck.connect((host, 3306))
            sck.close()
            success = True
        except Exception:
            pass

dsn = os.getenv('SQLALCHEMY_DATABASE_URI')
if dsn[:5] == 'mysql':
    host = re.findall(r'.*?://.*?:.*?@(.*?):.*?/', dsn)[0]
    wait_for_mysql(host)
