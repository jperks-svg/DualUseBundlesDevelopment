// @ts-nocheck
export interface ObservabilityRuleMapping {
  communityRule: string;
  communityReferences: string[];
  communitySource: 'awesome-prometheus-alerts' | 'prometheus-community' | 'kube-prometheus' | 'custom';
  ruleStatus: 'equivalent' | 'adapted' | 'inspired';
  ruleTitle?: string;
  criblSearchKQL: string;
}

export const observabilityRules: Record<string, ObservabilityRuleMapping> = {

  'ngx-obs-001': {
    ruleTitle: 'Nginx Upstream Latency High',
    ruleStatus: 'adapted',
    communitySource: 'awesome-prometheus-alerts',
    communityReferences: ['samber/awesome-prometheus-alerts#nginx'],
    communityRule: `# Prometheus Community Rule (awesome-prometheus-alerts)
# Source: samber/awesome-prometheus-alerts - Nginx
alert: NginxHighLatency
expr: |
  histogram_quantile(0.95,
    sum(rate(nginx_upstream_response_time_seconds_bucket[5m])) by (le, upstream)
  ) > 2
for: 5m
labels:
  severity: warning
annotations:
  summary: "Nginx upstream P95 latency > 2s (instance {{ $labels.instance }})"
  description: |
    P95 upstream response time has exceeded 2 seconds for upstream {{ $labels.upstream }}.
    VALUE = {{ $value }}s`,
    criblSearchKQL: `dataset="nginx_access" upstream_response_time > 0 earliest=-4h
| timestats span=5m P95_Latency=max(upstream_response_time), AvgLatency=avg(upstream_response_time) by upstream_addr
| where P95_Latency > 2
| order by P95_Latency desc`,
  },

  'ngx-obs-002': {
    ruleTitle: 'Nginx High 5xx Error Rate',
    ruleStatus: 'equivalent',
    communitySource: 'awesome-prometheus-alerts',
    communityReferences: ['samber/awesome-prometheus-alerts#nginx'],
    communityRule: `# Prometheus Community Rule (awesome-prometheus-alerts)
# Source: samber/awesome-prometheus-alerts - Nginx
alert: NginxHighHttp5xxErrorRate
expr: |
  sum(rate(nginx_http_requests_total{status=~"^5.."}[5m]))
  /
  sum(rate(nginx_http_requests_total[5m])) * 100 > 5
for: 2m
labels:
  severity: critical
annotations:
  summary: "Nginx 5xx error rate > 5% (instance {{ $labels.instance }})"
  description: |
    More than 5% of requests are returning 5xx status codes.
    VALUE = {{ $value }}%`,
    criblSearchKQL: `dataset="nginx_access" earliest=-1h
| summarize Total=count(), Errors5xx=countif(status >= 500) by server_name
| extend ErrorPct=round(Errors5xx * 100.0 / Total, 2)
| where ErrorPct > 5
| order by ErrorPct desc`,
  },

  'ngx-obs-003': {
    ruleTitle: 'Nginx Request Volume Drop',
    ruleStatus: 'adapted',
    communitySource: 'awesome-prometheus-alerts',
    communityReferences: ['samber/awesome-prometheus-alerts#nginx'],
    communityRule: `# Prometheus Community Rule (awesome-prometheus-alerts)
# Source: samber/awesome-prometheus-alerts - Nginx
alert: NginxLowRequestRate
expr: |
  sum(rate(nginx_http_requests_total[5m])) by (instance)
  < (sum(avg_over_time(rate(nginx_http_requests_total[5m])[1d:])) by (instance) * 0.5)
for: 10m
labels:
  severity: warning
annotations:
  summary: "Nginx request rate dropped >50% from baseline (instance {{ $labels.instance }})"
  description: |
    Request rate has dropped below 50% of the daily average, indicating potential
    upstream routing issues or DNS failures.
    VALUE = {{ $value }} req/s`,
    criblSearchKQL: `dataset="nginx_access" earliest=-2h
| timestats span=5m RequestRate=count() by server_name
| order by _time desc
| where RequestRate < 10`,
  },

  'k8s-obs-001': {
    ruleTitle: 'Kubernetes API Server Latency High',
    ruleStatus: 'adapted',
    communitySource: 'kube-prometheus',
    communityReferences: ['kubernetes-monitoring/kubernetes-mixin#api-server'],
    communityRule: `# Prometheus Community Rule (kube-prometheus / kubernetes-mixin)
# Source: kubernetes-monitoring/kubernetes-mixin
alert: KubeAPILatencyHigh
expr: |
  histogram_quantile(0.95,
    sum(rate(apiserver_request_duration_seconds_bucket{verb!~"WATCH|LIST"}[5m]))
    by (le, verb, resource)
  ) > 1
for: 10m
labels:
  severity: warning
annotations:
  summary: "Kubernetes API server P95 latency > 1s"
  description: |
    P95 API request latency for {{ $labels.verb }} {{ $labels.resource }}
    has exceeded 1 second for more than 10 minutes.
    VALUE = {{ $value }}s`,
    criblSearchKQL: `dataset="k8s_audit" stage=="ResponseComplete" not(verb in ("watch", "list")) earliest=-4h
| extend duration_ms=(tolong(todatetime(stageTimestamp)) - tolong(todatetime(requestReceivedTimestamp)))
| summarize P95=max(duration_ms), Requests=count() by verb, objectRef_resource
| where P95 > 1000 and Requests > 10
| order by P95 desc`,
  },

  'k8s-obs-002': {
    ruleTitle: 'Kubernetes API Error Rate High',
    ruleStatus: 'adapted',
    communitySource: 'kube-prometheus',
    communityReferences: ['kubernetes-monitoring/kubernetes-mixin#api-server'],
    communityRule: `# Prometheus Community Rule (kube-prometheus / kubernetes-mixin)
# Source: kubernetes-monitoring/kubernetes-mixin
alert: KubeAPIErrorsHigh
expr: |
  sum(rate(apiserver_request_total{code=~"5.."}[5m]))
  /
  sum(rate(apiserver_request_total[5m])) * 100 > 3
for: 10m
labels:
  severity: critical
annotations:
  summary: "Kubernetes API server error rate > 3%"
  description: |
    The API server is returning {{ $value }}% 5xx errors.
    This indicates control plane instability affecting all cluster operations.`,
    criblSearchKQL: `dataset="k8s_audit" earliest=-1h
| summarize Total=count(), Errors=countif(responseStatus_code >= 400) by objectRef_resource, verb
| extend ErrorPct=round(Errors * 100.0 / Total, 1)
| where Total > 20 and ErrorPct > 5
| order by ErrorPct desc`,
  },

  'k8s-obs-003': {
    ruleTitle: 'Kubernetes Component Down',
    ruleStatus: 'adapted',
    communitySource: 'kube-prometheus',
    communityReferences: ['kubernetes-monitoring/kubernetes-mixin#control-plane'],
    communityRule: `# Prometheus Community Rule (kube-prometheus / kubernetes-mixin)
# Source: kubernetes-monitoring/kubernetes-mixin
alert: KubeControllerManagerDown
expr: |
  absent(up{job="kube-controller-manager"} == 1)
for: 5m
labels:
  severity: critical
annotations:
  summary: "kube-controller-manager has disappeared"
  description: |
    No kube-controller-manager targets are UP. Reconciliation loops
    are halted — desired state and actual state will diverge.

---

alert: KubeSchedulerDown
expr: |
  absent(up{job="kube-scheduler"} == 1)
for: 5m
labels:
  severity: critical
annotations:
  summary: "kube-scheduler has disappeared"
  description: |
    No kube-scheduler targets are UP. New pods cannot be scheduled.`,
    criblSearchKQL: `dataset="k8s_audit" earliest=-30m
| where user_username in ("system:kube-controller-manager", "system:kube-scheduler", "system:node:")
| summarize LastSeen=max(_time), RequestCount=count() by user_username
| extend MinutesSinceLastSeen=round((now() - LastSeen) / 60000, 1)
| where MinutesSinceLastSeen > 5
| order by MinutesSinceLastSeen desc`,
  },

  'vpc-obs-001': {
    ruleTitle: 'VPC Traffic Volume Anomaly',
    ruleStatus: 'inspired',
    communitySource: 'custom',
    communityReferences: ['aws/vpc-flow-log-best-practices'],
    communityRule: `# Inspired by: AWS VPC Flow Log monitoring best practices
# No direct Prometheus equivalent — VPC flow logs are typically
# analyzed via CloudWatch Insights or log-based alerting.
#
# Equivalent CloudWatch Insights query:
# fields @timestamp, bytes, packets
# | filter action="ACCEPT"
# | stats sum(bytes) as TotalBytes by bin(5m), vpcId
# | filter TotalBytes > 3 * avg(TotalBytes)
#
# Prometheus approach requires a flow-log exporter:
alert: VPCTrafficVolumeAnomaly
expr: |
  sum(rate(vpc_flow_bytes_total[5m])) by (vpc_id)
  > 3 * avg_over_time(sum(rate(vpc_flow_bytes_total[5m])) by (vpc_id)[7d:5m])
for: 10m
labels:
  severity: warning
annotations:
  summary: "VPC {{ $labels.vpc_id }} traffic >3x baseline"`,
    criblSearchKQL: `dataset="vpc_flow_logs" action="ACCEPT" earliest=-1h
| summarize FlowCount=count(), TotalBytes=sum(bytes), TotalPackets=sum(packets) by vpc_id, subnet_id
| order by TotalBytes desc`,
  },

  'vpc-obs-003': {
    ruleTitle: 'VPC Connection Rejection Rate High',
    ruleStatus: 'inspired',
    communitySource: 'custom',
    communityReferences: ['aws/vpc-flow-log-best-practices'],
    communityRule: `# Inspired by: AWS VPC Flow Log monitoring patterns
# Tracks REJECT actions indicating security group or NACL blocks
#
# CloudWatch Insights equivalent:
# fields @timestamp, dstAddr, dstPort
# | filter action="REJECT"
# | stats count() as RejectedFlows by bin(5m), dstAddr, dstPort
# | sort RejectedFlows desc
#
alert: VPCHighRejectRate
expr: |
  sum(rate(vpc_flow_action_total{action="REJECT"}[5m])) by (vpc_id, dst_port)
  /
  sum(rate(vpc_flow_action_total[5m])) by (vpc_id, dst_port) * 100 > 20
for: 5m
labels:
  severity: warning
annotations:
  summary: "VPC {{ $labels.vpc_id }} reject rate >20% on port {{ $labels.dst_port }}"`,
    criblSearchKQL: `dataset="vpc_flow_logs" earliest=-1h
| summarize Total=count(), Rejected=countif(action=="REJECT") by dstaddr, dstport, vpc_id
| extend RejectPct=round(Rejected * 100.0 / Total, 1)
| where Rejected > 20 and RejectPct > 10
| order by Rejected desc
| limit 25`,
  },

  'obs-f5-001': {
    ruleTitle: 'F5 Pool Member Down',
    ruleStatus: 'equivalent',
    communitySource: 'awesome-prometheus-alerts',
    communityReferences: ['samber/awesome-prometheus-alerts#f5-big-ip'],
    communityRule: `# Prometheus Community Rule (awesome-prometheus-alerts)
# Source: samber/awesome-prometheus-alerts - F5 BIG-IP (via SNMP/Telemetry Streaming)
alert: F5PoolMemberDown
expr: |
  f5_pool_member_status{status!="available"} == 1
for: 1m
labels:
  severity: critical
annotations:
  summary: "F5 pool member {{ $labels.pool }}/{{ $labels.member }} is DOWN"
  description: |
    Pool member {{ $labels.member }} in pool {{ $labels.pool }}
    on BIG-IP {{ $labels.instance }} is no longer passing health checks.
    Remaining capacity should be evaluated immediately.`,
    criblSearchKQL: `dataset="f5_ltm" earliest=-4h
| where health_monitor_status == "down"
| summarize DownEvents=count(), FirstSeen=min(_time), LastSeen=max(_time) by pool_name, server_ip, server_port, health_monitor_name, hostname
| order by LastSeen desc`,
  },

  'obs-f5-002': {
    ruleTitle: 'F5 Response Time Degradation',
    ruleStatus: 'adapted',
    communitySource: 'awesome-prometheus-alerts',
    communityReferences: ['samber/awesome-prometheus-alerts#f5-big-ip'],
    communityRule: `# Prometheus Community Rule (awesome-prometheus-alerts)
# Source: samber/awesome-prometheus-alerts - F5 BIG-IP
alert: F5HighResponseTime
expr: |
  histogram_quantile(0.95,
    sum(rate(f5_virtual_server_response_time_seconds_bucket[5m]))
    by (le, virtual_server)
  ) > 5
for: 5m
labels:
  severity: warning
annotations:
  summary: "F5 virtual server {{ $labels.virtual_server }} P95 latency > 5s"
  description: |
    Backend response time has exceeded 5 seconds at P95.
    Check backend pool member health and resource utilization.`,
    criblSearchKQL: `dataset="f5_ltm" earliest=-1h
| summarize AvgLatency=avg(server_latency_ms), P95Latency=max(server_latency_ms), Requests=count() by pool_name, server_ip, server_port
| where AvgLatency > 1000
| order by P95Latency desc`,
  },

  'dns-obs-001': {
    ruleTitle: 'DNS Query Latency High',
    ruleStatus: 'adapted',
    communitySource: 'awesome-prometheus-alerts',
    communityReferences: ['samber/awesome-prometheus-alerts#coredns'],
    communityRule: `# Prometheus Community Rule (awesome-prometheus-alerts)
# Source: samber/awesome-prometheus-alerts - CoreDNS / DNS
alert: DnsHighLatency
expr: |
  histogram_quantile(0.95,
    sum(rate(coredns_dns_request_duration_seconds_bucket[5m]))
    by (le, server)
  ) > 0.5
for: 5m
labels:
  severity: warning
annotations:
  summary: "DNS P95 query latency > 500ms (server {{ $labels.server }})"
  description: |
    DNS resolution latency is elevated. Check upstream forwarder health,
    DNSSEC validation, and server resource utilization.
    VALUE = {{ $value }}s`,
    criblSearchKQL: `dataset="windows_dns" event_id=257 earliest=-4h
| summarize AvgLatency=avg(elapsed_time_ms), P95=max(elapsed_time_ms), Queries=count() by computer
| where P95 > 500
| order by P95 desc`,
  },

  'dns-obs-002': {
    ruleTitle: 'DNS SERVFAIL Rate High',
    ruleStatus: 'adapted',
    communitySource: 'awesome-prometheus-alerts',
    communityReferences: ['samber/awesome-prometheus-alerts#coredns'],
    communityRule: `# Prometheus Community Rule (awesome-prometheus-alerts)
# Source: samber/awesome-prometheus-alerts - CoreDNS / DNS
alert: DnsServfailRateHigh
expr: |
  sum(rate(coredns_dns_responses_total{rcode="SERVFAIL"}[5m]))
  /
  sum(rate(coredns_dns_responses_total[5m])) * 100 > 5
for: 5m
labels:
  severity: critical
annotations:
  summary: "DNS SERVFAIL rate > 5%"
  description: |
    More than 5% of DNS queries are returning SERVFAIL, indicating
    upstream resolution failures or DNSSEC validation issues.
    VALUE = {{ $value }}%`,
    criblSearchKQL: `dataset="windows_dns" event_id in (257, 258) earliest=-4h
| summarize Total=count(), ServFail=countif(response_code == "SERVFAIL") by computer
| extend ServFailPct=round(ServFail * 100.0 / Total, 2)
| where ServFailPct > 5
| order by ServFailPct desc`,
  },

  'obs-001': {
    ruleTitle: 'Firewall Rule Traffic Drop to Zero',
    ruleStatus: 'inspired',
    communitySource: 'custom',
    communityReferences: ['paloaltonetworks/best-practices-monitoring'],
    communityRule: `# Custom observability pattern — no direct Prometheus equivalent
# Firewall rule health monitoring via traffic absence detection
#
# Concept: alert when a rule that normally matches traffic drops
# to zero hits, indicating routing failure or policy misconfiguration.
#
# If using a NGFW metrics exporter:
alert: FirewallRuleNoTraffic
expr: |
  sum(rate(pan_rule_sessions_total[15m])) by (rule_name) == 0
  and
  sum(avg_over_time(rate(pan_rule_sessions_total[15m])[7d:15m])) by (rule_name) > 0
for: 15m
labels:
  severity: warning
annotations:
  summary: "Firewall rule {{ $labels.rule_name }} stopped processing traffic"
  description: |
    Rule has not matched any sessions in 15 minutes but has a 7-day
    baseline of active traffic. Possible routing or policy regression.`,
    criblSearchKQL: `dataset="pan_traffic" earliest=-1h
| summarize RecentCount=count() by rule_name
| where RecentCount < 5
| order by RecentCount asc`,
  },

  'obs-linux-aud-001': {
    ruleTitle: 'Linux System Call Error Rate',
    ruleStatus: 'inspired',
    communitySource: 'prometheus-community',
    communityReferences: ['prometheus/node_exporter#filesystem'],
    communityRule: `# Inspired by: node_exporter filesystem and process metrics
# Auditd provides syscall-level granularity that metrics lack
#
# Nearest Prometheus equivalent:
alert: NodeHighSyscallErrors
expr: |
  rate(node_schedstat_waiting_seconds_total[5m]) > 0.1
for: 10m
labels:
  severity: warning
annotations:
  summary: "High syscall contention on {{ $labels.instance }}"
  description: |
    Process scheduling wait time is elevated, indicating
    resource contention or kernel-level issues.`,
    criblSearchKQL: `dataset="linux_auditd" type="SYSCALL" earliest=-1h
| where success == "no"
| summarize FailedCalls=count() by syscall, exe, hostname
| where FailedCalls > 50
| order by FailedCalls desc
| limit 20`,
  },

  'obs-linux-auth-001': {
    ruleTitle: 'Linux Authentication Failure Rate',
    ruleStatus: 'adapted',
    communitySource: 'prometheus-community',
    communityReferences: ['prometheus/node_exporter#systemd'],
    communityRule: `# Prometheus Community (node_exporter + custom textfile collector)
# Auth failures typically tracked via log-based metrics
#
# Common pattern with mtail or promtail:
alert: LinuxHighAuthFailureRate
expr: |
  sum(rate(auth_failures_total[5m])) by (instance) > 10
for: 5m
labels:
  severity: warning
annotations:
  summary: "High authentication failure rate on {{ $labels.instance }}"
  description: |
    More than 10 auth failures/second detected.
    Check for brute force or misconfigured service accounts.
    VALUE = {{ $value }} failures/s`,
    criblSearchKQL: `dataset="linux_auth" earliest=-1h
| where message contains "authentication failure" or message contains "Failed password"
| summarize Failures=count() by hostname, program
| where Failures > 20
| order by Failures desc`,
  },

  'obs-ad-001': {
    ruleTitle: 'Active Directory Replication Latency',
    ruleStatus: 'inspired',
    communitySource: 'custom',
    communityReferences: ['microsoft/ad-monitoring-best-practices'],
    communityRule: `# Custom — AD replication monitoring via log analysis
# No standard Prometheus exporter; typically monitored via
# Windows Performance Counters or AD-specific exporters.
#
# If using windows_exporter with AD collector:
alert: ADReplicationLatencyHigh
expr: |
  windows_ad_replication_pending_synchronizations > 5
for: 10m
labels:
  severity: warning
annotations:
  summary: "AD replication pending > 5 on {{ $labels.instance }}"
  description: |
    Active Directory replication is falling behind.
    Check network connectivity between DCs and DNS resolution.`,
    criblSearchKQL: `dataset="ad_security" EventID in (4932, 4933) earliest=-4h
| summarize ReplicationEvents=count(), Failures=countif(Status != 0) by DSA_Name, Naming_Context
| extend FailPct=round(Failures * 100.0 / ReplicationEvents, 1)
| where Failures > 0
| order by FailPct desc`,
  },

};
