if [ ! -f "/app/config.py" ];then
mysql_install_db
git clone https://github.com/rmb122/File-Mapping.git /app
read -p "Input your login password: " password
read -p "$(echo -e 'Input your url_prefix (example: /test) \nleave it empty if you dont want to use: ')" url_prefix
python3 /app/gen_config.py $password $url_prefix
fi

chown www-data uploads
chmod 700 uploads

service mysql start
service nginx start
cat /init.sql | mysql

supervisord -c /etc/supervisor/supervisord.conf