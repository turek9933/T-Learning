import type { WorkspaceRole } from "@/routes/workspaces.route";
import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from 'better-auth/plugins/organization/access'

const statement = {
    ...defaultStatements, 
    lesson: ["create", "read", "update", "delete"],
    homework: ["create", "read", "update", "delete", "submit"],
    material: ["create", "read", "update", "delete"],
    payment: ["create", "read", "update", "delete", "refund"],
    organization: ["create", "read", "update", "delete"],
} as const;

export const ac = createAccessControl(statement);

export const viewer = ac.newRole({
    lesson: ["read"],
    homework: ["read"],
    material: ["read"],
    organization: ["create", "read"],
});

export const member = ac.newRole({
    lesson: ["read"],
    homework: ["read", "submit"],
    material: ["read"],
    organization: ["create", "read"],
});

export const admin = ac.newRole({
    ...adminAc.statements,
    invitation: ["create", "cancel"],
    lesson: ["create", "read", "update", "delete"],
    homework: ["create", "read", "update", "delete"],
    material: ["create", "read", "update", "delete"],
    payment: ["read"],
    organization: ["create", "read", "update"],
});

export const owner = ac.newRole({
    ...admin.statements,
    invitation: ["create", "cancel"],
    payment: ["create", "read", "update", "delete", "refund"],
    organization: ["create", "read", "update", "delete"],
});

export function canModerate(role: WorkspaceRole) {
    return role === 'owner' || role === 'admin';
}
export function canParticipate(role: WorkspaceRole) {
    return role === 'owner' || role === 'admin' || role === 'member';
}