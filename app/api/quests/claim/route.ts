import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type StudentRow = {
  id: string;
  total_xp: number;
};

type QuestRow = {
  id: string;
  course_id: string;
  topic: string;
  badge: string | null;
  xp: number;
  completed: boolean;
};

type CourseRow = {
  id: string;
  title: string;
  xp: number;
  quests_completed: number;
  completion_rate: number;
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { questId?: string };

  if (!body.questId) {
    return NextResponse.json({ error: "questId is required" }, { status: 400 });
  }

  const authSupabase = await createSupabaseServerClient();
  const adminSupabase = createSupabaseAdminClient();

  if (!authSupabase || !adminSupabase) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 400 });
  }

  const {
    data: { user }
  } = await authSupabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: studentRow } = await adminSupabase
    .from("students")
    .select("id, total_xp")
    .eq("auth_user_id", user.id)
    .single<StudentRow>();

  if (!studentRow) {
    return NextResponse.json({ error: "Student record not found" }, { status: 404 });
  }

  const { data: questRow } = await adminSupabase
    .from("study_quests")
    .select("id, course_id, topic, badge, xp, completed")
    .eq("id", body.questId)
    .single<QuestRow>();

  if (!questRow) {
    return NextResponse.json({ error: "Quest not found" }, { status: 404 });
  }

  const { data: ownedCourse } = await adminSupabase
    .from("courses")
    .select("id, title, xp, quests_completed, completion_rate, semesters!inner(student_id)")
    .eq("id", questRow.course_id)
    .eq("semesters.student_id", studentRow.id)
    .maybeSingle<CourseRow & { semesters: { student_id: string } }>();

  if (!ownedCourse) {
    return NextResponse.json({ error: "Quest does not belong to this student" }, { status: 403 });
  }

  if (!questRow.completed) {
    await adminSupabase.from("study_quests").update({ completed: true }).eq("id", questRow.id);

    const { count: totalQuestCount } = await adminSupabase
      .from("study_quests")
      .select("id", { count: "exact", head: true })
      .eq("course_id", questRow.course_id);

    const { count: completedQuestCount } = await adminSupabase
      .from("study_quests")
      .select("id", { count: "exact", head: true })
      .eq("course_id", questRow.course_id)
      .eq("completed", true);

    const totalQuests = totalQuestCount ?? 0;
    const completedQuests = completedQuestCount ?? 0;
    const completionRate = totalQuests > 0 ? Math.round((completedQuests / totalQuests) * 100) : 0;

    await adminSupabase
      .from("students")
      .update({ total_xp: studentRow.total_xp + questRow.xp })
      .eq("id", studentRow.id);

    await adminSupabase
      .from("courses")
      .update({
        xp: ownedCourse.xp + questRow.xp,
        quests_completed: completedQuests,
        completion_rate: completionRate
      })
      .eq("id", questRow.course_id);
  }

  if (questRow.badge) {
    const { data: existingBadge } = await adminSupabase
      .from("earned_badges")
      .select("id")
      .eq("student_id", studentRow.id)
      .eq("course_id", questRow.course_id)
      .eq("label", questRow.badge)
      .maybeSingle<{ id: string }>();

    if (!existingBadge) {
      await adminSupabase.from("earned_badges").insert({
        student_id: studentRow.id,
        course_id: questRow.course_id,
        label: questRow.badge,
        description: `Earned from completing ${questRow.topic}.`
      });
    }
  }

  revalidatePath("/dashboard");
  revalidatePath(`/class/${questRow.course_id}`);
  revalidatePath(`/quest/${questRow.id}`);
  revalidatePath("/rewards");

  return NextResponse.json({
    claimed: true,
    questId: questRow.id,
    courseId: questRow.course_id,
    badge: questRow.badge,
    xp: questRow.xp,
    alreadyClaimed: questRow.completed
  });
}
