import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from 'better-auth/plugins/organization/access'

const statement = {
    ...defaultStatements, 
    lesson: ["create", "read", "update", "delete"],
    homework: ["create", "read", "update", "delete", "submit"],
    material: ["create", "read", "update", "delete"],
    payment: ["create", "read", "update", "delete", "refund"],
} as const;

export const ac = createAccessControl(statement);

export const viewer = ac.newRole({
    lesson: ["read"],
    homework: ["read"],
    material: ["read"],
});

export const member = ac.newRole({
    lesson: ["read"],
    homework: ["read", "submit"],
    material: ["read"],
});

export const admin = ac.newRole({
    ...adminAc.statements,
    lesson: ["create", "read", "update", "delete"],
    homework: ["create", "read", "update", "delete"],
    material: ["create", "read", "update", "delete"],
    payment: ["read"],
});

export const owner = ac.newRole({
    ...admin.statements,
    payment: ["create", "read", "update", "delete", "refund"],
});