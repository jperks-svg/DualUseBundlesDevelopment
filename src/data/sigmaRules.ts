// @ts-nocheck
export interface SigmaMapping {
  sigmaRule: string;
  sigmaReferences: string[];
  sigmaStatus: 'exact' | 'adapted' | 'inspired';
  sigmaTitle?: string;
}

export const sigmaRules: Record<string, SigmaMapping> = {

  'sec-ad-001': {
    sigmaTitle: 'DCSync Activity',
    sigmaStatus: 'exact',
    sigmaReferences: ['a64a14e7-3956-4b0e-8f20-255d8d7e7439'],
    sigmaRule: `title: DCSync Attack - Replication Rights Requested by Non-DC Account
id: a64a14e7-3956-4b0e-8f20-255d8d7e7439
status: stable
level: critical
description: Detects credential theft via directory replication (DCSync) by identifying non-domain controller accounts requesting DS-Replication-Get-Changes-All rights.
author: SigmaHQ (adapted for Cribl)
date: 2024/01/15
modified: 2026/06/16
references:
    - https://attack.mitre.org/techniques/T1003/006/
    - https://adsecurity.org/?p=1729
tags:
    - attack.credential_access
    - attack.t1003.006
logsource:
    product: windows
    service: security
    definition: Requires audit policy for DS Access - Audit Directory Service Access
detection:
    selection:
        EventID: 4662
        Properties|contains:
            - '1131f6aa-9c07-11d1-f79f-00c04fc2dcd2'
            - '1131f6ad-9c07-11d1-f79f-00c04fc2dcd2'
            - '89e95b76-444d-4c62-991a-0facbeda640c'
    filter_dc_accounts:
        SubjectUserName|endswith: '$'
        SubjectUserName|contains:
            - 'DC'
            - 'AZUREADSSOACC'
    condition: selection and not filter_dc_accounts
falsepositives:
    - Azure AD Connect sync accounts
    - Legitimate third-party directory sync tools
    - Newly promoted domain controllers not yet in exclusion list`,
  },

  'sec-winsec-001': {
    sigmaTitle: 'Pass-the-Hash Activity',
    sigmaStatus: 'adapted',
    sigmaReferences: ['f8d98d6c-7a07-4d74-b064-dd4a3c244528'],
    sigmaRule: `title: Pass-the-Hash Detection via NTLM Logon from Non-Standard Source
id: f8d98d6c-7a07-4d74-b064-dd4a3c244528
status: stable
level: high
description: Detects NTLM authentication logon events (Type 9 - NewCredentials or Type 3 - Network) with explicit credentials indicating potential Pass-the-Hash lateral movement.
author: SigmaHQ (adapted for Cribl)
date: 2023/08/20
modified: 2026/06/16
references:
    - https://attack.mitre.org/techniques/T1550/002/
    - https://blog.stealthbits.com/how-to-detect-pass-the-hash-attacks/
tags:
    - attack.lateral_movement
    - attack.t1550.002
logsource:
    product: windows
    service: security
detection:
    selection:
        EventID: 4624
        LogonType:
            - 3
            - 9
        AuthenticationPackageName: 'NTLM'
        LogonProcessName: 'seclogo'
    filter_system:
        SubjectUserSid: 'S-1-5-18'
    filter_anonymous:
        TargetUserName: 'ANONYMOUS LOGON'
    condition: selection and not filter_system and not filter_anonymous
falsepositives:
    - Legacy applications using NTLM
    - Service accounts with hardcoded NTLM authentication
    - Cross-forest trust authentication`,
  },

  'sec-sysmon-001': {
    sigmaTitle: 'LSASS Memory Access',
    sigmaStatus: 'exact',
    sigmaReferences: ['32d0d3e2-e58d-4d41-926b-18b520b2b32d'],
    sigmaRule: `title: LSASS Process Memory Access - Credential Dumping
id: 32d0d3e2-e58d-4d41-926b-18b520b2b32d
status: stable
level: critical
description: Detects process access events targeting lsass.exe memory, indicating credential dumping tools like Mimikatz, ProcDump, or custom tools reading credential material.
author: SigmaHQ (adapted for Cribl)
date: 2023/05/10
modified: 2026/06/16
references:
    - https://attack.mitre.org/techniques/T1003/001/
    - https://docs.microsoft.com/en-us/sysinternals/downloads/sysmon
tags:
    - attack.credential_access
    - attack.t1003.001
logsource:
    product: windows
    category: process_access
    definition: Sysmon Event ID 10 with appropriate configuration
detection:
    selection:
        EventID: 10
        TargetImage|endswith: '\\lsass.exe'
        GrantedAccess|contains:
            - '0x1010'
            - '0x1410'
            - '0x1438'
            - '0x143a'
            - '0x1fffff'
    filter_legitimate:
        SourceImage|endswith:
            - '\\MsMpEng.exe'
            - '\\csrss.exe'
            - '\\wininit.exe'
            - '\\vmtoolsd.exe'
            - '\\lsass.exe'
            - '\\svchost.exe'
            - '\\CrowdStrike\\CSFalconService.exe'
    condition: selection and not filter_legitimate
falsepositives:
    - Anti-virus scanning lsass memory
    - EDR agents performing protection
    - Windows Error Reporting (WerFault.exe)`,
  },

  'sec-linux-aud-001': {
    sigmaTitle: 'Privilege Escalation via Setuid',
    sigmaStatus: 'adapted',
    sigmaReferences: ['d10fc345-27f0-4761-a8c2-8c601183d2f3'],
    sigmaRule: `title: Linux Privilege Escalation via SUID/EUID Change to Root
id: d10fc345-27f0-4761-a8c2-8c601183d2f3
status: stable
level: high
description: Detects auditd events where a process transitions effective UID to 0 (root) from a non-root real UID, indicating potential privilege escalation via SUID binaries, sudo exploitation, or kernel exploits.
author: Cribl (custom)
date: 2026/06/16
references:
    - https://attack.mitre.org/techniques/T1548/001/
    - https://man7.org/linux/man-pages/man2/setuid.2.html
tags:
    - attack.privilege_escalation
    - attack.t1548.001
    - attack.defense_evasion
logsource:
    product: linux
    service: auditd
detection:
    selection:
        type: 'SYSCALL'
        syscall:
            - 'setuid'
            - 'setreuid'
            - 'setresuid'
            - 'execve'
        euid: 0
    filter_expected:
        uid: 0
    filter_known_paths:
        exe|startswith:
            - '/usr/bin/sudo'
            - '/usr/bin/su'
            - '/usr/bin/passwd'
            - '/usr/bin/crontab'
            - '/usr/lib/polkit'
    condition: selection and not filter_expected and not filter_known_paths
falsepositives:
    - Legitimate SUID binaries performing authorized privilege elevation
    - Package managers running installation scripts
    - Custom deployment automation using setuid helpers`,
  },

  'sec-linux-auth-001': {
    sigmaTitle: 'SSH Brute Force Attack',
    sigmaStatus: 'adapted',
    sigmaReferences: ['e093f134-b56c-4cfc-a2f7-3e3c0be5f3da'],
    sigmaRule: `title: SSH Brute Force - Multiple Failed Authentication Attempts
id: e093f134-b56c-4cfc-a2f7-3e3c0be5f3da
status: stable
level: medium
description: Detects multiple failed SSH authentication attempts from a single source IP within a short time window, indicating brute force or credential stuffing attack against SSH services.
author: Cribl (custom)
date: 2026/06/16
references:
    - https://attack.mitre.org/techniques/T1110/001/
    - https://attack.mitre.org/techniques/T1110/004/
tags:
    - attack.credential_access
    - attack.t1110.001
    - attack.t1110.004
logsource:
    product: linux
    service: auth
detection:
    selection:
        program: 'sshd'
        message|contains:
            - 'Failed password'
            - 'authentication failure'
            - 'Invalid user'
    condition: selection | count(source_ip) by source_ip > 10
    timeframe: 5m
falsepositives:
    - Misconfigured automation with wrong credentials
    - Users with expired/changed passwords attempting multiple logins
    - Vulnerability scanners testing SSH access`,
  },

  'cs-sec-001': {
    sigmaTitle: 'Living-off-the-Land Binary Execution',
    sigmaStatus: 'adapted',
    sigmaReferences: ['fa4b21c9-9f35-4d74-8831-6c6f10bdeff7'],
    sigmaRule: `title: LOLBin Execution with Suspicious Command Line Arguments
id: fa4b21c9-9f35-4d74-8831-6c6f10bdeff7
status: stable
level: high
description: Detects execution of Living-off-the-Land Binaries (LOLBins) with command line arguments commonly associated with malware delivery, lateral movement, or defense evasion.
author: Cribl (adapted from SigmaHQ LOLBin rules)
date: 2026/06/16
references:
    - https://attack.mitre.org/techniques/T1059/001/
    - https://lolbas-project.github.io/
    - https://attack.mitre.org/techniques/T1218/
tags:
    - attack.execution
    - attack.t1059.001
    - attack.defense_evasion
    - attack.t1218
logsource:
    product: windows
    category: process_creation
detection:
    selection_powershell:
        Image|endswith: '\\powershell.exe'
        CommandLine|contains:
            - '-enc'
            - '-EncodedCommand'
            - 'bypass'
            - 'hidden'
            - 'IEX'
            - 'Invoke-Expression'
            - 'downloadstring'
            - 'Net.WebClient'
    selection_certutil:
        Image|endswith: '\\certutil.exe'
        CommandLine|contains:
            - '-urlcache'
            - '-decode'
            - '-encode'
            - '/urlcache'
    selection_mshta:
        Image|endswith: '\\mshta.exe'
        CommandLine|contains:
            - 'http'
            - 'javascript'
            - 'vbscript'
    selection_regsvr32:
        Image|endswith: '\\regsvr32.exe'
        CommandLine|contains:
            - '/s'
            - '/i:http'
            - 'scrobj.dll'
    selection_rundll32:
        Image|endswith: '\\rundll32.exe'
        CommandLine|contains:
            - 'javascript'
            - 'http'
            - 'shell32.dll,ShellExec_RunDLL'
    condition: selection_powershell or selection_certutil or selection_mshta or selection_regsvr32 or selection_rundll32
falsepositives:
    - Legitimate system administration scripts using encoded commands
    - Software deployment tools using certutil for certificate operations
    - Internal web applications launching via mshta`,
  },

  'okta-sec-001': {
    sigmaTitle: 'Impossible Travel Detection',
    sigmaStatus: 'inspired',
    sigmaReferences: ['2954f6cf-25a4-4d95-8552-293dd5f5e5f9'],
    sigmaRule: `title: Okta Impossible Travel - Authentication from Geographically Distant Locations
id: 2954f6cf-25a4-4d95-8552-293dd5f5e5f9
status: stable
level: high
description: Detects successful Okta authentications from two geographically distant locations within a time window that makes physical travel impossible, indicating credential compromise or session hijacking.
author: Cribl (custom)
date: 2026/06/16
references:
    - https://attack.mitre.org/techniques/T1078/004/
    - https://developer.okta.com/docs/reference/api/system-log/
tags:
    - attack.initial_access
    - attack.t1078.004
    - attack.credential_access
logsource:
    product: okta
    service: okta
detection:
    selection:
        eventType: 'user.session.start'
        outcome.result: 'SUCCESS'
    condition: selection | near(client.geographicalContext.country) by actor.alternateId
    timeframe: 2h
    near_field: client.geographicalContext.country
    near_distance: different_value
falsepositives:
    - VPN usage changing apparent geographic location
    - Users with multiple devices in different locations (phone vs laptop)
    - Cloud application proxies (Zscaler, Netskope) changing source IP location`,
  },

  'sec-winsec-002': {
    sigmaTitle: 'Kerberoasting Activity',
    sigmaStatus: 'exact',
    sigmaReferences: ['3e2e7ae6-0209-4627-8754-76960e3e0b5e'],
    sigmaRule: `title: Kerberoasting - Service Ticket Request for Service Account
id: 3e2e7ae6-0209-4627-8754-76960e3e0b5e
status: stable
level: high
description: Detects Kerberos TGS ticket requests (Event 4769) with RC4 encryption for service accounts, which may indicate Kerberoasting attempts to extract crackable service account password hashes.
author: SigmaHQ (adapted for Cribl)
date: 2023/09/15
modified: 2026/06/16
references:
    - https://attack.mitre.org/techniques/T1558/003/
    - https://www.harmj0y.net/blog/powershell/kerberoasting-without-mimikatz/
tags:
    - attack.credential_access
    - attack.t1558.003
logsource:
    product: windows
    service: security
detection:
    selection:
        EventID: 4769
        TicketEncryptionType: '0x17'
        ServiceName|endswith: '$'
    filter_machine_accounts:
        ServiceName|endswith: '$'
        TargetUserName|endswith: '$'
    filter_krbtgt:
        ServiceName: 'krbtgt'
    condition: selection and not filter_machine_accounts and not filter_krbtgt
falsepositives:
    - Legacy applications requiring RC4 encryption
    - Environments with mixed Kerberos encryption support
    - Legitimate service ticket requests during password rotation`,
  },

  'sec-ad-002': {
    sigmaTitle: 'Golden Ticket Usage',
    sigmaStatus: 'adapted',
    sigmaReferences: ['77e6c81c-7500-4a33-b77b-0e5f3b0e0e3a'],
    sigmaRule: `title: Potential Golden Ticket Attack - TGT with Anomalous Lifetime
id: 77e6c81c-7500-4a33-b77b-0e5f3b0e0e3a
status: stable
level: critical
description: Detects potential Golden Ticket usage by identifying Kerberos TGT authentication events (4768) with anomalous ticket properties or TGS requests (4769) without a preceding TGT request.
author: Cribl (adapted from SigmaHQ)
date: 2026/06/16
references:
    - https://attack.mitre.org/techniques/T1558/001/
    - https://adsecurity.org/?p=1640
tags:
    - attack.credential_access
    - attack.t1558.001
    - attack.persistence
logsource:
    product: windows
    service: security
detection:
    selection_no_tgt:
        EventID: 4769
    filter_expected:
        EventID: 4768
    selection_anomalous_tgt:
        EventID: 4768
        TicketOptions: '0x40810010'
    condition: selection_anomalous_tgt or (selection_no_tgt and not filter_expected)
falsepositives:
    - Domain controller time synchronization issues
    - Ticket renewal edge cases
    - Environments with custom Kerberos ticket lifetime policies`,
  },

  'sec-sysmon-002': {
    sigmaTitle: 'Suspicious Named Pipe Connection',
    sigmaStatus: 'exact',
    sigmaReferences: ['fe3ac066-98bb-432a-b1e7-a5229cb39d4a'],
    sigmaRule: `title: Suspicious Named Pipe Created - Potential C2 or Lateral Movement
id: fe3ac066-98bb-432a-b1e7-a5229cb39d4a
status: stable
level: high
description: Detects creation of named pipes commonly associated with offensive tools (Cobalt Strike, Metasploit, PsExec) and post-exploitation frameworks used for inter-process communication during lateral movement.
author: SigmaHQ (adapted for Cribl)
date: 2023/07/01
modified: 2026/06/16
references:
    - https://attack.mitre.org/techniques/T1570/
    - https://labs.withsecure.com/publications/detecting-cobalt-strike-default-modules-via-named-pipe-analysis
tags:
    - attack.lateral_movement
    - attack.t1570
    - attack.defense_evasion
logsource:
    product: windows
    category: pipe_created
    definition: Sysmon Event ID 17 (Pipe Created)
detection:
    selection:
        EventID: 17
        PipeName|startswith:
            - '\\MSSE-'
            - '\\postex_'
            - '\\status_'
            - '\\msagent_'
            - '\\DserNamePipe'
            - '\\srvsvc_'
            - '\\wkssvc'
            - '\\spoolss_'
    selection_psexec:
        EventID: 17
        PipeName|re: '\\\\[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}'
    condition: selection or selection_psexec
falsepositives:
    - PsExec used legitimately by system administrators
    - Custom internal tools using similarly-named pipes
    - Security testing tools during authorized assessments`,
  },

  'sec-linux-aud-002': {
    sigmaTitle: 'Linux Persistence via Cron Modification',
    sigmaStatus: 'inspired',
    sigmaReferences: ['af202fd3-7bff-4212-a25a-fb34a1298d2e'],
    sigmaRule: `title: Linux Persistence - Crontab or Cron Directory Modification
id: af202fd3-7bff-4212-a25a-fb34a1298d2e
status: stable
level: medium
description: Detects modifications to crontab files or cron directories via auditd file watch rules, indicating potential persistence establishment by an attacker.
author: Cribl (custom)
date: 2026/06/16
references:
    - https://attack.mitre.org/techniques/T1053/003/
    - https://man7.org/linux/man-pages/man5/crontab.5.html
tags:
    - attack.persistence
    - attack.t1053.003
    - attack.execution
logsource:
    product: linux
    service: auditd
detection:
    selection_crontab:
        type: 'SYSCALL'
        syscall:
            - 'openat'
            - 'open'
            - 'rename'
            - 'unlink'
        key: 'cron_modification'
    selection_path:
        type: 'PATH'
        name|contains:
            - '/etc/crontab'
            - '/etc/cron.d/'
            - '/var/spool/cron/'
            - '/etc/cron.daily/'
            - '/etc/cron.hourly/'
    condition: selection_crontab or selection_path
falsepositives:
    - Legitimate cron job updates by administrators
    - Package installation adding scheduled tasks
    - Configuration management tools (Ansible, Puppet) managing cron`,
  },

  'cs-sec-002': {
    sigmaTitle: 'Credential Dumping via Comsvcs.dll',
    sigmaStatus: 'exact',
    sigmaReferences: ['09e07b90-8a10-4e9c-a04e-c4742e488688'],
    sigmaRule: `title: LSASS Memory Dump via Comsvcs.dll MiniDump
id: 09e07b90-8a10-4e9c-a04e-c4742e488688
status: stable
level: critical
description: Detects the use of comsvcs.dll MiniDump export to dump LSASS process memory for credential extraction, a technique commonly used when Mimikatz is blocked by EDR.
author: SigmaHQ (adapted for Cribl)
date: 2023/04/15
modified: 2026/06/16
references:
    - https://attack.mitre.org/techniques/T1003/001/
    - https://lolbas-project.github.io/lolbas/Libraries/Comsvcs/
tags:
    - attack.credential_access
    - attack.t1003.001
logsource:
    product: windows
    category: process_creation
detection:
    selection:
        CommandLine|contains|all:
            - 'comsvcs'
            - 'MiniDump'
        CommandLine|contains:
            - 'full'
            - '#24'
            - '24 '
    selection_alt:
        Image|endswith: '\\rundll32.exe'
        CommandLine|contains:
            - 'comsvcs.dll'
            - 'MiniDump'
    condition: selection or selection_alt
falsepositives:
    - Very unlikely in production environments
    - Security testing with explicit authorization`,
  },

  'okta-sec-002': {
    sigmaTitle: 'Okta MFA Factor Reset by Admin',
    sigmaStatus: 'inspired',
    sigmaReferences: ['b1e6b9c3-8d4a-4c5f-9e2a-1f3d5a7b9c0e'],
    sigmaRule: `title: Okta MFA Factor Reset - Potential Account Takeover Preparation
id: b1e6b9c3-8d4a-4c5f-9e2a-1f3d5a7b9c0e
status: stable
level: high
description: Detects administrator-initiated MFA factor resets in Okta, which may indicate social engineering of helpdesk staff to facilitate account takeover by removing the victim MFA protection.
author: Cribl (custom)
date: 2026/06/16
references:
    - https://attack.mitre.org/techniques/T1556/006/
    - https://sec.okta.com/articles/2023/08/cross-tenant-impersonation-prevention
tags:
    - attack.persistence
    - attack.t1556.006
    - attack.credential_access
logsource:
    product: okta
    service: okta
detection:
    selection:
        eventType:
            - 'user.mfa.factor.deactivate'
            - 'user.mfa.factor.reset_all'
            - 'system.mfa.factor.deactivate'
    filter_self_service:
        actor.id: target.id
    condition: selection and not filter_self_service
falsepositives:
    - Legitimate helpdesk operations for users with lost/damaged MFA devices
    - Planned MFA migrations (e.g., switching from SMS to FIDO2)
    - Employee device refresh programs`,
  },

  'sec-linux-auth-002': {
    sigmaTitle: 'Successful Root Login via SSH',
    sigmaStatus: 'adapted',
    sigmaReferences: ['4b904f6c-86c9-40f0-b6fa-ae94f7a3b824'],
    sigmaRule: `title: Direct Root Login via SSH - Policy Violation
id: 4b904f6c-86c9-40f0-b6fa-ae94f7a3b824
status: stable
level: high
description: Detects successful direct root login via SSH, which violates security best practices requiring individual accountability through named accounts with sudo elevation.
author: Cribl (custom)
date: 2026/06/16
references:
    - https://attack.mitre.org/techniques/T1078/003/
    - https://www.cisecurity.org/benchmark/distribution_independent_linux
tags:
    - attack.initial_access
    - attack.t1078.003
    - attack.persistence
logsource:
    product: linux
    service: auth
detection:
    selection:
        program: 'sshd'
        message|contains: 'Accepted'
        message|contains: 'root'
    filter_key_auth:
        message|contains: 'publickey'
    condition: selection
falsepositives:
    - Emergency break-glass access procedures
    - Automation systems using SSH keys for root (should use service accounts)
    - Initial server provisioning before user accounts are created`,
  },

};
