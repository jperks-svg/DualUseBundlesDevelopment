export const loadbalancerLogs: Record<string, string> = {

'f5-bigip-ltm': `Jun 11 14:32:08 bigip-01.corp.local info tmm[1234]: Rule /Common/iRule_log <HTTP_REQUEST>: client=203.0.113.42 vip=10.0.1.100:443 pool=/Common/web-pool member=10.0.2.10:8080 method=GET uri=/api/users host=app.example.com response_time=45ms status=200 bytes=1234
Jun 11 14:32:09 bigip-01.corp.local info tmm[1234]: Rule /Common/iRule_log <HTTP_REQUEST>: client=203.0.113.42 vip=10.0.1.100:443 pool=/Common/web-pool member=10.0.2.11:8080 method=GET uri=/api/reports host=app.example.com response_time=2500ms status=200 bytes=89000
Jun 11 14:33:00 bigip-01.corp.local info tmm[1234]: Rule /Common/iRule_log <HTTP_REQUEST>: client=185.220.101.33 vip=10.0.1.100:443 pool=/Common/web-pool member=10.0.2.10:8080 method=POST uri=/login host=app.example.com response_time=15ms status=401 bytes=89
Jun 11 14:33:01 bigip-01.corp.local info tmm[1234]: Rule /Common/iRule_log <HTTP_REQUEST>: client=185.220.101.33 vip=10.0.1.100:443 pool=/Common/web-pool member=10.0.2.11:8080 method=POST uri=/login host=app.example.com response_time=12ms status=401 bytes=89
Jun 11 14:33:02 bigip-01.corp.local info tmm[1234]: Rule /Common/iRule_log <HTTP_REQUEST>: client=185.220.101.33 vip=10.0.1.100:443 pool=/Common/web-pool member=10.0.2.10:8080 method=POST uri=/login host=app.example.com response_time=14ms status=401 bytes=89
Jun 11 14:34:00 bigip-01.corp.local warning tmm[1234]: 01260013:4: SSL Handshake failed for TCP 45.77.123.99:44100 -> 10.0.1.100:443 protocol=TLSv1.0 cipher=RC4-SHA reason="unsupported protocol version"
Jun 11 14:35:00 bigip-01.corp.local notice tmm[1234]: 01010028:5: No members available in pool /Common/api-pool for virtual /Common/vs_api_443
Jun 11 14:35:01 bigip-01.corp.local err tmm[1234]: 01010201:3: Connection error: pool /Common/api-pool member 10.0.2.20:8080 monitor status down, reason: /Common/http_head_monitor: failure - no response
Jun 11 14:35:02 bigip-01.corp.local err tmm[1234]: 01010201:3: Connection error: pool /Common/api-pool member 10.0.2.21:8080 monitor status down, reason: /Common/http_head_monitor: failure - no response
Jun 11 14:36:00 bigip-01.corp.local info tmm[1234]: Rule /Common/iRule_log <HTTP_REQUEST>: client=10.0.33.91 vip=10.0.1.100:443 pool=/Common/web-pool member=10.0.2.10:8080 method=GET uri=/api/dashboard host=app.example.com response_time=8500ms status=504 bytes=0
Jun 11 14:37:00 bigip-01.corp.local notice mcpd[5678]: 01070727:5: Pool /Common/web-pool member /Common/web-pool 10.0.2.12:8080 session status forced disabled
Jun 11 14:38:00 bigip-01.corp.local warning tmm[1234]: 01260009:4: Connection from 192.0.2.100:55000 to 10.0.1.100:443: invalid client hello detected, dropping connection
Jun 11 14:39:00 bigip-01.corp.local info tmm[1234]: Rule /Common/rate_limit <HTTP_REQUEST>: Rate limit exceeded for client 45.77.123.99 - requests=500 threshold=100 period=60s action=reject
Jun 11 14:40:00 bigip-01.corp.local info tmm[1234]: Rule /Common/iRule_log <HTTP_REQUEST>: client=203.0.113.50 vip=10.0.1.100:443 pool=/Common/web-pool member=10.0.2.10:8080 method=GET uri=/static/bundle.js host=app.example.com response_time=5ms status=200 bytes=2500000
Jun 11 14:41:00 bigip-01.corp.local notice tmm[1234]: 01010028:5: Pool member /Common/web-pool 10.0.2.10:8080 CPU utilization=92% memory=88% connections=4500`
};
