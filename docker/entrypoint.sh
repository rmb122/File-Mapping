if [ ! -d "/app/uploads" ];then
mysql_install_db
git clone https://github.com/rmb122/File-Mapping.git /app
read -p "Input your login password: " password
read -p "$(echo 'Input your url_prefix (example: /test) \nleave it empty if you dont want to use: ')" url_prefix
python3 /app/gen_config.py $password $url_prefix
fi

chown www-data /app/uploads
chmod 700 /app/uploads

service mysql start
service nginx start
cat /init.sql | mysql

supervisord -n -c /etc/supervisor/supervisord.conf