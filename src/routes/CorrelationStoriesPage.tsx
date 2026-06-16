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
  {
    id: 'bec-wire-fraud',
    title: 'Business Email Compromise → Wire Fraud Attempt',
    type: 'attack',
    description: 'An attacker impersonates the CEO via a lookalike domain, targets the finance team, and nearly initiates a fraudulent wire transfer — detected across email security, identity, and privileged access systems.',
    criblValue: 'Cribl routes email security logs, identity events, and PAM audit trails to the same SIEM in real-time — enabling the SOC to correlate impersonation attempts with downstream access patterns that would otherwise be invisible across siloed tools.',
    sourcesUsed: ['mimecast-email', 'proofpoint-email', 'microsoft-entra-id', 'cyberark-pam', 'servicenow'],
    steps: [
      {
        time: '09:15:00',
        source: 'Mimecast Email Security',
        sourceId: 'mimecast-email',
        description: 'Mimecast TTP impersonation detection flags an inbound email from ceo.name@crib1.io — a lookalike domain targeting the finance team.',
        logSnippet: 'logType="ttp-impersonation" senderAddress="ceo.name@crib1.io" recipientAddress="finance-team@cribl.io" subject="Urgent Wire Transfer - Confidential" similarDomain="crib1.io" action="hold"',
        insight: 'The attacker registered crib1.io (numeral 1 vs letter l). Mimecast caught the similarity but the email was held, not blocked — requiring analyst review.',
      },
      {
        time: '09:17:00',
        source: 'Proofpoint Email Protection',
        sourceId: 'proofpoint-email',
        description: 'A second email from the same campaign bypasses Proofpoint via a different entry point — using a compromised partner domain.',
        logSnippet: 'classification="impostor" impostorScore=94 sender="ceo@partner-compromised.com" recipient="finance-lead@cribl.io" subject="Re: Wire Transfer - Updated Instructions" headerFrom="CEO Name <ceo@cribl.io>"',
        insight: 'The attacker is using multiple vectors simultaneously. The compromised partner domain has legitimate reputation, making detection harder.',
      },
      {
        time: '09:22:00',
        source: 'Microsoft Entra ID',
        sourceId: 'microsoft-entra-id',
        description: 'Finance lead authenticates to the banking portal via SSO — conditional access shows login from expected location.',
        logSnippet: 'appDisplayName="Corporate Banking Portal" userPrincipalName="finance-lead@cribl.io" status.errorCode=0 conditionalAccessStatus="success" riskLevelAggregated="none"',
        insight: 'The finance lead is acting on the fraudulent email. The legitimate SSO session means the banking portal access looks normal to identity systems.',
      },
      {
        time: '09:24:00',
        source: 'CyberArk PAM',
        sourceId: 'cyberark-pam',
        description: 'Finance lead checks out the wire transfer authorization credential from CyberArk — triggering dual-control approval workflow.',
        logSnippet: 'act=Retrieve Password suser=finance-lead@cribl.io duser=wire_auth_prod reason="CEO request - urgent wire transfer" cs1=Finance-Wire-Auth cs2=Banking-Credentials',
        insight: 'The dual-control requirement bought time — a second approver must validate. This is the last line of defense before funds transfer.',
      },
      {
        time: '09:26:00',
        source: 'ServiceNow',
        sourceId: 'servicenow',
        description: 'SOC creates an incident after correlating the Mimecast hold, Proofpoint impostor score, and PAM checkout — blocking the wire before second approval.',
        logSnippet: 'number="INC0012400" priority="1 - Critical" short_description="BEC Attack - CEO Impersonation targeting wire transfer" category="Security Incident" subcategory="Business Email Compromise"',
        insight: 'Cross-source correlation caught what no single tool would: impersonation + SSO login + credential checkout = BEC in progress. Without centralized routing, these stay in separate consoles.',
      },
    ],
  },
  {
    id: 'insider-data-exfil',
    title: 'Insider Threat: Data Hoarding & Exfiltration',
    type: 'attack',
    description: 'A departing employee systematically collects sensitive data across multiple systems over two weeks, then exfiltrates via personal cloud storage — detected through behavioral anomaly correlation.',
    criblValue: 'Cribl aggregates behavioral signals from NDR, zero-trust access, source code management, and database audit into a single detection surface — turning individually low-confidence alerts into a high-confidence insider threat narrative.',
    sourcesUsed: ['darktrace-ndr', 'zscaler-zpa', 'github-audit', 'mongodb-audit', 'wiz-cloud-security'],
    steps: [
      {
        time: '10:00:00',
        source: 'Darktrace NDR',
        sourceId: 'darktrace-ndr',
        description: 'Darktrace flags anomalous data transfer volume — user laptop uploading 890MB to Google Drive, 20x above their baseline.',
        logSnippet: 'modelName="SaaS::Unusual External Data Transfer" score=45 device.hostname="laptop-jlee" triggeredComponents.value="drive.google.com" bytesTransferred=890000000 baselineAvg=45000000',
        insight: 'Score 45 alone would not trigger SOC investigation. But this is the culmination of a pattern visible across other sources.',
      },
      {
        time: '09:30:00',
        source: 'Zscaler ZPA',
        sourceId: 'zscaler-zpa',
        description: 'ZPA logs show the user accessing 12 internal application segments in 48 hours — 4x their normal access pattern, including finance and HR portals never previously accessed.',
        logSnippet: 'User="jlee@cribl.io" ApplicationSegment="Internal-Finance-Reports" ConnectionStatus="active" PolicyProcessingTime=8 ClientType="ZCC"',
        insight: 'Zero trust access logs reveal breadth of access — the user is systematically visiting applications outside their normal role. Each individual access is authorized, but the pattern is anomalous.',
      },
      {
        time: '09:45:00',
        source: 'GitHub Audit',
        sourceId: 'github-audit',
        description: 'GitHub audit shows the user cloning 8 private repositories they have read access to but have never cloned before — including the internal-tools and infrastructure-as-code repos.',
        logSnippet: 'action="git.clone" actor="jlee" org="cribl-io" repo="cribl-io/infrastructure-as-code" visibility="private" actor_ip="198.51.100.55"',
        insight: 'Mass repo cloning from an employee is a strong exfiltration indicator. Combined with the ZPA access broadening, this suggests systematic data collection.',
      },
      {
        time: '09:50:00',
        source: 'MongoDB Audit',
        sourceId: 'mongodb-audit',
        description: 'MongoDB audit log shows a bulk query against the customers collection with no filter — returning 50,000 records with PII fields.',
        logSnippet: 'atype="authCheck" remote.ip="10.0.2.30" users=[{"user":"app-readonly","db":"admin"}] param.command="find" param.ns="production.customers" param.args.filter={} result=0',
        insight: 'The user is accessing the database through an application service account (app-readonly) rather than their personal credentials — attempting to avoid attribution.',
      },
      {
        time: '10:05:00',
        source: 'Wiz Cloud Security',
        sourceId: 'wiz-cloud-security',
        description: 'Wiz detects that an S3 bucket policy was modified to allow cross-account access to an unknown external AWS account — created by the same user via their IAM role.',
        logSnippet: 'sourceRule.name="S3 Bucket Policy Allows External Account Access" severity="HIGH" entitySnapshot.name="team-exports-bucket" entitySnapshot.cloudPlatform="AWS"',
        insight: 'The user is creating an exfiltration path via cloud infrastructure — setting up cross-account S3 access to move data out of the organization. This is the smoking gun connecting all the prior collection activity.',
      },
    ],
  },
  {
    id: 'ransomware-domain-compromise',
    title: 'Ransomware: Delivery → Execution → Domain Compromise',
    type: 'attack',
    description: 'A weaponized email attachment delivers ransomware that escalates from a single endpoint to domain-wide encryption — tracked across email, endpoint, secrets management, virtualization, and directory services.',
    criblValue: 'Cribl ensures the full kill chain is visible in one pane by routing email security, EDR, PAM, virtualization, and AD logs to the SIEM simultaneously — enabling the IR team to see time-correlated events that span 5 different vendor ecosystems.',
    sourcesUsed: ['cisco-secure-email', 'paloalto-cortex-xdr', 'hashicorp-vault', 'vmware-vsphere', 'active-directory'],
    steps: [
      {
        time: '08:45:00',
        source: 'Cisco Secure Email',
        sourceId: 'cisco-secure-email',
        description: 'Cisco ESA quarantines an email with a macro-enabled attachment — but a near-identical variant delivered 2 minutes earlier was allowed through before signatures updated.',
        logSnippet: 'MID 12345679 From: <invoice@supplier-legit.com> To: <accounting@cribl.io> Subject: "June Invoice - PO#4521" Action: delivered AMP: unknown Attachment: june-invoice.xlsm',
        insight: 'The first email arrived before AMP had a verdict. By the time the second was quarantined, the first was already opened. This is the 0-minute gap attackers exploit.',
      },
      {
        time: '08:52:00',
        source: 'Palo Alto Cortex XDR',
        sourceId: 'paloalto-cortex-xdr',
        description: 'Cortex XDR detects ransomware behavior — the macro spawns PowerShell, disables Windows Defender, and begins encrypting files with .locked extension.',
        logSnippet: 'modelName="Ransomware Activity" score=99 mitre_technique="T1486" host_name="accounting-ws-01" action_taken="Detected" deviceProcessName="powershell.exe" msg="Mass file encryption detected - 450 files modified in 30 seconds"',
        insight: 'XDR caught the encryption behavior but the process had already disabled local AV. The 7-minute gap between delivery and detection gave the malware time to establish persistence.',
      },
      {
        time: '08:55:00',
        source: 'HashiCorp Vault',
        sourceId: 'hashicorp-vault',
        description: 'Vault audit shows the compromised workstation requesting domain admin credentials via an application role that should only be used by CI/CD pipelines.',
        logSnippet: 'type="request" auth.display_name="approle-ci-pipeline" request.operation="read" request.path="ad/creds/domain-admin" request.remote_address="10.0.3.15"',
        insight: 'The ransomware is using a stolen AppRole token to retrieve domain admin credentials from Vault. The request comes from a workstation IP, not a CI/CD runner — clear misuse.',
      },
      {
        time: '08:58:00',
        source: 'Active Directory',
        sourceId: 'active-directory',
        description: 'AD logs show the compromised domain admin account adding the attacker-controlled machine account to Domain Admins and modifying Group Policy to disable security tools fleet-wide.',
        logSnippet: 'EventID=4728 TargetUserName="ACCOUNTING-WS-01$" GroupName="Domain Admins" SubjectUserName="svc_domain_admin" SubjectLogonId="0x3E7"',
        insight: 'The attacker elevated a machine account to Domain Admin — this gives them GPO modification rights. The next step will be pushing ransomware via Group Policy to all domain-joined machines.',
      },
      {
        time: '09:02:00',
        source: 'VMware vSphere',
        sourceId: 'vmware-vsphere',
        description: 'vCenter shows all VM snapshots being deleted across the production cluster — the attacker is removing recovery points before triggering fleet-wide encryption.',
        logSnippet: 'Event [VmRemovedSnapshotEvent]: All snapshots removed from VM db-prod-01 by user svc_domain_admin@vsphere.local. VMs affected: 47. Cluster: Prod-Cluster-01.',
        insight: 'Snapshot deletion is the ransomware endgame preparation. Without snapshots, VM-level recovery is impossible. This is the last moment to contain before domain-wide impact.',
      },
    ],
  },
  {
    id: 'cloud-misconfig-exploitation',
    title: 'Cloud Misconfiguration → Active Exploitation',
    type: 'compliance',
    description: 'A toxic combination of misconfigured cloud resources is discovered by Wiz, but before remediation completes, an attacker exploits the same path — detected through cloud, NDR, database, and CASB correlation.',
    criblValue: 'Cribl routes CNAPP findings, cloud audit trails, NDR alerts, and database logs to both SIEM (real-time detection) and Lake (forensic timeline) — enabling the IR team to reconstruct the full exploitation timeline while maintaining compliance evidence.',
    sourcesUsed: ['wiz-cloud-security', 'aws-cloudtrail', 'darktrace-ndr', 'postgresql-audit', 'netskope'],
    steps: [
      {
        time: '06:00:00',
        source: 'Wiz Cloud Security',
        sourceId: 'wiz-cloud-security',
        description: 'Wiz identifies a toxic combination: public-facing EC2 with critical RCE vulnerability (CVE-2026-1234) + IAM role with RDS full access + no network segmentation to production database.',
        logSnippet: 'sourceRule.name="Toxic Combination: Public + Vulnerable + Privileged" severity="CRITICAL" title="Publicly exposed EC2 with critical CVE and IAM role allowing RDS access" entitySnapshot.name="web-legacy-prod"',
        insight: 'Wiz found the attack path 8 hours before exploitation. The issue was assigned but remediation required a change window. This gap is where the attacker struck.',
      },
      {
        time: '14:15:00',
        source: 'AWS CloudTrail',
        sourceId: 'aws-cloudtrail',
        description: 'CloudTrail shows the EC2 instance IAM role making unusual API calls — DescribeDBInstances, CreateDBSnapshot, and ModifyDBSnapshotAttribute to share with an external account.',
        logSnippet: 'eventName="ModifyDBSnapshotAttribute" sourceIPAddress="10.0.5.88" userIdentity.arn="arn:aws:sts::123456789012:assumed-role/web-legacy-role/i-0abc123" requestParameters.valuesToAdd=["987654321098"]',
        insight: 'The attacker exploited the RCE to gain code execution, then used the attached IAM role (which Wiz flagged hours ago) to snapshot and share the production database with their own AWS account.',
      },
      {
        time: '14:18:00',
        source: 'Darktrace NDR',
        sourceId: 'darktrace-ndr',
        description: 'Darktrace detects the compromised EC2 instance making anomalous outbound connections to a rare external IP — command and control channel established.',
        logSnippet: 'modelName="Compromise::Beaconing Activity To External Rare" score=82 device.hostname="web-legacy-prod" device.ip="10.0.5.88" triggeredComponents.value="203.0.113.99:8443"',
        insight: 'The NDR behavioral detection confirms active exploitation — the EC2 instance has never connected to this IP before. The C2 channel was established after the RCE exploitation.',
      },
      {
        time: '14:20:00',
        source: 'PostgreSQL Audit',
        sourceId: 'postgresql-audit',
        description: 'pgAudit shows a bulk SELECT against the customers table from the application role — dumping all records including PII columns that the web application never queries in bulk.',
        logSnippet: '2026-06-16 14:20:00.123 UTC [54321] web_app_role@production LOG:  AUDIT: SESSION,1,1,READ,SELECT,TABLE,public.customers,"SELECT * FROM customers",<not logged>',
        insight: 'The attacker is using the web application database credentials (available via the EC2 instance environment) to dump the customer table. The SELECT * with no WHERE clause is the exfiltration query.',
      },
      {
        time: '14:25:00',
        source: 'Netskope',
        sourceId: 'netskope',
        description: 'Netskope detects 2.3GB uploaded to an unsanctioned cloud storage service from the compromised instance subnet — data exfiltration confirmed.',
        logSnippet: 'type="upload" app="Mega Cloud Storage" category="Cloud Storage" ccl="poor" src_ip="10.0.5.88" bytes_uploaded=2300000000 alert="yes" dlp_profile="PII Detection" severity="critical"',
        insight: 'Full circle: Wiz found the path, attacker exploited it, CloudTrail showed the IAM abuse, Darktrace caught the C2, pgAudit logged the dump, and Netskope confirmed exfiltration. Without Cribl routing all 5 to one SIEM, this takes days to piece together.',
      },
    ],
  },
  {
    id: 'infrastructure-failover-cascade',
    title: 'Infrastructure Failover Cascade',
    type: 'outage',
    description: 'An ESXi host failure triggers HA failover, which overwhelms the surviving infrastructure — cascading through load balancers, network, monitoring, and incident management.',
    criblValue: 'Cribl routes infrastructure logs from virtualization, load balancing, network, cloud monitoring, and ITSM to both real-time dashboards and Lake — ensuring the NOC sees correlated events while preserving the full blast radius timeline for post-mortem.',
    sourcesUsed: ['vmware-vsphere', 'citrix-netscaler', 'cisco-meraki', 'aws-cloudwatch', 'atlassian-audit'],
    steps: [
      {
        time: '02:15:00',
        source: 'VMware vSphere',
        sourceId: 'vmware-vsphere',
        description: 'ESXi host esxi-node-05 loses all network connectivity. vCenter HA initiates failover for 12 VMs to surviving hosts in the cluster.',
        logSnippet: 'Event [HostConnectionLostEvent]: Host esxi-node-05 has lost network connectivity. HA failover initiated for 12 VMs. Cluster: Prod-Cluster-01. Datacenter: DC-East.',
        insight: 'The root cause is a physical NIC failure on the host. HA failover is working as designed, but 12 VMs moving simultaneously will create a resource surge on the remaining hosts.',
      },
      {
        time: '02:16:30',
        source: 'Citrix NetScaler',
        sourceId: 'citrix-netscaler',
        description: 'NetScaler detects 4 backend pool members going down simultaneously as VMs reboot on new hosts — health monitors report failures.',
        logSnippet: 'EVENT MONITORDOWN : Monitor mon-http-api-prod - Services svc-api-node-03,svc-api-node-04,svc-api-node-05,svc-api-node-06 - State DOWN - Previous_state UP',
        insight: 'The load balancer sees half its backend pool disappear. Surviving members will receive 2x traffic. If they cannot absorb the surge, cascading 503s follow.',
      },
      {
        time: '02:17:00',
        source: 'Cisco Meraki',
        sourceId: 'cisco-meraki',
        description: 'Meraki MX reports inter-VLAN routing degradation — the management VLAN is saturated with vMotion traffic from the HA failover.',
        logSnippet: 'type="ids_alerted" priority="1" timestamp="2026-06-16T02:17:00Z" message="High bandwidth utilization on VLAN 100 (management): 98% sustained" device_name="MX-DC-East-01"',
        insight: 'vMotion traffic is competing with production traffic on the same physical uplinks. The network was not designed for 12 simultaneous vMotion operations.',
      },
      {
        time: '02:18:00',
        source: 'AWS CloudWatch',
        sourceId: 'aws-cloudwatch',
        description: 'Hybrid connectivity alarm fires — the Direct Connect link to the on-prem DC shows packet loss as the saturated uplinks drop traffic.',
        logSnippet: 'AlarmName="DirectConnect-PacketLoss-Critical" StateValue="ALARM" MetricName="ConnectionLossCount" Threshold=10 ActualValue=847 Namespace="AWS/DX"',
        insight: 'The blast radius extends beyond on-prem: AWS workloads depending on hybrid connectivity to on-prem databases are now affected. What started as a single host failure is now a multi-cloud event.',
      },
      {
        time: '02:19:00',
        source: 'Atlassian (Jira/Confluence)',
        sourceId: 'atlassian-audit',
        description: 'Opsgenie (via Atlassian) auto-creates an incident page and pages the on-call team. The incident links to 3 prior failover events from the same cluster.',
        logSnippet: 'action="incident_created" summary="P1: DC-East Production Cluster Failover Cascade" author.name="opsgenie-integration" objectItem.name="INC-2026-0616-001" context.ip="automation"',
        insight: 'The ITSM integration connects this to a pattern — the same cluster has had 3 failover events in 30 days, suggesting underlying hardware degradation that host-level monitoring alone did not surface.',
      },
    ],
  },
  {
    id: 'zero-trust-bypass',
    title: 'Zero Trust Policy Bypass via MFA Fatigue',
    type: 'compliance',
    description: 'An attacker with stolen credentials uses MFA push bombing to fatigue a user into approving access, then pivots through zero trust controls to reach privileged systems — detected across identity, MFA, ZTA, and PAM.',
    criblValue: 'Cribl normalizes authentication events from Okta, Entra ID, Duo, ZPA, and CyberArk into a unified identity timeline — enabling a detection that spans 5 identity/access systems which would otherwise require manual pivot between consoles.',
    sourcesUsed: ['okta-system-logs', 'microsoft-entra-id', 'duo-mfa', 'zscaler-zpa', 'cyberark-pam'],
    steps: [
      {
        time: '22:30:00',
        source: 'Okta System Logs',
        sourceId: 'okta-system-logs',
        description: 'Okta shows 47 failed MFA push notifications for user mthompson in 10 minutes — all denied. The authentication requests originate from a Tor exit node.',
        logSnippet: 'eventType="user.authentication.auth_via_mfa" outcome.result="FAILURE" outcome.reason="REJECTED_BY_USER" actor.alternateId="mthompson@cribl.io" client.ipAddress="185.220.101.33" debugContext.debugData.factor="OKTA_VERIFY_PUSH"',
        insight: 'Classic MFA fatigue/push bombing attack. The attacker has valid credentials (likely from phishing or credential stuffing) and is hoping the user accidentally approves out of frustration.',
      },
      {
        time: '22:41:00',
        source: 'Duo Security',
        sourceId: 'duo-mfa',
        description: 'Duo logs show the user finally approves a push notification at 10:41 PM — the 48th attempt. Duo flags this as anomalous based on time-of-day and denial pattern.',
        logSnippet: 'eventtype="authentication" result="success" username="mthompson" factor="duo_push" access_device.ip="185.220.101.33" reason="user_approved" anomalous="true" auth_count_last_10min=48',
        insight: 'The user gave in to fatigue and approved. Duo flagged it as anomalous but the policy was set to allow (not block) anomalous approvals. This is the policy gap.',
      },
      {
        time: '22:42:00',
        source: 'Microsoft Entra ID',
        sourceId: 'microsoft-entra-id',
        description: 'Entra ID shows a new session for mthompson from the Tor IP — conditional access evaluates as "success" because MFA was satisfied (Duo approved).',
        logSnippet: 'userPrincipalName="mthompson@cribl.io" ipAddress="185.220.101.33" status.errorCode=0 conditionalAccessStatus="success" riskLevelAggregated="high" riskState="atRisk" authenticationRequirement="multiFactorAuthentication"',
        insight: 'Entra ID flagged the session as high risk but conditional access still allowed it because the policy required MFA and MFA was satisfied. Risk-based blocking would have caught this.',
      },
      {
        time: '22:44:00',
        source: 'Zscaler ZPA',
        sourceId: 'zscaler-zpa',
        description: 'ZPA grants the attacker access to the Internal-Finance-DB application segment — the compromised session satisfies the access policy requirements.',
        logSnippet: 'User="mthompson@cribl.io" ApplicationSegment="Internal-Finance-DB" ConnectionStatus="active" ClientPublicIP="185.220.101.33" Policy="Finance-Team-Access" DoubleEncryption="yes"',
        insight: 'Zero trust access control was bypassed because the identity layer was compromised. The attacker now has direct application-level access to the finance database — no VPN needed.',
      },
      {
        time: '22:46:00',
        source: 'CyberArk PAM',
        sourceId: 'cyberark-pam',
        description: 'CyberArk logs show credential retrieval for the finance database service account — initiated via the compromised session at 10:46 PM (outside business hours).',
        logSnippet: 'act=Retrieve Password suser=mthompson@cribl.io shost=185.220.101.33 duser=svc_finance_db dhost=finance-db-prod.internal reason="scheduled maintenance" cs3=safe-finance-prod cn1Label=SessionDuration cn1=0',
        insight: 'The attacker retrieved production database credentials. The "scheduled maintenance" reason and off-hours access from a Tor IP should have triggered the dual-control workflow, but the policy only required it for the wire-transfer safe, not the database safe.',
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
