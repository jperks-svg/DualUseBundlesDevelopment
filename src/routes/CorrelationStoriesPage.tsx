import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { dataSources } from '../data/sources';

const card: React.CSSProperties = {
  background: 'var(--cds-color-bg)', border: '1px solid var(--cds-color-border-subtle)',
  borderRadius: 'var(--cds-radius-lg)', padding: 20, boxShadow: 'var(--cds-shadow-sm)',
};

const tag = (bg: string, color: string): React.CSSProperties => ({
  display: 'inline-block', padding: '2px 8px', borderRadius: 'var(--cds-radius-sm)',
  fontSize: 'var(--cds-font-size-xs)', fontWeight: 500, background: bg, color,
});

interface StoryStep {
  time: string;
  source: string;
  sourceId: string;
  description: string;
  logSnippet: string;
  insight: string;
}

interface Story {
  id: string;
  title: string;
  type: 'attack' | 'outage' | 'compliance';
  description: string;
  criblValue: string;
  steps: StoryStep[];
  sourcesUsed: string[];
}

const stories: Story[] = [
  {
    id: 'phishing-to-exfil',
    title: 'Phishing to Data Exfiltration',
    type: 'attack',
    description: 'A user clicks a phishing link, downloads malware, establishes C2, and attempts data exfiltration — tracked across 6 data sources.',
    criblValue: 'Without Cribl routing all these sources, the SOC would need 6 separate SIEM licenses or miss critical correlation points. Cribl collects once and routes to the right tool.',
    sourcesUsed: ['palo-alto-traffic', 'crowdstrike-edr', 'microsoft-defender-endpoint', 'zeek-logs', 'okta-system-logs', 'active-directory'],
    steps: [
      {
        time: '14:30:00',
        source: 'Palo Alto Traffic Logs',
        sourceId: 'palo-alto-traffic',
        description: 'User jlee clicks a link to a newly-registered domain hosting a fake login page.',
        logSnippet: 'action="allow" application="web-browsing" url="secure-login-verify.top/account" url_category="newly-registered" source_user="jlee@cribl.io"',
        insight: 'Palo Alto flags the newly-registered domain category but allows traffic per policy. This is the initial access vector.',
      },
      {
        time: '15:01:44',
        source: 'Palo Alto Traffic Logs',
        sourceId: 'palo-alto-traffic',
        description: 'Same user downloads a file flagged as malicious by WildFire — Q2-Report-Final.xlsx.exe.',
        logSnippet: 'threat_name="Trojan/Win32.AgentTesla" threat_severity="critical" wildfire_verdict="malicious" file_name="Q2-Report-Final.xlsx.exe" source_user="jlee@cribl.io"',
        insight: 'WildFire verdict confirms malicious file. The .xlsx.exe double extension is a classic social engineering technique.',
      },
      {
        time: '15:04:33',
        source: 'CrowdStrike EDR',
        sourceId: 'crowdstrike-edr',
        description: 'CrowdStrike detects encoded PowerShell execution on jlee\'s endpoint — downloading second-stage payload.',
        logSnippet: 'event_type="DetectionSummaryEvent" severity=4 process_name="powershell.exe" command_line="powershell.exe -enc aQBlAHgA..." detect_name="EncodedCommand" tactic="Execution" technique="T1059.001"',
        insight: 'The encoded command decodes to a download cradle pulling from a C2 server. This is the execution phase of the attack chain.',
      },
      {
        time: '15:10:00',
        source: 'Zeek Network Logs',
        sourceId: 'zeek-logs',
        description: 'Zeek conn.log shows periodic beaconing — 256-byte requests every 30 seconds to 45.77.123.99:443.',
        logSnippet: 'id.orig_h="10.0.22.88" id.resp_h="45.77.123.99" id.resp_p=443 duration=1800 orig_bytes=256 resp_bytes=512 ja3="e7d705a3286e19ea42f587b344ee6865"',
        insight: 'Fixed-interval, fixed-size connections are a beaconing pattern. The JA3 fingerprint can be used to identify this C2 framework across the network.',
      },
      {
        time: '15:15:00',
        source: 'Okta System Logs',
        sourceId: 'okta-system-logs',
        description: 'Okta shows jlee\'s session being used to access the HR application from the compromised endpoint.',
        logSnippet: 'eventType="app.generic.unauth_app_access_attempt" target.displayName="HR Portal" actor.displayName="jlee@cribl.io" client.ipAddress="10.0.22.88"',
        insight: 'The attacker is using jlee\'s active session to access sensitive applications. Lateral movement via session hijacking.',
      },
      {
        time: '15:20:00',
        source: 'Active Directory',
        sourceId: 'active-directory',
        description: 'AD query from jlee\'s workstation enumerating Domain Admins group membership.',
        logSnippet: 'EventID=1644 Client="10.0.22.88" Filter="(memberOf=CN=Domain Admins,CN=Users,DC=corp,DC=contoso,DC=com)" EntriesReturned=8',
        insight: 'Post-compromise reconnaissance — the attacker is mapping privileged accounts for escalation. This query from a standard user workstation is anomalous.',
      },
    ],
  },
  {
    id: 'service-degradation',
    title: 'API Service Degradation Cascade',
    type: 'outage',
    description: 'A memory leak in a Lambda function triggers a cascade: connection pool exhaustion, load balancer failures, customer-facing 503s — correlated across 5 sources.',
    criblValue: 'Cribl routes operational telemetry to observability platforms while keeping the same data available for post-incident forensics in Lake — no duplicate collection needed.',
    sourcesUsed: ['aws-cloudwatch', 'f5-bigip-ltm', 'aws-cloudtrail', 'servicenow', 'cloudflare'],
    steps: [
      {
        time: '14:30:00',
        source: 'AWS CloudWatch Logs',
        sourceId: 'aws-cloudwatch',
        description: 'Lambda function data-processor hits memory limit processing a large batch.',
        logSnippet: 'ERROR: OutOfMemoryError - Lambda function exceeded 512MB memory limit while processing batch of 50000 records\nREPORT Duration: 100.00 ms Memory Size: 512 MB Max Memory Used: 512 MB',
        insight: 'The function is processing 50K records in a single invocation. This suggests an upstream batch size configuration change.',
      },
      {
        time: '14:34:00',
        source: 'AWS CloudWatch Logs',
        sourceId: 'aws-cloudwatch',
        description: 'ECS API service reports connection pool exhaustion — downstream database connections maxed out.',
        logSnippet: 'ERROR [http-handler] Connection pool exhausted: max connections (100) reached, 50 requests queued, oldest waiting 5000ms',
        insight: 'Failed Lambda invocations are retrying, creating a thundering herd against the database connection pool.',
      },
      {
        time: '14:35:00',
        source: 'F5 BIG-IP LTM',
        sourceId: 'f5-bigip-ltm',
        description: 'F5 detects pool members going unhealthy — health checks failing due to backend timeouts.',
        logSnippet: 'pool /Common/api-pool member 10.0.2.20:8080 monitor status down, reason: /Common/http_head_monitor: failure - no response',
        insight: 'The load balancer is the customer-facing symptom. Root cause is 3 layers deeper — Lambda → DB pool → API timeout → health check failure.',
      },
      {
        time: '14:36:00',
        source: 'Cloudflare',
        sourceId: 'cloudflare',
        description: 'Cloudflare edge sees origin response time spike to 8500ms, returning 504 Gateway Timeout to users.',
        logSnippet: 'ClientRequestURI="/api/dashboard" EdgeResponseStatus=504 OriginResponseTime=8500000 CacheCacheStatus="none"',
        insight: 'Customer impact confirmed. Cache misses for API calls mean every request hits the degraded origin.',
      },
      {
        time: '14:37:00',
        source: 'ServiceNow',
        sourceId: 'servicenow',
        description: 'Monitoring integration auto-creates a P2 incident for latency SLA breach. Problem record links to recurring memory leak.',
        logSnippet: 'number="INC0012346" priority="2 - High" short_description="Application latency exceeding SLA thresholds" category="Performance"',
        insight: 'The ITSM context connects this to a known problem — PRB0000456: recurring memory leak. This is the 3rd occurrence this month.',
      },
    ],
  },
  {
    id: 'cloud-privilege-escalation',
    title: 'Cloud Privilege Escalation & Data Exposure',
    type: 'compliance',
    description: 'A compromised service account key is used to escalate privileges across AWS and GCP, creating public-facing storage and exfiltrating data.',
    criblValue: 'Cribl ensures cloud audit logs from all three major providers flow to the same SIEM with normalized fields — enabling cross-cloud correlation that would otherwise require 3 separate integrations.',
    sourcesUsed: ['aws-cloudtrail', 'gcp-audit-logs', 'azure-activity', 'qualys-tenable', 'netskope'],
    steps: [
      {
        time: '14:32:08',
        source: 'AWS CloudTrail',
        sourceId: 'aws-cloudtrail',
        description: 'IAM user jperks creates a new service account and attaches AdministratorAccess policy.',
        logSnippet: 'eventName="AttachUserPolicy" userName="jperks" requestParameters.policyArn="arn:aws:iam::aws:policy/AdministratorAccess" requestParameters.userName="new-service-account"',
        insight: 'Attaching full admin access to a service account is a major red flag — violates least-privilege and should trigger an immediate alert.',
      },
      {
        time: '14:34:00',
        source: 'AWS CloudTrail',
        sourceId: 'aws-cloudtrail',
        description: 'Root account login attempt fails from a known malicious IP (185.220.101.33).',
        logSnippet: 'eventName="ConsoleLogin" sourceIPAddress="185.220.101.33" responseElements.ConsoleLogin="Failure" userIdentity.type="Root"',
        insight: 'Root account login attempts from Tor exit nodes indicate credential stuffing or leaked credentials. MFA is blocking, but the account is targeted.',
      },
      {
        time: '14:35:00',
        source: 'GCP Cloud Audit Logs',
        sourceId: 'gcp-audit-logs',
        description: 'GCP storage bucket permissions changed to allUsers — making production data publicly accessible.',
        logSnippet: 'methodName="storage.setIamPermissions" resourceName="projects/_/buckets/prod-data-bucket" bindings.members=["allUsers"]',
        insight: 'Public bucket exposure. Combined with the AWS privilege escalation, this suggests coordinated cross-cloud data exposure by a compromised identity.',
      },
      {
        time: '14:36:00',
        source: 'Qualys/Tenable',
        sourceId: 'qualys-tenable',
        description: 'Vulnerability scan reveals the newly-exposed bucket contains a server with CVE-2026-1234 (CVSS 9.8).',
        logSnippet: 'cve="CVE-2026-1234" cvss_base=9.8 title="OpenSSL Buffer Overflow - Remote Code Execution" status="Active" exploitability="Exploit Available"',
        insight: 'The exposed infrastructure has an actively-exploited critical vulnerability. Attackers likely knew this before making it public.',
      },
      {
        time: '14:38:00',
        source: 'Azure Activity Logs',
        sourceId: 'azure-activity',
        description: 'Same contractor account (from suspicious IP) opens SQL firewall to 0.0.0.0/0 in Azure.',
        logSnippet: 'operationName="Microsoft.Sql/servers/firewallRules/write" message="Firewall rule created: AllowAll (0.0.0.0 - 255.255.255.255)" callerIpAddress="91.234.99.10"',
        insight: 'Cross-cloud attack pattern: the same threat actor is systematically removing network controls across all three cloud providers.',
      },
    ],
  },
];

export default function CorrelationStoriesPage() {
  const [expandedStory, setExpandedStory] = useState<string | null>(null);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  const allSourcesFlat = dataSources.flatMap((c: any) => c.sources);
  const typeColors = {
    attack: { bg: 'var(--cds-color-danger-subtle)', color: 'var(--cds-color-danger)' },
    outage: { bg: 'var(--cds-color-warning-subtle)', color: 'var(--cds-color-warning)' },
    compliance: { bg: 'var(--cds-color-accent-subtle)', color: 'var(--cds-color-accent)' },
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 'var(--cds-font-size-xxl)', fontWeight: 600, color: 'var(--cds-color-fg)', marginBottom: 8 }}>Cross-Source Correlation Stories</h2>
        <p style={{ fontSize: 'var(--cds-font-size-base)', color: 'var(--cds-color-fg-muted)', lineHeight: 1.6 }}>
          See how data sources become more powerful together. Each story traces a real-world scenario across multiple sources — showing why collecting once through Cribl and routing intelligently unlocks multi-team visibility.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {stories.map((story) => {
          const isExpanded = expandedStory === story.id;
          const colors = typeColors[story.type];
          return (
            <div key={story.id} style={{ ...card, borderColor: isExpanded ? 'var(--cds-brand-teal)' : undefined }}>
              <div
                style={{ cursor: 'pointer' }}
                onClick={() => setExpandedStory(isExpanded ? null : story.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <h3 style={{ fontSize: 'var(--cds-font-size-lg)', fontWeight: 600, margin: 0 }}>{story.title}</h3>
                      <span style={tag(colors.bg, colors.color)}>{story.type}</span>
                    </div>
                    <p style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)', margin: 0, lineHeight: 1.6 }}>{story.description}</p>
                  </div>
                  <span style={{ fontSize: 20, color: 'var(--cds-color-fg-subtle)', flexShrink: 0, marginLeft: 16 }}>
                    {isExpanded ? '▼' : '▶'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {story.sourcesUsed.map((sid) => {
                    const src = allSourcesFlat.find((s: any) => s.id === sid);
                    return (
                      <span key={sid} style={tag('var(--cds-color-bg-muted)', 'var(--cds-color-fg-muted)')}>
                        {src?.name?.split(' ')[0] || sid}
                      </span>
                    );
                  })}
                  <span style={tag('var(--cds-color-accent-subtle)', 'var(--cds-color-accent)')}>
                    {story.steps.length} steps
                  </span>
                </div>
              </div>

              {isExpanded && (
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--cds-color-border-subtle)' }}>
                  {/* Cribl Value callout */}
                  <div style={{ background: 'var(--cds-color-bg-subtle)', borderLeft: '4px solid var(--cds-brand-teal)', borderRadius: 'var(--cds-radius-md)', padding: 16, marginBottom: 20 }}>
                    <div style={{ fontSize: 'var(--cds-font-size-sm)', fontWeight: 600, color: 'var(--cds-brand-teal)', marginBottom: 4 }}>Why Cribl Matters Here</div>
                    <p style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)', margin: 0, lineHeight: 1.6 }}>{story.criblValue}</p>
                  </div>

                  {/* Timeline */}
                  <div style={{ position: 'relative', paddingLeft: 24 }}>
                    <div style={{ position: 'absolute', left: 8, top: 0, bottom: 0, width: 2, background: 'var(--cds-color-border)' }} />
                    {story.steps.map((step, idx) => {
                      const stepKey = `${story.id}-${idx}`;
                      const isStepExpanded = expandedStep === stepKey;
                      return (
                        <div key={idx} style={{ position: 'relative', marginBottom: 20, paddingLeft: 20 }}>
                          <div style={{ position: 'absolute', left: -20, top: 4, width: 16, height: 16, borderRadius: '50%', background: 'var(--cds-brand-teal)', border: '3px solid var(--cds-color-bg)' }} />
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                            <span style={{ fontSize: 'var(--cds-font-size-xs)', fontFamily: 'var(--cds-font-mono)', color: 'var(--cds-color-fg-subtle)' }}>{step.time}</span>
                            <Link to={`/source/${step.sourceId}`} style={{ fontSize: 'var(--cds-font-size-sm)', fontWeight: 600, color: 'var(--cds-color-accent)', textDecoration: 'none' }}>
                              {step.source}
                            </Link>
                          </div>
                          <p style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg)', margin: '0 0 8px 0', lineHeight: 1.5 }}>{step.description}</p>

                          <button
                            onClick={() => setExpandedStep(isStepExpanded ? null : stepKey)}
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-accent)' }}
                          >
                            {isStepExpanded ? 'Hide log & insight' : 'Show log & insight'}
                          </button>

                          {isStepExpanded && (
                            <div style={{ marginTop: 8 }}>
                              <pre style={{ fontSize: 'var(--cds-font-size-xs)', background: 'var(--cds-color-bg-muted)', padding: 12, borderRadius: 'var(--cds-radius-md)', margin: '0 0 8px 0', overflowX: 'auto', whiteSpace: 'pre-wrap', fontFamily: 'var(--cds-font-mono)', lineHeight: 1.6 }}>
                                {step.logSnippet}
                              </pre>
                              <div style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)', fontStyle: 'italic', padding: '8px 12px', background: 'var(--cds-color-bg-subtle)', borderRadius: 'var(--cds-radius-sm)', borderLeft: '3px solid var(--cds-color-accent)' }}>
                                {step.insight}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
