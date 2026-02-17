"use server";

import { generateText } from "ai";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { requireOrganizer } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { getModel, getSystemPrompt } from "@/lib/ai";

// ── Helpers ──────────────────────────────────────────────────────────────

const assertThreadOwner = async (threadId: string, userId: string, role: string) => {
  const thread = await prisma.chatThread.findUnique({
    where: { id: threadId },
    include: { event: { include: { organizer: true } } },
  });
  if (!thread) throw new Error("Thread not found");
  if (role !== "ADMIN" && thread.event.organizer.userId !== userId) {
    throw new Error("Forbidden: not your thread");
  }
  return thread;
};

// ── Queries ──────────────────────────────────────────────────────────────

export const getOrCreateThread = async (eventId: string) => {
  const user = await requireAuth();
  requireOrganizer(user);

  // Verify event ownership
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { organizer: true },
  });
  if (!event) throw new Error("Event not found");
  if (user.role !== "ADMIN" && event.organizer.userId !== user.id) {
    throw new Error("Forbidden: not your event");
  }

  // Find existing thread or create new one
  const existing = await prisma.chatThread.findFirst({
    where: { eventId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (existing) return existing;

  const thread = await prisma.chatThread.create({
    data: { eventId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  await logAudit({
    userId: user.id,
    action: "CHAT_THREAD_CREATED",
    eventId,
    details: `Created chat thread for event: ${event.title}`,
  });

  return thread;
};

export const getMessages = async (threadId: string) => {
  const user = await requireAuth();
  requireOrganizer(user);
  await assertThreadOwner(threadId, user.id, user.role);

  return prisma.chatMessage.findMany({
    where: { threadId },
    orderBy: { createdAt: "asc" },
  });
};

// ── Mutations ────────────────────────────────────────────────────────────

export const sendMessage = async (threadId: string, content: string) => {
  const user = await requireAuth();
  requireOrganizer(user);
  const thread = await assertThreadOwner(threadId, user.id, user.role);

  // Save user message
  await prisma.chatMessage.create({
    data: {
      threadId,
      role: "user",
      content,
    },
  });

  // Get conversation history
  const history = await prisma.chatMessage.findMany({
    where: { threadId },
    orderBy: { createdAt: "asc" },
  });

  // Build messages for AI
  const messages = history.map((msg) => ({
    role: msg.role as "user" | "assistant" | "system",
    content: msg.content,
  }));

  // Generate AI response
  const result = await generateText({
    model: getModel(),
    system: getSystemPrompt(thread.event.title),
    messages,
  });

  // Save assistant response
  const assistantMessage = await prisma.chatMessage.create({
    data: {
      threadId,
      role: "assistant",
      content: result.text,
    },
  });

  return assistantMessage;
};
