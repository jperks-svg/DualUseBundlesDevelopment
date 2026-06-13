export const networkInfraLogs: Record<string, string> = {

'cisco-meraki': `1718107928.123456789 Q2HP-ABCD-1234 security_event ids_alerted signature=1:2024792:3 priority=1 timestamp=1718107928.123 dhost=AA:BB:CC:DD:EE:FF direction=ingress protocol=tcp/22 src=185.220.101.33:44100 dst=10.0.1.50:22 message="ET SCAN SSH Brute Force Attempt"
1718107929.234567890 Q2HP-ABCD-1234 security_event ids_alerted signature=1:2024792:3 priority=1 timestamp=1718107929.234 dhost=AA:BB:CC:DD:EE:FF direction=ingress protocol=tcp/22 src=185.220.101.33:44101 dst=10.0.1.50:22 message="ET SCAN SSH Brute Force Attempt"
1718107930.345678901 Q2HP-ABCD-1234 security_event ids_alerted signature=1:2024792:3 priority=1 timestamp=1718107930.345 dhost=AA:BB:CC:DD:EE:FF direction=ingress protocol=tcp/22 src=185.220.101.33:44102 dst=10.0.1.50:22 message="ET SCAN SSH Brute Force Attempt"
1718107980.456789012 Q2HP-ABCD-1234 urls src=10.0.33.91:52000 dst=104.16.0.1:443 mac=BB:CC:DD:EE:FF:00 request: GET https://www.reddit.com/r/sysadmin
1718107981.567890123 Q2HP-ABCD-1234 urls src=10.0.22.88:52100 dst=203.0.113.200:80 mac=CC:DD:EE:FF:00:11 request: GET http://account-verify.example.net/login
1718108000.678901234 Q2HP-ABCD-1234 security_event security_filtering_file_scanned url=https://downloads.example.com/update.exe src=10.0.1.50:52500 dst=203.0.113.200:80 mac=AA:BB:CC:DD:EE:FF name="update.exe" sha256=c3d4e5f6a7b8c9d0 disposition=malicious action=block
1718108060.789012345 Q2HP-ABCD-1234 events type=association radio=1 vap=1 channel=36 rssi=45 aid="CC:DD:EE:FF:00:11" identity="jlee@cribl.io"
1718108120.890123456 Q2HP-ABCD-1234 events type=disassociation radio=1 vap=1 channel=36 rssi=0 aid="DD:EE:FF:00:11:22" identity="guest-device-01" reason=8 instigator=idle_timeout
1718108180.901234567 Q2HP-ABCD-1234 air_marshal_event type=rogue_ap_detected bssid=EE:FF:00:11:22:33 ssid="CorpWiFi-FREE" channel=6 rssi=-55 wired_mac="" first_seen=1718107000 last_seen=1718108180
1718108240.012345678 Q2HP-ABCD-1234 flows src=10.0.1.50 dst=10.0.2.10 mac=AA:BB:CC:DD:EE:FF protocol=tcp sport=52341 dport=8080 pattern=allow`
};
