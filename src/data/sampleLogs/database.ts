export const databaseLogs: Record<string, string> = {

'mongodb-audit': `{"atype":"authenticate","ts":{"$date":"2026-06-16T14:32:01.234+0000"},"uuid":{"$binary":"a1b2c3d4e5f6","$type":"04"},"local":{"ip":"10.0.5.22","port":27017},"remote":{"ip":"10.0.8.100","port":49152},"users":[{"user":"app-web-prod","db":"admin"}],"roles":[{"role":"readWrite","db":"production"}],"param":{"user":"app-web-prod","db":"admin","mechanism":"SCRAM-SHA-256"},"result":0}
{"atype":"authCheck","ts":{"$date":"2026-06-16T14:32:08.456+0000"},"uuid":{"$binary":"b2c3d4e5f6a7","$type":"04"},"local":{"ip":"10.0.5.22","port":27017},"remote":{"ip":"10.0.8.100","port":49152},"users":[{"user":"app-web-prod","db":"admin"}],"roles":[{"role":"readWrite","db":"production"}],"param":{"command":"find","ns":"production.orders","args":{"filter":{"status":"pending"},"limit":100}},"result":0}
{"atype":"authCheck","ts":{"$date":"2026-06-16T14:33:15.789+0000"},"uuid":{"$binary":"c3d4e5f6a7b8","$type":"04"},"local":{"ip":"10.0.5.22","port":27017},"remote":{"ip":"185.234.72.11","port":52341},"users":[],"roles":[],"param":{"command":"find","ns":"production.customers","args":{"filter":{"ssn":{"$exists":true}}}},"result":13}
{"atype":"createUser","ts":{"$date":"2026-06-16T14:34:22.100+0000"},"uuid":{"$binary":"d4e5f6a7b8c9","$type":"04"},"local":{"ip":"10.0.5.22","port":27017},"remote":{"ip":"10.0.1.50","port":55100},"users":[{"user":"dba-admin","db":"admin"}],"roles":[{"role":"root","db":"admin"}],"param":{"user":"emergency-access","db":"admin","roles":[{"role":"root","db":"admin"}]},"result":0}
{"atype":"dropCollection","ts":{"$date":"2026-06-16T14:35:00.555+0000"},"uuid":{"$binary":"e5f6a7b8c9d0","$type":"04"},"local":{"ip":"10.0.5.22","port":27017},"remote":{"ip":"10.0.1.50","port":55100},"users":[{"user":"emergency-access","db":"admin"}],"roles":[{"role":"root","db":"admin"}],"param":{"ns":"production.audit_trail"},"result":0}`,

'postgresql-audit': `2026-06-16 14:32:01.234 UTC [12345] app_user@production LOG:  AUDIT: SESSION,1,1,READ,SELECT,TABLE,public.users,"SELECT id, email, last_login FROM users WHERE last_login > $1",('2026-06-15')
2026-06-16 14:32:08.456 UTC [12346] app_user@production LOG:  AUDIT: SESSION,2,1,WRITE,UPDATE,TABLE,public.orders,"UPDATE orders SET status = $1 WHERE id = $2",('shipped','ord-98765')
2026-06-16 14:33:15.789 UTC [12347] mthompson@production LOG:  AUDIT: SESSION,3,1,DDL,ALTER TABLE,TABLE,public.customers,"ALTER TABLE customers ADD COLUMN ssn_encrypted VARCHAR(255)",<not logged>
2026-06-16 14:34:22.100 UTC [12348] postgres@production LOG:  AUDIT: SESSION,4,1,ROLE,GRANT,,,GRANT ALL ON SCHEMA public TO external_contractor,<not logged>
2026-06-16 14:35:00.555 UTC [12349] unknown@production LOG:  AUDIT: SESSION,5,1,READ,SELECT,TABLE,pg_catalog.pg_shadow,"SELECT usename, passwd FROM pg_shadow",<not logged>`

};
