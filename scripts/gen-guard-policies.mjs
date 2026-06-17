import fs from 'fs';

const newPolicies = {
  'zscaler-web-logs': {
    sensitiveDataTypes: [
      { type: 'User Identity', category: 'PII', fields: ['user', 'department', 'location'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'IP Address', category: 'Infrastructure', fields: ['clientIP', 'serverIP'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'URL / Browsing Activity', category: 'PII', fields: ['url', 'refererURL', 'hostname'], recommendedAction: 'mask', confidence: 'high' },
    ],
    complianceFrameworks: ['GDPR', 'CCPA'],
    estimatedSensitivePercent: 45,
    guardNotes: 'Web proxy logs contain full browsing history tied to user identity — high-PII by nature. URLs may embed session tokens, OAuth codes, and personal identifiers in query strings. Guard AI model valuable for detecting credentials in URL parameters.',
    recommendedPlacement: 'post-processing',
  },
  'checkpoint-fw': {
    sensitiveDataTypes: [
      { type: 'IP Address', category: 'Infrastructure', fields: ['src', 'dst', 'xlatesrc', 'xlatedst'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Username', category: 'PII', fields: ['user', 'src_user_name'], recommendedAction: 'mask', confidence: 'medium' },
    ],
    complianceFrameworks: ['PCI-DSS', 'SOC 2'],
    estimatedSensitivePercent: 20,
    guardNotes: 'Check Point firewall logs contain source/destination IPs and NAT translations. Identity awareness blade adds usernames to connection events. Standard rule-based Guard detection covers the structured IP and user fields well.',
    recommendedPlacement: 'post-processing',
  },
  'infoblox-dns': {
    sensitiveDataTypes: [
      { type: 'Client IP', category: 'Infrastructure', fields: ['client_ip', 'source_ip'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'DNS Query', category: 'PII', fields: ['query_name', 'response_data'], recommendedAction: 'tag', confidence: 'medium' },
    ],
    complianceFrameworks: ['GDPR'],
    estimatedSensitivePercent: 15,
    guardNotes: 'DNS query logs correlate browsing behavior to client IPs. Individual queries are low risk but aggregation reveals user activity patterns. Tag query names for privacy review; mask client IPs when forwarding to analytics.',
    recommendedPlacement: 'post-processing',
  },
  'cisco-umbrella': {
    sensitiveDataTypes: [
      { type: 'User Identity', category: 'PII', fields: ['identities', 'externalIp', 'internalIp'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'DNS / URL Activity', category: 'PII', fields: ['domain', 'url', 'categories'], recommendedAction: 'tag', confidence: 'medium' },
    ],
    complianceFrameworks: ['GDPR', 'CCPA'],
    estimatedSensitivePercent: 35,
    guardNotes: 'Umbrella logs correlate user identities (AD-integrated) to DNS queries and web activity. Identity field is directly PII. Domain access patterns reveal user behavior over time.',
    recommendedPlacement: 'post-processing',
  },
  'netflow': {
    sensitiveDataTypes: [
      { type: 'IP Address', category: 'Infrastructure', fields: ['IPV4_SRC_ADDR', 'IPV4_DST_ADDR', 'IPV6_SRC_ADDR', 'IPV6_DST_ADDR'], recommendedAction: 'mask', confidence: 'high' },
    ],
    complianceFrameworks: ['PCI-DSS'],
    estimatedSensitivePercent: 10,
    guardNotes: 'NetFlow is metadata-only — no payload content, no usernames. IP addresses are the primary sensitive element. Low PII risk overall but IPs may need masking for non-security analytics destinations.',
    recommendedPlacement: 'post-processing',
  },
  'ipfix': {
    sensitiveDataTypes: [
      { type: 'IP Address', category: 'Infrastructure', fields: ['sourceIPv4Address', 'destinationIPv4Address'], recommendedAction: 'mask', confidence: 'high' },
    ],
    complianceFrameworks: ['PCI-DSS'],
    estimatedSensitivePercent: 10,
    guardNotes: 'IPFIX flow records are purely network metadata. Similar to NetFlow — IP addresses are the only sensitive data type. Mask IPs when routing to non-security observability destinations.',
    recommendedPlacement: 'post-processing',
  },
  'apache-access': {
    sensitiveDataTypes: [
      { type: 'Client IP', category: 'PII', fields: ['remote_host', 'clientip'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'URL Path / Query', category: 'PII', fields: ['request', 'request_uri'], recommendedAction: 'mask', confidence: 'medium' },
      { type: 'User Identity', category: 'PII', fields: ['remote_user', 'ident'], recommendedAction: 'mask', confidence: 'high' },
    ],
    complianceFrameworks: ['GDPR', 'CCPA'],
    estimatedSensitivePercent: 30,
    guardNotes: 'Apache access logs tie client IPs to URLs. Query parameters often contain user IDs, session tokens, and search terms. Guard pattern matching catches embedded credentials in request URIs.',
    recommendedPlacement: 'post-processing',
  },
  'iis-access': {
    sensitiveDataTypes: [
      { type: 'Client IP', category: 'PII', fields: ['c-ip', 'cs-host'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'URL / Query String', category: 'PII', fields: ['cs-uri-stem', 'cs-uri-query'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Username', category: 'PII', fields: ['cs-username'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Cookie / Auth Header', category: 'Secrets', fields: ['cs(Cookie)', 'cs(Authorization)'], recommendedAction: 'redact', confidence: 'high' },
    ],
    complianceFrameworks: ['GDPR', 'CCPA', 'PCI-DSS'],
    estimatedSensitivePercent: 40,
    guardNotes: 'IIS logs with advanced fields include cookies and auth headers — high sensitivity. Query strings frequently contain form data (login, PII). Guard AI model valuable for detecting base64-encoded tokens in header fields.',
    recommendedPlacement: 'post-processing',
  },
  'akamai-waf': {
    sensitiveDataTypes: [
      { type: 'Client IP', category: 'PII', fields: ['clientIP', 'attackData.clientIP'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Request URL / Payload', category: 'PII', fields: ['httpMessage.requestUri', 'attackData.rules'], recommendedAction: 'mask', confidence: 'medium' },
      { type: 'HTTP Headers', category: 'Secrets', fields: ['httpMessage.requestHeaders'], recommendedAction: 'redact', confidence: 'medium' },
    ],
    complianceFrameworks: ['PCI-DSS', 'SOC 2'],
    estimatedSensitivePercent: 30,
    guardNotes: 'Akamai WAF events include attack payloads which may contain credentials attackers attempted to exfiltrate or exploit. Request headers contain auth tokens. Guard catches embedded secrets in attack payloads.',
    recommendedPlacement: 'post-processing',
  },
  'prisma-access-traffic': {
    sensitiveDataTypes: [
      { type: 'IP Address', category: 'Infrastructure', fields: ['src', 'dst', 'natSrc', 'natDst'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Username', category: 'PII', fields: ['srcUser', 'dstUser'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'URL', category: 'PII', fields: ['misc', 'url'], recommendedAction: 'mask', confidence: 'medium' },
    ],
    complianceFrameworks: ['GDPR', 'CCPA', 'PCI-DSS'],
    estimatedSensitivePercent: 35,
    guardNotes: 'Prisma Access traffic logs include User-ID integration tying network sessions to named users. URLs in the misc field may contain tokens and PII. Same pattern as on-prem Palo Alto but with remote user context added.',
    recommendedPlacement: 'post-processing',
  },
  'prisma-access-gp': {
    sensitiveDataTypes: [
      { type: 'Username', category: 'PII', fields: ['user', 'srcUser'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Client IP / Public IP', category: 'PII', fields: ['publicIP', 'privateIP', 'gatewayIP'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Device Info', category: 'PII', fields: ['hostName', 'macAddress'], recommendedAction: 'mask', confidence: 'medium' },
    ],
    complianceFrameworks: ['GDPR', 'CCPA'],
    estimatedSensitivePercent: 40,
    guardNotes: 'GlobalProtect connection logs directly identify users with their home/remote IPs and device details. Every event is a user-session correlation. High PII density — Guard masking essential before forwarding to non-security analytics.',
    recommendedPlacement: 'post-processing',
  },
  'netskope': {
    sensitiveDataTypes: [
      { type: 'User Identity', category: 'PII', fields: ['user', 'from_user', 'to_user'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'IP Address', category: 'PII', fields: ['srcip', 'dstip'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'File / Object Names', category: 'PII', fields: ['object', 'file_path', 'url'], recommendedAction: 'tag', confidence: 'medium' },
    ],
    complianceFrameworks: ['GDPR', 'CCPA', 'HIPAA'],
    estimatedSensitivePercent: 50,
    guardNotes: 'Netskope CASB logs correlate users to cloud application activity including file operations. DLP events by definition contain or reference sensitive content. Guard AI model excels at detecting PII in object/file names and URLs.',
    recommendedPlacement: 'post-processing',
  },
  'cloudflare': {
    sensitiveDataTypes: [
      { type: 'Client IP', category: 'PII', fields: ['ClientIP', 'EdgeServerIP'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'URL / Query', category: 'PII', fields: ['ClientRequestURI', 'ClientRequestHost'], recommendedAction: 'mask', confidence: 'medium' },
      { type: 'Origin IP', category: 'Infrastructure', fields: ['OriginIP'], recommendedAction: 'mask', confidence: 'high' },
    ],
    complianceFrameworks: ['GDPR', 'CCPA'],
    estimatedSensitivePercent: 25,
    guardNotes: 'Cloudflare HTTP logs expose visitor IPs and request URIs. Origin IP exposure is an infrastructure security concern. URIs may contain session tokens in query parameters. Standard Guard pattern matching handles these well.',
    recommendedPlacement: 'post-processing',
  },
  'openai-usage': {
    sensitiveDataTypes: [
      { type: 'API Key', category: 'Secrets', fields: ['api_key_id', 'organization_id'], recommendedAction: 'redact', confidence: 'high' },
      { type: 'User Identity', category: 'PII', fields: ['user', 'end_user_id'], recommendedAction: 'mask', confidence: 'medium' },
    ],
    complianceFrameworks: ['SOC 2'],
    estimatedSensitivePercent: 15,
    guardNotes: 'OpenAI usage logs contain API key references and optional end-user IDs. Prompt/completion content is not typically in usage logs but may appear in error responses. Redact any API key values.',
    recommendedPlacement: 'post-processing',
  },
  'openai-compliance': {
    sensitiveDataTypes: [
      { type: 'Prompt/Completion Content', category: 'PII', fields: ['input', 'output', 'messages'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'User Identity', category: 'PII', fields: ['user_id', 'end_user'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'API Credentials', category: 'Secrets', fields: ['api_key', 'organization_id'], recommendedAction: 'redact', confidence: 'high' },
    ],
    complianceFrameworks: ['GDPR', 'CCPA', 'HIPAA', 'SOC 2'],
    estimatedSensitivePercent: 70,
    guardNotes: 'AI compliance logs contain full prompt and completion text which frequently includes PII, PHI, credentials, and proprietary data submitted by end users. Guard AI model critical here — unstructured text with unpredictable sensitive content patterns.',
    recommendedPlacement: 'pre-processing',
  },
  'anthropic-compliance': {
    sensitiveDataTypes: [
      { type: 'Prompt/Completion Content', category: 'PII', fields: ['input', 'output', 'messages'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'User Identity', category: 'PII', fields: ['user_id', 'metadata.user'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'API Credentials', category: 'Secrets', fields: ['api_key', 'x-api-key'], recommendedAction: 'redact', confidence: 'high' },
    ],
    complianceFrameworks: ['GDPR', 'CCPA', 'HIPAA', 'SOC 2'],
    estimatedSensitivePercent: 70,
    guardNotes: 'Anthropic compliance logs mirror OpenAI — full conversation content with unpredictable PII in prompts/completions. Guard AI model essential for detecting embedded secrets, PHI, and PII in freeform user input.',
    recommendedPlacement: 'pre-processing',
  },
  'prisma-cloud-cspm': {
    sensitiveDataTypes: [
      { type: 'Cloud Resource IDs', category: 'Infrastructure', fields: ['resourceId', 'accountId', 'rrn'], recommendedAction: 'tag', confidence: 'medium' },
      { type: 'IP / Network Config', category: 'Infrastructure', fields: ['ipAddress', 'networkInterfaces'], recommendedAction: 'mask', confidence: 'medium' },
    ],
    complianceFrameworks: ['PCI-DSS', 'SOC 2', 'CIS'],
    estimatedSensitivePercent: 10,
    guardNotes: 'CSPM posture findings are primarily infrastructure metadata. Low PII content — resource IDs and misconfigurations. Tag resource identifiers that could reveal internal naming conventions.',
    recommendedPlacement: 'post-processing',
  },
  'prisma-cloud-cwp': {
    sensitiveDataTypes: [
      { type: 'Container / Image Name', category: 'Infrastructure', fields: ['imageName', 'containerName', 'hostname'], recommendedAction: 'tag', confidence: 'medium' },
      { type: 'Process Command Line', category: 'Secrets', fields: ['command', 'processPath'], recommendedAction: 'mask', confidence: 'high' },
    ],
    complianceFrameworks: ['PCI-DSS', 'SOC 2'],
    estimatedSensitivePercent: 20,
    guardNotes: 'CWP runtime events capture process executions in containers — command lines may embed secrets (env vars, connection strings). Guard AI model catches base64-encoded credentials in container startup commands.',
    recommendedPlacement: 'post-processing',
  },
  'aws-vpc-flow': {
    sensitiveDataTypes: [
      { type: 'IP Address', category: 'Infrastructure', fields: ['srcaddr', 'dstaddr', 'pkt-srcaddr', 'pkt-dstaddr'], recommendedAction: 'mask', confidence: 'high' },
    ],
    complianceFrameworks: ['PCI-DSS'],
    estimatedSensitivePercent: 10,
    guardNotes: 'VPC Flow Logs are pure network metadata — IPs, ports, bytes, action. No usernames, no payload. IP addresses are the only sensitive element. Low Guard value unless masking IPs for non-security destinations.',
    recommendedPlacement: 'post-processing',
  },
  'o365-activity': {
    sensitiveDataTypes: [
      { type: 'User Identity', category: 'PII', fields: ['UserId', 'UserKey', 'ClientIP'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Email / Mailbox', category: 'PII', fields: ['MailboxOwnerUPN', 'AffectedItems'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'File / Object', category: 'PII', fields: ['ObjectId', 'SourceFileName', 'ItemName'], recommendedAction: 'tag', confidence: 'medium' },
    ],
    complianceFrameworks: ['GDPR', 'CCPA', 'HIPAA'],
    estimatedSensitivePercent: 45,
    guardNotes: 'Office 365 activity logs span Exchange, SharePoint, OneDrive, Teams — every event tied to a user. Mailbox operations reference email subjects and file names that may contain PII. Guard masking essential for non-security forwarding.',
    recommendedPlacement: 'post-processing',
  },
  'microsoft-graph': {
    sensitiveDataTypes: [
      { type: 'User Profile Data', category: 'PII', fields: ['userPrincipalName', 'displayName', 'mail', 'mobilePhone'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'IP Address', category: 'PII', fields: ['ipAddress', 'clientAppUsed'], recommendedAction: 'mask', confidence: 'high' },
    ],
    complianceFrameworks: ['GDPR', 'CCPA'],
    estimatedSensitivePercent: 50,
    guardNotes: 'Microsoft Graph API responses contain rich user profile data including names, emails, phone numbers. Every query response potentially contains PII. Guard masking critical when syncing Graph data to analytics platforms.',
    recommendedPlacement: 'pre-processing',
  },
  'cisco-ise': {
    sensitiveDataTypes: [
      { type: 'Username / Identity', category: 'PII', fields: ['UserName', 'CallingStationID'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'IP / MAC Address', category: 'PII', fields: ['FramedIPAddress', 'CallingStationID', 'NASIPAddress'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Device Identity', category: 'Infrastructure', fields: ['EndPointMACAddress', 'EndPointPolicy'], recommendedAction: 'tag', confidence: 'medium' },
    ],
    complianceFrameworks: ['PCI-DSS', 'SOC 2', 'HIPAA'],
    estimatedSensitivePercent: 35,
    guardNotes: 'ISE authentication logs tie usernames to MAC addresses and IPs — direct device-to-user correlation. CallingStationID is often a MAC address uniquely identifying personal devices. High privacy impact when forwarding to analytics.',
    recommendedPlacement: 'post-processing',
  },
  'ping-identity': {
    sensitiveDataTypes: [
      { type: 'User Identity', category: 'PII', fields: ['subject', 'userName', 'email'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'IP Address', category: 'PII', fields: ['ip', 'clientIP'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Auth Token References', category: 'Secrets', fields: ['accessToken', 'refreshToken'], recommendedAction: 'redact', confidence: 'high' },
    ],
    complianceFrameworks: ['GDPR', 'CCPA', 'SOC 2'],
    estimatedSensitivePercent: 45,
    guardNotes: 'PingIdentity logs are inherently identity-rich — every event references a user principal. Token values in debug/verbose logs are high-risk secrets. Redact any token references; mask user identifiers for non-security destinations.',
    recommendedPlacement: 'post-processing',
  },
  'duo-mfa': {
    sensitiveDataTypes: [
      { type: 'User Identity', category: 'PII', fields: ['user.name', 'user.email'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'IP / Location', category: 'PII', fields: ['access_device.ip', 'access_device.location.city'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Phone Number', category: 'PII', fields: ['auth_device.name', 'phone_number'], recommendedAction: 'redact', confidence: 'high' },
    ],
    complianceFrameworks: ['GDPR', 'CCPA', 'HIPAA'],
    estimatedSensitivePercent: 55,
    guardNotes: 'Duo MFA logs contain names, emails, phone numbers, and precise geolocation for every auth attempt. Highest PII density among identity sources — every event directly identifies a person with location context. Guard masking essential.',
    recommendedPlacement: 'post-processing',
  },
  'okta-system-logs': {
    sensitiveDataTypes: [
      { type: 'User Identity', category: 'PII', fields: ['actor.displayName', 'actor.alternateId', 'target.displayName'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'IP Address', category: 'PII', fields: ['client.ipAddress', 'client.geographicalContext'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Session Token', category: 'Secrets', fields: ['authenticationContext.externalSessionId'], recommendedAction: 'redact', confidence: 'medium' },
    ],
    complianceFrameworks: ['GDPR', 'CCPA', 'SOC 2'],
    estimatedSensitivePercent: 45,
    guardNotes: 'Okta System Log events tie user identities to every action with rich context (device, geo, app). alternateId is typically an email address. Guard masking critical for privacy when forwarding to analytics or observability platforms.',
    recommendedPlacement: 'post-processing',
  },
  'microsoft-entra-id': {
    sensitiveDataTypes: [
      { type: 'User Identity', category: 'PII', fields: ['userPrincipalName', 'userDisplayName'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'IP / Location', category: 'PII', fields: ['ipAddress', 'location.city', 'location.countryOrRegion'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Device Info', category: 'PII', fields: ['deviceDetail.displayName', 'deviceDetail.deviceId'], recommendedAction: 'tag', confidence: 'medium' },
    ],
    complianceFrameworks: ['GDPR', 'CCPA', 'SOC 2'],
    estimatedSensitivePercent: 45,
    guardNotes: 'Entra ID sign-in logs contain UPNs (email addresses), display names, IPs, and city-level geolocation for every authentication. High PII density — Guard masking essential before non-security destinations.',
    recommendedPlacement: 'post-processing',
  },
  'cyberark-pam': {
    sensitiveDataTypes: [
      { type: 'Privileged Credentials', category: 'Secrets', fields: ['target_account', 'safe'], recommendedAction: 'redact', confidence: 'high' },
      { type: 'User Identity', category: 'PII', fields: ['user', 'source_ip'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Target System', category: 'Infrastructure', fields: ['target_address', 'platform_id'], recommendedAction: 'mask', confidence: 'high' },
    ],
    complianceFrameworks: ['PCI-DSS', 'SOX', 'SOC 2'],
    estimatedSensitivePercent: 55,
    guardNotes: 'PAM logs reveal who accessed which privileged accounts on which systems — security crown jewels. Session recordings reference paths may contain credentials. Guard should redact credential references and mask operator identities for non-SOC destinations.',
    recommendedPlacement: 'pre-processing',
  },
  'crowdstrike-edr': {
    sensitiveDataTypes: [
      { type: 'Command Line', category: 'Secrets', fields: ['CommandLine', 'ParentBaseFileName'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Username', category: 'PII', fields: ['UserName', 'UserSid'], recommendedAction: 'mask', confidence: 'medium' },
      { type: 'IP Address', category: 'Infrastructure', fields: ['LocalAddressIP4', 'RemoteAddressIP4'], recommendedAction: 'mask', confidence: 'high' },
    ],
    complianceFrameworks: ['PCI-DSS', 'SOC 2'],
    estimatedSensitivePercent: 30,
    guardNotes: 'CrowdStrike EDR telemetry captures full command lines which frequently embed secrets (API keys, passwords in scripts). Guard AI model excels at detecting base64-encoded and obfuscated credentials in process arguments.',
    recommendedPlacement: 'post-processing',
  },
  'trellix-hx': {
    sensitiveDataTypes: [
      { type: 'Username', category: 'PII', fields: ['username', 'hostname'], recommendedAction: 'mask', confidence: 'medium' },
      { type: 'Process Command Line', category: 'Secrets', fields: ['process.cmdLine', 'process.arguments'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'IP Address', category: 'Infrastructure', fields: ['agent.ip', 'remoteAddress'], recommendedAction: 'mask', confidence: 'high' },
    ],
    complianceFrameworks: ['PCI-DSS', 'SOC 2'],
    estimatedSensitivePercent: 25,
    guardNotes: 'Trellix HX endpoint alerts include process execution details and user context. Command line arguments are the primary secrets risk. Standard Guard pattern matching covers structured fields; AI model adds value for process args.',
    recommendedPlacement: 'post-processing',
  },
  'trellix-nx': {
    sensitiveDataTypes: [
      { type: 'IP Address', category: 'Infrastructure', fields: ['srcIp', 'dstIp', 'sensorIp'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'URL / Domain', category: 'PII', fields: ['httpUrl', 'httpHost', 'dnsQuery'], recommendedAction: 'mask', confidence: 'medium' },
    ],
    complianceFrameworks: ['PCI-DSS'],
    estimatedSensitivePercent: 15,
    guardNotes: 'Trellix NX network detection events are primarily network metadata with IPs and detected malware URLs. Lower PII than endpoint sources. URLs may contain tokens if capturing HTTP traffic. Standard Guard pattern matching sufficient.',
    recommendedPlacement: 'post-processing',
  },
  'carbon-black': {
    sensitiveDataTypes: [
      { type: 'Command Line', category: 'Secrets', fields: ['process_cmdline', 'parent_cmdline'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Username', category: 'PII', fields: ['process_username', 'device_username'], recommendedAction: 'mask', confidence: 'medium' },
      { type: 'IP Address', category: 'Infrastructure', fields: ['device_internal_ip', 'device_external_ip', 'netconn_remote_ip'], recommendedAction: 'mask', confidence: 'high' },
    ],
    complianceFrameworks: ['PCI-DSS', 'SOC 2'],
    estimatedSensitivePercent: 30,
    guardNotes: 'Carbon Black process events capture full command lines — same secrets risk as CrowdStrike/Sysmon. Device usernames directly identify individuals. Guard AI model valuable for command line secrets detection.',
    recommendedPlacement: 'post-processing',
  },
  'microsoft-defender-endpoint': {
    sensitiveDataTypes: [
      { type: 'Command Line', category: 'Secrets', fields: ['ProcessCommandLine', 'InitiatingProcessCommandLine'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Username', category: 'PII', fields: ['AccountName', 'AccountDomain'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'IP / URL', category: 'Infrastructure', fields: ['RemoteIP', 'LocalIP', 'RemoteUrl'], recommendedAction: 'mask', confidence: 'high' },
    ],
    complianceFrameworks: ['GDPR', 'PCI-DSS', 'SOC 2'],
    estimatedSensitivePercent: 35,
    guardNotes: 'MDE advanced hunting data includes command lines (secrets risk), account names, and network connections. ProcessCommandLine is the highest-value Guard target — frequently contains embedded credentials in enterprise environments.',
    recommendedPlacement: 'post-processing',
  },
  'cisco-secure-email': {
    sensitiveDataTypes: [
      { type: 'Email Addresses', category: 'PII', fields: ['sender', 'recipient', 'envelopeFrom'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Email Subject', category: 'PII', fields: ['subject'], recommendedAction: 'redact', confidence: 'high' },
      { type: 'IP Address', category: 'Infrastructure', fields: ['senderIP', 'hostIP'], recommendedAction: 'mask', confidence: 'high' },
    ],
    complianceFrameworks: ['GDPR', 'CCPA', 'HIPAA'],
    estimatedSensitivePercent: 50,
    guardNotes: 'Email security logs contain sender/recipient addresses (PII) and subject lines that may reference sensitive matters (legal, HR, medical). Redact subjects; mask addresses when forwarding to analytics.',
    recommendedPlacement: 'post-processing',
  },
  'proofpoint-email': {
    sensitiveDataTypes: [
      { type: 'Email Addresses', category: 'PII', fields: ['sender', 'recipient'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Email Subject', category: 'PII', fields: ['subject'], recommendedAction: 'redact', confidence: 'high' },
      { type: 'Sender IP', category: 'Infrastructure', fields: ['senderIP'], recommendedAction: 'mask', confidence: 'high' },
    ],
    complianceFrameworks: ['GDPR', 'CCPA', 'HIPAA'],
    estimatedSensitivePercent: 45,
    guardNotes: 'Proofpoint message logs include sender/recipient PII and subject lines. Threat classification adds IOC context but doesn\'t reduce PII exposure. Guard masking for email addresses; redact subjects that may reference sensitive content.',
    recommendedPlacement: 'post-processing',
  },
  'k8s-audit-logs': {
    sensitiveDataTypes: [
      { type: 'Service Account / User', category: 'PII', fields: ['user.username', 'impersonatedUser.username'], recommendedAction: 'tag', confidence: 'medium' },
      { type: 'Request Body', category: 'Secrets', fields: ['requestObject', 'responseObject'], recommendedAction: 'mask', confidence: 'high' },
    ],
    complianceFrameworks: ['PCI-DSS', 'SOC 2'],
    estimatedSensitivePercent: 25,
    guardNotes: 'K8s audit logs may contain Secret objects in requestObject/responseObject when Secrets are created or updated. Guard AI model critical for detecting base64-encoded secrets in request bodies. Tag service accounts for attribution.',
    recommendedPlacement: 'post-processing',
  },
  'linux-syslog': {
    sensitiveDataTypes: [
      { type: 'Username', category: 'PII', fields: ['user', 'uid'], recommendedAction: 'tag', confidence: 'medium' },
      { type: 'IP Address', category: 'Infrastructure', fields: ['src_ip', 'hostname'], recommendedAction: 'mask', confidence: 'medium' },
      { type: 'Free-text Messages', category: 'Secrets', fields: ['message'], recommendedAction: 'mask', confidence: 'low' },
    ],
    complianceFrameworks: ['SOC 2'],
    estimatedSensitivePercent: 15,
    guardNotes: 'Syslog is highly variable — structured daemon logs are low-PII but application messages may embed credentials, stack traces with PII, or error messages with user data. Guard AI model adds value for unstructured message field scanning.',
    recommendedPlacement: 'post-processing',
  },
  'windows-system': {
    sensitiveDataTypes: [
      { type: 'Computer Name', category: 'Infrastructure', fields: ['Computer', 'MachineName'], recommendedAction: 'tag', confidence: 'low' },
    ],
    complianceFrameworks: [],
    estimatedSensitivePercent: 5,
    guardNotes: 'Windows System log events are primarily service lifecycle and driver events — extremely low PII. Computer names reveal infrastructure naming but contain no personal data. Minimal Guard value.',
    recommendedPlacement: 'post-processing',
  },
  'windows-application': {
    sensitiveDataTypes: [
      { type: 'Username', category: 'PII', fields: ['UserName', 'AccountName'], recommendedAction: 'tag', confidence: 'low' },
      { type: 'Error Messages', category: 'Secrets', fields: ['Message', 'Data'], recommendedAction: 'mask', confidence: 'low' },
    ],
    complianceFrameworks: [],
    estimatedSensitivePercent: 10,
    guardNotes: 'Application event logs contain crash dumps and error messages that occasionally include connection strings, file paths with usernames, or stack traces with PII. Low frequency but Guard AI catches these edge cases.',
    recommendedPlacement: 'post-processing',
  },
  'windows-sysmon': {
    sensitiveDataTypes: [
      { type: 'Command Line', category: 'Secrets', fields: ['CommandLine', 'ParentCommandLine'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Username', category: 'PII', fields: ['User'], recommendedAction: 'tag', confidence: 'medium' },
      { type: 'IP Address', category: 'Infrastructure', fields: ['SourceIp', 'DestinationIp'], recommendedAction: 'mask', confidence: 'high' },
    ],
    complianceFrameworks: ['PCI-DSS', 'SOC 2'],
    estimatedSensitivePercent: 25,
    guardNotes: 'Sysmon command line capture is the primary secrets exposure — same as the sysmon source. Process creation events (Event ID 1) with full command lines frequently contain embedded API keys, passwords, and connection strings.',
    recommendedPlacement: 'post-processing',
  },
  'windows-wef': {
    sensitiveDataTypes: [
      { type: 'Username / SID', category: 'PII', fields: ['TargetUserName', 'SubjectUserName', 'TargetUserSid'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'IP Address', category: 'Infrastructure', fields: ['IpAddress', 'ClientAddress'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Command Line', category: 'Secrets', fields: ['CommandLine', 'ProcessName'], recommendedAction: 'mask', confidence: 'high' },
    ],
    complianceFrameworks: ['GDPR', 'PCI-DSS', 'SOC 2'],
    estimatedSensitivePercent: 30,
    guardNotes: 'Windows Event Forwarding aggregates Security + Sysmon events — combines identity PII with command line secrets risk. Same sensitivity as individual Windows sources but concentrated in a single stream.',
    recommendedPlacement: 'post-processing',
  },
  'f5-bigip-ltm': {
    sensitiveDataTypes: [
      { type: 'Client IP', category: 'PII', fields: ['client_ip', 'source'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'URL / Request', category: 'PII', fields: ['http_uri', 'http_host'], recommendedAction: 'mask', confidence: 'medium' },
      { type: 'Virtual Server', category: 'Infrastructure', fields: ['virtual_name', 'pool_member'], recommendedAction: 'tag', confidence: 'low' },
    ],
    complianceFrameworks: ['PCI-DSS'],
    estimatedSensitivePercent: 20,
    guardNotes: 'F5 BIG-IP LTM traffic logs contain client IPs and HTTP request details. iRule logging may capture headers with auth tokens. Standard Guard pattern matching handles the structured fields; AI model adds value for custom iRule captures.',
    recommendedPlacement: 'post-processing',
  },
  'fortinet-fortigate': {
    sensitiveDataTypes: [
      { type: 'IP Address', category: 'Infrastructure', fields: ['srcip', 'dstip', 'transip'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Username', category: 'PII', fields: ['user', 'srcname'], recommendedAction: 'mask', confidence: 'medium' },
      { type: 'URL', category: 'PII', fields: ['url', 'hostname'], recommendedAction: 'mask', confidence: 'medium' },
    ],
    complianceFrameworks: ['PCI-DSS', 'SOC 2'],
    estimatedSensitivePercent: 20,
    guardNotes: 'FortiGate traffic and UTM logs contain IPs and authenticated usernames. Web filter logs add URL visibility. Standard Guard pattern matching covers the structured KV format well.',
    recommendedPlacement: 'post-processing',
  },
  'zeek-logs': {
    sensitiveDataTypes: [
      { type: 'IP Address', category: 'Infrastructure', fields: ['id.orig_h', 'id.resp_h'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'HTTP URLs / Headers', category: 'PII', fields: ['uri', 'host', 'user_agent'], recommendedAction: 'tag', confidence: 'medium' },
    ],
    complianceFrameworks: ['PCI-DSS'],
    estimatedSensitivePercent: 15,
    guardNotes: 'Zeek network metadata logs are primarily IPs and connection tuples. HTTP/DNS/SSL logs add application context — URIs may contain tokens but Zeek does not capture payload by default. Standard pattern matching sufficient.',
    recommendedPlacement: 'post-processing',
  },
  'suricata-ids': {
    sensitiveDataTypes: [
      { type: 'IP Address', category: 'Infrastructure', fields: ['src_ip', 'dest_ip'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'HTTP URL', category: 'PII', fields: ['http_url', 'http_hostname'], recommendedAction: 'mask', confidence: 'medium' },
    ],
    complianceFrameworks: ['PCI-DSS'],
    estimatedSensitivePercent: 15,
    guardNotes: 'Suricata IDS alerts are network metadata with IPs and protocol details. HTTP events may capture URLs with tokens. Alert payloads in pcap mode could contain full packet content — rare in log-mode deployments.',
    recommendedPlacement: 'post-processing',
  },
  'zscaler-zpa': {
    sensitiveDataTypes: [
      { type: 'User Identity', category: 'PII', fields: ['User', 'ClientPublicIP', 'ClientPrivateIP'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Server Target', category: 'Infrastructure', fields: ['ServerIP', 'ApplicationName'], recommendedAction: 'mask', confidence: 'medium' },
    ],
    complianceFrameworks: ['GDPR', 'CCPA', 'SOC 2'],
    estimatedSensitivePercent: 40,
    guardNotes: 'ZPA private access logs directly correlate users to internal applications and infrastructure IPs — reveals internal network topology tied to user identity. Guard masking critical before non-security forwarding.',
    recommendedPlacement: 'post-processing',
  },
  'citrix-netscaler': {
    sensitiveDataTypes: [
      { type: 'Client IP', category: 'PII', fields: ['clientIP', 'sourceIP'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Username', category: 'PII', fields: ['user', 'userName'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'URL / Request', category: 'PII', fields: ['httpReqUrl'], recommendedAction: 'mask', confidence: 'medium' },
    ],
    complianceFrameworks: ['PCI-DSS', 'SOC 2'],
    estimatedSensitivePercent: 30,
    guardNotes: 'NetScaler ADC logs capture authenticated user sessions with client IPs and full request URLs. Gateway mode logs contain VPN session data tying users to internal resources. Guard masking for user/IP when forwarding to analytics.',
    recommendedPlacement: 'post-processing',
  },
  'aws-cloudwatch': {
    sensitiveDataTypes: [
      { type: 'Log Content', category: 'Secrets', fields: ['message'], recommendedAction: 'mask', confidence: 'medium' },
      { type: 'Account ID', category: 'Infrastructure', fields: ['owner', 'logGroup'], recommendedAction: 'tag', confidence: 'low' },
    ],
    complianceFrameworks: ['SOC 2'],
    estimatedSensitivePercent: 20,
    guardNotes: 'CloudWatch Logs contain arbitrary application output — sensitivity depends entirely on what applications log. Message field may contain credentials, PII, or stack traces. Guard AI model valuable for scanning unstructured message content.',
    recommendedPlacement: 'post-processing',
  },
  'azure-activity': {
    sensitiveDataTypes: [
      { type: 'Caller Identity', category: 'PII', fields: ['caller', 'claims.name'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'IP Address', category: 'PII', fields: ['callerIpAddress', 'httpRequest.clientIpAddress'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Resource Identifiers', category: 'Infrastructure', fields: ['resourceId', 'subscriptionId'], recommendedAction: 'tag', confidence: 'low' },
    ],
    complianceFrameworks: ['GDPR', 'SOC 2'],
    estimatedSensitivePercent: 25,
    guardNotes: 'Azure Activity Log caller field is a UPN (email) or service principal. Combined with IP geolocation reveals user activity patterns. Guard masking for caller identities when forwarding to non-security analytics.',
    recommendedPlacement: 'post-processing',
  },
  'gcp-audit-logs': {
    sensitiveDataTypes: [
      { type: 'Caller Identity', category: 'PII', fields: ['protoPayload.authenticationInfo.principalEmail'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'IP Address', category: 'PII', fields: ['protoPayload.requestMetadata.callerIp'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Request Parameters', category: 'Secrets', fields: ['protoPayload.request', 'protoPayload.response'], recommendedAction: 'mask', confidence: 'medium' },
    ],
    complianceFrameworks: ['GDPR', 'SOC 2'],
    estimatedSensitivePercent: 25,
    guardNotes: 'GCP audit logs tie actions to Google identity emails. Request/response bodies for API calls may contain secrets (e.g., creating a service account key). Guard pattern matching for emails; AI model for request body secrets.',
    recommendedPlacement: 'post-processing',
  },
  'cisco-meraki': {
    sensitiveDataTypes: [
      { type: 'IP / MAC Address', category: 'PII', fields: ['src', 'dst', 'mac', 'clientMac'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'URL', category: 'PII', fields: ['url'], recommendedAction: 'mask', confidence: 'medium' },
    ],
    complianceFrameworks: ['GDPR', 'PCI-DSS'],
    estimatedSensitivePercent: 20,
    guardNotes: 'Meraki syslog includes client MACs (device fingerprinting) and URLs (browsing activity). In retail/healthcare, MAC tracking creates PII exposure. Guard masking for MACs and IPs when forwarding to non-security platforms.',
    recommendedPlacement: 'post-processing',
  },
  'qualys-tenable': {
    sensitiveDataTypes: [
      { type: 'Host IP / FQDN', category: 'Infrastructure', fields: ['host_ip', 'host_fqdn'], recommendedAction: 'mask', confidence: 'medium' },
      { type: 'Vulnerability Details', category: 'Infrastructure', fields: ['output', 'proof'], recommendedAction: 'tag', confidence: 'low' },
    ],
    complianceFrameworks: ['PCI-DSS', 'SOC 2'],
    estimatedSensitivePercent: 10,
    guardNotes: 'Vulnerability scan results are infrastructure metadata — host IPs and CVEs. Low PII but scan output fields may contain credentials found in configuration files. Tag vulnerability proof-of-concept data.',
    recommendedPlacement: 'post-processing',
  },
  'servicenow': {
    sensitiveDataTypes: [
      { type: 'User Identity', category: 'PII', fields: ['caller_id', 'assigned_to', 'opened_by'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Ticket Content', category: 'PII', fields: ['description', 'short_description', 'comments'], recommendedAction: 'mask', confidence: 'medium' },
    ],
    complianceFrameworks: ['GDPR', 'HIPAA', 'SOC 2'],
    estimatedSensitivePercent: 35,
    guardNotes: 'ServiceNow tickets contain user names and free-text descriptions that frequently include passwords, access instructions, and PII from users seeking help. Guard AI model valuable for scanning description/comment fields.',
    recommendedPlacement: 'post-processing',
  },
  'vmware-vsphere': {
    sensitiveDataTypes: [
      { type: 'Username', category: 'PII', fields: ['userName', 'logonUserName'], recommendedAction: 'mask', confidence: 'medium' },
      { type: 'IP Address', category: 'Infrastructure', fields: ['ipAddress', 'host_ip'], recommendedAction: 'mask', confidence: 'medium' },
    ],
    complianceFrameworks: ['SOC 2'],
    estimatedSensitivePercent: 10,
    guardNotes: 'vSphere events are primarily infrastructure lifecycle — VM power, vMotion, storage. Usernames appear in who-performed-what context. Low PII overall but mask admin usernames for non-infrastructure teams.',
    recommendedPlacement: 'post-processing',
  },
  'hashicorp-vault': {
    sensitiveDataTypes: [
      { type: 'Token / Auth Data', category: 'Secrets', fields: ['auth.client_token', 'auth.accessor'], recommendedAction: 'redact', confidence: 'high' },
      { type: 'Secret Paths', category: 'Secrets', fields: ['request.path', 'request.data'], recommendedAction: 'tag', confidence: 'high' },
      { type: 'Client Identity', category: 'PII', fields: ['auth.display_name', 'request.remote_address'], recommendedAction: 'mask', confidence: 'high' },
    ],
    complianceFrameworks: ['PCI-DSS', 'SOX', 'SOC 2'],
    estimatedSensitivePercent: 60,
    guardNotes: 'Vault audit logs reference secret paths and token values (HMAC in default mode but raw in some configs). Highest secrets-density source in most environments. Guard should redact any token values and tag secret paths.',
    recommendedPlacement: 'pre-processing',
  },
  'github-audit': {
    sensitiveDataTypes: [
      { type: 'User Identity', category: 'PII', fields: ['actor', 'user', 'actor_ip'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Repository Context', category: 'Infrastructure', fields: ['repo', 'org'], recommendedAction: 'tag', confidence: 'low' },
    ],
    complianceFrameworks: ['SOC 2'],
    estimatedSensitivePercent: 20,
    guardNotes: 'GitHub audit logs identify users by handle and IP. Repo names may reveal project codenames. Low sensitivity overall but mask actor IPs for privacy when forwarding to analytics platforms.',
    recommendedPlacement: 'post-processing',
  },
  'atlassian-audit': {
    sensitiveDataTypes: [
      { type: 'User Identity', category: 'PII', fields: ['actor_name', 'actor_email'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'IP Address', category: 'PII', fields: ['context_ip'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Content References', category: 'PII', fields: ['target_name', 'change_description'], recommendedAction: 'tag', confidence: 'medium' },
    ],
    complianceFrameworks: ['GDPR', 'SOC 2'],
    estimatedSensitivePercent: 30,
    guardNotes: 'Atlassian audit logs contain user emails, IPs, and references to page/space names that may be sensitive. Change descriptions occasionally include content snippets. Guard masking for email/IP; tag content references.',
    recommendedPlacement: 'post-processing',
  },
  'paloalto-cortex-xdr': {
    sensitiveDataTypes: [
      { type: 'Command Line', category: 'Secrets', fields: ['action_process_command_line', 'causality_actor_cmdline'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'Username', category: 'PII', fields: ['user_name', 'actor_effective_username'], recommendedAction: 'mask', confidence: 'high' },
      { type: 'IP Address', category: 'Infrastructure', fields: ['host_ip', 'action_remote_ip'], recommendedAction: 'mask', confidence: 'high' },
    ],
    complianceFrameworks: ['PCI-DSS', 'SOC 2'],
    estimatedSensitivePercent: 35,
    guardNotes: 'Cortex XDR alerts include process command lines (secrets risk), user names, and network IOCs. Same command-line sensitivity as other EDR platforms. Guard AI model excels at detecting credentials in process arguments.',
    recommendedPlacement: 'post-processing',
  },
};

let content = fs.readFileSync('src/data/guardPolicies.ts', 'utf8');
const insertPoint = content.lastIndexOf('};');

let newContent = '';
for (const [sourceId, policy] of Object.entries(newPolicies)) {
  newContent += `\n  '${sourceId}': {\n`;
  newContent += `    sensitiveDataTypes: [\n`;
  for (const dt of policy.sensitiveDataTypes) {
    const type = dt.type.replace(/'/g, "\\'");
    const fields = dt.fields.map(f => `'${f}'`).join(', ');
    newContent += `      { type: '${type}', category: '${dt.category}', fields: [${fields}], recommendedAction: '${dt.recommendedAction}', confidence: '${dt.confidence}' },\n`;
  }
  newContent += `    ],\n`;
  newContent += `    complianceFrameworks: [${policy.complianceFrameworks.map(f => `'${f}'`).join(', ')}],\n`;
  newContent += `    estimatedSensitivePercent: ${policy.estimatedSensitivePercent},\n`;
  const notes = policy.guardNotes.replace(/'/g, "\\'");
  newContent += `    guardNotes: '${notes}',\n`;
  newContent += `    recommendedPlacement: '${policy.recommendedPlacement}',\n`;
  newContent += `  },\n`;
}

content = content.slice(0, insertPoint) + newContent + '};\n';
fs.writeFileSync('src/data/guardPolicies.ts', content);
console.log('Added', Object.keys(newPolicies).length, 'Guard policies');
