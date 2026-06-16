export const virtualizationLogs: Record<string, string> = {

'vmware-vsphere': `<134>1 2026-06-11T14:32:08.123Z vcenter-01.internal vpxd 12345 - [vmw@6876 VMName="web-prod-01" Host="esxi-node-03.internal" Cluster="Prod-Cluster-01" Datacenter="DC-East" User="admin@vsphere.local"] Event [VmMigratedEvent]: VM web-prod-01 migrated from esxi-node-03 to esxi-node-07 in cluster Prod-Cluster-01. Reason: DRS recommendation (CPU imbalance: 85% vs 22%)
<131>1 2026-06-11T14:33:15.456Z esxi-node-03.internal hostd 5678 - [vmw@6876 VMName="db-prod-02" User="root"] Event [VmCreatedEvent]: Snapshot created on VM db-prod-02 by user root. Snapshot name: "pre-maintenance-20260611" Description: ""
<129>1 2026-06-11T14:34:22.789Z vcenter-01.internal vpxd 12345 - [vmw@6876 Host="esxi-node-05.internal" Cluster="Prod-Cluster-01" Datacenter="DC-East"] Event [HostConnectionLostEvent]: Host esxi-node-05 has lost network connectivity. HA failover initiated for 12 VMs.
<134>1 2026-06-11T14:35:00.100Z esxi-node-07.internal hostd 9012 - [vmw@6876 VMName="web-prod-01" User="admin@vsphere.local"] Event [VmPoweredOnEvent]: VM web-prod-01 powered on. Host: esxi-node-07.internal. CPU: 4 vCPU, Memory: 16384 MB.
<131>1 2026-06-11T14:36:44.555Z vcenter-01.internal vpxd 12345 - [vmw@6876 User="unknown@10.0.1.99" Host="esxi-node-03.internal"] Event [UserLoginSessionEvent]: User unknown@10.0.1.99 logged in to ESXi shell via SSH. Source IP: 10.0.1.99. This is an interactive root shell session.`

};
