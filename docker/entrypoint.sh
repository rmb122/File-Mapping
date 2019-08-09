#! /usr/bin/env bash

/usr/local/bin/python3 /app/docker/wait_mysql.py

if [ ! -f /app/file_mapping/config.py ];then
    /usr/local/bin/python3 /app/gen_config.py $LOGIN_PASSWORD
fi

chown www-data /app/uploads && chmod 700 /app/uploads

/usr/bin/supervisord -n -c /etc/supervisor/supervisord.conf
