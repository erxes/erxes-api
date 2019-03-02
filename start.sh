sed -i 's/$type/'"$type"'/' google_cred.json
sed -i 's/$project_id/'"$project_id"'/' google_cred.json
sed -i 's/$private_key_id/'"$private_key_id"'/' google_cred.json
sed -i 's/$client_email/'"$client_email"'/' google_cred.json
sed -i 's/$client_id/'"$client_id"'/' google_cred.json
sed -i 's@$auth_uri@'"$auth_uri"'@' google_cred.json
sed -i 's@$auth_uri@'"$auth_uri"'@' google_cred.json
sed -i 's@$token_uri@'"$token_uri"'@' google_cred.json
sed -i 's@$auth_provider_x509_cert_url@'"$auth_provider_x509_cert_url"'@' google_cred.json
sed -i 's@$client_x509_cert_url@'"$client_x509_cert_url"'@' google_cred.json
sed -i 's@$private_key@'"$private_key"'@' google_cred.json

yarn start
