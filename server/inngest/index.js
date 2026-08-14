import {Inngest} from "inngest";
import prisma from '../config/prisma.js';

export const inngest = new Inngest({ id: "colab"});

const syncUserCreation = inngest.createFunction(
    { id: 'sync-user-from-clerk', triggers: { event: 'clerk/user.created' } },
    async ({ event }) => {
        const {data} = event;
        await prisma.user.create({
            data: {
                id: data.id,
                email: data.email_addresses[0]?.email_address,
                name: data.first_name + " " + data.last_name,
                image: data?.image_url,
            }
        })
    }
)

const syncUserDeletion = inngest.createFunction(
    { id: 'delete-user-with-clerk', triggers: { event: 'clerk/user.deleted' } },
    async ({ event }) => {
        const {data} = event;
        await prisma.user.delete({
            where: {
                id: data.id,
            }
        })
    }
)

const syncUserUpdation = inngest.createFunction(
    { id: 'update-user-from-clerk', triggers: { event: 'clerk/user.updated' } },
    async ({ event }) => {
        const {data} = event;
        await prisma.user.update({
            where: {
                id: data.id,
            },
            data: {
                email: data.email_addresses[0]?.email_address,
                name: data.first_name + " " + data.last_name,
                image: data?.image_url,
            }
        })
    }
)
//save workspace data to db
const syncWorkspaceCreation = inngest.createFunction(
    { id: 'sync-workspace-from-clerk', triggers: { event: 'clerk/organization.created' } },
    async ({ event }) => {
        const { data } = event;
        const ownerId = data.created_by ?? data.created_by_user_id ?? data.created_by_id;
        // Use upsert to avoid failing when the workspace already exists
        await prisma.workspace.upsert({
            where: { id: data.id },
            update: {
                name: data.name,
                slug: data.slug,
                image: data?.image_url,
                ownerId: ownerId,
            },
            create: {
                id: data.id,
                name: data.name,
                slug: data.slug,
                ownerId: ownerId,
                image: data?.image_url,
            }
        });

        // add creator as admin; tolerate unique-constraint if already present
        try {
            await prisma.workspaceMember.create({
                data: {
                    workspaceId: data.id,
                    userId: ownerId,
                    role: "ADMIN",
                }
            });
        } catch (e) {
            // ignore duplicate member errors (P2002), rethrow others
            if (e.code && e.code === 'P2002') {
                // already exists - no-op
            } else {
                throw e;
            }
        }
    }
) 

//update data to db
const syncWorkspaceUpdation = inngest.createFunction(
    { id: 'update-workspace-from-clerk', triggers: { event: 'clerk/organization.updated' } },
    async ({ event }) => {
        const {data} = event;
        await prisma.workspace.update({
            where: {
                id: data.id,
            },
            data: {
                name: data.name,
                slug: data.slug,
                image: data?.image_url,
            }
        })
    }
)

// delete workspace data from db
const syncWorkspaceDeletion = inngest.createFunction(
    { id: 'delete-workspace-from-clerk', triggers: { event: 'clerk/organization.deleted' } },
    async ({ event }) => {
        const {data} = event;
        await prisma.workspace.delete({
            where: {
                id: data.id,
            }
        })
    }
)

//save member data to db
const syncWorkspaceMemberCreation = inngest.createFunction(
    { id: 'sync-workspace-member-from-clerk', triggers: { event: 'clerk/organizationInvitation.accepted' } },
    async ({ event }) => {
        const {data} = event;
        const role = data.role_name ? String(data.role_name).toUpperCase() : 'MEMBER';
        try {
            await prisma.workspaceMember.create({
                data: {
                    workspaceId: data.organization_id,
                    userId: data.user_id,
                    role,
                }
            })
        } catch (e) {
            if (e.code && e.code === 'P2002') {
                // already a member, ignore
            } else {
                throw e;
            }
        }
    }
)
export const functions = [syncUserCreation, syncUserDeletion, syncUserUpdation, syncWorkspaceCreation, syncWorkspaceUpdation, syncWorkspaceDeletion, syncWorkspaceMemberCreation]; 