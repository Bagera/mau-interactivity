# https://stackoverflow.com/questions/10175812/how-to-create-a-self-signed-certificate-with-openssl/10176685#10176685
read -p 'IP: ' ipAddress
openssl req -x509 -newkey rsa:4096 -sha256 -days 3650 -nodes \
  -keyout key.pem -out crt.pem -extensions san -config \
  <(echo "[req]"; 
    echo distinguished_name=req; 
    echo "[san]"; 
    echo subjectAltName=IP:192.168.86.32
    ) \
  -subj /CN=example.comç