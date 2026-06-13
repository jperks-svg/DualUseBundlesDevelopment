export const dnsLogs: Record<string, string> = {

'windows-dns': `6/11/2026 2:32:08 PM 0E64 PACKET 00000035E1A2B3C4 UDP Rcv 10.0.1.50 0001 Q [0001 D NOERROR] A (4)mail(7)contoso(3)com(0)
6/11/2026 2:32:09 PM 0E64 PACKET 00000035E1A2B3C5 UDP Snd 10.0.1.50 0001 R Q [8081 DR NOERROR] A (4)mail(7)contoso(3)com(0)
6/11/2026 2:33:00 PM 0E64 PACKET 00000035E1A2B3D0 UDP Rcv 10.0.22.88 0001 Q [0001 D NOERROR] TXT (52)aGVsbG8gd29ybGQgdGhpcyBpcyBhIHZlcnkgbG9uZyBzdWJkb21haW4(15)data-exfil-tunnel(7)example(3)com(0)
6/11/2026 2:33:01 PM 0E64 PACKET 00000035E1A2B3D1 UDP Rcv 10.0.22.88 0001 Q [0001 D NOERROR] TXT (48)YW5vdGhlciBlbmNvZGVkIHN0cmluZyBoZXJlIGZvciB0dW5uZWw(15)data-exfil-tunnel(7)example(3)com(0)
6/11/2026 2:33:02 PM 0E64 PACKET 00000035E1A2B3D2 UDP Rcv 10.0.22.88 0001 Q [0001 D NOERROR] TXT (50)c29tZSBtb3JlIGRhdGEgYmVpbmcgZXhmaWx0cmF0ZWQgaGVyZQ(15)data-exfil-tunnel(7)example(3)com(0)
6/11/2026 2:34:00 PM 0E64 PACKET 00000035E1A2B400 UDP Rcv 10.0.33.91 0001 Q [0001 D NXDOMAIN] A (12)xk7m2pqr9vbn(3)top(0)
6/11/2026 2:34:01 PM 0E64 PACKET 00000035E1A2B401 UDP Rcv 10.0.33.91 0001 Q [0001 D NXDOMAIN] A (12)hy4n8wqz3lcm(3)xyz(0)
6/11/2026 2:34:02 PM 0E64 PACKET 00000035E1A2B402 UDP Rcv 10.0.33.91 0001 Q [0001 D NXDOMAIN] A (12)bf6k9xrt4wpn(3)club(0)
6/11/2026 2:34:03 PM 0E64 PACKET 00000035E1A2B403 UDP Rcv 10.0.33.91 0001 Q [0001 D NXDOMAIN] A (12)jv2m5ynz8qhd(3)top(0)
6/11/2026 2:34:04 PM 0E64 PACKET 00000035E1A2B404 UDP Rcv 10.0.33.91 0001 Q [0001 D NXDOMAIN] A (12)pw7c4kfx1rng(3)xyz(0)
6/11/2026 2:35:00 PM 0E64 PACKET 00000035E1A2B500 TCP Rcv 192.168.1.200 0001 Q [0001 D NOERROR] AXFR (4)corp(7)contoso(3)com(0)
6/11/2026 2:36:00 PM 0E64 PACKET 00000035E1A2B600 UDP Rcv 10.0.55.20 0001 Q [0001 D NOERROR] ANY (6)google(3)com(0)
6/11/2026 2:36:01 PM 0E64 PACKET 00000035E1A2B601 UDP Rcv 10.0.55.20 0001 Q [0001 D NOERROR] ANY (5)yahoo(3)com(0)
6/11/2026 2:37:00 PM 0E64 PACKET 00000035E1A2B700 UDP Rcv 10.0.44.15 0001 Q [0001 D NOERROR] A (16)secure-update-dl(8)newdomain(2)io(0)
6/11/2026 2:38:00 PM 0E64 PACKET 00000035E1A2B800 UDP Snd 10.0.77.30 0001 R Q [8081 DR NOERROR] A (9)rebind-me(7)example(3)net(0) -> 93.184.216.34
6/11/2026 2:38:01 PM 0E64 PACKET 00000035E1A2B801 UDP Snd 10.0.77.30 0001 R Q [8081 DR NOERROR] A (9)rebind-me(7)example(3)net(0) -> 10.1.5.20
6/11/2026 2:39:00 PM 0E64 PACKET 00000035E1A2B900 UDP Rcv 203.0.113.99 0001 Q [0001 RD NOERROR] A (6)google(3)com(0)
6/11/2026 2:40:00 PM 0E64 PACKET 00000035E1A2BA00 UDP Rcv 10.0.1.50 0001 Q [0001 D SERVFAIL] A (3)api(8)internal(4)corp(3)com(0)`,

'infoblox-dns': `<30>Jun 11 14:32:08 infoblox-dns01.corp.local named[1234]: client 10.0.1.50#52341 (mail.contoso.com): query: mail.contoso.com IN A + (10.0.1.10)
<30>Jun 11 14:32:09 infoblox-dns01.corp.local named[1234]: client 10.0.1.50#52341 (mail.contoso.com): response: mail.contoso.com IN A NOERROR 93.184.216.34
<30>Jun 11 14:33:00 infoblox-dns01.corp.local named[1234]: client 10.0.22.88#61234 (aGVsbG8gd29ybGQ.data-tunnel.example.com): query: aGVsbG8gd29ybGQgdGhpcyBpcyBhIHZlcnkgbG9uZyBzdWJkb21haW4.data-tunnel.example.com IN TXT + (10.0.1.10)
<30>Jun 11 14:33:01 infoblox-dns01.corp.local named[1234]: client 10.0.22.88#61235 (YW5vdGhlciBlbmNvZGVk.data-tunnel.example.com): query: YW5vdGhlciBlbmNvZGVkIHN0cmluZyBoZXJlIGZvciB0dW5uZWw.data-tunnel.example.com IN TXT + (10.0.1.10)
<30>Jun 11 14:34:00 infoblox-dns02.corp.local named[1234]: client 10.0.33.91#55000 (xk7m2pqr9vbn.top): query: xk7m2pqr9vbn.top IN A + (10.0.1.11) NXDOMAIN
<30>Jun 11 14:34:01 infoblox-dns02.corp.local named[1234]: client 10.0.33.91#55001 (hy4n8wqz3lcm.xyz): query: hy4n8wqz3lcm.xyz IN A + (10.0.1.11) NXDOMAIN
<30>Jun 11 14:34:02 infoblox-dns02.corp.local named[1234]: client 10.0.33.91#55002 (bf6k9xrt4wpn.club): query: bf6k9xrt4wpn.club IN A + (10.0.1.11) NXDOMAIN
<30>Jun 11 14:35:00 infoblox-dns01.corp.local named[1234]: rpz: client 10.0.22.88#61300 (callback.badactor.net): rpz QNAME NXDOMAIN rewrite callback.badactor.net via callback.badactor.net.rpz-zone policy=NXDOMAIN trigger=callback.badactor.net indicator=C2 confidence=High
<30>Jun 11 14:36:00 infoblox-dns01.corp.local named[1234]: rpz: client 10.0.44.15#49800 (phishing-site.example.top): rpz QNAME NXDOMAIN rewrite phishing-site.example.top via phishing-site.example.top.rpz-zone policy=NXDOMAIN trigger=phishing-site.example.top indicator=Phishing confidence=High
<30>Jun 11 14:37:00 infoblox-dns02.corp.local named[1234]: client 10.0.55.20#56000 (secure-update-dl.newdomain.io): query: secure-update-dl.newdomain.io IN A + (10.0.1.11) NOERROR 23.227.38.74
<30>Jun 11 14:38:00 infoblox-dns01.corp.local named[1234]: client 10.0.77.30#57000 (rebind-test.example.net): response: rebind-test.example.net IN A NOERROR 10.1.5.20
<30>Jun 11 14:39:00 infoblox-dns01.corp.local named[1234]: client 10.0.33.91#55100 (random1.bad.top): query: random1.bad.top IN A + (10.0.1.10) NXDOMAIN
<30>Jun 11 14:39:01 infoblox-dns01.corp.local named[1234]: client 10.0.33.91#55101 (random2.bad.xyz): query: random2.bad.xyz IN A + (10.0.1.10) NXDOMAIN
<30>Jun 11 14:40:00 infoblox-dns02.corp.local named[1234]: client 192.168.1.200#53000 (corp.contoso.com): query: corp.contoso.com IN AXFR TCP (10.0.1.11) REFUSED
<30>Jun 11 14:41:00 infoblox-dns01.corp.local named[1234]: client 10.0.1.50#52500 (app.internal.corp.com): query: app.internal.corp.com IN A + (10.0.1.10) SERVFAIL
<30>Jun 11 14:41:30 infoblox-dns01.corp.local named[1234]: client 10.0.1.51#52501 (db.internal.corp.com): query: db.internal.corp.com IN A + (10.0.1.10) SERVFAIL
<30>Jun 11 14:42:00 infoblox-dns01.corp.local named[1234]: client 10.0.12.100#52600 (login.microsoftonline.com): query: login.microsoftonline.com IN A + (10.0.1.10) NOERROR 20.190.151.70 response_time_ms=2`,

'cisco-umbrella': `"2026-06-11 14:32:08","10.0.1.50","jperks@cribl.io","Allowed","1 (A)","NOERROR","mail.contoso.com","Business Services","","","Roaming Computer","InternalNetwork-10.0.0.0/8","Default_Allow","93.184.216.34","US"
"2026-06-11 14:33:00","10.0.22.88","jlee@cribl.io","Blocked","16 (TXT)","NXDOMAIN","aGVsbG8gd29ybGQgdGhpcyBpcyBhIHZlcnkgbG9uZyBzdWJkb21haW4.data-tunnel.example.com","Command and Control","Command and Control","Command and Control","Roaming Computer","InternalNetwork-10.0.0.0/8","Security_Block","","US"
"2026-06-11 14:34:00","10.0.33.91","kpatel@cribl.io","Blocked","1 (A)","NXDOMAIN","xk7m2pqr9vbn.top","Malware","Malware","Malware","Roaming Computer","InternalNetwork-10.0.0.0/8","Security_Block","","RU"
"2026-06-11 14:34:01","10.0.33.91","kpatel@cribl.io","Blocked","1 (A)","NXDOMAIN","hy4n8wqz3lcm.xyz","Malware","Malware","Malware","Roaming Computer","InternalNetwork-10.0.0.0/8","Security_Block","","RU"
"2026-06-11 14:35:00","10.0.44.15","rgarcia@cribl.io","Blocked","1 (A)","NOERROR","secure-login-verify.top","Phishing","Phishing","Phishing","Roaming Computer","InternalNetwork-10.0.0.0/8","Security_Block","23.227.38.74","US"
"2026-06-11 14:36:00","10.0.55.20","dchen@cribl.io","Blocked","1 (A)","NOERROR","mining-pool.hashrate.xyz","Cryptomining","Cryptomining","Cryptomining","Roaming Computer","InternalNetwork-10.0.0.0/8","Security_Block","45.33.32.100","NL"
"2026-06-11 14:37:00","10.0.1.50","jperks@cribl.io","Allowed","1 (A)","NOERROR","slack.com","Business Services","","","Roaming Computer","InternalNetwork-10.0.0.0/8","Default_Allow","52.84.123.45","US"
"2026-06-11 14:38:00","10.0.60.5","bwilson@cribl.io","Allowed","1 (A)","NOERROR","notion.so","Collaboration","","","Roaming Computer","InternalNetwork-10.0.0.0/8","Default_Allow","104.18.12.33","US"
"2026-06-11 14:39:00","10.0.77.30","njohnson@cribl.io","Allowed","1 (A)","NOERROR","youtube.com","Streaming Media","","","Roaming Computer","InternalNetwork-10.0.0.0/8","Default_Allow","142.250.80.46","US"
"2026-06-11 14:40:00","10.0.88.44","lnguyen@cribl.io","Allowed","1 (A)","NOERROR","api.openai.com","AI Services","","","Roaming Computer","InternalNetwork-10.0.0.0/8","Default_Allow","104.18.7.192","US"
"2026-06-11 14:41:00","10.0.12.100","swright@cribl.io","Proxied","1 (A)","NOERROR","new-saas-tool.io","Newly Seen Domains","","","Roaming Computer","InternalNetwork-10.0.0.0/8","Inspect_NewDomains","198.51.44.88","US"
"2026-06-11 14:42:00","10.0.22.88","jlee@cribl.io","Blocked","1 (A)","NXDOMAIN","callback.badactor.net","Command and Control","Command and Control","Command and Control","Roaming Computer","InternalNetwork-10.0.0.0/8","Security_Block","","RU"
"2026-06-11 14:43:00","10.0.1.50","jperks@cribl.io","Allowed","1 (A)","NOERROR","login.microsoftonline.com","Business Services","","","Roaming Computer","InternalNetwork-10.0.0.0/8","Default_Allow","20.190.151.70","US"
"2026-06-11 14:44:00","10.0.44.15","rgarcia@cribl.io","Allowed","1 (A)","NOERROR","myhost.duckdns.org","Dynamic DNS","","","Roaming Computer","InternalNetwork-10.0.0.0/8","Default_Allow","192.0.2.50","DE"
"2026-06-11 14:45:00","10.0.60.5","bwilson@cribl.io","Allowed","1 (A)","NOERROR","github.com","Technology","","","Roaming Computer","InternalNetwork-10.0.0.0/8","Default_Allow","140.82.121.3","US"`
};
