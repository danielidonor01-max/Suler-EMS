import prisma from "@/lib/prisma";
import { ConversationClassification } from "../domain/communication.types";

export class ChannelService {
  /**
   * Find or Create a Direct Message conversation between two users
   */
  static async getOrCreateDM(userId1: string, userId2: string) {
    // 1. Check if DM already exists
    const existing = await prisma.conversation.findFirst({
      where: {
        classification: ConversationClassification.DIRECT,
        AND: [
          { members: { some: { userId: userId1 } } },
          { members: { some: { userId: userId2 } } }
        ]
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    if (existing && existing.members.length === 2) {
      return existing;
    }

    // 2. Create new DM
    return prisma.conversation.create({
      data: {
        classification: ConversationClassification.DIRECT,
        members: {
          create: [
            { userId: userId1, role: 'MEMBER' },
            { userId: userId2, role: 'MEMBER' }
          ]
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });
  }

  /**
   * Ensure a department channel exists and members are synced
   */
  static async syncDepartmentChannel(departmentId: string) {
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      include: { employees: { include: { user: true } } }
    });

    if (!department) throw new Error("Department not found");

    // 1. Find or create channel
    let conversation = await prisma.conversation.findFirst({
      where: {
        classification: ConversationClassification.DEPARTMENT,
        resourceId: departmentId,
        resourceType: 'Department'
      }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          classification: ConversationClassification.DEPARTMENT,
          name: `${department.name} Channel`,
          description: `Official communication channel for ${department.name}`,
          resourceId: departmentId,
          resourceType: 'Department'
        }
      });
    }

    // 2. Sync members
    const activeUserIds = department.employees
      .map(e => e.user?.id)
      .filter((id): id is string => !!id);

    // Add missing members
    for (const userId of activeUserIds) {
      await prisma.conversationMember.upsert({
        where: {
          conversationId_userId: {
            conversationId: conversation.id,
            userId
          }
        },
        create: {
          conversationId: conversation.id,
          userId,
          role: department.managerId === userId ? 'ADMIN' : 'MEMBER'
        },
        update: {
          role: department.managerId === userId ? 'ADMIN' : 'MEMBER'
        }
      });
    }

    return conversation;
  }

  /**
   * Create a workflow-linked discussion
   */
  static async createWorkflowDiscussion(params: {
    resourceId: string;
    resourceType: string;
    participantIds: string[];
    name: string;
  }) {
    const { resourceId, resourceType, participantIds, name } = params;

    return prisma.conversation.create({
      data: {
        classification: ConversationClassification.WORKFLOW,
        name,
        resourceId,
        resourceType,
        members: {
          create: participantIds.map(userId => ({
            userId,
            role: 'MEMBER'
          }))
        },
        retentionPolicy: 'LONG_TERM' // Enterprise Refinement 10
      },
      include: {
        members: true
      }
    });
  }

  /**
   * List all conversations for a user
   */
  static async getUserConversations(userId: string) {
    return prisma.conversation.findMany({
      where: {
        members: { some: { userId } }
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true }
            }
          }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: { select: { name: true } }
          }
        }
      },
      orderBy: { lastMessageAt: 'desc' }
    });
  }
}
