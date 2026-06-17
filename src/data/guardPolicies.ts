// @ts-nocheck
export interface GuardPolicy {
  sensitiveDataTypes: Array<{
    type: string;
    category: 'PII' | 'PCI' | 'PHI' | 'Secrets' | 'Infrastructure';
    fields: string[];
    recommendedAction: 'mask' | 'redact' | 'encrypt' | 'reroute' | 'tag';
    confidence: 'high' | 'medium' | 'low';
  }>;
  complianceFrameworks: string[];
  estimatedSensitivePercent: number;
  guardNotes: string;
  recommendedPlacement: 'pre-processing' | 'post-processing';
}

export const guardPolicies: Record<string, GuardPolicy> = {

  'windows-security': {
    sensitiveDataTypes: [
      { type: 'Username / SamAccountName', category: 'PII', fields: ['TargetUserName', 'SubjectUserName'], recommendedAction: 'tag', confidence: 'high' },
      { type: 'IP Address', category: 'Infrastructure', fields: ['IpAddress', 'SourceAddress'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Computer Name', category: 'Infrastructure', fields: ['Computer', 'TargetServerName'], recommendedAction: 'tag', confidence: 'medium' },
    ],
    complianceFrameworks: ['GDPR', 'CCPA'],
    estimatedSensitivePercent: 15,
    guardNotes: 'Windows Security logs contain usernames and IPs in nearly every event. Mask IP addresses when forwarding to non-security teams. Tag usernames for privacy review when routing to 3rd party analytics.',
    recommendedPlacement: 'post-processing',
  },

  'active-directory': {
    sensitiveDataTypes: [
      { type: 'Username / Distinguished Name', category: 'PII', fields: ['TargetUserName', 'SubjectUserName', 'ObjectDN'], recommendedAction: 'tag', confidence: 'high' },
      { type: 'Email Address', category: 'PII', fields: ['mail', 'userPrincipalName'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Phone Number', category: 'PII', fields: ['telephoneNumber', 'mobile'], recommendedAction: 'redact', confidence: 'high' },
      { type: 'IP Address', category: 'Infrastructure', fields: ['IpAddress', 'ClientAddress'], recommendedAction: 'mask', confidence: 'high' },
    ],
    complianceFrameworks: ['GDPR', 'CCPA', 'SOX'],
    estimatedSensitivePercent: 35,
    guardNotes: 'AD change logs contain PII in attribute values (phone, email, address). High-value target for Guard — attribute change events (4738/4720) include before/after values that may contain PII even in field names not typically expected.',
    recommendedPlacement: 'post-processing',
  },

  'sysmon': {
    sensitiveDataTypes: [
      { type: 'Command Line Arguments', category: 'Secrets', fields: ['CommandLine', 'ParentCommandLine'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'IP Address', category: 'Infrastructure', fields: ['SourceIp', 'DestinationIp'], recommendedAction: 'tag', confidence: 'medium' },
      { type: 'Username', category: 'PII', fields: ['User'], recommendedAction: 'tag', confidence: 'medium' },
    ],
    complianceFrameworks: ['PCI-DSS', 'SOC 2'],
    estimatedSensitivePercent: 25,
    guardNotes: 'CommandLine fields frequently contain embedded credentials, API keys, and connection strings passed as arguments. Guard AI model excels here — regex alone misses base64-encoded secrets and non-standard key formats.',
    recommendedPlacement: 'post-processing',
  },

  'linux-auditd': {
    sensitiveDataTypes: [
      { type: 'Command Arguments', category: 'Secrets', fields: ['a0', 'a1', 'a2', 'a3', 'exe', 'proctitle'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Username / UID', category: 'PII', fields: ['uid', 'auid', 'euid', 'acct'], recommendedAction: 'tag', confidence: 'medium' },
      { type: 'File Path', category: 'Infrastructure', fields: ['name', 'cwd'], recommendedAction: 'tag', confidence: 'low' },
    ],
    complianceFrameworks: ['PCI-DSS', 'HIPAA', 'SOC 2'],
    estimatedSensitivePercent: 20,
    guardNotes: 'Auditd EXECVE records encode full command lines including passwords passed via CLI flags. The proctitle field can contain credentials in hex-encoded form. Guard pattern matching catches common secret patterns; AI model catches obfuscated ones.',
    recommendedPlacement: 'post-processing',
  },

  'linux-auth': {
    sensitiveDataTypes: [
      { type: 'Username', category: 'PII', fields: ['user', 'ruser', 'acct'], recommendedAction: 'tag', confidence: 'high' },
      { type: 'IP Address', category: 'Infrastructure', fields: ['rhost', 'addr'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'SSH Key Fingerprint', category: 'Secrets', fields: ['key_fingerprint'], recommendedAction: 'mask', confidence: 'medium' },
    ],
    complianceFrameworks: ['GDPR', 'SOC 2'],
    estimatedSensitivePercent: 30,
    guardNotes: 'Auth logs contain source IPs and usernames on every line. PAM modules may log additional context including geolocation or device identifiers. Mask IPs before routing to non-SOC destinations.',
    recommendedPlacement: 'post-processing',
  },

  'crowdstrike-fdr': {
    sensitiveDataTypes: [
      { type: 'Command Line', category: 'Secrets', fields: ['CommandLine', 'GrandparentCommandLine'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Username', category: 'PII', fields: ['UserName', 'UserPrincipal'], recommendedAction: 'tag', confidence: 'high' },
      { type: 'IP Address', category: 'Infrastructure', fields: ['LocalAddressIP4', 'RemoteAddressIP4', 'aip'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'MAC Address', category: 'PII', fields: ['MacAddress'], recommendedAction: 'mask', confidence: 'high' },
    ],
    complianceFrameworks: ['GDPR', 'CCPA', 'PCI-DSS'],
    estimatedSensitivePercent: 40,
    guardNotes: 'CrowdStrike FDR is extremely rich in PII — every process event carries username, hostname, IP, and MAC. CommandLine fields are the highest-risk for embedded secrets. Recommended: Guard on post-processing pipeline before non-SOC destinations.',
    recommendedPlacement: 'post-processing',
  },

  'okta-system-log': {
    sensitiveDataTypes: [
      { type: 'Email Address', category: 'PII', fields: ['actor.alternateId', 'target[].alternateId'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'IP Address', category: 'Infrastructure', fields: ['client.ipAddress', 'request.ipChain[].ip'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'User Agent', category: 'PII', fields: ['client.userAgent.rawUserAgent'], recommendedAction: 'tag', confidence: 'low' },
      { type: 'Geographic Location', category: 'PII', fields: ['client.geographicalContext'], recommendedAction: 'redact', confidence: 'medium' },
    ],
    complianceFrameworks: ['GDPR', 'CCPA', 'SOC 2'],
    estimatedSensitivePercent: 60,
    guardNotes: 'Okta logs use email as the primary identifier — every event contains PII by design. Geographic context reveals user location. Guard is critical when routing Okta events to teams outside of Security/IT for operational analytics.',
    recommendedPlacement: 'post-processing',
  },

  'palo-alto-traffic': {
    sensitiveDataTypes: [
      { type: 'IP Address (Internal)', category: 'Infrastructure', fields: ['src', 'dst', 'natSrc', 'natDst'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Username', category: 'PII', fields: ['srcUser', 'dstUser'], recommendedAction: 'tag', confidence: 'high' },
      { type: 'URL / Domain', category: 'PII', fields: ['misc', 'url_filename'], recommendedAction: 'mask', confidence: 'medium' },
    ],
    complianceFrameworks: ['GDPR', 'PCI-DSS', 'HIPAA'],
    estimatedSensitivePercent: 25,
    guardNotes: 'Firewall traffic logs map users to IPs to destinations — powerful for correlation but high-PII when combined. URL fields in threat logs may contain query parameters with tokens or PII. Guard pattern matching handles IP/username; AI catches URLs with embedded credentials.',
    recommendedPlacement: 'post-processing',
  },

  'palo-alto-threat': {
    sensitiveDataTypes: [
      { type: 'IP Address', category: 'Infrastructure', fields: ['src', 'dst'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Username', category: 'PII', fields: ['srcUser'], recommendedAction: 'tag', confidence: 'high' },
      { type: 'URL with Parameters', category: 'Secrets', fields: ['misc', 'url_filename'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'File Hash / Name', category: 'Infrastructure', fields: ['filedigest', 'misc'], recommendedAction: 'tag', confidence: 'low' },
    ],
    complianceFrameworks: ['PCI-DSS', 'GDPR'],
    estimatedSensitivePercent: 30,
    guardNotes: 'Threat logs capture malicious URLs which may contain victim PII in query strings (email, SSN in phishing URLs). The misc field can contain full HTTP request bodies on certain threat types. Guard AI model particularly effective on URL parameter scanning.',
    recommendedPlacement: 'post-processing',
  },

  'nginx-access': {
    sensitiveDataTypes: [
      { type: 'IP Address', category: 'PII', fields: ['remote_addr', 'http_x_forwarded_for'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'URL Query Parameters', category: 'Secrets', fields: ['request_uri', 'args'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Auth Token in Header', category: 'Secrets', fields: ['http_authorization', 'http_cookie'], recommendedAction: 'redact', confidence: 'high' },
      { type: 'User Agent', category: 'PII', fields: ['http_user_agent'], recommendedAction: 'tag', confidence: 'low' },
    ],
    complianceFrameworks: ['GDPR', 'CCPA', 'PCI-DSS'],
    estimatedSensitivePercent: 45,
    guardNotes: 'Web access logs are PII-dense: every request has an IP, and query strings frequently contain session tokens, API keys, email addresses, and search terms. Authorization headers logged at debug level contain bearer tokens. Guard is essential before routing to observability platforms.',
    recommendedPlacement: 'post-processing',
  },

  'vpc-flow-logs': {
    sensitiveDataTypes: [
      { type: 'IP Address', category: 'Infrastructure', fields: ['srcaddr', 'dstaddr'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Account ID', category: 'Infrastructure', fields: ['account-id'], recommendedAction: 'tag', confidence: 'medium' },
    ],
    complianceFrameworks: ['GDPR', 'PCI-DSS'],
    estimatedSensitivePercent: 10,
    guardNotes: 'VPC flow logs are lower-PII than most sources (no usernames, no content). IP addresses are the primary concern — internal IPs reveal infrastructure topology. Mask when routing to external SIEMs or third-party analytics.',
    recommendedPlacement: 'post-processing',
  },

  'aws-cloudtrail': {
    sensitiveDataTypes: [
      { type: 'IAM Principal / ARN', category: 'PII', fields: ['userIdentity.arn', 'userIdentity.userName'], recommendedAction: 'tag', confidence: 'high' },
      { type: 'IP Address', category: 'Infrastructure', fields: ['sourceIPAddress'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Access Key ID', category: 'Secrets', fields: ['userIdentity.accessKeyId', 'requestParameters.accessKeyId'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Resource ARN', category: 'Infrastructure', fields: ['resources[].ARN', 'requestParameters'], recommendedAction: 'tag', confidence: 'medium' },
    ],
    complianceFrameworks: ['SOC 2', 'PCI-DSS', 'HIPAA', 'FedRAMP'],
    estimatedSensitivePercent: 35,
    guardNotes: 'CloudTrail requestParameters and responseElements can contain arbitrary API payloads — S3 PutObject metadata, EC2 UserData (often base64 secrets), IAM policy documents. Guard AI model catches secrets in nested JSON structures that pattern matching misses.',
    recommendedPlacement: 'post-processing',
  },

  'k8s-audit': {
    sensitiveDataTypes: [
      { type: 'Service Account Token', category: 'Secrets', fields: ['requestObject.data', 'responseObject.data'], recommendedAction: 'redact', confidence: 'high' },
      { type: 'IP Address', category: 'Infrastructure', fields: ['sourceIPs[]'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Secret Values', category: 'Secrets', fields: ['requestObject.data', 'requestObject.stringData'], recommendedAction: 'redact', confidence: 'high' },
      { type: 'Username', category: 'PII', fields: ['user.username', 'impersonatedUser.username'], recommendedAction: 'tag', confidence: 'medium' },
    ],
    complianceFrameworks: ['SOC 2', 'PCI-DSS', 'HIPAA'],
    estimatedSensitivePercent: 30,
    guardNotes: 'K8s audit logs at RequestResponse level include full Secret object contents (TLS certs, DB passwords, API keys) in base64. This is the #1 source of credential leaks into SIEM. Guard MUST be applied before any non-platform destination. Use redact action on requestObject.data for Secret resources.',
    recommendedPlacement: 'post-processing',
  },

  'windows-dns': {
    sensitiveDataTypes: [
      { type: 'IP Address', category: 'Infrastructure', fields: ['Source', 'QNAME_response'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'DNS Query (Browsing History)', category: 'PII', fields: ['QNAME'], recommendedAction: 'mask', confidence: 'medium' },
    ],
    complianceFrameworks: ['GDPR', 'CCPA'],
    estimatedSensitivePercent: 15,
    guardNotes: 'DNS query logs reveal browsing behavior (which constitutes PII under GDPR). Internal hostname queries may reveal infrastructure naming conventions. Mask client IPs and consider hashing query names when routing to analytics teams.',
    recommendedPlacement: 'post-processing',
  },

  'f5-ltm': {
    sensitiveDataTypes: [
      { type: 'IP Address (Client)', category: 'PII', fields: ['client_ip', 'source_ip'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'HTTP Headers', category: 'Secrets', fields: ['request_headers', 'cookie'], recommendedAction: 'redact', confidence: 'high' },
      { type: 'SSL Certificate CN', category: 'PII', fields: ['ssl_client_cn', 'ssl_server_cn'], recommendedAction: 'tag', confidence: 'medium' },
    ],
    complianceFrameworks: ['PCI-DSS', 'GDPR'],
    estimatedSensitivePercent: 30,
    guardNotes: 'F5 LTM request logging may capture full HTTP headers including Authorization, Cookie, and X-Forwarded-For chains. iRule logging can expose application-layer secrets. Apply Guard before routing to non-security destinations.',
    recommendedPlacement: 'post-processing',
  },

  'cisco-asa': {
    sensitiveDataTypes: [
      { type: 'IP Address', category: 'Infrastructure', fields: ['src_ip', 'dst_ip', 'mapped_ip'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Username', category: 'PII', fields: ['user', 'aaa_user'], recommendedAction: 'tag', confidence: 'high' },
      { type: 'VPN Group Policy', category: 'Infrastructure', fields: ['group_policy', 'tunnel_group'], recommendedAction: 'tag', confidence: 'low' },
    ],
    complianceFrameworks: ['PCI-DSS', 'SOC 2'],
    estimatedSensitivePercent: 20,
    guardNotes: 'ASA logs map VPN users to internal IPs, creating a user-to-resource correlation trail. Mask IPs and tag usernames when forwarding to operational teams who don\'t need identity context.',
    recommendedPlacement: 'post-processing',
  },

  'workday-audit': {
    sensitiveDataTypes: [
      { type: 'Employee Name / Worker ID', category: 'PII', fields: ['System_Account', 'Target_Worker'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'SSN / National ID', category: 'PII', fields: ['Field_Path'], recommendedAction: 'redact', confidence: 'high' },
      { type: 'Compensation Data', category: 'PII', fields: ['Field_Path', 'Report_Name'], recommendedAction: 'encrypt', confidence: 'high' },
      { type: 'Banking / Direct Deposit', category: 'PCI', fields: ['Field_Path'], recommendedAction: 'redact', confidence: 'high' },
      { type: 'IP Address', category: 'Infrastructure', fields: ['IP_Address'], recommendedAction: 'mask', confidence: 'high' },
    ],
    complianceFrameworks: ['GDPR', 'CCPA', 'SOX', 'HIPAA'],
    estimatedSensitivePercent: 75,
    guardNotes: 'Workday audit logs are extremely PII-dense — nearly every event references an employee by name/ID and the Field_Path column may reference SSN, salary, bank accounts, and health elections. Guard is CRITICAL on this source. Encrypt compensation fields, redact SSN/banking, mask names when routing outside HR Security.',
    recommendedPlacement: 'post-processing',
  },

  'workday-integration-prism': {
    sensitiveDataTypes: [
      { type: 'Integration Credentials', category: 'Secrets', fields: ['Integration_System_User', 'Output_Endpoint'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Employee Record Counts', category: 'PII', fields: ['Records_Processed'], recommendedAction: 'tag', confidence: 'low' },
      { type: 'SFTP Endpoints', category: 'Infrastructure', fields: ['Output_Endpoint'], recommendedAction: 'mask', confidence: 'medium' },
    ],
    complianceFrameworks: ['SOX', 'SOC 2'],
    estimatedSensitivePercent: 20,
    guardNotes: 'Integration logs are lower-PII than audit logs but may expose ISU credentials in error messages, SFTP paths with embedded credentials, and endpoint URLs revealing partner integrations. Guard catches secrets in error stack traces.',
    recommendedPlacement: 'post-processing',
  },

  'sap-sm20-audit': {
    sensitiveDataTypes: [
      { type: 'SAP Username', category: 'PII', fields: ['User', 'Terminal'], recommendedAction: 'tag', confidence: 'high' },
      { type: 'Transaction Data in Messages', category: 'PII', fields: ['Message_Text'], recommendedAction: 'mask', confidence: 'medium' },
      { type: 'Client IP / Terminal', category: 'Infrastructure', fields: ['Terminal'], recommendedAction: 'mask', confidence: 'high' },
    ],
    complianceFrameworks: ['SOX', 'GDPR', 'GxP'],
    estimatedSensitivePercent: 20,
    guardNotes: 'SM20 message text fields may contain variable data from transactions including customer names, financial amounts, and material numbers. The Terminal field maps users to workstations. Lower PII density than application-layer SAP logs but still requires Guard when routing to non-GRC teams.',
    recommendedPlacement: 'post-processing',
  },

  'sap-hana-audit': {
    sensitiveDataTypes: [
      { type: 'SQL Statement (Full Text)', category: 'Secrets', fields: ['STATEMENT_STRING', 'EXECUTED_STATEMENT'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Database Username', category: 'PII', fields: ['USER_NAME', 'SESSION_USER'], recommendedAction: 'tag', confidence: 'high' },
      { type: 'Client IP', category: 'Infrastructure', fields: ['CLIENT_IP'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'PII in WHERE Clauses', category: 'PII', fields: ['STATEMENT_STRING'], recommendedAction: 'redact', confidence: 'high' },
    ],
    complianceFrameworks: ['SOX', 'PCI-DSS', 'GDPR', 'GxP'],
    estimatedSensitivePercent: 55,
    guardNotes: 'HANA audit trail captures full SQL statements which frequently contain PII in WHERE clauses (SELECT ... WHERE SSN = \'123-45-6789\'), literal values in INSERT statements, and connection strings with passwords. Guard AI model is critical here — SQL statement parsing requires contextual understanding beyond regex.',
    recommendedPlacement: 'post-processing',
  },

  'oracle-unified-audit': {
    sensitiveDataTypes: [
      { type: 'SQL Statement Text', category: 'Secrets', fields: ['SQL_TEXT'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Database Username', category: 'PII', fields: ['DBUSERNAME', 'OS_USERNAME'], recommendedAction: 'tag', confidence: 'high' },
      { type: 'Client Hostname', category: 'Infrastructure', fields: ['USERHOST', 'TERMINAL'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'PII in Query Predicates', category: 'PII', fields: ['SQL_TEXT'], recommendedAction: 'redact', confidence: 'high' },
    ],
    complianceFrameworks: ['SOX', 'PCI-DSS', 'HIPAA', 'GDPR'],
    estimatedSensitivePercent: 50,
    guardNotes: 'Oracle Unified Audit captures SQL_TEXT which contains literal values from application queries — SSNs, credit card numbers, account numbers in WHERE clauses. Fine-Grained Auditing (FGA) policies target sensitive columns but the audit record itself then contains the sensitive predicate values. Guard is essential.',
    recommendedPlacement: 'post-processing',
  },

  'salesforce-events': {
    sensitiveDataTypes: [
      { type: 'Username / Email', category: 'PII', fields: ['USER_NAME', 'USER_ID'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'IP Address', category: 'Infrastructure', fields: ['SOURCE_IP'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Report Data (Row Counts)', category: 'PII', fields: ['ENTITY_NAME', 'ROWS_PROCESSED'], recommendedAction: 'tag', confidence: 'medium' },
      { type: 'Session/Login Keys', category: 'Secrets', fields: ['SESSION_KEY', 'LOGIN_KEY'], recommendedAction: 'redact', confidence: 'high' },
    ],
    complianceFrameworks: ['SOC 2', 'GDPR', 'CCPA', 'HIPAA'],
    estimatedSensitivePercent: 45,
    guardNotes: 'Salesforce EventLogFile data uses email as primary identifier and includes session tokens. ReportExport events reveal what customer data was accessed. BulkAPI events may include query SOQL with customer identifiers. Guard catches session tokens and email patterns reliably.',
    recommendedPlacement: 'post-processing',
  },

  'mimecast-email': {
    sensitiveDataTypes: [
      { type: 'Email Address (Sender/Recipient)', category: 'PII', fields: ['from', 'to', 'envelope_from', 'envelope_to'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Subject Line', category: 'PII', fields: ['subject'], recommendedAction: 'redact', confidence: 'high' },
      { type: 'IP Address', category: 'Infrastructure', fields: ['source_ip', 'sender_ip'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Attachment Names', category: 'PII', fields: ['attachment_filename'], recommendedAction: 'tag', confidence: 'medium' },
    ],
    complianceFrameworks: ['GDPR', 'CCPA', 'HIPAA'],
    estimatedSensitivePercent: 85,
    guardNotes: 'Email security logs are the highest-PII source in most environments. Every event contains sender/recipient email addresses, subject lines (which may contain PII like "Invoice for John Smith #12345"), and attachment names. Guard is MANDATORY before any non-security routing.',
    recommendedPlacement: 'post-processing',
  },

  'mongodb-audit': {
    sensitiveDataTypes: [
      { type: 'Query Parameters', category: 'PII', fields: ['param.command', 'param.query'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Username', category: 'PII', fields: ['users[].user', 'param.user'], recommendedAction: 'tag', confidence: 'high' },
      { type: 'IP Address', category: 'Infrastructure', fields: ['local.ip', 'remote.ip'], recommendedAction: 'mask', confidence: 'high' },
    ],
    complianceFrameworks: ['PCI-DSS', 'HIPAA', 'SOC 2'],
    estimatedSensitivePercent: 40,
    guardNotes: 'MongoDB audit logs capture full query documents which may contain PII in filter predicates ({email: "user@company.com"}) and update values. Aggregation pipelines in command field can reference sensitive fields. Guard AI model handles nested JSON document scanning effectively.',
    recommendedPlacement: 'post-processing',
  },

  'postgresql-audit': {
    sensitiveDataTypes: [
      { type: 'SQL Statement', category: 'Secrets', fields: ['statement', 'detail'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Username / Role', category: 'PII', fields: ['user_name', 'session_user_name'], recommendedAction: 'tag', confidence: 'high' },
      { type: 'Client IP', category: 'Infrastructure', fields: ['connection_from'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'PII in Parameters', category: 'PII', fields: ['detail'], recommendedAction: 'redact', confidence: 'high' },
    ],
    complianceFrameworks: ['PCI-DSS', 'HIPAA', 'SOX', 'GDPR'],
    estimatedSensitivePercent: 50,
    guardNotes: 'pgAudit logs capture parameterized queries with bound values in the detail field — PII appears as literal parameters. COPY commands expose bulk data paths. Guard catches PII patterns in SQL text and parameter bindings.',
    recommendedPlacement: 'post-processing',
  },

  'snowflake-audit': {
    sensitiveDataTypes: [
      { type: 'SQL Query Text', category: 'Secrets', fields: ['QUERY_TEXT'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Username / Role', category: 'PII', fields: ['USER_NAME', 'ROLE_NAME'], recommendedAction: 'tag', confidence: 'high' },
      { type: 'Client IP', category: 'Infrastructure', fields: ['CLIENT_IP'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Connection Parameters', category: 'Secrets', fields: ['CLIENT_ENVIRONMENT'], recommendedAction: 'mask', confidence: 'medium' },
    ],
    complianceFrameworks: ['SOC 2', 'PCI-DSS', 'HIPAA', 'GDPR'],
    estimatedSensitivePercent: 40,
    guardNotes: 'Snowflake QUERY_HISTORY captures full SQL text including COPY INTO commands with S3 credentials, CREATE STAGE with cloud keys, and SELECT with PII filter values. CLIENT_ENVIRONMENT may contain OS username and application secrets.',
    recommendedPlacement: 'post-processing',
  },

  'mssql-audit': {
    sensitiveDataTypes: [
      { type: 'SQL Statement', category: 'Secrets', fields: ['statement'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Username / Principal', category: 'PII', fields: ['server_principal_name', 'database_principal_name'], recommendedAction: 'tag', confidence: 'high' },
      { type: 'Client IP', category: 'Infrastructure', fields: ['client_ip'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Application Name', category: 'Infrastructure', fields: ['application_name'], recommendedAction: 'tag', confidence: 'low' },
    ],
    complianceFrameworks: ['SOX', 'PCI-DSS', 'HIPAA'],
    estimatedSensitivePercent: 45,
    guardNotes: 'SQL Server audit captures full statement text. Dynamic SQL and ad-hoc queries contain literal PII values. Linked server queries may expose cross-database credentials. Column-level auditing means the captured statement references the exact sensitive columns accessed.',
    recommendedPlacement: 'post-processing',
  },

  'google-workspace-audit': {
    sensitiveDataTypes: [
      { type: 'Email Address', category: 'PII', fields: ['actor.email', 'parameters[].value'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'IP Address', category: 'Infrastructure', fields: ['ipAddress'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Document Title', category: 'PII', fields: ['events[].parameters[].value'], recommendedAction: 'tag', confidence: 'medium' },
      { type: 'OAuth Token Scopes', category: 'Secrets', fields: ['events[].parameters[].value'], recommendedAction: 'mask', confidence: 'medium' },
    ],
    complianceFrameworks: ['GDPR', 'CCPA', 'SOC 2', 'HIPAA'],
    estimatedSensitivePercent: 55,
    guardNotes: 'Google Workspace Admin logs use email as primary identifier throughout. Document titles may contain project names, customer names, or sensitive topics. OAuth token grant events expose scopes and client secrets. Drive sharing events reveal collaborator networks.',
    recommendedPlacement: 'post-processing',
  },

  'sentinelone-edr': {
    sensitiveDataTypes: [
      { type: 'Command Line', category: 'Secrets', fields: ['threatInfo.commandLineArguments', 'processInfo.commandLine'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Username', category: 'PII', fields: ['agentDetectionInfo.agentLastLoggedInUserName'], recommendedAction: 'tag', confidence: 'high' },
      { type: 'IP Address', category: 'Infrastructure', fields: ['agentDetectionInfo.agentIpV4', 'networkInfo.remoteIp'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'File Path', category: 'PII', fields: ['threatInfo.filePath'], recommendedAction: 'tag', confidence: 'low' },
    ],
    complianceFrameworks: ['GDPR', 'CCPA', 'PCI-DSS'],
    estimatedSensitivePercent: 35,
    guardNotes: 'SentinelOne Deep Visibility data mirrors CrowdStrike in PII density — process trees carry usernames, IPs, and command lines with embedded secrets. File path fields may reveal user home directory structures (/home/jsmith/).',
    recommendedPlacement: 'post-processing',
  },

  'aws-guardduty': {
    sensitiveDataTypes: [
      { type: 'IP Address', category: 'Infrastructure', fields: ['service.action.networkConnectionAction.remoteIpDetails.ipAddressV4'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'IAM Principal', category: 'PII', fields: ['resource.accessKeyDetails.userName', 'resource.instanceDetails.iamInstanceProfile.arn'], recommendedAction: 'tag', confidence: 'high' },
      { type: 'Instance ID / DNS', category: 'Infrastructure', fields: ['resource.instanceDetails.instanceId', 'service.action.dnsRequestAction.domain'], recommendedAction: 'tag', confidence: 'medium' },
    ],
    complianceFrameworks: ['SOC 2', 'PCI-DSS'],
    estimatedSensitivePercent: 20,
    guardNotes: 'GuardDuty findings contain IAM principals, IPs, and DNS queries. Lower PII density than raw CloudTrail since findings are pre-aggregated. Tag IAM users when routing to non-security ops teams.',
    recommendedPlacement: 'post-processing',
  },

  'aws-waf-logs': {
    sensitiveDataTypes: [
      { type: 'Client IP', category: 'PII', fields: ['httpRequest.clientIp'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'HTTP Headers (Cookies/Auth)', category: 'Secrets', fields: ['httpRequest.headers[]'], recommendedAction: 'redact', confidence: 'high' },
      { type: 'URI / Query String', category: 'PII', fields: ['httpRequest.uri', 'httpRequest.args'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Country / Geo', category: 'PII', fields: ['httpRequest.country'], recommendedAction: 'tag', confidence: 'low' },
    ],
    complianceFrameworks: ['GDPR', 'PCI-DSS', 'CCPA'],
    estimatedSensitivePercent: 50,
    guardNotes: 'WAF logs capture full HTTP request metadata including headers (Authorization, Cookie, X-API-Key) and URI with query parameters containing user credentials, tokens, and PII. This is one of the richest sources for secret leaks. Guard MUST scan headers array.',
    recommendedPlacement: 'post-processing',
  },

  'aws-alb-logs': {
    sensitiveDataTypes: [
      { type: 'Client IP', category: 'PII', fields: ['client:port', 'client_ip'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'URL with Parameters', category: 'Secrets', fields: ['request_url'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'User Agent', category: 'PII', fields: ['user_agent'], recommendedAction: 'tag', confidence: 'low' },
      { type: 'SSL Cipher / Certificate', category: 'Infrastructure', fields: ['ssl_cipher', 'ssl_protocol'], recommendedAction: 'tag', confidence: 'low' },
    ],
    complianceFrameworks: ['GDPR', 'CCPA', 'PCI-DSS'],
    estimatedSensitivePercent: 35,
    guardNotes: 'ALB access logs capture request URLs with full query strings. OAuth callback URLs contain authorization codes, API endpoints contain API keys in query params, and health check endpoints may expose internal naming.',
    recommendedPlacement: 'post-processing',
  },

  'cisco-firepower': {
    sensitiveDataTypes: [
      { type: 'IP Address', category: 'Infrastructure', fields: ['InitiatorIP', 'ResponderIP'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Username', category: 'PII', fields: ['User'], recommendedAction: 'tag', confidence: 'high' },
      { type: 'URL / Domain', category: 'PII', fields: ['URL', 'DNSQuery'], recommendedAction: 'mask', confidence: 'medium' },
    ],
    complianceFrameworks: ['PCI-DSS', 'SOC 2'],
    estimatedSensitivePercent: 25,
    guardNotes: 'Firepower connection and intrusion events map users to network flows. URL logging in file/malware events may expose browsing history. Mask IPs and URLs when routing to non-SOC operational dashboards.',
    recommendedPlacement: 'post-processing',
  },

  'squid-proxy': {
    sensitiveDataTypes: [
      { type: 'Client IP', category: 'PII', fields: ['client_ip', 'src_ip'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Full URL (Browsing History)', category: 'PII', fields: ['url', 'request_url'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Username (NTLM/Kerberos)', category: 'PII', fields: ['ident', 'user'], recommendedAction: 'mask', confidence: 'high' },
    ],
    complianceFrameworks: ['GDPR', 'CCPA'],
    estimatedSensitivePercent: 70,
    guardNotes: 'Proxy logs are essentially browsing history mapped to users — high PII by nature. Every line contains an IP, often a username (if auth is enabled), and the full URL including query strings. Guard is essential when these logs are used for anything beyond security monitoring.',
    recommendedPlacement: 'post-processing',
  },

  'darktrace-ndr': {
    sensitiveDataTypes: [
      { type: 'IP Address (Internal)', category: 'Infrastructure', fields: ['device.ip', 'source.ip', 'destination.ip'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Hostname / Device Name', category: 'PII', fields: ['device.hostname', 'device.label'], recommendedAction: 'tag', confidence: 'medium' },
      { type: 'Username (from traffic)', category: 'PII', fields: ['device.credentials[]'], recommendedAction: 'mask', confidence: 'high' },
    ],
    complianceFrameworks: ['GDPR', 'PCI-DSS'],
    estimatedSensitivePercent: 25,
    guardNotes: 'Darktrace model breach alerts contain internal IPs, hostnames, and sometimes credentials observed in cleartext traffic. Device labels may include user assignments. Mask when forwarding to third-party correlation platforms.',
    recommendedPlacement: 'post-processing',
  },

  'wiz-cloud-security': {
    sensitiveDataTypes: [
      { type: 'Resource ARN / ID', category: 'Infrastructure', fields: ['resource.id', 'resource.nativeType'], recommendedAction: 'tag', confidence: 'medium' },
      { type: 'IP Address', category: 'Infrastructure', fields: ['resource.ipAddresses[]'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Cloud Account ID', category: 'Infrastructure', fields: ['resource.subscription.externalId'], recommendedAction: 'tag', confidence: 'medium' },
    ],
    complianceFrameworks: ['SOC 2', 'CIS'],
    estimatedSensitivePercent: 15,
    guardNotes: 'Wiz findings are pre-processed security posture data — lower PII than raw cloud logs. May contain resource IPs and cloud account identifiers. Tag rather than mask when routing to remediation workflows.',
    recommendedPlacement: 'post-processing',
  },

  'juniper-srx': {
    sensitiveDataTypes: [
      { type: 'IP Address', category: 'Infrastructure', fields: ['source-address', 'destination-address', 'nat-source-address'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Username', category: 'PII', fields: ['username', 'source-identity'], recommendedAction: 'tag', confidence: 'high' },
    ],
    complianceFrameworks: ['PCI-DSS', 'SOC 2'],
    estimatedSensitivePercent: 20,
    guardNotes: 'Juniper SRX flow logs follow similar patterns to Palo Alto — IPs and usernames in session logs. NAT translation reveals internal topology. Mask when routing to external MSSPs or cloud analytics.',
    recommendedPlacement: 'post-processing',
  },

  'cisco-sdwan': {
    sensitiveDataTypes: [
      { type: 'IP Address', category: 'Infrastructure', fields: ['src_ip', 'dst_ip', 'local_tloc_ip'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Site / Branch Name', category: 'Infrastructure', fields: ['site_name', 'system_ip'], recommendedAction: 'tag', confidence: 'medium' },
    ],
    complianceFrameworks: ['PCI-DSS', 'SOC 2'],
    estimatedSensitivePercent: 15,
    guardNotes: 'SD-WAN telemetry reveals branch topology and site naming. TLOC IPs and system IPs expose WAN architecture. Lower PII than user-level logs but important for infrastructure confidentiality.',
    recommendedPlacement: 'post-processing',
  },

  'aws-cloudwatch-metrics': {
    sensitiveDataTypes: [
      { type: 'Account / Resource ID', category: 'Infrastructure', fields: ['dimensions.InstanceId', 'dimensions.FunctionName'], recommendedAction: 'tag', confidence: 'low' },
    ],
    complianceFrameworks: [],
    estimatedSensitivePercent: 5,
    guardNotes: 'CloudWatch metrics are the lowest-PII source — numeric values with dimension labels. Resource IDs may reveal naming conventions but contain no personal data. Guard adds minimal value here unless custom metrics embed user identifiers in dimension names.',
    recommendedPlacement: 'post-processing',
  },

};
