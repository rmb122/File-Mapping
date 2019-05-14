cd /app
chown www-data .
chmod 755 .

touch app.db
chown www-data app.db
chmod 600 app.db

if [ ! -d "uploads" ];then
mkdir uploads
fi
chown www-data uploads
chmod 700 uploads

supervisord -n -c /etc/supervisor/supervisord.conf