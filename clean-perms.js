const { PrismaClient } = require('./prisma/generated/client');
const p = new PrismaClient();
const keep = ['LEADS', 'STUDENTS', 'APPLICATIONS', 'VISA', 'MASTERS', 'ROLES'];

p.rolePermission.deleteMany({ where: { module: { notIn: keep } } })
    .then(r => console.log('Deleted', r.count, 'stale permission rows'))
    .catch(console.error)
    .finally(() => p.$disconnect());
