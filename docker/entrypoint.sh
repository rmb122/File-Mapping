mysql_install_db
service mysql start
service nginx start

cat /init.sql | mysql

if [ ! -d "uploads" ];then
mkdir uploads
fi
chown www-data uploads
chmod 700 uploads

supervisord -n -c /etc/supervisor/supervisord.conf