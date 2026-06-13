export const linuxLogs: Record<string, string> = {

'linux-auditd': `type=SYSCALL msg=audit(1718107928.000:1001): arch=c000003e syscall=59 success=yes exit=0 a0=55f3a8c01000 a1=55f3a8c02000 a2=55f3a8c03000 a3=0 items=2 ppid=1234 pid=4521 auid=1000 uid=0 gid=0 euid=0 suid=0 fsuid=0 egid=0 sgid=0 fsgid=0 tty=pts0 ses=1 comm="sudo" exe="/usr/bin/sudo" key="privilege_escalation"
type=EXECVE msg=audit(1718107928.000:1001): argc=3 a0="sudo" a1="cat" a2="/etc/shadow"
type=SYSCALL msg=audit(1718107930.000:1002): arch=c000003e syscall=59 success=yes exit=0 a0=55f3a8c01000 a1=55f3a8c02000 a2=55f3a8c03000 a3=0 items=2 ppid=4521 pid=4522 auid=1000 uid=0 gid=0 euid=0 suid=0 fsuid=0 egid=0 sgid=0 fsgid=0 tty=pts0 ses=1 comm="useradd" exe="/usr/sbin/useradd" key="account_modification"
type=EXECVE msg=audit(1718107930.000:1002): argc=4 a0="useradd" a1="-m" a2="-s" a3="/bin/bash" a4="backdoor_user"
type=SYSCALL msg=audit(1718107935.000:1003): arch=c000003e syscall=42 success=yes exit=0 a0=3 a1=7ffee1234560 a2=16 a3=0 items=0 ppid=1100 pid=8877 auid=1000 uid=1000 gid=1000 euid=1000 suid=1000 fsuid=1000 egid=1000 sgid=1000 fsgid=1000 tty=(none) ses=1 comm="nc" exe="/usr/bin/nc" key="network_connections"
type=SOCKADDR msg=audit(1718107935.000:1003): saddr=02000E6E5BEA630A00000000000000000000
type=SYSCALL msg=audit(1718107940.000:1004): arch=c000003e syscall=59 success=yes exit=0 a0=55f3a8c01000 a1=55f3a8c02000 a2=55f3a8c03000 a3=0 items=2 ppid=1 pid=9900 auid=4294967295 uid=0 gid=0 euid=0 suid=0 fsuid=0 egid=0 sgid=0 fsgid=0 tty=(none) ses=4294967295 comm="crontab" exe="/usr/bin/crontab" key="scheduled_tasks"
type=EXECVE msg=audit(1718107940.000:1004): argc=3 a0="crontab" a1="-l" a2="-u" a3="root"
type=SYSCALL msg=audit(1718107945.000:1005): arch=c000003e syscall=2 success=yes exit=3 a0=7ffee1234560 a1=0 a2=0 a3=0 items=1 ppid=8877 pid=8878 auid=1000 uid=0 gid=0 euid=0 suid=0 fsuid=0 egid=0 sgid=0 fsgid=0 tty=pts0 ses=1 comm="cat" exe="/usr/bin/cat" key="sensitive_file_access"
type=PATH msg=audit(1718107945.000:1005): item=0 name="/etc/passwd" inode=12345 dev=08:01 mode=0100644 ouid=0 ogid=0 rdev=00:00
type=SYSCALL msg=audit(1718107950.000:1006): arch=c000003e syscall=87 success=yes exit=0 a0=55f3a8c01000 a1=0 a2=0 a3=0 items=1 ppid=4521 pid=4523 auid=1000 uid=0 gid=0 euid=0 suid=0 fsuid=0 egid=0 sgid=0 fsgid=0 tty=pts0 ses=1 comm="rm" exe="/usr/bin/rm" key="file_deletion"
type=PATH msg=audit(1718107950.000:1006): item=0 name="/var/log/auth.log" inode=67890 dev=08:01 mode=0100640 ouid=0 ogid=4 rdev=00:00
type=SYSCALL msg=audit(1718107955.000:1007): arch=c000003e syscall=59 success=yes exit=0 a0=55f3a8c01000 a1=55f3a8c02000 a2=55f3a8c03000 a3=0 items=2 ppid=1 pid=10001 auid=4294967295 uid=33 gid=33 euid=33 suid=33 fsuid=33 egid=33 sgid=33 fsgid=33 tty=(none) ses=4294967295 comm="apache2" exe="/usr/sbin/apache2" key="process_execution"
type=SYSCALL msg=audit(1718107960.000:1008): arch=c000003e syscall=56 success=yes exit=0 a0=0 a1=7ffee1234560 a2=0 a3=0 items=0 ppid=1234 pid=4524 auid=1000 uid=1000 gid=1000 euid=1000 suid=1000 fsuid=1000 egid=1000 sgid=1000 fsgid=1000 tty=pts0 ses=1 comm="ssh" exe="/usr/bin/ssh" key="network_connections"
type=SYSCALL msg=audit(1718107965.000:1009): arch=c000003e syscall=59 success=yes exit=0 a0=55f3a8c01000 a1=55f3a8c02000 a2=55f3a8c03000 a3=0 items=2 ppid=4521 pid=4525 auid=1000 uid=0 gid=0 euid=0 suid=0 fsuid=0 egid=0 sgid=0 fsgid=0 tty=pts0 ses=1 comm="insmod" exe="/usr/sbin/insmod" key="kernel_modules"
type=EXECVE msg=audit(1718107965.000:1009): argc=2 a0="insmod" a1="/tmp/rootkit.ko"`,

'linux-auth': `Jun 11 14:32:08 webserver-01 sshd[4521]: Accepted publickey for jperks from 203.0.113.42 port 52341 ssh2: RSA SHA256:a1b2c3d4e5f6a7b8
Jun 11 14:32:08 webserver-01 sshd[4521]: pam_unix(sshd:session): session opened for user jperks(uid=1000) by (uid=0)
Jun 11 14:33:00 webserver-01 sshd[4600]: Failed password for admin from 185.220.101.33 port 44100 ssh2
Jun 11 14:33:01 webserver-01 sshd[4601]: Failed password for admin from 185.220.101.33 port 44101 ssh2
Jun 11 14:33:02 webserver-01 sshd[4602]: Failed password for admin from 185.220.101.33 port 44102 ssh2
Jun 11 14:33:03 webserver-01 sshd[4603]: Failed password for admin from 185.220.101.33 port 44103 ssh2
Jun 11 14:33:04 webserver-01 sshd[4604]: Failed password for admin from 185.220.101.33 port 44104 ssh2
Jun 11 14:34:00 webserver-01 sshd[4610]: Failed password for invalid user root from 45.77.123.99 port 55000 ssh2
Jun 11 14:34:01 webserver-01 sshd[4611]: Failed password for invalid user administrator from 45.77.123.99 port 55001 ssh2
Jun 11 14:34:02 webserver-01 sshd[4612]: Failed password for invalid user test from 45.77.123.99 port 55002 ssh2
Jun 11 14:35:00 webserver-01 sudo: jperks : TTY=pts/0 ; PWD=/home/jperks ; USER=root ; COMMAND=/usr/bin/cat /etc/shadow
Jun 11 14:36:00 webserver-01 sudo: kpatel : TTY=pts/1 ; PWD=/home/kpatel ; USER=root ; COMMAND=/usr/sbin/useradd -m -s /bin/bash newaccount
Jun 11 14:37:00 webserver-01 sshd[4700]: Accepted password for svc-backup from 10.0.1.100 port 49800 ssh2
Jun 11 14:37:00 webserver-01 sshd[4700]: pam_unix(sshd:session): session opened for user svc-backup(uid=1001) by (uid=0)
Jun 11 14:38:00 webserver-01 su[4800]: pam_unix(su:session): session opened for user root(uid=0) by svc-backup(uid=1001)
Jun 11 14:38:00 webserver-01 su[4800]: Successful su for root by svc-backup
Jun 11 14:39:00 webserver-01 sshd[4521]: pam_unix(sshd:session): session closed for user jperks
Jun 11 14:40:00 webserver-01 sshd[4900]: Connection closed by 192.0.2.100 port 60000 [preauth]
Jun 11 14:40:01 webserver-01 sshd[4901]: Connection closed by 192.0.2.100 port 60001 [preauth]
Jun 11 14:41:00 webserver-01 passwd[5000]: pam_unix(passwd:chauthtok): password changed for jperks`,

'linux-syslog': `Jun 11 14:32:08 webserver-01 systemd[1]: Started Apache HTTP Server.
Jun 11 14:32:09 webserver-01 kernel: [423456.789012] device eth0 entered promiscuous mode
Jun 11 14:33:00 webserver-01 kernel: [423457.000000] TCP: request_sock_TCP: Possible SYN flooding on port 443. Sending cookies. Check SNMP counters.
Jun 11 14:34:00 webserver-01 kernel: [423458.000000] Out of memory: Kill process 8877 (java) score 950 or sacrifice child
Jun 11 14:34:00 webserver-01 kernel: [423458.000001] Killed process 8877 (java) total-vm:8388608kB, anon-rss:7340032kB, file-rss:0kB, shmem-rss:0kB
Jun 11 14:35:00 webserver-01 systemd[1]: apache2.service: Main process exited, code=killed, status=9/KILL
Jun 11 14:35:01 webserver-01 systemd[1]: apache2.service: Failed with result 'signal'.
Jun 11 14:35:02 webserver-01 systemd[1]: apache2.service: Scheduled restart job, restart counter is at 3.
Jun 11 14:36:00 webserver-01 kernel: [423460.000000] EXT4-fs error (device sda1): ext4_lookup:1590: inode #131073: comm docker: deleted inode referenced: 131074
Jun 11 14:37:00 webserver-01 kernel: [423461.000000] ACPI Error: No handler for Region [SYSI] (000000003e9f1234) [IPMI] (20220331/evregion-130)
Jun 11 14:38:00 webserver-01 ntpd[1500]: time correction of 3600 seconds exceeds sanity limit (1000); set clock manually
Jun 11 14:39:00 webserver-01 kernel: [423463.000000] audit: type=1400 audit(1718107940.000:2001): apparmor="DENIED" operation="open" profile="docker-default" name="/proc/sysrq-trigger" pid=9900 comm="sh" requested_mask="w" denied_mask="w" fsuid=0 ouid=0
Jun 11 14:40:00 webserver-01 systemd[1]: Stopping Docker Application Container Engine...
Jun 11 14:40:01 webserver-01 dockerd[2000]: level=info msg="processing signal" signal=SIGTERM
Jun 11 14:41:00 webserver-01 kernel: [423465.000000] [UFW BLOCK] IN=eth0 OUT= MAC=aa:bb:cc:dd:ee:ff:11:22:33:44:55:66:08:00 SRC=185.220.101.33 DST=10.0.1.50 LEN=44 TOS=0x00 PREC=0x00 TTL=49 ID=54321 PROTO=TCP SPT=44100 DPT=22 WINDOW=1024 RES=0x00 SYN URGP=0`
};
