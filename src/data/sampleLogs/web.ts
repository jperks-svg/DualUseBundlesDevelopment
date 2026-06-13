export const webLogs: Record<string, string> = {

'nginx-access': `203.0.113.42 - jperks [11/Jun/2026:14:32:08 +0000] "GET /api/users HTTP/1.1" 200 1234 "https://app.example.com/dashboard" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" 0.045 0.043 HIT TLSv1.3 TLS_AES_256_GCM_SHA384
203.0.113.42 - jperks [11/Jun/2026:14:32:09 +0000] "GET /api/reports/annual HTTP/1.1" 200 89000 "https://app.example.com/reports" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" 2.350 2.340 MISS TLSv1.3 TLS_AES_256_GCM_SHA384
203.0.113.42 - jperks [11/Jun/2026:14:32:10 +0000] "GET /api/reports/quarterly HTTP/1.1" 200 45000 "https://app.example.com/reports" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" 3.100 3.090 MISS TLSv1.3 TLS_AES_256_GCM_SHA384
185.220.101.33 - - [11/Jun/2026:14:33:00 +0000] "POST /login HTTP/1.1" 401 89 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" 0.012 0.010 - TLSv1.3 TLS_AES_256_GCM_SHA384
185.220.101.33 - - [11/Jun/2026:14:33:01 +0000] "POST /login HTTP/1.1" 401 89 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" 0.011 0.009 - TLSv1.3 TLS_AES_256_GCM_SHA384
185.220.101.33 - - [11/Jun/2026:14:33:02 +0000] "POST /login HTTP/1.1" 401 89 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" 0.013 0.011 - TLSv1.3 TLS_AES_256_GCM_SHA384
185.220.101.33 - - [11/Jun/2026:14:33:03 +0000] "POST /login HTTP/1.1" 401 89 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" 0.010 0.009 - TLSv1.3 TLS_AES_256_GCM_SHA384
45.77.123.99 - - [11/Jun/2026:14:34:00 +0000] "GET /admin/../../../etc/passwd HTTP/1.1" 403 162 "-" "Mozilla/5.0" 0.001 - - TLSv1.3 TLS_AES_256_GCM_SHA384
45.77.123.99 - - [11/Jun/2026:14:34:01 +0000] "GET /api/users?id=1 UNION SELECT * FROM users-- HTTP/1.1" 400 150 "-" "sqlmap/1.7" 0.002 - - TLSv1.3 TLS_AES_256_GCM_SHA384
45.77.123.99 - - [11/Jun/2026:14:34:02 +0000] "GET /.env HTTP/1.1" 404 162 "-" "Nuclei/3.0" 0.001 - - TLSv1.3 TLS_AES_256_GCM_SHA384
45.77.123.99 - - [11/Jun/2026:14:34:03 +0000] "GET /wp-admin/ HTTP/1.1" 404 162 "-" "Nuclei/3.0" 0.001 - - TLSv1.3 TLS_AES_256_GCM_SHA384
45.77.123.99 - - [11/Jun/2026:14:34:04 +0000] "GET /backup.sql HTTP/1.1" 404 162 "-" "Nuclei/3.0" 0.001 - - TLSv1.3 TLS_AES_256_GCM_SHA384
192.0.2.100 - - [11/Jun/2026:14:35:00 +0000] "TRACE / HTTP/1.1" 405 0 "-" "curl/8.0" 0.001 - - TLSv1.3 TLS_AES_256_GCM_SHA384
192.0.2.100 - - [11/Jun/2026:14:35:01 +0000] "DELETE /api/users/1 HTTP/1.1" 403 89 "-" "curl/8.0" 0.001 - - TLSv1.3 TLS_AES_256_GCM_SHA384
10.0.1.50 - admin [11/Jun/2026:14:36:00 +0000] "GET /api/health HTTP/1.1" 502 0 "-" "HealthCheck/1.0" 30.001 30.000 - TLSv1.3 TLS_AES_256_GCM_SHA384
10.0.1.51 - admin [11/Jun/2026:14:36:01 +0000] "GET /api/health HTTP/1.1" 503 0 "-" "HealthCheck/1.0" 0.001 - - TLSv1.3 TLS_AES_256_GCM_SHA384
198.51.100.77 - - [11/Jun/2026:14:37:00 +0000] "GET /static/app.js HTTP/1.1" 200 450000 "https://app.example.com/" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" 0.002 - HIT TLSv1.0 RC4-SHA
10.0.1.50 - jperks [11/Jun/2026:14:38:00 +0000] "GET /api/dashboard HTTP/1.1" 200 12000 "https://app.example.com/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" 0.055 0.053 BYPASS TLSv1.3 TLS_AES_256_GCM_SHA384`,

'apache-access': `203.0.113.42 - jperks [11/Jun/2026:14:32:08 -0400] "GET /index.html HTTP/1.1" 200 2326 "http://www.example.com/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
203.0.113.42 - jperks [11/Jun/2026:14:32:09 -0400] "GET /api/data HTTP/1.1" 200 89000 "http://www.example.com/dashboard" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
185.220.101.33 - - [11/Jun/2026:14:33:00 -0400] "POST /wp-login.php HTTP/1.1" 401 4500 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
185.220.101.33 - - [11/Jun/2026:14:33:01 -0400] "POST /wp-login.php HTTP/1.1" 401 4500 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
185.220.101.33 - - [11/Jun/2026:14:33:02 -0400] "POST /wp-login.php HTTP/1.1" 401 4500 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
45.77.123.99 - - [11/Jun/2026:14:34:00 -0400] "GET /cgi-bin/../../etc/passwd HTTP/1.1" 403 199 "-" "Nikto/2.5"
45.77.123.99 - - [11/Jun/2026:14:34:01 -0400] "GET /api/search?q=test'+OR+1=1-- HTTP/1.1" 400 300 "-" "sqlmap/1.7"
45.77.123.99 - - [11/Jun/2026:14:34:02 -0400] "GET /phpmyadmin/ HTTP/1.1" 404 196 "-" "DirBuster/1.0"
45.77.123.99 - - [11/Jun/2026:14:34:03 -0400] "GET /.git/config HTTP/1.1" 404 196 "-" "DirBuster/1.0"
10.0.1.50 - admin [11/Jun/2026:14:35:00 -0400] "GET /server-status HTTP/1.1" 200 15000 "-" "HealthCheck/1.0"
10.0.1.50 - - [11/Jun/2026:14:36:00 -0400] "GET /api/reports HTTP/1.1" 500 0 "http://www.example.com/reports" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
10.0.1.50 - - [11/Jun/2026:14:36:01 -0400] "GET /api/reports HTTP/1.1" 500 0 "http://www.example.com/reports" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
10.0.1.50 - - [11/Jun/2026:14:36:02 -0400] "GET /api/reports HTTP/1.1" 503 0 "http://www.example.com/reports" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
192.0.2.100 - - [11/Jun/2026:14:37:00 -0400] "PUT /uploads/shell.php HTTP/1.1" 403 199 "-" "curl/8.0"
203.0.113.50 - frank [11/Jun/2026:14:38:00 -0400] "GET /static/bundle.js HTTP/1.1" 200 2500000 "http://www.example.com/" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15"`,

'iis-access': `2026-06-11 14:32:08 10.0.1.10 GET /api/data - 443 jperks@corp.local 203.0.113.42 Mozilla/5.0+(Windows+NT+10.0;+Win64;+x64)+Edge/125.0 https://app.corp.local/dashboard 200 0 0 145
2026-06-11 14:32:09 10.0.1.10 GET /api/reports/q2 - 443 jperks@corp.local 203.0.113.42 Mozilla/5.0+(Windows+NT+10.0;+Win64;+x64)+Edge/125.0 https://app.corp.local/reports 200 0 0 2500
2026-06-11 14:33:00 10.0.1.10 POST /login - 443 - 185.220.101.33 Mozilla/5.0+(Windows+NT+10.0;+Win64;+x64) - 401 1 0 15
2026-06-11 14:33:01 10.0.1.10 POST /login - 443 - 185.220.101.33 Mozilla/5.0+(Windows+NT+10.0;+Win64;+x64) - 401 2 0 12
2026-06-11 14:33:02 10.0.1.10 POST /login - 443 - 185.220.101.33 Mozilla/5.0+(Windows+NT+10.0;+Win64;+x64) - 401 1 0 14
2026-06-11 14:34:00 10.0.1.10 GET /api/users id=1'+UNION+SELECT+*-- 443 - 45.77.123.99 sqlmap/1.7 - 400 0 0 5
2026-06-11 14:34:01 10.0.1.10 GET /admin/../../web.config - 443 - 45.77.123.99 Nuclei/3.0 - 403 0 0 3
2026-06-11 14:35:00 10.0.1.10 GET /api/health - 443 svc_monitor 10.0.1.50 HealthCheck/1.0 - 503 0 0 30015
2026-06-11 14:35:01 10.0.1.10 GET /api/health - 443 svc_monitor 10.0.1.50 HealthCheck/1.0 - 503 0 0 30012
2026-06-11 14:36:00 10.0.1.10 GET /api/dashboard - 443 kpatel@corp.local 10.0.33.91 Mozilla/5.0+(Windows+NT+10.0;+Win64;+x64)+Chrome/125.0 https://app.corp.local/ 200 0 0 8500
2026-06-11 14:36:01 10.0.1.10 GET /api/widgets - 443 kpatel@corp.local 10.0.33.91 Mozilla/5.0+(Windows+NT+10.0;+Win64;+x64)+Chrome/125.0 https://app.corp.local/dashboard 200 0 0 12000
2026-06-11 14:37:00 10.0.1.10 GET /static/app.bundle.js - 443 - 203.0.113.50 Mozilla/5.0+(Macintosh;+Intel+Mac+OS+X+10_15_7) https://app.corp.local/ 200 0 0 55
2026-06-11 14:38:00 10.0.1.10 POST /api/upload - 443 rgarcia@corp.local 10.0.44.15 Mozilla/5.0+(Macintosh) https://app.corp.local/files 200 0 0 950
2026-06-11 14:39:00 10.0.1.10 GET /api/search query=<script>alert(1)</script> 443 - 192.0.2.100 Mozilla/5.0 - 400 0 0 4
2026-06-11 14:40:00 10.0.1.10 GET /favicon.ico - 443 - 203.0.113.42 Mozilla/5.0+(Windows+NT+10.0;+Win64;+x64)+Edge/125.0 https://app.corp.local/ 304 0 0 2`,

'akamai-waf': `{"timestamp":"2026-06-11T14:32:08Z","client_ip":"203.0.113.42","host":"app.example.com","path":"/api/users","method":"GET","status":200,"bytes":1234,"country":"US","region":"us-east-1","rule_id":"","rule_tag":"","rule_action":"","rule_message":"","bot_score":5,"bot_category":"legitimate","risk_score":0,"user_agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36","http_version":"HTTP/2","geo_country":"US","response_time_ms":45,"waf_profile":"production"}
{"timestamp":"2026-06-11T14:33:00Z","client_ip":"45.77.123.99","host":"app.example.com","path":"/api/users?id=1 UNION SELECT * FROM credentials--","method":"GET","status":403,"bytes":0,"country":"NL","region":"eu-west-1","rule_id":"950001","rule_tag":"OWASP_CRS/WEB_ATTACK/SQL_INJECTION","rule_action":"deny","rule_message":"SQL Injection Attack Detected","bot_score":90,"bot_category":"malicious","risk_score":95,"user_agent":"sqlmap/1.7","http_version":"HTTP/1.1","geo_country":"NL","response_time_ms":2,"waf_profile":"production"}
{"timestamp":"2026-06-11T14:33:01Z","client_ip":"45.77.123.99","host":"app.example.com","path":"/search?q=<script>alert(document.cookie)</script>","method":"GET","status":403,"bytes":0,"country":"NL","region":"eu-west-1","rule_id":"941100","rule_tag":"OWASP_CRS/WEB_ATTACK/XSS","rule_action":"deny","rule_message":"XSS Attack Detected","bot_score":90,"bot_category":"malicious","risk_score":92,"user_agent":"sqlmap/1.7","http_version":"HTTP/1.1","geo_country":"NL","response_time_ms":1,"waf_profile":"production"}
{"timestamp":"2026-06-11T14:34:00Z","client_ip":"185.220.101.33","host":"app.example.com","path":"/admin/../../etc/passwd","method":"GET","status":403,"bytes":0,"country":"DE","region":"eu-central-1","rule_id":"930100","rule_tag":"OWASP_CRS/WEB_ATTACK/LFI","rule_action":"deny","rule_message":"Local File Inclusion Detected","bot_score":85,"bot_category":"malicious","risk_score":88,"user_agent":"Nuclei/3.0","http_version":"HTTP/1.1","geo_country":"DE","response_time_ms":1,"waf_profile":"production"}
{"timestamp":"2026-06-11T14:34:01Z","client_ip":"185.220.101.33","host":"app.example.com","path":"/cgi-bin/test.cgi","method":"GET","status":403,"bytes":0,"country":"DE","region":"eu-central-1","rule_id":"932100","rule_tag":"OWASP_CRS/WEB_ATTACK/RCE","rule_action":"deny","rule_message":"Remote Code Execution Attempt","bot_score":85,"bot_category":"malicious","risk_score":90,"user_agent":"Nuclei/3.0","http_version":"HTTP/1.1","geo_country":"DE","response_time_ms":1,"waf_profile":"production"}
{"timestamp":"2026-06-11T14:35:00Z","client_ip":"192.0.2.50","host":"app.example.com","path":"/","method":"GET","status":200,"bytes":45000,"country":"CN","region":"ap-east-1","rule_id":"913100","rule_tag":"OWASP_CRS/SCANNER_DETECTION","rule_action":"alert","rule_message":"Scanner User-Agent Detected","bot_score":75,"bot_category":"scanner","risk_score":60,"user_agent":"Zgrab/0.x","http_version":"HTTP/1.1","geo_country":"CN","response_time_ms":35,"waf_profile":"production"}
{"timestamp":"2026-06-11T14:36:00Z","client_ip":"198.51.100.200","host":"app.example.com","path":"/api/data","method":"GET","status":200,"bytes":89000,"country":"US","region":"us-west-2","rule_id":"","rule_tag":"","rule_action":"","rule_message":"","bot_score":45,"bot_category":"search_engine","risk_score":0,"user_agent":"Googlebot/2.1","http_version":"HTTP/2","geo_country":"US","response_time_ms":120,"waf_profile":"production"}
{"timestamp":"2026-06-11T14:37:00Z","client_ip":"10.0.1.50","host":"app.example.com","path":"/api/health","method":"GET","status":500,"bytes":0,"country":"US","region":"us-east-1","rule_id":"","rule_tag":"","rule_action":"","rule_message":"","bot_score":0,"bot_category":"legitimate","risk_score":0,"user_agent":"HealthCheck/1.0","http_version":"HTTP/1.1","geo_country":"US","response_time_ms":5200,"waf_profile":"production"}
{"timestamp":"2026-06-11T14:37:01Z","client_ip":"10.0.1.51","host":"app.example.com","path":"/api/health","method":"GET","status":502,"bytes":0,"country":"US","region":"us-east-1","rule_id":"","rule_tag":"","rule_action":"","rule_message":"","bot_score":0,"bot_category":"legitimate","risk_score":0,"user_agent":"HealthCheck/1.0","http_version":"HTTP/1.1","geo_country":"US","response_time_ms":30000,"waf_profile":"production"}
{"timestamp":"2026-06-11T14:38:00Z","client_ip":"203.0.113.42","host":"app.example.com","path":"/static/bundle.js","method":"GET","status":200,"bytes":2500000,"country":"US","region":"us-east-1","rule_id":"","rule_tag":"","rule_action":"","rule_message":"","bot_score":5,"bot_category":"legitimate","risk_score":0,"user_agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36","http_version":"HTTP/2","geo_country":"US","response_time_ms":8,"waf_profile":"production"}
{"timestamp":"2026-06-11T14:39:00Z","client_ip":"192.0.2.100","host":"app.example.com","path":"/login","method":"POST","status":403,"bytes":0,"country":"RU","region":"eu-east-1","rule_id":"920350","rule_tag":"OWASP_CRS/IP_REPUTATION","rule_action":"custom_deny","rule_message":"IP Reputation Block","bot_score":95,"bot_category":"malicious","risk_score":98,"user_agent":"Mozilla/5.0","http_version":"HTTP/1.1","geo_country":"RU","response_time_ms":1,"waf_profile":"production"}
{"timestamp":"2026-06-11T14:40:00Z","client_ip":"203.0.113.50","host":"app.example.com","path":"/api/upload","method":"POST","status":200,"bytes":500,"country":"US","region":"us-east-1","rule_id":"","rule_tag":"","rule_action":"","rule_message":"","bot_score":5,"bot_category":"legitimate","risk_score":0,"user_agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)","http_version":"HTTP/2","geo_country":"US","response_time_ms":250,"waf_profile":"production"}
{"timestamp":"2026-06-11T14:41:00Z","client_ip":"103.25.200.44","host":"app.example.com","path":"/api/users","method":"GET","status":200,"bytes":5000,"country":"SG","region":"ap-southeast-1","rule_id":"","rule_tag":"","rule_action":"","rule_message":"","bot_score":10,"bot_category":"legitimate","risk_score":0,"user_agent":"Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36","http_version":"HTTP/2","geo_country":"SG","response_time_ms":180,"waf_profile":"production"}
{"timestamp":"2026-06-11T14:42:00Z","client_ip":"203.0.113.42","host":"app.example.com","path":"/api/settings","method":"GET","status":200,"bytes":2000,"country":"US","region":"us-east-1","rule_id":"","rule_tag":"","rule_action":"","rule_message":"","bot_score":5,"bot_category":"legitimate","risk_score":0,"user_agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36","http_version":"HTTP/2","geo_country":"US","response_time_ms":52,"waf_profile":"production"}`,

'aws-vpc-flow': `2 123456789012 eni-0a1b2c3d4e5f6a7b8 10.0.1.50 203.0.113.100 52341 443 6 25 15000 1718107928 1718107988 ACCEPT OK
2 123456789012 eni-0a1b2c3d4e5f6a7b8 203.0.113.100 10.0.1.50 443 52341 6 20 89000 1718107928 1718107988 ACCEPT OK
2 123456789012 eni-0a1b2c3d4e5f6a7b8 185.220.101.33 10.0.1.50 44100 3389 6 1 40 1718107990 1718107991 REJECT OK
2 123456789012 eni-0a1b2c3d4e5f6a7b8 185.220.101.33 10.0.1.50 44101 22 6 1 40 1718107991 1718107992 REJECT OK
2 123456789012 eni-0a1b2c3d4e5f6a7b8 185.220.101.33 10.0.1.50 44102 445 6 1 40 1718107992 1718107993 REJECT OK
2 123456789012 eni-0a1b2c3d4e5f6a7b8 185.220.101.33 10.0.1.50 44103 1433 6 1 40 1718107993 1718107994 REJECT OK
2 123456789012 eni-0a1b2c3d4e5f6a7b8 185.220.101.33 10.0.1.50 44104 5432 6 1 40 1718107994 1718107995 REJECT OK
2 123456789012 eni-0a1b2c3d4e5f6a7b8 185.220.101.33 10.0.1.50 44105 27017 6 1 40 1718107995 1718107996 REJECT OK
2 123456789012 eni-0b2c3d4e5f6a7b8c9 10.0.2.100 10.0.3.50 49800 22 6 15 4500 1718108000 1718108060 ACCEPT OK
2 123456789012 eni-0b2c3d4e5f6a7b8c9 10.0.2.100 10.0.3.51 49801 3389 6 120 450000 1718108000 1718108060 ACCEPT OK
2 123456789012 eni-0b2c3d4e5f6a7b8c9 10.0.2.100 10.0.3.52 49802 445 6 85 125000 1718108000 1718108060 ACCEPT OK
2 123456789012 eni-0c3d4e5f6a7b8c9d0 10.0.1.50 45.33.32.100 61000 443 6 850000 1200000000 1718108100 1718111700 ACCEPT OK
2 123456789012 eni-0c3d4e5f6a7b8c9d0 10.0.22.88 91.234.99.10 49900 4444 6 500 25000 1718108200 1718108260 ACCEPT OK
2 123456789012 eni-0d4e5f6a7b8c9d0e1 203.0.113.99 10.0.1.50 55000 22 6 3 120 1718108300 1718108301 ACCEPT OK
2 123456789012 eni-0d4e5f6a7b8c9d0e1 203.0.113.99 10.0.1.51 55001 3389 6 5 200 1718108301 1718108302 ACCEPT OK
2 123456789012 eni-0e5f6a7b8c9d0e1f2 10.0.4.100 10.0.5.200 49900 8080 6 1500 5000000 1718108400 1718108460 ACCEPT OK
2 123456789012 eni-0f6a7b8c9d0e1f2g3 - - - - - - - - - - NODATA
2 123456789012 eni-0f6a7b8c9d0e1f2g3 - - - - - - - - - - SKIPDATA
2 123456789012 eni-0a1b2c3d4e5f6a7b8 10.0.1.50 10.0.1.51 52500 443 6 1 40 1718108500 1718108501 ACCEPT OK
2 123456789012 eni-0a1b2c3d4e5f6a7b8 192.0.2.200 10.0.1.50 55500 443 6 500000 750000000 1718108600 1718112200 ACCEPT OK`
};
