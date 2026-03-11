import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { generateQuestWithOpenAI } from "@/lib/openai";
import { buildQuestFromMaterial } from "@/lib/questParser";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MaterialType, StudyQuest } from "@/lib/types";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    courseId?: string;
    courseTitle?: string;
    title?: string;
    rawText?: string;
    materialType?: MaterialType;
    storagePath?: string;
  };

  if (!body.courseId || !body.rawText || !body.materialType) {
    return NextResponse.json({ error: "courseId, rawText, and materialType are required" }, { status: 400 });
  }

  const materialId = `generated-${Date.now()}`;
  const questId = `generated-quest-${Date.now()}`;
  const generated = await generateQuestWithOpenAI({
    courseTitle: body.courseTitle,
    materialType: body.materialType,
    title: body.title?.trim() || "Untitled material",
    rawText: body.rawText
  });

  const fallbackQuest = buildQuestFromMaterial({
    courseId: body.courseId,
    materialId,
    materialType: body.materialType,
    title: body.title?.trim() || "Untitled material",
    rawText: body.rawText
  });

  const quest: StudyQuest = {
    ...(generated
      ? {
          courseId: body.courseId,
          materialId,
          ...generated
        }
      : fallbackQuest),
    id: questId,
    completed: false
  };

  const supabase = createSupabaseAdminClient();
  const authSupabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = (await authSupabase?.auth.getUser()) ?? { data: { user: null } };
  let persisted = false;

  if (supabase && user) {
    const { data: ownedCourse } = await supabase
      .from("courses")
      .select("id, semester_id, semesters!inner(student_id), title")
      .eq("id", body.courseId)
      .eq("semesters.student_id", (
        await supabase.from("students").select("id").eq("auth_user_id", user.id).single()
      ).data?.id ?? "")
      .maybeSingle();

    if (ownedCourse) {
      await supabase.from("materials").upsert({
      id: materialId,
      course_id: body.courseId,
      type: body.materialType,
      title: body.title?.trim() || "Untitled material",
      raw_text: body.rawText,
      storage_path: body.storagePath || null
      });

      await supabase.from("study_quests").upsert({
        id: quest.id,
        course_id: quest.courseId,
        material_id: quest.materialId,
        topic: quest.topic,
        summary: quest.summary,
        cards: quest.cards,
        quiz: quest.quiz,
        missions: quest.missions,
        badge: quest.badge,
        xp: quest.xp,
        completed: quest.completed
      });

      revalidatePath("/dashboard");
      revalidatePath(`/class/${body.courseId}`);
      revalidatePath("/rewards");
      persisted = true;
    }
  }

  return NextResponse.json({
    ...quest,
    generationMode: generated ? "openai" : "fallback",
    persisted
  });
}
