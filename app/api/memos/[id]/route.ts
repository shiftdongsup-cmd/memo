import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

async function getOwnedMemo(userId: string, memoId: string) {
  return prisma.memo.findFirst({
    where: { id: memoId, userId },
  });
}

const patchSchema = z.object({
  content: z.string(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const memo = await getOwnedMemo(session.user.id, id);
  if (!memo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const updated = await prisma.memo.update({
    where: { id: memo.id },
    data: { content: parsed.data.content },
  });

  return NextResponse.json({
    id: updated.id,
    content: updated.content,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const memo = await getOwnedMemo(session.user.id, id);
  if (!memo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.memo.delete({ where: { id: memo.id } });
  return NextResponse.json({ ok: true });
}
