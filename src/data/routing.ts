// @ts-nocheck
export const routingBlueprints = {
  'palo-alto-traffic': {
    sourceDescription: 'Palo Alto Traffic Logs collected via syslog into Cribl Stream/Edge',
    collectionMethod: 'Syslog (UDP 514, TCP 514, or TLS 6514)',
    dataFlow: [
      { step: 1, name: 'Collect Once', description: 'Palo Alto Traffic Logs ingested into Cribl via syslog. Single collection point eliminates duplicate pipelines.' },
      { step: 2, name: 'Parse and Normalize', description: 'Cribl Pack parses CSV-format traffic log into named fields. Timestamps normalized, field names standardized.' },
      { step: 3, name: 'Optimize and Enrich', description: 'Apply enrichments (geo, internal/external tagging, zone classification). Add routing metadata. Calculate derived metrics.' },
      { step: 4, name: 'Route by Use Case', description: 'Fork event into destination-specific variants: SIEM-optimized, observability-optimized, and full-fidelity.' },
      { step: 5, name: 'Search and Replay', description: 'Full-fidelity logs available in Cribl Lake for investigation, replay, and ad-hoc analysis via Cribl Search.' }
    ],
    destinations: [
      {
        type: 'Security SIEM',
        examples: ['CrowdStrike NG SIEM', 'Splunk', 'Google Chronicle', 'Microsoft Sentinel', 'Elastic Security'],
        strategy: 'Send detection-relevant fields and events. Drop operational-only fields. Preserve identity, network, and policy fields needed for correlation and investigation.',
        fieldCount: 30,
        estimatedReduction: '35-45% field reduction vs full fidelity',
        filters: [
          'Include all action=deny events',
          'Include action=allow events matching detection-relevant criteria',
          'Include cross-zone traffic (untrusted → trusted)',
          'Include high-volume sessions (bytes > threshold)',
          'Include sessions with anomalous session_end_reason'
        ],
        excludedFields: ['flags', 'action_flags', 'device_group_hierarchy_level_*', 'source_vm_uuid', 'destination_vm_uuid', 'tunnel_id_imsi', 'monitor_tag_imei', 'parent_start_time', 'sctp_*', 'sequence_number', 'log_action', 'repeat_count']
      },
      {
        type: 'Observability Platform',
        examples: ['Dynatrace', 'Datadog', 'New Relic', 'Grafana', 'Splunk Observability'],
        strategy: 'Send operational and infrastructure indicators. Focus on traffic volume, interface health, session behavior, and application connectivity. Drop security-specific fields like NAT details and user identity.',
        fieldCount: 25,
        estimatedReduction: '45-55% field reduction vs full fidelity',
        filters: [
          'Include all events for volume and health metrics',
          'Aggregate where possible (per-minute rollups by rule, zone, interface)',
          'Sample allowed traffic for high-volume rules (10-25% sample rate)',
          'Always include deny events at full fidelity',
          'Always include session_end_reason != tcp-fin events'
        ],
        excludedFields: ['nat_source_ip', 'nat_destination_ip', 'nat_source_port', 'nat_destination_port', 'source_user', 'destination_user', 'session_id', 'flags', 'action_flags', 'category', 'source_vm_uuid', 'destination_vm_uuid', 'tunnel_id_imsi', 'monitor_tag_imei', 'parent_session_id', 'parent_start_time', 'sctp_*', 'device_group_hierarchy_level_*']
      },
      {
        type: 'Full-Fidelity Storage',
        examples: ['Cribl Lake', 'Amazon S3', 'Azure Blob', 'Google Cloud Storage'],
        strategy: 'Retain complete raw and parsed event. Include all fields, routing metadata, and processing context. This is the forensic record of truth.',
        fieldCount: 55,
        estimatedReduction: '0% — all fields retained',
        filters: [
          'Include ALL events — no filtering',
          'Preserve raw original event (_raw)',
          'Include parsed field set',
          'Add Cribl processing metadata (pack version, pipeline, timestamp)',
          'Add routing metadata (which destinations received which variant)'
        ],
        excludedFields: [],
        retentionGuidance: '90 days hot (Cribl Lake), 365 days warm (S3 Standard-IA), 7 years cold (S3 Glacier) for compliance'
      },
      {
        type: 'Cribl Search',
        examples: ['Cribl Search'],
        strategy: 'Full-fidelity logs indexed for interactive investigation, replay workflows, and ad-hoc analysis. Used when analytics platforms need more context during incident response.',
        fieldCount: 55,
        estimatedReduction: '0% — searchable full fidelity',
        filters: [
          'All events searchable',
          'Optimized for time-range queries',
          'Support field-level search across all parsed fields',
          'Enable replay to SIEM or observability tools for deep investigation'
        ],
        excludedFields: [],
        replayWorkflow: 'When an analytics alert fires with limited context, pivot to Cribl Search → query full-fidelity logs → identify additional indicators → optionally replay relevant events to SIEM/observability for temporary enriched investigation.'
      }
    ],
    costOptimization: {
      summary: 'By routing optimized variants to expensive analytics platforms and full-fidelity to low-cost storage, customers typically achieve 40-60% reduction in SIEM/observability ingestion costs while retaining 100% of data for investigation.',
      strategies: [
        { name: 'Field Pruning', description: 'Remove unnecessary fields per destination. Security SIEM doesn\'t need SCTP fields. Observability doesn\'t need NAT details.', impact: '15-25% volume reduction' },
        { name: 'Sampling', description: 'Sample high-volume allowed traffic for observability destinations. Keep all deny and anomalous events at full fidelity.', impact: '20-40% volume reduction for observability' },
        { name: 'Aggregation', description: 'Roll up traffic metrics (bytes, packets) by rule/zone/interface per minute for observability dashboards.', impact: '50-70% event reduction for metric use cases' },
        { name: 'Deduplication', description: 'Remove repeat_count duplicates. Send single event with count field instead of repeated identical events.', impact: '5-15% volume reduction' },
        { name: 'Null Field Removal', description: 'Drop empty fields (source_user, destination_user when not populated). Reduces event size per record.', impact: '5-10% volume reduction' }
      ]
    },
    packFunctions: [
      { name: 'Parse PA Traffic', description: 'Parse raw CSV Palo Alto Traffic log into named fields based on PAN-OS field position mapping.' },
      { name: 'Normalize Timestamps', description: 'Convert PAN-OS timestamp format (YYYY/MM/DD HH:MM:SS) to ISO 8601.' },
      { name: 'Drop Future-Use Fields', description: 'Remove future_use_0 through future_use_4 fields that carry no analytical value.' },
      { name: 'Tag Traffic Direction', description: 'Add direction field: inbound, outbound, east-west, or unknown based on zone names and IP classification.' },
      { name: 'Classify IP Type', description: 'Tag source_ip and destination_ip as private, public, multicast, or loopback.' },
      { name: 'Calculate Derived Metrics', description: 'Add bytes_per_second (bytes / elapsed_time) and packets_per_second for performance analysis.' },
      { name: 'Add Route Metadata', description: 'Add route_security, route_observability, route_full_fidelity boolean fields for downstream routing decisions.' },
      { name: 'Shape for SIEM', description: 'Create SIEM-optimized variant: keep security-relevant fields, drop operational-only fields.' },
      { name: 'Shape for Observability', description: 'Create observability-optimized variant: keep operational fields, drop security-specific fields.' },
      { name: 'Preserve Raw', description: 'Store original raw event in _raw field for full-fidelity destinations.' }
    ]
  }
  ,
  'windows-dns': {
    sourceDescription: 'Windows DNS Server Analytical logs collected via Cribl Edge (Windows Event Logs input) or WEF',
    collectionMethod: 'Cribl Edge (Windows Event Logs input subscribing to Microsoft-Windows-DNSServer/Analytical) or Windows Event Forwarding to collector',
    dataFlow: [
      { step: 1, name: 'Collect Once', description: 'Windows DNS Analytical events collected by Cribl Edge on the DNS server or via WEF subscription. Single collection point eliminates duplicate log forwarding.' },
      { step: 2, name: 'Parse and Normalize', description: 'Cribl Pack normalizes Event XML into structured fields. Decode QTYPE numeric to string, RCODE to text, calculate QNAME length, extract parent domain and TLD.' },
      { step: 3, name: 'Enrich and Derive', description: 'Calculate Shannon entropy on subdomain labels. Tag internal vs external domains. Classify source IPs. Add query_name_length for tunneling scoring.' },
      { step: 4, name: 'Route by Use Case', description: 'Fork events: security-optimized (query detail + threat indicators), observability-optimized (performance + volume metrics), full-fidelity (all fields).' },
      { step: 5, name: 'Search and Replay', description: 'Full-fidelity DNS logs in Cribl Lake for investigation, threat hunting, and ad-hoc domain analysis via Cribl Search.' }
    ],
    destinations: [
      {
        type: 'Security SIEM',
        examples: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security'],
        strategy: 'Send query-level events with threat-relevant derived fields. Include all response failures (NXDOMAIN, SERVFAIL, REFUSED). Drop raw packet data, thread IDs, and internal correlation fields.',
        fieldCount: 20,
        estimatedReduction: '35-40% field reduction vs full fidelity',
        filters: [
          'Include all queries with response_code != NOERROR (failures)',
          'Include queries with query_name_length > 40 (tunneling candidates)',
          'Include queries to suspicious TLDs',
          'Include AXFR/IXFR/ANY query types always',
          'Include TXT queries to non-standard destinations',
          'Sample NOERROR A/AAAA queries at 10-25% for baseline'
        ],
        excludedFields: ['packet_data', 'thread_id', 'process_id', 'correlation_guid', 'query_type_id', 'response_code_id', 'buffer_size', 'recursion_scope', 'scope']
      },
      {
        type: 'Observability Platform',
        examples: ['Dynatrace', 'Datadog', 'New Relic', 'Grafana', 'Splunk Observability'],
        strategy: 'Send performance and volume metrics. Focus on latency, response codes, query rates, and server health. Drop security-specific derived fields (entropy, subdomain labels). Aggregate where possible.',
        fieldCount: 16,
        estimatedReduction: '50-55% field reduction vs full fidelity',
        filters: [
          'Include all events for volume metrics',
          'Aggregate per-minute rollups by server, query_type, response_code',
          'Always include SERVFAIL and high-latency events at full fidelity',
          'Sample NOERROR responses at 10% for latency baseline',
          'Include all Event ID 262 (recursive timeouts)'
        ],
        excludedFields: ['query_name', 'source_ip', 'transaction_id', 'subdomain_label', 'query_name_length', 'tld', 'record_data', 'flags_authenticated', 'dnssec_ok', 'packet_data', 'correlation_guid', 'thread_id', 'process_id']
      },
      {
        type: 'Full-Fidelity Storage',
        examples: ['Cribl Lake', 'Amazon S3', 'Azure Blob', 'Google Cloud Storage'],
        strategy: 'Retain complete parsed DNS event. Include all fields, derived enrichments, and original event data. This is the forensic and threat-hunting record.',
        fieldCount: 33,
        estimatedReduction: '0% — all fields retained',
        filters: [
          'Include ALL events — no filtering',
          'Preserve original event structure',
          'Include all parsed and derived fields',
          'Add Cribl processing metadata (pipeline version, timestamp)',
          'Add collection metadata (Edge worker, WEF collector)'
        ],
        excludedFields: [],
        retentionGuidance: '90 days hot (Cribl Lake), 365 days warm (S3 Standard-IA), 7 years cold (S3 Glacier) for compliance'
      },
      {
        type: 'Cribl Search',
        examples: ['Cribl Search'],
        strategy: 'Full-fidelity DNS logs indexed for interactive investigation, threat hunting, and domain reputation analysis. Primary tool for deep-dive DNS forensics during incident response.',
        fieldCount: 33,
        estimatedReduction: '0% — searchable full fidelity',
        filters: [
          'All events searchable',
          'Optimized for time-range and domain-name queries',
          'Support field-level search across all parsed and derived fields',
          'Enable replay to SIEM when new IOCs (domains, IPs) are identified'
        ],
        excludedFields: [],
        replayWorkflow: 'When threat intel identifies a new malicious domain, search DNS logs for any historical queries to that domain → identify affected hosts → replay those events to SIEM for investigation context.'
      }
    ],
    costOptimization: {
      summary: 'Windows DNS logs are extremely high volume (thousands of events/second on busy servers). By routing optimized variants and aggressively sampling routine NOERROR responses, customers typically achieve 60-80% reduction in SIEM ingestion while retaining full threat detection capability.',
      strategies: [
        { name: 'Response Sampling', description: 'Sample successful (NOERROR) A/AAAA responses at 10-25%. Keep all failures (NXDOMAIN, SERVFAIL) at full fidelity for security and troubleshooting.', impact: '50-70% volume reduction for SIEM/observability' },
        { name: 'Field Pruning', description: 'Remove packet_data (large hex blob), internal IDs, and numeric code duplicates. Security doesn\'t need thread_id; observability doesn\'t need query_name.', impact: '15-25% per-event size reduction' },
        { name: 'Aggregation for Observability', description: 'Roll up DNS metrics (queries/sec, latency percentiles, response code counts) per minute by server. Send aggregated metrics instead of individual events.', impact: '80-90% event reduction for observability destinations' },
        { name: 'Query Deduplication', description: 'Deduplicate repeated identical queries from the same source within short windows (common with stuck resolvers and retries).', impact: '10-30% volume reduction during incidents' },
        { name: 'Internal Zone Filtering', description: 'For security destinations, filter out queries to well-known internal zones (corp.local, _msdcs, _sites) that have no security value.', impact: '20-40% volume reduction depending on AD query volume' }
      ]
    },
    packFunctions: [
      { name: 'Parse DNS Analytical Event', description: 'Extract structured fields from Windows Event XML/JSON. Map EventData fields to normalized names (Source → source_ip, QNAME → query_name, etc.).' },
      { name: 'Decode QTYPE', description: 'Map numeric QTYPE to human-readable string (1→A, 28→AAAA, 15→MX, 16→TXT, 252→AXFR, etc.).' },
      { name: 'Decode RCODE', description: 'Map numeric RCODE to response code string (0→NOERROR, 2→SERVFAIL, 3→NXDOMAIN, 5→REFUSED).' },
      { name: 'Decode Debug Log QNAME', description: 'For legacy dns.log input: convert wire-format QNAME like (7)finance(3)corp(5)local(0) to finance.corp.local.' },
      { name: 'Extract Domain Components', description: 'Derive parent_domain, subdomain_label, and tld from query_name. Handle multi-part TLDs (co.uk, com.au).' },
      { name: 'Calculate QNAME Length', description: 'Add query_name_length field for tunneling detection thresholds.' },
      { name: 'Classify Direction', description: 'Map Event ID to direction: 256→query_received, 257→response_success, 258→response_failure, 260→recurse_out, 261→recurse_in.' },
      { name: 'Tag Internal vs External', description: 'Classify query_name as internal (matches known zones) or external for routing decisions.' },
      { name: 'Shape for SIEM', description: 'Create security-optimized variant: keep threat-relevant fields, add derived indicators, drop operational-only fields.' },
      { name: 'Shape for Observability', description: 'Create observability-optimized variant: keep performance fields, anonymize/drop query specifics, prepare for aggregation.' }
    ]
  },
  'aws-vpc-flow': {
    sourceDescription: 'AWS VPC Flow Logs collected from S3 via Cribl Stream S3 Collector or SQS-triggered pull',
    collectionMethod: 'S3 Collector (VPC publishes to S3 bucket) / CloudWatch Logs subscription / Kinesis Data Firehose',
    dataFlow: [
      { step: 1, name: 'Collect Once', description: 'VPC Flow Logs delivered to S3 (gzipped). Cribl Stream S3 Collector pulls new objects via SQS notification or scheduled polling.' },
      { step: 2, name: 'Parse and Normalize', description: 'Decompress gzip, parse space-delimited fields into named columns based on configured flow log format version (v2-v5). Map protocol numbers to names.' },
      { step: 3, name: 'Enrich and Classify', description: 'Enrich with instance tags, VPC names, subnet purpose. Classify IPs as internal/external. Map traffic_path to human-readable descriptions. Tag AWS service traffic.' },
      { step: 4, name: 'Route by Use Case', description: 'Fork: REJECT flows + sensitive port ACCEPTs → SIEM. Volume metrics + AZ distribution → observability. All flows → full-fidelity storage.' },
      { step: 5, name: 'Search and Replay', description: 'Full-fidelity flows in Cribl Lake for forensic investigation, service dependency mapping, and compliance queries via Cribl Search.' }
    ],
    destinations: [
      {
        type: 'Security SIEM',
        examples: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security'],
        strategy: 'Send all REJECT flows, ACCEPT flows on sensitive ports, and high-byte egress flows. Drop routine internal health checks and known-good traffic patterns.',
        fieldCount: 20,
        estimatedReduction: '60-75% event reduction vs full fidelity',
        filters: [
          'Include all action=REJECT flows',
          'Include ACCEPT flows to management ports (22, 3389, 445, 5985)',
          'Include ACCEPT flows with traffic_path=2 (internet-bound) to non-AWS-service destinations',
          'Include flows with bytes > 1GB (exfiltration candidates)',
          'Include flows from unknown/new source IPs to sensitive subnets',
          'Drop routine ACCEPT internal-to-internal on known service ports'
        ],
        excludedFields: ['sublocation_type', 'sublocation_id', 'az_id', 'log_status', 'pkt_src_aws_service', 'pkt_dst_aws_service']
      },
      {
        type: 'Observability Platform',
        examples: ['Datadog', 'Dynatrace', 'New Relic', 'Grafana Cloud'],
        strategy: 'Send aggregated flow metrics for capacity planning and connectivity monitoring. Roll up by 5-tuple, subnet, and AZ. Focus on bytes/packets trends and REJECT rates.',
        fieldCount: 16,
        estimatedReduction: '80-90% event reduction via aggregation',
        filters: [
          'Aggregate flows per minute by srcaddr, dstaddr, dstport, protocol, action',
          'Always include REJECT flows at full fidelity',
          'Include AZ-to-AZ traffic summaries for cost analysis',
          'Sample routine ACCEPT flows at 10%',
          'Drop NODATA/SKIPDATA records'
        ],
        excludedFields: ['srcport', 'pkt_srcaddr', 'pkt_dstaddr', 'tcp_flags', 'instance_id', 'interface_id', 'sublocation_type', 'sublocation_id', 'type']
      },
      {
        type: 'Full-Fidelity Storage',
        examples: ['Cribl Lake', 'Amazon S3', 'Azure Blob'],
        strategy: 'Retain all parsed flow records with enrichments. This is the forensic and compliance record — supports post-incident investigation and service dependency analysis.',
        fieldCount: 28,
        estimatedReduction: '0% — all fields retained',
        filters: [
          'Include ALL flows (except NODATA/SKIPDATA)',
          'Preserve all parsed fields',
          'Add enrichment metadata (instance names, VPC names)',
          'Add Cribl processing metadata'
        ],
        excludedFields: [],
        retentionGuidance: '90 days hot (Cribl Lake), 365 days warm (S3 Standard-IA), 7 years cold (S3 Glacier)'
      },
      {
        type: 'Cribl Search',
        examples: ['Cribl Search'],
        strategy: 'Full-fidelity indexed flows for interactive investigation, lateral movement tracing, and service dependency discovery. Primary tool for incident response network forensics.',
        fieldCount: 28,
        estimatedReduction: '0% — searchable full fidelity',
        filters: [
          'All flows searchable',
          'Optimized for 5-tuple and time-range queries',
          'Support field-level search across all enrichments',
          'Enable replay to SIEM when investigating new IOC IPs'
        ],
        excludedFields: [],
        replayWorkflow: 'When a compromised instance is identified, search VPC flows for all communication from that instance → map lateral movement → replay relevant flows to SIEM for investigation context.'
      }
    ],
    costOptimization: {
      summary: 'VPC Flow Logs are extremely high volume (millions of records per day for a moderately busy VPC). By routing only security-relevant flows to SIEM and aggregating metrics for observability, customers typically achieve 70-85% reduction in analytics platform ingestion while retaining full forensic capability.',
      strategies: [
        { name: 'Action-Based Routing', description: 'Route REJECT flows to SIEM (security), ACCEPT to low-cost storage (compliance). REJECT flows are typically 5-15% of total volume but carry highest security value.', impact: '60-75% SIEM volume reduction' },
        { name: 'Aggregation', description: 'Roll up flows by 5-tuple per 5-minute window for observability. One aggregated record replaces hundreds of individual flow records.', impact: '80-90% event reduction for observability' },
        { name: 'NODATA/SKIPDATA Removal', description: 'Drop records with log_status != OK immediately. These carry no useful traffic information.', impact: '5-15% volume reduction' },
        { name: 'Known-Good Suppression', description: 'Suppress or sample known-good patterns: load balancer health checks, internal DNS queries, NTP, AWS service traffic.', impact: '20-40% additional reduction' },
        { name: 'Field Pruning', description: 'Remove sublocation fields, ECS metadata (if not using ECS), and redundant address fields where pkt_srcaddr == srcaddr.', impact: '10-20% per-event size reduction' }
      ]
    },
    packFunctions: [
      { name: 'Decompress and Split', description: 'Decompress gzipped S3 objects and split into individual flow records (one per line).' },
      { name: 'Parse Delimited Fields', description: 'Parse space-delimited flow record into named fields based on configured version schema.' },
      { name: 'Map Protocol Numbers', description: 'Convert IANA protocol number to name (6→TCP, 17→UDP, 1→ICMP).' },
      { name: 'Decode TCP Flags', description: 'Convert tcp_flags bitmask to human-readable flags (2→SYN, 18→SYN-ACK, 1→FIN, 4→RST).' },
      { name: 'Map Traffic Path', description: 'Convert traffic_path number to description (1→same VPC, 2→internet gateway, 4→VPC peering, etc.).' },
      { name: 'Classify IP Addresses', description: 'Tag srcaddr/dstaddr as internal (RFC1918), external, or AWS service. Identify NAT traversal (pkt_srcaddr != srcaddr).' },
      { name: 'Enrich with Instance Tags', description: 'Lookup instance_id against AWS tag data to add Name, Environment, Team tags.' },
      { name: 'Drop NODATA Records', description: 'Remove records where log_status is NODATA or SKIPDATA — no useful information.' },
      { name: 'Shape for SIEM', description: 'Create security-optimized variant: focus on REJECT + sensitive ACCEPT, add threat indicators.' },
      { name: 'Aggregate for Observability', description: 'Roll up flows by 5-tuple per minute for metric-style output to observability platforms.' }
    ]
  },
  'crowdstrike-edr': {
    sourceDescription: 'CrowdStrike Falcon EDR telemetry collected via Falcon Data Replicator (FDR/S3) or Streaming API into Cribl Stream',
    collectionMethod: 'Falcon Data Replicator (S3 pull via Cribl S3 Collector) / Streaming API (HTTP event stream) / SIEM Connector',
    dataFlow: [
      { step: 1, name: 'Collect Once', description: 'CrowdStrike FDR delivers JSON events to customer S3 bucket. Cribl Stream S3 Collector ingests new objects. Alternatively, HTTP source receives Streaming API events.' },
      { step: 2, name: 'Parse and Normalize', description: 'Parse JSON envelope (metadata + event). Normalize timestamps from epoch to ISO 8601. Convert device paths to drive-letter format. Map event_simpleName to category.' },
      { step: 3, name: 'Enrich and Classify', description: 'Add host context from aid lookup. Classify processes as LOLBins, known-good, or unknown. Tag network connections as internal/external. Score CommandLine suspiciousness.' },
      { step: 4, name: 'Route by Event Type', description: 'Fork: DetectionSummaryEvent → SIEM always. ProcessRollup2/NetworkConnectIP4 → SIEM (filtered). All events → full-fidelity. Metrics (volume, versions) → observability.' },
      { step: 5, name: 'Search and Replay', description: 'Full-fidelity EDR telemetry in Cribl Lake for threat hunting, process tree reconstruction, and ad-hoc investigation via Cribl Search.' }
    ],
    destinations: [
      {
        type: 'Security SIEM',
        examples: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security'],
        strategy: 'Send all DetectionSummaryEvent at full fidelity. Filter ProcessRollup2 to suspicious patterns only. Send all NetworkConnectIP4 to external IPs. Send all UserLogon with LogonType 3/10.',
        fieldCount: 28,
        estimatedReduction: '40-60% event reduction vs full fidelity',
        filters: [
          'Include ALL DetectionSummaryEvent and IncidentSummaryEvent',
          'Include ProcessRollup2 with suspicious CommandLine patterns',
          'Include ProcessRollup2 with IntegrityLevel >= 12288 (High/System)',
          'Include NetworkConnectIP4 to external IPs (non-RFC1918)',
          'Include all UserLogon/UserLogonFailed with LogonType 3 or 10',
          'Include all NewExecutableWritten events',
          'Sample routine ProcessRollup2 (known-good system processes) at 1%'
        ],
        excludedFields: ['ConfigStateHash', 'TokenType', 'WindowFlags', 'SessionId', 'ImageSubsystem', 'Entitlements']
      },
      {
        type: 'Observability Platform',
        examples: ['Datadog', 'Dynatrace', 'Grafana'],
        strategy: 'Send endpoint health metrics: agent check-in rates, sensor versions, event volume per endpoint. Aggregate process and network counts per minute for fleet health dashboards.',
        fieldCount: 10,
        estimatedReduction: '90-95% event reduction via aggregation',
        filters: [
          'Aggregate event counts per minute by aid, event_simpleName',
          'Include AgentOnline/AgentConnect events for uptime tracking',
          'Include ConfigBuild per aid for version distribution',
          'Include network connection failure indicators',
          'Drop all CommandLine, SHA256, and investigation-specific fields'
        ],
        excludedFields: ['CommandLine', 'ParentCommandLine', 'SHA256HashData', 'MD5HashData', 'UserSid', 'TreeId', 'TargetProcessId', 'ParentProcessId', 'TargetFileName', 'DomainName', 'Tactic', 'Technique', 'DetectName']
      },
      {
        type: 'Full-Fidelity Storage',
        examples: ['Cribl Lake', 'Amazon S3'],
        strategy: 'Retain complete EDR telemetry for threat hunting, incident response, and forensic reconstruction. Preserve process trees, network connections, and file activity for historical investigation.',
        fieldCount: 38,
        estimatedReduction: '0% — all fields retained',
        filters: [
          'Include ALL events',
          'Preserve complete JSON structure',
          'Add Cribl processing metadata',
          'Add host enrichment context'
        ],
        excludedFields: [],
        retentionGuidance: '30 days hot (Cribl Lake), 90 days warm (S3 Standard-IA), 365 days cold (S3 Glacier) for most; 7 years for regulated industries'
      },
      {
        type: 'Cribl Search',
        examples: ['Cribl Search'],
        strategy: 'Full-fidelity EDR telemetry indexed for interactive threat hunting, process tree reconstruction, and timeline analysis. Primary tool for deep-dive endpoint forensics.',
        fieldCount: 38,
        estimatedReduction: '0% — searchable full fidelity',
        filters: [
          'All events searchable',
          'Optimized for aid + time-range and CommandLine keyword queries',
          'Support process tree reconstruction via TreeId/TargetProcessId',
          'Enable replay to SIEM when new IOCs or TTPs are identified'
        ],
        excludedFields: [],
        replayWorkflow: 'When a new malware hash is identified, search EDR telemetry for all endpoints that executed it → reconstruct kill chain per endpoint → replay critical events to SIEM for incident response.'
      }
    ],
    costOptimization: {
      summary: 'CrowdStrike EDR generates 5,000-200,000 events per endpoint per day. ProcessRollup2 and NetworkConnectIP4 alone account for 60-75% of volume. By filtering to security-relevant process patterns and aggregating fleet health metrics, customers achieve 50-70% reduction in SIEM ingestion while retaining full hunting capability.',
      strategies: [
        { name: 'Event Type Routing', description: 'Route by event_simpleName: DetectionSummaryEvent always to SIEM (low volume, high value). ProcessRollup2 filtered (high volume, selectively valuable). NetworkConnectIP4 filtered to external only.', impact: '40-60% SIEM volume reduction' },
        { name: 'Known-Good Process Suppression', description: 'Suppress or sample ProcessRollup2 for known-good system processes (svchost, RuntimeBroker, SearchProtocolHost, etc.) that generate massive volume with low security value.', impact: '30-50% ProcessRollup2 reduction' },
        { name: 'Internal Network Suppression', description: 'Drop or sample NetworkConnectIP4 to internal RFC1918 destinations and known infrastructure IPs (DNS servers, DCs, file shares).', impact: '50-70% NetworkConnectIP4 reduction' },
        { name: 'Duplicate Field Removal', description: 'Remove _decimal suffix duplicate fields (TargetProcessId vs TargetProcessId_decimal). Remove empty fields (ProcessEndTime when blank).', impact: '10-20% per-event size reduction' },
        { name: 'Aggregation for Observability', description: 'Aggregate event counts per endpoint per minute instead of forwarding individual events to observability platforms.', impact: '90-95% event reduction for observability' }
      ]
    },
    packFunctions: [
      { name: 'Parse FDR JSON', description: 'Parse CrowdStrike FDR JSON envelope. Extract metadata and event fields into flat structure.' },
      { name: 'Normalize Timestamps', description: 'Convert epoch millisecond timestamps to ISO 8601. Handle ContextTimeStamp_decimal precision.' },
      { name: 'Convert Device Paths', description: 'Convert Windows device paths (\\Device\\HarddiskVolume3\\...) to drive letter format (C:\\...) for analyst readability.' },
      { name: 'Classify Process', description: 'Tag ImageFileName as LOLBin, known-good-system, known-good-application, or unknown based on lookup table.' },
      { name: 'Extract Process Name', description: 'Derive short process name (cmd.exe) from full ImageFileName path for easier searching and grouping.' },
      { name: 'Tag Network Direction', description: 'Classify RemoteAddressIP4 as internal, external, multicast, or loopback. Map ConnectionDirection numeric to inbound/outbound.' },
      { name: 'Score CommandLine', description: 'Apply regex-based scoring to CommandLine for common attack patterns (encoded commands, download cradles, credential access).' },
      { name: 'Shape for SIEM', description: 'Create security-optimized variant: keep threat-relevant fields, apply CommandLine filters, drop observability-only fields.' },
      { name: 'Aggregate for Fleet Health', description: 'Create per-endpoint-per-minute event counts by event_simpleName for fleet health dashboards.' },
      { name: 'Preserve Full Fidelity', description: 'Pass through complete event with all enrichments for full-fidelity storage and Cribl Search.' }
    ]
  },
  'nginx-access': {
    sourceDescription: 'NGINX access and error logs collected via Cribl Edge file monitor, syslog, or container stdout',
    collectionMethod: 'Cribl Edge (File Monitor on access.log) / Syslog forwarding / Container stdout (JSON structured logging)',
    dataFlow: [
      { step: 1, name: 'Collect Once', description: 'NGINX access logs collected by Cribl Edge monitoring the log file, receiving syslog, or reading container stdout. Single collection point for both access and error logs.' },
      { step: 2, name: 'Parse and Normalize', description: 'Parse combined/custom/JSON log format into structured fields. Extract request method, URI, and protocol from request line. Convert timestamps to ISO 8601. Cast numeric fields.' },
      { step: 3, name: 'Enrich and Classify', description: 'GeoIP enrichment on remote_addr. Classify user agents (browser, bot, scanner, API client). Tag request URIs by category (API, static, auth). Calculate derived metrics.' },
      { step: 4, name: 'Route by Use Case', description: 'Fork: attack patterns + auth failures → SIEM. Latency metrics + error rates → observability. All requests → full-fidelity.' },
      { step: 5, name: 'Search and Replay', description: 'Full-fidelity access logs in Cribl Lake for incident investigation, user journey analysis, and ad-hoc traffic forensics via Cribl Search.' }
    ],
    destinations: [
      {
        type: 'Security SIEM',
        examples: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security'],
        strategy: 'Send requests with attack indicators (SQL injection, XSS, path traversal), authentication failures (401/403), scanner user agents, and unusual HTTP methods. Drop routine 200 responses to static content.',
        fieldCount: 18,
        estimatedReduction: '70-85% event reduction vs full fidelity',
        filters: [
          'Include all status 401/403 responses (brute force, unauthorized)',
          'Include all status 400 responses (malformed requests)',
          'Include requests matching attack patterns in request_uri',
          'Include requests with known scanner user agents',
          'Include requests with unusual HTTP methods (TRACE, DELETE, CONNECT)',
          'Include requests with deprecated TLS protocols',
          'Sample routine 200/301/304 responses at 1-5%'
        ],
        excludedFields: ['upstream_connect_time', 'upstream_header_time', 'upstream_cache_status', 'connection', 'connection_requests', 'gzip_ratio', 'bytes_sent']
      },
      {
        type: 'Observability Platform',
        examples: ['Datadog', 'Dynatrace', 'New Relic', 'Grafana'],
        strategy: 'Send performance metrics: request latency percentiles, error rates, cache hit ratios, upstream health, and traffic volume. Aggregate per virtual host per minute.',
        fieldCount: 14,
        estimatedReduction: '85-95% event reduction via aggregation',
        filters: [
          'Aggregate per minute by server_name, status class (2xx/3xx/4xx/5xx), upstream_addr',
          'Always include 5xx responses at full fidelity',
          'Include upstream_response_time > 1s (slow requests) at full fidelity',
          'Include upstream_status 5xx at full fidelity',
          'Sample routine 200s at 5% for latency baseline'
        ],
        excludedFields: ['remote_addr', 'remote_user', 'http_referer', 'http_user_agent', 'http_x_forwarded_for', 'args', 'ssl_cipher', 'request_length']
      },
      {
        type: 'Full-Fidelity Storage',
        examples: ['Cribl Lake', 'Amazon S3', 'Azure Blob'],
        strategy: 'Retain complete access log with all fields and enrichments. Supports compliance, user journey analysis, and forensic investigation.',
        fieldCount: 30,
        estimatedReduction: '0% — all fields retained',
        filters: [
          'Include ALL requests',
          'Preserve all parsed fields and enrichments',
          'Add GeoIP data, user agent classification',
          'Add Cribl processing metadata'
        ],
        excludedFields: [],
        retentionGuidance: '30 days hot (Cribl Lake), 90 days warm (S3 Standard-IA), 365 days cold (S3 Glacier)'
      },
      {
        type: 'Cribl Search',
        examples: ['Cribl Search'],
        strategy: 'Full-fidelity access logs indexed for interactive investigation, attack timeline reconstruction, and user behavior analysis. Primary tool for web security forensics.',
        fieldCount: 30,
        estimatedReduction: '0% — searchable full fidelity',
        filters: [
          'All requests searchable',
          'Optimized for remote_addr, request_uri, and time-range queries',
          'Support user agent and URI pattern searches',
          'Enable replay to SIEM when investigating attack campaigns'
        ],
        excludedFields: [],
        replayWorkflow: 'When a web attack is detected, search access logs for all requests from the attacker IP → reconstruct attack timeline → identify other targets → replay attack-related requests to SIEM.'
      }
    ],
    costOptimization: {
      summary: 'NGINX access logs are extremely high volume for busy web services (millions of requests per day). By routing only attack-relevant and error traffic to SIEM and aggregating performance metrics for observability, customers typically achieve 75-90% reduction in analytics platform ingestion.',
      strategies: [
        { name: 'Status-Based Routing', description: 'Route 4xx/5xx to SIEM (security + ops), aggregate 2xx/3xx for metrics only. Successful responses to static assets have near-zero security value.', impact: '70-85% SIEM volume reduction' },
        { name: 'Static Asset Filtering', description: 'Drop or heavily sample requests to static assets (.js, .css, .png, .woff). These generate massive volume with minimal security or performance insight.', impact: '30-50% total volume reduction' },
        { name: 'Health Check Suppression', description: 'Suppress load balancer and monitoring health checks (/health, /ready, /ping). These are predictable, high-frequency, and carry no analytical value.', impact: '5-20% volume reduction' },
        { name: 'Aggregation for Metrics', description: 'Roll up requests per minute by server_name, status class, and upstream_addr for observability. One metric record per minute replaces thousands of individual requests.', impact: '90-95% event reduction for observability' },
        { name: 'User Agent Deduplication', description: 'Normalize and truncate verbose user agent strings. Browser UAs can be 200+ characters — map to category (Chrome, Firefox, Bot, API) to reduce event size.', impact: '5-10% per-event size reduction' }
      ]
    },
    packFunctions: [
      { name: 'Parse Access Log', description: 'Parse NGINX combined/extended/JSON format into named fields. Handle both traditional and JSON structured formats.' },
      { name: 'Extract Request Components', description: 'Split $request into request_method, request_uri, and http_version. Extract query string into separate args field.' },
      { name: 'Cast Numeric Fields', description: 'Convert status, body_bytes_sent, request_time, upstream_response_time to numeric types for proper aggregation.' },
      { name: 'GeoIP Enrichment', description: 'Add geographic context (country, city, ASN) to remote_addr and http_x_forwarded_for.' },
      { name: 'Classify User Agent', description: 'Categorize http_user_agent into browser, mobile, bot, scanner, API client, or unknown.' },
      { name: 'Detect Attack Patterns', description: 'Regex match request_uri for SQL injection, XSS, path traversal, and command injection patterns. Add attack_type tag.' },
      { name: 'Suppress Health Checks', description: 'Identify and suppress or sample known health check patterns (specific URIs, internal source IPs, monitoring user agents).' },
      { name: 'Shape for SIEM', description: 'Create security-optimized variant: include attack indicators, auth failures, scanner activity. Drop performance fields.' },
      { name: 'Aggregate for Metrics', description: 'Create per-minute rollups: request count, latency percentiles, error rate, cache hit ratio by server_name and upstream_addr.' },
      { name: 'Shape for Full Fidelity', description: 'Preserve complete request with all enrichments for storage and Cribl Search indexing.' }
    ]
  },
  'okta-system-logs': {
    sourceDescription: 'Okta System Log events collected via REST API polling, Log Streaming (webhook), or AWS EventBridge into Cribl Stream',
    collectionMethod: 'REST Collector (API Polling /api/v1/logs) / Okta Log Streaming (Splunk HEC format webhook) / AWS EventBridge → SQS',
    dataFlow: [
      { step: 1, name: 'Collect Once', description: 'Okta System Log events ingested via REST Collector polling or webhook push. Single collection point eliminates duplicate API calls and rate limit pressure.' },
      { step: 2, name: 'Parse and Normalize', description: 'Cribl Pack breaks JSON array into individual events, extracts nested objects (actor, client, outcome, target), normalizes timestamps to _time.' },
      { step: 3, name: 'Enrich and Classify', description: 'Add threat intel lookup on client.ipAddress, classify eventType into security/operational categories, parse debugContext.debugData.behaviors into structured fields.' },
      { step: 4, name: 'Route by Use Case', description: 'Fork events: security-relevant (auth failures, privilege changes, MFA events) to SIEM, operational metrics to observability, all events to full-fidelity storage.' },
      { step: 5, name: 'Search and Replay', description: 'Full-fidelity events indexed in Cribl Lake for identity investigation, session reconstruction, and compliance audit via Cribl Search.' }
    ],
    destinations: [
      {
        type: 'Security SIEM',
        examples: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security'],
        strategy: 'Send authentication failures, MFA events, privilege changes, admin actions, and ThreatInsight alerts. Drop DEBUG-severity policy evaluations and routine successful SSO assertions to low-risk apps.',
        fieldCount: 28,
        estimatedReduction: '40-60% event reduction vs full fidelity',
        filters: [
          'Include all outcome.result=FAILURE events',
          'Include all severity=WARN or ERROR events',
          'Include eventType containing "mfa", "privilege", "impersonation", "api_token"',
          'Include events where debugContext.debugData.threatSuspected=true',
          'Include security.threat.detected and security.attack.* events',
          'Sample routine user.authentication.sso SUCCESS events at 10%',
          'Drop all severity=DEBUG policy.evaluate_sign_on events'
        ],
        excludedFields: ['legacyEventType', 'version', 'debugContext.debugData.logOnlySecurityData', 'debugContext.debugData.url', 'request.ipChain[1+]']
      },
      {
        type: 'Observability Platform',
        examples: ['Datadog', 'Dynatrace', 'New Relic', 'Grafana'],
        strategy: 'Aggregate authentication metrics: success/failure rates per minute by eventType and application. Send individual events only for rate limit warnings and SSO failures that indicate app availability issues.',
        fieldCount: 12,
        estimatedReduction: '80-90% event reduction via aggregation',
        filters: [
          'Aggregate per minute: auth success/failure count by eventType, target app',
          'Include system.org.rate_limit.* events at full fidelity',
          'Include user.authentication.sso FAILURE events at full fidelity',
          'Include user.account.lock events at full fidelity',
          'Drop all individual SUCCESS events (covered by aggregation)',
          'Drop all policy evaluation and lifecycle events'
        ],
        excludedFields: ['actor.id', 'actor.displayName', 'client.userAgent.rawUserAgent', 'client.geographicalContext', 'debugContext', 'securityContext', 'request.ipChain', 'target[].detailEntry']
      },
      {
        type: 'Full-Fidelity Storage',
        examples: ['Cribl Lake', 'Amazon S3', 'Azure Blob'],
        strategy: 'Retain complete Okta System Log events with all nested objects and enrichments. Supports compliance audit, identity forensics, and session reconstruction.',
        fieldCount: 38,
        estimatedReduction: '0% — all fields retained',
        filters: [
          'Include ALL events regardless of severity or outcome',
          'Preserve complete nested objects (actor, client, target, debugContext)',
          'Add threat intel enrichment on client.ipAddress',
          'Add Cribl processing metadata and routing tags'
        ],
        excludedFields: [],
        retentionGuidance: '90 days hot (Cribl Lake), 365 days warm (S3 Standard-IA), 7 years cold (S3 Glacier) for compliance'
      },
      {
        type: 'Cribl Search',
        examples: ['Cribl Search'],
        strategy: 'Full-fidelity identity events indexed for interactive investigation, impossible travel analysis, account takeover timeline reconstruction, and compliance reporting.',
        fieldCount: 38,
        estimatedReduction: '0% — searchable full fidelity',
        filters: [
          'All events searchable with full nested object access',
          'Optimized for actor.alternateId, eventType, and time-range queries',
          'Support client.ipAddress and geolocation searches',
          'Enable replay to SIEM when investigating identity incidents'
        ],
        excludedFields: [],
        replayWorkflow: 'When credential compromise is suspected, search all events for the affected actor.alternateId → reconstruct session timeline → identify lateral app access → replay suspicious events to SIEM for correlation with endpoint/network data.'
      }
    ],
    costOptimization: {
      summary: 'Okta System Logs generate 1-5 million events/day for active organizations. The highest volume comes from DEBUG-severity policy evaluations and routine SSO assertions — both carry minimal security or operational value for downstream analytics. By filtering these and aggregating auth metrics, customers typically achieve 50-70% reduction in SIEM ingestion costs.',
      strategies: [
        { name: 'Drop Policy Evaluations', description: 'policy.evaluate_sign_on events (DEBUG severity) fire for every authentication attempt and are the single largest volume contributor. They have near-zero value once the sign-on policy is validated.', impact: '25-40% total volume reduction' },
        { name: 'Sample Routine SSO', description: 'Successful SSO assertions to known-good applications generate massive volume. Sample at 5-10% for baseline metrics while sending all failures at full fidelity.', impact: '20-35% SIEM volume reduction' },
        { name: 'Trim Verbose Fields', description: 'client.userAgent.rawUserAgent (200+ chars), debugContext.debugData.logOnlySecurityData (redundant JSON string), and legacyEventType add size without unique value.', impact: '10-15% per-event size reduction' },
        { name: 'Aggregate Auth Metrics', description: 'Roll up authentication outcomes per minute by eventType and application for observability. One metric record per minute replaces thousands of individual auth events.', impact: '85-95% event reduction for observability' },
        { name: 'Deduplicate ipChain', description: 'request.ipChain often duplicates client.ipAddress and client.geographicalContext. Remove ipChain entries beyond the first for non-proxy scenarios.', impact: '5-8% per-event size reduction' }
      ]
    },
    packFunctions: [
      { name: 'Break JSON Array', description: 'Split API response array into individual LogEvent objects. Handle both array format (API polling) and single-event format (webhook).' },
      { name: 'Extract Timestamps', description: 'Parse published field to _time. Validate ISO 8601 format and normalize timezone to UTC.' },
      { name: 'Flatten Critical Paths', description: 'Promote frequently-queried nested fields to top level: actor_email=actor.alternateId, src_ip=client.ipAddress, event_outcome=outcome.result.' },
      { name: 'Parse Behavior Signals', description: 'Extract debugContext.debugData.behaviors from string format into structured key-value pairs for downstream correlation.' },
      { name: 'Threat Intel Lookup', description: 'Enrich client.ipAddress against threat intelligence feeds. Add threat_score, threat_category, and known_proxy fields.' },
      { name: 'Classify Event Category', description: 'Tag events as security_relevant, operational, or compliance based on eventType patterns and severity.' },
      { name: 'Drop Low-Value Events', description: 'Suppress DEBUG-severity policy evaluations for non-security destinations. Apply sampling to routine SSO successes.' },
      { name: 'Shape for SIEM', description: 'Create security-optimized variant with identity, risk, and outcome fields. Map to CIM/OCSF identity event schema.' },
      { name: 'Aggregate for Metrics', description: 'Create per-minute auth metrics: success_count, failure_count, mfa_challenge_count, lockout_count by application and eventType.' },
      { name: 'Shape for Full Fidelity', description: 'Preserve complete event with enrichments for Cribl Lake indexing and compliance storage.' }
    ]
  },
  'k8s-audit-logs': {
    sourceDescription: 'Kubernetes API server audit logs (audit.k8s.io/v1) collected via webhook backend, file monitor (Cribl Edge), or cloud provider integrations (EKS CloudWatch, GKE Pub/Sub, AKS Event Hub)',
    collectionMethod: 'Webhook Backend (HTTP/S → Cribl Stream) / File Monitor (Cribl Edge on /var/log/kubernetes/audit/audit.log) / CloudWatch Logs (EKS) / Pub/Sub (GKE) / Event Hub (AKS)',
    dataFlow: [
      { step: 1, name: 'Collect Once', description: 'K8s audit events ingested via webhook (real-time push) or file monitor (pull). Single collection point avoids duplicate log shipping across multiple tools.' },
      { step: 2, name: 'Parse and Normalize', description: 'Cribl Pack handles event breaking (NDJSON for file, EventList batches for webhook), extracts nested objects (user, objectRef, responseStatus), normalizes requestReceivedTimestamp to _time.' },
      { step: 3, name: 'Filter and Enrich', description: 'Filter to stage=ResponseComplete (dedup across stages). Drop requestObject/responseObject for non-sensitive resources. Classify resources by security sensitivity.' },
      { step: 4, name: 'Route by Use Case', description: 'Fork events: RBAC changes, secret access, exec/portforward to SIEM; API errors, latency, component health to observability; all events to full-fidelity storage.' },
      { step: 5, name: 'Search and Replay', description: 'Full-fidelity audit trail indexed in Cribl Lake for security forensics, compliance audit, and platform troubleshooting via Cribl Search.' }
    ],
    destinations: [
      {
        type: 'Security SIEM',
        examples: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security'],
        strategy: 'Send RBAC modifications, secret access, exec/portforward events, anonymous access, privileged container creation, and all 403 Forbidden responses. Drop routine system component activity (watches, status updates, health checks).',
        fieldCount: 22,
        estimatedReduction: '85-95% event reduction vs full fidelity',
        filters: [
          'Include objectRef.resource in (secrets, clusterroles, clusterrolebindings) with verb in (create, update, patch, delete, get, list)',
          'Include objectRef.subresource in (exec, portforward)',
          'Include user.username=system:anonymous',
          'Include impersonatedUser.username IS NOT NULL',
          'Include responseStatus.code=403 (all RBAC denials)',
          'Include verb=create where objectRef.resource=pods (new workload creation)',
          'Drop all verb=watch events',
          'Drop system component heartbeats (kubelet status patches)'
        ],
        excludedFields: ['requestObject (except for secrets/RBAC)', 'responseObject', 'objectRef.resourceVersion', 'objectRef.uid']
      },
      {
        type: 'Observability Platform',
        examples: ['Datadog', 'Dynatrace', 'New Relic', 'Grafana'],
        strategy: 'Aggregate API server metrics: request rate, latency, and error rate by verb and resource. Send individual events for 5xx errors and control plane component absence detection.',
        fieldCount: 12,
        estimatedReduction: '90-97% event reduction via aggregation',
        filters: [
          'Aggregate per minute: request count, latency (stageTimestamp - requestReceivedTimestamp) by verb, objectRef.resource, responseStatus.code class',
          'Include all responseStatus.code >= 500 at full fidelity',
          'Include node create/delete events at full fidelity',
          'Drop all verb=watch events from aggregation (long-lived connections skew metrics)',
          'Drop all system:node:* status patches (high-frequency heartbeats)'
        ],
        excludedFields: ['requestObject', 'responseObject', 'annotations', 'user.extra', 'user.uid', 'impersonatedUser', 'objectRef.name', 'objectRef.uid', 'objectRef.resourceVersion']
      },
      {
        type: 'Full-Fidelity Storage',
        examples: ['Cribl Lake', 'Amazon S3', 'Azure Blob'],
        strategy: 'Retain complete audit trail with all metadata. Drop only responseObject for non-sensitive resources (can be 10-100KB). Supports compliance, forensics, and platform debugging.',
        fieldCount: 30,
        estimatedReduction: '20-40% size reduction (responseObject trimming)',
        filters: [
          'Include ALL events at stage=ResponseComplete',
          'Retain requestObject for secrets, RBAC resources, and pods with exec/portforward',
          'Drop responseObject for all resources except secrets and RBAC (size optimization)',
          'Add Cribl processing metadata and security classification tags'
        ],
        excludedFields: ['responseObject (for non-sensitive resources)'],
        retentionGuidance: '30 days hot (Cribl Lake), 90 days warm (S3 Standard-IA), 365 days cold (S3 Glacier) for compliance'
      },
      {
        type: 'Cribl Search',
        examples: ['Cribl Search'],
        strategy: 'Full audit trail indexed for interactive investigation, RBAC troubleshooting, deployment history analysis, and security forensics. Filter to ResponseComplete stage to avoid duplicates.',
        fieldCount: 30,
        estimatedReduction: '0% — searchable full fidelity (ResponseComplete stage only)',
        filters: [
          'All ResponseComplete events searchable',
          'Optimized for user.username, objectRef.resource, objectRef.namespace, and verb queries',
          'Support sourceIPs and time-range searches',
          'Enable replay to SIEM when investigating cluster compromise'
        ],
        excludedFields: [],
        replayWorkflow: 'When cluster compromise is suspected, search audit logs for the compromised identity → trace all resource access → identify lateral movement (exec, secrets access) → replay attack chain to SIEM for correlation with network/endpoint data.'
      }
    ],
    costOptimization: {
      summary: 'Kubernetes audit logs are extremely high volume — a busy cluster generates 1,000-50,000 events/second. The vast majority are routine system component operations (watches, status patches, health checks) with no security or operational value for downstream analytics. By filtering to security-relevant events for SIEM and aggregating metrics for observability, customers typically achieve 90-97% reduction in analytics platform ingestion.',
      strategies: [
        { name: 'Stage Deduplication', description: 'Each API request generates multiple audit events (one per stage). Filter to stage=ResponseComplete only — it contains the final outcome and all metadata needed for detection.', impact: '50-75% event count reduction' },
        { name: 'Watch Event Suppression', description: 'verb=watch events represent long-lived connections that generate continuous audit records. They have near-zero security value and dominate volume in busy clusters.', impact: '20-40% remaining volume reduction' },
        { name: 'System Component Filtering', description: 'Filter out routine operations from system:kube-controller-manager, system:kube-scheduler, and system:node:* heartbeats for SIEM. These are expected control plane behavior.', impact: '30-50% SIEM volume reduction' },
        { name: 'ResponseObject Trimming', description: 'responseObject can be 10-100KB for large resources (ConfigMaps, Secrets contents). Strip responseObject for all but RBAC and secrets resources to dramatically reduce event size.', impact: '40-60% per-event size reduction' },
        { name: 'Read-Only Operation Sampling', description: 'Sample verb=get and verb=list operations from known service accounts at 1-5%. These are routine read patterns with value only during active investigations.', impact: '10-20% additional SIEM reduction' }
      ]
    },
    packFunctions: [
      { name: 'Break Event Batches', description: 'Handle both NDJSON (file backend) and EventList JSON array (webhook backend). Extract individual audit events from batch wrappers.' },
      { name: 'Extract Timestamps', description: 'Parse requestReceivedTimestamp to _time. Calculate request_latency_ms from stageTimestamp - requestReceivedTimestamp.' },
      { name: 'Filter to ResponseComplete', description: 'Drop events where stage != ResponseComplete to deduplicate across audit stages.' },
      { name: 'Flatten Critical Paths', description: 'Promote nested fields: k8s_user=user.username, k8s_resource=objectRef.resource, k8s_namespace=objectRef.namespace, k8s_verb=verb.' },
      { name: 'Classify Security Sensitivity', description: 'Tag events by security relevance: RBAC changes, secret access, exec/portforward as high; pod/deployment CRUD as medium; reads and watches as low.' },
      { name: 'Strip Large Objects', description: 'Remove requestObject and responseObject for non-sensitive resources. Retain for secrets, clusterroles, clusterrolebindings, and exec subresource.' },
      { name: 'Suppress System Noise', description: 'Drop or heavily sample system component heartbeats, watch renewals, and health check probes for non-full-fidelity destinations.' },
      { name: 'Shape for SIEM', description: 'Create security-optimized variant with user identity, resource targeting, RBAC decision, and source IP. Map to cloud security event schema.' },
      { name: 'Aggregate for Metrics', description: 'Create per-minute API server metrics: request count, latency percentiles, error rate by verb, resource, and response code class.' },
      { name: 'Shape for Full Fidelity', description: 'Preserve complete audit event with classification tags and latency calculation for Cribl Lake indexing.' }
    ]
  },
  'zscaler-web-logs': {
    sourceDescription: 'Zscaler Internet Access (ZIA) web transaction logs collected via Nanolog Streaming Service (NSS) into Cribl Stream',
    collectionMethod: 'Nanolog Streaming Service (NSS VM → Syslog TCP/TLS to Cribl) / Cloud NSS (HTTPS POST to Cribl HTTP source) / S3 Export (batch)',
    dataFlow: [
      { step: 1, name: 'Collect Once', description: 'Zscaler web logs received from NSS in JSON or CEF format. Single collection point replaces multiple SIEM-specific NSS feeds.' },
      { step: 2, name: 'Parse and Normalize', description: 'Cribl Pack parses JSON/CEF format, normalizes field names, converts datetime to _time, and casts numeric fields (reqsize, respsize, riskscore).' },
      { step: 3, name: 'Enrich and Classify', description: 'Add threat intel enrichment on hostname/URL, classify traffic by risk tier (threat detected, DLP match, policy block, routine allow), tag Shadow IT destinations.' },
      { step: 4, name: 'Route by Use Case', description: 'Fork events: threats/DLP/blocks to SIEM, bandwidth and error metrics to observability, all transactions to full-fidelity storage.' },
      { step: 5, name: 'Search and Replay', description: 'Full-fidelity web transactions indexed in Cribl Lake for user activity investigation, data exfiltration forensics, and compliance audit via Cribl Search.' }
    ],
    destinations: [
      {
        type: 'Security SIEM',
        examples: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Google Chronicle', 'Elastic Security'],
        strategy: 'Send threat detections, DLP matches, policy blocks, high risk scores, and SSL inspection bypasses. Drop routine allowed traffic to uncategorized/benign domains.',
        fieldCount: 24,
        estimatedReduction: '70-85% event reduction vs full fidelity',
        filters: [
          'Include all action=Blocked or action=Isolated events',
          'Include all events where threatname != None',
          'Include all events where dlpengine != None',
          'Include all events where riskscore > 50',
          'Include all events where sslinspection=No or sslinspection=Bypass',
          'Include all events to urlcategory in (Malware, Phishing, Botnet, C2, Hacking)',
          'Sample action=Allowed with riskscore=0 to benign categories at 1-5%'
        ],
        excludedFields: ['obfuscatedclientIP', 'obfuscatedcloudname', 'cloudname', 'productversion', 'pagerisk']
      },
      {
        type: 'Observability Platform',
        examples: ['Datadog', 'Dynatrace', 'New Relic', 'Grafana'],
        strategy: 'Aggregate bandwidth metrics (reqsize + respsize) per minute by department, urlcategory, and location. Send individual events for HTTP errors and latency spikes.',
        fieldCount: 10,
        estimatedReduction: '90-95% event reduction via aggregation',
        filters: [
          'Aggregate per minute: total bytes (req+resp), transaction count, error count by department, urlcategory, location',
          'Include all respcode >= 500 at full fidelity (upstream failures)',
          'Include all respcode=407 (proxy auth failures) at full fidelity',
          'Drop individual allowed transactions (covered by aggregation)',
          'Drop all threat/DLP fields for observability destinations'
        ],
        excludedFields: ['url', 'user', 'dlpengine', 'dlpdictionaries', 'threatname', 'threatclass', 'malwarecategory', 'malwareclass', 'clientprivateIP', 'deviceowner', 'sslprotocol', 'contenttype']
      },
      {
        type: 'Full-Fidelity Storage',
        examples: ['Cribl Lake', 'Amazon S3', 'Azure Blob'],
        strategy: 'Retain complete web transaction log with all fields for compliance, user activity forensics, and data exfiltration investigation. Supports regulatory requirements for web access logging.',
        fieldCount: 33,
        estimatedReduction: '0% — all fields retained',
        filters: [
          'Include ALL transactions regardless of action or risk',
          'Preserve all fields including full URL and user identity',
          'Add threat intel enrichments and Shadow IT classification',
          'Add Cribl processing metadata and routing tags'
        ],
        excludedFields: [],
        retentionGuidance: '30 days hot (Cribl Lake), 90 days warm (S3 Standard-IA), 365 days cold (S3 Glacier) for compliance'
      },
      {
        type: 'Cribl Search',
        examples: ['Cribl Search'],
        strategy: 'Full-fidelity web transaction logs indexed for interactive investigation, user browsing timeline reconstruction, data exfiltration analysis, and Shadow IT discovery.',
        fieldCount: 33,
        estimatedReduction: '0% — searchable full fidelity',
        filters: [
          'All transactions searchable with full field access',
          'Optimized for user, hostname, urlcategory, and time-range queries',
          'Support DLP and threat searches for incident response',
          'Enable replay to SIEM when investigating exfiltration or compromise'
        ],
        excludedFields: [],
        replayWorkflow: 'When data exfiltration is suspected, search all transactions for the user → filter to cloud storage and file sharing destinations → quantify upload volume → replay high-risk uploads to SIEM for correlation with DLP alerts.'
      }
    ],
    costOptimization: {
      summary: 'Zscaler web logs are extremely high volume — a 10,000-user organization generates 50-100 million transactions per day. The vast majority are routine allowed web browsing to benign destinations with zero security or operational value. By routing only threats, DLP matches, and policy violations to SIEM and aggregating bandwidth metrics for observability, customers typically achieve 80-90% reduction in analytics platform ingestion.',
      strategies: [
        { name: 'Action-Based Routing', description: 'Route Blocked/Isolated/Cautioned actions and threat detections to SIEM. Routine Allowed transactions to benign categories (News, Search Engines, CDN) have near-zero security value.', impact: '70-85% SIEM volume reduction' },
        { name: 'Risk Score Threshold', description: 'Only send events with riskscore > 0 to SIEM. Zero-risk transactions are confirmed benign by Zscaler inspection and carry no detection value.', impact: '60-75% additional filtering' },
        { name: 'URL Truncation', description: 'For non-security destinations, truncate URL to hostname only. Full URLs with query parameters can be 500+ characters and contain PII.', impact: '20-30% per-event size reduction' },
        { name: 'Bandwidth Aggregation', description: 'Roll up reqsize/respsize per minute by department and urlcategory for observability. One metric record per minute replaces thousands of individual transactions.', impact: '90-95% event reduction for observability' },
        { name: 'Duplicate Field Elimination', description: 'Remove obfuscatedclientIP and obfuscatedcloudname (empty in most configs), productversion (static), and pagerisk (redundant with riskscore).', impact: '5-10% per-event size reduction' }
      ]
    },
    packFunctions: [
      { name: 'Parse NSS Format', description: 'Parse JSON or CEF format from Nanolog Streaming Service. Handle both Cloud NSS (HTTP POST batches) and VM NSS (syslog-wrapped JSON).' },
      { name: 'Normalize Timestamps', description: 'Parse datetime field to _time. Handle multiple timestamp formats (ISO 8601, epoch seconds, Zscaler custom).' },
      { name: 'Cast Numeric Fields', description: 'Convert reqsize, respsize, riskscore, pagerisk to numeric types for proper aggregation and threshold comparison.' },
      { name: 'Threat Intel Enrichment', description: 'Enrich hostname against external threat feeds. Cross-reference with known malicious domains, newly registered domains, and DGA patterns.' },
      { name: 'Classify Shadow IT', description: 'Tag destinations as sanctioned, tolerated, or unsanctioned based on hostname/urlcategory lookup against approved SaaS inventory.' },
      { name: 'Compute Transfer Volume', description: 'Calculate total_bytes = reqsize + respsize. Tag large transfers (> 10MB) for data exfiltration monitoring.' },
      { name: 'Suppress Benign Traffic', description: 'Drop or heavily sample Allowed transactions with riskscore=0 to known-benign categories (CDN, OS Updates, Certificate Validation).' },
      { name: 'Shape for SIEM', description: 'Create security-optimized variant: threat indicators, DLP matches, policy violations, SSL bypass. Map to web proxy CIM schema.' },
      { name: 'Aggregate for Metrics', description: 'Create per-minute bandwidth and transaction count metrics by department, urlcategory, location, and response code class.' },
      { name: 'Shape for Full Fidelity', description: 'Preserve complete transaction with enrichments and classifications for Cribl Lake indexing and compliance storage.' }
    ]
  },
  'infoblox-dns': {
    sourceDescription: 'Infoblox NIOS DNS query logs and RPZ event logs collected via syslog or Infoblox Data Connector into Cribl Stream/Edge',
    collectionMethod: 'Syslog (UDP/TCP/TLS from NIOS members) / Infoblox Data Connector (BloxOne → S3 or HTTP) / File Monitor (Cribl Edge on /var/log/syslog with named process filter)',
    dataFlow: [
      { step: 1, name: 'Collect Once', description: 'Infoblox DNS logs ingested via syslog from NIOS Grid members. Single collection point eliminates per-member SIEM forwarding configurations.' },
      { step: 2, name: 'Parse and Normalize', description: 'Cribl Pack parses BIND-style query log format and RPZ action logs into structured fields. Normalizes timestamps, extracts query components, and handles multi-line RPZ events.' },
      { step: 3, name: 'Enrich and Classify', description: 'Add threat intel enrichment on query_name, compute entropy scores for DGA detection, tag internal vs external domains, correlate client_ip with DHCP leases for hostname resolution.' },
      { step: 4, name: 'Route by Use Case', description: 'Fork events: RPZ hits and threat indicators to SIEM, resolver health metrics to observability, all queries to full-fidelity storage.' },
      { step: 5, name: 'Search and Replay', description: 'Full-fidelity DNS queries indexed in Cribl Lake for threat hunting, DNS timeline reconstruction, and compliance audit via Cribl Search.' }
    ],
    destinations: [
      {
        type: 'Security SIEM',
        examples: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security'],
        strategy: 'Send RPZ blocks, threat defense alerts, high-entropy queries (DGA candidates), TXT/NULL record queries (tunneling indicators), and queries to newly-registered domains. Drop routine internal lookups.',
        fieldCount: 20,
        estimatedReduction: '85-95% event reduction vs full fidelity',
        filters: [
          'Include all events with rpz_policy IS NOT NULL (RPZ actions)',
          'Include all events with threat_indicator IS NOT NULL',
          'Include queries where query_type in (TXT, NULL, CNAME) with high subdomain entropy',
          'Include queries to external domains with response_code=NXDOMAIN (DGA signal)',
          'Include queries over TCP protocol (potential tunneling)',
          'Include queries from client_ip not in known DHCP ranges (rogue devices)',
          'Drop all queries to internal zones with response_code=NOERROR'
        ],
        excludedFields: ['edns_version', 'query_count', 'zone', 'member_name', 'dhcp_fingerprint', 'recursion']
      },
      {
        type: 'Observability Platform',
        examples: ['Datadog', 'Dynatrace', 'New Relic', 'Grafana'],
        strategy: 'Aggregate resolver metrics: query rate, response time percentiles, NXDOMAIN rate, SERVFAIL rate per minute by server_ip and view. Send individual events for SERVFAIL spikes indicating resolver health issues.',
        fieldCount: 10,
        estimatedReduction: '95-99% event reduction via aggregation',
        filters: [
          'Aggregate per minute: query count, response_time_ms percentiles, NXDOMAIN count, SERVFAIL count by server_ip, view',
          'Include all response_code=SERVFAIL events at full fidelity (resolver failures)',
          'Include all response_time_ms > 500 at full fidelity (slow queries)',
          'Drop individual NOERROR queries (covered by aggregation)',
          'Drop all RPZ and threat fields for observability destinations'
        ],
        excludedFields: ['query_name', 'client_ip', 'response_data', 'rpz_policy', 'rpz_action', 'rpz_trigger', 'rpz_hit_domain', 'threat_indicator', 'threat_confidence', 'mac_address', 'query_flags']
      },
      {
        type: 'Full-Fidelity Storage',
        examples: ['Cribl Lake', 'Amazon S3', 'Azure Blob'],
        strategy: 'Retain complete DNS query log with all fields and enrichments. Supports compliance, threat hunting (historical domain lookups), and incident response (full DNS timeline per client).',
        fieldCount: 29,
        estimatedReduction: '0% — all fields retained',
        filters: [
          'Include ALL queries regardless of response code or RPZ action',
          'Preserve all parsed fields including response_data',
          'Add threat intel enrichments (domain reputation, age, entropy)',
          'Add DHCP correlation (client hostname from lease table)'
        ],
        excludedFields: [],
        retentionGuidance: '30 days hot (Cribl Lake), 90 days warm (S3 Standard-IA), 365 days cold (S3 Glacier)'
      },
      {
        type: 'Cribl Search',
        examples: ['Cribl Search'],
        strategy: 'Full-fidelity DNS queries indexed for interactive threat hunting, domain lookup history, client activity timeline reconstruction, and RPZ policy effectiveness analysis.',
        fieldCount: 29,
        estimatedReduction: '0% — searchable full fidelity',
        filters: [
          'All queries searchable with full field access',
          'Optimized for client_ip, query_name, response_code, and time-range queries',
          'Support wildcard domain searches for threat hunting',
          'Enable replay to SIEM when investigating DNS-based attack chains'
        ],
        excludedFields: [],
        replayWorkflow: 'When C2 communication is suspected, search all queries from the affected client_ip → identify suspicious domains by entropy/RPZ hits → expand to all clients querying the same domains → replay affected queries to SIEM for correlation with endpoint/network data.'
      }
    ],
    costOptimization: {
      summary: 'Infoblox DNS logs are extremely high volume — a busy enterprise DNS infrastructure generates 10,000-100,000 queries per second. The vast majority are routine internal lookups (Active Directory, internal services, PTR records) with no security or operational value. By routing only threat-relevant queries to SIEM and aggregating resolver metrics for observability, customers typically achieve 90-98% reduction in analytics platform ingestion.',
      strategies: [
        { name: 'Internal Zone Suppression', description: 'Drop queries to internal zones (.corp.local, .internal, AD _msdcs) with NOERROR responses. These are routine service discovery with near-zero security value.', impact: '50-70% total volume reduction' },
        { name: 'PTR Record Filtering', description: 'Drop or heavily sample PTR (reverse lookup) queries. These are high-volume, low-value operational noise from logging systems and monitoring tools.', impact: '10-20% volume reduction' },
        { name: 'RPZ-Focused SIEM Routing', description: 'Only send RPZ hits and threat defense alerts to SIEM at full fidelity. All other queries go to Lake only for investigation replay.', impact: '85-95% SIEM volume reduction' },
        { name: 'Resolver Metric Aggregation', description: 'Roll up query counts, latency percentiles, and error rates per minute per server for observability. One metric record replaces thousands of individual queries.', impact: '95-99% event reduction for observability' },
        { name: 'Response Data Trimming', description: 'Strip response_data for non-security destinations. A records with IP answers add event size but provide no value for metrics or routine monitoring.', impact: '10-15% per-event size reduction' }
      ]
    },
    packFunctions: [
      { name: 'Parse BIND Query Log', description: 'Parse Infoblox BIND-style query log format: extract timestamp, client_ip, client_port, query_name, query_type, query_class, flags, and server reference.' },
      { name: 'Parse RPZ Events', description: 'Parse RPZ action logs: extract policy name, action, trigger type, hit domain, and rewrite target. Handle multi-line RPZ events.' },
      { name: 'Normalize Timestamps', description: 'Parse NIOS timestamp format (DD-Mon-YYYY HH:MM:SS.ms) to _time. Handle timezone from Grid member configuration.' },
      { name: 'Compute Domain Entropy', description: 'Calculate Shannon entropy of query_name subdomains for DGA detection. Flag queries exceeding entropy threshold.' },
      { name: 'Threat Intel Lookup', description: 'Enrich query_name against threat intelligence feeds (malicious domains, newly-registered domains, known C2 infrastructure).' },
      { name: 'DHCP Correlation', description: 'Lookup client_ip against DHCP lease table to add client hostname, MAC address, and device fingerprint. Provides identity context for DNS queries.' },
      { name: 'Classify Query Type', description: 'Tag queries as internal (corp zones), external-benign (known good), external-suspicious (high entropy, new domains, uncommon TLDs).' },
      { name: 'Suppress Internal Noise', description: 'Drop or sample routine internal zone lookups (AD, _msdcs, PTR for RFC1918) for non-full-fidelity destinations.' },
      { name: 'Shape for SIEM', description: 'Create security-optimized variant: RPZ hits, threat indicators, high-entropy queries, unusual query types. Map to DNS security event schema.' },
      { name: 'Aggregate for Metrics', description: 'Create per-minute resolver metrics: query rate, latency percentiles, NXDOMAIN rate, SERVFAIL rate by server_ip, view, and query type.' }
    ]
  },
  'linux-auditd': {
    sourceDescription: 'Linux Audit Framework (auditd) logs collected from /var/log/audit/audit.log via Cribl Edge or audisp remote plugin',
    collectionMethod: 'Cribl Edge (File Monitor on /var/log/audit/audit.log) / audisp-remote plugin (syslog TCP/TLS) / rsyslog imfile module',
    dataFlow: [
      { step: 1, name: 'Collect Once', description: 'Auditd logs collected from /var/log/audit/audit.log by Cribl Edge on each host. Single agent replaces per-host syslog forwarder configurations.' },
      { step: 2, name: 'Parse and Reassemble', description: 'Cribl Pack reassembles multi-record audit events (SYSCALL+EXECVE+PATH+CWD) by shared audit serial number. Parses key=value format into named fields.' },
      { step: 3, name: 'Enrich and Classify', description: 'Map numeric syscall to name, decode hex-encoded proctitle, resolve uid/auid to usernames, classify events by security relevance (execve, file access, network, auth).' },
      { step: 4, name: 'Route by Use Case', description: 'Fork events: process execution and auth events to SIEM, syscall metrics to observability, all events to full-fidelity storage for forensics.' },
      { step: 5, name: 'Search and Replay', description: 'Full-fidelity audit trail indexed in Cribl Lake for process tree reconstruction, file access forensics, and compliance audit via Cribl Search.' }
    ],
    destinations: [
      {
        type: 'Security SIEM',
        examples: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security'],
        strategy: 'Send process execution (execve), privilege escalation (setuid), authentication events, file access to sensitive paths, network connections to external IPs, and kernel module loads. Drop routine reads from trusted processes.',
        fieldCount: 22,
        estimatedReduction: '70-85% event reduction vs full fidelity',
        filters: [
          'Include all syscall=59 (execve) events — full command execution',
          'Include all type=USER_AUTH, USER_CMD, USER_ACCT events',
          'Include file access to sensitive paths (/etc/passwd, /etc/shadow, SSH keys, crontabs)',
          'Include all syscall=42 (connect) to external IPs',
          'Include all events with euid=0 where auid!=0 (privilege escalation)',
          'Include all kernel module load events (init_module, finit_module)',
          'Drop routine file reads from expected system processes (systemd, crond, rsyslogd)'
        ],
        excludedFields: ['arch', 'a0-a3 (raw hex)', 'items', 'path_inode', 'ogid', 'ouid', 'dev', 'rdev']
      },
      {
        type: 'Observability Platform',
        examples: ['Datadog', 'Dynatrace', 'New Relic', 'Grafana'],
        strategy: 'Aggregate syscall metrics per minute by host: execve count, failed syscall rate, file access rate, network connection rate. Send individual events for high-frequency failures indicating resource issues.',
        fieldCount: 10,
        estimatedReduction: '90-95% event reduction via aggregation',
        filters: [
          'Aggregate per minute: execve count, failed syscall count, connect count by hostname',
          'Include all events with success=no and exit=-13 (EACCES) at full fidelity',
          'Include events with exit=-28 (ENOSPC) indicating disk full conditions',
          'Drop all individual successful read/open events for observability',
          'Drop all PATH, CWD, PROCTITLE records (merged into parent)'
        ],
        excludedFields: ['subj', 'ses', 'tty', 'key', 'cwd', 'path_mode', 'proctitle', 'argc', 'a0_a3']
      },
      {
        type: 'Full-Fidelity Storage',
        examples: ['Cribl Lake', 'Amazon S3', 'Azure Blob'],
        strategy: 'Retain complete reassembled audit events with all records merged. Supports compliance requirements (PCI 10.2, SOX, HIPAA), process tree forensics, and file integrity monitoring.',
        fieldCount: 27,
        estimatedReduction: '0% — all fields retained',
        filters: [
          'Include ALL audit events fully reassembled',
          'Preserve complete EXECVE argument chains',
          'Preserve all PATH records with inode and mode data',
          'Add uid-to-username resolution and syscall name mapping'
        ],
        excludedFields: [],
        retentionGuidance: '30 days hot (Cribl Lake), 90 days warm (S3 Standard-IA), 365+ days cold (S3 Glacier) for compliance'
      },
      {
        type: 'Cribl Search',
        examples: ['Cribl Search'],
        strategy: 'Full audit trail indexed for interactive investigation, process tree reconstruction, file access timeline, and user activity forensics.',
        fieldCount: 27,
        estimatedReduction: '0% — searchable full fidelity',
        filters: [
          'All reassembled audit events searchable',
          'Optimized for exe, comm, auid, key, and time-range queries',
          'Support process ancestry reconstruction via ppid chains',
          'Enable replay to SIEM when investigating host compromise'
        ],
        excludedFields: [],
        replayWorkflow: 'When host compromise is suspected, search all audit events for the host → reconstruct process tree from initial access → trace file modifications and network connections → replay attack chain to SIEM.'
      }
    ],
    costOptimization: {
      summary: 'Linux auditd generates extremely high volume on busy servers — a typical production host produces 50,000-500,000 events per day depending on audit rule configuration. Most volume comes from routine system process activity (file reads, socket operations) with zero security or operational value. By focusing on process execution and critical file access for SIEM, customers achieve 70-90% reduction.',
      strategies: [
        { name: 'Execve-Focused SIEM', description: 'Only send process execution (syscall=59) events to SIEM at full fidelity. This captures all commands run on the system — the highest-value security data.', impact: '60-80% SIEM volume reduction' },
        { name: 'Multi-Record Reassembly', description: 'Merge SYSCALL+EXECVE+PATH+CWD+PROCTITLE into single events at pipeline level. Eliminates 3-5x event multiplication from multi-record format.', impact: '60-80% event count reduction' },
        { name: 'System Process Exclusion', description: 'Suppress audit events from trusted system processes (systemd, rsyslogd, crond, journald) that perform predictable, high-volume operations.', impact: '30-50% remaining volume reduction' },
        { name: 'Sensitive Path Focus', description: 'Only send file access events for sensitive paths (/etc/shadow, SSH keys, sudoers, crontabs) to SIEM. Drop routine reads to non-sensitive files.', impact: '40-60% file access event reduction' },
        { name: 'Hex Decode at Pipeline', description: 'Decode hex-encoded proctitle and arguments at Cribl pipeline rather than forcing every downstream tool to decode. Reduces downstream parsing cost.', impact: 'Processing efficiency gain' }
      ]
    },
    packFunctions: [
      { name: 'Reassemble Multi-Record Events', description: 'Group audit records by msg=audit(timestamp:serial) into single events. Merge SYSCALL, EXECVE, PATH, CWD, and PROCTITLE into unified event.' },
      { name: 'Parse Key-Value Pairs', description: 'Parse auditd key=value format into structured fields. Handle hex-encoded values and quoted strings.' },
      { name: 'Decode Hex Fields', description: 'Decode hex-encoded proctitle, EXECVE arguments (a0, a1, a2...), and PATH names to human-readable strings.' },
      { name: 'Map Syscall Numbers', description: 'Convert numeric syscall field to human-readable name (59→execve, 2→open, 42→connect, 175→init_module).' },
      { name: 'Resolve UID/GID', description: 'Map numeric uid, auid, euid to username and gid to group name using lookup table from /etc/passwd and /etc/group.' },
      { name: 'Classify Event Type', description: 'Tag events by category: process_execution, file_access, network_connection, authentication, privilege_change, kernel_module based on syscall and type.' },
      { name: 'Filter by Audit Key', description: 'Route events based on audit rule key field — different keys map to different severity and destination requirements.' },
      { name: 'Suppress System Noise', description: 'Drop or sample routine operations from known system processes to non-sensitive files for non-full-fidelity destinations.' },
      { name: 'Shape for SIEM', description: 'Create security-optimized variant with full command line, user context, file targets, and network destinations. Map to process execution CIM schema.' },
      { name: 'Aggregate for Metrics', description: 'Create per-minute host metrics: execve count, failed syscall rate, unique users, network connection count by hostname.' }
    ]
  },
  'linux-auth': {
    sourceDescription: 'Linux authentication logs from /var/log/secure (RHEL) or /var/log/auth.log (Debian/Ubuntu) collected via Cribl Edge or rsyslog',
    collectionMethod: 'Cribl Edge (File Monitor on /var/log/secure or /var/log/auth.log) / rsyslog TCP/TLS forwarding / journald export (journalctl -u sshd -u sudo)',
    dataFlow: [
      { step: 1, name: 'Collect Once', description: 'Auth logs collected from each host by Cribl Edge file monitor. Single collection replaces per-host syslog forwarding to multiple destinations.' },
      { step: 2, name: 'Parse and Extract', description: 'Cribl Pack parses syslog format and applies process-specific regex extraction for sshd, sudo, su, PAM, and account management events.' },
      { step: 3, name: 'Enrich and Classify', description: 'Add GeoIP on source_ip, classify auth events by result (success/failure/invalid), tag sudo commands by risk level, resolve internal IPs to hostnames.' },
      { step: 4, name: 'Route by Use Case', description: 'Fork events: auth failures and privilege usage to SIEM, auth success rates and session metrics to observability, all events to full-fidelity storage.' },
      { step: 5, name: 'Search and Replay', description: 'Full auth history indexed in Cribl Lake for session timeline reconstruction, lateral movement analysis, and compliance access audit via Cribl Search.' }
    ],
    destinations: [
      {
        type: 'Security SIEM',
        examples: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security'],
        strategy: 'Send all auth failures, invalid user attempts, sudo commands, su sessions, account modifications, and successful SSH from external IPs. Sample routine internal successful auths.',
        fieldCount: 16,
        estimatedReduction: '40-60% event reduction vs full fidelity',
        filters: [
          'Include all auth_result=Failed or auth_result="Invalid user"',
          'Include all sudo command executions',
          'Include all su session events',
          'Include all account modification events (useradd, usermod, userdel, passwd)',
          'Include SSH success from external/untrusted IPs',
          'Include all disconnect_reason="too many authentication failures"',
          'Sample successful SSH from known internal IPs at 10-20%'
        ],
        excludedFields: ['pid', 'pam_module (except for failure context)']
      },
      {
        type: 'Observability Platform',
        examples: ['Datadog', 'Dynatrace', 'New Relic', 'Grafana'],
        strategy: 'Aggregate auth metrics per minute by host: success count, failure count, unique users, session count. Send individual events for lockouts and disconnect spikes.',
        fieldCount: 8,
        estimatedReduction: '70-85% event reduction via aggregation',
        filters: [
          'Aggregate per minute: auth success/failure count, unique users, session opens/closes by hostname',
          'Include all events with disconnect_reason at full fidelity (connection issues)',
          'Include session duration metrics (opened→closed time delta)',
          'Drop individual successful auth events (covered by aggregation)',
          'Drop SSH key fingerprints and PAM module details'
        ],
        excludedFields: ['ssh_key_fingerprint', 'pam_module', 'source_port', 'tty', 'pwd', 'command']
      },
      {
        type: 'Full-Fidelity Storage',
        examples: ['Cribl Lake', 'Amazon S3', 'Azure Blob'],
        strategy: 'Retain complete auth log with all fields for compliance access auditing, lateral movement forensics, and session timeline reconstruction.',
        fieldCount: 19,
        estimatedReduction: '0% — all fields retained',
        filters: [
          'Include ALL auth events regardless of result',
          'Preserve full sudo command lines',
          'Preserve SSH key fingerprints for key audit',
          'Add GeoIP enrichment on source_ip'
        ],
        excludedFields: [],
        retentionGuidance: '30 days hot (Cribl Lake), 90 days warm (S3 Standard-IA), 365+ days cold (S3 Glacier) for compliance'
      },
      {
        type: 'Cribl Search',
        examples: ['Cribl Search'],
        strategy: 'Full auth history indexed for user activity investigation, lateral movement tracing (SSH hopping), and privilege escalation forensics.',
        fieldCount: 19,
        estimatedReduction: '0% — searchable full fidelity',
        filters: [
          'All auth events searchable with full field access',
          'Optimized for user, source_ip, hostname, and time-range queries',
          'Support lateral movement tracing (user→host→user→host chains)',
          'Enable replay to SIEM when investigating credential compromise'
        ],
        excludedFields: [],
        replayWorkflow: 'When credential compromise is suspected, search all auth events for the user → map every host accessed → trace sudo commands on each host → identify lateral movement path → replay to SIEM for endpoint correlation.'
      }
    ],
    costOptimization: {
      summary: 'Linux auth logs are moderate volume — a typical environment generates 1,000-50,000 events per day per host depending on SSH exposure and automation activity. The main reduction opportunity is sampling routine successful internal auths (automation/cron) while retaining all failures and privilege usage at full fidelity.',
      strategies: [
        { name: 'Sample Internal Success', description: 'Sample successful SSH from known internal IPs and automation accounts at 10-20%. These are expected operations with value only during active investigation.', impact: '30-50% volume reduction' },
        { name: 'Suppress Cron Sessions', description: 'Filter PAM session opened/closed events for crond — these fire every minute per cron job and carry zero security value.', impact: '10-30% volume reduction (varies by cron load)' },
        { name: 'Aggregate Auth Metrics', description: 'Roll up success/failure counts per minute per host for observability. Individual events add no value for trend dashboards.', impact: '70-85% event reduction for observability' },
        { name: 'Compress Brute Force', description: 'During active brute force, compress 1000s of "Failed password" events into summary events (source_ip, attempt_count, time_window) rather than forwarding each individually.', impact: '90-99% reduction during active attacks' },
        { name: 'PAM Module Trimming', description: 'Remove verbose PAM module details from events sent to observability. pam_unix/pam_sss details are only needed for auth troubleshooting.', impact: '5-10% per-event size reduction' }
      ]
    },
    packFunctions: [
      { name: 'Parse Syslog Header', description: 'Extract timestamp, hostname, process, and PID from standard syslog format. Handle both RFC 3164 and RFC 5424.' },
      { name: 'Classify Auth Event', description: 'Identify event type based on process and message pattern: SSH auth, sudo command, su switch, account management, PAM session, cron auth.' },
      { name: 'Extract SSH Fields', description: 'Parse sshd messages for auth_result, auth_method, user, source_ip, source_port, and key fingerprint.' },
      { name: 'Extract Sudo Fields', description: 'Parse sudo log lines for user, target_user (USER=), command (COMMAND=), tty (TTY=), and working directory (PWD=).' },
      { name: 'GeoIP on Source IP', description: 'Add geographic context to source_ip for SSH connections. Tag internal vs external origin.' },
      { name: 'Tag Auth Result', description: 'Normalize auth results to standard values: success, failure, invalid_user, locked_out, timeout.' },
      { name: 'Suppress Cron Noise', description: 'Identify and suppress or sample PAM session events from crond for non-full-fidelity destinations.' },
      { name: 'Compress Brute Force', description: 'Detect brute force patterns (>10 failures from same IP in 1 minute) and compress into summary events.' },
      { name: 'Shape for SIEM', description: 'Create security-optimized variant with normalized auth fields. Map to authentication CIM schema.' },
      { name: 'Aggregate for Metrics', description: 'Create per-minute auth metrics: success/failure count, unique users, active sessions by hostname.' }
    ]
  },
  'linux-syslog': {
    sourceDescription: 'Linux system logs from /var/log/messages or /var/log/syslog and systemd journald covering kernel, systemd, and service messages',
    collectionMethod: 'Cribl Edge (File Monitor on /var/log/messages or /var/log/syslog) / rsyslog TCP/TLS / journald-upload / systemd-journal-remote',
    dataFlow: [
      { step: 1, name: 'Collect Once', description: 'System logs collected from each host by Cribl Edge file monitor or centralized rsyslog. Single collection point serves all downstream analytics.' },
      { step: 2, name: 'Parse and Classify', description: 'Cribl Pack parses syslog format, extracts facility/severity, and applies event-type-specific parsing for kernel messages, systemd events, and service logs.' },
      { step: 3, name: 'Enrich and Tag', description: 'Add host metadata (environment, role, criticality), extract structured data from kernel messages (OOM details, disk errors, network state), classify severity.' },
      { step: 4, name: 'Route by Use Case', description: 'Fork events: SELinux denials and security-relevant kernel messages to SIEM, service health and resource metrics to observability, all events to full-fidelity storage.' },
      { step: 5, name: 'Search and Replay', description: 'Full system log history indexed in Cribl Lake for root cause analysis, service failure investigation, and infrastructure forensics via Cribl Search.' }
    ],
    destinations: [
      {
        type: 'Security SIEM',
        examples: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security'],
        strategy: 'Send SELinux/AppArmor denials, kernel security events (module loads, capability changes), suspicious process crashes (SIGSEGV on security tools), and service state changes for critical services.',
        fieldCount: 16,
        estimatedReduction: '85-95% event reduction vs full fidelity',
        filters: [
          'Include all SELinux/AppArmor denial events',
          'Include kernel messages about module load/unload',
          'Include service failures for security-critical services (sshd, auditd, iptables, firewalld)',
          'Include all severity=emerg, alert, or crit events',
          'Include OOM kills (potential resource exhaustion attack)',
          'Drop routine service start/stop for non-critical services',
          'Drop kernel informational messages (hardware enumeration, driver load)'
        ],
        excludedFields: ['kernel_timestamp', 'filesystem_type', 'oom_score', 'pid']
      },
      {
        type: 'Observability Platform',
        examples: ['Datadog', 'Dynatrace', 'New Relic', 'Grafana'],
        strategy: 'Send service lifecycle events (start/stop/fail), OOM kills, disk errors, network state changes, and aggregated system health metrics. Primary source for infrastructure monitoring.',
        fieldCount: 18,
        estimatedReduction: '50-70% event reduction (retain operational events)',
        filters: [
          'Include all systemd unit start/stop/fail events',
          'Include all OOM kill events with full detail',
          'Include all disk I/O errors and filesystem errors',
          'Include all network interface state changes',
          'Include all severity=err or worse',
          'Drop kernel debug and informational messages',
          'Drop SELinux context details (security only)'
        ],
        excludedFields: ['selinux_context', 'subj']
      },
      {
        type: 'Full-Fidelity Storage',
        examples: ['Cribl Lake', 'Amazon S3', 'Azure Blob'],
        strategy: 'Retain complete system log with all messages for root cause analysis, infrastructure forensics, and hardware failure investigation.',
        fieldCount: 24,
        estimatedReduction: '0% — all fields retained',
        filters: [
          'Include ALL system messages regardless of severity',
          'Preserve kernel timestamps for event sequencing',
          'Preserve full OOM detail (vm sizes, rss, score)',
          'Add host metadata enrichment (role, environment, criticality)'
        ],
        excludedFields: [],
        retentionGuidance: '14 days hot (Cribl Lake), 30 days warm (S3 Standard-IA), 90 days cold (S3 Glacier)'
      },
      {
        type: 'Cribl Search',
        examples: ['Cribl Search'],
        strategy: 'Full system log indexed for root cause analysis, correlating service failures with resource exhaustion, and infrastructure incident investigation.',
        fieldCount: 24,
        estimatedReduction: '0% — searchable full fidelity',
        filters: [
          'All system messages searchable',
          'Optimized for hostname, systemd_unit, severity, and time-range queries',
          'Support kernel message pattern searches',
          'Enable replay when investigating infrastructure incidents'
        ],
        excludedFields: [],
        replayWorkflow: 'When service outage occurs, search system logs for the affected host → correlate OOM kills, disk errors, and network state → identify root cause → replay related events to observability platform for dashboard context.'
      }
    ],
    costOptimization: {
      summary: 'Linux system logs are high volume — a typical server generates 10,000-200,000 messages per day. Most volume comes from kernel informational messages, routine service activity, and debug-level output with zero operational value for analytics. By routing only actionable events (failures, state changes, resource exhaustion) customers achieve 60-90% reduction.',
      strategies: [
        { name: 'Severity-Based Routing', description: 'Only send severity=err, crit, alert, emerg to SIEM and observability. Info and debug messages have near-zero detection or operational value in downstream analytics.', impact: '60-80% volume reduction' },
        { name: 'Kernel Message Filtering', description: 'Drop kernel informational messages (hardware enumeration, driver initialization, USB device detection) for all non-full-fidelity destinations.', impact: '20-40% volume reduction' },
        { name: 'Systemd Lifecycle Focus', description: 'Only send systemd events for state changes (start, stop, fail, restart). Drop activation/deactivation intermediate states and slice/scope events.', impact: '15-25% volume reduction' },
        { name: 'Service Allowlist', description: 'For SIEM destinations, only forward system logs for security-critical services (sshd, auditd, firewalld, aide). Non-critical service logs go to observability only.', impact: '30-50% SIEM reduction' },
        { name: 'OOM/Disk Error Priority', description: 'Always send OOM kills and disk errors at full fidelity regardless of other filters — these are high-value, low-volume events critical for both security and ops.', impact: 'Quality improvement (no volume reduction)' }
      ]
    },
    packFunctions: [
      { name: 'Parse Syslog Format', description: 'Parse RFC 3164 and RFC 5424 syslog headers. Extract timestamp, hostname, facility, severity, process, PID.' },
      { name: 'Classify Event Category', description: 'Categorize messages: kernel, systemd_lifecycle, oom_kill, disk_error, network_state, selinux, service_crash, package_manager.' },
      { name: 'Extract OOM Details', description: 'Parse OOM killer messages for process name, PID, total-vm, anon-rss, oom_score_adj, and triggering allocation.' },
      { name: 'Extract Disk Errors', description: 'Parse disk I/O error messages for device, error type, sector, and filesystem context.' },
      { name: 'Extract Network State', description: 'Parse network interface messages for interface name, state change (up/down), link speed, and carrier state.' },
      { name: 'Extract SELinux Denials', description: 'Parse SELinux AVC denial messages for source context, target context, permission, and class.' },
      { name: 'Extract Systemd Events', description: 'Parse systemd unit lifecycle messages for unit name, action (start/stop/fail), exit code, and signal.' },
      { name: 'Host Metadata Enrichment', description: 'Add host role, environment, criticality tier, and team ownership from lookup table.' },
      { name: 'Severity-Based Routing', description: 'Tag events for destination routing based on severity threshold and event category.' },
      { name: 'Shape for SIEM', description: 'Create security-optimized variant with SELinux denials, kernel security events, and critical service failures.' }
    ]
  },
  'f5-bigip-ltm': {
    sourceDescription: 'F5 BIG-IP LTM logs collected via High-Speed Logging (HSL) syslog, iRule-generated logs, or REST API into Cribl Stream/Edge',
    collectionMethod: 'Syslog HSL (UDP/TCP) for data plane, REST API for management plane, iRule logging for custom application-layer visibility',
    dataFlow: [
      { step: 1, action: 'Collect', description: 'Receive F5 BIG-IP HSL syslog streams (typically high volume on dedicated syslog VIPs) and iRule-generated application logs via Cribl Stream/Edge syslog source.' },
      { step: 2, action: 'Parse & Classify', description: 'Parse mixed F5 log formats: HSL key=value pairs, iRule JSON/KV logs, system-level syslog. Classify by virtual server, log type (access, error, health, security), and iRule name.' },
      { step: 3, action: 'Enrich', description: 'Add backend service metadata, application tier classification, client GeoIP, and threat intelligence lookups on client_ip and x_forwarded_for.' },
      { step: 4, action: 'Route & Reduce', description: 'Route WAF/security events to SIEM at full fidelity. Route latency/health events to observability. Aggregate high-volume successful requests (200s) to reduce volume while preserving errors and anomalies.' }
    ],
    destinations: [
      {
        name: 'Security SIEM',
        purpose: 'WAF violations, suspicious request patterns, SSL anomalies, bot detection, DDoS indicators',
        routingLogic: 'Send all events where waf_violation is present, http_status >= 400, ssl_handshake_failure is present, or connection_count exceeds threshold. Include full request details (URI, headers, client_ip, user_agent).',
        volumeReduction: '60-75% reduction — only security-relevant requests forwarded',
        format: 'JSON with normalized field names, threat intelligence enrichment, and client reputation scoring'
      },
      {
        name: 'Observability Platform',
        purpose: 'Response time tracking, backend health monitoring, error rate analysis, connection capacity planning',
        routingLogic: 'Send all events with pool_member_status changes, health_monitor events, response_time_ms > threshold, http_status 5xx, and sampled baseline of successful requests for latency percentile calculation.',
        volumeReduction: '50-70% reduction — aggregate successful requests, keep all errors and health changes',
        format: 'Metrics-optimized: response_time_ms, bytes_in/out, connection_count as numeric fields, pool/member/virtual_server as dimensions'
      },
      {
        name: 'Cribl Lake (Full Fidelity)',
        purpose: 'Complete request archive for forensics, compliance, troubleshooting session-level issues, and post-incident reconstruction',
        routingLogic: 'All events stored in original fidelity with enrichments added. Partitioned by virtual_server and date for efficient search.',
        volumeReduction: 'No reduction — full archive with 90-365 day retention',
        format: 'Original log format preserved with enrichment fields added, Parquet storage in Lake'
      },
      {
        name: 'Real-Time Alerting',
        purpose: 'Immediate notification for pool member failures, connection exhaustion, WAF blocks, and certificate issues',
        routingLogic: 'Send when: pool_member_status transitions to down, connection_count > 80% of connection_limit, waf_action="blocked" for critical violations, or ssl_handshake_failure rate exceeds threshold.',
        volumeReduction: '95%+ reduction — only actionable alerts forwarded',
        format: 'Structured alert payload with severity, affected service, and recommended action'
      }
    ],
    costOptimization: {
      strategy: 'F5 HSL generates massive volume for high-traffic virtual servers. Key optimizations: 1) Aggregate successful 200-level responses into time-bucketed summaries (count, avg latency, p95 latency per virtual_server+pool), reducing 90%+ of volume. 2) Suppress repetitive health check pass events (only forward state changes). 3) Sample low-value successful requests at 1:100 while keeping all errors at full fidelity. 4) Drop client_port and snat_ip fields from security/observability routes.',
      estimatedSavings: '60-80% ingestion reduction to paid destinations while maintaining 100% visibility for errors, security events, and health state changes',
      implementationNotes: 'Use Cribl Stream aggregation function for time-bucketed metrics. Configure separate HSL profiles on F5 for access logs vs health monitor logs to enable per-type routing. Consider iRule-level filtering for extremely high-volume virtual servers to reduce pipeline load.'
    },
    packFunctions: [
      { name: 'Parse HSL Key-Value', description: 'Parse F5 High-Speed Logging key=value format into structured fields. Handle variable field ordering and multi-value fields.' },
      { name: 'Parse iRule JSON', description: 'Parse JSON-formatted iRule logs with nested objects for request/response headers, timing breakdowns, and custom application fields.' },
      { name: 'Normalize HTTP Status', description: 'Categorize http_status into groups (2xx, 3xx, 4xx, 5xx) and add status_category field for efficient aggregation.' },
      { name: 'Calculate Response Tiers', description: 'Add response_tier field based on response_time_ms: fast (<100ms), normal (100-500ms), slow (500-2000ms), critical (>2000ms).' },
      { name: 'GeoIP Client Enrichment', description: 'Apply GeoIP to client_ip and x_forwarded_for, selecting the correct field based on deployment topology.' },
      { name: 'Backend Service Lookup', description: 'Map pool_name and server_ip to application service name, owning team, environment, and criticality tier.' },
      { name: 'Aggregate Successful Requests', description: 'Roll up successful (2xx) requests into time-bucketed summaries: count, avg/p50/p95/p99 response_time, total bytes, by virtual_server+pool+http_host.' },
      { name: 'Suppress Health Check Noise', description: 'Deduplicate repetitive health monitor pass events — only emit on state transitions (up→down, down→up) or new check failures.' },
      { name: 'WAF Event Enrichment', description: 'Add OWASP category mapping, attack severity classification, and recommended response action to WAF violation events.' },
      { name: 'SSL/TLS Security Assessment', description: 'Flag deprecated protocols (TLS 1.0/1.1), weak ciphers, and certificate issues. Add compliance_status field.' }
    ]
  },
  'active-directory': {
    sourceDescription: 'Windows Active Directory Security and Directory Service event logs collected via Windows Event Forwarding (WEF), Cribl Edge agent, or log forwarders into Cribl Stream',
    collectionMethod: 'Windows Event Forwarding (WEF) to Cribl Stream, Cribl Edge agent with Windows Event Log input, or third-party forwarders (NXLog, Winlogbeat)',
    dataFlow: [
      { step: 1, action: 'Collect', description: 'Receive Windows Event Log (EVTX/XML) from domain controllers via WEF subscriptions or Cribl Edge agents. Key channels: Security, Directory Service, DNS Server, Group Policy Operational.' },
      { step: 2, action: 'Parse & Classify', description: 'Parse Windows Event XML into structured fields. Classify by EventID into categories: authentication (4624-4634, 4648), Kerberos (4768-4776), account management (4720-4738), group changes (4727-4756), object access (4662, 5136-5141), replication (4928-4931).' },
      { step: 3, action: 'Enrich', description: 'Add account type classification (privileged/service/standard), resolve SIDs to names, add host criticality, map EventIDs to human-readable action descriptions, and correlate logon sessions.' },
      { step: 4, action: 'Route & Reduce', description: 'Route high-value security events (Kerberos anomalies, privilege changes, replication requests) to SIEM. Route DC health/replication metrics to observability. Suppress high-volume expected events (Type 3 machine logons, service ticket auto-renewals).' }
    ],
    destinations: [
      {
        name: 'Security SIEM',
        purpose: 'Authentication attacks, privilege escalation, Kerberos abuse (Golden/Silver Ticket, Kerberoasting), lateral movement, persistence mechanisms',
        routingLogic: 'Send all: failed logons (4625), Kerberos TGT/TGS with RC4 encryption (4768/4769 with 0x17), privilege assigned (4672), group membership changes (4728/4732/4756), account creation/modification (4720/4738), replication from non-DC sources (4662 with replication GUIDs), GPO modifications (5136 on groupPolicyContainer), NTLM authentication in Kerberos-only environments.',
        volumeReduction: '70-85% reduction — suppress routine machine logons, Kerberos renewals, and expected service ticket activity',
        format: 'JSON with flattened EventData, enriched account classifications, and MITRE ATT&CK technique tagging'
      },
      {
        name: 'Observability Platform',
        purpose: 'Domain controller health, replication latency, authentication performance, account lockout rates, GPO application success',
        routingLogic: 'Send replication events (1566, 1988, 4928-4931), DC connectivity events, authentication rate metrics (aggregated logon success/failure by DC), account lockout events (4740), and Group Policy processing events.',
        volumeReduction: '80-90% reduction — aggregate authentication into per-DC metrics, only forward health state changes',
        format: 'Metrics-optimized: auth_success_count, auth_failure_count, replication_latency_ms as numeric fields per DC per time window'
      },
      {
        name: 'Cribl Lake (Full Fidelity)',
        purpose: 'Complete audit trail for forensics, compliance (SOX, HIPAA, PCI), investigations, and historical behavior analysis',
        routingLogic: 'All security-relevant events stored at full fidelity. Suppress only: Kerberos service ticket renewals for machine accounts, repeated lockout notifications (keep first + last), and LSASS debug events.',
        volumeReduction: '20-40% reduction — minimal suppression for compliance archive',
        format: 'Original Windows Event XML preserved alongside parsed JSON variant, Parquet storage in Lake partitioned by event_channel and date'
      },
      {
        name: 'Real-Time Alerting',
        purpose: 'Immediate notification for critical identity attacks: DCSync, Golden Ticket, Domain Admin group changes, mass lockouts',
        routingLogic: 'Send when: replication requested from non-DC (DCSync), Domain Admins/Enterprise Admins membership changed, encryption downgrade to RC4 on privileged accounts, 50+ lockouts in 5 minutes (password spray), or GPO linked to domain root modified.',
        volumeReduction: '99%+ reduction — only critical identity attack indicators',
        format: 'Structured alert with severity, MITRE technique, affected accounts, and recommended response action'
      }
    ],
    costOptimization: {
      strategy: 'Active Directory generates massive volume from routine operations. Key optimizations: 1) Suppress Type 3 (Network) machine-to-machine logons for known service pairs — these can represent 60-80% of total volume. 2) Aggregate Kerberos service ticket requests (4769) into per-user, per-service summaries, keeping only anomalous individual events. 3) Deduplicate repeated failed logon events — keep count + first/last occurrence per source/target pair. 4) Drop EventData fields not needed for detection (TargetLogonId, TransmittedServices, KeyLength for routine events).',
      estimatedSavings: '70-85% ingestion reduction to SIEM while maintaining 100% detection coverage for identity attacks. AD logs are often the #1 volume contributor to SIEM cost — optimization here has outsized financial impact.',
      implementationNotes: 'Use Cribl Stream suppression function for machine logon dedup. Configure WEF subscription to forward Security + Directory Service channels only (avoid Application/System). Consider separate routing for Domain Controllers vs Member Servers as DC logs are far more security-relevant. For environments with 10+ DCs, consider per-DC pipelines to enable site-aware routing.'
    },
    packFunctions: [
      { name: 'Parse Windows Event XML', description: 'Convert Windows Event XML structure into flat JSON with EventData fields promoted to top level. Handle multi-value fields and nested Data elements.' },
      { name: 'EventID Classification', description: 'Map EventID to human-readable category (Authentication, Kerberos, Account Management, Group Policy, Replication, Object Access) and severity tier.' },
      { name: 'Account Type Classification', description: 'Classify target_username as: domain-admin, privileged-service, standard-service, standard-user, computer-account, or built-in using group membership and naming convention lookups.' },
      { name: 'SID Resolution', description: 'Resolve Security Identifiers (SIDs) to human-readable account/group names using cached SID-to-name lookup table.' },
      { name: 'Kerberos Anomaly Detection', description: 'Flag Kerberos events with: RC4 encryption (potential pass-the-hash), unusual ticket lifetime, forwardable tickets from non-privileged accounts, service tickets for rarely-used SPNs.' },
      { name: 'Machine Logon Suppression', description: 'Identify and suppress routine Type 3 machine-to-machine logons between known service pairs. Keep count summaries per source/destination per time window.' },
      { name: 'Logon Session Correlation', description: 'Link logon events (4624) with logoff events (4634) and privilege events (4672) using logon_id to create session records with duration.' },
      { name: 'Replication Health Extraction', description: 'Parse Directory Service replication events for source DC, destination DC, naming context, and latency. Flag replication from unexpected sources (DCSync indicator).' },
      { name: 'Failure Code Enrichment', description: 'Map Windows failure sub-status codes (0xC000006A, 0xC0000234, etc.) to human-readable descriptions and recommended actions.' },
      { name: 'MITRE ATT&CK Tagging', description: 'Auto-tag events with MITRE technique IDs based on EventID + context (e.g., 4769 + RC4 = T1558.003 Kerberoasting, 4662 + replication GUID = T1003.006 DCSync).' }
    ]
  },
  'ping-identity': {
    sourceDescription: 'Ping Identity (PingOne/PingFederate) authentication and risk event logs collected via webhook or REST API into Cribl Stream',
    collectionMethod: 'Webhook (PingOne Event Hooks → Cribl HTTP source) / REST API Collector (PingOne Audit API polling) / Syslog (PingFederate audit.log)',
    dataFlow: [
      { step: 1, name: 'Collect Once', description: 'Ping Identity authentication and risk events ingested via webhook push or REST API polling. Single collection point eliminates duplicate API calls and webhook fan-out.' },
      { step: 2, name: 'Parse and Normalize', description: 'Cribl Pack parses JSON event payloads, normalizes timestamps to ISO 8601, extracts nested objects (actor, target, result, riskContext), and flattens key authentication attributes.' },
      { step: 3, name: 'Enrich and Classify', description: 'GeoIP enrichment on client IP, classify risk level from riskScore, enrich user context from directory attributes, tag MFA method used, and identify authentication flow type.' },
      { step: 4, name: 'Route by Use Case', description: 'Fork events: high-risk authentications and failures to SIEM, auth latency and success rates to observability, all events to full-fidelity storage.' },
      { step: 5, name: 'Search and Replay', description: 'Full-fidelity identity events indexed in Cribl Lake for identity forensics, impossible travel analysis, and access pattern investigation via Cribl Search.' }
    ],
    destinations: [
      {
        type: 'Security SIEM',
        examples: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security'],
        strategy: 'Send authentication failures, high-risk score events, MFA bypasses, impossible travel detections, and admin privilege actions. Drop routine low-risk successful SSO assertions.',
        fieldCount: 24,
        estimatedReduction: '45-60% event reduction vs full fidelity',
        filters: [
          'Include all events with result=FAILURE or result=ERROR',
          'Include all events with riskScore >= 50 (medium/high risk)',
          'Include all MFA bypass or MFA challenge failure events',
          'Include impossible travel or new device/location events',
          'Include all admin and privilege change actions',
          'Include events where authentication protocol is deprecated (SAML 1.x)',
          'Sample routine low-risk SSO success events at 5-10%'
        ],
        excludedFields: ['flowId', 'correlationId', 'environment.id', 'client.userAgentVersion', 'session.internalId']
      },
      {
        type: 'Observability Platform',
        examples: ['Datadog', 'Dynatrace', 'New Relic', 'Grafana'],
        strategy: 'Aggregate authentication latency and success/failure rates per minute by application, authentication flow, and MFA method. Send individual events for auth latency spikes and service degradation.',
        fieldCount: 14,
        estimatedReduction: '80-90% event reduction via aggregation',
        filters: [
          'Aggregate per minute: auth success/failure count, avg/p95 auth_latency_ms by application, flow_type, mfa_method',
          'Include all events where auth_latency_ms > 5000 at full fidelity',
          'Include all service-level errors (provider unavailable, timeout)',
          'Drop individual success events (covered by aggregation)',
          'Drop all risk scoring and identity fields for observability'
        ],
        excludedFields: ['actor.id', 'actor.email', 'riskScore', 'riskReasons', 'geolocation', 'deviceFingerprint', 'sessionId', 'target.id', 'ipAddress']
      },
      {
        type: 'Full-Fidelity Storage',
        examples: ['Cribl Lake', 'Amazon S3', 'Azure Blob', 'Google Cloud Storage'],
        strategy: 'Retain complete authentication event with all nested objects, risk context, and device details. Supports compliance audit, identity forensics, and access certification.',
        fieldCount: 36,
        estimatedReduction: '0% — all fields retained',
        filters: [
          'Include ALL authentication events regardless of result or risk',
          'Preserve complete risk context (score, reasons, signals)',
          'Preserve device fingerprint and geolocation details',
          'Add Cribl processing metadata and routing tags'
        ],
        excludedFields: [],
        retentionGuidance: '90 days hot (Cribl Lake), 365 days warm (S3 Standard-IA), 7 years cold (S3 Glacier) for compliance'
      },
      {
        type: 'Cribl Search',
        examples: ['Cribl Search'],
        strategy: 'Full-fidelity identity events indexed for interactive investigation, impossible travel validation, session timeline reconstruction, and access pattern analysis.',
        fieldCount: 36,
        estimatedReduction: '0% — searchable full fidelity',
        filters: [
          'All events searchable with full nested object access',
          'Optimized for actor email, application, result, and time-range queries',
          'Support geolocation and device fingerprint searches',
          'Enable replay to SIEM when investigating account compromise'
        ],
        excludedFields: [],
        replayWorkflow: 'When account takeover is suspected, search all authentication events for the affected user → map login locations and devices → identify impossible travel or new device anomalies → replay suspicious sessions to SIEM for correlation with endpoint/network data.'
      }
    ],
    costOptimization: {
      summary: 'Ping Identity logs are moderate to high volume depending on organization size — 100K-5M events per day for active environments. The majority of volume comes from routine low-risk SSO assertions that carry minimal security or operational value. By filtering to high-risk and failure events for SIEM and aggregating auth metrics for observability, customers typically achieve 50-70% reduction in analytics platform ingestion.',
      strategies: [
        { name: 'Risk-Based Routing', description: 'Only send events with riskScore >= 50 or result=FAILURE to SIEM at full fidelity. Low-risk successful authentications have near-zero detection value.', impact: '45-60% SIEM volume reduction' },
        { name: 'SSO Success Sampling', description: 'Sample routine successful SSO assertions to known-good applications at 5-10%. These confirm expected behavior but add no unique security signal.', impact: '30-50% additional SIEM reduction' },
        { name: 'Auth Metric Aggregation', description: 'Roll up authentication outcomes per minute by application, flow type, and MFA method for observability. One metric record replaces thousands of individual auth events.', impact: '80-90% event reduction for observability' },
        { name: 'Verbose Field Trimming', description: 'Remove flowId, correlationId, and internal session identifiers from non-full-fidelity destinations. These are debugging fields with no analytics value.', impact: '10-15% per-event size reduction' },
        { name: 'Duplicate Event Suppression', description: 'Deduplicate webhook retry deliveries and API polling overlaps. PingOne may deliver the same event multiple times during connectivity issues.', impact: '5-10% volume reduction' }
      ]
    },
    packFunctions: [
      { name: 'Parse JSON Payload', description: 'Parse Ping Identity JSON event structure. Handle both PingOne webhook format and PingFederate audit log format. Extract nested actor, target, and result objects.' },
      { name: 'Normalize Timestamps', description: 'Convert various timestamp formats (ISO 8601, epoch ms) to standardized _time. Handle timezone normalization across PingOne and PingFederate sources.' },
      { name: 'Classify Risk Level', description: 'Map riskScore to risk tier (low: 0-29, medium: 30-69, high: 70-100). Tag events with risk_level field and extract contributing risk factors.' },
      { name: 'Extract Geolocation', description: 'Parse client IP and derive geolocation (country, city, lat/lon). Detect impossible travel by comparing with previous auth location for same user.' },
      { name: 'Enrich User Context', description: 'Lookup actor against directory to add department, manager, account type (privileged/standard), and last known good location.' },
      { name: 'Tag MFA Method', description: 'Extract and normalize MFA method used (push, TOTP, SMS, FIDO2, email). Tag MFA bypass events and fallback method usage.' },
      { name: 'Route by Result', description: 'Apply routing logic based on authentication result, risk score, and event type to tag events for destination-specific pipelines.' },
      { name: 'Aggregate Auth Metrics', description: 'Create per-minute auth metrics: success/failure count, avg latency, MFA challenge rate by application and authentication flow.' },
      { name: 'Mask PII', description: 'Redact or hash sensitive PII fields (full email, phone number) for observability destinations while preserving them for security/full-fidelity routes.' },
      { name: 'Add Cribl Metadata', description: 'Add processing metadata: pack version, pipeline name, processing timestamp, source worker, and routing decision tags.' }
    ]
  },
  'duo-mfa': {
    sourceDescription: 'Duo Security MFA authentication and admin logs collected via Duo Admin API into Cribl Stream',
    collectionMethod: 'REST API Collector (Duo Admin API /admin/v2/logs/authentication polling) / Duo Log Sync utility / Webhook (Duo EventStream for real-time)',
    dataFlow: [
      { step: 1, name: 'Collect Once', description: 'Duo MFA authentication logs polled via Admin API or received via EventStream webhook. Single collection point eliminates duplicate API consumers and rate limit contention.' },
      { step: 2, name: 'Parse and Normalize', description: 'Cribl Pack parses JSON response arrays into individual events, normalizes epoch timestamps to ISO 8601, extracts nested device and location objects, and standardizes authentication result codes.' },
      { step: 3, name: 'Enrich and Classify', description: 'Classify auth result (success, denied, fraud), detect push frequency anomalies, extract device context (platform, OS version), add GeoIP enrichment, and tag bypass usage patterns.' },
      { step: 4, name: 'Route by Use Case', description: 'Fork events: fraud reports, push spam, bypass usage, and failures to SIEM. Auth latency and success rate metrics to observability. All events to full-fidelity storage.' },
      { step: 5, name: 'Search and Replay', description: 'Full-fidelity MFA logs indexed in Cribl Lake for push spam investigation, MFA fatigue analysis, and device enrollment forensics via Cribl Search.' }
    ],
    destinations: [
      {
        type: 'Security SIEM',
        examples: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security'],
        strategy: 'Send fraud reports, denied authentications, bypass usage, high push frequency (MFA fatigue), new device enrollments, and admin actions. Drop routine successful push approvals from trusted devices.',
        fieldCount: 22,
        estimatedReduction: '50-65% event reduction vs full fidelity',
        filters: [
          'Include all result=FRAUD events (user-reported)',
          'Include all result=DENIED events',
          'Include all events where factor=bypass',
          'Include events where push_count > 3 in 5 minutes (push spam indicator)',
          'Include all new device enrollment events',
          'Include all admin log events (policy changes, user management)',
          'Sample routine result=SUCCESS with factor=push from trusted devices at 10%'
        ],
        excludedFields: ['txid', 'eventtype_internal', 'alias', 'email_domain']
      },
      {
        type: 'Observability Platform',
        examples: ['Datadog', 'Dynatrace', 'New Relic', 'Grafana'],
        strategy: 'Aggregate MFA metrics per minute: success/failure rates, push response latency, factor type distribution. Send individual events for auth latency > threshold and service degradation indicators.',
        fieldCount: 12,
        estimatedReduction: '80-90% event reduction via aggregation',
        filters: [
          'Aggregate per minute: success/failure/fraud count, avg push_response_time_ms by application, factor_type',
          'Include all events where push_response_time_ms > 30000 (timeout risk)',
          'Include all Duo service status events (degradation indicators)',
          'Drop individual success events (covered by aggregation)',
          'Drop all user identity and device detail fields for observability'
        ],
        excludedFields: ['user.name', 'user.email', 'device.name', 'device.os', 'access_device.ip', 'location', 'auth_device.key', 'result_reason']
      },
      {
        type: 'Full-Fidelity Storage',
        examples: ['Cribl Lake', 'Amazon S3', 'Azure Blob', 'Google Cloud Storage'],
        strategy: 'Retain complete MFA event with all device, location, and access context. Supports compliance audit, device inventory analysis, and MFA fatigue pattern investigation.',
        fieldCount: 32,
        estimatedReduction: '0% — all fields retained',
        filters: [
          'Include ALL authentication events regardless of result',
          'Preserve complete device context (platform, OS, browser)',
          'Preserve access device IP and location details',
          'Add Cribl processing metadata and routing tags'
        ],
        excludedFields: [],
        retentionGuidance: '90 days hot (Cribl Lake), 365 days warm (S3 Standard-IA), 7 years cold (S3 Glacier) for compliance'
      },
      {
        type: 'Cribl Search',
        examples: ['Cribl Search'],
        strategy: 'Full-fidelity MFA logs indexed for interactive investigation, push spam pattern analysis, device trust assessment, and MFA enrollment audit.',
        fieldCount: 32,
        estimatedReduction: '0% — searchable full fidelity',
        filters: [
          'All events searchable with full field access',
          'Optimized for user, result, factor, and time-range queries',
          'Support device-centric searches for enrollment investigations',
          'Enable replay to SIEM when investigating MFA fatigue attacks'
        ],
        excludedFields: [],
        replayWorkflow: 'When MFA fatigue attack is suspected, search all auth events for the target user → identify push frequency patterns → map device and location anomalies → replay suspicious auth sequences to SIEM for correlation with primary auth source (Okta, Azure AD).'
      }
    ],
    costOptimization: {
      summary: 'Duo MFA logs are moderate volume — 50K-2M events per day depending on organization size. Most volume comes from routine successful push approvals that confirm expected user behavior. By routing only security-anomalous events to SIEM and aggregating auth health metrics for observability, customers typically achieve 50-70% reduction in analytics platform ingestion.',
      strategies: [
        { name: 'Result-Based Routing', description: 'Route FRAUD, DENIED, and bypass events to SIEM always. SUCCESS from trusted devices can be sampled — these confirm expected behavior with minimal detection value.', impact: '50-65% SIEM volume reduction' },
        { name: 'Push Frequency Detection', description: 'Calculate push frequency per user in sliding window. Only forward individual events when frequency exceeds threshold (push spam). Otherwise aggregate into per-user success count.', impact: '30-50% additional filtering' },
        { name: 'MFA Metric Aggregation', description: 'Roll up auth outcomes per minute by application, factor type, and result for observability. One metric record replaces hundreds of individual auth events.', impact: '80-90% event reduction for observability' },
        { name: 'Trusted Device Sampling', description: 'For successful push approvals from previously-seen trusted devices, sample at 10%. New devices or locations always forwarded at full fidelity.', impact: '30-45% volume reduction for trusted traffic' },
        { name: 'Admin Log Separation', description: 'Route admin logs (policy changes, user management) separately from auth logs. Admin logs are low volume but high security value — always send to SIEM.', impact: 'Quality improvement (ensures admin visibility)' }
      ]
    },
    packFunctions: [
      { name: 'Parse JSON Response', description: 'Parse Duo Admin API JSON response arrays into individual authentication events. Handle pagination markers and API rate limit metadata.' },
      { name: 'Normalize Timestamps', description: 'Convert Duo epoch second timestamps to ISO 8601. Handle isotimestamp field when present in newer API versions.' },
      { name: 'Classify Auth Result', description: 'Map Duo result codes to normalized categories: success, denied, fraud, error, timeout. Extract result_reason for failure context.' },
      { name: 'Extract Device Context', description: 'Parse auth_device and access_device objects into flat fields: device_platform, device_os, browser, device_key, trusted_device flag.' },
      { name: 'Detect Push Frequency', description: 'Calculate push attempts per user per time window. Flag sequences exceeding threshold as potential MFA fatigue attacks.' },
      { name: 'Geo-Enrich IP', description: 'Add GeoIP context (country, city, ASN) to access_device.ip. Compare with user baseline location for anomaly detection.' },
      { name: 'Tag Bypass Usage', description: 'Identify and tag events where factor=bypass. Correlate with bypass reason and admin who granted bypass status.' },
      { name: 'Aggregate MFA Metrics', description: 'Create per-minute auth metrics: success/failure/fraud count, push response time percentiles, factor type distribution by application.' },
      { name: 'Route by Factor Type', description: 'Apply routing logic based on factor type (push, phone, passcode, bypass, WebAuthn) to enable factor-specific analytics and alerting.' },
      { name: 'Add Cribl Metadata', description: 'Add processing metadata: pack version, pipeline name, processing timestamp, source worker, and routing decision tags.' }
    ]
  },
  'apache-access': {
    sourceDescription: 'Apache HTTP Server access logs (Common Log Format or Combined Log Format) collected via Cribl Edge file monitor or syslog piping',
    collectionMethod: 'Cribl Edge (File Monitor on access.log / access_log) / Syslog piped via mod_syslog / Container stdout (JSON structured logging)',
    dataFlow: [
      { step: 1, name: 'Collect Once', description: 'Apache access logs collected by Cribl Edge monitoring the log file or receiving syslog. Single collection point for multiple virtual hosts and log formats.' },
      { step: 2, name: 'Parse and Normalize', description: 'Cribl Pack parses CLF/Combined/custom log formats into structured fields. Extract request method, URI, protocol from request line. Convert timestamps to ISO 8601. Cast numeric fields (status, bytes).' },
      { step: 3, name: 'Enrich and Classify', description: 'GeoIP enrichment on client IP, classify user agents (browser, bot, scanner, crawler), extract URI path components, detect attack patterns in request URI and query string.' },
      { step: 4, name: 'Route by Use Case', description: 'Fork events: attack patterns + auth failures + scanner activity to SIEM. Response time metrics + error rates to observability. All requests to full-fidelity storage.' },
      { step: 5, name: 'Search and Replay', description: 'Full-fidelity access logs in Cribl Lake for incident investigation, attack timeline reconstruction, and user behavior analysis via Cribl Search.' }
    ],
    destinations: [
      {
        type: 'Security SIEM',
        examples: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security'],
        strategy: 'Send requests with attack indicators (SQL injection, XSS, path traversal, command injection), authentication failures (401/403), scanner user agents, and unusual HTTP methods. Drop routine 200 responses to static content.',
        fieldCount: 20,
        estimatedReduction: '70-85% event reduction vs full fidelity',
        filters: [
          'Include all status 401/403 responses (unauthorized access)',
          'Include all status 400/405 responses (malformed/illegal requests)',
          'Include requests matching attack patterns in request_uri (../, SELECT, UNION, <script)',
          'Include requests with known scanner/exploit user agents',
          'Include requests with unusual HTTP methods (TRACE, DELETE, CONNECT, OPTIONS)',
          'Include requests to sensitive paths (/admin, /wp-login, /cgi-bin, /.env)',
          'Sample routine 200/301/304 to non-sensitive paths at 1-5%'
        ],
        excludedFields: ['response_time_us', 'keep_alive_count', 'handler', 'pid', 'bytes_received']
      },
      {
        type: 'Observability Platform',
        examples: ['Datadog', 'Dynatrace', 'New Relic', 'Grafana'],
        strategy: 'Send performance metrics: response time percentiles, error rates (4xx/5xx), throughput (bytes served), and request volume. Aggregate per virtual host per minute.',
        fieldCount: 14,
        estimatedReduction: '85-95% event reduction via aggregation',
        filters: [
          'Aggregate per minute by virtual_host, status class (2xx/3xx/4xx/5xx), request_method',
          'Always include 5xx responses at full fidelity (server errors)',
          'Include all requests with response_time_us > 2000000 (>2s slow requests)',
          'Sample routine 200 responses at 5% for latency baseline',
          'Drop client identity and request body fields'
        ],
        excludedFields: ['remote_addr', 'remote_user', 'http_referer', 'http_user_agent', 'request_uri', 'query_string', 'auth_user']
      },
      {
        type: 'Full-Fidelity Storage',
        examples: ['Cribl Lake', 'Amazon S3', 'Azure Blob', 'Google Cloud Storage'],
        strategy: 'Retain complete access log with all fields and enrichments. Supports compliance, incident investigation, user journey analysis, and forensic attack reconstruction.',
        fieldCount: 28,
        estimatedReduction: '0% — all fields retained',
        filters: [
          'Include ALL requests regardless of status or path',
          'Preserve all parsed fields and enrichments',
          'Add GeoIP data, user agent classification, attack pattern tags',
          'Add Cribl processing metadata'
        ],
        excludedFields: [],
        retentionGuidance: '30 days hot (Cribl Lake), 90 days warm (S3 Standard-IA), 365 days cold (S3 Glacier)'
      },
      {
        type: 'Cribl Search',
        examples: ['Cribl Search'],
        strategy: 'Full-fidelity access logs indexed for interactive investigation, attack campaign reconstruction, user behavior analysis, and forensic timeline building.',
        fieldCount: 28,
        estimatedReduction: '0% — searchable full fidelity',
        filters: [
          'All requests searchable with full field access',
          'Optimized for remote_addr, request_uri, status, and time-range queries',
          'Support user agent and URI pattern searches',
          'Enable replay to SIEM when investigating web attack campaigns'
        ],
        excludedFields: [],
        replayWorkflow: 'When a web attack is detected, search access logs for all requests from the attacker IP → reconstruct attack timeline and payloads → identify other targeted URIs and hosts → replay attack-related requests to SIEM for correlation.'
      }
    ],
    costOptimization: {
      summary: 'Apache access logs are high volume for busy web servers (millions of requests per day). The majority are routine successful responses to static assets with zero security or unique operational value. By routing only attack-relevant and error traffic to SIEM and aggregating performance metrics for observability, customers typically achieve 75-90% reduction in analytics platform ingestion.',
      strategies: [
        { name: 'Status-Based Routing', description: 'Route 4xx/5xx to SIEM (security + troubleshooting), aggregate 2xx/3xx for metrics only. Successful responses to static assets have near-zero security value.', impact: '70-85% SIEM volume reduction' },
        { name: 'Static Asset Filtering', description: 'Drop or heavily sample requests to static assets (.js, .css, .png, .gif, .woff, .ico). These generate massive volume with minimal analytical insight.', impact: '30-50% total volume reduction' },
        { name: 'Health Check Suppression', description: 'Suppress load balancer and monitoring health checks (/server-status, /health, /ping). Predictable, high-frequency, no analytical value.', impact: '5-20% volume reduction' },
        { name: 'Aggregation for Metrics', description: 'Roll up requests per minute by virtual host, status class, and method for observability. One metric record per minute replaces thousands of individual requests.', impact: '85-95% event reduction for observability' },
        { name: 'User Agent Normalization', description: 'Normalize and truncate verbose user agent strings to category (Chrome, Firefox, Bot, Scanner, API). Reduces event size significantly for long UA strings.', impact: '5-10% per-event size reduction' }
      ]
    },
    packFunctions: [
      { name: 'Parse CLF/Combined Format', description: 'Parse Apache Common Log Format and Combined Log Format into named fields. Handle custom LogFormat directives with variable field positions.' },
      { name: 'Extract URI Components', description: 'Split request line into method, URI path, query string, and HTTP version. Decode URL-encoded characters for analysis.' },
      { name: 'Classify Status Code', description: 'Map HTTP status to category (2xx success, 3xx redirect, 4xx client error, 5xx server error) and add status_category field for routing and aggregation.' },
      { name: 'Geo-Enrich Client IP', description: 'Add geographic context (country, city, ASN, org) to client IP address. Tag internal vs external origins.' },
      { name: 'Detect Bots', description: 'Classify user agent as legitimate browser, search engine crawler, known bot, scanner/exploit tool, or unknown. Apply regex and lookup-based detection.' },
      { name: 'Calculate Response Time Buckets', description: 'Convert response time to bucket categories: fast (<100ms), normal (100-500ms), slow (500-2000ms), critical (>2000ms) for efficient aggregation.' },
      { name: 'Route by Virtual Host', description: 'Apply per-virtual-host routing rules. Different sites may have different security sensitivity and cost optimization profiles.' },
      { name: 'Aggregate Request Metrics', description: 'Create per-minute rollups: request count, bytes served, latency percentiles, error rate by virtual host, status class, and method.' },
      { name: 'Redact Sensitive Query Params', description: 'Remove or hash sensitive query parameters (tokens, passwords, API keys, session IDs) from request URI before forwarding to analytics platforms.' },
      { name: 'Add Cribl Metadata', description: 'Add processing metadata: pack version, pipeline name, processing timestamp, source worker, and routing decision tags.' }
    ]
  },
  'iis-access': {
    sourceDescription: 'Microsoft IIS (Internet Information Services) access logs in W3C Extended Log Format collected via Cribl Edge file monitor or log forwarding',
    collectionMethod: 'Cribl Edge (File Monitor on %SystemDrive%\\inetpub\\logs\\LogFiles\\W3SVC*) / Windows Event Forwarding / HTTP log streaming via HttpPlatformHandler',
    dataFlow: [
      { step: 1, name: 'Collect Once', description: 'IIS W3C logs collected by Cribl Edge monitoring the log directory. Single collection point handles multiple sites and log file rotation automatically.' },
      { step: 2, name: 'Parse and Normalize', description: 'Cribl Pack parses W3C Extended format (space-delimited with #Fields header), normalizes date+time to ISO 8601, maps cs-/sc-/s- prefixed fields to standard names.' },
      { step: 3, name: 'Enrich and Classify', description: 'GeoIP enrichment on client IP, parse user agent string, classify status and substatus codes, detect suspicious request patterns, and add site/application context.' },
      { step: 4, name: 'Route by Use Case', description: 'Fork events: security-relevant requests (auth failures, attack patterns, suspicious status codes) to SIEM. Performance metrics (time-taken, bytes, errors) to observability. All requests to full-fidelity storage.' },
      { step: 5, name: 'Search and Replay', description: 'Full-fidelity IIS logs indexed in Cribl Lake for incident investigation, application troubleshooting, and request-level forensics via Cribl Search.' }
    ],
    destinations: [
      {
        type: 'Security SIEM',
        examples: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security'],
        strategy: 'Send requests with attack indicators, authentication failures (401/403 with substatus), suspicious status combinations (500.100 ASP errors), and scanner activity. Drop routine 200/304 responses.',
        fieldCount: 22,
        estimatedReduction: '65-80% event reduction vs full fidelity',
        filters: [
          'Include all sc-status 401 with sc-substatus indicating auth failures (1,2,3,5,7)',
          'Include all sc-status 403 (forbidden access attempts)',
          'Include all sc-status 500 with substatus (application errors exposing internals)',
          'Include requests matching attack patterns in cs-uri-stem or cs-uri-query',
          'Include requests with known exploit/scanner user agents',
          'Include requests to sensitive paths (/web.config, /app_data, /bin)',
          'Sample routine 200/304 responses at 2-5%'
        ],
        excludedFields: ['s-computername', 's-sitename', 'cs-version', 'sc-bytes (for non-exfil routes)', 'time-taken']
      },
      {
        type: 'Observability Platform',
        examples: ['Datadog', 'Dynatrace', 'New Relic', 'Grafana'],
        strategy: 'Send performance metrics: time-taken percentiles, error rates by status/substatus, throughput (bytes), and request volume. Aggregate per site and application pool per minute.',
        fieldCount: 16,
        estimatedReduction: '80-92% event reduction via aggregation',
        filters: [
          'Aggregate per minute by s-sitename, sc-status class, cs-method, cs-uri-stem (top paths)',
          'Always include 5xx responses at full fidelity (application failures)',
          'Include all requests with time-taken > 5000ms (slow requests)',
          'Include application pool recycling indicators',
          'Sample routine 200 responses at 5% for latency baseline'
        ],
        excludedFields: ['c-ip', 'cs-username', 'cs(Referer)', 'cs(User-Agent)', 'cs-uri-query', 'cs(Cookie)']
      },
      {
        type: 'Full-Fidelity Storage',
        examples: ['Cribl Lake', 'Amazon S3', 'Azure Blob', 'Google Cloud Storage'],
        strategy: 'Retain complete IIS log with all W3C fields and enrichments. Supports compliance, application debugging, user session analysis, and forensic investigation.',
        fieldCount: 30,
        estimatedReduction: '0% — all fields retained',
        filters: [
          'Include ALL requests regardless of status',
          'Preserve all W3C configured fields',
          'Add GeoIP enrichment and user agent classification',
          'Add Cribl processing metadata and site context'
        ],
        excludedFields: [],
        retentionGuidance: '30 days hot (Cribl Lake), 90 days warm (S3 Standard-IA), 365 days cold (S3 Glacier)'
      },
      {
        type: 'Cribl Search',
        examples: ['Cribl Search'],
        strategy: 'Full-fidelity IIS logs indexed for interactive investigation, application troubleshooting, request-level performance analysis, and security forensics.',
        fieldCount: 30,
        estimatedReduction: '0% — searchable full fidelity',
        filters: [
          'All requests searchable with full field access',
          'Optimized for c-ip, cs-uri-stem, sc-status, and time-range queries',
          'Support substatus and win32-status correlation for debugging',
          'Enable replay to SIEM when investigating web application attacks'
        ],
        excludedFields: [],
        replayWorkflow: 'When a web application attack is detected, search IIS logs for all requests from the attacker IP → analyze request patterns and payloads → identify exploitation attempts → replay attack sequence to SIEM for correlation with Windows Security events.'
      }
    ],
    costOptimization: {
      summary: 'IIS access logs are high volume for busy web applications (millions of requests per day). The majority are routine successful responses that carry minimal security or unique operational value. By routing only security-relevant and error traffic to SIEM and aggregating performance metrics, customers typically achieve 70-85% reduction in analytics platform ingestion.',
      strategies: [
        { name: 'Status/Substatus Routing', description: 'Route security-relevant status combinations (401.x, 403.x, 500.x) to SIEM. IIS substatus codes provide specific failure context that aids detection (401.1=logon failed, 401.2=config-based deny).', impact: '65-80% SIEM volume reduction' },
        { name: 'Static Content Filtering', description: 'Drop or heavily sample requests for static content (.js, .css, .png, .woff, .ico). These are high-volume, low-value for both security and performance analysis.', impact: '30-50% total volume reduction' },
        { name: 'Health Probe Suppression', description: 'Suppress Azure/AWS load balancer health probes and monitoring agent requests. High-frequency, predictable, no analytical value.', impact: '5-15% volume reduction' },
        { name: 'Performance Metric Aggregation', description: 'Roll up time-taken, bytes, and request count per minute by site and status class for observability. One metric record replaces thousands of individual requests.', impact: '80-92% event reduction for observability' },
        { name: 'Query String Trimming', description: 'Truncate or remove cs-uri-query for non-security routes. Query strings can be very long and contain session tokens with no analytics value.', impact: '10-20% per-event size reduction' }
      ]
    },
    packFunctions: [
      { name: 'Parse W3C Format', description: 'Parse IIS W3C Extended Log Format using #Fields header for dynamic field mapping. Handle variable field configurations across different IIS sites.' },
      { name: 'Normalize Timestamps', description: 'Combine date (YYYY-MM-DD) and time (HH:MM:SS) fields into ISO 8601 timestamp. Apply UTC assumption (IIS logs in UTC by default).' },
      { name: 'Extract URI Components', description: 'Split cs-uri-stem into path segments and extract extension. Parse cs-uri-query into key-value pairs for analysis.' },
      { name: 'Classify Status', description: 'Map sc-status + sc-substatus + sc-win32-status combination to specific failure description. Tag security-relevant combinations for routing.' },
      { name: 'Geo-Enrich Client IP', description: 'Add geographic context (country, city, ASN) to c-ip. Handle X-Forwarded-For header for clients behind proxies/CDNs.' },
      { name: 'Parse User Agent', description: 'Classify cs(User-Agent) into browser, version, OS, device type, and bot/scanner category for efficient filtering and analytics.' },
      { name: 'Route by Site', description: 'Apply per-site routing rules based on s-sitename and s-port. Different sites may have different security sensitivity and cost profiles.' },
      { name: 'Aggregate IIS Metrics', description: 'Create per-minute rollups: request count, time-taken percentiles (p50/p95/p99), bytes sent/received, error rate by site, status class, and method.' },
      { name: 'Detect Suspicious Patterns', description: 'Match URI patterns for directory traversal, web shell access, config file requests, and known IIS exploit paths. Tag with attack_type for SIEM routing.' },
      { name: 'Add Cribl Metadata', description: 'Add processing metadata: pack version, pipeline name, processing timestamp, source worker, and routing decision tags.' }
    ]
  },
  'windows-security': {
    sourceDescription: 'Windows Security Event Log (Security channel) collected via Windows Event Forwarding (WEF) or Cribl Edge agent from member servers and workstations',
    collectionMethod: 'Windows Event Forwarding (WEF → Cribl Stream) / Cribl Edge (Windows Event Log input on Security channel) / NXLog forwarding',
    dataFlow: [
      { step: 1, name: 'Collect Once', description: 'Windows Security events collected from endpoints via WEF subscriptions or Cribl Edge agents. Single collection point eliminates per-host forwarder configurations to multiple SIEMs.' },
      { step: 2, name: 'Parse and Normalize', description: 'Cribl Pack parses EVTX XML structure into flat JSON, promotes EventData fields to top level, normalizes timestamps, and maps EventID to category and description.' },
      { step: 3, name: 'Enrich and Classify', description: 'Classify by EventID into auth/process/privilege/object categories, tag MITRE ATT&CK techniques, normalize logon types to human-readable labels, and filter machine accounts from user activity.' },
      { step: 4, name: 'Route by Use Case', description: 'Fork events: authentication failures, process creation, privilege use to SIEM. Lockout trends, auth success rates to observability. All events to full-fidelity storage.' },
      { step: 5, name: 'Search and Replay', description: 'Full-fidelity Security events indexed in Cribl Lake for authentication forensics, process timeline reconstruction, and compliance audit via Cribl Search.' }
    ],
    destinations: [
      {
        type: 'Security SIEM',
        examples: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security'],
        strategy: 'Send authentication failures, process creation with command line, privilege escalation events, account management changes, and logon events from external/unusual sources. Drop routine machine-to-machine Type 3 logons and service ticket renewals.',
        fieldCount: 26,
        estimatedReduction: '60-75% event reduction vs full fidelity',
        filters: [
          'Include all EventID 4625 (logon failure) events',
          'Include all EventID 4688 (process creation) with command line',
          'Include all EventID 4672 (special privileges assigned)',
          'Include all EventID 4720/4722/4724/4726/4738 (account management)',
          'Include all EventID 4624 with LogonType 2,7,10,11 (interactive/remote)',
          'Include all EventID 4648 (explicit credential use)',
          'Drop EventID 4624 LogonType 3 from machine accounts (routine network logon)',
          'Drop EventID 4769 routine TGS renewals from machine accounts'
        ],
        excludedFields: ['ProcessId', 'ThreadId', 'Keywords', 'Opcode', 'Version', 'Task', 'Correlation_ActivityID']
      },
      {
        type: 'Observability Platform',
        examples: ['Datadog', 'Dynatrace', 'New Relic', 'Grafana'],
        strategy: 'Aggregate authentication metrics per minute: success/failure counts, lockout rates, logon type distribution. Send individual events for mass lockouts and unusual failure spikes indicating infrastructure issues.',
        fieldCount: 12,
        estimatedReduction: '85-92% event reduction via aggregation',
        filters: [
          'Aggregate per minute: logon success/failure count, lockout count by Computer, LogonType',
          'Include all EventID 4740 (account lockout) at full fidelity',
          'Include failure spikes (>20 failures/min from single source)',
          'Drop all individual logon success events (covered by aggregation)',
          'Drop all process creation and privilege events for observability'
        ],
        excludedFields: ['SubjectUserSid', 'SubjectUserName', 'TargetUserSid', 'CommandLine', 'ParentProcessName', 'PrivilegeList', 'LogonProcessName', 'AuthenticationPackageName', 'WorkstationName']
      },
      {
        type: 'Full-Fidelity Storage',
        examples: ['Cribl Lake', 'Amazon S3', 'Azure Blob', 'Google Cloud Storage'],
        strategy: 'Retain complete Security event log with all EventData fields for compliance (PCI, SOX, HIPAA), incident response, and forensic investigation.',
        fieldCount: 38,
        estimatedReduction: '0% — all fields retained',
        filters: [
          'Include ALL Security events regardless of EventID',
          'Preserve complete EventData XML structure',
          'Preserve logon session correlation (LogonId)',
          'Add Cribl processing metadata and MITRE tags'
        ],
        excludedFields: [],
        retentionGuidance: '90 days hot (Cribl Lake), 365 days warm (S3 Standard-IA), 7 years cold (S3 Glacier) for compliance'
      },
      {
        type: 'Cribl Search',
        examples: ['Cribl Search'],
        strategy: 'Full-fidelity Security events indexed for interactive investigation, logon session reconstruction, process tree analysis, and compliance access reporting.',
        fieldCount: 38,
        estimatedReduction: '0% — searchable full fidelity',
        filters: [
          'All Security events searchable with full field access',
          'Optimized for EventID, TargetUserName, Computer, LogonType, and time-range queries',
          'Support logon session correlation via LogonId chains',
          'Enable replay to SIEM when investigating endpoint compromise'
        ],
        excludedFields: [],
        replayWorkflow: 'When endpoint compromise is suspected, search all Security events for the host → trace authentication timeline and process creation → identify lateral movement via logon events → replay attack chain to SIEM for network/identity correlation.'
      }
    ],
    costOptimization: {
      summary: 'Windows Security logs are extremely high volume — a typical domain-joined workstation generates 10,000-100,000 events per day, servers even more. The majority is routine machine-to-machine authentication (Type 3 logons, Kerberos ticket renewals) with near-zero security value. By filtering to human authentication, process creation, and privilege events for SIEM, customers achieve 60-80% reduction while maintaining full detection coverage.',
      strategies: [
        { name: 'Machine Logon Suppression', description: 'Suppress EventID 4624 LogonType 3 where SubjectUserName ends in $ (machine accounts). These represent 50-70% of Security log volume on servers and carry no detection value for most use cases.', impact: '50-70% volume reduction on servers' },
        { name: 'Kerberos Ticket Filtering', description: 'Drop routine Kerberos TGS requests (4769) from machine accounts for expected services. Only forward TGS events with anomalous encryption types or unusual SPN targets.', impact: '15-30% additional volume reduction' },
        { name: 'Process Creation Focus', description: 'Send EventID 4688 only when CommandLine audit is enabled and command contains non-default content. Empty or system-expected commands add volume without detection value.', impact: '20-40% 4688 event reduction' },
        { name: 'Auth Metric Aggregation', description: 'Roll up logon success/failure counts per minute per computer for observability. Individual events add no value for trend dashboards.', impact: '85-92% event reduction for observability' },
        { name: 'Correlation Field Trimming', description: 'Remove internal correlation fields (ActivityID, Keywords, Opcode) that provide no value to downstream analytics tools.', impact: '5-10% per-event size reduction' }
      ]
    },
    packFunctions: [
      { name: 'Parse EVTX XML', description: 'Parse Windows Event XML (EVTX) structure into flat JSON. Promote System and EventData elements to top-level fields. Handle rendering info and binary data.' },
      { name: 'Extract EventData Fields', description: 'Extract all EventData named fields into structured key-value pairs. Handle variable field sets across different EventIDs.' },
      { name: 'Classify by EventID', description: 'Map EventID to category (authentication, process, privilege, account_management, object_access, policy_change) and human-readable description.' },
      { name: 'Tag MITRE Techniques', description: 'Auto-tag events with MITRE ATT&CK technique IDs based on EventID + context (4688 + encoded cmd = T1059, 4648 = T1550, 4720 = T1136).' },
      { name: 'Normalize Logon Types', description: 'Map LogonType numeric to human-readable: 2=Interactive, 3=Network, 7=Unlock, 10=RemoteInteractive, 11=CachedInteractive.' },
      { name: 'Filter Machine Accounts', description: 'Identify and tag events from machine accounts (SubjectUserName/TargetUserName ending in $). Enable suppression for non-full-fidelity routes.' },
      { name: 'Route by Event Category', description: 'Apply category-based routing: auth events to one pipeline, process events to another, enabling per-category optimization and cost control.' },
      { name: 'Aggregate Auth Metrics', description: 'Create per-minute authentication metrics: success/failure/lockout count by Computer, LogonType, and SubjectDomain.' },
      { name: 'Enrich with AD Context', description: 'Lookup SubjectUserSid/TargetUserSid against AD to add account type (admin, service, standard), department, and group membership context.' },
      { name: 'Add Cribl Metadata', description: 'Add processing metadata: pack version, pipeline name, processing timestamp, source worker, and routing decision tags.' }
    ]
  },
  'windows-system': {
    sourceDescription: 'Windows System Event Log (System channel) collected via Windows Event Forwarding (WEF) or Cribl Edge agent covering service control, hardware, and OS events',
    collectionMethod: 'Windows Event Forwarding (WEF → Cribl Stream) / Cribl Edge (Windows Event Log input on System channel) / NXLog forwarding',
    dataFlow: [
      { step: 1, name: 'Collect Once', description: 'Windows System events collected from endpoints via WEF subscriptions or Cribl Edge agents. Single collection point for service health, hardware errors, and OS events.' },
      { step: 2, name: 'Parse and Normalize', description: 'Cribl Pack parses EVTX XML structure, promotes EventData to flat fields, normalizes timestamps, classifies events by provider and severity level.' },
      { step: 3, name: 'Enrich and Classify', description: 'Classify service state changes, detect disk errors and hardware failures, monitor time sync drift, tag unexpected reboots, and add host context (role, environment).' },
      { step: 4, name: 'Route by Use Case', description: 'Fork events: unexpected reboots and suspicious service changes to SIEM. Service failures, disk errors, and health metrics to observability. All events to full-fidelity storage.' },
      { step: 5, name: 'Search and Replay', description: 'Full-fidelity System events indexed in Cribl Lake for root cause analysis, service failure correlation, and infrastructure troubleshooting via Cribl Search.' }
    ],
    destinations: [
      {
        type: 'Security SIEM',
        examples: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security'],
        strategy: 'Send unexpected reboots (EventID 6008), new service installations (7045), service failures for security services, time sync anomalies, and driver load events. Drop routine service start/stop and hardware enumeration.',
        fieldCount: 18,
        estimatedReduction: '75-88% event reduction vs full fidelity',
        filters: [
          'Include EventID 6008 (unexpected shutdown) always',
          'Include EventID 7045 (new service installed) always',
          'Include EventID 7034/7031 (service crash) for security-critical services',
          'Include EventID 1 (time sync) where drift exceeds threshold',
          'Include kernel driver load events from non-standard paths',
          'Include service state changes for AV, EDR, and audit services',
          'Drop routine EventID 7036 (service state change) for non-critical services'
        ],
        excludedFields: ['Binary', 'EventRecordID', 'Correlation', 'Keywords', 'Opcode']
      },
      {
        type: 'Observability Platform',
        examples: ['Datadog', 'Dynatrace', 'New Relic', 'Grafana'],
        strategy: 'Send service failure events, disk errors, memory pressure indicators, and time sync status. Aggregate service health metrics per host per minute for fleet monitoring.',
        fieldCount: 16,
        estimatedReduction: '60-75% event reduction vs full fidelity',
        filters: [
          'Include all EventID 7034/7031 (service crash/unexpected termination)',
          'Include all disk error events (EventID 7, 11, 15, 51, 52, 153)',
          'Include all EventID 2004 (resource exhaustion warning)',
          'Include time sync events indicating drift',
          'Aggregate service state changes per minute by host',
          'Drop routine startup/shutdown sequences (expected events)',
          'Drop informational hardware enumeration events'
        ],
        excludedFields: ['Security_UserID', 'Channel', 'Correlation', 'Keywords', 'ProcessID', 'ThreadID']
      },
      {
        type: 'Full-Fidelity Storage',
        examples: ['Cribl Lake', 'Amazon S3', 'Azure Blob', 'Google Cloud Storage'],
        strategy: 'Retain complete System event log for root cause analysis, hardware failure tracking, and infrastructure troubleshooting history.',
        fieldCount: 26,
        estimatedReduction: '0% — all fields retained',
        filters: [
          'Include ALL System events regardless of severity',
          'Preserve complete EventData and Binary data',
          'Preserve event sequencing for boot/shutdown correlation',
          'Add host metadata (role, environment, hardware generation)'
        ],
        excludedFields: [],
        retentionGuidance: '30 days hot (Cribl Lake), 90 days warm (S3 Standard-IA), 365 days cold (S3 Glacier)'
      },
      {
        type: 'Cribl Search',
        examples: ['Cribl Search'],
        strategy: 'Full-fidelity System events indexed for root cause analysis, service dependency mapping, and infrastructure incident investigation.',
        fieldCount: 26,
        estimatedReduction: '0% — searchable full fidelity',
        filters: [
          'All System events searchable with full field access',
          'Optimized for EventID, Provider_Name, Computer, and time-range queries',
          'Support service lifecycle correlation (install → start → crash → restart)',
          'Enable replay when investigating infrastructure stability issues'
        ],
        excludedFields: [],
        replayWorkflow: 'When system instability is reported, search System events for the affected host → correlate service crashes with disk errors and resource warnings → identify root cause → replay timeline to observability for dashboard context.'
      }
    ],
    costOptimization: {
      summary: 'Windows System logs are moderate volume — a typical server generates 5,000-50,000 events per day. Most volume comes from routine service state transitions and informational hardware events with minimal analytical value. By routing only failures, unexpected events, and security-relevant service changes, customers achieve 60-85% reduction in analytics platform ingestion.',
      strategies: [
        { name: 'Service Crash Focus', description: 'Only forward service crash/failure events (7034, 7031, 7023) and new installations (7045) to analytics. Routine state transitions (7036 started/stopped) for non-critical services have no detection or ops value.', impact: '60-75% SIEM volume reduction' },
        { name: 'Disk Error Priority', description: 'Always forward disk errors at full fidelity (low volume, high value). These indicate impending hardware failure or potential tampering with storage subsystem.', impact: 'Quality improvement (ensures disk visibility)' },
        { name: 'Boot Sequence Compression', description: 'Compress the startup event burst (50-200 events during boot) into a single summary event for non-full-fidelity destinations. Individual startup events have no unique analytical value.', impact: '10-20% volume reduction on frequently rebooted systems' },
        { name: 'Health Metric Aggregation', description: 'Aggregate service health events per minute per host for observability dashboards. One metric record captures service_up_count, service_crash_count, disk_error_count.', impact: '60-75% event reduction for observability' },
        { name: 'Time Sync Thresholding', description: 'Only forward time sync events when drift exceeds threshold (>5 seconds). Routine successful sync confirmations carry no value for security or operations.', impact: '5-10% volume reduction' }
      ]
    },
    packFunctions: [
      { name: 'Parse EVTX XML', description: 'Parse Windows Event XML (EVTX) structure into flat JSON. Promote System and EventData elements to top-level fields. Handle provider-specific EventData schemas.' },
      { name: 'Extract EventData', description: 'Extract EventData named fields into structured key-value pairs. Handle variable schemas across providers (Service Control Manager, Disk, W32Time, etc.).' },
      { name: 'Classify Severity', description: 'Map event Level (1=Critical, 2=Error, 3=Warning, 4=Information) and add human-readable severity_label and operational priority score.' },
      { name: 'Tag Service State Changes', description: 'Parse Service Control Manager events to extract service name, state transition (stopped→running, running→stopped), and start type. Flag new service installations.' },
      { name: 'Detect Disk Errors', description: 'Identify disk error events (ntfs, disk, volmgr providers), extract device name, error type, and sector information for hardware health tracking.' },
      { name: 'Monitor Time Sync', description: 'Parse W32Time provider events for time sync source, drift offset, and sync status. Flag drift exceeding configurable threshold.' },
      { name: 'Route by Provider', description: 'Apply provider-based routing rules. Service Control Manager events to one pipeline, disk events to another, enabling per-provider optimization.' },
      { name: 'Aggregate Health Metrics', description: 'Create per-minute host health metrics: service_crash_count, disk_error_count, time_sync_status, unexpected_shutdown_flag by Computer.' },
      { name: 'Filter Noise (Expected Restarts)', description: 'Identify planned maintenance windows and expected restart patterns. Suppress routine service restart events during known change windows.' },
      { name: 'Add Cribl Metadata', description: 'Add processing metadata: pack version, pipeline name, processing timestamp, source worker, and routing decision tags.' }
    ]
  },
  'windows-application': {
    sourceDescription: 'Windows Application Event Log (Application channel) collected via Windows Event Forwarding (WEF) or Cribl Edge agent covering application crashes, errors, and operational events',
    collectionMethod: 'Windows Event Forwarding (WEF → Cribl Stream) / Cribl Edge (Windows Event Log input on Application channel) / NXLog forwarding',
    dataFlow: [
      { step: 1, name: 'Collect Once', description: 'Windows Application events collected from endpoints via WEF subscriptions or Cribl Edge agents. Single collection point for application health, crashes, and operational events.' },
      { step: 2, name: 'Parse and Normalize', description: 'Cribl Pack parses EVTX XML structure, promotes EventData to flat fields, normalizes timestamps, classifies by source application and severity.' },
      { step: 3, name: 'Enrich and Classify', description: 'Classify application crashes by type (unhandled exception, access violation), extract SQL error codes, tag .NET exception types, and identify suspicious module load patterns.' },
      { step: 4, name: 'Route by Use Case', description: 'Fork events: suspicious module loads and exploit indicators to SIEM. Application crashes, error rates, and health metrics to observability. All events to full-fidelity storage.' },
      { step: 5, name: 'Search and Replay', description: 'Full-fidelity Application events indexed in Cribl Lake for application troubleshooting, crash analysis, and security investigation via Cribl Search.' }
    ],
    destinations: [
      {
        type: 'Security SIEM',
        examples: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security'],
        strategy: 'Send suspicious module loads (.dll from temp/download paths), application crashes in security tools, EMET/Exploit Guard violations, and events indicating code injection or tampering. Drop routine application informational events.',
        fieldCount: 20,
        estimatedReduction: '80-92% event reduction vs full fidelity',
        filters: [
          'Include Windows Error Reporting (WER) events for security-critical applications',
          'Include Application Error (1000) and Application Hang (1002) for security tools',
          'Include EMET/Exploit Guard/WDEG mitigation events',
          'Include .NET Runtime errors with suspicious exception types (AccessViolation, StackOverflow)',
          'Include module load events from non-standard paths (Temp, Downloads, AppData)',
          'Include all events from security-relevant sources (MsiInstaller with suspicious packages)',
          'Drop routine informational events from known-good applications'
        ],
        excludedFields: ['EventRecordID', 'Correlation', 'Keywords', 'Opcode', 'Version', 'Task', 'Channel']
      },
      {
        type: 'Observability Platform',
        examples: ['Datadog', 'Dynatrace', 'New Relic', 'Grafana'],
        strategy: 'Send application crash events, error rates by source, and health indicators. Aggregate crash frequency per application per host per minute for fleet-wide application health dashboards.',
        fieldCount: 14,
        estimatedReduction: '70-85% event reduction vs full fidelity',
        filters: [
          'Include all EventID 1000 (Application Error) at full fidelity',
          'Include all EventID 1002 (Application Hang) at full fidelity',
          'Include all .NET Runtime unhandled exceptions',
          'Include SQL Server error events (severity >= 16)',
          'Aggregate error/warning counts per minute by Source, Computer',
          'Drop all Level=Information events from non-critical applications',
          'Drop MSI installer routine progress events'
        ],
        excludedFields: ['Security_UserID', 'ProcessID', 'ThreadID', 'Correlation', 'Binary']
      },
      {
        type: 'Full-Fidelity Storage',
        examples: ['Cribl Lake', 'Amazon S3', 'Azure Blob', 'Google Cloud Storage'],
        strategy: 'Retain complete Application event log for application debugging, crash dump correlation, and historical error pattern analysis.',
        fieldCount: 28,
        estimatedReduction: '0% — all fields retained',
        filters: [
          'Include ALL Application events regardless of level',
          'Preserve complete EventData including crash dump references',
          'Preserve module version information for dependency tracking',
          'Add host and application context metadata'
        ],
        excludedFields: [],
        retentionGuidance: '30 days hot (Cribl Lake), 60 days warm (S3 Standard-IA), 365 days cold (S3 Glacier)'
      },
      {
        type: 'Cribl Search',
        examples: ['Cribl Search'],
        strategy: 'Full-fidelity Application events indexed for crash analysis, application dependency investigation, and error pattern correlation across fleet.',
        fieldCount: 28,
        estimatedReduction: '0% — searchable full fidelity',
        filters: [
          'All Application events searchable with full field access',
          'Optimized for Source, EventID, Level, Computer, and time-range queries',
          'Support faulting module and exception type searches',
          'Enable replay when correlating application crashes with security events'
        ],
        excludedFields: [],
        replayWorkflow: 'When application exploitation is suspected, search Application events for crash patterns on the target host → identify faulting modules and exception types → correlate timing with Security events → replay crash events to SIEM for investigation context.'
      }
    ],
    costOptimization: {
      summary: 'Windows Application logs are moderate to high volume — 5,000-100,000 events per day per host depending on installed applications. Most volume comes from routine informational events (application startup, configuration loaded, task completed) with zero security or operational value. By focusing on crashes, errors, and security-relevant events, customers achieve 70-90% reduction.',
      strategies: [
        { name: 'Level-Based Routing', description: 'Only send Error and Critical level events to analytics platforms. Information and Warning events from well-known applications rarely contain actionable signal.', impact: '70-85% volume reduction' },
        { name: 'Crash Event Priority', description: 'Always forward EventID 1000/1002 (Application Error/Hang) at full fidelity. These are low volume but high value for both ops (availability) and security (exploitation indicators).', impact: 'Quality improvement (ensures crash visibility)' },
        { name: 'Known-Good Suppression', description: 'Suppress routine events from known-good sources (Office telemetry, Windows Update client, perflib). These generate high volume with no operational insight.', impact: '30-50% additional volume reduction' },
        { name: 'Error Rate Aggregation', description: 'Aggregate error/warning counts per minute per source per host for observability. One metric record captures application health without forwarding every individual event.', impact: '70-85% event reduction for observability' },
        { name: 'Binary Data Trimming', description: 'Remove Binary/EventData raw bytes from non-full-fidelity routes. These contain crash dump references useful only for deep debugging.', impact: '5-15% per-event size reduction' }
      ]
    },
    packFunctions: [
      { name: 'Parse EVTX XML', description: 'Parse Windows Event XML (EVTX) structure into flat JSON. Promote System and EventData elements to top-level fields. Handle provider-specific schemas.' },
      { name: 'Extract EventData', description: 'Extract EventData named fields into structured key-value pairs. Handle variable schemas across application providers.' },
      { name: 'Classify by Source', description: 'Map event Source (Application Error, .NET Runtime, MSSQLSERVER, MsiInstaller) to application category and operational domain.' },
      { name: 'Parse Crash Details', description: 'Extract faulting module name, version, exception code, and offset from Application Error (1000) events. Map exception codes to human-readable descriptions.' },
      { name: 'Extract SQL Errors', description: 'Parse MSSQLSERVER and SQLSERVERAGENT events for error number, severity, state, and message text. Tag by severity tier for routing.' },
      { name: 'Tag .NET Exceptions', description: 'Extract exception type, message, and stack trace from .NET Runtime events. Classify as expected (handled) vs unexpected (unhandled) for severity routing.' },
      { name: 'Route by Application', description: 'Apply per-application routing rules. Security-critical apps (AV, EDR, backup) route differently from business applications.' },
      { name: 'Aggregate Error Rates', description: 'Create per-minute error metrics: crash_count, hang_count, error_count, warning_count by Source, Computer, and application category.' },
      { name: 'Filter Known-Good Crashes', description: 'Suppress or sample known-benign crash patterns (Office recovery, browser renderer crash, expected worker process recycle) for non-full-fidelity routes.' },
      { name: 'Add Cribl Metadata', description: 'Add processing metadata: pack version, pipeline name, processing timestamp, source worker, and routing decision tags.' }
    ]
  },
  'windows-sysmon': {
    sourceDescription: 'Windows Sysmon (System Monitor) events from Microsoft-Windows-Sysmon/Operational channel — highest-fidelity endpoint telemetry for process, network, file, and registry activity',
    collectionMethod: 'Windows Event Forwarding (WEF → Cribl Stream) / Cribl Edge (Windows Event Log input on Microsoft-Windows-Sysmon/Operational) / NXLog forwarding',
    dataFlow: [
      { step: 1, name: 'Collect Once', description: 'Sysmon events collected from endpoints via WEF subscriptions or Cribl Edge agents. Single collection point for all Sysmon event types (process, network, file, registry, DNS, WMI).' },
      { step: 2, name: 'Parse and Normalize', description: 'Cribl Pack parses EVTX XML structure, extracts Sysmon-specific EventData fields, normalizes hash formats, and standardizes timestamps across event types.' },
      { step: 3, name: 'Enrich and Classify', description: 'Normalize file hashes to consistent format, build parent-child process correlation, tag events by MITRE ATT&CK technique, and classify Sysmon Event IDs by detection value.' },
      { step: 4, name: 'Route by Use Case', description: 'Fork events: all Sysmon events carry high security value — send detection-critical event types to SIEM (process, network, file create). Send volume metrics to observability. All events to full-fidelity.' },
      { step: 5, name: 'Search and Replay', description: 'Full-fidelity Sysmon telemetry indexed in Cribl Lake for threat hunting, kill chain reconstruction, and behavioral analysis via Cribl Search.' }
    ],
    destinations: [
      {
        type: 'Security SIEM',
        examples: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security'],
        strategy: 'Send all detection-critical Sysmon event types at full fidelity. Sysmon is the highest-value security source — minimize field reduction. Only trim internal correlation IDs and redundant system fields.',
        fieldCount: 32,
        estimatedReduction: '25-35% field reduction vs full fidelity (minimal — preserve detection fields)',
        filters: [
          'Include ALL EventID 1 (Process Create) with full CommandLine',
          'Include ALL EventID 3 (Network Connection) to external IPs',
          'Include ALL EventID 7 (Image Loaded) from non-standard paths',
          'Include ALL EventID 8 (CreateRemoteThread — injection)',
          'Include ALL EventID 10 (Process Access — credential dumping)',
          'Include ALL EventID 11 (File Create) in suspicious directories',
          'Include ALL EventID 13/14 (Registry Set/Rename — persistence)',
          'Include ALL EventID 22 (DNS Query) to non-internal domains',
          'Sample EventID 3 to internal IPs at 10% (routine internal traffic)'
        ],
        excludedFields: ['RuleName (when empty)', 'ProcessGuid (use ProcessId instead for SIEM)', 'SchemaVersion']
      },
      {
        type: 'Observability Platform',
        examples: ['Datadog', 'Dynatrace', 'New Relic', 'Grafana'],
        strategy: 'Aggregate Sysmon volume metrics per minute: process creation rate, network connection rate, file creation rate by host. Send individual events for Sysmon service health (config changes, errors).',
        fieldCount: 10,
        estimatedReduction: '90-95% event reduction via aggregation',
        filters: [
          'Aggregate per minute: process_create_count, network_connect_count, file_create_count, registry_change_count by Computer',
          'Include EventID 4 (Sysmon service state change) at full fidelity',
          'Include EventID 16 (Sysmon config change) at full fidelity',
          'Include EventID 255 (Sysmon error) at full fidelity',
          'Drop all individual process, network, file, and registry events for observability'
        ],
        excludedFields: ['CommandLine', 'ParentCommandLine', 'Hashes', 'User', 'Image', 'TargetFilename', 'DestinationIp', 'DestinationPort', 'SourceIp', 'RegistryKey', 'RegistryValue']
      },
      {
        type: 'Full-Fidelity Storage',
        examples: ['Cribl Lake', 'Amazon S3', 'Azure Blob', 'Google Cloud Storage'],
        strategy: 'Retain complete Sysmon telemetry with all fields — this is the primary endpoint forensic record. Supports kill chain reconstruction, behavioral baselining, and advanced threat hunting.',
        fieldCount: 42,
        estimatedReduction: '0% — all fields retained',
        filters: [
          'Include ALL Sysmon events regardless of Event ID',
          'Preserve complete CommandLine and ParentCommandLine',
          'Preserve all hash values (MD5, SHA1, SHA256, IMPHASH)',
          'Preserve ProcessGuid for cross-event correlation',
          'Add MITRE ATT&CK tags and processing metadata'
        ],
        excludedFields: [],
        retentionGuidance: '30 days hot (Cribl Lake), 90 days warm (S3 Standard-IA), 365 days cold (S3 Glacier) for threat hunting'
      },
      {
        type: 'Cribl Search',
        examples: ['Cribl Search'],
        strategy: 'Full-fidelity Sysmon telemetry indexed for interactive threat hunting, process tree reconstruction, network connection analysis, and behavioral investigation. The primary tool for endpoint forensics.',
        fieldCount: 42,
        estimatedReduction: '0% — searchable full fidelity',
        filters: [
          'All Sysmon events searchable with full field access',
          'Optimized for Image, CommandLine, DestinationIp, Hash, and time-range queries',
          'Support process tree reconstruction via ParentProcessGuid/ProcessGuid',
          'Enable replay to SIEM when new IOCs (hashes, IPs, domains) are identified'
        ],
        excludedFields: [],
        replayWorkflow: 'When new malware hash is identified, search Sysmon for all process creation with matching hash → reconstruct kill chain (parent process, network connections, file drops, registry persistence) → replay full attack timeline to SIEM for incident response.'
      }
    ],
    costOptimization: {
      summary: 'Sysmon is the highest-value security telemetry source on Windows — field reduction must be minimal to preserve detection capability. Volume management focuses on event type filtering (not field pruning) and intelligent sampling of high-volume routine events. Typical environments generate 50,000-500,000 Sysmon events per endpoint per day. Network connections (EventID 3) alone can be 60% of volume.',
      strategies: [
        { name: 'Network Connection Filtering', description: 'Sample EventID 3 (Network Connection) to internal/RFC1918 destinations at 10%. Keep all connections to external IPs at full fidelity. Internal connections are the highest volume with lowest per-event detection value.', impact: '30-50% total volume reduction' },
        { name: 'Image Load Filtering', description: 'Filter EventID 7 (Image Loaded) to only forward loads from non-standard paths or unsigned DLLs. Standard system DLL loads from System32 are expected and high-volume.', impact: '20-40% EventID 7 reduction' },
        { name: 'DNS Query Deduplication', description: 'Deduplicate EventID 22 (DNS Query) for repeated queries to the same domain from the same process. Keep first occurrence + count for repeated queries within time window.', impact: '30-50% EventID 22 reduction' },
        { name: 'File Create Path Focus', description: 'Filter EventID 11 (File Create) to suspicious directories only (Temp, Downloads, AppData, Startup). Routine file creation in application directories has lower detection value.', impact: '40-60% EventID 11 reduction' },
        { name: 'Preserve CommandLine Always', description: 'Never truncate or remove CommandLine/ParentCommandLine for process creation events sent to SIEM. This is the single most valuable field for detection across all techniques.', impact: 'Quality preservation (no volume reduction)' }
      ]
    },
    packFunctions: [
      { name: 'Parse EVTX XML', description: 'Parse Windows Event XML (EVTX) structure into flat JSON. Extract Sysmon-specific EventData fields which vary by Event ID.' },
      { name: 'Extract Sysmon EventData', description: 'Map Sysmon event-type-specific fields: EventID 1 has CommandLine/ParentImage, EventID 3 has DestinationIp/Port, EventID 11 has TargetFilename, etc.' },
      { name: 'Hash Normalization', description: 'Parse Sysmon Hashes field (format: MD5=x,SHA256=y,IMPHASH=z) into individual hash fields. Normalize to lowercase for consistent IOC matching.' },
      { name: 'Parent-Child Correlation', description: 'Link process creation events via ParentProcessGuid to build process trees. Add parent_image, parent_commandline as enrichment fields for single-event context.' },
      { name: 'Tag by MITRE', description: 'Auto-tag Sysmon events with MITRE ATT&CK technique IDs based on Event ID + behavioral context (EventID 8 = T1055, EventID 10 + lsass.exe target = T1003).' },
      { name: 'Classify Sysmon Event ID', description: 'Map Event ID to category and detection priority: 1=Process Create (high), 3=Network (medium-high), 7=Image Load (medium), 8=CreateRemoteThread (critical).' },
      { name: 'Route by Event Type', description: 'Apply per-Event-ID routing rules: critical IDs (1,8,10) always to SIEM, medium IDs (3,7,11) with filtering, low IDs (17,18 pipe events) optional.' },
      { name: 'Aggregate Process Metrics', description: 'Create per-minute endpoint telemetry metrics: process_create_rate, network_connect_rate, file_create_rate, registry_change_rate by Computer.' },
      { name: 'Redact Sensitive Command Args', description: 'Identify and mask sensitive data in CommandLine (passwords passed as arguments, API keys, connection strings) for non-full-fidelity observability routes.' },
      { name: 'Add Cribl Metadata', description: 'Add processing metadata: pack version, pipeline name, processing timestamp, source worker, Sysmon config hash, and routing decision tags.' }
    ]
  },
  'windows-wef': {
    sourceDescription: 'Windows Event Forwarding (WEF) aggregated event stream from Windows Event Collector (WEC) server — meta-source collecting events from multiple channels across the fleet',
    collectionMethod: 'Cribl Edge (Windows Event Log input on ForwardedEvents channel on WEC server) / Cribl Stream HTTP source receiving WEC-to-Cribl relay',
    dataFlow: [
      { step: 1, name: 'Collect Once', description: 'Forwarded events collected from the WEC server ForwardedEvents channel by Cribl Edge. Single collection point captures events from all WEF-subscribed endpoints across all subscribed channels.' },
      { step: 2, name: 'Parse and Normalize', description: 'Cribl Pack parses EVTX XML, extracts original channel (Security, System, Sysmon, etc.), identifies forwarding source computer, and normalizes timestamps accounting for forwarding delay.' },
      { step: 3, name: 'Enrich and Route', description: 'Classify events by original channel, tag subscription source, detect forwarding health issues (gaps, delays), and normalize field schemas across different original channels into consistent format.' },
      { step: 4, name: 'Route by Original Channel', description: 'Fork events by original channel: Security events to security pipeline, Sysmon to Sysmon pipeline, System to system pipeline. Each sub-pipeline applies channel-specific optimization.' },
      { step: 5, name: 'Search and Replay', description: 'Full-fidelity forwarded events indexed in Cribl Lake for cross-channel correlation, forwarding health analysis, and fleet-wide investigation via Cribl Search.' }
    ],
    destinations: [
      {
        type: 'Security SIEM',
        examples: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security'],
        strategy: 'Route events by original channel applying per-channel security filtering. Security channel events get auth/process filters, Sysmon gets detection-priority filters, System gets unexpected-event filters. Forwarding metadata aids investigation context.',
        fieldCount: 28,
        estimatedReduction: '60-75% event reduction vs full fidelity',
        filters: [
          'Apply per-original-channel security filters (see individual source blueprints)',
          'Include ALL events from high-value channels (Sysmon, PowerShell/Operational)',
          'Include security-filtered events from Security channel',
          'Include unexpected reboot and service events from System channel',
          'Include forwarding health anomalies (gaps > 5 minutes per source)',
          'Include events from new/unknown source computers (rogue endpoints)',
          'Drop routine health confirmations and expected operational events'
        ],
        excludedFields: ['Forwarding_EventRecordID', 'Forwarding_Keywords', 'Forwarding_Opcode', 'Forwarding_Correlation']
      },
      {
        type: 'Observability Platform',
        examples: ['Datadog', 'Dynatrace', 'New Relic', 'Grafana'],
        strategy: 'Monitor WEF infrastructure health: forwarding rates per source, delivery latency, subscription coverage, and gap detection. Aggregate event volume metrics per source computer per channel per minute.',
        fieldCount: 12,
        estimatedReduction: '90-95% event reduction via aggregation',
        filters: [
          'Aggregate per minute: event_count by source_computer, original_channel, subscription_name',
          'Calculate forwarding_delay_ms (event time vs forwarded time) percentiles',
          'Include forwarding gap alerts (source missing > 5 minutes)',
          'Include subscription health events (new source enrolled, source dropped)',
          'Drop all individual security/system/application events for WEF observability'
        ],
        excludedFields: ['EventData (all)', 'Message', 'CommandLine', 'TargetUserName', 'all channel-specific fields']
      },
      {
        type: 'Full-Fidelity Storage',
        examples: ['Cribl Lake', 'Amazon S3', 'Azure Blob', 'Google Cloud Storage'],
        strategy: 'Retain complete forwarded event stream with WEF metadata (forwarding delay, subscription source, original channel). Supports fleet-wide investigation, forwarding health audit, and cross-channel correlation.',
        fieldCount: 40,
        estimatedReduction: '0% — all fields retained',
        filters: [
          'Include ALL forwarded events from all channels',
          'Preserve WEF forwarding metadata (Computer, TimeCreated, ForwardedFrom)',
          'Preserve original channel identification',
          'Add forwarding delay calculation and subscription context'
        ],
        excludedFields: [],
        retentionGuidance: '30 days hot (Cribl Lake), 90 days warm (S3 Standard-IA), 365 days cold (S3 Glacier)'
      },
      {
        type: 'Cribl Search',
        examples: ['Cribl Search'],
        strategy: 'Full-fidelity forwarded events indexed for fleet-wide investigation, cross-channel event correlation, WEF health analysis, and enterprise-scope threat hunting.',
        fieldCount: 40,
        estimatedReduction: '0% — searchable full fidelity',
        filters: [
          'All forwarded events searchable across all original channels',
          'Optimized for source_computer, original_channel, EventID, and time-range queries',
          'Support cross-channel correlation (Security + Sysmon + System for same host)',
          'Enable replay to SIEM when investigating fleet-wide compromise'
        ],
        excludedFields: [],
        replayWorkflow: 'When fleet-wide compromise is suspected, search forwarded events across all source computers → correlate Security (auth) + Sysmon (process) + System (service) events per host → identify affected endpoints → replay full timeline to SIEM for coordinated incident response.'
      }
    ],
    costOptimization: {
      summary: 'WEF aggregated streams are extremely high volume — the WEC server consolidates events from potentially thousands of endpoints. The key optimization is routing by original channel and applying per-channel reduction strategies. WEF-specific value-add is monitoring forwarding health to ensure collection integrity. Customers typically achieve 60-80% reduction by applying channel-specific blueprints at the WEC collection point.',
      strategies: [
        { name: 'Channel-Based Pipeline Routing', description: 'Route events by original channel into dedicated sub-pipelines. Each channel has different optimization profiles — Security gets auth filtering, Sysmon gets event-type filtering, System gets severity filtering.', impact: '60-75% overall reduction (varies by channel mix)' },
        { name: 'Forwarding Health Monitoring', description: 'Calculate per-source forwarding rates and detect gaps. A silent endpoint is often more concerning than a noisy one — gap detection provides unique security value from the WEF meta-source.', impact: 'Quality improvement (ensures coverage visibility)' },
        { name: 'Source Computer Deduplication', description: 'If both WEF and direct Cribl Edge collection exist for the same endpoints, deduplicate at the WEC pipeline to avoid double-counting in downstream analytics.', impact: '50% reduction for dual-collected endpoints' },
        { name: 'Subscription Optimization', description: 'Analyze which WEF subscriptions forward the most low-value events and tune subscription XPath filters at source to reduce collection volume before it reaches Cribl.', impact: '20-40% volume reduction at source' },
        { name: 'Batch Processing Efficiency', description: 'WEC servers buffer and forward events in batches. Optimize Cribl pipeline to process batches efficiently — parse once, route many — reducing per-event processing overhead.', impact: 'Processing efficiency (reduces compute cost)' }
      ]
    },
    packFunctions: [
      { name: 'Parse EVTX XML', description: 'Parse Windows Event XML from ForwardedEvents channel. Extract both the original event data and WEF forwarding metadata (Computer, TimeCreated, EventRecordID).' },
      { name: 'Extract Original Channel', description: 'Identify the original event channel (Security, System, Sysmon, Application, PowerShell) from the forwarded event metadata for channel-based routing.' },
      { name: 'Classify Forwarding Health', description: 'Calculate forwarding delay (current time - event TimeCreated), detect out-of-order delivery, and flag stale events indicating collection backlog.' },
      { name: 'Tag Subscription Source', description: 'Map forwarded events to their WEF subscription name and source computer. Add subscription_name, source_computer, and source_domain fields for fleet management.' },
      { name: 'Normalize Across Channels', description: 'Apply channel-specific field normalization so downstream pipelines receive consistent field names regardless of original channel (e.g., User → actor across Security/Sysmon/System).' },
      { name: 'Route by Original Channel', description: 'Split event stream by original channel into dedicated sub-pipelines. Security events route to security optimization, Sysmon to Sysmon optimization, etc.' },
      { name: 'Detect Forwarding Gaps', description: 'Track per-source-computer event rates and alert when a source goes silent for > configurable threshold. Silence often indicates agent/network issues or adversary tampering.' },
      { name: 'Aggregate Delivery Metrics', description: 'Create per-minute WEF health metrics: events_forwarded_count, avg_forwarding_delay_ms, unique_sources_reporting, gap_count by subscription and channel.' },
      { name: 'Add Computer Context', description: 'Enrich source_computer with fleet metadata: OS version, OU membership, site/location, criticality tier, and last known agent status from CMDB lookup.' },
      { name: 'Add Cribl Metadata', description: 'Add processing metadata: pack version, pipeline name, processing timestamp, WEC server identity, subscription name, and routing decision tags.' }
    ]
  },
  'akamai-waf': {
    sourceDescription: 'Akamai WAF security events collected via SIEM Integration API (pull-based) or DataStream 2 into Cribl Stream',
    collectionMethod: 'SIEM Integration API (REST polling with offset tracking) / DataStream 2 (HTTP POST push) / S3 Export (batch)',
    dataFlow: [
      { step: 1, name: 'Collect Once', description: 'Akamai WAF events ingested via SIEM Integration API polling or DataStream 2 push. Single collection point replaces multiple SIEM-specific API consumers.' },
      { step: 2, name: 'Parse and Normalize', description: 'Cribl Pack parses JSON envelope, extracts attack data from nested objects, normalizes timestamps, and maps Akamai rule IDs to human-readable classifications.' },
      { step: 3, name: 'Enrich and Classify', description: 'GeoIP enrichment on client_ip, classify rule actions by severity, map bot scores to categories, calculate risk tiers, and tag attack campaigns.' },
      { step: 4, name: 'Route by Use Case', description: 'Fork events: WAF triggers and attack data to SIEM, request metrics and error rates to observability, all events to full-fidelity storage.' },
      { step: 5, name: 'Search and Replay', description: 'Full-fidelity WAF events indexed in Cribl Lake for attack campaign investigation, false positive tuning, and WAF policy optimization via Cribl Search.' }
    ],
    destinations: [
      {
        type: 'Security SIEM',
        examples: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security'],
        strategy: 'Send all WAF rule triggers, bot detections, and high-risk requests. Include full attack context (rule_id, rule_message, rule_selector). Drop routine allowed requests with no rule triggers.',
        fieldCount: 22,
        estimatedReduction: '50-70% event reduction vs full fidelity',
        filters: [
          'Include all events where rule_action in (deny, alert)',
          'Include all events where risk_score > 50',
          'Include all events where bot_score > 70',
          'Include all events where challenge_passed == false',
          'Include requests with known attack patterns in path/query',
          'Sample routine allowed requests with no triggers at 1-5%'
        ],
        excludedFields: ['response_headers_content_type', 'port', 'referrer']
      },
      {
        type: 'Observability Platform',
        examples: ['Datadog', 'Dynatrace', 'New Relic', 'Grafana'],
        strategy: 'Send request metrics, status code distributions, response times, and error rates. Aggregate per host per minute for traffic volume dashboards. Drop attack-specific fields.',
        fieldCount: 12,
        estimatedReduction: '80-90% event reduction via aggregation',
        filters: [
          'Aggregate per minute: request count, bytes, status code distribution by host, country',
          'Include all status >= 500 at full fidelity (origin errors)',
          'Include all status 429 (rate limiting) at full fidelity',
          'Drop individual allowed requests (covered by aggregation)',
          'Drop all rule/attack fields for observability destinations'
        ],
        excludedFields: ['rule_id', 'rule_tag', 'rule_action', 'rule_message', 'rule_selector', 'config_id', 'policy_id', 'query', 'x_forwarded_for', 'challenge_passed', 'bot_category', 'referrer']
      },
      {
        type: 'Full-Fidelity Storage',
        examples: ['Cribl Lake', 'Amazon S3', 'Azure Blob'],
        strategy: 'Retain complete WAF event with all fields and enrichments. Supports WAF tuning, false positive analysis, attack campaign forensics, and compliance.',
        fieldCount: 30,
        estimatedReduction: '0% — all fields retained',
        filters: [
          'Include ALL events regardless of action or risk',
          'Preserve all rule trigger details and request context',
          'Add GeoIP enrichments and risk classifications',
          'Add Cribl processing metadata and routing tags'
        ],
        excludedFields: [],
        retentionGuidance: '30 days hot (Cribl Lake), 90 days warm (S3 Standard-IA), 365 days cold (S3 Glacier)'
      },
      {
        type: 'Cribl Search',
        examples: ['Cribl Search'],
        strategy: 'Full-fidelity WAF events indexed for interactive attack investigation, WAF rule tuning analysis, bot campaign forensics, and false positive identification.',
        fieldCount: 30,
        estimatedReduction: '0% — searchable full fidelity',
        filters: [
          'All events searchable with full field access',
          'Optimized for client_ip, host, rule_id, and time-range queries',
          'Support attack pattern and bot category searches',
          'Enable replay to SIEM when investigating attack campaigns'
        ],
        excludedFields: [],
        replayWorkflow: 'When an application attack is detected, search WAF events for all requests from the attacker IP → reconstruct attack campaign timeline → identify other targeted hosts → replay attack context to SIEM for correlation with origin application logs.'
      }
    ],
    costOptimization: {
      summary: 'Akamai WAF logs can be extremely high volume for popular web properties — millions of requests per day with WAF evaluation on each. The majority of events are routine allowed requests with no rule triggers. By routing only attack-relevant events to SIEM and aggregating traffic metrics for observability, customers typically achieve 60-80% reduction in analytics platform ingestion.',
      strategies: [
        { name: 'Action-Based Routing', description: 'Route deny and alert actions to SIEM. Allowed requests with no rule triggers have near-zero security value for expensive analytics platforms.', impact: '50-70% SIEM volume reduction' },
        { name: 'Risk Score Threshold', description: 'Only send events with risk_score > 0 to SIEM. Zero-risk requests passed all WAF checks and carry no detection value.', impact: '40-60% additional filtering' },
        { name: 'Bot Traffic Aggregation', description: 'Aggregate bot traffic metrics (volume by category, challenge pass rates) per minute instead of sending individual bot events for known categories.', impact: '30-50% bot event reduction' },
        { name: 'Traffic Metric Aggregation', description: 'Roll up request counts, bytes, and status codes per minute by host and country for observability. One metric record replaces thousands of individual requests.', impact: '85-95% event reduction for observability' },
        { name: 'Query String Trimming', description: 'For non-security destinations, drop query string (can be 500+ chars). Retain only for events with rule triggers where the payload is needed for investigation.', impact: '10-20% per-event size reduction' }
      ]
    },
    packFunctions: [
      { name: 'Parse JSON Event', description: 'Parse Akamai SIEM API JSON response. Extract attack data from nested objects (attackData, httpMessage, geo). Handle both single events and batch arrays.' },
      { name: 'Extract Attack Data', description: 'Flatten nested attackData object into top-level fields: rule_id, rule_tag, rule_action, rule_message, rule_selector. Handle multiple rules per request.' },
      { name: 'Classify Rule Actions', description: 'Map rule_action values to severity tiers: deny=high, alert=medium, monitor=low. Add action_severity field for prioritized routing.' },
      { name: 'GeoIP Enrich Client IP', description: 'Add geographic context from Akamai EdgeScape data or MaxMind fallback. Enrich client_ip with country, city, region, ASN fields.' },
      { name: 'Tag Bot Category', description: 'Classify bot_score ranges into categories: 0-30=likely_human, 31-60=suspicious, 61-80=likely_bot, 81-100=confirmed_bot. Map bot_category to known classifications.' },
      { name: 'Calculate Risk Tiers', description: 'Derive risk_tier from composite scoring: risk_score + bot_score + rule_action severity. Output: critical, high, medium, low, none.' },
      { name: 'Route by Action', description: 'Add routing tags based on rule_action: alert events to security monitoring, deny events to SIEM, routine allows to metrics-only destinations.' },
      { name: 'Aggregate WAF Metrics', description: 'Create per-minute rollups: request count, deny count, alert count, average risk score by host and country for observability dashboards.' },
      { name: 'Normalize Rule IDs', description: 'Map Akamai numeric rule IDs to OWASP categories and human-readable names using a lookup table. Add owasp_category field.' },
      { name: 'Add Cribl Metadata', description: 'Add processing metadata: pack version, pipeline name, processing timestamp, collection method, and routing decision tags.' }
    ]
  },
  'o365-activity': {
    sourceDescription: 'Office 365 Management Activity API audit events collected via REST API polling or webhook subscription into Cribl Stream',
    collectionMethod: 'Management Activity API (REST polling with content blob retrieval) / Webhook subscription (push notification + content fetch) / Azure Event Hub (streaming)',
    dataFlow: [
      { step: 1, name: 'Collect Once', description: 'O365 audit events ingested via Management Activity API polling or Event Hub streaming. Single collection point eliminates duplicate API subscriptions across SIEM tools.' },
      { step: 2, name: 'Parse and Normalize', description: 'Cribl Pack breaks content blob arrays into individual events, normalizes timestamps, maps record_type to workload names, and extracts nested operation details.' },
      { step: 3, name: 'Enrich and Classify', description: 'GeoIP on client_ip, classify operations by sensitivity (admin actions, sharing, DLP), tag sensitive operations (eDiscovery, role changes), enrich user context from directory.' },
      { step: 4, name: 'Route by Use Case', description: 'Fork events: admin actions, sharing, DLP matches to SIEM. Workload volume and error rates to observability. All events to full-fidelity storage.' },
      { step: 5, name: 'Search and Replay', description: 'Full-fidelity audit events indexed in Cribl Lake for insider threat investigation, compliance audit, and data access forensics via Cribl Search.' }
    ],
    destinations: [
      {
        type: 'Security SIEM',
        examples: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security'],
        strategy: 'Send admin operations, external sharing events, DLP policy matches, role changes, mailbox rule creation, and consent grants. Drop routine file access and read-only operations from non-privileged users.',
        fieldCount: 26,
        estimatedReduction: '60-75% event reduction vs full fidelity',
        filters: [
          'Include all operations with user_type in (Admin, Application)',
          'Include all events where external_access == true',
          'Include all events where dlp_policy_name IS NOT NULL',
          'Include operations matching sensitive patterns (Add*Role*, Set-Mailbox*, New-InboxRule, Grant*)',
          'Include all result_status == Failed events',
          'Include sharing_type in (Anonymous, Guest)',
          'Sample routine FileAccessed and PageViewed operations at 1-5%'
        ],
        excludedFields: ['correlation_id', 'organization_id', 'user_key']
      },
      {
        type: 'Observability Platform',
        examples: ['Datadog', 'Dynatrace', 'New Relic', 'Grafana'],
        strategy: 'Aggregate workload metrics: operation counts, error rates, and latency per minute by workload. Send individual events for throttling and service errors indicating availability issues.',
        fieldCount: 10,
        estimatedReduction: '85-95% event reduction via aggregation',
        filters: [
          'Aggregate per minute: operation count, failure count by workload, record_type, result_status',
          'Include all result_status == Failed with error patterns (throttle, timeout, service unavailable)',
          'Include workload health anomalies (sudden volume drops indicating outage)',
          'Drop all individual success events (covered by aggregation)',
          'Drop all user identity and file-level fields for observability'
        ],
        excludedFields: ['user_id', 'user_key', 'object_id', 'source_file_name', 'site_url', 'modified_properties', 'extended_properties', 'affected_items', 'parameters', 'target_user_or_group', 'sharing_type', 'sensitivity_label', 'dlp_policy_name']
      },
      {
        type: 'Full-Fidelity Storage',
        examples: ['Cribl Lake', 'Amazon S3', 'Azure Blob'],
        strategy: 'Retain complete audit event with all nested objects and enrichments. Supports compliance audit (SOX, GDPR data access), insider threat investigation, and eDiscovery.',
        fieldCount: 32,
        estimatedReduction: '0% — all fields retained',
        filters: [
          'Include ALL events regardless of operation or result',
          'Preserve all nested objects (modified_properties, affected_items, parameters)',
          'Add GeoIP enrichments and user context from directory',
          'Add Cribl processing metadata and sensitivity classification tags'
        ],
        excludedFields: [],
        retentionGuidance: '90 days hot (Cribl Lake), 365 days warm (S3 Standard-IA), 7 years cold (S3 Glacier) for compliance'
      },
      {
        type: 'Cribl Search',
        examples: ['Cribl Search'],
        strategy: 'Full-fidelity audit events indexed for interactive investigation, user activity timeline reconstruction, data access pattern analysis, and compliance reporting.',
        fieldCount: 32,
        estimatedReduction: '0% — searchable full fidelity',
        filters: [
          'All events searchable with full nested object access',
          'Optimized for user_id, operation, workload, and time-range queries',
          'Support file access and sharing pattern searches',
          'Enable replay to SIEM when investigating insider threats or data exfiltration'
        ],
        excludedFields: [],
        replayWorkflow: 'When data exfiltration is suspected, search all events for the user across workloads → identify file downloads, sharing grants, and mailbox rule creation → quantify data access scope → replay sensitive operations to SIEM for correlation with endpoint and network data.'
      }
    ],
    costOptimization: {
      summary: 'Office 365 audit logs generate 10-50 million events per day for large organizations. The highest volume comes from routine file access (FileAccessed, PageViewed) and mail read operations — these carry minimal security value individually. By routing only security-relevant operations to SIEM and aggregating workload metrics for observability, customers typically achieve 65-80% reduction in analytics platform ingestion.',
      strategies: [
        { name: 'Operation-Based Routing', description: 'Route admin operations, sharing events, and DLP matches to SIEM. Routine FileAccessed and PageViewed from regular users generate massive volume with near-zero security value.', impact: '60-75% SIEM volume reduction' },
        { name: 'Record Type Filtering', description: 'Prioritize high-value record types: AzureActiveDirectory (admin), DLP, SharePointSharingOperation. Deprioritize routine SharePointFileOperation reads.', impact: '40-60% volume reduction for SIEM' },
        { name: 'Workload Metric Aggregation', description: 'Roll up operation counts and error rates per minute by workload for observability. One metric record per minute replaces thousands of individual audit events.', impact: '90-95% event reduction for observability' },
        { name: 'Modified Properties Trimming', description: 'For non-security destinations, strip large modified_properties and extended_properties JSON arrays that can add 1-5KB per event.', impact: '15-25% per-event size reduction' },
        { name: 'Read Operation Sampling', description: 'Sample FileAccessed, FileDownloaded, and PageViewed from regular (non-admin) users at 1-5%. Retain all writes, deletes, and sharing operations at full fidelity.', impact: '50-70% volume reduction for file activity' }
      ]
    },
    packFunctions: [
      { name: 'Parse JSON Content Blobs', description: 'Parse Management Activity API response. Break content blob arrays into individual audit events. Handle both polling (batch) and webhook (single event) formats.' },
      { name: 'Normalize Timestamps', description: 'Parse creation_time to _time. Validate ISO 8601 UTC format and ensure consistent precision across workloads.' },
      { name: 'Classify by Workload', description: 'Map numeric record_type to workload name (1=ExchangeAdmin, 2=ExchangeItem, 4=AzureAD, 6=SharePoint, 25=Teams). Add workload_category field.' },
      { name: 'Extract Operation Details', description: 'Flatten nested objects (modified_properties, parameters, affected_items) into searchable top-level fields for key operations (role changes, inbox rules, sharing).' },
      { name: 'Tag Sensitive Operations', description: 'Flag operations as sensitive based on patterns: eDiscovery searches, admin role assignments, mailbox delegation, consent grants, DLP policy changes. Add sensitivity_tier field.' },
      { name: 'Route by Record Type', description: 'Add routing tags based on record_type and operation: admin/DLP/sharing to SIEM, routine file reads to Lake-only, metrics to observability.' },
      { name: 'Aggregate Workload Metrics', description: 'Create per-minute rollups: operation count, failure count, unique users by workload and record_type for operational dashboards.' },
      { name: 'Mask PII in Object Paths', description: 'For non-security destinations, redact user-identifiable information from object_id and source_file_name (replace usernames with hashes, mask personal folder paths).' },
      { name: 'Enrich User Context', description: 'Lookup user_id against directory to add department, manager, employment_status, VIP flag. Enables context-aware routing (VIP actions always to SIEM).' },
      { name: 'Add Cribl Metadata', description: 'Add processing metadata: pack version, pipeline name, processing timestamp, content blob source, and routing decision tags.' }
    ]
  },
  'prisma-access-traffic': {
    sourceDescription: 'Palo Alto Prisma Access Traffic Logs collected via Cortex Data Lake (CDL) log forwarding or syslog from Prisma Access cloud management into Cribl Stream',
    collectionMethod: 'Cortex Data Lake HTTPS log forwarding / Syslog from Prisma Access Cloud Management (TCP/TLS) / S3 export from CDL',
    dataFlow: 'Prisma Access SASE traffic logs forwarded from Cortex Data Lake to Cribl Stream via HTTPS or syslog. Single collection point replaces multiple CDL-to-SIEM integrations. Parsed, enriched with user/gateway context, and routed to security, observability, and storage destinations.',
    destinations: [
      {
        type: 'Security SIEM',
        examples: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security'],
        strategy: 'Send all deny/drop/reset actions, threat detections (threat_name populated), sessions with WildFire verdicts, and traffic from quarantined or high-risk users. Include gateway/user identity fields for SASE-aware correlation. Drop bandwidth-only metrics.',
        fieldCount: 22,
        estimatedReduction: '40-55% event reduction vs full fidelity',
        filters: [
          'Include all action=deny, drop, or reset events',
          'Include all events where threat_name IS NOT NULL',
          'Include all events where wildfire_verdict != benign',
          'Include cross-zone traffic (untrust → trust, clientless-vpn → trust)',
          'Include sessions with anomalous byte ratios (potential exfiltration)',
          'Sample routine action=allow to trusted destinations at 10-20%'
        ],
        excludedFields: ['nat_source_ip', 'nat_destination_ip', 'session_duration', 'tunnel_type', 'service_connection']
      },
      {
        type: 'Observability Platform',
        examples: ['Dynatrace', 'Datadog', 'New Relic', 'Grafana', 'Splunk Observability'],
        strategy: 'Send bandwidth metrics (bytes_sent/received), session duration, and gateway health indicators. Focus on per-gateway throughput, per-user bandwidth consumption, and application performance. Drop security-specific fields like threat details and user identity.',
        fieldCount: 18,
        estimatedReduction: '50-65% field reduction vs full fidelity',
        filters: [
          'Aggregate per minute by gateway_name, application, source_zone, destination_zone',
          'Include all deny events at full fidelity (connectivity issues)',
          'Include sessions with session_duration > 3600s (long-lived connections)',
          'Sample routine allow events at 10% for latency baseline',
          'Always include mobile_user sessions at full fidelity for VPN health'
        ],
        excludedFields: ['source_user', 'nat_source_ip', 'nat_destination_ip', 'threat_name', 'threat_category', 'threat_severity', 'wildfire_verdict', 'file_name', 'file_type', 'url_category']
      },
      {
        type: 'Full-Fidelity Storage',
        examples: ['Cribl Lake', 'Amazon S3', 'Azure Blob', 'Google Cloud Storage'],
        strategy: 'Retain complete SASE traffic log with all fields including user identity, gateway routing, threat verdicts, and session metrics. Supports compliance, user activity forensics, and SASE architecture troubleshooting.',
        fieldCount: 30,
        estimatedReduction: '0% — all fields retained',
        filters: [
          'Include ALL traffic events',
          'Preserve all parsed fields and SASE-specific context',
          'Add Cribl processing metadata',
          'Add gateway region and mobile user enrichments'
        ],
        excludedFields: [],
        retentionGuidance: '30 days hot (Cribl Lake), 90 days warm (S3 Standard-IA), 365 days cold (S3 Glacier)'
      },
      {
        type: 'Cribl Search',
        examples: ['Cribl Search'],
        strategy: 'Full-fidelity SASE traffic logs indexed for user activity investigation, threat hunting across remote users, and SASE connectivity troubleshooting.',
        fieldCount: 30,
        estimatedReduction: '0% — searchable full fidelity',
        filters: [
          'All events searchable',
          'Optimized for source_user, gateway_name, application, and time-range queries',
          'Support mobile user session reconstruction',
          'Enable replay to SIEM when investigating remote user compromise'
        ],
        excludedFields: [],
        replayWorkflow: 'When a remote user account is suspected compromised, search all Prisma Access traffic for that user → identify unusual applications, destinations, and data volumes → replay suspicious sessions to SIEM for correlation with endpoint and identity data.'
      }
    ],
    costOptimization: {
      summary: 'Prisma Access traffic logs mirror traditional firewall logs but with SASE-specific volume patterns — remote users generate continuous session logs. By routing only threat detections and policy violations to SIEM and aggregating bandwidth metrics for observability, customers typically achieve 45-65% reduction in analytics platform ingestion while maintaining full SASE visibility.',
      strategies: [
        { name: 'Action-Based Routing', description: 'Route deny/drop/reset and threat events to SIEM. Routine allow events to trusted SaaS applications generate massive volume with minimal security value.', impact: '40-55% SIEM volume reduction' },
        { name: 'Gateway Aggregation', description: 'Roll up traffic metrics per minute by gateway_name, application, and zone for observability. One metric record per gateway per minute replaces thousands of individual flow records.', impact: '60-75% event reduction for observability' },
        { name: 'Mobile User Sampling', description: 'Sample routine mobile user allow traffic at 10-20%. Always keep deny events and threat detections at full fidelity for security.', impact: '30-50% mobile user volume reduction' },
        { name: 'Threat Field Pruning', description: 'For observability destinations, strip threat_name, threat_category, wildfire_verdict, and file details. These are security-only fields adding size without ops value.', impact: '10-15% per-event size reduction' },
        { name: 'NAT Field Removal', description: 'Drop nat_source_ip and nat_destination_ip for observability destinations. Gateway egress IPs are only needed for external security correlation.', impact: '5-10% per-event size reduction' }
      ]
    },
    packFunctions: [
      { name: 'Parse CDL Traffic Log', description: 'Parse Cortex Data Lake traffic log format (JSON or CSV) into named fields. Handle CDL-specific field naming conventions.' },
      { name: 'Normalize Timestamps', description: 'Convert Prisma Access timestamp formats to ISO 8601. Handle timezone normalization from CDL UTC timestamps.' },
      { name: 'Classify SASE Context', description: 'Tag events as mobile-user, remote-network, or service-connection based on source_zone and gateway metadata.' },
      { name: 'Enrich Gateway Region', description: 'Add geographic region context to gateway_name for regional performance analysis and user-to-gateway mapping.' },
      { name: 'Tag User Risk', description: 'Cross-reference source_user with identity risk signals (quarantine state, HIP failures, recent auth anomalies).' },
      { name: 'Calculate Bandwidth Metrics', description: 'Add total_bytes (bytes_sent + bytes_received) and bytes_per_second for performance analysis.' },
      { name: 'Detect Exfiltration Patterns', description: 'Flag sessions with high bytes_sent-to-received ratio to external destinations as potential data exfiltration.' },
      { name: 'Shape for SIEM', description: 'Create security-optimized variant: keep threat fields, user identity, policy context. Drop bandwidth-only metrics.' },
      { name: 'Aggregate for Observability', description: 'Create per-minute rollups: bytes, sessions, denies by gateway, application, and zone for SASE health dashboards.' },
      { name: 'Preserve Full Fidelity', description: 'Pass through complete event with all SASE context and enrichments for storage and Cribl Search indexing.' }
    ]
  },
  'prisma-access-gp': {
    sourceDescription: 'Palo Alto Prisma Access GlobalProtect connection and authentication logs collected via Cortex Data Lake or syslog into Cribl Stream',
    collectionMethod: 'Cortex Data Lake HTTPS log forwarding / Syslog from Prisma Access management (TCP/TLS) / API polling from Prisma Access Insights',
    dataFlow: 'GlobalProtect VPN connection events (connect, disconnect, auth, HIP reports) forwarded from Prisma Access to Cribl Stream. Parsed, enriched with device posture context, and routed to security for auth/posture events and observability for connection health.',
    destinations: [
      {
        type: 'Security SIEM',
        examples: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security'],
        strategy: 'Send authentication failures, HIP failures, connections from anomalous geolocations, split-tunnel sessions, quarantined devices, and certificate issues. Drop routine successful connections from known devices.',
        fieldCount: 22,
        estimatedReduction: '50-65% event reduction vs full fidelity',
        filters: [
          'Include all event_type=auth-fail events',
          'Include all events where hip_match_type=not-matched (posture failures)',
          'Include all events where quarantine_state=true',
          'Include connections from unusual source_ip geolocations',
          'Include all events where split_tunnel=true (security bypass)',
          'Include certificate authentication failures',
          'Sample routine successful connections from known devices at 10%'
        ],
        excludedFields: ['login_duration_ms', 'portal_region', 'bytes_sent', 'bytes_received', 'connection_duration', 'virtual_system']
      },
      {
        type: 'Observability Platform',
        examples: ['Dynatrace', 'Datadog', 'New Relic', 'Grafana', 'Splunk Observability'],
        strategy: 'Send connection health metrics: login latency, connection duration, bandwidth per user, disconnect rates by reason and gateway. Focus on VPN service health and user experience.',
        fieldCount: 16,
        estimatedReduction: '60-75% event reduction via aggregation',
        filters: [
          'Aggregate per minute: connection count, avg login_duration_ms, disconnect count by gateway, gateway_region',
          'Include all events where login_duration_ms > 5000 at full fidelity (slow auth)',
          'Include all disconnect events with error_code populated',
          'Include client_version distribution per gateway for version health',
          'Drop individual successful connection events (covered by aggregation)'
        ],
        excludedFields: ['device_host_id', 'certificate_cn', 'machine_certificate', 'quarantine_state', 'user (hashed for metrics)', 'source_ip']
      },
      {
        type: 'Full-Fidelity Storage',
        examples: ['Cribl Lake', 'Amazon S3', 'Azure Blob', 'Google Cloud Storage'],
        strategy: 'Retain complete GlobalProtect connection log with all fields for VPN session forensics, device compliance auditing, and user connectivity troubleshooting.',
        fieldCount: 28,
        estimatedReduction: '0% — all fields retained',
        filters: [
          'Include ALL GlobalProtect events regardless of type or outcome',
          'Preserve all posture, device, and authentication context',
          'Add GeoIP enrichment on source_ip',
          'Add Cribl processing metadata and routing tags'
        ],
        excludedFields: [],
        retentionGuidance: '30 days hot (Cribl Lake), 90 days warm (S3 Standard-IA), 365 days cold (S3 Glacier)'
      },
      {
        type: 'Cribl Search',
        examples: ['Cribl Search'],
        strategy: 'Full-fidelity GlobalProtect connection logs indexed for VPN session reconstruction, impossible travel detection, and device posture compliance investigation.',
        fieldCount: 28,
        estimatedReduction: '0% — searchable full fidelity',
        filters: [
          'All events searchable with full field access',
          'Optimized for user, gateway, source_ip, and time-range queries',
          'Support device posture timeline reconstruction',
          'Enable replay to SIEM when investigating compromised remote user'
        ],
        excludedFields: [],
        replayWorkflow: 'When VPN-based attack is suspected, search all GlobalProtect events for the user → map connection locations and devices → identify impossible travel or device anomalies → replay suspicious connection events to SIEM for correlation.'
      }
    ],
    costOptimization: {
      summary: 'GlobalProtect logs generate moderate volume (10K-500K events/day depending on user count) with the majority being routine connect/disconnect events from known users and devices. By routing only authentication and posture failures to SIEM and aggregating connection metrics for observability, customers typically achieve 55-70% reduction in analytics platform ingestion.',
      strategies: [
        { name: 'Auth Result Routing', description: 'Route auth-fail and posture failure events to SIEM. Routine successful connections from known, compliant devices have near-zero security value.', impact: '50-65% SIEM volume reduction' },
        { name: 'Connection Metric Aggregation', description: 'Roll up connection counts, login latency, and bandwidth per minute by gateway for observability. Replaces thousands of individual connect/disconnect events.', impact: '60-75% event reduction for observability' },
        { name: 'Known Device Suppression', description: 'Suppress or sample routine successful connections from devices with passing HIP profiles and known device_host_ids.', impact: '40-60% additional SIEM reduction' },
        { name: 'Disconnect Reason Focus', description: 'Only send disconnect events with non-user-initiated reasons (errors, timeouts, gateway failures) to both SIEM and observability. User-initiated disconnects are low value.', impact: '15-25% volume reduction' },
        { name: 'Version Distribution Sampling', description: 'Send client_version data as hourly summaries rather than per-connection. One distribution snapshot per hour replaces thousands of per-event version fields.', impact: '5-10% per-event size reduction' }
      ]
    },
    packFunctions: [
      { name: 'Parse GP Connection Log', description: 'Parse GlobalProtect connection log format from CDL or syslog into structured fields. Handle connect, disconnect, auth, and HIP report event types.' },
      { name: 'Normalize Timestamps', description: 'Convert Prisma Access timestamps to ISO 8601. Calculate connection_duration from connect/disconnect event pairs.' },
      { name: 'GeoIP on Source IP', description: 'Add geographic context to source_ip for impossible travel detection and regional connection analysis.' },
      { name: 'Classify Connection Type', description: 'Tag events by connection_method, split_tunnel status, and tunnel_type for routing decisions.' },
      { name: 'Evaluate Device Posture', description: 'Cross-reference hip_match_type and hip_profile against expected posture profiles. Flag non-compliant devices.' },
      { name: 'Detect Auth Anomalies', description: 'Flag authentication patterns: failed attempts from new locations, multiple gateway switches, unusual auth_method usage.' },
      { name: 'Calculate Latency Metrics', description: 'Compute login_duration_ms percentiles and flag outliers for VPN service health monitoring.' },
      { name: 'Shape for SIEM', description: 'Create security-optimized variant: auth failures, posture violations, split-tunnel usage, and anomalous geolocations.' },
      { name: 'Aggregate for Observability', description: 'Create per-minute gateway metrics: connection count, avg login latency, disconnect rate, bandwidth by gateway and region.' },
      { name: 'Preserve Full Fidelity', description: 'Pass through complete GP event with all posture and device context for storage and Cribl Search indexing.' }
    ]
  },
  'prisma-cloud-cspm': {
    sourceDescription: 'Prisma Cloud CSPM (Cloud Security Posture Management) alerts and compliance findings collected via webhook, API polling, or S3 export into Cribl Stream',
    collectionMethod: 'Webhook (Prisma Cloud Alert Notification → Cribl HTTP source) / REST API Collector (CSPM Alerts API polling) / S3 export (batch)',
    dataFlow: 'Prisma Cloud CSPM alerts representing cloud misconfigurations and compliance violations forwarded to Cribl Stream. Enriched with compliance framework context and resource metadata, then routed to SIEM for active threats and observability for compliance trending.',
    destinations: [
      {
        type: 'Security SIEM',
        examples: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security'],
        strategy: 'Send high/critical severity alerts, internet-exposed resources, IAM-risk findings, and alerts with high risk scores. Drop low/informational alerts and resolved findings that are compliance-tracking only.',
        fieldCount: 22,
        estimatedReduction: '40-55% event reduction vs full fidelity',
        filters: [
          'Include all alerts with policy_severity=critical or high',
          'Include all alerts where finding_type=exposure or iam-risk',
          'Include all alerts with risk_score > 70',
          'Include all alerts with status=open (active findings)',
          'Include alerts for internet-exposed resources regardless of severity',
          'Drop resolved and dismissed alerts for SIEM (compliance only)',
          'Drop policy_severity=informational alerts'
        ],
        excludedFields: ['remediation_cli', 'resource_config', 'last_updated', 'resource_tags', 'dismiss_reason', 'dismissed_by']
      },
      {
        type: 'Observability Platform',
        examples: ['Dynatrace', 'Datadog', 'New Relic', 'Grafana', 'Splunk Observability'],
        strategy: 'Aggregate compliance posture metrics: open alert count by severity, cloud_type, account, and compliance_standard. Track drift over time and resolution rates. Send individual events for new critical findings only.',
        fieldCount: 14,
        estimatedReduction: '70-85% event reduction via aggregation',
        filters: [
          'Aggregate per hour: open/resolved alert count by cloud_type, account_name, policy_severity, compliance_standard',
          'Include new critical/high alerts at full fidelity for trending dashboards',
          'Track first_seen to last_seen duration for mean-time-to-remediate metrics',
          'Drop individual low/informational alerts (covered by aggregation)',
          'Drop resource_config and remediation_cli for all observability events'
        ],
        excludedFields: ['resource_config', 'remediation_cli', 'resource_rrn', 'risk_reason', 'security_group', 'vpc_id', 'dismissed_by', 'dismiss_reason', 'alert_rule_name']
      },
      {
        type: 'Full-Fidelity Storage',
        examples: ['Cribl Lake', 'Amazon S3', 'Azure Blob', 'Google Cloud Storage'],
        strategy: 'Retain complete CSPM alert with all fields including resource configuration snapshot and remediation context. Supports compliance audit, risk trending, and post-incident cloud forensics.',
        fieldCount: 30,
        estimatedReduction: '0% — all fields retained',
        filters: [
          'Include ALL alerts regardless of status or severity',
          'Preserve resource_config for configuration drift analysis',
          'Preserve remediation_cli for automated response workflows',
          'Add Cribl processing metadata and compliance framework enrichments'
        ],
        excludedFields: [],
        retentionGuidance: '90 days hot (Cribl Lake), 365 days warm (S3 Standard-IA), 7 years cold (S3 Glacier) for compliance'
      },
      {
        type: 'Cribl Search',
        examples: ['Cribl Search'],
        strategy: 'Full-fidelity CSPM alerts indexed for compliance posture investigation, resource configuration history, and cloud security forensics.',
        fieldCount: 30,
        estimatedReduction: '0% — searchable full fidelity',
        filters: [
          'All alerts searchable with full field access',
          'Optimized for account_name, policy_name, resource_type, and cloud_type queries',
          'Support compliance standard and requirement searches',
          'Enable replay to SIEM when investigating cloud infrastructure compromise'
        ],
        excludedFields: [],
        replayWorkflow: 'When cloud compromise is suspected, search CSPM alerts for the affected account → identify open misconfigurations that could have been exploited → correlate with CloudTrail/activity logs → replay relevant findings to SIEM for investigation context.'
      }
    ],
    costOptimization: {
      summary: 'Prisma Cloud CSPM generates moderate volume (10K-100K alerts per day for large multi-cloud environments) with significant duplication from recurring scans detecting the same misconfigurations. By routing only active high-severity findings to SIEM and aggregating compliance metrics for observability, customers typically achieve 45-65% reduction in analytics platform ingestion.',
      strategies: [
        { name: 'Severity-Based Routing', description: 'Route only critical/high severity open alerts to SIEM. Low and informational findings are compliance-tracking only and have near-zero detection value.', impact: '40-55% SIEM volume reduction' },
        { name: 'Status Filtering', description: 'Only send status=open alerts to SIEM. Resolved and dismissed alerts are historical compliance data — send to Lake only.', impact: '20-35% additional SIEM reduction' },
        { name: 'Compliance Metric Aggregation', description: 'Roll up open alert counts per hour by cloud, account, severity, and compliance standard for observability dashboards.', impact: '70-85% event reduction for observability' },
        { name: 'Resource Config Stripping', description: 'Remove resource_config JSON (can be 5-50KB) for all non-full-fidelity destinations. Only needed for forensic configuration analysis.', impact: '30-50% per-event size reduction' },
        { name: 'Deduplication', description: 'Deduplicate recurring alerts for the same resource and policy. Send only first occurrence and status changes, not every scan iteration.', impact: '30-60% volume reduction depending on scan frequency' }
      ]
    },
    packFunctions: [
      { name: 'Parse CSPM Alert', description: 'Parse Prisma Cloud CSPM alert JSON from webhook or API response. Extract nested resource, policy, and compliance objects.' },
      { name: 'Normalize Timestamps', description: 'Parse alert_time, first_seen, last_seen to _time. Calculate exposure_duration from first_seen to current time.' },
      { name: 'Classify Finding Severity', description: 'Tag alerts by effective risk based on policy_severity, risk_score, and internet exposure context.' },
      { name: 'Map Compliance Frameworks', description: 'Expand compliance_standard and compliance_requirement into structured framework mappings (CIS, NIST, PCI, SOC2).' },
      { name: 'Enrich Resource Context', description: 'Add resource ownership, environment tier, and data classification from resource_tags and account metadata lookups.' },
      { name: 'Deduplicate Recurring Alerts', description: 'Suppress repeated alerts for the same resource+policy combination. Emit only on first detection and status changes.' },
      { name: 'Strip Large Fields', description: 'Remove resource_config and remediation_cli for non-full-fidelity destinations to dramatically reduce event size.' },
      { name: 'Shape for SIEM', description: 'Create security-optimized variant: active threats, exposure findings, IAM risks. Map to cloud security alert schema.' },
      { name: 'Aggregate for Compliance Metrics', description: 'Create per-hour compliance posture rollups: open count, resolved count, new count by cloud, account, severity, and framework.' },
      { name: 'Preserve Full Fidelity', description: 'Pass through complete CSPM alert with resource config and remediation for Lake indexing and compliance archive.' }
    ]
  },
  'prisma-cloud-cwp': {
    sourceDescription: 'Prisma Cloud CWP (Cloud Workload Protection) runtime alerts, vulnerability findings, and compliance events collected via webhook or API into Cribl Stream',
    collectionMethod: 'Webhook (Prisma Cloud Compute alert channels → Cribl HTTP source) / REST API Collector (Compute API polling) / Syslog from self-hosted Compute Console',
    dataFlow: 'Prisma Cloud CWP runtime security events, vulnerability scan results, and container compliance findings forwarded to Cribl Stream. Enriched with cluster/namespace context, then routed to SIEM for runtime threats and observability for container health trending.',
    destinations: [
      {
        type: 'Security SIEM',
        examples: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security'],
        strategy: 'Send all runtime alerts (process, network, filesystem anomalies), high-severity vulnerabilities in running containers, interactive shell detections, and incidents with MITRE ATT&CK mappings. Drop routine compliance checks and low-severity image vulnerabilities.',
        fieldCount: 26,
        estimatedReduction: '35-50% event reduction vs full fidelity',
        filters: [
          'Include all type=runtime events (process, network, filesystem anomalies)',
          'Include all type=incident events',
          'Include all events where interactive=true (exec into container)',
          'Include all events where severity=critical or high',
          'Include all events where attack_type IS NOT NULL',
          'Include vulnerabilities with cvss_score >= 9.0 in running containers',
          'Drop type=vulnerability with cvss_score < 7.0 (compliance only)',
          'Drop type=compliance for non-critical compliance_ids'
        ],
        excludedFields: ['collections', 'compliance_id (for runtime events)', 'image_id']
      },
      {
        type: 'Observability Platform',
        examples: ['Dynatrace', 'Datadog', 'New Relic', 'Grafana', 'Splunk Observability'],
        strategy: 'Aggregate container health metrics: vulnerability counts by severity per image/namespace, runtime alert rates per cluster, compliance pass/fail rates. Send individual events for critical runtime anomalies affecting availability.',
        fieldCount: 14,
        estimatedReduction: '70-85% event reduction via aggregation',
        filters: [
          'Aggregate per hour: vulnerability count by severity, image_name, namespace, cluster',
          'Aggregate per minute: runtime alert count by cluster, namespace, rule_name',
          'Include runtime events affecting network connectivity (network_dst_ip blocks)',
          'Include all type=incident events at full fidelity (availability impact)',
          'Drop individual vulnerability findings (covered by aggregation)',
          'Drop all forensic process fields (process_md5, file_md5, parent_process)'
        ],
        excludedFields: ['process_path', 'process_md5', 'process_user', 'process_pid', 'parent_process', 'file_path', 'file_md5', 'interactive', 'attack_type', 'mitre_technique', 'cve_id']
      },
      {
        type: 'Full-Fidelity Storage',
        examples: ['Cribl Lake', 'Amazon S3', 'Azure Blob', 'Google Cloud Storage'],
        strategy: 'Retain complete CWP event with all runtime forensics, vulnerability details, and container context. Supports incident response, vulnerability management lifecycle, and container security auditing.',
        fieldCount: 32,
        estimatedReduction: '0% — all fields retained',
        filters: [
          'Include ALL CWP events regardless of type or severity',
          'Preserve complete runtime forensics (process tree, file hashes, network connections)',
          'Preserve vulnerability and compliance detail for lifecycle tracking',
          'Add Cribl processing metadata and cluster enrichments'
        ],
        excludedFields: [],
        retentionGuidance: '30 days hot (Cribl Lake), 90 days warm (S3 Standard-IA), 365 days cold (S3 Glacier)'
      },
      {
        type: 'Cribl Search',
        examples: ['Cribl Search'],
        strategy: 'Full-fidelity CWP events indexed for container forensics, runtime attack investigation, vulnerability lifecycle analysis, and compliance posture auditing.',
        fieldCount: 32,
        estimatedReduction: '0% — searchable full fidelity',
        filters: [
          'All events searchable with full field access',
          'Optimized for image_name, namespace, cluster, and severity queries',
          'Support runtime attack chain reconstruction via process fields',
          'Enable replay to SIEM when investigating container compromise'
        ],
        excludedFields: [],
        replayWorkflow: 'When container compromise is detected, search CWP events for the affected namespace → reconstruct runtime attack chain (process execution, network connections, file modifications) → identify lateral movement to other containers → replay full forensics to SIEM.'
      }
    ],
    costOptimization: {
      summary: 'Prisma Cloud CWP generates high volume in containerized environments — vulnerability scan results alone can produce millions of findings across image libraries. Runtime alerts are lower volume but higher value. By routing only runtime threats and critical vulnerabilities to SIEM and aggregating container health metrics for observability, customers typically achieve 40-65% reduction in analytics platform ingestion.',
      strategies: [
        { name: 'Type-Based Routing', description: 'Route runtime and incident events to SIEM (high value, lower volume). Route vulnerability and compliance findings to Lake primarily, with only critical CVEs forwarded to SIEM.', impact: '35-50% SIEM volume reduction' },
        { name: 'CVSS Threshold Filtering', description: 'Only send vulnerabilities with cvss_score >= 9.0 to SIEM. Lower-severity CVEs are vulnerability management workflow items, not active security threats.', impact: '60-80% vulnerability event reduction for SIEM' },
        { name: 'Container Health Aggregation', description: 'Roll up vulnerability counts and compliance pass rates per image/namespace/cluster for observability. One summary per scan replaces thousands of individual findings.', impact: '70-85% event reduction for observability' },
        { name: 'Image Deduplication', description: 'Deduplicate vulnerability findings across container instances running the same image. One finding per image+CVE combination instead of per-container.', impact: '50-80% vulnerability volume reduction' },
        { name: 'Compliance Batch Compression', description: 'Compress compliance check results into per-image summary events (pass_count, fail_count, critical_failures) rather than individual check results.', impact: '70-90% compliance event reduction' }
      ]
    },
    packFunctions: [
      { name: 'Parse CWP Event', description: 'Parse Prisma Cloud Compute event JSON from webhook or API. Extract runtime forensics, vulnerability details, and container context.' },
      { name: 'Normalize Timestamps', description: 'Parse timestamp to _time. Handle both ISO 8601 and epoch formats from different event types.' },
      { name: 'Classify Event Type', description: 'Route by type field: runtime events to security path, vulnerability to vuln management path, compliance to compliance path.' },
      { name: 'Enrich Container Context', description: 'Add cluster environment, namespace purpose, image scan history, and owner team from Kubernetes metadata lookups.' },
      { name: 'Map MITRE Techniques', description: 'Expand mitre_technique IDs to technique names and tactic categories for analyst context.' },
      { name: 'Deduplicate Image Vulns', description: 'Collapse vulnerability findings across container instances running identical images into single image-level findings.' },
      { name: 'Score Runtime Risk', description: 'Calculate composite risk score from severity, attack_type, interactive flag, and network exposure for prioritization.' },
      { name: 'Shape for SIEM', description: 'Create security-optimized variant: runtime forensics, critical vulnerabilities, MITRE context. Map to container security event schema.' },
      { name: 'Aggregate for Container Health', description: 'Create per-image, per-namespace vulnerability and compliance summaries for observability dashboards.' },
      { name: 'Preserve Full Fidelity', description: 'Pass through complete CWP event with all forensic detail for storage and Cribl Search indexing.' }
    ]
  },
  'trellix-hx': {
    sourceDescription: 'Trellix HX (Endpoint Detection and Response) alerts and indicator matches collected via syslog, REST API, or webhook into Cribl Stream',
    collectionMethod: 'Syslog (CEF format from HX controller) / REST API Collector (HX Alerts API polling) / Webhook (alert notification channel)',
    dataFlow: 'Trellix HX EDR alerts representing IOC matches, exploit detections, and containment events forwarded to Cribl Stream. Nearly all fields are security-relevant given the EDR nature of the source. Minimal observability routing — primarily agent health metrics only.',
    destinations: [
      {
        type: 'Security SIEM',
        examples: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security'],
        strategy: 'Send virtually all HX alerts to SIEM — this is an EDR source where nearly every event has security value. Include all indicator matches, containment events, and process/file/registry detections. Only suppress duplicate acknowledgments and resolved-without-action alerts.',
        fieldCount: 28,
        estimatedReduction: '10-20% event reduction vs full fidelity',
        filters: [
          'Include ALL events where indicator_name IS NOT NULL',
          'Include ALL events where containment_state != normal',
          'Include ALL events with process_path, file_path, or registry_key populated',
          'Include ALL events with remote_ip or url_accessed populated',
          'Include all event_type=alert and event_type=indicator-match',
          'Drop duplicate resolution acknowledgment events',
          'Drop event_type=acquisition completion notifications (operational only)'
        ],
        excludedFields: ['agent_version', 'condition_id']
      },
      {
        type: 'Observability Platform',
        examples: ['Dynatrace', 'Datadog', 'Grafana'],
        strategy: 'Send only agent health metrics: agent_version distribution, containment state counts, and alert volume rates per host. Trellix HX is primarily a security tool — observability value is limited to infrastructure health.',
        fieldCount: 6,
        estimatedReduction: '90-95% event reduction — only agent health metrics',
        filters: [
          'Aggregate per hour: agent_version distribution across fleet',
          'Aggregate per minute: alert count by hostname, indicator_severity',
          'Include containment_state changes at full fidelity (operational impact)',
          'Drop ALL indicator, process, file, and network details',
          'Drop all hash values and forensic fields'
        ],
        excludedFields: ['indicator_name', 'indicator_category', 'indicator_severity', 'process_path', 'process_id', 'process_name', 'parent_process_path', 'parent_process_name', 'username', 'md5', 'sha256', 'matched_at', 'source', 'resolution', 'condition_id', 'url_accessed', 'file_path', 'file_name', 'registry_key', 'registry_value', 'remote_ip', 'remote_port']
      },
      {
        type: 'Full-Fidelity Storage',
        examples: ['Cribl Lake', 'Amazon S3', 'Azure Blob'],
        strategy: 'Retain complete HX alert with all forensic context for incident response, indicator tuning, and historical threat hunting.',
        fieldCount: 30,
        estimatedReduction: '0% — all fields retained',
        filters: [
          'Include ALL HX events at full fidelity',
          'Preserve complete forensic context (hashes, paths, registry)',
          'Preserve containment history and resolution lifecycle',
          'Add Cribl processing metadata'
        ],
        excludedFields: [],
        retentionGuidance: '30 days hot (Cribl Lake), 90 days warm (S3 Standard-IA), 365 days cold (S3 Glacier)'
      },
      {
        type: 'Cribl Search',
        examples: ['Cribl Search'],
        strategy: 'Full-fidelity HX alerts indexed for threat hunting, indicator effectiveness analysis, and incident timeline reconstruction.',
        fieldCount: 30,
        estimatedReduction: '0% — searchable full fidelity',
        filters: [
          'All events searchable with full field access',
          'Optimized for hostname, indicator_name, sha256, and time-range queries',
          'Support IOC hash searches across fleet history',
          'Enable replay to SIEM when new indicators are retroactively applied'
        ],
        excludedFields: [],
        replayWorkflow: 'When new threat intelligence identifies a previously unknown IOC, search HX alert history for any historical matches → identify affected endpoints → assess containment status → replay full alert context to SIEM for coordinated response.'
      }
    ],
    costOptimization: {
      summary: 'Trellix HX is a low-to-moderate volume source (typically 1K-50K alerts/day) where nearly every event has direct security value. Cost optimization is limited compared to high-volume sources — the primary strategy is routing only agent health to observability and ensuring full forensic context reaches SIEM without unnecessary field bloat.',
      strategies: [
        { name: 'Resolution Deduplication', description: 'Suppress duplicate resolution acknowledgment and status update events. Keep only initial alert and final resolution state.', impact: '10-20% volume reduction' },
        { name: 'Acquisition Suppression', description: 'Drop acquisition completion and triage package notifications — these are operational workflow events with no detection value.', impact: '5-15% volume reduction' },
        { name: 'Agent Health Aggregation', description: 'Aggregate agent_version and containment_state into hourly fleet summaries for observability instead of per-event forwarding.', impact: '90-95% event reduction for observability' },
        { name: 'Condition ID Trimming', description: 'Remove condition_id from SIEM-bound events — it is an internal reference useful only for HX console correlation.', impact: '2-5% per-event size reduction' },
        { name: 'Hash Deduplication', description: 'When the same hash triggers alerts on multiple endpoints, send full detail for first occurrence and summary (host count, host list) for subsequent.', impact: '10-30% reduction during widespread campaigns' }
      ]
    },
    packFunctions: [
      { name: 'Parse HX Alert', description: 'Parse Trellix HX alert from CEF syslog or JSON API response. Extract indicator details, endpoint context, and forensic artifacts.' },
      { name: 'Normalize Timestamps', description: 'Parse timestamp and matched_at to _time. Handle both CEF and API timestamp formats.' },
      { name: 'Extract Process Tree', description: 'Parse process_path and parent_process_path into structured process lineage for detection correlation.' },
      { name: 'Classify Indicator Severity', description: 'Map indicator_category and indicator_severity to unified severity tiers for consistent alerting.' },
      { name: 'Enrich Host Context', description: 'Add host environment, criticality tier, and owner team from endpoint inventory lookup.' },
      { name: 'Deduplicate Resolutions', description: 'Suppress repeated resolution status updates — keep only initial alert and final resolved/false-positive state.' },
      { name: 'Tag Containment Actions', description: 'Flag containment state changes and add response context (who contained, when, auto vs manual).' },
      { name: 'Shape for SIEM', description: 'Create security-optimized variant with full forensic context. Map to EDR alert CIM schema with MITRE enrichment where available.' },
      { name: 'Aggregate Agent Health', description: 'Create hourly agent health summaries: version distribution, containment counts, alert volume per host for fleet monitoring.' },
      { name: 'Preserve Full Fidelity', description: 'Pass through complete HX alert with all forensic artifacts for storage and Cribl Search indexing.' }
    ]
  },
  'trellix-nx': {
    sourceDescription: 'Trellix NX (Network Detection and Response) alerts from network sandbox analysis collected via syslog or API into Cribl Stream',
    collectionMethod: 'Syslog (CEF format from NX appliance) / REST API Collector (NX Alerts API) / SMTP notification parsing',
    dataFlow: 'Trellix NX network threat alerts representing malware downloads, C2 callbacks, and sandbox-analyzed threats forwarded to Cribl Stream. Primarily security-focused source with observability limited to sensor health and throughput metrics.',
    destinations: [
      {
        type: 'Security SIEM',
        examples: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security'],
        strategy: 'Send all NX alerts to SIEM — network sandbox detections are inherently high-value, low-volume security events. Include complete malware details, C2 indicators, and sandbox analysis results. Only suppress sensor health-check events.',
        fieldCount: 28,
        estimatedReduction: '5-15% event reduction vs full fidelity',
        filters: [
          'Include ALL events where malware_name IS NOT NULL',
          'Include ALL events where cnc_service_address IS NOT NULL (C2 callbacks)',
          'Include ALL events with alert_type=malware-object or malware-callback',
          'Include ALL events with severity=critical or major',
          'Include all web-infection and domain-match events',
          'Drop sensor internal health-check and connectivity test events'
        ],
        excludedFields: ['interface']
      },
      {
        type: 'Observability Platform',
        examples: ['Dynatrace', 'Datadog', 'Grafana'],
        strategy: 'Send sensor health metrics only: alert volume rates, protocol distribution, sensor throughput, and VLAN coverage. Trellix NX is a pure security tool — observability is limited to ensuring the sensor itself is healthy.',
        fieldCount: 8,
        estimatedReduction: '85-95% event reduction — sensor health only',
        filters: [
          'Aggregate per minute: alert count by sensor_name, severity, alert_type',
          'Aggregate per minute: protocol distribution by sensor_name',
          'Include sensor connectivity and health status events at full fidelity',
          'Drop ALL malware details, C2 indicators, and forensic fields',
          'Drop all hash values, URLs, and OS change details'
        ],
        excludedFields: ['malware_name', 'malware_md5', 'malware_sha256', 'cnc_service_address', 'cnc_service_port', 'os_changes_type', 'os_changes_path', 'url', 'http_method', 'user_agent', 'explanation', 'file_type', 'file_size', 'src_mac', 'alert_name']
      },
      {
        type: 'Full-Fidelity Storage',
        examples: ['Cribl Lake', 'Amazon S3', 'Azure Blob'],
        strategy: 'Retain complete NX alert with full sandbox analysis, malware hashes, C2 indicators, and network context for threat intelligence correlation and incident response.',
        fieldCount: 30,
        estimatedReduction: '0% — all fields retained',
        filters: [
          'Include ALL NX alerts at full fidelity',
          'Preserve complete sandbox analysis (os_changes, explanation)',
          'Preserve all hash values for retroactive IOC matching',
          'Add Cribl processing metadata and threat intel enrichments'
        ],
        excludedFields: [],
        retentionGuidance: '30 days hot (Cribl Lake), 90 days warm (S3 Standard-IA), 365 days cold (S3 Glacier)'
      },
      {
        type: 'Cribl Search',
        examples: ['Cribl Search'],
        strategy: 'Full-fidelity NX alerts indexed for threat hunting, IOC searches across network history, and malware campaign analysis.',
        fieldCount: 30,
        estimatedReduction: '0% — searchable full fidelity',
        filters: [
          'All alerts searchable with full field access',
          'Optimized for src_ip, dst_ip, malware_name, and malware_sha256 queries',
          'Support C2 infrastructure searches across alert history',
          'Enable replay to SIEM when new threat intel identifies historical C2 domains'
        ],
        excludedFields: [],
        replayWorkflow: 'When new C2 infrastructure is identified by threat intel, search NX alert history for any connections to those IPs/domains → identify affected internal hosts → correlate with endpoint data → replay full detection context to SIEM for incident scoping.'
      }
    ],
    costOptimization: {
      summary: 'Trellix NX is a low-volume, high-value source — typically generating 100-5,000 alerts per day depending on network exposure and threat landscape. Nearly every alert has direct security value from sandbox analysis. Cost optimization is minimal but focused on keeping observability destinations lean and deduplicating campaign-level alerts.',
      strategies: [
        { name: 'Sensor Health Isolation', description: 'Route only sensor health and throughput metrics to observability. All actual threat detections go to SIEM and Lake — they are inherently high-value.', impact: '85-95% event reduction for observability' },
        { name: 'Campaign Deduplication', description: 'When the same malware hash triggers alerts across multiple internal hosts, send full sandbox detail for first detection and summary (affected_hosts list) for subsequent.', impact: '10-40% reduction during active campaigns' },
        { name: 'Health Check Suppression', description: 'Drop periodic sensor health-check events that confirm normal operation. Only forward health events indicating degradation or failure.', impact: '5-15% total volume reduction' },
        { name: 'Interface Field Removal', description: 'Remove interface field for SIEM destinations — the sensor_name provides sufficient deployment context without interface-level detail.', impact: '2-5% per-event size reduction' },
        { name: 'Explanation Trimming', description: 'For observability and real-time alerting, truncate or remove the lengthy explanation field (can be 1-5KB of sandbox analysis text). Retain full text only in Lake.', impact: '15-25% per-event size reduction for non-Lake destinations' }
      ]
    },
    packFunctions: [
      { name: 'Parse NX Alert', description: 'Parse Trellix NX alert from CEF syslog or JSON API response. Extract malware details, network 5-tuple, and sandbox analysis results.' },
      { name: 'Normalize Timestamps', description: 'Parse timestamp to _time. Handle CEF timestamp formats and normalize timezone from appliance local time.' },
      { name: 'Extract Malware Details', description: 'Parse malware_name, hashes (MD5, SHA256), file_type, and file_size into structured fields from nested alert data.' },
      { name: 'Extract C2 Indicators', description: 'Parse cnc_service_address and cnc_service_port from callback detection events. Normalize IP vs domain indicators.' },
      { name: 'Parse Sandbox Results', description: 'Extract os_changes (registry, file, process modifications) from sandbox analysis into structured arrays.' },
      { name: 'Threat Intel Enrichment', description: 'Cross-reference malware_sha256 and cnc_service_address against external threat feeds for campaign attribution and additional context.' },
      { name: 'Classify Alert Severity', description: 'Map NX severity and alert_type to unified severity tiers. Flag C2 callbacks as critical regardless of NX-assigned severity.' },
      { name: 'Shape for SIEM', description: 'Create security-optimized variant with complete threat context. Map to network threat detection CIM schema.' },
      { name: 'Aggregate Sensor Metrics', description: 'Create per-minute sensor health metrics: alert rate, protocol distribution, VLAN coverage for sensor monitoring dashboards.' },
      { name: 'Preserve Full Fidelity', description: 'Pass through complete NX alert with full sandbox analysis for storage and Cribl Search indexing.' }
    ]
  },
  'cisco-secure-email': {
    sourceDescription: 'Cisco Secure Email Gateway (formerly IronPort/ESA) message tracking and security event logs collected via syslog or API into Cribl Stream',
    collectionMethod: 'Syslog (TCP/TLS from ESA appliance) / REST API Collector (AsyncOS API for message tracking) / Log subscription (SCP/FTP push)',
    dataFlow: 'Cisco Secure Email message processing logs forwarded to Cribl Stream via syslog. Events correlated by MID to reconstruct full message lifecycle. Enriched with reputation and authentication context, then routed to SIEM for threats/DLP and observability for delivery health.',
    destinations: [
      {
        type: 'Security SIEM',
        examples: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security'],
        strategy: 'Send spam/phishing detections, DLP violations, AMP malware findings, authentication failures (SPF/DKIM/DMARC fail), and quarantined messages. Drop routine clean message delivery events.',
        fieldCount: 26,
        estimatedReduction: '60-75% event reduction vs full fidelity',
        filters: [
          'Include all events where verdict != clean',
          'Include all events where action=quarantined or action=dropped',
          'Include all events where amp_verdict != clean',
          'Include all events where dlp_policy IS NOT NULL',
          'Include all events where spf_result=fail or dmarc_result=fail',
          'Include all events where url_reputation indicates malicious',
          'Include all events where outbreak_filter matched',
          'Sample routine verdict=clean delivered messages at 1-5%'
        ],
        excludedFields: ['dcid', 'message_size', 'icid (for non-correlation use)', 'sender_group (when verdict provides context)']
      },
      {
        type: 'Observability Platform',
        examples: ['Dynatrace', 'Datadog', 'New Relic', 'Grafana', 'Splunk Observability'],
        strategy: 'Aggregate email delivery metrics: message volume, delivery rate, bounce rate, spam rate, and reputation distribution per minute. Send individual events for delivery failures and queue buildup indicators.',
        fieldCount: 12,
        estimatedReduction: '85-95% event reduction via aggregation',
        filters: [
          'Aggregate per minute: message count, delivered/bounced/quarantined count by direction, verdict, sender_group',
          'Aggregate per minute: avg message_size, total volume by direction',
          'Include all action=bounced events at full fidelity (delivery issues)',
          'Include all events where tls_status=failed (encryption failures)',
          'Drop all security-specific fields (hashes, DLP, AMP, URL details)',
          'Drop subject, from_address, to_address for observability'
        ],
        excludedFields: ['from_address', 'to_address', 'subject', 'attachment_name', 'attachment_type', 'attachment_sha256', 'amp_verdict', 'amp_threat_name', 'content_filter_name', 'dlp_policy', 'dlp_severity', 'url_category', 'url_reputation', 'outbreak_filter', 'authentication_results', 'x_originating_ip']
      },
      {
        type: 'Full-Fidelity Storage',
        examples: ['Cribl Lake', 'Amazon S3', 'Azure Blob', 'Google Cloud Storage'],
        strategy: 'Retain complete email processing log with all fields for compliance audit (email retention), phishing investigation forensics, and DLP incident response.',
        fieldCount: 32,
        estimatedReduction: '0% — all fields retained',
        filters: [
          'Include ALL message events regardless of verdict or action',
          'Preserve complete authentication results (SPF/DKIM/DMARC)',
          'Preserve attachment hashes for retroactive IOC matching',
          'Add Cribl processing metadata and MID correlation enrichments'
        ],
        excludedFields: [],
        retentionGuidance: '30 days hot (Cribl Lake), 90 days warm (S3 Standard-IA), 365 days cold (S3 Glacier) — may require 7 years for regulatory compliance'
      },
      {
        type: 'Cribl Search',
        examples: ['Cribl Search'],
        strategy: 'Full-fidelity email logs indexed for phishing campaign investigation, DLP incident forensics, message tracking, and sender reputation analysis.',
        fieldCount: 32,
        estimatedReduction: '0% — searchable full fidelity',
        filters: [
          'All events searchable with full field access',
          'Optimized for from_address, to_address, subject, attachment_sha256, and time-range queries',
          'Support MID-based message lifecycle reconstruction',
          'Enable replay to SIEM when investigating phishing campaigns'
        ],
        excludedFields: [],
        replayWorkflow: 'When a phishing campaign is identified, search email logs for all messages with matching sender patterns, subjects, or attachment hashes → identify all recipients → replay threat-related messages to SIEM for correlation with endpoint click/execution data.'
      }
    ],
    costOptimization: {
      summary: 'Cisco Secure Email logs are high volume for organizations processing millions of messages per day. The vast majority of events are routine clean message deliveries with zero security or operational value for analytics. By routing only threats, DLP matches, and authentication failures to SIEM and aggregating delivery metrics for observability, customers typically achieve 65-80% reduction in analytics platform ingestion.',
      strategies: [
        { name: 'Verdict-Based Routing', description: 'Route only verdict != clean events to SIEM. Clean delivered messages generate massive volume with near-zero security value once past the gateway.', impact: '60-75% SIEM volume reduction' },
        { name: 'Delivery Metric Aggregation', description: 'Roll up message counts, delivery rates, and volume per minute by direction and verdict for observability. One metric record per minute replaces thousands of individual message events.', impact: '85-95% event reduction for observability' },
        { name: 'MID Correlation at Pipeline', description: 'Correlate injection, processing, and delivery events by MID at the Cribl pipeline. Send single correlated event instead of 3-5 separate log lines per message.', impact: '60-80% event count reduction' },
        { name: 'Subject Line Trimming', description: 'For observability destinations, remove subject field entirely (PII, no operational value). For SIEM, truncate to first 100 characters.', impact: '5-10% per-event size reduction' },
        { name: 'Clean Message Sampling', description: 'Sample clean delivered messages at 1-5% for baseline metrics. All threats, DLP, auth failures, and bounces remain at full fidelity.', impact: '50-70% volume reduction for SIEM' }
      ]
    },
    packFunctions: [
      { name: 'Parse ESA Syslog', description: 'Parse Cisco ESA syslog format. Handle multiple log types: mail_logs, amp, content_filter, and message_tracking. Correlate by MID.' },
      { name: 'Correlate by MID', description: 'Group related log entries by Message ID (MID) to reconstruct complete message processing lifecycle: injection → processing → delivery.' },
      { name: 'Extract Authentication Results', description: 'Parse SPF, DKIM, and DMARC results from authentication_results header into individual structured fields.' },
      { name: 'Classify Verdict', description: 'Normalize verdict from multiple detection engines (anti-spam, AMP, outbreak filter, content filter) into unified verdict field.' },
      { name: 'Extract Attachment Details', description: 'Parse attachment information: filename, MIME type, SHA-256 hash, and AMP verdict per attachment.' },
      { name: 'Reputation Enrichment', description: 'Enrich sender IP against SenderBase/Talos reputation data. Add sender_reputation score and sender_group classification.' },
      { name: 'Tag Direction', description: 'Classify messages as inbound, outbound, or internal based on from_address and to_address domain matching against known domains.' },
      { name: 'Shape for SIEM', description: 'Create security-optimized variant: threats, DLP, auth failures, quarantine actions. Map to email security CIM schema.' },
      { name: 'Aggregate for Delivery Metrics', description: 'Create per-minute delivery health metrics: message count, verdict distribution, bounce rate, TLS status by direction.' },
      { name: 'Preserve Full Fidelity', description: 'Pass through complete correlated message event with all security verdicts and delivery context for storage and Cribl Search indexing.' }
    ]
  },
  'cisco-umbrella': {
    sourceDescription: 'Cisco Umbrella DNS and proxy logs collected from S3 (managed bucket) into Cribl Stream via S3 Collector',
    collectionMethod: 'S3 Collector (Umbrella publishes CSV logs to customer-managed or Cisco-managed S3 bucket) / Umbrella Reporting API',
    dataFlow: 'Cisco Umbrella DNS and proxy logs delivered to S3 as gzipped CSV files. Cribl Stream S3 Collector ingests new objects via SQS notification. Events parsed from CSV, enriched with category and threat context, then routed: block/threat events to SIEM, query volume and latency metrics to observability, full fidelity to storage and Cribl Search.',
    destinations: [
      {
        type: 'Security SIEM',
        examples: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security'],
        strategy: 'Send all blocked requests, threat detections, DLP matches, and AMP verdicts. Include proxied requests to suspicious categories. Drop routine allowed DNS queries with no security indicators.',
        fieldCount: 22,
        estimatedReduction: '60-75% event reduction vs full fidelity',
        filters: [
          'Include all events where action=Blocked',
          'Include all events where threats IS NOT NULL',
          'Include all events where amp_verdict != clean',
          'Include all events where dlp_matched=true',
          'Include all events where categories contain security-relevant categories (Malware, Phishing, C2, Cryptomining)',
          'Include proxied requests with suspicious content_type (executables, scripts)',
          'Sample routine action=Allowed DNS queries at 5-10% for baseline'
        ],
        excludedFields: ['bundle_id', 'data_center', 'origin_id', 'request_size', 'response_size']
      },
      {
        type: 'Observability Platform',
        examples: ['Dynatrace', 'Datadog', 'New Relic', 'Grafana', 'Splunk Observability'],
        strategy: 'Aggregate DNS query volume, response code distribution, and category breakdown per minute. Send individual events for high-latency responses and service errors. Focus on query rates, block rates, and data center health.',
        fieldCount: 14,
        estimatedReduction: '85-92% event reduction via aggregation',
        filters: [
          'Aggregate per minute: query count by action, query_type, response_code, categories',
          'Aggregate per minute: request_size and response_size totals by identity_type',
          'Include all events with response_code indicating errors (SERVFAIL, REFUSED)',
          'Include per-data-center health metrics',
          'Drop all security-specific fields (threats, file_hash, amp_verdict, dlp_matched)',
          'Drop identity and URL fields for observability'
        ],
        excludedFields: ['identity', 'internal_ip', 'url', 'referer', 'user_agent', 'file_name', 'file_hash', 'amp_verdict', 'dlp_matched', 'threats', 'threat_type', 'blocked_categories', 'policy_identity', 'content_type']
      },
      {
        type: 'Full-Fidelity Storage',
        examples: ['Cribl Lake', 'Amazon S3', 'Azure Blob', 'Google Cloud Storage'],
        strategy: 'Retain complete parsed Umbrella event with all fields, enrichments, and original CSV data. Full forensic record for threat investigation and compliance.',
        fieldCount: 30,
        estimatedReduction: '0% — all fields retained',
        filters: [
          'Include ALL events regardless of action or threat status',
          'Preserve all parsed fields from CSV',
          'Add Cribl processing metadata (pipeline version, timestamp)',
          'Add collection metadata (S3 source bucket, object key)'
        ],
        excludedFields: [],
        retentionGuidance: '90 days hot (Cribl Lake), 365 days warm (S3 Standard-IA), 7 years cold (S3 Glacier) for compliance'
      },
      {
        type: 'Cribl Search',
        examples: ['Cribl Search'],
        strategy: 'Full-fidelity Umbrella logs indexed for interactive investigation, domain reputation analysis, and user activity tracking. Primary tool for DNS-layer threat hunting.',
        fieldCount: 30,
        estimatedReduction: '0% — searchable full fidelity',
        filters: [
          'All events searchable with full field access',
          'Optimized for domain, identity, and time-range queries',
          'Support field-level search across all parsed fields',
          'Enable replay to SIEM when new malicious domains are identified'
        ],
        excludedFields: [],
        replayWorkflow: 'When threat intel identifies a new malicious domain, search Umbrella logs for all historical queries to that domain → identify affected users/endpoints → replay threat events to SIEM for incident response correlation.'
      }
    ],
    costOptimization: {
      summary: 'Cisco Umbrella generates extremely high DNS query volume. The vast majority of events are routine allowed queries with zero security value. By routing only blocks, threats, and DLP matches to SIEM and aggregating query metrics for observability, customers typically achieve 65-80% reduction in analytics platform ingestion while retaining full DNS forensic capability.',
      strategies: [
        { name: 'Action-Based Routing', description: 'Route only action=Blocked and threat-flagged events to SIEM. Allowed queries without security indicators represent 80-90% of volume with minimal security value.', impact: '60-75% SIEM volume reduction' },
        { name: 'Query Metric Aggregation', description: 'Roll up DNS query counts, category distributions, and response code rates per minute for observability dashboards. One metric record per minute replaces thousands of individual queries.', impact: '85-92% event reduction for observability' },
        { name: 'Proxy Log Filtering', description: 'For proxy/intelligent proxy logs, keep only blocked, threat, or DLP events. Allowed proxy traffic is lower volume but still filterable.', impact: '40-60% proxy log reduction' },
        { name: 'Domain Deduplication', description: 'Deduplicate repeated queries to the same domain from the same identity within short windows. Send single event with count.', impact: '20-40% volume reduction for repeated lookups' },
        { name: 'Field Pruning', description: 'Remove bundle_id, data_center, and origin_id for SIEM destinations. Remove identity/URL fields for observability.', impact: '10-15% per-event size reduction' }
      ]
    },
    packFunctions: [
      { name: 'Parse CSV', description: 'Parse Umbrella CSV log format into named fields. Handle both DNS log and proxy log schemas based on field count detection.' },
      { name: 'Classify Action', description: 'Normalize action field (Allowed, Blocked, Proxied) and tag security relevance. Map to unified allow/block/inspect taxonomy.' },
      { name: 'Extract Domain Components', description: 'Derive parent domain, subdomain, and TLD from the domain field. Handle multi-part TLDs (co.uk, com.au).' },
      { name: 'Geo-Enrich IP', description: 'Enrich external_ip and destination_ip with geo context (country, city, ASN). Tag known cloud provider ranges.' },
      { name: 'Tag Categories', description: 'Parse and normalize Umbrella categories. Flag security-relevant categories (Malware, Phishing, C2, Cryptomining) for routing decisions.' },
      { name: 'Route by Verdict', description: 'Add routing metadata based on action, threats, and category classification. Set route_security=true for blocked/threat events.' },
      { name: 'Aggregate Query Metrics', description: 'Roll up DNS query counts per minute by action, query_type, response_code, and category for observability output.' },
      { name: 'Detect DGA Patterns', description: 'Calculate Shannon entropy on domain labels. Flag high-entropy domains and excessive NXDOMAIN rates as potential DGA activity.' },
      { name: 'Normalize Timestamps', description: 'Convert Umbrella timestamp format to ISO 8601. Handle timezone normalization from UTC.' },
      { name: 'Add Cribl Metadata', description: 'Add processing metadata: pipeline version, pack version, collection source, processing timestamp, and routing decisions applied.' }
    ]
  },
  'checkpoint-fw': {
    sourceDescription: 'Check Point Firewall logs collected via syslog (CEF/LEEF format) or Log Exporter into Cribl Stream',
    collectionMethod: 'Syslog (CEF format via Log Exporter to TCP/TLS 6514) / SmartConsole Log Exporter / OPSEC LEA API',
    dataFlow: 'Check Point firewall logs forwarded to Cribl Stream via syslog in CEF format from Log Exporter. Events parsed from CEF, enriched with blade context and geo data, then routed: IPS/Anti-Bot/threat blade events to SIEM, connection volume and health metrics to observability, full fidelity to storage and Cribl Search.',
    destinations: [
      {
        type: 'Security SIEM',
        examples: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security'],
        strategy: 'Send all threat blade events (IPS, Anti-Bot, Threat Emulation), Drop/Reject actions, high-severity events, and identity-correlated connections. Drop routine Accept events on non-sensitive services.',
        fieldCount: 26,
        estimatedReduction: '55-70% event reduction vs full fidelity',
        filters: [
          'Include all events where action=Drop or action=Reject or action=Block',
          'Include all events from product=IPS or product=Anti-Bot or product=Threat Emulation',
          'Include all events where severity=High or severity=Critical',
          'Include all events where protection_name IS NOT NULL',
          'Include all events where app_risk >= 4',
          'Include identity-correlated events (src_user_name IS NOT NULL) with Drop/Reject',
          'Sample routine Accept firewall events at 10-20%'
        ],
        excludedFields: ['match_id', 'nat_rule', 'xlatesrc (when same as src)', 'xlatedst (when same as dst)']
      },
      {
        type: 'Observability Platform',
        examples: ['Dynatrace', 'Datadog', 'New Relic', 'Grafana', 'Splunk Observability'],
        strategy: 'Aggregate connection metrics per minute by rule, blade, and interface. Focus on bytes/elapsed trends, rule utilization, and blade health. Drop threat-specific fields and identity data.',
        fieldCount: 14,
        estimatedReduction: '80-90% event reduction via aggregation',
        filters: [
          'Aggregate per minute: connection count, total bytes, avg elapsed by rule_name, product, action',
          'Aggregate per minute: blade-level event counts by product and severity',
          'Include all Drop/Reject events at full fidelity (connectivity troubleshooting)',
          'Include high-elapsed connections (> threshold) at full fidelity',
          'Drop all threat-specific fields (protection_name, malware_family, confidence_level)',
          'Drop identity fields (src_user_name, identity_src)'
        ],
        excludedFields: ['src_user_name', 'identity_src', 'protection_name', 'malware_family', 'confidence_level', 'xlatesrc', 'xlatedst', 'nat_rule', 'rule_uid', 'match_id', 'layer_name', 'url', 'app_risk', 'policy_name']
      },
      {
        type: 'Full-Fidelity Storage',
        examples: ['Cribl Lake', 'Amazon S3', 'Azure Blob', 'Google Cloud Storage'],
        strategy: 'Retain complete parsed Check Point event with all blade fields, identity context, and NAT details. Full forensic record for investigation and compliance.',
        fieldCount: 32,
        estimatedReduction: '0% — all fields retained',
        filters: [
          'Include ALL events regardless of action or blade',
          'Preserve complete CEF header and extension fields',
          'Add Cribl processing metadata (pipeline version, timestamp)',
          'Add enrichment metadata (geo context, MITRE mapping)'
        ],
        excludedFields: [],
        retentionGuidance: '90 days hot (Cribl Lake), 365 days warm (S3 Standard-IA), 7 years cold (S3 Glacier) for compliance'
      },
      {
        type: 'Cribl Search',
        examples: ['Cribl Search'],
        strategy: 'Full-fidelity Check Point logs indexed for interactive investigation, rule impact analysis, and threat blade forensics. Primary tool for multi-blade correlation during incident response.',
        fieldCount: 32,
        estimatedReduction: '0% — searchable full fidelity',
        filters: [
          'All events searchable with full field access',
          'Optimized for src, dst, protection_name, and time-range queries',
          'Support field-level search across all blade-specific fields',
          'Enable replay to SIEM when investigating threat blade detections'
        ],
        excludedFields: [],
        replayWorkflow: 'When an IPS or Anti-Bot alert fires, search full Check Point logs for all connections from the same source IP → identify lateral movement and additional indicators → replay correlated events to SIEM for complete attack timeline.'
      }
    ],
    costOptimization: {
      summary: 'Check Point firewalls generate high log volume across multiple blades. Routine Accept events from the firewall blade dominate volume but carry lower security value than threat blade events. By routing threat blade events and Drop/Reject actions to SIEM and aggregating connection metrics for observability, customers typically achieve 60-75% reduction in analytics platform ingestion.',
      strategies: [
        { name: 'Blade-Based Routing', description: 'Route IPS, Anti-Bot, and Threat Emulation events to SIEM always. These are high-value, low-volume events. Routine firewall Accept events are filtered or sampled.', impact: '55-70% SIEM volume reduction' },
        { name: 'Connection Metric Aggregation', description: 'Roll up firewall connection counts, bytes, and elapsed per minute by rule, product, and action for observability. Replace thousands of individual logs with metric summaries.', impact: '80-90% event reduction for observability' },
        { name: 'Accept Event Sampling', description: 'Sample routine Accept events (non-app, known-good traffic) at 10-20% for SIEM. Keep all Drop/Reject and threat events at full fidelity.', impact: '40-60% SIEM volume reduction for firewall blade' },
        { name: 'NAT Field Pruning', description: 'Drop xlatesrc/xlatedst when they equal src/dst (no NAT applied). Remove nat_rule for non-NATed traffic.', impact: '5-10% per-event size reduction' },
        { name: 'Noise Filtering', description: 'Filter high-volume non-application Accept events (health checks, monitoring probes, known infrastructure traffic) that have zero security or operational value.', impact: '15-30% volume reduction' }
      ]
    },
    packFunctions: [
      { name: 'Parse CEF', description: 'Parse Common Event Format (CEF) syslog from Check Point Log Exporter. Extract CEF header fields and key=value extension pairs into structured fields.' },
      { name: 'Extract Blade Type', description: 'Identify the generating blade from the product field. Tag event with blade category (fw, ips, anti-bot, threat-emulation, url-filtering, app-control).' },
      { name: 'Classify Action', description: 'Normalize action field across blades (Accept, Drop, Reject, Block, Detect, Prevent). Map to unified allow/deny/detect taxonomy.' },
      { name: 'Geo-Enrich IPs', description: 'Enrich src and dst IP addresses with geo context (country, city, ASN). Tag RFC1918 ranges as internal.' },
      { name: 'Tag MITRE', description: 'Map protection_name and malware_family to MITRE ATT&CK techniques where applicable. Add tactic and technique fields.' },
      { name: 'Normalize Severity', description: 'Normalize severity across blades to unified scale. Map Check Point confidence_level to comparable severity for consistent alerting.' },
      { name: 'Route by Product', description: 'Add routing metadata based on product/blade type. IPS and Anti-Bot always route to SIEM. Firewall Accept events are sampled.' },
      { name: 'Aggregate Connection Metrics', description: 'Roll up connection counts, bytes, and elapsed per minute by rule_name, product, action, and interface_direction for observability output.' },
      { name: 'Filter Noise', description: 'Identify and suppress high-volume non-application Accept events: known monitoring probes, health checks, and infrastructure traffic with no security or operational value.' },
      { name: 'Add Cribl Metadata', description: 'Add processing metadata: pipeline version, pack version, collection source, processing timestamp, and routing decisions applied.' }
    ]
  },
  'cisco-asa': {
    sourceDescription: 'Cisco ASA firewall logs collected via syslog into Cribl Stream/Edge',
    collectionMethod: 'Syslog (UDP 514, TCP 514, or TLS 6514 from ASA logging configuration)',
    dataFlow: 'Cisco ASA syslog messages forwarded to Cribl Stream via syslog. Events parsed by message ID to extract connection details, enriched with geo and interface context, then routed: deny events and VPN activity to SIEM, connection build/teardown metrics to observability, full fidelity to storage and Cribl Search.',
    destinations: [
      {
        type: 'Security SIEM',
        examples: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security'],
        strategy: 'Send all deny/drop events, VPN session activity, threat detection events, and access-group hits. Drop routine connection build/teardown events for known-good traffic.',
        fieldCount: 24,
        estimatedReduction: '65-80% event reduction vs full fidelity',
        filters: [
          'Include all events where action=Deny or action=Drop',
          'Include all VPN-related message IDs (713xxx, 722xxx series)',
          'Include all events where threat_level IS NOT NULL',
          'Include all events where ips_signature IS NOT NULL',
          'Include all events where severity <= 3 (Error and above)',
          'Include access-group deny hits (message_id=106023)',
          'Sample routine Build/Teardown events (302013/302014) at 5-10%'
        ],
        excludedFields: ['hit_count', 'nat_src_ip (when same as src_ip)', 'nat_dst_ip (when same as dst_ip)']
      },
      {
        type: 'Observability Platform',
        examples: ['Dynatrace', 'Datadog', 'New Relic', 'Grafana', 'Splunk Observability'],
        strategy: 'Aggregate connection build/teardown metrics per minute by interface, protocol, and message category. Focus on connection rates, duration distributions, and byte volume. Drop security-specific fields.',
        fieldCount: 12,
        estimatedReduction: '85-93% event reduction via aggregation',
        filters: [
          'Aggregate per minute: connection count, total bytes_sent, total bytes_received by interface_in, interface_out, protocol',
          'Aggregate per minute: avg duration by interface pair and protocol',
          'Include all Deny events at full fidelity (connectivity troubleshooting)',
          'Include high-severity events (severity <= 3) at full fidelity',
          'Drop all VPN-specific fields for observability',
          'Drop NAT fields, access_group, user identity'
        ],
        excludedFields: ['nat_src_ip', 'nat_src_port', 'nat_dst_ip', 'nat_dst_port', 'access_group', 'user', 'vpn_group', 'vpn_user', 'vpn_tunnel_type', 'threat_level', 'ips_signature', 'tcp_flags', 'icmp_type', 'icmp_code', 'connection_id']
      },
      {
        type: 'Full-Fidelity Storage',
        examples: ['Cribl Lake', 'Amazon S3', 'Azure Blob', 'Google Cloud Storage'],
        strategy: 'Retain complete parsed ASA event with all fields, NAT details, VPN context, and original syslog message. Full forensic record for investigation and compliance.',
        fieldCount: 32,
        estimatedReduction: '0% — all fields retained',
        filters: [
          'Include ALL events regardless of message ID or action',
          'Preserve original syslog message text',
          'Include all parsed fields and enrichments',
          'Add Cribl processing metadata (pipeline version, timestamp)'
        ],
        excludedFields: [],
        retentionGuidance: '90 days hot (Cribl Lake), 365 days warm (S3 Standard-IA), 7 years cold (S3 Glacier) for compliance'
      },
      {
        type: 'Cribl Search',
        examples: ['Cribl Search'],
        strategy: 'Full-fidelity ASA logs indexed for interactive investigation, connection tracking, and VPN session forensics. Primary tool for correlating build/teardown events and tracing connection lifecycles.',
        fieldCount: 32,
        estimatedReduction: '0% — searchable full fidelity',
        filters: [
          'All events searchable with full field access',
          'Optimized for src_ip, dst_ip, message_id, connection_id, and time-range queries',
          'Support connection lifecycle reconstruction (Build → Teardown correlation)',
          'Enable replay to SIEM when investigating denied connections or VPN anomalies'
        ],
        excludedFields: [],
        replayWorkflow: 'When a deny event triggers an alert, search ASA logs for all connections from the same source IP → reconstruct connection history → identify scanning patterns → replay relevant events to SIEM for investigation context.'
      }
    ],
    costOptimization: {
      summary: 'Cisco ASA logs are dominated by high-volume connection build/teardown events (302013/302014/302015/302016) that represent 70-85% of total volume. By routing only deny events, VPN activity, and threat detections to SIEM and aggregating connection metrics for observability, customers typically achieve 70-85% reduction in analytics platform ingestion.',
      strategies: [
        { name: 'Message ID Routing', description: 'Route deny message IDs (106xxx series) and VPN message IDs (713xxx, 722xxx) to SIEM. Build/Teardown events (302xxx) are the highest volume with lowest security value per event.', impact: '65-80% SIEM volume reduction' },
        { name: 'Connection Metric Aggregation', description: 'Roll up Build/Teardown events per minute by interface, protocol, and connection state for observability. One metric record replaces thousands of individual syslog messages.', impact: '85-93% event reduction for observability' },
        { name: 'High-Volume Allow Filtering', description: 'Filter or aggressively sample routine connection builds for known-good traffic patterns (internal health checks, monitoring, DNS).', impact: '30-50% additional SIEM reduction' },
        { name: 'Severity-Based Routing', description: 'Route all severity 0-3 (Emergency through Error) to SIEM regardless of message ID. These are always actionable.', impact: 'Ensures no critical events are dropped' },
        { name: 'NAT Field Optimization', description: 'Drop NAT fields when nat_src_ip equals src_ip (no translation occurred). Reduces per-event size for non-NATed traffic.', impact: '5-10% per-event size reduction' }
      ]
    },
    packFunctions: [
      { name: 'Parse ASA Syslog', description: 'Parse Cisco ASA syslog format. Extract device_id, severity, message_id, and structured fields from the message text using message-ID-specific regex patterns.' },
      { name: 'Extract Message ID', description: 'Extract the 6-digit ASA message ID and classify into categories: connection (302xxx), deny (106xxx), VPN (713xxx/722xxx), threat (xxx), and system (xxx).' },
      { name: 'Classify Severity', description: 'Map ASA numeric severity (0-7) to named levels and tag routing priority. Severity 0-3 always routes to SIEM.' },
      { name: 'Geo-Enrich IPs', description: 'Enrich src_ip and dst_ip with geo context (country, city, ASN). Tag RFC1918 ranges as internal. Identify cloud provider ranges.' },
      { name: 'Parse Connection Details', description: 'Extract connection-specific fields from Build/Teardown messages: duration, bytes_sent, bytes_received, interface pairs, and connection_id.' },
      { name: 'Route by Message Category', description: 'Add routing metadata based on message ID category. Deny and VPN messages route to SIEM. Build/Teardown messages route to metrics aggregation.' },
      { name: 'Aggregate Connection Metrics', description: 'Roll up connection counts, bytes, and duration per minute by interface_in, interface_out, protocol, and action for observability output.' },
      { name: 'Filter High-Volume Allows', description: 'Identify and suppress or sample high-volume routine connection events: known monitoring traffic, health checks, and repetitive allowed flows.' },
      { name: 'Normalize Timestamps', description: 'Convert ASA syslog timestamp format to ISO 8601. Handle timezone normalization and device clock drift detection.' },
      { name: 'Add Cribl Metadata', description: 'Add processing metadata: pipeline version, pack version, collection source, processing timestamp, and routing decisions applied.' }
    ]
  },
  'cisco-ise': {
    sourceDescription: 'Cisco ISE authentication and posture logs collected via syslog (CSV-formatted) into Cribl Stream',
    collectionMethod: 'Syslog (TCP/TLS from ISE Policy Service Nodes — ISE sends CSV-formatted syslog per Remote Logging Target configuration)',
    dataFlow: 'Cisco ISE authentication and posture logs forwarded to Cribl Stream via syslog in CSV format. Events parsed by message code, enriched with device profile and location context, then routed: auth failures and posture violations to SIEM, auth latency and device profiling metrics to observability, full fidelity to storage and Cribl Search.',
    destinations: [
      {
        type: 'Security SIEM',
        examples: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security'],
        strategy: 'Send all authentication failures, posture non-compliance events, quarantine actions, and SGT assignment changes. Drop routine successful authentications and periodic accounting updates.',
        fieldCount: 26,
        estimatedReduction: '60-75% event reduction vs full fidelity',
        filters: [
          'Include all events where message_code indicates failure (5400, 5401, 5405, 5440 with failure)',
          'Include all events where posture_status=NonCompliant or quarantine_status=true',
          'Include all events where authentication_method=MAB with unknown endpoint_profile (rogue device)',
          'Include SGT assignment changes and authorization policy overrides',
          'Include all events where failure_reason IS NOT NULL',
          'Include first successful auth per endpoint per day (new device baseline)',
          'Sample routine successful authentications (5200) at 5-10%'
        ],
        excludedFields: ['response_time_ms', 'selected_access_service', 'acct_session_id', 'service_type', 'nas_port (for non-investigation use)']
      },
      {
        type: 'Observability Platform',
        examples: ['Dynatrace', 'Datadog', 'New Relic', 'Grafana', 'Splunk Observability'],
        strategy: 'Aggregate authentication metrics per minute: success/failure rates, response time percentiles, and device profile distributions. Send individual events for high-latency authentications and service errors.',
        fieldCount: 14,
        estimatedReduction: '85-93% event reduction via aggregation',
        filters: [
          'Aggregate per minute: auth count by message_code, authentication_method, identity_store, network_device_name',
          'Aggregate per minute: avg/p95/p99 response_time_ms by network_device_name and authentication_protocol',
          'Aggregate per minute: endpoint_profile distribution counts',
          'Include all events where response_time_ms > threshold (slow auth detection)',
          'Include all message_severity=ERROR events at full fidelity',
          'Drop all identity/PII fields (username, calling_station_id, endpoint_mac)'
        ],
        excludedFields: ['username', 'calling_station_id', 'endpoint_mac', 'framed_ip_address', 'authorization_policy', 'authorization_profiles', 'sgt', 'session_id', 'acct_session_id', 'failure_reason', 'ad_domain', 'endpoint_policy', 'quarantine_status', 'ise_policy_set']
      },
      {
        type: 'Full-Fidelity Storage',
        examples: ['Cribl Lake', 'Amazon S3', 'Azure Blob', 'Google Cloud Storage'],
        strategy: 'Retain complete parsed ISE event with all authentication details, posture results, and authorization context. Full forensic record for access auditing and compliance.',
        fieldCount: 32,
        estimatedReduction: '0% — all fields retained',
        filters: [
          'Include ALL events regardless of message code or result',
          'Preserve complete authentication context and authorization details',
          'Include posture and profiling results',
          'Add Cribl processing metadata (pipeline version, timestamp)'
        ],
        excludedFields: [],
        retentionGuidance: '90 days hot (Cribl Lake), 365 days warm (S3 Standard-IA), 7 years cold (S3 Glacier) for compliance and access auditing'
      },
      {
        type: 'Cribl Search',
        examples: ['Cribl Search'],
        strategy: 'Full-fidelity ISE logs indexed for interactive investigation, access auditing, and endpoint compliance tracking. Primary tool for tracing authentication flows and authorization decisions.',
        fieldCount: 32,
        estimatedReduction: '0% — searchable full fidelity',
        filters: [
          'All events searchable with full field access',
          'Optimized for username, calling_station_id, endpoint_mac, network_device_name, and time-range queries',
          'Support session reconstruction across authentication and accounting events',
          'Enable replay to SIEM when investigating unauthorized access or rogue devices'
        ],
        excludedFields: [],
        replayWorkflow: 'When a rogue device or unauthorized access is detected, search ISE logs for all authentication attempts from that endpoint MAC → trace authorization decisions and network access granted → replay relevant events to SIEM for correlation with network activity.'
      }
    ],
    costOptimization: {
      summary: 'Cisco ISE generates high log volume from continuous RADIUS authentication, accounting, and periodic profiling probes. Routine successful authentications and accounting updates represent 70-85% of volume with low per-event security value. By routing failures and posture violations to SIEM and aggregating auth metrics for observability, customers typically achieve 65-80% reduction in analytics platform ingestion.',
      strategies: [
        { name: 'Message Code Routing', description: 'Route failure codes (5400, 5401, 5405) and posture violations to SIEM always. Success codes (5200) and accounting updates (5440) are sampled or aggregated.', impact: '60-75% SIEM volume reduction' },
        { name: 'Auth Metric Aggregation', description: 'Roll up authentication counts, success/failure rates, and response_time_ms percentiles per minute by device and method for observability.', impact: '85-93% event reduction for observability' },
        { name: 'Accounting Update Filtering', description: 'Filter periodic RADIUS accounting interim-updates that repeat every 30-60 minutes with no state change. Keep only start/stop and changes.', impact: '30-50% volume reduction from accounting' },
        { name: 'Periodic Probe Suppression', description: 'Suppress or deduplicate periodic profiling probe results that repeat without endpoint state change.', impact: '10-20% volume reduction' },
        { name: 'PII Field Pruning', description: 'Remove username, calling_station_id, and endpoint_mac for observability destinations. These have no operational value for metrics.', impact: '5-10% per-event size reduction for observability' }
      ]
    },
    packFunctions: [
      { name: 'Parse ISE CSV Syslog', description: 'Parse Cisco ISE CSV-formatted syslog messages. Handle multi-field CSV with attribute=value pairs embedded within the message body.' },
      { name: 'Extract Message Code', description: 'Extract the ISE message code and classify into categories: authentication (5200/5400), accounting (5440), profiling (5500), and posture (5800).' },
      { name: 'Classify Auth Result', description: 'Determine authentication result from message code and failure_reason. Normalize to unified Pass/Fail/Error taxonomy for routing.' },
      { name: 'Normalize MAC Addresses', description: 'Normalize calling_station_id and endpoint_mac to consistent format (XX:XX:XX:XX:XX:XX). Handle Cisco, IEEE, and dash-separated variants.' },
      { name: 'Tag Posture Status', description: 'Extract and normalize posture compliance status. Flag NonCompliant and Unknown endpoints for security routing.' },
      { name: 'Route by Message Category', description: 'Add routing metadata based on message code category and auth result. Failures and posture violations always route to SIEM.' },
      { name: 'Aggregate Auth Metrics', description: 'Roll up authentication counts, success/failure rates, and response_time_ms statistics per minute by network_device_name and authentication_method.' },
      { name: 'Enrich with Device Profile', description: 'Add endpoint profiling context: device_os, endpoint_profile, and device manufacturer from ISE profiling results.' },
      { name: 'Filter Periodic Probes', description: 'Identify and suppress periodic profiling probes and RADIUS accounting interim-updates that repeat without state change.' },
      { name: 'Add Cribl Metadata', description: 'Add processing metadata: pipeline version, pack version, collection source, processing timestamp, and routing decisions applied.' }
    ]
  },
  'openai-usage': {
    sourceDescription: 'OpenAI API usage logs collected via REST API polling from the OpenAI Admin API',
    collectionMethod: 'REST API (OpenAI Admin API polled on schedule via Cribl Stream HTTP Collector)',
    dataFlow: 'OpenAI Admin API → Cribl Stream HTTP Collector → Parse JSON → Enrich (cost calc, geo-tag IP) → Route: content filter triggers and anomalous usage patterns to Security SIEM, token consumption/latency/cost metrics to Observability, all events to Full-Fidelity Storage and Cribl Search',
    destinations: [
      {
        type: 'Security SIEM',
        examples: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security'],
        strategy: 'Send events where content filters triggered, anomalous usage patterns detected (unusual models, high token counts, new API keys), and error codes indicating abuse. Include user/IP context for correlation.',
        fieldCount: 18,
        estimatedReduction: '40-50% field reduction vs full fidelity',
        filters: [
          'Include all events where any content_filter_* field is triggered',
          'Include events with finish_reason = content_filter',
          'Include events with error_code indicating abuse (429 excessive, 401 unauthorized)',
          'Include events from new or unusual API keys',
          'Include events with anomalous token counts (> 2 std dev from baseline)',
          'Sample normal successful completions at 5-10%'
        ],
        excludedFields: ['tokens_input', 'tokens_output', 'tokens_total', 'cost_usd', 'latency_ms', 'stream', 'temperature', 'max_tokens', 'system_fingerprint']
      },
      {
        type: 'Observability Platform',
        examples: ['Dynatrace', 'Datadog', 'New Relic', 'Grafana', 'Splunk Observability'],
        strategy: 'Send token consumption, latency, cost, and model usage metrics. Focus on performance monitoring, cost attribution, and capacity planning. Drop content filter details and user identity.',
        fieldCount: 18,
        estimatedReduction: '40-50% field reduction vs full fidelity',
        filters: [
          'Include all events for cost and usage metrics',
          'Aggregate per-minute rollups by model, endpoint, project_id',
          'Always include high-latency events (> P99) at full fidelity',
          'Always include error events at full fidelity',
          'Sample successful low-latency completions at 25% for baseline metrics'
        ],
        excludedFields: ['content_filter_sexual', 'content_filter_violence', 'content_filter_self_harm', 'content_filter_hate', 'user', 'ip_address', 'function_call', 'tool_use']
      },
      {
        type: 'Full-Fidelity Storage',
        examples: ['Cribl Lake', 'Amazon S3', 'Azure Blob', 'Google Cloud Storage'],
        strategy: 'Retain complete API usage event with all fields. Include cost calculations, content filter results, and full request metadata. This is the audit and compliance record.',
        fieldCount: 30,
        estimatedReduction: '0% — all fields retained',
        filters: [
          'Include ALL events — no filtering',
          'Preserve original API response structure',
          'Include all parsed and derived fields',
          'Add Cribl processing metadata (pipeline version, timestamp)',
          'Add cost enrichment (calculated cost_usd based on model pricing)'
        ],
        excludedFields: [],
        retentionGuidance: '90 days hot (Cribl Lake), 365 days warm (S3 Standard-IA), 7 years cold (S3 Glacier) for compliance and audit'
      },
      {
        type: 'Cribl Search',
        examples: ['Cribl Search'],
        strategy: 'Full-fidelity usage logs indexed for cost analysis, abuse investigation, and compliance auditing. Used for deep-dive analysis during security incidents or budget overruns.',
        fieldCount: 30,
        estimatedReduction: '0% — searchable full fidelity',
        filters: [
          'All events searchable',
          'Optimized for time-range and api_key/model queries',
          'Support field-level search across all parsed fields',
          'Enable replay to SIEM when new abuse patterns are identified'
        ],
        excludedFields: [],
        replayWorkflow: 'When a compromised API key is identified, search all historical usage for that key → identify scope of unauthorized usage → replay suspicious events to SIEM for incident investigation.'
      }
    ],
    costOptimization: {
      summary: 'OpenAI usage logs are moderate volume but high value. By routing security-relevant events (content filter triggers, anomalous patterns) to SIEM and aggregated metrics to observability, customers achieve 50-65% reduction in analytics platform ingestion while maintaining full audit capability.',
      strategies: [
        { name: 'Content Filter Routing', description: 'Only route events with content filter triggers or policy violations to Security SIEM. Normal completions rarely need security analysis.', impact: '60-80% volume reduction for SIEM' },
        { name: 'Metric Aggregation', description: 'Aggregate token counts, costs, and latency by model/endpoint/project per minute for observability dashboards.', impact: '50-70% event reduction for observability' },
        { name: 'Field Pruning', description: 'Security SIEM does not need token counts or cost. Observability does not need content filter details or user identity.', impact: '20-30% per-event size reduction' },
        { name: 'Sampling Normal Traffic', description: 'Sample successful, non-flagged completions for baseline metrics. Keep all anomalous and filtered events at full fidelity.', impact: '40-60% volume reduction' },
        { name: 'Error Code Filtering', description: 'Route only actionable error codes (401, 429) to SIEM. Send all errors to observability for availability tracking.', impact: '10-20% SIEM volume reduction' }
      ]
    },
    packFunctions: [
      { name: 'Parse OpenAI Usage JSON', description: 'Parse JSON response from OpenAI Admin API into structured fields. Handle nested objects and arrays.' },
      { name: 'Calculate Cost', description: 'Calculate cost_usd based on model, tokens_input, and tokens_output using current pricing lookup table.' },
      { name: 'Detect Content Filter Triggers', description: 'Evaluate content_filter_* fields and finish_reason to identify policy violations. Set routing flags for SIEM.' },
      { name: 'Classify Usage Anomaly', description: 'Compare token counts and request patterns against rolling baseline. Flag anomalous usage for security routing.' },
      { name: 'Normalize Timestamps', description: 'Convert API response timestamps to ISO 8601 format with timezone normalization.' },
      { name: 'Enrich API Key Context', description: 'Add API key metadata: owner team, creation date, and last rotation date from lookup.' },
      { name: 'Tag Model Tier', description: 'Classify model into tiers (premium, standard, legacy) for cost attribution and policy enforcement.' },
      { name: 'Shape for SIEM', description: 'Create security-optimized variant: keep content filter, user, IP, and error fields. Drop cost and performance metrics.' },
      { name: 'Shape for Observability', description: 'Create observability-optimized variant: keep token counts, latency, cost, and model fields. Drop security-specific fields.' },
      { name: 'Aggregate Usage Metrics', description: 'Roll up token consumption, cost, and latency statistics per minute by model, endpoint, and project.' }
    ]
  },
  'openai-compliance': {
    sourceDescription: 'OpenAI compliance and policy violation events collected via REST API from the OpenAI moderation and compliance endpoints',
    collectionMethod: 'REST API (OpenAI Compliance API polled on schedule or webhook-driven via Cribl Stream HTTP input)',
    dataFlow: 'OpenAI Compliance API → Cribl Stream HTTP Collector/Webhook → Parse JSON → Classify severity → Route: policy violations/PII detections to Security SIEM, compliance metrics and trends to Observability, all events to Full-Fidelity Storage and Cribl Search',
    destinations: [
      {
        type: 'Security SIEM',
        examples: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security'],
        strategy: 'Send all policy violations, PII detections, content filter triggers, and moderation flags. Include full user and session context for investigation. This is the primary compliance enforcement destination.',
        fieldCount: 22,
        estimatedReduction: '20-30% field reduction vs full fidelity',
        filters: [
          'Include all events with pii_detected = true',
          'Include all events with violation_type populated',
          'Include all events with moderation_flagged = true',
          'Include all events with severity = high or critical',
          'Include all content_filter_triggered events',
          'Sample low-severity compliance metrics at 25%'
        ],
        excludedFields: ['prompt_token_count', 'completion_token_count', 'retention_days', 'retention_action']
      },
      {
        type: 'Observability Platform',
        examples: ['Dynatrace', 'Datadog', 'New Relic', 'Grafana', 'Splunk Observability'],
        strategy: 'Send compliance metrics for trending and reporting. Focus on violation rates, policy trigger frequency, and retention compliance. Drop PII-specific details and user identity.',
        fieldCount: 14,
        estimatedReduction: '50-55% field reduction vs full fidelity',
        filters: [
          'Include all events for compliance rate metrics',
          'Aggregate violation counts by policy_name, severity, and compliance_framework per hour',
          'Always include severity = critical at full fidelity',
          'Sample routine log-only events at 10%',
          'Include retention metrics for compliance dashboard'
        ],
        excludedFields: ['user_id', 'user_email', 'conversation_id', 'pii_types', 'redacted_fields', 'session_id', 'ip_address', 'filter_category', 'moderation_categories', 'violation_type']
      },
      {
        type: 'Full-Fidelity Storage',
        examples: ['Cribl Lake', 'Amazon S3', 'Azure Blob', 'Google Cloud Storage'],
        strategy: 'Retain complete compliance event with all fields. Critical for regulatory audit, legal hold, and compliance reporting. Extended retention required.',
        fieldCount: 28,
        estimatedReduction: '0% — all fields retained',
        filters: [
          'Include ALL events — no filtering',
          'Preserve original compliance event structure',
          'Include all parsed and derived fields',
          'Add Cribl processing metadata (pipeline version, timestamp)',
          'Add compliance framework tagging for retention policies'
        ],
        excludedFields: [],
        retentionGuidance: '365 days hot (Cribl Lake), 3 years warm (S3 Standard-IA), 7+ years cold (S3 Glacier) for regulatory compliance'
      },
      {
        type: 'Cribl Search',
        examples: ['Cribl Search'],
        strategy: 'Full-fidelity compliance logs indexed for regulatory auditing, compliance investigations, and policy effectiveness analysis.',
        fieldCount: 28,
        estimatedReduction: '0% — searchable full fidelity',
        filters: [
          'All events searchable',
          'Optimized for time-range, user, and policy queries',
          'Support field-level search across all parsed fields',
          'Enable replay to SIEM when new violation patterns emerge'
        ],
        excludedFields: [],
        replayWorkflow: 'When a compliance audit requires historical evidence, search for all violations by user/policy/timeframe → generate compliance report → replay relevant events to SIEM if investigation warranted.'
      }
    ],
    costOptimization: {
      summary: 'OpenAI compliance events are lower volume but high retention cost. Most events must reach Security SIEM for compliance. Cost savings come primarily from aggregated observability metrics and extended cold-tier storage for regulatory requirements.',
      strategies: [
        { name: 'Severity-Based Routing', description: 'Route high/critical severity to SIEM in real-time. Batch low-severity events for periodic ingest.', impact: '30-40% real-time SIEM volume reduction' },
        { name: 'Metric Aggregation', description: 'Aggregate compliance metrics (violation counts, PII detection rates) by policy and framework per hour for dashboards.', impact: '60-80% event reduction for observability' },
        { name: 'Field Pruning', description: 'Observability does not need PII details, user identity, or conversation context. SIEM does not need retention metadata.', impact: '15-25% per-event size reduction' },
        { name: 'Tiered Retention', description: 'Use hot/warm/cold storage tiers with automatic lifecycle policies. Most compliance data accessed only during audits.', impact: '60-70% storage cost reduction vs all-hot' },
        { name: 'Deduplication', description: 'Deduplicate repeated violations from the same session within short windows. Common during iterative prompt attempts.', impact: '10-20% volume reduction' }
      ]
    },
    packFunctions: [
      { name: 'Parse Compliance Event JSON', description: 'Parse JSON compliance event into structured fields. Handle nested PII type arrays and moderation category objects.' },
      { name: 'Classify Violation Severity', description: 'Enrich events with severity based on violation_type, pii_types, and policy_name using classification lookup.' },
      { name: 'Detect PII Exposure', description: 'Evaluate pii_detected and pii_types fields. Determine if PII was in prompt (input) or completion (output) for risk scoring.' },
      { name: 'Map Compliance Framework', description: 'Map policy violations to applicable compliance frameworks (GDPR, HIPAA, SOC2) for regulatory reporting.' },
      { name: 'Normalize Timestamps', description: 'Convert event timestamps to ISO 8601 with timezone normalization for cross-system correlation.' },
      { name: 'Tag Retention Policy', description: 'Apply retention_action and retention_days based on compliance_framework and data_classification.' },
      { name: 'Enrich User Context', description: 'Add user department, role, and risk score from identity lookup for investigation context.' },
      { name: 'Shape for SIEM', description: 'Create security-optimized variant: keep all violation, PII, and user fields. Drop retention and token count metadata.' },
      { name: 'Shape for Observability', description: 'Create observability-optimized variant: keep compliance metrics fields. Drop PII details and user identity.' },
      { name: 'Aggregate Compliance Metrics', description: 'Roll up violation counts, PII detection rates, and policy trigger frequency by framework and severity per hour.' }
    ]
  },
  'anthropic-compliance': {
    sourceDescription: 'Anthropic API usage and compliance events collected via REST API from the Anthropic Admin API',
    collectionMethod: 'REST API (Anthropic Admin API polled on schedule via Cribl Stream HTTP Collector)',
    dataFlow: 'Anthropic Admin API → Cribl Stream HTTP Collector → Parse JSON → Enrich (cost calc, safety classification) → Route: safety triggers/content policy violations to Security SIEM, usage costs/latency metrics to Observability, all events to Full-Fidelity Storage and Cribl Search',
    destinations: [
      {
        type: 'Security SIEM',
        examples: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security'],
        strategy: 'Send events where safety systems triggered, content policy violations occurred, or prompt classification indicates suspicious/malicious intent. Include user/IP context for investigation.',
        fieldCount: 18,
        estimatedReduction: '35-45% field reduction vs full fidelity',
        filters: [
          'Include all events with safety_triggered = true',
          'Include all events with content_policy_violation = true',
          'Include events with prompt_classification = suspicious or malicious',
          'Include events with data_sensitivity = high or critical',
          'Include all error events indicating unauthorized access',
          'Sample normal completions at 5% for baseline'
        ],
        excludedFields: ['input_tokens', 'output_tokens', 'cost_usd', 'latency_ms', 'metadata_use_case', 'metadata_department', 'stop_reason']
      },
      {
        type: 'Observability Platform',
        examples: ['Dynatrace', 'Datadog', 'New Relic', 'Grafana', 'Splunk Observability'],
        strategy: 'Send usage metrics: token consumption, latency, cost, and model performance. Focus on FinOps, capacity planning, and SLA monitoring. Drop safety and policy violation details.',
        fieldCount: 16,
        estimatedReduction: '40-50% field reduction vs full fidelity',
        filters: [
          'Include all events for cost and usage metrics',
          'Aggregate per-minute rollups by model, workspace_id, request_source',
          'Always include high-latency events (> P99) at full fidelity',
          'Always include error events at full fidelity',
          'Sample successful completions at 25% for latency baseline'
        ],
        excludedFields: ['safety_triggered', 'safety_categories', 'content_policy_violation', 'violation_type', 'action_taken', 'prompt_classification', 'data_sensitivity', 'session_id', 'user_id', 'ip_address']
      },
      {
        type: 'Full-Fidelity Storage',
        examples: ['Cribl Lake', 'Amazon S3', 'Azure Blob', 'Google Cloud Storage'],
        strategy: 'Retain complete API event with all fields. Include safety results, usage metrics, and compliance metadata. This is the audit and forensic record.',
        fieldCount: 28,
        estimatedReduction: '0% — all fields retained',
        filters: [
          'Include ALL events — no filtering',
          'Preserve original API response structure',
          'Include all parsed and derived fields',
          'Add Cribl processing metadata (pipeline version, timestamp)',
          'Add cost enrichment (calculated cost_usd based on model pricing)'
        ],
        excludedFields: [],
        retentionGuidance: '90 days hot (Cribl Lake), 365 days warm (S3 Standard-IA), 7 years cold (S3 Glacier) for compliance and audit'
      },
      {
        type: 'Cribl Search',
        examples: ['Cribl Search'],
        strategy: 'Full-fidelity usage and compliance logs indexed for cost analysis, safety incident investigation, and compliance auditing.',
        fieldCount: 28,
        estimatedReduction: '0% — searchable full fidelity',
        filters: [
          'All events searchable',
          'Optimized for time-range, model, and workspace queries',
          'Support field-level search across all parsed fields',
          'Enable replay to SIEM when new safety patterns are identified'
        ],
        excludedFields: [],
        replayWorkflow: 'When a safety incident is identified, search all historical usage for the involved API key/user → identify pattern of escalating violations → replay relevant events to SIEM for investigation.'
      }
    ],
    costOptimization: {
      summary: 'Anthropic compliance logs follow the same pattern as OpenAI — moderate volume, high value. Route safety triggers to SIEM and aggregate usage metrics for observability to achieve 50-65% analytics cost reduction while maintaining full compliance and audit capability.',
      strategies: [
        { name: 'Safety Trigger Routing', description: 'Only route events with safety_triggered or content_policy_violation to SIEM. Normal completions rarely need security analysis.', impact: '60-80% volume reduction for SIEM' },
        { name: 'Usage Metric Aggregation', description: 'Aggregate token counts, costs, and latency by model/workspace/source per minute for observability dashboards.', impact: '50-70% event reduction for observability' },
        { name: 'Field Pruning', description: 'Security SIEM does not need token counts or cost. Observability does not need safety categories or prompt classification.', impact: '20-30% per-event size reduction' },
        { name: 'Baseline Sampling', description: 'Sample successful non-flagged completions for performance baseline. Keep all safety-triggered events at full fidelity.', impact: '40-60% volume reduction' },
        { name: 'Cost Tier Optimization', description: 'Route high-value safety events to hot analytics. Store routine usage in cold tier with search capability.', impact: '40-50% storage cost reduction' }
      ]
    },
    packFunctions: [
      { name: 'Parse Anthropic API Response', description: 'Parse JSON response from Anthropic Admin API into structured fields. Handle message objects and usage blocks.' },
      { name: 'Calculate Cost', description: 'Calculate cost_usd based on model, input_tokens, and output_tokens using current Anthropic pricing lookup table.' },
      { name: 'Detect Safety Triggers', description: 'Evaluate safety_triggered and safety_categories fields. Set routing flags for SIEM when violations detected.' },
      { name: 'Classify Prompt Risk', description: 'Analyze prompt_classification and data_sensitivity fields. Flag suspicious patterns for security routing.' },
      { name: 'Normalize Timestamps', description: 'Convert API response timestamps to ISO 8601 format with timezone normalization.' },
      { name: 'Enrich Workspace Context', description: 'Add workspace metadata: team ownership, budget allocation, and usage tier from lookup table.' },
      { name: 'Tag Model Tier', description: 'Classify model into capability tiers (opus, sonnet, haiku) for cost attribution and capacity planning.' },
      { name: 'Shape for SIEM', description: 'Create security-optimized variant: keep safety, policy violation, user, and IP fields. Drop usage metrics.' },
      { name: 'Shape for Observability', description: 'Create observability-optimized variant: keep token counts, latency, cost, and model fields. Drop safety-specific fields.' },
      { name: 'Aggregate Usage Metrics', description: 'Roll up token consumption, cost, and latency statistics per minute by model, workspace, and request source.' }
    ]
  },
  'microsoft-graph': {
    sourceDescription: 'Microsoft Graph Security API alerts, risk detections, and incidents collected via Graph API polling',
    collectionMethod: 'REST API (Microsoft Graph Security API v2.0 polled via Cribl Stream HTTP Collector with OAuth2 client credentials)',
    dataFlow: 'Microsoft Graph Security API → Cribl Stream HTTP Collector (OAuth2) → Parse JSON → Classify alert type → Route: risk detections/alerts/incidents to Security SIEM, auth volume/latency metrics to Observability, all events to Full-Fidelity Storage and Cribl Search',
    destinations: [
      {
        type: 'Security SIEM',
        examples: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security'],
        strategy: 'Send all alerts, risk detections, and incidents with full context. Include user identity, risk scoring, location, and evidence. This is the primary security destination for Microsoft 365 threat data.',
        fieldCount: 28,
        estimatedReduction: '10-15% field reduction vs full fidelity',
        filters: [
          'Include ALL alerts regardless of severity',
          'Include all risk detections with risk_level != none',
          'Include all events with risk_state = atRisk or confirmedCompromised',
          'Include all incident-correlated events',
          'Include conditional_access_status = failure events',
          'Include all classification and determination updates'
        ],
        excludedFields: ['evidence_count', 'vendor']
      },
      {
        type: 'Observability Platform',
        examples: ['Dynatrace', 'Datadog', 'New Relic', 'Grafana', 'Splunk Observability'],
        strategy: 'Send authentication volume metrics, conditional access policy health, and service availability indicators. Focus on auth infrastructure performance and policy enforcement rates.',
        fieldCount: 14,
        estimatedReduction: '55-60% field reduction vs full fidelity',
        filters: [
          'Include all events for volume and trend metrics',
          'Aggregate alert counts by severity, category, and service_source per hour',
          'Include conditional access failure trends',
          'Include device/browser distribution metrics',
          'Sample resolved/dismissed alerts at 10% for closure-time metrics'
        ],
        excludedFields: ['risk_score', 'risk_state', 'risk_detail', 'location_city', 'location_state', 'category', 'description', 'alert_type', 'incident_id', 'assigned_to', 'classification', 'determination', 'evidence_count', 'provider', 'vendor', 'user_principal_name']
      },
      {
        type: 'Full-Fidelity Storage',
        examples: ['Cribl Lake', 'Amazon S3', 'Azure Blob', 'Google Cloud Storage'],
        strategy: 'Retain complete Graph Security event with all fields. Include alert lifecycle changes, risk detection details, and full evidence context. This is the forensic and compliance record.',
        fieldCount: 32,
        estimatedReduction: '0% — all fields retained',
        filters: [
          'Include ALL events — no filtering',
          'Preserve original Graph API response structure',
          'Include all parsed and derived fields',
          'Add Cribl processing metadata (pipeline version, timestamp)',
          'Track alert lifecycle (status changes over time)'
        ],
        excludedFields: [],
        retentionGuidance: '90 days hot (Cribl Lake), 365 days warm (S3 Standard-IA), 7 years cold (S3 Glacier) for compliance'
      },
      {
        type: 'Cribl Search',
        examples: ['Cribl Search'],
        strategy: 'Full-fidelity Graph Security alerts indexed for incident investigation, risk analysis, and historical trend review.',
        fieldCount: 32,
        estimatedReduction: '0% — searchable full fidelity',
        filters: [
          'All events searchable',
          'Optimized for time-range, user, and severity queries',
          'Support field-level search across all parsed fields',
          'Enable replay to SIEM when historical context needed for active incidents'
        ],
        excludedFields: [],
        replayWorkflow: 'When investigating a compromised account, search historical risk detections and alerts for the affected user → identify initial compromise timeline → replay early signals to SIEM for full incident reconstruction.'
      }
    ],
    costOptimization: {
      summary: 'Microsoft Graph Security alerts are relatively low volume but high value — most events should reach the SIEM. Cost optimization focuses on reducing observability noise and leveraging tiered storage for historical data.',
      strategies: [
        { name: 'Severity Filtering for Observability', description: 'Observability only needs aggregate metrics — individual alert details stay in SIEM. Send counts and trends, not full events.', impact: '70-80% event reduction for observability' },
        { name: 'Alert Lifecycle Deduplication', description: 'Deduplicate repeated status updates for the same alert within short windows. Keep only meaningful state transitions.', impact: '20-30% volume reduction' },
        { name: 'Field Pruning', description: 'Observability does not need risk details, user identity, or investigation fields. Minimal pruning for SIEM since most fields are security-relevant.', impact: '10-15% SIEM, 40-50% observability per-event reduction' },
        { name: 'Conditional Access Aggregation', description: 'Aggregate conditional access results per policy per hour for health monitoring instead of sending individual events.', impact: '60-70% reduction in auth-related observability events' },
        { name: 'Historical Tiering', description: 'Move resolved/dismissed alerts to cold storage after 30 days. Keep active investigations in hot tier.', impact: '50-60% storage cost reduction' }
      ]
    },
    packFunctions: [
      { name: 'Parse Graph Security JSON', description: 'Parse Microsoft Graph Security API JSON response. Handle nested objects for evidence, user details, and location.' },
      { name: 'Classify Alert Source', description: 'Categorize alerts by service_source: Defender for Endpoint, Defender for Identity, AAD Identity Protection, Defender for Cloud Apps.' },
      { name: 'Normalize Risk Levels', description: 'Map Microsoft risk levels and scores to unified severity taxonomy. Handle hidden and unknown risk states.' },
      { name: 'Extract Location Context', description: 'Parse location object into flat fields (city, state, country). Enrich with known-office and VPN exit detection.' },
      { name: 'Track Alert Lifecycle', description: 'Compare current alert status against previous state. Flag meaningful transitions (new→inProgress, inProgress→resolved).' },
      { name: 'Enrich User Context', description: 'Add user department, manager, and risk history from directory lookup for investigation context.' },
      { name: 'Correlate to Incidents', description: 'Link individual alerts to parent incidents using incident_id. Add incident severity and status context.' },
      { name: 'Shape for SIEM', description: 'Create security-optimized variant: keep all risk, alert, and identity fields. Drop vendor metadata.' },
      { name: 'Shape for Observability', description: 'Create observability-optimized variant: keep severity counts, status distributions, and conditional access metrics.' },
      { name: 'Aggregate Alert Metrics', description: 'Roll up alert counts by severity, category, and service_source per hour for trend dashboards.' }
    ]
  },
  'netflow': {
    sourceDescription: 'NetFlow v5/v9 flow records collected via UDP from network infrastructure devices (routers, switches, firewalls)',
    collectionMethod: 'UDP Collector (Cribl Stream/Edge NetFlow input on UDP port 2055/9995/9996)',
    dataFlow: 'Network Devices (NetFlow Export) → Cribl Stream UDP Collector → Decode NetFlow Templates → Parse Flow Records → Enrich (GeoIP, AS lookup) → Route: unusual flows/port scanning/anomalies to Security SIEM, bandwidth/utilization metrics to Observability, all flows to Full-Fidelity Storage and Cribl Search',
    destinations: [
      {
        type: 'Security SIEM',
        examples: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security'],
        strategy: 'Send flows matching threat indicators: port scanning patterns, unusual protocols, high-volume transfers (exfiltration), connections to known-bad IPs/ASNs, and ICMP anomalies. Include IP/port/protocol/direction/duration.',
        fieldCount: 18,
        estimatedReduction: '35-45% field reduction vs full fidelity',
        filters: [
          'Include flows with TCP flags indicating scanning (SYN-only, no SYN-ACK)',
          'Include flows to/from known-threat IPs or unusual ASNs',
          'Include flows with anomalous byte/packet ratios',
          'Include ICMP flows (potential tunneling or recon)',
          'Include long-duration flows (> 1 hour, potential C2)',
          'Sample normal allowed flows at 1-5% (high volume source)'
        ],
        excludedFields: ['flow_version', 'tos', 'src_as', 'dst_as', 'input_snmp', 'output_snmp', 'sampling_rate', 'next_hop', 'src_mask', 'dst_mask', 'flow_label']
      },
      {
        type: 'Observability Platform',
        examples: ['Dynatrace', 'Datadog', 'New Relic', 'Grafana', 'Splunk Observability'],
        strategy: 'Send bandwidth utilization, interface traffic, and AS-level peering metrics. Focus on capacity planning, congestion detection, and traffic engineering. Aggregate heavily to manage volume.',
        fieldCount: 16,
        estimatedReduction: '45-55% field reduction vs full fidelity',
        filters: [
          'Aggregate flows by interface/direction/protocol per minute for utilization metrics',
          'Aggregate by src_as/dst_as per 5 minutes for peering analysis',
          'Include individual high-bandwidth flows (> threshold) at full fidelity',
          'Include flows with anomalous duration or TTL for path analysis',
          'Sample individual flow records at 0.1-1% for baseline diversity metrics'
        ],
        excludedFields: ['tcp_flags', 'icmp_type', 'icmp_code', 'src_port', 'flow_label', 'min_ttl', 'max_ttl']
      },
      {
        type: 'Full-Fidelity Storage',
        examples: ['Cribl Lake', 'Amazon S3', 'Azure Blob', 'Google Cloud Storage'],
        strategy: 'Retain complete flow records. Critical for forensic investigation (what communicated with what, when, how much). High-volume — use columnar format and compression.',
        fieldCount: 28,
        estimatedReduction: '0% — all fields retained',
        filters: [
          'Include ALL flow records — no filtering',
          'Preserve all flow fields and metadata',
          'Add Cribl processing metadata (pipeline version, timestamp)',
          'Add GeoIP enrichment for src_addr and dst_addr',
          'Store in columnar format (Parquet) for efficient querying'
        ],
        excludedFields: [],
        retentionGuidance: '30 days hot (Cribl Lake), 90 days warm (S3 Standard-IA), 365 days cold (S3 Glacier) — shorter due to extreme volume'
      },
      {
        type: 'Cribl Search',
        examples: ['Cribl Search'],
        strategy: 'Full-fidelity flow records indexed for network forensics, connection tracking, and historical traffic analysis. Essential for investigating lateral movement and data exfiltration.',
        fieldCount: 28,
        estimatedReduction: '0% — searchable full fidelity',
        filters: [
          'All flow records searchable',
          'Optimized for time-range and IP/port queries',
          'Support aggregation queries for traffic analysis',
          'Enable replay to SIEM when new IOCs (IPs, ports) are identified'
        ],
        excludedFields: [],
        replayWorkflow: 'When a compromised host is identified, search all NetFlow records involving that IP → map lateral movement and data exfiltration paths → replay suspicious flows to SIEM for investigation.'
      }
    ],
    costOptimization: {
      summary: 'NetFlow is extremely high volume (millions of flows per minute on large networks). Aggressive sampling, aggregation, and threat-focused filtering are critical. Customers typically achieve 90-95% SIEM volume reduction and 80-90% observability reduction while retaining full forensic capability in cold storage.',
      strategies: [
        { name: 'Threat-Focused SIEM Routing', description: 'Only route flows matching threat criteria (scanning, unusual protocols, known-bad destinations, anomalous volumes) to SIEM. Normal traffic stays in storage.', impact: '90-95% volume reduction for SIEM' },
        { name: 'Interface Aggregation', description: 'Aggregate bytes/packets by interface/direction per minute for bandwidth monitoring. Eliminate individual flow records for utilization dashboards.', impact: '95-99% event reduction for utilization metrics' },
        { name: 'Sampling Compensation', description: 'Apply statistical sampling at collection (1:100 or 1:1000 for high-speed links). Multiply counters by sampling rate for volume accuracy.', impact: '99% collection volume reduction with acceptable accuracy' },
        { name: 'AS-Level Aggregation', description: 'Aggregate flows by AS pair per 5-minute window for peering and transit analysis.', impact: '90-95% reduction for peering metrics' },
        { name: 'Columnar Storage', description: 'Store full-fidelity flows in Parquet format with compression. Enables efficient IP/port range queries without per-record indexing cost.', impact: '70-80% storage cost reduction vs row-based formats' }
      ]
    },
    packFunctions: [
      { name: 'Decode NetFlow Templates', description: 'Process NetFlow v9 template records. Maintain template cache for decoding data records across multiple exporters.' },
      { name: 'Parse Flow Records', description: 'Decode binary NetFlow v5/v9 flow records into structured fields using template definitions.' },
      { name: 'Normalize Timestamps', description: 'Convert SysUpTime-based timestamps to absolute epoch milliseconds using exporter boot time.' },
      { name: 'Enrich GeoIP', description: 'Add geographic context (country, city, ASN) to src_addr and dst_addr using MaxMind or similar lookup.' },
      { name: 'Detect Port Scanning', description: 'Identify scanning patterns: SYN-only TCP flags, many destination ports from same source, low bytes-per-flow ratio.' },
      { name: 'Calculate Flow Metrics', description: 'Derive bytes_per_second, packets_per_second, and bytes_per_packet for anomaly detection.' },
      { name: 'Classify Flow Type', description: 'Tag flows as normal, high-bandwidth, long-lived, scanning, or anomalous based on heuristics.' },
      { name: 'Shape for SIEM', description: 'Create security-optimized variant: keep IPs, ports, protocol, flags, duration. Drop interface and routing metadata.' },
      { name: 'Shape for Observability', description: 'Create observability-optimized variant: keep bytes, packets, interfaces, AS numbers. Drop port-level detail.' },
      { name: 'Aggregate Interface Metrics', description: 'Roll up bytes and packets by input_snmp/output_snmp interface and direction per minute for utilization dashboards.' }
    ]
  },
  'ipfix': {
    sourceDescription: 'IPFIX (IP Flow Information Export) records collected via UDP/TCP from network infrastructure with application-layer visibility',
    collectionMethod: 'UDP/TCP Collector (Cribl Stream/Edge IPFIX input on UDP 4739 or TCP 4739/4740)',
    dataFlow: 'Network Devices (IPFIX Export) → Cribl Stream UDP/TCP Collector → Decode IPFIX Templates → Parse Flow Records → Enrich (GeoIP, App ID lookup, NAT correlation) → Route: unusual flows/application anomalies to Security SIEM, bandwidth/utilization/app metrics to Observability, all flows to Full-Fidelity Storage and Cribl Search',
    destinations: [
      {
        type: 'Security SIEM',
        examples: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security'],
        strategy: 'Send flows matching threat indicators: port scanning, unusual applications, connections to known-bad IPs, NAT-traversal anomalies, and suspicious HTTP hosts. Leverage application-layer fields for deeper visibility.',
        fieldCount: 20,
        estimatedReduction: '30-40% field reduction vs full fidelity',
        filters: [
          'Include flows with TCP control bits indicating scanning (SYN-only)',
          'Include flows to/from known-threat IPs or unusual destinations',
          'Include flows with suspicious application_id or http_host values',
          'Include flows with post-NAT address mismatches',
          'Include long-duration flows (> 1 hour, potential C2)',
          'Sample normal flows at 1-5% (high volume source)'
        ],
        excludedFields: ['observation_domain_id', 'ip_class_of_service', 'bgp_src_as', 'bgp_dst_as', 'ingress_interface', 'egress_interface', 'sampling_interval', 'vlan_id', 'flow_end_reason', 'min_ttl', 'max_ttl']
      },
      {
        type: 'Observability Platform',
        examples: ['Dynatrace', 'Datadog', 'New Relic', 'Grafana', 'Splunk Observability'],
        strategy: 'Send bandwidth utilization, interface traffic, application distribution, and AS-level peering metrics. Leverage application_id and http_host for app-aware traffic engineering. Aggregate heavily.',
        fieldCount: 18,
        estimatedReduction: '40-50% field reduction vs full fidelity',
        filters: [
          'Aggregate flows by interface/direction/application_id per minute for utilization',
          'Aggregate by bgp_src_as/bgp_dst_as per 5 minutes for peering analysis',
          'Include individual high-bandwidth flows (> threshold) at full fidelity',
          'Include flows with anomalous duration or flow_end_reason for health monitoring',
          'Sample individual records at 0.1-1% for traffic diversity analysis'
        ],
        excludedFields: ['tcp_control_bits', 'post_nat_src_addr', 'post_nat_dst_addr', 'post_nat_src_port', 'post_nat_dst_port', 'src_port', 'min_ttl', 'max_ttl']
      },
      {
        type: 'Full-Fidelity Storage',
        examples: ['Cribl Lake', 'Amazon S3', 'Azure Blob', 'Google Cloud Storage'],
        strategy: 'Retain complete IPFIX records including application-layer fields and NAT translations. Critical for forensic investigation with full network context. Use columnar format.',
        fieldCount: 30,
        estimatedReduction: '0% — all fields retained',
        filters: [
          'Include ALL flow records — no filtering',
          'Preserve all IPFIX fields including application-layer data',
          'Add Cribl processing metadata (pipeline version, timestamp)',
          'Add GeoIP enrichment for src_addr and dst_addr',
          'Store in columnar format (Parquet) for efficient querying'
        ],
        excludedFields: [],
        retentionGuidance: '30 days hot (Cribl Lake), 90 days warm (S3 Standard-IA), 365 days cold (S3 Glacier) — shorter due to extreme volume'
      },
      {
        type: 'Cribl Search',
        examples: ['Cribl Search'],
        strategy: 'Full-fidelity IPFIX records indexed for network forensics, application traffic analysis, and NAT correlation. Essential for investigating application-layer threats and lateral movement.',
        fieldCount: 30,
        estimatedReduction: '0% — searchable full fidelity',
        filters: [
          'All flow records searchable',
          'Optimized for time-range, IP/port, and application queries',
          'Support aggregation queries for traffic and application analysis',
          'Enable replay to SIEM when new IOCs or application threats are identified'
        ],
        excludedFields: [],
        replayWorkflow: 'When a malicious application or C2 HTTP host is identified, search IPFIX records for all flows to that application/host → map affected endpoints and data volumes → replay suspicious flows to SIEM for investigation.'
      }
    ],
    costOptimization: {
      summary: 'IPFIX is extremely high volume like NetFlow but with richer application-layer data. Aggregation is the key cost optimization lever. Customers typically achieve 90-95% SIEM reduction and 85-95% observability reduction through aggressive aggregation and threat-focused filtering.',
      strategies: [
        { name: 'Threat-Focused SIEM Routing', description: 'Only route flows matching threat criteria (scanning, suspicious apps/hosts, known-bad destinations, NAT anomalies) to SIEM.', impact: '90-95% volume reduction for SIEM' },
        { name: 'Application-Aware Aggregation', description: 'Aggregate by application_id/http_host per interface per minute. Provides app-level visibility without individual flow records.', impact: '95-99% event reduction for app metrics' },
        { name: 'Interface Aggregation', description: 'Aggregate octet_delta_count/packet_delta_count by interface/direction per minute for bandwidth monitoring.', impact: '95-99% event reduction for utilization metrics' },
        { name: 'NAT Correlation Batching', description: 'Batch NAT translation events for SIEM in 5-minute windows. Not every flow needs real-time NAT context.', impact: '40-60% NAT-related volume reduction' },
        { name: 'Columnar Storage', description: 'Store full-fidelity flows in Parquet format with compression. Application fields compress well due to repetition.', impact: '70-80% storage cost reduction vs row-based formats' }
      ]
    },
    packFunctions: [
      { name: 'Decode IPFIX Templates', description: 'Process IPFIX template records (including options templates). Maintain template cache supporting variable-length fields and enterprise elements.' },
      { name: 'Parse IPFIX Records', description: 'Decode IPFIX data records using template definitions. Handle variable-length information elements and enterprise-specific fields.' },
      { name: 'Normalize Timestamps', description: 'Convert flow_start_ms and flow_end_ms to ISO 8601. Calculate flow_duration_ms from start/end difference.' },
      { name: 'Enrich GeoIP and Application', description: 'Add GeoIP context to addresses. Map application_id to human-readable application names using NBAR/DPI lookup.' },
      { name: 'Correlate NAT Translations', description: 'Link pre-NAT and post-NAT addresses/ports to provide full connection context for forensic analysis.' },
      { name: 'Detect Anomalous Flows', description: 'Identify scanning, unusual applications, suspicious http_host patterns, and high-volume transfers for security routing.' },
      { name: 'Calculate Flow Metrics', description: 'Derive bytes_per_second, packets_per_second from octet/packet delta counts and flow duration.' },
      { name: 'Shape for SIEM', description: 'Create security-optimized variant: keep IPs, ports, protocol, application, http_host, NAT fields. Drop interface and routing metadata.' },
      { name: 'Shape for Observability', description: 'Create observability-optimized variant: keep bytes, packets, interfaces, application, AS numbers. Drop NAT and port-level detail.' },
      { name: 'Aggregate Application Metrics', description: 'Roll up octet and packet counts by application_id, http_host, and interface per minute for application-aware traffic dashboards.' }
    ]
  },
  'carbon-black': {
    sourceDescription: 'VMware Carbon Black Cloud endpoint telemetry collected via CB Cloud Data Forwarder to S3',
    collectionMethod: 'CB Cloud Data Forwarder (S3 bucket delivery, JSON format, partitioned by org_key and event type)',
    dataFlow: [
      { step: 1, name: 'Collect Once', description: 'CB Cloud Data Forwarder writes JSON telemetry to S3 partitioned by org_key, event type, and time. Cribl Stream S3 source reads objects as they arrive via SQS notifications.' },
      { step: 2, name: 'Parse and Normalize', description: 'Parse JSON event payload. Normalize timestamps to ISO 8601. Flatten nested process and network structures into top-level fields.' },
      { step: 3, name: 'Enrich and Classify', description: 'Apply process reputation lookup, MITRE TTP mapping, device asset enrichment, and network destination reputation. Tag events with routing metadata.' },
      { step: 4, name: 'Route by Use Case', description: 'Fork: all process/crossproc/filemod/regmod/alert events → Security SIEM. Device health and volume metrics → Observability. Full telemetry → Full-Fidelity.' },
      { step: 5, name: 'Search and Replay', description: 'Full-fidelity CB telemetry in Cribl Lake for threat hunting, process tree reconstruction, and incident response via Cribl Search.' }
    ],
    destinations: [
      {
        type: 'Security SIEM',
        examples: ['CrowdStrike NG SIEM', 'Splunk', 'Microsoft Sentinel', 'Elastic Security', 'Google Chronicle'],
        strategy: 'Send all alert events, crossproc events (credential access indicators), process events with suspicious lineage, network connections to external destinations, file modifications in sensitive paths, and registry persistence modifications. Filter high-volume benign procstart and modload noise.',
        fieldCount: 26,
        estimatedReduction: '40-55% event reduction vs full fidelity',
        filters: [
          'Include all events with alert_id populated',
          'Include all crossproc events (credential dumping indicators)',
          'Include procstart events where process_name matches LOLBin or unsigned binary list',
          'Include netconn events to external IPs (non-RFC1918)',
          'Include filemod events targeting sensitive paths (System32, startup, temp)',
          'Include all regmod events targeting Run keys and service paths',
          'Filter procstart for known-good system processes without suspicious command lines'
        ],
        excludedFields: ['device_os_version', 'org_key', 'sensor_action']
      },
      {
        type: 'Observability Platform',
        examples: ['Dynatrace', 'Datadog', 'New Relic', 'Splunk Observability'],
        strategy: 'Send device health indicators, event volume metrics per device, and sensor action summaries. Focus on fleet coverage, sensor responsiveness, and process execution baselines. Drop all security-specific fields like hashes, command lines, and TTPs.',
        fieldCount: 10,
        estimatedReduction: '85-95% event reduction vs full fidelity',
        filters: [
          'Aggregate procstart count per device per minute for process execution rate',
          'Aggregate netconn count per device per minute for network activity rate',
          'Include sensor_action=DENY/TERMINATE events for prevention metrics',
          'Include device check-in heartbeat indicators',
          'Drop individual event details — send aggregated metrics only'
        ],
        excludedFields: ['process_hash', 'process_cmdline', 'process_username', 'parent_guid', 'parent_name', 'parent_hash', 'parent_pid', 'childproc_type', 'crossproc_type', 'alert_id', 'alert_severity', 'ttp', 'netconn_domain', 'filemod_filename', 'filemod_hash', 'regmod_regpath', 'process_guid', 'netconn_remote_ip', 'netconn_remote_port', 'netconn_protocol']
      },
      {
        type: 'Full-Fidelity Storage',
        examples: ['Cribl Lake', 'Amazon S3', 'Azure Blob'],
        strategy: 'Retain complete CB Cloud telemetry for threat hunting, process tree reconstruction, and forensic investigation. Preserve all fields including full command lines and file hashes.',
        fieldCount: 30,
        estimatedReduction: '0% — all fields retained',
        filters: [
          'Include ALL events — no filtering',
          'Preserve complete JSON structure with all nested fields',
          'Add Cribl processing metadata (pipeline version, timestamp)',
          'Add enrichment context (reputation, MITRE, asset data)'
        ],
        excludedFields: [],
        retentionGuidance: '30 days hot (Cribl Lake), 90 days warm (S3 Standard-IA), 365 days cold (S3 Glacier) for incident response capability'
      },
      {
        type: 'Cribl Search',
        examples: ['Cribl Search'],
        strategy: 'Full-fidelity CB telemetry indexed for interactive threat hunting, process lineage reconstruction, and timeline analysis. Primary tool for deep-dive endpoint forensics and kill chain mapping.',
        fieldCount: 30,
        estimatedReduction: '0% — searchable full fidelity',
        filters: [
          'All events searchable',
          'Optimized for process_guid + time-range and process_cmdline keyword queries',
          'Support process tree reconstruction via parent_guid/process_guid relationships',
          'Enable replay to SIEM when new IOCs or TTPs are identified'
        ],
        excludedFields: [],
        replayWorkflow: 'When a new malicious hash is identified, search CB telemetry for all endpoints that executed it → reconstruct process tree per endpoint → identify lateral movement via netconn events → replay critical events to SIEM for incident response.'
      }
    ],
    costOptimization: {
      summary: 'Carbon Black Cloud generates 10,000-100,000+ events per endpoint per day. procstart and modload events account for 60-80% of volume. By filtering to security-relevant process patterns, suppressing benign modload noise, sampling high-volume netconn events, and aggregating fleet health metrics, customers achieve 50-70% reduction in SIEM ingestion while retaining full hunting capability.',
      strategies: [
        { name: 'Event Type Routing', description: 'Route by event type: crossproc always to SIEM (low volume, high value). procstart filtered by reputation and lineage. modload heavily filtered or dropped for SIEM. netconn sampled for internal destinations.', impact: '40-60% SIEM volume reduction' },
        { name: 'Known-Good Process Suppression', description: 'Suppress procstart for known-good system processes (svchost.exe, RuntimeBroker.exe, SearchProtocolHost.exe) with expected parent lineage and no suspicious command line arguments.', impact: '30-50% procstart reduction' },
        { name: 'Modload Noise Filtering', description: 'Filter modload events for well-known Microsoft-signed DLLs loaded by expected processes. Only forward modload for unsigned or reputation-unknown modules.', impact: '70-90% modload reduction' },
        { name: 'Internal Network Suppression', description: 'Sample or suppress netconn events to internal RFC1918 destinations and known infrastructure IPs (DNS servers, DCs, file shares). Keep all external connections.', impact: '50-70% netconn reduction' },
        { name: 'Process Lineage Aggregation', description: 'Aggregate repetitive process executions by the same parent into summary events (e.g., svchost spawning 100 identical service workers → 1 summary event with count).', impact: '20-40% overall event reduction' }
      ]
    },
    packFunctions: [
      { name: 'Decompress and Parse S3 Objects', description: 'Read gzipped JSON objects from S3 via Data Forwarder. Split multi-event payloads into individual events. Extract org_key and event type from S3 path prefix.' },
      { name: 'Normalize Timestamps', description: 'Convert CB epoch timestamps to ISO 8601. Handle event_timestamp precision. Calculate ingest latency from forwarder delivery time.' },
      { name: 'Flatten Process Fields', description: 'Flatten nested process_info and parent_info structures into top-level fields (process_name, process_hash, parent_name, etc.) for consistent downstream processing.' },
      { name: 'Classify Process Reputation', description: 'Tag process_name and process_hash against reputation lookup: known-good, known-bad, or unknown. Add is_signed and signer fields.' },
      { name: 'Map MITRE TTPs', description: 'Map ttp[] array values to MITRE technique names and tactic categories. Add mitre_technique_name and mitre_tactic fields.' },
      { name: 'Tag Network Direction', description: 'Classify netconn_remote_ip as internal, external, multicast, or loopback. Add network_direction field (inbound/outbound).' },
      { name: 'Score Process Lineage', description: 'Evaluate parent_name → process_name relationships against expected lineage patterns. Flag anomalous parent-child combinations.' },
      { name: 'Shape for SIEM', description: 'Create security-optimized variant: keep threat-relevant fields, apply process reputation and lineage filters, drop observability-only fields.' },
      { name: 'Aggregate for Fleet Health', description: 'Create per-device-per-minute event counts by type for fleet health and volume trending dashboards.' },
      { name: 'Preserve Full Fidelity', description: 'Pass through complete event with all enrichments for full-fidelity storage and Cribl Search indexing.' }
    ]
  }
};
