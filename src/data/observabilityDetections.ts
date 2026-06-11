// @ts-nocheck
export const observabilityDetections = {
  'palo-alto-traffic': [
    {
      id: 'obs-001',
      name: 'Firewall Rule Stopped Processing Traffic',
      objective: 'Detect when a normally active firewall rule suddenly stops matching traffic, indicating potential routing failures, policy issues, or upstream connectivity loss.',
      severity: 'High',
      category: 'Availability',
      tags: ['observability', 'availability', 'policy', 'connectivity'],
      requiredFields: ['rule_name', 'device_name', 'source_zone', 'destination_zone', 'application', 'action', 'bytes', 'packets', 'generated_time'],
      detectionLogic: 'Alert when event volume for a rule drops to zero or significantly below baseline (>90% reduction) after previously consistent activity. Use 7-day rolling baseline with 15-minute evaluation windows.',
      operationalValue: 'Helps identify broken policy changes, routing failures, upstream connectivity issues, or logging failures before they become user-reported outages.',
      changeMgmtRelevance: 'Correlate with change windows. If a rule stops matching within 30 minutes of a policy push, flag as potential change-related regression.',
      troubleshootingWorkflow: '1. Confirm the rule existed and was active before the drop\n2. Check if a policy push occurred recently\n3. Verify upstream routing — is traffic still reaching the firewall?\n4. Check if traffic shifted to a different rule\n5. Verify logging is functioning (check sequence_number gaps)\n6. Check Cribl pipeline health for this source',
      dashboardDependency: 'Traffic by Rule Name dashboard, Policy Change Impact dashboard',
      criblSearchQueries: [
        {
          name: 'Sessions per rule over time (last 12 hours)',
          description: 'Identify rules that have dropped to zero or near-zero traffic',
          query: 'dataset="$DATASET" earliest=-12h\n| timestats span=15m count() by rule_name\n| order by count_ asc'
        },
        {
          name: 'Rules active in last 7 days but silent in last hour',
          description: 'Compare recent activity against baseline to find rules that stopped matching',
          query: 'dataset="$DATASET" earliest=-1h\n| summarize RecentCount=count() by rule_name\n| where RecentCount < 5\n| order by RecentCount asc'
        },
        {
          name: 'Rule traffic volume comparison (current vs 24h ago)',
          description: 'Side-by-side view of rule activity now versus the same window yesterday',
          query: 'dataset="$DATASET" earliest=-2h\n| summarize Sessions=count(), TotalBytes=sum(bytes) by rule_name, device_name\n| order by Sessions asc\n| limit 30'
        }
      ]
    },
    {
      id: 'obs-002',
      name: 'Large Increase in Traffic After Policy Push',
      objective: 'Detect when a firewall policy change causes a major increase in allowed or denied traffic, enabling rapid rollback decisions.',
      severity: 'High',
      category: 'Change Impact',
      tags: ['observability', 'change-management', 'policy', 'volume'],
      requiredFields: ['rule_name', 'action', 'bytes', 'packets', 'source_zone', 'destination_zone', 'application', 'device_name', 'generated_time'],
      detectionLogic: 'Alert when traffic volume for a rule, zone pair, or application increases >200% within 30 minutes of a known change window. Compare current 15-minute window against same window from previous 7 days.',
      operationalValue: 'Helps NOC teams identify policy mistakes before they become outages, cost overruns, or security incidents. Enables sub-hour rollback decisions.',
      changeMgmtRelevance: 'Critical for post-change validation. Integrate with change management systems to auto-correlate policy pushes with traffic shifts.',
      troubleshootingWorkflow: '1. Identify which rule(s) saw the volume increase\n2. Determine if the increase is allowed or denied traffic\n3. Check if the traffic was previously matched by a different rule\n4. Review the change request for expected behavior\n5. Determine blast radius — how many sources/destinations affected?\n6. Decide: monitor, tune, or rollback',
      dashboardDependency: 'Policy Change Impact dashboard, Traffic Volume by Rule dashboard',
      criblSearchQueries: [
        {
          name: 'Traffic volume by rule (last 4 hours)',
          description: 'Visualize traffic spikes per rule to identify post-change impact',
          query: 'dataset="$DATASET" earliest=-4h\n| timestats span=5m Sessions=count(), Bytes=sum(bytes) by rule_name'
        },
        {
          name: 'Rules with >200% volume increase (last hour vs prior day)',
          description: 'Compare current traffic against yesterday to find abnormal increases',
          query: 'dataset="$DATASET" earliest=-1h\n| summarize CurrentSessions=count(), CurrentBytes=sum(bytes) by rule_name, action\n| where CurrentSessions > 100\n| order by CurrentSessions desc'
        },
        {
          name: 'Allowed vs denied breakdown after change window',
          description: 'See if a policy change shifted traffic from deny to allow or vice versa',
          query: 'dataset="$DATASET" earliest=-2h\n| timestats span=5m count() by action, rule_name\n| order by count_ desc'
        },
        {
          name: 'New source/destination pairs hitting a specific rule',
          description: 'Find traffic that started matching a rule after a policy change',
          query: 'dataset="$DATASET" rule_name="$RULE_NAME" earliest=-2h\n| summarize FirstSeen=min(_time), Sessions=count() by source_ip, destination_ip, destination_port\n| order by FirstSeen desc\n| limit 50'
        }
      ]
    },
    {
      id: 'obs-003',
      name: 'Application Connectivity Failure',
      objective: 'Identify when a business-critical application begins seeing connection failures or abnormal session endings.',
      severity: 'High',
      category: 'Application Health',
      tags: ['observability', 'application', 'connectivity', 'troubleshooting'],
      requiredFields: ['application', 'destination_ip', 'destination_port', 'protocol', 'action', 'session_end_reason', 'elapsed_time', 'packets', 'bytes', 'source_zone', 'destination_zone'],
      detectionLogic: 'Alert when sessions for a known application show increased deny, aged-out, tcp-rst-from-server, or incomplete sessions compared to baseline. Threshold: >50% increase in failure sessions over 15-minute window.',
      operationalValue: 'Provides early detection of application issues visible at the network layer. Often detects problems before application monitoring alerts fire.',
      changeMgmtRelevance: 'Application connectivity failures often follow infrastructure changes (firewall, routing, DNS, load balancer). Correlate timing with change windows.',
      troubleshootingWorkflow: '1. Identify the affected application and destination\n2. Check session_end_reason distribution — what type of failure?\n3. Determine if action=deny (policy issue) or session failures (connectivity)\n4. Check elapsed_time — are sessions timing out or resetting quickly?\n5. Verify destination is reachable from other sources\n6. Check if a change occurred to firewall, routing, or the destination service',
      dashboardDependency: 'Application Connectivity dashboard, Session End Reason Trends dashboard',
      criblSearchQueries: [
        {
          name: 'Session end reasons by application',
          description: 'See how sessions are ending for each application — healthy vs failure',
          query: 'dataset="$DATASET" earliest=-4h\n| summarize count() by application, session_end_reason, action\n| order by application asc, count_ desc'
        },
        {
          name: 'Failed sessions trend for a specific application',
          description: 'Track connectivity failures over time for an application of interest',
          query: 'dataset="$DATASET" application="$APP_NAME" earliest=-12h\n| where session_end_reason in ("aged-out", "tcp-rst-from-server", "tcp-rst-from-client") or action == "deny"\n| timestats span=15m FailedSessions=count() by session_end_reason'
        },
        {
          name: 'Applications with high failure rate',
          description: 'Find applications where a significant percentage of sessions are failing',
          query: 'dataset="$DATASET" earliest=-1h\n| extend is_failure=iif(session_end_reason in ("aged-out", "tcp-rst-from-server") or action == "deny", 1, 0)\n| summarize Total=count(), Failures=sum(is_failure) by application\n| extend FailRate=round(Failures * 100.0 / Total, 1)\n| where FailRate > 20 and Total > 10\n| order by FailRate desc'
        }
      ]
    },
    {
      id: 'obs-004',
      name: 'Interface Traffic Imbalance',
      objective: 'Detect abnormal changes in traffic volume across firewall interfaces, indicating potential hardware failure, routing changes, or capacity issues.',
      severity: 'Medium',
      category: 'Infrastructure Health',
      tags: ['observability', 'infrastructure', 'capacity', 'routing'],
      requiredFields: ['inbound_interface', 'outbound_interface', 'bytes', 'packets', 'device_name', 'generated_time', 'source_zone', 'destination_zone'],
      detectionLogic: 'Alert when one interface shows a sudden drop (>70%), spike (>200%), or imbalance compared to historical baseline. Evaluate per interface per device on 15-minute windows.',
      operationalValue: 'Identifies physical layer issues, routing flaps, or capacity problems before they cascade. Can indicate failing hardware, ISP issues, or routing convergence problems.',
      changeMgmtRelevance: 'Interface changes should correlate with planned maintenance. Unexpected shifts indicate unplanned issues.',
      troubleshootingWorkflow: '1. Identify which interface(s) are affected\n2. Check if traffic shifted to another interface (failover)\n3. Verify physical interface status via SNMP/API\n4. Check upstream routing — BGP/OSPF convergence events?\n5. Determine if this correlates with zone-to-zone traffic changes\n6. Verify no cable, optic, or port-channel member issues',
      dashboardDependency: 'Interface Traffic dashboard, Device Health dashboard',
      criblSearchQueries: [
        {
          name: 'Traffic volume by interface over time',
          description: 'Visualize bytes and sessions per interface to spot imbalances or drops',
          query: 'dataset="$DATASET" earliest=-12h\n| timestats span=10m TotalBytes=sum(bytes), Sessions=count() by inbound_interface'
        },
        {
          name: 'Interface comparison — inbound vs outbound',
          description: 'Compare traffic across all interfaces to identify asymmetry',
          query: 'dataset="$DATASET" earliest=-4h\n| summarize InboundBytes=sum(bytes), InboundSessions=count() by inbound_interface, device_name\n| order by InboundBytes desc'
        },
        {
          name: 'Interfaces with sudden traffic drop',
          description: 'Find interfaces that dropped significantly in the last hour compared to prior hours',
          query: 'dataset="$DATASET" earliest=-1h\n| summarize RecentBytes=sum(bytes), RecentSessions=count() by inbound_interface, device_name\n| where RecentSessions < 10\n| order by RecentSessions asc'
        }
      ]
    },
    {
      id: 'obs-005',
      name: 'Zone-to-Zone Traffic Drop',
      objective: 'Detect potential routing, firewall, or upstream network failures by monitoring expected traffic patterns between security zones.',
      severity: 'High',
      category: 'Connectivity',
      tags: ['observability', 'connectivity', 'routing', 'availability'],
      requiredFields: ['source_zone', 'destination_zone', 'bytes', 'packets', 'action', 'device_name', 'generated_time'],
      detectionLogic: 'Alert when traffic between expected zone pairs drops below 30% of normal baseline for that time of day. Use day-of-week adjusted baselines to account for business hours patterns.',
      operationalValue: 'Zone-to-zone drops are strong signals of routing failures, policy misconfigurations, or upstream outages that affect entire segments of the network.',
      changeMgmtRelevance: 'Zone traffic patterns should be stable. Drops correlating with change windows indicate failed changes requiring immediate investigation.',
      troubleshootingWorkflow: '1. Identify which zone pair(s) are affected\n2. Check if traffic is being denied or simply not arriving\n3. Verify routing between zones — are interfaces up?\n4. Check if a firewall policy change removed zone access\n5. Verify upstream switches and routers\n6. Check if the issue is uni-directional or bi-directional',
      dashboardDependency: 'Zone Traffic Matrix dashboard, Network Connectivity dashboard',
      criblSearchQueries: [
        {
          name: 'Zone-to-zone traffic matrix (last 4 hours)',
          description: 'Heatmap-style view of traffic between all zone pairs',
          query: 'dataset="$DATASET" earliest=-4h\n| summarize Sessions=count(), TotalBytes=sum(bytes) by source_zone, destination_zone\n| order by Sessions desc'
        },
        {
          name: 'Zone pair traffic over time',
          description: 'Timechart showing volume between zone pairs to identify drops',
          query: 'dataset="$DATASET" earliest=-12h\n| extend zone_pair=strcat(source_zone, " → ", destination_zone)\n| timestats span=15m count() by zone_pair'
        },
        {
          name: 'Zone pairs with low traffic in last hour',
          description: 'Find zone pairs that may have lost connectivity',
          query: 'dataset="$DATASET" earliest=-1h\n| summarize Sessions=count(), Bytes=sum(bytes) by source_zone, destination_zone, device_name\n| where Sessions < 5\n| order by Sessions asc'
        }
      ]
    },
    {
      id: 'obs-006',
      name: 'Increased Session Aging',
      objective: 'Detect application or network instability where sessions are timing out instead of completing normally.',
      severity: 'Medium',
      category: 'Application Health',
      tags: ['observability', 'performance', 'timeout', 'application'],
      requiredFields: ['session_end_reason', 'application', 'source_ip', 'destination_ip', 'destination_port', 'elapsed_time', 'bytes', 'packets', 'device_name'],
      detectionLogic: 'Alert when session_end_reason = aged-out increases >100% for a destination, application, or zone pair compared to 7-day baseline. Focus on sessions with significant elapsed_time (>30s).',
      operationalValue: 'Aged-out sessions indicate that connections are being established but not properly closed. This often signals application hangs, network black holes, or asymmetric routing.',
      changeMgmtRelevance: 'Session aging increases after changes to timeout values, routing, or application deployments. Useful as a deployment health indicator.',
      troubleshootingWorkflow: '1. Identify affected applications/destinations\n2. Check if aged-out sessions have high or low elapsed_time\n3. Low elapsed_time + aged-out = possible firewall timeout too short\n4. High elapsed_time + aged-out = application not closing connections\n5. Check for asymmetric routing (traffic exits different path)\n6. Review application health metrics for correlation',
      dashboardDependency: 'Session End Reason dashboard, Application Health dashboard',
      criblSearchQueries: [
        {
          name: 'Aged-out sessions by application and destination',
          description: 'Find which applications and destinations are experiencing session timeouts',
          query: 'dataset="$DATASET" session_end_reason="aged-out" earliest=-24h\n| summarize AgedOut=count(), AvgElapsed=avg(elapsed_time) by application, destination_ip, destination_port\n| order by AgedOut desc\n| limit 30'
        },
        {
          name: 'Session aging trend over time',
          description: 'Track the volume of aged-out sessions to spot increases',
          query: 'dataset="$DATASET" earliest=-24h\n| where session_end_reason == "aged-out"\n| timestats span=30m count() by application'
        },
        {
          name: 'Aged-out vs normal session completion ratio',
          description: 'Compare healthy session endings against timeouts per destination',
          query: 'dataset="$DATASET" earliest=-4h\n| summarize Total=count(), AgedOut=countif(session_end_reason == "aged-out"), Normal=countif(session_end_reason == "tcp-fin") by destination_ip, application\n| extend AgedOutPct=round(AgedOut * 100.0 / Total, 1)\n| where Total > 20 and AgedOutPct > 30\n| order by AgedOutPct desc'
        }
      ]
    },
    {
      id: 'obs-007',
      name: 'Logging Pipeline Health',
      objective: 'Detect when Palo Alto logs stop arriving or materially change in volume, indicating collection or forwarding issues.',
      severity: 'Critical',
      category: 'Pipeline Health',
      tags: ['observability', 'pipeline', 'monitoring', 'reliability'],
      requiredFields: ['device_name', 'serial_number', 'type', 'receive_time', 'generated_time', 'sequence_number', 'log_action'],
      detectionLogic: 'Alert when no logs are received from a firewall device within 5 minutes, or when log volume deviates >60% from expected baseline. Also detect sequence_number gaps indicating dropped logs.',
      operationalValue: 'Pipeline health is the foundation of all other detections. If logs are not arriving, all downstream security and observability use cases are blind.',
      changeMgmtRelevance: 'Log pipeline failures can follow firewall upgrades, Cribl pipeline changes, or network infrastructure changes affecting syslog delivery.',
      troubleshootingWorkflow: '1. Check last received log timestamp per device\n2. Verify syslog connectivity (Cribl source metrics)\n3. Check for sequence_number gaps (indicates drops)\n4. Verify log-forwarding profile on the firewall\n5. Check Cribl pipeline health metrics\n6. Verify no intermediate network issues (firewall → Cribl)\n7. Check disk space on firewall and Cribl workers',
      dashboardDependency: 'Log Ingestion Health dashboard, Device Coverage dashboard',
      criblSearchQueries: [
        {
          name: 'Log volume per device over time',
          description: 'Track ingestion rate per firewall to detect drop-offs',
          query: 'dataset="$DATASET" earliest=-12h\n| timestats span=5m count() by device_name'
        },
        {
          name: 'Last seen timestamp per device',
          description: 'Find devices that may have stopped sending logs',
          query: 'dataset="$DATASET" earliest=-1h\n| summarize LastSeen=max(_time), EventCount=count(), LastSeq=max(sequence_number) by device_name, serial_number\n| order by LastSeen asc'
        },
        {
          name: 'Sequence number gaps (potential log drops)',
          description: 'Detect gaps in sequence numbers that indicate dropped events',
          query: 'dataset="$DATASET" earliest=-1h\n| summarize MinSeq=min(sequence_number), MaxSeq=max(sequence_number), EventCount=count() by device_name\n| extend ExpectedEvents=MaxSeq - MinSeq + 1\n| extend MissingEvents=ExpectedEvents - EventCount\n| where MissingEvents > 10\n| extend DropPct=round(MissingEvents * 100.0 / ExpectedEvents, 1)\n| order by DropPct desc'
        },
        {
          name: 'Ingestion latency (receive_time vs generated_time)',
          description: 'Measure delay between event generation and receipt in Cribl',
          query: 'dataset="$DATASET" earliest=-1h\n| extend latency_sec=todouble(receive_time) - todouble(generated_time)\n| summarize AvgLatency=avg(latency_sec), MaxLatency=max(latency_sec), P95Latency=max(latency_sec) by device_name\n| order by AvgLatency desc'
        }
      ]
    }
  ],
  'windows-dns': [
    {
      id: 'dns-obs-001',
      name: 'DNS Query Latency Degradation',
      objective: 'Detect when DNS resolution times increase significantly, indicating forwarder issues, upstream connectivity problems, or DNS server resource exhaustion.',
      severity: 'High',
      category: 'Performance',
      tags: ['observability', 'performance', 'latency', 'dns'],
      requiredFields: ['elapsed_time_ms', 'query_name', 'source_ip', 'computer', 'event_id', 'response_code', 'timestamp'],
      detectionLogic: 'Alert when average elapsed_time_ms exceeds 200ms over a 5-minute window, or when P95 latency exceeds 500ms. Compare against 7-day rolling baseline for same time-of-day window. Separate authoritative vs recursive latency thresholds.',
      operationalValue: 'DNS latency directly impacts every application and user experience. Detecting degradation early prevents cascading failures across dependent services.',
      changeMgmtRelevance: 'Latency increases after DNS configuration changes (new forwarders, conditional forwarding rules, DNSSEC enablement) indicate misconfiguration requiring rollback.',
      troubleshootingWorkflow: '1. Identify affected DNS server(s) and scope of latency increase\n2. Determine if latency is on authoritative (local zone) or recursive (upstream) queries\n3. Check forwarder health — can the server reach upstream resolvers?\n4. Review resource utilization (CPU, memory, disk) on DNS server\n5. Check for DNSSEC validation delays\n6. Verify network path to upstream forwarders (MTU, routing changes)',
      dashboardDependency: 'DNS Performance dashboard, Server Health dashboard',
      criblSearchQueries: [
        {
          name: 'Average response time per DNS server',
          description: 'Track query latency across the DNS fleet to identify degraded servers',
          query: 'dataset="$DATASET" event_id=257 earliest=-4h\n| summarize AvgLatency=avg(elapsed_time_ms), P95=max(elapsed_time_ms), MaxLatency=max(elapsed_time_ms), Queries=count() by computer\n| order by AvgLatency desc'
        },
        {
          name: 'Latency trend over time by server',
          description: 'Visualize DNS response time trends to spot degradation onset',
          query: 'dataset="$DATASET" event_id=257 earliest=-12h\n| timestats span=5m AvgLatency=avg(elapsed_time_ms), P95=max(elapsed_time_ms) by computer'
        },
        {
          name: 'Slow queries — which domains are causing high latency',
          description: 'Find specific domains with consistently high resolution times',
          query: 'dataset="$DATASET" event_id=257 elapsed_time_ms > 200 earliest=-1h\n| summarize AvgLatency=avg(elapsed_time_ms), Queries=count() by parent_domain, computer\n| where Queries > 5\n| order by AvgLatency desc\n| limit 25'
        },
        {
          name: 'Recursive vs authoritative latency comparison',
          description: 'Compare latency for local zone queries vs recursive resolution to isolate the problem layer',
          query: 'dataset="$DATASET" event_id=257 earliest=-4h\n| extend query_type_class=iif(flags_authoritative == 1, "Authoritative", "Recursive")\n| summarize AvgLatency=avg(elapsed_time_ms), P95=max(elapsed_time_ms), Count=count() by query_type_class, computer\n| order by AvgLatency desc'
        }
      ]
    },
    {
      id: 'dns-obs-002',
      name: 'SERVFAIL Response Spike',
      objective: 'Detect when the DNS server begins returning SERVFAIL responses at an abnormal rate, indicating upstream resolution failures, DNSSEC validation issues, or misconfigured conditional forwarders.',
      severity: 'High',
      category: 'Availability',
      tags: ['observability', 'availability', 'resolution-failure', 'dns'],
      requiredFields: ['response_code', 'query_name', 'source_ip', 'computer', 'parent_domain', 'zone', 'timestamp'],
      detectionLogic: 'Alert when SERVFAIL (RCODE=2) responses exceed 5% of total responses over a 10-minute window, or when SERVFAIL count exceeds 3x the 7-day baseline for the same time window.',
      operationalValue: 'SERVFAIL means the DNS server tried but could not resolve the query. Unlike NXDOMAIN (domain doesn\'t exist), SERVFAIL indicates an infrastructure problem that affects user experience and application availability.',
      changeMgmtRelevance: 'SERVFAIL spikes after changes to forwarders, conditional forwarding rules, DNSSEC policies, or network routing indicate broken DNS resolution paths.',
      troubleshootingWorkflow: '1. Identify which domains are returning SERVFAIL\n2. Determine if it\'s a specific zone or all recursive queries\n3. Check conditional forwarder configuration and health\n4. Test resolution manually (nslookup/dig from the server)\n5. Check DNSSEC validation — is a trust anchor expired?\n6. Verify network connectivity to upstream forwarders/root servers\n7. Check if the authoritative servers for affected domains are down',
      dashboardDependency: 'DNS Response Code dashboard, Resolution Failure dashboard',
      criblSearchQueries: [
        {
          name: 'SERVFAIL rate by DNS server',
          description: 'Show SERVFAIL percentage per server to identify the problem scope',
          query: 'dataset="$DATASET" event_id in (257, 258) earliest=-4h\n| summarize Total=count(), ServFail=countif(response_code == "SERVFAIL") by computer\n| extend ServFailPct=round(ServFail * 100.0 / Total, 2)\n| order by ServFailPct desc'
        },
        {
          name: 'SERVFAIL trend over time',
          description: 'Visualize when SERVFAIL responses started spiking',
          query: 'dataset="$DATASET" response_code="SERVFAIL" earliest=-12h\n| timestats span=5m count() by computer'
        },
        {
          name: 'Domains causing SERVFAIL responses',
          description: 'Identify which domains are failing — points to the upstream issue',
          query: 'dataset="$DATASET" response_code="SERVFAIL" earliest=-1h\n| summarize FailCount=count(), AffectedClients=dcount(source_ip) by parent_domain, query_type, computer\n| order by FailCount desc\n| limit 25'
        },
        {
          name: 'Response code distribution over time',
          description: 'Full response code breakdown to see SERVFAIL in context of overall traffic',
          query: 'dataset="$DATASET" event_id in (257, 258) earliest=-12h\n| timestats span=10m count() by response_code'
        }
      ]
    },
    {
      id: 'dns-obs-003',
      name: 'DNS Server Query Volume Anomaly',
      objective: 'Detect abnormal increases or decreases in overall DNS query volume that may indicate infrastructure failures, DDoS, client misconfigurations, or logging pipeline issues.',
      severity: 'Medium',
      category: 'Capacity',
      tags: ['observability', 'capacity', 'volume', 'anomaly', 'dns'],
      requiredFields: ['source_ip', 'computer', 'event_id', 'query_type', 'timestamp'],
      detectionLogic: 'Alert when total query volume for a DNS server deviates more than 50% from the day-of-week/time-of-day baseline. Also alert when volume drops to zero (complete outage). Use 15-minute evaluation windows.',
      operationalValue: 'Sudden volume increases may indicate scanning, worm propagation, or misconfigured clients hammering the server. Volume drops indicate server failures, routing issues, or logging pipeline breaks.',
      changeMgmtRelevance: 'Volume shifts after DNS infrastructure changes (new forwarders, DHCP scope changes, new subnets pointed at this server) should be expected and baselined.',
      troubleshootingWorkflow: '1. Determine if the anomaly is a spike or drop\n2. For spikes: identify top talker source IPs\n3. For drops: verify server is running and reachable\n4. Check if the change affects one server or the entire fleet\n5. Review recent DHCP or network changes that might redirect DNS clients\n6. Check Cribl pipeline health if volume dropped — is it a logging issue or actual traffic loss?',
      dashboardDependency: 'DNS Query Volume dashboard, Server Fleet Health dashboard',
      criblSearchQueries: [
        {
          name: 'Query volume per DNS server over time',
          description: 'Baseline query volume per server to spot anomalies',
          query: 'dataset="$DATASET" event_id=256 earliest=-24h\n| timestats span=15m count() by computer'
        },
        {
          name: 'Current hour vs same hour yesterday',
          description: 'Compare current query volume against yesterday for anomaly detection',
          query: 'dataset="$DATASET" event_id=256 earliest=-1h\n| summarize CurrentHour=count() by computer\n| order by CurrentHour desc'
        },
        {
          name: 'Top talkers driving volume spikes',
          description: 'Identify source IPs generating the most queries — useful during volume spikes',
          query: 'dataset="$DATASET" event_id=256 earliest=-1h\n| summarize Queries=count(), UniqueDomains=dcount(query_name) by source_ip\n| order by Queries desc\n| limit 25'
        },
        {
          name: 'Query type breakdown during anomaly',
          description: 'See if a specific query type is driving the volume change',
          query: 'dataset="$DATASET" event_id=256 earliest=-4h\n| timestats span=15m count() by query_type'
        }
      ]
    },
    {
      id: 'dns-obs-004',
      name: 'Recursive Resolution Failure',
      objective: 'Detect when the DNS server cannot reach upstream forwarders or root servers for recursive resolution, causing widespread name resolution failures.',
      severity: 'Critical',
      category: 'Availability',
      tags: ['observability', 'availability', 'recursion', 'forwarder', 'dns'],
      requiredFields: ['event_id', 'query_name', 'response_code', 'elapsed_time_ms', 'computer', 'flags_recursion_desired', 'timestamp'],
      detectionLogic: 'Alert when Event ID 262 (RECURSE_QUERY_TIMEOUT) volume exceeds 10 per 5-minute window, or when recursive queries have elapsed_time exceeding 2000ms consistently. Also detect when SERVFAIL rate on recursive queries (AA=0) exceeds 20%.',
      operationalValue: 'Recursive resolution failures affect every client relying on this DNS server for external name resolution. This is typically a high-impact event affecting all users and applications.',
      changeMgmtRelevance: 'Forwarder changes, firewall rule modifications blocking port 53 outbound, or routing changes affecting DNS server internet access are common causes.',
      troubleshootingWorkflow: '1. Check Event ID 262 (recurse timeout) volume and affected domains\n2. Verify forwarder reachability (nslookup to forwarder IP)\n3. Check firewall rules — is outbound port 53 (UDP+TCP) still allowed?\n4. Verify routing from DNS server to forwarders/internet\n5. Test with alternative forwarders (8.8.8.8, 1.1.1.1) temporarily\n6. Check if conditional forwarders are the issue (specific zones only)\n7. Verify root hints are current if not using forwarders',
      dashboardDependency: 'Recursive Resolution dashboard, Forwarder Health dashboard',
      criblSearchQueries: [
        {
          name: 'Recursive query timeouts (Event ID 262)',
          description: 'Direct indicator of upstream resolution failures',
          query: 'dataset="$DATASET" event_id=262 earliest=-4h\n| summarize Timeouts=count() by computer, query_name, parent_domain\n| order by Timeouts desc\n| limit 25'
        },
        {
          name: 'Recursive timeout trend over time',
          description: 'Visualize when recursive failures started occurring',
          query: 'dataset="$DATASET" event_id=262 earliest=-12h\n| timestats span=5m count() by computer'
        },
        {
          name: 'High-latency recursive queries (forwarder slowness)',
          description: 'Find queries with high elapsed time indicating forwarder connectivity issues',
          query: 'dataset="$DATASET" event_id=257 flags_authoritative=0 elapsed_time_ms > 1000 earliest=-4h\n| summarize SlowQueries=count(), AvgLatency=avg(elapsed_time_ms), P95=max(elapsed_time_ms) by computer, parent_domain\n| order by SlowQueries desc'
        },
        {
          name: 'Recursive vs authoritative failure comparison',
          description: 'Confirm the issue is recursive (external) not authoritative (local zones)',
          query: 'dataset="$DATASET" response_code="SERVFAIL" earliest=-4h\n| extend is_recursive=iif(flags_authoritative == 0, "Recursive", "Authoritative")\n| summarize Failures=count() by is_recursive, computer\n| order by Failures desc'
        }
      ]
    },
    {
      id: 'dns-obs-005',
      name: 'Top Talker Analysis (Noisy Clients)',
      objective: 'Identify client hosts generating disproportionate DNS query volume, which may indicate misconfigured applications, stuck resolvers, or compromised hosts.',
      severity: 'Medium',
      category: 'Capacity',
      tags: ['observability', 'capacity', 'top-talker', 'client-health', 'dns'],
      requiredFields: ['source_ip', 'query_name', 'query_type', 'parent_domain', 'computer', 'timestamp'],
      detectionLogic: 'Alert when a single source_ip generates more than 10x the median query volume for the environment within a 15-minute window. Also flag hosts sending > 1000 queries/minute or querying the same domain > 100 times in 5 minutes (stuck resolver loop).',
      operationalValue: 'Noisy DNS clients waste server resources, may cause resource exhaustion, and often indicate application-level bugs (retry storms, stuck resolver loops, misconfigured TTLs).',
      changeMgmtRelevance: 'Application deployments with misconfigured DNS caching or TTL=0 can immediately generate top-talker patterns. Useful as a deployment health signal.',
      troubleshootingWorkflow: '1. Identify the source IP generating excessive queries\n2. Determine what domain(s) are being queried (single domain = stuck loop)\n3. Check if the host is a legitimate service or workstation\n4. Review application logs on the host for retry errors\n5. Check if local DNS cache is working (ipconfig /displaydns on Windows)\n6. Verify the host isn\'t resolving the same name repeatedly due to TTL=0 responses',
      dashboardDependency: 'DNS Top Talkers dashboard, Client Health dashboard',
      criblSearchQueries: [
        {
          name: 'Top querying hosts (last hour)',
          description: 'Find the noisiest DNS clients by total query volume',
          query: 'dataset="$DATASET" event_id=256 earliest=-1h\n| summarize Queries=count(), UniqueDomains=dcount(parent_domain), UniqueTypes=dcount(query_type) by source_ip\n| order by Queries desc\n| limit 25'
        },
        {
          name: 'Hosts with repetitive queries (stuck resolver)',
          description: 'Find hosts querying the same domain excessively — indicates application issue',
          query: 'dataset="$DATASET" event_id=256 earliest=-15m\n| summarize RepeatCount=count() by source_ip, query_name\n| where RepeatCount > 100\n| order by RepeatCount desc\n| limit 25'
        },
        {
          name: 'Top talker trend over time',
          description: 'Track query volume per source IP to identify when excessive querying started',
          query: 'dataset="$DATASET" event_id=256 source_ip="$SOURCE_IP" earliest=-12h\n| timestats span=5m count() by parent_domain'
        },
        {
          name: 'Query rate per client (queries per minute)',
          description: 'Calculate per-client query rate for capacity planning and anomaly detection',
          query: 'dataset="$DATASET" event_id=256 earliest=-15m\n| summarize Queries=count() by source_ip\n| extend QueriesPerMin=round(Queries / 15.0, 1)\n| where QueriesPerMin > 50\n| order by QueriesPerMin desc'
        }
      ]
    },
    {
      id: 'dns-obs-006',
      name: 'DNS Server Log Ingestion Health',
      objective: 'Detect when Windows DNS log collection stops or materially changes in volume, indicating Cribl Edge collection issues, WEF failures, or DNS server logging configuration changes.',
      severity: 'Critical',
      category: 'Pipeline Health',
      tags: ['observability', 'pipeline', 'monitoring', 'reliability', 'dns'],
      requiredFields: ['computer', 'event_id', 'timestamp'],
      detectionLogic: 'Alert when no logs are received from a DNS server within 5 minutes, or when log volume deviates > 60% from expected baseline. Monitor per-server and per-event-type to catch partial collection failures.',
      operationalValue: 'All DNS security and observability detections depend on log collection. If logs stop flowing, the organization is blind to DNS-layer threats and performance issues.',
      changeMgmtRelevance: 'DNS logging can break after Windows updates, Cribl Edge upgrades, WEF configuration changes, or DNS server Analytical channel being disabled.',
      troubleshootingWorkflow: '1. Check last received timestamp per DNS server\n2. Verify Cribl Edge is running and connected to the DNS server\n3. Check if the Analytical channel is still enabled (wevtutil gl Microsoft-Windows-DNSServer/Analytical)\n4. Verify WEF subscription status if using Windows Event Forwarding\n5. Check Cribl Edge worker health metrics\n6. Verify no network issues between DNS server and Cribl Edge/WEF collector\n7. Check Windows Event Log service on the DNS server',
      dashboardDependency: 'Log Ingestion Health dashboard, DNS Coverage dashboard',
      criblSearchQueries: [
        {
          name: 'Log volume per DNS server over time',
          description: 'Track ingestion rate per server to detect drop-offs',
          query: 'dataset="$DATASET" earliest=-12h\n| timestats span=5m count() by computer'
        },
        {
          name: 'Last seen timestamp per DNS server',
          description: 'Find servers that may have stopped sending logs',
          query: 'dataset="$DATASET" earliest=-1h\n| summarize LastSeen=max(timestamp), EventCount=count() by computer\n| order by LastSeen asc'
        },
        {
          name: 'Event type distribution per server',
          description: 'Verify all expected event types are being collected (not just some)',
          query: 'dataset="$DATASET" earliest=-1h\n| summarize count() by computer, event_id\n| order by computer asc, event_id asc'
        },
        {
          name: 'Ingestion gap detection',
          description: 'Find time windows where no events were received from any server',
          query: 'dataset="$DATASET" earliest=-12h\n| timestats span=1m count() by computer\n| where count_ == 0'
        }
      ]
    },
    {
      id: 'dns-obs-007',
      name: 'Query Type Distribution Shift',
      objective: 'Detect changes in the normal distribution of DNS query types that may indicate new application deployments, service discovery changes, or infrastructure shifts.',
      severity: 'Low',
      category: 'Change Detection',
      tags: ['observability', 'change-detection', 'baseline', 'dns'],
      requiredFields: ['query_type', 'source_ip', 'computer', 'timestamp'],
      detectionLogic: 'Alert when query type distribution shifts > 20% from 7-day baseline. For example: A queries dropping from 70% to 50% while AAAA rises from 10% to 30% (IPv6 migration). Or SRV queries spiking (new Kubernetes/AD service discovery).',
      operationalValue: 'Query type distribution is a stable baseline that reflects the environment\'s application and infrastructure mix. Shifts indicate real changes — either planned (IPv6 migration, new services) or unplanned (misconfigurations, attacks).',
      changeMgmtRelevance: 'Useful for validating infrastructure changes. IPv6 enablement should show AAAA increases. New Active Directory services should show SRV increases. Unexpected shifts warrant investigation.',
      troubleshootingWorkflow: '1. Identify which query type(s) changed\n2. Determine if the change is an increase in one type or decrease in another\n3. Correlate with known changes (IPv6 enablement, new services, AD changes)\n4. Identify source IPs driving the new query type volume\n5. Verify whether the shift is expected or indicates a problem\n6. Update baseline if the change is expected and permanent',
      dashboardDependency: 'Query Type Distribution dashboard, DNS Baseline dashboard',
      criblSearchQueries: [
        {
          name: 'Query type distribution (current)',
          description: 'See the current breakdown of query types across the environment',
          query: 'dataset="$DATASET" event_id=256 earliest=-4h\n| summarize count() by query_type\n| extend Pct=round(count_ * 100.0 / sum(count_), 1)\n| order by count_ desc'
        },
        {
          name: 'Query type trend over time',
          description: 'Visualize how query type mix changes over time to spot shifts',
          query: 'dataset="$DATASET" event_id=256 earliest=-7d\n| timestats span=1h count() by query_type'
        },
        {
          name: 'Sources driving query type changes',
          description: 'Find which hosts are responsible for shifts in query type distribution',
          query: 'dataset="$DATASET" event_id=256 query_type="$QUERY_TYPE" earliest=-4h\n| summarize Queries=count() by source_ip\n| order by Queries desc\n| limit 20'
        },
        {
          name: 'AAAA vs A ratio over time (IPv6 adoption tracking)',
          description: 'Track IPv6 readiness by monitoring the AAAA-to-A query ratio',
          query: 'dataset="$DATASET" event_id=256 query_type in ("A", "AAAA") earliest=-7d\n| timestats span=4h count() by query_type'
        }
      ]
    }
  ],
  'aws-vpc-flow': [
    {
      id: 'vpc-obs-001',
      name: 'Traffic Volume Anomaly',
      objective: 'Detect sudden increases or decreases in flow records or byte counts per VPC or subnet that deviate significantly from baseline, signaling capacity issues or potential outages.',
      severity: 'High',
      category: 'Capacity',
      tags: ['observability', 'capacity', 'anomaly', 'vpc'],
      requiredFields: ['bytes', 'packets', 'vpc_id', 'subnet_id', 'start', 'end', 'action', 'flow_direction'],
      detectionLogic: 'Alert when total bytes or flow record count per VPC/subnet deviates more than 3 standard deviations from a 7-day rolling baseline within a 5-minute evaluation window. Evaluate both spikes (DDoS, burst workloads) and drops (outage, routing black hole).',
      operationalValue: 'Early warning for capacity exhaustion, network-level outages, or misconfigured auto-scaling. Enables proactive response before application-level symptoms appear.',
      changeMgmtRelevance: 'Correlate volume shifts with deployment windows. A sudden traffic increase post-deploy may indicate a retry storm or misconfigured service mesh routing.',
      troubleshootingWorkflow: '1. Identify which VPC/subnet experienced the anomaly\n2. Determine if the change is inbound, outbound, or both (flow_direction)\n3. Check if traffic is ACCEPT or REJECT — rejects suggest security group issues\n4. Correlate with recent deployments or scaling events\n5. Check if specific instance_id or interface_id dominates the change\n6. Verify flow log pipeline health (check for NODATA/SKIPDATA)',
      dashboardDependency: 'VPC Traffic Overview, Subnet Capacity Planning',
      criblSearchQueries: [
        {
          name: 'Total bytes per VPC over time',
          description: 'Visualize traffic volume trends per VPC to identify anomalous spikes or drops',
          query: 'dataset="$DATASET" action="ACCEPT" earliest=-12h\n| timestats span=5m TotalBytes=sum(bytes) by vpc_id\n| order by _time desc'
        },
        {
          name: 'Flow record count per subnet (current vs baseline)',
          description: 'Compare current flow counts against recent baseline to detect deviations',
          query: 'dataset="$DATASET" earliest=-1h\n| summarize FlowCount=count(), TotalBytes=sum(bytes), TotalPackets=sum(packets) by vpc_id, subnet_id\n| order by FlowCount desc'
        },
        {
          name: 'Traffic direction breakdown during anomaly window',
          description: 'Determine if anomaly is driven by ingress, egress, or both directions',
          query: 'dataset="$DATASET" earliest=-2h\n| summarize Bytes=sum(bytes), Flows=count() by vpc_id, flow_direction\n| order by Bytes desc'
        },
        {
          name: 'Top talkers during volume spike',
          description: 'Identify specific instances driving the traffic anomaly',
          query: 'dataset="$DATASET" earliest=-30m\n| summarize Bytes=sum(bytes), Packets=sum(packets), Flows=count() by instance_id, subnet_id\n| order by Bytes desc\n| limit 20'
        }
      ]
    },
    {
      id: 'vpc-obs-002',
      name: 'Cross-AZ Traffic Imbalance',
      objective: 'Detect uneven traffic distribution between Availability Zones within a VPC, indicating load balancer misconfigurations, unhealthy targets, or unintended cross-AZ data transfer costs.',
      severity: 'Medium',
      category: 'Cost Optimization',
      tags: ['observability', 'cost', 'availability-zone', 'load-balancing'],
      requiredFields: ['bytes', 'az_id', 'vpc_id', 'srcaddr', 'dstaddr', 'flow_direction', 'traffic_path'],
      detectionLogic: 'Alert when traffic volume between AZs within the same VPC shows greater than 40% imbalance (one AZ handling significantly more than its fair share). Evaluate over 30-minute windows with 6-hour baseline comparison.',
      operationalValue: 'Cross-AZ traffic incurs data transfer charges and adds latency. Imbalance often indicates failing health checks causing load balancer drain, or sticky sessions concentrating on one AZ.',
      changeMgmtRelevance: 'AZ imbalances appearing after deployments suggest rolling updates that drained one AZ or autoscaling group misconfigurations. Correlate with ASG scaling events.',
      troubleshootingWorkflow: '1. Identify which AZs are imbalanced and the direction of skew\n2. Check if a load balancer is involved (traffic_path analysis)\n3. Verify target group health in the under-served AZ\n4. Check for recent autoscaling events or instance terminations\n5. Determine cost impact of cross-AZ transfer\n6. Validate DNS resolution is distributing across AZs',
      dashboardDependency: 'Cross-AZ Traffic Analysis, Cost Allocation Dashboard',
      criblSearchQueries: [
        {
          name: 'Bytes per AZ over time',
          description: 'Track traffic volume distribution across Availability Zones',
          query: 'dataset="$DATASET" action="ACCEPT" earliest=-6h\n| timestats span=15m TotalBytes=sum(bytes) by az_id\n| order by _time desc'
        },
        {
          name: 'Cross-AZ flow pairs',
          description: 'Identify traffic flowing between different AZs within the same VPC',
          query: 'dataset="$DATASET" action="ACCEPT" traffic_path=2 earliest=-4h\n| summarize CrossAZBytes=sum(bytes), Flows=count() by vpc_id, az_id\n| order by CrossAZBytes desc'
        },
        {
          name: 'AZ imbalance ratio calculation',
          description: 'Calculate the percentage split of traffic across AZs to quantify imbalance',
          query: 'dataset="$DATASET" action="ACCEPT" earliest=-1h\n| summarize AZBytes=sum(bytes) by az_id, vpc_id\n| extend Percentage=round(AZBytes * 100.0 / sum(AZBytes), 2)\n| order by vpc_id, Percentage desc'
        },
        {
          name: 'Top cross-AZ communication pairs',
          description: 'Find the source-destination pairs generating the most cross-AZ traffic',
          query: 'dataset="$DATASET" action="ACCEPT" traffic_path=2 earliest=-2h\n| summarize Bytes=sum(bytes), Flows=count() by srcaddr, dstaddr, az_id\n| order by Bytes desc\n| limit 25'
        }
      ]
    },
    {
      id: 'vpc-obs-003',
      name: 'Connection Failure Rate Spike',
      objective: 'Detect sudden increases in REJECT actions per destination address or port, indicating security group misconfigurations, stale DNS entries, or services that moved without proper routing updates.',
      severity: 'High',
      category: 'Availability',
      tags: ['observability', 'availability', 'security-group', 'connectivity'],
      requiredFields: ['action', 'dstaddr', 'dstport', 'srcaddr', 'protocol', 'vpc_id', 'subnet_id', 'interface_id'],
      detectionLogic: 'Alert when REJECT ratio (REJECT / total flows) per destination exceeds 50% within a 5-minute window, or when absolute REJECT count exceeds 1000 flows in 5 minutes for any single destination. Compare against 24-hour baseline.',
      operationalValue: 'High reject rates are the VPC-level signal that something is unreachable. Faster detection than waiting for application timeouts or user reports.',
      changeMgmtRelevance: 'Security group changes are the #1 cause of reject spikes. Correlate with recent SG modifications, NACL updates, or route table changes.',
      troubleshootingWorkflow: '1. Identify the destination address and port being rejected\n2. Determine if rejects are from many sources or one (broad vs targeted)\n3. Check security group rules for the target interface_id\n4. Verify the target instance/service is running\n5. Check if NACL rules are blocking at subnet level\n6. Look for recent security group or route table changes',
      dashboardDependency: 'Connection Failure Analysis, Security Group Impact Dashboard',
      criblSearchQueries: [
        {
          name: 'Reject rate by destination over time',
          description: 'Track REJECT flow rates per destination to identify connectivity failures',
          query: 'dataset="$DATASET" action="REJECT" earliest=-4h\n| timestats span=5m Rejects=count() by dstaddr, dstport\n| order by Rejects desc'
        },
        {
          name: 'Reject ratio per destination (current window)',
          description: 'Calculate the percentage of flows being rejected per destination',
          query: 'dataset="$DATASET" earliest=-30m\n| summarize Total=count(), Rejects=countif(action=="REJECT") by dstaddr, dstport\n| extend RejectPct=round(Rejects * 100.0 / Total, 1)\n| where RejectPct > 20\n| order by Rejects desc'
        },
        {
          name: 'Sources attempting rejected connections',
          description: 'Identify which sources are hitting reject rules to assess blast radius',
          query: 'dataset="$DATASET" action="REJECT" earliest=-1h\n| summarize AttemptCount=count() by srcaddr, dstaddr, dstport\n| order by AttemptCount desc\n| limit 30'
        },
        {
          name: 'Interface-level reject analysis',
          description: 'Map rejects to specific network interfaces for security group troubleshooting',
          query: 'dataset="$DATASET" action="REJECT" earliest=-1h\n| summarize Rejects=count() by interface_id, dstport, subnet_id\n| order by Rejects desc\n| limit 20'
        }
      ]
    },
    {
      id: 'vpc-obs-004',
      name: 'NAT Gateway Throughput Monitoring',
      objective: 'Track traffic volume flowing through NAT Gateways by identifying flows where the packet source address differs from the flow source address, alerting as throughput approaches service limits.',
      severity: 'Medium',
      category: 'Capacity',
      tags: ['observability', 'capacity', 'nat-gateway', 'throughput'],
      requiredFields: ['bytes', 'packets', 'srcaddr', 'dstaddr', 'pkt_src_aws_service', 'pkt_dst_aws_service', 'subnet_id', 'vpc_id', 'flow_direction'],
      detectionLogic: 'Alert when NAT Gateway throughput (identified by pkt_src_aws_service or traffic_path indicating NAT traversal) exceeds 80% of the 45 Gbps per-gateway limit within a 5-minute window. Also alert on sustained high connection counts approaching 55,000 simultaneous connections.',
      operationalValue: 'NAT Gateway saturation causes packet drops and connection timeouts for all private subnet resources. Early warning prevents cascading application failures.',
      changeMgmtRelevance: 'New service deployments in private subnets increase NAT load. Correlate throughput increases with deployment events to validate capacity planning.',
      troubleshootingWorkflow: '1. Identify which subnet/VPC NAT traffic is spiking\n2. Determine top consumers (source instances) of NAT bandwidth\n3. Check if traffic can be moved to VPC endpoints (S3, DynamoDB)\n4. Evaluate if additional NAT Gateways are needed across AZs\n5. Check for retry storms causing connection multiplication\n6. Review if any traffic is unnecessarily traversing NAT',
      dashboardDependency: 'NAT Gateway Capacity Dashboard, Private Subnet Egress Analysis',
      criblSearchQueries: [
        {
          name: 'NAT Gateway throughput over time',
          description: 'Track bytes flowing through NAT Gateways to monitor capacity utilization',
          query: 'dataset="$DATASET" action="ACCEPT" pkt_src_aws_service="*" earliest=-6h\n| timestats span=5m NATBytes=sum(bytes), NATFlows=count() by subnet_id\n| order by _time desc'
        },
        {
          name: 'Top NAT consumers by source',
          description: 'Identify which private instances are driving the most NAT traffic',
          query: 'dataset="$DATASET" action="ACCEPT" pkt_src_aws_service="*" earliest=-1h\n| summarize Bytes=sum(bytes), Flows=count() by srcaddr, dstaddr, dstport\n| order by Bytes desc\n| limit 20'
        },
        {
          name: 'NAT traffic by destination service',
          description: 'Determine which external services drive NAT consumption for VPC endpoint candidates',
          query: 'dataset="$DATASET" action="ACCEPT" pkt_dst_aws_service="*" earliest=-4h\n| summarize Bytes=sum(bytes), Flows=count() by pkt_dst_aws_service\n| order by Bytes desc'
        },
        {
          name: 'NAT connection rate trend',
          description: 'Monitor connection establishment rate through NAT to detect approaching connection limits',
          query: 'dataset="$DATASET" action="ACCEPT" pkt_src_aws_service="*" tcp_flags=2 earliest=-6h\n| timestats span=5m NewConnections=count() by subnet_id\n| order by _time desc'
        }
      ]
    },
    {
      id: 'vpc-obs-005',
      name: 'Flow Log Pipeline Health',
      objective: 'Detect NODATA and SKIPDATA log_status records and gaps in flow log delivery per network interface, ensuring observability data integrity.',
      severity: 'Critical',
      category: 'Data Quality',
      tags: ['observability', 'data-quality', 'pipeline', 'flow-logs'],
      requiredFields: ['log_status', 'interface_id', 'vpc_id', 'account_id', 'start', 'end'],
      detectionLogic: 'Alert when NODATA or SKIPDATA records exceed 5% of total records per interface over a 15-minute window. Also alert when any interface that previously reported data has a gap exceeding 10 minutes.',
      operationalValue: 'SKIPDATA indicates flow log capture is overwhelmed — you are losing visibility. NODATA gaps mean either no traffic or a collection failure. Both undermine every other detection built on this data.',
      changeMgmtRelevance: 'Pipeline health degradation after changes to VPC Flow Log subscriptions, CloudWatch log groups, or Cribl pipeline configurations indicates misconfiguration requiring rollback.',
      troubleshootingWorkflow: '1. Identify which interfaces are reporting NODATA/SKIPDATA\n2. Differentiate between no-traffic interfaces (expected NODATA) and failed collection\n3. Check CloudWatch Logs delivery metrics for the flow log subscription\n4. Verify Cribl source configuration and collection health\n5. Check if interface was recently created/deleted\n6. Review AWS service limits for flow log publish rate',
      dashboardDependency: 'Flow Log Health Dashboard, Data Quality Monitoring',
      criblSearchQueries: [
        {
          name: 'Log status distribution over time',
          description: 'Track the ratio of OK, NODATA, and SKIPDATA records to detect collection issues',
          query: 'dataset="$DATASET" earliest=-12h\n| timestats span=15m count() by log_status\n| order by _time desc'
        },
        {
          name: 'Interfaces with SKIPDATA (data loss)',
          description: 'Find interfaces experiencing data loss due to capture overwhelm',
          query: 'dataset="$DATASET" log_status="SKIPDATA" earliest=-4h\n| summarize SkipCount=count() by interface_id, vpc_id, account_id\n| order by SkipCount desc'
        },
        {
          name: 'Interface delivery gap detection',
          description: 'Identify interfaces that stopped reporting data unexpectedly',
          query: 'dataset="$DATASET" log_status="OK" earliest=-2h\n| summarize LastSeen=max(end), FlowCount=count() by interface_id\n| where LastSeen < ago(10m)\n| order by LastSeen asc'
        },
        {
          name: 'SKIPDATA rate by account and VPC',
          description: 'Aggregate pipeline health at account/VPC level for capacity planning',
          query: 'dataset="$DATASET" earliest=-6h\n| summarize Total=count(), SkipData=countif(log_status=="SKIPDATA"), NoData=countif(log_status=="NODATA") by account_id, vpc_id\n| extend SkipPct=round(SkipData * 100.0 / Total, 2)\n| where SkipPct > 1\n| order by SkipPct desc'
        }
      ]
    },
    {
      id: 'vpc-obs-006',
      name: 'Service Dependency Mapping',
      objective: 'Track unique source-to-destination communication pairs across VPCs and subnets to build a dynamic service dependency map and detect unexpected new connections or missing expected ones.',
      severity: 'Medium',
      category: 'Change Impact',
      tags: ['observability', 'dependency-mapping', 'change-impact', 'topology'],
      requiredFields: ['srcaddr', 'dstaddr', 'dstport', 'protocol', 'vpc_id', 'subnet_id', 'action', 'flow_direction'],
      detectionLogic: 'Alert when new communication pairs appear that were not observed in the prior 7-day baseline, or when previously consistent communication pairs disappear. Evaluate hourly with daily baseline comparison.',
      operationalValue: 'Dynamic dependency maps reveal blast radius of changes before they happen. New pairs after a deployment validate or invalidate the change. Missing pairs indicate broken integrations.',
      changeMgmtRelevance: 'Directly supports change impact analysis. Compare pre-change and post-change communication patterns to validate that only expected connections changed.',
      troubleshootingWorkflow: '1. Identify new or missing communication pairs\n2. Map pairs to known services using subnet/VPC ownership\n3. Determine if new pairs are expected (deployment) or unexpected (lateral movement)\n4. For missing pairs, verify the source service is healthy\n5. Check if routing or security group changes affected the path\n6. Update service dependency documentation',
      dashboardDependency: 'Service Topology Map, Change Impact Analysis Dashboard',
      criblSearchQueries: [
        {
          name: 'Unique communication pairs (current)',
          description: 'Map all active source-destination-port combinations for dependency analysis',
          query: 'dataset="$DATASET" action="ACCEPT" earliest=-1h\n| summarize Flows=count(), Bytes=sum(bytes) by srcaddr, dstaddr, dstport, protocol\n| order by Flows desc\n| limit 100'
        },
        {
          name: 'New communication pairs (not seen in baseline)',
          description: 'Detect newly observed connections that did not exist in the prior 7-day window',
          query: 'dataset="$DATASET" action="ACCEPT" earliest=-1h\n| summarize Flows=count() by srcaddr, dstaddr, dstport\n| where Flows < 10\n| order by Flows asc\n| limit 50'
        },
        {
          name: 'Cross-VPC dependencies',
          description: 'Identify communication patterns that span VPC boundaries via peering or transit gateway',
          query: 'dataset="$DATASET" action="ACCEPT" flow_direction="egress" earliest=-4h\n| summarize Bytes=sum(bytes), Flows=count() by vpc_id, dstaddr, dstport\n| order by Bytes desc\n| limit 30'
        },
        {
          name: 'Subnet-level communication matrix',
          description: 'Build a subnet-to-subnet traffic matrix for topology visualization',
          query: 'dataset="$DATASET" action="ACCEPT" earliest=-6h\n| summarize Bytes=sum(bytes), UniqueFlows=dcount(srcaddr) by subnet_id, dstaddr, dstport\n| order by Bytes desc\n| limit 50'
        }
      ]
    },
    {
      id: 'vpc-obs-007',
      name: 'TCP Connection State Analysis',
      objective: 'Analyze TCP flags to detect SYN-only flows (no SYN-ACK response) indicating unreachable services, and RST spikes indicating application-level rejections or connection resets.',
      severity: 'High',
      category: 'Availability',
      tags: ['observability', 'availability', 'tcp', 'connectivity'],
      requiredFields: ['tcp_flags', 'srcaddr', 'dstaddr', 'dstport', 'action', 'packets', 'bytes', 'vpc_id', 'interface_id'],
      detectionLogic: 'Alert when SYN-only flows (tcp_flags=2, packets=1) exceed 30% of total TCP flows to a destination within a 5-minute window. Also alert when RST flags (tcp_flags containing bit 4) spike above 200% of 1-hour baseline.',
      operationalValue: 'SYN-only flows are the network-level proof that a service is unreachable — faster and more definitive than application health checks. RST spikes indicate services actively refusing connections.',
      changeMgmtRelevance: 'Post-deployment SYN failures confirm a service did not start correctly or is not listening on the expected port. RST spikes after config changes suggest TLS or authentication mismatches.',
      troubleshootingWorkflow: '1. Identify destination addresses and ports with high SYN-only ratios\n2. Verify the target service is running and listening on the expected port\n3. Check security groups allow the traffic (SYN might be ACCEPTed but service is down)\n4. For RST spikes, check application logs on the destination\n5. Verify no TLS/certificate issues causing immediate connection termination\n6. Check if a load balancer health check is marking targets unhealthy',
      dashboardDependency: 'TCP Connection Health Dashboard, Service Availability Monitor',
      criblSearchQueries: [
        {
          name: 'SYN-only flows by destination (unreachable services)',
          description: 'Find destinations receiving SYN packets without completing the handshake',
          query: 'dataset="$DATASET" action="ACCEPT" tcp_flags=2 packets=1 earliest=-2h\n| summarize SYNOnly=count() by dstaddr, dstport\n| order by SYNOnly desc\n| limit 20'
        },
        {
          name: 'TCP flag distribution over time',
          description: 'Track SYN, SYN-ACK, RST, and FIN patterns to detect connection health changes',
          query: 'dataset="$DATASET" action="ACCEPT" protocol=6 earliest=-6h\n| timestats span=5m count() by tcp_flags\n| order by _time desc'
        },
        {
          name: 'RST spike detection',
          description: 'Identify sudden increases in connection resets indicating application issues',
          query: 'dataset="$DATASET" action="ACCEPT" tcp_flags=4 earliest=-4h\n| timestats span=5m RSTCount=count() by dstaddr, dstport\n| order by RSTCount desc'
        },
        {
          name: 'Connection completion ratio per destination',
          description: 'Calculate the ratio of completed handshakes vs SYN-only to measure service reachability',
          query: 'dataset="$DATASET" action="ACCEPT" protocol=6 earliest=-1h\n| summarize TotalTCP=count(), SYNOnly=countif(tcp_flags==2 and packets==1) by dstaddr, dstport\n| extend FailPct=round(SYNOnly * 100.0 / TotalTCP, 1)\n| where TotalTCP > 50\n| order by FailPct desc'
        }
      ]
    }
  ],
  'crowdstrike-edr': [
    {
      id: 'cs-obs-001',
      name: 'Agent Health / Check-In Monitoring',
      objective: 'Detect endpoints that stop reporting events within an expected check-in window, indicating agent crashes, network isolation, or host failures.',
      severity: 'Critical',
      category: 'Availability',
      tags: ['observability', 'availability', 'agent-health', 'endpoint'],
      requiredFields: ['timestamp', 'aid', 'ComputerName', 'event_simpleName', 'event_platform'],
      detectionLogic: 'Alert when any aid (agent ID) that reported at least 10 events per hour over the prior 24 hours has not been seen in the last 30 minutes. Evaluate every 15 minutes with 24-hour activity baseline.',
      operationalValue: 'Silent endpoints represent blind spots in security and operational visibility. Early detection of agent health issues prevents extended gaps in telemetry coverage.',
      changeMgmtRelevance: 'Mass agent silence after a patch deployment or GPO change indicates a broken update. Correlate with SCCM/Intune deployment windows.',
      troubleshootingWorkflow: '1. Identify which endpoints (aid/ComputerName) stopped reporting\n2. Determine if this is isolated (one host) or widespread (many hosts)\n3. Check if affected hosts share commonalities (OS, subnet, ConfigBuild)\n4. Verify network connectivity to CrowdStrike cloud (aip field)\n5. Check for recent sensor updates or OS patches\n6. Attempt remote connectivity check or wake-on-LAN',
      dashboardDependency: 'Endpoint Health Dashboard, Agent Coverage Map',
      criblSearchQueries: [
        {
          name: 'Last seen time per endpoint',
          description: 'Find the most recent event timestamp for each agent to identify stale endpoints',
          query: 'dataset="$DATASET" earliest=-24h\n| summarize LastSeen=max(timestamp), EventCount=count() by aid, ComputerName, event_platform\n| where LastSeen < ago(30m)\n| order by LastSeen asc'
        },
        {
          name: 'Endpoint check-in rate over time',
          description: 'Track the number of reporting endpoints per time window to detect mass dropouts',
          query: 'dataset="$DATASET" earliest=-12h\n| timestats span=15m ActiveAgents=dcount(aid)\n| order by _time desc'
        },
        {
          name: 'Silent endpoints by platform and sensor version',
          description: 'Correlate silent agents with platform and ConfigBuild to identify pattern',
          query: 'dataset="$DATASET" earliest=-2h\n| summarize LastSeen=max(timestamp), Events=count() by aid, ComputerName, event_platform, ConfigBuild\n| where LastSeen < ago(30m)\n| order by event_platform, ConfigBuild'
        },
        {
          name: 'Historical event volume for suspect endpoint',
          description: 'Review event production history for a specific endpoint to determine normal baseline',
          query: 'dataset="$DATASET" aid="$AID" earliest=-7d\n| timestats span=1h EventCount=count()\n| order by _time desc'
        }
      ]
    },
    {
      id: 'cs-obs-002',
      name: 'Sensor Version Distribution',
      objective: 'Track CrowdStrike sensor versions (ConfigBuild) across the fleet to identify endpoints running outdated or non-standard sensor versions that may miss detections.',
      severity: 'Medium',
      category: 'Compliance',
      tags: ['observability', 'compliance', 'sensor-version', 'fleet-management'],
      requiredFields: ['aid', 'ComputerName', 'ConfigBuild', 'event_platform', 'timestamp'],
      detectionLogic: 'Alert when more than 10% of the fleet is running a ConfigBuild older than the current N-1 release, or when any endpoint remains on the same version for more than 14 days after a new release is available.',
      operationalValue: 'Outdated sensors may lack detection capabilities, have known bugs, or miss kernel-level visibility. Fleet uniformity reduces support burden and ensures consistent protection.',
      changeMgmtRelevance: 'Track sensor update rollouts — identify endpoints that failed to update during maintenance windows. Validate that sensor update policies are applying correctly.',
      troubleshootingWorkflow: '1. Identify the current target ConfigBuild version\n2. List endpoints running older versions\n3. Group outdated endpoints by platform, OU, or subnet\n4. Check sensor update policy assignments\n5. Verify update infrastructure (proxy, bandwidth) is accessible\n6. Manually trigger update for persistently outdated hosts',
      dashboardDependency: 'Fleet Sensor Version Dashboard, Compliance Posture',
      criblSearchQueries: [
        {
          name: 'Sensor version distribution (current fleet)',
          description: 'Count endpoints per ConfigBuild to identify version fragmentation',
          query: 'dataset="$DATASET" earliest=-24h\n| summarize Endpoints=dcount(aid) by ConfigBuild, event_platform\n| order by Endpoints desc'
        },
        {
          name: 'Endpoints on oldest sensor versions',
          description: 'Find endpoints running the most outdated sensor builds',
          query: 'dataset="$DATASET" earliest=-24h\n| summarize LastSeen=max(timestamp) by aid, ComputerName, ConfigBuild, event_platform\n| order by ConfigBuild asc\n| limit 50'
        },
        {
          name: 'Version adoption over time',
          description: 'Track how quickly new sensor versions propagate across the fleet',
          query: 'dataset="$DATASET" earliest=-14d\n| timestats span=1d dcount(aid) by ConfigBuild\n| order by _time desc'
        },
        {
          name: 'Endpoints that changed version recently',
          description: 'Identify endpoints that recently updated their sensor to verify rollout progress',
          query: 'dataset="$DATASET" event_simpleName="ConfigStateUpdate" earliest=-48h\n| summarize Updates=count(), LatestBuild=max(ConfigBuild) by aid, ComputerName\n| order by Updates desc\n| limit 30'
        }
      ]
    },
    {
      id: 'cs-obs-003',
      name: 'Process Execution Volume Anomaly',
      objective: 'Detect sudden spikes or drops in ProcessRollup2 events per endpoint, indicating crash loops, runaway services, or host-level failures.',
      severity: 'High',
      category: 'Availability',
      tags: ['observability', 'availability', 'process', 'anomaly'],
      requiredFields: ['event_simpleName', 'aid', 'ComputerName', 'ImageFileName', 'timestamp', 'RawProcessId'],
      detectionLogic: 'Alert when ProcessRollup2 event count per endpoint deviates more than 3x from its 24-hour rolling average within a 15-minute window. Spikes indicate crash loops or fork bombs; drops indicate host hangs or agent issues.',
      operationalValue: 'Process execution anomalies are early indicators of service instability before application monitoring detects the issue. Crash loops create log noise and waste resources.',
      changeMgmtRelevance: 'Post-deployment process spikes indicate services failing to start cleanly (crash-restart cycles). Drops indicate services that failed to start at all.',
      troubleshootingWorkflow: '1. Identify which endpoint(s) show anomalous process execution rates\n2. Determine the specific executable(s) driving the anomaly (ImageFileName)\n3. For spikes: check if one process is restarting repeatedly (crash loop)\n4. For drops: verify the host is responsive and the agent is healthy\n5. Correlate with recent software deployments or updates\n6. Check system resource utilization (CPU/memory exhaustion)',
      dashboardDependency: 'Process Activity Dashboard, Endpoint Health Overview',
      criblSearchQueries: [
        {
          name: 'Process execution rate per endpoint over time',
          description: 'Track ProcessRollup2 event rates to identify endpoints with abnormal execution patterns',
          query: 'dataset="$DATASET" event_simpleName="ProcessRollup2" earliest=-12h\n| timestats span=15m ProcessCount=count() by aid, ComputerName\n| order by ProcessCount desc'
        },
        {
          name: 'Top process spawners (current window)',
          description: 'Identify endpoints with the highest process creation rates for anomaly triage',
          query: 'dataset="$DATASET" event_simpleName="ProcessRollup2" earliest=-1h\n| summarize ExecCount=count(), UniqueProcs=dcount(ImageFileName) by aid, ComputerName\n| order by ExecCount desc\n| limit 20'
        },
        {
          name: 'Crash loop detection (repeated process starts)',
          description: 'Find processes restarting rapidly which indicates crash-restart behavior',
          query: 'dataset="$DATASET" event_simpleName="ProcessRollup2" earliest=-1h\n| summarize Starts=count() by aid, ComputerName, ImageFileName\n| where Starts > 50\n| order by Starts desc'
        },
        {
          name: 'Process execution drop detection',
          description: 'Identify endpoints that show significantly reduced process activity versus baseline',
          query: 'dataset="$DATASET" event_simpleName="ProcessRollup2" earliest=-2h\n| timestats span=15m ProcCount=count() by ComputerName\n| where ProcCount < 10\n| order by ProcCount asc'
        }
      ]
    },
    {
      id: 'cs-obs-004',
      name: 'Network Connection Failure Patterns',
      objective: 'Detect patterns of failed outbound network connections from endpoints, indicating application connectivity issues, DNS failures, or firewall blocks.',
      severity: 'Medium',
      category: 'Availability',
      tags: ['observability', 'availability', 'network', 'connectivity'],
      requiredFields: ['event_simpleName', 'aid', 'ComputerName', 'RemoteAddressIP4', 'RemotePort', 'ConnectionDirection', 'timestamp'],
      detectionLogic: 'Alert when NetworkConnectionIP4 events with failed connection indicators (repeated attempts to same RemoteAddressIP4:RemotePort without established connection events) exceed 20 per endpoint in a 10-minute window.',
      operationalValue: 'Endpoint-level connection failures complement network monitoring by showing the client perspective. Identifies issues invisible to server-side monitoring like DNS resolution failures or client firewall blocks.',
      changeMgmtRelevance: 'New connection failures after firewall rule changes or DNS record updates confirm misconfiguration. Mass failures across endpoints indicate infrastructure-level issues.',
      troubleshootingWorkflow: '1. Identify which endpoints and destinations are experiencing failures\n2. Check if the destination is reachable from other endpoints (isolated vs widespread)\n3. Verify DNS resolution for domain-based connections\n4. Check local firewall or security software blocking\n5. Verify the remote service is healthy and accepting connections\n6. Review recent network infrastructure changes',
      dashboardDependency: 'Endpoint Network Health, Application Connectivity Dashboard',
      criblSearchQueries: [
        {
          name: 'Outbound connection attempts by destination',
          description: 'Track connection attempts to identify destinations with high failure rates',
          query: 'dataset="$DATASET" event_simpleName="NetworkConnectionIP4" ConnectionDirection="1" earliest=-4h\n| summarize Attempts=count() by RemoteAddressIP4, RemotePort, ComputerName\n| order by Attempts desc\n| limit 30'
        },
        {
          name: 'Repeated failed connection patterns',
          description: 'Detect endpoints making many attempts to the same destination (connection retry behavior)',
          query: 'dataset="$DATASET" event_simpleName="NetworkConnectionIP4" ConnectionDirection="1" earliest=-1h\n| summarize Attempts=count() by aid, ComputerName, RemoteAddressIP4, RemotePort\n| where Attempts > 20\n| order by Attempts desc'
        },
        {
          name: 'Connection failure trend over time',
          description: 'Track connection attempt volume trends to detect emerging connectivity issues',
          query: 'dataset="$DATASET" event_simpleName="NetworkConnectionIP4" earliest=-12h\n| timestats span=15m count() by ConnectionDirection, RemotePort\n| order by _time desc'
        },
        {
          name: 'Endpoints with diverse failed destinations',
          description: 'Find endpoints trying many different destinations — indicates DNS or general network issues',
          query: 'dataset="$DATASET" event_simpleName="NetworkConnectionIP4" ConnectionDirection="1" earliest=-2h\n| summarize UniqueDestinations=dcount(RemoteAddressIP4), TotalAttempts=count() by aid, ComputerName\n| where UniqueDestinations > 50\n| order by TotalAttempts desc'
        }
      ]
    },
    {
      id: 'cs-obs-005',
      name: 'Telemetry Pipeline Health',
      objective: 'Monitor event volume per event_simpleName type to detect collection gaps, data loss, or pipeline blockages in the CrowdStrike telemetry flow.',
      severity: 'Critical',
      category: 'Data Quality',
      tags: ['observability', 'data-quality', 'pipeline', 'telemetry'],
      requiredFields: ['event_simpleName', 'timestamp', 'aid', 'event_platform'],
      detectionLogic: 'Alert when any event_simpleName that normally produces more than 100 events per 15-minute window drops below 10% of its 7-day average. Also alert when total event ingest rate drops more than 50% from the 1-hour baseline.',
      operationalValue: 'Telemetry gaps mean every other detection is unreliable. Pipeline health is the meta-detection that validates all other detections. Silent failures in collection are the most dangerous.',
      changeMgmtRelevance: 'Pipeline health degradation after Cribl pipeline changes, CrowdStrike SIEM connector updates, or API credential rotations indicates configuration issues requiring immediate attention.',
      troubleshootingWorkflow: '1. Identify which event types are affected (all types = pipeline issue, specific types = source issue)\n2. Check Cribl pipeline metrics for backpressure or errors\n3. Verify CrowdStrike Streaming API / SIEM connector is connected\n4. Check API credentials have not expired\n5. Verify no rate limiting is being applied\n6. Check disk space and memory on collection infrastructure',
      dashboardDependency: 'Telemetry Pipeline Health, Data Quality Scorecard',
      criblSearchQueries: [
        {
          name: 'Event volume by type over time',
          description: 'Track event counts per event_simpleName to detect collection gaps',
          query: 'dataset="$DATASET" earliest=-12h\n| timestats span=15m count() by event_simpleName\n| order by _time desc'
        },
        {
          name: 'Total ingest rate trend',
          description: 'Monitor overall event ingestion rate for macro-level pipeline health',
          query: 'dataset="$DATASET" earliest=-24h\n| timestats span=5m TotalEvents=count()\n| order by _time desc'
        },
        {
          name: 'Event type volume comparison (current vs baseline)',
          description: 'Compare current event volumes against recent averages to quantify gaps',
          query: 'dataset="$DATASET" earliest=-1h\n| summarize CurrentCount=count() by event_simpleName\n| order by CurrentCount asc\n| limit 30'
        },
        {
          name: 'Platform-level ingest health',
          description: 'Check if gaps are platform-specific (Windows vs Mac vs Linux)',
          query: 'dataset="$DATASET" earliest=-6h\n| timestats span=30m Events=count(), ActiveAgents=dcount(aid) by event_platform\n| order by _time desc'
        }
      ]
    },
    {
      id: 'cs-obs-006',
      name: 'Endpoint Software Changes',
      objective: 'Detect new executables appearing across the fleet to track software deployments, validate change windows, and identify unexpected software installations.',
      severity: 'Low',
      category: 'Change Impact',
      tags: ['observability', 'change-management', 'software', 'deployment'],
      requiredFields: ['event_simpleName', 'ImageFileName', 'ComputerName', 'aid', 'timestamp', 'UserName'],
      detectionLogic: 'Alert when a new ImageFileName (not seen in prior 7-day baseline) appears on more than 5 endpoints within a 1-hour window. Also alert on new executables running from non-standard paths (outside Program Files, Windows, etc.).',
      operationalValue: 'Tracks software deployment progress and validates that only expected changes are rolling out. Early detection of unauthorized software or failed deployment artifacts.',
      changeMgmtRelevance: 'Directly validates deployment execution. New binaries appearing outside change windows indicate unauthorized changes. Missing binaries post-deployment indicate failed installations.',
      troubleshootingWorkflow: '1. Identify the new executable name and path\n2. Determine deployment breadth (how many endpoints, how fast)\n3. Correlate with approved change requests\n4. Check if the binary is signed and from a known publisher\n5. Verify the software was expected to deploy at this time\n6. If unexpected, check the user context (UserName) running it',
      dashboardDependency: 'Software Deployment Tracker, Change Validation Dashboard',
      criblSearchQueries: [
        {
          name: 'New executables across fleet (last 24 hours)',
          description: 'Identify recently appeared executables by endpoint count to track deployments',
          query: 'dataset="$DATASET" event_simpleName="ProcessRollup2" earliest=-24h\n| summarize Endpoints=dcount(aid), FirstSeen=min(timestamp) by ImageFileName\n| where Endpoints > 3\n| order by FirstSeen desc\n| limit 30'
        },
        {
          name: 'Deployment rollout progress',
          description: 'Track how a specific executable is spreading across endpoints over time',
          query: 'dataset="$DATASET" event_simpleName="ProcessRollup2" ImageFileName="*$FILENAME*" earliest=-48h\n| timestats span=1h EndpointsRunning=dcount(aid)\n| order by _time desc'
        },
        {
          name: 'Executables from non-standard paths',
          description: 'Find processes running from unusual locations that may indicate shadow IT or malware',
          query: 'dataset="$DATASET" event_simpleName="ProcessRollup2" earliest=-12h\n| where not(ImageFileName contains "Program Files") and not(ImageFileName contains "Windows")\n| summarize Runs=count(), Hosts=dcount(aid) by ImageFileName\n| where Hosts > 3\n| order by Hosts desc\n| limit 20'
        },
        {
          name: 'Software change timeline by endpoint',
          description: 'Review what new software appeared on a specific endpoint recently',
          query: 'dataset="$DATASET" event_simpleName="ProcessRollup2" ComputerName="$HOSTNAME" earliest=-24h\n| summarize FirstRun=min(timestamp), Runs=count() by ImageFileName\n| order by FirstRun desc\n| limit 30'
        }
      ]
    },
    {
      id: 'cs-obs-007',
      name: 'Event Type Distribution Shift',
      objective: 'Detect significant changes in the distribution of event_simpleName types that indicate infrastructure-level changes, sensor behavior shifts, or environmental modifications.',
      severity: 'Medium',
      category: 'Change Impact',
      tags: ['observability', 'change-impact', 'telemetry', 'baseline'],
      requiredFields: ['event_simpleName', 'timestamp', 'aid', 'event_platform'],
      detectionLogic: 'Alert when the percentage composition of any event_simpleName changes by more than 20 percentage points from its 7-day rolling average. Evaluate hourly against daily baseline.',
      operationalValue: 'Event distribution shifts reveal infrastructure changes that individual detections miss. A sudden increase in FileWrite events fleet-wide could indicate a backup job, while a DnsRequest spike could indicate a worm.',
      changeMgmtRelevance: 'Post-change event distribution shifts validate that infrastructure behaves as expected. Unexpected shifts indicate unintended consequences of changes.',
      troubleshootingWorkflow: '1. Identify which event types shifted and in which direction\n2. Determine if the shift is fleet-wide or isolated to specific endpoints\n3. Correlate timing with known changes or maintenance windows\n4. Check if the shift is a one-time spike or sustained change\n5. Investigate top contributing endpoints for the shifted event type\n6. Verify pipeline configuration has not changed routing/filtering',
      dashboardDependency: 'Telemetry Distribution Dashboard, Infrastructure Change Impact',
      criblSearchQueries: [
        {
          name: 'Event type distribution (current vs 7-day average)',
          description: 'Compare current event type percentages against baseline to detect shifts',
          query: 'dataset="$DATASET" earliest=-1h\n| summarize EventCount=count() by event_simpleName\n| extend Percentage=round(EventCount * 100.0 / sum(EventCount), 2)\n| order by Percentage desc\n| limit 20'
        },
        {
          name: 'Event type trends over 7 days',
          description: 'Visualize how event type volumes have changed over the past week',
          query: 'dataset="$DATASET" earliest=-7d\n| timestats span=4h count() by event_simpleName\n| order by _time desc'
        },
        {
          name: 'Top event types driving the shift',
          description: 'Identify which event types changed most significantly in recent hours',
          query: 'dataset="$DATASET" earliest=-4h\n| summarize HourlyCount=count() by event_simpleName, bin(timestamp, 1h)\n| order by event_simpleName, timestamp'
        },
        {
          name: 'Endpoints contributing to event type anomaly',
          description: 'Find which endpoints are driving an unusual increase in a specific event type',
          query: 'dataset="$DATASET" event_simpleName="$EVENT_TYPE" earliest=-2h\n| summarize Events=count() by aid, ComputerName\n| order by Events desc\n| limit 20'
        }
      ]
    }
  ],
  'nginx-access': [
    {
      id: 'ngx-obs-001',
      name: 'Upstream Latency Degradation',
      objective: 'Detect when upstream_response_time increases above baseline, with P95 analysis per upstream server to identify backend performance degradation before it impacts user experience.',
      severity: 'High',
      category: 'Performance',
      tags: ['observability', 'performance', 'latency', 'upstream'],
      requiredFields: ['upstream_response_time', 'upstream_addr', 'upstream_connect_time', 'upstream_header_time', 'request_uri', 'http_host', 'status', 'timestamp'],
      detectionLogic: 'Alert when P95 upstream_response_time exceeds 2x the 1-hour rolling baseline for any upstream_addr, or when median response time exceeds 500ms sustained for more than 5 minutes. Evaluate per server_name and upstream_addr combination.',
      operationalValue: 'Upstream latency is the single best predictor of user-facing performance degradation. Catching it at the NGINX layer provides earlier signal than application APM due to the request queuing effect.',
      changeMgmtRelevance: 'Backend deployments, database migrations, and infrastructure changes manifest as upstream latency increases. Correlate timing with deployment pipelines for rapid root cause identification.',
      troubleshootingWorkflow: '1. Identify which upstream_addr(s) are slow\n2. Decompose latency: upstream_connect_time vs upstream_header_time vs total upstream_response_time\n3. Check if specific URIs are affected or all traffic\n4. Verify upstream server health and resource utilization\n5. Check for connection pool exhaustion (high connect times)\n6. Correlate with recent deployments or config changes',
      dashboardDependency: 'Upstream Performance Dashboard, Backend Latency Heatmap',
      criblSearchQueries: [
        {
          name: 'P95 upstream response time by backend',
          description: 'Calculate percentile latency per upstream server to identify degraded backends',
          query: 'dataset="$DATASET" upstream_response_time > 0 earliest=-4h\n| timestats span=5m P95_Latency=max(upstream_response_time), AvgLatency=avg(upstream_response_time) by upstream_addr\n| order by _time desc'
        },
        {
          name: 'Latency decomposition (connect vs header vs response)',
          description: 'Break down total latency into connection establishment, header wait, and full response',
          query: 'dataset="$DATASET" upstream_response_time > 0 earliest=-1h\n| summarize AvgConnect=avg(upstream_connect_time), AvgHeader=avg(upstream_header_time), AvgTotal=avg(upstream_response_time), P95Total=max(upstream_response_time) by upstream_addr\n| order by P95Total desc'
        },
        {
          name: 'Slow URIs driving latency',
          description: 'Identify which request paths have the highest upstream latency',
          query: 'dataset="$DATASET" upstream_response_time > 1 earliest=-2h\n| summarize AvgLatency=avg(upstream_response_time), P95=max(upstream_response_time), Requests=count() by request_uri\n| where Requests > 10\n| order by P95 desc\n| limit 20'
        },
        {
          name: 'Latency trend comparison (current vs 24h ago)',
          description: 'Compare current latency patterns against yesterday to identify degradation',
          query: 'dataset="$DATASET" upstream_response_time > 0 earliest=-2h\n| timestats span=5m P50=avg(upstream_response_time), P95=max(upstream_response_time)\n| order by _time desc'
        }
      ]
    },
    {
      id: 'ngx-obs-002',
      name: 'Error Rate Spike (5xx)',
      objective: 'Detect sudden increases in 502, 503, and 504 responses indicating backend server failures, upstream timeouts, or service unavailability.',
      severity: 'Critical',
      category: 'Availability',
      tags: ['observability', 'availability', 'errors', 'upstream'],
      requiredFields: ['status', 'upstream_status', 'upstream_addr', 'http_host', 'server_name', 'request_uri', 'timestamp'],
      detectionLogic: 'Alert when 5xx error rate exceeds 5% of total requests within a 2-minute window per server_name, or when absolute 5xx count exceeds 50 in any 1-minute window. Differentiate between 502 (upstream unreachable), 503 (overloaded), and 504 (timeout).',
      operationalValue: '5xx errors directly impact users and SLA metrics. NGINX-level detection is faster than synthetic monitoring and provides upstream_addr context for pinpointing which backend is failing.',
      changeMgmtRelevance: '5xx spikes within minutes of a deployment are the clearest signal of a bad release. Rapid detection enables sub-5-minute rollback decisions.',
      troubleshootingWorkflow: '1. Classify the error: 502 (connection refused/reset), 503 (capacity), 504 (timeout)\n2. Identify affected upstream_addr servers\n3. Check if all backends or specific instances are failing\n4. For 502: verify backend process is running and listening\n5. For 503: check connection limits and queue depth\n6. For 504: check upstream_response_time and backend processing time',
      dashboardDependency: 'Error Rate Dashboard, SLA Compliance Monitor',
      criblSearchQueries: [
        {
          name: '5xx error rate over time',
          description: 'Track 5xx error volume and rate to detect spikes',
          query: 'dataset="$DATASET" status >= 500 earliest=-6h\n| timestats span=1m Errors=count() by status\n| order by _time desc'
        },
        {
          name: 'Error rate percentage by virtual host',
          description: 'Calculate the error ratio per server_name to identify affected services',
          query: 'dataset="$DATASET" earliest=-1h\n| summarize Total=count(), Errors5xx=countif(status >= 500) by server_name\n| extend ErrorPct=round(Errors5xx * 100.0 / Total, 2)\n| where Errors5xx > 0\n| order by ErrorPct desc'
        },
        {
          name: 'Errors by upstream backend server',
          description: 'Map errors to specific backend instances for targeted troubleshooting',
          query: 'dataset="$DATASET" status >= 500 earliest=-30m\n| summarize Errors=count() by upstream_addr, upstream_status, status\n| order by Errors desc'
        },
        {
          name: 'Error correlation with request patterns',
          description: 'Identify if specific URIs or methods trigger more errors',
          query: 'dataset="$DATASET" status >= 500 earliest=-1h\n| summarize Errors=count() by request_uri, request_method, status\n| order by Errors desc\n| limit 20'
        }
      ]
    },
    {
      id: 'ngx-obs-003',
      name: 'Request Volume Anomaly',
      objective: 'Detect unexpected drops or spikes in request volume per server_name/virtual host indicating traffic shifts, DNS issues, or upstream routing changes.',
      severity: 'High',
      category: 'Availability',
      tags: ['observability', 'availability', 'traffic', 'anomaly'],
      requiredFields: ['timestamp', 'http_host', 'server_name', 'request_method', 'status', 'remote_addr'],
      detectionLogic: 'Alert when request volume per server_name drops below 30% of the same time-window average from the prior 7 days, or spikes above 300% within a 5-minute evaluation window. Account for normal diurnal patterns.',
      operationalValue: 'Traffic drops are often the first signal of DNS failures, load balancer misconfigurations, or CDN issues. Spikes indicate potential DDoS, viral content, or misconfigured retry logic.',
      changeMgmtRelevance: 'Traffic shifts after DNS changes, CDN configuration updates, or load balancer modifications validate correct routing. Unexpected drops indicate misrouted traffic.',
      troubleshootingWorkflow: '1. Identify which server_name/virtual host is affected\n2. For drops: check DNS resolution, upstream CDN/LB health, and routing\n3. For spikes: determine if traffic is legitimate (viral) or attack (DDoS)\n4. Check if traffic shifted to a different virtual host\n5. Verify no recent DNS TTL changes or CDN purges\n6. Check client distribution (remote_addr diversity) for DDoS indicators',
      dashboardDependency: 'Traffic Volume Dashboard, Virtual Host Health',
      criblSearchQueries: [
        {
          name: 'Request volume per virtual host over time',
          description: 'Track request rates per server_name to detect anomalous traffic patterns',
          query: 'dataset="$DATASET" earliest=-12h\n| timestats span=5m Requests=count() by server_name\n| order by _time desc'
        },
        {
          name: 'Current vs baseline traffic comparison',
          description: 'Compare current request volume against recent baseline to quantify deviation',
          query: 'dataset="$DATASET" earliest=-1h\n| summarize CurrentRequests=count(), UniqueClients=dcount(remote_addr) by server_name\n| order by CurrentRequests desc'
        },
        {
          name: 'Traffic drop analysis by method and status',
          description: 'Determine if specific request types disappeared during a traffic drop',
          query: 'dataset="$DATASET" earliest=-2h\n| timestats span=5m count() by server_name, request_method\n| order by _time desc'
        },
        {
          name: 'Client distribution during anomaly',
          description: 'Analyze the diversity of clients to differentiate organic shifts from attacks',
          query: 'dataset="$DATASET" earliest=-30m\n| summarize Requests=count() by remote_addr, server_name\n| order by Requests desc\n| limit 30'
        }
      ]
    },
    {
      id: 'ngx-obs-004',
      name: 'Cache Hit Ratio Degradation',
      objective: 'Detect when upstream_cache_status shifts from HIT to MISS or EXPIRED, indicating cache eviction issues, configuration changes, or upstream content modifications invalidating cached content.',
      severity: 'Medium',
      category: 'Performance',
      tags: ['observability', 'performance', 'cache', 'optimization'],
      requiredFields: ['upstream_cache_status', 'http_host', 'server_name', 'request_uri', 'bytes_sent', 'upstream_response_time', 'timestamp'],
      detectionLogic: 'Alert when cache HIT ratio drops below 60% from a baseline of 80%+ within a 15-minute window per server_name. Also alert when BYPASS or EXPIRED rates increase more than 50% from baseline.',
      operationalValue: 'Cache degradation directly increases upstream load and response latency. A sudden drop from 80% HIT to 40% HIT means upstream servers receive 3x more requests — often causing cascading failures.',
      changeMgmtRelevance: 'Cache invalidation after deployments is expected. However, persistent low hit rates indicate misconfigured cache headers, changed URI patterns, or undersized cache zones.',
      troubleshootingWorkflow: '1. Identify which server_name has degraded cache ratios\n2. Check the distribution of cache statuses (HIT, MISS, EXPIRED, BYPASS, STALE)\n3. Determine if specific URIs shifted from HIT to MISS\n4. Verify cache zone is not full (check NGINX cache manager logs)\n5. Review Cache-Control and Expires headers from upstream\n6. Check if a recent deployment changed URL patterns or query strings',
      dashboardDependency: 'Cache Performance Dashboard, CDN Efficiency Monitor',
      criblSearchQueries: [
        {
          name: 'Cache status distribution over time',
          description: 'Track HIT/MISS/BYPASS/EXPIRED ratios to detect cache degradation',
          query: 'dataset="$DATASET" upstream_cache_status != "-" earliest=-12h\n| timestats span=15m count() by upstream_cache_status\n| order by _time desc'
        },
        {
          name: 'Cache hit ratio per virtual host',
          description: 'Calculate cache effectiveness per server_name to identify affected services',
          query: 'dataset="$DATASET" upstream_cache_status != "-" earliest=-2h\n| summarize Total=count(), Hits=countif(upstream_cache_status=="HIT") by server_name\n| extend HitRatio=round(Hits * 100.0 / Total, 1)\n| order by HitRatio asc'
        },
        {
          name: 'URIs with high MISS rates',
          description: 'Find specific request paths generating cache misses that should be hitting',
          query: 'dataset="$DATASET" upstream_cache_status="MISS" earliest=-1h\n| summarize Misses=count() by request_uri, server_name\n| order by Misses desc\n| limit 20'
        },
        {
          name: 'Upstream load increase from cache misses',
          description: 'Quantify the backend impact of cache degradation in bytes and requests',
          query: 'dataset="$DATASET" upstream_cache_status in ("MISS", "EXPIRED", "BYPASS") earliest=-4h\n| timestats span=15m BackendRequests=count(), BackendBytes=sum(bytes_sent) by upstream_cache_status\n| order by _time desc'
        }
      ]
    },
    {
      id: 'ngx-obs-005',
      name: 'Slow Request Detection',
      objective: 'Detect requests where total request_time exceeds acceptable thresholds, identify slow endpoints, and track long-tail latency that impacts user experience.',
      severity: 'Medium',
      category: 'Performance',
      tags: ['observability', 'performance', 'latency', 'slow-requests'],
      requiredFields: ['request_time', 'request_uri', 'request_method', 'status', 'upstream_response_time', 'http_host', 'server_name', 'timestamp'],
      detectionLogic: 'Alert when P99 request_time exceeds 5 seconds for any server_name, or when more than 10% of requests exceed 2 seconds within a 5-minute window. Track both absolute thresholds and relative degradation from baseline.',
      operationalValue: 'Long-tail latency destroys user experience even when averages look healthy. P99 at 5s means 1 in 100 users waits 5+ seconds. Identifying slow endpoints enables targeted optimization.',
      changeMgmtRelevance: 'New code paths, missing database indexes, or N+1 queries introduced by deployments manifest as slow requests on specific URIs. Correlate slow endpoints with recently changed code paths.',
      troubleshootingWorkflow: '1. Identify which URIs have the highest request_time\n2. Decompose: is slowness in NGINX processing (request_time - upstream_response_time) or backend?\n3. Check if slow requests correlate with request_length (large uploads)\n4. Verify upstream_connect_time is not contributing (connection pool issues)\n5. Check if specific clients (remote_addr) are disproportionately slow\n6. Look for patterns in slow request timing (concurrent batch jobs?)',
      dashboardDependency: 'Request Latency Dashboard, Slow Endpoint Tracker',
      criblSearchQueries: [
        {
          name: 'P95/P99 request time by URI',
          description: 'Identify the slowest endpoints by percentile latency',
          query: 'dataset="$DATASET" request_time > 0 earliest=-4h\n| summarize P50=avg(request_time), P95=max(request_time), Requests=count() by request_uri\n| where Requests > 20\n| order by P95 desc\n| limit 20'
        },
        {
          name: 'Slow request trend over time',
          description: 'Track the volume of slow requests (>2s) to detect latency degradation trends',
          query: 'dataset="$DATASET" request_time > 2 earliest=-12h\n| timestats span=5m SlowRequests=count() by server_name\n| order by _time desc'
        },
        {
          name: 'Latency breakdown: NGINX vs upstream',
          description: 'Decompose total request time into NGINX overhead vs backend processing',
          query: 'dataset="$DATASET" request_time > 1 earliest=-1h\n| extend NginxOverhead=request_time - upstream_response_time\n| summarize AvgTotal=avg(request_time), AvgUpstream=avg(upstream_response_time), AvgOverhead=avg(NginxOverhead) by request_uri\n| order by AvgTotal desc\n| limit 15'
        },
        {
          name: 'Slow request distribution by status code',
          description: 'Determine if slow requests are correlated with error responses',
          query: 'dataset="$DATASET" request_time > 2 earliest=-2h\n| summarize SlowCount=count(), AvgTime=avg(request_time) by status, server_name\n| order by SlowCount desc'
        }
      ]
    },
    {
      id: 'ngx-obs-006',
      name: 'Upstream Server Health',
      objective: 'Track error rates and response times per individual upstream_addr to identify failing backend servers that should be removed from the load balancer pool.',
      severity: 'High',
      category: 'Availability',
      tags: ['observability', 'availability', 'upstream', 'health-check'],
      requiredFields: ['upstream_addr', 'upstream_status', 'upstream_response_time', 'upstream_connect_time', 'status', 'server_name', 'timestamp'],
      detectionLogic: 'Alert when any individual upstream_addr returns more than 20% errors (upstream_status >= 500) or when upstream_connect_time exceeds 1 second (indicating connection pool exhaustion or unresponsive backend). Evaluate per 2-minute window.',
      operationalValue: 'Pinpoints the specific backend server that is degraded, enabling targeted remediation (restart, drain, replace) without the blast radius of a full service restart.',
      changeMgmtRelevance: 'Rolling deployments cause individual backends to temporarily return errors. This detection distinguishes normal rolling-deploy error patterns from actual failures by correlating timing with deployment progression.',
      troubleshootingWorkflow: '1. Identify which upstream_addr(s) are unhealthy\n2. Check upstream_status codes: 502 (down), 503 (overloaded), 504 (slow)\n3. Review upstream_connect_time — high values indicate the process is not accepting connections\n4. Check if NGINX has passive health checks configured to auto-remove the backend\n5. Verify the backend process is running and healthy on the target server\n6. Determine if draining the backend from the pool is appropriate',
      dashboardDependency: 'Upstream Health Matrix, Backend Server Status',
      criblSearchQueries: [
        {
          name: 'Error rate per upstream server',
          description: 'Calculate the error percentage for each backend to identify unhealthy instances',
          query: 'dataset="$DATASET" upstream_addr != "-" earliest=-2h\n| summarize Total=count(), Errors=countif(upstream_status >= 500), AvgLatency=avg(upstream_response_time) by upstream_addr\n| extend ErrorPct=round(Errors * 100.0 / Total, 1)\n| order by ErrorPct desc'
        },
        {
          name: 'Upstream health over time',
          description: 'Track per-backend error rates over time to identify degradation patterns',
          query: 'dataset="$DATASET" upstream_addr != "-" earliest=-6h\n| timestats span=5m Errors=countif(upstream_status >= 500), Total=count() by upstream_addr\n| order by _time desc'
        },
        {
          name: 'Connection time analysis per backend',
          description: 'Identify backends with high connection establishment time (exhausted workers)',
          query: 'dataset="$DATASET" upstream_connect_time > 0 earliest=-1h\n| summarize AvgConnect=avg(upstream_connect_time), P95Connect=max(upstream_connect_time), Requests=count() by upstream_addr\n| order by P95Connect desc'
        },
        {
          name: 'Backend comparison: latency and errors',
          description: 'Side-by-side comparison of all backends for load balancer health assessment',
          query: 'dataset="$DATASET" upstream_addr != "-" earliest=-30m\n| summarize Requests=count(), AvgLatency=avg(upstream_response_time), P95Latency=max(upstream_response_time), Errors=countif(upstream_status >= 500) by upstream_addr\n| extend ErrorPct=round(Errors * 100.0 / Requests, 1)\n| order by ErrorPct desc'
        }
      ]
    },
    {
      id: 'ngx-obs-007',
      name: 'Log Ingestion Health',
      objective: 'Monitor the NGINX log delivery pipeline for gaps, delays, or volume drops that indicate collection failures, disk issues, or Cribl pipeline problems.',
      severity: 'Critical',
      category: 'Data Quality',
      tags: ['observability', 'data-quality', 'pipeline', 'ingestion'],
      requiredFields: ['timestamp', 'server_name', 'status', 'request_method'],
      detectionLogic: 'Alert when total NGINX log event volume drops below 50% of the 1-hour rolling average within a 5-minute window. Also alert when any server_name that normally produces more than 100 events per minute drops to zero for more than 2 minutes.',
      operationalValue: 'All NGINX-based detections depend on complete log data. Pipeline failures create blind spots where errors, latency, and traffic anomalies go undetected. This is the foundational health check for all other detections.',
      changeMgmtRelevance: 'Log pipeline breaks after NGINX config changes (log_format modifications, new log paths), Cribl pipeline updates, or log rotation configuration changes. First thing to verify after any logging infrastructure change.',
      troubleshootingWorkflow: '1. Determine if the gap affects all server_names or specific ones\n2. Check NGINX access log file on disk — is it being written?\n3. Verify Cribl file monitor source is watching the correct path\n4. Check log rotation — did logrotate run and NGINX not receive USR1?\n5. Verify disk space on the NGINX server\n6. Check Cribl pipeline for backpressure or processing errors',
      dashboardDependency: 'Log Pipeline Health Dashboard, Data Completeness Scorecard',
      criblSearchQueries: [
        {
          name: 'Total log volume over time',
          description: 'Monitor overall NGINX log ingestion rate to detect pipeline gaps',
          query: 'dataset="$DATASET" earliest=-24h\n| timestats span=5m LogEvents=count()\n| order by _time desc'
        },
        {
          name: 'Volume per server_name over time',
          description: 'Track log production per virtual host to isolate per-site collection issues',
          query: 'dataset="$DATASET" earliest=-6h\n| timestats span=5m count() by server_name\n| order by _time desc'
        },
        {
          name: 'Log delivery latency (event time vs ingest time)',
          description: 'Detect delays between when NGINX wrote the log and when it was ingested',
          query: 'dataset="$DATASET" earliest=-2h\n| extend IngestDelay=_time - timestamp\n| timestats span=5m AvgDelay=avg(IngestDelay), P95Delay=max(IngestDelay)\n| order by _time desc'
        },
        {
          name: 'Server names with zero events (silent hosts)',
          description: 'Identify virtual hosts that stopped producing logs unexpectedly',
          query: 'dataset="$DATASET" earliest=-1h\n| summarize LastEvent=max(timestamp), EventCount=count() by server_name\n| where LastEvent < ago(5m)\n| order by LastEvent asc'
        }
      ]
    }
  ],
  'okta-system-logs': [
    {
      id: 'okta-obs-001',
      name: 'Authentication Success Rate',
      objective: 'Track overall authentication success/failure ratios and trends across the Okta org to detect degraded login experiences, misconfigured policies, or identity provider outages.',
      category: 'Availability',
      tags: ['observability', 'availability', 'authentication', 'identity'],
      requiredFields: ['eventType', 'outcome.result', 'outcome.reason', 'actor.alternateId', 'client.ipAddress', 'authenticationContext.credentialType', 'severity', 'target[0].displayName'],
      detectionLogic: 'Alert when authentication failure rate exceeds 20% of total authentication events within a 10-minute window, or when failure count exceeds 3x the 7-day baseline for the same time-of-day window. Evaluate eventType user.authentication.auth_via_mfa and user.session.start with outcome.result != SUCCESS.',
      operationalValue: 'Authentication success rate is the primary health indicator for identity infrastructure. Degradation impacts every user and application depending on Okta for SSO. Early detection prevents help desk floods and productivity loss.',
      changeMgmtRelevance: 'Auth failure spikes correlating with policy changes, MFA factor updates, or IdP configuration modifications indicate misconfigured authentication rules requiring immediate rollback.',
      troubleshootingWorkflow: '1. Determine if failures are concentrated on specific users, applications, or geographies\n2. Check outcome.reason for common patterns (INVALID_CREDENTIALS, LOCKED_OUT, MFA_ENROLL_REQUIRED)\n3. Verify IdP connectivity if federated authentication is failing\n4. Check if a recent sign-on policy change affected authentication flow\n5. Verify MFA provider health (Okta Verify push, SMS gateway)\n6. Check for network-level issues affecting client connectivity to Okta',
      dashboardDependency: 'Authentication Health Dashboard, Login Success Rate Monitor',
      criblSearchQueries: [
        {
          name: 'Authentication success vs failure over time',
          description: 'Track login outcome distribution to detect degradation trends',
          query: 'dataset="$DATASET" eventType in ("user.authentication.auth_via_mfa", "user.session.start") earliest=-12h\n| timestats span=10m count() by outcome.result\n| order by _time desc'
        },
        {
          name: 'Authentication failure rate by hour',
          description: 'Calculate the percentage of failed authentications per time window',
          query: 'dataset="$DATASET" eventType in ("user.authentication.auth_via_mfa", "user.session.start") earliest=-24h\n| summarize Total=count(), Failures=countif(outcome.result == "FAILURE") by bin(_time, 1h)\n| extend FailurePct=round(Failures * 100.0 / Total, 2)\n| order by _time desc'
        },
        {
          name: 'Top failure reasons',
          description: 'Identify the most common authentication failure reasons to prioritize remediation',
          query: 'dataset="$DATASET" eventType in ("user.authentication.auth_via_mfa", "user.session.start") outcome.result == "FAILURE" earliest=-4h\n| summarize FailCount=count(), AffectedUsers=dcount(actor.alternateId) by outcome.reason\n| order by FailCount desc'
        },
        {
          name: 'Failure rate by credential type',
          description: 'Determine if failures are concentrated on specific authentication methods',
          query: 'dataset="$DATASET" eventType in ("user.authentication.auth_via_mfa", "user.session.start") earliest=-4h\n| summarize Total=count(), Failures=countif(outcome.result == "FAILURE") by authenticationContext.credentialType\n| extend FailPct=round(Failures * 100.0 / Total, 1)\n| order by FailPct desc'
        }
      ]
    },
    {
      id: 'okta-obs-002',
      name: 'SSO Application Errors',
      objective: 'Monitor SSO login failures by application to detect application-specific outages, SAML/OIDC misconfigurations, or certificate expiration issues before they impact broad user populations.',
      category: 'Availability',
      tags: ['observability', 'availability', 'sso', 'application', 'saml'],
      requiredFields: ['eventType', 'outcome.result', 'outcome.reason', 'target[0].type', 'target[0].alternateId', 'target[0].displayName', 'actor.alternateId', 'severity'],
      detectionLogic: 'Alert when SSO failure rate for any single application exceeds 30% within a 10-minute window, or when an application that normally has zero failures begins producing more than 5 failures in 5 minutes. Focus on eventType user.authentication.sso with outcome.result FAILURE.',
      operationalValue: 'Application-specific SSO failures indicate integration issues rather than org-wide problems. Isolating failures by application enables targeted remediation and accurate communication to affected teams.',
      changeMgmtRelevance: 'SSO failures after application configuration changes (certificate rotation, redirect URI updates, claim mapping modifications) confirm broken integrations requiring immediate rollback.',
      troubleshootingWorkflow: '1. Identify the affected application(s) from target[0].displayName\n2. Check outcome.reason for specific error (INVALID_SAML_RESPONSE, CERTIFICATE_EXPIRED, etc.)\n3. Verify application SAML/OIDC configuration in Okta admin console\n4. Check if the application certificate is expired or rotated\n5. Verify redirect URIs and audience restrictions match\n6. Test SSO flow manually with a test user\n7. Check if the application service provider is experiencing its own outage',
      dashboardDependency: 'SSO Application Health Dashboard, Integration Status Monitor',
      criblSearchQueries: [
        {
          name: 'SSO failures by application over time',
          description: 'Track which applications are experiencing SSO errors and when they started',
          query: 'dataset="$DATASET" eventType == "user.authentication.sso" outcome.result == "FAILURE" earliest=-12h\n| timestats span=15m count() by target[0].displayName\n| order by _time desc'
        },
        {
          name: 'Application SSO error rate comparison',
          description: 'Calculate SSO success rate per application to identify degraded integrations',
          query: 'dataset="$DATASET" eventType == "user.authentication.sso" earliest=-4h\n| summarize Total=count(), Failures=countif(outcome.result == "FAILURE") by target[0].displayName\n| extend ErrorPct=round(Failures * 100.0 / Total, 1)\n| where Total > 5\n| order by ErrorPct desc'
        },
        {
          name: 'SSO failure reasons by application',
          description: 'Drill into the specific error reasons per application for targeted troubleshooting',
          query: 'dataset="$DATASET" eventType == "user.authentication.sso" outcome.result == "FAILURE" earliest=-4h\n| summarize FailCount=count(), AffectedUsers=dcount(actor.alternateId) by target[0].displayName, outcome.reason\n| order by FailCount desc'
        },
        {
          name: 'Users affected by SSO failures',
          description: 'Identify which users are impacted by application SSO errors for support triage',
          query: 'dataset="$DATASET" eventType == "user.authentication.sso" outcome.result == "FAILURE" earliest=-2h\n| summarize FailedAttempts=count(), Apps=dcount(target[0].displayName) by actor.alternateId\n| order by FailedAttempts desc\n| limit 25'
        }
      ]
    },
    {
      id: 'okta-obs-003',
      name: 'MFA Enrollment Coverage',
      objective: 'Track MFA factor enrollment and gaps across the user population to identify users without adequate multi-factor coverage and monitor enrollment campaign effectiveness.',
      category: 'Health',
      tags: ['observability', 'health', 'mfa', 'enrollment', 'compliance'],
      requiredFields: ['eventType', 'outcome.result', 'actor.alternateId', 'debugContext.debugData.factor', 'target[0].type', 'target[0].alternateId', 'severity'],
      detectionLogic: 'Alert when MFA enrollment events (user.mfa.factor.activate) drop below expected baseline during active enrollment campaigns, or when MFA challenge failures (user.mfa.factor.verify with outcome FAILURE) exceed 15% for any factor type. Also track users authenticating without MFA (user.session.start without subsequent MFA event).',
      operationalValue: 'MFA coverage gaps represent organizational security risk and compliance exposure. Monitoring enrollment trends validates security initiatives and identifies user populations needing targeted enablement.',
      changeMgmtRelevance: 'MFA policy changes (new factor requirements, grace period modifications) should correlate with enrollment activity. Lack of enrollment after policy activation indicates ineffective rollout communication.',
      troubleshootingWorkflow: '1. Identify which factor types have lowest enrollment (debugContext.debugData.factor)\n2. Determine user populations with enrollment gaps\n3. Check if MFA challenge failures indicate factor delivery issues (SMS, push)\n4. Verify MFA policy assignments are correct for target groups\n5. Review enrollment campaign timelines and communication effectiveness\n6. Check for factor-specific issues (Okta Verify app updates, TOTP clock drift)',
      dashboardDependency: 'MFA Coverage Dashboard, Factor Enrollment Tracker',
      criblSearchQueries: [
        {
          name: 'MFA enrollment activity over time',
          description: 'Track factor enrollment events to measure campaign effectiveness',
          query: 'dataset="$DATASET" eventType in ("user.mfa.factor.activate", "user.mfa.factor.deactivate") earliest=-30d\n| timestats span=1d count() by eventType, debugContext.debugData.factor\n| order by _time desc'
        },
        {
          name: 'MFA challenge success vs failure by factor',
          description: 'Identify which MFA factor types have the highest failure rates',
          query: 'dataset="$DATASET" eventType == "user.mfa.factor.verify" earliest=-7d\n| summarize Total=count(), Failures=countif(outcome.result == "FAILURE") by debugContext.debugData.factor\n| extend FailPct=round(Failures * 100.0 / Total, 1)\n| order by FailPct desc'
        },
        {
          name: 'Users with MFA failures (enrollment gap candidates)',
          description: 'Find users experiencing repeated MFA failures who may need enrollment support',
          query: 'dataset="$DATASET" eventType == "user.mfa.factor.verify" outcome.result == "FAILURE" earliest=-7d\n| summarize FailCount=count(), FactorsAttempted=dcount(debugContext.debugData.factor) by actor.alternateId\n| where FailCount > 5\n| order by FailCount desc\n| limit 30'
        },
        {
          name: 'Factor type distribution across enrollments',
          description: 'See the current distribution of enrolled factor types to identify coverage gaps',
          query: 'dataset="$DATASET" eventType == "user.mfa.factor.activate" earliest=-90d\n| summarize Enrollments=count(), UniqueUsers=dcount(actor.alternateId) by debugContext.debugData.factor\n| order by UniqueUsers desc'
        }
      ]
    },
    {
      id: 'okta-obs-004',
      name: 'API Rate Limit Monitoring',
      objective: 'Monitor Okta API rate limit warnings and violations to prevent service disruptions from automated integrations, SCIM provisioning, or runaway scripts hitting rate ceilings.',
      category: 'Capacity',
      tags: ['observability', 'capacity', 'api', 'rate-limit', 'integration'],
      requiredFields: ['eventType', 'outcome.result', 'outcome.reason', 'severity', 'actor.alternateId', 'debugContext.debugData.requestUri', 'client.ipAddress', 'transaction.type'],
      detectionLogic: 'Alert when system.org.rate_limit.warning or system.org.rate_limit.violation events appear. Also alert when any single API client generates more than 50 rate limit warnings in a 15-minute window. Track rate limit consumption trends to predict approaching limits.',
      operationalValue: 'Rate limit violations cause API failures affecting provisioning, SSO, and automation workflows. Early warning on rate limit approach prevents hard failures and enables throttling adjustments before users are impacted.',
      changeMgmtRelevance: 'New integrations, SCIM provisioning bulk operations, or automation script deployments often trigger rate limit issues. Correlate rate limit events with recently deployed integrations.',
      troubleshootingWorkflow: '1. Identify which API endpoint (debugContext.debugData.requestUri) is hitting limits\n2. Determine the client/integration causing the load (actor.alternateId, client.ipAddress)\n3. Check if the load is from a legitimate bulk operation or a runaway script\n4. Review rate limit bucket assignments in Okta admin\n5. Implement backoff/throttling in the offending integration\n6. Consider requesting rate limit increase from Okta support if legitimate load',
      dashboardDependency: 'API Rate Limit Dashboard, Integration Health Monitor',
      criblSearchQueries: [
        {
          name: 'Rate limit events over time',
          description: 'Track rate limit warnings and violations to detect approaching capacity ceilings',
          query: 'dataset="$DATASET" eventType in ("system.org.rate_limit.warning", "system.org.rate_limit.violation") earliest=-7d\n| timestats span=1h count() by eventType\n| order by _time desc'
        },
        {
          name: 'Top rate limit consumers by client',
          description: 'Identify which integrations or clients are consuming the most rate limit budget',
          query: 'dataset="$DATASET" eventType in ("system.org.rate_limit.warning", "system.org.rate_limit.violation") earliest=-24h\n| summarize Warnings=count() by actor.alternateId, client.ipAddress, debugContext.debugData.requestUri\n| order by Warnings desc\n| limit 20'
        },
        {
          name: 'Rate limit events by API endpoint',
          description: 'Determine which API endpoints are most constrained for capacity planning',
          query: 'dataset="$DATASET" eventType in ("system.org.rate_limit.warning", "system.org.rate_limit.violation") earliest=-24h\n| summarize HitCount=count(), UniqueClients=dcount(actor.alternateId) by debugContext.debugData.requestUri\n| order by HitCount desc'
        },
        {
          name: 'Rate limit violation severity trend',
          description: 'Track whether rate limit issues are escalating from warnings to violations',
          query: 'dataset="$DATASET" eventType in ("system.org.rate_limit.warning", "system.org.rate_limit.violation") earliest=-48h\n| timestats span=4h count() by eventType, severity\n| order by _time desc'
        }
      ]
    },
    {
      id: 'okta-obs-005',
      name: 'Account Lockout Trends',
      objective: 'Track account lockout events and patterns across the organization to detect systemic authentication issues, credential stuffing impacts, or overly aggressive lockout policies.',
      category: 'Health',
      tags: ['observability', 'health', 'lockout', 'account', 'identity'],
      requiredFields: ['eventType', 'outcome.result', 'outcome.reason', 'actor.alternateId', 'client.ipAddress', 'client.geographicalContext.country', 'severity', 'target[0].alternateId'],
      detectionLogic: 'Alert when account lockout events (user.account.lock) exceed 10 within a 15-minute window org-wide, or when lockout rate increases more than 200% above the 7-day baseline. Also alert when a single IP address triggers lockouts for more than 3 different accounts in 10 minutes.',
      operationalValue: 'Lockout trends reveal systemic issues — password rotation failures, stale cached credentials in apps, or credential stuffing attacks reaching the lockout threshold. Each lockout is a productivity loss for the user and a help desk ticket.',
      changeMgmtRelevance: 'Lockout spikes after password policy changes, SSO configuration updates, or credential rotation deadlines indicate users struggling with new requirements. Informs rollback or extended grace period decisions.',
      troubleshootingWorkflow: '1. Determine if lockouts are concentrated on specific users, IPs, or geographies\n2. Check if locked-out users share common applications or authentication flows\n3. Look for cached credential issues (service accounts, mobile devices, saved passwords)\n4. Check if a password policy change recently took effect\n5. Evaluate if lockout threshold is too aggressive for the environment\n6. Assess whether lockout patterns indicate credential stuffing (many accounts, few IPs)',
      dashboardDependency: 'Account Lockout Dashboard, Identity Health Monitor',
      criblSearchQueries: [
        {
          name: 'Account lockout events over time',
          description: 'Track lockout volume to detect spikes indicating systemic issues',
          query: 'dataset="$DATASET" eventType == "user.account.lock" earliest=-7d\n| timestats span=1h Lockouts=count()\n| order by _time desc'
        },
        {
          name: 'Lockouts by user (repeat offenders)',
          description: 'Identify users experiencing repeated lockouts who may have cached credential issues',
          query: 'dataset="$DATASET" eventType == "user.account.lock" earliest=-7d\n| summarize LockoutCount=count(), UniqueIPs=dcount(client.ipAddress) by target[0].alternateId\n| where LockoutCount > 2\n| order by LockoutCount desc\n| limit 25'
        },
        {
          name: 'Lockout source analysis by IP and geography',
          description: 'Determine if lockouts originate from specific locations or IPs indicating attacks',
          query: 'dataset="$DATASET" eventType == "user.account.lock" earliest=-24h\n| summarize Lockouts=count(), AffectedAccounts=dcount(target[0].alternateId) by client.ipAddress, client.geographicalContext.country\n| order by Lockouts desc\n| limit 20'
        },
        {
          name: 'Lockout rate vs authentication failure correlation',
          description: 'Compare lockout events with preceding authentication failures to understand the path to lockout',
          query: 'dataset="$DATASET" eventType in ("user.account.lock", "user.session.start") earliest=-24h\n| summarize Lockouts=countif(eventType == "user.account.lock"), AuthFailures=countif(eventType == "user.session.start" AND outcome.result == "FAILURE") by bin(_time, 1h)\n| order by _time desc'
        }
      ]
    },
    {
      id: 'okta-obs-006',
      name: 'Session Duration Anomalies',
      objective: 'Detect abnormal session lengths — both unusually short sessions (indicating login loops or immediate failures) and excessively long sessions (indicating stale tokens or policy bypass) across the Okta environment.',
      category: 'Performance',
      tags: ['observability', 'performance', 'session', 'authentication', 'anomaly'],
      requiredFields: ['eventType', 'outcome.result', 'actor.alternateId', 'authenticationContext.credentialType', 'transaction.type', 'target[0].displayName', 'client.ipAddress'],
      detectionLogic: 'Alert when session start/end event pairs indicate sessions shorter than 30 seconds (user.session.start followed by user.session.end) at a rate exceeding 20% of all sessions in a 15-minute window. Also flag when session.lifetime.extend events indicate sessions persisting beyond the configured maximum policy duration.',
      operationalValue: 'Short-lived sessions indicate broken authentication flows where users authenticate but immediately lose their session — creating frustrating login loops. Long sessions outside policy bounds indicate token refresh issues or policy bypass.',
      changeMgmtRelevance: 'Session anomalies after session policy changes (lifetime settings, idle timeout, token refresh intervals) indicate misconfigurations. Short sessions after policy tightening suggest incompatibility with existing client behavior.',
      troubleshootingWorkflow: '1. Identify affected users and whether the pattern is isolated or widespread\n2. For short sessions: check if specific applications or browsers trigger the issue\n3. Look for cookie/token rejection patterns in subsequent auth attempts\n4. Verify session policy lifetime and idle timeout settings\n5. Check if token refresh mechanisms are functioning correctly\n6. For long sessions: verify session revocation policies are being enforced\n7. Check client.userAgent to identify problematic browser or app versions',
      dashboardDependency: 'Session Health Dashboard, Authentication Flow Monitor',
      criblSearchQueries: [
        {
          name: 'Session lifecycle events over time',
          description: 'Track session start, extend, and end events to identify abnormal patterns',
          query: 'dataset="$DATASET" eventType in ("user.session.start", "user.session.end", "user.session.expire") earliest=-12h\n| timestats span=15m count() by eventType\n| order by _time desc'
        },
        {
          name: 'Rapid session turnover (short-lived sessions)',
          description: 'Identify users creating and ending sessions rapidly indicating login loop behavior',
          query: 'dataset="$DATASET" eventType in ("user.session.start", "user.session.end") earliest=-4h\n| summarize SessionStarts=countif(eventType == "user.session.start"), SessionEnds=countif(eventType == "user.session.end") by actor.alternateId\n| where SessionStarts > 5 AND SessionEnds > 5\n| order by SessionStarts desc\n| limit 25'
        },
        {
          name: 'Session events by application and outcome',
          description: 'Determine if session anomalies are concentrated on specific applications',
          query: 'dataset="$DATASET" eventType in ("user.session.start", "user.session.end") earliest=-4h\n| summarize Events=count(), UniqueUsers=dcount(actor.alternateId) by eventType, target[0].displayName, outcome.result\n| order by Events desc'
        },
        {
          name: 'Session extend events (long-running sessions)',
          description: 'Track session lifetime extensions to identify sessions persisting beyond expected duration',
          query: 'dataset="$DATASET" eventType == "user.session.expire" earliest=-24h\n| summarize Expirations=count() by actor.alternateId, client.ipAddress\n| where Expirations > 10\n| order by Expirations desc\n| limit 20'
        }
      ]
    },
    {
      id: 'okta-obs-007',
      name: 'Application Assignment Volume',
      objective: 'Track bulk application provisioning and deprovisioning patterns to validate change management execution, detect unauthorized mass assignments, and monitor onboarding/offboarding workflow health.',
      category: 'Change Management',
      tags: ['observability', 'change-management', 'provisioning', 'application', 'lifecycle'],
      requiredFields: ['eventType', 'outcome.result', 'actor.alternateId', 'target[0].type', 'target[0].displayName', 'target[0].alternateId', 'severity'],
      detectionLogic: 'Alert when application assignment events (application.user_membership.add, application.user_membership.remove) exceed 20 within a 15-minute window for any single application. Also alert when bulk deprovisioning (>10 removals in 5 minutes) occurs outside defined change windows.',
      operationalValue: 'Bulk provisioning/deprovisioning is a high-impact operation. Unauthorized or mistaken mass removals can lock entire teams out of critical applications. Monitoring assignment velocity enables rapid detection of provisioning automation failures or unauthorized changes.',
      changeMgmtRelevance: 'Directly supports change validation. Bulk assignments should correlate with approved change requests for onboarding cohorts, team restructures, or application rollouts. Unexpected bulk changes indicate automation failures or unauthorized access.',
      troubleshootingWorkflow: '1. Identify which application(s) are experiencing bulk assignment changes\n2. Determine the actor (admin user, automation service account, SCIM connector)\n3. Verify the change correlates with an approved change request\n4. Check if the operation is assignment (onboarding) or removal (offboarding)\n5. Validate affected users were intended targets\n6. If unauthorized: immediately pause the integration and assess blast radius\n7. Check SCIM provisioning logs for sync errors if automated',
      dashboardDependency: 'Application Provisioning Dashboard, Change Management Validation',
      criblSearchQueries: [
        {
          name: 'Application assignment/removal volume over time',
          description: 'Track provisioning activity patterns to detect bulk operations',
          query: 'dataset="$DATASET" eventType in ("application.user_membership.add", "application.user_membership.remove") earliest=-7d\n| timestats span=1h count() by eventType\n| order by _time desc'
        },
        {
          name: 'Bulk provisioning events by application',
          description: 'Identify applications with high-volume assignment changes for change validation',
          query: 'dataset="$DATASET" eventType in ("application.user_membership.add", "application.user_membership.remove") earliest=-24h\n| summarize Additions=countif(eventType == "application.user_membership.add"), Removals=countif(eventType == "application.user_membership.remove") by target[0].displayName\n| extend TotalChanges=Additions + Removals\n| where TotalChanges > 5\n| order by TotalChanges desc'
        },
        {
          name: 'Provisioning actors (who made the changes)',
          description: 'Identify which admins or service accounts are performing bulk assignment operations',
          query: 'dataset="$DATASET" eventType in ("application.user_membership.add", "application.user_membership.remove") earliest=-24h\n| summarize Changes=count(), AppsAffected=dcount(target[0].displayName) by actor.alternateId\n| order by Changes desc\n| limit 20'
        },
        {
          name: 'Failed provisioning operations',
          description: 'Detect assignment failures that may indicate SCIM errors or permission issues',
          query: 'dataset="$DATASET" eventType in ("application.user_membership.add", "application.user_membership.remove") outcome.result != "SUCCESS" earliest=-48h\n| summarize Failures=count() by target[0].displayName, outcome.result, outcome.reason, actor.alternateId\n| order by Failures desc'
        }
      ]
    }
  ],
  'k8s-audit-logs': [
    {
      id: 'k8s-obs-001',
      name: 'API Server Request Latency',
      objective: 'Track Kubernetes API server response times by verb and resource type to detect performance degradation, overloaded control planes, or slow etcd backends before they impact workload scheduling and orchestration.',
      category: 'Performance',
      tags: ['observability', 'performance', 'api-server', 'latency', 'kubernetes'],
      requiredFields: ['verb', 'objectRef.resource', 'objectRef.namespace', 'user.username', 'userAgent', 'responseStatus.code', 'requestReceivedTimestamp', 'stageTimestamp', 'stage'],
      detectionLogic: 'Calculate request duration as the difference between stageTimestamp and requestReceivedTimestamp. Alert when P95 latency for non-watch requests (verb != watch, list) exceeds 1 second over a 5-minute window, or when any single resource type shows P95 latency above 5 seconds. Evaluate per verb and objectRef.resource combination against a 24-hour rolling baseline.',
      operationalValue: 'API server latency directly impacts pod scheduling, scaling decisions, and controller reconciliation loops. Degraded API performance cascades into delayed deployments, slow autoscaling, and stale cluster state. Detecting latency early prevents operational paralysis.',
      changeMgmtRelevance: 'Latency increases after cluster upgrades, etcd compaction changes, or admission webhook deployments indicate control plane impact. Correlate with maintenance windows and CRD installations.',
      troubleshootingWorkflow: '1. Identify which verb + resource combinations show elevated latency\n2. Determine if latency is across all resources (etcd/api-server issue) or specific (webhook/admission controller)\n3. Check if specific userAgents (controllers, kubectl) are disproportionately affected\n4. Review etcd performance metrics (fsync latency, leader elections)\n5. Check for resource-intensive LIST calls without pagination\n6. Verify admission webhook response times if specific resources are slow',
      dashboardDependency: 'API Server Performance Dashboard, Control Plane Health',
      criblSearchQueries: [
        {
          name: 'API request latency by verb and resource',
          description: 'Calculate request duration percentiles per verb/resource combination to identify slow operations',
          query: 'dataset="$DATASET" stage=="ResponseComplete" not(verb in ("watch", "list")) earliest=-4h\n| extend duration_ms=(tolong(todatetime(stageTimestamp)) - tolong(todatetime(requestReceivedTimestamp)))\n| summarize P50=avg(duration_ms), P95=max(duration_ms), Requests=count() by verb, objectRef_resource\n| where Requests > 10\n| order by P95 desc'
        },
        {
          name: 'API latency trend over time',
          description: 'Track P95 request latency over time to detect degradation onset',
          query: 'dataset="$DATASET" stage=="ResponseComplete" not(verb in ("watch", "list")) earliest=-12h\n| extend duration_ms=(tolong(todatetime(stageTimestamp)) - tolong(todatetime(requestReceivedTimestamp)))\n| timestats span=5m P95=max(duration_ms), AvgLatency=avg(duration_ms) by verb'
        },
        {
          name: 'Slow requests by user agent',
          description: 'Identify which controllers or clients are experiencing the highest latency',
          query: 'dataset="$DATASET" stage=="ResponseComplete" not(verb in ("watch", "list")) earliest=-1h\n| extend duration_ms=(tolong(todatetime(stageTimestamp)) - tolong(todatetime(requestReceivedTimestamp)))\n| where duration_ms > 1000\n| summarize SlowRequests=count(), AvgDuration=avg(duration_ms) by userAgent, verb, objectRef_resource\n| order by SlowRequests desc\n| limit 20'
        },
        {
          name: 'Latency by namespace (resource-level drill-down)',
          description: 'Break down API latency per namespace to identify if specific workloads are impacting the control plane',
          query: 'dataset="$DATASET" stage=="ResponseComplete" not(verb in ("watch", "list")) objectRef_namespace=="$NAMESPACE" earliest=-2h\n| extend duration_ms=(tolong(todatetime(stageTimestamp)) - tolong(todatetime(requestReceivedTimestamp)))\n| summarize P95=max(duration_ms), Requests=count() by verb, objectRef_resource, objectRef_namespace\n| order by P95 desc'
        }
      ]
    },
    {
      id: 'k8s-obs-002',
      name: 'Failed API Requests',
      objective: 'Monitor 4xx and 5xx API response codes to detect RBAC misconfigurations, expired credentials, resource conflicts, and API server errors that impact cluster operations.',
      category: 'Availability',
      tags: ['observability', 'availability', 'errors', 'rbac', 'api-server', 'kubernetes'],
      requiredFields: ['verb', 'objectRef.resource', 'objectRef.namespace', 'user.username', 'user.groups[]', 'responseStatus.code', 'responseStatus.reason', 'responseStatus.status', 'requestReceivedTimestamp'],
      detectionLogic: 'Alert when 4xx/5xx response rate exceeds 10% of total API requests within a 5-minute window. Separately alert on 403 (Forbidden) spikes indicating RBAC issues, 409 (Conflict) spikes indicating controller contention, and any 5xx responses indicating API server instability. Evaluate per user.username and objectRef.resource.',
      operationalValue: 'Failed API requests indicate that controllers, operators, or users cannot perform necessary operations. Persistent 403s mean workloads cannot be managed. 5xx errors indicate control plane instability affecting all cluster operations.',
      changeMgmtRelevance: 'RBAC changes, service account modifications, and cluster role binding updates are the primary cause of 403 spikes. 5xx errors after API server upgrades or etcd changes indicate failed upgrades.',
      troubleshootingWorkflow: '1. Classify failures by responseStatus.code (403=RBAC, 404=missing resource, 409=conflict, 5xx=server error)\n2. For 403: identify the user/service account and the resource they cannot access\n3. Check ClusterRoleBindings and RoleBindings for the affected user.groups\n4. For 409: identify which controllers are competing for the same resource\n5. For 5xx: check API server logs and etcd health\n6. Correlate with recent RBAC or admission policy changes',
      dashboardDependency: 'API Error Rate Dashboard, RBAC Compliance Monitor',
      criblSearchQueries: [
        {
          name: 'Error rate by response code over time',
          description: 'Track 4xx and 5xx response volumes to detect failure spikes',
          query: 'dataset="$DATASET" responseStatus_code >= 400 earliest=-6h\n| timestats span=5m count() by responseStatus_code\n| order by _time desc'
        },
        {
          name: 'Failed requests by user and resource',
          description: 'Identify which users/service accounts are experiencing failures and on which resources',
          query: 'dataset="$DATASET" responseStatus_code >= 400 earliest=-1h\n| summarize Failures=count() by user_username, objectRef_resource, responseStatus_code, responseStatus_reason\n| order by Failures desc\n| limit 30'
        },
        {
          name: 'RBAC denial analysis (403 Forbidden)',
          description: 'Deep-dive into access denied events to identify missing role bindings',
          query: 'dataset="$DATASET" responseStatus_code==403 earliest=-4h\n| summarize Denials=count() by user_username, verb, objectRef_resource, objectRef_namespace\n| order by Denials desc\n| limit 25'
        },
        {
          name: 'Error rate percentage by resource type',
          description: 'Calculate the failure ratio per resource to identify systematically broken operations',
          query: 'dataset="$DATASET" earliest=-1h\n| summarize Total=count(), Errors=countif(responseStatus_code >= 400) by objectRef_resource, verb\n| extend ErrorPct=round(Errors * 100.0 / Total, 1)\n| where Total > 20 AND ErrorPct > 5\n| order by ErrorPct desc'
        }
      ]
    },
    {
      id: 'k8s-obs-003',
      name: 'Control Plane Component Health',
      objective: 'Monitor for expected system component activity from controller-manager, scheduler, and kubelet to detect silent failures where critical components stop operating without explicit error signals.',
      category: 'Health',
      tags: ['observability', 'health', 'control-plane', 'controller-manager', 'scheduler', 'kubelet', 'kubernetes'],
      requiredFields: ['user.username', 'userAgent', 'verb', 'objectRef.resource', 'objectRef.subresource', 'responseStatus.code', 'requestReceivedTimestamp'],
      detectionLogic: 'Alert when expected system components (system:kube-controller-manager, system:kube-scheduler, kubelet) show no API activity for more than 5 minutes during normal operation. Also alert when the ratio of failed requests (4xx/5xx) from system components exceeds 20% within a 5-minute window, indicating degraded component functionality.',
      operationalValue: 'Control plane components are the brain of the cluster. If the scheduler stops, no new pods get placed. If controller-manager stops, reconciliation loops halt and desired state diverges from actual state. Silent failures are more dangerous than loud ones.',
      changeMgmtRelevance: 'Control plane component failures after cluster upgrades, certificate rotations, or etcd maintenance indicate incomplete or failed maintenance procedures. Validates upgrade success.',
      troubleshootingWorkflow: '1. Identify which system component(s) have gone silent or show elevated errors\n2. Check component pod status in kube-system namespace\n3. Review component logs for leader election failures or certificate issues\n4. Verify etcd connectivity from the affected component\n5. Check if certificate renewal or rotation recently occurred\n6. For kubelet: verify node status and check for network partitions\n7. Check if the component lost its leader lease (multi-master setups)',
      dashboardDependency: 'Control Plane Health Dashboard, Component Activity Monitor',
      criblSearchQueries: [
        {
          name: 'System component activity over time',
          description: 'Track API request volume per control plane component to detect silent failures',
          query: 'dataset="$DATASET" user_username startswith("system:") earliest=-12h\n| where user_username in ("system:kube-controller-manager", "system:kube-scheduler", "system:apiserver") OR user_username startswith("system:node:")\n| timestats span=5m count() by user_username'
        },
        {
          name: 'Component error rates',
          description: 'Monitor failure rates for system components to detect degraded operation',
          query: 'dataset="$DATASET" user_username startswith("system:") earliest=-4h\n| summarize Total=count(), Errors=countif(responseStatus_code >= 400) by user_username\n| extend ErrorPct=round(Errors * 100.0 / Total, 1)\n| order by ErrorPct desc'
        },
        {
          name: 'Last seen activity per component',
          description: 'Find the most recent API call from each system component to identify stale components',
          query: 'dataset="$DATASET" user_username startswith("system:") earliest=-1h\n| summarize LastSeen=max(requestReceivedTimestamp), EventCount=count() by user_username\n| order by LastSeen asc'
        },
        {
          name: 'Kubelet heartbeat and status updates',
          description: 'Track kubelet node status updates to detect nodes that stopped heartbeating',
          query: 'dataset="$DATASET" user_username startswith("system:node:") objectRef_resource=="nodes" objectRef_subresource=="status" earliest=-2h\n| summarize Heartbeats=count(), LastBeat=max(requestReceivedTimestamp) by user_username\n| order by LastBeat asc'
        }
      ]
    },
    {
      id: 'k8s-obs-004',
      name: 'Deployment Rollout Tracking',
      objective: 'Track deployment create, update, and scale operations to provide visibility into rollout progress, detect stalled rollouts, and correlate deployment activity with cluster-wide performance changes.',
      category: 'Change Management',
      tags: ['observability', 'change-management', 'deployments', 'rollout', 'kubernetes'],
      requiredFields: ['verb', 'objectRef.resource', 'objectRef.subresource', 'objectRef.namespace', 'objectRef.name', 'user.username', 'responseStatus.code', 'requestReceivedTimestamp'],
      detectionLogic: 'Track all create, update, and patch operations on deployments, replicasets, and statefulsets. Alert when a deployment update is followed by more than 3 failed pod creates within 10 minutes (stalled rollout). Also alert when deployment scale operations occur outside defined change windows.',
      operationalValue: 'Deployment rollouts are the most common source of production incidents. Tracking rollouts in the audit log provides a single source of truth for who deployed what and when, enabling rapid correlation between deployments and performance degradation.',
      changeMgmtRelevance: 'This detection is directly a change management control. It provides audit trail for all deployment mutations, validates that changes happen within approved windows, and detects unauthorized modifications to production workloads.',
      troubleshootingWorkflow: '1. Identify the deployment that was modified (objectRef.name and namespace)\n2. Determine who initiated the change (user.username) and how (userAgent: kubectl vs CI/CD)\n3. Check if the rollout completed successfully (watch for subsequent replicaset creates)\n4. Correlate the deployment timestamp with any latency or error spikes\n5. Verify the change was authorized (compare against change management records)\n6. If stalled, check pod events for ImagePullBackOff, CrashLoopBackOff, or resource constraints',
      dashboardDependency: 'Deployment Activity Dashboard, Change Audit Trail',
      criblSearchQueries: [
        {
          name: 'Deployment mutations over time',
          description: 'Track all create, update, and patch operations on deployments for rollout visibility',
          query: 'dataset="$DATASET" objectRef_resource=="deployments" verb in ("create", "update", "patch") earliest=-24h\n| timestats span=15m count() by verb, objectRef_namespace\n| order by _time desc'
        },
        {
          name: 'Recent deployment changes with initiator',
          description: 'List all deployment modifications with who performed them and the outcome',
          query: 'dataset="$DATASET" objectRef_resource=="deployments" verb in ("create", "update", "patch") earliest=-4h\n| summarize Changes=count(), LastChange=max(requestReceivedTimestamp) by objectRef_name, objectRef_namespace, user_username, verb, responseStatus_code\n| order by LastChange desc'
        },
        {
          name: 'Deployment scale operations',
          description: 'Track replica count changes to detect scaling events and capacity adjustments',
          query: 'dataset="$DATASET" objectRef_resource=="deployments" objectRef_subresource=="scale" earliest=-12h\n| summarize ScaleOps=count() by objectRef_name, objectRef_namespace, user_username, verb\n| order by ScaleOps desc'
        },
        {
          name: 'Failed deployment operations by namespace',
          description: 'Identify deployment mutations that returned errors indicating stalled rollouts',
          query: 'dataset="$DATASET" objectRef_resource in ("deployments", "replicasets") responseStatus_code >= 400 earliest=-4h\n| summarize Failures=count() by objectRef_name, objectRef_namespace, verb, responseStatus_code, responseStatus_reason\n| order by Failures desc\n| limit 25'
        }
      ]
    },
    {
      id: 'k8s-obs-005',
      name: 'Resource Quota Changes',
      objective: 'Monitor modifications to ResourceQuotas and LimitRanges to track capacity governance changes that impact workload scheduling and resource allocation across namespaces.',
      category: 'Capacity',
      tags: ['observability', 'capacity', 'resource-quota', 'limit-range', 'governance', 'kubernetes'],
      requiredFields: ['verb', 'objectRef.resource', 'objectRef.namespace', 'objectRef.name', 'user.username', 'responseStatus.code', 'requestReceivedTimestamp'],
      detectionLogic: 'Alert on all create, update, patch, and delete operations targeting resourcequotas and limitranges. Also alert when pods fail scheduling due to quota exhaustion (detected via failed pod create requests with reason "forbidden" and message containing "quota"). Track quota utilization trends by monitoring status subresource updates.',
      operationalValue: 'Resource quota changes directly impact whether workloads can be scheduled. Unauthorized quota increases can lead to resource contention and noisy-neighbor problems. Quota decreases can cause unexpected scheduling failures for existing workloads.',
      changeMgmtRelevance: 'Quota changes should be approved capacity planning decisions. Unauthorized modifications indicate governance bypass. Correlate quota changes with subsequent scheduling failures to validate capacity decisions.',
      troubleshootingWorkflow: '1. Identify which namespace quota was modified and by whom\n2. Determine the nature of the change (increase, decrease, new quota, deletion)\n3. Check if any pending workloads are now blocked by the new quota\n4. Verify the change was part of an approved capacity request\n5. Monitor for scheduling failures in the affected namespace post-change\n6. Review resource utilization in the namespace to validate the quota is appropriate',
      dashboardDependency: 'Capacity Governance Dashboard, Namespace Resource Utilization',
      criblSearchQueries: [
        {
          name: 'Resource quota modifications over time',
          description: 'Track all quota and limit range changes to maintain capacity governance audit trail',
          query: 'dataset="$DATASET" objectRef_resource in ("resourcequotas", "limitranges") verb in ("create", "update", "patch", "delete") earliest=-7d\n| timestats span=1d count() by objectRef_resource, verb\n| order by _time desc'
        },
        {
          name: 'Recent quota changes with initiator details',
          description: 'List who changed which quotas and when for change management validation',
          query: 'dataset="$DATASET" objectRef_resource in ("resourcequotas", "limitranges") verb in ("create", "update", "patch", "delete") earliest=-48h\n| summarize Changes=count(), LastModified=max(requestReceivedTimestamp) by objectRef_name, objectRef_namespace, user_username, verb, responseStatus_code\n| order by LastModified desc'
        },
        {
          name: 'Quota exhaustion events (scheduling failures)',
          description: 'Detect pod creation failures caused by resource quota limits being reached',
          query: 'dataset="$DATASET" objectRef_resource=="pods" verb=="create" responseStatus_code==403 responseStatus_reason=="Forbidden" earliest=-24h\n| where responseStatus_status contains "quota"\n| summarize QuotaBlocks=count() by objectRef_namespace, user_username\n| order by QuotaBlocks desc'
        },
        {
          name: 'Quota status updates by namespace',
          description: 'Monitor quota utilization changes to detect namespaces approaching capacity limits',
          query: 'dataset="$DATASET" objectRef_resource=="resourcequotas" objectRef_subresource=="status" earliest=-12h\n| summarize StatusUpdates=count() by objectRef_name, objectRef_namespace\n| order by StatusUpdates desc'
        }
      ]
    },
    {
      id: 'k8s-obs-006',
      name: 'Node Registration Events',
      objective: 'Track node lifecycle events including registration, deregistration, and heartbeat activity to detect cluster capacity changes, node failures, and network partitions.',
      category: 'Health',
      tags: ['observability', 'health', 'nodes', 'capacity', 'heartbeat', 'kubernetes'],
      requiredFields: ['verb', 'objectRef.resource', 'objectRef.subresource', 'objectRef.name', 'user.username', 'responseStatus.code', 'requestReceivedTimestamp'],
      detectionLogic: 'Alert when new node registrations (create verb on nodes resource) or departures (delete verb) occur outside maintenance windows. Also alert when node status update frequency (heartbeats via patch on nodes/status) drops below the expected 10-second interval for any node for more than 60 seconds, indicating a potential network partition or node failure.',
      operationalValue: 'Node lifecycle events directly impact cluster capacity and workload placement. Unexpected node departures require immediate attention to reschedule workloads. Heartbeat gaps are early indicators of node failures before pod eviction timers trigger.',
      changeMgmtRelevance: 'Node additions and removals should correlate with auto-scaling events or planned maintenance. Unexpected registrations may indicate unauthorized cluster expansion. Unplanned departures during change windows indicate failed maintenance.',
      troubleshootingWorkflow: '1. Identify which node(s) registered or departed and the timing\n2. For departures: check if the node was cordoned/drained first (graceful) or disappeared (failure)\n3. Verify auto-scaler activity if node changes are automatic\n4. For heartbeat gaps: check network connectivity to the node\n5. Review workloads that were running on departed nodes\n6. Check cloud provider instance status for the underlying VM/instance\n7. Verify kubelet logs on the affected node if accessible',
      dashboardDependency: 'Cluster Node Health Dashboard, Capacity Planning',
      criblSearchQueries: [
        {
          name: 'Node registration and departure events',
          description: 'Track node lifecycle changes to monitor cluster capacity over time',
          query: 'dataset="$DATASET" objectRef_resource=="nodes" verb in ("create", "delete") objectRef_subresource=="" earliest=-7d\n| timestats span=1h count() by verb\n| order by _time desc'
        },
        {
          name: 'Node heartbeat frequency analysis',
          description: 'Monitor kubelet heartbeat intervals to detect nodes with communication gaps',
          query: 'dataset="$DATASET" objectRef_resource=="nodes" objectRef_subresource=="status" verb=="patch" earliest=-1h\n| summarize Heartbeats=count(), LastBeat=max(requestReceivedTimestamp) by objectRef_name\n| extend AvgIntervalSec=3600.0 / Heartbeats\n| order by LastBeat asc'
        },
        {
          name: 'Recent node changes with context',
          description: 'List all node create/delete events with initiator for change management correlation',
          query: 'dataset="$DATASET" objectRef_resource=="nodes" verb in ("create", "delete") objectRef_subresource=="" earliest=-48h\n| summarize Events=count(), LastEvent=max(requestReceivedTimestamp) by objectRef_name, verb, user_username, responseStatus_code\n| order by LastEvent desc'
        },
        {
          name: 'Nodes with stale heartbeats (potential failures)',
          description: 'Identify nodes whose status updates have fallen behind expected intervals',
          query: 'dataset="$DATASET" objectRef_resource=="nodes" objectRef_subresource=="status" verb=="patch" earliest=-30m\n| summarize LastHeartbeat=max(requestReceivedTimestamp), Count=count() by objectRef_name\n| where Count < 150\n| order by Count asc'
        }
      ]
    },
    {
      id: 'k8s-obs-007',
      name: 'Watch Connection Storm',
      objective: 'Detect excessive watch connections from misbehaving controllers, operators, or client tools that overload the API server and degrade cluster performance for all consumers.',
      category: 'Performance',
      tags: ['observability', 'performance', 'watch', 'api-server', 'resource-pressure', 'kubernetes'],
      requiredFields: ['verb', 'objectRef.resource', 'objectRef.namespace', 'user.username', 'userAgent', 'sourceIPs[]', 'responseStatus.code', 'requestReceivedTimestamp'],
      detectionLogic: 'Alert when a single user.username or userAgent establishes more than 100 watch connections within a 5-minute window. Also alert when total active watch requests across the cluster exceed 2x the 1-hour baseline, or when repeated watch reconnections (same user + resource pattern) occur more than 20 times per minute indicating a crash-reconnect loop.',
      operationalValue: 'Watch connections consume API server memory and etcd resources proportional to the number of objects being watched. A misbehaving controller opening hundreds of watches can exhaust API server memory, cause OOM kills, and bring down the entire control plane.',
      changeMgmtRelevance: 'New operator installations, CRD deployments, or controller upgrades are the primary cause of watch storms. Detect immediately after deploying new controllers to validate they behave correctly.',
      troubleshootingWorkflow: '1. Identify the user/serviceAccount and userAgent creating excessive watches\n2. Determine which resources are being watched (objectRef.resource)\n3. Check if watches are being re-established rapidly (crash loop in the watcher)\n4. Verify the controller/operator pod is healthy (not in CrashLoopBackOff)\n5. Check if informer cache is working correctly (watches should be long-lived, not short-lived)\n6. Review controller RBAC — excessive watches on unauthorized resources generate immediate reconnections\n7. Consider rate-limiting or removing the problematic controller',
      dashboardDependency: 'API Server Load Dashboard, Watch Connection Monitor',
      criblSearchQueries: [
        {
          name: 'Watch connections by user agent over time',
          description: 'Track watch request volume per client to identify controllers creating excessive load',
          query: 'dataset="$DATASET" verb=="watch" earliest=-6h\n| timestats span=5m count() by userAgent\n| order by _time desc'
        },
        {
          name: 'Top watch consumers (current window)',
          description: 'Identify the users and agents with the most watch connections right now',
          query: 'dataset="$DATASET" verb=="watch" earliest=-15m\n| summarize WatchCount=count(), Resources=dcount(objectRef_resource) by user_username, userAgent\n| order by WatchCount desc\n| limit 20'
        },
        {
          name: 'Watch reconnection storm detection',
          description: 'Find clients rapidly reconnecting watches indicating a crash-reconnect loop',
          query: 'dataset="$DATASET" verb=="watch" earliest=-10m\n| summarize Connections=count() by user_username, objectRef_resource, objectRef_namespace\n| where Connections > 20\n| order by Connections desc'
        },
        {
          name: 'Watch connections by resource type and namespace',
          description: 'Break down watch load by resource to identify which objects are generating the most watch pressure',
          query: 'dataset="$DATASET" verb=="watch" earliest=-1h\n| summarize Watches=count(), UniqueWatchers=dcount(user_username) by objectRef_resource, objectRef_namespace\n| order by Watches desc\n| limit 25'
        }
      ]
    }
  ],
  'zscaler-web-logs': [
    {
      id: 'zs-obs-001',
      name: 'Bandwidth Consumption by Department',
      objective: 'Track data transfer volumes per department to identify bandwidth abuse, anomalous download patterns, or misconfigured applications generating excessive traffic through the Zscaler proxy.',
      category: 'Capacity',
      tags: ['observability', 'capacity', 'bandwidth', 'department', 'zscaler'],
      requiredFields: ['department', 'user', 'reqsize', 'respsize', 'hostname', 'urlcategory', 'action', 'contenttype'],
      detectionLogic: 'Alert when a department total data transfer (reqsize + respsize) exceeds 200% of its 7-day rolling average for the same time-of-day window. Also alert when a single user within a department consumes more than 50% of the department total bandwidth in a 1-hour window.',
      operationalValue: 'Identifies bandwidth hogs before they impact proxy capacity or trigger ISP overage charges. Enables proactive capacity planning and policy tuning for high-consumption departments.',
      changeMgmtRelevance: 'Bandwidth spikes after new SaaS application onboarding or policy changes confirm expected usage shifts. Unexpected spikes may indicate bypassed DLP controls or shadow IT adoption.',
      troubleshootingWorkflow: '1. Identify which department is consuming excessive bandwidth\n2. Drill into top users within that department\n3. Determine destination categories and hostnames driving consumption\n4. Check if traffic is legitimate business use or policy violation\n5. Review content types — large media downloads vs application data\n6. Consider bandwidth throttling policies or URL category blocks',
      dashboardDependency: 'Department Bandwidth Dashboard, User Activity Overview',
      criblSearchQueries: [
        {
          name: 'Total bandwidth by department (last 24 hours)',
          description: 'Track aggregate data transfer per department to identify top consumers',
          query: 'dataset="$DATASET" earliest=-24h\n| extend total_bytes=reqsize + respsize\n| summarize TotalBytes=sum(total_bytes), Sessions=count(), UniqueUsers=dcount(user) by department\n| order by TotalBytes desc'
        },
        {
          name: 'Department bandwidth trend over time',
          description: 'Visualize per-department consumption trends to spot anomalous spikes',
          query: 'dataset="$DATASET" earliest=-7d\n| extend total_bytes=reqsize + respsize\n| timestats span=1h Bandwidth=sum(total_bytes) by department'
        },
        {
          name: 'Top users by bandwidth within department',
          description: 'Identify individual users driving high bandwidth consumption in a specific department',
          query: 'dataset="$DATASET" department="$DEPARTMENT" earliest=-4h\n| extend total_bytes=reqsize + respsize\n| summarize UserBytes=sum(total_bytes), Sessions=count() by user, hostname\n| order by UserBytes desc\n| limit 25'
        },
        {
          name: 'Bandwidth by content type and category',
          description: 'Break down bandwidth consumption by content type and URL category to identify the nature of traffic',
          query: 'dataset="$DATASET" earliest=-4h\n| extend total_bytes=reqsize + respsize\n| summarize Bytes=sum(total_bytes), Sessions=count() by department, urlcategory, contenttype\n| order by Bytes desc\n| limit 30'
        }
      ]
    },
    {
      id: 'zs-obs-002',
      name: 'HTTP Error Rate Monitoring',
      objective: 'Monitor the rate of HTTP 4xx and 5xx response codes to detect application connectivity issues, authentication failures, or upstream service degradation visible through the Zscaler proxy.',
      category: 'Availability',
      tags: ['observability', 'availability', 'http-errors', 'response-codes', 'zscaler'],
      requiredFields: ['respcode', 'hostname', 'url', 'user', 'department', 'action', 'reqmethod'],
      detectionLogic: 'Alert when HTTP 5xx error rate exceeds 5% of total requests over a 10-minute window for any hostname, or when 4xx rate exceeds 20% for a previously healthy destination. Separate thresholds for 401/403 (auth) vs 404 (missing) vs 500/502/503 (server errors).',
      operationalValue: 'Provides early detection of upstream application failures from the client perspective. Often detects SaaS outages or internal service failures before the provider acknowledges them.',
      changeMgmtRelevance: 'HTTP error spikes after policy changes may indicate broken SSL inspection bypass rules or URL filtering blocking legitimate application API calls.',
      troubleshootingWorkflow: '1. Identify which response codes are spiking and for which destinations\n2. Separate client errors (4xx) from server errors (5xx)\n3. For 5xx: check if the upstream service is experiencing an outage\n4. For 401/403: check if authentication tokens or certificates expired\n5. For 404: check if URLs changed after an application update\n6. Correlate with Zscaler policy changes that may affect traffic inspection',
      dashboardDependency: 'HTTP Error Rate Dashboard, Application Health Monitor',
      criblSearchQueries: [
        {
          name: 'HTTP error rate by response code over time',
          description: 'Track 4xx and 5xx response trends to identify emerging application issues',
          query: 'dataset="$DATASET" respcode >= 400 earliest=-12h\n| timestats span=10m count() by respcode'
        },
        {
          name: 'Error rate percentage by destination',
          description: 'Calculate error ratios per hostname to find destinations with degraded health',
          query: 'dataset="$DATASET" earliest=-1h\n| summarize Total=count(), Errors4xx=countif(respcode >= 400 AND respcode < 500), Errors5xx=countif(respcode >= 500) by hostname\n| extend ErrorPct=round((Errors4xx + Errors5xx) * 100.0 / Total, 1)\n| where Total > 50 AND ErrorPct > 10\n| order by Errors5xx desc'
        },
        {
          name: 'Top destinations returning server errors (5xx)',
          description: 'Identify upstream services experiencing failures visible through the proxy',
          query: 'dataset="$DATASET" respcode >= 500 earliest=-4h\n| summarize ErrorCount=count(), AffectedUsers=dcount(user) by hostname, respcode, reqmethod\n| order by ErrorCount desc\n| limit 25'
        },
        {
          name: 'Users impacted by HTTP errors',
          description: 'Determine blast radius by identifying users experiencing errors for triage prioritization',
          query: 'dataset="$DATASET" respcode >= 400 earliest=-1h\n| summarize Errors=count(), UniqueHosts=dcount(hostname) by user, department, respcode\n| where Errors > 10\n| order by Errors desc\n| limit 30'
        }
      ]
    },
    {
      id: 'zs-obs-003',
      name: 'SSL Inspection Coverage',
      objective: 'Track the percentage of traffic being SSL inspected versus bypassed to ensure security policy coverage and detect configuration drift that reduces inspection visibility.',
      category: 'Health',
      tags: ['observability', 'health', 'ssl-inspection', 'coverage', 'policy', 'zscaler'],
      requiredFields: ['sslinspection', 'hostname', 'urlcategory', 'user', 'department', 'action', 'reqsize', 'respsize'],
      detectionLogic: 'Alert when SSL inspection bypass rate increases more than 10 percentage points from the 7-day baseline. Also alert when new hostnames appear in the bypass list that were previously inspected, or when total bypassed traffic volume exceeds 40% of all HTTPS traffic.',
      operationalValue: 'SSL inspection is critical for threat detection and DLP. Bypass drift creates security blind spots. Monitoring coverage ensures policy intent matches operational reality.',
      changeMgmtRelevance: 'SSL bypass policy changes should be tracked for compliance. New bypass entries after certificate pinning issues or application compatibility problems should be documented and reviewed periodically.',
      troubleshootingWorkflow: '1. Identify current inspection vs bypass ratio\n2. Determine which categories and hostnames are being bypassed\n3. Check if bypass entries are intentional (documented exceptions) or drift\n4. Review SSL inspection policy for outdated or overly broad bypass rules\n5. Verify certificate authority trust chain for inspected traffic\n6. Check for user-reported certificate errors that may have prompted undocumented bypasses',
      dashboardDependency: 'SSL Inspection Coverage Dashboard, Security Policy Compliance',
      criblSearchQueries: [
        {
          name: 'SSL inspection ratio over time',
          description: 'Track the percentage of inspected vs bypassed traffic to detect coverage drift',
          query: 'dataset="$DATASET" earliest=-7d\n| timestats span=4h count() by sslinspection'
        },
        {
          name: 'Bypass rate by URL category',
          description: 'Identify which URL categories have the highest bypass rates for policy review',
          query: 'dataset="$DATASET" earliest=-24h\n| summarize Total=count(), Bypassed=countif(sslinspection == "Bypass"), NotInspected=countif(sslinspection == "No") by urlcategory\n| extend BypassPct=round((Bypassed + NotInspected) * 100.0 / Total, 1)\n| where Total > 100\n| order by BypassPct desc'
        },
        {
          name: 'Top bypassed hostnames by traffic volume',
          description: 'Find the highest-volume destinations not being SSL inspected for risk assessment',
          query: 'dataset="$DATASET" sslinspection != "Yes" earliest=-24h\n| extend total_bytes=reqsize + respsize\n| summarize Bytes=sum(total_bytes), Sessions=count(), Users=dcount(user) by hostname, sslinspection\n| order by Bytes desc\n| limit 25'
        },
        {
          name: 'Departments with lowest inspection coverage',
          description: 'Identify departments where bypass traffic is disproportionately high',
          query: 'dataset="$DATASET" earliest=-24h\n| summarize Total=count(), Inspected=countif(sslinspection == "Yes") by department\n| extend InspectionPct=round(Inspected * 100.0 / Total, 1)\n| where Total > 200\n| order by InspectionPct asc'
        }
      ]
    },
    {
      id: 'zs-obs-004',
      name: 'Cloud Application Usage Trends',
      objective: 'Monitor usage patterns across SaaS application categories to track adoption, identify shadow IT, and support capacity planning for sanctioned cloud services.',
      category: 'Capacity',
      tags: ['observability', 'capacity', 'cloud-apps', 'saas', 'shadow-it', 'zscaler'],
      requiredFields: ['urlcategory', 'urlclass', 'hostname', 'user', 'department', 'reqsize', 'respsize', 'action'],
      detectionLogic: 'Alert when a new cloud application (hostname not seen in prior 14-day baseline) is accessed by more than 10 users within a 24-hour period. Also alert when an existing SaaS category usage increases more than 150% from its 30-day average, indicating potential license overrun or unauthorized adoption.',
      operationalValue: 'Enables IT and security teams to track SaaS sprawl, validate sanctioned application adoption, and identify unsanctioned services before they become embedded in workflows.',
      changeMgmtRelevance: 'New SaaS onboarding should show up as controlled increases in specific categories. Unexpected cloud application adoption outside procurement workflows indicates shadow IT requiring governance.',
      troubleshootingWorkflow: '1. Identify new or trending cloud applications by URL category\n2. Determine which departments and users are driving adoption\n3. Check if the application is on the sanctioned SaaS list\n4. Assess data transfer volumes to evaluate risk exposure\n5. Review URL classification accuracy — is it categorized correctly?\n6. Engage procurement if usage suggests licensing needs',
      dashboardDependency: 'Cloud Application Inventory, SaaS Usage Trends Dashboard',
      criblSearchQueries: [
        {
          name: 'Traffic volume by URL category over time',
          description: 'Track SaaS category usage trends to identify growing or declining application adoption',
          query: 'dataset="$DATASET" earliest=-30d\n| extend total_bytes=reqsize + respsize\n| timestats span=1d CategoryBytes=sum(total_bytes), UniqueUsers=dcount(user) by urlcategory'
        },
        {
          name: 'Top cloud hostnames by user count',
          description: 'Identify the most widely adopted cloud services across the organization',
          query: 'dataset="$DATASET" earliest=-7d\n| summarize Users=dcount(user), Departments=dcount(department), Sessions=count() by hostname, urlcategory\n| where Users > 5\n| order by Users desc\n| limit 30'
        },
        {
          name: 'New cloud applications (first seen recently)',
          description: 'Detect newly accessed cloud services for shadow IT identification',
          query: 'dataset="$DATASET" earliest=-24h\n| summarize Users=dcount(user), FirstAccess=min(_time), Sessions=count() by hostname, urlcategory\n| where Users > 3\n| order by FirstAccess desc\n| limit 30'
        },
        {
          name: 'Department cloud usage breakdown',
          description: 'Compare cloud application usage across departments for governance and licensing',
          query: 'dataset="$DATASET" earliest=-7d\n| extend total_bytes=reqsize + respsize\n| summarize Bytes=sum(total_bytes), Sessions=count(), UniqueApps=dcount(hostname) by department, urlcategory\n| order by Sessions desc\n| limit 40'
        }
      ]
    },
    {
      id: 'zs-obs-005',
      name: 'Proxy Latency and Performance',
      objective: 'Track response times through the Zscaler cloud to detect proxy performance degradation, datacenter congestion, or routing issues affecting user experience.',
      category: 'Performance',
      tags: ['observability', 'performance', 'latency', 'proxy', 'user-experience', 'zscaler'],
      requiredFields: ['hostname', 'user', 'department', 'location', 'cloudname', 'reqsize', 'respsize', 'respcode'],
      detectionLogic: 'Alert when average response size delivery time (approximated by respsize relative to session count) for a Zscaler datacenter degrades more than 50% from its 4-hour rolling baseline. Also alert when a specific location shows latency divergence from other locations accessing the same destinations.',
      operationalValue: 'Proxy latency directly impacts user productivity and application responsiveness. Early detection enables traffic steering adjustments or support escalation to Zscaler before widespread user complaints.',
      changeMgmtRelevance: 'Latency increases after policy changes (enabling SSL inspection for new categories, adding DLP scanning) are expected but should be quantified. Unexpected latency from infrastructure changes requires investigation.',
      troubleshootingWorkflow: '1. Identify which Zscaler datacenter(s) are experiencing degradation\n2. Determine if latency is affecting all destinations or specific ones\n3. Check if specific locations are impacted (routing issue vs datacenter issue)\n4. Review recent policy changes that add inspection overhead\n5. Check Zscaler status page for known incidents\n6. Consider GRE/IPSec tunnel health if using dedicated connectivity',
      dashboardDependency: 'Proxy Performance Dashboard, Location Health Overview',
      criblSearchQueries: [
        {
          name: 'Average response size by datacenter over time',
          description: 'Track throughput efficiency across Zscaler datacenters as a proxy latency indicator',
          query: 'dataset="$DATASET" earliest=-12h\n| timestats span=15m AvgRespSize=avg(respsize), Sessions=count() by cloudname'
        },
        {
          name: 'Performance comparison by location',
          description: 'Compare response patterns across office locations to identify site-specific issues',
          query: 'dataset="$DATASET" earliest=-4h\n| summarize AvgRespSize=avg(respsize), Sessions=count(), ErrorRate=countif(respcode >= 500) * 100.0 / count() by location, cloudname\n| order by ErrorRate desc'
        },
        {
          name: 'Slow destinations by hostname',
          description: 'Identify specific destinations with consistently poor performance through the proxy',
          query: 'dataset="$DATASET" earliest=-2h\n| summarize AvgResp=avg(respsize), Sessions=count(), Users=dcount(user) by hostname\n| where Sessions > 50\n| order by AvgResp desc\n| limit 25'
        },
        {
          name: 'Session volume and throughput per datacenter',
          description: 'Monitor Zscaler datacenter load distribution for capacity planning',
          query: 'dataset="$DATASET" earliest=-24h\n| extend total_bytes=reqsize + respsize\n| summarize TotalBytes=sum(total_bytes), Sessions=count(), UniqueUsers=dcount(user) by cloudname, location\n| order by TotalBytes desc'
        }
      ]
    },
    {
      id: 'zs-obs-006',
      name: 'Policy Block Rate Trends',
      objective: 'Monitor block rates by rule and URL category to detect policy drift, overly aggressive rules impacting productivity, or declining block rates that may indicate policy erosion.',
      category: 'Health',
      tags: ['observability', 'health', 'policy', 'block-rate', 'compliance', 'zscaler'],
      requiredFields: ['action', 'rulelabel', 'ruletype', 'urlcategory', 'hostname', 'user', 'department'],
      detectionLogic: 'Alert when overall block rate drops below 5% of total requests (policy erosion) or rises above 30% (overly restrictive). Also alert when a specific rule block count changes more than 100% from its 7-day baseline, indicating either new traffic hitting the rule or policy drift.',
      operationalValue: 'Block rate trends reveal whether security policies are actively protecting users or have drifted into irrelevance. Rising blocks may indicate emerging threats or user frustration; falling blocks may indicate bypasses or policy gaps.',
      changeMgmtRelevance: 'Block rate changes directly correlate with policy modifications. After rule changes, validate that block rates moved in the expected direction and magnitude.',
      troubleshootingWorkflow: '1. Identify which rules or categories show block rate changes\n2. Determine if the change is more blocks (new threat/policy) or fewer blocks (policy erosion)\n3. Review blocked users and destinations for false positive assessment\n4. Check if users are finding workarounds (proxy avoidance, alternate URLs)\n5. Validate rule intent against current block behavior\n6. Review exception requests that may have inadvertently broadened bypass rules',
      dashboardDependency: 'Policy Effectiveness Dashboard, Block Rate Trends',
      criblSearchQueries: [
        {
          name: 'Block rate by rule over time',
          description: 'Track how each policy rule block count trends to detect policy drift',
          query: 'dataset="$DATASET" action == "Blocked" earliest=-7d\n| timestats span=4h count() by rulelabel'
        },
        {
          name: 'Overall action distribution',
          description: 'Monitor the balance of allowed vs blocked vs cautioned traffic for policy health',
          query: 'dataset="$DATASET" earliest=-24h\n| summarize count() by action\n| extend Pct=round(count_ * 100.0 / sum(count_), 1)\n| order by count_ desc'
        },
        {
          name: 'Top blocked categories and hostnames',
          description: 'Identify what is being blocked most frequently for false positive review',
          query: 'dataset="$DATASET" action == "Blocked" earliest=-24h\n| summarize Blocks=count(), AffectedUsers=dcount(user) by urlcategory, hostname, rulelabel\n| order by Blocks desc\n| limit 30'
        },
        {
          name: 'Departments with highest block rates',
          description: 'Identify departments experiencing the most policy blocks for user experience assessment',
          query: 'dataset="$DATASET" earliest=-24h\n| summarize Total=count(), Blocked=countif(action == "Blocked") by department\n| extend BlockPct=round(Blocked * 100.0 / Total, 1)\n| where Total > 200\n| order by BlockPct desc'
        }
      ]
    },
    {
      id: 'zs-obs-007',
      name: 'Location-Based Traffic Distribution',
      objective: 'Track traffic distribution across Zscaler cloud datacenters and office locations to identify capacity imbalances, routing inefficiencies, or location-specific connectivity issues.',
      category: 'Capacity',
      tags: ['observability', 'capacity', 'location', 'datacenter', 'traffic-distribution', 'zscaler'],
      requiredFields: ['location', 'cloudname', 'user', 'department', 'reqsize', 'respsize', 'action', 'hostname'],
      detectionLogic: 'Alert when traffic from a location shifts more than 40% between Zscaler datacenters compared to its 7-day baseline (indicates routing change or failover). Also alert when a location volume drops more than 70% (office closure, WAN failure) or spikes more than 200% (VPN split-tunnel change driving more traffic through proxy).',
      operationalValue: 'Traffic distribution monitoring ensures optimal user experience by validating that locations route to their nearest Zscaler datacenter. Imbalances indicate routing issues, failovers, or capacity problems requiring intervention.',
      changeMgmtRelevance: 'Network infrastructure changes (WAN routing, GRE/IPSec tunnel modifications, PAC file updates) should result in predictable traffic redistribution. Unexpected shifts indicate misconfiguration.',
      troubleshootingWorkflow: '1. Identify which location(s) show traffic distribution changes\n2. Determine if traffic shifted between datacenters (routing) or changed in volume (connectivity)\n3. Check GRE/IPSec tunnel health for affected locations\n4. Verify PAC file or forwarding profile configuration\n5. Check for ISP issues affecting the primary path to Zscaler\n6. Review Zscaler datacenter status for capacity or maintenance events',
      dashboardDependency: 'Location Traffic Map, Datacenter Load Distribution Dashboard',
      criblSearchQueries: [
        {
          name: 'Traffic volume by location and datacenter',
          description: 'Map traffic distribution across locations and their assigned Zscaler datacenters',
          query: 'dataset="$DATASET" earliest=-24h\n| extend total_bytes=reqsize + respsize\n| summarize TotalBytes=sum(total_bytes), Sessions=count(), Users=dcount(user) by location, cloudname\n| order by TotalBytes desc'
        },
        {
          name: 'Location traffic trend over time',
          description: 'Visualize per-location traffic volume to detect drops or spikes indicating connectivity changes',
          query: 'dataset="$DATASET" earliest=-7d\n| extend total_bytes=reqsize + respsize\n| timestats span=4h LocationBytes=sum(total_bytes), ActiveUsers=dcount(user) by location'
        },
        {
          name: 'Datacenter load distribution over time',
          description: 'Monitor how traffic load is balanced across Zscaler cloud datacenters',
          query: 'dataset="$DATASET" earliest=-48h\n| timestats span=2h Sessions=count(), Locations=dcount(location) by cloudname'
        },
        {
          name: 'Locations with traffic anomalies (current vs baseline)',
          description: 'Find locations whose current traffic deviates significantly from recent patterns',
          query: 'dataset="$DATASET" earliest=-1h\n| extend total_bytes=reqsize + respsize\n| summarize CurrentBytes=sum(total_bytes), CurrentSessions=count(), CurrentUsers=dcount(user) by location, cloudname\n| where CurrentSessions < 10\n| order by CurrentSessions asc'
        }
      ]
    }
  ],
  'infoblox-dns': [
    {
      id: 'ib-obs-001',
      name: 'Resolver Query Latency',
      objective: 'Track DNS resolution response times across Infoblox Grid members to detect degradation in resolver performance before it impacts dependent services.',
      category: 'Performance',
      tags: ['observability', 'performance', 'latency', 'dns', 'infoblox'],
      requiredFields: ['response_time_ms', 'member_name', 'query_name', 'query_type', 'client_ip', 'response_code', 'recursion', 'view'],
      detectionLogic: 'Alert when average response_time_ms exceeds 150ms over a 5-minute window per Grid member, or when P95 latency exceeds 500ms. Compare against 7-day rolling baseline for same time-of-day window. Separate recursive vs authoritative latency thresholds. Evaluate per member_name and per view.',
      operationalValue: 'DNS latency directly impacts every application and user experience. Detecting resolver performance degradation early prevents cascading failures across dependent services and enables proactive Grid rebalancing.',
      changeMgmtRelevance: 'Latency increases after Grid configuration changes (new forwarders, RPZ policy updates, DNSSEC enablement, member restarts) indicate misconfiguration or capacity issues requiring investigation.',
      troubleshootingWorkflow: '1. Identify affected Grid member(s) and scope of latency increase\n2. Determine if latency is on recursive or authoritative queries\n3. Check member resource utilization (CPU, memory, cache hit ratio)\n4. Verify upstream forwarder health and reachability\n5. Check if RPZ or DNSSEC processing is adding delay\n6. Review recent Grid configuration changes or member restarts\n7. Check network path between clients and the affected member',
      dashboardDependency: 'Grid Performance Dashboard, Member Health Overview',
      criblSearchQueries: [
        {
          name: 'Average response time per Grid member',
          description: 'Track query latency across all Grid members to identify degraded resolvers',
          query: 'dataset="$DATASET" earliest=-4h\n| summarize AvgLatency=avg(response_time_ms), P95=max(response_time_ms), MaxLatency=max(response_time_ms), Queries=count() by member_name\n| order by AvgLatency desc'
        },
        {
          name: 'Latency trend over time by member',
          description: 'Visualize DNS response time trends per Grid member to spot degradation onset',
          query: 'dataset="$DATASET" earliest=-12h\n| timestats span=5m AvgLatency=avg(response_time_ms), P95=max(response_time_ms) by member_name'
        },
        {
          name: 'Slow queries — domains with high resolution time',
          description: 'Find specific domains with consistently high resolution times indicating upstream issues',
          query: 'dataset="$DATASET" response_time_ms > 200 earliest=-1h\n| summarize AvgLatency=avg(response_time_ms), Queries=count() by query_name, member_name\n| where Queries > 5\n| order by AvgLatency desc\n| limit 25'
        },
        {
          name: 'Recursive vs authoritative latency comparison',
          description: 'Compare latency for authoritative zone queries vs recursive resolution to isolate the problem layer',
          query: 'dataset="$DATASET" earliest=-4h\n| extend resolution_type=iif(recursion == "true", "Recursive", "Authoritative")\n| summarize AvgLatency=avg(response_time_ms), P95=max(response_time_ms), Count=count() by resolution_type, member_name\n| order by AvgLatency desc'
        }
      ]
    },
    {
      id: 'ib-obs-002',
      name: 'SERVFAIL Rate Monitoring',
      objective: 'Monitor SERVFAIL responses across the Infoblox Grid indicating resolver failures, upstream connectivity issues, or misconfigured forwarding zones.',
      category: 'Availability',
      tags: ['observability', 'availability', 'resolution-failure', 'dns', 'infoblox'],
      requiredFields: ['response_code', 'member_name', 'query_name', 'client_ip', 'view', 'zone', 'recursion'],
      detectionLogic: 'Alert when SERVFAIL responses exceed 5% of total responses over a 10-minute window per Grid member, or when SERVFAIL count exceeds 3x the 7-day baseline for the same time window. Evaluate per member_name and per view to isolate scope.',
      operationalValue: 'SERVFAIL indicates the resolver attempted but could not resolve the query. Unlike NXDOMAIN, SERVFAIL signals an infrastructure problem — upstream unreachable, forwarding misconfiguration, or DNSSEC validation failure — requiring immediate attention.',
      changeMgmtRelevance: 'SERVFAIL spikes after changes to forwarding zones, Grid member restarts, RPZ policy updates, or network routing changes indicate broken resolution paths that need rollback.',
      troubleshootingWorkflow: '1. Identify which Grid member(s) are returning SERVFAIL\n2. Determine if failures are for specific zones or all recursive queries\n3. Check forwarding zone configuration and upstream server health\n4. Test resolution manually from the affected member (dig @member)\n5. Verify DNSSEC trust anchors are current\n6. Check network connectivity from the member to upstream forwarders\n7. Review Grid DNS configuration changes in the Infoblox audit log',
      dashboardDependency: 'DNS Response Code Dashboard, Grid Availability Monitor',
      criblSearchQueries: [
        {
          name: 'SERVFAIL rate by Grid member',
          description: 'Show SERVFAIL percentage per member to identify the problem scope',
          query: 'dataset="$DATASET" earliest=-4h\n| summarize Total=count(), ServFail=countif(response_code == "SERVFAIL") by member_name\n| extend ServFailPct=round(ServFail * 100.0 / Total, 2)\n| order by ServFailPct desc'
        },
        {
          name: 'SERVFAIL trend over time',
          description: 'Visualize when SERVFAIL responses started spiking across the Grid',
          query: 'dataset="$DATASET" response_code=="SERVFAIL" earliest=-12h\n| timestats span=5m count() by member_name'
        },
        {
          name: 'Domains causing SERVFAIL responses',
          description: 'Identify which domains are failing to resolve — points to upstream or zone issues',
          query: 'dataset="$DATASET" response_code=="SERVFAIL" earliest=-1h\n| summarize FailCount=count(), AffectedClients=dcount(client_ip) by query_name, zone, member_name\n| order by FailCount desc\n| limit 25'
        },
        {
          name: 'SERVFAIL by view and zone',
          description: 'Isolate whether failures are scoped to a specific DNS view or zone configuration',
          query: 'dataset="$DATASET" response_code=="SERVFAIL" earliest=-4h\n| summarize Failures=count(), UniqueQueries=dcount(query_name) by view, zone, member_name\n| order by Failures desc'
        }
      ]
    },
    {
      id: 'ib-obs-003',
      name: 'Query Volume by Grid Member',
      objective: 'Track query distribution and load across Infoblox Grid members to detect capacity imbalances, overloaded members, or members not receiving expected traffic.',
      category: 'Capacity',
      tags: ['observability', 'capacity', 'load-balancing', 'grid', 'dns', 'infoblox'],
      requiredFields: ['member_name', 'client_ip', 'query_name', 'query_type', 'protocol', 'view', 'network_view'],
      detectionLogic: 'Alert when query volume for any Grid member deviates more than 50% from the fleet average within a 15-minute window, or when a single member handles more than 60% of total Grid queries. Also alert when a member drops to zero queries (potential outage). Use day-of-week adjusted baselines.',
      operationalValue: 'Uneven query distribution indicates DNS load balancing failures, anycast routing issues, or Grid member health problems. Detecting imbalances early prevents individual member exhaustion and enables proactive capacity management.',
      changeMgmtRelevance: 'Query volume shifts after Grid topology changes, anycast routing updates, DHCP scope modifications, or network changes redirecting clients should be expected. Unexpected shifts warrant investigation.',
      troubleshootingWorkflow: '1. Identify which member(s) are over or under-loaded\n2. Determine if the imbalance is gradual (capacity growth) or sudden (routing change)\n3. Check anycast or load balancer health if used for DNS distribution\n4. Verify DHCP is handing out correct DNS server addresses\n5. Check if a member is down or unreachable (zero traffic)\n6. Review client subnet distribution to understand traffic sources\n7. Evaluate if Grid rebalancing or additional members are needed',
      dashboardDependency: 'Grid Capacity Dashboard, Member Load Distribution',
      criblSearchQueries: [
        {
          name: 'Query volume per Grid member over time',
          description: 'Track query rates per member to identify load imbalances and trends',
          query: 'dataset="$DATASET" earliest=-24h\n| timestats span=15m count() by member_name'
        },
        {
          name: 'Member load distribution (current window)',
          description: 'Calculate the percentage of total queries handled by each member',
          query: 'dataset="$DATASET" earliest=-1h\n| summarize Queries=count(), UniqueClients=dcount(client_ip) by member_name\n| order by Queries desc'
        },
        {
          name: 'Query type and protocol breakdown per member',
          description: 'Understand the nature of load on each member — UDP vs TCP, query types',
          query: 'dataset="$DATASET" earliest=-4h\n| summarize count() by member_name, query_type, protocol\n| order by member_name asc, count_ desc'
        },
        {
          name: 'Client distribution across members',
          description: 'See which client subnets are querying which members for load balancing analysis',
          query: 'dataset="$DATASET" earliest=-1h\n| extend client_subnet=replace_regex(client_ip, "\\\\.[0-9]+$", ".0/24")\n| summarize Queries=count(), UniqueClients=dcount(client_ip) by member_name, client_subnet\n| order by Queries desc\n| limit 30'
        }
      ]
    },
    {
      id: 'ib-obs-004',
      name: 'NXDOMAIN Rate Trending',
      objective: 'Monitor NXDOMAIN response percentage as an infrastructure health indicator, detecting misconfigured applications, stale DNS records, or decommissioned services still being referenced.',
      category: 'Health',
      tags: ['observability', 'health', 'nxdomain', 'dns', 'infrastructure', 'infoblox'],
      requiredFields: ['response_code', 'query_name', 'client_ip', 'member_name', 'view', 'query_type'],
      detectionLogic: 'Alert when NXDOMAIN rate exceeds 15% of total queries over a 15-minute window (baseline-adjusted), or when NXDOMAIN count for a specific domain exceeds 50 per minute from multiple clients. Differentiate between expected NXDOMAIN (random subdomain, anti-spam lookups) and unexpected NXDOMAIN (previously valid domains).',
      operationalValue: 'Elevated NXDOMAIN rates often signal misconfigured applications pointing to decommissioned hosts, stale CNAME records, or DNS zone delegation failures. Trending this metric surfaces infrastructure hygiene issues that accumulate over time.',
      changeMgmtRelevance: 'NXDOMAIN spikes after server decommissions, DNS zone migrations, or domain name changes confirm that dependent systems were not fully updated. Useful as a validation metric for infrastructure retirements.',
      troubleshootingWorkflow: '1. Identify the domains generating NXDOMAIN responses\n2. Determine if these domains previously existed (decommissioned vs never-existed)\n3. Identify the clients making these queries (which applications/services)\n4. Check if a DNS zone was accidentally deleted or delegated incorrectly\n5. Verify CNAME chains are not pointing to removed records\n6. For legitimate NXDOMAINs, consider deploying NXDOMAIN redirect or negative caching tuning',
      dashboardDependency: 'DNS Health Indicators Dashboard, Infrastructure Hygiene Scorecard',
      criblSearchQueries: [
        {
          name: 'NXDOMAIN rate by Grid member over time',
          description: 'Track NXDOMAIN percentage trends to detect infrastructure health degradation',
          query: 'dataset="$DATASET" earliest=-12h\n| summarize Total=count(), NXDomain=countif(response_code == "NXDOMAIN") by member_name, bin(_time, 15m)\n| extend NXDomainPct=round(NXDomain * 100.0 / Total, 2)\n| order by _time desc'
        },
        {
          name: 'Top NXDOMAIN domains',
          description: 'Identify which non-existent domains are being queried most frequently',
          query: 'dataset="$DATASET" response_code=="NXDOMAIN" earliest=-1h\n| summarize Queries=count(), UniqueClients=dcount(client_ip) by query_name\n| order by Queries desc\n| limit 25'
        },
        {
          name: 'Clients generating high NXDOMAIN volume',
          description: 'Find clients with misconfigured DNS settings or applications querying stale records',
          query: 'dataset="$DATASET" response_code=="NXDOMAIN" earliest=-1h\n| summarize NXCount=count(), UniqueDomains=dcount(query_name) by client_ip\n| where NXCount > 50\n| order by NXCount desc\n| limit 20'
        },
        {
          name: 'NXDOMAIN vs total response code distribution',
          description: 'Context view showing NXDOMAIN rate relative to all other response codes',
          query: 'dataset="$DATASET" earliest=-4h\n| timestats span=15m count() by response_code'
        }
      ]
    },
    {
      id: 'ib-obs-005',
      name: 'Zone Transfer Health',
      objective: 'Track zone transfer (AXFR/IXFR) success and failures between primary and secondary Grid members to ensure zone consistency across the Grid.',
      category: 'Availability',
      tags: ['observability', 'availability', 'zone-transfer', 'replication', 'dns', 'infoblox'],
      requiredFields: ['query_type', 'response_code', 'zone', 'member_name', 'server_ip', 'client_ip', 'protocol'],
      detectionLogic: 'Alert when zone transfer queries (query_type AXFR or IXFR) receive non-NOERROR responses, or when expected periodic zone transfers are not observed within their expected interval (SOA refresh timer + retry). Alert when any zone has no successful transfer in 24 hours between known primary/secondary pairs.',
      operationalValue: 'Failed zone transfers cause primary/secondary inconsistency — clients querying the secondary get stale or missing records. This is a silent failure that can persist for days before users notice resolution discrepancies.',
      changeMgmtRelevance: 'Zone transfer failures after TSIG key rotations, ACL changes, zone configuration updates, or member additions indicate authentication or authorization misconfigurations requiring immediate correction.',
      troubleshootingWorkflow: '1. Identify which zones are failing to transfer\n2. Determine if the failure is AXFR (full) or IXFR (incremental)\n3. Check response code — REFUSED indicates ACL/TSIG issue, SERVFAIL indicates zone load issue\n4. Verify TSIG key configuration matches between primary and secondary\n5. Check allow-transfer ACLs on the primary\n6. Verify network connectivity on TCP port 53 between members\n7. Check zone file integrity on the primary member',
      dashboardDependency: 'Zone Transfer Health Dashboard, Grid Replication Status',
      criblSearchQueries: [
        {
          name: 'Zone transfer activity by zone and member',
          description: 'Track all AXFR/IXFR activity to monitor replication health',
          query: 'dataset="$DATASET" query_type in ("AXFR", "IXFR") earliest=-24h\n| summarize Transfers=count(), Failures=countif(response_code != "NOERROR") by zone, member_name, query_type\n| extend FailPct=round(Failures * 100.0 / Transfers, 1)\n| order by Failures desc'
        },
        {
          name: 'Zone transfer failures over time',
          description: 'Visualize when zone transfer failures started occurring',
          query: 'dataset="$DATASET" query_type in ("AXFR", "IXFR") response_code != "NOERROR" earliest=-48h\n| timestats span=1h count() by zone, response_code'
        },
        {
          name: 'Zone transfer response code breakdown',
          description: 'Identify the failure mode — REFUSED vs SERVFAIL vs NOTAUTH points to different root causes',
          query: 'dataset="$DATASET" query_type in ("AXFR", "IXFR") earliest=-24h\n| summarize count() by response_code, zone, member_name\n| order by count_ desc'
        },
        {
          name: 'Zones with no recent successful transfer',
          description: 'Find zones that may have stale data on secondaries due to transfer failures',
          query: 'dataset="$DATASET" query_type in ("AXFR", "IXFR") response_code=="NOERROR" earliest=-48h\n| summarize LastSuccess=max(_time), SuccessCount=count() by zone, member_name\n| where LastSuccess < ago(24h)\n| order by LastSuccess asc'
        }
      ]
    },
    {
      id: 'ib-obs-006',
      name: 'Top Queried Domains',
      objective: 'Identify hotspot domains consuming disproportionate resolver resources, enabling capacity planning, caching optimization, and detection of misconfigured applications.',
      category: 'Capacity',
      tags: ['observability', 'capacity', 'top-domains', 'resource-utilization', 'dns', 'infoblox'],
      requiredFields: ['query_name', 'client_ip', 'member_name', 'query_type', 'response_code', 'query_count'],
      detectionLogic: 'Alert when a single domain accounts for more than 10% of total query volume within a 15-minute window, or when query volume for any domain exceeds 5x its 7-day baseline. Also flag domains queried by a single client at rates exceeding 100 queries per minute (stuck resolver loop).',
      operationalValue: 'Hotspot domains stress cache capacity and resolver resources. Identifying them enables targeted caching policy optimization, reveals misconfigured applications with broken retry logic, and informs capacity planning decisions.',
      changeMgmtRelevance: 'New application deployments or service migrations can suddenly create domain hotspots. Detecting these post-change validates deployment health and identifies applications needing local DNS caching.',
      troubleshootingWorkflow: '1. Identify the hotspot domain(s) and their query volume\n2. Determine if traffic is from many clients (legitimate popular domain) or few (misconfigured app)\n3. Check TTL values on the domain — low TTL = more queries expected\n4. Verify client-side caching is working (repeated queries from same client = broken cache)\n5. Consider deploying a local caching tier or adjusting minimum TTL\n6. For single-client hotspots, investigate the application for retry storms',
      dashboardDependency: 'Top Domains Dashboard, Cache Efficiency Analysis',
      criblSearchQueries: [
        {
          name: 'Top queried domains (last hour)',
          description: 'Identify the most frequently queried domains consuming resolver resources',
          query: 'dataset="$DATASET" earliest=-1h\n| summarize Queries=count(), UniqueClients=dcount(client_ip), Members=dcount(member_name) by query_name\n| order by Queries desc\n| limit 25'
        },
        {
          name: 'Domain query volume over time',
          description: 'Track query trends for top domains to identify sudden hotspot emergence',
          query: 'dataset="$DATASET" earliest=-12h\n| summarize Queries=count() by query_name, bin(_time, 15m)\n| order by Queries desc\n| limit 100'
        },
        {
          name: 'Single-client domain hotspots (stuck resolver detection)',
          description: 'Find domains being hammered by a single client indicating broken application caching',
          query: 'dataset="$DATASET" earliest=-15m\n| summarize Queries=count() by client_ip, query_name\n| where Queries > 100\n| order by Queries desc\n| limit 25'
        },
        {
          name: 'Domain query distribution by response code',
          description: 'See if hotspot domains are resolving successfully or generating errors',
          query: 'dataset="$DATASET" earliest=-1h\n| summarize count() by query_name, response_code\n| order by count_ desc\n| limit 30'
        }
      ]
    },
    {
      id: 'ib-obs-007',
      name: 'DNSSEC Validation Failures',
      objective: 'Monitor DNSSEC validation failures indicating misconfigured trust anchors, expired signatures, or potential DNS spoofing attempts targeting DNSSEC-protected zones.',
      category: 'Health',
      tags: ['observability', 'health', 'dnssec', 'validation', 'security', 'dns', 'infoblox'],
      requiredFields: ['dnssec_validated', 'response_code', 'query_name', 'member_name', 'client_ip', 'zone', 'query_type'],
      detectionLogic: 'Alert when DNSSEC validation failures (dnssec_validated == "false" for DNSSEC-enabled zones, or SERVFAIL responses on domains that previously validated successfully) exceed 1% of queries to DNSSEC-signed zones within a 10-minute window. Also alert on any SERVFAIL response for a zone that was previously resolving with valid DNSSEC.',
      operationalValue: 'DNSSEC validation failures mean either the zone operator let their signatures expire (external dependency issue), trust anchors are misconfigured on the Grid (internal issue), or an active attack is being blocked. Each scenario requires different response but all demand immediate attention.',
      changeMgmtRelevance: 'DNSSEC validation failures after trust anchor updates, Grid upgrades, or NTP configuration changes indicate time synchronization issues or key management problems. KSK rollovers at zone operators also trigger this.',
      troubleshootingWorkflow: '1. Identify which zones/domains are failing DNSSEC validation\n2. Determine if failures are for internal zones (Grid config issue) or external zones (upstream issue)\n3. Check DNSSEC trust anchor configuration on the Grid\n4. Verify NTP synchronization — clock skew causes signature validation failures\n5. Use dig +dnssec to manually validate the chain of trust\n6. Check if the zone operator performed a KSK rollover without RFC 5011 support\n7. Review DNSSEC validation policy — consider adding negative trust anchors for known-broken zones',
      dashboardDependency: 'DNSSEC Health Dashboard, Validation Failure Analysis',
      criblSearchQueries: [
        {
          name: 'DNSSEC validation failure rate by member',
          description: 'Track validation failure percentage per Grid member to identify scope',
          query: 'dataset="$DATASET" earliest=-4h\n| where dnssec_validated != ""\n| summarize Total=count(), Failures=countif(dnssec_validated == "false") by member_name\n| extend FailPct=round(Failures * 100.0 / Total, 2)\n| where Failures > 0\n| order by FailPct desc'
        },
        {
          name: 'DNSSEC failure trend over time',
          description: 'Visualize when DNSSEC validation failures began to identify triggering event',
          query: 'dataset="$DATASET" dnssec_validated=="false" earliest=-24h\n| timestats span=15m count() by member_name'
        },
        {
          name: 'Domains failing DNSSEC validation',
          description: 'Identify which specific domains have broken DNSSEC chains',
          query: 'dataset="$DATASET" dnssec_validated=="false" earliest=-4h\n| summarize Failures=count(), AffectedClients=dcount(client_ip) by query_name, zone, member_name\n| order by Failures desc\n| limit 25'
        },
        {
          name: 'DNSSEC validation status distribution',
          description: 'Overall view of DNSSEC validation health across all zones',
          query: 'dataset="$DATASET" earliest=-1h\n| where dnssec_validated != ""\n| summarize count() by dnssec_validated, member_name\n| order by member_name asc, count_ desc'
        }
      ]
    }
  ],
  'linux-auditd': [
  {
    id: 'obs-linux-aud-001',
    name: 'Audit Log Volume Spike',
    objective: 'Detect sudden increases in audit event volume that may indicate a runaway process, misconfigured audit rule, or underlying system issue generating excessive noise.',
    severity: 'Medium',
    category: 'Availability',
    tags: ['observability', 'availability', 'volume', 'audit-health', 'noise-detection'],
    requiredFields: ['type', 'timestamp', 'serial', 'hostname', 'key'],
    detectionLogic: 'Alert when audit event volume exceeds 300% of the rolling 24-hour baseline in a 5-minute window. Evaluate per-host to isolate the affected system. Break down by audit event type and key to identify the specific rule or subsystem generating the spike.',
    operationalValue: 'Volume spikes degrade auditd performance and can cause backlog overflows (event loss). Early detection prevents observability gaps and identifies misconfigured rules before they impact system performance or fill disk.',
    changeMgmtRelevance: 'Correlate with audit rule deployments and system changes. New or modified audit rules often cause volume explosions if watch paths are too broad or syscall filters are missing.',
    troubleshootingWorkflow: '1. Identify the affected hostname and time window of the spike\n2. Break down volume by audit event type (SYSCALL, PATH, CWD, EXECVE) to find the dominant contributor\n3. Check the key field — if populated, it identifies which audit rule is generating events\n4. Look at comm/exe fields for the top processes generating syscalls\n5. Check if an audit rule change was deployed recently (aureport --config)\n6. Determine if the spike is transient (process completed) or sustained (rule misconfiguration requiring fix)',
    dashboardDependency: 'Audit Event Volume dashboard, Audit Rule Utilization dashboard',
    criblSearchQueries: [
      {
        name: 'Audit event volume by host (last 12 hours)',
        description: 'Visualize audit event rate per host to identify volume spikes and affected systems',
        query: 'dataset="$DATASET" earliest=-12h\n| timestats span=5m count() by hostname'
      },
      {
        name: 'Volume breakdown by event type and key during spike',
        description: 'Identify which audit rules and event types are driving the volume increase',
        query: 'dataset="$DATASET" earliest=-1h\n| summarize EventCount=count() by hostname, type, key\n| where EventCount > 1000\n| order by EventCount desc\n| limit 50'
      },
      {
        name: 'Top processes generating audit events',
        description: 'Find the specific processes responsible for excessive audit activity',
        query: 'dataset="$DATASET" earliest=-1h\n| where type == "SYSCALL"\n| summarize SyscallCount=count() by hostname, comm, exe, key\n| where SyscallCount > 500\n| order by SyscallCount desc\n| limit 30'
      }
    ]
  },
  {
    id: 'obs-linux-aud-002',
    name: 'High Syscall Failure Rate',
    objective: 'Detect elevated rates of failed system calls indicating application issues, permission problems, or resource exhaustion across monitored hosts.',
    severity: 'Medium',
    category: 'Performance',
    tags: ['observability', 'performance', 'syscall', 'application-health', 'errors'],
    requiredFields: ['type', 'timestamp', 'syscall', 'success', 'exit', 'comm', 'exe', 'pid', 'uid', 'hostname'],
    detectionLogic: 'Alert when the ratio of failed syscalls (success="no") to total syscalls exceeds 25% over a 15-minute window for any process, or when absolute failed syscall count exceeds 1000/min per host. Evaluate per-process (comm/exe) to isolate the culprit.',
    operationalValue: 'Syscall failures are leading indicators of application degradation — permission denied (EACCES), file not found (ENOENT), too many open files (EMFILE), and resource exhaustion all surface here before user-facing impact.',
    changeMgmtRelevance: 'New deployments, permission changes, and filesystem modifications commonly cause syscall failure spikes. Correlate with deployment windows and privilege changes.',
    troubleshootingWorkflow: '1. Identify the host and process (comm/exe) with elevated failure rates\n2. Examine the exit code to determine the failure reason (e.g., -13=EACCES, -2=ENOENT, -24=EMFILE)\n3. Check the syscall number to understand what operation is failing (open, connect, stat, etc.)\n4. Look at uid/euid to determine if this is a permission issue\n5. Check if the failure rate is increasing (trending) or stable (chronic misconfiguration)\n6. Correlate with recent changes — was there a deployment, permission change, or filesystem modification?',
    dashboardDependency: 'Syscall Health dashboard, Application Error Rate dashboard',
    criblSearchQueries: [
      {
        name: 'Syscall failure rate by host and process (last 4 hours)',
        description: 'Calculate the failure ratio per process to identify applications with systemic issues',
        query: 'dataset="$DATASET" type=="SYSCALL" earliest=-4h\n| summarize Total=count(), Failures=countif(success == "no") by hostname, comm, exe\n| extend FailRate=round(Failures * 100.0 / Total, 1)\n| where FailRate > 15 and Total > 100\n| order by FailRate desc'
      },
      {
        name: 'Failed syscalls by exit code (last 1 hour)',
        description: 'Break down failures by error code to understand the dominant failure mode',
        query: 'dataset="$DATASET" type=="SYSCALL" success=="no" earliest=-1h\n| summarize FailCount=count() by hostname, comm, exit, syscall\n| where FailCount > 50\n| order by FailCount desc\n| limit 40'
      },
      {
        name: 'Syscall failure trend over time',
        description: 'Visualize whether failure rates are increasing, stable, or transient',
        query: 'dataset="$DATASET" type=="SYSCALL" earliest=-12h\n| extend failed=iif(success == "no", 1, 0)\n| timestats span=15m Total=count(), Failures=sum(failed) by hostname\n| extend FailPct=round(Failures * 100.0 / Total, 1)'
      }
    ]
  },
  {
    id: 'obs-linux-aud-003',
    name: 'Process Execution Rate Anomaly',
    objective: 'Detect abnormal rates of process creation (fork/exec) that may indicate fork bombs, runaway scripts, infinite restart loops, or CI/CD pipeline issues.',
    severity: 'High',
    category: 'Performance',
    tags: ['observability', 'performance', 'process-creation', 'fork-bomb', 'runaway'],
    requiredFields: ['type', 'timestamp', 'syscall', 'comm', 'exe', 'ppid', 'pid', 'uid', 'hostname'],
    detectionLogic: 'Alert when EXECVE event count exceeds 500% of the rolling 1-hour baseline per host, or when a single parent PID (ppid) spawns more than 100 child processes within a 5-minute window. Track exec rate per uid to identify the responsible user or service account.',
    operationalValue: 'Abnormal process creation rates consume CPU, memory, and PID space. Detection enables intervention before the system becomes unresponsive or exhausts resources. Common in runaway cron jobs, broken init scripts, and CI/CD loops.',
    changeMgmtRelevance: 'Process execution anomalies often follow deployment of new services, cron job changes, or orchestration updates. Correlate with scheduled maintenance and deployment windows.',
    troubleshootingWorkflow: '1. Identify the host and time window of the anomaly\n2. Find the parent process (ppid) spawning the most children\n3. Check comm/exe to identify what is being executed repeatedly\n4. Look at uid to determine which user or service account is responsible\n5. Check if this is a known scheduled job that is misbehaving or a new/unexpected process\n6. Determine if the rate is still increasing (active fork bomb) or has stabilized (runaway script completed)',
    dashboardDependency: 'Process Execution Rate dashboard, System Resource Utilization dashboard',
    criblSearchQueries: [
      {
        name: 'Process execution rate by host (last 6 hours)',
        description: 'Visualize EXECVE event rate per host to spot abnormal process creation patterns',
        query: 'dataset="$DATASET" type=="SYSCALL" syscall=="execve" earliest=-6h\n| timestats span=5m count() by hostname'
      },
      {
        name: 'Top parent processes by child spawn count',
        description: 'Identify parent processes creating excessive children — key indicator of fork bombs or restart loops',
        query: 'dataset="$DATASET" type=="SYSCALL" syscall=="execve" earliest=-1h\n| summarize ChildCount=count(), UniqueCommands=dcount(comm) by hostname, ppid, uid\n| where ChildCount > 50\n| order by ChildCount desc\n| limit 30'
      },
      {
        name: 'Most frequently executed commands during anomaly',
        description: 'Find the specific binaries being executed at abnormal rates',
        query: 'dataset="$DATASET" type=="SYSCALL" syscall=="execve" earliest=-30m\n| summarize ExecCount=count() by hostname, comm, exe, uid\n| where ExecCount > 20\n| order by ExecCount desc\n| limit 40'
      }
    ]
  },
  {
    id: 'obs-linux-aud-004',
    name: 'File Descriptor Exhaustion',
    objective: 'Detect processes hitting file descriptor limits (EMFILE/ENFILE errors) indicating resource exhaustion that will cause application failures.',
    severity: 'High',
    category: 'Capacity',
    tags: ['observability', 'capacity', 'file-descriptors', 'resource-exhaustion', 'EMFILE'],
    requiredFields: ['type', 'timestamp', 'syscall', 'success', 'exit', 'comm', 'exe', 'pid', 'uid', 'hostname'],
    detectionLogic: 'Alert when syscalls fail with exit code -24 (EMFILE — too many open files) or -23 (ENFILE — file table overflow). Threshold: more than 10 EMFILE/ENFILE errors within a 5-minute window per process. Also detect trending increase in open/socket/accept syscall failures as an early warning.',
    operationalValue: 'File descriptor exhaustion causes connection failures, inability to open files, and application crashes. Detection at the auditd layer catches this before application-level monitoring because it sees the kernel-level refusal.',
    changeMgmtRelevance: 'FD exhaustion often follows connection pool configuration changes, new integrations adding connections, or ulimit changes during deployments. Correlate with recent configuration changes.',
    troubleshootingWorkflow: '1. Identify the affected host and process (comm/exe/pid) hitting FD limits\n2. Confirm the exit code (-24 EMFILE for per-process limit, -23 ENFILE for system-wide)\n3. Check which syscall is failing (open, socket, accept, pipe) to understand the resource type\n4. Determine the configured ulimit for the process vs system-wide file-max\n5. Investigate whether the process is leaking descriptors or if limits need adjustment\n6. Check for connection pool exhaustion if the failing syscall is socket/accept/connect',
    dashboardDependency: 'Resource Exhaustion dashboard, File Descriptor Utilization dashboard',
    criblSearchQueries: [
      {
        name: 'EMFILE/ENFILE errors by process (last 4 hours)',
        description: 'Find processes hitting file descriptor limits — immediate action required for affected services',
        query: 'dataset="$DATASET" type=="SYSCALL" success=="no" earliest=-4h\n| where exit == "-24" or exit == "-23"\n| summarize ErrorCount=count(), LastSeen=max(timestamp) by hostname, comm, exe, pid, uid, exit\n| order by ErrorCount desc'
      },
      {
        name: 'FD exhaustion trend over time',
        description: 'Visualize whether file descriptor errors are increasing, indicating a leak or growing load',
        query: 'dataset="$DATASET" type=="SYSCALL" success=="no" earliest=-24h\n| where exit == "-24" or exit == "-23"\n| timestats span=15m count() by hostname, comm'
      },
      {
        name: 'Syscall types failing with resource limits',
        description: 'Understand what operations are failing — open (files), socket (connections), or pipe (IPC)',
        query: 'dataset="$DATASET" type=="SYSCALL" success=="no" earliest=-2h\n| where exit == "-24" or exit == "-23"\n| summarize FailCount=count() by hostname, comm, syscall\n| order by FailCount desc\n| limit 30'
      }
    ]
  },
  {
    id: 'obs-linux-aud-005',
    name: 'Audit Backlog Queue Full',
    objective: 'Detect when auditd is dropping events due to kernel audit backlog overflow, creating dangerous observability gaps in both security and operational monitoring.',
    severity: 'High',
    category: 'Availability',
    tags: ['observability', 'availability', 'audit-health', 'event-loss', 'backlog'],
    requiredFields: ['type', 'timestamp', 'hostname', 'serial'],
    detectionLogic: 'Alert on AUDIT_BACKLOG_LIMIT or AUDIT_BACKLOG_WAIT_TIME event types, which indicate the kernel audit queue is full and events are being dropped. Also detect gaps in serial number sequences (non-sequential serial values per host) as evidence of lost events.',
    operationalValue: 'When auditd drops events, both security detections and operational monitoring have blind spots. This is a critical observability failure — you cannot trust audit-based alerting during backlog events. Root cause is typically burst syscall activity overwhelming the configured backlog_limit.',
    changeMgmtRelevance: 'Backlog overflows often follow the addition of new audit rules that generate high volume, or application changes that dramatically increase syscall rates. Always check recent auditctl rule changes.',
    troubleshootingWorkflow: '1. Identify affected hosts and time windows of backlog events\n2. Check the current audit backlog_limit (auditctl -s) — default 8192 may be insufficient\n3. Correlate with volume spikes — what process/rule caused the burst that overflowed the queue\n4. Check if audit rules were recently added or modified (aureport --config)\n5. Evaluate increasing backlog_limit vs. reducing audit rule scope as remediation\n6. Verify no serial number gaps exist during the overflow period — quantify event loss',
    dashboardDependency: 'Audit System Health dashboard, Event Loss Tracking dashboard',
    criblSearchQueries: [
      {
        name: 'Audit backlog and lost events (last 24 hours)',
        description: 'Find all backlog overflow events indicating audit event loss',
        query: 'dataset="$DATASET" earliest=-24h\n| where type in ("AUDIT_BACKLOG_LIMIT", "AUDIT_BACKLOG_WAIT_TIME", "AUDIT_LOST")\n| summarize OccurrenceCount=count(), FirstSeen=min(timestamp), LastSeen=max(timestamp) by hostname, type\n| order by OccurrenceCount desc'
      },
      {
        name: 'Serial number gap detection (event loss evidence)',
        description: 'Identify gaps in audit serial numbers that indicate dropped events between recorded ones',
        query: 'dataset="$DATASET" earliest=-4h\n| summarize MinSerial=min(serial), MaxSerial=max(serial), EventCount=count() by hostname\n| extend ExpectedCount=MaxSerial - MinSerial + 1\n| extend LostEvents=ExpectedCount - EventCount\n| extend LossPct=round(LostEvents * 100.0 / ExpectedCount, 2)\n| where LossPct > 1\n| order by LossPct desc'
      },
      {
        name: 'Volume correlation with backlog events',
        description: 'Correlate audit volume spikes with backlog overflow timing to identify the root cause',
        query: 'dataset="$DATASET" earliest=-6h\n| timestats span=5m count() by hostname\n| order by count_ desc'
      }
    ]
  },
  {
    id: 'obs-linux-aud-006',
    name: 'Long-Running Process Detection',
    objective: 'Detect processes that exceed expected execution time based on their command/binary baseline, indicating hung processes, deadlocks, or infinite loops that consume resources.',
    severity: 'Low',
    category: 'Performance',
    tags: ['observability', 'performance', 'long-running', 'hung-process', 'resource-consumption'],
    requiredFields: ['type', 'timestamp', 'comm', 'exe', 'pid', 'ppid', 'uid', 'hostname', 'ses'],
    detectionLogic: 'Track process sessions (ses) and execution spans by correlating EXECVE start events with process exit or subsequent events from the same PID. Alert when a process session duration exceeds 3x the P95 historical duration for that comm/exe combination. Alternatively, detect processes present in audit events across multiple evaluation windows (>30 minutes) that typically complete in under 5 minutes.',
    operationalValue: 'Long-running processes tie up resources, hold locks, and may indicate deadlocks or infinite loops. Early detection prevents cascading failures from resource contention and enables proactive intervention before timeout-triggered outages.',
    changeMgmtRelevance: 'New code deployments and configuration changes can introduce deadlocks or infinite loops. Correlate long-running process detection with deployment timelines.',
    troubleshootingWorkflow: '1. Identify the long-running process by comm/exe and the host it is running on\n2. Check how long the process has been running vs. its expected baseline duration\n3. Examine the parent process (ppid) to understand the execution context (cron, systemd, manual)\n4. Look at other syscalls from the same PID — is it actively working or stuck?\n5. Check uid to identify the owning service and team\n6. Determine impact: is this process holding resources (FDs, locks, memory) that other processes need?',
    dashboardDependency: 'Process Duration Baseline dashboard, Hung Process Detection dashboard',
    criblSearchQueries: [
      {
        name: 'Processes with extended execution spans',
        description: 'Find processes that have been generating audit events over unusually long time periods',
        query: 'dataset="$DATASET" type=="SYSCALL" earliest=-4h\n| summarize FirstEvent=min(timestamp), LastEvent=max(timestamp), EventCount=count() by hostname, pid, comm, exe, uid\n| extend DurationMin=round((LastEvent - FirstEvent) / 60, 1)\n| where DurationMin > 30 and EventCount > 10\n| order by DurationMin desc\n| limit 30'
      },
      {
        name: 'Process duration baseline by command',
        description: 'Establish normal execution duration per command to identify outliers',
        query: 'dataset="$DATASET" type=="SYSCALL" syscall=="execve" earliest=-24h\n| summarize Executions=count(), AvgEvents=avg(pid) by comm, hostname\n| where Executions > 5\n| order by Executions desc\n| limit 50'
      },
      {
        name: 'Active sessions with high event counts',
        description: 'Identify sessions generating excessive events — potential hung processes in retry loops',
        query: 'dataset="$DATASET" type=="SYSCALL" earliest=-2h\n| summarize EventCount=count(), UniqueSystemcalls=dcount(syscall) by hostname, ses, comm, exe, uid\n| where EventCount > 500\n| order by EventCount desc\n| limit 30'
      }
    ]
  },
  {
    id: 'obs-linux-aud-007',
    name: 'Configuration File Change Rate',
    objective: 'Detect excessive rates of configuration file modifications indicating unstable deployments, automation issues, or configuration management tool failures.',
    severity: 'Medium',
    category: 'Change Impact',
    tags: ['observability', 'change-management', 'configuration', 'stability', 'automation'],
    requiredFields: ['type', 'timestamp', 'path_name', 'syscall', 'comm', 'exe', 'uid', 'hostname', 'key', 'cwd'],
    detectionLogic: 'Alert when the rate of file modification events (write, rename, unlink syscalls) on configuration paths (/etc/*, /opt/*/conf/*, *.conf, *.cfg, *.yaml, *.yml) exceeds 20 changes per host in a 15-minute window. Also alert when the same config file is modified more than 5 times in 10 minutes (thrashing).',
    operationalValue: 'Rapid config changes indicate unstable automation (Ansible/Puppet/Chef flapping), failed rolling deployments, or manual troubleshooting that creates inconsistent state. Detection prevents configuration drift and identifies broken automation before widespread impact.',
    changeMgmtRelevance: 'Directly indicates change management activity. High change rates outside maintenance windows are red flags. Correlate with CM tool runs and deployment pipelines to distinguish planned vs. unplanned changes.',
    troubleshootingWorkflow: '1. Identify which configuration files are being modified and at what rate\n2. Check the comm/exe making the changes — is it a CM tool (ansible, puppet, chef-client) or manual?\n3. Look at uid to identify who or what service account is driving changes\n4. Determine if the changes are to the same file (thrashing) or many files (deployment)\n5. Check cwd and the execution context to identify the automation source\n6. Verify whether changes are converging (CM tool fixing drift) or oscillating (flapping between states)',
    dashboardDependency: 'Configuration Change Tracking dashboard, Deployment Activity dashboard',
    criblSearchQueries: [
      {
        name: 'Config file modification rate by host (last 12 hours)',
        description: 'Visualize configuration change activity to identify abnormal modification rates',
        query: 'dataset="$DATASET" earliest=-12h\n| where type == "PATH" and (path_name startswith "/etc/" or path_name endswith ".conf" or path_name endswith ".cfg" or path_name endswith ".yaml" or path_name endswith ".yml")\n| timestats span=15m count() by hostname'
      },
      {
        name: 'Most frequently modified config files',
        description: 'Identify specific configuration files being changed at abnormal rates (thrashing)',
        query: 'dataset="$DATASET" earliest=-2h\n| where type == "PATH" and (path_name startswith "/etc/" or path_name endswith ".conf" or path_name endswith ".yaml")\n| summarize ChangeCount=count() by hostname, path_name, comm, uid\n| where ChangeCount > 5\n| order by ChangeCount desc\n| limit 40'
      },
      {
        name: 'Configuration changes by source tool and user',
        description: 'Break down who/what is making config changes to identify broken automation or unauthorized manual edits',
        query: 'dataset="$DATASET" earliest=-4h\n| where type == "PATH" and (path_name startswith "/etc/" or path_name endswith ".conf" or path_name endswith ".cfg")\n| summarize FileCount=dcount(path_name), ChangeCount=count() by hostname, comm, exe, uid\n| where ChangeCount > 10\n| order by ChangeCount desc'
      }
    ]
  }
],
  'linux-auth': [
  {
    id: 'obs-linux-auth-001',
    name: 'SSH Session Duration Anomalies',
    objective: 'Detect SSH sessions lasting unusually long or unusually short compared to baseline, indicating automation issues, hung sessions, or misconfigured keepalives.',
    severity: 'Medium',
    category: 'Performance',
    tags: ['observability', 'ssh', 'session-duration', 'automation', 'performance'],
    requiredFields: ['timestamp', 'hostname', 'process', 'pid', 'user', 'source_ip', 'session_action', 'disconnect_reason'],
    detectionLogic: 'Track session open/close pairs by pid and hostname. Alert when session duration exceeds 99th percentile of 7-day baseline (hung sessions) or falls below 5th percentile (rapid connect/disconnect indicating automation failure). Evaluate in 15-minute windows.',
    operationalValue: 'Identifies hung SSH sessions consuming resources, automation scripts failing immediately on connect, or keepalive misconfigurations causing premature disconnects. Early signal before service degradation.',
    changeMgmtRelevance: 'Session duration shifts often follow infrastructure changes — new jump hosts, updated SSH configs, automation deployments, or network path changes affecting keepalives.',
    troubleshootingWorkflow: '1. Identify affected hostname(s) and user(s) with anomalous session durations\n2. Correlate short sessions with disconnect_reason — auth failure vs timeout vs client disconnect\n3. For long sessions, check if pid is still active or if close event was lost\n4. Review source_ip — is this an automation host or interactive user?\n5. Check for recent SSH config changes (ClientAliveInterval, keepalive settings)\n6. Verify logging pipeline health — missing close events may indicate log loss, not actual hung sessions',
    dashboardDependency: 'SSH Session Lifecycle dashboard, Session Duration Distribution panel',
    criblSearchQueries: [
      {
        name: 'Session open/close pairs with duration (last 12 hours)',
        description: 'Match session open and close events to calculate duration and identify outliers',
        query: 'dataset="$DATASET" earliest=-12h\n| where process == "sshd" and session_action in ("opened", "closed")\n| summarize MinTime=min(timestamp), MaxTime=max(timestamp), Events=count() by pid, hostname, user\n| extend DurationSec=MaxTime - MinTime\n| order by DurationSec desc\n| limit 50'
      },
      {
        name: 'Very short sessions (under 10 seconds)',
        description: 'Find sessions that connected and disconnected rapidly — indicates auth failures or automation issues',
        query: 'dataset="$DATASET" earliest=-4h\n| where process == "sshd" and session_action in ("opened", "closed")\n| summarize MinTime=min(timestamp), MaxTime=max(timestamp), Events=count() by pid, hostname, user, source_ip\n| extend DurationSec=MaxTime - MinTime\n| where DurationSec < 10 and Events >= 2\n| order by DurationSec asc'
      },
      {
        name: 'Session duration distribution by user (trend)',
        description: 'Visualize session duration patterns over time to identify baseline shifts',
        query: 'dataset="$DATASET" earliest=-24h\n| where process == "sshd" and session_action == "closed"\n| summarize AvgDuration=avg(todouble(pid)), SessionCount=count() by hostname, user\n| timestats span=1h count() by user, hostname'
      }
    ]
  },
  {
    id: 'obs-linux-auth-002',
    name: 'Authentication Service Health',
    objective: 'Monitor PAM module failures, sshd process crashes, and auth daemon restarts to detect authentication infrastructure degradation before it causes user-facing outages.',
    severity: 'High',
    category: 'Availability',
    tags: ['observability', 'availability', 'pam', 'sshd', 'service-health', 'infrastructure'],
    requiredFields: ['timestamp', 'hostname', 'process', 'pid', 'pam_module', 'auth_result', 'session_action'],
    detectionLogic: 'Alert when: (1) PAM module errors exceed baseline by >300%, (2) sshd process restarts exceed 3 per host in 5 minutes, or (3) auth_result shows service-level failures (not user-caused). Use 15-minute evaluation windows against 7-day baseline.',
    operationalValue: 'Authentication service failures cascade quickly — if sshd or PAM is unhealthy, no one can log in. Early detection prevents escalation to full lockout scenarios that require console/IPMI access to resolve.',
    changeMgmtRelevance: 'PAM failures frequently follow package updates, config changes to /etc/pam.d/, or LDAP/AD infrastructure changes. Correlate with change windows for rapid root cause identification.',
    troubleshootingWorkflow: '1. Identify which hosts are experiencing auth service failures\n2. Determine failure type — PAM module errors vs sshd crashes vs daemon restarts\n3. Check pam_module field — which specific module is failing (pam_unix, pam_ldap, pam_sss)?\n4. Review if failures are host-specific or cluster-wide (indicates local vs infrastructure issue)\n5. Check for recent package updates or config changes to PAM stack\n6. Verify upstream dependencies — LDAP reachability, sssd status, nscd cache health',
    dashboardDependency: 'Auth Service Health dashboard, PAM Module Status panel, SSH Daemon Restart tracker',
    criblSearchQueries: [
      {
        name: 'PAM module failures by host (last 4 hours)',
        description: 'Identify hosts with elevated PAM errors and which modules are failing',
        query: 'dataset="$DATASET" earliest=-4h\n| where pam_module != "" and auth_result != "success"\n| summarize FailCount=count() by hostname, pam_module, auth_result\n| order by FailCount desc'
      },
      {
        name: 'SSHD process restarts over time',
        description: 'Track sshd daemon restarts to detect instability or crash loops',
        query: 'dataset="$DATASET" earliest=-12h\n| where process == "sshd" and session_action == "opened" and pid != ""\n| summarize DistinctPids=dcount(pid) by hostname\n| timestats span=15m dcount(pid) by hostname\n| order by DistinctPids desc'
      },
      {
        name: 'Auth service failure rate by host (trend)',
        description: 'Visualize authentication failure rates to identify degradation patterns',
        query: 'dataset="$DATASET" earliest=-24h\n| where process in ("sshd", "sudo", "login")\n| extend is_failure=iif(auth_result != "success" and auth_result != "", 1, 0)\n| timestats span=30m Total=count(), Failures=sum(is_failure) by hostname'
      }
    ]
  },
  {
    id: 'obs-linux-auth-003',
    name: 'Login Rate Baseline Deviation',
    objective: 'Detect significant changes in login volume compared to established baselines, indicating capacity changes, automation changes, new service deployments, or service discovery activity.',
    severity: 'Medium',
    category: 'Capacity',
    tags: ['observability', 'capacity', 'baseline', 'login-volume', 'trend-analysis'],
    requiredFields: ['timestamp', 'hostname', 'user', 'auth_result', 'source_ip', 'auth_method'],
    detectionLogic: 'Alert when login volume deviates >50% from the same time-of-day baseline over the previous 7 days. Evaluate both increases (new automation, scanning) and decreases (service removal, connectivity loss). Use 30-minute evaluation windows.',
    operationalValue: 'Login volume is a leading indicator for capacity and automation health. A sudden increase may signal runaway automation or unauthorized scanning. A decrease may signal lost connectivity or decommissioned services before anyone notices.',
    changeMgmtRelevance: 'Login volume shifts correlate with automation deployments, scheduled task changes, new service onboarding, or infrastructure decommissions. Use as a validation signal post-change.',
    troubleshootingWorkflow: '1. Determine if deviation is an increase or decrease in login volume\n2. Identify which hosts, users, and source_ips are driving the change\n3. For increases: check if new source_ips or users appeared (new automation, scanning)\n4. For decreases: verify connectivity to affected hosts, check if services were decommissioned\n5. Correlate timing with known change windows or deployments\n6. Determine if auth_method distribution also shifted (may indicate config change)',
    dashboardDependency: 'Login Volume Trends dashboard, Capacity Baseline panel, Authentication Activity Overview',
    criblSearchQueries: [
      {
        name: 'Login volume trend by host (last 24 hours)',
        description: 'Visualize login patterns over time to identify volume shifts',
        query: 'dataset="$DATASET" earliest=-24h\n| where auth_result != ""\n| timestats span=30m LoginCount=count() by hostname'
      },
      {
        name: 'Login volume comparison — current hour vs 7-day average',
        description: 'Compare recent login activity against baseline to quantify deviation',
        query: 'dataset="$DATASET" earliest=-1h\n| summarize CurrentLogins=count() by hostname, user\n| order by CurrentLogins desc\n| limit 30'
      },
      {
        name: 'New source IPs contributing to volume change',
        description: 'Identify source IPs that were not seen in the prior baseline period',
        query: 'dataset="$DATASET" earliest=-4h\n| where auth_result != ""\n| summarize FirstSeen=min(timestamp), LoginCount=count() by source_ip, hostname, user\n| order by FirstSeen desc\n| limit 50'
      }
    ]
  },
  {
    id: 'obs-linux-auth-004',
    name: 'Sudo Usage Patterns',
    objective: 'Track sudo frequency and distribution by user to detect process changes, automation drift, or unexpected privilege usage that may indicate operational workflow changes.',
    severity: 'Low',
    category: 'Change Impact',
    tags: ['observability', 'sudo', 'privilege', 'automation', 'change-detection'],
    requiredFields: ['timestamp', 'hostname', 'process', 'user', 'target_user', 'command', 'pwd', 'tty'],
    detectionLogic: 'Alert when sudo usage for a user deviates >100% from their 7-day baseline, a new user begins sudo activity with no prior history, or sudo commands shift to new command patterns. Evaluate in 1-hour windows.',
    operationalValue: 'Sudo usage patterns are a reliable proxy for operational workflow. Changes in sudo frequency indicate process changes, new automation, or drift from documented procedures. Useful for capacity planning and runbook validation.',
    changeMgmtRelevance: 'Sudo pattern changes often indicate new deployment procedures, automation scripts being tested, or manual intervention during incidents. Correlate with change tickets and incident timelines.',
    troubleshootingWorkflow: '1. Identify which user(s) show changed sudo patterns\n2. Examine command field — are these new commands or increased frequency of existing ones?\n3. Check tty field — is this interactive (pts/) or automation (no tty)?\n4. Review target_user — escalation to root vs service accounts\n5. Correlate with deployment schedules or incident timelines\n6. Determine if this represents a permanent process change or one-time activity',
    dashboardDependency: 'Sudo Activity dashboard, Privilege Usage Trends panel, User Activity Baseline',
    criblSearchQueries: [
      {
        name: 'Sudo frequency by user (last 24 hours)',
        description: 'Track which users are running sudo and how often — identify baseline shifts',
        query: 'dataset="$DATASET" earliest=-24h\n| where process == "sudo"\n| timestats span=1h count() by user, hostname'
      },
      {
        name: 'Sudo command distribution by user',
        description: 'See what commands each user is running via sudo to detect pattern changes',
        query: 'dataset="$DATASET" earliest=-12h\n| where process == "sudo" and command != ""\n| summarize CmdCount=count() by user, command, target_user, hostname\n| order by CmdCount desc\n| limit 50'
      },
      {
        name: 'Users with new sudo activity (no prior 7-day history)',
        description: 'Find users who started using sudo recently with no established baseline',
        query: 'dataset="$DATASET" earliest=-4h\n| where process == "sudo"\n| summarize FirstSudo=min(timestamp), SudoCount=count() by user, hostname\n| order by FirstSudo desc\n| limit 30'
      }
    ]
  },
  {
    id: 'obs-linux-auth-005',
    name: 'Session Lifecycle Gaps',
    objective: 'Detect sessions that were opened but never closed, indicating logging gaps, crashed processes, or stale session tracking that may mask operational issues.',
    severity: 'Medium',
    category: 'Availability',
    tags: ['observability', 'session-lifecycle', 'logging-gaps', 'data-quality', 'availability'],
    requiredFields: ['timestamp', 'hostname', 'process', 'pid', 'user', 'session_action', 'source_ip'],
    detectionLogic: 'Alert when session_action="opened" events exceed "closed" events by >20% over a 4-hour window per host, or when specific pids have open events older than 24 hours with no corresponding close. Indicates logging loss or process issues.',
    operationalValue: 'Session lifecycle gaps are a data quality signal — they indicate either genuine hung processes consuming resources, or logging pipeline issues causing event loss. Both require investigation to maintain observability confidence.',
    changeMgmtRelevance: 'Lifecycle gaps often appear after logging config changes, Cribl pipeline modifications, or system updates that restart services without clean session termination.',
    troubleshootingWorkflow: '1. Quantify the gap — how many open events lack corresponding close events?\n2. Determine if gaps are host-specific or systemic (host = process issue, systemic = logging issue)\n3. Check if affected pids are still running on the host (stale sessions vs log loss)\n4. Review Cribl pipeline health for this source — are events being dropped or filtered?\n5. Check for system restarts that would terminate sessions without generating close events\n6. Verify syslog/journald configuration has not been modified to filter session close messages',
    dashboardDependency: 'Session Lifecycle Balance dashboard, Data Quality Indicators panel, Pipeline Health view',
    criblSearchQueries: [
      {
        name: 'Session open vs close balance by host (last 12 hours)',
        description: 'Compare open and close event counts to identify hosts with lifecycle gaps',
        query: 'dataset="$DATASET" earliest=-12h\n| where session_action in ("opened", "closed")\n| summarize Opens=countif(session_action == "opened"), Closes=countif(session_action == "closed") by hostname\n| extend Gap=Opens - Closes, GapPct=round((Opens - Closes) * 100.0 / Opens, 1)\n| where Gap > 0\n| order by GapPct desc'
      },
      {
        name: 'Orphaned sessions — opened with no close (last 24 hours)',
        description: 'Find specific sessions that were opened but have no matching close event',
        query: 'dataset="$DATASET" earliest=-24h\n| where session_action == "opened"\n| summarize OpenTime=min(timestamp), Events=count() by pid, hostname, user, source_ip\n| where Events == 1\n| order by OpenTime asc\n| limit 50'
      },
      {
        name: 'Session lifecycle gap trend over time',
        description: 'Visualize the open/close imbalance over time to identify when gaps started',
        query: 'dataset="$DATASET" earliest=-24h\n| where session_action in ("opened", "closed")\n| timestats span=1h Opens=countif(session_action == "opened"), Closes=countif(session_action == "closed") by hostname'
      }
    ]
  },
  {
    id: 'obs-linux-auth-006',
    name: 'Auth Method Distribution Shift',
    objective: 'Detect sudden changes in the ratio of authentication methods (password, publickey, keyboard-interactive) that may indicate configuration drift, policy changes, or fallback behavior.',
    severity: 'High',
    category: 'Change Impact',
    tags: ['observability', 'auth-method', 'configuration-drift', 'change-impact', 'policy'],
    requiredFields: ['timestamp', 'hostname', 'user', 'auth_method', 'auth_result', 'source_ip'],
    detectionLogic: 'Alert when auth_method distribution shifts >25% from 7-day baseline. Key scenarios: password auth appearing where only publickey existed (key distribution failure), keyboard-interactive increasing (MFA provider issues), or publickey decreasing (agent forwarding problems). Evaluate per-host in 1-hour windows.',
    operationalValue: 'Auth method shifts are high-signal indicators of infrastructure changes. Password auth appearing in a key-only environment means something broke in key distribution. This detection catches silent security posture degradation.',
    changeMgmtRelevance: 'Auth method changes directly correlate with SSH config modifications, key rotation events, LDAP/IPA changes, MFA provider updates, or sshd_config policy changes. Critical validation signal for security-related changes.',
    troubleshootingWorkflow: '1. Identify which auth_method ratio changed and on which hosts\n2. Determine direction — is a more secure method being replaced by a less secure one?\n3. Check if affected users have valid keys deployed (authorized_keys, LDAP, CA)\n4. Review sshd_config for changes to AuthenticationMethods directive\n5. If MFA-related: check MFA provider (Duo, etc.) connectivity and status\n6. Verify SSH agent forwarding and key distribution systems are functioning',
    dashboardDependency: 'Auth Method Distribution dashboard, Security Posture panel, Configuration Drift tracker',
    criblSearchQueries: [
      {
        name: 'Auth method distribution by host (last 24 hours)',
        description: 'See the breakdown of authentication methods per host to identify shifts',
        query: 'dataset="$DATASET" earliest=-24h\n| where auth_method != "" and auth_result == "success"\n| summarize Count=count() by hostname, auth_method\n| order by hostname asc, Count desc'
      },
      {
        name: 'Auth method ratio trend over time',
        description: 'Visualize how auth method ratios change over time to pinpoint when shifts occurred',
        query: 'dataset="$DATASET" earliest=-7d\n| where auth_method != "" and auth_result == "success"\n| timestats span=4h count() by auth_method'
      },
      {
        name: 'Password auth on key-only hosts (anomaly detection)',
        description: 'Find hosts where password authentication appeared unexpectedly',
        query: 'dataset="$DATASET" earliest=-4h\n| where auth_method == "password" and auth_result == "success"\n| summarize PasswordLogins=count(), Users=dcount(user) by hostname, source_ip\n| order by PasswordLogins desc'
      }
    ]
  },
  {
    id: 'obs-linux-auth-007',
    name: 'Connection Timeout Rate',
    objective: 'Monitor elevated SSH connection timeouts to detect network degradation, load balancer issues, or host capacity problems affecting session reliability.',
    severity: 'Medium',
    category: 'Performance',
    tags: ['observability', 'timeout', 'network', 'performance', 'connectivity'],
    requiredFields: ['timestamp', 'hostname', 'process', 'user', 'source_ip', 'disconnect_reason', 'session_action'],
    detectionLogic: 'Alert when disconnect_reason="timeout" exceeds 15% of total disconnects for a host over a 1-hour window, or when timeout count increases >200% from same time-of-day 7-day baseline. Distinguish between idle timeouts (expected) and connection timeouts (problematic).',
    operationalValue: 'Elevated timeout rates indicate network path issues, overloaded hosts unable to service keepalives, or load balancer idle timeout mismatches. Often the first signal of infrastructure degradation that affects automation reliability.',
    changeMgmtRelevance: 'Timeout rate increases correlate with network path changes, load balancer configuration updates, SSH keepalive setting modifications, or firewall idle timeout policy changes.',
    troubleshootingWorkflow: '1. Identify which hosts have elevated timeout rates\n2. Determine if timeouts are from specific source_ips or widespread (network path vs host issue)\n3. Check host load metrics — is the host too busy to respond to keepalives?\n4. Review network path — any new firewalls, NATs, or load balancers with idle timeout settings?\n5. Compare ClientAliveInterval settings against infrastructure idle timeouts\n6. Check if affected connections traverse specific network segments (common hop = root cause)',
    dashboardDependency: 'Connection Reliability dashboard, Timeout Rate by Host panel, Network Path Health view',
    criblSearchQueries: [
      {
        name: 'Disconnect reasons distribution (last 12 hours)',
        description: 'See all disconnect reasons and their frequency to identify timeout prevalence',
        query: 'dataset="$DATASET" earliest=-12h\n| where disconnect_reason != ""\n| summarize Count=count() by hostname, disconnect_reason\n| order by Count desc'
      },
      {
        name: 'Timeout rate trend by host',
        description: 'Track timeout disconnects over time to identify when degradation started',
        query: 'dataset="$DATASET" earliest=-24h\n| where disconnect_reason != ""\n| extend is_timeout=iif(disconnect_reason == "timeout", 1, 0)\n| timestats span=1h Total=count(), Timeouts=sum(is_timeout) by hostname'
      },
      {
        name: 'Timeout concentration by source IP and host',
        description: 'Identify if timeouts are path-specific (certain source/dest pairs) indicating network issues',
        query: 'dataset="$DATASET" earliest=-4h\n| where disconnect_reason == "timeout"\n| summarize TimeoutCount=count(), UniqueUsers=dcount(user) by source_ip, hostname\n| order by TimeoutCount desc\n| limit 30'
      }
    ]
  }
],
  'linux-syslog': [
  {
    id: 'obs-linux-sys-001',
    name: 'OOM Killer Activation',
    objective: 'Detect when the Linux kernel OOM killer terminates processes due to memory exhaustion, indicating capacity issues or memory leaks affecting service availability.',
    severity: 'High',
    category: 'Capacity',
    tags: ['observability', 'memory', 'capacity', 'oom', 'availability'],
    requiredFields: ['timestamp', 'hostname', 'oom_process', 'oom_pid', 'oom_score', 'oom_total_vm_kb', 'oom_rss_kb', 'severity'],
    detectionLogic: 'Alert when oom_process field is present in syslog events. Any OOM kill is significant. Escalate to High when the same host has multiple OOM events within 1 hour, or when critical services (database, app server) are killed.',
    operationalValue: 'OOM kills indicate a host is at memory capacity limits. Often precedes cascading failures as killed services restart and compete for memory again. Early detection enables proactive memory tuning or horizontal scaling.',
    changeMgmtRelevance: 'Correlate with recent deployments or config changes that may have increased memory consumption. New application versions, increased connection limits, or cache size changes are common culprits.',
    troubleshootingWorkflow: '1. Identify which host and process was killed (oom_process, hostname)\n2. Check oom_score to understand relative memory pressure ranking\n3. Review oom_total_vm_kb and oom_rss_kb for actual memory consumption\n4. Determine if this is a recurring pattern (same host/process) or new\n5. Check if a deployment or config change preceded the OOM event\n6. Assess capacity — does the host need more memory or is this a leak?',
    dashboardDependency: 'Host Memory Pressure dashboard, Service Availability dashboard',
    criblSearchQueries: [
      {
        name: 'OOM killer events over time',
        description: 'Visualize OOM kill frequency to identify patterns and spikes in memory exhaustion',
        query: 'dataset="$DATASET" earliest=-24h\n| where isnotnull(oom_process)\n| timestats span=1h count() by hostname'
      },
      {
        name: 'Top processes killed by OOM with memory details',
        description: 'Identify which processes are most frequently OOM-killed and their memory footprint at time of kill',
        query: 'dataset="$DATASET" earliest=-7d\n| where isnotnull(oom_process)\n| summarize KillCount=count(), AvgRSS_KB=avg(oom_rss_kb), MaxRSS_KB=max(oom_rss_kb), AvgScore=avg(oom_score) by oom_process, hostname\n| order by KillCount desc\n| limit 30'
      },
      {
        name: 'Hosts with repeated OOM kills (crash loop risk)',
        description: 'Find hosts experiencing multiple OOM events indicating sustained memory pressure or a memory leak',
        query: 'dataset="$DATASET" earliest=-4h\n| where isnotnull(oom_process)\n| summarize OOMEvents=count(), UniqueProcesses=dcount(oom_process), LastSeen=max(timestamp) by hostname\n| where OOMEvents > 2\n| order by OOMEvents desc'
      }
    ]
  },
  {
    id: 'obs-linux-sys-002',
    name: 'Disk I/O Errors',
    objective: 'Detect disk hardware errors reported in kernel messages, indicating potential drive degradation or impending failure requiring proactive replacement.',
    severity: 'High',
    category: 'Availability',
    tags: ['observability', 'disk', 'hardware', 'availability', 'storage'],
    requiredFields: ['timestamp', 'hostname', 'disk_device', 'disk_error_type', 'severity', 'facility'],
    detectionLogic: 'Alert when disk_error_type field is present. Single events warrant investigation; multiple errors on the same disk_device within 1 hour indicate imminent failure. Escalate immediately for errors on devices hosting critical filesystems.',
    operationalValue: 'Disk I/O errors are one of the strongest predictors of imminent drive failure. Detecting these early enables planned maintenance instead of emergency recovery, reducing MTTR from hours to minutes.',
    changeMgmtRelevance: 'New disk errors following firmware updates, kernel upgrades, or storage controller changes may indicate driver compatibility issues rather than hardware failure.',
    troubleshootingWorkflow: '1. Identify affected disk_device and host\n2. Classify error type — read errors, write errors, or controller timeouts\n3. Check error frequency — isolated event vs increasing trend\n4. Verify RAID/redundancy status on the affected host\n5. Check if the disk is part of a critical data path (database, logging)\n6. Schedule proactive replacement if errors are increasing',
    dashboardDependency: 'Storage Health dashboard, Hardware Failure Prediction dashboard',
    criblSearchQueries: [
      {
        name: 'Disk errors over time by host and device',
        description: 'Trend disk errors to identify accelerating degradation patterns',
        query: 'dataset="$DATASET" earliest=-7d\n| where isnotnull(disk_error_type)\n| timestats span=4h count() by hostname, disk_device'
      },
      {
        name: 'Hosts with high disk error rates',
        description: 'Identify hosts with the most disk errors for prioritized hardware replacement',
        query: 'dataset="$DATASET" earliest=-24h\n| where isnotnull(disk_error_type)\n| summarize ErrorCount=count(), ErrorTypes=dcount(disk_error_type), LastError=max(timestamp) by hostname, disk_device\n| order by ErrorCount desc\n| limit 20'
      },
      {
        name: 'Disk error type breakdown',
        description: 'Understand what kinds of disk errors are occurring to differentiate controller issues from media failure',
        query: 'dataset="$DATASET" earliest=-7d\n| where isnotnull(disk_error_type)\n| summarize Count=count() by disk_error_type, disk_device, hostname\n| order by Count desc\n| limit 50'
      }
    ]
  },
  {
    id: 'obs-linux-sys-003',
    name: 'Service Crash Loop',
    objective: 'Detect systemd services entering a crash loop (repeated Failed followed by Started transitions), indicating persistent service instability requiring intervention.',
    severity: 'High',
    category: 'Availability',
    tags: ['observability', 'systemd', 'availability', 'service-health', 'crash-loop'],
    requiredFields: ['timestamp', 'hostname', 'systemd_unit', 'systemd_action', 'process', 'exit_code'],
    detectionLogic: 'Alert when a systemd_unit shows 3 or more Failed→Started cycles within 15 minutes. Track transitions by correlating systemd_action values per unit per host. A healthy restart is one cycle; a crash loop is repeated rapid cycles.',
    operationalValue: 'Crash-looping services consume resources, generate alert storms, and degrade dependent services. Detection enables rapid identification before cascading failures impact customers.',
    changeMgmtRelevance: 'Service crash loops frequently follow deployments, config changes, or dependency updates. Correlating crash loop start time with change windows enables rapid rollback decisions.',
    troubleshootingWorkflow: '1. Identify the crash-looping systemd_unit and host\n2. Check exit_code for the failure reason (segfault, config error, dependency missing)\n3. Determine when the crash loop started — correlate with changes\n4. Review service logs for the specific unit around failure time\n5. Check if dependencies of this service are healthy\n6. Decide: fix forward (config/dependency) or rollback (deployment)',
    dashboardDependency: 'Service Health dashboard, Deployment Impact dashboard',
    criblSearchQueries: [
      {
        name: 'Service state transitions over time',
        description: 'Visualize start/stop/fail cycles to identify crash-looping services',
        query: 'dataset="$DATASET" earliest=-4h\n| where isnotnull(systemd_unit) and isnotnull(systemd_action)\n| timestats span=5m count() by systemd_unit, systemd_action, hostname'
      },
      {
        name: 'Services with high failure rates (crash loop candidates)',
        description: 'Find services with repeated failures in a short window indicating a crash loop',
        query: 'dataset="$DATASET" earliest=-1h\n| where isnotnull(systemd_unit) and systemd_action in ("Failed", "failed")\n| summarize FailCount=count(), LastFail=max(timestamp) by systemd_unit, hostname, exit_code\n| where FailCount >= 3\n| order by FailCount desc'
      },
      {
        name: 'Crash loop timeline for specific service',
        description: 'Detailed timeline of a specific service state changes to understand restart pattern and timing',
        query: 'dataset="$DATASET" earliest=-2h\n| where isnotnull(systemd_unit) and isnotnull(systemd_action)\n| summarize Transitions=count(), Failures=countif(systemd_action == "Failed"), Starts=countif(systemd_action == "Started") by systemd_unit, hostname\n| extend CrashRatio=round(Failures * 100.0 / Transitions, 1)\n| where Failures >= 3\n| order by CrashRatio desc'
      }
    ]
  },
  {
    id: 'obs-linux-sys-004',
    name: 'Network Interface Flapping',
    objective: 'Detect network interfaces repeatedly transitioning between up and down states, indicating physical layer issues, driver problems, or upstream switch instability.',
    severity: 'Medium',
    category: 'Availability',
    tags: ['observability', 'network', 'availability', 'interface', 'flapping'],
    requiredFields: ['timestamp', 'hostname', 'network_interface', 'network_state', 'severity'],
    detectionLogic: 'Alert when a network_interface on a host transitions network_state between up and down 3 or more times within 10 minutes. Single transitions may be planned maintenance; rapid oscillation indicates instability.',
    operationalValue: 'Interface flapping causes intermittent connectivity that is difficult to troubleshoot after the fact. Real-time detection enables capture of the failure state and rapid engagement with network operations or hardware teams.',
    changeMgmtRelevance: 'Interface flapping following network changes (switch port config, cable replacement, driver update, firmware upgrade) strongly suggests the change caused the issue. Immediate rollback candidate.',
    troubleshootingWorkflow: '1. Identify the flapping interface and host\n2. Determine flap frequency and duration of each down period\n3. Check if the interface is bonded/redundant or a single point of failure\n4. Correlate with switch port logs if available\n5. Check for recent driver/firmware changes on the host\n6. Engage network operations to inspect physical layer (cable, SFP, switch port)',
    dashboardDependency: 'Network Interface Health dashboard, Infrastructure Connectivity dashboard',
    criblSearchQueries: [
      {
        name: 'Interface state changes over time',
        description: 'Visualize interface up/down transitions to identify flapping patterns',
        query: 'dataset="$DATASET" earliest=-12h\n| where isnotnull(network_interface) and isnotnull(network_state)\n| timestats span=10m count() by hostname, network_interface, network_state'
      },
      {
        name: 'Interfaces with high state change frequency (flapping)',
        description: 'Find interfaces with excessive transitions indicating instability',
        query: 'dataset="$DATASET" earliest=-1h\n| where isnotnull(network_interface) and isnotnull(network_state)\n| summarize StateChanges=count(), DownEvents=countif(network_state == "down") by hostname, network_interface\n| where StateChanges >= 4\n| order by StateChanges desc'
      },
      {
        name: 'Flapping interface detail with timing',
        description: 'Drill into specific interface transitions to understand flap duration and pattern',
        query: 'dataset="$DATASET" earliest=-4h\n| where isnotnull(network_interface) and isnotnull(network_state)\n| summarize FirstEvent=min(timestamp), LastEvent=max(timestamp), Transitions=count() by hostname, network_interface\n| where Transitions >= 6\n| order by Transitions desc\n| limit 20'
      }
    ]
  },
  {
    id: 'obs-linux-sys-005',
    name: 'Kernel Error Rate Spike',
    objective: 'Detect sudden increases in kernel-level errors and critical messages, indicating hardware failures, driver issues, or system instability requiring urgent investigation.',
    severity: 'High',
    category: 'Availability',
    tags: ['observability', 'kernel', 'hardware', 'availability', 'system-health'],
    requiredFields: ['timestamp', 'hostname', 'facility', 'severity', 'message', 'kernel_timestamp'],
    detectionLogic: 'Alert when kernel facility events with severity "err" or "crit" exceed 200% of the rolling 4-hour baseline within a 15-minute window. Any "emerg" or "alert" severity from kernel facility triggers immediate alert regardless of baseline.',
    operationalValue: 'Kernel errors are the earliest indicator of hardware degradation, driver incompatibility, or system instability. They often precede visible service impact by minutes to hours, enabling proactive intervention.',
    changeMgmtRelevance: 'Kernel error spikes following OS updates, kernel module changes, or hardware maintenance strongly indicate the change introduced instability. Correlate error onset time with change completion time.',
    troubleshootingWorkflow: '1. Identify the host(s) generating kernel errors\n2. Categorize error messages — hardware (MCE, ECC), driver, filesystem, or resource exhaustion\n3. Check if errors are increasing (degrading) or stable (persistent known issue)\n4. Correlate with recent kernel updates or hardware changes\n5. Assess service impact — are applications on this host affected?\n6. Determine urgency: schedule maintenance vs immediate failover',
    dashboardDependency: 'System Health dashboard, Hardware Error Tracking dashboard',
    criblSearchQueries: [
      {
        name: 'Kernel error and critical messages over time',
        description: 'Trend kernel-level errors to identify spikes and degradation patterns',
        query: 'dataset="$DATASET" earliest=-24h\n| where facility == "kern" and severity in ("err", "crit", "alert", "emerg")\n| timestats span=15m count() by hostname, severity'
      },
      {
        name: 'Hosts with elevated kernel error rates',
        description: 'Identify hosts experiencing the most kernel errors for prioritized investigation',
        query: 'dataset="$DATASET" earliest=-4h\n| where facility == "kern" and severity in ("err", "crit", "alert", "emerg")\n| summarize ErrorCount=count(), CriticalCount=countif(severity in ("crit", "alert", "emerg")) by hostname\n| where ErrorCount > 10\n| order by CriticalCount desc, ErrorCount desc'
      },
      {
        name: 'Kernel error message categorization',
        description: 'Group kernel errors by message pattern to identify root cause category (hardware, driver, filesystem)',
        query: 'dataset="$DATASET" earliest=-4h\n| where facility == "kern" and severity in ("err", "crit", "alert", "emerg")\n| summarize Count=count(), Hosts=dcount(hostname) by message\n| order by Count desc\n| limit 30'
      }
    ]
  },
  {
    id: 'obs-linux-sys-006',
    name: 'Log Volume Anomaly by Facility',
    objective: 'Detect unusual spikes in log volume from specific syslog facilities, indicating noisy services, failure cascades, or logging storms that may mask important events.',
    severity: 'Medium',
    category: 'Performance',
    tags: ['observability', 'log-volume', 'performance', 'anomaly', 'capacity'],
    requiredFields: ['timestamp', 'hostname', 'facility', 'severity', 'process'],
    detectionLogic: 'Alert when log volume from any single facility exceeds 300% of its rolling 24-hour average within a 15-minute window. Also alert when a facility that normally produces <100 events/hour suddenly produces >1000. Focus on auth, daemon, and local facilities which commonly spike during incidents.',
    operationalValue: 'Log volume anomalies are a leading indicator of underlying issues. A suddenly noisy service often indicates error loops, retry storms, or authentication failures. Detection prevents log infrastructure overload and helps identify root cause services.',
    changeMgmtRelevance: 'Log volume spikes following deployments often indicate verbose debug logging left enabled, new error conditions, or misconfigured log levels. Quick detection enables log level correction before storage costs escalate.',
    troubleshootingWorkflow: '1. Identify which facility and host(s) are generating excess volume\n2. Determine the top contributing process within that facility\n3. Check severity distribution — is the spike errors or info-level noise?\n4. Assess if the volume is impacting log pipeline throughput or storage\n5. Correlate with application changes or incident timeline\n6. Determine action: tune log level, fix root cause, or add Cribl volume reduction',
    dashboardDependency: 'Log Volume Monitoring dashboard, Pipeline Health dashboard',
    criblSearchQueries: [
      {
        name: 'Log volume by facility over time',
        description: 'Visualize per-facility log volume trends to spot anomalous spikes',
        query: 'dataset="$DATASET" earliest=-24h\n| timestats span=15m count() by facility'
      },
      {
        name: 'Facility volume anomalies (current vs baseline)',
        description: 'Compare current 1-hour facility volumes against typical rates to identify spikes',
        query: 'dataset="$DATASET" earliest=-1h\n| summarize CurrentVolume=count(), UniqueHosts=dcount(hostname), UniqueSeverities=dcount(severity) by facility, process\n| where CurrentVolume > 500\n| order by CurrentVolume desc\n| limit 20'
      },
      {
        name: 'Top noisy processes driving volume spikes',
        description: 'Drill into which specific processes are generating the most log volume within a facility',
        query: 'dataset="$DATASET" earliest=-4h\n| summarize EventCount=count(), ErrorCount=countif(severity in ("err", "crit", "alert")) by facility, process, hostname\n| extend ErrorRatio=round(ErrorCount * 100.0 / EventCount, 1)\n| order by EventCount desc\n| limit 30'
      }
    ]
  },
  {
    id: 'obs-linux-sys-007',
    name: 'Service Dependency Failure Chain',
    objective: 'Detect when multiple related systemd services fail in sequence, indicating a cascading failure where a core dependency loss triggers downstream service failures.',
    severity: 'High',
    category: 'Availability',
    tags: ['observability', 'systemd', 'availability', 'cascade', 'dependency'],
    requiredFields: ['timestamp', 'hostname', 'systemd_unit', 'systemd_action', 'process', 'exit_code', 'message'],
    detectionLogic: 'Alert when 3 or more distinct systemd_units on the same host enter a Failed state within a 5-minute window. This pattern indicates a shared dependency (database, network mount, DNS) has failed, causing downstream services to cascade. Higher severity when >5 services fail.',
    operationalValue: 'Cascading failures are the most impactful incident type. Detecting the chain pattern enables operators to identify the root cause dependency rather than chasing individual service symptoms. Reduces MTTR by focusing investigation on the first failure.',
    changeMgmtRelevance: 'Dependency cascades frequently follow infrastructure changes: network configuration, DNS changes, NFS mount modifications, or database maintenance. The timing of the first failure relative to a change window is the critical correlation.',
    troubleshootingWorkflow: '1. Identify the host experiencing the cascade\n2. Sort failed services by timestamp to find the FIRST failure (likely root cause)\n3. Check what the first-failed service depends on (network, storage, auth)\n4. Verify the underlying dependency health (can the host reach DNS, NFS, DB?)\n5. Check if the same cascade is happening on multiple hosts (infrastructure-wide issue)\n6. Restore the root dependency first, then verify downstream services recover',
    dashboardDependency: 'Service Dependency Map dashboard, Cascading Failure Detection dashboard',
    criblSearchQueries: [
      {
        name: 'Multi-service failures per host over time',
        description: 'Identify hosts experiencing multiple simultaneous service failures indicating cascades',
        query: 'dataset="$DATASET" earliest=-12h\n| where isnotnull(systemd_unit) and systemd_action in ("Failed", "failed")\n| timestats span=5m dcount(systemd_unit) by hostname'
      },
      {
        name: 'Hosts with cascading service failures',
        description: 'Find hosts where multiple distinct services failed within a short window',
        query: 'dataset="$DATASET" earliest=-1h\n| where isnotnull(systemd_unit) and systemd_action in ("Failed", "failed")\n| summarize FailedServices=dcount(systemd_unit), TotalFailures=count(), FirstFail=min(timestamp), LastFail=max(timestamp) by hostname\n| where FailedServices >= 3\n| order by FailedServices desc'
      },
      {
        name: 'Failure sequence timeline for cascade analysis',
        description: 'Show the order of service failures on a host to identify the root cause dependency',
        query: 'dataset="$DATASET" earliest=-1h\n| where isnotnull(systemd_unit) and systemd_action in ("Failed", "failed")\n| summarize FirstFailure=min(timestamp), FailCount=count() by systemd_unit, hostname, exit_code\n| order by FirstFailure asc\n| limit 50'
      }
    ]
  }
],
  'f5-bigip-ltm': [
  {
    id: 'obs-f5-001',
    name: 'Pool Member Down',
    objective: 'Detect when a pool member health monitor transitions to a down state, indicating backend server unavailability that may impact application delivery.',
    severity: 'High',
    category: 'Availability',
    tags: ['observability', 'availability', 'health-check', 'pool', 'backend'],
    requiredFields: ['timestamp', 'hostname', 'pool_name', 'pool_member_status', 'server_ip', 'server_port', 'health_monitor_name', 'health_monitor_status', 'virtual_server'],
    detectionLogic: 'Alert when health_monitor_status transitions from "up" to "down" for any pool member. Correlate with pool_member_status field to confirm the member is marked unavailable. Evaluate across all monitors assigned to the pool to distinguish single-monitor failure from full member failure.',
    operationalValue: 'Provides immediate visibility into backend server health before end-user impact occurs. Enables proactive remediation when pool redundancy still exists — critical window before remaining members become overloaded.',
    changeMgmtRelevance: 'Pool member failures frequently follow application deployments, OS patches, or network changes. Correlate health monitor transitions with change windows to identify change-induced outages versus organic failures.',
    troubleshootingWorkflow: '1. Identify which pool member(s) transitioned to down and on which BIG-IP hostname\n2. Determine which health monitor(s) failed — application-layer (HTTP) vs transport-layer (TCP)\n3. Check if multiple pool members in the same pool are affected (potential upstream issue)\n4. Verify the backend server is reachable from the BIG-IP self-IP\n5. Check if a recent deployment or change correlates with the transition time\n6. Validate remaining pool capacity — are surviving members absorbing load without degradation?',
    dashboardDependency: 'Pool Health Status dashboard, Pool Member Availability Trends dashboard',
    criblSearchQueries: [
      {
        name: 'Pool member health transitions (last 4 hours)',
        description: 'Track health monitor status changes across all pool members to identify recent failures',
        query: 'dataset="$DATASET" earliest=-4h\n| where health_monitor_status == "down"\n| summarize count() by pool_name, server_ip, server_port, health_monitor_name, hostname\n| order by count_ desc'
      },
      {
        name: 'Pool member status timeline',
        description: 'Visualize when pool members went down over time to correlate with change events',
        query: 'dataset="$DATASET" earliest=-12h\n| where pool_member_status in ("down", "offline", "forced_offline")\n| timestats span=5m count() by pool_name, server_ip\n| order by count_ desc'
      },
      {
        name: 'Pools with reduced member capacity',
        description: 'Identify pools where one or more members are unavailable, indicating degraded redundancy',
        query: 'dataset="$DATASET" earliest=-1h\n| summarize TotalMembers=dcount(server_ip), DownMembers=countif(health_monitor_status == "down") by pool_name, hostname\n| extend DownPct=round(DownMembers * 100.0 / TotalMembers, 1)\n| where DownMembers > 0\n| order by DownPct desc'
      }
    ]
  },
  {
    id: 'obs-f5-002',
    name: 'Response Time Degradation',
    objective: 'Detect when response_time_ms or server_latency_ms exceeds baseline performance by a significant factor, indicating backend application slowness or resource contention.',
    severity: 'Medium',
    category: 'Performance',
    tags: ['observability', 'performance', 'latency', 'response-time', 'backend'],
    requiredFields: ['timestamp', 'hostname', 'virtual_server', 'pool_name', 'server_ip', 'server_port', 'response_time_ms', 'server_latency_ms', 'http_uri', 'http_method', 'http_status'],
    detectionLogic: 'Alert when average response_time_ms or server_latency_ms for a virtual server or pool exceeds 3x the rolling 1-hour baseline, sustained over a 5-minute window. Also trigger on P95 latency exceeding absolute thresholds (e.g., >5000ms for typical web applications).',
    operationalValue: 'Enables early detection of backend performance degradation before user experience is critically impacted. Distinguishes between BIG-IP processing delay and actual backend slowness using server_latency_ms versus total response_time_ms.',
    changeMgmtRelevance: 'Response time degradation often follows application deployments, database maintenance, or infrastructure changes. The BIG-IP sits at the ideal observation point to detect backend regression introduced by changes.',
    troubleshootingWorkflow: '1. Determine scope — is degradation isolated to one pool member or affecting the entire pool?\n2. Compare response_time_ms vs server_latency_ms to isolate BIG-IP processing vs backend delay\n3. Check if specific URIs or HTTP methods are disproportionately affected\n4. Correlate with connection_count — is the backend overloaded with connections?\n5. Check if affected pool members show health monitor flapping\n6. Review recent deployments or database maintenance windows that coincide with onset',
    dashboardDependency: 'Response Time Percentiles dashboard, Backend Latency by Pool dashboard',
    criblSearchQueries: [
      {
        name: 'Average and P95 response time by virtual server (last 4 hours)',
        description: 'Track response time trends to identify when degradation began and which virtual servers are affected',
        query: 'dataset="$DATASET" earliest=-4h\n| timestats span=5m AvgResponseMs=avg(response_time_ms), P95ResponseMs=max(response_time_ms) by virtual_server'
      },
      {
        name: 'Slow pool members (response time comparison)',
        description: 'Identify individual pool members contributing to elevated latency',
        query: 'dataset="$DATASET" earliest=-1h\n| summarize AvgLatency=avg(server_latency_ms), P95Latency=max(server_latency_ms), Requests=count() by pool_name, server_ip, server_port\n| where AvgLatency > 1000\n| order by AvgLatency desc'
      },
      {
        name: 'Slowest URIs by response time',
        description: 'Drill into which application endpoints are driving response time degradation',
        query: 'dataset="$DATASET" earliest=-1h\n| summarize AvgResponseMs=avg(response_time_ms), MaxResponseMs=max(response_time_ms), Hits=count() by http_uri, http_method, virtual_server\n| where AvgResponseMs > 2000 and Hits > 5\n| order by AvgResponseMs desc\n| limit 25'
      }
    ]
  },
  {
    id: 'obs-f5-003',
    name: 'Error Rate Spike',
    objective: 'Detect elevated 5xx HTTP status responses indicating backend application failures, server errors, or resource exhaustion behind the BIG-IP.',
    severity: 'High',
    category: 'Availability',
    tags: ['observability', 'availability', 'errors', 'http-status', 'backend'],
    requiredFields: ['timestamp', 'hostname', 'virtual_server', 'pool_name', 'server_ip', 'http_status', 'http_uri', 'http_method', 'http_host', 'response_time_ms'],
    detectionLogic: 'Alert when the ratio of 5xx responses to total responses exceeds 5% over a 5-minute window for any virtual server, or when absolute 5xx count exceeds 50 events in 5 minutes. Differentiate between 502 (backend unreachable), 503 (service unavailable), and 500 (application error) for targeted response.',
    operationalValue: 'Provides rapid detection of backend application failures at the load balancer layer. The BIG-IP observes all traffic to all backends, making it an ideal aggregation point for error rate monitoring across distributed services.',
    changeMgmtRelevance: 'Error rate spikes are the most common signal of failed deployments. Correlate 5xx onset timing with deployment windows to enable rapid rollback decisions within SLA targets.',
    troubleshootingWorkflow: '1. Identify which HTTP status codes are elevated (500 vs 502 vs 503 — different root causes)\n2. Determine if errors are from all pool members or isolated to specific backends\n3. Check if specific URIs or hosts are disproportionately affected\n4. For 502/503: verify pool member health status and connectivity\n5. For 500: escalate to application team with affected URI patterns and timestamps\n6. Check if error onset correlates with a deployment, traffic spike, or pool member failure',
    dashboardDependency: 'HTTP Error Rate dashboard, Error Distribution by Virtual Server dashboard',
    criblSearchQueries: [
      {
        name: 'Error rate by virtual server (last 4 hours)',
        description: 'Visualize 5xx error rate trends per virtual server to identify spike onset and duration',
        query: 'dataset="$DATASET" earliest=-4h\n| summarize Total=count(), Errors5xx=countif(http_status >= 500 and http_status < 600) by virtual_server\n| extend ErrorRate=round(Errors5xx * 100.0 / Total, 2)\n| where Errors5xx > 0\n| order by ErrorRate desc'
      },
      {
        name: '5xx errors over time by status code',
        description: 'Break down error types over time to distinguish between application errors (500), gateway failures (502), and overload (503)',
        query: 'dataset="$DATASET" earliest=-4h\n| where http_status >= 500 and http_status < 600\n| timestats span=5m count() by http_status, virtual_server'
      },
      {
        name: 'Backend servers generating the most errors',
        description: 'Identify which pool members are responsible for elevated error rates to target remediation',
        query: 'dataset="$DATASET" earliest=-1h\n| where http_status >= 500 and http_status < 600\n| summarize ErrorCount=count() by pool_name, server_ip, server_port, http_status\n| order by ErrorCount desc\n| limit 20'
      }
    ]
  },
  {
    id: 'obs-f5-004',
    name: 'Connection Table Exhaustion',
    objective: 'Detect when connection_count approaches connection_limit thresholds on virtual servers or pool members, indicating impending connection capacity issues.',
    severity: 'High',
    category: 'Capacity',
    tags: ['observability', 'capacity', 'connections', 'exhaustion', 'threshold'],
    requiredFields: ['timestamp', 'hostname', 'virtual_server', 'pool_name', 'server_ip', 'connection_count', 'connection_limit', 'client_ip', 'snat_ip'],
    detectionLogic: 'Alert when connection_count exceeds 80% of connection_limit for any virtual server or pool member. Critical alert at 90%. Also detect rapid connection count growth (>50% increase in 5 minutes) indicating potential connection storms or slowloris-style resource exhaustion.',
    operationalValue: 'Prevents service outages caused by connection table exhaustion — a common failure mode where new connections are rejected silently. Early warning enables proactive connection limit adjustment or backend scaling before users are impacted.',
    changeMgmtRelevance: 'Connection exhaustion often follows traffic migration, load balancer consolidation, or connection limit changes. Validate that connection_limit values were updated appropriately when virtual servers are modified.',
    troubleshootingWorkflow: '1. Identify which virtual server or pool member is approaching connection_limit\n2. Determine current utilization percentage and rate of growth\n3. Check if connection growth is organic (traffic increase) or pathological (connection leak, slowloris)\n4. Review top client_ip contributors to connection count\n5. Verify SNAT pool capacity — SNAT exhaustion can mimic connection limits\n6. Evaluate options: increase connection_limit, add pool members, or investigate connection leak',
    dashboardDependency: 'Connection Utilization dashboard, Connection Growth Trends dashboard',
    criblSearchQueries: [
      {
        name: 'Connection utilization percentage by virtual server',
        description: 'Identify virtual servers approaching their connection limits with utilization percentage',
        query: 'dataset="$DATASET" earliest=-1h\n| where connection_limit > 0\n| summarize MaxConnections=max(connection_count), Limit=max(connection_limit) by virtual_server, hostname\n| extend UtilPct=round(MaxConnections * 100.0 / Limit, 1)\n| where UtilPct > 70\n| order by UtilPct desc'
      },
      {
        name: 'Connection count trend over time',
        description: 'Visualize connection growth rate to predict when exhaustion will occur',
        query: 'dataset="$DATASET" earliest=-12h\n| timestats span=5m MaxConns=max(connection_count), AvgConns=avg(connection_count) by virtual_server'
      },
      {
        name: 'Top clients consuming connections',
        description: 'Identify client IPs holding the most connections to determine if exhaustion is caused by a specific source',
        query: 'dataset="$DATASET" earliest=-1h\n| summarize ConnectionCount=count(), UniqueServers=dcount(server_ip) by client_ip, virtual_server\n| order by ConnectionCount desc\n| limit 25'
      }
    ]
  },
  {
    id: 'obs-f5-005',
    name: 'SSL Handshake Failure Rate',
    objective: 'Detect elevated ssl_handshake_failure events indicating certificate problems, protocol mismatches, or client compatibility issues affecting secure connectivity.',
    severity: 'Medium',
    category: 'Availability',
    tags: ['observability', 'availability', 'ssl', 'tls', 'certificate', 'handshake'],
    requiredFields: ['timestamp', 'hostname', 'virtual_server', 'client_ip', 'ssl_protocol', 'ssl_cipher', 'ssl_handshake_failure', 'ssl_client_cert_subject', 'geo_country'],
    detectionLogic: 'Alert when ssl_handshake_failure count exceeds baseline by 3x over a 15-minute window, or when handshake failure rate exceeds 10% of total SSL connection attempts. Segment by ssl_protocol and ssl_cipher to identify specific incompatibility patterns.',
    operationalValue: 'SSL handshake failures are invisible to many monitoring tools but directly impact user connectivity. Detecting elevated failures enables proactive certificate renewal, cipher suite adjustment, or client communication before widespread user complaints.',
    changeMgmtRelevance: 'SSL failures commonly spike after certificate rotations, cipher suite policy changes, or TLS version deprecation. Correlate failure onset with SSL profile modifications to identify change-induced compatibility breaks.',
    troubleshootingWorkflow: '1. Quantify the failure rate — what percentage of SSL connections are failing?\n2. Identify the ssl_protocol and ssl_cipher associated with failures (version/cipher mismatch?)\n3. Check if failures are from specific client_ip ranges or geo_country (client population issue)\n4. Verify certificate validity — check expiration, chain completeness, and SAN coverage\n5. Review recent SSL profile changes — cipher string modifications, TLS version restrictions\n6. Check if ssl_client_cert_subject indicates mutual TLS failures (client cert issues)',
    dashboardDependency: 'SSL Health dashboard, Handshake Failure Trends dashboard',
    criblSearchQueries: [
      {
        name: 'SSL handshake failures over time',
        description: 'Trend handshake failures to identify spike onset and correlate with change events',
        query: 'dataset="$DATASET" earliest=-12h\n| where ssl_handshake_failure == true\n| timestats span=15m count() by virtual_server, hostname'
      },
      {
        name: 'Failure breakdown by protocol and cipher',
        description: 'Identify which TLS versions or cipher suites are causing handshake failures',
        query: 'dataset="$DATASET" earliest=-4h\n| where ssl_handshake_failure == true\n| summarize FailureCount=count() by ssl_protocol, ssl_cipher, virtual_server\n| order by FailureCount desc\n| limit 20'
      },
      {
        name: 'Client sources with highest handshake failure rates',
        description: 'Determine if failures are concentrated on specific client populations or geographies',
        query: 'dataset="$DATASET" earliest=-4h\n| summarize Total=count(), Failures=countif(ssl_handshake_failure == true) by client_ip, geo_country, virtual_server\n| extend FailRate=round(Failures * 100.0 / Total, 1)\n| where Failures > 5 and FailRate > 10\n| order by Failures desc\n| limit 25'
      }
    ]
  },
  {
    id: 'obs-f5-006',
    name: 'Traffic Distribution Imbalance',
    objective: 'Detect uneven load distribution across pool members indicating sticky session accumulation, load balancing algorithm issues, or silent member degradation.',
    severity: 'Medium',
    category: 'Performance',
    tags: ['observability', 'performance', 'load-balancing', 'pool', 'distribution'],
    requiredFields: ['timestamp', 'hostname', 'virtual_server', 'pool_name', 'server_ip', 'server_port', 'connection_count', 'bytes_in', 'bytes_out', 'persistence_type', 'response_time_ms'],
    detectionLogic: 'Alert when any single pool member handles more than 2x its fair share (e.g., >40% of traffic in a 5-member pool) sustained over 15 minutes. Also detect when standard deviation of request distribution across members exceeds 30% of the mean, indicating significant imbalance.',
    operationalValue: 'Traffic imbalance leads to cascading failures — overloaded members degrade while underutilized members waste capacity. Early detection enables persistence table clearing, algorithm adjustment, or member investigation before the overloaded member fails.',
    changeMgmtRelevance: 'Imbalance often emerges after pool member additions/removals, persistence profile changes, or load balancing algorithm modifications. New members may not receive traffic if persistence entries pin sessions to existing members.',
    troubleshootingWorkflow: '1. Identify which pool members are overloaded vs underutilized\n2. Check persistence_type — are sticky sessions causing uneven distribution?\n3. Determine if the imbalance correlates with a recent pool member addition or removal\n4. Compare response_time_ms across members — is the overloaded member also slower?\n5. Review the load balancing algorithm configured on the pool (round-robin, ratio, least-connections)\n6. Consider clearing persistence records if imbalance is session-affinity driven',
    dashboardDependency: 'Pool Distribution dashboard, Member Load Balance Ratio dashboard',
    criblSearchQueries: [
      {
        name: 'Request distribution across pool members',
        description: 'Show how traffic is distributed across members in each pool to identify imbalance',
        query: 'dataset="$DATASET" earliest=-1h\n| summarize Requests=count(), BytesIn=sum(bytes_in), BytesOut=sum(bytes_out) by pool_name, server_ip, server_port\n| order by pool_name asc, Requests desc'
      },
      {
        name: 'Distribution imbalance ratio by pool',
        description: 'Calculate the ratio between busiest and least busy members to quantify imbalance',
        query: 'dataset="$DATASET" earliest=-1h\n| summarize Requests=count() by pool_name, server_ip\n| summarize MaxRequests=max(Requests), MinRequests=min(Requests), AvgRequests=avg(Requests), Members=dcount(server_ip) by pool_name\n| extend ImbalanceRatio=round(MaxRequests * 1.0 / iif(MinRequests > 0, MinRequests, 1), 2)\n| where ImbalanceRatio > 2 and Members > 1\n| order by ImbalanceRatio desc'
      },
      {
        name: 'Traffic distribution trend over time by pool member',
        description: 'Visualize how distribution shifts over time to identify when imbalance began',
        query: 'dataset="$DATASET" earliest=-4h\n| timestats span=15m count() by pool_name, server_ip'
      }
    ]
  },
  {
    id: 'obs-f5-007',
    name: 'Virtual Server Throughput Anomaly',
    objective: 'Detect sudden changes in bytes_in/bytes_out patterns on virtual servers indicating capacity issues, traffic shifts, DDoS onset, or upstream routing changes.',
    severity: 'Medium',
    category: 'Capacity',
    tags: ['observability', 'capacity', 'throughput', 'traffic', 'anomaly'],
    requiredFields: ['timestamp', 'hostname', 'virtual_server', 'bytes_in', 'bytes_out', 'connection_count', 'client_ip', 'pool_name', 'geo_country'],
    detectionLogic: 'Alert when bytes_in or bytes_out for a virtual server deviates more than 3 standard deviations from the rolling 4-hour baseline within a 10-minute window. Detect both spikes (potential DDoS, traffic migration) and drops (potential upstream failure, DNS change). Evaluate total throughput and per-connection throughput independently.',
    operationalValue: 'Throughput anomalies are leading indicators of capacity exhaustion, traffic hijacking, or upstream failures. Detecting changes at the virtual server level provides the earliest possible signal before backend saturation or bandwidth exhaustion.',
    changeMgmtRelevance: 'Throughput changes frequently follow DNS migrations, GTM policy changes, or datacenter failover events. Correlate with planned traffic migrations to distinguish expected shifts from unexpected anomalies.',
    troubleshootingWorkflow: '1. Determine if the anomaly is a spike (increase) or drop (decrease) in throughput\n2. Identify affected virtual servers and whether multiple are impacted (infrastructure-wide vs application-specific)\n3. For spikes: check top client_ip contributors and geo_country distribution for DDoS indicators\n4. For drops: verify upstream DNS resolution, GTM health, and routing paths\n5. Compare bytes_in vs bytes_out ratio — asymmetry changes may indicate different traffic patterns\n6. Assess bandwidth utilization against interface/link capacity to determine headroom',
    dashboardDependency: 'Virtual Server Throughput dashboard, Bandwidth Utilization Trends dashboard',
    criblSearchQueries: [
      {
        name: 'Throughput by virtual server over time',
        description: 'Visualize bytes in/out trends to identify anomalous throughput changes',
        query: 'dataset="$DATASET" earliest=-12h\n| timestats span=10m TotalBytesIn=sum(bytes_in), TotalBytesOut=sum(bytes_out), Connections=count() by virtual_server'
      },
      {
        name: 'Current throughput vs baseline comparison',
        description: 'Compare recent throughput against the 4-hour average to quantify deviation',
        query: 'dataset="$DATASET" earliest=-4h\n| summarize TotalBytesIn=sum(bytes_in), TotalBytesOut=sum(bytes_out), TotalRequests=count() by virtual_server, hostname\n| extend AvgBytesPerRequest=round((TotalBytesIn + TotalBytesOut) * 1.0 / TotalRequests, 0)\n| order by TotalBytesIn desc'
      },
      {
        name: 'Top clients driving throughput changes',
        description: 'Identify which client IPs or geographies are responsible for throughput anomalies',
        query: 'dataset="$DATASET" earliest=-1h\n| summarize BytesIn=sum(bytes_in), BytesOut=sum(bytes_out), Requests=count() by client_ip, geo_country, virtual_server\n| extend TotalBytes=BytesIn + BytesOut\n| order by TotalBytes desc\n| limit 25'
      }
    ]
  }
],
  'active-directory': [
  {
    id: 'obs-ad-001',
    name: 'Domain Controller Replication Latency',
    objective: 'Detect replication delays between domain controllers that indicate network connectivity issues, DC health degradation, or replication topology problems before they cause authentication failures or stale data.',
    severity: 'High',
    category: 'Performance',
    tags: ['observability', 'replication', 'domain-controller', 'infrastructure-health'],
    requiredFields: ['event_id', 'timestamp', 'computer', 'replication_source', 'replication_destination', 'event_channel'],
    detectionLogic: 'Monitor replication events (event_id 4932, 4933 for successful replication; 4934 for replication failure). Alert when replication events between a DC pair drop below expected frequency (baseline: at minimum every 15 minutes for intra-site). Alert on any event_id 4934 occurrence or when the time delta between successive 4933 events for a DC pair exceeds 30 minutes.',
    operationalValue: 'Replication latency is often the first indicator of DC health or network segmentation issues. Detecting delays early prevents cascading authentication failures, stale group membership, and GPO inconsistencies across sites.',
    changeMgmtRelevance: 'Replication delays frequently follow network changes (firewall rule modifications, routing changes, WAN link maintenance). Correlate with change windows to identify infrastructure changes impacting AD replication topology.',
    troubleshootingWorkflow: '1. Identify which DC pair is experiencing replication delays (replication_source → replication_destination)\n2. Check if the issue is unidirectional or bidirectional between the pair\n3. Verify network connectivity between the DCs (latency, packet loss, firewall rules)\n4. Check if multiple destination DCs are affected from the same source (source DC issue)\n5. Review replication topology — has a bridgehead server failed or been decommissioned?\n6. Correlate with recent network or firewall changes that may have impacted DC-to-DC communication paths',
    dashboardDependency: 'DC Replication Health dashboard, AD Infrastructure Overview dashboard',
    criblSearchQueries: [
      {
        name: 'Replication events by DC pair (last 12 hours)',
        description: 'Visualize replication event frequency between domain controller pairs to identify gaps',
        query: 'dataset="$DATASET" earliest=-12h event_id in (4932, 4933, 4934)\n| timestats span=15m count() by replication_source, replication_destination'
      },
      {
        name: 'Replication failures (last 24 hours)',
        description: 'Identify all replication failure events and affected DC pairs',
        query: 'dataset="$DATASET" earliest=-24h event_id==4934\n| summarize FailureCount=count(), LastFailure=max(timestamp) by replication_source, replication_destination, computer\n| order by FailureCount desc'
      },
      {
        name: 'DC pairs with replication gaps exceeding 30 minutes',
        description: 'Find DC pairs where expected replication events have not occurred within the normal interval',
        query: 'dataset="$DATASET" earliest=-4h event_id==4933\n| summarize LastReplication=max(timestamp), EventCount=count() by replication_source, replication_destination\n| where EventCount < 8\n| order by EventCount asc'
      }
    ]
  },
  {
    id: 'obs-ad-002',
    name: 'Authentication Volume Anomaly',
    objective: 'Detect sudden changes in logon event volume per domain controller that indicate DC load imbalance, upstream routing or DNS changes, site affinity shifts, or authentication infrastructure issues.',
    severity: 'Medium',
    category: 'Performance',
    tags: ['observability', 'authentication', 'load-balancing', 'capacity'],
    requiredFields: ['event_id', 'timestamp', 'computer', 'logon_type', 'auth_package', 'source_ip'],
    detectionLogic: 'Track logon events (event_id 4624, 4625) per DC over rolling 15-minute windows. Alert when any DC shows >50% increase or decrease from its 7-day same-window baseline. Also alert when the standard deviation across DCs exceeds 2x normal, indicating imbalanced load.',
    operationalValue: 'Authentication volume shifts reveal infrastructure problems upstream of AD — DNS misconfigurations routing all clients to one DC, site link cost changes, or a DC silently dropping out of rotation. Detecting these shifts early prevents DC overload and authentication timeouts.',
    changeMgmtRelevance: 'Volume shifts commonly follow DNS changes, site and subnet reconfiguration, DC decommissioning, or network routing changes. Correlate timing with infrastructure change windows to identify root cause.',
    troubleshootingWorkflow: '1. Identify which DCs are seeing volume increases vs decreases\n2. Check if the shift is symmetric (one DC gained what another lost) or asymmetric (overall volume change)\n3. Verify DNS SRV records — are all DCs properly registered and weighted?\n4. Check AD Sites and Services — have subnet assignments or site link costs changed?\n5. Determine if source_ip patterns shifted (a subnet moved to a different DC)\n6. Correlate with network or DNS changes in the change management system',
    dashboardDependency: 'DC Authentication Load dashboard, Authentication Volume Trends dashboard',
    criblSearchQueries: [
      {
        name: 'Authentication volume by DC (last 12 hours)',
        description: 'Visualize logon event distribution across domain controllers to spot imbalances',
        query: 'dataset="$DATASET" earliest=-12h event_id in (4624, 4625)\n| timestats span=15m count() by computer'
      },
      {
        name: 'DC load comparison (current hour vs baseline)',
        description: 'Compare current authentication volume per DC against expected levels',
        query: 'dataset="$DATASET" earliest=-1h event_id in (4624, 4625)\n| summarize CurrentVolume=count() by computer\n| order by CurrentVolume desc'
      },
      {
        name: 'Source subnet distribution per DC',
        description: 'Identify which client subnets are routing to which DCs to detect affinity shifts',
        query: 'dataset="$DATASET" earliest=-4h event_id==4624\n| extend source_subnet=strcat(source_ip, "/24")\n| summarize AuthCount=count(), UniqueClients=dcount(source_ip) by computer, source_subnet\n| order by AuthCount desc\n| limit 50'
      }
    ]
  },
  {
    id: 'obs-ad-003',
    name: 'Account Lockout Spike',
    objective: 'Detect mass account lockout events (event_id 4740) that indicate misconfigured service accounts, password policy issues, stale credentials in scheduled tasks, or application credential rotation failures.',
    severity: 'High',
    category: 'Availability',
    tags: ['observability', 'lockout', 'service-account', 'availability'],
    requiredFields: ['event_id', 'timestamp', 'computer', 'target_username', 'target_domain', 'source_workstation', 'source_ip'],
    detectionLogic: 'Alert when account lockout events (event_id 4740) exceed 10 unique accounts locked within a 15-minute window, or when a single account locks out across 3+ DCs simultaneously. Also alert when any service account (naming convention match) experiences a lockout event.',
    operationalValue: 'Mass lockouts disrupt business operations — users cannot authenticate, applications fail, and helpdesk ticket volume spikes. Early detection enables rapid identification of the lockout source before it cascades to more accounts.',
    changeMgmtRelevance: 'Lockout spikes frequently follow password policy changes, credential rotation events, application deployments with stale credentials, or GPO modifications affecting lockout thresholds. Correlate with change windows.',
    troubleshootingWorkflow: '1. Identify the scope — how many accounts locked, which accounts, and which DCs reported the lockouts\n2. Check source_workstation and source_ip to find the origin of failed authentications\n3. Determine if locked accounts share a pattern (same OU, same department, service accounts)\n4. If service accounts: check scheduled tasks, application pools, and services using those credentials\n5. Review recent password policy or GPO changes that may have lowered lockout thresholds\n6. Check for credential rotation events that may not have propagated to all applications',
    dashboardDependency: 'Account Lockout Tracking dashboard, Service Account Health dashboard',
    criblSearchQueries: [
      {
        name: 'Account lockouts over time (last 12 hours)',
        description: 'Visualize lockout event frequency to identify spike timing and duration',
        query: 'dataset="$DATASET" earliest=-12h event_id==4740\n| timestats span=15m LockedAccounts=dcount(target_username), LockoutEvents=count()'
      },
      {
        name: 'Lockout sources and affected accounts (last 4 hours)',
        description: 'Identify which workstations and IPs are generating lockouts and which accounts are affected',
        query: 'dataset="$DATASET" earliest=-4h event_id==4740\n| summarize LockoutCount=count(), AffectedAccounts=dcount(target_username) by source_workstation, source_ip\n| order by LockoutCount desc\n| limit 30'
      },
      {
        name: 'Most frequently locked accounts with source details',
        description: 'Find accounts experiencing repeated lockouts and their authentication sources for root cause analysis',
        query: 'dataset="$DATASET" earliest=-4h event_id==4740\n| summarize LockoutCount=count(), Sources=dcount(source_workstation), DCs=dcount(computer) by target_username, target_domain\n| where LockoutCount > 2\n| order by LockoutCount desc'
      }
    ]
  },
  {
    id: 'obs-ad-004',
    name: 'NTLM Authentication Ratio',
    objective: 'Detect elevated NTLM authentication usage relative to Kerberos, indicating Kerberos infrastructure failures, SPN misconfigurations, legacy application issues, or DNS resolution problems forcing NTLM fallback.',
    severity: 'Medium',
    category: 'Performance',
    tags: ['observability', 'authentication', 'kerberos', 'ntlm', 'protocol-health'],
    requiredFields: ['event_id', 'timestamp', 'computer', 'auth_package', 'target_username', 'source_ip', 'logon_type'],
    detectionLogic: 'Calculate the ratio of NTLM to Kerberos authentication events (event_id 4624) over rolling 1-hour windows. Alert when NTLM percentage exceeds 30% of total authentications (baseline environment-specific) or when NTLM ratio increases >15 percentage points from 7-day baseline.',
    operationalValue: 'A rising NTLM ratio indicates Kerberos is failing to negotiate — often due to SPN misconfiguration, time sync issues, DNS failures, or KDC unavailability. This is a leading indicator of authentication degradation and exposes the environment to pass-the-hash risks.',
    changeMgmtRelevance: 'NTLM spikes commonly follow SPN changes, service account modifications, DNS infrastructure changes, application migrations, or KDC configuration changes. Also relevant during NTLMv1 deprecation campaigns.',
    troubleshootingWorkflow: '1. Confirm the NTLM ratio increase by comparing current hour to 7-day same-window baseline\n2. Identify which accounts and source IPs are generating NTLM authentications\n3. Check if Kerberos is failing (look for event_id 4771 Kerberos pre-auth failures)\n4. Verify DNS — can clients resolve DC SRV records and service SPNs?\n5. Check time synchronization between clients and DCs (Kerberos requires <5min skew)\n6. Review recent SPN changes, service account modifications, or application deployments',
    dashboardDependency: 'Authentication Protocol Distribution dashboard, Kerberos Health dashboard',
    criblSearchQueries: [
      {
        name: 'Authentication protocol ratio over time (last 12 hours)',
        description: 'Visualize the NTLM vs Kerberos authentication split to identify ratio shifts',
        query: 'dataset="$DATASET" earliest=-12h event_id==4624\n| timestats span=30m count() by auth_package'
      },
      {
        name: 'NTLM percentage by DC (current vs baseline)',
        description: 'Calculate NTLM ratio per domain controller to identify if the issue is DC-specific or environment-wide',
        query: 'dataset="$DATASET" earliest=-4h event_id==4624\n| summarize Total=count(), NTLMCount=countif(auth_package == "NTLM") by computer\n| extend NTLMPct=round(NTLMCount * 100.0 / Total, 1)\n| where NTLMPct > 20 and Total > 50\n| order by NTLMPct desc'
      },
      {
        name: 'Top NTLM users and sources',
        description: 'Identify which accounts and source IPs are driving NTLM usage for targeted remediation',
        query: 'dataset="$DATASET" earliest=-4h event_id==4624 auth_package=="NTLM"\n| summarize NTLMSessions=count() by target_username, source_ip, logon_type\n| order by NTLMSessions desc\n| limit 30'
      }
    ]
  },
  {
    id: 'obs-ad-005',
    name: 'Domain Controller Event Log Gap',
    objective: 'Detect missing expected event sequences from domain controllers that indicate logging agent failures, event log overflow, WEC forwarding issues, or DC health problems causing silent data loss.',
    severity: 'High',
    category: 'Availability',
    tags: ['observability', 'logging', 'data-completeness', 'monitoring-health'],
    requiredFields: ['event_id', 'timestamp', 'computer', 'event_channel'],
    detectionLogic: 'Monitor event volume per DC over 15-minute windows. Alert when any DC drops below 10% of its expected event rate (7-day baseline) or produces zero events for >10 minutes during business hours. Also detect gaps in event_id sequences that indicate dropped events.',
    operationalValue: 'A DC that stops emitting logs is a blind spot — security events, authentication issues, and replication problems become invisible. This detection ensures logging infrastructure health is continuously validated, preventing gaps in both observability and security coverage.',
    changeMgmtRelevance: 'Log gaps frequently follow agent updates, WEC configuration changes, event log size/retention policy modifications, or Cribl pipeline changes. Also occurs during DC patching when services restart.',
    troubleshootingWorkflow: '1. Identify which DC(s) have stopped or reduced event emission\n2. Verify if the gap is for all event channels or specific ones (Security, System, etc.)\n3. Check if the DC is still responsive (ping, RDP, other telemetry sources)\n4. Verify the logging agent/WEF subscription is running on the affected DC\n5. Check event log size — has the Security log reached max size with do-not-overwrite policy?\n6. Review Cribl pipeline and source health for the affected DC input',
    dashboardDependency: 'Log Source Health dashboard, DC Coverage Map dashboard',
    criblSearchQueries: [
      {
        name: 'Event volume by DC over time (last 12 hours)',
        description: 'Visualize event flow from each domain controller to identify gaps or drop-offs',
        query: 'dataset="$DATASET" earliest=-12h\n| timestats span=15m count() by computer'
      },
      {
        name: 'DCs with low or zero event volume (last hour)',
        description: 'Find domain controllers producing fewer events than expected based on normal activity',
        query: 'dataset="$DATASET" earliest=-1h\n| summarize EventCount=count(), Channels=dcount(event_channel), LastEvent=max(timestamp) by computer\n| where EventCount < 100\n| order by EventCount asc'
      },
      {
        name: 'Event channel coverage per DC',
        description: 'Verify each DC is emitting events across all expected channels (Security, System, Directory Service)',
        query: 'dataset="$DATASET" earliest=-4h\n| summarize EventCount=count(), LastSeen=max(timestamp) by computer, event_channel\n| order by computer asc, event_channel asc'
      }
    ]
  },
  {
    id: 'obs-ad-006',
    name: 'Group Policy Application Failures',
    objective: 'Detect GPO processing errors across the fleet that indicate DC connectivity issues, permission problems, SYSVOL replication failures, or network issues preventing clients from applying policies.',
    severity: 'Medium',
    category: 'Change Impact',
    tags: ['observability', 'group-policy', 'configuration-management', 'fleet-health'],
    requiredFields: ['event_id', 'timestamp', 'computer', 'gpo_name', 'source_ip', 'event_channel'],
    detectionLogic: 'Monitor GPO-related event IDs (1058, 1030 for processing failures; 4098 for preference failures) and alert when failure count exceeds 5% of total GPO events across the fleet in a 1-hour window, or when failures are concentrated on a specific GPO name (indicating a newly pushed policy issue).',
    operationalValue: 'GPO failures mean machines are drifting from desired configuration state — security settings, software deployments, and operational policies are not being applied. Detecting failures quickly enables remediation before fleet configuration diverges.',
    changeMgmtRelevance: 'GPO failures spike after new policy creation, policy link changes, SYSVOL modifications, permission changes on GPO objects, or WMI filter additions. Directly tied to change validation for Active Directory administrators.',
    troubleshootingWorkflow: '1. Identify which GPO(s) are failing and on how many endpoints\n2. Determine if failures are for a specific GPO (new/modified policy) or widespread (infrastructure issue)\n3. Check if affected machines can reach SYSVOL (\\\\domain\\SYSVOL connectivity)\n4. Verify GPO permissions — can the computer accounts read the GPO?\n5. Check SYSVOL replication status — is the GPO consistent across all DCs?\n6. Review recent GPO modifications, link changes, or WMI filter additions in change management',
    dashboardDependency: 'GPO Health dashboard, Fleet Compliance dashboard',
    criblSearchQueries: [
      {
        name: 'GPO processing events over time (last 12 hours)',
        description: 'Visualize GPO success vs failure events to identify when processing issues began',
        query: 'dataset="$DATASET" earliest=-12h event_id in (1058, 1030, 4098, 8000, 8001)\n| timestats span=30m count() by event_id'
      },
      {
        name: 'GPO failures by policy name and affected machines',
        description: 'Identify which policies are failing and the scope of impact across the fleet',
        query: 'dataset="$DATASET" earliest=-4h event_id in (1058, 1030, 4098)\n| summarize FailureCount=count(), AffectedMachines=dcount(computer) by gpo_name\n| order by AffectedMachines desc'
      },
      {
        name: 'Machines with highest GPO failure rates',
        description: 'Find endpoints experiencing the most GPO failures for targeted remediation',
        query: 'dataset="$DATASET" earliest=-4h event_id in (1058, 1030, 4098)\n| summarize FailureCount=count(), FailedPolicies=dcount(gpo_name) by computer, source_ip\n| where FailureCount > 3\n| order by FailureCount desc\n| limit 30'
      }
    ]
  },
  {
    id: 'obs-ad-007',
    name: 'Service Account Authentication Patterns',
    objective: 'Detect changes in service account authentication frequency that indicate application restart loops, scaling events, credential rotation issues, or application health degradation.',
    severity: 'Medium',
    category: 'Availability',
    tags: ['observability', 'service-account', 'application-health', 'authentication-patterns'],
    requiredFields: ['event_id', 'timestamp', 'computer', 'target_username', 'target_domain', 'logon_type', 'source_ip', 'source_workstation', 'logon_process'],
    detectionLogic: 'Baseline service account authentication frequency (event_id 4624, logon_type 3 or 5) per account over 7-day rolling window. Alert when frequency increases >300% (restart loops, scaling) or decreases >80% (application stopped, credential expired). Use logon_type and logon_process to distinguish network vs service logons.',
    operationalValue: 'Service accounts are the heartbeat of applications. A sudden increase means an app is restart-looping or scaling unexpectedly; a decrease means it stopped authenticating (crashed, credential expired, or decommissioned without cleanup). Both require investigation.',
    changeMgmtRelevance: 'Pattern changes correlate with application deployments, credential rotations, infrastructure scaling events, or service restarts during maintenance windows. Also relevant during password rotation campaigns for service accounts.',
    troubleshootingWorkflow: '1. Identify which service account(s) show abnormal authentication patterns\n2. Determine if the change is an increase (restart loops, scaling) or decrease (stopped, credential issues)\n3. Check source_workstation — are authentications coming from expected application servers?\n4. For increases: look for rapid repeated logons from the same source (restart loop signature)\n5. For decreases: verify the application is running and check for event_id 4625 failures from the same account\n6. Correlate with application deployment logs, credential rotation schedules, or infrastructure scaling events',
    dashboardDependency: 'Service Account Activity dashboard, Application Authentication Trends dashboard',
    criblSearchQueries: [
      {
        name: 'Service account authentication frequency (last 24 hours)',
        description: 'Visualize authentication patterns for service accounts to identify frequency changes',
        query: 'dataset="$DATASET" earliest=-24h event_id==4624 logon_type in (3, 5)\n| where target_username endswith "$" or target_username startswith "svc-"\n| timestats span=30m count() by target_username'
      },
      {
        name: 'Service accounts with authentication volume anomalies (last 4 hours)',
        description: 'Find service accounts authenticating significantly more or less than expected',
        query: 'dataset="$DATASET" earliest=-4h event_id==4624 logon_type in (3, 5)\n| where target_username endswith "$" or target_username startswith "svc-"\n| summarize AuthCount=count(), UniqueSources=dcount(source_workstation), UniqueTargets=dcount(computer) by target_username\n| order by AuthCount desc\n| limit 30'
      },
      {
        name: 'Service account rapid-fire authentications (restart loop detection)',
        description: 'Identify service accounts with very high frequency authentications from the same source indicating application restart loops',
        query: 'dataset="$DATASET" earliest=-1h event_id==4624 logon_type in (3, 5)\n| where target_username endswith "$" or target_username startswith "svc-"\n| summarize AuthCount=count() by target_username, source_workstation, logon_process\n| where AuthCount > 50\n| order by AuthCount desc'
      }
    ]
  }
],
  'akamai-waf': [
    {
      id: 'obs-akm-001',
      name: 'WAF Rule False Positive Rate',
      objective: 'Monitor WAF rule trigger rates to identify rules generating excessive false positives that may impact legitimate traffic or require tuning.',
      category: 'WAF Effectiveness',
      tags: ['observability', 'waf-tuning', 'false-positives', 'availability'],
      requiredFields: ['rule_id', 'rule_tag', 'rule_action', 'host', 'path', 'status', 'risk_score', 'timestamp'],
      detectionLogic: 'Alert when a rule_id in alert mode triggers at a rate >50% higher than its 7-day baseline, or when a specific host+rule combination shows >20% of total requests being flagged (indicating false positive condition).',
      falsePositives: ['Legitimate attack campaigns causing genuine trigger spikes', 'Application changes introducing patterns matching WAF rules', 'New WAF rule deployment with expected initial learning period'],
      tuningGuidance: 'Establish per-rule baselines over 7-14 days. Separate analysis by host — a rule may be accurate for one application but noisy for another. Consider per-path exceptions.',
      operationalValue: 'False positive rules degrade user experience (legitimate requests blocked) and create alert fatigue for SOC. Proactive identification enables WAF tuning before business impact.',
      changeMgmtRelevance: 'Application deployments often trigger new false positives. Correlate rule trigger spikes with deployment timestamps for rapid identification.',
      troubleshootingWorkflow: '1. Identify the rule(s) with elevated trigger rates\n2. Examine the host and path combinations being flagged\n3. Review sample flagged requests — are they legitimate?\n4. Check if a recent application deployment introduced new patterns\n5. Create a targeted exception or adjust rule sensitivity\n6. Monitor after tuning to confirm false positive reduction',
      criblSearchQueries: [
        {
          name: 'Rule trigger rates by rule_id (last 24 hours)',
          description: 'Rank rules by trigger frequency to identify noisiest rules',
          query: 'dataset="$DATASET" rule_action in ("deny", "alert") earliest=-24h\n| summarize Triggers=count(), Hosts=dcount(host), Sources=dcount(client_ip) by rule_id, rule_tag, rule_action\n| order by Triggers desc\n| limit 30'
        },
        {
          name: 'False positive ratio by host and rule',
          description: 'Calculate what percentage of requests to each host trigger a specific rule',
          query: 'dataset="$DATASET" earliest=-24h\n| summarize TotalRequests=count(), RuleHits=countif(rule_action in ("deny", "alert")) by host, rule_id\n| where RuleHits > 10\n| extend FPRatio=round(RuleHits * 100.0 / TotalRequests, 2)\n| where FPRatio > 5\n| order by FPRatio desc'
        },
        {
          name: 'Rule trigger trend over time',
          description: 'Visualize rule trigger volume to identify spikes vs baseline',
          query: 'dataset="$DATASET" rule_action in ("deny", "alert") earliest=-7d\n| timestats span=1h count() by rule_id\n| order by count_ desc'
        }
      ]
    },
    {
      id: 'obs-akm-002',
      name: 'Request Latency by Region',
      objective: 'Monitor request processing latency across geographic regions to identify performance degradation affecting specific user populations.',
      category: 'Performance',
      tags: ['observability', 'latency', 'performance', 'geographic'],
      requiredFields: ['host', 'status', 'bytes', 'country', 'region', 'timestamp'],
      detectionLogic: 'Alert when average response time for a specific region exceeds the 95th percentile of its 7-day baseline, or when one region shows >2x the latency of other regions serving the same host.',
      falsePositives: ['Regional internet issues outside of Akamai control', 'Planned maintenance on origin servers serving specific regions', 'Large file downloads skewing average latency'],
      tuningGuidance: 'Separate analysis by host — different applications have different acceptable latency profiles. Exclude large file downloads (bytes > 10MB) from latency calculations.',
      operationalValue: 'Regional performance degradation directly impacts user experience and revenue in affected markets. Early detection enables traffic steering or origin failover before user-reported incidents.',
      changeMgmtRelevance: 'Origin server changes, CDN configuration updates, or DNS routing modifications can cause regional latency shifts. Correlate with change windows.',
      troubleshootingWorkflow: '1. Identify affected region(s) and severity of latency increase\n2. Check if the issue is specific to one host or all hosts in region\n3. Verify Akamai edge health in the affected region\n4. Check origin server health metrics for region-specific backends\n5. Review recent CDN configuration changes\n6. Consider traffic steering to alternate regions if prolonged',
      criblSearchQueries: [
        {
          name: 'Average latency by country (last 4 hours)',
          description: 'Compare response characteristics across regions',
          query: 'dataset="$DATASET" earliest=-4h\n| summarize AvgBytes=avg(bytes), RequestCount=count(), p95_status=max(status) by country, host\n| where RequestCount > 100\n| order by AvgBytes desc'
        },
        {
          name: 'Regional performance comparison',
          description: 'Side-by-side view of request metrics per region to spot outliers',
          query: 'dataset="$DATASET" earliest=-12h\n| summarize Requests=count(), AvgBytes=avg(bytes), ErrorRate=countif(status >= 500) * 100.0 / count() by country\n| where Requests > 50\n| order by ErrorRate desc'
        },
        {
          name: 'Latency trend by region over time',
          description: 'Visualize performance trends per region to identify degradation onset',
          query: 'dataset="$DATASET" earliest=-24h\n| timestats span=30m AvgResponseSize=avg(bytes), Requests=count() by country'
        }
      ]
    },
    {
      id: 'obs-akm-003',
      name: 'Bot Traffic Volume Trending',
      objective: 'Monitor bot traffic volume trends to identify sudden shifts in automated access patterns that may indicate new bot campaigns or bot management issues.',
      category: 'Traffic Analysis',
      tags: ['observability', 'bot-traffic', 'trending', 'capacity'],
      requiredFields: ['bot_score', 'bot_category', 'host', 'path', 'method', 'status', 'bytes', 'timestamp'],
      detectionLogic: 'Alert when bot traffic (bot_score > 50) exceeds 200% of its 7-day average for a given host, or when a new bot_category appears at volume (>100 requests in 1 hour) that was not seen previously.',
      falsePositives: ['Search engine crawl spikes (Googlebot index refresh)', 'Legitimate partner API integrations with variable volume', 'Seasonal traffic patterns (holiday shopping bots)'],
      tuningGuidance: 'Separate good bots (search engines) from bad bots in trending. Establish per-category baselines. Consider day-of-week patterns for legitimate crawlers.',
      operationalValue: 'Bot traffic spikes directly impact origin server capacity and CDN costs. Identifying new bot campaigns enables proactive mitigation before performance degradation.',
      changeMgmtRelevance: 'New product launches or pricing changes often trigger scraper bot spikes. Correlate with marketing/product release calendars.',
      troubleshootingWorkflow: '1. Identify the bot category driving the volume increase\n2. Check if these are known good bots or malicious\n3. Review targeted endpoints — are they high-cost origin paths?\n4. Assess capacity impact — is origin being overloaded?\n5. Consider rate limiting or challenge escalation for bad bots\n6. Verify bot management rules are functioning correctly',
      criblSearchQueries: [
        {
          name: 'Bot traffic volume by category',
          description: 'Breakdown of bot traffic by classification',
          query: 'dataset="$DATASET" bot_score > 50 earliest=-24h\n| summarize Requests=count(), Bytes=sum(bytes), UniqueIPs=dcount(client_ip) by bot_category, host\n| order by Requests desc'
        },
        {
          name: 'Bot traffic trend over time',
          description: 'Visualize bot volume trends to identify spikes and patterns',
          query: 'dataset="$DATASET" bot_score > 50 earliest=-7d\n| timestats span=1h count() by bot_category'
        },
        {
          name: 'Bot vs human traffic ratio',
          description: 'Track the proportion of automated vs human traffic per host',
          query: 'dataset="$DATASET" earliest=-24h\n| extend is_bot = iif(bot_score > 50, "bot", "human")\n| summarize count() by is_bot, host\n| order by host asc'
        }
      ]
    },
    {
      id: 'obs-akm-004',
      name: '4xx/5xx Error Rate by Host',
      objective: 'Monitor HTTP error rates per host to detect application issues, misconfigurations, or degraded origin server health.',
      category: 'Application Health',
      tags: ['observability', 'error-rate', 'availability', 'application-health'],
      requiredFields: ['host', 'status', 'path', 'method', 'bytes', 'client_ip', 'timestamp'],
      detectionLogic: 'Alert when 4xx or 5xx error rate exceeds baseline by >50% for a given host over a 15-minute window. Separate thresholds for 4xx (client errors indicating broken links or API changes) and 5xx (server errors indicating origin issues).',
      falsePositives: ['Scanning activity generating 404s (filter by bot_score)', 'Planned deployments with expected brief error spikes', 'A/B testing with intentional 4xx for feature flags'],
      tuningGuidance: 'Separate 4xx and 5xx alerts — they have different causes and owners. Exclude known scanner traffic from 4xx baseline. Set per-host thresholds based on historical error rates.',
      operationalValue: 'Error rate increases directly indicate service degradation visible to users. 5xx errors mean origin failure; 4xx spikes may indicate broken deployments or removed endpoints.',
      changeMgmtRelevance: 'Application deployments frequently cause error rate changes. 404 spikes indicate removed endpoints; 500 spikes indicate deployment bugs. Correlate with CI/CD.',
      troubleshootingWorkflow: '1. Identify which host and specific paths show elevated errors\n2. Classify error type: 4xx (client/routing) vs 5xx (server/origin)\n3. Check if error increase correlates with a recent deployment\n4. Review specific status codes (502=origin down, 503=capacity, 504=timeout)\n5. Check origin server health metrics directly\n6. Consider serving stale cache or error pages while origin recovers',
      criblSearchQueries: [
        {
          name: 'Error rate by host (last 4 hours)',
          description: 'Calculate error rates per host to identify degraded services',
          query: 'dataset="$DATASET" earliest=-4h\n| summarize Total=count(), Errors4xx=countif(status >= 400 and status < 500), Errors5xx=countif(status >= 500) by host\n| extend ErrorRate4xx=round(Errors4xx * 100.0 / Total, 2), ErrorRate5xx=round(Errors5xx * 100.0 / Total, 2)\n| where ErrorRate5xx > 1 or ErrorRate4xx > 10\n| order by ErrorRate5xx desc'
        },
        {
          name: 'Error trend over time',
          description: 'Visualize error rate trends to identify degradation onset',
          query: 'dataset="$DATASET" status >= 400 earliest=-12h\n| timestats span=10m count() by host, error_class=iif(status >= 500, "5xx", "4xx")'
        },
        {
          name: 'Top error paths',
          description: 'Identify specific endpoints generating the most errors',
          query: 'dataset="$DATASET" status >= 500 earliest=-4h\n| summarize Errors=count(), StatusCodes=makeset(status) by host, path, method\n| order by Errors desc\n| limit 30'
        }
      ]
    },
    {
      id: 'obs-akm-005',
      name: 'Bandwidth Utilization',
      objective: 'Monitor total bandwidth consumption across hosts to detect unusual spikes that may indicate DDoS, viral content, or capacity planning needs.',
      category: 'Capacity',
      tags: ['observability', 'bandwidth', 'capacity', 'cost'],
      requiredFields: ['host', 'bytes', 'status', 'country', 'path', 'timestamp'],
      detectionLogic: 'Alert when total egress bandwidth for a host exceeds 150% of its peak hourly baseline, or when total platform bandwidth approaches contracted capacity limits.',
      falsePositives: ['Viral content legitimately driving traffic spikes', 'Large file releases (software updates, media)', 'Marketing campaign launches with expected traffic increases'],
      tuningGuidance: 'Set per-host bandwidth baselines accounting for day-of-week and time-of-day patterns. Create separate alerts for cost thresholds vs performance thresholds.',
      operationalValue: 'Bandwidth spikes directly impact CDN costs and may cause origin capacity issues. Early detection enables cache optimization, traffic steering, or capacity scaling.',
      changeMgmtRelevance: 'Content releases, product launches, and marketing campaigns should have corresponding bandwidth increase expectations. Unexpected spikes warrant investigation.',
      troubleshootingWorkflow: '1. Identify which host(s) and path(s) drive bandwidth increase\n2. Determine if this is legitimate traffic or abuse\n3. Check cache hit ratio — are requests hitting origin unnecessarily?\n4. Review if content can be further cached at edge\n5. Assess cost impact based on current CDN contract\n6. Consider bandwidth throttling for abusive consumers',
      criblSearchQueries: [
        {
          name: 'Bandwidth by host (last 24 hours)',
          description: 'Total bytes served per host to identify top consumers',
          query: 'dataset="$DATASET" earliest=-24h\n| summarize TotalBytes=sum(bytes), Requests=count() by host\n| extend TotalGB=round(TotalBytes / 1073741824.0, 2)\n| order by TotalBytes desc'
        },
        {
          name: 'Bandwidth trend over time',
          description: 'Visualize bandwidth consumption trends per host',
          query: 'dataset="$DATASET" earliest=-7d\n| timestats span=1h sum(bytes) / 1073741824.GB=0 by host'
        },
        {
          name: 'Top bandwidth paths',
          description: 'Identify specific endpoints consuming the most bandwidth',
          query: 'dataset="$DATASET" earliest=-4h\n| summarize TotalBytes=sum(bytes), Requests=count() by host, path\n| extend AvgSizeMB=round(TotalBytes / Requests / 1048576.0, 2)\n| order by TotalBytes desc\n| limit 30'
        }
      ]
    },
    {
      id: 'obs-akm-006',
      name: 'Origin Response Time Degradation',
      objective: 'Detect when origin server response times degrade, indicating backend performance issues that Akamai CDN cannot mask.',
      category: 'Origin Health',
      tags: ['observability', 'origin', 'latency', 'backend-health'],
      requiredFields: ['host', 'status', 'bytes', 'path', 'country', 'timestamp'],
      detectionLogic: 'Alert when origin response characteristics indicate degradation: increased 5xx from origin (502, 503, 504 errors), reduced throughput (lower bytes/request for dynamic content), or increased timeout indicators.',
      falsePositives: ['Planned origin maintenance windows', 'Expected performance degradation during batch processing', 'Region-specific origin issues not affecting all users'],
      tuningGuidance: 'Focus on cache-miss traffic (dynamic content) as cached responses mask origin issues. Separate analysis by origin/backend if multiple origins serve the same host.',
      operationalValue: 'Origin degradation eventually impacts all users once cache TTLs expire. Early detection from edge metrics provides warning before origin-side monitoring detects the issue.',
      changeMgmtRelevance: 'Origin deployments, database migrations, and infrastructure changes are common causes of response time degradation. Correlate with origin change windows.',
      troubleshootingWorkflow: '1. Identify which host and paths show degraded origin response\n2. Check specific error codes (502=connection failure, 504=timeout)\n3. Determine if issue is intermittent or sustained\n4. Check origin server directly for health/capacity metrics\n5. Review if Akamai cache can serve stale content during degradation\n6. Consider failover to secondary origin if available',
      criblSearchQueries: [
        {
          name: 'Origin error rates (502/503/504)',
          description: 'Track origin-specific error codes indicating backend issues',
          query: 'dataset="$DATASET" status in (502, 503, 504) earliest=-12h\n| timestats span=10m count() by host, status'
        },
        {
          name: 'Origin health by host',
          description: 'Calculate origin error rate per host over time',
          query: 'dataset="$DATASET" earliest=-4h\n| summarize Total=count(), OriginErrors=countif(status in (502, 503, 504)) by host\n| extend OriginErrorRate=round(OriginErrors * 100.0 / Total, 2)\n| where OriginErrors > 0\n| order by OriginErrorRate desc'
        },
        {
          name: 'Response size anomaly (potential timeout indicators)',
          description: 'Find requests with abnormally small responses that may indicate truncated/failed origin responses',
          query: 'dataset="$DATASET" status=200 earliest=-4h\n| summarize AvgBytes=avg(bytes), MinBytes=min(bytes), Requests=count() by host, path\n| where AvgBytes < 100 and Requests > 10\n| order by Requests desc'
        }
      ]
    },
    {
      id: 'obs-akm-007',
      name: 'Rule Trigger Rate Baseline',
      objective: 'Establish and monitor WAF rule trigger rate baselines to detect configuration drift, rule effectiveness changes, or evolving attack patterns.',
      category: 'WAF Operations',
      tags: ['observability', 'baseline', 'waf-health', 'trending'],
      requiredFields: ['rule_id', 'rule_tag', 'rule_action', 'host', 'timestamp'],
      detectionLogic: 'Monitor per-rule trigger rates over time. Alert when any rule shows >3 standard deviations from its rolling 14-day baseline, either high (new attack pattern or false positive) or low (rule may have become ineffective).',
      falsePositives: ['Legitimate attack volume variations', 'WAF policy updates intentionally changing rule behavior', 'Seasonal traffic pattern changes affecting trigger rates'],
      tuningGuidance: 'Use 14-day rolling baselines with day-of-week normalization. Separate baselines by rule_action (deny vs alert have different patterns). Alert on both high and low deviations.',
      operationalValue: 'Proactive WAF health monitoring ensures protection remains effective. Rules that stop triggering may indicate evasion techniques or misconfiguration. Rules that spike indicate new attack patterns or false positives.',
      changeMgmtRelevance: 'WAF policy updates should show expected changes in rule trigger patterns. Unexpected changes after unrelated deployments indicate application-introduced false positives.',
      troubleshootingWorkflow: '1. Identify rules with significant baseline deviation\n2. Determine direction: spike (new attacks/FP) vs drop (ineffective/bypassed)\n3. For spikes: analyze if triggers are legitimate attacks or false positives\n4. For drops: verify rule is still active and evaluate if attack pattern evolved\n5. Adjust baseline after confirmed legitimate changes\n6. Document findings for WAF tuning review',
      criblSearchQueries: [
        {
          name: 'Rule trigger rate comparison (current vs 7-day average)',
          description: 'Compare current trigger rates against baseline for all active rules',
          query: 'dataset="$DATASET" rule_action in ("deny", "alert") earliest=-24h\n| summarize CurrentRate=count() by rule_id, rule_tag\n| order by CurrentRate desc\n| limit 50'
        },
        {
          name: 'Rule effectiveness trending',
          description: 'Visualize per-rule trigger rates over time to identify drift',
          query: 'dataset="$DATASET" rule_action in ("deny", "alert") earliest=-14d\n| timestats span=1d count() by rule_id'
        },
        {
          name: 'Rules with sudden silence (potential bypass)',
          description: 'Find rules that recently stopped triggering after consistent activity',
          query: 'dataset="$DATASET" rule_action in ("deny", "alert") earliest=-1h\n| summarize RecentTriggers=count() by rule_id, rule_tag\n| where RecentTriggers < 5\n| order by RecentTriggers asc'
        }
      ]
    }
  ],
  'o365-activity': [
    {
      id: 'obs-o365-001',
      name: 'Workload Availability Monitoring',
      objective: 'Monitor O365 workload availability by tracking operation success rates and detecting service degradation across Exchange, SharePoint, Teams, and Azure AD.',
      category: 'Availability',
      tags: ['observability', 'availability', 'service-health', 'o365'],
      requiredFields: ['workload', 'operation', 'result_status', 'record_type', 'creation_time'],
      detectionLogic: 'Alert when operation failure rate for any workload exceeds 5% over a 15-minute window, or when total event volume for a workload drops below 20% of its hourly baseline (indicating potential outage).',
      falsePositives: ['Microsoft planned maintenance windows', 'Regional O365 outages already communicated via Service Health Dashboard', 'Temporary blips during service updates'],
      tuningGuidance: 'Set per-workload baselines — Exchange and SharePoint have different normal failure rates. Correlate with Microsoft Service Health API for known outages. Consider time-of-day patterns.',
      operationalValue: 'Provides independent O365 availability monitoring from your own audit data, complementing Microsoft Service Health. Detects issues before they appear in Service Health Dashboard.',
      changeMgmtRelevance: 'O365 tenant configuration changes (conditional access, DLP policies, retention policies) can impact workload availability. Correlate with admin change audit events.',
      troubleshootingWorkflow: '1. Identify which workload(s) show elevated failure rates\n2. Check Microsoft Service Health Dashboard for known incidents\n3. Determine if the issue is organization-wide or specific to user subset\n4. Review failure patterns — specific operations failing or all operations?\n5. Check if recent tenant configuration changes correlate with onset\n6. Open Microsoft support ticket if issue is not acknowledged',
      criblSearchQueries: [
        {
          name: 'Workload success/failure rates (last 4 hours)',
          description: 'Calculate operation success rate per workload',
          query: 'dataset="$DATASET" earliest=-4h\n| summarize Total=count(), Failures=countif(result_status=="Failed") by workload\n| extend FailureRate=round(Failures * 100.0 / Total, 2)\n| order by FailureRate desc'
        },
        {
          name: 'Workload volume trend',
          description: 'Track event volume per workload to detect drops indicating outages',
          query: 'dataset="$DATASET" earliest=-24h\n| timestats span=15m count() by workload'
        },
        {
          name: 'Failed operations breakdown',
          description: 'Identify which specific operations are failing within a degraded workload',
          query: 'dataset="$DATASET" result_status=="Failed" earliest=-4h\n| summarize Failures=count() by workload, operation\n| order by Failures desc\n| limit 30'
        }
      ]
    },
    {
      id: 'obs-o365-002',
      name: 'Throttling/Rate Limit Events',
      objective: 'Monitor O365 API throttling events that indicate applications or users are exceeding service limits, causing degraded functionality.',
      category: 'Performance',
      tags: ['observability', 'throttling', 'rate-limiting', 'api-health'],
      requiredFields: ['workload', 'operation', 'result_status', 'user_id', 'application_id', 'client_ip', 'creation_time'],
      detectionLogic: 'Alert when throttling indicators appear: result_status containing "throttled" or specific throttle operations. Track throttle rate per user/application and alert when exceeding 10 throttle events in 5 minutes.',
      falsePositives: ['Legitimate high-volume API usage during peak hours', 'Migration tools with expected high API call rates', 'Backup solutions with known throttle patterns'],
      tuningGuidance: 'Separate user-level throttling (individual impact) from application-level throttling (service impact). Whitelist known migration tools. Focus on persistent throttling vs occasional bursts.',
      operationalValue: 'Throttling directly impacts application functionality and user experience. Proactive monitoring enables API call optimization or service limit increase requests before users are impacted.',
      changeMgmtRelevance: 'New application deployments, migration projects, or configuration changes can trigger unexpected throttling. Correlate with project timelines.',
      troubleshootingWorkflow: '1. Identify which user/application is being throttled\n2. Determine the throttle type (user-level, application-level, tenant-level)\n3. Review the operation pattern causing throttle\n4. Check if a migration or bulk operation is running\n5. Optimize API call patterns (batching, delta queries)\n6. Request service limit increase if legitimate need',
      criblSearchQueries: [
        {
          name: 'Throttle events by application',
          description: 'Find applications experiencing API throttling',
          query: 'dataset="$DATASET" tolower(result_status) matches regex "(throttl|429|rate.limit)" earliest=-24h\n| summarize ThrottleCount=count() by application_id, user_id, workload\n| order by ThrottleCount desc'
        },
        {
          name: 'Throttle rate trend over time',
          description: 'Visualize throttling patterns to identify peak throttle windows',
          query: 'dataset="$DATASET" tolower(result_status) matches regex "(throttl|429|rate.limit)" earliest=-7d\n| timestats span=1h count() by workload'
        },
        {
          name: 'Operations triggering throttles',
          description: 'Identify which specific API operations cause the most throttling',
          query: 'dataset="$DATASET" tolower(result_status) matches regex "(throttl|429|rate.limit)" earliest=-24h\n| summarize count() by operation, workload, application_id\n| order by count_ desc\n| limit 20'
        }
      ]
    },
    {
      id: 'obs-o365-003',
      name: 'Mailbox Size Trending',
      objective: 'Monitor mailbox usage patterns to identify users approaching quota limits, abnormal growth rates, or storage optimization opportunities.',
      category: 'Capacity',
      tags: ['observability', 'capacity', 'mailbox', 'storage'],
      requiredFields: ['user_id', 'operation', 'workload', 'object_id', 'creation_time'],
      detectionLogic: 'Track mail-related operations (send, receive, attachment) volume per user over time. Alert when operation velocity suggests rapid mailbox growth exceeding normal patterns (>3x daily average).',
      falsePositives: ['Users receiving bulk notifications from legitimate services', 'Mail migration importing historical messages', 'Newsletter subscriptions with high daily volume'],
      tuningGuidance: 'Set per-user baselines based on role — executives typically have higher mail volume than individual contributors. Focus on receive operations for growth detection.',
      operationalValue: 'Users hitting mailbox quotas impacts productivity. Proactive identification enables quota management, archive policy application, or license tier upgrades before disruption.',
      changeMgmtRelevance: 'Retention policy changes and archive configurations directly impact mailbox sizing. New compliance holds can cause unexpected growth.',
      troubleshootingWorkflow: '1. Identify users with abnormal mail operation velocity\n2. Check if growth is from received mail or sent mail\n3. Review if large attachments are contributing\n4. Check mailbox quota status via Exchange admin\n5. Apply archive policies or increase quota if appropriate\n6. Investigate if excessive mail indicates spam/phishing campaign',
      criblSearchQueries: [
        {
          name: 'Mail operation volume by user (last 7 days)',
          description: 'Track mail activity per user to identify abnormal growth',
          query: 'dataset="$DATASET" workload=="Exchange" operation in ("Send", "SendAs", "SendOnBehalf", "Create") earliest=-7d\n| summarize MailOps=count() by user_id\n| order by MailOps desc\n| limit 30'
        },
        {
          name: 'Mail volume trend over time',
          description: 'Visualize mail operation patterns to identify velocity changes',
          query: 'dataset="$DATASET" workload=="Exchange" earliest=-7d\n| timestats span=1h count() by operation'
        },
        {
          name: 'Users with rapid mail growth',
          description: 'Identify users receiving significantly more mail than baseline',
          query: 'dataset="$DATASET" workload=="Exchange" operation=="Create" earliest=-24h\n| summarize DailyReceived=count() by user_id\n| where DailyReceived > 200\n| order by DailyReceived desc'
        }
      ]
    },
    {
      id: 'obs-o365-004',
      name: 'SharePoint Storage Utilization',
      objective: 'Monitor SharePoint site collection storage utilization patterns to detect rapid growth, identify large file uploads, and support capacity planning.',
      category: 'Capacity',
      tags: ['observability', 'storage', 'sharepoint', 'capacity-planning'],
      requiredFields: ['operation', 'workload', 'site_url', 'source_file_name', 'source_file_extension', 'user_id', 'object_id', 'creation_time'],
      detectionLogic: 'Track file upload operations per site. Alert when daily file upload volume for a site exceeds 200% of its 30-day average, or when large file uploads (>100MB) occur to sites approaching quota.',
      falsePositives: ['Planned content migration projects', 'New project kickoffs with bulk document upload', 'Automated backup processes storing files in SharePoint'],
      tuningGuidance: 'Set per-site baselines as different site collections have vastly different upload patterns. Focus on production sites vs personal OneDrive sites.',
      operationalValue: 'SharePoint storage quota exhaustion blocks user uploads and collaboration. Early detection enables quota expansion, content cleanup, or archive policy application.',
      changeMgmtRelevance: 'New project creations, migration activities, and policy changes (requiring document uploads) directly impact storage utilization.',
      troubleshootingWorkflow: '1. Identify site(s) with abnormal upload velocity\n2. Determine which users are uploading and what file types\n3. Check if this is a planned migration or project activity\n4. Review site storage quota and current utilization\n5. Apply storage management policies (versioning limits, recycle bin)\n6. Expand quota or archive old content as appropriate',
      criblSearchQueries: [
        {
          name: 'File upload volume by site (last 7 days)',
          description: 'Track upload activity per SharePoint site',
          query: 'dataset="$DATASET" workload=="SharePoint" operation in ("FileUploaded", "FileModified") earliest=-7d\n| summarize Uploads=count(), Users=dcount(user_id), FileTypes=makeset(source_file_extension) by site_url\n| order by Uploads desc\n| limit 30'
        },
        {
          name: 'Upload activity trend',
          description: 'Visualize upload patterns over time per site',
          query: 'dataset="$DATASET" workload=="SharePoint" operation=="FileUploaded" earliest=-7d\n| timestats span=1d count() by site_url'
        },
        {
          name: 'Large file uploads',
          description: 'Identify uploads of very large files that rapidly consume storage',
          query: 'dataset="$DATASET" workload=="SharePoint" operation=="FileUploaded" earliest=-7d\n| where source_file_extension in ("zip", "pst", "bak", "vhdx", "iso")\n| summarize count() by user_id, site_url, source_file_extension\n| order by count_ desc'
        }
      ]
    },
    {
      id: 'obs-o365-005',
      name: 'Teams Call Quality Metrics',
      objective: 'Monitor Teams collaboration patterns and call/meeting volume to identify service quality issues and adoption trends.',
      category: 'Collaboration Health',
      tags: ['observability', 'teams', 'collaboration', 'adoption'],
      requiredFields: ['workload', 'operation', 'user_id', 'result_status', 'creation_time'],
      detectionLogic: 'Track Teams operation volume and failure rates. Alert when meeting/call creation failures exceed 5% or when Teams event volume drops below 50% of baseline (indicating potential service issue or adoption decline).',
      falsePositives: ['Holiday periods with naturally reduced Teams usage', 'Company-wide events reducing normal meeting patterns', 'Teams service updates causing brief interruptions'],
      tuningGuidance: 'Establish day-of-week and time-of-day baselines for Teams operations. Focus on failure rates rather than volume for quality monitoring. Consider regional patterns.',
      operationalValue: 'Teams service quality directly impacts organizational productivity. Early detection of quality degradation enables proactive communication and alternative arrangements.',
      changeMgmtRelevance: 'Network changes, firewall policy updates, and proxy configurations can impact Teams quality. Correlate with infrastructure change windows.',
      troubleshootingWorkflow: '1. Identify specific Teams operations showing elevated failure rates\n2. Determine if failures are organization-wide or user-specific\n3. Check Microsoft Teams Service Health for known issues\n4. Review network quality metrics (if available from Teams admin)\n5. Check if recent network/proxy changes correlate with onset\n6. Escalate to Microsoft support if persistent and not acknowledged',
      criblSearchQueries: [
        {
          name: 'Teams operation success rate',
          description: 'Monitor Teams operation health by failure rate',
          query: 'dataset="$DATASET" workload=="MicrosoftTeams" earliest=-24h\n| summarize Total=count(), Failures=countif(result_status=="Failed") by operation\n| extend FailRate=round(Failures * 100.0 / Total, 2)\n| where Total > 10\n| order by FailRate desc'
        },
        {
          name: 'Teams usage trend',
          description: 'Track Teams activity volume over time for adoption and health monitoring',
          query: 'dataset="$DATASET" workload=="MicrosoftTeams" earliest=-7d\n| timestats span=1h count() by operation'
        },
        {
          name: 'Teams failures by user',
          description: 'Identify users experiencing the most Teams failures',
          query: 'dataset="$DATASET" workload=="MicrosoftTeams" result_status=="Failed" earliest=-24h\n| summarize Failures=count(), Operations=makeset(operation) by user_id\n| order by Failures desc\n| limit 20'
        }
      ]
    },
    {
      id: 'obs-o365-006',
      name: 'Sync Error Rate',
      objective: 'Monitor OneDrive/SharePoint sync errors to detect client issues, service degradation, or network problems affecting file synchronization.',
      category: 'Sync Health',
      tags: ['observability', 'sync', 'onedrive', 'client-health'],
      requiredFields: ['workload', 'operation', 'result_status', 'user_id', 'user_agent', 'client_ip', 'creation_time'],
      detectionLogic: 'Alert when sync-related operation failure rate exceeds 10% over a 30-minute window, or when sync failures concentrate on specific client versions or network segments.',
      falsePositives: ['Users with intermittent connectivity (mobile workers)', 'Large file sync conflicts during collaborative editing', 'OneDrive client update rollouts causing temporary sync issues'],
      tuningGuidance: 'Focus on persistent sync failures (same user, multiple attempts) vs transient failures. Separate analysis by client version to identify version-specific bugs.',
      operationalValue: 'Sync failures impact user productivity and may lead to data loss if users believe files are synchronized when they are not. Proactive detection enables helpdesk outreach.',
      changeMgmtRelevance: 'OneDrive client updates, network policy changes, and proxy configuration modifications frequently cause sync issues. Correlate with IT deployment schedules.',
      troubleshootingWorkflow: '1. Identify scope: how many users affected and which locations?\n2. Check if failures correlate with specific OneDrive client versions\n3. Review network path — proxy or firewall blocking sync traffic?\n4. Check Microsoft service health for OneDrive sync issues\n5. Identify common error patterns in failure details\n6. Deploy client updates or network exceptions as needed',
      criblSearchQueries: [
        {
          name: 'Sync failure rate (last 24 hours)',
          description: 'Track sync operation success/failure rates',
          query: 'dataset="$DATASET" workload in ("OneDrive", "SharePoint") tolower(operation) matches regex "(sync|upload|download)" earliest=-24h\n| summarize Total=count(), Failures=countif(result_status=="Failed") by workload\n| extend FailRate=round(Failures * 100.0 / Total, 2)'
        },
        {
          name: 'Sync failures by client version',
          description: 'Identify if specific client versions are causing sync issues',
          query: 'dataset="$DATASET" result_status=="Failed" tolower(operation) matches regex "(sync|filesyncupload|filesyncdownload)" earliest=-7d\n| summarize Failures=count(), Users=dcount(user_id) by user_agent\n| order by Failures desc'
        },
        {
          name: 'Users with persistent sync failures',
          description: 'Find users experiencing repeated sync issues indicating unresolved problems',
          query: 'dataset="$DATASET" result_status=="Failed" tolower(operation) matches regex "(sync|filesyncupload|filesyncdownload)" earliest=-7d\n| summarize FailCount=count(), Days=dcount(bin(creation_time, 1d)) by user_id\n| where FailCount > 20 and Days > 2\n| order by FailCount desc'
        }
      ]
    },
    {
      id: 'obs-o365-007',
      name: 'License Usage Trending',
      objective: 'Monitor O365 license utilization by tracking active user counts across workloads to support capacity planning and cost optimization.',
      category: 'Cost Optimization',
      tags: ['observability', 'licensing', 'cost', 'adoption'],
      requiredFields: ['workload', 'user_id', 'operation', 'creation_time'],
      detectionLogic: 'Track unique active users per workload per day. Alert when active user count drops below 70% of licensed count (over-provisioning) or approaches 95% of licensed count (capacity risk).',
      falsePositives: ['Holiday periods with reduced usage', 'Seasonal business patterns (academic calendars, retail cycles)', 'Department restructuring temporarily reducing active users'],
      tuningGuidance: 'Use 30-day active user counts for licensing decisions (not daily). Separate by workload — a user active in Exchange but not SharePoint still needs their license. Consider growth projections.',
      operationalValue: 'License over-provisioning wastes budget; under-provisioning blocks new users. Proactive trending enables right-sized license purchasing and identifies unused licenses for reallocation.',
      changeMgmtRelevance: 'Onboarding/offboarding waves, department closures, and M&A activity directly impact license utilization. Plan license changes in advance of workforce changes.',
      troubleshootingWorkflow: '1. Calculate active users per workload over 30-day window\n2. Compare against licensed user count from admin center\n3. Identify users with licenses but no activity (reclaim candidates)\n4. Project growth rate for capacity planning\n5. Adjust license counts in next renewal/true-up\n6. Consider downgrading license tiers for light users',
      criblSearchQueries: [
        {
          name: 'Active users per workload (last 30 days)',
          description: 'Count unique active users across each O365 workload',
          query: 'dataset="$DATASET" earliest=-30d\n| summarize ActiveUsers=dcount(user_id), Operations=count() by workload\n| order by ActiveUsers desc'
        },
        {
          name: 'Daily active user trend',
          description: 'Track daily active user counts over time per workload',
          query: 'dataset="$DATASET" earliest=-30d\n| summarize DAU=dcount(user_id) by workload, bin(creation_time, 1d)\n| order by creation_time asc'
        },
        {
          name: 'Inactive users (license but no activity)',
          description: 'Identify users with no O365 activity in 30 days — license reclaim candidates',
          query: 'dataset="$DATASET" earliest=-30d\n| summarize LastActive=max(creation_time), Workloads=makeset(workload) by user_id\n| where LastActive < ago(30d)\n| order by LastActive asc\n| limit 50'
        }
      ]
    }
  ],
  'ping-identity': [
  {
    id: 'obs-ping-001',
    name: 'Auth Latency Spike',
    objective: 'Monitor SSO transaction response time to detect when authentication latency exceeds baseline thresholds, indicating infrastructure degradation, backend directory slowness, or policy evaluation bottlenecks.',
    category: 'Performance',
    tags: ['observability', 'latency', 'sso', 'response-time'],
    requiredFields: ['timestamp', 'transaction_id', 'response_time_ms', 'application_id', 'connection_name', 'status', 'authentication_flow', 'environment_id'],
    detectionLogic: 'Baseline average authentication response time per application and flow type over 7-day rolling window. Alert when the 5-minute rolling average exceeds 2x baseline or when p95 response time exceeds 3 seconds for any application.',
    falsePositives: ['Scheduled directory sync operations temporarily increasing auth latency', 'New policy evaluation rules deployed that add expected processing time'],
    tuningGuidance: 'Adjust per-application baselines separately as complex MFA flows naturally have higher latency than simple SSO redirects. Exclude known maintenance windows from baseline calculation.',
    operationalValue: 'Authentication latency directly impacts user experience and application access. Early detection prevents cascading timeout failures across dependent applications.',
    changeMgmtRelevance: 'Latency spikes often correlate with policy changes, directory configuration updates, or infrastructure maintenance. Correlate with deployment windows to isolate change-related regressions.',
    troubleshootingWorkflow: '1. Identify which applications and authentication flows show elevated latency\n2. Check if latency is across all flows (infrastructure) or specific flows (policy/config)\n3. Review backend directory response times (LDAP/AD query latency)\n4. Check PingFederate server resource utilization (CPU, memory, thread pools)\n5. Verify external IdP partner response times if federated\n6. Correlate with recent policy or adapter configuration changes',
    criblSearchQueries: [
      {
        name: 'Authentication response time by application (last 4 hours)',
        description: 'Visualize response time trends per application to identify latency spikes',
        query: 'dataset="$DATASET" earliest=-4h status=="success"\n| timestats span=5m avg(response_time_ms), max(response_time_ms) by application_id'
      },
      {
        name: 'Applications exceeding latency threshold',
        description: 'Find applications where average response time exceeds acceptable thresholds',
        query: 'dataset="$DATASET" earliest=-30m\n| summarize AvgLatency=avg(response_time_ms), P95Latency=max(response_time_ms), AuthCount=count() by application_id, authentication_flow\n| where AvgLatency > 2000 or P95Latency > 3000\n| order by P95Latency desc'
      },
      {
        name: 'Latency distribution by authentication flow type',
        description: 'Compare latency across different authentication flow types to isolate bottlenecks',
        query: 'dataset="$DATASET" earliest=-1h\n| summarize AvgLatency=avg(response_time_ms), MinLatency=min(response_time_ms), MaxLatency=max(response_time_ms), Count=count() by authentication_flow, connection_name\n| order by AvgLatency desc'
      },
      {
        name: 'Latency trend comparison (current hour vs same hour yesterday)',
        description: 'Compare current latency patterns against previous day baseline',
        query: 'dataset="$DATASET" earliest=-2h\n| timestats span=5m avg(response_time_ms) by application_id\n| order by avg_response_time_ms desc'
      }
    ]
  },
  {
    id: 'obs-ping-002',
    name: 'SSO Outage Detection',
    objective: 'Detect when no successful authentications occur for an extended period, indicating a complete or partial SSO outage that prevents user access to applications.',
    category: 'Availability',
    tags: ['observability', 'outage', 'sso', 'availability'],
    requiredFields: ['timestamp', 'status', 'application_id', 'environment_id', 'connection_name', 'authentication_flow', 'error_code'],
    detectionLogic: 'Alert when zero successful authentications are recorded for any previously active application over a 10-minute window during business hours. Also alert when the overall success rate drops below 10% across all applications.',
    falsePositives: ['Scheduled maintenance windows with planned downtime', 'Low-traffic applications with naturally sparse authentication events outside business hours'],
    tuningGuidance: 'Configure per-application minimum expected volume thresholds. Exclude non-business hours for low-traffic apps. Set environment-specific thresholds (production vs staging).',
    operationalValue: 'Complete SSO outages immediately block all user access to connected applications. Every minute of undetected outage multiplies business impact across all integrated services.',
    changeMgmtRelevance: 'SSO outages frequently follow certificate rotations, connection configuration changes, or infrastructure deployments. Immediate correlation with recent changes enables rapid rollback.',
    troubleshootingWorkflow: '1. Confirm whether the outage is total (all apps) or partial (specific applications/connections)\n2. Check PingFederate server health and process status\n3. Verify SSL/TLS certificates have not expired\n4. Check backend directory connectivity (LDAP, AD)\n5. Review connection and adapter configurations for recent changes\n6. Check if federation partners are responding (SAML/OIDC endpoints)',
    criblSearchQueries: [
      {
        name: 'Successful vs failed authentications over time',
        description: 'Visualize authentication success/failure ratio to identify outage windows',
        query: 'dataset="$DATASET" earliest=-6h\n| timestats span=5m count() by status'
      },
      {
        name: 'Applications with zero successful auths (last 15 minutes)',
        description: 'Identify applications that have stopped processing successful authentications',
        query: 'dataset="$DATASET" earliest=-15m\n| summarize SuccessCount=countif(status=="success"), FailCount=countif(status=="failure"), Total=count() by application_id\n| where SuccessCount == 0 and Total > 0\n| order by FailCount desc'
      },
      {
        name: 'Error code distribution during outage window',
        description: 'Break down failure reasons to identify root cause of authentication failures',
        query: 'dataset="$DATASET" earliest=-30m status=="failure"\n| summarize Count=count() by error_code, application_id, connection_name\n| order by Count desc\n| limit 30'
      },
      {
        name: 'Last successful authentication per application',
        description: 'Determine when each application last processed a successful authentication',
        query: 'dataset="$DATASET" earliest=-24h status=="success"\n| summarize LastSuccess=max(timestamp), TotalSuccess=count() by application_id, environment_id\n| order by LastSuccess asc'
      }
    ]
  },
  {
    id: 'obs-ping-003',
    name: 'MFA Success Rate Drop',
    objective: 'Monitor MFA challenge completion rates to detect when users are failing MFA at abnormal rates, indicating device issues, service degradation, or user experience problems.',
    category: 'Reliability',
    tags: ['observability', 'mfa', 'success-rate', 'user-experience'],
    requiredFields: ['timestamp', 'mfa_status', 'mfa_method', 'application_id', 'user_id', 'device_type', 'environment_id', 'error_code'],
    detectionLogic: 'Calculate MFA success rate (successful challenges / total challenges) per method type over 15-minute windows. Alert when success rate drops below 85% for any method (baseline typically >95%). Track per-method independently as push, SMS, and TOTP have different expected rates.',
    falsePositives: ['Large-scale password reset campaigns causing temporary MFA re-enrollment', 'New user onboarding waves with first-time MFA setup attempts'],
    tuningGuidance: 'Set per-method thresholds since push notifications have higher natural failure rate than TOTP. Exclude accounts in enrollment state from success rate calculations.',
    operationalValue: 'MFA failure rate increases indicate either service degradation (push delivery issues, SMS gateway problems) or user-facing issues (device compatibility, UX confusion) that block legitimate access.',
    changeMgmtRelevance: 'MFA success rate drops correlate with MFA policy changes, authentication flow modifications, mobile app updates, or third-party MFA service provider issues.',
    troubleshootingWorkflow: '1. Identify which MFA method(s) show decreased success rates\n2. Determine if the drop is across all users or concentrated in a specific group\n3. Check device_type distribution — is a specific platform affected?\n4. For push failures: verify push notification delivery service health\n5. For SMS failures: check telephony gateway status and delivery rates\n6. Review recent MFA policy changes or authentication flow modifications',
    criblSearchQueries: [
      {
        name: 'MFA success rate by method (last 4 hours)',
        description: 'Track MFA completion rates per method to identify degrading factors',
        query: 'dataset="$DATASET" earliest=-4h mfa_status in ("success", "failure", "timeout")\n| timestats span=15m Successes=countif(mfa_status=="success"), Total=count() by mfa_method\n| extend SuccessRate = (Successes * 100.0) / Total'
      },
      {
        name: 'MFA failures by error code and method',
        description: 'Break down MFA failures to identify specific failure modes',
        query: 'dataset="$DATASET" earliest=-1h mfa_status != "success"\n| summarize Count=count() by mfa_method, mfa_status, error_code, device_type\n| order by Count desc\n| limit 30'
      },
      {
        name: 'Users with repeated MFA failures',
        description: 'Identify users experiencing multiple MFA failures indicating access issues',
        query: 'dataset="$DATASET" earliest=-2h mfa_status=="failure"\n| summarize FailCount=count(), Methods=dcount(mfa_method) by user_id, application_id\n| where FailCount > 3\n| order by FailCount desc\n| limit 20'
      },
      {
        name: 'MFA success rate trend by device type',
        description: 'Compare success rates across device platforms to isolate platform-specific issues',
        query: 'dataset="$DATASET" earliest=-6h\n| summarize Successes=countif(mfa_status=="success"), Total=count() by device_type, mfa_method\n| extend SuccessRate = (Successes * 100.0) / Total\n| where Total > 10\n| order by SuccessRate asc'
      }
    ]
  },
  {
    id: 'obs-ping-004',
    name: 'License Utilization Trending',
    objective: 'Track active user count against licensed capacity to provide advance warning when the environment approaches license limits, enabling proactive procurement.',
    category: 'Capacity',
    tags: ['observability', 'licensing', 'capacity-planning', 'utilization'],
    requiredFields: ['timestamp', 'user_id', 'application_id', 'environment_id', 'status', 'authentication_flow'],
    detectionLogic: 'Count distinct active users (at least one successful authentication) per 24-hour rolling window. Alert at 80% license utilization (warning) and 90% (critical). Project 30-day growth rate to predict license exhaustion date.',
    falsePositives: ['Seasonal spikes during annual enrollment periods', 'Shared/service accounts inflating unique user counts'],
    tuningGuidance: 'Exclude service accounts and test accounts from unique user counts. Adjust license limit threshold based on contract terms. Consider 30-day active vs 7-day active user definitions.',
    operationalValue: 'Exceeding license limits can result in authentication failures or contract violations. Early trending enables proactive license procurement before users are impacted.',
    changeMgmtRelevance: 'License utilization jumps correlate with new application integrations, organizational mergers, or bulk user provisioning events. Track against planned rollout schedules.',
    troubleshootingWorkflow: '1. Confirm current active user count vs licensed capacity\n2. Identify growth rate — is utilization increasing gradually or suddenly?\n3. Check for new applications recently integrated that expanded the user base\n4. Look for bulk provisioning events or organizational changes\n5. Determine if service/test accounts are inflating the count\n6. Calculate projected exhaustion date and escalate to procurement',
    criblSearchQueries: [
      {
        name: 'Daily active users (last 30 days)',
        description: 'Track unique authenticated user count over time for capacity trending',
        query: 'dataset="$DATASET" earliest=-30d status=="success"\n| timestats span=1d ActiveUsers=dcount(user_id)'
      },
      {
        name: 'Current license utilization snapshot',
        description: 'Count unique active users in the last 24 hours for license comparison',
        query: 'dataset="$DATASET" earliest=-24h status=="success"\n| summarize ActiveUsers=dcount(user_id), TotalAuths=count(), UniqueApps=dcount(application_id) by environment_id'
      },
      {
        name: 'User growth rate by week',
        description: 'Calculate week-over-week growth in active users to project license exhaustion',
        query: 'dataset="$DATASET" earliest=-90d status=="success"\n| timestats span=7d WeeklyActiveUsers=dcount(user_id)\n| order by _time desc'
      },
      {
        name: 'New users authenticated for first time (last 7 days)',
        description: 'Identify newly active users contributing to license utilization growth',
        query: 'dataset="$DATASET" earliest=-7d status=="success"\n| summarize FirstSeen=min(timestamp), AuthCount=count() by user_id, application_id\n| order by FirstSeen desc\n| limit 50'
      }
    ]
  },
  {
    id: 'obs-ping-005',
    name: 'Application Error Rate',
    objective: 'Detect when a specific integrated application shows elevated authentication failure rates compared to other applications, indicating app-specific configuration or connectivity issues.',
    category: 'Health',
    tags: ['observability', 'application-health', 'error-rate', 'integration'],
    requiredFields: ['timestamp', 'application_id', 'application_name', 'status', 'error_code', 'connection_name', 'authentication_flow', 'environment_id'],
    detectionLogic: 'Calculate per-application authentication failure rate over 15-minute windows. Alert when any application exceeds 20% failure rate while other applications remain healthy (<5% failure rate). This isolates app-specific issues from platform-wide problems.',
    falsePositives: ['Application undergoing planned maintenance or deployment', 'Penetration testing generating intentional authentication failures against a specific app'],
    tuningGuidance: 'Set per-application thresholds based on historical failure rates. Some applications with strict policies naturally have higher failure rates. Exclude known test applications.',
    operationalValue: 'Application-specific error rates reveal integration issues, expired certificates, misconfigured connections, or backend application problems that only affect a subset of the user population.',
    changeMgmtRelevance: 'Per-application error rate spikes frequently follow application-side changes (certificate rotation, endpoint URL changes, claim mapping modifications) rather than PingFederate-side changes.',
    troubleshootingWorkflow: '1. Identify which application(s) show elevated error rates\n2. Check error_code distribution for the affected application\n3. Verify the application connection configuration (endpoints, certificates)\n4. Check if the application backend is healthy and responding\n5. Review recent changes to the application integration or claim mappings\n6. Test the authentication flow manually to reproduce the error',
    criblSearchQueries: [
      {
        name: 'Error rate by application (last 4 hours)',
        description: 'Compare failure rates across applications to identify app-specific issues',
        query: 'dataset="$DATASET" earliest=-4h\n| summarize Total=count(), Failures=countif(status=="failure") by application_id, application_name\n| extend ErrorRate = (Failures * 100.0) / Total\n| where Total > 20\n| order by ErrorRate desc'
      },
      {
        name: 'Error trend for specific application',
        description: 'Visualize error rate over time for an application showing elevated failures',
        query: 'dataset="$DATASET" earliest=-6h\n| timestats span=10m Total=count(), Failures=countif(status=="failure") by application_id\n| extend ErrorRate = (Failures * 100.0) / Total'
      },
      {
        name: 'Error codes for affected application',
        description: 'Break down failure reasons for the application with elevated error rate',
        query: 'dataset="$DATASET" earliest=-2h status=="failure"\n| summarize Count=count() by application_id, error_code, connection_name, authentication_flow\n| order by Count desc\n| limit 30'
      },
      {
        name: 'Application health comparison dashboard',
        description: 'Side-by-side application health metrics to distinguish app-specific vs platform issues',
        query: 'dataset="$DATASET" earliest=-1h\n| summarize SuccessRate=countif(status=="success") * 100.0 / count(), AvgLatency=avg(response_time_ms), Volume=count() by application_name\n| order by SuccessRate asc'
      }
    ]
  },
  {
    id: 'obs-ping-006',
    name: 'Session Duration Anomaly',
    objective: 'Detect unusually short or long session durations that indicate authentication loops, token refresh failures, or session management issues affecting user experience.',
    category: 'Performance',
    tags: ['observability', 'session', 'duration', 'user-experience'],
    requiredFields: ['timestamp', 'session_id', 'user_id', 'application_id', 'session_duration_sec', 'session_end_reason', 'token_type', 'environment_id'],
    detectionLogic: 'Baseline session duration per application over 7-day window. Alert when average session duration drops below 50% of baseline (indicating auth loops or rapid session termination) or exceeds 3x baseline (indicating token refresh failures allowing stale sessions).',
    falsePositives: ['Applications with intentionally short session timeouts for security-sensitive workflows', 'Batch processing jobs that authenticate and complete quickly'],
    tuningGuidance: 'Set per-application session duration expectations based on application type (interactive vs API, sensitive vs standard). Exclude service accounts and automated integrations.',
    operationalValue: 'Abnormal session durations directly indicate user experience problems — short sessions mean users are repeatedly forced to re-authenticate, while excessively long sessions may indicate broken token refresh creating security risks.',
    changeMgmtRelevance: 'Session duration anomalies correlate with session policy changes, token lifetime modifications, or application-side session handling updates.',
    troubleshootingWorkflow: '1. Identify which applications show abnormal session durations\n2. Determine if sessions are abnormally short (auth loops) or long (stale sessions)\n3. For short sessions: check session_end_reason for forced terminations or errors\n4. For short sessions: look for rapid re-authentication patterns from same users\n5. For long sessions: verify token refresh mechanisms are functioning\n6. Review recent session policy or token lifetime configuration changes',
    criblSearchQueries: [
      {
        name: 'Average session duration by application (last 12 hours)',
        description: 'Track session duration trends to identify anomalous patterns',
        query: 'dataset="$DATASET" earliest=-12h session_duration_sec > 0\n| timestats span=30m avg(session_duration_sec) by application_id'
      },
      {
        name: 'Abnormally short sessions (under 60 seconds)',
        description: 'Find applications with sessions ending rapidly indicating auth loops',
        query: 'dataset="$DATASET" earliest=-2h session_duration_sec < 60\n| summarize ShortSessions=count() by application_id, session_end_reason, user_id\n| where ShortSessions > 5\n| order by ShortSessions desc'
      },
      {
        name: 'Session duration distribution by application',
        description: 'Histogram of session durations to identify bimodal or skewed distributions',
        query: 'dataset="$DATASET" earliest=-4h session_duration_sec > 0\n| summarize AvgDuration=avg(session_duration_sec), P50=avg(session_duration_sec), P95=max(session_duration_sec), Count=count() by application_id\n| order by AvgDuration asc'
      },
      {
        name: 'Users experiencing repeated short sessions',
        description: 'Identify users caught in authentication loops with rapid session cycling',
        query: 'dataset="$DATASET" earliest=-1h session_duration_sec < 30\n| summarize SessionCount=count(), Apps=dcount(application_id) by user_id\n| where SessionCount > 5\n| order by SessionCount desc\n| limit 20'
      }
    ]
  },
  {
    id: 'obs-ping-007',
    name: 'Federation Partner Health',
    objective: 'Monitor SAML and OIDC federation partner response times and failure rates to detect partner-side outages or degradation before they fully block federated authentication.',
    category: 'Availability',
    tags: ['observability', 'federation', 'saml', 'oidc', 'partner-health'],
    requiredFields: ['timestamp', 'connection_name', 'partner_entity_id', 'protocol', 'partner_response_time_ms', 'status', 'error_code', 'authentication_flow'],
    detectionLogic: 'Monitor per-partner response time and success rate over 10-minute windows. Alert when partner response time exceeds 5 seconds (p95) or when partner-specific failure rate exceeds 30%. Track both SAML assertion validation failures and OIDC token endpoint errors.',
    falsePositives: ['Partner scheduled maintenance windows with communicated downtime', 'Network latency spikes between data centers affecting all external connections equally'],
    tuningGuidance: 'Configure per-partner thresholds as different organizations have different SLA expectations. Set up maintenance window exclusions based on partner communication schedules.',
    operationalValue: 'Federation partner outages directly block authentication for all users coming from that identity provider. Early detection enables proactive communication with affected user populations and partner escalation.',
    changeMgmtRelevance: 'Partner health degradation often follows certificate rotations (expired or mismatched certs), metadata updates, or endpoint URL changes on either side of the federation trust.',
    troubleshootingWorkflow: '1. Identify which federation partner(s) show degraded response or elevated failures\n2. Determine if the issue is latency (slow but working) or availability (complete failures)\n3. Check error_code — certificate errors vs endpoint unavailable vs malformed responses\n4. Verify partner metadata is current (certificates, endpoints)\n5. Test partner endpoint connectivity directly\n6. Escalate to partner organization with specific error details and timestamps',
    criblSearchQueries: [
      {
        name: 'Federation partner response times (last 6 hours)',
        description: 'Track response time per federation partner to identify degradation trends',
        query: 'dataset="$DATASET" earliest=-6h partner_entity_id != ""\n| timestats span=10m avg(partner_response_time_ms), max(partner_response_time_ms) by connection_name, protocol'
      },
      {
        name: 'Partner failure rate comparison',
        description: 'Compare success rates across federation partners to isolate partner-specific issues',
        query: 'dataset="$DATASET" earliest=-2h partner_entity_id != ""\n| summarize Total=count(), Failures=countif(status=="failure"), AvgLatency=avg(partner_response_time_ms) by connection_name, partner_entity_id, protocol\n| extend FailureRate = (Failures * 100.0) / Total\n| where Total > 10\n| order by FailureRate desc'
      },
      {
        name: 'Federation error codes by partner',
        description: 'Break down failure types per partner to guide troubleshooting',
        query: 'dataset="$DATASET" earliest=-4h status=="failure" partner_entity_id != ""\n| summarize Count=count() by connection_name, error_code, protocol\n| order by Count desc\n| limit 20'
      },
      {
        name: 'Partner health timeline with error details',
        description: 'Chronological view of partner authentication events for incident timeline reconstruction',
        query: 'dataset="$DATASET" earliest=-1h partner_entity_id != ""\n| summarize Total=count(), Failures=countif(status=="failure") by connection_name, protocol\n| extend HealthScore = ((Total - Failures) * 100.0) / Total\n| order by HealthScore asc'
      }
    ]
  }
],
  'duo-mfa': [
  {
    id: 'obs-duo-001',
    name: 'Push Delivery Latency',
    objective: 'Monitor the time between Duo push notification send and user response to detect delivery infrastructure issues, mobile network degradation, or device connectivity problems.',
    category: 'Performance',
    tags: ['observability', 'push', 'latency', 'mobile-delivery'],
    requiredFields: ['timestamp', 'txid', 'factor', 'result', 'response_time_ms', 'device_os', 'integration_key', 'user_name', 'event_type'],
    detectionLogic: 'Track response_time_ms for push factor authentications. Alert when median push response time exceeds 15 seconds (baseline typically 3-8 seconds) or when push timeout rate (no response within 60 seconds) exceeds 10% over a 15-minute window.',
    falsePositives: ['Users intentionally ignoring push notifications before eventually responding', 'Network congestion during known peak hours with slightly elevated but acceptable latency'],
    tuningGuidance: 'Set thresholds based on organizational baseline. Mobile-heavy workforces may have naturally higher latency. Separate thresholds for iOS vs Android as delivery mechanisms differ.',
    operationalValue: 'Push delivery latency directly impacts user productivity — every second of MFA wait time multiplied across thousands of daily authentications represents significant lost time. Degradation also indicates potential infrastructure issues.',
    changeMgmtRelevance: 'Push latency increases may follow Duo mobile app updates, push notification infrastructure changes, or firewall rule modifications affecting APNs/FCM connectivity.',
    troubleshootingWorkflow: '1. Determine if latency increase is across all devices or specific platforms (iOS/Android)\n2. Check if the increase correlates with push timeout increases\n3. Verify APNs (Apple) and FCM (Google) service status\n4. Check if corporate firewall rules have changed affecting push delivery paths\n5. Review if Duo mobile app updates correlate with the latency change\n6. Check Duo service status page for known delivery issues',
    criblSearchQueries: [
      {
        name: 'Push response time trend (last 6 hours)',
        description: 'Track push notification response time to identify delivery latency spikes',
        query: 'dataset="$DATASET" earliest=-6h factor=="duo_push"\n| timestats span=10m avg(response_time_ms), max(response_time_ms) by device_os'
      },
      {
        name: 'Push timeout rate by platform',
        description: 'Calculate push notification timeout percentage per device platform',
        query: 'dataset="$DATASET" earliest=-2h factor=="duo_push"\n| summarize Total=count(), Timeouts=countif(result=="timeout"), AvgResponse=avg(response_time_ms) by device_os\n| extend TimeoutRate = (Timeouts * 100.0) / Total\n| order by TimeoutRate desc'
      },
      {
        name: 'Slowest push responses by integration',
        description: 'Identify integrations experiencing the worst push delivery performance',
        query: 'dataset="$DATASET" earliest=-1h factor=="duo_push" result=="success"\n| summarize AvgResponse=avg(response_time_ms), P95Response=max(response_time_ms), Count=count() by integration_key\n| where Count > 10\n| order by P95Response desc'
      },
      {
        name: 'Push delivery latency distribution',
        description: 'Histogram of push response times to identify bimodal distribution patterns',
        query: 'dataset="$DATASET" earliest=-4h factor=="duo_push" result=="success"\n| summarize Count=count(), AvgLatency=avg(response_time_ms), P50=avg(response_time_ms), P99=max(response_time_ms) by device_os\n| order by AvgLatency desc'
      }
    ]
  },
  {
    id: 'obs-duo-002',
    name: 'Auth Success Rate by Integration',
    objective: 'Monitor per-integration authentication success rates to detect application-specific issues, misconfigurations, or degradation that only affects a subset of protected resources.',
    category: 'Reliability',
    tags: ['observability', 'success-rate', 'integration', 'per-application'],
    requiredFields: ['timestamp', 'integration_key', 'integration_name', 'result', 'reason', 'factor', 'user_name', 'event_type'],
    detectionLogic: 'Calculate per-integration success rate over 15-minute rolling windows. Alert when any integration drops below 80% success rate while other integrations remain healthy (>95%). This isolates integration-specific issues from Duo platform problems.',
    falsePositives: ['Security testing or red team exercises against a specific integration', 'New integration onboarding with initial configuration issues being actively resolved'],
    tuningGuidance: 'Set per-integration baselines as some integrations (VPN) naturally have lower success rates than others (SSO). Minimum event threshold to avoid alerting on low-volume integrations.',
    operationalValue: 'Integration-specific success rate drops indicate configuration issues, expired API keys, network connectivity problems, or application-side changes that break MFA for a specific resource.',
    changeMgmtRelevance: 'Per-integration failures often follow application upgrades, integration secret rotations, proxy configuration changes, or Duo policy modifications targeting specific groups.',
    troubleshootingWorkflow: '1. Identify which integration(s) show decreased success rates\n2. Check the reason field to categorize failures (denied, timeout, error, fraud)\n3. Determine if failures are across all factors or specific to one (push, SMS, phone)\n4. Verify integration API credentials are valid and not expired\n5. Check network connectivity between the application and Duo cloud service\n6. Review recent policy changes or group assignments affecting the integration',
    criblSearchQueries: [
      {
        name: 'Success rate by integration (last 4 hours)',
        description: 'Compare authentication success rates across integrations to find outliers',
        query: 'dataset="$DATASET" earliest=-4h event_type=="authentication"\n| summarize Total=count(), Successes=countif(result=="success") by integration_key, integration_name\n| extend SuccessRate = (Successes * 100.0) / Total\n| where Total > 20\n| order by SuccessRate asc'
      },
      {
        name: 'Integration success rate trend over time',
        description: 'Visualize per-integration success rate trends to identify degradation onset',
        query: 'dataset="$DATASET" earliest=-8h event_type=="authentication"\n| timestats span=15m Successes=countif(result=="success"), Total=count() by integration_name\n| extend SuccessRate = (Successes * 100.0) / Total'
      },
      {
        name: 'Failure reasons for degraded integration',
        description: 'Break down failure types for integrations with low success rates',
        query: 'dataset="$DATASET" earliest=-2h event_type=="authentication" result != "success"\n| summarize Count=count() by integration_name, result, reason, factor\n| order by Count desc\n| limit 30'
      },
      {
        name: 'Integration health comparison matrix',
        description: 'Comprehensive health view of all integrations for quick triage',
        query: 'dataset="$DATASET" earliest=-1h event_type=="authentication"\n| summarize Total=count(), Successes=countif(result=="success"), Denials=countif(result=="denied"), Timeouts=countif(result=="timeout") by integration_name\n| extend SuccessRate = (Successes * 100.0) / Total\n| order by SuccessRate asc'
      }
    ]
  },
  {
    id: 'obs-duo-003',
    name: 'Telephony Service Degradation',
    objective: 'Detect degradation in phone call and SMS delivery for MFA factors, identifying when telephony-based authentication methods become unreliable for users without push-capable devices.',
    category: 'Availability',
    tags: ['observability', 'telephony', 'sms', 'phone-call', 'delivery'],
    requiredFields: ['timestamp', 'factor', 'result', 'reason', 'phone_number_country', 'user_name', 'integration_key', 'event_type'],
    detectionLogic: 'Monitor success rates for phone_call and sms_passcode factors separately. Alert when telephony factor success rate drops below 70% over a 15-minute window (baseline typically >90%). Also alert on sudden increase in timeout results for telephony factors.',
    falsePositives: ['International users with naturally lower SMS delivery rates in certain regions', 'Users switching phone numbers without updating their Duo enrollment'],
    tuningGuidance: 'Set region-specific thresholds as international SMS delivery rates vary significantly by country. Weight alerts by affected user count rather than raw failure percentage.',
    operationalValue: 'Telephony factors serve as fallback authentication for users without smartphones or in areas with poor data connectivity. Telephony degradation disproportionately impacts field workers, manufacturing environments, and emergency access scenarios.',
    changeMgmtRelevance: 'Telephony degradation may follow carrier routing changes, Duo telephony provider changes, or policy modifications that force users to telephony factors when push is unavailable.',
    troubleshootingWorkflow: '1. Identify which telephony factor (phone call vs SMS) is affected\n2. Determine if the issue is regional (specific country codes) or global\n3. Check Duo service status for known telephony provider issues\n4. Review failure reasons — are calls/SMS not being delivered or not being answered?\n5. Check if affected users have valid phone numbers on file\n6. Verify no carrier-level blocking of Duo originating numbers',
    criblSearchQueries: [
      {
        name: 'Telephony factor success rate trend',
        description: 'Track phone and SMS authentication success rates to detect delivery degradation',
        query: 'dataset="$DATASET" earliest=-6h factor in ("phone_call", "sms_passcode")\n| timestats span=15m Successes=countif(result=="success"), Total=count() by factor\n| extend SuccessRate = (Successes * 100.0) / Total'
      },
      {
        name: 'Telephony failures by reason and region',
        description: 'Break down telephony failures by cause and geographic region',
        query: 'dataset="$DATASET" earliest=-4h factor in ("phone_call", "sms_passcode") result != "success"\n| summarize Count=count() by factor, result, reason, phone_number_country\n| order by Count desc\n| limit 30'
      },
      {
        name: 'Telephony timeout rate by factor type',
        description: 'Calculate timeout rates for phone calls and SMS separately',
        query: 'dataset="$DATASET" earliest=-2h factor in ("phone_call", "sms_passcode")\n| summarize Total=count(), Timeouts=countif(result=="timeout"), Failures=countif(result=="failure") by factor\n| extend TimeoutRate = (Timeouts * 100.0) / Total, FailRate = (Failures * 100.0) / Total'
      },
      {
        name: 'Users impacted by telephony failures',
        description: 'Count unique users affected by telephony delivery issues',
        query: 'dataset="$DATASET" earliest=-1h factor in ("phone_call", "sms_passcode") result != "success"\n| summarize FailCount=count(), Integrations=dcount(integration_key) by user_name, factor\n| where FailCount > 2\n| order by FailCount desc\n| limit 20'
      }
    ]
  },
  {
    id: 'obs-duo-004',
    name: 'Device Health Compliance Rate',
    objective: 'Monitor the percentage of authentications from managed vs unmanaged devices to track security posture and detect shifts in device compliance across the organization.',
    category: 'Health',
    tags: ['observability', 'device-health', 'compliance', 'managed-devices'],
    requiredFields: ['timestamp', 'access_device_os', 'access_device_is_managed', 'access_device_health_status', 'user_name', 'integration_key', 'result', 'event_type'],
    detectionLogic: 'Calculate the ratio of managed/healthy device authentications to total authentications over 24-hour rolling windows. Alert when managed device percentage drops below organizational threshold (e.g., 70%). Track compliance by OS platform and integration.',
    falsePositives: ['BYOD programs intentionally allowing unmanaged device access', 'New device rollout periods where devices are not yet enrolled in MDM'],
    tuningGuidance: 'Align thresholds with organizational device policy. BYOD-heavy organizations will have lower managed device ratios. Set per-integration thresholds based on sensitivity of the protected resource.',
    operationalValue: 'Device health compliance directly reflects security posture. A declining managed device ratio indicates MDM enrollment issues, policy bypass, or shadow IT growth that increases organizational risk.',
    changeMgmtRelevance: 'Compliance rate shifts correlate with MDM policy changes, device trust policy modifications in Duo, new integration deployments, or organizational BYOD policy updates.',
    troubleshootingWorkflow: '1. Identify which OS platforms show declining managed device ratios\n2. Determine if the shift is gradual (trend) or sudden (policy change)\n3. Check if specific integrations show lower compliance than expected\n4. Verify MDM/device trust integration is functioning correctly\n5. Review recent Duo Trusted Endpoints policy changes\n6. Check if new user groups were granted access without device requirements',
    criblSearchQueries: [
      {
        name: 'Device compliance rate trend (last 7 days)',
        description: 'Track managed vs unmanaged device authentication ratio over time',
        query: 'dataset="$DATASET" earliest=-7d event_type=="authentication" result=="success"\n| timestats span=1d Managed=countif(access_device_is_managed=="true"), Total=count()\n| extend ComplianceRate = (Managed * 100.0) / Total'
      },
      {
        name: 'Compliance rate by OS platform',
        description: 'Break down device health compliance by operating system',
        query: 'dataset="$DATASET" earliest=-24h event_type=="authentication" result=="success"\n| summarize Total=count(), Managed=countif(access_device_is_managed=="true") by access_device_os\n| extend ComplianceRate = (Managed * 100.0) / Total\n| where Total > 20\n| order by ComplianceRate asc'
      },
      {
        name: 'Integrations with lowest device compliance',
        description: 'Find protected resources accessed most frequently from unmanaged devices',
        query: 'dataset="$DATASET" earliest=-24h event_type=="authentication" result=="success"\n| summarize Total=count(), Managed=countif(access_device_is_managed=="true") by integration_key\n| extend ComplianceRate = (Managed * 100.0) / Total\n| where Total > 50\n| order by ComplianceRate asc\n| limit 15'
      },
      {
        name: 'Device health status distribution',
        description: 'View overall device health status breakdown for security posture assessment',
        query: 'dataset="$DATASET" earliest=-24h event_type=="authentication" result=="success"\n| summarize Count=count(), Users=dcount(user_name) by access_device_health_status, access_device_os\n| order by Count desc'
      }
    ]
  },
  {
    id: 'obs-duo-005',
    name: 'Enrollment Velocity Monitoring',
    objective: 'Track the rate of new device enrollments to detect unusual spikes that may indicate provisioning campaigns, onboarding waves, or potential account compromise through unauthorized device enrollment.',
    category: 'Capacity',
    tags: ['observability', 'enrollment', 'device-registration', 'capacity'],
    requiredFields: ['timestamp', 'event_type', 'user_name', 'device_os', 'device_name', 'enrollment_method', 'integration_key'],
    detectionLogic: 'Count new device enrollment events per hour and compare against 30-day rolling baseline. Alert when enrollment velocity exceeds 3x normal rate or when more than 20 enrollments occur in a 1-hour window. Also flag users enrolling more than 2 devices in 24 hours.',
    falsePositives: ['Planned onboarding waves for new employee classes', 'Device refresh programs requiring mass re-enrollment'],
    tuningGuidance: 'Adjust velocity thresholds based on organizational size and hiring patterns. Exclude known onboarding dates from anomaly detection. Set per-user enrollment limits based on policy.',
    operationalValue: 'Enrollment velocity indicates organizational growth rate, onboarding health, and potential security issues. Sudden spikes without corresponding HR events may indicate compromise attempts via unauthorized device enrollment.',
    changeMgmtRelevance: 'Enrollment velocity changes correlate with onboarding campaigns, device refresh programs, MFA policy changes requiring re-enrollment, or new integration deployments expanding the protected user base.',
    troubleshootingWorkflow: '1. Determine if enrollment spike is expected (onboarding, device refresh) or unexpected\n2. Check which users are enrolling new devices — are they new hires or existing users?\n3. Verify enrollment methods being used (self-service vs admin-initiated)\n4. Look for users enrolling multiple devices in rapid succession (potential compromise)\n5. Confirm with HR/IT if a provisioning event explains the velocity\n6. Check if a policy change is forcing re-enrollment of existing users',
    criblSearchQueries: [
      {
        name: 'Enrollment velocity trend (last 30 days)',
        description: 'Track daily enrollment counts to identify velocity anomalies and trends',
        query: 'dataset="$DATASET" earliest=-30d event_type=="enrollment"\n| timestats span=1d Enrollments=count(), UniqueUsers=dcount(user_name)'
      },
      {
        name: 'Hourly enrollment rate (last 48 hours)',
        description: 'High-resolution enrollment velocity to detect sudden spikes',
        query: 'dataset="$DATASET" earliest=-48h event_type=="enrollment"\n| timestats span=1h Enrollments=count() by device_os'
      },
      {
        name: 'Users with multiple device enrollments',
        description: 'Identify users enrolling multiple devices which may indicate suspicious activity',
        query: 'dataset="$DATASET" earliest=-7d event_type=="enrollment"\n| summarize DeviceCount=count(), Platforms=dcount(device_os) by user_name\n| where DeviceCount > 2\n| order by DeviceCount desc\n| limit 20'
      },
      {
        name: 'Enrollment methods and sources',
        description: 'Break down how devices are being enrolled to identify unusual patterns',
        query: 'dataset="$DATASET" earliest=-7d event_type=="enrollment"\n| summarize Count=count(), Users=dcount(user_name) by enrollment_method, device_os\n| order by Count desc'
      }
    ]
  },
  {
    id: 'obs-duo-006',
    name: 'Factor Usage Distribution Shift',
    objective: 'Detect significant changes in which MFA factors are being used across the organization, indicating policy changes taking effect, user behavior shifts, or factor availability issues.',
    category: 'Change Management',
    tags: ['observability', 'factor-distribution', 'usage-patterns', 'change-detection'],
    requiredFields: ['timestamp', 'factor', 'result', 'user_name', 'integration_key', 'device_os', 'event_type'],
    detectionLogic: 'Calculate factor usage distribution (percentage of auths using each factor) over daily windows. Alert when any factor percentage shifts more than 15 percentage points from its 7-day average. Example: push usage drops from 80% to 60% while SMS increases from 10% to 30%.',
    falsePositives: ['Gradual organic shift as users adopt newer authentication methods', 'Seasonal patterns where remote work increases phone-based factor usage'],
    tuningGuidance: 'Set shift sensitivity based on organizational size — larger organizations have more stable distributions. Track week-over-week change rather than day-over-day to avoid weekend pattern noise.',
    operationalValue: 'Factor distribution shifts reveal infrastructure issues (push service degradation forcing fallback to SMS), policy impacts (new restrictions changing user behavior), or adoption trends important for capacity planning and cost management.',
    changeMgmtRelevance: 'Distribution shifts directly indicate whether policy changes are having intended effects. Track before/after policy deployment to confirm expected factor migration. Also detects unintended consequences of changes.',
    troubleshootingWorkflow: '1. Identify which factors gained and which lost usage share\n2. Determine if the shift is organization-wide or limited to specific integrations/groups\n3. Check if a push service degradation is forcing users to fallback factors\n4. Review recent Duo policy changes that may restrict or promote specific factors\n5. Verify if a Duo mobile app update coincides with the shift\n6. Calculate cost impact if telephony factors are increasing (SMS/phone costs)',
    criblSearchQueries: [
      {
        name: 'Factor usage distribution (last 14 days)',
        description: 'Track daily factor usage percentages to identify distribution shifts',
        query: 'dataset="$DATASET" earliest=-14d event_type=="authentication" result=="success"\n| timestats span=1d count() by factor'
      },
      {
        name: 'Current vs baseline factor distribution',
        description: 'Compare today factor usage against 7-day average to detect shifts',
        query: 'dataset="$DATASET" earliest=-24h event_type=="authentication" result=="success"\n| summarize Count=count() by factor\n| extend Percentage = Count * 100.0 / sum(Count)'
      },
      {
        name: 'Factor distribution by integration',
        description: 'Identify which integrations are driving factor distribution changes',
        query: 'dataset="$DATASET" earliest=-48h event_type=="authentication" result=="success"\n| summarize Count=count() by integration_key, factor\n| order by integration_key, Count desc'
      },
      {
        name: 'Factor migration patterns by user group',
        description: 'Track which users are shifting between factors to understand adoption patterns',
        query: 'dataset="$DATASET" earliest=-7d event_type=="authentication" result=="success"\n| summarize PushCount=countif(factor=="duo_push"), SMSCount=countif(factor=="sms_passcode"), PhoneCount=countif(factor=="phone_call"), Total=count() by user_name\n| where Total > 10\n| extend PushPct = PushCount * 100.0 / Total\n| order by PushPct asc\n| limit 30'
      }
    ]
  },
  {
    id: 'obs-duo-007',
    name: 'API Rate Limit Approaching',
    objective: 'Monitor Duo Admin API usage rates to detect when integrations or automation are approaching rate limits, preventing API throttling that could disrupt provisioning and reporting workflows.',
    category: 'Capacity',
    tags: ['observability', 'api', 'rate-limit', 'capacity-planning'],
    requiredFields: ['timestamp', 'api_endpoint', 'api_method', 'response_code', 'integration_key', 'request_count', 'rate_limit_remaining'],
    detectionLogic: 'Track API request counts per integration key over 1-minute sliding windows. Alert at 70% of rate limit (warning) and 90% (critical). Also detect response_code 429 (rate limited) occurrences. Monitor rate_limit_remaining header values when available.',
    falsePositives: ['One-time bulk provisioning operations that intentionally use high API volume', 'Reporting scripts that run periodically with known high request patterns'],
    tuningGuidance: 'Set thresholds relative to the specific Duo plan rate limits. Identify and whitelist known batch operations that spike briefly. Alert on sustained high usage rather than momentary bursts.',
    operationalValue: 'API rate limiting can silently break provisioning automation, security reporting, and integration health checks. Early detection prevents user provisioning failures and compliance reporting gaps.',
    changeMgmtRelevance: 'Rate limit approaching often follows deployment of new automation, increased polling frequency from monitoring tools, or scaling of user provisioning workflows.',
    troubleshootingWorkflow: '1. Identify which integration key(s) are consuming the most API quota\n2. Determine which API endpoints are receiving the highest request volume\n3. Check if usage is steady (normal operation near limit) or spiking (runaway automation)\n4. Review recently deployed automation or scripts that call the Duo Admin API\n5. Implement request batching or rate limiting in the calling application\n6. Contact Duo support about rate limit increases if legitimate usage requires higher throughput',
    criblSearchQueries: [
      {
        name: 'API usage rate by integration (last 24 hours)',
        description: 'Track API request volume per integration to identify high consumers',
        query: 'dataset="$DATASET" earliest=-24h api_endpoint != ""\n| timestats span=1h Requests=count() by integration_key, api_endpoint'
      },
      {
        name: 'Rate limit threshold proximity',
        description: 'Monitor how close each integration is to hitting rate limits',
        query: 'dataset="$DATASET" earliest=-1h api_endpoint != ""\n| summarize RequestCount=count(), AvgRemaining=avg(rate_limit_remaining) by integration_key\n| order by AvgRemaining asc'
      },
      {
        name: 'Rate limited requests (429 responses)',
        description: 'Identify actual rate limit violations that are causing request failures',
        query: 'dataset="$DATASET" earliest=-24h response_code==429\n| summarize ThrottledCount=count(), FirstThrottle=min(timestamp), LastThrottle=max(timestamp) by integration_key, api_endpoint\n| order by ThrottledCount desc'
      },
      {
        name: 'API endpoint request distribution',
        description: 'Understand which API operations consume the most quota',
        query: 'dataset="$DATASET" earliest=-4h api_endpoint != ""\n| summarize Count=count() by api_endpoint, api_method\n| order by Count desc\n| limit 20'
      }
    ]
  }
],
  'apache-access': [
  {
    id: 'obs-apache-001',
    name: 'Response Time Degradation',
    objective: 'Detect when average server response time exceeds SLA thresholds, indicating backend application slowness, resource exhaustion, or upstream dependency issues.',
    category: 'Performance',
    tags: ['observability', 'response-time', 'latency', 'sla'],
    requiredFields: ['timestamp', 'request_time_us', 'status', 'request_method', 'request_uri', 'remote_host', 'virtual_host', 'bytes_sent'],
    detectionLogic: 'Calculate average request_time_us per virtual host and URI pattern over 5-minute windows. Alert when average response time exceeds 2x the 7-day baseline or when p95 exceeds defined SLA threshold (e.g., 5 seconds). Separate static content from dynamic endpoints.',
    falsePositives: ['Large file downloads inflating average response time', 'Scheduled batch operations that legitimately take longer (reports, exports)'],
    tuningGuidance: 'Set per-endpoint SLA thresholds. Exclude known slow endpoints (file downloads, exports). Separate static vs dynamic content analysis. Use percentiles rather than averages for more accurate alerting.',
    operationalValue: 'Response time degradation is the earliest indicator of backend issues visible at the web tier. Detecting degradation before timeouts start enables proactive remediation and prevents user-facing outages.',
    changeMgmtRelevance: 'Response time increases frequently follow application deployments, database schema changes, upstream dependency modifications, or infrastructure scaling events.',
    troubleshootingWorkflow: '1. Identify which virtual hosts and URI patterns show degraded response times\n2. Determine if degradation is across all requests (infrastructure) or specific endpoints (application)\n3. Check if the degradation correlates with increased request volume\n4. Review backend application server health and resource utilization\n5. Check upstream dependencies (database, APIs, caches) for latency increases\n6. Correlate with recent deployments or configuration changes',
    criblSearchQueries: [
      {
        name: 'Average response time by virtual host (last 4 hours)',
        description: 'Track response time trends per virtual host to identify degradation',
        query: 'dataset="$DATASET" earliest=-4h status >= 200 status < 500\n| timestats span=5m AvgResponseMs=avg(request_time_us) / 1000, P95Ms=max(request_time_us) / 1000 by virtual_host'
      },
      {
        name: 'Slowest URI patterns',
        description: 'Identify the specific endpoints contributing most to response time degradation',
        query: 'dataset="$DATASET" earliest=-1h\n| summarize AvgTimeMs=avg(request_time_us) / 1000, P95TimeMs=max(request_time_us) / 1000, Count=count() by request_uri, request_method\n| where Count > 10\n| order by P95TimeMs desc\n| limit 20'
      },
      {
        name: 'Response time distribution by status code',
        description: 'Correlate response times with status codes to identify error-related slowness',
        query: 'dataset="$DATASET" earliest=-2h\n| summarize AvgTimeMs=avg(request_time_us) / 1000, Count=count() by status, virtual_host\n| order by AvgTimeMs desc\n| limit 30'
      },
      {
        name: 'Response time vs request volume correlation',
        description: 'Determine if response time degradation correlates with traffic increases',
        query: 'dataset="$DATASET" earliest=-6h\n| timestats span=5m AvgResponseMs=avg(request_time_us) / 1000, RequestCount=count() by virtual_host'
      }
    ]
  },
  {
    id: 'obs-apache-002',
    name: '5xx Error Rate Spike',
    objective: 'Detect when server-side error rate exceeds baseline, indicating application crashes, backend failures, or resource exhaustion requiring immediate investigation.',
    category: 'Reliability',
    tags: ['observability', 'errors', '5xx', 'server-errors', 'reliability'],
    requiredFields: ['timestamp', 'status', 'request_uri', 'request_method', 'virtual_host', 'remote_host', 'bytes_sent', 'request_time_us'],
    detectionLogic: 'Calculate 5xx error rate (5xx responses / total responses) per virtual host over 5-minute windows. Alert when error rate exceeds 5% (warning) or 10% (critical), or when absolute 5xx count exceeds 50 in a 5-minute window for any virtual host.',
    falsePositives: ['Single client repeatedly hitting a broken endpoint inflating error counts', 'Health check probes hitting endpoints that return 503 during deployment windows'],
    tuningGuidance: 'Set per-virtual-host thresholds as some applications have naturally higher error rates. Distinguish between 500 (application crash), 502 (bad gateway), 503 (overload), and 504 (timeout) for targeted alerting.',
    operationalValue: 'Server error rate is the primary reliability indicator for web applications. Rapid detection enables immediate investigation before errors cascade to complete outages or significant user impact.',
    changeMgmtRelevance: '5xx error spikes strongly correlate with application deployments, configuration changes, and infrastructure modifications. Track deployment timestamps for rapid root cause identification.',
    troubleshootingWorkflow: '1. Identify which status codes are occurring (500 vs 502 vs 503 vs 504)\n2. Determine if errors are across all endpoints or specific URIs\n3. Check if errors correlate with specific client IPs or user agents\n4. For 502/504: check backend application server health and connectivity\n5. For 503: check server resource utilization (connections, memory, threads)\n6. For 500: review application error logs for stack traces and exceptions',
    criblSearchQueries: [
      {
        name: '5xx error rate trend (last 6 hours)',
        description: 'Visualize server error rate over time to identify spike onset and duration',
        query: 'dataset="$DATASET" earliest=-6h\n| timestats span=5m Errors=countif(status >= 500), Total=count() by virtual_host\n| extend ErrorRate = (Errors * 100.0) / Total'
      },
      {
        name: '5xx errors by status code and URI',
        description: 'Break down server errors by specific status code and affected endpoints',
        query: 'dataset="$DATASET" earliest=-1h status >= 500\n| summarize Count=count() by status, request_uri, request_method, virtual_host\n| order by Count desc\n| limit 30'
      },
      {
        name: '5xx error sources (client IPs)',
        description: 'Identify if errors are triggered by specific clients or are widespread',
        query: 'dataset="$DATASET" earliest=-30m status >= 500\n| summarize ErrorCount=count(), UniqueURIs=dcount(request_uri) by remote_host\n| order by ErrorCount desc\n| limit 20'
      },
      {
        name: 'Error rate comparison across virtual hosts',
        description: 'Compare error rates across all virtual hosts to identify affected applications',
        query: 'dataset="$DATASET" earliest=-2h\n| summarize Total=count(), Errors=countif(status >= 500) by virtual_host\n| extend ErrorRate = (Errors * 100.0) / Total\n| where Total > 50\n| order by ErrorRate desc'
      }
    ]
  },
  {
    id: 'obs-apache-003',
    name: 'Request Volume Anomaly',
    objective: 'Detect when incoming request volume deviates significantly from expected baseline, indicating traffic spikes (potential DDoS, viral content, or misconfigured clients) or drops (routing issues, DNS problems).',
    category: 'Capacity',
    tags: ['observability', 'traffic-volume', 'capacity', 'anomaly-detection'],
    requiredFields: ['timestamp', 'request_method', 'request_uri', 'remote_host', 'virtual_host', 'status', 'user_agent', 'bytes_sent'],
    detectionLogic: 'Baseline request volume per virtual host using 7-day same-window comparison. Alert when current 15-minute volume exceeds 3x baseline (spike) or drops below 30% of baseline (drop). Separate analysis for unique clients vs total requests to distinguish DDoS from legitimate traffic growth.',
    falsePositives: ['Marketing campaigns or product launches causing legitimate traffic surges', 'Scheduled crawler/bot activity during off-peak hours'],
    tuningGuidance: 'Use day-of-week and time-of-day aware baselines to account for natural traffic patterns. Exclude known bot user agents from anomaly detection. Set separate thresholds for spikes vs drops.',
    operationalValue: 'Traffic volume anomalies indicate capacity threats (spikes) or infrastructure failures (drops). Early detection enables scaling decisions, DDoS mitigation activation, or routing issue investigation before users are impacted.',
    changeMgmtRelevance: 'Volume changes correlate with DNS modifications, load balancer configuration changes, CDN routing updates, marketing campaign launches, or upstream routing changes.',
    troubleshootingWorkflow: '1. Determine if the anomaly is a spike or drop in traffic volume\n2. For spikes: check top source IPs and user agents for bot/DDoS patterns\n3. For spikes: verify if a specific URI pattern is being targeted\n4. For drops: check DNS resolution, load balancer health, upstream routing\n5. Check if the anomaly affects all virtual hosts or specific ones\n6. Correlate with CDN, DNS, or load balancer changes',
    criblSearchQueries: [
      {
        name: 'Request volume trend (last 24 hours)',
        description: 'Visualize overall traffic patterns to identify volume anomalies',
        query: 'dataset="$DATASET" earliest=-24h\n| timestats span=15m Requests=count(), UniqueClients=dcount(remote_host) by virtual_host'
      },
      {
        name: 'Top traffic sources during anomaly window',
        description: 'Identify which clients are driving traffic volume changes',
        query: 'dataset="$DATASET" earliest=-30m\n| summarize Requests=count(), UniqueURIs=dcount(request_uri), Bytes=sum(bytes_sent) by remote_host, user_agent\n| order by Requests desc\n| limit 20'
      },
      {
        name: 'Request volume by URI pattern',
        description: 'Identify which endpoints are receiving anomalous traffic',
        query: 'dataset="$DATASET" earliest=-1h\n| summarize Count=count(), UniqueClients=dcount(remote_host) by request_uri, request_method\n| order by Count desc\n| limit 30'
      },
      {
        name: 'Volume comparison by virtual host (current vs yesterday)',
        description: 'Compare current traffic against same window yesterday per virtual host',
        query: 'dataset="$DATASET" earliest=-2h\n| summarize CurrentRequests=count(), CurrentClients=dcount(remote_host) by virtual_host\n| order by CurrentRequests desc'
      }
    ]
  },
  {
    id: 'obs-apache-004',
    name: 'Bandwidth Utilization Trending',
    objective: 'Monitor bytes transferred to detect when bandwidth consumption approaches infrastructure limits, enabling proactive capacity planning and cost management.',
    category: 'Capacity',
    tags: ['observability', 'bandwidth', 'capacity-planning', 'throughput'],
    requiredFields: ['timestamp', 'bytes_sent', 'request_uri', 'virtual_host', 'remote_host', 'status', 'request_method'],
    detectionLogic: 'Calculate total bytes_sent per 15-minute window per virtual host. Alert when bandwidth utilization exceeds 70% of provisioned capacity (warning) or 85% (critical). Project trending to predict capacity exhaustion date.',
    falsePositives: ['Legitimate large file transfers or media streaming during peak hours', 'Backup or replication traffic traversing the web tier during maintenance windows'],
    tuningGuidance: 'Configure provisioned bandwidth capacity per virtual host or server. Exclude known large-transfer endpoints (downloads, media) from alerting or set separate thresholds. Use sustained rate rather than burst detection.',
    operationalValue: 'Bandwidth exhaustion causes cascading failures — slow downloads, timeouts, and connection resets. Trending enables proactive capacity additions before users experience degradation.',
    changeMgmtRelevance: 'Bandwidth utilization increases correlate with new content deployments, media file additions, CDN origin pull changes, or application changes that increase response payload sizes.',
    troubleshootingWorkflow: '1. Identify which virtual hosts and URI patterns consume the most bandwidth\n2. Determine if consumption is from many small requests or few large transfers\n3. Check if specific clients are responsible for disproportionate bandwidth usage\n4. Review content being served — are large files being served that should be cached/CDN-ed?\n5. Check compression configuration (gzip/brotli) for text content\n6. Evaluate CDN offload opportunities to reduce origin bandwidth',
    criblSearchQueries: [
      {
        name: 'Bandwidth utilization trend (last 24 hours)',
        description: 'Track total bytes transferred over time to identify bandwidth trends',
        query: 'dataset="$DATASET" earliest=-24h\n| timestats span=15m TotalBytes=sum(bytes_sent) by virtual_host\n| extend TotalMB = TotalBytes / 1048576'
      },
      {
        name: 'Top bandwidth consumers by URI',
        description: 'Identify which endpoints are consuming the most bandwidth',
        query: 'dataset="$DATASET" earliest=-4h\n| summarize TotalBytes=sum(bytes_sent), Requests=count(), AvgBytes=avg(bytes_sent) by request_uri, virtual_host\n| extend TotalMB = TotalBytes / 1048576\n| order by TotalBytes desc\n| limit 20'
      },
      {
        name: 'Bandwidth by client IP',
        description: 'Find clients consuming disproportionate bandwidth',
        query: 'dataset="$DATASET" earliest=-2h\n| summarize TotalBytes=sum(bytes_sent), Requests=count() by remote_host\n| extend TotalMB = TotalBytes / 1048576\n| order by TotalBytes desc\n| limit 20'
      },
      {
        name: 'Daily bandwidth totals (last 30 days)',
        description: 'Long-term bandwidth trending for capacity planning',
        query: 'dataset="$DATASET" earliest=-30d\n| timestats span=1d TotalBytes=sum(bytes_sent) by virtual_host\n| extend TotalGB = TotalBytes / 1073741824'
      }
    ]
  },
  {
    id: 'obs-apache-005',
    name: 'Virtual Host Health Comparison',
    objective: 'Compare error rates, response times, and traffic patterns across virtual hosts to identify unhealthy applications and detect issues isolated to specific services.',
    category: 'Health',
    tags: ['observability', 'virtual-host', 'comparison', 'application-health'],
    requiredFields: ['timestamp', 'virtual_host', 'status', 'request_time_us', 'bytes_sent', 'request_method', 'request_uri'],
    detectionLogic: 'Calculate health score per virtual host based on error rate (<5% = healthy), response time (within 2x baseline = healthy), and volume consistency. Alert when any virtual host health score deviates significantly from peers or its own baseline.',
    falsePositives: ['Low-traffic virtual hosts with naturally volatile metrics due to small sample sizes', 'Virtual hosts serving intentionally different workloads with different expected metrics'],
    tuningGuidance: 'Group virtual hosts by workload type (API, static, application) and compare within groups rather than across all hosts. Set minimum request volume threshold before health scoring.',
    operationalValue: 'Comparing virtual host health side-by-side quickly isolates whether an issue is platform-wide (all hosts affected) or application-specific (single host degraded), enabling focused troubleshooting.',
    changeMgmtRelevance: 'Virtual host health divergence often follows per-application deployments, configuration changes to specific sites, or backend changes affecting only certain applications.',
    troubleshootingWorkflow: '1. Identify which virtual host(s) show degraded health metrics\n2. Compare against healthy peers to confirm the issue is isolated\n3. Check error rate, response time, and volume for the degraded host\n4. Review application-specific backend health for affected virtual host\n5. Check if recent deployments targeted only the affected application\n6. Verify DNS and load balancer configuration for the virtual host',
    criblSearchQueries: [
      {
        name: 'Virtual host health comparison dashboard',
        description: 'Side-by-side health metrics for all virtual hosts',
        query: 'dataset="$DATASET" earliest=-1h\n| summarize Total=count(), Errors=countif(status >= 500), AvgTimeMs=avg(request_time_us) / 1000, TotalBytes=sum(bytes_sent) by virtual_host\n| extend ErrorRate = (Errors * 100.0) / Total\n| order by ErrorRate desc'
      },
      {
        name: 'Virtual host error rate trend comparison',
        description: 'Compare error rate trends across virtual hosts to identify divergence',
        query: 'dataset="$DATASET" earliest=-6h\n| timestats span=15m countif(status >= 500) * 100.0 / ErrorRate=count() by virtual_host'
      },
      {
        name: 'Virtual host response time comparison',
        description: 'Compare response time distributions across virtual hosts',
        query: 'dataset="$DATASET" earliest=-2h\n| summarize AvgMs=avg(request_time_us) / 1000, P50Ms=avg(request_time_us) / 1000, P95Ms=max(request_time_us) / 1000, Count=count() by virtual_host\n| where Count > 50\n| order by P95Ms desc'
      },
      {
        name: 'Virtual host traffic volume comparison',
        description: 'Compare request volume patterns to identify unusual drops or spikes per host',
        query: 'dataset="$DATASET" earliest=-12h\n| timestats span=30m Requests=count() by virtual_host'
      }
    ]
  },
  {
    id: 'obs-apache-006',
    name: 'Connection Queue Depth',
    objective: 'Detect connection saturation patterns by analyzing keepalive behavior and status endpoint responses that indicate the server is approaching connection limits.',
    category: 'Performance',
    tags: ['observability', 'connections', 'saturation', 'keepalive', 'capacity'],
    requiredFields: ['timestamp', 'request_uri', 'status', 'request_time_us', 'remote_host', 'connection_status', 'virtual_host', 'request_method'],
    detectionLogic: 'Monitor connection patterns by tracking concurrent unique client IPs per time window, requests per connection (keepalive efficiency), and response time percentile increases that indicate queuing. Alert when concurrent connections approach MaxClients or when response time p99 increases >5x while p50 remains stable (queuing signature).',
    falsePositives: ['Legitimate traffic spikes during peak hours within normal server capacity', 'Connection pooling from reverse proxies concentrating connections from few IPs'],
    tuningGuidance: 'Align thresholds with Apache MaxClients/MaxRequestWorkers configuration. Account for reverse proxy and load balancer connection pooling patterns. Monitor keepalive timeout impact on connection slot consumption.',
    operationalValue: 'Connection saturation is a precursor to service degradation and timeouts. The queuing signature (high p99 with stable p50) appears before complete saturation, enabling proactive scaling or connection limit adjustments.',
    changeMgmtRelevance: 'Connection saturation correlates with traffic increases, MaxClients configuration changes, keepalive timeout modifications, or upstream changes that alter connection pooling behavior.',
    troubleshootingWorkflow: '1. Check current connection count vs MaxClients/MaxRequestWorkers setting\n2. Analyze response time percentiles — is p99 elevated while p50 is stable? (queuing)\n3. Identify top connection consumers (client IPs holding many connections)\n4. Check keepalive settings — are idle connections consuming worker slots?\n5. Review server-status endpoint for worker state distribution\n6. Consider increasing MaxClients, reducing KeepAliveTimeout, or scaling horizontally',
    criblSearchQueries: [
      {
        name: 'Concurrent client connections over time',
        description: 'Track unique connected clients to identify connection growth trends',
        query: 'dataset="$DATASET" earliest=-6h\n| timestats span=5m UniqueClients=dcount(remote_host), TotalRequests=count() by virtual_host'
      },
      {
        name: 'Response time percentile comparison (queuing detection)',
        description: 'Compare p50 vs p99 response times to detect connection queuing',
        query: 'dataset="$DATASET" earliest=-2h\n| timestats span=5m P50Ms=avg(request_time_us) / 1000, P99Ms=max(request_time_us) / 1000, Requests=count() by virtual_host'
      },
      {
        name: 'Top connection holders',
        description: 'Identify clients holding the most connections (potential connection exhaustion sources)',
        query: 'dataset="$DATASET" earliest=-30m\n| summarize Requests=count(), AvgTimeMs=avg(request_time_us) / 1000 by remote_host\n| order by Requests desc\n| limit 20'
      },
      {
        name: 'Request rate vs response time correlation',
        description: 'Correlate request rate with response time to identify saturation inflection points',
        query: 'dataset="$DATASET" earliest=-12h\n| timestats span=10m RequestRate=count(), AvgResponseMs=avg(request_time_us) / 1000, P99Ms=max(request_time_us) / 1000'
      }
    ]
  },
  {
    id: 'obs-apache-007',
    name: 'Cache Hit Rate Drop',
    objective: 'Detect decreases in cache effectiveness by monitoring response patterns that indicate content is being served from origin rather than cache, increasing backend load and response times.',
    category: 'Performance',
    tags: ['observability', 'cache', 'performance', 'cdn', 'optimization'],
    requiredFields: ['timestamp', 'request_uri', 'status', 'bytes_sent', 'request_time_us', 'virtual_host', 'cache_status', 'request_method'],
    detectionLogic: 'Track cache_status header distribution (HIT, MISS, EXPIRED, BYPASS) over 15-minute windows. Alert when cache hit ratio drops below 60% (baseline typically >80% for cacheable content) or when MISS rate increases >50% from baseline. Also monitor backend response time increases that correlate with cache miss increases.',
    falsePositives: ['Cache invalidation after content deployment causing temporary miss spike', 'New content additions that have not yet been cached (cold cache)'],
    tuningGuidance: 'Exclude non-cacheable endpoints (API, dynamic content) from hit rate calculations. Set per-content-type thresholds. Allow brief dips after deployments before alerting (5-10 minute grace period).',
    operationalValue: 'Cache effectiveness directly impacts response time, backend load, and bandwidth costs. A cache hit rate drop means the backend absorbs significantly more load, potentially causing cascading performance issues.',
    changeMgmtRelevance: 'Cache hit rate drops correlate with content deployments (cache invalidation), cache configuration changes, TTL modifications, or CDN purge operations.',
    troubleshootingWorkflow: '1. Confirm whether cache hit rate dropped (increased MISS) or was bypassed (BYPASS)\n2. Identify which URI patterns show the highest miss rates\n3. Check if a content deployment or cache purge recently occurred\n4. Verify cache configuration (mod_cache, Varnish, CDN) is functioning\n5. Check cache storage health (disk space, memory limits)\n6. Monitor backend load — has it increased proportionally to cache miss increase?',
    criblSearchQueries: [
      {
        name: 'Cache hit rate trend (last 12 hours)',
        description: 'Track cache effectiveness over time to identify degradation',
        query: 'dataset="$DATASET" earliest=-12h cache_status != ""\n| timestats span=15m Hits=countif(cache_status=="HIT"), Total=count() by virtual_host\n| extend HitRate = (Hits * 100.0) / Total'
      },
      {
        name: 'Cache status distribution by URI pattern',
        description: 'Identify which content types have lowest cache hit rates',
        query: 'dataset="$DATASET" earliest=-2h cache_status != ""\n| summarize Total=count(), Hits=countif(cache_status=="HIT"), Misses=countif(cache_status=="MISS"), Bypasses=countif(cache_status=="BYPASS") by request_uri\n| extend HitRate = (Hits * 100.0) / Total\n| where Total > 20\n| order by HitRate asc\n| limit 20'
      },
      {
        name: 'Cache miss impact on response time',
        description: 'Compare response times for cache hits vs misses to quantify performance impact',
        query: 'dataset="$DATASET" earliest=-4h cache_status in ("HIT", "MISS")\n| summarize AvgTimeMs=avg(request_time_us) / 1000, Count=count() by cache_status, virtual_host\n| order by cache_status, virtual_host'
      },
      {
        name: 'Cache hit rate by content type',
        description: 'Break down cache performance by content type to identify optimization opportunities',
        query: 'dataset="$DATASET" earliest=-6h cache_status != ""\n| summarize Total=count(), Hits=countif(cache_status=="HIT") by virtual_host\n| extend HitRate = (Hits * 100.0) / Total\n| order by HitRate asc'
      }
    ]
  }
],
  'iis-access': [
  {
    id: 'obs-iis-001',
    name: 'Response Time Degradation',
    objective: 'Monitor time_taken values to detect when IIS response times exceed SLA thresholds, indicating application pool issues, backend database slowness, or .NET runtime problems.',
    category: 'Performance',
    tags: ['observability', 'response-time', 'time-taken', 'sla'],
    requiredFields: ['timestamp', 'time_taken', 'sc_status', 'cs_method', 'cs_uri_stem', 's_sitename', 'cs_host', 's_ip', 'sc_bytes'],
    detectionLogic: 'Calculate average time_taken per site and URI stem over 5-minute windows. Alert when average exceeds 2x the 7-day baseline or when p95 exceeds SLA threshold (e.g., 5000ms). Separate static content from application endpoints for targeted alerting.',
    falsePositives: ['Long-running report generation endpoints with intentionally high response times', 'First request after application pool recycle (cold start) showing elevated time_taken'],
    tuningGuidance: 'Set per-site and per-endpoint SLA thresholds. Exclude known slow operations (file uploads, report generation). Use p95 rather than average to avoid outlier sensitivity. Account for cold-start patterns after recycling.',
    operationalValue: 'IIS time_taken is the most direct measure of user-perceived performance. Degradation detection enables response before SLA violations accumulate and before users escalate complaints.',
    changeMgmtRelevance: 'Response time increases correlate with .NET application deployments, web.config changes, application pool configuration modifications, or backend dependency changes.',
    troubleshootingWorkflow: '1. Identify which sites and URI patterns show elevated time_taken values\n2. Determine if degradation is across all requests (infrastructure) or specific endpoints (application)\n3. Check application pool health (CPU, memory, thread starvation)\n4. Review .NET garbage collection patterns and memory pressure\n5. Check backend database query performance and connection pool health\n6. Correlate with recent application deployments or configuration changes',
    criblSearchQueries: [
      {
        name: 'Response time by site (last 4 hours)',
        description: 'Track time_taken trends per IIS site to identify degradation',
        query: 'dataset="$DATASET" earliest=-4h sc_status < 500\n| timestats span=5m AvgMs=avg(time_taken), P95Ms=max(time_taken) by s_sitename'
      },
      {
        name: 'Slowest URI endpoints',
        description: 'Identify specific endpoints with highest response times',
        query: 'dataset="$DATASET" earliest=-1h\n| summarize AvgMs=avg(time_taken), P95Ms=max(time_taken), Count=count() by cs_uri_stem, cs_method, s_sitename\n| where Count > 10\n| order by P95Ms desc\n| limit 20'
      },
      {
        name: 'Response time distribution by status code',
        description: 'Correlate response times with HTTP status codes to identify error-related slowness',
        query: 'dataset="$DATASET" earliest=-2h\n| summarize AvgMs=avg(time_taken), Count=count() by sc_status, s_sitename\n| order by AvgMs desc\n| limit 30'
      },
      {
        name: 'Response time vs volume correlation',
        description: 'Determine if response time degradation correlates with traffic increases',
        query: 'dataset="$DATASET" earliest=-6h\n| timestats span=5m AvgMs=avg(time_taken), RequestCount=count() by s_sitename'
      }
    ]
  },
  {
    id: 'obs-iis-002',
    name: 'Application Pool Error Rate',
    objective: 'Detect elevated 503 Service Unavailable errors that indicate application pool failures, resource exhaustion, or worker process crashes requiring immediate investigation.',
    category: 'Reliability',
    tags: ['observability', 'app-pool', '503', 'service-unavailable', 'reliability'],
    requiredFields: ['timestamp', 'sc_status', 'sc_substatus', 'sc_win32_status', 's_sitename', 'cs_uri_stem', 'cs_method', 'cs_host', 'time_taken'],
    detectionLogic: 'Monitor 503 status code occurrences per site over 5-minute windows. Alert when 503 count exceeds 10 in any 5-minute window or when 503 rate exceeds 2% of total requests. Distinguish by sc_substatus: 0 (app pool stopped), 2 (queue full), 3 (app pool CPU limit).',
    falsePositives: ['Brief 503 burst during planned application pool recycling', 'Deployment windows where sites are intentionally taken offline'],
    tuningGuidance: 'Set per-site thresholds based on expected traffic volume. Allow brief recycling windows (30 seconds) without alerting. Pay special attention to sc_substatus 0 vs 2 vs 3 as they indicate different root causes.',
    operationalValue: '503 errors represent complete service unavailability for affected requests. Unlike slow responses, these are total failures that immediately impact users and may indicate application pool crashes requiring manual intervention.',
    changeMgmtRelevance: '503 errors frequently follow application deployments that crash during startup, web.config errors, connection string changes, or application pool configuration modifications.',
    troubleshootingWorkflow: '1. Check sc_substatus to determine failure type (0=stopped, 2=queue full, 3=CPU limit)\n2. For substatus 0: verify application pool is running, check Windows Event Log for W3WP crash\n3. For substatus 2: check request queue length and processing time (time_taken)\n4. For substatus 3: review CPU throttling configuration and application CPU usage\n5. Check sc_win32_status for additional Windows-level error context\n6. Review Event Viewer Application log for .NET runtime errors or unhandled exceptions',
    criblSearchQueries: [
      {
        name: '503 error trend by site (last 6 hours)',
        description: 'Track 503 error occurrence over time to identify outage patterns',
        query: 'dataset="$DATASET" earliest=-6h sc_status==503\n| timestats span=5m Errors=count() by s_sitename, sc_substatus'
      },
      {
        name: '503 errors by substatus and site',
        description: 'Break down 503 failures by substatus code to identify root cause category',
        query: 'dataset="$DATASET" earliest=-2h sc_status==503\n| summarize Count=count(), LastOccurrence=max(timestamp) by s_sitename, sc_substatus, sc_win32_status\n| order by Count desc'
      },
      {
        name: '503 rate as percentage of total traffic',
        description: 'Calculate 503 error rate relative to total requests per site',
        query: 'dataset="$DATASET" earliest=-1h\n| summarize Total=count(), Errors503=countif(sc_status==503) by s_sitename\n| extend ErrorRate = (Errors503 * 100.0) / Total\n| where Total > 50\n| order by ErrorRate desc'
      },
      {
        name: 'Application pool crash timeline',
        description: 'Chronological view of 503 events to reconstruct outage timeline',
        query: 'dataset="$DATASET" earliest=-4h sc_status==503\n| summarize FirstError=min(timestamp), LastError=max(timestamp), Count=count() by s_sitename, sc_substatus\n| order by FirstError desc'
      }
    ]
  },
  {
    id: 'obs-iis-003',
    name: 'Request Queue Growth',
    objective: 'Detect increasing time_taken values across all requests that indicate request queuing due to worker process saturation, thread pool exhaustion, or backend dependency bottlenecks.',
    category: 'Capacity',
    tags: ['observability', 'queue', 'saturation', 'thread-pool', 'capacity'],
    requiredFields: ['timestamp', 'time_taken', 'sc_status', 'cs_uri_stem', 's_sitename', 'cs_method', 'sc_bytes', 'cs_host'],
    detectionLogic: 'Monitor time_taken percentile distribution over 5-minute windows. Alert when p50 time_taken increases >2x baseline AND p99 increases >5x baseline (signature of queuing — all requests get slower with worst-case getting dramatically slower). Track volume vs response time correlation to identify saturation point.',
    falsePositives: ['Scheduled batch processing jobs consuming worker threads during off-peak hours', 'Backend maintenance windows causing temporary slowdown across all requests'],
    tuningGuidance: 'Distinguish between gradual queue growth (capacity trending) and sudden spikes (incident). Set time-of-day aware baselines. Monitor at the site level rather than globally to isolate affected applications.',
    operationalValue: 'Request queue growth is the precursor to 503 errors and complete service failure. Detecting the queuing signature early enables scaling actions, traffic shedding, or circuit breaking before total exhaustion.',
    changeMgmtRelevance: 'Queue growth correlates with traffic increases beyond capacity planning, backend dependency degradation after changes, or configuration changes that reduce available worker threads.',
    troubleshootingWorkflow: '1. Confirm queuing signature: p50 elevated AND p99 dramatically elevated\n2. Check if queuing affects all sites or is isolated to specific applications\n3. Review IIS worker process performance counters (threads, CPU, memory)\n4. Check backend dependency response times (SQL, APIs, file system)\n5. Verify application pool queue length and request processing rate\n6. Determine if horizontal scaling or vertical resource addition is needed',
    criblSearchQueries: [
      {
        name: 'Response time percentile distribution (last 6 hours)',
        description: 'Track p50, p95, p99 response times to detect queuing signature',
        query: 'dataset="$DATASET" earliest=-6h\n| timestats span=5m P50Ms=avg(time_taken), P99Ms=max(time_taken) by s_sitename'
      },
      {
        name: 'Volume vs response time correlation',
        description: 'Correlate request volume with response time to identify saturation inflection',
        query: 'dataset="$DATASET" earliest=-4h\n| timestats span=5m Requests=count(), AvgMs=avg(time_taken), P99Ms=max(time_taken) by s_sitename'
      },
      {
        name: 'Sites with queuing signature',
        description: 'Find sites where p99/p50 ratio indicates request queuing',
        query: 'dataset="$DATASET" earliest=-30m\n| summarize P50=avg(time_taken), P95=max(time_taken), Count=count() by s_sitename\n| extend QueueRatio = P95 / P50\n| where Count > 50 and QueueRatio > 10\n| order by QueueRatio desc'
      },
      {
        name: 'Request throughput trend',
        description: 'Track requests per second to identify when throughput plateaus indicating saturation',
        query: 'dataset="$DATASET" earliest=-12h\n| timestats span=5m RequestCount=count() by s_sitename\n| order by _time desc'
      }
    ]
  },
  {
    id: 'obs-iis-004',
    name: 'Worker Process Recycling',
    objective: 'Detect frequent application pool recycling events indicated by 503 substatus 0 patterns, which cause cold-start latency spikes and potential service interruptions.',
    category: 'Health',
    tags: ['observability', 'worker-process', 'recycling', 'app-pool', 'stability'],
    requiredFields: ['timestamp', 'sc_status', 'sc_substatus', 's_sitename', 'cs_uri_stem', 'time_taken', 'cs_host', 'sc_win32_status'],
    detectionLogic: 'Detect recycling patterns by identifying clusters of 503 substatus 0 errors followed by elevated time_taken (cold start). Alert when recycling frequency exceeds expected schedule (e.g., more than once per 29 hours for default IIS settings) or when multiple recycles occur within a 1-hour window.',
    falsePositives: ['Scheduled recycles at configured intervals (default 1740 minutes)', 'Planned deployments that trigger application pool restart'],
    tuningGuidance: 'Configure expected recycle frequency based on application pool settings. Distinguish scheduled vs unscheduled recycles by timing. Track cold-start duration to assess user impact per recycle event.',
    operationalValue: 'Frequent unscheduled recycling indicates application instability (memory leaks, unhandled exceptions, crashes). Each recycle causes a cold-start period where initial requests experience significantly higher latency.',
    changeMgmtRelevance: 'Recycling frequency increases after application deployments that introduce memory leaks, configuration errors that crash worker processes, or application pool setting changes.',
    troubleshootingWorkflow: '1. Determine recycle frequency — is it exceeding the configured schedule?\n2. Check sc_win32_status and Windows Event Log for the recycle trigger reason\n3. Look for memory growth patterns before each recycle (memory leak)\n4. Check for unhandled exception patterns that crash the worker process\n5. Review application pool advanced settings (rapid fail protection, private memory limit)\n6. Measure cold-start impact by tracking time_taken for first requests after each recycle',
    criblSearchQueries: [
      {
        name: '503 substatus 0 events over time (recycling indicator)',
        description: 'Track application pool stop events as proxy for recycling frequency',
        query: 'dataset="$DATASET" earliest=-48h sc_status==503 sc_substatus==0\n| timestats span=1h RecycleIndicators=count() by s_sitename'
      },
      {
        name: 'Cold-start detection (high time_taken after 503 burst)',
        description: 'Identify elevated response times immediately following recycle events',
        query: 'dataset="$DATASET" earliest=-4h\n| timestats span=5m AvgMs=avg(time_taken), Errors503=countif(sc_status==503) by s_sitename'
      },
      {
        name: 'Recycle frequency by site (last 7 days)',
        description: 'Count recycling events per site over the past week to identify unstable applications',
        query: 'dataset="$DATASET" earliest=-7d sc_status==503 sc_substatus==0\n| summarize RecycleCount=count(), FirstRecycle=min(timestamp), LastRecycle=max(timestamp) by s_sitename\n| order by RecycleCount desc'
      },
      {
        name: 'Win32 status codes during recycle events',
        description: 'Analyze Windows error codes associated with application pool failures',
        query: 'dataset="$DATASET" earliest=-7d sc_status==503 sc_substatus==0\n| summarize Count=count() by s_sitename, sc_win32_status\n| order by Count desc\n| limit 20'
      }
    ]
  },
  {
    id: 'obs-iis-005',
    name: 'Bandwidth by Site Trending',
    objective: 'Monitor per-site bandwidth consumption to detect when individual sites approach allocated bandwidth limits or when bandwidth distribution shifts unexpectedly.',
    category: 'Capacity',
    tags: ['observability', 'bandwidth', 'per-site', 'capacity-planning'],
    requiredFields: ['timestamp', 'sc_bytes', 'cs_bytes', 's_sitename', 'cs_uri_stem', 'cs_host', 'sc_status', 'cs_method'],
    detectionLogic: 'Calculate total sc_bytes (response) and cs_bytes (request) per site over 15-minute windows. Alert when any site bandwidth exceeds 70% of its allocated limit or when total server bandwidth exceeds infrastructure capacity. Project growth rate for capacity planning.',
    falsePositives: ['Legitimate traffic spikes for marketing events or product launches', 'Large file upload/download operations during business hours'],
    tuningGuidance: 'Configure per-site bandwidth allocations based on infrastructure limits. Set separate thresholds for inbound (cs_bytes) vs outbound (sc_bytes). Use sustained rate measurement rather than burst detection.',
    operationalValue: 'Per-site bandwidth trending enables capacity planning before saturation causes throttling or packet loss. It also detects unexpected bandwidth consumers that may indicate data exfiltration or misconfigured applications.',
    changeMgmtRelevance: 'Bandwidth utilization changes correlate with content deployments, API usage growth, new feature launches, or client-side changes that alter request/response payload sizes.',
    troubleshootingWorkflow: '1. Identify which site(s) show increasing bandwidth consumption\n2. Determine if growth is in response bytes (sc_bytes) or request bytes (cs_bytes)\n3. Identify top bandwidth-consuming endpoints and content types\n4. Check for large file serving that should be offloaded to CDN\n5. Review compression settings for text-based responses\n6. Project growth rate and plan capacity additions',
    criblSearchQueries: [
      {
        name: 'Bandwidth by site trend (last 7 days)',
        description: 'Track daily bandwidth consumption per site for capacity trending',
        query: 'dataset="$DATASET" earliest=-7d\n| timestats span=1d ResponseBytes=sum(sc_bytes), RequestBytes=sum(cs_bytes) by s_sitename\n| extend ResponseMB = ResponseBytes / 1048576, RequestMB = RequestBytes / 1048576'
      },
      {
        name: 'Current bandwidth utilization by site',
        description: 'Real-time bandwidth consumption per site for capacity monitoring',
        query: 'dataset="$DATASET" earliest=-1h\n| summarize ResponseBytes=sum(sc_bytes), RequestBytes=sum(cs_bytes), Requests=count() by s_sitename\n| extend ResponseMB = ResponseBytes / 1048576\n| order by ResponseBytes desc'
      },
      {
        name: 'Top bandwidth endpoints per site',
        description: 'Identify which endpoints consume the most bandwidth per site',
        query: 'dataset="$DATASET" earliest=-4h\n| summarize TotalBytes=sum(sc_bytes), Requests=count(), AvgBytes=avg(sc_bytes) by s_sitename, cs_uri_stem\n| extend TotalMB = TotalBytes / 1048576\n| order by TotalBytes desc\n| limit 20'
      },
      {
        name: 'Bandwidth growth rate projection',
        description: 'Calculate weekly bandwidth growth rate per site for capacity planning',
        query: 'dataset="$DATASET" earliest=-30d\n| timestats span=7d WeeklyBytes=sum(sc_bytes) by s_sitename\n| extend WeeklyGB = WeeklyBytes / 1073741824\n| order by _time desc'
      }
    ]
  },
  {
    id: 'obs-iis-006',
    name: 'Status Code Distribution Shift',
    objective: 'Detect sudden changes in the distribution of HTTP status codes that indicate application behavior changes, new error conditions, or routing modifications after deployments.',
    category: 'Change Management',
    tags: ['observability', 'status-codes', 'distribution', 'change-detection'],
    requiredFields: ['timestamp', 'sc_status', 'sc_substatus', 's_sitename', 'cs_uri_stem', 'cs_method', 'cs_host', 'time_taken'],
    detectionLogic: 'Calculate hourly status code distribution (percentage of 2xx, 3xx, 4xx, 5xx) per site. Alert when any category shifts more than 10 percentage points from 7-day same-hour baseline. Example: 2xx drops from 85% to 70% while 4xx increases from 5% to 20%.',
    falsePositives: ['Planned URL restructuring causing temporary 301/302 increase', 'Security scanning that generates high 4xx volumes from a single source'],
    tuningGuidance: 'Use time-of-day and day-of-week aware baselines to account for natural traffic pattern differences. Filter out known scanner IPs from distribution calculations. Set per-site sensitivity levels.',
    operationalValue: 'Status code distribution is a holistic health signal. Shifts reveal issues that individual threshold alerts may miss — for example, a 10% increase in 404s after a deployment indicates broken links or routing changes.',
    changeMgmtRelevance: 'Distribution shifts are the primary signal for change impact assessment. Compare pre-deployment vs post-deployment distributions to validate that changes produce expected behavior.',
    troubleshootingWorkflow: '1. Identify which status code categories shifted and in which direction\n2. Determine if the shift is gradual or sudden (correlate with deployment timestamps)\n3. For 4xx increases: check which URIs are returning 404/403 — are they new patterns?\n4. For 5xx increases: investigate application errors and review deployment changes\n5. For 3xx increases: verify redirect rules are intentional and not loops\n6. Compare affected site against peer sites to confirm isolation',
    criblSearchQueries: [
      {
        name: 'Status code distribution over time (last 24 hours)',
        description: 'Visualize status code category percentages to identify distribution shifts',
        query: 'dataset="$DATASET" earliest=-24h\n| extend StatusCategory = case(sc_status < 300, "2xx", sc_status < 400, "3xx", sc_status < 500, "4xx", "5xx")\n| timestats span=1h count() by StatusCategory, s_sitename'
      },
      {
        name: 'Current vs baseline status code distribution',
        description: 'Compare current hour distribution against historical baseline',
        query: 'dataset="$DATASET" earliest=-1h\n| extend StatusCategory = case(sc_status < 300, "2xx", sc_status < 400, "3xx", sc_status < 500, "4xx", "5xx")\n| summarize Count=count() by StatusCategory, s_sitename\n| order by s_sitename, StatusCategory'
      },
      {
        name: 'New 404 URI patterns (post-deployment)',
        description: 'Find URI patterns generating 404 errors that were not seen previously',
        query: 'dataset="$DATASET" earliest=-2h sc_status==404\n| summarize Count=count(), UniqueClients=dcount(cs_host) by cs_uri_stem, s_sitename\n| where Count > 5\n| order by Count desc\n| limit 30'
      },
      {
        name: 'Status code shift by endpoint',
        description: 'Identify which endpoints are driving status code distribution changes',
        query: 'dataset="$DATASET" earliest=-4h\n| summarize Total=count(), Success=countif(sc_status < 300), ClientErr=countif(sc_status >= 400 and sc_status < 500), ServerErr=countif(sc_status >= 500) by cs_uri_stem, s_sitename\n| extend SuccessRate = (Success * 100.0) / Total\n| where Total > 20\n| order by SuccessRate asc\n| limit 20'
      }
    ]
  },
  {
    id: 'obs-iis-007',
    name: 'Client Error Rate Spike',
    objective: 'Detect elevated 4xx error rates that indicate broken client integrations, URL changes impacting consumers, authentication configuration issues, or API contract violations.',
    category: 'Reliability',
    tags: ['observability', '4xx', 'client-errors', 'integration-health'],
    requiredFields: ['timestamp', 'sc_status', 'sc_substatus', 'cs_uri_stem', 'cs_method', 's_sitename', 'cs_host', 'c_ip', 'cs_user_agent'],
    detectionLogic: 'Calculate 4xx error rate per site over 10-minute windows. Alert when 4xx rate exceeds 15% of total requests (baseline typically <5%) or when absolute 4xx count exceeds 200 in a 10-minute window. Break down by specific status (401, 403, 404, 405, 429) for targeted investigation.',
    falsePositives: ['Vulnerability scanners probing non-existent paths generating 404 volumes', 'Expired session tokens causing brief 401 spikes during token refresh windows'],
    tuningGuidance: 'Filter known scanner user agents and IPs from rate calculations. Set per-status-code thresholds (404 has different significance than 403). Minimum volume threshold to avoid alerting on low-traffic endpoints.',
    operationalValue: 'Client error spikes indicate broken integrations, configuration issues, or user-impacting problems. Unlike server errors (5xx), client errors often go unreported by users who simply cannot access resources.',
    changeMgmtRelevance: '4xx spikes commonly follow URL restructuring, authentication configuration changes, API versioning updates, or firewall/WAF rule deployments that block legitimate traffic.',
    troubleshootingWorkflow: '1. Identify which 4xx status codes are elevated (401, 403, 404, 429, etc.)\n2. For 404: check if URIs existed previously — deployment may have changed URL structure\n3. For 401/403: verify authentication/authorization configuration and certificate validity\n4. For 429: check rate limiting configuration and identify affected clients\n5. Determine if errors come from specific clients/user agents or are widespread\n6. Correlate with recent URL rewrites, authentication changes, or WAF rule updates',
    criblSearchQueries: [
      {
        name: '4xx error rate trend (last 6 hours)',
        description: 'Track client error rate over time to identify spikes and their duration',
        query: 'dataset="$DATASET" earliest=-6h\n| timestats span=10m ClientErrors=countif(sc_status >= 400 and sc_status < 500), Total=count() by s_sitename\n| extend ErrorRate = (ClientErrors * 100.0) / Total'
      },
      {
        name: '4xx errors by status code and URI',
        description: 'Break down client errors by specific status code and affected endpoints',
        query: 'dataset="$DATASET" earliest=-1h sc_status >= 400 sc_status < 500\n| summarize Count=count() by sc_status, sc_substatus, cs_uri_stem, s_sitename\n| order by Count desc\n| limit 30'
      },
      {
        name: 'Top clients generating 4xx errors',
        description: 'Identify which clients or user agents are triggering the most client errors',
        query: 'dataset="$DATASET" earliest=-2h sc_status >= 400 sc_status < 500\n| summarize ErrorCount=count(), UniqueURIs=dcount(cs_uri_stem), StatusCodes=dcount(sc_status) by c_ip, cs_user_agent\n| order by ErrorCount desc\n| limit 20'
      },
      {
        name: '4xx errors comparison across sites',
        description: 'Compare client error rates across sites to identify site-specific issues',
        query: 'dataset="$DATASET" earliest=-2h\n| summarize Total=count(), ClientErrors=countif(sc_status >= 400 and sc_status < 500) by s_sitename\n| extend ErrorRate = (ClientErrors * 100.0) / Total\n| where Total > 50\n| order by ErrorRate desc'
      }
    ]
  }
],
  'windows-security': [
  {
    id: 'obs-win-sec-001',
    name: 'Account Lockout Spike',
    objective: 'Detect sudden increases in account lockout events (EventID 4740) that may indicate authentication infrastructure issues, misconfigured service accounts, or password policy conflicts.',
    category: 'Availability',
    tags: ['observability', 'account-lockout', 'authentication', 'active-directory'],
    requiredFields: ['event_id', 'timestamp', 'target_username', 'computer_name'],
    detectionLogic: 'Count EventID 4740 occurrences over 15-minute windows. Alert when lockout volume exceeds 2x the 7-day baseline or when more than 5 unique accounts lock out within a single 15-minute window.',
    falsePositives: ['Password rotation days causing bulk lockouts', 'Automated vulnerability scanners triggering lockouts during scheduled scans'],
    tuningGuidance: 'Establish per-domain baseline lockout rates. Exclude known service account churn periods. Set separate thresholds for user vs service accounts.',
    operationalValue: 'Account lockouts directly impact user productivity and service availability. Early detection prevents helpdesk ticket floods and identifies infrastructure misconfigurations before they cascade.',
    changeMgmtRelevance: 'Lockout spikes often correlate with password policy changes, service account credential rotations, or application deployments using cached credentials.',
    troubleshootingWorkflow: '1. Identify which accounts are locking out most frequently\n2. Determine the source computer causing lockouts\n3. Check if a password policy change was recently deployed\n4. Review service accounts for credential mismatches\n5. Correlate with recent application or infrastructure changes\n6. Check for network device credential caching issues',
    criblSearchQueries: [
      {
        name: 'Account lockouts over time',
        description: 'Track lockout frequency to identify spikes',
        query: 'dataset="$DATASET" event_id=4740\n| timestats span=15m count() by target_username\n| order by count_ desc'
      },
      {
        name: 'Top locked-out accounts',
        description: 'Identify accounts with highest lockout frequency',
        query: 'dataset="$DATASET" event_id=4740 earliest=-4h\n| summarize LockoutCount=count() by target_username, computer_name\n| order by LockoutCount desc\n| limit 20'
      },
      {
        name: 'Lockout source computers',
        description: 'Identify which computers are generating the lockout events',
        query: 'dataset="$DATASET" event_id=4740 earliest=-4h\n| summarize LockoutCount=count(), UniqueAccounts=dcount(target_username) by computer_name\n| order by LockoutCount desc\n| limit 20'
      }
    ]
  },
  {
    id: 'obs-win-sec-002',
    name: 'Auth Failure Trending by Server',
    objective: 'Monitor EventID 4625 authentication failure trends per server to detect degrading authentication infrastructure or misconfigured services.',
    category: 'Reliability',
    tags: ['observability', 'authentication', 'logon-failure', 'trending'],
    requiredFields: ['event_id', 'timestamp', 'computer_name', 'ip_address', 'logon_type'],
    detectionLogic: 'Aggregate 4625 events per server over 30-minute windows. Alert when failure rate exceeds 3x the rolling 7-day average or when failure-to-success ratio exceeds configured threshold per logon type.',
    falsePositives: ['Automated monitoring tools generating expected auth failures', 'Scheduled tasks with expired credentials during maintenance windows'],
    tuningGuidance: 'Set per-server and per-logon-type baselines. Exclude known monitoring probes. Filter by logon_type to separate interactive vs service failures for targeted alerting.',
    operationalValue: 'Trending auth failures reveal degrading trust relationships, expiring certificates, or service account issues before they cause outages.',
    changeMgmtRelevance: 'Auth failure spikes correlate with domain controller changes, certificate renewals, or service credential rotations.',
    troubleshootingWorkflow: '1. Identify which servers show highest failure rates\n2. Determine the logon type causing failures\n3. Check source IP addresses for patterns\n4. Review recent credential or certificate changes\n5. Verify domain controller replication health\n6. Check NTP sync status between auth endpoints',
    criblSearchQueries: [
      {
        name: 'Auth failures per server over time',
        description: 'Trend authentication failures by computer to identify degrading systems',
        query: 'dataset="$DATASET" event_id=4625\n| timestats span=30m count() by computer_name\n| order by count_ desc'
      },
      {
        name: 'Failure breakdown by logon type',
        description: 'Categorize failures by logon type to isolate service vs interactive issues',
        query: 'dataset="$DATASET" event_id=4625 earliest=-4h\n| summarize FailCount=count() by computer_name, logon_type\n| order by FailCount desc\n| limit 30'
      },
      {
        name: 'Top source IPs causing failures',
        description: 'Identify which source IPs are generating the most auth failures',
        query: 'dataset="$DATASET" event_id=4625 earliest=-4h\n| summarize FailCount=count(), UniqueServers=dcount(computer_name) by ip_address\n| order by FailCount desc\n| limit 20'
      }
    ]
  },
  {
    id: 'obs-win-sec-003',
    name: 'Service Account Logon Pattern Change',
    objective: 'Detect service account logons occurring outside their normal operational schedule, indicating misconfigured jobs, unauthorized use, or infrastructure drift.',
    category: 'Change Management',
    tags: ['observability', 'service-account', 'schedule', 'change-detection'],
    requiredFields: ['event_id', 'timestamp', 'target_username', 'logon_type', 'computer_name'],
    detectionLogic: 'Profile service account logon times over 14-day baseline. Alert when logon occurs outside established time windows (e.g., a batch account logging on outside its scheduled job window).',
    falsePositives: ['Daylight saving time shifts causing one-hour offsets', 'Emergency maintenance requiring off-schedule service account use'],
    tuningGuidance: 'Define expected schedules per service account. Allow configurable grace periods around schedule boundaries. Exclude accounts with known variable schedules.',
    operationalValue: 'Service account schedule deviations reveal failed jobs, infrastructure drift, or unauthorized process changes before they impact downstream systems.',
    changeMgmtRelevance: 'Pattern changes often indicate job schedule modifications, new application deployments, or infrastructure migrations that were not properly communicated.',
    troubleshootingWorkflow: '1. Identify which service accounts are active outside schedule\n2. Determine the computer and logon type involved\n3. Check if a scheduled task or job was modified\n4. Verify if a change request exists for the activity\n5. Review application deployment history\n6. Confirm the account is still required for the identified process',
    criblSearchQueries: [
      {
        name: 'Service account logon timeline',
        description: 'Visualize when service accounts authenticate to detect schedule anomalies',
        query: 'dataset="$DATASET" event_id=4624 logon_type=5\n| timestats span=1h count() by target_username\n| order by count_ desc'
      },
      {
        name: 'Service account logon by hour of day',
        description: 'Profile service account activity patterns by hour',
        query: 'dataset="$DATASET" event_id=4624 logon_type=5 earliest=-7d\n| extend hour=hourofday(timestamp)\n| summarize LogonCount=count() by target_username, hour\n| order by target_username, hour'
      },
      {
        name: 'Service accounts on unexpected computers',
        description: 'Identify service accounts authenticating to new or unusual hosts',
        query: 'dataset="$DATASET" event_id=4624 logon_type=5 earliest=-24h\n| summarize Hosts=dcount(computer_name), LogonCount=count() by target_username\n| where Hosts > 1\n| order by Hosts desc'
      }
    ]
  },
  {
    id: 'obs-win-sec-004',
    name: 'Kerberos Ticket Renewal Latency',
    objective: 'Monitor Kerberos ticket renewal events (EventID 4770) to detect latency in ticket granting that may indicate KDC performance issues or replication problems.',
    category: 'Performance',
    tags: ['observability', 'kerberos', 'ticket-renewal', 'latency'],
    requiredFields: ['event_id', 'timestamp', 'target_username', 'computer_name'],
    detectionLogic: 'Track 4770 event frequency and timing gaps per domain controller. Alert when renewal event gaps exceed expected TGT lifetime intervals or when renewal burst patterns indicate retry storms.',
    falsePositives: ['Domain controller maintenance windows with planned failover', 'Network latency during WAN link saturation causing delayed renewals'],
    tuningGuidance: 'Set baseline renewal rates per DC. Account for TGT lifetime policies. Exclude known maintenance windows. Adjust for multi-site environments with different latency profiles.',
    operationalValue: 'Kerberos renewal latency directly impacts application authentication performance. Early detection prevents cascading service failures when KDC responsiveness degrades.',
    changeMgmtRelevance: 'Renewal latency changes correlate with DC hardware changes, Kerberos policy modifications, or network infrastructure changes affecting DC reachability.',
    troubleshootingWorkflow: '1. Identify which DCs show renewal latency increases\n2. Check DC CPU and memory utilization\n3. Verify Active Directory replication health\n4. Review Kerberos policy changes\n5. Check network latency between clients and DCs\n6. Monitor LDAP query performance on affected DCs',
    criblSearchQueries: [
      {
        name: 'Kerberos renewals over time per DC',
        description: 'Track ticket renewal volume per domain controller',
        query: 'dataset="$DATASET" event_id=4770\n| timestats span=10m count() by computer_name\n| order by count_ desc'
      },
      {
        name: 'Renewal gaps indicating latency',
        description: 'Identify periods with unusually low renewal activity suggesting KDC issues',
        query: 'dataset="$DATASET" event_id=4770 earliest=-6h\n| summarize RenewalCount=count() by computer_name, bin(timestamp, 10m)\n| where RenewalCount < 5\n| order by timestamp desc'
      },
      {
        name: 'Top accounts by renewal volume',
        description: 'Find accounts generating excessive renewal requests indicating potential issues',
        query: 'dataset="$DATASET" event_id=4770 earliest=-4h\n| summarize RenewalCount=count() by target_username, computer_name\n| order by RenewalCount desc\n| limit 20'
      }
    ]
  },
  {
    id: 'obs-win-sec-005',
    name: 'Trust Relationship Health',
    objective: 'Monitor cross-domain authentication failures to detect trust relationship degradation between domains or forests.',
    category: 'Availability',
    tags: ['observability', 'trust-relationship', 'cross-domain', 'authentication'],
    requiredFields: ['event_id', 'timestamp', 'target_domain', 'status', 'computer_name'],
    detectionLogic: 'Track authentication events involving cross-domain trust paths. Alert when failure rates for inter-domain auth exceed baseline or when specific trust paths show zero successful authentications.',
    falsePositives: ['Scheduled trust password rotation causing brief authentication gaps', 'Network maintenance on WAN links connecting domain sites'],
    tuningGuidance: 'Set per-trust-path baselines. Account for asymmetric trust relationships. Exclude known maintenance windows for trust password rotations.',
    operationalValue: 'Broken trust relationships immediately impact cross-domain resource access, email flow, and multi-domain application authentication.',
    changeMgmtRelevance: 'Trust failures correlate with forest/domain restructuring, firewall rule changes blocking DC-to-DC communication, or DNS configuration changes.',
    troubleshootingWorkflow: '1. Identify which trust relationships are failing\n2. Verify network connectivity between DCs in each domain\n3. Check DNS resolution for partner domain DCs\n4. Verify trust password synchronization\n5. Review firewall rules for required AD ports\n6. Test trust with nltest /verify',
    criblSearchQueries: [
      {
        name: 'Cross-domain auth failures',
        description: 'Track authentication failures involving external domain trust paths',
        query: 'dataset="$DATASET" event_id=4625 earliest=-6h\n| where target_domain != ""\n| summarize FailCount=count() by target_domain, computer_name, status\n| order by FailCount desc'
      },
      {
        name: 'Trust authentication volume trending',
        description: 'Monitor cross-domain authentication volume for sudden drops',
        query: 'dataset="$DATASET" event_id=4624 earliest=-12h\n| where target_domain != ""\n| timestats span=30m count() by target_domain\n| order by count_ desc'
      },
      {
        name: 'Failed trust paths',
        description: 'Identify specific trust paths experiencing failures',
        query: 'dataset="$DATASET" event_id=4625 earliest=-4h\n| where target_domain != ""\n| summarize FailCount=count(), UniqueStatus=dcount(status) by target_domain, computer_name\n| order by FailCount desc\n| limit 20'
      }
    ]
  },
  {
    id: 'obs-win-sec-006',
    name: 'Group Policy Processing Failures',
    objective: 'Monitor Group Policy processing failure events (EventID 1085/1125) to detect GPO application issues affecting system configuration compliance.',
    category: 'Health',
    tags: ['observability', 'group-policy', 'gpo', 'compliance'],
    requiredFields: ['event_id', 'timestamp', 'computer_name', 'provider_name'],
    detectionLogic: 'Track EventIDs 1085 and 1125 per computer. Alert when GP processing failures exceed baseline or when specific computers consistently fail GP application.',
    falsePositives: ['Temporary DC unreachability during network convergence', 'New GPOs being tested in pilot OUs with expected failures'],
    tuningGuidance: 'Set per-OU and per-computer baselines. Exclude test OUs. Differentiate between user and computer policy failures. Allow grace period after new GPO deployment.',
    operationalValue: 'GP processing failures mean security configurations, software deployments, and compliance settings are not being applied, creating drift from desired state.',
    changeMgmtRelevance: 'GP failures spike after new GPO creation, GPO link changes, WMI filter modifications, or security group membership changes affecting GPO targeting.',
    troubleshootingWorkflow: '1. Identify which computers have persistent GP failures\n2. Determine which specific GPO or CSE is failing\n3. Check DC connectivity from affected machines\n4. Verify SYSVOL replication health\n5. Review recent GPO changes in GPMC\n6. Run gpresult /h on affected machines for detailed diagnostics',
    criblSearchQueries: [
      {
        name: 'GP processing failures over time',
        description: 'Track Group Policy failure event trends',
        query: 'dataset="$DATASET" event_id in (1085, 1125)\n| timestats span=30m count() by computer_name\n| order by count_ desc'
      },
      {
        name: 'Top computers with GP failures',
        description: 'Identify computers most frequently failing Group Policy processing',
        query: 'dataset="$DATASET" event_id in (1085, 1125) earliest=-24h\n| summarize FailCount=count() by computer_name, event_id\n| order by FailCount desc\n| limit 20'
      },
      {
        name: 'GP failure providers',
        description: 'Identify which CSE or provider is causing failures',
        query: 'dataset="$DATASET" event_id in (1085, 1125) earliest=-24h\n| summarize FailCount=count(), UniqueHosts=dcount(computer_name) by provider_name\n| order by FailCount desc'
      }
    ]
  },
  {
    id: 'obs-win-sec-007',
    name: 'Authentication Volume Baseline Deviation',
    objective: 'Detect significant deviations in overall authentication event volume that may indicate infrastructure capacity issues, logging failures, or major service changes.',
    category: 'Capacity',
    tags: ['observability', 'authentication', 'volume', 'baseline', 'capacity'],
    requiredFields: ['event_id', 'timestamp', 'computer_name', 'logon_type'],
    detectionLogic: 'Track total authentication event volume (4624, 4625, 4776) per 30-minute window. Alert when volume deviates more than 40% from the 7-day rolling baseline in either direction.',
    falsePositives: ['Business events causing legitimate traffic spikes (e.g., all-hands meetings)', 'Planned maintenance reducing auth volume during maintenance windows'],
    tuningGuidance: 'Establish per-day-of-week baselines to account for weekday/weekend differences. Set separate thresholds for volume increases vs decreases. Account for business calendar events.',
    operationalValue: 'Authentication volume deviations signal capacity planning needs, infrastructure failures suppressing events, or unexpected workload changes requiring resource adjustment.',
    changeMgmtRelevance: 'Volume changes correlate with new application deployments, infrastructure migrations, or organizational changes affecting user populations.',
    troubleshootingWorkflow: '1. Determine if deviation is an increase or decrease\n2. For increases: identify which logon types and servers drive the change\n3. For decreases: check if logging infrastructure is healthy\n4. Correlate with recent infrastructure or application changes\n5. Verify domain controller capacity is adequate\n6. Review if new services or decommissioned systems explain the shift',
    criblSearchQueries: [
      {
        name: 'Total auth volume trending',
        description: 'Track overall authentication event volume for baseline comparison',
        query: 'dataset="$DATASET" event_id in (4624, 4625, 4776)\n| timestats span=30m count() by logon_type\n| order by count_ desc'
      },
      {
        name: 'Auth volume per server',
        description: 'Identify which servers contribute most to volume changes',
        query: 'dataset="$DATASET" event_id in (4624, 4625, 4776) earliest=-6h\n| summarize EventCount=count() by computer_name, event_id\n| order by EventCount desc\n| limit 30'
      },
      {
        name: 'Volume comparison current vs previous day',
        description: 'Compare current auth volume against previous day baseline',
        query: 'dataset="$DATASET" event_id in (4624, 4625, 4776) earliest=-2h\n| summarize CurrentCount=count() by computer_name\n| order by CurrentCount desc\n| limit 20'
      }
    ]
  }
],
  'windows-system': [
  {
    id: 'obs-win-sys-001',
    name: 'Service Health Dashboard',
    objective: 'Monitor Windows service start, stop, and crash patterns to detect service instability affecting system reliability.',
    category: 'Health',
    tags: ['observability', 'services', 'health', 'stability'],
    requiredFields: ['event_id', 'timestamp', 'service_name', 'computer_name', 'service_state'],
    detectionLogic: 'Track service state change events (7035, 7036, 7034) per service and host. Alert when a service enters a start/stop cycle more than 3 times in 30 minutes or when critical services stop unexpectedly.',
    falsePositives: ['Services with intentional restart patterns (e.g., scheduled recycle)', 'Patch Tuesday reboots causing expected service restarts'],
    tuningGuidance: 'Define critical service lists per server role. Exclude services with known restart schedules. Set different thresholds for critical vs non-critical services.',
    operationalValue: 'Service instability is a leading indicator of application failures. Detecting crash loops before they impact users enables proactive remediation.',
    changeMgmtRelevance: 'Service crashes often follow application updates, driver installations, or configuration changes that introduce incompatibilities.',
    troubleshootingWorkflow: '1. Identify which services are cycling or crashing\n2. Check the service crash event details for error codes\n3. Review application event log for correlated errors\n4. Check system resource availability (memory, handles)\n5. Verify service account permissions have not changed\n6. Review recent software installations or updates',
    criblSearchQueries: [
      {
        name: 'Service state changes over time',
        description: 'Track service start/stop/crash events to detect instability',
        query: 'dataset="$DATASET" event_id in (7034, 7035, 7036)\n| timestats span=15m count() by service_name, service_state\n| order by count_ desc'
      },
      {
        name: 'Services with frequent restarts',
        description: 'Identify services restarting excessively indicating instability',
        query: 'dataset="$DATASET" event_id in (7034, 7035, 7036) earliest=-4h\n| summarize StateChanges=count() by service_name, computer_name\n| where StateChanges > 5\n| order by StateChanges desc'
      },
      {
        name: 'Unexpected service crashes',
        description: 'Find services that terminated unexpectedly',
        query: 'dataset="$DATASET" event_id=7034 earliest=-24h\n| summarize CrashCount=count() by service_name, computer_name\n| order by CrashCount desc\n| limit 20'
      }
    ]
  },
  {
    id: 'obs-win-sys-002',
    name: 'Disk Space Trending',
    objective: 'Monitor disk space warning events to detect volumes approaching capacity limits before they cause service outages.',
    category: 'Capacity',
    tags: ['observability', 'disk-space', 'capacity', 'storage'],
    requiredFields: ['event_id', 'timestamp', 'computer_name', 'disk_number'],
    detectionLogic: 'Track disk-related warning events (2013, 2170) and monitor for increasing frequency indicating accelerating space consumption. Alert when event frequency doubles within a 24-hour period.',
    falsePositives: ['Temporary log file accumulation cleared by scheduled cleanup jobs', 'Database maintenance operations temporarily consuming extra space'],
    tuningGuidance: 'Set per-volume thresholds based on growth rates. Exclude volumes with known scheduled cleanup. Differentiate between system and data volumes.',
    operationalValue: 'Disk space exhaustion causes application crashes, database corruption, and service failures. Trending detection provides lead time for capacity additions.',
    changeMgmtRelevance: 'Accelerating disk usage correlates with new logging configurations, application deployments generating more data, or backup retention changes.',
    troubleshootingWorkflow: '1. Identify which volumes are generating warnings\n2. Determine the rate of space consumption\n3. Identify largest space consumers (files, databases, logs)\n4. Check if cleanup jobs are running successfully\n5. Evaluate if capacity needs to be expanded\n6. Review recent changes that may have increased disk usage',
    criblSearchQueries: [
      {
        name: 'Disk warning events trending',
        description: 'Track disk space warning frequency over time',
        query: 'dataset="$DATASET" event_id in (2013, 2170)\n| timestats span=1h count() by computer_name, disk_number\n| order by count_ desc'
      },
      {
        name: 'Hosts with most disk warnings',
        description: 'Identify servers generating the most disk space warnings',
        query: 'dataset="$DATASET" event_id in (2013, 2170) earliest=-7d\n| summarize WarningCount=count() by computer_name, disk_number\n| order by WarningCount desc\n| limit 20'
      },
      {
        name: 'Disk warning acceleration',
        description: 'Detect volumes where warning frequency is increasing',
        query: 'dataset="$DATASET" event_id in (2013, 2170) earliest=-48h\n| summarize DailyCount=count() by computer_name, disk_number, bin(timestamp, 1d)\n| order by computer_name, disk_number, timestamp'
      }
    ]
  },
  {
    id: 'obs-win-sys-003',
    name: 'Time Sync Drift Detection',
    objective: 'Monitor W32Time events to detect time synchronization drift that can cause authentication failures, log correlation issues, and certificate validation problems.',
    category: 'Reliability',
    tags: ['observability', 'time-sync', 'ntp', 'w32time'],
    requiredFields: ['event_id', 'timestamp', 'computer_name', 'time_source'],
    detectionLogic: 'Track W32Time events (134, 142, 36) indicating sync failures or large time corrections. Alert when any host shows repeated sync failures or corrections exceeding 5 seconds.',
    falsePositives: ['VMs resuming from checkpoint with expected time jump', 'Initial sync after domain join with large correction'],
    tuningGuidance: 'Set drift thresholds based on environment requirements (Kerberos requires <5 min). Exclude VMs with known snapshot/resume patterns. Differentiate DCs from member servers.',
    operationalValue: 'Time drift breaks Kerberos authentication, corrupts log timestamps for forensics, and causes certificate validation failures. Detection before 5-minute Kerberos tolerance is critical.',
    changeMgmtRelevance: 'Time sync issues follow NTP configuration changes, hypervisor time sync setting modifications, or network changes affecting DC reachability.',
    troubleshootingWorkflow: '1. Identify which hosts show time sync failures\n2. Check configured time source availability\n3. Verify network connectivity to NTP sources\n4. Review W32Time service configuration\n5. Check if hypervisor time sync is conflicting\n6. Verify domain hierarchy time source chain',
    criblSearchQueries: [
      {
        name: 'Time sync events over time',
        description: 'Track W32Time events indicating sync issues',
        query: 'dataset="$DATASET" event_id in (134, 142, 36)\n| timestats span=1h count() by computer_name\n| order by count_ desc'
      },
      {
        name: 'Hosts with persistent time sync failures',
        description: 'Identify servers with repeated time synchronization problems',
        query: 'dataset="$DATASET" event_id in (134, 142, 36) earliest=-7d\n| summarize SyncFailures=count() by computer_name, time_source\n| where SyncFailures > 3\n| order by SyncFailures desc'
      },
      {
        name: 'Time source distribution',
        description: 'Review which time sources are configured across the environment',
        query: 'dataset="$DATASET" event_id in (134, 142, 36) earliest=-24h\n| summarize HostCount=dcount(computer_name), EventCount=count() by time_source\n| order by HostCount desc'
      }
    ]
  },
  {
    id: 'obs-win-sys-004',
    name: 'Windows Update Compliance',
    objective: 'Track Windows Update success and failure rates to ensure patching compliance and detect update infrastructure issues.',
    category: 'Change Management',
    tags: ['observability', 'windows-update', 'patching', 'compliance'],
    requiredFields: ['event_id', 'timestamp', 'computer_name', 'update_title', 'update_kb'],
    detectionLogic: 'Monitor Windows Update events (19, 20, 21, 25) tracking installation success and failure. Alert when failure rate exceeds 20% or when specific KBs fail across multiple hosts.',
    falsePositives: ['Preview updates failing on non-compatible hardware', 'Superseded updates failing because replacement already installed'],
    tuningGuidance: 'Set acceptable failure thresholds per update ring (pilot vs production). Track KB-specific failure patterns. Exclude preview/optional updates from compliance metrics.',
    operationalValue: 'Update compliance directly impacts security posture and operational stability. Detecting update failures enables remediation before vulnerability windows expand.',
    changeMgmtRelevance: 'Update failures indicate change management gaps — incompatible software, insufficient disk space, or WSUS/SCCM configuration issues need resolution.',
    troubleshootingWorkflow: '1. Identify which updates are failing and on which hosts\n2. Check for common error codes across failures\n3. Verify WSUS/SCCM connectivity and content availability\n4. Check disk space on failing hosts\n5. Review prerequisite updates that may be missing\n6. Validate that conflicting software is not blocking installation',
    criblSearchQueries: [
      {
        name: 'Update success/failure rate',
        description: 'Track Windows Update outcomes over time',
        query: 'dataset="$DATASET" event_id in (19, 20, 21, 25)\n| timestats span=1d count() by event_id\n| order by timestamp desc'
      },
      {
        name: 'Failed updates by KB',
        description: 'Identify which KB articles are failing most frequently',
        query: 'dataset="$DATASET" event_id in (20, 25) earliest=-7d\n| summarize FailCount=count(), AffectedHosts=dcount(computer_name) by update_kb, update_title\n| order by AffectedHosts desc\n| limit 20'
      },
      {
        name: 'Hosts with most update failures',
        description: 'Find servers consistently failing to apply updates',
        query: 'dataset="$DATASET" event_id in (20, 25) earliest=-30d\n| summarize FailedUpdates=count(), UniqueKBs=dcount(update_kb) by computer_name\n| order by FailedUpdates desc\n| limit 20'
      }
    ]
  },
  {
    id: 'obs-win-sys-005',
    name: 'Network Adapter Flapping',
    objective: 'Detect network adapter connect/disconnect cycles that indicate hardware issues, driver problems, or infrastructure instability.',
    category: 'Availability',
    tags: ['observability', 'network', 'adapter', 'flapping'],
    requiredFields: ['event_id', 'timestamp', 'computer_name', 'adapter_name'],
    detectionLogic: 'Track network adapter state change events (10400, 10401, 27) and alert when an adapter shows more than 3 state transitions in a 30-minute window, indicating flapping behavior.',
    falsePositives: ['Laptop docking/undocking in hybrid work environments', 'VPN adapter cycling during scheduled reconnection'],
    tuningGuidance: 'Exclude known mobile device adapters. Set higher thresholds for VPN adapters. Focus on server-class hardware where adapter flapping indicates real problems.',
    operationalValue: 'Network adapter flapping causes service disconnections, cluster failovers, and data replication failures. Early detection prevents cascading network-dependent failures.',
    changeMgmtRelevance: 'Adapter flapping follows driver updates, firmware changes, switch port configurations, or NIC teaming modifications.',
    troubleshootingWorkflow: '1. Identify which adapters are flapping and on which hosts\n2. Check physical layer (cables, switch ports) for errors\n3. Review NIC driver version and recent updates\n4. Check NIC teaming or bonding configuration\n5. Verify switch port settings (speed/duplex negotiation)\n6. Monitor for correlated events on the network switch',
    criblSearchQueries: [
      {
        name: 'Adapter state changes over time',
        description: 'Track network adapter connect/disconnect events',
        query: 'dataset="$DATASET" event_id in (10400, 10401, 27)\n| timestats span=15m count() by computer_name, adapter_name\n| order by count_ desc'
      },
      {
        name: 'Hosts with adapter flapping',
        description: 'Identify servers with excessive adapter state changes',
        query: 'dataset="$DATASET" event_id in (10400, 10401, 27) earliest=-24h\n| summarize StateChanges=count() by computer_name, adapter_name\n| where StateChanges > 5\n| order by StateChanges desc'
      },
      {
        name: 'Flapping frequency by adapter',
        description: 'Determine which specific adapters are most unstable',
        query: 'dataset="$DATASET" event_id in (10400, 10401, 27) earliest=-7d\n| summarize FlapCount=count(), DaysAffected=dcount(bin(timestamp, 1d)) by computer_name, adapter_name\n| where FlapCount > 10\n| order by FlapCount desc'
      }
    ]
  },
  {
    id: 'obs-win-sys-006',
    name: 'System Uptime Tracking',
    objective: 'Track system reboots and uptime to detect unexpected restarts and monitor system stability over time.',
    category: 'Availability',
    tags: ['observability', 'uptime', 'reboot', 'stability'],
    requiredFields: ['event_id', 'timestamp', 'computer_name', 'uptime_seconds'],
    detectionLogic: 'Track EventIDs 6005, 6006, 6008, and 6013 to monitor system starts, shutdowns, unexpected shutdowns, and uptime reports. Alert on EventID 6008 (unexpected shutdown) and when uptime drops below threshold.',
    falsePositives: ['Planned reboot windows during patch Tuesday', 'Cluster failover testing causing intentional reboots'],
    tuningGuidance: 'Define maintenance windows to suppress expected reboot alerts. Set different uptime expectations for different server roles. Track reboot reasons to differentiate planned vs unplanned.',
    operationalValue: 'Unexpected reboots indicate hardware failures, BSOD conditions, or resource exhaustion. Tracking uptime provides availability metrics for SLA reporting.',
    changeMgmtRelevance: 'Reboots correlate with patch installations, driver updates, or hardware changes. Unexpected reboots after changes indicate failed updates or incompatibilities.',
    troubleshootingWorkflow: '1. Determine if reboot was planned or unexpected (6008 = unexpected)\n2. Check for BSOD dump files if unexpected\n3. Review hardware event logs for errors preceding the reboot\n4. Check if a patch installation triggered the restart\n5. Verify system stability after reboot (services started correctly)\n6. Review memory dump if available for crash analysis',
    criblSearchQueries: [
      {
        name: 'Reboot events over time',
        description: 'Track system restart frequency across the environment',
        query: 'dataset="$DATASET" event_id in (6005, 6006, 6008)\n| timestats span=1d count() by computer_name, event_id\n| order by count_ desc'
      },
      {
        name: 'Unexpected shutdowns',
        description: 'Identify systems with unexpected shutdowns indicating instability',
        query: 'dataset="$DATASET" event_id=6008 earliest=-30d\n| summarize UnexpectedReboots=count() by computer_name\n| order by UnexpectedReboots desc\n| limit 20'
      },
      {
        name: 'System uptime report',
        description: 'Current uptime per system from 6013 events',
        query: 'dataset="$DATASET" event_id=6013 earliest=-1d\n| summarize MaxUptime=max(uptime_seconds) by computer_name\n| extend UptimeDays=MaxUptime / 86400\n| order by UptimeDays asc\n| limit 30'
      }
    ]
  },
  {
    id: 'obs-win-sys-007',
    name: 'Resource Exhaustion',
    objective: 'Monitor system resource exhaustion events to detect memory, handle, or thread pool depletion before they cause service failures.',
    category: 'Capacity',
    tags: ['observability', 'resources', 'exhaustion', 'capacity'],
    requiredFields: ['event_id', 'timestamp', 'computer_name', 'provider_name', 'level'],
    detectionLogic: 'Track error and warning events from resource-related providers (Resource-Exhaustion-Detector, Kernel-General) with level 2 or 3. Alert when error frequency increases or new hosts begin reporting.',
    falsePositives: ['Memory pressure during planned batch processing windows', 'Known memory-intensive applications during peak processing'],
    tuningGuidance: 'Set per-server baselines based on workload. Exclude known batch processing windows. Differentiate between transient spikes and sustained exhaustion patterns.',
    operationalValue: 'Resource exhaustion is a precursor to crashes and service failures. Detecting exhaustion trends provides time to remediate before outages occur.',
    changeMgmtRelevance: 'Resource exhaustion follows application deployments with memory leaks, configuration changes increasing resource demand, or workload migrations.',
    troubleshootingWorkflow: '1. Identify which resources are being exhausted (memory, handles, threads)\n2. Determine the processes consuming the most resources\n3. Check if resource usage is trending upward (leak) or spiking (burst)\n4. Review recent application deployments or configuration changes\n5. Evaluate if capacity needs to be increased\n6. Check for known memory leak fixes in application updates',
    criblSearchQueries: [
      {
        name: 'Resource exhaustion events trending',
        description: 'Track resource exhaustion warning and error events over time',
        query: 'dataset="$DATASET" level <= 3 provider_name in ("Resource-Exhaustion-Detector", "Kernel-General")\n| timestats span=1h count() by computer_name, provider_name\n| order by count_ desc'
      },
      {
        name: 'Hosts with resource issues',
        description: 'Identify servers experiencing the most resource exhaustion events',
        query: 'dataset="$DATASET" level <= 3 provider_name in ("Resource-Exhaustion-Detector", "Kernel-General") earliest=-7d\n| summarize ErrorCount=count() by computer_name, provider_name\n| order by ErrorCount desc\n| limit 20'
      },
      {
        name: 'Resource exhaustion by error level',
        description: 'Break down resource events by severity to prioritize response',
        query: 'dataset="$DATASET" provider_name in ("Resource-Exhaustion-Detector", "Kernel-General") earliest=-48h\n| summarize EventCount=count() by computer_name, level\n| order by level asc, EventCount desc\n| limit 30'
      }
    ]
  }
],
  'windows-application': [
  {
    id: 'obs-win-app-001',
    name: 'Application Crash Rate Trending',
    objective: 'Monitor EventID 1000 (Application Error) per application to detect increasing crash rates indicating application instability.',
    category: 'Reliability',
    tags: ['observability', 'application-crash', 'error', 'stability'],
    requiredFields: ['event_id', 'timestamp', 'application_name', 'computer_name'],
    detectionLogic: 'Count EventID 1000 per application and host over 1-hour windows. Alert when crash rate exceeds 2x the 7-day baseline or when a previously stable application begins crashing.',
    falsePositives: ['Known unstable third-party applications with accepted crash rates', 'Application crashes during planned restarts or updates'],
    tuningGuidance: 'Set per-application baselines. Exclude known unstable applications. Differentiate between user-facing and background applications for priority.',
    operationalValue: 'Increasing crash rates indicate degrading application health. Early detection enables patching or rollback before widespread user impact.',
    changeMgmtRelevance: 'Crash rate increases correlate with application updates, OS patches, runtime updates (.NET, Java), or dependency changes.',
    troubleshootingWorkflow: '1. Identify which applications are crashing and on which hosts\n2. Review the faulting module to identify the root component\n3. Check if a recent update was deployed to the application\n4. Review memory and CPU conditions at crash time\n5. Collect crash dump for developer analysis\n6. Check if rollback to previous version resolves the issue',
    criblSearchQueries: [
      {
        name: 'Application crashes over time',
        description: 'Track crash frequency per application',
        query: 'dataset="$DATASET" event_id=1000\n| timestats span=1h count() by application_name\n| order by count_ desc'
      },
      {
        name: 'Top crashing applications',
        description: 'Identify applications with highest crash counts',
        query: 'dataset="$DATASET" event_id=1000 earliest=-7d\n| summarize CrashCount=count(), AffectedHosts=dcount(computer_name) by application_name\n| order by CrashCount desc\n| limit 20'
      },
      {
        name: 'Crash distribution by host',
        description: 'Determine if crashes are widespread or isolated to specific hosts',
        query: 'dataset="$DATASET" event_id=1000 earliest=-24h\n| summarize CrashCount=count(), UniqueApps=dcount(application_name) by computer_name\n| order by CrashCount desc\n| limit 20'
      }
    ]
  },
  {
    id: 'obs-win-app-002',
    name: '.NET Exception Rate',
    objective: 'Monitor EventID 1026 (.NET Runtime errors) per application to detect managed code exception spikes indicating application health degradation.',
    category: 'Health',
    tags: ['observability', 'dotnet', 'exception', 'runtime'],
    requiredFields: ['event_id', 'timestamp', 'computer_name', 'source_name', 'exception_code'],
    detectionLogic: 'Track EventID 1026 per source application over 30-minute windows. Alert when exception rate exceeds baseline or when new exception types appear that have not been seen before.',
    falsePositives: ['Known exceptions in third-party libraries that are handled gracefully', 'First-chance exceptions logged during debugging sessions'],
    tuningGuidance: 'Establish per-application exception baselines. Filter by exception_code to differentiate critical vs informational. Exclude known benign exception patterns.',
    operationalValue: '.NET exceptions indicate application logic failures, resource issues, or dependency problems. Trending enables proactive response before user-visible failures.',
    changeMgmtRelevance: 'Exception spikes follow .NET runtime updates, application deployments, or configuration changes affecting connection strings or service endpoints.',
    troubleshootingWorkflow: '1. Identify which applications show exception increases\n2. Categorize exceptions by type (NullReference, Timeout, OutOfMemory)\n3. Check if exceptions correlate with specific operations or endpoints\n4. Review recent deployment or configuration changes\n5. Check external dependency health (databases, APIs)\n6. Collect detailed exception traces for developer analysis',
    criblSearchQueries: [
      {
        name: '.NET exceptions over time',
        description: 'Track .NET runtime exception frequency per application',
        query: 'dataset="$DATASET" event_id=1026\n| timestats span=30m count() by source_name\n| order by count_ desc'
      },
      {
        name: 'Top exception sources',
        description: 'Identify applications generating the most .NET exceptions',
        query: 'dataset="$DATASET" event_id=1026 earliest=-24h\n| summarize ExceptionCount=count(), UniqueHosts=dcount(computer_name) by source_name, exception_code\n| order by ExceptionCount desc\n| limit 20'
      },
      {
        name: 'Exception trends by code',
        description: 'Break down exceptions by error code to identify patterns',
        query: 'dataset="$DATASET" event_id=1026 earliest=-7d\n| summarize DailyCount=count() by exception_code, bin(timestamp, 1d)\n| order by DailyCount desc'
      }
    ]
  },
  {
    id: 'obs-win-app-003',
    name: 'SQL Error Rate by Instance',
    objective: 'Monitor SQL Server error events trending per instance to detect database health degradation before it impacts dependent applications.',
    category: 'Reliability',
    tags: ['observability', 'sql-server', 'database', 'errors'],
    requiredFields: ['event_id', 'timestamp', 'computer_name', 'instance_name', 'sql_error_number'],
    detectionLogic: 'Track SQL Server error events per instance. Alert when error rate exceeds 2x baseline or when critical error numbers (e.g., 823, 824, 825 for I/O errors) appear.',
    falsePositives: ['Informational SQL messages logged as errors', 'Expected deadlock retries in high-concurrency applications'],
    tuningGuidance: 'Classify SQL error numbers by severity. Exclude known informational error codes. Set per-instance baselines based on workload patterns.',
    operationalValue: 'SQL errors directly impact application availability and data integrity. Detecting error trends before connection pool exhaustion prevents application outages.',
    changeMgmtRelevance: 'SQL error increases correlate with schema changes, index modifications, application query changes, or SQL Server cumulative updates.',
    troubleshootingWorkflow: '1. Identify which SQL instances show error increases\n2. Categorize errors by SQL error number for severity assessment\n3. Check for I/O errors (823-825) indicating storage problems\n4. Review connection and timeout errors for resource pressure\n5. Verify recent schema or configuration changes\n6. Check SQL Server error log for additional context',
    criblSearchQueries: [
      {
        name: 'SQL errors per instance over time',
        description: 'Track SQL error event frequency by instance',
        query: 'dataset="$DATASET" source_name="MSSQLSERVER" level <= 3\n| timestats span=30m count() by instance_name\n| order by count_ desc'
      },
      {
        name: 'Top SQL error codes',
        description: 'Identify most frequent SQL error numbers for prioritization',
        query: 'dataset="$DATASET" source_name="MSSQLSERVER" level <= 3 earliest=-7d\n| summarize ErrorCount=count(), AffectedInstances=dcount(instance_name) by sql_error_number\n| order by ErrorCount desc\n| limit 20'
      },
      {
        name: 'Critical SQL I/O errors',
        description: 'Detect storage-level SQL errors indicating hardware problems',
        query: 'dataset="$DATASET" source_name="MSSQLSERVER" sql_error_number in (823, 824, 825) earliest=-30d\n| summarize ErrorCount=count() by computer_name, instance_name, sql_error_number\n| order by ErrorCount desc'
      }
    ]
  },
  {
    id: 'obs-win-app-004',
    name: 'Application Hang Frequency',
    objective: 'Monitor EventID 1002 (Application Hang) to detect applications becoming unresponsive, indicating resource contention or deadlock conditions.',
    category: 'Performance',
    tags: ['observability', 'application-hang', 'unresponsive', 'performance'],
    requiredFields: ['event_id', 'timestamp', 'application_name', 'computer_name', 'process_id'],
    detectionLogic: 'Track EventID 1002 per application and host. Alert when hang frequency exceeds baseline or when a previously stable application begins hanging repeatedly.',
    falsePositives: ['Applications with known UI freeze during long operations', 'Hang events during system shutdown sequences'],
    tuningGuidance: 'Set per-application hang thresholds. Exclude applications with known long-running operations. Focus on production-critical applications for priority alerting.',
    operationalValue: 'Application hangs degrade user experience and often precede crashes. Detecting hang patterns enables proactive investigation before full failures.',
    changeMgmtRelevance: 'Hang frequency increases follow application updates, dependency changes, or infrastructure modifications that introduce resource contention.',
    troubleshootingWorkflow: '1. Identify which applications are hanging and how frequently\n2. Correlate hang times with system resource utilization\n3. Check for deadlock conditions in application logs\n4. Review memory usage patterns for the hanging process\n5. Check external dependency response times\n6. Collect process dumps during hang state for analysis',
    criblSearchQueries: [
      {
        name: 'Application hangs over time',
        description: 'Track application hang frequency per application',
        query: 'dataset="$DATASET" event_id=1002\n| timestats span=1h count() by application_name\n| order by count_ desc'
      },
      {
        name: 'Most frequently hanging applications',
        description: 'Identify applications with highest hang counts',
        query: 'dataset="$DATASET" event_id=1002 earliest=-7d\n| summarize HangCount=count(), AffectedHosts=dcount(computer_name) by application_name\n| order by HangCount desc\n| limit 20'
      },
      {
        name: 'Hang patterns by host',
        description: 'Determine if hangs are isolated or widespread across hosts',
        query: 'dataset="$DATASET" event_id=1002 earliest=-24h\n| summarize HangCount=count(), UniqueApps=dcount(application_name) by computer_name\n| order by HangCount desc\n| limit 20'
      }
    ]
  },
  {
    id: 'obs-win-app-005',
    name: 'Installation Success Rate',
    objective: 'Track MSI installation events to monitor software deployment success rates and detect widespread installation failures.',
    category: 'Change Management',
    tags: ['observability', 'msi', 'installation', 'deployment'],
    requiredFields: ['event_id', 'timestamp', 'computer_name', 'msi_product', 'msi_operation'],
    detectionLogic: 'Track MsiInstaller events (1033, 1034, 11707, 11708, 11724) to calculate installation success vs failure rates. Alert when failure rate exceeds 30% or when specific products fail across multiple hosts.',
    falsePositives: ['Superseded installations failing because newer version already present', 'User-cancelled installations counted as failures'],
    tuningGuidance: 'Set per-product acceptable failure thresholds. Exclude known superseded packages. Differentiate between first-time installs and updates.',
    operationalValue: 'Installation failure detection enables rapid remediation of deployment issues, reducing the window of non-compliance and ensuring consistent environment configuration.',
    changeMgmtRelevance: 'Installation failures indicate packaging issues, prerequisite gaps, or environmental incompatibilities that need resolution before broader deployment.',
    troubleshootingWorkflow: '1. Identify which products are failing installation and on which hosts\n2. Check MSI error codes for common failure reasons\n3. Verify prerequisite software is present\n4. Check disk space and permission requirements\n5. Review conflicting software that may block installation\n6. Collect verbose MSI logs for detailed failure analysis',
    criblSearchQueries: [
      {
        name: 'Installation outcomes over time',
        description: 'Track installation success and failure events',
        query: 'dataset="$DATASET" event_id in (11707, 11708)\n| timestats span=1d count() by event_id\n| order by timestamp desc'
      },
      {
        name: 'Failed installations by product',
        description: 'Identify which products are failing installation most frequently',
        query: 'dataset="$DATASET" event_id=11708 earliest=-7d\n| summarize FailCount=count(), AffectedHosts=dcount(computer_name) by msi_product\n| order by AffectedHosts desc\n| limit 20'
      },
      {
        name: 'Installation success rate by host',
        description: 'Calculate per-host installation success ratios',
        query: 'dataset="$DATASET" event_id in (11707, 11708) earliest=-7d\n| summarize Total=count(), Failures=countif(event_id == 11708) by computer_name\n| extend FailRate=(Failures * 100.0) / Total\n| where Total > 3\n| order by FailRate desc\n| limit 20'
      }
    ]
  },
  {
    id: 'obs-win-app-006',
    name: 'Memory Leak Indicators',
    objective: 'Detect patterns of application crashes with increasing frequency that suggest memory leak conditions leading to resource exhaustion.',
    category: 'Capacity',
    tags: ['observability', 'memory-leak', 'resource-exhaustion', 'capacity'],
    requiredFields: ['event_id', 'timestamp', 'application_name', 'computer_name', 'module_name'],
    detectionLogic: 'Track EventID 1000 crashes over time per application. Alert when crash frequency shows an increasing trend (more crashes each day for 3+ consecutive days) suggesting progressive resource exhaustion.',
    falsePositives: ['Applications that crash periodically due to known bugs with stable frequency', 'Crash frequency increase during peak usage periods (correlation not causation)'],
    tuningGuidance: 'Establish per-application crash rate baselines. Require 3+ day increasing trend to avoid false alarms. Correlate with process memory counters if available.',
    operationalValue: 'Memory leaks cause progressive degradation leading to eventual service failure. Detecting the acceleration pattern provides time to schedule restarts or deploy fixes.',
    changeMgmtRelevance: 'Memory leaks often introduced by application updates that change resource management patterns or add new allocations without proper cleanup.',
    troubleshootingWorkflow: '1. Identify applications showing increasing crash frequency\n2. Check if the faulting module is consistent across crashes\n3. Review process memory usage trends between crashes\n4. Determine time-to-crash pattern (getting shorter = leak confirmation)\n5. Check if scheduled application pool/service recycling mitigates\n6. Engage development team with crash dump evidence',
    criblSearchQueries: [
      {
        name: 'Daily crash count trending',
        description: 'Track daily crash counts per application to detect increasing patterns',
        query: 'dataset="$DATASET" event_id=1000\n| summarize DailyCrashes=count() by application_name, bin(timestamp, 1d)\n| order by application_name, timestamp'
      },
      {
        name: 'Crash frequency by module',
        description: 'Identify which modules are causing crashes that may indicate leaks',
        query: 'dataset="$DATASET" event_id=1000 earliest=-7d\n| summarize CrashCount=count() by application_name, module_name\n| order by CrashCount desc\n| limit 20'
      },
      {
        name: 'Hosts with accelerating crashes',
        description: 'Find hosts where crash frequency is increasing over time',
        query: 'dataset="$DATASET" event_id=1000 earliest=-7d\n| summarize DailyCrashes=count() by computer_name, application_name, bin(timestamp, 1d)\n| order by computer_name, application_name, timestamp'
      }
    ]
  },
  {
    id: 'obs-win-app-007',
    name: 'Custom App Health Metrics',
    objective: 'Monitor application-specific error events to provide a holistic view of custom application health across the environment.',
    category: 'Health',
    tags: ['observability', 'custom-application', 'health', 'monitoring'],
    requiredFields: ['event_id', 'timestamp', 'computer_name', 'source_name', 'level'],
    detectionLogic: 'Track error-level (level 2) and warning-level (level 3) events per application source. Alert when error/warning rates exceed per-application baselines or when new error sources appear.',
    falsePositives: ['Applications that log informational messages at warning level', 'Expected error events during application startup sequences'],
    tuningGuidance: 'Define per-source-name baselines. Classify sources as critical vs informational. Exclude known noisy sources that generate expected warnings.',
    operationalValue: 'Application-level health monitoring provides the most direct view of service health. Centralizing application errors enables cross-team visibility and faster incident response.',
    changeMgmtRelevance: 'New error sources appearing or existing error rates increasing correlates with deployments, configuration changes, or dependency issues.',
    troubleshootingWorkflow: '1. Identify which application sources show elevated error rates\n2. Categorize errors by type and severity\n3. Correlate error timing with recent deployments or changes\n4. Check dependent service health\n5. Review application-specific logs for detailed context\n6. Engage application owners with error evidence and timeline',
    criblSearchQueries: [
      {
        name: 'Application errors by source',
        description: 'Track error-level events per application source over time',
        query: 'dataset="$DATASET" level <= 3\n| timestats span=1h count() by source_name, level\n| order by count_ desc'
      },
      {
        name: 'Top error-generating applications',
        description: 'Identify which application sources produce the most errors',
        query: 'dataset="$DATASET" level=2 earliest=-24h\n| summarize ErrorCount=count(), UniqueHosts=dcount(computer_name) by source_name\n| order by ErrorCount desc\n| limit 20'
      },
      {
        name: 'New error sources',
        description: 'Detect application sources that recently started generating errors',
        query: 'dataset="$DATASET" level=2 earliest=-24h\n| summarize FirstSeen=min(timestamp), ErrorCount=count() by source_name, computer_name\n| order by FirstSeen desc\n| limit 20'
      }
    ]
  }
],
  'windows-sysmon': [
  {
    id: 'obs-win-sysmon-001',
    name: 'Process Execution Volume Trending',
    objective: 'Monitor Sysmon Event 1 (Process Create) volume per host to detect unusual execution patterns indicating capacity issues or runaway automation.',
    category: 'Capacity',
    tags: ['observability', 'process-creation', 'volume', 'capacity'],
    requiredFields: ['event_id', 'timestamp', 'computer_name', 'image'],
    detectionLogic: 'Track Event 1 volume per host over 30-minute windows. Alert when process creation rate exceeds 3x baseline indicating runaway scripts, fork bombs, or automation loops.',
    falsePositives: ['Scheduled batch processing windows with expected high process creation', 'Software deployment tools creating many processes during installation'],
    tuningGuidance: 'Set per-host and per-role baselines. Exclude known batch windows. Differentiate between build servers (high normal) and production servers (low normal).',
    operationalValue: 'Excessive process creation consumes CPU, memory, and handle resources. Detecting volume spikes prevents resource exhaustion and system instability.',
    changeMgmtRelevance: 'Process volume increases correlate with new automation deployments, script changes, or scheduled task modifications creating unexpected execution patterns.',
    troubleshootingWorkflow: '1. Identify which hosts show elevated process creation rates\n2. Determine which parent processes are spawning the most children\n3. Check if a script or automation is in a loop\n4. Review recent scheduled task or automation changes\n5. Verify system resource health (CPU, memory, handles)\n6. Identify and terminate runaway processes if confirmed',
    criblSearchQueries: [
      {
        name: 'Process creation volume over time',
        description: 'Track process creation rates per host to detect spikes',
        query: 'dataset="$DATASET" event_id=1\n| timestats span=30m count() by computer_name\n| order by count_ desc'
      },
      {
        name: 'Top process images by volume',
        description: 'Identify which executables are created most frequently',
        query: 'dataset="$DATASET" event_id=1 earliest=-4h\n| summarize CreateCount=count() by image, computer_name\n| order by CreateCount desc\n| limit 30'
      },
      {
        name: 'Process creation rate comparison',
        description: 'Compare current process creation rates against baseline',
        query: 'dataset="$DATASET" event_id=1 earliest=-2h\n| summarize HourlyCount=count() by computer_name, bin(timestamp, 1h)\n| order by HourlyCount desc\n| limit 20'
      }
    ]
  },
  {
    id: 'obs-win-sysmon-002',
    name: 'Network Connection Rate',
    objective: 'Monitor Sysmon Event 3 (Network Connection) outbound rate per host to detect connection storms or misconfigured applications creating excessive connections.',
    category: 'Health',
    tags: ['observability', 'network-connections', 'outbound', 'health'],
    requiredFields: ['event_id', 'timestamp', 'computer_name', 'destination_ip', 'destination_port'],
    detectionLogic: 'Track Event 3 outbound connections per host over 15-minute windows. Alert when connection rate exceeds 3x baseline or when new high-volume destination patterns emerge.',
    falsePositives: ['Load testing tools generating expected high connection volumes', 'Backup jobs connecting to many storage endpoints simultaneously'],
    tuningGuidance: 'Set per-host baselines by server role. Exclude known high-connection applications (load balancers, monitoring). Filter by destination port for targeted alerting.',
    operationalValue: 'Connection storms exhaust port ranges, overload firewalls, and indicate misconfigured or malfunctioning applications. Early detection prevents network-layer failures.',
    changeMgmtRelevance: 'Connection rate changes follow application deployments, configuration changes affecting connection pooling, or new service integrations.',
    troubleshootingWorkflow: '1. Identify which hosts generate excessive outbound connections\n2. Determine the destination IPs and ports involved\n3. Identify the source process creating the connections\n4. Check if connection pooling is misconfigured\n5. Verify the destination service is healthy (not causing retries)\n6. Review recent application or network configuration changes',
    criblSearchQueries: [
      {
        name: 'Outbound connections over time',
        description: 'Track outbound network connection rates per host',
        query: 'dataset="$DATASET" event_id=3\n| timestats span=15m count() by computer_name\n| order by count_ desc'
      },
      {
        name: 'Top destination endpoints',
        description: 'Identify most frequently contacted destinations',
        query: 'dataset="$DATASET" event_id=3 earliest=-4h\n| summarize ConnCount=count(), UniqueHosts=dcount(computer_name) by destination_ip, destination_port\n| order by ConnCount desc\n| limit 20'
      },
      {
        name: 'Hosts with connection spikes',
        description: 'Find hosts with unusually high outbound connection rates',
        query: 'dataset="$DATASET" event_id=3 earliest=-2h\n| summarize ConnectionCount=count(), UniqueDestinations=dcount(destination_ip) by computer_name\n| order by ConnectionCount desc\n| limit 20'
      }
    ]
  },
  {
    id: 'obs-win-sysmon-003',
    name: 'File Creation Rate Anomaly',
    objective: 'Monitor Sysmon Event 11 (FileCreate) spikes to detect runaway processes, failed backups, or applications flooding the filesystem.',
    category: 'Change Management',
    tags: ['observability', 'file-creation', 'filesystem', 'anomaly'],
    requiredFields: ['event_id', 'timestamp', 'computer_name', 'target_filename'],
    detectionLogic: 'Track Event 11 volume per host over 30-minute windows. Alert when file creation rate exceeds 5x baseline or when new high-volume file paths appear.',
    falsePositives: ['Software builds creating many output files', 'Log rotation creating new log files at scheduled intervals'],
    tuningGuidance: 'Set per-host baselines by role. Exclude known build directories and temp paths. Filter by file extension for targeted detection.',
    operationalValue: 'File creation spikes consume disk space rapidly, can indicate failed processes in loops, and may signal infrastructure issues that need immediate attention.',
    changeMgmtRelevance: 'File creation anomalies follow application deployments that introduce new logging, failed backup configurations, or script errors creating excessive output.',
    troubleshootingWorkflow: '1. Identify which hosts show file creation spikes\n2. Determine the target paths and file patterns\n3. Identify the process creating the files\n4. Check if disk space is being rapidly consumed\n5. Determine if the behavior is a loop or one-time burst\n6. Review recent changes that may have introduced the behavior',
    criblSearchQueries: [
      {
        name: 'File creation volume over time',
        description: 'Track file creation rates per host to detect spikes',
        query: 'dataset="$DATASET" event_id=11\n| timestats span=30m count() by computer_name\n| order by count_ desc'
      },
      {
        name: 'Top file creation paths',
        description: 'Identify which directories receive the most new files',
        query: 'dataset="$DATASET" event_id=11 earliest=-4h\n| summarize FileCount=count() by computer_name, target_filename\n| order by FileCount desc\n| limit 20'
      },
      {
        name: 'File creation by extension',
        description: 'Break down file creation by type to identify patterns',
        query: 'dataset="$DATASET" event_id=11 earliest=-2h\n| summarize FileCount=count() by computer_name\n| order by FileCount desc\n| limit 20'
      }
    ]
  },
  {
    id: 'obs-win-sysmon-004',
    name: 'DNS Query Volume Spike',
    objective: 'Monitor Sysmon Event 22 (DNSEvent) volume per host to detect DNS resolution storms indicating misconfigured applications or infrastructure issues.',
    category: 'Capacity',
    tags: ['observability', 'dns', 'query-volume', 'capacity'],
    requiredFields: ['event_id', 'timestamp', 'computer_name', 'dns_query'],
    detectionLogic: 'Track Event 22 volume per host over 15-minute windows. Alert when DNS query rate exceeds 3x baseline or when single hosts generate disproportionate query volumes.',
    falsePositives: ['Discovery tools performing legitimate DNS enumeration', 'Application startup phases resolving many service endpoints'],
    tuningGuidance: 'Set per-host baselines. Exclude known DNS-heavy applications (monitoring, discovery). Filter by query domain for targeted alerting.',
    operationalValue: 'DNS query storms overload resolvers, increase latency for all services, and indicate misconfigured applications or cache failures that need remediation.',
    changeMgmtRelevance: 'DNS volume changes follow DNS cache configuration changes, new application deployments, or DNS infrastructure modifications.',
    troubleshootingWorkflow: '1. Identify which hosts generate excessive DNS queries\n2. Determine the most queried domains\n3. Check if DNS caching is functioning correctly\n4. Identify the process generating queries\n5. Verify DNS resolver capacity and response times\n6. Review recent application or DNS configuration changes',
    criblSearchQueries: [
      {
        name: 'DNS query volume over time',
        description: 'Track DNS query rates per host to detect spikes',
        query: 'dataset="$DATASET" event_id=22\n| timestats span=15m count() by computer_name\n| order by count_ desc'
      },
      {
        name: 'Top queried domains',
        description: 'Identify most frequently queried DNS names',
        query: 'dataset="$DATASET" event_id=22 earliest=-4h\n| summarize QueryCount=count(), UniqueHosts=dcount(computer_name) by dns_query\n| order by QueryCount desc\n| limit 20'
      },
      {
        name: 'Hosts with highest DNS activity',
        description: 'Find hosts generating the most DNS queries',
        query: 'dataset="$DATASET" event_id=22 earliest=-2h\n| summarize QueryCount=count(), UniqueDomains=dcount(dns_query) by computer_name\n| order by QueryCount desc\n| limit 20'
      }
    ]
  },
  {
    id: 'obs-win-sysmon-005',
    name: 'Registry Modification Baseline',
    objective: 'Monitor Sysmon Events 12-14 (Registry operations) to track registry change rates and detect unusual modification patterns indicating configuration drift.',
    category: 'Change Management',
    tags: ['observability', 'registry', 'configuration', 'change-detection'],
    requiredFields: ['event_id', 'timestamp', 'computer_name', 'registry_key'],
    detectionLogic: 'Track Events 12, 13, and 14 per host over 1-hour windows. Alert when registry modification rate exceeds 3x baseline or when changes target critical system registry paths.',
    falsePositives: ['Group Policy refresh cycles writing registry values', 'Software installers making expected registry modifications'],
    tuningGuidance: 'Set per-host baselines excluding known GP refresh intervals. Focus on critical registry paths (services, run keys, security settings). Exclude installer activity during change windows.',
    operationalValue: 'Unexpected registry changes indicate configuration drift, unauthorized modifications, or failing applications repeatedly writing settings. Detection maintains configuration integrity.',
    changeMgmtRelevance: 'Registry modification spikes correlate with software installations, GP changes, or administrative configuration actions that should have change records.',
    troubleshootingWorkflow: '1. Identify which hosts show registry modification spikes\n2. Determine which registry keys are being modified\n3. Identify the process making the changes\n4. Check if changes are part of a planned deployment\n5. Verify changes are not reverting desired configurations\n6. Compare current registry state against desired baseline',
    criblSearchQueries: [
      {
        name: 'Registry modifications over time',
        description: 'Track registry change event rates per host',
        query: 'dataset="$DATASET" event_id in (12, 13, 14)\n| timestats span=1h count() by computer_name\n| order by count_ desc'
      },
      {
        name: 'Most modified registry keys',
        description: 'Identify which registry paths receive the most modifications',
        query: 'dataset="$DATASET" event_id in (12, 13, 14) earliest=-24h\n| summarize ModCount=count() by registry_key, computer_name\n| order by ModCount desc\n| limit 20'
      },
      {
        name: 'Registry change type breakdown',
        description: 'Categorize registry operations by event type',
        query: 'dataset="$DATASET" event_id in (12, 13, 14) earliest=-24h\n| summarize OpCount=count(), UniqueHosts=dcount(computer_name) by event_id\n| order by OpCount desc'
      }
    ]
  },
  {
    id: 'obs-win-sysmon-006',
    name: 'Image Load Frequency',
    objective: 'Monitor Sysmon Event 7 (Image Loaded) per host to track DLL loading patterns and detect unusual library loading that may indicate system issues.',
    category: 'Health',
    tags: ['observability', 'image-load', 'dll', 'health'],
    requiredFields: ['event_id', 'timestamp', 'computer_name', 'image'],
    detectionLogic: 'Track Event 7 volume per host over 1-hour windows. Alert when image load rate exceeds 3x baseline indicating excessive DLL loading from process cycling or application issues.',
    falsePositives: ['Application startup phases loading many DLLs', '.NET JIT compilation loading assemblies during warm-up'],
    tuningGuidance: 'Set per-host baselines by role. Exclude known high-load applications (IIS app pool recycles, .NET startups). Focus on sustained elevated rates rather than brief spikes.',
    operationalValue: 'Excessive image loading indicates process recycling, application instability, or resource-intensive operations that degrade system performance.',
    changeMgmtRelevance: 'Image load changes follow application deployments adding new dependencies, .NET runtime updates, or plugin/extension installations.',
    troubleshootingWorkflow: '1. Identify which hosts show elevated image load rates\n2. Determine which images (DLLs) are loaded most frequently\n3. Identify the processes loading the images\n4. Check if processes are cycling (start/crash/restart)\n5. Verify application pool or service restart patterns\n6. Review recent application or dependency changes',
    criblSearchQueries: [
      {
        name: 'Image load volume over time',
        description: 'Track DLL/image load rates per host',
        query: 'dataset="$DATASET" event_id=7\n| timestats span=1h count() by computer_name\n| order by count_ desc'
      },
      {
        name: 'Most frequently loaded images',
        description: 'Identify which DLLs are loaded most often',
        query: 'dataset="$DATASET" event_id=7 earliest=-4h\n| summarize LoadCount=count(), UniqueHosts=dcount(computer_name) by image\n| order by LoadCount desc\n| limit 20'
      },
      {
        name: 'Hosts with excessive image loads',
        description: 'Find hosts with highest image load activity',
        query: 'dataset="$DATASET" event_id=7 earliest=-2h\n| summarize LoadCount=count(), UniqueImages=dcount(image) by computer_name\n| order by LoadCount desc\n| limit 20'
      }
    ]
  },
  {
    id: 'obs-win-sysmon-007',
    name: 'New Process First-Seen',
    objective: 'Detect new processes appearing in the environment for the first time, enabling awareness of new software deployments or configuration changes.',
    category: 'Change Management',
    tags: ['observability', 'new-process', 'first-seen', 'change-detection'],
    requiredFields: ['event_id', 'timestamp', 'computer_name', 'image', 'hashes'],
    detectionLogic: 'Maintain a baseline of known process images per host. Alert when Event 1 records a process image not seen in the previous 30-day baseline for that host or environment.',
    falsePositives: ['Legitimate software installations introducing new executables', 'Windows Update installing new system binaries'],
    tuningGuidance: 'Allow whitelisting of known deployment paths. Set different sensitivity for servers vs workstations. Exclude Windows Update paths and known deployment directories.',
    operationalValue: 'New process detection provides visibility into environment changes, ensuring all software additions are tracked and correlated with approved change records.',
    changeMgmtRelevance: 'New processes should correlate with approved change records. First-seen processes without corresponding change requests indicate unauthorized or undocumented changes.',
    troubleshootingWorkflow: '1. Identify the new process image and its location\n2. Check if a change request exists for the software\n3. Verify the file hash against known-good sources\n4. Determine which user or system account initiated the process\n5. Review the parent process to understand how it was launched\n6. Validate the software is approved for the environment',
    criblSearchQueries: [
      {
        name: 'Recently seen new processes',
        description: 'Identify processes that appeared recently for the first time',
        query: 'dataset="$DATASET" event_id=1 earliest=-24h\n| summarize FirstSeen=min(timestamp), Count=count() by image, computer_name\n| order by FirstSeen desc\n| limit 30'
      },
      {
        name: 'New process hashes',
        description: 'Track unique process hashes to identify new binaries',
        query: 'dataset="$DATASET" event_id=1 earliest=-24h\n| summarize FirstSeen=min(timestamp), HostCount=dcount(computer_name) by image, hashes\n| order by FirstSeen desc\n| limit 20'
      },
      {
        name: 'Process introduction timeline',
        description: 'Timeline view of new processes appearing across the environment',
        query: 'dataset="$DATASET" event_id=1 earliest=-7d\n| summarize FirstSeen=min(timestamp), LastSeen=max(timestamp), HostCount=dcount(computer_name) by image\n| order by FirstSeen desc\n| limit 30'
      }
    ]
  }
],
  'windows-wef': [
  {
    id: 'obs-win-wef-001',
    name: 'Forwarding Latency Trending',
    objective: 'Monitor event forwarding delivery lag to detect WEF infrastructure performance degradation before events are lost or significantly delayed.',
    category: 'Performance',
    tags: ['observability', 'wef', 'latency', 'forwarding'],
    requiredFields: ['timestamp', 'computer_name', 'forwarding_computer', 'delivery_mode'],
    detectionLogic: 'Calculate the delta between event generation time and collection time per forwarding computer. Alert when average latency exceeds 5 minutes or when latency shows an increasing trend over 2 hours.',
    falsePositives: ['Network maintenance windows causing temporary delivery delays', 'Collector restarts causing brief catchup bursts'],
    tuningGuidance: 'Set per-delivery-mode latency thresholds (push vs pull have different expectations). Account for WAN latency for remote sites. Exclude planned maintenance windows.',
    operationalValue: 'Forwarding latency directly impacts real-time monitoring and alerting effectiveness. Detecting degradation ensures event delivery SLAs are maintained.',
    changeMgmtRelevance: 'Latency increases follow WEC server changes, network modifications, subscription configuration updates, or collector capacity saturation.',
    troubleshootingWorkflow: '1. Identify which forwarding computers show increased latency\n2. Check WEC server resource utilization (CPU, memory, disk I/O)\n3. Verify network connectivity between forwarders and collectors\n4. Review subscription configuration for delivery mode settings\n5. Check if event volume spikes are causing backpressure\n6. Verify WinRM service health on forwarding computers',
    criblSearchQueries: [
      {
        name: 'Forwarding latency over time',
        description: 'Track event delivery latency trends per forwarding source',
        query: 'dataset="$DATASET"\n| timestats span=15m count() by forwarding_computer, delivery_mode\n| order by count_ desc'
      },
      {
        name: 'Slowest forwarding sources',
        description: 'Identify computers with highest forwarding delays',
        query: 'dataset="$DATASET" earliest=-6h\n| summarize EventCount=count() by forwarding_computer, computer_name\n| order by EventCount desc\n| limit 20'
      },
      {
        name: 'Delivery mode performance comparison',
        description: 'Compare forwarding performance across delivery modes',
        query: 'dataset="$DATASET" earliest=-12h\n| summarize EventCount=count(), UniqueForwarders=dcount(forwarding_computer) by delivery_mode, bin(timestamp, 1h)\n| order by timestamp desc'
      }
    ]
  },
  {
    id: 'obs-win-wef-002',
    name: 'Subscription Coverage Gaps',
    objective: 'Detect hosts that should be forwarding events but have gone silent, indicating WEF agent issues, network problems, or decommissioned systems.',
    category: 'Availability',
    tags: ['observability', 'wef', 'coverage', 'missing-hosts'],
    requiredFields: ['timestamp', 'computer_name', 'subscription_name', 'forwarding_computer'],
    detectionLogic: 'Maintain a list of expected forwarding computers per subscription. Alert when a previously active forwarder stops sending events for more than 30 minutes.',
    falsePositives: ['Planned server decommissions not yet removed from monitoring', 'Hosts in maintenance windows with intentional forwarding suspension'],
    tuningGuidance: 'Define expected forwarder lists per subscription. Set different silence thresholds by criticality. Integrate with CMDB for decommission awareness.',
    operationalValue: 'Coverage gaps mean security and operational events are not being collected. Detecting gaps ensures monitoring completeness and prevents blind spots.',
    changeMgmtRelevance: 'Coverage gaps follow host decommissions, WEF agent configuration changes, network segmentation modifications, or subscription scope changes.',
    troubleshootingWorkflow: '1. Identify which hosts have stopped forwarding events\n2. Verify the host is still online and operational\n3. Check WinRM service status on the silent host\n4. Verify network connectivity to the WEC server\n5. Review WEF subscription membership and targeting\n6. Check Windows Event Collector service health',
    criblSearchQueries: [
      {
        name: 'Active forwarders per subscription',
        description: 'Track which computers are actively forwarding events',
        query: 'dataset="$DATASET" earliest=-2h\n| summarize LastSeen=max(timestamp), EventCount=count() by forwarding_computer, subscription_name\n| order by LastSeen asc\n| limit 30'
      },
      {
        name: 'Forwarder activity timeline',
        description: 'Visualize forwarding activity to detect gaps',
        query: 'dataset="$DATASET" earliest=-24h\n| timestats span=1h dcount(forwarding_computer) by subscription_name\n| order by timestamp desc'
      },
      {
        name: 'Recently silent forwarders',
        description: 'Identify forwarders that were recently active but have gone quiet',
        query: 'dataset="$DATASET" earliest=-12h\n| summarize LastSeen=max(timestamp), TotalEvents=count() by forwarding_computer\n| order by LastSeen asc\n| limit 20'
      }
    ]
  },
  {
    id: 'obs-win-wef-003',
    name: 'Event Drop Rate',
    objective: 'Monitor for lost or dropped events per WEC collector to detect capacity issues or configuration problems causing data loss.',
    category: 'Reliability',
    tags: ['observability', 'wef', 'event-loss', 'reliability'],
    requiredFields: ['timestamp', 'computer_name', 'event_id', 'subscription_name'],
    detectionLogic: 'Track WEC operational events indicating dropped events (Event IDs 111, 112). Alert when drop count exceeds zero or when volume per subscription shows unexplained decreases.',
    falsePositives: ['Brief drops during WEC service restart', 'Transient network interruptions causing recoverable delivery failures'],
    tuningGuidance: 'Set zero-tolerance for production subscriptions. Allow brief drop windows during planned maintenance. Track drop patterns to differentiate transient vs persistent issues.',
    operationalValue: 'Event drops create monitoring blind spots. Detecting drops immediately enables remediation before significant data loss occurs.',
    changeMgmtRelevance: 'Event drops follow WEC capacity saturation from new subscriptions, subscription filter changes increasing volume, or collector hardware/resource constraints.',
    troubleshootingWorkflow: '1. Identify which collectors and subscriptions show drops\n2. Check WEC server resource utilization\n3. Verify event buffer and queue sizes\n4. Review subscription filters for over-collection\n5. Check disk I/O performance on the collector\n6. Evaluate if collector capacity needs to be scaled',
    criblSearchQueries: [
      {
        name: 'Event drop indicators over time',
        description: 'Track WEC operational events indicating potential data loss',
        query: 'dataset="$DATASET" event_id in (111, 112)\n| timestats span=30m count() by computer_name, subscription_name\n| order by count_ desc'
      },
      {
        name: 'Subscriptions with drops',
        description: 'Identify which subscriptions experience event drops',
        query: 'dataset="$DATASET" event_id in (111, 112) earliest=-7d\n| summarize DropCount=count() by subscription_name, computer_name\n| order by DropCount desc\n| limit 20'
      },
      {
        name: 'Volume consistency check',
        description: 'Compare event volumes over time to detect unexplained decreases',
        query: 'dataset="$DATASET" earliest=-48h\n| summarize HourlyCount=count() by subscription_name, bin(timestamp, 1h)\n| order by subscription_name, timestamp'
      }
    ]
  },
  {
    id: 'obs-win-wef-004',
    name: 'Collector Capacity Utilization',
    objective: 'Monitor events per second (EPS) per WEC collector to detect capacity limits being approached and plan scaling.',
    category: 'Capacity',
    tags: ['observability', 'wef', 'capacity', 'eps'],
    requiredFields: ['timestamp', 'computer_name', 'subscription_name', 'event_id'],
    detectionLogic: 'Calculate EPS per WEC collector over 5-minute windows. Alert when EPS exceeds 80% of rated capacity or when EPS shows consistent upward trend approaching limits.',
    falsePositives: ['Burst events during security scanning windows', 'Event storms from domain-wide Group Policy refresh'],
    tuningGuidance: 'Define per-collector rated capacity based on hardware. Set warning at 70% and critical at 85%. Account for burst headroom above sustained capacity.',
    operationalValue: 'Capacity monitoring prevents event loss by enabling proactive scaling before collectors reach saturation and begin dropping events.',
    changeMgmtRelevance: 'Capacity increases follow new subscription additions, subscription filter broadening, or new hosts being added to collection scope.',
    troubleshootingWorkflow: '1. Identify which collectors approach capacity limits\n2. Determine which subscriptions contribute most volume\n3. Review if subscription filters can be optimized\n4. Check if events can be redistributed across collectors\n5. Evaluate adding additional collector capacity\n6. Review if non-critical subscriptions can be moved to off-peak delivery',
    criblSearchQueries: [
      {
        name: 'EPS per collector over time',
        description: 'Track events per second per WEC collector for capacity planning',
        query: 'dataset="$DATASET"\n| timestats span=5m count() by computer_name\n| order by count_ desc'
      },
      {
        name: 'Volume per subscription',
        description: 'Break down collector load by subscription',
        query: 'dataset="$DATASET" earliest=-6h\n| summarize EventCount=count() by subscription_name, computer_name\n| order by EventCount desc\n| limit 20'
      },
      {
        name: 'Capacity trending daily',
        description: 'Track daily volume growth per collector for capacity planning',
        query: 'dataset="$DATASET" earliest=-7d\n| summarize DailyEvents=count() by computer_name, bin(timestamp, 1d)\n| order by computer_name, timestamp'
      }
    ]
  },
  {
    id: 'obs-win-wef-005',
    name: 'Event Volume by Channel',
    objective: 'Monitor event volume per Windows Event Log channel to detect channel-level anomalies and ensure balanced collection.',
    category: 'Capacity',
    tags: ['observability', 'wef', 'channel', 'volume'],
    requiredFields: ['timestamp', 'computer_name', 'original_channel', 'event_id'],
    detectionLogic: 'Track event volume per original channel over 1-hour windows. Alert when a channel shows volume increase exceeding 3x baseline or drops to zero unexpectedly.',
    falsePositives: ['Security channel spikes during audit policy testing', 'Application channels surging during deployment activities'],
    tuningGuidance: 'Set per-channel baselines accounting for day-of-week patterns. Differentiate between expected variable channels and stable-volume channels.',
    operationalValue: 'Channel volume monitoring ensures all expected data sources are flowing and helps identify noisy channels that may need filtering optimization.',
    changeMgmtRelevance: 'Channel volume changes follow audit policy modifications, new application deployments with custom event logging, or WEF subscription filter changes.',
    troubleshootingWorkflow: '1. Identify which channels show volume anomalies\n2. Determine if the change is a spike or sustained shift\n3. Check if audit policy changes occurred\n4. Review if new applications are logging to the channel\n5. Verify WEF subscription filters for the channel\n6. Assess if the volume change requires capacity adjustment',
    criblSearchQueries: [
      {
        name: 'Volume by channel over time',
        description: 'Track event volume per source channel',
        query: 'dataset="$DATASET"\n| timestats span=1h count() by original_channel\n| order by count_ desc'
      },
      {
        name: 'Channel volume ranking',
        description: 'Rank channels by event volume for capacity assessment',
        query: 'dataset="$DATASET" earliest=-24h\n| summarize EventCount=count(), UniqueHosts=dcount(computer_name) by original_channel\n| order by EventCount desc\n| limit 20'
      },
      {
        name: 'Channel volume comparison',
        description: 'Compare channel volumes across time periods',
        query: 'dataset="$DATASET" earliest=-48h\n| summarize HourlyCount=count() by original_channel, bin(timestamp, 1h)\n| order by original_channel, timestamp'
      }
    ]
  },
  {
    id: 'obs-win-wef-006',
    name: 'Client Connection Health',
    objective: 'Monitor WEF client connection patterns to detect connectivity issues between forwarding computers and WEC collectors.',
    category: 'Availability',
    tags: ['observability', 'wef', 'client-connection', 'health'],
    requiredFields: ['timestamp', 'computer_name', 'forwarding_computer', 'subscription_name'],
    detectionLogic: 'Track unique forwarding computers connecting per collection interval. Alert when active client count drops below expected levels or when specific clients show intermittent connectivity.',
    falsePositives: ['Clients in different time zones connecting at different intervals', 'Normal pull-mode delivery intervals appearing as gaps'],
    tuningGuidance: 'Set expected client counts per subscription. Account for delivery mode timing differences. Differentiate between push (continuous) and pull (interval) subscribers.',
    operationalValue: 'Client connection monitoring ensures all expected sources maintain reliable event delivery. Detecting disconnections prevents silent data loss.',
    changeMgmtRelevance: 'Connection issues follow firewall changes blocking WinRM, WEC certificate renewals, or subscription configuration modifications.',
    troubleshootingWorkflow: '1. Identify which clients show connection issues\n2. Verify WinRM connectivity from client to collector\n3. Check certificate validity and trust chain\n4. Review firewall rules for WinRM ports (5985/5986)\n5. Verify subscription targeting includes the client\n6. Check WinRM service status and configuration on the client',
    criblSearchQueries: [
      {
        name: 'Active clients per subscription',
        description: 'Track the number of active forwarding clients over time',
        query: 'dataset="$DATASET"\n| timestats span=1h dcount(forwarding_computer) by subscription_name\n| order by timestamp desc'
      },
      {
        name: 'Client connection frequency',
        description: 'Measure how frequently each client delivers events',
        query: 'dataset="$DATASET" earliest=-24h\n| summarize DeliveryCount=count(), LastDelivery=max(timestamp) by forwarding_computer, subscription_name\n| order by LastDelivery asc\n| limit 30'
      },
      {
        name: 'Intermittent clients',
        description: 'Identify clients with inconsistent delivery patterns',
        query: 'dataset="$DATASET" earliest=-48h\n| summarize HourlyEvents=count() by forwarding_computer, bin(timestamp, 1h)\n| summarize ActiveHours=count(), TotalEvents=sum(HourlyEvents) by forwarding_computer\n| where ActiveHours < 40\n| order by ActiveHours asc'
      }
    ]
  },
  {
    id: 'obs-win-wef-007',
    name: 'Delivery Queue Depth',
    objective: 'Monitor event delivery queue backlog per subscription to detect growing queues that indicate collector processing bottlenecks.',
    category: 'Performance',
    tags: ['observability', 'wef', 'queue', 'backlog'],
    requiredFields: ['timestamp', 'computer_name', 'subscription_name', 'delivery_mode'],
    detectionLogic: 'Track the rate of event delivery per subscription over 5-minute windows. Alert when delivery rate decreases while source volume remains constant, indicating queue buildup.',
    falsePositives: ['Brief queue buildup during WEC service restart', 'Temporary backlog after network restoration catching up on delayed events'],
    tuningGuidance: 'Set per-subscription queue depth thresholds. Allow brief queue buildups during maintenance. Track queue drain rates to differentiate transient vs persistent backlogs.',
    operationalValue: 'Queue depth growth indicates the collector cannot keep pace with incoming events. Detecting queue growth before overflow prevents data loss.',
    changeMgmtRelevance: 'Queue growth follows subscription volume increases, collector performance degradation from competing workloads, or delivery mode changes.',
    troubleshootingWorkflow: '1. Identify which subscriptions show queue growth\n2. Check collector resource utilization (CPU, disk I/O)\n3. Verify delivery mode efficiency (push vs pull)\n4. Review if source volume has increased recently\n5. Check for competing workloads on the collector\n6. Evaluate if delivery batch sizes need optimization',
    criblSearchQueries: [
      {
        name: 'Delivery rate per subscription',
        description: 'Track event delivery rates to detect slowdowns indicating queue buildup',
        query: 'dataset="$DATASET"\n| timestats span=5m count() by subscription_name, delivery_mode\n| order by count_ desc'
      },
      {
        name: 'Subscription delivery comparison',
        description: 'Compare delivery rates across subscriptions to identify bottlenecks',
        query: 'dataset="$DATASET" earliest=-6h\n| summarize EventCount=count() by subscription_name, delivery_mode, bin(timestamp, 30m)\n| order by subscription_name, timestamp'
      },
      {
        name: 'Delivery throughput trending',
        description: 'Track overall delivery throughput to detect degradation trends',
        query: 'dataset="$DATASET" earliest=-24h\n| summarize HourlyEvents=count() by computer_name, subscription_name, bin(timestamp, 1h)\n| order by computer_name, subscription_name, timestamp'
      }
    ]
  }
],
  'prisma-access-traffic': [
  {
    id: 'obs-prisma-traffic-001',
    name: 'Gateway Throughput Saturation',
    objective: 'Monitor bandwidth utilization approaching gateway capacity limits per region to prevent performance degradation from saturation.',
    category: 'Capacity',
    tags: ['observability', 'prisma-access', 'throughput', 'gateway', 'capacity'],
    requiredFields: ['timestamp', 'gateway_region', 'bytes_sent', 'bytes_received', 'session_count', 'gateway_name'],
    detectionLogic: 'Calculate aggregate throughput per gateway region over 5-minute windows. Alert when throughput exceeds 80% of provisioned capacity or when growth rate projects saturation within 2 hours.',
    falsePositives: ['Scheduled large data transfers during off-peak windows', 'Temporary burst traffic during business hours that self-resolves'],
    tuningGuidance: 'Set per-region capacity thresholds based on provisioned bandwidth. Adjust alerting percentages by region criticality. Exclude known backup windows from sustained threshold calculations.',
    operationalValue: 'Proactive capacity alerts prevent user-impacting saturation events. Early detection enables traffic redistribution or capacity expansion before degradation occurs.',
    changeMgmtRelevance: 'Throughput shifts correlate with new site onboarding, policy changes routing more traffic through specific gateways, or bandwidth license changes.',
    troubleshootingWorkflow: '1. Identify which gateway region is approaching saturation\n2. Determine top bandwidth consumers by user or application\n3. Check if traffic can be redistributed to other regions\n4. Verify if growth is organic or caused by misconfiguration\n5. Review recent policy changes affecting traffic routing\n6. Evaluate capacity expansion or traffic shaping options',
    criblSearchQueries: [
      {
        name: 'Gateway throughput by region',
        description: 'Track aggregate bandwidth per gateway region over time',
        query: 'dataset="$DATASET"\n| timestats span=5m sent=sum(bytes_sent), received=sum(bytes_received) by gateway_region\n| extend total_mbps = (sent + received) / 1048576 / 300\n| order by total_mbps desc'
      },
      {
        name: 'Top bandwidth consumers',
        description: 'Identify users or applications driving the most traffic per gateway',
        query: 'dataset="$DATASET" earliest=-1h\n| summarize TotalBytes=sum(bytes_sent) + sum(bytes_received) by source_user, application, gateway_region\n| order by TotalBytes desc\n| limit 25'
      },
      {
        name: 'Throughput trending by gateway',
        description: 'Track throughput growth rate to project capacity saturation',
        query: 'dataset="$DATASET" earliest=-24h\n| summarize HourlyBytes=sum(bytes_sent) + sum(bytes_received) by gateway_name, gateway_region, bin(timestamp, 1h)\n| extend hourly_mbps = HourlyBytes / 1048576 / 3600\n| order by gateway_region, timestamp'
      }
    ]
  },
  {
    id: 'obs-prisma-traffic-002',
    name: 'Session Establishment Latency',
    objective: 'Monitor connection setup time to detect when session establishment latency exceeds SLA thresholds impacting user experience.',
    category: 'Performance',
    tags: ['observability', 'prisma-access', 'latency', 'session', 'performance'],
    requiredFields: ['timestamp', 'session_start_time', 'session_setup_duration_ms', 'gateway_region', 'source_user', 'application'],
    detectionLogic: 'Track session establishment duration per gateway region. Alert when average setup time exceeds defined SLA thresholds (e.g., >500ms for p95) or when latency increases >50% from rolling baseline.',
    falsePositives: ['Users connecting from high-latency regions where longer setup is expected', 'Brief spikes during gateway failover events'],
    tuningGuidance: 'Set per-region latency SLAs accounting for geographic distance. Use percentile-based thresholds rather than averages. Exclude known high-latency source regions from global alerting.',
    operationalValue: 'Session latency directly impacts user productivity and application responsiveness. Detecting latency degradation enables proactive remediation before widespread user complaints.',
    changeMgmtRelevance: 'Latency increases follow gateway configuration changes, new security inspection policies adding processing overhead, or infrastructure maintenance affecting specific regions.',
    troubleshootingWorkflow: '1. Identify which gateway regions show elevated latency\n2. Determine if latency is consistent or intermittent\n3. Check gateway resource utilization (CPU, memory)\n4. Verify upstream ISP path performance\n5. Review recent security policy changes adding inspection\n6. Evaluate if traffic redistribution improves latency',
    criblSearchQueries: [
      {
        name: 'Session latency percentiles by region',
        description: 'Track p50, p90, p95 session establishment latency per region',
        query: 'dataset="$DATASET"\n| timestats span=15m avg_ms=avg(session_setup_duration_ms), p95_ms=max(session_setup_duration_ms) by gateway_region\n| order by p95_ms desc'
      },
      {
        name: 'Latency by application',
        description: 'Identify applications experiencing the highest connection latency',
        query: 'dataset="$DATASET" earliest=-2h\n| summarize AvgLatency=avg(session_setup_duration_ms), P95Latency=max(session_setup_duration_ms), Sessions=count() by application, gateway_region\n| where Sessions > 10\n| order by P95Latency desc\n| limit 20'
      },
      {
        name: 'Latency trending over time',
        description: 'Visualize latency trends to detect gradual degradation',
        query: 'dataset="$DATASET" earliest=-24h\n| summarize AvgSetup=avg(session_setup_duration_ms), P95Setup=max(session_setup_duration_ms) by gateway_region, bin(timestamp, 1h)\n| order by gateway_region, timestamp'
      }
    ]
  },
  {
    id: 'obs-prisma-traffic-003',
    name: 'Application Error Rate',
    objective: 'Detect increased blocks and denies for business-critical applications indicating policy issues or service degradation.',
    category: 'Reliability',
    tags: ['observability', 'prisma-access', 'application', 'errors', 'reliability'],
    requiredFields: ['timestamp', 'application', 'action', 'source_user', 'gateway_region', 'rule_name', 'threat_category'],
    detectionLogic: 'Track deny/block action rates per application over 15-minute windows. Alert when deny rate for critical applications exceeds baseline by >2x or when new applications appear in deny logs without prior history.',
    falsePositives: ['Newly deployed applications not yet added to allow policies', 'Legitimate policy enforcement blocking unauthorized application usage'],
    tuningGuidance: 'Define critical application list for heightened alerting. Set per-application deny baselines. Distinguish between policy-intended blocks and unexpected denials.',
    operationalValue: 'Unexpected application blocks impact business productivity and indicate policy misconfigurations or service issues requiring immediate attention.',
    changeMgmtRelevance: 'Application error rate changes correlate with security policy updates, application category reclassifications, or new URL filtering rules.',
    troubleshootingWorkflow: '1. Identify which applications show increased deny rates\n2. Determine the blocking rule and policy\n3. Check if a recent policy change affected these applications\n4. Verify if the application category has changed\n5. Confirm whether blocks are intentional or misconfigured\n6. Coordinate with security team for policy adjustment if needed',
    criblSearchQueries: [
      {
        name: 'Deny rate by application',
        description: 'Track block/deny actions per application over time',
        query: 'dataset="$DATASET" action in ("deny", "block", "drop")\n| timestats span=15m count() by application\n| order by count_ desc'
      },
      {
        name: 'Top blocked applications with context',
        description: 'Identify most frequently blocked applications with user and rule context',
        query: 'dataset="$DATASET" action in ("deny", "block", "drop") earliest=-4h\n| summarize BlockCount=count(), AffectedUsers=dcount(source_user) by application, rule_name\n| order by BlockCount desc\n| limit 20'
      },
      {
        name: 'Application action distribution',
        description: 'Compare allow vs deny ratios per application to detect shifts',
        query: 'dataset="$DATASET" earliest=-12h\n| summarize ActionCount=count() by application, action, bin(timestamp, 1h)\n| order by application, timestamp, action'
      }
    ]
  },
  {
    id: 'obs-prisma-traffic-004',
    name: 'URL Category Volume Shift',
    objective: 'Detect sudden changes in traffic category distribution indicating policy changes, compromised accounts, or shifts in user behavior.',
    category: 'Change Management',
    tags: ['observability', 'prisma-access', 'url-category', 'change-detection', 'traffic-pattern'],
    requiredFields: ['timestamp', 'url_category', 'bytes_sent', 'bytes_received', 'source_user', 'gateway_region'],
    detectionLogic: 'Compare URL category distribution over 1-hour windows against 7-day rolling baseline. Alert when any category shifts >30% from expected proportion or when previously rare categories show sudden volume increases.',
    falsePositives: ['Seasonal business activity shifts (e.g., tax season increasing finance category)', 'Marketing campaigns driving temporary traffic pattern changes'],
    tuningGuidance: 'Set category-specific shift thresholds. Use longer baselines for categories with high natural variance. Focus alerting on categories with security relevance.',
    operationalValue: 'Category distribution shifts reveal policy effectiveness changes, emerging shadow IT adoption, or compromised accounts exhibiting unusual browsing patterns.',
    changeMgmtRelevance: 'URL category shifts directly follow policy updates reclassifying sites, new URL filtering rules, or changes to decryption policies affecting category visibility.',
    troubleshootingWorkflow: '1. Identify which URL categories shifted significantly\n2. Determine if shift is user-driven or policy-driven\n3. Check for recent URL category database updates\n4. Verify if specific users drive the category change\n5. Review recent policy changes affecting URL filtering\n6. Assess whether shift requires policy adjustment',
    criblSearchQueries: [
      {
        name: 'URL category distribution over time',
        description: 'Track traffic volume by URL category to detect distribution shifts',
        query: 'dataset="$DATASET"\n| timestats span=1h count() by url_category\n| order by count_ desc'
      },
      {
        name: 'Category volume comparison',
        description: 'Compare current category volumes against baseline period',
        query: 'dataset="$DATASET" earliest=-24h\n| summarize SessionCount=count(), TotalBytes=sum(bytes_sent) + sum(bytes_received) by url_category, bin(timestamp, 4h)\n| order by url_category, timestamp'
      },
      {
        name: 'Users driving category shifts',
        description: 'Identify users contributing most to category volume changes',
        query: 'dataset="$DATASET" earliest=-4h\n| summarize Sessions=count(), Bytes=sum(bytes_sent) + sum(bytes_received) by source_user, url_category\n| order by Bytes desc\n| limit 30'
      }
    ]
  },
  {
    id: 'obs-prisma-traffic-005',
    name: 'User Bandwidth Trending',
    objective: 'Track per-user bandwidth consumption over time to identify heavy consumers, detect anomalous usage, and support capacity planning.',
    category: 'Capacity',
    tags: ['observability', 'prisma-access', 'bandwidth', 'per-user', 'trending'],
    requiredFields: ['timestamp', 'source_user', 'bytes_sent', 'bytes_received', 'application', 'gateway_region'],
    detectionLogic: 'Calculate per-user daily bandwidth consumption and compare against rolling 30-day baseline. Alert when users exceed 3x their typical consumption or when aggregate user bandwidth grows faster than provisioned capacity.',
    falsePositives: ['Users performing legitimate large file transfers or backups', 'One-time data migration activities by authorized personnel'],
    tuningGuidance: 'Set per-user bandwidth tiers based on role. Exclude known high-bandwidth roles (engineers, designers). Use daily granularity for trending, hourly for spike detection.',
    operationalValue: 'Per-user bandwidth trending enables fair-use enforcement, identifies compromised accounts exfiltrating data, and provides data for capacity planning decisions.',
    changeMgmtRelevance: 'Bandwidth consumption changes follow new application deployments, remote work policy changes, or QoS policy modifications affecting user traffic shaping.',
    troubleshootingWorkflow: '1. Identify users with anomalous bandwidth consumption\n2. Determine which applications drive the bandwidth\n3. Check if usage is during business hours or off-hours\n4. Verify if the user role justifies the bandwidth level\n5. Assess whether traffic shaping policies are effective\n6. Escalate to security if exfiltration is suspected',
    criblSearchQueries: [
      {
        name: 'Top bandwidth users',
        description: 'Rank users by total bandwidth consumption',
        query: 'dataset="$DATASET" earliest=-24h\n| summarize TotalBytes=sum(bytes_sent) + sum(bytes_received), Sessions=count() by source_user\n| extend TotalMB = TotalBytes / 1048576\n| order by TotalMB desc\n| limit 25'
      },
      {
        name: 'User bandwidth over time',
        description: 'Track bandwidth consumption trends per user',
        query: 'dataset="$DATASET" earliest=-7d\n| summarize DailyBytes=sum(bytes_sent) + sum(bytes_received) by source_user, bin(timestamp, 1d)\n| extend DailyMB = DailyBytes / 1048576\n| order by source_user, timestamp'
      },
      {
        name: 'Bandwidth by application per user',
        description: 'Break down user bandwidth by application for detailed analysis',
        query: 'dataset="$DATASET" earliest=-4h\n| summarize AppBytes=sum(bytes_sent) + sum(bytes_received) by source_user, application\n| extend AppMB = AppBytes / 1048576\n| order by AppMB desc\n| limit 30'
      }
    ]
  },
  {
    id: 'obs-prisma-traffic-006',
    name: 'Threat Prevention False Positive Rate',
    objective: 'Monitor the ratio of threat alerts to confirmed threats to assess threat prevention efficacy and identify tuning opportunities.',
    category: 'Health',
    tags: ['observability', 'prisma-access', 'threat-prevention', 'false-positive', 'efficacy'],
    requiredFields: ['timestamp', 'threat_name', 'threat_category', 'action', 'severity', 'source_user', 'destination_ip'],
    detectionLogic: 'Calculate the ratio of threat alerts resolved as false positive vs confirmed threats over daily windows. Alert when false positive rate exceeds 40% or when specific signatures consistently generate false positives.',
    falsePositives: ['New signatures with initial high false positive rate that stabilize over time', 'Environment-specific applications triggering generic signatures'],
    tuningGuidance: 'Track false positive rates per signature and category. Identify signatures with >50% FP rate for exception creation. Review after threat feed updates for new noisy signatures.',
    operationalValue: 'High false positive rates cause alert fatigue and waste analyst time. Monitoring FP rates identifies tuning opportunities and validates threat prevention investment.',
    changeMgmtRelevance: 'False positive rate changes follow threat feed updates, new signature deployments, security profile modifications, or application changes triggering existing signatures.',
    troubleshootingWorkflow: '1. Identify signatures with highest false positive rates\n2. Determine which users or applications trigger them\n3. Assess if exceptions can be safely created\n4. Review vendor recommendations for signature tuning\n5. Validate that confirmed threats are not being suppressed\n6. Track FP rate improvement after tuning changes',
    criblSearchQueries: [
      {
        name: 'Threat alert volume by category',
        description: 'Track threat alerts by category to identify noisy detection areas',
        query: 'dataset="$DATASET" threat_category!=""\n| timestats span=1h count() by threat_category, severity\n| order by count_ desc'
      },
      {
        name: 'Top triggering signatures',
        description: 'Identify signatures generating the most alerts for FP analysis',
        query: 'dataset="$DATASET" threat_name!="" earliest=-24h\n| summarize AlertCount=count(), UniqueUsers=dcount(source_user), UniqueDestinations=dcount(destination_ip) by threat_name, threat_category, severity\n| order by AlertCount desc\n| limit 20'
      },
      {
        name: 'Alert action distribution',
        description: 'Compare alert vs block actions to assess prevention posture',
        query: 'dataset="$DATASET" threat_name!="" earliest=-7d\n| summarize ActionCount=count() by threat_category, action, bin(timestamp, 1d)\n| order by threat_category, timestamp, action'
      }
    ]
  },
  {
    id: 'obs-prisma-traffic-007',
    name: 'Regional Traffic Distribution',
    objective: 'Monitor traffic load distribution across geographic gateways to detect uneven load that could cause regional performance degradation.',
    category: 'Availability',
    tags: ['observability', 'prisma-access', 'regional', 'load-distribution', 'availability'],
    requiredFields: ['timestamp', 'gateway_region', 'gateway_name', 'session_count', 'bytes_sent', 'bytes_received', 'source_user'],
    detectionLogic: 'Compare traffic distribution across regions against expected proportions. Alert when any region carries >150% of its expected load share or when a region drops below 50% indicating potential failover.',
    falsePositives: ['Normal business hours variation with regions peaking at different times', 'Planned maintenance redirecting traffic to alternate regions'],
    tuningGuidance: 'Define expected load percentages per region based on user distribution. Account for time zone differences in load patterns. Set separate thresholds for peak vs off-peak hours.',
    operationalValue: 'Uneven regional distribution causes localized performance degradation and wastes capacity in underutilized regions. Balancing ensures consistent user experience globally.',
    changeMgmtRelevance: 'Distribution shifts follow gateway configuration changes, DNS-based routing updates, new site onboarding to specific regions, or capacity changes affecting routing decisions.',
    troubleshootingWorkflow: '1. Identify which regions show abnormal load distribution\n2. Determine if users are being routed to non-optimal regions\n3. Check for gateway health issues causing failover\n4. Verify DNS and routing configurations are correct\n5. Assess whether load balancing policies need adjustment\n6. Review recent infrastructure changes affecting routing',
    criblSearchQueries: [
      {
        name: 'Traffic distribution by region',
        description: 'Visualize session and bandwidth distribution across regions',
        query: 'dataset="$DATASET"\n| timestats span=30m sessions=count(), sum(bytes_sent) + total_bytes=sum(bytes_received) by gateway_region\n| order by sessions desc'
      },
      {
        name: 'Regional load comparison',
        description: 'Compare current regional load against expected distribution',
        query: 'dataset="$DATASET" earliest=-12h\n| summarize Sessions=count(), Users=dcount(source_user), TotalBytes=sum(bytes_sent) + sum(bytes_received) by gateway_region, bin(timestamp, 1h)\n| order by gateway_region, timestamp'
      },
      {
        name: 'Gateway utilization per region',
        description: 'Break down load across individual gateways within regions',
        query: 'dataset="$DATASET" earliest=-4h\n| summarize Sessions=count(), Bytes=sum(bytes_sent) + sum(bytes_received) by gateway_name, gateway_region\n| order by gateway_region, Sessions desc'
      }
    ]
  }
],
  'prisma-access-gp': [
  {
    id: 'obs-prisma-gp-001',
    name: 'Connection Success Rate',
    objective: 'Monitor VPN/ZTNA connection failure rates by gateway to detect connectivity issues impacting remote user access.',
    category: 'Availability',
    tags: ['observability', 'prisma-access', 'globalprotect', 'connection', 'availability'],
    requiredFields: ['timestamp', 'gateway_name', 'connection_status', 'source_user', 'source_ip', 'failure_reason'],
    detectionLogic: 'Calculate connection success rate per gateway over 15-minute windows. Alert when success rate drops below 95% or when failure count exceeds 3x baseline for any gateway.',
    falsePositives: ['Users with expired credentials generating repeated failed attempts', 'Network scanning tools triggering connection attempts'],
    tuningGuidance: 'Set per-gateway success rate thresholds based on historical norms. Exclude known problem users from gateway-level calculations. Track failure reasons to separate infrastructure issues from user errors.',
    operationalValue: 'Connection failures directly impact remote workforce productivity. Rapid detection enables fast remediation before widespread user impact and help desk ticket storms.',
    changeMgmtRelevance: 'Connection success rate drops follow certificate renewals, gateway configuration changes, authentication provider modifications, or network path changes.',
    troubleshootingWorkflow: '1. Identify which gateways show degraded success rates\n2. Categorize failure reasons (auth, cert, network, capacity)\n3. Determine if failures affect all users or specific groups\n4. Check gateway resource utilization and health\n5. Verify authentication provider availability\n6. Review recent configuration or certificate changes',
    criblSearchQueries: [
      {
        name: 'Connection success rate by gateway',
        description: 'Track connection success/failure rates per gateway over time',
        query: 'dataset="$DATASET"\n| timestats span=15m count() by gateway_name, connection_status\n| order by gateway_name, timestamp'
      },
      {
        name: 'Failure reasons breakdown',
        description: 'Categorize connection failures to identify root causes',
        query: 'dataset="$DATASET" connection_status="failed" earliest=-4h\n| summarize FailureCount=count(), AffectedUsers=dcount(source_user) by failure_reason, gateway_name\n| order by FailureCount desc'
      },
      {
        name: 'Connection success trending',
        description: 'Track overall success rate trending to detect gradual degradation',
        query: 'dataset="$DATASET" earliest=-24h\n| summarize Total=count(), Failures=countif(connection_status=="failed") by gateway_name, bin(timestamp, 1h)\n| extend SuccessRate = (Total - Failures) * 100.0 / Total\n| order by gateway_name, timestamp'
      }
    ]
  },
  {
    id: 'obs-prisma-gp-002',
    name: 'Authentication Latency',
    objective: 'Monitor SAML and authentication method response times to detect auth infrastructure performance issues affecting user login experience.',
    category: 'Performance',
    tags: ['observability', 'prisma-access', 'globalprotect', 'authentication', 'latency'],
    requiredFields: ['timestamp', 'auth_method', 'auth_duration_ms', 'source_user', 'gateway_name', 'auth_provider'],
    detectionLogic: 'Track authentication duration by method and provider over 10-minute windows. Alert when p95 auth latency exceeds 3 seconds or when average latency increases >100% from baseline.',
    falsePositives: ['First authentication of the day taking longer due to cold SAML sessions', 'MFA challenges adding expected latency to auth flow'],
    tuningGuidance: 'Set separate thresholds per auth method (SAML, LDAP, certificate). Account for MFA step latency. Exclude offline/timeout failures from latency calculations.',
    operationalValue: 'Authentication latency directly impacts user login experience and productivity. Detecting auth provider slowdowns enables proactive engagement with identity team.',
    changeMgmtRelevance: 'Auth latency changes follow IdP configuration updates, SAML certificate rotations, MFA provider changes, or network path modifications between gateway and auth provider.',
    troubleshootingWorkflow: '1. Identify which auth method shows elevated latency\n2. Determine if latency is at IdP or network level\n3. Check IdP health and response times independently\n4. Verify network connectivity between gateway and auth provider\n5. Review recent IdP configuration or certificate changes\n6. Assess whether auth caching is functioning correctly',
    criblSearchQueries: [
      {
        name: 'Auth latency by method',
        description: 'Track authentication duration by method over time',
        query: 'dataset="$DATASET" auth_duration_ms > 0\n| timestats span=10m avg_ms=avg(auth_duration_ms), p95_ms=max(auth_duration_ms) by auth_method\n| order by p95_ms desc'
      },
      {
        name: 'Auth latency by provider',
        description: 'Compare latency across authentication providers',
        query: 'dataset="$DATASET" auth_duration_ms > 0 earliest=-4h\n| summarize AvgLatency=avg(auth_duration_ms), P95Latency=max(auth_duration_ms), AuthCount=count() by auth_provider, gateway_name\n| order by P95Latency desc'
      },
      {
        name: 'Auth latency trending',
        description: 'Visualize authentication latency trends for degradation detection',
        query: 'dataset="$DATASET" auth_duration_ms > 0 earliest=-24h\n| summarize AvgAuth=avg(auth_duration_ms), P95Auth=max(auth_duration_ms) by auth_method, bin(timestamp, 1h)\n| order by auth_method, timestamp'
      }
    ]
  },
  {
    id: 'obs-prisma-gp-003',
    name: 'Concurrent User Capacity',
    objective: 'Monitor active concurrent connections approaching gateway capacity limits to prevent connection rejections from capacity exhaustion.',
    category: 'Capacity',
    tags: ['observability', 'prisma-access', 'globalprotect', 'concurrent-users', 'capacity'],
    requiredFields: ['timestamp', 'gateway_name', 'active_sessions', 'max_sessions', 'source_user', 'gateway_region'],
    detectionLogic: 'Track concurrent active sessions per gateway against provisioned capacity. Alert when utilization exceeds 75% or when growth rate projects capacity exhaustion within 4 hours.',
    falsePositives: ['Start-of-business-day connection surge that stabilizes within 30 minutes', 'All-hands meetings causing temporary peak in specific regions'],
    tuningGuidance: 'Set per-gateway capacity thresholds based on licensed limits. Use time-of-day baselines to distinguish normal peaks from abnormal growth. Account for regional business hours.',
    operationalValue: 'Capacity exhaustion causes connection rejections for new users. Proactive monitoring enables scaling decisions before users are impacted.',
    changeMgmtRelevance: 'Capacity utilization changes follow user onboarding waves, split-tunnel policy changes increasing always-on connections, or license modifications changing limits.',
    troubleshootingWorkflow: '1. Identify which gateways approach capacity limits\n2. Verify current licensed session capacity\n3. Determine if growth is organic or caused by configuration change\n4. Check if users can be redistributed to other gateways\n5. Assess whether idle session timeout tuning would help\n6. Evaluate emergency capacity expansion options',
    criblSearchQueries: [
      {
        name: 'Concurrent sessions by gateway',
        description: 'Track active session counts per gateway over time',
        query: 'dataset="$DATASET"\n| timestats span=5m peak_sessions=max(active_sessions) by gateway_name, gateway_region\n| order by peak_sessions desc'
      },
      {
        name: 'Capacity utilization percentage',
        description: 'Calculate session utilization against gateway limits',
        query: 'dataset="$DATASET" earliest=-12h\n| summarize PeakSessions=max(active_sessions), MaxCapacity=max(max_sessions) by gateway_name, bin(timestamp, 30m)\n| extend UtilPct = PeakSessions * 100.0 / MaxCapacity\n| order by gateway_name, timestamp'
      },
      {
        name: 'Session growth trending',
        description: 'Track session count growth for capacity planning',
        query: 'dataset="$DATASET" earliest=-7d\n| summarize DailyPeak=max(active_sessions), DailyAvg=avg(active_sessions) by gateway_name, bin(timestamp, 1d)\n| order by gateway_name, timestamp'
      }
    ]
  },
  {
    id: 'obs-prisma-gp-004',
    name: 'Client Version Distribution',
    objective: 'Track GlobalProtect client version adoption across the fleet to ensure compliance with minimum version requirements and monitor rollout progress.',
    category: 'Change Management',
    tags: ['observability', 'prisma-access', 'globalprotect', 'client-version', 'compliance'],
    requiredFields: ['timestamp', 'source_user', 'client_version', 'os_type', 'gateway_name'],
    detectionLogic: 'Track unique users per client version over daily windows. Alert when outdated versions exceed compliance threshold (e.g., >10% on versions older than N-2) or when new version adoption stalls below target.',
    falsePositives: ['Devices in maintenance windows pending scheduled updates', 'Test groups intentionally running older versions for compatibility validation'],
    tuningGuidance: 'Define minimum acceptable version per OS platform. Set adoption targets for new releases with timeline expectations. Exclude known test groups from compliance calculations.',
    operationalValue: 'Outdated client versions may have security vulnerabilities or lack features required by current policies. Version tracking ensures fleet compliance and successful rollouts.',
    changeMgmtRelevance: 'Version distribution directly reflects client upgrade rollout progress. Stalled adoption indicates deployment issues requiring investigation.',
    troubleshootingWorkflow: '1. Identify which versions are non-compliant\n2. Determine which OS platforms have the most outdated clients\n3. Check if auto-update policies are functioning\n4. Identify users on the oldest versions for targeted remediation\n5. Verify update packages are accessible from all networks\n6. Coordinate with endpoint management for forced upgrades if needed',
    criblSearchQueries: [
      {
        name: 'Client version distribution',
        description: 'Show current distribution of GP client versions',
        query: 'dataset="$DATASET" earliest=-24h\n| summarize UserCount=dcount(source_user) by client_version, os_type\n| order by client_version desc'
      },
      {
        name: 'Version adoption trending',
        description: 'Track version adoption over time to monitor rollout progress',
        query: 'dataset="$DATASET" earliest=-7d\n| summarize DailyUsers=dcount(source_user) by client_version, bin(timestamp, 1d)\n| order by timestamp, client_version'
      },
      {
        name: 'Users on outdated versions',
        description: 'Identify users running non-compliant client versions',
        query: 'dataset="$DATASET" earliest=-24h\n| summarize LastSeen=max(timestamp), Gateway=any(gateway_name) by source_user, client_version, os_type\n| order by client_version asc\n| limit 50'
      }
    ]
  },
  {
    id: 'obs-prisma-gp-005',
    name: 'HIP Compliance Rate',
    objective: 'Monitor the percentage of devices passing Host Information Profile posture checks to ensure endpoint security compliance across the fleet.',
    category: 'Health',
    tags: ['observability', 'prisma-access', 'globalprotect', 'hip', 'compliance', 'posture'],
    requiredFields: ['timestamp', 'source_user', 'hip_status', 'hip_profile', 'os_type', 'gateway_name', 'device_name'],
    detectionLogic: 'Calculate HIP pass/fail rate per profile over 1-hour windows. Alert when compliance rate drops below 90% or when specific HIP checks show sudden increase in failures indicating widespread endpoint issues.',
    falsePositives: ['AV signature update delays causing temporary compliance drops', 'OS patch Tuesday causing brief non-compliance before auto-patching completes'],
    tuningGuidance: 'Set compliance thresholds per HIP profile based on enforcement criticality. Allow grace periods after patch releases. Track compliance by OS platform separately.',
    operationalValue: 'HIP compliance ensures endpoints meet security requirements before accessing resources. Declining compliance rates indicate endpoint management issues requiring remediation.',
    changeMgmtRelevance: 'Compliance rate changes follow HIP profile modifications, new check requirements, AV definition updates, OS patches, or endpoint management policy changes.',
    troubleshootingWorkflow: '1. Identify which HIP profiles show compliance drops\n2. Determine which specific checks are failing\n3. Identify affected device populations by OS/type\n4. Check if endpoint management tools are deploying required updates\n5. Verify HIP profile requirements match current environment\n6. Coordinate with endpoint team for remediation campaigns',
    criblSearchQueries: [
      {
        name: 'HIP compliance rate by profile',
        description: 'Track pass/fail rates per HIP profile over time',
        query: 'dataset="$DATASET"\n| timestats span=1h count() by hip_profile, hip_status\n| order by hip_profile, timestamp'
      },
      {
        name: 'Non-compliant devices',
        description: 'Identify devices failing HIP checks for targeted remediation',
        query: 'dataset="$DATASET" hip_status="fail" earliest=-24h\n| summarize FailCount=count(), Profiles=dcount(hip_profile) by source_user, device_name, os_type\n| order by FailCount desc\n| limit 30'
      },
      {
        name: 'Compliance trending by OS',
        description: 'Track compliance rates by operating system platform',
        query: 'dataset="$DATASET" earliest=-7d\n| summarize Total=count(), Passed=countif(hip_status=="pass") by os_type, bin(timestamp, 1d)\n| extend CompliancePct = Passed * 100.0 / Total\n| order by os_type, timestamp'
      }
    ]
  },
  {
    id: 'obs-prisma-gp-006',
    name: 'Session Duration Baseline',
    objective: 'Monitor average session length and reconnection frequency to detect client stability issues or policy misconfiguration causing excessive reconnections.',
    category: 'Performance',
    tags: ['observability', 'prisma-access', 'globalprotect', 'session-duration', 'stability'],
    requiredFields: ['timestamp', 'source_user', 'session_duration_sec', 'disconnect_reason', 'gateway_name', 'connection_method'],
    detectionLogic: 'Track average session duration and reconnection frequency per user and gateway. Alert when average duration drops below 30 minutes (indicating instability) or when reconnection rate exceeds 5x per user per hour.',
    falsePositives: ['Users on unreliable mobile networks with expected frequent reconnections', 'Planned gateway maintenance causing scheduled disconnections'],
    tuningGuidance: 'Set duration baselines per connection method (tunnel vs ZTNA). Exclude mobile users from stability calculations. Track disconnect reasons to separate user-initiated from infrastructure-caused disconnections.',
    operationalValue: 'Short sessions and frequent reconnections indicate client instability, network issues, or policy problems. Detection enables proactive troubleshooting before users report issues.',
    changeMgmtRelevance: 'Session duration changes follow idle timeout policy modifications, keep-alive setting changes, gateway configuration updates, or network infrastructure modifications.',
    troubleshootingWorkflow: '1. Identify users with abnormally short sessions\n2. Categorize disconnect reasons\n3. Determine if issue is client-side, network, or gateway\n4. Check for MTU issues or network instability\n5. Review keep-alive and timeout configurations\n6. Verify split-tunnel settings are not causing connectivity loss',
    criblSearchQueries: [
      {
        name: 'Session duration distribution',
        description: 'Track session duration patterns to identify instability',
        query: 'dataset="$DATASET" session_duration_sec > 0\n| timestats span=1h avg_duration=avg(session_duration_sec), p25_duration=min(session_duration_sec) by gateway_name\n| order by avg_duration asc'
      },
      {
        name: 'Frequent reconnectors',
        description: 'Identify users with excessive reconnection rates',
        query: 'dataset="$DATASET" earliest=-4h\n| summarize SessionCount=count(), AvgDuration=avg(session_duration_sec) by source_user, gateway_name\n| where SessionCount > 5\n| order by SessionCount desc\n| limit 25'
      },
      {
        name: 'Disconnect reason analysis',
        description: 'Break down disconnection causes to identify systemic issues',
        query: 'dataset="$DATASET" disconnect_reason!="" earliest=-24h\n| summarize DisconnectCount=count(), AffectedUsers=dcount(source_user) by disconnect_reason, gateway_name, bin(timestamp, 2h)\n| order by DisconnectCount desc'
      }
    ]
  },
  {
    id: 'obs-prisma-gp-007',
    name: 'Gateway Regional Health',
    objective: 'Monitor per-region connection health and failover patterns to ensure consistent availability across all geographic gateway locations.',
    category: 'Availability',
    tags: ['observability', 'prisma-access', 'globalprotect', 'regional-health', 'failover'],
    requiredFields: ['timestamp', 'gateway_name', 'gateway_region', 'connection_status', 'failover_triggered', 'source_user', 'response_time_ms'],
    detectionLogic: 'Track gateway health metrics per region including success rate, response time, and failover events. Alert when any region shows degraded health or when failover events exceed baseline indicating primary gateway issues.',
    falsePositives: ['Planned maintenance windows with expected failover activity', 'Brief network blips causing single failover events that self-resolve'],
    tuningGuidance: 'Define health thresholds per region based on historical performance. Set failover event baselines and alert on sustained patterns rather than individual events. Account for planned maintenance schedules.',
    operationalValue: 'Regional health monitoring ensures global workforce has consistent access. Detecting failover patterns reveals underlying infrastructure issues before they cause outages.',
    changeMgmtRelevance: 'Regional health changes follow gateway upgrades, network path modifications, ISP changes, or configuration updates affecting specific geographic locations.',
    troubleshootingWorkflow: '1. Identify which regions show degraded health\n2. Check if failover is occurring and to which backup gateways\n3. Verify primary gateway health and resource utilization\n4. Test network connectivity to affected region\n5. Review ISP status and network path changes\n6. Assess whether failover routing is functioning correctly',
    criblSearchQueries: [
      {
        name: 'Regional health summary',
        description: 'Overview of connection health metrics per region',
        query: 'dataset="$DATASET"\n| timestats span=15m total=count(), successful=countif(connection_status=="success") by gateway_region\n| extend health_pct = successful * 100.0 / total\n| order by health_pct asc'
      },
      {
        name: 'Failover event tracking',
        description: 'Monitor failover events to detect recurring gateway issues',
        query: 'dataset="$DATASET" failover_triggered="true" earliest=-24h\n| summarize FailoverCount=count(), AffectedUsers=dcount(source_user) by gateway_region, gateway_name, bin(timestamp, 1h)\n| order by FailoverCount desc'
      },
      {
        name: 'Regional response time comparison',
        description: 'Compare response times across regions to detect degradation',
        query: 'dataset="$DATASET" response_time_ms > 0 earliest=-12h\n| summarize AvgResponse=avg(response_time_ms), P95Response=max(response_time_ms) by gateway_region, bin(timestamp, 1h)\n| order by gateway_region, timestamp'
      }
    ]
  }
],
  'prisma-cloud-cspm': [
  {
    id: 'obs-prisma-cspm-001',
    name: 'Alert Resolution Time',
    objective: 'Monitor mean time to resolve CSPM alerts by severity to ensure security posture issues are addressed within SLA timelines.',
    category: 'Performance',
    tags: ['observability', 'prisma-cloud', 'cspm', 'resolution-time', 'sla'],
    requiredFields: ['timestamp', 'alert_id', 'severity', 'status', 'opened_time', 'resolved_time', 'cloud_account', 'policy_name'],
    detectionLogic: 'Calculate mean time to resolution (MTTR) by alert severity over daily windows. Alert when MTTR exceeds defined SLA thresholds (Critical: 24h, High: 72h, Medium: 7d) or when resolution time is trending upward.',
    falsePositives: ['Alerts requiring vendor patches with extended remediation timelines', 'Alerts on resources scheduled for decommission with accepted risk'],
    tuningGuidance: 'Set MTTR thresholds by severity and cloud account criticality. Exclude alerts with documented risk acceptance from SLA calculations. Track by team assignment for accountability.',
    operationalValue: 'MTTR trending reveals operational bottlenecks in security remediation workflows. Increasing resolution times indicate team capacity issues or process inefficiencies.',
    changeMgmtRelevance: 'Resolution time changes follow team restructuring, process changes, new automation deployments, or shifts in alert volume overwhelming existing capacity.',
    troubleshootingWorkflow: '1. Identify severity levels with SLA breaches\n2. Determine which cloud accounts have longest MTTR\n3. Check if specific policy types have extended resolution times\n4. Assess team workload and alert assignment distribution\n5. Identify automation opportunities for common remediation\n6. Review escalation paths for aged alerts',
    criblSearchQueries: [
      {
        name: 'MTTR by severity',
        description: 'Track mean time to resolution by alert severity',
        query: 'dataset="$DATASET" status="resolved"\n| extend resolution_hours = (resolved_time - opened_time) / 3600\n| summarize AvgMTTR=avg(resolution_hours), P95MTTR=max(resolution_hours) by severity\n| order by AvgMTTR desc'
      },
      {
        name: 'Resolution time trending',
        description: 'Track MTTR trends over time to detect degradation',
        query: 'dataset="$DATASET" status="resolved" earliest=-30d\n| extend resolution_hours = (resolved_time - opened_time) / 3600\n| summarize AvgMTTR=avg(resolution_hours), AlertCount=count() by severity, bin(timestamp, 1d)\n| order by severity, timestamp'
      },
      {
        name: 'Aged open alerts',
        description: 'Identify alerts exceeding SLA thresholds still awaiting resolution',
        query: 'dataset="$DATASET" status="open"\n| extend age_hours = (now() - opened_time) / 3600\n| summarize AlertCount=count(), MaxAge=max(age_hours) by severity, cloud_account, policy_name\n| where (severity=="critical" and MaxAge > 24) or (severity=="high" and MaxAge > 72)\n| order by MaxAge desc'
      }
    ]
  },
  {
    id: 'obs-prisma-cspm-002',
    name: 'Compliance Score Trending',
    objective: 'Track cloud security posture compliance scores by framework over time to detect score degradation and measure remediation effectiveness.',
    category: 'Health',
    tags: ['observability', 'prisma-cloud', 'cspm', 'compliance', 'posture-score'],
    requiredFields: ['timestamp', 'framework_name', 'compliance_score', 'total_checks', 'passed_checks', 'failed_checks', 'cloud_account'],
    detectionLogic: 'Track compliance percentage by framework over daily windows. Alert when score drops >5% from 7-day baseline or when any critical framework drops below minimum acceptable threshold (e.g., 85%).',
    falsePositives: ['New resources being scanned before policies are applied', 'Framework updates adding new checks that temporarily reduce scores'],
    tuningGuidance: 'Set minimum score thresholds per framework based on organizational requirements. Allow grace periods after framework updates add new checks. Track by cloud account for granular alerting.',
    operationalValue: 'Compliance score trending provides executive visibility into security posture health. Score degradation indicates new misconfigurations outpacing remediation efforts.',
    changeMgmtRelevance: 'Score changes follow new cloud resource deployments, framework definition updates, policy changes, or bulk remediation campaigns improving scores.',
    troubleshootingWorkflow: '1. Identify which frameworks show score degradation\n2. Determine which specific checks are newly failing\n3. Identify cloud accounts driving the score drop\n4. Check for new resource deployments creating violations\n5. Verify if framework definitions were recently updated\n6. Prioritize remediation by impact to score recovery',
    criblSearchQueries: [
      {
        name: 'Compliance score by framework',
        description: 'Track compliance scores across frameworks over time',
        query: 'dataset="$DATASET"\n| timestats span=1d score=avg(compliance_score) by framework_name\n| order by framework_name, timestamp'
      },
      {
        name: 'Score by cloud account',
        description: 'Compare compliance scores across cloud accounts',
        query: 'dataset="$DATASET" earliest=-7d\n| summarize AvgScore=avg(compliance_score), TotalChecks=sum(total_checks), FailedChecks=sum(failed_checks) by cloud_account, framework_name\n| order by AvgScore asc'
      },
      {
        name: 'Failed checks trending',
        description: 'Track failing check counts to identify growing non-compliance',
        query: 'dataset="$DATASET" earliest=-30d\n| summarize DailyFailed=sum(failed_checks), DailyTotal=sum(total_checks) by framework_name, bin(timestamp, 1d)\n| extend FailPct = DailyFailed * 100.0 / DailyTotal\n| order by framework_name, timestamp'
      }
    ]
  },
  {
    id: 'obs-prisma-cspm-003',
    name: 'New Resource Discovery Rate',
    objective: 'Monitor the rate of new cloud resources being discovered and scanned to track cloud growth and ensure scanning coverage keeps pace with deployment.',
    category: 'Capacity',
    tags: ['observability', 'prisma-cloud', 'cspm', 'resource-discovery', 'growth'],
    requiredFields: ['timestamp', 'resource_id', 'resource_type', 'cloud_account', 'region', 'first_seen_time'],
    detectionLogic: 'Track new resource discovery rate per cloud account and type over daily windows. Alert when discovery rate exceeds 2x baseline or when scanning backlog grows indicating capacity issues.',
    falsePositives: ['Infrastructure-as-code deployments creating many resources simultaneously', 'Auto-scaling events creating temporary resources'],
    tuningGuidance: 'Set discovery rate baselines per account and resource type. Exclude ephemeral resources (Lambda, containers) from sustained growth calculations. Track net new (created minus deleted) for accurate growth.',
    operationalValue: 'Resource discovery rate indicates cloud growth velocity. Rapid growth without corresponding security coverage creates blind spots and increases risk exposure.',
    changeMgmtRelevance: 'Discovery rate spikes follow new project launches, infrastructure migrations, auto-scaling events, or IaC pipeline deployments creating resources in bulk.',
    troubleshootingWorkflow: '1. Identify which accounts show accelerated resource growth\n2. Determine resource types driving the growth\n3. Verify new resources are being scanned within expected timeframes\n4. Check if growth aligns with known project launches\n5. Assess scanning capacity against new resource volume\n6. Validate that policies cover new resource types',
    criblSearchQueries: [
      {
        name: 'New resource discovery rate',
        description: 'Track new resources discovered per day by account',
        query: 'dataset="$DATASET"\n| timestats span=1d new_resources=dcount(resource_id) by cloud_account\n| order by new_resources desc'
      },
      {
        name: 'Resource growth by type',
        description: 'Break down resource growth by type for capacity planning',
        query: 'dataset="$DATASET" earliest=-7d\n| summarize NewResources=dcount(resource_id) by resource_type, cloud_account, bin(timestamp, 1d)\n| order by NewResources desc'
      },
      {
        name: 'Discovery rate trending',
        description: 'Track resource discovery velocity over time',
        query: 'dataset="$DATASET" earliest=-30d\n| summarize DailyDiscovered=dcount(resource_id), UniqueTypes=dcount(resource_type) by cloud_account, bin(timestamp, 1d)\n| order by cloud_account, timestamp'
      }
    ]
  },
  {
    id: 'obs-prisma-cspm-004',
    name: 'Policy Violation Trending',
    objective: 'Track open policy violations by account and region trending to identify areas of growing non-compliance and prioritize remediation efforts.',
    category: 'Reliability',
    tags: ['observability', 'prisma-cloud', 'cspm', 'violations', 'trending'],
    requiredFields: ['timestamp', 'policy_name', 'severity', 'cloud_account', 'region', 'resource_type', 'status'],
    detectionLogic: 'Track open violation count per account/region over daily windows. Alert when violation count grows >20% week-over-week or when critical violations remain unresolved beyond SLA.',
    falsePositives: ['New policies being enabled that surface existing non-compliance', 'Framework updates creating new violation categories'],
    tuningGuidance: 'Set growth rate thresholds per account based on size. Distinguish between new violations from new policies vs new violations from new resources. Track net violations (opened minus resolved).',
    operationalValue: 'Growing violation counts indicate remediation is not keeping pace with new issues. Trending identifies accounts or regions needing focused attention.',
    changeMgmtRelevance: 'Violation trending changes follow new policy enablement, infrastructure deployments creating non-compliant resources, or remediation campaigns reducing counts.',
    troubleshootingWorkflow: '1. Identify accounts with fastest violation growth\n2. Determine which policies generate the most violations\n3. Check if growth is from new resources or policy changes\n4. Assess remediation team capacity vs violation intake\n5. Identify automation opportunities for common violations\n6. Prioritize by severity and business impact',
    criblSearchQueries: [
      {
        name: 'Open violations by account',
        description: 'Track open violation counts per cloud account over time',
        query: 'dataset="$DATASET" status="open"\n| timestats span=1d open_violations=count() by cloud_account, severity\n| order by open_violations desc'
      },
      {
        name: 'Violation growth by policy',
        description: 'Identify policies generating the most new violations',
        query: 'dataset="$DATASET" status="open" earliest=-7d\n| summarize ViolationCount=count(), AffectedResources=dcount(resource_type) by policy_name, severity, cloud_account\n| order by ViolationCount desc\n| limit 25'
      },
      {
        name: 'Regional violation distribution',
        description: 'Compare violation density across cloud regions',
        query: 'dataset="$DATASET" status="open" earliest=-24h\n| summarize Violations=count() by region, cloud_account, severity\n| order by Violations desc\n| limit 30'
      }
    ]
  },
  {
    id: 'obs-prisma-cspm-005',
    name: 'Drift Detection Rate',
    objective: 'Monitor configuration changes detected per account per day to identify environments with excessive drift from desired state.',
    category: 'Change Management',
    tags: ['observability', 'prisma-cloud', 'cspm', 'drift', 'configuration-change'],
    requiredFields: ['timestamp', 'resource_id', 'cloud_account', 'change_type', 'previous_config', 'current_config', 'changed_by'],
    detectionLogic: 'Track configuration drift events per account over daily windows. Alert when drift rate exceeds 2x baseline or when changes occur outside approved change windows indicating unauthorized modifications.',
    falsePositives: ['IaC pipeline deployments making many coordinated changes', 'Auto-scaling configuration updates in dynamic environments'],
    tuningGuidance: 'Define change windows per account and alert on out-of-window changes. Exclude IaC-managed resources from drift calculations (they should be in desired state). Track by change source for context.',
    operationalValue: 'Configuration drift creates security gaps and compliance violations. Detecting drift rate increases reveals environments losing configuration control.',
    changeMgmtRelevance: 'Drift rate directly measures configuration change velocity. Elevated drift outside change windows indicates unauthorized changes requiring investigation.',
    troubleshootingWorkflow: '1. Identify accounts with elevated drift rates\n2. Determine which resource types are changing most\n3. Check if changes are within approved change windows\n4. Identify who or what is making the changes\n5. Verify if changes align with approved change requests\n6. Assess whether IaC reconciliation is needed',
    criblSearchQueries: [
      {
        name: 'Drift events by account',
        description: 'Track configuration changes per account over time',
        query: 'dataset="$DATASET"\n| timestats span=1d drift_events=count() by cloud_account\n| order by drift_events desc'
      },
      {
        name: 'Changes by resource type',
        description: 'Break down drift events by resource type for pattern analysis',
        query: 'dataset="$DATASET" earliest=-7d\n| summarize ChangeCount=count(), UniqueResources=dcount(resource_id) by change_type, cloud_account, bin(timestamp, 1d)\n| order by ChangeCount desc'
      },
      {
        name: 'Out-of-window changes',
        description: 'Identify changes occurring outside approved maintenance windows',
        query: 'dataset="$DATASET" earliest=-24h\n| summarize Changes=count() by changed_by, cloud_account, change_type, bin(timestamp, 1h)\n| order by Changes desc\n| limit 30'
      }
    ]
  },
  {
    id: 'obs-prisma-cspm-006',
    name: 'Remediation Automation Rate',
    objective: 'Monitor the ratio of auto-remediated vs manually resolved alerts to assess automation effectiveness and identify expansion opportunities.',
    category: 'Health',
    tags: ['observability', 'prisma-cloud', 'cspm', 'remediation', 'automation'],
    requiredFields: ['timestamp', 'alert_id', 'remediation_method', 'policy_name', 'cloud_account', 'resolution_time_sec'],
    detectionLogic: 'Calculate auto-remediation vs manual resolution ratio over daily windows. Alert when automation rate drops below 60% or when specific policy types show decreasing automation success rates.',
    falsePositives: ['New policy types without automation playbooks requiring manual remediation', 'Complex multi-step remediations that cannot be fully automated'],
    tuningGuidance: 'Set automation targets per policy type. Track automation failure reasons to identify improvement opportunities. Exclude policies known to require human judgment from automation rate calculations.',
    operationalValue: 'Higher automation rates reduce human toil, improve consistency, and accelerate remediation. Monitoring the ratio identifies automation gaps and regression.',
    changeMgmtRelevance: 'Automation rate changes follow playbook updates, new policy enablement without corresponding automation, or infrastructure changes breaking existing automation.',
    troubleshootingWorkflow: '1. Identify policies with low automation rates\n2. Determine if automation playbooks exist for these policies\n3. Check automation failure logs for recurring errors\n4. Verify API permissions and connectivity for automation\n5. Assess which manual remediations could be automated\n6. Track automation success rate after playbook changes',
    criblSearchQueries: [
      {
        name: 'Automation rate by policy',
        description: 'Track auto-remediation vs manual resolution ratios',
        query: 'dataset="$DATASET"\n| summarize Total=count(), Automated=countif(remediation_method=="auto") by policy_name\n| extend AutoPct = Automated * 100.0 / Total\n| order by AutoPct asc'
      },
      {
        name: 'Automation trending',
        description: 'Track automation rate over time to detect regression',
        query: 'dataset="$DATASET" earliest=-30d\n| summarize Total=count(), Automated=countif(remediation_method=="auto") by bin(timestamp, 1d)\n| extend DailyAutoPct = Automated * 100.0 / Total\n| order by timestamp'
      },
      {
        name: 'Manual remediation backlog',
        description: 'Identify policy types requiring most manual effort',
        query: 'dataset="$DATASET" remediation_method="manual" earliest=-7d\n| summarize ManualCount=count(), AvgResolution=avg(resolution_time_sec) / 3600 by policy_name, cloud_account\n| order by ManualCount desc\n| limit 20'
      }
    ]
  },
  {
    id: 'obs-prisma-cspm-007',
    name: 'Coverage Gap Detection',
    objective: 'Identify cloud accounts and subscriptions not actively scanned by CSPM to ensure complete visibility across the cloud estate.',
    category: 'Availability',
    tags: ['observability', 'prisma-cloud', 'cspm', 'coverage', 'scanning'],
    requiredFields: ['timestamp', 'cloud_account', 'last_scan_time', 'scan_status', 'resource_count', 'account_status'],
    detectionLogic: 'Track last successful scan time per cloud account. Alert when any account has not been scanned within expected interval (e.g., 24 hours) or when known accounts are missing from scan results entirely.',
    falsePositives: ['Newly onboarded accounts in initial sync phase', 'Accounts in decommission process with intentionally suspended scanning'],
    tuningGuidance: 'Define expected scan frequency per account tier. Maintain a registry of all expected accounts for gap detection. Allow longer intervals for non-production accounts.',
    operationalValue: 'Unscanned accounts represent blind spots in security posture management. Coverage gaps mean violations exist undetected, creating risk exposure.',
    changeMgmtRelevance: 'Coverage gaps follow credential rotations breaking API access, account permission changes restricting scanning, or new accounts not yet onboarded to CSPM.',
    troubleshootingWorkflow: '1. Identify accounts with stale or missing scan data\n2. Verify account credentials and API connectivity\n3. Check for permission changes restricting scanner access\n4. Determine if account is new and needs onboarding\n5. Review scanner capacity and queue depth\n6. Verify network connectivity to cloud provider APIs',
    criblSearchQueries: [
      {
        name: 'Account scan recency',
        description: 'Track last scan time per account to identify stale coverage',
        query: 'dataset="$DATASET"\n| summarize LastScan=max(timestamp), ResourceCount=sum(resource_count) by cloud_account, scan_status\n| extend hours_since_scan = (now() - LastScan) / 3600\n| order by hours_since_scan desc'
      },
      {
        name: 'Scan success rate by account',
        description: 'Track scan success/failure rates to detect connectivity issues',
        query: 'dataset="$DATASET" earliest=-7d\n| summarize Total=count(), Successful=countif(scan_status=="success") by cloud_account, bin(timestamp, 1d)\n| extend SuccessPct = Successful * 100.0 / Total\n| order by SuccessPct asc'
      },
      {
        name: 'Coverage health trending',
        description: 'Track overall scanning coverage health over time',
        query: 'dataset="$DATASET" earliest=-30d\n| summarize AccountsScanned=dcount(cloud_account), TotalResources=sum(resource_count) by scan_status, bin(timestamp, 1d)\n| order by timestamp'
      }
    ]
  }
],
  'prisma-cloud-cwp': [
  {
    id: 'obs-prisma-cwp-001',
    name: 'Defender Coverage Gap',
    objective: 'Identify unprotected hosts and containers in the fleet that are missing Defender agents to ensure complete runtime security coverage.',
    category: 'Availability',
    tags: ['observability', 'prisma-cloud', 'cwp', 'defender', 'coverage'],
    requiredFields: ['timestamp', 'host_name', 'defender_status', 'cluster_name', 'namespace', 'container_count', 'last_heartbeat'],
    detectionLogic: 'Compare known fleet inventory against Defender deployment status. Alert when hosts or namespaces have unprotected containers exceeding 5% of fleet or when Defender heartbeats go stale (>30 minutes).',
    falsePositives: ['Newly deployed hosts in provisioning phase before Defender installation', 'Ephemeral CI/CD containers with intentionally short lifespans'],
    tuningGuidance: 'Define expected coverage percentage by cluster and namespace. Exclude ephemeral workloads from gap calculations. Set heartbeat staleness thresholds based on environment type.',
    operationalValue: 'Unprotected workloads cannot detect runtime threats or enforce security policies. Coverage gaps represent blind spots in the security perimeter.',
    changeMgmtRelevance: 'Coverage gaps follow new cluster deployments, DaemonSet configuration changes, namespace additions, or Defender upgrade failures on specific nodes.',
    troubleshootingWorkflow: '1. Identify hosts/namespaces with missing Defender coverage\n2. Verify Defender DaemonSet status on affected clusters\n3. Check for node affinity or toleration issues preventing deployment\n4. Verify Defender image is available in cluster registry\n5. Review resource constraints that may prevent Defender scheduling\n6. Confirm Defender is communicating with console after deployment',
    criblSearchQueries: [
      {
        name: 'Defender status by cluster',
        description: 'Track Defender deployment coverage per cluster',
        query: 'dataset="$DATASET"\n| summarize TotalHosts=dcount(host_name), Protected=dcountif(host_name, defender_status=="active") by cluster_name\n| extend CoveragePct = Protected * 100.0 / TotalHosts\n| order by CoveragePct asc'
      },
      {
        name: 'Stale Defender heartbeats',
        description: 'Identify Defenders that have stopped reporting',
        query: 'dataset="$DATASET"\n| summarize LastHeartbeat=max(timestamp) by host_name, cluster_name, defender_status\n| extend hours_stale = (now() - LastHeartbeat) / 3600\n| where hours_stale > 0.5\n| order by hours_stale desc\n| limit 25'
      },
      {
        name: 'Coverage trending',
        description: 'Track protection coverage percentage over time',
        query: 'dataset="$DATASET" earliest=-7d\n| summarize TotalHosts=dcount(host_name), ActiveDefenders=dcountif(host_name, defender_status=="active") by bin(timestamp, 1d)\n| extend CoveragePct = ActiveDefenders * 100.0 / TotalHosts\n| order by timestamp'
      }
    ]
  },
  {
    id: 'obs-prisma-cwp-002',
    name: 'Vulnerability Age Trending',
    objective: 'Track the mean age of unpatched critical CVEs across the fleet to measure vulnerability management effectiveness and SLA compliance.',
    category: 'Health',
    tags: ['observability', 'prisma-cloud', 'cwp', 'vulnerabilities', 'patching'],
    requiredFields: ['timestamp', 'cve_id', 'severity', 'first_detected', 'image_name', 'host_name', 'fix_available', 'package_name'],
    detectionLogic: 'Calculate mean age of unpatched critical and high CVEs per image/host. Alert when mean age exceeds SLA thresholds (Critical: 7 days, High: 30 days) or when age is trending upward week-over-week.',
    falsePositives: ['CVEs without available patches that cannot be remediated', 'Accepted-risk vulnerabilities with documented exceptions'],
    tuningGuidance: 'Set age thresholds by severity and environment (production vs dev). Exclude CVEs without fixes from age calculations. Track separately by image vs host vulnerabilities.',
    operationalValue: 'Vulnerability age is a key security metric. Growing mean age indicates patching processes are failing to keep pace with discovery, increasing exploitation risk.',
    changeMgmtRelevance: 'Vulnerability age changes follow patching campaigns, new CVE disclosures adding old detections, base image updates, or pipeline changes affecting build freshness.',
    troubleshootingWorkflow: '1. Identify images/hosts with oldest unpatched CVEs\n2. Determine if fixes are available for aged vulnerabilities\n3. Check if patching pipelines are functioning correctly\n4. Verify base images are being updated in registries\n5. Assess whether runtime mitigation can reduce risk\n6. Prioritize based on exploitability and exposure',
    criblSearchQueries: [
      {
        name: 'Mean vulnerability age by severity',
        description: 'Track average age of unpatched CVEs by severity level',
        query: 'dataset="$DATASET" fix_available="true"\n| extend age_days = (now() - first_detected) / 86400\n| summarize AvgAge=avg(age_days), MaxAge=max(age_days), CVECount=dcount(cve_id) by severity\n| order by AvgAge desc'
      },
      {
        name: 'Oldest unpatched vulnerabilities',
        description: 'Identify the longest-standing unpatched CVEs for prioritization',
        query: 'dataset="$DATASET" severity in ("critical", "high") fix_available="true" earliest=-24h\n| extend age_days = (now() - first_detected) / 86400\n| summarize Age=max(age_days), AffectedImages=dcount(image_name) by cve_id, severity, package_name\n| order by Age desc\n| limit 25'
      },
      {
        name: 'Vulnerability age trending',
        description: 'Track mean vulnerability age over time to measure remediation progress',
        query: 'dataset="$DATASET" severity in ("critical", "high") earliest=-30d\n| extend age_days = (now() - first_detected) / 86400\n| summarize AvgAge=avg(age_days), TotalCVEs=dcount(cve_id) by severity, bin(timestamp, 1d)\n| order by severity, timestamp'
      }
    ]
  },
  {
    id: 'obs-prisma-cwp-003',
    name: 'Container Image Compliance',
    objective: 'Monitor container image pass/fail rates by registry to ensure only compliant images are deployed to production environments.',
    category: 'Change Management',
    tags: ['observability', 'prisma-cloud', 'cwp', 'image-compliance', 'registry'],
    requiredFields: ['timestamp', 'image_name', 'registry', 'compliance_status', 'violation_count', 'scan_time', 'cluster_name'],
    detectionLogic: 'Track image compliance pass/fail rates by registry over daily windows. Alert when failure rate exceeds 20% or when previously compliant images fail after re-scan indicating new violations.',
    falsePositives: ['Images in development registries expected to have compliance issues', 'Newly added compliance rules surfacing existing non-compliance'],
    tuningGuidance: 'Set compliance thresholds per registry tier (production stricter than dev). Exclude development registries from alerting. Track compliance by vulnerability severity for prioritization.',
    operationalValue: 'Image compliance gates ensure only vetted images reach production. Monitoring fail rates identifies pipeline issues and policy gaps before they impact deployments.',
    changeMgmtRelevance: 'Compliance rate changes follow new compliance rule additions, base image updates introducing vulnerabilities, or registry policy modifications.',
    troubleshootingWorkflow: '1. Identify registries with elevated failure rates\n2. Determine which compliance checks are failing\n3. Check if failures are from new rules or new vulnerabilities\n4. Verify base images are being updated with patches\n5. Review CI/CD pipeline compliance gate configurations\n6. Coordinate with dev teams on image remediation',
    criblSearchQueries: [
      {
        name: 'Compliance rate by registry',
        description: 'Track image pass/fail rates per registry',
        query: 'dataset="$DATASET"\n| summarize Total=count(), Passed=countif(compliance_status=="pass") by registry\n| extend PassRate = Passed * 100.0 / Total\n| order by PassRate asc'
      },
      {
        name: 'Failed images detail',
        description: 'Identify non-compliant images with violation details',
        query: 'dataset="$DATASET" compliance_status="fail" earliest=-24h\n| summarize Violations=sum(violation_count), LastScan=max(scan_time) by image_name, registry, cluster_name\n| order by Violations desc\n| limit 25'
      },
      {
        name: 'Compliance trending by registry',
        description: 'Track compliance rates over time to detect degradation',
        query: 'dataset="$DATASET" earliest=-14d\n| summarize Total=count(), Passed=countif(compliance_status=="pass") by registry, bin(timestamp, 1d)\n| extend PassRate = Passed * 100.0 / Total\n| order by registry, timestamp'
      }
    ]
  },
  {
    id: 'obs-prisma-cwp-004',
    name: 'Runtime Alert Volume',
    objective: 'Monitor runtime alert count trending per cluster and namespace to detect alert storms and identify noisy environments requiring tuning.',
    category: 'Capacity',
    tags: ['observability', 'prisma-cloud', 'cwp', 'runtime-alerts', 'volume'],
    requiredFields: ['timestamp', 'alert_type', 'severity', 'cluster_name', 'namespace', 'container_name', 'rule_name'],
    detectionLogic: 'Track runtime alert volume per cluster/namespace over 1-hour windows. Alert when volume exceeds 3x baseline or when single namespaces generate disproportionate alert counts indicating misconfiguration.',
    falsePositives: ['New application deployments triggering runtime learning phase alerts', 'Load testing activities generating expected alert volume'],
    tuningGuidance: 'Set per-namespace alert baselines. Identify noisy rules for tuning or exception creation. Exclude known testing namespaces from production alerting.',
    operationalValue: 'Alert volume storms cause fatigue and hide real threats in noise. Monitoring volume identifies environments needing tuning and validates rule effectiveness.',
    changeMgmtRelevance: 'Alert volume changes follow new application deployments, runtime rule modifications, container updates changing behavior profiles, or policy enforcement changes.',
    troubleshootingWorkflow: '1. Identify clusters/namespaces with elevated alert volumes\n2. Determine which rules generate the most alerts\n3. Check if new deployments triggered learning phase alerts\n4. Assess if alerts represent real threats or noise\n5. Review runtime models for over-sensitive configurations\n6. Tune rules or create exceptions for validated behavior',
    criblSearchQueries: [
      {
        name: 'Alert volume by cluster',
        description: 'Track runtime alert counts per cluster over time',
        query: 'dataset="$DATASET"\n| timestats span=1h alerts=count() by cluster_name, severity\n| order by alerts desc'
      },
      {
        name: 'Top alerting namespaces',
        description: 'Identify namespaces generating the most runtime alerts',
        query: 'dataset="$DATASET" earliest=-24h\n| summarize AlertCount=count(), UniqueContainers=dcount(container_name) by namespace, cluster_name, rule_name\n| order by AlertCount desc\n| limit 25'
      },
      {
        name: 'Alert volume trending',
        description: 'Track overall runtime alert volume for trend analysis',
        query: 'dataset="$DATASET" earliest=-7d\n| summarize DailyAlerts=count() by cluster_name, severity, bin(timestamp, 1d)\n| order by cluster_name, severity, timestamp'
      }
    ]
  },
  {
    id: 'obs-prisma-cwp-005',
    name: 'Scan Duration Trending',
    objective: 'Monitor image scan time by size and complexity to detect scanning infrastructure performance degradation or capacity issues.',
    category: 'Performance',
    tags: ['observability', 'prisma-cloud', 'cwp', 'scan-duration', 'performance'],
    requiredFields: ['timestamp', 'image_name', 'scan_duration_sec', 'image_size_mb', 'layer_count', 'package_count', 'registry'],
    detectionLogic: 'Track scan duration percentiles by image size tier over 4-hour windows. Alert when p95 scan duration exceeds SLA (e.g., >5 minutes for standard images) or when duration is trending upward indicating capacity degradation.',
    falsePositives: ['Unusually large images legitimately requiring longer scan times', 'Scanner infrastructure maintenance causing temporary slowdowns'],
    tuningGuidance: 'Set scan duration thresholds by image size tier (small <500MB, medium <2GB, large >2GB). Track by registry for infrastructure-specific issues. Exclude known large images from baseline calculations.',
    operationalValue: 'Scan duration impacts CI/CD pipeline velocity. Slow scans delay deployments and indicate scanner capacity issues that will worsen with fleet growth.',
    changeMgmtRelevance: 'Scan duration changes follow scanner infrastructure scaling, vulnerability database growth, new scanning capabilities being enabled, or fleet size increases.',
    troubleshootingWorkflow: '1. Identify which images show increased scan duration\n2. Check scanner infrastructure resource utilization\n3. Determine if vulnerability database size has grown significantly\n4. Verify network connectivity between scanners and registries\n5. Assess whether scanner capacity needs to be increased\n6. Review if new scanning features are adding overhead',
    criblSearchQueries: [
      {
        name: 'Scan duration by image size',
        description: 'Correlate scan duration with image size to detect performance issues',
        query: 'dataset="$DATASET" scan_duration_sec > 0\n| summarize AvgDuration=avg(scan_duration_sec), P95Duration=max(scan_duration_sec), Scans=count() by registry\n| order by P95Duration desc'
      },
      {
        name: 'Slowest scans',
        description: 'Identify images with longest scan times for investigation',
        query: 'dataset="$DATASET" earliest=-24h\n| summarize MaxDuration=max(scan_duration_sec), AvgDuration=avg(scan_duration_sec), ImageSize=avg(image_size_mb) by image_name, registry\n| order by MaxDuration desc\n| limit 20'
      },
      {
        name: 'Scan duration trending',
        description: 'Track scan performance over time to detect degradation',
        query: 'dataset="$DATASET" earliest=-14d\n| summarize AvgScan=avg(scan_duration_sec), P95Scan=max(scan_duration_sec), ScanCount=count() by registry, bin(timestamp, 1d)\n| order by registry, timestamp'
      }
    ]
  },
  {
    id: 'obs-prisma-cwp-006',
    name: 'False Positive Rate',
    objective: 'Track the percentage of runtime alerts resolved as false positives to measure detection accuracy and identify rules requiring tuning.',
    category: 'Reliability',
    tags: ['observability', 'prisma-cloud', 'cwp', 'false-positive', 'detection-accuracy'],
    requiredFields: ['timestamp', 'alert_id', 'rule_name', 'resolution', 'cluster_name', 'namespace', 'severity'],
    detectionLogic: 'Calculate false positive rate per rule over weekly windows. Alert when overall FP rate exceeds 30% or when specific rules consistently exceed 50% false positive resolution.',
    falsePositives: ['New rules in learning phase generating expected initial false positives', 'Environment-specific behaviors triggering generic rules during onboarding'],
    tuningGuidance: 'Track FP rate per rule and cluster combination. Identify rules with highest FP rates for exception creation. Set acceptable FP rate targets by rule category.',
    operationalValue: 'High false positive rates waste analyst time and create alert fatigue. Monitoring FP rates identifies tuning priorities and validates detection investment.',
    changeMgmtRelevance: 'FP rate changes follow rule updates, new application deployments changing behavior profiles, or model retraining after environment modifications.',
    troubleshootingWorkflow: '1. Identify rules with highest false positive rates\n2. Determine which clusters/namespaces drive the FP rate\n3. Analyze common characteristics of false positive alerts\n4. Create targeted exceptions for validated behavior\n5. Verify exceptions do not suppress real threats\n6. Track FP rate improvement after tuning',
    criblSearchQueries: [
      {
        name: 'False positive rate by rule',
        description: 'Calculate FP percentage per detection rule',
        query: 'dataset="$DATASET" resolution!=""\n| summarize Total=count(), FalsePositives=countif(resolution=="false_positive") by rule_name\n| extend FPRate = FalsePositives * 100.0 / Total\n| order by FPRate desc'
      },
      {
        name: 'FP rate trending',
        description: 'Track false positive rate over time to measure tuning effectiveness',
        query: 'dataset="$DATASET" resolution!="" earliest=-30d\n| summarize Total=count(), FPs=countif(resolution=="false_positive") by bin(timestamp, 1d)\n| extend DailyFPRate = FPs * 100.0 / Total\n| order by timestamp'
      },
      {
        name: 'FP rate by cluster',
        description: 'Compare false positive rates across clusters for targeted tuning',
        query: 'dataset="$DATASET" resolution!="" earliest=-7d\n| summarize Total=count(), FPs=countif(resolution=="false_positive") by cluster_name, namespace, rule_name\n| extend FPRate = FPs * 100.0 / Total\n| where Total > 5\n| order by FPRate desc\n| limit 25'
      }
    ]
  },
  {
    id: 'obs-prisma-cwp-007',
    name: 'WAAS Block Rate',
    objective: 'Monitor web application attacks blocked per application over time to track threat targeting patterns and validate WAAS effectiveness.',
    category: 'Health',
    tags: ['observability', 'prisma-cloud', 'cwp', 'waas', 'web-attacks'],
    requiredFields: ['timestamp', 'application_name', 'attack_type', 'action', 'source_ip', 'severity', 'request_path'],
    detectionLogic: 'Track WAAS block events per application over 1-hour windows. Alert when block rate exceeds 3x baseline or when new attack types appear targeting specific applications.',
    falsePositives: ['Automated vulnerability scanners triggering legitimate blocks', 'Penetration testing activities generating expected block volume'],
    tuningGuidance: 'Set per-application block rate baselines. Exclude known scanner IPs from volume calculations. Track by attack type for targeted policy tuning.',
    operationalValue: 'WAAS block rate indicates threat targeting intensity and protection effectiveness. Volume changes reveal new attack campaigns or protection gaps.',
    changeMgmtRelevance: 'Block rate changes follow WAAS rule updates, application deployments exposing new attack surface, or threat actor campaign shifts targeting different applications.',
    troubleshootingWorkflow: '1. Identify applications with elevated block rates\n2. Determine the predominant attack types\n3. Check if blocks are from legitimate users or attackers\n4. Verify WAAS rules are not over-blocking legitimate traffic\n5. Assess if new attack patterns require rule updates\n6. Review source IP patterns for campaign identification',
    criblSearchQueries: [
      {
        name: 'Block rate by application',
        description: 'Track WAAS blocks per application over time',
        query: 'dataset="$DATASET" action="block"\n| timestats span=1h blocks=count() by application_name, attack_type\n| order by blocks desc'
      },
      {
        name: 'Attack type distribution',
        description: 'Break down blocked attacks by type for threat analysis',
        query: 'dataset="$DATASET" action="block" earliest=-24h\n| summarize BlockCount=count(), UniqueIPs=dcount(source_ip) by attack_type, application_name, severity\n| order by BlockCount desc\n| limit 25'
      },
      {
        name: 'Block rate trending',
        description: 'Track block volume trends to detect campaign shifts',
        query: 'dataset="$DATASET" action="block" earliest=-7d\n| summarize DailyBlocks=count(), UniqueAttackers=dcount(source_ip) by application_name, bin(timestamp, 1d)\n| order by application_name, timestamp'
      }
    ]
  }
],
  'trellix-hx': [
  {
    id: 'obs-trellix-hx-001',
    name: 'Agent Health Coverage',
    objective: 'Monitor endpoints not checking in within the expected window to detect agent connectivity issues and coverage gaps across the fleet.',
    category: 'Availability',
    tags: ['observability', 'trellix', 'hx', 'agent-health', 'coverage'],
    requiredFields: ['timestamp', 'host_name', 'agent_id', 'last_checkin', 'agent_status', 'os_type', 'agent_version'],
    detectionLogic: 'Track agent check-in recency per endpoint. Alert when agents miss two consecutive check-in windows (>2 hours) or when total fleet coverage drops below 95% of expected endpoints.',
    falsePositives: ['Endpoints powered off during non-business hours', 'Devices in maintenance mode or reimaging process'],
    tuningGuidance: 'Set check-in frequency expectations based on agent configuration (typically 15-60 minutes). Account for off-hours powered-off devices. Track by OS type as mobile devices have different patterns.',
    operationalValue: 'Agents not checking in cannot receive IOC updates, report detections, or be contained during incidents. Coverage gaps leave endpoints vulnerable and invisible.',
    changeMgmtRelevance: 'Check-in failures follow network changes blocking agent communication, proxy configuration updates, certificate rotations, or firewall rule modifications.',
    troubleshootingWorkflow: '1. Identify endpoints with stale check-in times\n2. Verify network connectivity to HX controller\n3. Check for proxy or firewall changes blocking communication\n4. Verify agent service status on affected endpoints\n5. Check if endpoints are powered on and accessible\n6. Review controller capacity and connection limits',
    criblSearchQueries: [
      {
        name: 'Agent check-in recency',
        description: 'Identify agents with stale check-in timestamps',
        query: 'dataset="$DATASET"\n| summarize LastCheckin=max(timestamp) by host_name, agent_id, agent_status\n| extend hours_stale = (now() - LastCheckin) / 3600\n| where hours_stale > 2\n| order by hours_stale desc\n| limit 30'
      },
      {
        name: 'Fleet coverage summary',
        description: 'Track overall fleet health and active vs inactive agents',
        query: 'dataset="$DATASET" earliest=-24h\n| summarize TotalAgents=dcount(agent_id), ActiveAgents=dcountif(agent_id, agent_status=="active") by os_type\n| extend CoveragePct = ActiveAgents * 100.0 / TotalAgents\n| order by CoveragePct asc'
      },
      {
        name: 'Check-in trending',
        description: 'Track active agent count over time to detect coverage degradation',
        query: 'dataset="$DATASET" earliest=-7d\n| summarize ActiveAgents=dcount(agent_id) by agent_status, bin(timestamp, 4h)\n| order by timestamp'
      }
    ]
  },
  {
    id: 'obs-trellix-hx-002',
    name: 'Alert Resolution Time',
    objective: 'Monitor time from alert creation to resolution by severity to measure SOC efficiency and identify bottlenecks in the triage workflow.',
    category: 'Performance',
    tags: ['observability', 'trellix', 'hx', 'resolution-time', 'soc-performance'],
    requiredFields: ['timestamp', 'alert_id', 'severity', 'created_time', 'resolved_time', 'resolution_status', 'analyst', 'host_name'],
    detectionLogic: 'Calculate time to resolution per alert severity over daily windows. Alert when MTTR exceeds SLA thresholds (Critical: 1h, High: 4h, Medium: 24h) or when resolution time trends upward over 7-day windows.',
    falsePositives: ['Complex investigations requiring extended analysis time', 'Alerts awaiting third-party vendor response for resolution'],
    tuningGuidance: 'Set MTTR thresholds per severity and alert type. Track by analyst for workload balancing. Exclude alerts in "waiting for external" status from SLA calculations.',
    operationalValue: 'MTTR directly measures SOC responsiveness. Growing resolution times indicate capacity issues, skill gaps, or process inefficiencies requiring intervention.',
    changeMgmtRelevance: 'Resolution time changes follow SOC staffing changes, new playbook deployments, tool modifications affecting workflow, or shifts in alert volume overwhelming capacity.',
    troubleshootingWorkflow: '1. Identify severity levels breaching SLA thresholds\n2. Determine if delays are in triage, investigation, or remediation phases\n3. Check analyst workload distribution for imbalances\n4. Verify automation and playbook tools are functioning\n5. Assess whether training gaps affect resolution speed\n6. Review escalation paths for stuck alerts',
    criblSearchQueries: [
      {
        name: 'MTTR by severity',
        description: 'Calculate mean time to resolution by alert severity',
        query: 'dataset="$DATASET" resolved_time > 0\n| extend resolution_minutes = (resolved_time - created_time) / 60\n| summarize AvgMTTR=avg(resolution_minutes), P95MTTR=max(resolution_minutes), AlertCount=count() by severity\n| order by AvgMTTR desc'
      },
      {
        name: 'Resolution trending',
        description: 'Track MTTR over time to detect performance degradation',
        query: 'dataset="$DATASET" resolved_time > 0 earliest=-14d\n| extend resolution_minutes = (resolved_time - created_time) / 60\n| summarize AvgMTTR=avg(resolution_minutes), AlertCount=count() by severity, bin(timestamp, 1d)\n| order by severity, timestamp'
      },
      {
        name: 'Aged open alerts',
        description: 'Identify alerts exceeding SLA awaiting resolution',
        query: 'dataset="$DATASET" resolution_status="open"\n| extend age_minutes = (now() - created_time) / 60\n| summarize AlertCount=count(), MaxAge=max(age_minutes) by severity, host_name\n| where (severity=="critical" and MaxAge > 60) or (severity=="high" and MaxAge > 240)\n| order by MaxAge desc\n| limit 20'
      }
    ]
  },
  {
    id: 'obs-trellix-hx-003',
    name: 'IOC Feed Update Latency',
    objective: 'Monitor the time between threat intelligence feed updates and indicator deployment to endpoints to ensure timely protection coverage.',
    category: 'Health',
    tags: ['observability', 'trellix', 'hx', 'ioc-feed', 'update-latency', 'threat-intel'],
    requiredFields: ['timestamp', 'feed_name', 'feed_update_time', 'deployment_time', 'indicator_count', 'deployment_status', 'agent_count_updated'],
    detectionLogic: 'Track the delta between feed update availability and endpoint deployment completion. Alert when deployment latency exceeds 4 hours or when deployment success rate drops below 90%.',
    falsePositives: ['Large IOC feed updates requiring extended deployment time', 'Scheduled maintenance windows delaying non-critical deployments'],
    tuningGuidance: 'Set deployment latency thresholds by feed criticality. Allow longer windows for large indicator sets. Track deployment success rate separately from latency.',
    operationalValue: 'IOC deployment latency represents the window of exposure between threat discovery and protection. Minimizing this gap reduces risk from known threats.',
    changeMgmtRelevance: 'Deployment latency changes follow infrastructure scaling issues, network bandwidth constraints, agent communication problems, or feed format changes requiring processing updates.',
    troubleshootingWorkflow: '1. Identify which feeds show elevated deployment latency\n2. Check feed processing pipeline for bottlenecks\n3. Verify controller-to-agent communication is healthy\n4. Assess whether indicator volume exceeds processing capacity\n5. Review deployment queue depth and priority settings\n6. Verify agents are accepting and applying updates',
    criblSearchQueries: [
      {
        name: 'Feed deployment latency',
        description: 'Track time from feed update to endpoint deployment',
        query: 'dataset="$DATASET" deployment_time > 0\n| extend latency_minutes = (deployment_time - feed_update_time) / 60\n| summarize AvgLatency=avg(latency_minutes), MaxLatency=max(latency_minutes) by feed_name\n| order by AvgLatency desc'
      },
      {
        name: 'Deployment success rate',
        description: 'Track indicator deployment success rate across the fleet',
        query: 'dataset="$DATASET" earliest=-7d\n| summarize Total=count(), Successful=countif(deployment_status=="success"), AgentsUpdated=sum(agent_count_updated) by feed_name, bin(timestamp, 1d)\n| extend SuccessRate = Successful * 100.0 / Total\n| order by feed_name, timestamp'
      },
      {
        name: 'Feed update frequency',
        description: 'Monitor feed update cadence to detect stale threat intelligence',
        query: 'dataset="$DATASET" earliest=-14d\n| summarize Updates=count(), TotalIndicators=sum(indicator_count) by feed_name, bin(timestamp, 1d)\n| order by feed_name, timestamp'
      }
    ]
  },
  {
    id: 'obs-trellix-hx-004',
    name: 'Containment Action Frequency',
    objective: 'Monitor automated containment trigger rate trending to detect escalating threat activity or overly aggressive automation requiring review.',
    category: 'Reliability',
    tags: ['observability', 'trellix', 'hx', 'containment', 'automation', 'response'],
    requiredFields: ['timestamp', 'host_name', 'containment_action', 'trigger_rule', 'triggered_by', 'severity', 'release_time'],
    detectionLogic: 'Track containment action frequency over 4-hour windows. Alert when containment rate exceeds 2x baseline or when a single rule triggers containment on multiple endpoints within a short window indicating potential automation issue.',
    falsePositives: ['Incident response exercises triggering planned containments', 'Legitimate threat outbreak requiring multiple endpoint containments'],
    tuningGuidance: 'Set containment rate baselines by trigger rule. Define maximum auto-containment limits per time window. Require human approval above threshold to prevent automation cascades.',
    operationalValue: 'Containment frequency indicates active threat response activity. Abnormal spikes may indicate widespread compromise or over-sensitive automation requiring review.',
    changeMgmtRelevance: 'Containment rate changes follow new automation rule deployments, detection threshold modifications, or active threat campaigns targeting the organization.',
    troubleshootingWorkflow: '1. Identify which rules trigger the most containments\n2. Determine if containments are from real threats or automation issues\n3. Check if multiple unrelated endpoints are being contained\n4. Verify containment release procedures are functioning\n5. Review automation thresholds for appropriateness\n6. Assess impact on business operations from contained endpoints',
    criblSearchQueries: [
      {
        name: 'Containment actions over time',
        description: 'Track containment frequency to detect escalating activity',
        query: 'dataset="$DATASET"\n| timestats span=4h containments=count() by containment_action, triggered_by\n| order by containments desc'
      },
      {
        name: 'Top triggering rules',
        description: 'Identify rules causing the most containment actions',
        query: 'dataset="$DATASET" earliest=-7d\n| summarize Containments=count(), UniqueHosts=dcount(host_name) by trigger_rule, severity\n| order by Containments desc\n| limit 15'
      },
      {
        name: 'Containment duration analysis',
        description: 'Track how long endpoints remain contained',
        query: 'dataset="$DATASET" release_time > 0 earliest=-14d\n| extend containment_hours = (release_time - timestamp) / 3600\n| summarize AvgDuration=avg(containment_hours), MaxDuration=max(containment_hours), Actions=count() by trigger_rule\n| order by AvgDuration desc'
      }
    ]
  },
  {
    id: 'obs-trellix-hx-005',
    name: 'Triage Collection Success Rate',
    objective: 'Monitor the percentage of successful evidence acquisition attempts to ensure forensic collection reliability during investigations.',
    category: 'Health',
    tags: ['observability', 'trellix', 'hx', 'triage', 'collection', 'forensics'],
    requiredFields: ['timestamp', 'host_name', 'collection_type', 'collection_status', 'file_count', 'collection_size_mb', 'duration_sec'],
    detectionLogic: 'Calculate triage collection success rate over daily windows. Alert when success rate drops below 85% or when specific collection types show consistent failures indicating infrastructure issues.',
    falsePositives: ['Endpoints powered off during collection attempts', 'Network timeout for remote endpoints on slow connections'],
    tuningGuidance: 'Set success rate thresholds per collection type. Account for endpoint availability in calculations. Track failure reasons to differentiate infrastructure vs endpoint issues.',
    operationalValue: 'Failed evidence collections delay investigations and may result in evidence loss. High success rates ensure forensic readiness when incidents occur.',
    changeMgmtRelevance: 'Collection success changes follow agent updates affecting acquisition capabilities, network changes impacting data transfer, or storage capacity issues at the controller.',
    troubleshootingWorkflow: '1. Identify which collection types show high failure rates\n2. Categorize failure reasons (connectivity, permissions, storage)\n3. Check agent status on endpoints with failed collections\n4. Verify controller storage capacity for incoming collections\n5. Review network bandwidth between endpoints and controller\n6. Test collection capability on representative endpoints',
    criblSearchQueries: [
      {
        name: 'Collection success rate',
        description: 'Track triage collection success rates by type',
        query: 'dataset="$DATASET"\n| summarize Total=count(), Successful=countif(collection_status=="success") by collection_type\n| extend SuccessRate = Successful * 100.0 / Total\n| order by SuccessRate asc'
      },
      {
        name: 'Failed collections detail',
        description: 'Identify endpoints with collection failures for investigation',
        query: 'dataset="$DATASET" collection_status="failed" earliest=-7d\n| summarize Failures=count(), LastAttempt=max(timestamp) by host_name, collection_type, collection_status\n| order by Failures desc\n| limit 25'
      },
      {
        name: 'Collection performance trending',
        description: 'Track collection success rate and performance over time',
        query: 'dataset="$DATASET" earliest=-14d\n| summarize Total=count(), Successful=countif(collection_status=="success"), AvgSize=avg(collection_size_mb), AvgDuration=avg(duration_sec) by collection_type, bin(timestamp, 1d)\n| extend SuccessRate = Successful * 100.0 / Total\n| order by collection_type, timestamp'
      }
    ]
  },
  {
    id: 'obs-trellix-hx-006',
    name: 'False Positive Rate',
    objective: 'Track the percentage of alerts dismissed as false positives to measure detection accuracy and identify rules requiring tuning.',
    category: 'Reliability',
    tags: ['observability', 'trellix', 'hx', 'false-positive', 'detection-accuracy'],
    requiredFields: ['timestamp', 'alert_id', 'rule_name', 'resolution', 'severity', 'host_name', 'alert_type'],
    detectionLogic: 'Calculate false positive rate per rule and alert type over weekly windows. Alert when overall FP rate exceeds 35% or when specific rules consistently generate >50% false positives.',
    falsePositives: ['New rules in initial deployment phase with expected higher FP rates', 'Environmental behaviors triggering generic rules requiring baselining'],
    tuningGuidance: 'Track FP rate per rule and host group. Identify rules with highest FP rates for exception creation. Set acceptable FP targets by rule category and severity.',
    operationalValue: 'High false positive rates create alert fatigue, waste analyst time, and reduce trust in detection capability. Monitoring enables targeted tuning to improve signal quality.',
    changeMgmtRelevance: 'FP rate changes follow rule updates, IOC feed changes adding noisy indicators, environmental changes creating new benign behaviors, or analysis methodology improvements.',
    troubleshootingWorkflow: '1. Identify rules with highest false positive rates\n2. Determine common characteristics of FP alerts\n3. Assess if exclusions can be safely applied\n4. Verify exclusions do not suppress real threats\n5. Track FP rate improvement after tuning\n6. Review with threat intel team for indicator quality issues',
    criblSearchQueries: [
      {
        name: 'FP rate by rule',
        description: 'Calculate false positive percentage per detection rule',
        query: 'dataset="$DATASET" resolution!=""\n| summarize Total=count(), FPs=countif(resolution=="false_positive") by rule_name, alert_type\n| extend FPRate = FPs * 100.0 / Total\n| where Total > 5\n| order by FPRate desc'
      },
      {
        name: 'FP rate trending',
        description: 'Track false positive rate over time to measure tuning progress',
        query: 'dataset="$DATASET" resolution!="" earliest=-30d\n| summarize Total=count(), FPs=countif(resolution=="false_positive") by bin(timestamp, 1d)\n| extend DailyFPRate = FPs * 100.0 / Total\n| order by timestamp'
      },
      {
        name: 'Resolution distribution by severity',
        description: 'Compare resolution outcomes across severity levels',
        query: 'dataset="$DATASET" resolution!="" earliest=-7d\n| summarize Count=count() by resolution, severity, alert_type\n| order by severity, resolution'
      }
    ]
  },
  {
    id: 'obs-trellix-hx-007',
    name: 'Agent Version Compliance',
    objective: 'Monitor agents on current vs outdated versions to ensure fleet compliance with minimum version requirements and track upgrade rollout progress.',
    category: 'Change Management',
    tags: ['observability', 'trellix', 'hx', 'agent-version', 'compliance', 'upgrade'],
    requiredFields: ['timestamp', 'host_name', 'agent_id', 'agent_version', 'os_type', 'last_checkin'],
    detectionLogic: 'Track agent version distribution across the fleet daily. Alert when non-compliant versions (older than N-2 releases) exceed 10% of fleet or when upgrade rollout stalls below target adoption rates.',
    falsePositives: ['Endpoints in test groups intentionally running older versions', 'Devices offline for extended periods pending next check-in for upgrade'],
    tuningGuidance: 'Define minimum acceptable version per OS platform. Set adoption timeline targets for new releases. Exclude designated test groups from compliance calculations.',
    operationalValue: 'Outdated agents may lack critical detection capabilities, have known vulnerabilities, or miss compatibility with current IOC formats. Version compliance ensures fleet protection quality.',
    changeMgmtRelevance: 'Version distribution directly measures upgrade rollout progress. Stalled adoption indicates deployment issues, compatibility problems, or communication gaps.',
    troubleshootingWorkflow: '1. Identify the version distribution across the fleet\n2. Determine which OS platforms have most outdated agents\n3. Check upgrade deployment mechanism status\n4. Identify endpoints on oldest versions for priority upgrade\n5. Verify upgrade packages are accessible to all agents\n6. Review upgrade failure logs for common issues',
    criblSearchQueries: [
      {
        name: 'Version distribution',
        description: 'Show current agent version distribution across the fleet',
        query: 'dataset="$DATASET" earliest=-24h\n| summarize AgentCount=dcount(agent_id) by agent_version, os_type\n| order by agent_version desc'
      },
      {
        name: 'Version adoption trending',
        description: 'Track version adoption over time to monitor upgrade progress',
        query: 'dataset="$DATASET" earliest=-14d\n| summarize DailyAgents=dcount(agent_id) by agent_version, bin(timestamp, 1d)\n| order by timestamp, agent_version'
      },
      {
        name: 'Endpoints on oldest versions',
        description: 'Identify endpoints needing priority upgrades',
        query: 'dataset="$DATASET" earliest=-24h\n| summarize LastSeen=max(timestamp) by host_name, agent_version, os_type\n| order by agent_version asc\n| limit 50'
      }
    ]
  }
],
  'trellix-nx': [
  {
    id: 'obs-trellix-nx-001',
    name: 'Sensor Throughput Utilization',
    objective: 'Monitor Mbps processed vs sensor capacity to detect approaching throughput limits that could cause packet drops or inspection bypass.',
    category: 'Capacity',
    tags: ['observability', 'trellix', 'nx', 'throughput', 'sensor-capacity'],
    requiredFields: ['timestamp', 'sensor_name', 'throughput_mbps', 'max_capacity_mbps', 'packets_processed', 'packets_dropped'],
    detectionLogic: 'Track sensor throughput utilization percentage over 5-minute windows. Alert when utilization exceeds 75% sustained for 15 minutes or when any packet drops are detected indicating capacity overflow.',
    falsePositives: ['Brief traffic bursts during peak hours that self-resolve', 'Planned network maintenance causing temporary traffic concentration'],
    tuningGuidance: 'Set utilization thresholds per sensor based on licensed capacity. Use sustained duration requirements to avoid alerting on brief peaks. Track packet drops as a critical indicator regardless of utilization percentage.',
    operationalValue: 'Sensor throughput saturation causes uninspected traffic to bypass detection. Monitoring utilization prevents security blind spots from capacity exhaustion.',
    changeMgmtRelevance: 'Throughput changes follow network infrastructure modifications, traffic rerouting during maintenance, new network segments being monitored, or bandwidth upgrades.',
    troubleshootingWorkflow: '1. Identify sensors approaching capacity limits\n2. Check for packet drops indicating overflow\n3. Determine traffic sources driving utilization\n4. Assess whether traffic can be load-balanced across sensors\n5. Review if all monitored traffic requires full inspection\n6. Evaluate sensor upgrade or additional deployment options',
    criblSearchQueries: [
      {
        name: 'Sensor utilization over time',
        description: 'Track throughput utilization percentage per sensor',
        query: 'dataset="$DATASET"\n| timestats span=5m avg_mbps=avg(throughput_mbps), peak_mbps=max(throughput_mbps), drops=sum(packets_dropped) by sensor_name\n| extend util_pct = avg_mbps * 100.0 / max_capacity_mbps\n| order by util_pct desc'
      },
      {
        name: 'Packet drop detection',
        description: 'Identify sensors experiencing packet drops from capacity overflow',
        query: 'dataset="$DATASET" packets_dropped > 0 earliest=-24h\n| summarize TotalDrops=sum(packets_dropped), TotalProcessed=sum(packets_processed), AvgThroughput=avg(throughput_mbps) by sensor_name\n| extend DropRate = TotalDrops * 100.0 / (TotalProcessed + TotalDrops)\n| order by DropRate desc'
      },
      {
        name: 'Throughput trending',
        description: 'Track throughput growth for capacity planning',
        query: 'dataset="$DATASET" earliest=-7d\n| summarize AvgMbps=avg(throughput_mbps), PeakMbps=max(throughput_mbps) by sensor_name, bin(timestamp, 1h)\n| order by sensor_name, timestamp'
      }
    ]
  },
  {
    id: 'obs-trellix-nx-002',
    name: 'MVX Analysis Queue Depth',
    objective: 'Monitor files queued for sandbox analysis to detect processing bottlenecks that delay threat verdicts and increase exposure time.',
    category: 'Performance',
    tags: ['observability', 'trellix', 'nx', 'mvx', 'sandbox', 'queue'],
    requiredFields: ['timestamp', 'sensor_name', 'queue_depth', 'files_submitted', 'files_analyzed', 'avg_analysis_time_sec', 'verdict'],
    detectionLogic: 'Track MVX queue depth and analysis completion rate over 15-minute windows. Alert when queue depth exceeds configured threshold or when analysis backlog grows faster than processing capacity.',
    falsePositives: ['Bulk file transfer events temporarily flooding the queue', 'MVX infrastructure maintenance causing temporary processing slowdown'],
    tuningGuidance: 'Set queue depth thresholds based on MVX processing capacity. Track analysis time by file type for baseline expectations. Configure priority queuing for high-risk file types.',
    operationalValue: 'Queue depth growth means files await analysis longer, extending the window between delivery and detection. Deep queues indicate capacity issues or infrastructure problems.',
    changeMgmtRelevance: 'Queue depth changes follow MVX capacity changes, file submission policy modifications, new file types being submitted for analysis, or infrastructure scaling events.',
    troubleshootingWorkflow: '1. Check current queue depth and growth rate\n2. Verify MVX processing nodes are healthy and operational\n3. Determine if submission rate has increased abnormally\n4. Check if specific file types are consuming disproportionate analysis time\n5. Assess whether queue prioritization is functioning correctly\n6. Evaluate MVX capacity expansion options',
    criblSearchQueries: [
      {
        name: 'Queue depth over time',
        description: 'Track MVX analysis queue depth to detect buildups',
        query: 'dataset="$DATASET"\n| timestats span=15m max_queue=max(queue_depth), avg_queue=avg(queue_depth), submitted=sum(files_submitted) by sensor_name\n| order by max_queue desc'
      },
      {
        name: 'Analysis throughput',
        description: 'Track file analysis completion rate vs submission rate',
        query: 'dataset="$DATASET" earliest=-24h\n| summarize Submitted=sum(files_submitted), Analyzed=sum(files_analyzed), AvgTime=avg(avg_analysis_time_sec) by sensor_name, bin(timestamp, 1h)\n| extend Backlog = Submitted - Analyzed\n| order by sensor_name, timestamp'
      },
      {
        name: 'Analysis time by verdict',
        description: 'Compare analysis duration by verdict type for performance assessment',
        query: 'dataset="$DATASET" avg_analysis_time_sec > 0 earliest=-7d\n| summarize AvgAnalysisTime=avg(avg_analysis_time_sec), FileCount=sum(files_analyzed) by verdict, bin(timestamp, 1d)\n| order by verdict, timestamp'
      }
    ]
  },
  {
    id: 'obs-trellix-nx-003',
    name: 'Detection Efficacy',
    objective: 'Monitor the ratio of confirmed threats to total alerts to measure detection accuracy and ensure high-fidelity alerting.',
    category: 'Reliability',
    tags: ['observability', 'trellix', 'nx', 'detection-efficacy', 'accuracy'],
    requiredFields: ['timestamp', 'alert_id', 'severity', 'verdict', 'alert_type', 'sensor_name', 'resolution'],
    detectionLogic: 'Calculate confirmed threat ratio (true positives / total alerts) over weekly windows. Alert when efficacy drops below 60% or when specific alert types show declining accuracy trends.',
    falsePositives: ['New detection capabilities in learning phase with initially lower accuracy', 'Environmental changes creating new benign behaviors matching existing signatures'],
    tuningGuidance: 'Track efficacy per alert type and severity. Set minimum accuracy thresholds per category. Identify underperforming detection rules for tuning or retirement.',
    operationalValue: 'Detection efficacy directly measures the value of each alert generated. Low efficacy wastes analyst time and reduces confidence in the detection platform.',
    changeMgmtRelevance: 'Efficacy changes follow signature updates, new detection rule deployments, environmental changes creating false positives, or tuning campaigns improving accuracy.',
    troubleshootingWorkflow: '1. Identify alert types with lowest detection efficacy\n2. Analyze characteristics of false positive alerts\n3. Determine if signatures need tuning or exceptions\n4. Review recent signature updates for quality issues\n5. Validate that high-efficacy rules are not being affected\n6. Coordinate with vendor for signature improvement',
    criblSearchQueries: [
      {
        name: 'Detection efficacy by alert type',
        description: 'Calculate confirmed threat ratio per alert category',
        query: 'dataset="$DATASET" resolution!=""\n| summarize Total=count(), Confirmed=countif(verdict=="malicious") by alert_type, severity\n| extend EfficacyPct = Confirmed * 100.0 / Total\n| order by EfficacyPct asc'
      },
      {
        name: 'Efficacy trending',
        description: 'Track detection accuracy over time to detect degradation',
        query: 'dataset="$DATASET" resolution!="" earliest=-30d\n| summarize Total=count(), Confirmed=countif(verdict=="malicious") by bin(timestamp, 1d)\n| extend DailyEfficacy = Confirmed * 100.0 / Total\n| order by timestamp'
      },
      {
        name: 'Verdict distribution by sensor',
        description: 'Compare detection outcomes across sensors',
        query: 'dataset="$DATASET" earliest=-7d\n| summarize AlertCount=count() by verdict, sensor_name, severity\n| order by sensor_name, verdict'
      }
    ]
  },
  {
    id: 'obs-trellix-nx-004',
    name: 'Alert Volume Trending',
    objective: 'Monitor alert count per day by severity trending to detect alert storms, identify capacity concerns, and track threat activity levels.',
    category: 'Capacity',
    tags: ['observability', 'trellix', 'nx', 'alert-volume', 'trending'],
    requiredFields: ['timestamp', 'alert_id', 'severity', 'alert_type', 'sensor_name', 'source_ip', 'destination_ip'],
    detectionLogic: 'Track daily alert volume by severity and sensor. Alert when volume exceeds 3x baseline or when single sensors generate disproportionate alert counts indicating misconfiguration or targeted attack.',
    falsePositives: ['Vulnerability scan activities generating expected alert bursts', 'Red team exercises creating planned elevated alert volumes'],
    tuningGuidance: 'Set per-sensor and per-severity volume baselines. Exclude known scanning windows from threshold calculations. Track volume by source to identify scan-driven spikes.',
    operationalValue: 'Alert volume trending provides operational visibility into threat activity levels and SOC workload. Volume spikes indicate either increased threats or detection issues requiring attention.',
    changeMgmtRelevance: 'Volume changes follow new detection rule deployments, signature updates, network changes routing more traffic through sensors, or active threat campaigns.',
    troubleshootingWorkflow: '1. Identify which sensors and severity levels show volume spikes\n2. Determine if volume increase is from new rules or new threats\n3. Check for vulnerability scanning or testing activity\n4. Assess SOC capacity to handle current alert volume\n5. Verify alert quality has not degraded with volume increase\n6. Review whether volume is actionable or noise requiring tuning',
    criblSearchQueries: [
      {
        name: 'Daily alert volume by severity',
        description: 'Track alert counts per day by severity level',
        query: 'dataset="$DATASET"\n| timestats span=1d daily_alerts=count() by severity\n| order by timestamp'
      },
      {
        name: 'Alert volume by sensor',
        description: 'Compare alert volumes across sensors to detect imbalances',
        query: 'dataset="$DATASET" earliest=-7d\n| summarize AlertCount=count(), UniqueSourceIPs=dcount(source_ip) by sensor_name, severity, bin(timestamp, 1d)\n| order by AlertCount desc'
      },
      {
        name: 'Volume spike detection',
        description: 'Identify periods with abnormally high alert volumes',
        query: 'dataset="$DATASET" earliest=-24h\n| summarize HourlyAlerts=count() by sensor_name, severity, bin(timestamp, 1h)\n| order by HourlyAlerts desc\n| limit 30'
      }
    ]
  },
  {
    id: 'obs-trellix-nx-005',
    name: 'Sensor Health Monitoring',
    objective: 'Monitor interface errors, packet drops, and resource utilization across network sensors to ensure reliable threat detection.',
    category: 'Availability',
    tags: ['observability', 'trellix', 'nx', 'sensor-health', 'interface', 'resources'],
    requiredFields: ['timestamp', 'sensor_name', 'interface_name', 'interface_errors', 'cpu_percent', 'memory_percent', 'disk_percent', 'packets_dropped'],
    detectionLogic: 'Track sensor resource utilization and interface health over 5-minute windows. Alert when CPU >80%, memory >85%, disk >90%, or when interface errors exceed baseline indicating hardware issues.',
    falsePositives: ['Brief CPU spikes during signature update processing', 'Temporary memory pressure during large file analysis'],
    tuningGuidance: 'Set resource thresholds per sensor model based on capacity. Track interface error rates rather than counts for consistent alerting. Correlate resource spikes with processing events.',
    operationalValue: 'Sensor health degradation precedes detection failures. Proactive monitoring prevents blind spots from unhealthy sensors dropping traffic or missing threats.',
    changeMgmtRelevance: 'Health changes follow signature database growth consuming more resources, firmware updates, traffic volume increases, or hardware aging degradation.',
    troubleshootingWorkflow: '1. Identify sensors with health concerns\n2. Determine which resource is constrained (CPU, memory, disk)\n3. Check for correlation with traffic volume changes\n4. Verify interface errors are not from hardware failures\n5. Review if signature updates increased resource requirements\n6. Assess whether sensor replacement or upgrade is needed',
    criblSearchQueries: [
      {
        name: 'Sensor resource utilization',
        description: 'Track CPU, memory, and disk utilization per sensor',
        query: 'dataset="$DATASET"\n| timestats span=5m cpu=avg(cpu_percent), memory=avg(memory_percent), disk=avg(disk_percent) by sensor_name\n| where cpu > 70 or memory > 75 or disk > 80\n| order by cpu desc'
      },
      {
        name: 'Interface error tracking',
        description: 'Monitor interface errors and drops indicating hardware or capacity issues',
        query: 'dataset="$DATASET" (interface_errors > 0 or packets_dropped > 0) earliest=-24h\n| summarize TotalErrors=sum(interface_errors), TotalDrops=sum(packets_dropped) by sensor_name, interface_name\n| order by TotalErrors + TotalDrops desc'
      },
      {
        name: 'Health trending',
        description: 'Track sensor health metrics over time for degradation detection',
        query: 'dataset="$DATASET" earliest=-7d\n| summarize AvgCPU=avg(cpu_percent), AvgMemory=avg(memory_percent), AvgDisk=avg(disk_percent) by sensor_name, bin(timestamp, 4h)\n| order by sensor_name, timestamp'
      }
    ]
  },
  {
    id: 'obs-trellix-nx-006',
    name: 'Malware Category Distribution',
    objective: 'Monitor shifts in detected malware types to identify emerging threat trends and validate detection coverage across malware categories.',
    category: 'Change Management',
    tags: ['observability', 'trellix', 'nx', 'malware-category', 'threat-trends'],
    requiredFields: ['timestamp', 'malware_category', 'malware_name', 'severity', 'sensor_name', 'source_ip', 'destination_ip'],
    detectionLogic: 'Track malware category distribution over weekly windows. Alert when previously rare categories show >200% increase or when new malware categories appear that were not seen in the prior 30-day baseline.',
    falsePositives: ['Seasonal malware campaigns with predictable category shifts', 'New detection signatures surfacing previously unclassified malware'],
    tuningGuidance: 'Define expected category proportions based on historical data. Set per-category shift thresholds. Track new category emergence separately from volume shifts in existing categories.',
    operationalValue: 'Category distribution shifts reveal evolving threat landscape and attacker technique changes. Understanding trends enables proactive defense adjustments.',
    changeMgmtRelevance: 'Distribution shifts follow new signature deployments detecting additional categories, threat actor campaign changes, or security control modifications affecting what reaches sensors.',
    troubleshootingWorkflow: '1. Identify which malware categories show distribution shifts\n2. Determine if shifts are from new detections or new threats\n3. Review threat intelligence for corresponding campaign information\n4. Assess whether detection coverage is adequate for emerging categories\n5. Verify security controls upstream are functioning correctly\n6. Update detection playbooks for new threat categories',
    criblSearchQueries: [
      {
        name: 'Malware category distribution',
        description: 'Track detection volumes by malware category over time',
        query: 'dataset="$DATASET"\n| timestats span=1d detections=count() by malware_category\n| order by detections desc'
      },
      {
        name: 'Category shift analysis',
        description: 'Compare recent category volumes against baseline for shift detection',
        query: 'dataset="$DATASET" earliest=-14d\n| summarize Detections=count(), UniqueVariants=dcount(malware_name) by malware_category, bin(timestamp, 1d)\n| order by malware_category, timestamp'
      },
      {
        name: 'Emerging threats',
        description: 'Identify new or rapidly growing malware categories',
        query: 'dataset="$DATASET" earliest=-7d\n| summarize WeekCount=count(), UniqueSources=dcount(source_ip), UniqueTargets=dcount(destination_ip) by malware_category, malware_name, severity\n| order by WeekCount desc\n| limit 25'
      }
    ]
  },
  {
    id: 'obs-trellix-nx-007',
    name: 'PCAP Storage Utilization',
    objective: 'Monitor packet capture storage consumption rate to prevent storage exhaustion that would cause loss of forensic evidence.',
    category: 'Capacity',
    tags: ['observability', 'trellix', 'nx', 'pcap', 'storage', 'capacity'],
    requiredFields: ['timestamp', 'sensor_name', 'storage_used_gb', 'storage_total_gb', 'pcap_retention_days', 'daily_capture_gb'],
    detectionLogic: 'Track storage utilization percentage and consumption rate per sensor. Alert when utilization exceeds 80% or when consumption rate projects exhaustion within 7 days at current pace.',
    falsePositives: ['Temporary high-capture events from incident investigations', 'Scheduled PCAP archival processes temporarily reducing available space'],
    tuningGuidance: 'Set storage thresholds based on retention requirements. Track consumption rate for growth projections. Configure retention policies to automatically age out old captures.',
    operationalValue: 'PCAP storage exhaustion causes loss of packet-level forensic evidence. Proactive monitoring ensures evidence availability for investigations and compliance.',
    changeMgmtRelevance: 'Storage utilization changes follow network traffic volume increases, retention policy modifications, new capture filters expanding what is stored, or storage infrastructure changes.',
    troubleshootingWorkflow: '1. Identify sensors approaching storage capacity\n2. Check current retention settings and actual retention achieved\n3. Determine if capture volume has increased recently\n4. Assess whether retention policies need adjustment\n5. Verify automated archival and cleanup processes\n6. Evaluate storage expansion options if growth is sustained',
    criblSearchQueries: [
      {
        name: 'Storage utilization by sensor',
        description: 'Track PCAP storage consumption per sensor',
        query: 'dataset="$DATASET"\n| summarize UsedGB=max(storage_used_gb), TotalGB=max(storage_total_gb) by sensor_name\n| extend UtilPct = UsedGB * 100.0 / TotalGB\n| order by UtilPct desc'
      },
      {
        name: 'Daily capture volume',
        description: 'Track daily PCAP capture rates for growth projection',
        query: 'dataset="$DATASET" earliest=-14d\n| summarize DailyCapture=sum(daily_capture_gb) by sensor_name, bin(timestamp, 1d)\n| order by sensor_name, timestamp'
      },
      {
        name: 'Storage capacity projection',
        description: 'Project storage exhaustion based on current consumption rate',
        query: 'dataset="$DATASET" earliest=-7d\n| summarize AvgDailyCapture=avg(daily_capture_gb), CurrentUsed=max(storage_used_gb), TotalCapacity=max(storage_total_gb) by sensor_name\n| extend RemainingGB = TotalCapacity - CurrentUsed\n| extend DaysRemaining = RemainingGB / AvgDailyCapture\n| order by DaysRemaining asc'
      }
    ]
  }
],
  'cisco-secure-email': [
  {
    id: 'obs-cisco-email-001',
    name: 'Email Delivery Latency',
    objective: 'Monitor time from receipt to delivery by pipeline stage to detect processing bottlenecks impacting email flow.',
    category: 'Performance',
    tags: ['observability', 'cisco', 'secure-email', 'delivery-latency', 'performance'],
    requiredFields: ['timestamp', 'message_id', 'received_time', 'delivered_time', 'processing_stage', 'queue_time_sec', 'total_latency_sec'],
    detectionLogic: 'Track email delivery latency percentiles by processing stage over 15-minute windows. Alert when p95 latency exceeds SLA threshold (e.g., >60 seconds) or when specific pipeline stages show growing delays.',
    falsePositives: ['Large attachments requiring extended scanning time', 'Recipient server temporary unavailability causing retry delays'],
    tuningGuidance: 'Set latency thresholds per pipeline stage. Exclude messages with large attachments from aggregate calculations. Track retry-related latency separately from processing latency.',
    operationalValue: 'Email delivery latency directly impacts business communication velocity. Detecting pipeline bottlenecks enables proactive remediation before user complaints escalate.',
    changeMgmtRelevance: 'Latency changes follow scanning policy modifications, new content filter additions, infrastructure scaling events, or upstream provider changes.',
    troubleshootingWorkflow: '1. Identify which pipeline stages contribute most latency\n2. Determine if latency is from processing or queue time\n3. Check scanning engine performance and queue depths\n4. Verify outbound delivery connections are healthy\n5. Review recent policy changes adding processing steps\n6. Assess infrastructure capacity against current volume',
    criblSearchQueries: [
      {
        name: 'Delivery latency by stage',
        description: 'Track email processing time by pipeline stage',
        query: 'dataset="$DATASET" total_latency_sec > 0\n| timestats span=15m avg_latency=avg(total_latency_sec), p95_latency=max(total_latency_sec) by processing_stage\n| order by p95_latency desc'
      },
      {
        name: 'Slowest deliveries',
        description: 'Identify messages with highest delivery latency for investigation',
        query: 'dataset="$DATASET" total_latency_sec > 30 earliest=-4h\n| summarize Count=count(), AvgLatency=avg(total_latency_sec), MaxLatency=max(total_latency_sec) by processing_stage\n| order by MaxLatency desc'
      },
      {
        name: 'Latency trending',
        description: 'Track delivery latency trends to detect gradual degradation',
        query: 'dataset="$DATASET" earliest=-24h\n| summarize AvgLatency=avg(total_latency_sec), P95Latency=max(total_latency_sec), Messages=count() by bin(timestamp, 1h)\n| order by timestamp'
      }
    ]
  },
  {
    id: 'obs-cisco-email-002',
    name: 'Spam Volume Trending',
    objective: 'Monitor spam vs legitimate email ratio over time to detect spam campaign surges and validate anti-spam filtering effectiveness.',
    category: 'Capacity',
    tags: ['observability', 'cisco', 'secure-email', 'spam', 'volume', 'filtering'],
    requiredFields: ['timestamp', 'message_id', 'spam_verdict', 'spam_score', 'sender_domain', 'recipient_domain', 'action'],
    detectionLogic: 'Track spam vs legitimate email ratios over 1-hour windows. Alert when spam ratio exceeds 80% of total volume or when spam volume increases >3x baseline indicating a targeted campaign.',
    falsePositives: ['Marketing email campaigns from legitimate bulk senders', 'Newsletter delivery periods causing temporary spam score spikes'],
    tuningGuidance: 'Set spam ratio thresholds based on historical norms. Track by recipient domain for targeted campaign detection. Monitor false positive rate alongside volume for filter accuracy.',
    operationalValue: 'Spam volume surges consume processing capacity and may indicate targeted phishing campaigns. Monitoring ensures filtering keeps pace with attack volume.',
    changeMgmtRelevance: 'Spam ratio changes follow anti-spam rule updates, sender reputation changes, new allow/blocklist entries, or threat actor campaign launches targeting the organization.',
    troubleshootingWorkflow: '1. Determine if spam volume increase is general or targeted\n2. Identify top spam sending domains or IPs\n3. Check if anti-spam engines are processing correctly\n4. Verify connection-level filtering is functioning\n5. Assess whether new blocklist entries would help\n6. Review if legitimate email is being caught as spam',
    criblSearchQueries: [
      {
        name: 'Spam vs legitimate ratio',
        description: 'Track spam proportion of total email volume over time',
        query: 'dataset="$DATASET"\n| timestats span=1h total=count(), spam_count=countif(spam_verdict=="spam") by recipient_domain\n| extend spam_pct = spam_count * 100.0 / total\n| order by spam_pct desc'
      },
      {
        name: 'Top spam sources',
        description: 'Identify domains and IPs sending the most spam',
        query: 'dataset="$DATASET" spam_verdict="spam" earliest=-24h\n| summarize SpamCount=count() by sender_domain\n| order by SpamCount desc\n| limit 25'
      },
      {
        name: 'Spam volume trending',
        description: 'Track spam volume over time to detect campaign surges',
        query: 'dataset="$DATASET" earliest=-7d\n| summarize Total=count(), Spam=countif(spam_verdict=="spam"), Legitimate=countif(spam_verdict=="clean") by bin(timestamp, 4h)\n| extend SpamPct = Spam * 100.0 / Total\n| order by timestamp'
      }
    ]
  },
  {
    id: 'obs-cisco-email-003',
    name: 'Quarantine Queue Depth',
    objective: 'Monitor messages awaiting review in quarantine to prevent queue overflow and ensure timely message disposition.',
    category: 'Capacity',
    tags: ['observability', 'cisco', 'secure-email', 'quarantine', 'queue', 'review'],
    requiredFields: ['timestamp', 'quarantine_name', 'queue_depth', 'messages_added', 'messages_released', 'messages_deleted', 'oldest_message_age_hours'],
    detectionLogic: 'Track quarantine queue depth and age over 30-minute windows. Alert when queue depth exceeds capacity threshold or when oldest message age exceeds review SLA (e.g., >24 hours without disposition).',
    falsePositives: ['Weekends and holidays with expected queue growth from reduced review staff', 'Spam campaigns temporarily flooding quarantine before auto-deletion rules apply'],
    tuningGuidance: 'Set queue depth thresholds per quarantine type. Configure age-based alerts by quarantine criticality. Account for business hours in review SLA calculations.',
    operationalValue: 'Quarantine overflow causes automatic message release or deletion without review. Monitoring queue depth ensures human review capacity keeps pace with quarantine intake.',
    changeMgmtRelevance: 'Queue depth changes follow filter policy modifications changing what gets quarantined, staffing changes affecting review capacity, or spam campaigns flooding specific quarantines.',
    troubleshootingWorkflow: '1. Identify which quarantines are approaching capacity\n2. Check age of oldest unreviewed messages\n3. Determine if intake rate has increased or review rate decreased\n4. Verify auto-release and auto-delete timers are configured\n5. Assess whether quarantine policies need tuning to reduce volume\n6. Coordinate additional review resources if needed',
    criblSearchQueries: [
      {
        name: 'Queue depth by quarantine',
        description: 'Track quarantine queue depth over time',
        query: 'dataset="$DATASET"\n| timestats span=30m depth=max(queue_depth), max_age=max(oldest_message_age_hours) by quarantine_name\n| order by depth desc'
      },
      {
        name: 'Quarantine throughput',
        description: 'Compare messages entering vs leaving quarantine',
        query: 'dataset="$DATASET" earliest=-24h\n| summarize Added=sum(messages_added), Released=sum(messages_released), Deleted=sum(messages_deleted) by quarantine_name, bin(timestamp, 2h)\n| extend NetGrowth = Added - Released - Deleted\n| order by quarantine_name, timestamp'
      },
      {
        name: 'Queue growth trending',
        description: 'Track queue depth trends for capacity planning',
        query: 'dataset="$DATASET" earliest=-7d\n| summarize AvgDepth=avg(queue_depth), MaxDepth=max(queue_depth), AvgAge=avg(oldest_message_age_hours) by quarantine_name, bin(timestamp, 1d)\n| order by quarantine_name, timestamp'
      }
    ]
  },
  {
    id: 'obs-cisco-email-004',
    name: 'Sender Reputation Distribution',
    objective: 'Monitor traffic volume by sender reputation tier over time to detect shifts in mail quality and validate reputation filtering effectiveness.',
    category: 'Health',
    tags: ['observability', 'cisco', 'secure-email', 'sender-reputation', 'filtering'],
    requiredFields: ['timestamp', 'sender_ip', 'sender_domain', 'reputation_score', 'reputation_tier', 'message_count', 'action'],
    detectionLogic: 'Track message volume by reputation tier over 4-hour windows. Alert when low-reputation traffic exceeds 50% of total volume or when previously good-reputation senders show score degradation.',
    falsePositives: ['Legitimate bulk senders with temporarily degraded reputation after infrastructure changes', 'New sending domains without established reputation'],
    tuningGuidance: 'Define reputation tier boundaries (good >7, neutral 4-7, poor <4). Track reputation shifts per sender domain over time. Set volume thresholds per tier for alerting.',
    operationalValue: 'Reputation distribution indicates overall mail ecosystem health. Shifts toward low-reputation traffic signal increased threat activity or infrastructure compromise.',
    changeMgmtRelevance: 'Reputation distribution changes follow sender infrastructure modifications, new business partner email configurations, blocklist/allowlist updates, or reputation provider database changes.',
    troubleshootingWorkflow: '1. Identify which reputation tiers show volume shifts\n2. Determine top senders in degraded reputation categories\n3. Check if legitimate senders have reputation issues\n4. Verify reputation database is current and accessible\n5. Assess whether throttling policies are effective\n6. Review allow/blocklist for needed updates',
    criblSearchQueries: [
      {
        name: 'Volume by reputation tier',
        description: 'Track message volume distribution across reputation tiers',
        query: 'dataset="$DATASET"\n| timestats span=4h messages=count() by reputation_tier\n| order by timestamp'
      },
      {
        name: 'Low reputation senders',
        description: 'Identify senders with poor reputation scores driving volume',
        query: 'dataset="$DATASET" reputation_score < 4 earliest=-24h\n| summarize MessageCount=count(), AvgScore=avg(reputation_score) by sender_domain, sender_ip\n| order by MessageCount desc\n| limit 25'
      },
      {
        name: 'Reputation shift detection',
        description: 'Track sender reputation changes over time',
        query: 'dataset="$DATASET" earliest=-7d\n| summarize AvgReputation=avg(reputation_score), Messages=count() by sender_domain, bin(timestamp, 1d)\n| where Messages > 10\n| order by sender_domain, timestamp'
      }
    ]
  },
  {
    id: 'obs-cisco-email-005',
    name: 'Delivery Success Rate',
    objective: 'Monitor messages successfully delivered vs bounced or dropped to ensure reliable email delivery and detect delivery infrastructure issues.',
    category: 'Reliability',
    tags: ['observability', 'cisco', 'secure-email', 'delivery', 'success-rate', 'bounces'],
    requiredFields: ['timestamp', 'message_id', 'delivery_status', 'bounce_reason', 'recipient_domain', 'sender_domain', 'action'],
    detectionLogic: 'Calculate delivery success rate over 1-hour windows. Alert when success rate drops below 95% or when specific recipient domains show elevated bounce rates indicating delivery infrastructure issues.',
    falsePositives: ['Invalid recipient addresses generating expected bounces', 'Recipient server maintenance causing temporary delivery failures'],
    tuningGuidance: 'Set success rate thresholds by recipient domain tier (internal higher than external). Track bounce reasons to differentiate infrastructure issues from addressing errors. Exclude known invalid-recipient bounces.',
    operationalValue: 'Low delivery success rates mean business communications are not reaching recipients. Detecting delivery failures enables rapid infrastructure remediation.',
    changeMgmtRelevance: 'Delivery rate changes follow DNS configuration modifications, TLS certificate issues, IP reputation changes, or recipient server policy updates blocking delivery.',
    troubleshootingWorkflow: '1. Identify which recipient domains show delivery failures\n2. Categorize bounce reasons (DNS, TLS, policy, capacity)\n3. Check outbound IP reputation status\n4. Verify DNS records (MX, SPF, DKIM, DMARC) are correct\n5. Test connectivity to failing recipient domains\n6. Review recent configuration changes affecting outbound delivery',
    criblSearchQueries: [
      {
        name: 'Delivery success rate',
        description: 'Track message delivery success vs failure rates over time',
        query: 'dataset="$DATASET"\n| timestats span=1h total=count(), delivered=countif(delivery_status=="delivered") by recipient_domain\n| extend success_pct = delivered * 100.0 / total\n| order by success_pct asc'
      },
      {
        name: 'Bounce reason analysis',
        description: 'Categorize delivery failures by reason for root cause analysis',
        query: 'dataset="$DATASET" delivery_status!="delivered" earliest=-24h\n| summarize BounceCount=count() by bounce_reason, recipient_domain\n| order by BounceCount desc\n| limit 25'
      },
      {
        name: 'Delivery trending',
        description: 'Track overall delivery success rate for degradation detection',
        query: 'dataset="$DATASET" earliest=-7d\n| summarize Total=count(), Delivered=countif(delivery_status=="delivered"), Bounced=countif(delivery_status=="bounced") by bin(timestamp, 4h)\n| extend SuccessRate = Delivered * 100.0 / Total\n| order by timestamp'
      }
    ]
  },
  {
    id: 'obs-cisco-email-006',
    name: 'AMP Scanning Latency',
    objective: 'Monitor time added by Advanced Malware Protection file analysis to detect scanning infrastructure performance issues impacting email delivery.',
    category: 'Performance',
    tags: ['observability', 'cisco', 'secure-email', 'amp', 'scanning', 'latency'],
    requiredFields: ['timestamp', 'message_id', 'amp_scan_time_ms', 'file_name', 'file_size_kb', 'amp_verdict', 'amp_disposition'],
    detectionLogic: 'Track AMP scanning duration percentiles over 15-minute windows. Alert when p95 scan time exceeds 10 seconds or when average latency increases >100% from baseline indicating AMP infrastructure degradation.',
    falsePositives: ['Large files legitimately requiring extended analysis time', 'Retrospective verdict lookups adding latency for previously seen files'],
    tuningGuidance: 'Set scan time thresholds by file size tier. Exclude known large file types from latency calculations. Track cloud lookup vs local scan latency separately.',
    operationalValue: 'AMP scanning latency directly adds to email delivery time. Detecting scan infrastructure slowdowns enables proactive engagement before widespread delivery delays.',
    changeMgmtRelevance: 'Scanning latency changes follow AMP engine updates, cloud connectivity issues, new file type scanning enablement, or infrastructure capacity changes.',
    troubleshootingWorkflow: '1. Identify if latency is from local scanning or cloud lookups\n2. Check AMP cloud service connectivity and response times\n3. Verify local scanning engine resource utilization\n4. Determine if specific file types cause disproportionate latency\n5. Review recent AMP configuration or policy changes\n6. Assess whether scanning exceptions for safe file types would help',
    criblSearchQueries: [
      {
        name: 'AMP scan latency percentiles',
        description: 'Track AMP scanning duration over time',
        query: 'dataset="$DATASET" amp_scan_time_ms > 0\n| timestats span=15m avg_ms=avg(amp_scan_time_ms), p95_ms=max(amp_scan_time_ms), scans=count()\n| order by p95_ms desc'
      },
      {
        name: 'Scan time by file size',
        description: 'Correlate scan duration with file size for performance analysis',
        query: 'dataset="$DATASET" amp_scan_time_ms > 0 earliest=-24h\n| summarize AvgScanMs=avg(amp_scan_time_ms), P95ScanMs=max(amp_scan_time_ms), FileCount=count() by amp_verdict\n| order by P95ScanMs desc'
      },
      {
        name: 'AMP latency trending',
        description: 'Track scanning latency trends for degradation detection',
        query: 'dataset="$DATASET" amp_scan_time_ms > 0 earliest=-7d\n| summarize AvgScan=avg(amp_scan_time_ms), P95Scan=max(amp_scan_time_ms), Scans=count() by bin(timestamp, 4h)\n| order by timestamp'
      }
    ]
  },
  {
    id: 'obs-cisco-email-007',
    name: 'Outbreak Filter Activation Rate',
    objective: 'Monitor frequency and duration of outbreak filter triggers to assess emerging threat response and validate outbreak detection effectiveness.',
    category: 'Health',
    tags: ['observability', 'cisco', 'secure-email', 'outbreak-filter', 'threat-response'],
    requiredFields: ['timestamp', 'outbreak_rule_id', 'activation_time', 'deactivation_time', 'messages_quarantined', 'threat_category', 'severity'],
    detectionLogic: 'Track outbreak filter activation frequency and duration over daily windows. Alert when activation rate exceeds 3x baseline or when outbreak durations exceed typical resolution times indicating prolonged campaigns.',
    falsePositives: ['Legitimate bulk email campaigns triggering outbreak heuristics', 'Brief activations that self-resolve within minutes as signatures catch up'],
    tuningGuidance: 'Set activation frequency baselines by threat category. Track duration separately from frequency. Define acceptable outbreak hold times by message criticality.',
    operationalValue: 'Outbreak filter activations indicate emerging threats before signatures are available. Monitoring activation patterns reveals threat landscape activity and protection gaps.',
    changeMgmtRelevance: 'Activation rate changes follow threat landscape shifts, outbreak filter sensitivity tuning, new content filter rules reducing outbreak reliance, or zero-day campaign launches.',
    troubleshootingWorkflow: '1. Identify active outbreak filters and their trigger criteria\n2. Determine how many messages are affected by current outbreaks\n3. Check if signatures are available to replace outbreak holds\n4. Assess impact on email delivery for quarantined messages\n5. Verify outbreak filter rules are current and appropriate\n6. Coordinate with threat intel for campaign context',
    criblSearchQueries: [
      {
        name: 'Outbreak filter activations',
        description: 'Track outbreak filter activation frequency over time',
        query: 'dataset="$DATASET"\n| timestats span=4h activations=count(), quarantined=sum(messages_quarantined) by threat_category\n| order by activations desc'
      },
      {
        name: 'Outbreak duration analysis',
        description: 'Analyze how long outbreak filters remain active',
        query: 'dataset="$DATASET" deactivation_time > 0 earliest=-14d\n| extend duration_hours = (deactivation_time - activation_time) / 3600\n| summarize AvgDuration=avg(duration_hours), MaxDuration=max(duration_hours), Activations=count() by threat_category, severity\n| order by AvgDuration desc'
      },
      {
        name: 'Quarantined volume trending',
        description: 'Track messages held by outbreak filters for impact assessment',
        query: 'dataset="$DATASET" earliest=-7d\n| summarize QuarantinedMessages=sum(messages_quarantined), FilterActivations=count() by bin(timestamp, 1d)\n| order by timestamp'
      }
    ]
  }
],
  'cisco-umbrella': [
    {
      id: 'obs-umbrella-001',
      name: 'DNS Query Volume Trending',
      objective: 'Monitor total DNS query volume over time per data center or office location to identify capacity trends, plan infrastructure scaling, and detect abnormal volume shifts.',
      category: 'Capacity',
      tags: ['observability', 'cisco', 'umbrella', 'dns', 'volume', 'capacity'],
      requiredFields: ['query_domain', 'identity', 'identity_type', 'data_center', 'response_code', 'action', 'timestamp'],
      detectionLogic: 'Track total DNS query volume in 15-minute windows aggregated by data center or office location. Alert when volume exceeds 120% of the rolling 7-day average for that time slot, or drops below 50% indicating potential connectivity loss.',
      falsePositives: ['Seasonal business activity causing natural query volume increases', 'Planned office closures reducing volume from specific locations'],
      tuningGuidance: 'Baseline query volume per location and time-of-day. Account for business hours vs off-hours patterns. Set separate thresholds for weekday and weekend traffic.',
      operationalValue: 'DNS query volume directly correlates with user activity and application availability. Volume anomalies reveal connectivity issues, DNS infrastructure problems, or unusual application behavior before users report problems.',
      changeMgmtRelevance: 'Volume shifts follow office openings/closings, new application deployments increasing DNS lookups, DNS infrastructure changes, or network routing modifications affecting query paths.',
      troubleshootingWorkflow: '1. Identify which locations or identity groups show volume anomalies\n2. Determine if the change is an increase (capacity concern) or decrease (connectivity concern)\n3. Check if the volume shift correlates with a deployment or network change\n4. Verify DNS infrastructure health (virtual appliances, roaming clients)\n5. Review if specific domain categories are driving the volume change\n6. Assess capacity headroom and plan scaling if trending upward',
      criblSearchQueries: [
        {
          name: 'DNS query volume by data center',
          description: 'Track total DNS query volume over time per data center for capacity planning',
          query: 'dataset="$DATASET" earliest=-7d\n| timestats span=1h total_queries=count() by data_center\n| order by total_queries desc'
        },
        {
          name: 'Query volume anomaly detection',
          description: 'Identify time periods where query volume deviates significantly from baseline',
          query: 'dataset="$DATASET" earliest=-24h\n| timestats span=15m queries=count() by data_center\n| summarize AvgQueries=avg(queries), MaxQueries=max(queries), MinQueries=min(queries) by data_center\n| order by AvgQueries desc'
        },
        {
          name: 'Volume comparison by identity type',
          description: 'Compare DNS query volumes across identity types to identify shifts in usage patterns',
          query: 'dataset="$DATASET" earliest=-24h\n| summarize TotalQueries=count(), UniqueIdentities=dcount(identity), UniqueDomains=dcount(query_domain) by identity_type, data_center\n| order by TotalQueries desc'
        }
      ]
    },
    {
      id: 'obs-umbrella-002',
      name: 'Block Rate Monitoring',
      objective: 'Monitor the ratio of blocked versus allowed DNS queries to track security policy effectiveness and detect sudden changes in block rates that may indicate misconfiguration or new threats.',
      category: 'Health',
      tags: ['observability', 'cisco', 'umbrella', 'dns', 'block-rate', 'health'],
      requiredFields: ['query_domain', 'identity', 'action', 'categories', 'blocked', 'response_code', 'timestamp'],
      detectionLogic: 'Calculate the percentage of blocked queries vs total queries in rolling 1-hour windows. Alert when block rate exceeds 2x the 7-day baseline (indicating new threat activity or over-blocking) or drops below 50% of baseline (indicating policy bypass or misconfiguration).',
      falsePositives: ['Security policy updates intentionally expanding block coverage', 'Phishing campaigns temporarily increasing block rates'],
      tuningGuidance: 'Baseline block rates per policy and identity group. Track block rate changes alongside policy modifications. Set different alert thresholds for user-initiated vs automated queries.',
      operationalValue: 'Block rate is a key health indicator for DNS security. Rising rates may indicate active threats; dropping rates may signal policy gaps. Monitoring ensures security controls remain effective.',
      changeMgmtRelevance: 'Block rate changes follow policy updates, new category additions to blocklists, threat landscape shifts, user behavior changes, or integration modifications with upstream threat feeds.',
      troubleshootingWorkflow: '1. Determine if block rate change is an increase or decrease\n2. Identify which categories or policies are driving the change\n3. Check if a policy update was recently deployed\n4. Review specific blocked domains for false positive patterns\n5. Verify threat feed updates that may have expanded categories\n6. Assess user impact from over-blocking scenarios',
      criblSearchQueries: [
        {
          name: 'Block vs allow ratio trending',
          description: 'Track the ratio of blocked to allowed queries over time for health monitoring',
          query: 'dataset="$DATASET" earliest=-7d\n| timestats span=1h total_queries=count(), blocked_queries=countif(action=="blocked")\n| extend block_rate=round(blocked_queries * 100.0 / total_queries, 2)\n| order by timestamp'
        },
        {
          name: 'Block rate by category',
          description: 'Analyze which security categories contribute most to blocked traffic',
          query: 'dataset="$DATASET" action="blocked" earliest=-24h\n| summarize BlockCount=count(), Identities=dcount(identity) by categories\n| extend percentage=round(BlockCount * 100.0 / sum(BlockCount), 2)\n| order by BlockCount desc'
        },
        {
          name: 'Block rate by identity group',
          description: 'Compare block rates across identity groups to identify policy effectiveness gaps',
          query: 'dataset="$DATASET" earliest=-24h\n| summarize Total=count(), Blocked=countif(action=="blocked") by identity_type\n| extend BlockRate=round(Blocked * 100.0 / Total, 2)\n| order by BlockRate desc'
        }
      ]
    },
    {
      id: 'obs-umbrella-003',
      name: 'Category Distribution Shift',
      objective: 'Monitor changes in the distribution of top URL/DNS categories to detect shifts in user behavior, application usage, or content access patterns requiring policy adjustments.',
      category: 'Change Management',
      tags: ['observability', 'cisco', 'umbrella', 'dns', 'categories', 'change-management'],
      requiredFields: ['query_domain', 'identity', 'categories', 'action', 'identity_type', 'timestamp'],
      detectionLogic: 'Compare the top 20 category distribution percentages between current day and the 7-day rolling average. Alert when any category share changes by more than 5 percentage points, indicating meaningful shifts in user behavior or application usage.',
      falsePositives: ['New SaaS application rollout causing legitimate category shifts', 'Seasonal business activities changing browsing patterns'],
      tuningGuidance: 'Set shift sensitivity per category importance. Critical categories (security-related) should alert on smaller shifts. Consider day-of-week patterns in baseline calculations.',
      operationalValue: 'Category distribution reflects organizational application and content consumption patterns. Shifts reveal new application adoption, shadow IT emergence, productivity changes, or security policy gaps.',
      changeMgmtRelevance: 'Category shifts follow new application deployments, SaaS migrations, policy changes allowing/blocking categories, user awareness training, or organizational changes affecting work patterns.',
      troubleshootingWorkflow: '1. Identify which categories shifted and in which direction\n2. Determine if the shift correlates with a known application deployment\n3. Check if new domains are driving category changes\n4. Assess whether policy adjustments are needed\n5. Review if the shift indicates shadow IT or unauthorized application use\n6. Update documentation and policies to reflect legitimate changes',
      criblSearchQueries: [
        {
          name: 'Top category distribution',
          description: 'Show current category distribution for comparison against historical baselines',
          query: 'dataset="$DATASET" earliest=-24h\n| summarize QueryCount=count() by categories\n| extend percentage=round(QueryCount * 100.0 / sum(QueryCount), 2)\n| order by QueryCount desc\n| limit 20'
        },
        {
          name: 'Category trend over time',
          description: 'Track category distribution changes over multiple days to identify shifts',
          query: 'dataset="$DATASET" earliest=-7d\n| timestats span=1d queries=count() by categories\n| order by queries desc'
        },
        {
          name: 'New category emergence',
          description: 'Detect categories appearing in traffic that were not present in prior baseline periods',
          query: 'dataset="$DATASET" earliest=-24h\n| summarize CurrentCount=count(), Identities=dcount(identity) by categories\n| where CurrentCount > 100\n| order by CurrentCount desc'
        }
      ]
    },
    {
      id: 'obs-umbrella-004',
      name: 'Resolver Response Latency',
      objective: 'Monitor DNS resolution time from Umbrella resolvers to detect performance degradation affecting user experience and application responsiveness.',
      category: 'Performance',
      tags: ['observability', 'cisco', 'umbrella', 'dns', 'latency', 'performance'],
      requiredFields: ['query_domain', 'identity', 'response_time_ms', 'resolver', 'response_code', 'data_center', 'timestamp'],
      detectionLogic: 'Track DNS response time percentiles (p50, p95, p99) in 5-minute windows by resolver and data center. Alert when p95 latency exceeds 100ms or when any resolver shows latency 2x above its 24-hour baseline, indicating degradation.',
      falsePositives: ['Transient network congestion causing brief latency spikes', 'Cold cache queries for rarely accessed domains taking longer'],
      tuningGuidance: 'Baseline latency per resolver and data center. Account for geographic distance to nearest Umbrella PoP. Set different thresholds for internal vs external domain resolution.',
      operationalValue: 'DNS resolution latency directly impacts every network-dependent application. Elevated latency degrades page load times, API calls, and service availability across the organization.',
      changeMgmtRelevance: 'Latency changes follow network path modifications, Umbrella PoP changes, virtual appliance configuration updates, new forwarding rules, or ISP routing changes.',
      troubleshootingWorkflow: '1. Identify which resolvers or data centers show elevated latency\n2. Determine if latency is for all domains or specific ones\n3. Check network path health to Umbrella PoPs\n4. Verify virtual appliance performance and resource utilization\n5. Review if forwarding configuration changes were recently made\n6. Contact Cisco support if infrastructure-side degradation is suspected',
      criblSearchQueries: [
        {
          name: 'DNS response latency percentiles',
          description: 'Track DNS resolution time percentiles over time for performance monitoring',
          query: 'dataset="$DATASET" response_time_ms > 0 earliest=-24h\n| timestats span=15m avg_latency=avg(response_time_ms), p95_latency=max(response_time_ms) by data_center\n| order by p95_latency desc'
        },
        {
          name: 'Slow resolver identification',
          description: 'Find resolvers with consistently high response times for remediation',
          query: 'dataset="$DATASET" response_time_ms > 0 earliest=-4h\n| summarize AvgLatency=avg(response_time_ms), P95=max(response_time_ms), Queries=count() by resolver, data_center\n| where P95 > 100\n| order by P95 desc'
        },
        {
          name: 'Latency by domain category',
          description: 'Identify if specific domain categories have higher resolution times',
          query: 'dataset="$DATASET" response_time_ms > 0 earliest=-24h\n| summarize AvgLatency=avg(response_time_ms), P95=max(response_time_ms), Queries=count() by categories\n| where Queries > 100\n| order by P95 desc'
        }
      ]
    },
    {
      id: 'obs-umbrella-005',
      name: 'Identity Coverage Gaps',
      objective: 'Identify devices and users not routing DNS traffic through Umbrella, revealing protection gaps where endpoints bypass DNS security controls.',
      category: 'Availability',
      tags: ['observability', 'cisco', 'umbrella', 'dns', 'coverage', 'availability'],
      requiredFields: ['identity', 'identity_type', 'data_center', 'last_seen', 'registration_status', 'timestamp'],
      detectionLogic: 'Compare the list of registered identities against active query-generating identities. Alert when registered identities have not generated queries for more than 24 hours (roaming clients offline or bypassed) or when expected identity counts drop below baseline.',
      falsePositives: ['Devices legitimately offline (weekends, vacations, decommissioned)', 'VPN configurations routing DNS through alternate paths'],
      tuningGuidance: 'Set coverage expectations per identity type (roaming clients should be near 100% during business hours). Account for remote vs office workers. Track registration status alongside activity.',
      operationalValue: 'Umbrella is only effective for devices routing through it. Coverage gaps mean unprotected endpoints that can access malicious infrastructure without detection or prevention.',
      changeMgmtRelevance: 'Coverage changes follow roaming client deployments, VPN configuration changes, network architecture modifications, device decommissions, or Umbrella policy changes affecting identity matching.',
      troubleshootingWorkflow: '1. Identify which identities have gone silent\n2. Determine if devices are offline or routing DNS elsewhere\n3. Check roaming client status on affected endpoints\n4. Verify network configuration allows Umbrella DNS traffic\n5. Review VPN split-tunnel settings that might bypass Umbrella\n6. Remediate endpoint configurations to restore coverage',
      criblSearchQueries: [
        {
          name: 'Identity last seen analysis',
          description: 'Find identities that have stopped generating DNS queries indicating coverage gaps',
          query: 'dataset="$DATASET" earliest=-7d\n| summarize LastSeen=max(timestamp), TotalQueries=count() by identity, identity_type, data_center\n| where LastSeen < ago(24h)\n| order by LastSeen asc'
        },
        {
          name: 'Active identity count trending',
          description: 'Track the number of active identities over time to detect coverage drops',
          query: 'dataset="$DATASET" earliest=-7d\n| timestats span=1h active_identities=dcount(identity) by identity_type, data_center\n| order by active_identities desc'
        },
        {
          name: 'Coverage rate by location',
          description: 'Calculate Umbrella coverage percentage per office location or data center',
          query: 'dataset="$DATASET" earliest=-24h\n| summarize ActiveIdentities=dcount(identity), TotalQueries=count() by data_center, identity_type\n| order by ActiveIdentities desc'
        }
      ]
    },
    {
      id: 'obs-umbrella-006',
      name: 'Proxy Utilization',
      objective: 'Monitor Umbrella Intelligent Proxy inspection volume and throughput to ensure capacity is adequate and detect sudden increases that may require scaling or optimization.',
      category: 'Capacity',
      tags: ['observability', 'cisco', 'umbrella', 'proxy', 'capacity', 'utilization'],
      requiredFields: ['identity', 'query_domain', 'proxy_action', 'bytes_inspected', 'inspection_time_ms', 'content_type', 'timestamp'],
      detectionLogic: 'Track Intelligent Proxy inspection volume (connections, bytes inspected) over 15-minute windows. Alert when inspection volume exceeds 80% of provisioned capacity or when inspection latency degrades beyond SLA thresholds.',
      falsePositives: ['Legitimate large file downloads driving temporary proxy volume spikes', 'Software update cycles creating periodic inspection surges'],
      tuningGuidance: 'Baseline proxy utilization by time-of-day and day-of-week. Set capacity alerts at 80% to allow scaling time. Track content-type distribution for optimization opportunities.',
      operationalValue: 'Intelligent Proxy provides deep inspection for risky domains. Capacity exhaustion means traffic bypasses inspection, creating security gaps during peak periods.',
      changeMgmtRelevance: 'Proxy utilization changes follow policy expansions routing more traffic through inspection, new risky domain categorizations, content filter additions, or user growth.',
      troubleshootingWorkflow: '1. Identify current proxy utilization against capacity limits\n2. Determine what content types are consuming the most inspection capacity\n3. Check if policy changes are routing more traffic through proxy\n4. Assess if specific identities or domains are driving volume spikes\n5. Review optimization opportunities (bypass trusted domains)\n6. Plan capacity scaling if growth trends continue',
      criblSearchQueries: [
        {
          name: 'Proxy inspection volume',
          description: 'Track Intelligent Proxy inspection volume over time for capacity monitoring',
          query: 'dataset="$DATASET" proxy_action!="" earliest=-24h\n| timestats span=15m inspections=count(), total_bytes=sum(bytes_inspected), avg_inspection_time=avg(inspection_time_ms)\n| order by inspections desc'
        },
        {
          name: 'Proxy utilization by content type',
          description: 'Break down proxy capacity consumption by content type for optimization',
          query: 'dataset="$DATASET" proxy_action!="" earliest=-24h\n| summarize Inspections=count(), TotalBytes=sum(bytes_inspected), AvgLatency=avg(inspection_time_ms) by content_type\n| order by TotalBytes desc'
        },
        {
          name: 'Top proxy consumers',
          description: 'Identify identities consuming the most proxy inspection capacity',
          query: 'dataset="$DATASET" proxy_action!="" earliest=-24h\n| summarize Inspections=count(), BytesInspected=sum(bytes_inspected) by identity, identity_type\n| order by BytesInspected desc\n| limit 25'
        }
      ]
    },
    {
      id: 'obs-umbrella-007',
      name: 'Policy Hit Distribution',
      objective: 'Monitor which Umbrella policies trigger most frequently to understand policy effectiveness, identify over-triggered or under-triggered policies, and optimize rule ordering.',
      category: 'Health',
      tags: ['observability', 'cisco', 'umbrella', 'dns', 'policy', 'health'],
      requiredFields: ['identity', 'query_domain', 'policy_name', 'policy_id', 'action', 'categories', 'timestamp'],
      detectionLogic: 'Track policy hit counts over 1-hour windows and compare against baseline. Alert when a policy that normally triggers frequently drops to zero (indicating broken policy) or when a new policy starts generating unexpected volume.',
      falsePositives: ['Newly deployed policies ramping up hits as traffic matches', 'Policy changes intentionally redirecting traffic to different rules'],
      tuningGuidance: 'Monitor policy hit distribution weekly for rule cleanup opportunities. Track policies with zero hits for removal. Alert on top policy changes that shift traffic between rules.',
      operationalValue: 'Policy hit distribution reveals which rules are actively protecting the organization and which may be obsolete. Uneven distribution can indicate rule ordering issues or policy gaps.',
      changeMgmtRelevance: 'Policy hit changes follow rule additions/modifications, identity group membership changes, new application deployments matching different rules, or threat category updates.',
      troubleshootingWorkflow: '1. Review current policy hit distribution against baseline\n2. Identify policies with zero hits (candidates for removal)\n3. Check if high-hit policies are over-broad (could be refined)\n4. Verify new policies are triggering as expected\n5. Assess if rule ordering is optimal for common traffic patterns\n6. Document policy effectiveness metrics for review cycles',
      criblSearchQueries: [
        {
          name: 'Policy hit frequency',
          description: 'Rank policies by trigger frequency to identify most active rules',
          query: 'dataset="$DATASET" earliest=-24h\n| summarize Hits=count(), UniqueIdentities=dcount(identity), Actions=values(action) by policy_name, policy_id\n| order by Hits desc'
        },
        {
          name: 'Policy hit trending',
          description: 'Track policy trigger rates over time to detect changes in policy effectiveness',
          query: 'dataset="$DATASET" earliest=-7d\n| timestats span=1d hits=count() by policy_name\n| order by hits desc'
        },
        {
          name: 'Policy coverage analysis',
          description: 'Analyze which identities and categories each policy is processing',
          query: 'dataset="$DATASET" earliest=-24h\n| summarize Hits=count(), Categories=values(categories), IdentityTypes=values(identity_type) by policy_name, action\n| order by Hits desc'
        }
      ]
    }
  ],
  'checkpoint-fw': [
    {
      id: 'obs-cpfw-001',
      name: 'Connection Rate Trending',
      objective: 'Monitor connections per second per gateway to track capacity utilization, plan infrastructure scaling, and detect abnormal connection rate spikes.',
      category: 'Capacity',
      tags: ['observability', 'checkpoint', 'firewall', 'connections', 'capacity'],
      requiredFields: ['source_ip', 'destination_ip', 'action', 'rule_name', 'blade', 'gateway_name', 'bytes', 'timestamp'],
      detectionLogic: 'Track new connections per second per gateway in 5-minute windows. Alert when connection rate exceeds 80% of gateway rated capacity or when rate increases more than 50% above the 7-day baseline for that time period.',
      falsePositives: ['Legitimate traffic spikes during business peak hours', 'Planned load testing exercises generating high connection rates'],
      tuningGuidance: 'Set capacity thresholds per gateway model. Account for time-of-day patterns. Track connection rate alongside gateway CPU to correlate resource impact.',
      operationalValue: 'Connection rate is the primary capacity indicator for firewall gateways. Approaching limits causes connection drops and application failures that impact all users behind the gateway.',
      changeMgmtRelevance: 'Connection rate changes follow new application deployments, network architecture modifications, policy changes affecting connection handling, or user population growth.',
      troubleshootingWorkflow: '1. Identify which gateways show elevated connection rates\n2. Determine top sources and destinations driving the increase\n3. Check if a new application deployment is causing the spike\n4. Review gateway CPU and memory utilization\n5. Assess if connection table limits are being approached\n6. Plan capacity upgrades or traffic redistribution if trending up',
      criblSearchQueries: [
        {
          name: 'Connection rate per gateway',
          description: 'Track connections per time period per gateway for capacity monitoring',
          query: 'dataset="$DATASET" earliest=-24h\n| timestats span=5m connections=count() by gateway_name\n| order by connections desc'
        },
        {
          name: 'Connection rate baseline comparison',
          description: 'Compare current connection rates against 7-day rolling averages',
          query: 'dataset="$DATASET" earliest=-7d\n| timestats span=1h connections=count() by gateway_name\n| summarize AvgRate=avg(connections), MaxRate=max(connections), P95Rate=max(connections) by gateway_name\n| order by AvgRate desc'
        },
        {
          name: 'Top connection consumers',
          description: 'Identify sources generating the most connections for capacity attribution',
          query: 'dataset="$DATASET" earliest=-4h\n| summarize Connections=count(), UniqueDestinations=dcount(destination_ip) by source_ip, gateway_name\n| order by Connections desc\n| limit 25'
        }
      ]
    },
    {
      id: 'obs-cpfw-002',
      name: 'Blade Performance Impact',
      objective: 'Monitor latency added by inspection blades (IPS, Anti-Bot, Threat Emulation, HTTPS Inspection) to detect performance degradation caused by deep inspection operations.',
      category: 'Performance',
      tags: ['observability', 'checkpoint', 'firewall', 'blades', 'performance', 'latency'],
      requiredFields: ['blade', 'inspection_time_ms', 'gateway_name', 'action', 'source_ip', 'destination_ip', 'protocol', 'timestamp'],
      detectionLogic: 'Track inspection latency percentiles (p50, p95) per blade per gateway in 15-minute windows. Alert when p95 inspection latency exceeds blade-specific SLA thresholds or when latency increases 2x above the 24-hour baseline.',
      falsePositives: ['Large files requiring extended Threat Emulation sandbox time', 'Encrypted traffic spikes increasing HTTPS inspection load'],
      tuningGuidance: 'Set latency thresholds per blade type (IPS is faster than Threat Emulation). Exclude known large file transfers. Track blade CPU correlation with latency.',
      operationalValue: 'Inspection blade latency directly impacts user experience and application performance. Identifying which blades add the most latency enables optimization and capacity planning.',
      changeMgmtRelevance: 'Blade latency changes follow signature database updates, policy scope expansions, new HTTPS inspection rules, gateway hardware changes, or blade version upgrades.',
      troubleshootingWorkflow: '1. Identify which blade is adding the most latency\n2. Check if the gateway CPU is saturated by inspection workload\n3. Determine if specific traffic patterns trigger excessive inspection time\n4. Review if a recent signature update increased processing requirements\n5. Consider blade bypass rules for trusted traffic to reduce load\n6. Evaluate hardware upgrade needs or traffic redistribution',
      criblSearchQueries: [
        {
          name: 'Blade inspection latency',
          description: 'Track inspection time per blade to identify performance bottlenecks',
          query: 'dataset="$DATASET" inspection_time_ms > 0 earliest=-24h\n| timestats span=15m avg_latency=avg(inspection_time_ms), p95_latency=max(inspection_time_ms) by blade, gateway_name\n| order by p95_latency desc'
        },
        {
          name: 'Slowest inspections by blade',
          description: 'Find the highest latency inspection events for each blade',
          query: 'dataset="$DATASET" inspection_time_ms > 100 earliest=-4h\n| summarize MaxLatency=max(inspection_time_ms), AvgLatency=avg(inspection_time_ms), Count=count() by blade, gateway_name\n| order by MaxLatency desc'
        },
        {
          name: 'Blade latency trending',
          description: 'Track inspection latency trends over time to detect gradual degradation',
          query: 'dataset="$DATASET" inspection_time_ms > 0 earliest=-7d\n| timestats span=1h avg_latency=avg(inspection_time_ms), p95=max(inspection_time_ms) by blade\n| order by p95 desc'
        }
      ]
    },
    {
      id: 'obs-cpfw-003',
      name: 'Rule Hit Count Analysis',
      objective: 'Analyze firewall rule hit counts to identify unused or low-hit rules that are candidates for cleanup, simplifying the rule base and improving policy management.',
      category: 'Change Management',
      tags: ['observability', 'checkpoint', 'firewall', 'rules', 'change-management', 'optimization'],
      requiredFields: ['rule_name', 'rule_number', 'action', 'source_ip', 'destination_ip', 'gateway_name', 'bytes', 'timestamp'],
      detectionLogic: 'Aggregate rule hit counts over 30-day periods. Flag rules with zero hits for removal review. Track rules with declining hit counts trending toward zero. Report hit count distribution for policy optimization.',
      falsePositives: ['Disaster recovery rules that only trigger during failover events', 'Seasonal rules for periodic business processes'],
      tuningGuidance: 'Set minimum observation period before flagging rules (30 days recommended). Account for infrequent but critical rules (DR, seasonal). Include rule age in assessment.',
      operationalValue: 'Unused rules add complexity, increase policy push times, consume gateway resources during lookup, and represent security risks (stale rules may grant access no longer needed).',
      changeMgmtRelevance: 'Rule hit analysis directly feeds change management by identifying rules for cleanup. Results should feed into regular rule review cycles and decommission workflows.',
      troubleshootingWorkflow: '1. Export rule hit counts for the review period\n2. Identify zero-hit rules and determine their original purpose\n3. Verify with rule owners if zero-hit rules are still needed\n4. Check if traffic was redirected to different rules\n5. Schedule removal of confirmed unnecessary rules\n6. Document exceptions for rules that must remain despite low hits',
      criblSearchQueries: [
        {
          name: 'Rule hit distribution',
          description: 'Show hit counts for all rules to identify unused and over-used rules',
          query: 'dataset="$DATASET" earliest=-30d\n| summarize HitCount=count(), LastHit=max(timestamp), Sources=dcount(source_ip), Destinations=dcount(destination_ip) by rule_name, rule_number, action, gateway_name\n| order by HitCount asc'
        },
        {
          name: 'Zero-hit rules',
          description: 'Find rules with no traffic matches in the observation period for cleanup review',
          query: 'dataset="$DATASET" earliest=-30d\n| summarize HitCount=count() by rule_name, rule_number, gateway_name\n| where HitCount == 0\n| order by rule_number asc'
        },
        {
          name: 'Rule hit trending',
          description: 'Track rule activity over time to detect declining usage patterns',
          query: 'dataset="$DATASET" earliest=-30d\n| timestats span=1d hits=count() by rule_name, rule_number\n| order by hits asc'
        }
      ]
    },
    {
      id: 'obs-cpfw-004',
      name: 'Gateway Health Monitoring',
      objective: 'Monitor Check Point gateway CPU, memory, and throughput metrics to ensure infrastructure health and detect resource exhaustion before it impacts traffic processing.',
      category: 'Availability',
      tags: ['observability', 'checkpoint', 'firewall', 'gateway', 'health', 'availability'],
      requiredFields: ['gateway_name', 'cpu_percent', 'memory_percent', 'throughput_mbps', 'connections_active', 'connections_peak', 'timestamp'],
      detectionLogic: 'Track gateway resource metrics in 5-minute windows. Alert when CPU exceeds 80%, memory exceeds 85%, or throughput exceeds 75% of rated capacity. Correlate multiple metrics for compound alerts.',
      falsePositives: ['Transient CPU spikes during policy push operations', 'Memory increases from connection table growth during business peaks'],
      tuningGuidance: 'Set thresholds per gateway model and license tier. Account for policy push impact windows. Track metrics together — high CPU with high connections is normal, high CPU with low connections indicates a problem.',
      operationalValue: 'Gateway resource exhaustion causes traffic drops, inspection bypass, and potential outages. Proactive monitoring enables remediation before user impact.',
      changeMgmtRelevance: 'Resource utilization changes follow policy complexity increases, new blade activations, traffic growth, hardware maintenance, or cluster configuration changes.',
      troubleshootingWorkflow: '1. Identify which resource metric is approaching limits\n2. Correlate with connection rates and inspection load\n3. Check if a policy push recently increased processing overhead\n4. Determine if specific blades are consuming excess resources\n5. Review if traffic redistribution or blade optimization helps\n6. Plan hardware upgrade or cluster expansion if growth-driven',
      criblSearchQueries: [
        {
          name: 'Gateway resource utilization',
          description: 'Track CPU, memory, and throughput per gateway over time',
          query: 'dataset="$DATASET" cpu_percent > 0 earliest=-24h\n| timestats span=5m avg_cpu=avg(cpu_percent), avg_memory=avg(memory_percent), avg_throughput=avg(throughput_mbps) by gateway_name\n| order by avg_cpu desc'
        },
        {
          name: 'Gateway health alerts',
          description: 'Find time periods where gateway resources exceeded warning thresholds',
          query: 'dataset="$DATASET" earliest=-7d\n| where cpu_percent > 80 or memory_percent > 85\n| summarize HighCPU=countif(cpu_percent > 80), HighMem=countif(memory_percent > 85), MaxCPU=max(cpu_percent), MaxMem=max(memory_percent) by gateway_name\n| order by HighCPU desc'
        },
        {
          name: 'Gateway capacity trending',
          description: 'Track gateway resource trends over 30 days for capacity planning',
          query: 'dataset="$DATASET" earliest=-30d\n| timestats span=1d avg_cpu=avg(cpu_percent), peak_cpu=max(cpu_percent), avg_connections=avg(connections_active) by gateway_name\n| order by avg_cpu desc'
        }
      ]
    },
    {
      id: 'obs-cpfw-005',
      name: 'VPN Tunnel Health',
      objective: 'Monitor site-to-site VPN tunnel up/down status and performance metrics to detect tunnel failures and degradation before they impact inter-site connectivity.',
      category: 'Availability',
      tags: ['observability', 'checkpoint', 'firewall', 'vpn', 'tunnel', 'availability'],
      requiredFields: ['tunnel_name', 'tunnel_status', 'peer_gateway', 'gateway_name', 'tunnel_type', 'bytes_in', 'bytes_out', 'rekeying_time', 'timestamp'],
      detectionLogic: 'Monitor VPN tunnel status events and alert immediately on tunnel down transitions. Track tunnel flap frequency (up/down cycles) and data transfer rates. Alert when tunnels show zero traffic despite being in up state (possible routing issue).',
      falsePositives: ['Planned maintenance causing expected tunnel rebuilds', 'IKE rekeying events causing brief transition states'],
      tuningGuidance: 'Set flap thresholds per tunnel criticality. Critical site-to-site tunnels should alert on any down event. Less critical tunnels may tolerate brief outages during rekeying.',
      operationalValue: 'VPN tunnels carry inter-site business traffic. Failures isolate offices and data centers from shared resources. Early detection enables rapid failover or repair.',
      changeMgmtRelevance: 'Tunnel status changes follow IKE configuration modifications, certificate renewals, peer gateway maintenance, ISP changes affecting tunnel endpoints, or crypto policy updates.',
      troubleshootingWorkflow: '1. Confirm which tunnel is affected and its criticality\n2. Check the peer gateway status and reachability\n3. Review IKE/IPsec phase 1 and phase 2 negotiation status\n4. Verify certificates and pre-shared keys have not expired\n5. Check ISP connectivity between tunnel endpoints\n6. Initiate failover to backup tunnel if primary cannot recover',
      criblSearchQueries: [
        {
          name: 'VPN tunnel status events',
          description: 'Track VPN tunnel up/down transitions for availability monitoring',
          query: 'dataset="$DATASET" tunnel_status!="" earliest=-7d\n| summarize StatusChanges=count(), LastTimestamp=max(timestamp) by tunnel_name, peer_gateway, gateway_name\n| order by StatusChanges desc'
        },
        {
          name: 'Tunnel flap detection',
          description: 'Find tunnels with excessive status changes indicating instability',
          query: 'dataset="$DATASET" tunnel_status!="" earliest=-24h\n| summarize Flaps=count(), UpCount=countif(tunnel_status=="up"), DownCount=countif(tunnel_status=="down") by tunnel_name, peer_gateway\n| where Flaps > 4\n| order by Flaps desc'
        },
        {
          name: 'Tunnel traffic volume',
          description: 'Monitor data transfer rates per tunnel to detect zero-traffic anomalies',
          query: 'dataset="$DATASET" tunnel_name!="" earliest=-24h\n| timestats span=1h bytes_in=sum(bytes_in), bytes_out=sum(bytes_out) by tunnel_name, peer_gateway\n| order by bytes_in desc'
        }
      ]
    },
    {
      id: 'obs-cpfw-006',
      name: 'NAT Table Utilization',
      objective: 'Monitor NAT translation table utilization to detect when the table approaches maximum capacity, which would cause new connections to fail.',
      category: 'Capacity',
      tags: ['observability', 'checkpoint', 'firewall', 'nat', 'capacity', 'translation'],
      requiredFields: ['gateway_name', 'nat_entries', 'nat_max', 'nat_utilization_pct', 'nat_rule', 'source_ip', 'translated_ip', 'timestamp'],
      detectionLogic: 'Track NAT table entries against maximum capacity per gateway. Alert when utilization exceeds 75% of the configured maximum. Track entry growth rate to predict when limits will be reached.',
      falsePositives: ['Business peak hours naturally increasing NAT entries', 'Scheduled batch processes creating many short-lived translated connections'],
      tuningGuidance: 'Set thresholds per gateway based on configured NAT table size. Track utilization alongside connection table metrics. Alert progressively at 75%, 85%, and 95% utilization.',
      operationalValue: 'NAT table exhaustion causes all new connections requiring translation to fail. This impacts all users behind NAT policies and typically causes widespread application failures.',
      changeMgmtRelevance: 'NAT utilization changes follow new NAT policies, user population growth, application deployments increasing connection counts, or NAT table size configuration changes.',
      troubleshootingWorkflow: '1. Identify current NAT table utilization across gateways\n2. Determine which NAT rules consume the most entries\n3. Check for connection leaks (entries not being cleaned up)\n4. Identify if specific sources are consuming excessive NAT entries\n5. Review NAT table timeout settings for optimization\n6. Increase NAT table maximum or add capacity if growth-driven',
      criblSearchQueries: [
        {
          name: 'NAT table utilization',
          description: 'Track NAT table entries and utilization percentage over time',
          query: 'dataset="$DATASET" nat_entries > 0 earliest=-24h\n| timestats span=15m entries=max(nat_entries), utilization_pct=max(nat_utilization_pct) by gateway_name\n| order by utilization_pct desc'
        },
        {
          name: 'Top NAT consumers',
          description: 'Identify sources consuming the most NAT table entries',
          query: 'dataset="$DATASET" earliest=-4h\n| summarize NATEntries=count(), UniqueTranslations=dcount(translated_ip) by source_ip, nat_rule, gateway_name\n| order by NATEntries desc\n| limit 25'
        },
        {
          name: 'NAT utilization trending',
          description: 'Track NAT table growth over 30 days for capacity planning',
          query: 'dataset="$DATASET" nat_entries > 0 earliest=-30d\n| timestats span=1d peak_entries=max(nat_entries), avg_entries=avg(nat_entries), peak_utilization=max(nat_utilization_pct) by gateway_name\n| order by peak_utilization desc'
        }
      ]
    },
    {
      id: 'obs-cpfw-007',
      name: 'Policy Push Success Rate',
      objective: 'Monitor firewall policy installation success and failure rates across gateways to ensure configuration changes are applied consistently and detect push failures requiring intervention.',
      category: 'Reliability',
      tags: ['observability', 'checkpoint', 'firewall', 'policy', 'reliability', 'deployment'],
      requiredFields: ['gateway_name', 'policy_name', 'push_status', 'push_duration_sec', 'admin_user', 'error_message', 'timestamp'],
      detectionLogic: 'Track policy push events and their success/failure status per gateway. Alert immediately on any push failure. Track push duration and alert when it exceeds 2x the baseline, indicating policy complexity issues.',
      falsePositives: ['Transient network connectivity issues during push causing retryable failures', 'Gateway maintenance mode blocking policy installation'],
      tuningGuidance: 'Set push duration thresholds per gateway model and policy size. Track failure patterns to identify consistently problematic gateways. Alert on any failure but prioritize production gateways.',
      operationalValue: 'Policy push failures leave gateways running stale configurations that may not include critical security rules. Inconsistent policy across gateways creates security gaps.',
      changeMgmtRelevance: 'Policy push directly follows change management activities. Monitoring push success validates that approved changes were successfully deployed to all target gateways.',
      troubleshootingWorkflow: '1. Identify which gateway(s) failed the policy push\n2. Review the error message for root cause\n3. Check gateway connectivity and management interface status\n4. Verify the policy compiles without errors on the management server\n5. Attempt manual policy push with verbose logging\n6. If persistent, check gateway disk space, CPU, and SIC status',
      criblSearchQueries: [
        {
          name: 'Policy push status overview',
          description: 'Track policy installation success and failure rates across all gateways',
          query: 'dataset="$DATASET" push_status!="" earliest=-7d\n| summarize Pushes=count(), Successes=countif(push_status=="success"), Failures=countif(push_status=="failed") by gateway_name, policy_name\n| extend SuccessRate=round(Successes * 100.0 / Pushes, 2)\n| order by Failures desc'
        },
        {
          name: 'Policy push failures',
          description: 'Find failed policy installations with error details for troubleshooting',
          query: 'dataset="$DATASET" push_status="failed" earliest=-7d\n| summarize Failures=count(), Errors=values(error_message), Admins=values(admin_user) by gateway_name, policy_name\n| order by Failures desc'
        },
        {
          name: 'Policy push duration trending',
          description: 'Track how long policy installations take to detect complexity-driven degradation',
          query: 'dataset="$DATASET" push_status="success" push_duration_sec > 0 earliest=-30d\n| timestats span=1d avg_duration=avg(push_duration_sec), max_duration=max(push_duration_sec) by gateway_name\n| order by avg_duration desc'
        }
      ]
    }
  ],
  'cisco-asa': [
    {
      id: 'obs-asa-001',
      name: 'Connection Table Utilization',
      objective: 'Monitor active connections versus maximum connection table (xlate) capacity to detect when the ASA approaches connection limits that would cause new connections to be dropped.',
      category: 'Capacity',
      tags: ['observability', 'cisco', 'asa', 'connections', 'capacity', 'xlate'],
      requiredFields: ['device_name', 'active_connections', 'max_connections', 'xlate_entries', 'interface', 'timestamp'],
      detectionLogic: 'Track active connection count against the maximum allowed connections per ASA. Alert when utilization exceeds 75% of maximum capacity. Monitor growth rate to predict when limits will be reached and enable proactive scaling.',
      falsePositives: ['Business peak hours naturally increasing connection counts', 'Batch processing windows creating predictable connection spikes'],
      tuningGuidance: 'Set thresholds per ASA model (max connections vary by platform). Track per-interface utilization separately. Alert progressively at 75%, 85%, and 95% capacity.',
      operationalValue: 'Connection table exhaustion causes all new connections to be silently dropped. This creates widespread application failures that are difficult to diagnose without proactive monitoring.',
      changeMgmtRelevance: 'Connection utilization changes follow new application deployments, user population growth, timeout configuration changes, or traffic pattern shifts from network modifications.',
      troubleshootingWorkflow: '1. Verify current connection table utilization percentage\n2. Identify top consumers of connection table entries\n3. Review connection timeout settings for optimization\n4. Check for connection leaks (half-open or stuck connections)\n5. Determine if a new application is consuming excessive connections\n6. Plan ASA upgrade or connection limit increase if growth-driven',
      criblSearchQueries: [
        {
          name: 'Connection table utilization',
          description: 'Track active connections versus maximum capacity per ASA',
          query: 'dataset="$DATASET" active_connections > 0 earliest=-24h\n| timestats span=15m peak_connections=max(active_connections), avg_connections=avg(active_connections) by device_name\n| extend utilization_pct=round(peak_connections * 100.0 / max_connections, 2)\n| order by utilization_pct desc'
        },
        {
          name: 'Connection growth trending',
          description: 'Track connection table growth over 30 days for capacity planning',
          query: 'dataset="$DATASET" active_connections > 0 earliest=-30d\n| timestats span=1d peak=max(active_connections), average=avg(active_connections) by device_name\n| order by peak desc'
        },
        {
          name: 'Connection consumers',
          description: 'Identify sources consuming the most connection table entries',
          query: 'dataset="$DATASET" earliest=-4h\n| summarize Connections=count(), UniqueDestinations=dcount(destination_ip), UniquePorts=dcount(destination_port) by source_ip, device_name, interface\n| order by Connections desc\n| limit 25'
        }
      ]
    },
    {
      id: 'obs-asa-002',
      name: 'VPN Concurrent Sessions',
      objective: 'Monitor AnyConnect VPN concurrent session counts against license limits to prevent session rejections and plan license capacity proactively.',
      category: 'Capacity',
      tags: ['observability', 'cisco', 'asa', 'vpn', 'anyconnect', 'capacity', 'licensing'],
      requiredFields: ['device_name', 'vpn_sessions_active', 'vpn_sessions_max', 'message_id', 'user', 'group_policy', 'timestamp'],
      detectionLogic: 'Track active AnyConnect sessions against licensed maximum. Alert when session count exceeds 80% of license capacity. Monitor session growth rate during business hours to predict peak utilization and license exhaustion.',
      falsePositives: ['Planned all-hands events temporarily spiking VPN usage', 'Emergency remote work scenarios intentionally exceeding normal patterns'],
      tuningGuidance: 'Set thresholds based on licensed session maximum. Track by group_policy for per-group limits. Account for time zones when baseline spans global users.',
      operationalValue: 'Exceeding VPN license limits causes new connections to be rejected, preventing employees from working remotely. Proactive monitoring enables license expansion before disruption.',
      changeMgmtRelevance: 'VPN session counts change with remote work policies, office openings/closures, seasonal patterns, license additions, and group policy modifications affecting session limits.',
      troubleshootingWorkflow: '1. Verify current VPN session count against license maximum\n2. Check which group policies are consuming the most sessions\n3. Identify if sessions are being held by disconnected/idle users\n4. Review idle timeout settings for optimization\n5. Determine if emergency license expansion is needed\n6. Consider load balancing across multiple VPN headends',
      criblSearchQueries: [
        {
          name: 'VPN session utilization',
          description: 'Track concurrent VPN sessions against license capacity',
          query: 'dataset="$DATASET" vpn_sessions_active > 0 earliest=-7d\n| timestats span=15m peak_sessions=max(vpn_sessions_active) by device_name\n| extend utilization_pct=round(peak_sessions * 100.0 / vpn_sessions_max, 2)\n| order by utilization_pct desc'
        },
        {
          name: 'VPN sessions by group policy',
          description: 'Break down VPN session consumption by group policy for capacity attribution',
          query: 'dataset="$DATASET" message_id="722022" earliest=-24h\n| summarize Sessions=count(), UniqueUsers=dcount(user) by group_policy, device_name\n| order by Sessions desc'
        },
        {
          name: 'VPN session peak prediction',
          description: 'Analyze VPN session growth trends for license capacity planning',
          query: 'dataset="$DATASET" vpn_sessions_active > 0 earliest=-30d\n| timestats span=1d daily_peak=max(vpn_sessions_active) by device_name\n| order by daily_peak desc'
        }
      ]
    },
    {
      id: 'obs-asa-003',
      name: 'Denied Traffic Trending',
      objective: 'Monitor deny event rates over time per interface to establish baselines, detect anomalies, and identify changes in traffic patterns that may require policy adjustments.',
      category: 'Health',
      tags: ['observability', 'cisco', 'asa', 'denied', 'trending', 'health'],
      requiredFields: ['source_ip', 'destination_ip', 'destination_port', 'message_id', 'action', 'access_group', 'interface', 'device_name', 'timestamp'],
      detectionLogic: 'Track denied connection rates per interface and access-group in 15-minute windows. Alert when deny rate exceeds 2x the 7-day baseline for the same time period. Track deny reasons (message IDs) for root cause categorization.',
      falsePositives: ['Vulnerability scan schedules creating predictable deny spikes', 'Network migrations temporarily increasing denied traffic'],
      tuningGuidance: 'Baseline deny rates per interface and access-group separately. Account for scan schedules and maintenance windows. Track deny message ID distribution for pattern recognition.',
      operationalValue: 'Deny rate trending reveals infrastructure health, policy effectiveness, and traffic pattern changes. Sudden increases indicate problems; gradual increases indicate growth or drift.',
      changeMgmtRelevance: 'Deny rate changes follow ACL modifications, routing changes redirecting traffic, new application deployments, decommissions leaving stale routes, or scanning schedule changes.',
      troubleshootingWorkflow: '1. Identify which interfaces and access-groups show deny rate changes\n2. Determine the top message IDs driving the increase\n3. Check if a recent ACL or routing change explains the pattern\n4. Review whether the denies represent new or displaced traffic\n5. Assess if policy changes are needed or if current denies are correct\n6. Update monitoring baselines after intentional changes',
      criblSearchQueries: [
        {
          name: 'Deny rate per interface',
          description: 'Track denied connection rates per interface over time',
          query: 'dataset="$DATASET" action="deny" earliest=-7d\n| timestats span=1h denies=count() by interface, device_name\n| order by denies desc'
        },
        {
          name: 'Deny reasons by message ID',
          description: 'Break down deny events by message ID for root cause categorization',
          query: 'dataset="$DATASET" action="deny" earliest=-24h\n| summarize DenyCount=count(), Sources=dcount(source_ip), Destinations=dcount(destination_ip) by message_id, access_group, interface\n| order by DenyCount desc'
        },
        {
          name: 'Deny rate anomaly detection',
          description: 'Identify interfaces with deny rates significantly above their baseline',
          query: 'dataset="$DATASET" action="deny" earliest=-24h\n| timestats span=15m denies=count() by interface, access_group\n| summarize AvgDenies=avg(denies), MaxDenies=max(denies), P95Denies=max(denies) by interface, access_group\n| order by P95Denies desc'
        }
      ]
    },
    {
      id: 'obs-asa-004',
      name: 'Failover Status Monitoring',
      objective: 'Monitor ASA primary/secondary failover state changes to ensure high availability is maintained and detect unexpected state transitions requiring investigation.',
      category: 'Availability',
      tags: ['observability', 'cisco', 'asa', 'failover', 'availability', 'ha'],
      requiredFields: ['device_name', 'message_id', 'failover_state', 'failover_reason', 'peer_state', 'interface', 'timestamp'],
      detectionLogic: 'Monitor failover status messages (105032, 105043, 105044, 105045) and alert on any state transition. Track time between state changes to detect flapping. Alert when both units report standby (split-brain scenario).',
      falsePositives: ['Planned maintenance failover operations', 'Firmware upgrades requiring controlled failover'],
      tuningGuidance: 'Integrate with change management calendar for planned failover suppression. Alert immediately on unplanned state changes. Track failover frequency per device pair.',
      operationalValue: 'Failover state changes indicate either planned maintenance or infrastructure problems. Unplanned failovers may indicate hardware failure, software crashes, or interface issues that threaten availability.',
      changeMgmtRelevance: 'Failover events correlate with firmware upgrades, configuration changes, interface maintenance, or hardware replacement activities in the change management system.',
      troubleshootingWorkflow: '1. Determine if the failover was planned (check change calendar)\n2. Identify the failover reason from the message details\n3. Verify the new active unit is processing traffic correctly\n4. Check interface status on both units\n5. Review if the failed unit can be recovered\n6. Investigate root cause for unplanned failovers',
      criblSearchQueries: [
        {
          name: 'Failover state transitions',
          description: 'Track all failover state changes for availability monitoring',
          query: 'dataset="$DATASET" message_id in ("105032", "105043", "105044", "105045") earliest=-30d\n| summarize StateChanges=count(), Reasons=values(failover_reason), States=values(failover_state) by device_name\n| order by StateChanges desc'
        },
        {
          name: 'Failover frequency',
          description: 'Detect failover flapping by measuring state change frequency',
          query: 'dataset="$DATASET" message_id in ("105032", "105043") earliest=-7d\n| timestats span=1d failover_events=count() by device_name\n| where failover_events > 0\n| order by failover_events desc'
        },
        {
          name: 'Failover interface health',
          description: 'Monitor interfaces involved in failover events for underlying issues',
          query: 'dataset="$DATASET" message_id in ("105032", "105043", "411001", "411002") earliest=-7d\n| summarize Events=count(), MessageTypes=values(message_id) by device_name, interface\n| order by Events desc'
        }
      ]
    },
    {
      id: 'obs-asa-005',
      name: 'Interface Throughput Trending',
      objective: 'Monitor bytes per second per ASA interface to track bandwidth utilization, identify capacity bottlenecks, and plan infrastructure upgrades.',
      category: 'Capacity',
      tags: ['observability', 'cisco', 'asa', 'interface', 'throughput', 'capacity', 'bandwidth'],
      requiredFields: ['device_name', 'interface', 'bytes_in', 'bytes_out', 'packets_in', 'packets_out', 'timestamp'],
      detectionLogic: 'Track bytes per second per interface in 5-minute windows. Alert when any interface exceeds 70% of its rated capacity. Monitor growth trends and predict when capacity limits will be reached at current growth rates.',
      falsePositives: ['Known backup windows causing legitimate throughput spikes', 'Planned data migration activities temporarily saturating interfaces'],
      tuningGuidance: 'Set capacity thresholds per interface speed (1G, 10G, etc.). Account for asymmetric traffic patterns. Track both inbound and outbound independently as they have different capacity impacts.',
      operationalValue: 'Interface saturation causes packet drops, retransmissions, and degraded application performance. Proactive throughput monitoring enables capacity planning before degradation occurs.',
      changeMgmtRelevance: 'Throughput changes follow application deployments, traffic re-routing, interface upgrades, new site connectivity, or migration activities.',
      troubleshootingWorkflow: '1. Identify which interface is approaching capacity\n2. Determine if traffic is asymmetric (inbound vs outbound)\n3. Identify top traffic contributors (source/destination pairs)\n4. Check if a new application or migration is driving the increase\n5. Assess if traffic can be redistributed across multiple interfaces\n6. Plan interface speed upgrade or additional links if growth-driven',
      criblSearchQueries: [
        {
          name: 'Interface throughput per device',
          description: 'Track bytes per second per interface for bandwidth monitoring',
          query: 'dataset="$DATASET" bytes_in > 0 earliest=-24h\n| timestats span=5m bytes_in=sum(bytes_in), bytes_out=sum(bytes_out) by device_name, interface\n| extend total_mbps=round((bytes_in + bytes_out) * 8 / 300 / 1000000, 2)\n| order by total_mbps desc'
        },
        {
          name: 'Interface utilization peaks',
          description: 'Find peak throughput periods for capacity planning',
          query: 'dataset="$DATASET" bytes_in > 0 earliest=-7d\n| timestats span=1h total_bytes=sum(bytes_in + bytes_out) by device_name, interface\n| summarize PeakBytes=max(total_bytes), AvgBytes=avg(total_bytes) by device_name, interface\n| order by PeakBytes desc'
        },
        {
          name: 'Interface throughput growth',
          description: 'Track interface throughput trends over 30 days for growth planning',
          query: 'dataset="$DATASET" bytes_in > 0 earliest=-30d\n| timestats span=1d daily_bytes=sum(bytes_in + bytes_out) by device_name, interface\n| order by daily_bytes desc'
        }
      ]
    },
    {
      id: 'obs-asa-006',
      name: 'Syslog Drop Rate',
      objective: 'Monitor ASA syslog message drops due to buffer overflow to ensure complete visibility and detect logging infrastructure issues that create monitoring blind spots.',
      category: 'Reliability',
      tags: ['observability', 'cisco', 'asa', 'syslog', 'drops', 'reliability', 'logging'],
      requiredFields: ['device_name', 'message_id', 'messages_dropped', 'buffer_utilization', 'logging_destination', 'timestamp'],
      detectionLogic: 'Track syslog messages dropped (message ID 414003, 414004) and buffer utilization per ASA. Alert when any drops are detected as this indicates lost security and operational visibility. Monitor drop rate trending to detect degradation.',
      falsePositives: ['Brief drops during syslog server maintenance or restart', 'Initial buffer overflow during high-volume events before auto-scaling'],
      tuningGuidance: 'Any syslog drops represent lost visibility and should be investigated. Set buffer sizes appropriate for peak traffic. Ensure logging destinations can handle peak event rates.',
      operationalValue: 'Dropped syslog messages mean lost security events and operational data. This creates blind spots in monitoring, compliance gaps in audit trails, and missed security detections.',
      changeMgmtRelevance: 'Syslog drop rates change with logging configuration modifications, syslog server capacity changes, buffer size adjustments, or traffic increases generating more events than the pipeline can handle.',
      troubleshootingWorkflow: '1. Identify which ASAs are dropping syslog messages\n2. Check buffer utilization and logging destination health\n3. Verify syslog server capacity and receive rate\n4. Review if event volume increased (more deny events, new logging rules)\n5. Increase buffer sizes or add logging destinations\n6. Optimize logging levels to reduce volume without losing critical events',
      criblSearchQueries: [
        {
          name: 'Syslog drop events',
          description: 'Find syslog message drop events indicating lost visibility',
          query: 'dataset="$DATASET" message_id in ("414003", "414004") earliest=-7d\n| summarize DropEvents=count(), TotalDropped=sum(messages_dropped) by device_name, logging_destination\n| order by TotalDropped desc'
        },
        {
          name: 'Syslog drop rate trending',
          description: 'Track syslog message drop rates over time to detect degradation',
          query: 'dataset="$DATASET" message_id in ("414003", "414004") earliest=-30d\n| timestats span=1d dropped_messages=sum(messages_dropped) by device_name\n| where dropped_messages > 0\n| order by dropped_messages desc'
        },
        {
          name: 'Buffer utilization monitoring',
          description: 'Monitor logging buffer health across ASA fleet',
          query: 'dataset="$DATASET" buffer_utilization > 0 earliest=-24h\n| timestats span=15m peak_buffer=max(buffer_utilization), avg_buffer=avg(buffer_utilization) by device_name\n| where peak_buffer > 70\n| order by peak_buffer desc'
        }
      ]
    },
    {
      id: 'obs-asa-007',
      name: 'Connection Duration Baseline',
      objective: 'Monitor average connection duration by service type to establish baselines, detect protocol anomalies, and identify application behavior changes that may indicate performance issues.',
      category: 'Performance',
      tags: ['observability', 'cisco', 'asa', 'connections', 'duration', 'performance', 'baseline'],
      requiredFields: ['device_name', 'source_ip', 'destination_ip', 'destination_port', 'protocol', 'duration_sec', 'bytes_sent', 'bytes_received', 'message_id', 'timestamp'],
      detectionLogic: 'Calculate average and percentile connection durations by destination port/service. Alert when average duration deviates more than 2x from the 7-day baseline, indicating application slowness (longer) or connection drops (shorter).',
      falsePositives: ['Long-running database connections legitimately extending averages', 'Batch processing windows changing connection duration patterns'],
      tuningGuidance: 'Baseline duration per service type (HTTP, SSH, database, etc.). Set different thresholds per protocol — HTTP should be short-lived, SSH may be long-lived. Track alongside bytes transferred for context.',
      operationalValue: 'Connection duration changes reveal application performance issues, network problems causing premature terminations, and infrastructure changes affecting traffic patterns.',
      changeMgmtRelevance: 'Duration baseline changes follow application updates affecting response times, timeout configuration changes, network latency shifts, or load balancer modifications.',
      troubleshootingWorkflow: '1. Identify which services show duration anomalies\n2. Determine if connections are longer (slowness) or shorter (drops) than baseline\n3. Check if destination services are experiencing performance issues\n4. Review timeout settings for the affected protocol\n5. Correlate with application monitoring for root cause\n6. Adjust baselines after intentional application changes',
      criblSearchQueries: [
        {
          name: 'Connection duration by service',
          description: 'Calculate average connection duration per destination port for baselining',
          query: 'dataset="$DATASET" duration_sec > 0 earliest=-24h\n| summarize AvgDuration=avg(duration_sec), P95Duration=max(duration_sec), Connections=count() by destination_port, protocol, device_name\n| where Connections > 100\n| order by AvgDuration desc'
        },
        {
          name: 'Duration anomalies',
          description: 'Find services with connection durations significantly different from baseline',
          query: 'dataset="$DATASET" duration_sec > 0 earliest=-4h\n| summarize AvgDuration=avg(duration_sec), MaxDuration=max(duration_sec), Connections=count() by destination_port, destination_ip\n| where AvgDuration > 300 and Connections > 10\n| order by AvgDuration desc'
        },
        {
          name: 'Duration trending',
          description: 'Track connection duration trends over time to detect gradual changes',
          query: 'dataset="$DATASET" duration_sec > 0 earliest=-7d\n| timestats span=1h avg_duration=avg(duration_sec), p95_duration=max(duration_sec) by destination_port\n| order by avg_duration desc'
        }
      ]
    }
  ],
  'cisco-ise': [
    {
      id: 'obs-ise-001',
      name: 'Authentication Latency',
      objective: 'Monitor RADIUS authentication response time per Policy Service Node (PSN) to detect processing delays that impact user network access experience and application availability.',
      category: 'Performance',
      tags: ['observability', 'cisco', 'ise', 'radius', 'latency', 'performance', 'psn'],
      requiredFields: ['psn_name', 'auth_latency_ms', 'auth_method', 'auth_result', 'username', 'nas_ip', 'timestamp'],
      detectionLogic: 'Track RADIUS response time percentiles (p50, p95, p99) per PSN in 5-minute windows. Alert when p95 latency exceeds 500ms or when any PSN shows latency 2x above its 24-hour baseline, indicating processing degradation.',
      falsePositives: ['Certificate validation delays during CRL checks', 'External identity source (AD) latency causing cascading delays'],
      tuningGuidance: 'Baseline latency per PSN and authentication method. EAP-TLS is typically slower than MAB. Set different thresholds per auth method. Track PSN CPU correlation with latency.',
      operationalValue: 'Authentication latency directly impacts user experience — slow RADIUS responses cause network access delays, supplicant timeouts, and failed authentications. Monitoring enables remediation before widespread impact.',
      changeMgmtRelevance: 'Latency changes follow PSN deployments, policy complexity increases, identity source changes, certificate authority updates, or ISE version upgrades.',
      troubleshootingWorkflow: '1. Identify which PSN(s) show elevated latency\n2. Check PSN resource utilization (CPU, memory, disk I/O)\n3. Determine if latency is for all auth methods or specific ones\n4. Review external identity source response times (AD, LDAP)\n5. Check if recent policy changes added processing complexity\n6. Redistribute load across PSNs or scale if capacity-driven',
      criblSearchQueries: [
        {
          name: 'Authentication latency per PSN',
          description: 'Track RADIUS response time percentiles per Policy Service Node',
          query: 'dataset="$DATASET" auth_latency_ms > 0 earliest=-24h\n| timestats span=15m avg_latency=avg(auth_latency_ms), p95_latency=max(auth_latency_ms) by psn_name\n| order by p95_latency desc'
        },
        {
          name: 'Slow authentication events',
          description: 'Find individual authentication events with high latency for root cause analysis',
          query: 'dataset="$DATASET" auth_latency_ms > 500 earliest=-4h\n| summarize SlowAuths=count(), AvgLatency=avg(auth_latency_ms), MaxLatency=max(auth_latency_ms) by psn_name, auth_method, nas_ip\n| order by MaxLatency desc'
        },
        {
          name: 'Latency by authentication method',
          description: 'Compare authentication latency across methods to identify protocol-specific issues',
          query: 'dataset="$DATASET" auth_latency_ms > 0 earliest=-24h\n| summarize AvgLatency=avg(auth_latency_ms), P95=max(auth_latency_ms), AuthCount=count() by auth_method, psn_name\n| order by P95 desc'
        }
      ]
    },
    {
      id: 'obs-ise-002',
      name: 'Authentication Success Rate',
      objective: 'Monitor RADIUS authentication pass versus fail rates by policy set to track NAC health, identify problematic policies, and detect widespread authentication issues.',
      category: 'Reliability',
      tags: ['observability', 'cisco', 'ise', 'authentication', 'success-rate', 'reliability'],
      requiredFields: ['auth_result', 'auth_policy', 'failure_reason', 'username', 'mac_address', 'nas_ip', 'psn_name', 'timestamp'],
      detectionLogic: 'Calculate authentication success rate per policy set in 15-minute windows. Alert when success rate drops below 95% (or policy-specific threshold). Track failure reason distribution to identify systemic issues versus individual endpoint problems.',
      falsePositives: ['Mass certificate expiration events causing temporary failure spikes', 'AD outage affecting all domain-joined authentication'],
      tuningGuidance: 'Set success rate thresholds per policy set (guest may have lower baseline than corporate). Track failure reasons to distinguish policy issues from endpoint issues. Alert on rate changes rather than absolute thresholds for some policies.',
      operationalValue: 'Authentication success rate is the primary health indicator for network access control. Declining rates mean users cannot access the network, directly impacting productivity.',
      changeMgmtRelevance: 'Success rate changes follow policy modifications, identity source changes, certificate renewals, NAS device updates, or supplicant configuration changes pushed to endpoints.',
      troubleshootingWorkflow: '1. Identify which policy set shows declining success rate\n2. Review top failure reasons for that policy\n3. Determine if failures are from many endpoints or concentrated\n4. Check identity source (AD, certificate authority) health\n5. Verify recent policy changes that may have broken authentication\n6. Remediate the root cause and monitor recovery',
      criblSearchQueries: [
        {
          name: 'Auth success rate by policy',
          description: 'Calculate authentication pass/fail rates per policy set for health monitoring',
          query: 'dataset="$DATASET" earliest=-24h\n| summarize Total=count(), Passed=countif(auth_result=="pass"), Failed=countif(auth_result=="fail") by auth_policy\n| extend SuccessRate=round(Passed * 100.0 / Total, 2)\n| order by SuccessRate asc'
        },
        {
          name: 'Failure reason distribution',
          description: 'Analyze authentication failure reasons to identify systemic issues',
          query: 'dataset="$DATASET" auth_result="fail" earliest=-24h\n| summarize FailCount=count(), Endpoints=dcount(mac_address), Users=dcount(username) by failure_reason, auth_policy\n| order by FailCount desc'
        },
        {
          name: 'Auth success rate trending',
          description: 'Track authentication success rates over time to detect degradation',
          query: 'dataset="$DATASET" earliest=-7d\n| timestats span=1h total=count(), passed=countif(auth_result=="pass") by auth_policy\n| extend success_rate=round(passed * 100.0 / total, 2)\n| order by success_rate asc'
        }
      ]
    },
    {
      id: 'obs-ise-003',
      name: 'Endpoint Profiling Coverage',
      objective: 'Monitor the percentage of network endpoints that have been successfully profiled by ISE to identify gaps in device classification that may affect policy enforcement.',
      category: 'Health',
      tags: ['observability', 'cisco', 'ise', 'profiling', 'coverage', 'health', 'endpoints'],
      requiredFields: ['mac_address', 'endpoint_profile', 'profiling_method', 'profiling_confidence', 'first_seen', 'last_seen', 'timestamp'],
      detectionLogic: 'Calculate the percentage of authenticated endpoints with a valid endpoint profile versus those classified as "Unknown" or unprofiledn. Alert when profiling coverage drops below 90% or when the unknown endpoint count increases significantly.',
      falsePositives: ['New device types not yet added to profiling policies', 'Firmware updates changing device characteristics temporarily'],
      tuningGuidance: 'Set profiling coverage targets per network segment. Production networks should have higher coverage than guest. Track profiling confidence levels alongside coverage.',
      operationalValue: 'Endpoint profiling drives authorization policy decisions. Unprofiled endpoints may receive incorrect network access, either too permissive (security risk) or too restrictive (user impact).',
      changeMgmtRelevance: 'Profiling coverage changes follow new device deployments, profiling policy updates, probe configuration changes, or ISE upgrade modifications to profiling behavior.',
      troubleshootingWorkflow: '1. Identify the current profiling coverage percentage\n2. Review unprofiled endpoints — what device types are they?\n3. Check if profiling probes (DHCP, HTTP, RADIUS) are functioning\n4. Determine if new device types need custom profiles created\n5. Review profiling confidence levels for existing profiles\n6. Add custom profiling rules for unclassified device types',
      criblSearchQueries: [
        {
          name: 'Profiling coverage overview',
          description: 'Calculate endpoint profiling coverage percentage across the network',
          query: 'dataset="$DATASET" earliest=-24h\n| summarize Total=dcount(mac_address), Profiled=dcountif(mac_address, endpoint_profile!="" and endpoint_profile!="Unknown"), Unknown=dcountif(mac_address, endpoint_profile=="" or endpoint_profile=="Unknown")\n| extend CoverageRate=round(Profiled * 100.0 / Total, 2)'
        },
        {
          name: 'Unprofiled endpoints',
          description: 'List endpoints without valid profiles for investigation and remediation',
          query: 'dataset="$DATASET" earliest=-7d\n| where endpoint_profile=="" or endpoint_profile=="Unknown"\n| summarize LastSeen=max(timestamp), AuthCount=count() by mac_address, profiling_method\n| order by AuthCount desc\n| limit 50'
        },
        {
          name: 'Profiling coverage trending',
          description: 'Track profiling coverage changes over time to detect degradation',
          query: 'dataset="$DATASET" earliest=-30d\n| timestats span=1d total_endpoints=dcount(mac_address), profiled_endpoints=dcountif(mac_address, endpoint_profile!="" and endpoint_profile!="Unknown")\n| extend coverage_pct=round(profiled_endpoints * 100.0 / total_endpoints, 2)\n| order by timestamp'
        }
      ]
    },
    {
      id: 'obs-ise-004',
      name: 'Posture Compliance Rate',
      objective: 'Monitor the ratio of posture-compliant versus non-compliant endpoints to track security hygiene health and identify compliance degradation across the device population.',
      category: 'Health',
      tags: ['observability', 'cisco', 'ise', 'posture', 'compliance', 'health', 'hygiene'],
      requiredFields: ['mac_address', 'username', 'posture_status', 'posture_policy', 'compliance_details', 'assigned_vlan', 'timestamp'],
      detectionLogic: 'Calculate posture compliance percentage across all assessed endpoints in rolling 4-hour windows. Alert when compliance rate drops below 85% or decreases more than 10 percentage points from the 7-day baseline, indicating widespread compliance issues.',
      falsePositives: ['Patch Tuesday causing temporary non-compliance before remediation completes', 'New posture requirement rollouts before endpoints can comply'],
      tuningGuidance: 'Set compliance thresholds per posture policy (corporate devices vs BYOD). Account for patch deployment cycles. Track compliance by operating system and device type separately.',
      operationalValue: 'Posture compliance rate reflects the overall security hygiene of network-connected devices. Declining rates indicate growing vulnerability exposure across the endpoint population.',
      changeMgmtRelevance: 'Compliance rate changes follow new posture requirements, security patch releases, AV signature updates, OS version mandates, or posture agent updates.',
      troubleshootingWorkflow: '1. Determine current compliance rate and identify the drop\n2. Review which posture requirements are failing most\n3. Check if a new requirement was recently added\n4. Identify affected operating systems and device types\n5. Assess if remediation resources are available to endpoints\n6. Coordinate with endpoint management for accelerated patching',
      criblSearchQueries: [
        {
          name: 'Posture compliance overview',
          description: 'Calculate overall posture compliance rate across all assessed endpoints',
          query: 'dataset="$DATASET" posture_status!="" earliest=-24h\n| summarize Total=dcount(mac_address), Compliant=dcountif(mac_address, posture_status=="Compliant"), NonCompliant=dcountif(mac_address, posture_status=="Non-Compliant")\n| extend ComplianceRate=round(Compliant * 100.0 / Total, 2)'
        },
        {
          name: 'Non-compliance reasons',
          description: 'Analyze what posture requirements are causing the most failures',
          query: 'dataset="$DATASET" posture_status="Non-Compliant" earliest=-24h\n| summarize Failures=count(), Endpoints=dcount(mac_address) by compliance_details, posture_policy\n| order by Endpoints desc'
        },
        {
          name: 'Compliance rate trending',
          description: 'Track posture compliance rate over time to detect degradation',
          query: 'dataset="$DATASET" posture_status!="" earliest=-30d\n| timestats span=1d total=dcount(mac_address), compliant=dcountif(mac_address, posture_status=="Compliant")\n| extend compliance_pct=round(compliant * 100.0 / total, 2)\n| order by timestamp'
        }
      ]
    },
    {
      id: 'obs-ise-005',
      name: 'PSN Node Health',
      objective: 'Monitor load distribution and health metrics across Policy Service Nodes to ensure even distribution, detect overloaded nodes, and maintain authentication service availability.',
      category: 'Availability',
      tags: ['observability', 'cisco', 'ise', 'psn', 'health', 'availability', 'load-balancing'],
      requiredFields: ['psn_name', 'auth_count', 'cpu_percent', 'memory_percent', 'active_sessions', 'queue_depth', 'timestamp'],
      detectionLogic: 'Track authentication load distribution across PSN nodes. Alert when any PSN handles more than 40% of total authentication traffic (indicating load imbalance), when PSN CPU exceeds 75%, or when a PSN stops processing authentications entirely (indicating failure).',
      falsePositives: ['Planned PSN maintenance shifting load to remaining nodes', 'Geographic affinity causing intentional uneven distribution'],
      tuningGuidance: 'Set load balance thresholds based on PSN count and capacity. Account for geographic deployment models. Track queue depth alongside auth count for saturation indicators.',
      operationalValue: 'PSN load imbalance leads to authentication delays on overloaded nodes while under-utilized nodes have spare capacity. Monitoring enables optimal load distribution.',
      changeMgmtRelevance: 'PSN load changes follow NAS device RADIUS server list modifications, PSN additions/removals, load balancer configuration changes, or geographic network path modifications.',
      troubleshootingWorkflow: '1. Identify PSN load distribution imbalance\n2. Check if any PSN is down or unreachable\n3. Review NAS device RADIUS server configurations\n4. Verify load balancer health checks and distribution policy\n5. Check PSN resource utilization on overloaded nodes\n6. Redistribute NAS assignments or add PSN capacity',
      criblSearchQueries: [
        {
          name: 'PSN load distribution',
          description: 'Show authentication load across all PSN nodes for balance assessment',
          query: 'dataset="$DATASET" earliest=-24h\n| summarize AuthCount=count(), UniqueEndpoints=dcount(mac_address), UniqueNAS=dcount(nas_ip) by psn_name\n| extend load_pct=round(AuthCount * 100.0 / sum(AuthCount), 2)\n| order by AuthCount desc'
        },
        {
          name: 'PSN resource health',
          description: 'Monitor CPU, memory, and queue depth per PSN for capacity issues',
          query: 'dataset="$DATASET" cpu_percent > 0 earliest=-24h\n| timestats span=15m avg_cpu=avg(cpu_percent), avg_memory=avg(memory_percent), max_queue=max(queue_depth) by psn_name\n| order by avg_cpu desc'
        },
        {
          name: 'PSN activity trending',
          description: 'Track PSN authentication rates over time to detect node failures or shifts',
          query: 'dataset="$DATASET" earliest=-7d\n| timestats span=1h auths=count() by psn_name\n| order by auths desc'
        }
      ]
    },
    {
      id: 'obs-ise-006',
      name: 'Guest Portal Utilization',
      objective: 'Monitor guest network session counts, registration rates, and portal utilization to plan capacity for guest infrastructure and detect usage pattern changes.',
      category: 'Capacity',
      tags: ['observability', 'cisco', 'ise', 'guest', 'portal', 'capacity', 'utilization'],
      requiredFields: ['guest_type', 'username', 'mac_address', 'session_duration', 'portal_name', 'registration_time', 'sponsor', 'timestamp'],
      detectionLogic: 'Track active guest sessions, new registrations per hour, and portal page load metrics. Alert when guest sessions approach license limits (80% threshold) or when registration rate indicates abnormal guest activity patterns.',
      falsePositives: ['Corporate events or conferences causing legitimate guest registration spikes', 'Seasonal visitor patterns (intern cohorts, audit periods)'],
      tuningGuidance: 'Set capacity thresholds based on guest license count. Account for event schedules. Track registration rates by portal and sponsor for attribution.',
      operationalValue: 'Guest portal capacity directly impacts visitor experience and business meetings. Exhausted guest capacity means visitors cannot access network resources for presentations and collaboration.',
      changeMgmtRelevance: 'Guest utilization changes follow corporate events, policy changes affecting guest access duration, portal modifications, new office openings, or guest license changes.',
      troubleshootingWorkflow: '1. Assess current guest session count against capacity\n2. Review registration rate trends for anomalies\n3. Identify if specific events are driving guest spikes\n4. Check portal performance and page load times\n5. Review session duration settings for optimization\n6. Plan license expansion if growth trend continues',
      criblSearchQueries: [
        {
          name: 'Guest session count trending',
          description: 'Track active guest sessions over time for capacity planning',
          query: 'dataset="$DATASET" guest_type!="" earliest=-7d\n| timestats span=1h active_sessions=dcount(mac_address), unique_guests=dcount(username) by portal_name\n| order by active_sessions desc'
        },
        {
          name: 'Guest registration rate',
          description: 'Monitor new guest registrations per hour to detect spikes',
          query: 'dataset="$DATASET" guest_type!="" earliest=-7d\n| timestats span=1h registrations=count() by guest_type, portal_name\n| order by registrations desc'
        },
        {
          name: 'Guest utilization by sponsor',
          description: 'Break down guest network usage by sponsor for capacity attribution',
          query: 'dataset="$DATASET" guest_type!="" earliest=-30d\n| summarize GuestCount=dcount(username), Sessions=count(), AvgDuration=avg(session_duration) by sponsor, portal_name\n| order by GuestCount desc'
        }
      ]
    },
    {
      id: 'obs-ise-007',
      name: 'Device Onboarding Rate',
      objective: 'Monitor the rate of new MAC addresses appearing on the network per day to track device onboarding velocity, detect mass deployments, and identify unexpected device population changes.',
      category: 'Change Management',
      tags: ['observability', 'cisco', 'ise', 'onboarding', 'devices', 'change-management', 'trending'],
      requiredFields: ['mac_address', 'endpoint_profile', 'first_seen', 'auth_method', 'nas_ip', 'location', 'timestamp'],
      detectionLogic: 'Track the count of new (first-seen) MAC addresses per day. Alert when the daily new device count exceeds 2x the 30-day average, indicating mass deployments, onboarding events, or potential unauthorized device proliferation.',
      falsePositives: ['Planned hardware refresh cycles deploying many new devices', 'New office openings bringing many devices online simultaneously'],
      tuningGuidance: 'Baseline new device rates per location and day-of-week. Account for known deployment schedules. Track new devices by profile type to distinguish managed from unmanaged.',
      operationalValue: 'Device onboarding rate reflects organizational growth, hardware refresh cycles, and potential shadow IT. Unexpected spikes may indicate unauthorized device deployments or profiling database issues.',
      changeMgmtRelevance: 'Onboarding rate changes follow hardware refresh programs, office expansions, BYOD policy changes, new employee cohorts, or contractor onboarding waves.',
      troubleshootingWorkflow: '1. Determine the current new device onboarding rate versus baseline\n2. Identify what types of devices are being onboarded\n3. Check if a planned deployment explains the rate\n4. Review which locations are seeing the most new devices\n5. Verify if the onboarding is managed (IT-driven) or unmanaged (user-driven)\n6. Update capacity plans based on sustained onboarding trends',
      criblSearchQueries: [
        {
          name: 'Daily new device count',
          description: 'Track the number of new MAC addresses seen per day for onboarding monitoring',
          query: 'dataset="$DATASET" earliest=-30d\n| where first_seen > ago(30d)\n| timestats span=1d new_devices=dcount(mac_address) by location\n| order by new_devices desc'
        },
        {
          name: 'New devices by profile type',
          description: 'Break down new device onboarding by endpoint profile for categorization',
          query: 'dataset="$DATASET" earliest=-7d\n| where first_seen > ago(7d)\n| summarize NewDevices=dcount(mac_address) by endpoint_profile, auth_method, location\n| order by NewDevices desc'
        },
        {
          name: 'Onboarding rate trending',
          description: 'Compare daily onboarding rates to historical baselines for anomaly detection',
          query: 'dataset="$DATASET" earliest=-30d\n| where first_seen > ago(30d)\n| timestats span=1d new_devices=dcount(mac_address)\n| summarize AvgDaily=avg(new_devices), MaxDaily=max(new_devices), P95Daily=max(new_devices)\n| order by AvgDaily desc'
        }
      ]
    }
  ],

  'openai-usage': [
    {
      id: 'obs-001',
      name: 'Token Cost Trending',
      objective: 'Track token consumption costs over time to identify budget trends, forecast capacity needs, and detect unexpected cost increases.',
      category: 'Capacity',
      tags: ['observability', 'cost', 'capacity-planning', 'budgeting'],
      requiredFields: ['api_key', 'model', 'input_tokens', 'output_tokens', 'organization_id', 'timestamp', 'cost_estimate'],
      detectionLogic: 'Monitor daily and weekly token cost aggregates per organization and model. Alert when costs exceed budget thresholds or when week-over-week growth exceeds 25%. Calculate cost using model-specific per-token pricing.',
      falsePositives: ['Expected cost increases from new project launches', 'Seasonal usage patterns causing periodic spikes'],
      tuningGuidance: 'Set budget thresholds per organization and model. Account for pricing changes when models are updated. Establish growth rate baselines per team.',
      operationalValue: 'Enables proactive budget management and prevents unexpected overruns. Supports capacity planning for AI service expansion.',
      changeMgmtRelevance: 'Cost spikes often correlate with new feature deployments or workflow changes. Use as a leading indicator of adoption or misconfiguration.',
      troubleshootingWorkflow: '1. Identify which model/organization is driving costs\n2. Compare current costs to budget allocation\n3. Determine if cost increase is from volume or model mix shift\n4. Check for new users or applications driving consumption\n5. Review if cost-optimization opportunities exist\n6. Update forecasts and communicate to stakeholders',
      criblSearchQueries: [
        {
          name: 'Daily token cost by model',
          description: 'Track daily token consumption costs broken down by model',
          query: 'dataset="$DATASET" earliest=-30d\n| extend cost=input_tokens*0.00001 + output_tokens*0.00003\n| timestats span=1d daily_cost=sum(cost) by model\n| order by daily_cost desc'
        },
        {
          name: 'Cost trending by organization',
          description: 'Monitor cost trends per organization for budget management',
          query: 'dataset="$DATASET" earliest=-30d\n| extend cost=input_tokens*0.00001 + output_tokens*0.00003\n| timestats span=1d daily_cost=sum(cost), total_tokens=sum(input_tokens + output_tokens) by organization_id\n| order by daily_cost desc'
        },
        {
          name: 'Week-over-week cost comparison',
          description: 'Compare this weeks costs against prior week for growth analysis',
          query: 'dataset="$DATASET" earliest=-14d\n| extend cost=input_tokens*0.00001 + output_tokens*0.00003\n| extend week=iff(timestamp > ago(7d), "current", "prior")\n| summarize WeeklyCost=sum(cost), TotalTokens=sum(input_tokens + output_tokens) by week, model\n| order by WeeklyCost desc'
        }
      ]
    },
    {
      id: 'obs-002',
      name: 'API Latency Monitoring',
      objective: 'Monitor API response latencies to detect performance degradation and ensure service level objectives are met.',
      category: 'Performance',
      tags: ['observability', 'latency', 'performance', 'slo'],
      requiredFields: ['api_key', 'model', 'response_time_ms', 'endpoint', 'status_code', 'timestamp', 'organization_id'],
      detectionLogic: 'Track P50, P95, and P99 response latencies per model and endpoint. Alert when P95 latency exceeds SLO threshold (e.g., 5 seconds for completions) or when latency increases more than 50% versus 7-day baseline.',
      falsePositives: ['Expected latency increase for larger context windows', 'Rate limiting causing queuing delays', 'Planned maintenance periods'],
      tuningGuidance: 'Set SLO thresholds per model and endpoint. Account for token count correlation with latency. Exclude rate-limited requests from baseline calculations.',
      operationalValue: 'Ensures AI-powered features maintain acceptable performance. Enables SLO reporting and capacity planning for latency-sensitive applications.',
      changeMgmtRelevance: 'Latency changes may indicate model version updates, infrastructure changes, or traffic pattern shifts from new feature deployments.',
      troubleshootingWorkflow: '1. Identify which model/endpoint is experiencing latency\n2. Check if latency correlates with token count increases\n3. Review rate limiting status for affected keys\n4. Compare against provider status page\n5. Assess impact on downstream applications\n6. Determine if routing or fallback changes are needed',
      criblSearchQueries: [
        {
          name: 'API latency percentiles by model',
          description: 'Calculate P50, P95, P99 latency per model for SLO tracking',
          query: 'dataset="$DATASET" earliest=-24h\n| summarize P50=avg(response_time_ms), P95=max(response_time_ms), Requests=count() by model, endpoint\n| order by P95 desc'
        },
        {
          name: 'Latency trending over time',
          description: 'Visualize API latency trends to detect gradual degradation',
          query: 'dataset="$DATASET" earliest=-7d\n| timestats span=1h p95_latency=max(response_time_ms), avg_latency=avg(response_time_ms) by model\n| order by p95_latency desc'
        },
        {
          name: 'High latency requests investigation',
          description: 'Find requests with latency significantly above baseline',
          query: 'dataset="$DATASET" earliest=-4h\n| where response_time_ms > 5000\n| summarize SlowRequests=count(), AvgLatency=avg(response_time_ms), MaxLatency=max(response_time_ms) by model, endpoint, api_key\n| order by SlowRequests desc'
        }
      ]
    },
    {
      id: 'obs-003',
      name: 'Rate Limit Approaching',
      objective: 'Detect when API usage is approaching rate limit thresholds, enabling proactive capacity management before requests are throttled.',
      category: 'Capacity',
      tags: ['observability', 'rate-limit', 'capacity', 'throttling'],
      requiredFields: ['api_key', 'organization_id', 'rate_limit_remaining', 'rate_limit_total', 'model', 'timestamp', 'endpoint'],
      detectionLogic: 'Alert when rate_limit_remaining drops below 20% of rate_limit_total for any API key or organization. Escalate when usage rate projects hitting the limit within the next 15 minutes based on current consumption velocity.',
      falsePositives: ['Temporary burst workloads that self-resolve', 'Rate limit headers not available for all endpoints', 'Scheduled batch jobs intentionally using full allocation'],
      tuningGuidance: 'Set warning thresholds at 30% remaining, critical at 10% remaining. Calculate consumption velocity to predict limit hits. Account for different rate limits per model tier.',
      operationalValue: 'Prevents unexpected throttling that disrupts user-facing applications. Enables proactive scaling or request distribution before limits are hit.',
      changeMgmtRelevance: 'Rate limit pressure often follows new feature launches or onboarding of new teams. Useful signal for capacity planning decisions.',
      troubleshootingWorkflow: '1. Identify which API key/organization is approaching limits\n2. Check current consumption rate and time to limit\n3. Determine which applications are driving consumption\n4. Assess if traffic can be distributed or throttled\n5. Evaluate if rate limit increase is needed\n6. Implement request queuing or backoff if necessary',
      criblSearchQueries: [
        {
          name: 'Rate limit utilization by API key',
          description: 'Monitor rate limit consumption levels per key',
          query: 'dataset="$DATASET" rate_limit_remaining!="" earliest=-4h\n| extend utilization_pct=round((rate_limit_total - rate_limit_remaining)*100.0/rate_limit_total, 2)\n| summarize AvgUtilization=avg(utilization_pct), MaxUtilization=max(utilization_pct) by api_key, model, organization_id\n| where MaxUtilization > 70\n| order by MaxUtilization desc'
        },
        {
          name: 'Rate limit consumption velocity',
          description: 'Calculate how fast rate limits are being consumed to predict exhaustion',
          query: 'dataset="$DATASET" rate_limit_remaining!="" earliest=-1h\n| timestats span=5m remaining=avg(rate_limit_remaining), requests=count() by api_key, model\n| order by remaining asc'
        },
        {
          name: 'Rate limit hit events',
          description: 'Track actual rate limit throttling events',
          query: 'dataset="$DATASET" status_code=429 earliest=-24h\n| summarize Throttled=count(), Models=values(model), Endpoints=values(endpoint) by api_key, organization_id\n| order by Throttled desc'
        }
      ]
    },
    {
      id: 'obs-004',
      name: 'Model Usage Distribution',
      objective: 'Track which models are being used across the organization to inform adoption strategies, deprecation planning, and cost optimization.',
      category: 'Change Management',
      tags: ['observability', 'model-adoption', 'distribution', 'governance'],
      requiredFields: ['model', 'api_key', 'organization_id', 'user_id', 'total_tokens', 'timestamp', 'endpoint'],
      detectionLogic: 'Monitor model usage distribution changes over time. Alert when a new model appears in production usage, when a model share shifts more than 20% week-over-week, or when deprecated models still receive significant traffic.',
      falsePositives: ['Intentional model migration in progress', 'A/B testing between models', 'Development/staging traffic mixed with production'],
      tuningGuidance: 'Track distribution at organization and team levels. Set different expectations for development vs production. Account for model release cycles when evaluating shifts.',
      operationalValue: 'Supports model governance, deprecation planning, and adoption tracking. Helps optimize costs by identifying opportunities to shift to more efficient models.',
      changeMgmtRelevance: 'Directly measures the impact of model migration initiatives and helps plan deprecation timelines for older models.',
      troubleshootingWorkflow: '1. Review current model distribution vs prior period\n2. Identify which teams are driving distribution changes\n3. Check if new model adoption matches planned rollout\n4. Assess if deprecated models need forced migration\n5. Evaluate cost implications of current distribution\n6. Recommend optimization opportunities to teams',
      criblSearchQueries: [
        {
          name: 'Model usage distribution',
          description: 'Current breakdown of requests and tokens by model',
          query: 'dataset="$DATASET" earliest=-7d\n| summarize Requests=count(), TotalTokens=sum(total_tokens), UniqueUsers=dcount(user_id), UniqueOrgs=dcount(organization_id) by model\n| extend RequestPct=round(Requests*100.0/sum(Requests), 2)\n| order by Requests desc'
        },
        {
          name: 'Model distribution shift over time',
          description: 'Track how model usage proportions change week over week',
          query: 'dataset="$DATASET" earliest=-30d\n| timestats span=1d requests=count() by model\n| order by requests desc'
        },
        {
          name: 'Deprecated model usage',
          description: 'Identify ongoing usage of models flagged for deprecation',
          query: 'dataset="$DATASET" earliest=-7d\n| summarize Requests=count(), Users=dcount(user_id), Keys=dcount(api_key), LastUsed=max(timestamp) by model, organization_id\n| order by Requests desc'
        }
      ]
    },
    {
      id: 'obs-005',
      name: 'Error Rate by Endpoint',
      objective: 'Monitor API error rates per endpoint to detect service degradation and identify problematic integrations.',
      category: 'Reliability',
      tags: ['observability', 'errors', 'reliability', 'endpoint-health'],
      requiredFields: ['endpoint', 'status_code', 'error_type', 'model', 'api_key', 'timestamp', 'organization_id'],
      detectionLogic: 'Track error rates (4xx and 5xx responses) per endpoint as a percentage of total requests. Alert when error rate exceeds 5% for any endpoint or when 5xx errors exceed 1%. Calculate rolling 15-minute error rates.',
      falsePositives: ['Client-side errors (4xx) from misconfigured integrations', 'Planned API deprecations causing expected errors', 'Rate limiting (429) counted as errors'],
      tuningGuidance: 'Separate 4xx (client) from 5xx (server) error rates. Exclude 429 (rate limit) from error calculations. Set different thresholds per endpoint based on historical rates.',
      operationalValue: 'Provides early detection of API service issues and integration problems. Supports SLO compliance monitoring and reliability engineering.',
      changeMgmtRelevance: 'Error rate increases often follow client-side deployment changes or API version migrations. Useful for validating integration updates.',
      troubleshootingWorkflow: '1. Identify which endpoint has elevated errors\n2. Classify errors as client (4xx) or server (5xx)\n3. Check if errors correlate with specific API keys\n4. Review error messages for common patterns\n5. Check provider status page for known issues\n6. Determine if client updates or workarounds are needed',
      criblSearchQueries: [
        {
          name: 'Error rate by endpoint',
          description: 'Calculate error rates per endpoint for reliability monitoring',
          query: 'dataset="$DATASET" earliest=-24h\n| summarize Total=count(), Errors=countif(status_code >= 400), ServerErrors=countif(status_code >= 500) by endpoint, model\n| extend ErrorRate=round(Errors*100.0/Total, 2), ServerErrorRate=round(ServerErrors*100.0/Total, 2)\n| where ErrorRate > 0\n| order by ErrorRate desc'
        },
        {
          name: 'Error trending over time',
          description: 'Visualize error rates over time per endpoint',
          query: 'dataset="$DATASET" earliest=-7d\n| timestats span=1h total=count(), errors=countif(status_code >= 400) by endpoint\n| extend error_rate=round(errors*100.0/total, 2)\n| order by error_rate desc'
        },
        {
          name: 'Top error-producing API keys',
          description: 'Identify which API keys generate the most errors',
          query: 'dataset="$DATASET" status_code >= 400 earliest=-24h\n| summarize Errors=count(), ErrorTypes=values(error_type), StatusCodes=values(status_code) by api_key, endpoint, organization_id\n| order by Errors desc\n| limit 25'
        }
      ]
    },
    {
      id: 'obs-006',
      name: 'Project Budget Utilization',
      objective: 'Monitor token consumption against allocated project budgets to prevent overruns and enable proactive financial management.',
      category: 'Capacity',
      tags: ['observability', 'budget', 'cost-management', 'project-tracking'],
      requiredFields: ['organization_id', 'project_id', 'model', 'total_tokens', 'input_tokens', 'output_tokens', 'timestamp', 'api_key'],
      detectionLogic: 'Track cumulative token spend per project against allocated budgets. Alert at 75% utilization (warning), 90% utilization (critical), and project cost burn rate that would exhaust budget before period end.',
      falsePositives: ['Budget allocations not yet updated for new period', 'Projects intentionally front-loading usage', 'Test traffic counted against production budgets'],
      tuningGuidance: 'Set budget thresholds per project with appropriate warning levels. Calculate burn rate over rolling 7-day windows. Account for billing cycle boundaries.',
      operationalValue: 'Prevents budget overruns and enables proactive cost conversations with project teams. Supports financial planning and chargeback models.',
      changeMgmtRelevance: 'Budget burn rate changes signal project activity shifts, new feature launches, or efficiency improvements from optimization work.',
      troubleshootingWorkflow: '1. Identify which project is approaching budget limits\n2. Calculate current burn rate and projected exhaustion date\n3. Identify top cost drivers within the project\n4. Determine if usage is expected or anomalous\n5. Evaluate cost optimization opportunities\n6. Communicate with project stakeholders on status',
      criblSearchQueries: [
        {
          name: 'Project token consumption vs budget',
          description: 'Track cumulative consumption per project for budget management',
          query: 'dataset="$DATASET" earliest=-30d\n| extend cost=input_tokens*0.00001 + output_tokens*0.00003\n| summarize MonthlyCost=sum(cost), TotalTokens=sum(total_tokens), Requests=count() by project_id, organization_id\n| order by MonthlyCost desc'
        },
        {
          name: 'Budget burn rate by project',
          description: 'Calculate daily burn rate to project budget exhaustion',
          query: 'dataset="$DATASET" earliest=-7d\n| extend cost=input_tokens*0.00001 + output_tokens*0.00003\n| timestats span=1d daily_cost=sum(cost) by project_id\n| summarize AvgDailyCost=avg(daily_cost), MaxDailyCost=max(daily_cost) by project_id\n| order by AvgDailyCost desc'
        },
        {
          name: 'Top cost contributors within project',
          description: 'Identify which users and models drive project costs',
          query: 'dataset="$DATASET" earliest=-30d\n| extend cost=input_tokens*0.00001 + output_tokens*0.00003\n| summarize Cost=sum(cost), Tokens=sum(total_tokens), Requests=count() by project_id, model, api_key\n| order by Cost desc\n| limit 25'
        }
      ]
    },
    {
      id: 'obs-007',
      name: 'Throughput by Model',
      objective: 'Monitor request throughput per model to track capacity utilization, identify bottlenecks, and support scaling decisions.',
      category: 'Performance',
      tags: ['observability', 'throughput', 'capacity', 'scaling'],
      requiredFields: ['model', 'timestamp', 'total_tokens', 'response_time_ms', 'status_code', 'api_key', 'organization_id'],
      detectionLogic: 'Track requests per minute and tokens per minute per model. Alert when throughput drops more than 30% versus baseline (potential issue) or increases more than 50% (potential capacity pressure). Calculate tokens-per-second delivery rate.',
      falsePositives: ['Expected throughput changes during off-peak hours', 'Model routing changes shifting traffic', 'Planned capacity adjustments'],
      tuningGuidance: 'Establish throughput baselines per model with time-of-day patterns. Set different thresholds for peak vs off-peak. Account for model-specific token generation speeds.',
      operationalValue: 'Enables capacity planning and scaling decisions. Identifies performance degradation early and supports model routing optimization.',
      changeMgmtRelevance: 'Throughput changes indicate adoption shifts, workload changes, or infrastructure impacts from deployments.',
      troubleshootingWorkflow: '1. Identify which model has throughput changes\n2. Determine if decrease is supply-side (provider) or demand-side\n3. Check if latency correlates with throughput changes\n4. Review if routing changes affected model distribution\n5. Assess impact on user-facing applications\n6. Plan scaling actions if needed',
      criblSearchQueries: [
        {
          name: 'Throughput by model over time',
          description: 'Track requests and tokens per minute by model',
          query: 'dataset="$DATASET" earliest=-24h\n| timestats span=5m requests=count(), tokens=sum(total_tokens) by model\n| order by requests desc'
        },
        {
          name: 'Token delivery rate analysis',
          description: 'Calculate effective token delivery rates per model',
          query: 'dataset="$DATASET" earliest=-4h\n| where status_code=200\n| summarize Requests=count(), TotalTokens=sum(total_tokens), AvgLatency=avg(response_time_ms), TokensPerSecond=sum(total_tokens)/(4*3600) by model\n| order by TokensPerSecond desc'
        },
        {
          name: 'Throughput vs latency correlation',
          description: 'Identify if throughput increases are causing latency degradation',
          query: 'dataset="$DATASET" earliest=-24h\n| timestats span=15m requests=count(), avg_latency=avg(response_time_ms), p95_latency=max(response_time_ms) by model\n| order by requests desc'
        }
      ]
    }
  ],

  'openai-compliance': [
    {
      id: 'obs-001',
      name: 'Violation Rate Trending',
      objective: 'Track the rate of compliance violations over time to identify improving or degrading compliance posture across the organization.',
      category: 'Health',
      tags: ['observability', 'compliance', 'trending', 'organizational-health'],
      requiredFields: ['violation_type', 'policy_name', 'user_id', 'organization_id', 'timestamp', 'action_taken', 'severity'],
      detectionLogic: 'Calculate daily and weekly violation rates per 1000 requests. Alert when violation rate increases more than 25% week-over-week or exceeds organizational threshold. Track trending direction over 30-day windows.',
      falsePositives: ['Policy updates causing temporary spike in new violations', 'Onboarding waves of new users unfamiliar with policies', 'Classification sensitivity changes'],
      tuningGuidance: 'Normalize violation rates per 1000 requests for fair comparison. Set different baselines per organization maturity. Account for policy change rollout periods.',
      operationalValue: 'Provides executive-level visibility into compliance health. Supports measuring effectiveness of training and policy programs.',
      changeMgmtRelevance: 'Violation rate changes often follow policy updates, training rollouts, or new user onboarding. Useful metric for measuring change impact.',
      troubleshootingWorkflow: '1. Identify trending direction and magnitude\n2. Determine which violation types are driving the trend\n3. Check for recent policy or classification changes\n4. Review if specific teams or users are contributing\n5. Assess if training interventions are needed\n6. Report trends to compliance leadership',
      criblSearchQueries: [
        {
          name: 'Daily violation rate trending',
          description: 'Track violations per day as rate per 1000 requests',
          query: 'dataset="$DATASET" earliest=-30d\n| timestats span=1d total=count(), violations=countif(violation_type!="")\n| extend violation_rate=round(violations*1000.0/total, 2)\n| order by violation_rate desc'
        },
        {
          name: 'Violation rate by organization',
          description: 'Compare violation rates across organizations',
          query: 'dataset="$DATASET" earliest=-7d\n| summarize Total=count(), Violations=countif(violation_type!="") by organization_id\n| extend ViolationRate=round(Violations*1000.0/Total, 2)\n| order by ViolationRate desc'
        },
        {
          name: 'Week-over-week violation comparison',
          description: 'Compare this weeks violation rate against prior week',
          query: 'dataset="$DATASET" earliest=-14d\n| extend week=iff(timestamp > ago(7d), "current", "prior")\n| summarize Total=count(), Violations=countif(violation_type!="") by week\n| extend ViolationRate=round(Violations*1000.0/Total, 2)\n| order by week desc'
        }
      ]
    },
    {
      id: 'obs-002',
      name: 'PII Detection Rate',
      objective: 'Monitor the rate of PII detections in AI interactions to assess data handling practices and measure DLP effectiveness.',
      category: 'Health',
      tags: ['observability', 'pii', 'dlp', 'data-protection'],
      requiredFields: ['pii_detected', 'pii_type', 'user_id', 'organization_id', 'timestamp', 'action_taken', 'confidence_score'],
      detectionLogic: 'Track PII detection events as a rate per 1000 interactions. Monitor by PII type (SSN, credit card, email, phone) and action taken (blocked, warned, allowed). Alert when detection rate increases or when blocked PII bypasses controls.',
      falsePositives: ['False positive PII detections in technical content', 'Synthetic data triggering PII patterns', 'PII format discussions without actual data'],
      tuningGuidance: 'Track by PII type separately as they have different baseline rates. Monitor confidence scores to identify false positive trends. Set different thresholds for high-confidence vs low-confidence detections.',
      operationalValue: 'Measures DLP program effectiveness and identifies data handling gaps. Supports compliance reporting and privacy program metrics.',
      changeMgmtRelevance: 'PII detection rate changes may indicate new workflows handling sensitive data, DLP rule updates, or user behavior shifts after training.',
      troubleshootingWorkflow: '1. Review PII detection rate trend direction\n2. Identify which PII types are most prevalent\n3. Check if blocked actions are preventing data exposure\n4. Assess false positive rate by reviewing low-confidence detections\n5. Determine if additional DLP rules or training are needed\n6. Report metrics to privacy and compliance teams',
      criblSearchQueries: [
        {
          name: 'PII detection rate trending',
          description: 'Track PII detections as rate per 1000 interactions over time',
          query: 'dataset="$DATASET" earliest=-30d\n| timestats span=1d total=count(), pii_events=countif(pii_detected=="true")\n| extend pii_rate=round(pii_events*1000.0/total, 2)\n| order by pii_rate desc'
        },
        {
          name: 'PII detections by type and action',
          description: 'Break down PII events by type and response action',
          query: 'dataset="$DATASET" pii_detected="true" earliest=-7d\n| summarize Detections=count(), AvgConfidence=avg(confidence_score) by pii_type, action_taken\n| order by Detections desc'
        },
        {
          name: 'PII detection by organization',
          description: 'Compare PII detection rates across organizations',
          query: 'dataset="$DATASET" earliest=-7d\n| summarize Total=count(), PIIEvents=countif(pii_detected=="true") by organization_id\n| extend PIIRate=round(PIIEvents*1000.0/Total, 2)\n| order by PIIRate desc'
        }
      ]
    },
    {
      id: 'obs-003',
      name: 'Policy Coverage Gaps',
      objective: 'Identify interactions that are not covered by any compliance policy, representing blind spots in the governance framework.',
      category: 'Availability',
      tags: ['observability', 'coverage', 'governance', 'gap-analysis'],
      requiredFields: ['policy_evaluated', 'policy_name', 'endpoint', 'model', 'organization_id', 'timestamp', 'user_id'],
      detectionLogic: 'Monitor the percentage of interactions where no compliance policy was evaluated. Alert when coverage drops below 95% for any organization or when new endpoints/models appear without policy mappings.',
      falsePositives: ['New endpoints in development without policies yet', 'Internal testing traffic intentionally excluded', 'Policy evaluation failures counting as gaps'],
      tuningGuidance: 'Set coverage targets per organization maturity level. Account for development/staging traffic that may not need full coverage. Track gaps by endpoint and model for targeted remediation.',
      operationalValue: 'Ensures comprehensive compliance monitoring without blind spots. Identifies governance gaps before they become audit findings.',
      changeMgmtRelevance: 'New model deployments, endpoint additions, or organizational changes often introduce coverage gaps that need policy configuration.',
      troubleshootingWorkflow: '1. Identify which interactions lack policy coverage\n2. Determine the endpoint, model, or organization with gaps\n3. Check if policies should exist but failed to evaluate\n4. Review if new services need policy configuration\n5. Prioritize gap remediation by risk level\n6. Track coverage improvement over time',
      criblSearchQueries: [
        {
          name: 'Policy coverage analysis',
          description: 'Calculate percentage of interactions covered by compliance policies',
          query: 'dataset="$DATASET" earliest=-7d\n| summarize Total=count(), Covered=countif(policy_evaluated=="true") by organization_id\n| extend CoveragePct=round(Covered*100.0/Total, 2)\n| order by CoveragePct asc'
        },
        {
          name: 'Uncovered endpoints and models',
          description: 'Find endpoints and models without policy coverage',
          query: 'dataset="$DATASET" policy_evaluated="false" earliest=-7d\n| summarize Uncovered=count(), Users=dcount(user_id) by endpoint, model, organization_id\n| order by Uncovered desc'
        },
        {
          name: 'Coverage trending over time',
          description: 'Track policy coverage percentage over time',
          query: 'dataset="$DATASET" earliest=-30d\n| timestats span=1d total=count(), covered=countif(policy_evaluated=="true")\n| extend coverage_pct=round(covered*100.0/total, 2)\n| order by coverage_pct asc'
        }
      ]
    },
    {
      id: 'obs-004',
      name: 'Retention Processing Latency',
      objective: 'Monitor the time between data creation and retention policy application to ensure timely compliance processing.',
      category: 'Performance',
      tags: ['observability', 'retention', 'latency', 'compliance-processing'],
      requiredFields: ['record_created_time', 'retention_applied_time', 'retention_policy', 'organization_id', 'timestamp', 'processing_status'],
      detectionLogic: 'Calculate the lag between record creation and retention policy application. Alert when average processing latency exceeds SLO (e.g., 24 hours) or when a backlog of unprocessed records grows beyond threshold.',
      falsePositives: ['Planned maintenance windows pausing processing', 'Large batch imports creating temporary backlog', 'Holiday periods with accumulated data'],
      tuningGuidance: 'Set latency SLOs based on regulatory requirements. Account for batch processing schedules. Monitor queue depth alongside latency for full picture.',
      operationalValue: 'Ensures regulatory compliance timelines are met for data retention. Prevents audit findings from delayed policy application.',
      changeMgmtRelevance: 'Processing latency changes may indicate infrastructure scaling needs, retention policy complexity increases, or processing pipeline issues.',
      troubleshootingWorkflow: '1. Measure current processing latency vs SLO\n2. Check for processing backlog growth\n3. Identify if specific retention policies are slow\n4. Review infrastructure capacity for processing\n5. Determine if scaling or optimization is needed\n6. Verify regulatory compliance timelines are met',
      criblSearchQueries: [
        {
          name: 'Retention processing latency',
          description: 'Calculate average time between record creation and retention application',
          query: 'dataset="$DATASET" retention_applied_time!="" earliest=-7d\n| extend processing_lag_hours=(tolong(retention_applied_time) - tolong(record_created_time)) / 3600000\n| summarize AvgLag=avg(processing_lag_hours), MaxLag=max(processing_lag_hours), P95Lag=max(processing_lag_hours) by retention_policy, organization_id\n| order by AvgLag desc'
        },
        {
          name: 'Processing backlog monitoring',
          description: 'Track unprocessed records waiting for retention policy application',
          query: 'dataset="$DATASET" processing_status="pending" earliest=-24h\n| summarize PendingRecords=count(), OldestPending=min(record_created_time) by retention_policy, organization_id\n| extend BacklogHours=(tolong(now()) - tolong(OldestPending)) / 3600000\n| order by BacklogHours desc'
        },
        {
          name: 'Retention latency trending',
          description: 'Track processing latency over time for SLO monitoring',
          query: 'dataset="$DATASET" retention_applied_time!="" earliest=-30d\n| extend processing_lag_hours=(tolong(retention_applied_time) - tolong(record_created_time)) / 3600000\n| timestats span=1d avg_lag=avg(processing_lag_hours), p95_lag=max(processing_lag_hours)\n| order by avg_lag desc'
        }
      ]
    },
    {
      id: 'obs-005',
      name: 'Moderation Volume',
      objective: 'Track content moderation processing volumes to ensure capacity meets demand and identify moderation system scaling needs.',
      category: 'Capacity',
      tags: ['observability', 'moderation', 'volume', 'capacity-planning'],
      requiredFields: ['moderation_processed', 'moderation_category', 'processing_time_ms', 'organization_id', 'timestamp', 'model', 'queue_depth'],
      detectionLogic: 'Monitor moderation request volume per hour and compare against system capacity. Alert when volume approaches 80% of processing capacity or when queue depth exceeds acceptable thresholds.',
      falsePositives: ['Expected volume increases during business hours', 'Seasonal usage patterns causing predictable spikes', 'Bulk migration or import activities'],
      tuningGuidance: 'Set capacity thresholds based on processing infrastructure limits. Account for time-of-day patterns. Monitor processing time alongside volume for latency correlation.',
      operationalValue: 'Ensures moderation systems can handle current demand without degradation. Supports capacity planning for growing usage.',
      changeMgmtRelevance: 'Volume changes signal user adoption growth, new integrations coming online, or content pattern shifts requiring infrastructure scaling.',
      troubleshootingWorkflow: '1. Assess current moderation volume vs capacity\n2. Check queue depth for backlog indicators\n3. Monitor processing time for degradation\n4. Identify which categories are driving volume\n5. Plan capacity scaling if trending toward limits\n6. Communicate capacity constraints to stakeholders',
      criblSearchQueries: [
        {
          name: 'Moderation volume trending',
          description: 'Track moderation processing volume over time',
          query: 'dataset="$DATASET" moderation_processed="true" earliest=-14d\n| timestats span=1h moderation_events=count() by moderation_category\n| order by moderation_events desc'
        },
        {
          name: 'Moderation capacity utilization',
          description: 'Monitor moderation system utilization and queue depth',
          query: 'dataset="$DATASET" earliest=-24h\n| timestats span=15m processed=count(), avg_processing=avg(processing_time_ms), max_queue=max(queue_depth)\n| order by max_queue desc'
        },
        {
          name: 'Moderation volume by organization',
          description: 'Break down moderation demand by organization for capacity planning',
          query: 'dataset="$DATASET" moderation_processed="true" earliest=-7d\n| summarize Volume=count(), Categories=dcount(moderation_category), AvgProcessing=avg(processing_time_ms) by organization_id\n| order by Volume desc'
        }
      ]
    },
    {
      id: 'obs-006',
      name: 'Compliance Score Trending',
      objective: 'Track organizational compliance scores over time to measure program effectiveness and identify areas needing improvement.',
      category: 'Health',
      tags: ['observability', 'compliance-score', 'program-effectiveness', 'reporting'],
      requiredFields: ['compliance_score', 'policy_adherence_pct', 'organization_id', 'department', 'timestamp', 'evaluation_period'],
      detectionLogic: 'Calculate rolling compliance scores based on policy adherence, violation rates, training completion, and remediation timeliness. Alert when score drops below minimum threshold or declines for 3 consecutive evaluation periods.',
      falsePositives: ['Score recalibration during policy framework updates', 'New departments onboarding with initially low scores', 'Scoring methodology changes causing apparent declines'],
      tuningGuidance: 'Set minimum score thresholds based on regulatory requirements. Weight scoring components appropriately for your industry. Account for department maturity differences.',
      operationalValue: 'Provides single-metric view of compliance health for executive reporting. Enables targeted remediation by identifying lowest-scoring areas.',
      changeMgmtRelevance: 'Score changes measure the effectiveness of compliance program initiatives, training rollouts, and policy updates.',
      troubleshootingWorkflow: '1. Review overall score trend direction\n2. Identify which scoring components are declining\n3. Determine if specific departments are driving changes\n4. Check for policy or scoring methodology updates\n5. Assess if targeted interventions are needed\n6. Report trends and recommendations to leadership',
      criblSearchQueries: [
        {
          name: 'Compliance score trending',
          description: 'Track compliance scores over time by organization',
          query: 'dataset="$DATASET" compliance_score!="" earliest=-90d\n| timestats span=1d score=avg(compliance_score), adherence=avg(policy_adherence_pct) by organization_id\n| order by score asc'
        },
        {
          name: 'Compliance score by department',
          description: 'Compare compliance scores across departments',
          query: 'dataset="$DATASET" compliance_score!="" earliest=-30d\n| summarize AvgScore=avg(compliance_score), MinScore=min(compliance_score), Adherence=avg(policy_adherence_pct) by department, organization_id\n| order by AvgScore asc'
        },
        {
          name: 'Score component breakdown',
          description: 'Analyze which components are driving compliance score changes',
          query: 'dataset="$DATASET" compliance_score!="" earliest=-30d\n| summarize AvgScore=avg(compliance_score), ViolationRate=countif(violation_type!="")*1.0/count(), Adherence=avg(policy_adherence_pct) by organization_id, bin(timestamp, 7d)\n| order by AvgScore asc'
        }
      ]
    },
    {
      id: 'obs-007',
      name: 'Audit Completeness',
      objective: 'Monitor the completeness of audit trail capture to ensure all required interactions are being logged for compliance and forensic purposes.',
      category: 'Reliability',
      tags: ['observability', 'audit', 'completeness', 'logging'],
      requiredFields: ['audit_logged', 'event_type', 'organization_id', 'timestamp', 'source_system', 'gap_detected'],
      detectionLogic: 'Compare expected audit events against actual logged events. Alert when audit completeness drops below 99.5% or when gaps are detected in sequential event tracking. Monitor by source system and event type.',
      falsePositives: ['Brief logging delays causing temporary apparent gaps', 'System maintenance windows with expected logging pauses', 'Event deduplication reducing apparent volume'],
      tuningGuidance: 'Set completeness threshold based on regulatory requirements (99.5%+ for most). Monitor by source system independently. Account for known maintenance windows.',
      operationalValue: 'Ensures audit trails are complete for regulatory compliance, forensic investigations, and legal discovery. Prevents audit findings from logging gaps.',
      changeMgmtRelevance: 'Audit completeness issues often follow infrastructure changes, pipeline modifications, or system migrations that disrupt logging.',
      troubleshootingWorkflow: '1. Identify which source systems have completeness gaps\n2. Check for logging pipeline failures or delays\n3. Review infrastructure changes that may affect logging\n4. Verify event sequencing for gap detection\n5. Assess regulatory impact of any confirmed gaps\n6. Implement remediation and gap-fill procedures',
      criblSearchQueries: [
        {
          name: 'Audit completeness by source system',
          description: 'Calculate audit logging completeness per source',
          query: 'dataset="$DATASET" earliest=-7d\n| summarize Total=count(), Logged=countif(audit_logged=="true"), Gaps=countif(gap_detected=="true") by source_system, organization_id\n| extend CompletenessPct=round(Logged*100.0/Total, 2)\n| order by CompletenessPct asc'
        },
        {
          name: 'Audit gap detection',
          description: 'Find periods where audit events are missing or incomplete',
          query: 'dataset="$DATASET" gap_detected="true" earliest=-7d\n| summarize Gaps=count(), Sources=values(source_system), EventTypes=values(event_type) by organization_id, bin(timestamp, 1h)\n| where Gaps > 0\n| order by Gaps desc'
        },
        {
          name: 'Audit completeness trending',
          description: 'Track audit completeness over time for SLO monitoring',
          query: 'dataset="$DATASET" earliest=-30d\n| timestats span=1d total=count(), logged=countif(audit_logged=="true")\n| extend completeness=round(logged*100.0/total, 2)\n| order by completeness asc'
        }
      ]
    }
  ],

  'anthropic-compliance': [
    {
      id: 'obs-001',
      name: 'Token Cost Trending',
      objective: 'Track Anthropic API token consumption costs over time to manage budgets and forecast capacity needs across workspaces.',
      category: 'Capacity',
      tags: ['observability', 'cost', 'capacity-planning', 'anthropic'],
      requiredFields: ['workspace_id', 'model', 'input_tokens', 'output_tokens', 'api_key', 'timestamp', 'user_id'],
      detectionLogic: 'Monitor daily token costs per workspace and model using Anthropic-specific pricing. Alert when costs exceed workspace budget thresholds or when week-over-week growth exceeds 30%.',
      falsePositives: ['Expected cost increases from new project launches', 'Model tier upgrades causing cost per token increases', 'Batch processing scheduled for specific days'],
      tuningGuidance: 'Set budgets per workspace with model-specific pricing. Account for Anthropic pricing tiers (Opus/Sonnet/Haiku). Establish growth rate baselines per workspace.',
      operationalValue: 'Enables proactive budget management for Anthropic API usage. Supports workspace-level chargeback and capacity planning.',
      changeMgmtRelevance: 'Cost changes correlate with model tier migrations, new workspace provisioning, or workflow optimization initiatives.',
      troubleshootingWorkflow: '1. Identify workspace and model driving cost changes\n2. Compare against budget allocation\n3. Determine if cost change is from volume or model mix\n4. Check for new users or automated workflows\n5. Evaluate model tier optimization opportunities\n6. Update forecasts and notify workspace owners',
      criblSearchQueries: [
        {
          name: 'Daily cost by workspace and model',
          description: 'Track daily Anthropic API costs broken down by workspace and model',
          query: 'dataset="$DATASET" earliest=-30d\n| extend cost=input_tokens*0.000015 + output_tokens*0.000075\n| timestats span=1d daily_cost=sum(cost) by workspace_id, model\n| order by daily_cost desc'
        },
        {
          name: 'Workspace cost comparison',
          description: 'Compare costs across workspaces for budget management',
          query: 'dataset="$DATASET" earliest=-30d\n| extend cost=input_tokens*0.000015 + output_tokens*0.000075\n| summarize MonthlyCost=sum(cost), TotalTokens=sum(input_tokens + output_tokens), Users=dcount(user_id) by workspace_id\n| order by MonthlyCost desc'
        },
        {
          name: 'Week-over-week cost growth',
          description: 'Calculate weekly cost growth rates per workspace',
          query: 'dataset="$DATASET" earliest=-14d\n| extend cost=input_tokens*0.000015 + output_tokens*0.000075\n| extend week=iff(timestamp > ago(7d), "current", "prior")\n| summarize WeeklyCost=sum(cost) by week, workspace_id, model\n| order by WeeklyCost desc'
        }
      ]
    },
    {
      id: 'obs-002',
      name: 'Safety Trigger Rate',
      objective: 'Monitor the rate of safety system triggers to assess content risk patterns and measure safety system effectiveness.',
      category: 'Health',
      tags: ['observability', 'safety', 'content-risk', 'system-health'],
      requiredFields: ['safety_trigger', 'safety_category', 'action_taken', 'workspace_id', 'user_id', 'timestamp', 'model'],
      detectionLogic: 'Track safety trigger rate per 1000 requests by workspace and category. Alert when rates increase more than 50% versus 7-day baseline or when new safety categories appear in production traffic.',
      falsePositives: ['Safety system tuning causing sensitivity changes', 'New user populations with different content patterns', 'Model updates affecting safety classification'],
      tuningGuidance: 'Baseline rates per workspace as usage patterns differ. Track by safety category independently. Account for model version changes affecting safety classification.',
      operationalValue: 'Measures AI safety system effectiveness and identifies emerging content risk patterns. Supports safety team prioritization.',
      changeMgmtRelevance: 'Safety trigger rate changes may indicate model updates, safety system tuning, or user behavior shifts after policy communications.',
      troubleshootingWorkflow: '1. Review safety trigger rate trend\n2. Identify which categories are changing\n3. Check for model or safety system updates\n4. Determine if user behavior is shifting\n5. Assess if safety thresholds need adjustment\n6. Report findings to AI safety team',
      criblSearchQueries: [
        {
          name: 'Safety trigger rate trending',
          description: 'Track safety triggers as rate per 1000 requests over time',
          query: 'dataset="$DATASET" earliest=-30d\n| timestats span=1d total=count(), triggers=countif(safety_trigger=="true")\n| extend trigger_rate=round(triggers*1000.0/total, 2)\n| order by trigger_rate desc'
        },
        {
          name: 'Safety triggers by category and workspace',
          description: 'Break down safety events by category per workspace',
          query: 'dataset="$DATASET" safety_trigger="true" earliest=-7d\n| summarize Triggers=count(), Actions=values(action_taken), Users=dcount(user_id) by safety_category, workspace_id\n| order by Triggers desc'
        },
        {
          name: 'Safety trigger rate by model',
          description: 'Compare safety trigger rates across different models',
          query: 'dataset="$DATASET" earliest=-7d\n| summarize Total=count(), Triggers=countif(safety_trigger=="true") by model, workspace_id\n| extend TriggerRate=round(Triggers*1000.0/Total, 2)\n| order by TriggerRate desc'
        }
      ]
    },
    {
      id: 'obs-003',
      name: 'API Latency by Model',
      objective: 'Monitor Anthropic API response latencies per model to ensure performance SLOs are met and identify model-specific degradation.',
      category: 'Performance',
      tags: ['observability', 'latency', 'model-performance', 'slo'],
      requiredFields: ['model', 'response_time_ms', 'input_tokens', 'output_tokens', 'workspace_id', 'timestamp', 'status_code'],
      detectionLogic: 'Track P50, P95, P99 latency per model with normalization for token count. Alert when model-specific P95 exceeds SLO thresholds or when latency increases more than 40% versus 7-day baseline.',
      falsePositives: ['Latency increase expected for larger context windows', 'Provider-side scaling events causing temporary delays', 'Network path changes affecting observed latency'],
      tuningGuidance: 'Set model-specific SLO thresholds (Haiku < Sonnet < Opus expected latency). Normalize latency by output token count for fair comparison. Exclude requests during known provider maintenance.',
      operationalValue: 'Ensures AI-powered features maintain acceptable performance across different model tiers. Supports model selection optimization.',
      changeMgmtRelevance: 'Latency changes may indicate provider-side updates, context window usage changes, or traffic pattern shifts from new deployments.',
      troubleshootingWorkflow: '1. Identify which model has elevated latency\n2. Check if latency correlates with token count\n3. Compare across workspaces for scope assessment\n4. Review provider status page for known issues\n5. Assess impact on user-facing applications\n6. Consider model routing adjustments if persistent',
      criblSearchQueries: [
        {
          name: 'Latency percentiles by model',
          description: 'Calculate latency percentiles per model for SLO tracking',
          query: 'dataset="$DATASET" status_code=200 earliest=-24h\n| summarize P50=avg(response_time_ms), P95=max(response_time_ms), Requests=count() by model\n| order by P95 desc'
        },
        {
          name: 'Latency trending by model',
          description: 'Visualize model latency trends over time',
          query: 'dataset="$DATASET" status_code=200 earliest=-7d\n| timestats span=1h p95_latency=max(response_time_ms), avg_latency=avg(response_time_ms) by model\n| order by p95_latency desc'
        },
        {
          name: 'Latency vs token count correlation',
          description: 'Analyze relationship between output tokens and response latency',
          query: 'dataset="$DATASET" status_code=200 earliest=-24h\n| extend tokens_per_ms=output_tokens*1.0/response_time_ms\n| summarize AvgLatency=avg(response_time_ms), AvgTokens=avg(output_tokens), TokensPerMs=avg(tokens_per_ms) by model, workspace_id\n| order by AvgLatency desc'
        }
      ]
    },
    {
      id: 'obs-004',
      name: 'Workspace Usage Distribution',
      objective: 'Track token consumption distribution across workspaces to identify capacity allocation needs and usage imbalances.',
      category: 'Capacity',
      tags: ['observability', 'workspace', 'distribution', 'capacity-allocation'],
      requiredFields: ['workspace_id', 'total_tokens', 'input_tokens', 'output_tokens', 'model', 'user_id', 'timestamp'],
      detectionLogic: 'Monitor token consumption per workspace as percentage of total organizational usage. Alert when a single workspace consumes more than 50% of total capacity or when workspace growth rate exceeds capacity planning assumptions.',
      falsePositives: ['Intentionally high-usage workspaces (e.g., production automation)', 'Temporary spikes during batch processing windows', 'New workspace ramp-up period'],
      tuningGuidance: 'Set expected usage ranges per workspace based on their purpose. Track both absolute consumption and percentage of total. Account for workspace lifecycle stages.',
      operationalValue: 'Supports capacity allocation decisions and identifies workspaces needing quota adjustments. Enables fair resource distribution.',
      changeMgmtRelevance: 'Usage distribution shifts indicate new project scaling, workspace consolidation effects, or adoption changes across teams.',
      troubleshootingWorkflow: '1. Review current distribution vs expected allocation\n2. Identify workspaces with unexpected consumption\n3. Determine if redistribution or scaling is needed\n4. Check if any workspace is being starved of capacity\n5. Review quota settings vs actual usage\n6. Recommend capacity allocation adjustments',
      criblSearchQueries: [
        {
          name: 'Workspace token distribution',
          description: 'Show token consumption breakdown by workspace',
          query: 'dataset="$DATASET" earliest=-7d\n| summarize TotalTokens=sum(total_tokens), Requests=count(), Users=dcount(user_id) by workspace_id\n| extend UsagePct=round(TotalTokens*100.0/sum(TotalTokens), 2)\n| order by TotalTokens desc'
        },
        {
          name: 'Workspace usage trending',
          description: 'Track workspace consumption over time for planning',
          query: 'dataset="$DATASET" earliest=-30d\n| timestats span=1d daily_tokens=sum(total_tokens) by workspace_id\n| order by daily_tokens desc'
        },
        {
          name: 'Workspace growth rate analysis',
          description: 'Calculate growth rates per workspace for capacity forecasting',
          query: 'dataset="$DATASET" earliest=-14d\n| extend week=iff(timestamp > ago(7d), "current", "prior")\n| summarize WeeklyTokens=sum(total_tokens), Requests=count() by week, workspace_id\n| order by WeeklyTokens desc'
        }
      ]
    },
    {
      id: 'obs-005',
      name: 'Error Rate Monitoring',
      objective: 'Monitor Anthropic API error rates to detect service issues and identify problematic integrations before they impact users.',
      category: 'Reliability',
      tags: ['observability', 'errors', 'reliability', 'api-health'],
      requiredFields: ['status_code', 'error_type', 'model', 'workspace_id', 'api_key', 'timestamp', 'endpoint'],
      detectionLogic: 'Track error rates (4xx and 5xx) per workspace and model. Alert when error rate exceeds 3% for any workspace or when 5xx errors exceed 0.5%. Separate client errors from server errors for targeted troubleshooting.',
      falsePositives: ['Rate limiting (429) during expected peak usage', 'Client-side validation errors from development workspaces', 'Expected errors during API migration periods'],
      tuningGuidance: 'Exclude 429 from general error rate calculations. Set different thresholds for production vs development workspaces. Track error types separately for actionable insights.',
      operationalValue: 'Provides early detection of API reliability issues. Supports SLO compliance and helps teams identify integration problems.',
      changeMgmtRelevance: 'Error rate increases often follow client-side code changes, API version migrations, or infrastructure modifications.',
      troubleshootingWorkflow: '1. Identify error type distribution (4xx vs 5xx)\n2. Determine if errors are client-side or provider-side\n3. Check if specific workspaces or keys are affected\n4. Review error messages for patterns\n5. Check Anthropic status page for incidents\n6. Implement retries or fallbacks as needed',
      criblSearchQueries: [
        {
          name: 'Error rate by workspace and model',
          description: 'Calculate error rates per workspace for reliability monitoring',
          query: 'dataset="$DATASET" earliest=-24h\n| summarize Total=count(), Errors=countif(status_code >= 400), ServerErrors=countif(status_code >= 500) by workspace_id, model\n| extend ErrorRate=round(Errors*100.0/Total, 2), ServerErrorRate=round(ServerErrors*100.0/Total, 2)\n| where Errors > 0\n| order by ErrorRate desc'
        },
        {
          name: 'Error trending over time',
          description: 'Visualize error rates over time for degradation detection',
          query: 'dataset="$DATASET" earliest=-7d\n| timestats span=1h total=count(), errors=countif(status_code >= 400), server_errors=countif(status_code >= 500) by workspace_id\n| extend error_rate=round(errors*100.0/total, 2)\n| order by error_rate desc'
        },
        {
          name: 'Error type distribution',
          description: 'Break down errors by type for targeted troubleshooting',
          query: 'dataset="$DATASET" status_code >= 400 earliest=-24h\n| summarize Count=count(), Workspaces=dcount(workspace_id), Keys=dcount(api_key) by status_code, error_type\n| order by Count desc'
        }
      ]
    },
    {
      id: 'obs-006',
      name: 'Budget Burn Rate',
      objective: 'Track workspace budget consumption velocity to predict exhaustion dates and enable proactive budget management.',
      category: 'Capacity',
      tags: ['observability', 'budget', 'burn-rate', 'financial-ops'],
      requiredFields: ['workspace_id', 'input_tokens', 'output_tokens', 'model', 'timestamp', 'api_key', 'budget_allocation'],
      detectionLogic: 'Calculate daily cost burn rate per workspace and project forward to budget exhaustion. Alert at 75% budget consumed (warning), 90% consumed (critical), and when projected exhaustion is before period end.',
      falsePositives: ['Front-loaded budget consumption for batch projects', 'Budget allocations pending update for new period', 'One-time migration costs skewing burn rate'],
      tuningGuidance: 'Calculate burn rate over rolling 7-day windows for stability. Set alert thresholds at multiple levels. Account for model pricing differences in cost calculations.',
      operationalValue: 'Prevents unexpected budget exhaustion and service disruption. Enables proactive conversations with workspace owners about consumption patterns.',
      changeMgmtRelevance: 'Burn rate changes signal new automation deployments, efficiency improvements, or unexpected consumption from new workflows.',
      troubleshootingWorkflow: '1. Identify workspace burn rate vs allocation\n2. Calculate projected exhaustion date\n3. Determine what is driving consumption\n4. Check for optimization opportunities\n5. Communicate with workspace owner\n6. Adjust budget or implement controls as needed',
      criblSearchQueries: [
        {
          name: 'Workspace budget burn rate',
          description: 'Calculate daily burn rate and projected exhaustion per workspace',
          query: 'dataset="$DATASET" earliest=-7d\n| extend cost=input_tokens*0.000015 + output_tokens*0.000075\n| timestats span=1d daily_cost=sum(cost) by workspace_id\n| summarize AvgDailyBurn=avg(daily_cost), MaxDailyBurn=max(daily_cost), TotalSpent=sum(daily_cost) by workspace_id\n| order by AvgDailyBurn desc'
        },
        {
          name: 'Budget utilization percentage',
          description: 'Track what percentage of allocated budget has been consumed',
          query: 'dataset="$DATASET" earliest=-30d\n| extend cost=input_tokens*0.000015 + output_tokens*0.000075\n| summarize MonthlySpend=sum(cost) by workspace_id\n| order by MonthlySpend desc'
        },
        {
          name: 'Burn rate trending by workspace',
          description: 'Visualize daily cost velocity per workspace over time',
          query: 'dataset="$DATASET" earliest=-30d\n| extend cost=input_tokens*0.000015 + output_tokens*0.000075\n| timestats span=1d daily_burn=sum(cost) by workspace_id\n| order by daily_burn desc'
        }
      ]
    },
    {
      id: 'obs-007',
      name: 'Model Adoption Tracking',
      objective: 'Monitor adoption rates of new Anthropic models across workspaces to measure migration progress and identify lagging teams.',
      category: 'Change Management',
      tags: ['observability', 'adoption', 'model-migration', 'change-tracking'],
      requiredFields: ['model', 'workspace_id', 'user_id', 'total_tokens', 'timestamp', 'api_key'],
      detectionLogic: 'Track model usage distribution changes over time per workspace. Alert when deprecated model usage exceeds threshold after migration deadline or when new model adoption falls below expected trajectory.',
      falsePositives: ['Intentional use of older models for specific use cases', 'Workspaces with pinned model versions for stability', 'Testing workspaces evaluating multiple models'],
      tuningGuidance: 'Define target model distribution per workspace. Set migration deadlines with grace periods. Track adoption velocity rather than just current state.',
      operationalValue: 'Measures effectiveness of model migration initiatives. Identifies workspaces needing migration support or enforcement.',
      changeMgmtRelevance: 'Directly measures model migration progress and helps prioritize change management efforts for lagging teams.',
      troubleshootingWorkflow: '1. Review current model distribution vs targets\n2. Identify workspaces behind on adoption\n3. Determine blockers for migration (compatibility, testing)\n4. Check if deprecated model deadline is approaching\n5. Provide migration support where needed\n6. Report adoption progress to stakeholders',
      criblSearchQueries: [
        {
          name: 'Model adoption by workspace',
          description: 'Track which models each workspace is using for migration tracking',
          query: 'dataset="$DATASET" earliest=-30d\n| summarize Requests=count(), Tokens=sum(total_tokens), Users=dcount(user_id) by model, workspace_id\n| extend ModelPct=round(Requests*100.0/sum(Requests), 2)\n| order by workspace_id, Requests desc'
        },
        {
          name: 'Model adoption trending',
          description: 'Visualize model distribution changes over time',
          query: 'dataset="$DATASET" earliest=-30d\n| timestats span=1d requests=count() by model\n| order by requests desc'
        },
        {
          name: 'Deprecated model usage tracking',
          description: 'Monitor usage of models targeted for deprecation',
          query: 'dataset="$DATASET" earliest=-7d\n| summarize Requests=count(), Users=dcount(user_id), Workspaces=dcount(workspace_id), LastUsed=max(timestamp) by model\n| order by Requests desc'
        }
      ]
    }
  ],

  'microsoft-graph': [
    {
      id: 'obs-001',
      name: 'Alert Resolution Time',
      objective: 'Monitor the time between security alert creation and resolution to ensure SLA compliance and identify bottlenecks in incident response.',
      category: 'Performance',
      tags: ['observability', 'alert-management', 'resolution-time', 'sla'],
      requiredFields: ['alert_id', 'alert_created_time', 'alert_resolved_time', 'severity', 'assigned_to', 'status', 'timestamp', 'category'],
      detectionLogic: 'Calculate mean time to resolution (MTTR) by alert severity and category. Alert when MTTR exceeds SLA thresholds (Critical: 4h, High: 24h, Medium: 72h) or when unresolved alerts exceed age limits.',
      falsePositives: ['Alerts intentionally held for monitoring', 'Duplicate alerts inflating resolution metrics', 'Alerts awaiting external dependency resolution'],
      tuningGuidance: 'Set SLA thresholds by severity tier. Exclude suppressed or informational alerts. Track by assigned team for workload distribution.',
      operationalValue: 'Measures incident response team effectiveness. Identifies bottlenecks and supports staffing decisions. Ensures SLA compliance.',
      changeMgmtRelevance: 'Resolution time changes may indicate staffing changes, process improvements, or new alert volumes from security tool deployments.',
      troubleshootingWorkflow: '1. Identify alerts exceeding SLA thresholds\n2. Determine which severity/category is most affected\n3. Check if specific analysts have overloaded queues\n4. Review if alert volume increased unexpectedly\n5. Assess if automation could reduce resolution time\n6. Report SLA compliance metrics to leadership',
      criblSearchQueries: [
        {
          name: 'Mean time to resolution by severity',
          description: 'Calculate MTTR for security alerts by severity level',
          query: 'dataset="$DATASET" alert_resolved_time!="" earliest=-30d\n| extend resolution_hours=(tolong(alert_resolved_time) - tolong(alert_created_time)) / 3600000\n| summarize MTTR=avg(resolution_hours), P95=max(resolution_hours), Count=count() by severity, category\n| order by MTTR desc'
        },
        {
          name: 'Unresolved alert aging',
          description: 'Track unresolved alerts and their age for SLA monitoring',
          query: 'dataset="$DATASET" status!="resolved" earliest=-7d\n| extend age_hours=(tolong(now()) - tolong(alert_created_time)) / 3600000\n| summarize Alerts=count(), MaxAge=max(age_hours), AvgAge=avg(age_hours) by severity, assigned_to\n| where MaxAge > 24\n| order by MaxAge desc'
        },
        {
          name: 'Resolution time trending',
          description: 'Monitor MTTR trends over time for improvement tracking',
          query: 'dataset="$DATASET" alert_resolved_time!="" earliest=-90d\n| extend resolution_hours=(tolong(alert_resolved_time) - tolong(alert_created_time)) / 3600000\n| timestats span=7d avg_mttr=avg(resolution_hours), p95_mttr=max(resolution_hours) by severity\n| order by avg_mttr desc'
        }
      ]
    },
    {
      id: 'obs-002',
      name: 'Risk Detection Volume',
      objective: 'Track the volume of Identity Protection risk detections to monitor threat landscape changes and plan detection engineering capacity.',
      category: 'Capacity',
      tags: ['observability', 'risk-detection', 'volume', 'identity-protection'],
      requiredFields: ['risk_detection_type', 'risk_level', 'risk_state', 'user_principal_name', 'timestamp', 'detection_timing', 'source'],
      detectionLogic: 'Monitor daily risk detection volumes by type and level. Alert when volume exceeds 2x the 30-day rolling average or when new detection types appear. Track detection-to-investigation ratio for capacity planning.',
      falsePositives: ['New detection rules causing volume spike', 'Onboarding of new tenants increasing baseline', 'Seasonal patterns (travel seasons, holidays)'],
      tuningGuidance: 'Baseline volumes per detection type separately. Account for organizational growth. Track true positive rates alongside volume for quality assessment.',
      operationalValue: 'Enables SOC capacity planning based on detection volume trends. Identifies emerging threat patterns requiring response resources.',
      changeMgmtRelevance: 'Volume changes may indicate new detection rule deployments, tenant onboarding, or environmental changes increasing risk surface.',
      troubleshootingWorkflow: '1. Review volume trends by detection type\n2. Identify if increase is from new detections or repeat events\n3. Check for new detection rules or policy changes\n4. Assess SOC capacity to handle current volume\n5. Evaluate true positive rates for quality\n6. Plan staffing or automation adjustments',
      criblSearchQueries: [
        {
          name: 'Risk detection volume trending',
          description: 'Track daily risk detection volumes by type and level',
          query: 'dataset="$DATASET" risk_detection_type!="" earliest=-30d\n| timestats span=1d detections=count() by risk_detection_type, risk_level\n| order by detections desc'
        },
        {
          name: 'Detection volume by type and state',
          description: 'Break down detections by type and current investigation state',
          query: 'dataset="$DATASET" risk_detection_type!="" earliest=-7d\n| summarize Detections=count(), UniqueUsers=dcount(user_principal_name) by risk_detection_type, risk_level, risk_state\n| order by Detections desc'
        },
        {
          name: 'Detection volume vs baseline comparison',
          description: 'Compare current detection volumes against rolling averages',
          query: 'dataset="$DATASET" risk_detection_type!="" earliest=-7d\n| summarize DailyDetections=count() by risk_detection_type, bin(timestamp, 1d)\n| summarize AvgDaily=avg(DailyDetections), MaxDaily=max(DailyDetections) by risk_detection_type\n| order by AvgDaily desc'
        }
      ]
    },
    {
      id: 'obs-003',
      name: 'Conditional Access Success Rate',
      objective: 'Monitor the success rate of Conditional Access policy evaluations to ensure policies are functioning correctly and not causing access issues.',
      category: 'Reliability',
      tags: ['observability', 'conditional-access', 'policy-health', 'access-reliability'],
      requiredFields: ['ca_policy_name', 'ca_result', 'status', 'user_principal_name', 'app_display_name', 'timestamp', 'device_detail'],
      detectionLogic: 'Track CA policy evaluation success rates per policy. Alert when success rate drops below 95% for any policy (indicating potential misconfiguration) or when not-applied rate increases significantly.',
      falsePositives: ['Policies intentionally blocking non-compliant access', 'Report-only policies with expected failure rates', 'New policies in phased rollout'],
      tuningGuidance: 'Distinguish between intentional blocks and policy failures. Set different thresholds for blocking vs granting policies. Exclude report-only policies from success rate calculations.',
      operationalValue: 'Ensures CA policies function as intended without causing user access disruptions. Identifies misconfigured or problematic policies.',
      changeMgmtRelevance: 'Success rate changes often follow CA policy modifications, tenant configuration updates, or device compliance policy changes.',
      troubleshootingWorkflow: '1. Identify policies with degraded success rates\n2. Determine if failures are intended blocks or errors\n3. Check for recent policy modifications\n4. Review affected users and applications\n5. Assess impact on user productivity\n6. Remediate policy issues and validate',
      criblSearchQueries: [
        {
          name: 'CA policy success rate by policy',
          description: 'Calculate success rates for each Conditional Access policy',
          query: 'dataset="$DATASET" ca_policy_name!="" earliest=-7d\n| summarize Total=count(), Successes=countif(ca_result=="success"), Failures=countif(ca_result=="failure"), NotApplied=countif(ca_result=="notApplied") by ca_policy_name\n| extend SuccessRate=round(Successes*100.0/Total, 2)\n| order by SuccessRate asc'
        },
        {
          name: 'CA success rate trending',
          description: 'Track CA policy success rates over time',
          query: 'dataset="$DATASET" ca_policy_name!="" earliest=-30d\n| timestats span=1d total=count(), successes=countif(ca_result=="success") by ca_policy_name\n| extend success_rate=round(successes*100.0/total, 2)\n| order by success_rate asc'
        },
        {
          name: 'CA failure analysis by application',
          description: 'Identify which applications have highest CA failure rates',
          query: 'dataset="$DATASET" ca_result="failure" earliest=-7d\n| summarize Failures=count(), Policies=values(ca_policy_name), Users=dcount(user_principal_name) by app_display_name\n| order by Failures desc'
        }
      ]
    },
    {
      id: 'obs-004',
      name: 'Sign-In Latency',
      objective: 'Monitor authentication sign-in latencies to detect identity infrastructure performance issues affecting user experience.',
      category: 'Performance',
      tags: ['observability', 'sign-in', 'latency', 'identity-performance'],
      requiredFields: ['processing_time_ms', 'user_principal_name', 'app_display_name', 'status', 'timestamp', 'ca_evaluation_time', 'mfa_time'],
      detectionLogic: 'Track sign-in processing time P50, P95, P99 by application and authentication method. Alert when P95 exceeds 5 seconds or when latency increases more than 50% versus 7-day baseline.',
      falsePositives: ['MFA challenges adding expected latency', 'First-time app consent flows taking longer', 'Network latency from user location'],
      tuningGuidance: 'Separate MFA from non-MFA sign-ins for fair comparison. Track CA evaluation and MFA components separately. Set thresholds per application type.',
      operationalValue: 'Ensures identity infrastructure meets performance SLOs. Identifies authentication bottlenecks before users report issues.',
      changeMgmtRelevance: 'Latency changes may indicate CA policy complexity increases, MFA provider issues, or infrastructure scaling needs.',
      troubleshootingWorkflow: '1. Identify which sign-in component has elevated latency\n2. Break down latency into CA, MFA, and base auth components\n3. Check if specific applications are affected\n4. Review recent CA policy or MFA changes\n5. Assess identity infrastructure capacity\n6. Implement performance optimizations if needed',
      criblSearchQueries: [
        {
          name: 'Sign-in latency percentiles',
          description: 'Calculate authentication latency percentiles by application',
          query: 'dataset="$DATASET" processing_time_ms!="" status="success" earliest=-24h\n| summarize P50=avg(processing_time_ms), P95=max(processing_time_ms), SignIns=count() by app_display_name\n| order by P95 desc'
        },
        {
          name: 'Sign-in latency trending',
          description: 'Visualize sign-in latency trends over time',
          query: 'dataset="$DATASET" processing_time_ms!="" status="success" earliest=-7d\n| timestats span=1h p95_latency=max(processing_time_ms), avg_latency=avg(processing_time_ms)\n| order by p95_latency desc'
        },
        {
          name: 'Latency component breakdown',
          description: 'Break down sign-in latency into CA evaluation and MFA components',
          query: 'dataset="$DATASET" processing_time_ms!="" earliest=-24h\n| summarize AvgTotal=avg(processing_time_ms), AvgCA=avg(ca_evaluation_time), AvgMFA=avg(mfa_time), SignIns=count() by app_display_name\n| order by AvgTotal desc'
        }
      ]
    },
    {
      id: 'obs-005',
      name: 'Incident Correlation Rate',
      objective: 'Monitor the rate at which related security alerts are being correlated into incidents, measuring detection engineering effectiveness.',
      category: 'Health',
      tags: ['observability', 'incident-correlation', 'detection-engineering', 'effectiveness'],
      requiredFields: ['alert_id', 'incident_id', 'correlation_rule', 'alerts_in_incident', 'timestamp', 'severity', 'category'],
      detectionLogic: 'Track percentage of alerts that get correlated into incidents versus standalone alerts. Alert when correlation rate drops below baseline (indicating potential rule failures) or when incident-to-alert ratio changes significantly.',
      falsePositives: ['New alert types not yet having correlation rules', 'Low-severity alerts intentionally not correlated', 'Correlation engine latency causing temporary gaps'],
      tuningGuidance: 'Set correlation rate expectations by alert category. Account for intentionally uncorrelated low-severity alerts. Monitor correlation latency separately.',
      operationalValue: 'Measures detection engineering effectiveness and alert correlation quality. Identifies gaps in correlation rules needing development.',
      changeMgmtRelevance: 'Correlation rate changes indicate new correlation rule deployments, alert source additions, or detection engineering improvements.',
      troubleshootingWorkflow: '1. Review correlation rate trends by category\n2. Identify uncorrelated alert types\n3. Check if correlation rules are functioning\n4. Assess if new rules are needed for uncovered alerts\n5. Review incident quality for over-correlation\n6. Optimize correlation rules based on findings',
      criblSearchQueries: [
        {
          name: 'Alert correlation rate',
          description: 'Calculate percentage of alerts correlated into incidents',
          query: 'dataset="$DATASET" alert_id!="" earliest=-30d\n| summarize TotalAlerts=count(), Correlated=countif(incident_id!=""), Uncorrelated=countif(incident_id=="") by category, severity\n| extend CorrelationRate=round(Correlated*100.0/TotalAlerts, 2)\n| order by CorrelationRate asc'
        },
        {
          name: 'Correlation rate trending',
          description: 'Track alert-to-incident correlation over time',
          query: 'dataset="$DATASET" alert_id!="" earliest=-30d\n| timestats span=1d total_alerts=count(), correlated=countif(incident_id!="")\n| extend correlation_rate=round(correlated*100.0/total_alerts, 2)\n| order by correlation_rate asc'
        },
        {
          name: 'Incidents by alert count',
          description: 'Analyze incident sizes to assess correlation quality',
          query: 'dataset="$DATASET" incident_id!="" earliest=-30d\n| summarize AlertsPerIncident=count(), Severities=values(severity), Categories=values(category) by incident_id\n| summarize AvgAlerts=avg(AlertsPerIncident), MaxAlerts=max(AlertsPerIncident), Incidents=count()\n| order by AvgAlerts desc'
        }
      ]
    },
    {
      id: 'obs-006',
      name: 'Service Health by Provider',
      objective: 'Monitor Microsoft 365 service health status to correlate with sign-in issues and proactively communicate outages to users.',
      category: 'Availability',
      tags: ['observability', 'service-health', 'availability', 'provider-status'],
      requiredFields: ['service_name', 'health_status', 'issue_type', 'affected_users_count', 'timestamp', 'start_time', 'end_time'],
      detectionLogic: 'Monitor service health status changes for all Microsoft 365 services. Alert on any degradation or outage affecting production services. Track duration and affected user count for impact assessment.',
      falsePositives: ['Advisory notices not affecting users', 'Resolved issues still showing in status', 'Geographic-specific issues not affecting all users'],
      tuningGuidance: 'Set alert thresholds based on service criticality. Distinguish between advisories, degradation, and outages. Filter by geographic relevance.',
      operationalValue: 'Enables proactive user communication during outages. Supports root cause analysis for internal issues that coincide with provider problems.',
      changeMgmtRelevance: 'Provider health issues correlate with internal user-reported problems. Useful for distinguishing internal vs external root causes.',
      troubleshootingWorkflow: '1. Check current service health status\n2. Identify affected services and scope\n3. Determine estimated impact on users\n4. Correlate with internal incident reports\n5. Communicate status to affected teams\n6. Monitor for resolution and verify recovery',
      criblSearchQueries: [
        {
          name: 'Current service health status',
          description: 'View current health status of all Microsoft 365 services',
          query: 'dataset="$DATASET" health_status!="healthy" earliest=-24h\n| summarize Issues=count(), AffectedUsers=max(affected_users_count), EarliestStart=min(start_time) by service_name, health_status, issue_type\n| extend Duration=(tolong(now()) - tolong(EarliestStart)) / 3600000\n| order by AffectedUsers desc'
        },
        {
          name: 'Service health history',
          description: 'Track service health events over time for reliability reporting',
          query: 'dataset="$DATASET" health_status!="healthy" earliest=-30d\n| extend incident_hours=(tolong(end_time) - tolong(start_time)) / 3600000\n| summarize Incidents=count(), TotalDuration=sum(incident_hours), MaxAffected=max(affected_users_count) by service_name\n| order by Incidents desc'
        },
        {
          name: 'Service availability percentage',
          description: 'Calculate uptime percentages per service',
          query: 'dataset="$DATASET" earliest=-30d\n| timestats span=1h checks=count(), healthy=countif(health_status=="healthy") by service_name\n| extend availability=round(healthy*100.0/checks, 3)\n| summarize AvgAvailability=avg(availability), MinAvailability=min(availability) by service_name\n| order by AvgAvailability asc'
        }
      ]
    },
    {
      id: 'obs-007',
      name: 'Stale Alert Cleanup',
      objective: 'Monitor for security alerts that remain unresolved beyond their expected lifecycle, indicating process failures or abandoned investigations.',
      category: 'Health',
      tags: ['observability', 'alert-hygiene', 'queue-management', 'process-health'],
      requiredFields: ['alert_id', 'status', 'severity', 'assigned_to', 'alert_created_time', 'last_updated_time', 'timestamp', 'category'],
      detectionLogic: 'Track alerts with status not-resolved and last_updated exceeding staleness thresholds (Critical: 48h, High: 7d, Medium: 14d, Low: 30d). Alert when stale alert count increases or when a percentage exceeds 10% of total open alerts.',
      falsePositives: ['Alerts deliberately held for long-term monitoring', 'Alerts pending external action (vendor, legal)', 'Suppressed alerts counted in metrics'],
      tuningGuidance: 'Set staleness thresholds by severity. Exclude alerts with specific status tags (monitoring, pending-external). Track by assigned team for workload visibility.',
      operationalValue: 'Maintains alert queue hygiene and prevents investigation abandonment. Supports SOC management in identifying process gaps.',
      changeMgmtRelevance: 'Stale alert accumulation may indicate understaffing, process changes, or alert fatigue from noisy detection rules.',
      troubleshootingWorkflow: '1. Identify alerts exceeding staleness thresholds\n2. Check if assigned analyst is still working the case\n3. Determine if the alert should be resolved, escalated, or reassigned\n4. Review if process changes are causing abandonment\n5. Assess team workload and capacity\n6. Implement queue management improvements',
      criblSearchQueries: [
        {
          name: 'Stale alert inventory',
          description: 'Find alerts exceeding staleness thresholds by severity',
          query: 'dataset="$DATASET" status!="resolved" earliest=-90d\n| extend age_days=(tolong(now()) - tolong(alert_created_time)) / 86400000, idle_days=(tolong(now()) - tolong(last_updated_time)) / 86400000\n| where idle_days > 7\n| summarize StaleAlerts=count(), MaxAge=max(age_days), MaxIdle=max(idle_days) by severity, assigned_to\n| order by StaleAlerts desc'
        },
        {
          name: 'Stale alert trending',
          description: 'Track stale alert count over time for queue health monitoring',
          query: 'dataset="$DATASET" status!="resolved" earliest=-30d\n| extend idle_days=(tolong(now()) - tolong(last_updated_time)) / 86400000\n| where idle_days > 7\n| timestats span=1d stale_alerts=count() by severity\n| order by stale_alerts desc'
        },
        {
          name: 'Alert queue health summary',
          description: 'Overall alert queue health metrics including stale percentage',
          query: 'dataset="$DATASET" status!="resolved" earliest=-7d\n| extend idle_days=(tolong(now()) - tolong(last_updated_time)) / 86400000\n| summarize Total=count(), Stale=countif(idle_days > 7), VeryStale=countif(idle_days > 30) by severity\n| extend StalePct=round(Stale*100.0/Total, 2)\n| order by StalePct desc'
        }
      ]
    }
  ],

  'netflow': [
    {
      id: 'obs-001',
      name: 'Interface Utilization Trending',
      objective: 'Monitor network interface utilization over time to identify capacity constraints, plan upgrades, and detect utilization anomalies.',
      category: 'Capacity',
      tags: ['observability', 'interface', 'utilization', 'capacity-planning'],
      requiredFields: ['exporter_ip', 'input_interface', 'output_interface', 'bytes_in', 'bytes_out', 'packets', 'timestamp'],
      detectionLogic: 'Calculate interface utilization as percentage of link capacity. Alert when sustained utilization exceeds 80% for 15+ minutes or when utilization trending indicates capacity exhaustion within 30 days.',
      falsePositives: ['Planned bulk data transfers', 'Backup windows with expected high utilization', 'Interface speed misreported in SNMP'],
      tuningGuidance: 'Set capacity per interface based on link speed. Account for asymmetric links. Use different thresholds for backbone vs access interfaces.',
      operationalValue: 'Prevents capacity-related outages through proactive monitoring. Supports network capacity planning and upgrade prioritization.',
      changeMgmtRelevance: 'Utilization changes correlate with new service deployments, traffic migrations, or routing changes that shift load between interfaces.',
      troubleshootingWorkflow: '1. Identify interfaces approaching capacity\n2. Determine which traffic is driving utilization\n3. Check if utilization is sustained or burst\n4. Review top talkers consuming bandwidth\n5. Assess if traffic engineering can redistribute load\n6. Plan capacity upgrades if trending toward limits',
      criblSearchQueries: [
        {
          name: 'Interface utilization by exporter',
          description: 'Calculate current utilization per interface',
          query: 'dataset="$DATASET" earliest=-24h\n| summarize TotalBytesIn=sum(bytes_in), TotalBytesOut=sum(bytes_out), Flows=count() by exporter_ip, input_interface\n| extend TotalBytes=TotalBytesIn + TotalBytesOut\n| order by TotalBytes desc'
        },
        {
          name: 'Utilization trending over time',
          description: 'Visualize interface utilization trends for capacity planning',
          query: 'dataset="$DATASET" earliest=-7d\n| timestats span=1h total_bytes=sum(bytes_in + bytes_out) by exporter_ip, input_interface\n| order by total_bytes desc'
        },
        {
          name: 'Peak utilization analysis',
          description: 'Identify peak utilization periods and interfaces under pressure',
          query: 'dataset="$DATASET" earliest=-7d\n| timestats span=15m period_bytes=sum(bytes_in + bytes_out) by exporter_ip, input_interface\n| summarize PeakBytes=max(period_bytes), AvgBytes=avg(period_bytes), P95Bytes=max(period_bytes) by exporter_ip, input_interface\n| order by PeakBytes desc'
        }
      ]
    },
    {
      id: 'obs-002',
      name: 'Top Talkers by Bytes',
      objective: 'Track the highest bandwidth consumers on the network to support capacity planning, cost allocation, and anomaly detection.',
      category: 'Capacity',
      tags: ['observability', 'top-talkers', 'bandwidth', 'usage-analysis'],
      requiredFields: ['src_ip', 'dst_ip', 'bytes_out', 'bytes_in', 'protocol', 'dst_port', 'exporter_ip', 'timestamp'],
      detectionLogic: 'Calculate top bandwidth consumers per 15-minute interval. Alert when new hosts appear in top-10 that were not previously top talkers, or when existing top talkers increase volume by more than 50% versus baseline.',
      falsePositives: ['Scheduled backup jobs during maintenance windows', 'Legitimate large file transfers', 'Video conferencing during all-hands meetings'],
      tuningGuidance: 'Set baselines per host based on 30-day history. Account for time-of-day patterns. Differentiate between server and client top talkers.',
      operationalValue: 'Identifies bandwidth-intensive hosts for cost allocation and capacity planning. Detects unexpected consumption that may indicate issues.',
      changeMgmtRelevance: 'New top talkers often appear after service deployments, data migration projects, or infrastructure changes.',
      troubleshootingWorkflow: '1. Identify current top bandwidth consumers\n2. Determine if consumption matches expected patterns\n3. Check if new hosts appeared in top talkers list\n4. Review traffic type and destination\n5. Assess capacity impact on shared infrastructure\n6. Take action on anomalous consumption',
      criblSearchQueries: [
        {
          name: 'Top talkers by total bytes',
          description: 'Identify the highest bandwidth-consuming hosts',
          query: 'dataset="$DATASET" earliest=-24h\n| summarize TotalBytes=sum(bytes_in + bytes_out), BytesOut=sum(bytes_out), BytesIn=sum(bytes_in), Flows=count() by src_ip\n| order by TotalBytes desc\n| limit 25'
        },
        {
          name: 'Top talker trending',
          description: 'Track top consumer bandwidth usage over time',
          query: 'dataset="$DATASET" earliest=-7d\n| summarize HourlyBytes=sum(bytes_in + bytes_out) by src_ip, bin(timestamp, 1h)\n| summarize AvgHourly=avg(HourlyBytes), MaxHourly=max(HourlyBytes) by src_ip\n| order by AvgHourly desc\n| limit 25'
        },
        {
          name: 'Top conversation pairs',
          description: 'Identify the highest-volume source-destination pairs',
          query: 'dataset="$DATASET" earliest=-24h\n| summarize TotalBytes=sum(bytes_in + bytes_out), Flows=count(), Protocols=values(protocol) by src_ip, dst_ip\n| order by TotalBytes desc\n| limit 25'
        }
      ]
    },
    {
      id: 'obs-003',
      name: 'Protocol Distribution Shift',
      objective: 'Monitor changes in protocol distribution over time to detect infrastructure changes, new services, or unexpected traffic patterns.',
      category: 'Change Management',
      tags: ['observability', 'protocol-distribution', 'change-detection', 'baseline'],
      requiredFields: ['protocol', 'dst_port', 'bytes_out', 'bytes_in', 'packets', 'exporter_ip', 'timestamp'],
      detectionLogic: 'Track protocol and port distribution as percentage of total traffic. Alert when any protocol share shifts more than 10% from 7-day baseline or when previously unseen protocols appear with significant volume.',
      falsePositives: ['Planned application migrations shifting protocol mix', 'Seasonal traffic patterns', 'Monitoring changes affecting visibility'],
      tuningGuidance: 'Build baselines over 30 days for stability. Track by byte volume and flow count separately. Account for known scheduled changes.',
      operationalValue: 'Detects unexpected infrastructure changes and helps validate planned migrations. Provides ongoing visibility into traffic composition.',
      changeMgmtRelevance: 'Protocol distribution shifts directly measure the network impact of application deployments, migrations, and decommissions.',
      troubleshootingWorkflow: '1. Identify which protocols shifted in distribution\n2. Determine if shift is expected from planned changes\n3. Check if new protocols appeared unexpectedly\n4. Review what services are generating new traffic\n5. Validate against change management records\n6. Update baselines if shift is confirmed intentional',
      criblSearchQueries: [
        {
          name: 'Current protocol distribution',
          description: 'Show traffic breakdown by protocol and top ports',
          query: 'dataset="$DATASET" earliest=-24h\n| summarize TotalBytes=sum(bytes_in + bytes_out), Flows=count() by protocol, dst_port\n| extend BytePct=round(TotalBytes*100.0/sum(TotalBytes), 2)\n| order by TotalBytes desc\n| limit 25'
        },
        {
          name: 'Protocol distribution trending',
          description: 'Track protocol mix changes over time',
          query: 'dataset="$DATASET" earliest=-30d\n| timestats span=1d bytes=sum(bytes_in + bytes_out) by protocol\n| order by bytes desc'
        },
        {
          name: 'Protocol shift week-over-week',
          description: 'Compare current protocol distribution against prior week',
          query: 'dataset="$DATASET" earliest=-14d\n| extend week=iff(timestamp > ago(7d), "current", "prior")\n| summarize Bytes=sum(bytes_in + bytes_out), Flows=count() by week, protocol\n| order by Bytes desc'
        }
      ]
    },
    {
      id: 'obs-004',
      name: 'Flow Rate per Exporter',
      objective: 'Monitor the flow export rate per collector to detect exporter health issues, sampling changes, or collection infrastructure problems.',
      category: 'Health',
      tags: ['observability', 'exporter-health', 'flow-rate', 'collection'],
      requiredFields: ['exporter_ip', 'timestamp', 'flow_sequence', 'sampling_rate', 'packets', 'bytes_in'],
      detectionLogic: 'Track flows per minute per exporter against historical baseline. Alert when flow rate drops more than 50% (potential exporter issue) or increases more than 100% (potential sampling change or loop).',
      falsePositives: ['Planned maintenance on network devices', 'Traffic reduction during off-peak hours', 'Sampling rate intentionally changed'],
      tuningGuidance: 'Baseline per exporter with time-of-day awareness. Account for known maintenance windows. Set different thresholds for core vs edge exporters.',
      operationalValue: 'Ensures netflow collection infrastructure is functioning correctly. Detects exporter failures before they become visibility gaps.',
      changeMgmtRelevance: 'Flow rate changes correlate with exporter configuration changes, firmware updates, or sampling rate modifications.',
      troubleshootingWorkflow: '1. Identify exporters with abnormal flow rates\n2. Check if flow rate change is drop or spike\n3. Review exporter device health and reachability\n4. Check for configuration or firmware changes\n5. Verify collection infrastructure capacity\n6. Remediate and confirm data continuity',
      criblSearchQueries: [
        {
          name: 'Flow rate by exporter',
          description: 'Monitor current flow export rates per device',
          query: 'dataset="$DATASET" earliest=-24h\n| timestats span=15m flows=count() by exporter_ip\n| summarize AvgFlowRate=avg(flows), MaxFlowRate=max(flows), MinFlowRate=min(flows) by exporter_ip\n| order by AvgFlowRate desc'
        },
        {
          name: 'Exporter flow rate trending',
          description: 'Visualize flow rates over time per exporter for health monitoring',
          query: 'dataset="$DATASET" earliest=-7d\n| timestats span=1h flows=count() by exporter_ip\n| order by flows desc'
        },
        {
          name: 'Exporter flow rate anomalies',
          description: 'Detect exporters with flow rates significantly different from baseline',
          query: 'dataset="$DATASET" earliest=-4h\n| timestats span=15m flows=count() by exporter_ip\n| summarize CurrentRate=avg(flows), MinRate=min(flows) by exporter_ip\n| where MinRate < 10\n| order by CurrentRate asc'
        }
      ]
    },
    {
      id: 'obs-005',
      name: 'Packet Loss Indicators',
      objective: 'Detect indicators of packet loss from netflow data by analyzing retransmission patterns and TCP flag anomalies.',
      category: 'Reliability',
      tags: ['observability', 'packet-loss', 'reliability', 'network-quality'],
      requiredFields: ['src_ip', 'dst_ip', 'tcp_flags', 'packets', 'bytes_out', 'bytes_in', 'protocol', 'exporter_ip', 'timestamp'],
      detectionLogic: 'Analyze TCP flag patterns for indicators of retransmission (high RST rates, repeated SYN without SYN-ACK). Alert when reset rate exceeds 5% of total flows per interface or when connection failure rate spikes.',
      falsePositives: ['Application-level connection resets (normal for web traffic)', 'Port scanning triggering RST responses', 'Load balancer health checks with expected resets'],
      tuningGuidance: 'Baseline RST rates per interface as they vary by traffic type. Exclude known scanner traffic. Focus on changes from baseline rather than absolute values.',
      operationalValue: 'Provides early indication of network path issues before they cause application failures. Supports network reliability monitoring.',
      changeMgmtRelevance: 'Packet loss indicator changes may correlate with routing changes, interface errors, or congestion from new traffic sources.',
      troubleshootingWorkflow: '1. Identify interfaces or paths with elevated loss indicators\n2. Check TCP reset rates vs baseline\n3. Correlate with interface error counters\n4. Determine if specific source-destination pairs are affected\n5. Review routing path for the affected flows\n6. Escalate to network engineering for path remediation',
      criblSearchQueries: [
        {
          name: 'TCP reset rate by interface',
          description: 'Calculate RST flag rates as indicator of connection issues',
          query: 'dataset="$DATASET" protocol="TCP" earliest=-24h\n| summarize TotalFlows=count(), RSTFlows=countif(tcp_flags has "RST"), SYNOnly=countif(tcp_flags=="SYN") by exporter_ip, input_interface\n| extend RSTRate=round(RSTFlows*100.0/TotalFlows, 2)\n| where RSTRate > 5\n| order by RSTRate desc'
        },
        {
          name: 'Connection failure trending',
          description: 'Track connection failure indicators over time',
          query: 'dataset="$DATASET" protocol="TCP" earliest=-7d\n| timestats span=1h total=count(), resets=countif(tcp_flags has "RST") by exporter_ip\n| extend rst_rate=round(resets*100.0/total, 2)\n| order by rst_rate desc'
        },
        {
          name: 'Top paths with loss indicators',
          description: 'Identify source-destination pairs with highest loss indicator rates',
          query: 'dataset="$DATASET" protocol="TCP" tcp_flags has "RST" earliest=-24h\n| summarize Resets=count(), TotalBytes=sum(bytes_out + bytes_in) by src_ip, dst_ip, exporter_ip\n| order by Resets desc\n| limit 25'
        }
      ]
    },
    {
      id: 'obs-006',
      name: 'AS Path Changes',
      objective: 'Detect changes in autonomous system paths for traffic flows, indicating routing changes that may affect performance or availability.',
      category: 'Change Management',
      tags: ['observability', 'bgp', 'routing', 'as-path', 'change-detection'],
      requiredFields: ['src_ip', 'dst_ip', 'dst_as', 'src_as', 'next_hop', 'exporter_ip', 'timestamp', 'bytes_out'],
      detectionLogic: 'Track AS path associations for destination prefixes. Alert when previously stable AS paths change, when new AS paths appear for established destinations, or when traffic shifts between AS paths.',
      falsePositives: ['Normal BGP route optimization', 'Planned provider changes', 'Anycast services with multiple AS paths'],
      tuningGuidance: 'Build AS path baselines per destination prefix over 7 days. Focus on high-traffic destinations. Account for anycast and CDN destinations with expected path variation.',
      operationalValue: 'Provides visibility into routing changes that may affect application performance or availability. Supports troubleshooting of sudden performance degradation.',
      changeMgmtRelevance: 'AS path changes directly indicate routing infrastructure modifications, provider changes, or BGP policy updates.',
      troubleshootingWorkflow: '1. Identify which destinations have changed AS paths\n2. Determine if this is an expected provider change\n3. Check if performance is affected by the new path\n4. Review BGP configuration for intentional changes\n5. Assess if the new path is stable\n6. Document the change for operational awareness',
      criblSearchQueries: [
        {
          name: 'AS path diversity by destination',
          description: 'Find destinations with multiple AS paths indicating routing changes',
          query: 'dataset="$DATASET" dst_as!="" earliest=-24h\n| summarize UniqueAS=dcount(dst_as), ASPaths=values(dst_as), NextHops=values(next_hop), Bytes=sum(bytes_out) by dst_ip\n| where UniqueAS > 1\n| order by Bytes desc'
        },
        {
          name: 'AS path changes over time',
          description: 'Track AS path changes for key destinations',
          query: 'dataset="$DATASET" dst_as!="" earliest=-7d\n| timestats span=1d unique_paths=dcount(dst_as), as_list=values(dst_as) by dst_ip\n| where unique_paths > 1\n| order by unique_paths desc'
        },
        {
          name: 'Next-hop distribution shift',
          description: 'Detect shifts in traffic distribution across next-hop routers',
          query: 'dataset="$DATASET" next_hop!="" earliest=-24h\n| summarize Bytes=sum(bytes_out), Flows=count(), Destinations=dcount(dst_ip) by next_hop, exporter_ip\n| order by Bytes desc'
        }
      ]
    },
    {
      id: 'obs-007',
      name: 'Sampling Rate Verification',
      objective: 'Monitor and verify netflow sampling rates per exporter to ensure accurate traffic volume calculations and detect configuration drift.',
      category: 'Health',
      tags: ['observability', 'sampling', 'accuracy', 'data-quality'],
      requiredFields: ['exporter_ip', 'sampling_rate', 'packets', 'bytes_in', 'bytes_out', 'timestamp', 'flow_sequence'],
      detectionLogic: 'Track reported sampling rates per exporter and alert when rates change from expected configuration. Also detect potential sampling issues by comparing flow sequence gaps against expected sampling intervals.',
      falsePositives: ['Sampling rate changed intentionally during maintenance', 'Mixed sampling rates on multi-interface exporters', 'Dynamic sampling implementations adjusting rates'],
      tuningGuidance: 'Document expected sampling rate per exporter. Set tight thresholds for sampling rate changes as they affect all volume calculations. Account for exporters with adaptive sampling.',
      operationalValue: 'Ensures netflow-derived metrics are accurate by verifying sampling configuration. Prevents incorrect capacity planning from misconfigured sampling.',
      changeMgmtRelevance: 'Sampling rate changes must be reflected in monitoring calculations. Undocumented changes can cause false capacity alerts or missed utilization issues.',
      troubleshootingWorkflow: '1. Identify exporters with sampling rate changes\n2. Verify if the change was planned and documented\n3. Check impact on volume calculations and alerts\n4. Update monitoring multipliers if change is intentional\n5. Revert if change was unintentional\n6. Validate historical data accuracy for affected period',
      criblSearchQueries: [
        {
          name: 'Sampling rate by exporter',
          description: 'Verify current sampling rates per exporter',
          query: 'dataset="$DATASET" sampling_rate!="" earliest=-24h\n| summarize CurrentRate=latest(sampling_rate), Rates=dcount(sampling_rate), RateValues=values(sampling_rate), Flows=count() by exporter_ip\n| order by Rates desc'
        },
        {
          name: 'Sampling rate changes over time',
          description: 'Detect when sampling rates changed per exporter',
          query: 'dataset="$DATASET" sampling_rate!="" earliest=-7d\n| timestats span=1h rates=values(sampling_rate), unique_rates=dcount(sampling_rate) by exporter_ip\n| where unique_rates > 1\n| order by unique_rates desc'
        },
        {
          name: 'Flow sequence gap analysis',
          description: 'Detect potential flow export gaps from sequence number analysis',
          query: 'dataset="$DATASET" flow_sequence!="" earliest=-4h\n| summarize MinSeq=min(flow_sequence), MaxSeq=max(flow_sequence), Flows=count() by exporter_ip\n| extend ExpectedFlows=MaxSeq - MinSeq, GapPct=round((1 - Flows*1.0/(MaxSeq - MinSeq))*100, 2)\n| where GapPct > 5\n| order by GapPct desc'
        }
      ]
    }
  ],

  'ipfix': [
    {
      id: 'obs-001',
      name: 'Bandwidth Utilization by Application',
      objective: 'Monitor bandwidth consumption per application to support capacity planning, QoS decisions, and application performance management.',
      category: 'Capacity',
      tags: ['observability', 'bandwidth', 'application', 'capacity-planning'],
      requiredFields: ['application_id', 'application_name', 'octet_count', 'packet_count', 'src_ip', 'dst_ip', 'exporter_ip', 'timestamp'],
      detectionLogic: 'Track bandwidth consumption per application_id over time. Alert when any application exceeds its allocated bandwidth share or when new applications consume more than 5% of total capacity without prior allocation.',
      falsePositives: ['Planned bulk data transfers for specific applications', 'Application updates consuming temporary high bandwidth', 'Time-of-day variations for business applications'],
      tuningGuidance: 'Set bandwidth allocations per application based on business priority. Account for time-of-day patterns. Track both absolute consumption and percentage of total.',
      operationalValue: 'Enables application-aware capacity management and QoS optimization. Identifies bandwidth-hungry applications for optimization or upgrade.',
      changeMgmtRelevance: 'Bandwidth distribution shifts indicate new application deployments, user adoption changes, or application behavior modifications.',
      troubleshootingWorkflow: '1. Identify applications consuming most bandwidth\n2. Compare against allocated bandwidth budgets\n3. Check if consumption matches expected patterns\n4. Identify new applications appearing in top consumers\n5. Assess QoS policy effectiveness\n6. Recommend bandwidth allocation adjustments',
      criblSearchQueries: [
        {
          name: 'Bandwidth by application',
          description: 'Show current bandwidth consumption per application',
          query: 'dataset="$DATASET" earliest=-24h\n| summarize TotalOctets=sum(octet_count), Flows=count(), Sources=dcount(src_ip) by application_id, application_name\n| extend BandwidthPct=round(TotalOctets*100.0/sum(TotalOctets), 2)\n| order by TotalOctets desc'
        },
        {
          name: 'Application bandwidth trending',
          description: 'Track bandwidth consumption per application over time',
          query: 'dataset="$DATASET" earliest=-7d\n| timestats span=1h octets=sum(octet_count) by application_name\n| order by octets desc'
        },
        {
          name: 'New applications consuming significant bandwidth',
          description: 'Identify applications newly appearing in top bandwidth consumers',
          query: 'dataset="$DATASET" earliest=-24h\n| summarize TotalOctets=sum(octet_count), FirstSeen=min(timestamp), Sources=dcount(src_ip) by application_id, application_name\n| where TotalOctets > 1073741824\n| order by FirstSeen desc'
        }
      ]
    },
    {
      id: 'obs-002',
      name: 'Flow Table Capacity',
      objective: 'Monitor IPFIX flow table utilization on exporters to prevent flow table exhaustion and associated data loss.',
      category: 'Capacity',
      tags: ['observability', 'flow-table', 'exporter-capacity', 'data-quality'],
      requiredFields: ['exporter_ip', 'active_flows', 'flow_table_size', 'flows_expired', 'flows_created', 'timestamp'],
      detectionLogic: 'Track active flow count against flow table capacity per exporter. Alert when utilization exceeds 80% (warning) or 90% (critical). Monitor flow creation and expiration rates to predict exhaustion.',
      falsePositives: ['Expected high flow counts during peak business hours', 'DDoS events temporarily increasing flow count', 'Flow table size misreported after firmware update'],
      tuningGuidance: 'Set thresholds based on documented flow table sizes per device model. Account for traffic pattern variations. Monitor both absolute utilization and rate of change.',
      operationalValue: 'Prevents flow table exhaustion which causes flow drops and monitoring blind spots. Supports exporter capacity planning.',
      changeMgmtRelevance: 'Flow table pressure changes may indicate new traffic patterns from service deployments or routing changes directing more flows through specific exporters.',
      troubleshootingWorkflow: '1. Identify exporters approaching flow table capacity\n2. Check current active flow count vs capacity\n3. Review flow creation/expiration rates\n4. Determine which traffic is creating most flows\n5. Consider flow timeout tuning or table expansion\n6. Plan hardware upgrade if capacity is structurally insufficient',
      criblSearchQueries: [
        {
          name: 'Flow table utilization by exporter',
          description: 'Monitor flow table fill levels per device',
          query: 'dataset="$DATASET" active_flows!="" earliest=-24h\n| summarize AvgActiveFlows=avg(active_flows), MaxActiveFlows=max(active_flows), TableSize=max(flow_table_size) by exporter_ip\n| extend UtilizationPct=round(MaxActiveFlows*100.0/TableSize, 2)\n| order by UtilizationPct desc'
        },
        {
          name: 'Flow table utilization trending',
          description: 'Track flow table fill levels over time for capacity forecasting',
          query: 'dataset="$DATASET" active_flows!="" earliest=-7d\n| timestats span=1h peak_flows=max(active_flows) by exporter_ip\n| order by peak_flows desc'
        },
        {
          name: 'Flow creation and expiration rates',
          description: 'Monitor flow churn rates for table capacity assessment',
          query: 'dataset="$DATASET" flows_created!="" earliest=-4h\n| timestats span=15m created=sum(flows_created), expired=sum(flows_expired) by exporter_ip\n| extend net_change=created - expired\n| order by net_change desc'
        }
      ]
    },
    {
      id: 'obs-003',
      name: 'Application Performance Baseline',
      objective: 'Establish and monitor application performance baselines using IPFIX flow metrics to detect degradation early.',
      category: 'Performance',
      tags: ['observability', 'application-performance', 'baseline', 'degradation-detection'],
      requiredFields: ['application_id', 'application_name', 'octet_count', 'packet_count', 'flow_duration', 'dst_port', 'timestamp', 'exporter_ip'],
      detectionLogic: 'Calculate per-application performance baselines including bytes-per-flow, packets-per-flow, and flow duration. Alert when current metrics deviate more than 2 standard deviations from 7-day baseline.',
      falsePositives: ['Application updates changing traffic patterns', 'User behavior shifts (e.g., video vs text)', 'Network path changes affecting flow characteristics'],
      tuningGuidance: 'Build baselines per application over 7-14 days. Account for time-of-day variations. Focus on applications with consistent patterns for best signal.',
      operationalValue: 'Provides early detection of application performance issues at the network layer. Complements application-level monitoring with network perspective.',
      changeMgmtRelevance: 'Application performance baseline shifts often follow code deployments, infrastructure changes, or configuration updates.',
      troubleshootingWorkflow: '1. Identify applications with baseline deviations\n2. Determine which metrics are anomalous (bytes, duration, packets)\n3. Check if network path changed for affected application\n4. Review application-level metrics for correlation\n5. Determine if deviation is network or application issue\n6. Coordinate remediation with appropriate team',
      criblSearchQueries: [
        {
          name: 'Application performance metrics',
          description: 'Calculate key performance metrics per application',
          query: 'dataset="$DATASET" earliest=-24h\n| summarize AvgBytesPerFlow=avg(octet_count), AvgPktsPerFlow=avg(packet_count), AvgDuration=avg(flow_duration), Flows=count() by application_name\n| order by Flows desc'
        },
        {
          name: 'Performance baseline trending',
          description: 'Track application performance metrics over time for baseline comparison',
          query: 'dataset="$DATASET" earliest=-7d\n| timestats span=1h avg_bytes=avg(octet_count), avg_duration=avg(flow_duration), avg_packets=avg(packet_count) by application_name\n| order by avg_bytes desc'
        },
        {
          name: 'Performance deviation detection',
          description: 'Find applications with metrics significantly different from baseline',
          query: 'dataset="$DATASET" earliest=-1h\n| summarize CurrentAvgBytes=avg(octet_count), CurrentAvgDuration=avg(flow_duration), Flows=count() by application_name\n| where Flows > 100\n| order by CurrentAvgBytes desc'
        }
      ]
    },
    {
      id: 'obs-004',
      name: 'Interface Error Correlation',
      objective: 'Correlate IPFIX flow data with interface error indicators to identify paths experiencing quality degradation.',
      category: 'Reliability',
      tags: ['observability', 'interface-errors', 'correlation', 'path-quality'],
      requiredFields: ['exporter_ip', 'input_interface', 'output_interface', 'packet_count', 'octet_count', 'flow_duration', 'tcp_flags', 'timestamp'],
      detectionLogic: 'Correlate flow-level indicators (TCP resets, short-lived flows, low byte-per-packet ratios) with interface-level patterns. Alert when error indicators cluster on specific interfaces suggesting hardware or path issues.',
      falsePositives: ['Application-level resets unrelated to interface errors', 'Short flows from legitimate connection patterns', 'Interface counters wrapping causing false spikes'],
      tuningGuidance: 'Baseline error indicators per interface. Focus on changes from baseline rather than absolute values. Correlate with SNMP interface error counters when available.',
      operationalValue: 'Identifies failing network paths using flow-level indicators. Supports proactive hardware replacement and path remediation.',
      changeMgmtRelevance: 'Interface error patterns may appear after hardware changes, firmware updates, or cabling modifications.',
      troubleshootingWorkflow: '1. Identify interfaces with elevated error indicators\n2. Review TCP reset rates and short-flow rates per interface\n3. Correlate with SNMP error counters if available\n4. Check for specific source-destination pairs affected\n5. Assess if physical layer issues exist\n6. Plan remediation (reroute, replace, repair)',
      criblSearchQueries: [
        {
          name: 'Interface error indicators from flow data',
          description: 'Detect interfaces with high rates of error-indicating flow patterns',
          query: 'dataset="$DATASET" protocol="TCP" earliest=-24h\n| summarize TotalFlows=count(), ResetFlows=countif(tcp_flags has "RST"), ShortFlows=countif(flow_duration < 1) by exporter_ip, input_interface\n| extend ResetRate=round(ResetFlows*100.0/TotalFlows, 2), ShortRate=round(ShortFlows*100.0/TotalFlows, 2)\n| where ResetRate > 5 or ShortRate > 10\n| order by ResetRate desc'
        },
        {
          name: 'Error indicator trending by interface',
          description: 'Track error indicators over time per interface',
          query: 'dataset="$DATASET" protocol="TCP" earliest=-7d\n| timestats span=1h countif(tcp_flags has "RST")*100.0/rst_rate=count() by exporter_ip, input_interface\n| where rst_rate > 3\n| order by rst_rate desc'
        },
        {
          name: 'Affected flows on error interfaces',
          description: 'Identify which source-destination pairs are affected by interface errors',
          query: 'dataset="$DATASET" tcp_flags has "RST" earliest=-24h\n| summarize Resets=count(), Bytes=sum(octet_count) by src_ip, dst_ip, exporter_ip, input_interface\n| order by Resets desc\n| limit 25'
        }
      ]
    },
    {
      id: 'obs-005',
      name: 'Traffic Distribution by Region',
      objective: 'Monitor traffic distribution across geographic regions to support CDN optimization, regional capacity planning, and user experience management.',
      category: 'Capacity',
      tags: ['observability', 'regional', 'distribution', 'geography'],
      requiredFields: ['src_ip', 'dst_ip', 'octet_count', 'exporter_ip', 'exporter_region', 'dst_as', 'timestamp', 'application_id'],
      detectionLogic: 'Track traffic volume distribution across regions based on exporter location and destination geography. Alert when regional distribution shifts more than 15% from baseline, indicating routing changes or traffic migration.',
      falsePositives: ['Planned traffic migrations between regions', 'CDN provider shifting edge locations', 'Time-zone related traffic patterns'],
      tuningGuidance: 'Define regions based on exporter locations. Account for time-of-day patterns per region. Set different thresholds for planned vs unexpected shifts.',
      operationalValue: 'Supports regional capacity planning and CDN optimization. Identifies unexpected traffic shifts that may indicate routing issues.',
      changeMgmtRelevance: 'Regional distribution changes correlate with infrastructure deployments, routing policy updates, or CDN configuration changes.',
      troubleshootingWorkflow: '1. Identify regions with traffic distribution changes\n2. Determine if shift is expected from planned changes\n3. Check routing tables for path changes\n4. Assess capacity impact on receiving regions\n5. Verify user experience is not degraded\n6. Update capacity plans for affected regions',
      criblSearchQueries: [
        {
          name: 'Traffic volume by region',
          description: 'Show traffic distribution across geographic regions',
          query: 'dataset="$DATASET" earliest=-24h\n| summarize TotalOctets=sum(octet_count), Flows=count(), UniqueDestinations=dcount(dst_ip) by exporter_region\n| extend RegionPct=round(TotalOctets*100.0/sum(TotalOctets), 2)\n| order by TotalOctets desc'
        },
        {
          name: 'Regional distribution trending',
          description: 'Track regional traffic distribution changes over time',
          query: 'dataset="$DATASET" earliest=-30d\n| timestats span=1d octets=sum(octet_count) by exporter_region\n| order by octets desc'
        },
        {
          name: 'Regional distribution shift analysis',
          description: 'Compare current regional distribution against baseline',
          query: 'dataset="$DATASET" earliest=-14d\n| extend week=iff(timestamp > ago(7d), "current", "prior")\n| summarize Octets=sum(octet_count), Flows=count() by week, exporter_region\n| order by Octets desc'
        }
      ]
    },
    {
      id: 'obs-006',
      name: 'QoS Class Utilization',
      objective: 'Monitor quality of service class utilization to ensure proper traffic classification and identify QoS policy effectiveness.',
      category: 'Performance',
      tags: ['observability', 'qos', 'traffic-classification', 'performance-management'],
      requiredFields: ['dscp', 'tos', 'octet_count', 'packet_count', 'application_id', 'exporter_ip', 'timestamp', 'flow_duration'],
      detectionLogic: 'Track traffic distribution across QoS classes (DSCP values). Alert when high-priority classes exceed allocation (potential QoS abuse), when traffic appears misclassified, or when QoS distribution shifts significantly.',
      falsePositives: ['Legitimate high-priority application spikes', 'QoS policy changes in rollout', 'Untagged traffic defaulting to best-effort'],
      tuningGuidance: 'Define expected QoS class distributions based on policy. Set thresholds per class based on capacity allocation. Monitor both volume and flow counts per class.',
      operationalValue: 'Ensures QoS policies are functioning as intended. Identifies misclassified traffic and supports QoS optimization efforts.',
      changeMgmtRelevance: 'QoS distribution changes indicate policy updates, application classification changes, or new services needing QoS assignment.',
      troubleshootingWorkflow: '1. Review QoS class distribution vs policy expectations\n2. Identify misclassified or over-allocated classes\n3. Check if high-priority usage matches approved applications\n4. Review QoS policy configuration for correctness\n5. Assess impact on latency-sensitive applications\n6. Adjust QoS policies based on findings',
      criblSearchQueries: [
        {
          name: 'QoS class distribution',
          description: 'Show traffic breakdown by DSCP/QoS class',
          query: 'dataset="$DATASET" earliest=-24h\n| summarize TotalOctets=sum(octet_count), Flows=count(), Apps=dcount(application_id) by dscp\n| extend ClassPct=round(TotalOctets*100.0/sum(TotalOctets), 2)\n| order by TotalOctets desc'
        },
        {
          name: 'QoS utilization trending',
          description: 'Track QoS class utilization over time',
          query: 'dataset="$DATASET" earliest=-7d\n| timestats span=1h octets=sum(octet_count) by dscp\n| order by octets desc'
        },
        {
          name: 'Application QoS classification audit',
          description: 'Verify applications are receiving correct QoS classification',
          query: 'dataset="$DATASET" earliest=-24h\n| summarize Octets=sum(octet_count), Flows=count(), DSCPCount=dcount(dscp) by application_name\n| where DSCPCount > 1\n| order by Octets desc'
        }
      ]
    },
    {
      id: 'obs-007',
      name: 'Exporter Health Monitoring',
      objective: 'Monitor the health and reliability of IPFIX exporters to ensure continuous data collection and identify failing devices.',
      category: 'Availability',
      tags: ['observability', 'exporter-health', 'availability', 'monitoring'],
      requiredFields: ['exporter_ip', 'timestamp', 'template_id', 'flow_sequence', 'observation_domain_id', 'packet_count', 'octet_count'],
      detectionLogic: 'Track exporter heartbeat by monitoring flow export intervals. Alert when an exporter stops sending data for more than 5 minutes (potential device failure) or when flow sequence gaps indicate packet loss in export path.',
      falsePositives: ['Planned maintenance and reboots', 'Network path issues between exporter and collector', 'Template refresh periods with brief export pauses'],
      tuningGuidance: 'Set heartbeat thresholds per exporter based on expected export intervals. Account for known maintenance windows. Track template stability alongside flow data.',
      operationalValue: 'Ensures continuous monitoring coverage by detecting exporter failures quickly. Prevents monitoring blind spots from silent failures.',
      changeMgmtRelevance: 'Exporter health issues may follow firmware updates, configuration changes, or network path modifications affecting export traffic.',
      troubleshootingWorkflow: '1. Identify exporters with health issues\n2. Check if device is reachable via other means (SNMP, SSH)\n3. Review if maintenance was scheduled\n4. Check collection infrastructure for receiver issues\n5. Verify export configuration on the device\n6. Restore data collection and assess gap impact',
      criblSearchQueries: [
        {
          name: 'Exporter last-seen status',
          description: 'Check when each exporter last sent data',
          query: 'dataset="$DATASET" earliest=-24h\n| summarize LastSeen=max(timestamp), Flows=count(), Templates=dcount(template_id) by exporter_ip, observation_domain_id\n| extend MinutesSinceLastSeen=(tolong(now()) - tolong(LastSeen)) / 60000\n| order by MinutesSinceLastSeen desc'
        },
        {
          name: 'Exporter export rate monitoring',
          description: 'Track flow export rates per exporter for health assessment',
          query: 'dataset="$DATASET" earliest=-4h\n| timestats span=5m flows=count() by exporter_ip\n| summarize AvgRate=avg(flows), MinRate=min(flows), Gaps=countif(flows==0) by exporter_ip\n| order by Gaps desc'
        },
        {
          name: 'Exporter sequence gap detection',
          description: 'Detect flow sequence gaps indicating export loss',
          query: 'dataset="$DATASET" flow_sequence!="" earliest=-4h\n| summarize MinSeq=min(flow_sequence), MaxSeq=max(flow_sequence), FlowsReceived=count() by exporter_ip\n| extend ExpectedFlows=MaxSeq - MinSeq + 1, LossPct=round((1 - FlowsReceived*1.0/(MaxSeq - MinSeq + 1))*100, 2)\n| where LossPct > 1\n| order by LossPct desc'
        }
      ]
    }
  ],
  'carbon-black': [
    {
      id: 'cb-obs-001',
      name: 'Sensor Health Coverage',
      objective: 'Detect devices that have not reported events within the expected check-in window, indicating sensor crashes, network isolation, host failures, or uninstalled agents.',
      severity: 'High',
      category: 'Availability',
      tags: ['observability', 'availability', 'sensor-health', 'coverage', 'carbon-black'],
      requiredFields: ['event_timestamp', 'device_id', 'device_name', 'device_os', 'org_key', 'type'],
      detectionLogic: 'Alert when any device_id that reported at least 10 events per hour over the prior 24 hours has not been seen in the last 30 minutes. Evaluate every 15 minutes with a 24-hour activity baseline. Separate thresholds for servers (always-on, 15-minute silence = alert) vs workstations (business hours only, 60-minute silence = alert).',
      operationalValue: 'Silent endpoints represent security blind spots. Every minute without telemetry is a minute where attacks go undetected. Early detection of sensor failures enables rapid remediation before extended coverage gaps.',
      changeMgmtRelevance: 'Mass sensor silence after OS patches, GPO changes, or sensor updates indicates broken deployment. Correlate with change windows to distinguish planned maintenance from unplanned outages.',
      troubleshootingWorkflow: '1. Identify which devices (device_id/device_name) stopped reporting\n2. Determine scope — isolated (one host) or widespread (subnet/OS/version)\n3. Check if affected hosts share commonalities (device_os, sensor version, network segment)\n4. Verify Data Forwarder pipeline health — are S3 objects still arriving?\n5. Check CB Cloud console for sensor status and last check-in\n6. Attempt remote connectivity check or Live Response session',
      dashboardDependency: 'Sensor Health Dashboard, Fleet Coverage Map, Silent Endpoint Alert Board',
      criblSearchQueries: [
        {
          name: 'Last seen time per device',
          description: 'Find the most recent event timestamp for each device to identify stale endpoints',
          query: 'dataset="$DATASET" earliest=-24h\n| summarize LastSeen=max(event_timestamp), EventCount=count() by device_id, device_name, device_os\n| where LastSeen < ago(30m)\n| order by LastSeen asc'
        },
        {
          name: 'Active device count over time',
          description: 'Track the number of reporting devices per time window to detect mass dropouts',
          query: 'dataset="$DATASET" earliest=-12h\n| timestats span=15m ActiveDevices=dcount(device_id)\n| order by _time desc'
        },
        {
          name: 'Silent devices by OS and org_key',
          description: 'Correlate silent devices with OS and organization to identify pattern',
          query: 'dataset="$DATASET" earliest=-2h\n| summarize LastSeen=max(event_timestamp), Events=count() by device_id, device_name, device_os, org_key\n| where LastSeen < ago(30m)\n| order by device_os, org_key'
        }
      ]
    },
    {
      id: 'cb-obs-002',
      name: 'Event Volume Trending',
      objective: 'Track events per second per device type over time to identify capacity trends, unexpected volume spikes, and baseline deviations that indicate collection or processing issues.',
      severity: 'Medium',
      category: 'Capacity',
      tags: ['observability', 'capacity', 'volume', 'trending', 'carbon-black'],
      requiredFields: ['event_timestamp', 'type', 'device_id', 'device_name', 'device_os', 'org_key'],
      detectionLogic: 'Alert when total event volume per device type (WINDOWS, LINUX, MAC) deviates more than 2x from the 7-day rolling average for the same hour. Also alert when total daily volume exceeds projected storage capacity thresholds. Evaluate hourly with daily capacity projections.',
      operationalValue: 'Enables proactive capacity planning for storage and processing infrastructure. Prevents unexpected cost overruns from volume spikes and identifies data source misconfigurations generating excess telemetry.',
      changeMgmtRelevance: 'Volume spikes after sensor policy changes or new process monitoring rules indicate configuration drift. Helps validate that policy changes produce expected telemetry volumes.',
      troubleshootingWorkflow: '1. Identify which event type(s) are driving the volume change\n2. Determine if the spike is from specific devices or fleet-wide\n3. Check for new sensor policies or monitoring rule changes\n4. Verify Data Forwarder is not replaying historical data\n5. Calculate cost impact and adjust routing/filtering if needed\n6. Update capacity projections and alert thresholds',
      dashboardDependency: 'Event Volume Dashboard, Capacity Planning Dashboard, Cost Projection Board',
      criblSearchQueries: [
        {
          name: 'Events per second by device OS',
          description: 'Track event ingestion rate by platform over time',
          query: 'dataset="$DATASET" earliest=-24h\n| timestats span=5m events=count() by device_os\n| extend eps = events / 300.0\n| order by _time desc'
        },
        {
          name: 'Event type volume distribution',
          description: 'Break down volume by event type to identify dominant contributors',
          query: 'dataset="$DATASET" earliest=-24h\n| summarize EventCount=count(), DeviceCount=dcount(device_id) by type\n| extend AvgPerDevice=round(EventCount*1.0/DeviceCount, 1)\n| order by EventCount desc'
        },
        {
          name: 'Volume spike detection',
          description: 'Compare current hour volume against 7-day baseline',
          query: 'dataset="$DATASET" earliest=-1h\n| summarize CurrentHour=count() by device_os, type\n| order by CurrentHour desc'
        }
      ]
    },
    {
      id: 'cb-obs-003',
      name: 'Process Execution Rate',
      objective: 'Monitor procstart events per host to establish execution baselines and detect anomalous spikes or drops indicating crash loops, runaway services, or host-level failures.',
      severity: 'Medium',
      category: 'Health',
      tags: ['observability', 'health', 'process', 'baseline', 'carbon-black'],
      requiredFields: ['event_timestamp', 'type', 'device_id', 'device_name', 'process_name', 'device_os'],
      detectionLogic: 'Alert when procstart event count per device exceeds 3x the 7-day baseline for the same hour, or drops below 25% of baseline (indicating stopped services or sensor issues). Evaluate every 15 minutes. Separate baselines for servers vs workstations.',
      operationalValue: 'Process execution spikes indicate crash loops, fork bombs, or runaway automation. Drops indicate stopped services or partial sensor failures. Both conditions impact endpoint performance and security coverage.',
      changeMgmtRelevance: 'Post-patch process execution changes indicate application compatibility issues. New software deployments should produce predictable baseline shifts — unexpected shifts indicate problems.',
      troubleshootingWorkflow: '1. Identify which device(s) show abnormal process execution rates\n2. Determine if the anomaly is a spike (too many) or drop (too few)\n3. For spikes: identify the top process_name contributors — crash loop?\n4. For drops: check sensor health and host connectivity\n5. Correlate with recent changes (patches, deployments, policy updates)\n6. Review historical baseline for the affected device to confirm anomaly',
      dashboardDependency: 'Process Execution Rate Dashboard, Host Health Board, Baseline Deviation Alerts',
      criblSearchQueries: [
        {
          name: 'Process execution rate per device',
          description: 'Track procstart events per device over time to identify anomalies',
          query: 'dataset="$DATASET" type="procstart" earliest=-12h\n| timestats span=15m procstarts=count() by device_name\n| order by procstarts desc'
        },
        {
          name: 'Top process contributors to execution volume',
          description: 'Identify which processes drive the most execution events per device',
          query: 'dataset="$DATASET" type="procstart" earliest=-4h\n| summarize Executions=count() by device_name, process_name\n| order by Executions desc\n| limit 50'
        },
        {
          name: 'Devices with abnormal execution rates',
          description: 'Find devices with execution rates significantly above or below average',
          query: 'dataset="$DATASET" type="procstart" earliest=-1h\n| summarize HourlyRate=count() by device_name, device_os\n| order by HourlyRate desc\n| limit 30'
        }
      ]
    },
    {
      id: 'cb-obs-004',
      name: 'Network Connection Rate',
      objective: 'Monitor netconn events per host over time to detect anomalous network activity patterns, connection storms, or loss of network telemetry.',
      severity: 'Medium',
      category: 'Health',
      tags: ['observability', 'health', 'network', 'trending', 'carbon-black'],
      requiredFields: ['event_timestamp', 'type', 'device_id', 'device_name', 'netconn_remote_ip', 'netconn_remote_port', 'netconn_protocol', 'process_name'],
      detectionLogic: 'Alert when netconn event count per device exceeds 5x the 7-day baseline for the same hour (possible scanning, C2 burst, or application malfunction). Also alert when netconn drops to zero for a device that normally generates 100+ netconn events per hour (possible network isolation or sensor issue). Evaluate every 15 minutes.',
      operationalValue: 'Network connection spikes can indicate compromised hosts scanning, application connection leaks, or DNS storms. Drops may indicate network segmentation issues or firewall blocks affecting endpoint connectivity.',
      changeMgmtRelevance: 'New application deployments or firewall rule changes should produce predictable network connection pattern shifts. Unexpected spikes or drops post-change indicate misconfiguration.',
      troubleshootingWorkflow: '1. Identify devices with abnormal netconn rates\n2. For spikes: determine top destination IPs and ports — scanning or legitimate?\n3. For drops: verify host network connectivity and DNS resolution\n4. Check if the pattern correlates with specific processes\n5. Review firewall logs for corresponding blocked connections\n6. Correlate with application deployments or network changes',
      dashboardDependency: 'Network Activity Dashboard, Connection Rate Trending, Host Network Health Board',
      criblSearchQueries: [
        {
          name: 'Network connection rate per device',
          description: 'Track netconn events per device over time',
          query: 'dataset="$DATASET" type="netconn" earliest=-12h\n| timestats span=15m connections=count() by device_name\n| order by connections desc'
        },
        {
          name: 'Top destination ports by volume',
          description: 'Identify which destination ports drive the most connection events',
          query: 'dataset="$DATASET" type="netconn" earliest=-4h\n| summarize Connections=count(), Devices=dcount(device_name) by netconn_remote_port, netconn_protocol\n| order by Connections desc\n| limit 25'
        },
        {
          name: 'Connection spike detection per device',
          description: 'Find devices with connection rates significantly above normal',
          query: 'dataset="$DATASET" type="netconn" earliest=-1h\n| summarize HourlyConns=count(), UniqueDestinations=dcount(netconn_remote_ip) by device_name\n| where HourlyConns > 1000\n| order by HourlyConns desc'
        }
      ]
    },
    {
      id: 'cb-obs-005',
      name: 'Alert Resolution Time',
      objective: 'Measure the time from CB alert generation to resolution action (sensor_action=TERMINATE or alert closure) to track SOC response performance and identify bottlenecks.',
      severity: 'Low',
      category: 'Performance',
      tags: ['observability', 'performance', 'alerts', 'response-time', 'carbon-black'],
      requiredFields: ['event_timestamp', 'alert_id', 'alert_severity', 'device_name', 'sensor_action', 'type', 'process_name'],
      detectionLogic: 'Track the time delta between the first event with a given alert_id and the first sensor_action=TERMINATE or DENY event for the same process_guid/device. Alert when mean resolution time exceeds SLA thresholds: Critical alerts > 15 minutes, High > 1 hour, Medium > 4 hours. Evaluate daily with weekly trending.',
      operationalValue: 'Measures SOC effectiveness and identifies alerting bottlenecks. High resolution times indicate understaffing, alert fatigue, or process gaps. Enables data-driven SOC capacity planning.',
      changeMgmtRelevance: 'Changes to alerting policies, sensor configurations, or response playbooks should improve resolution times. Track before/after metrics to validate operational improvements.',
      troubleshootingWorkflow: '1. Identify alert severity categories with longest resolution times\n2. Determine if delays are in detection, triage, or response phases\n3. Check for alert volume spikes causing queue backup\n4. Review which device types or business units have slowest response\n5. Assess if automated response (sensor_action=TERMINATE) is properly configured\n6. Recommend playbook improvements for slow-resolution alert types',
      dashboardDependency: 'SOC Performance Dashboard, Alert SLA Tracking, Resolution Time Trending',
      criblSearchQueries: [
        {
          name: 'Alert count and severity distribution',
          description: 'Track alert volume by severity over time',
          query: 'dataset="$DATASET" alert_id!="" earliest=-24h\n| summarize AlertCount=count(), Devices=dcount(device_name) by alert_severity\n| order by alert_severity desc'
        },
        {
          name: 'Sensor actions per alert',
          description: 'Track which sensor actions are taken in response to alerts',
          query: 'dataset="$DATASET" alert_id!="" sensor_action!="ALLOW" earliest=-24h\n| summarize ActionCount=count() by sensor_action, alert_severity, device_name\n| order by ActionCount desc'
        },
        {
          name: 'Alert volume trending',
          description: 'Track alert generation rate over time to identify spikes causing SOC overload',
          query: 'dataset="$DATASET" alert_id!="" earliest=-7d\n| timestats span=1h alerts=count() by alert_severity\n| order by _time desc'
        }
      ]
    },
    {
      id: 'cb-obs-006',
      name: 'Sensor Version Compliance',
      objective: 'Track CB sensor versions across the fleet to identify endpoints running outdated versions that may miss detections, have known bugs, or lack required features.',
      severity: 'Low',
      category: 'Change Management',
      tags: ['observability', 'change-management', 'compliance', 'sensor-version', 'carbon-black'],
      requiredFields: ['event_timestamp', 'device_id', 'device_name', 'device_os', 'device_os_version', 'org_key'],
      detectionLogic: 'Alert when more than 10% of the fleet is running a sensor version older than the current N-1 release, or when any endpoint remains on the same version for more than 14 days after a new release is available. Evaluate daily with weekly compliance trending. Report by org_key and device_os.',
      operationalValue: 'Outdated sensors may lack detection capabilities, have known bypass vulnerabilities, or miss kernel-level visibility. Fleet uniformity reduces support burden and ensures consistent security posture.',
      changeMgmtRelevance: 'Track sensor update rollouts — identify endpoints that failed to update during maintenance windows. Validate that update policies are applying correctly across the fleet.',
      troubleshootingWorkflow: '1. Identify the current target sensor version per platform\n2. List endpoints running older versions grouped by org_key and device_os\n3. Determine if outdated hosts share commonalities (subnet, OU, update policy)\n4. Check CB Cloud update policy assignments\n5. Verify update infrastructure accessibility from affected endpoints\n6. Manually trigger update for persistently non-compliant hosts',
      dashboardDependency: 'Fleet Compliance Dashboard, Sensor Version Distribution, Update Rollout Tracker',
      criblSearchQueries: [
        {
          name: 'Sensor version distribution',
          description: 'Count devices per OS version to identify outdated fleet segments',
          query: 'dataset="$DATASET" earliest=-24h\n| summarize Devices=dcount(device_id) by device_os, device_os_version\n| order by Devices desc'
        },
        {
          name: 'Oldest sensor versions in fleet',
          description: 'Find devices running the most outdated versions',
          query: 'dataset="$DATASET" earliest=-24h\n| summarize LastSeen=max(event_timestamp), Events=count() by device_id, device_name, device_os, device_os_version\n| order by device_os_version asc\n| limit 50'
        },
        {
          name: 'Version compliance by org_key',
          description: 'Track compliance percentage per organization',
          query: 'dataset="$DATASET" earliest=-24h\n| summarize Devices=dcount(device_id) by org_key, device_os_version\n| order by org_key, Devices desc'
        }
      ]
    },
    {
      id: 'cb-obs-007',
      name: 'Data Forwarder Latency',
      objective: 'Measure the delay between event_timestamp (when the event occurred on the endpoint) and the time the event is available for processing in Cribl Stream, indicating Data Forwarder pipeline health.',
      severity: 'Medium',
      category: 'Performance',
      tags: ['observability', 'performance', 'latency', 'data-forwarder', 'pipeline', 'carbon-black'],
      requiredFields: ['event_timestamp', 'device_id', 'device_name', 'type', 'org_key'],
      detectionLogic: 'Calculate ingest latency as (cribl_processing_time - event_timestamp). Alert when p95 latency exceeds 15 minutes (indicating Data Forwarder backlog or S3 delivery delays). Alert when p99 exceeds 1 hour. Evaluate every 15 minutes with hourly trending. Separate thresholds by org_key for multi-tenant environments.',
      operationalValue: 'High latency reduces detection effectiveness — a 30-minute delay means a 30-minute window where attacks are invisible. Latency spikes indicate Data Forwarder issues, S3 write throttling, or upstream CB Cloud processing delays.',
      changeMgmtRelevance: 'Changes to Data Forwarder configuration, S3 bucket policies, or Cribl Stream processing pipelines can impact latency. Monitor latency before and after infrastructure changes.',
      troubleshootingWorkflow: '1. Identify which org_key(s) are experiencing elevated latency\n2. Check CB Cloud Data Forwarder status and S3 delivery metrics\n3. Verify S3 bucket is not throttling writes (check CloudWatch)\n4. Review Cribl Stream source backpressure and queue depth\n5. Check for S3 object size increases causing slower processing\n6. Verify SQS notification delivery is not delayed',
      dashboardDependency: 'Pipeline Latency Dashboard, Data Forwarder Health, Ingest SLA Tracking',
      criblSearchQueries: [
        {
          name: 'Ingest latency percentiles',
          description: 'Calculate latency distribution across the fleet',
          query: 'dataset="$DATASET" earliest=-4h\n| extend ingest_latency_sec = (tolong(now()) - tolong(event_timestamp)) / 1000\n| summarize p50=avg(ingest_latency_sec), p95=max(ingest_latency_sec) by org_key\n| order by p95 desc'
        },
        {
          name: 'Latency trending over time',
          description: 'Track how ingest latency changes over time to identify degradation',
          query: 'dataset="$DATASET" earliest=-12h\n| extend ingest_latency_sec = (tolong(now()) - tolong(event_timestamp)) / 1000\n| timestats span=15m avg_latency=avg(ingest_latency_sec), p95_latency=max(ingest_latency_sec)\n| order by _time desc'
        },
        {
          name: 'High-latency devices',
          description: 'Identify specific devices experiencing the worst latency',
          query: 'dataset="$DATASET" earliest=-1h\n| extend ingest_latency_sec = (tolong(now()) - tolong(event_timestamp)) / 1000\n| summarize AvgLatency=avg(ingest_latency_sec), MaxLatency=max(ingest_latency_sec), Events=count() by device_name, org_key\n| where AvgLatency > 900\n| order by AvgLatency desc'
        }
      ]
    }
  ]
};
