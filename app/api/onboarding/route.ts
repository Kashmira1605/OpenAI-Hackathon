import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export async function POST(request: Request) {
  const authSupabase = await createSupabaseServerClient();
  const adminSupabase = createSupabaseAdminClient();

  if (!authSupabase || !adminSupabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const {
    data: { user }
  } = await authSupabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in before onboarding." }, { status: 401 });
  }

  const body = (await request.json()) as {
    name?: string;
    semesterName?: string;
    year?: number;
    courses?: Array<{ title: string; professor?: string }>;
  };

  const name = body.name?.trim();
  const semesterName = body.semesterName?.trim();
  const year = body.year;
  const courses = (body.courses ?? []).filter((course) => course.title.trim());

  if (!name || !semesterName || !year || courses.length === 0) {
    return NextResponse.json({ error: "name, semesterName, year, and at least one course are required." }, { status: 400 });
  }

  const { data: existingStudent } = await adminSupabase
    .from("students")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  let studentId = existingStudent?.id as string | undefined;

  if (!studentId) {
    const { data: insertedStudent, error: studentInsertError } = await adminSupabase
      .from("students")
      .insert({
        auth_user_id: user.id,
        full_name: name,
        email: user.email,
        total_xp: 0,
        streak: 0
      })
      .select("id")
      .single();

    if (studentInsertError || !insertedStudent) {
      return NextResponse.json({ error: studentInsertError?.message || "Could not create student profile." }, { status: 500 });
    }

    studentId = insertedStudent.id;
  } else {
    await adminSupabase
      .from("students")
      .update({
        full_name: name
      })
      .eq("id", studentId);
  }

  const { data: existingSemesters } = await adminSupabase
    .from("semesters")
    .select("id")
    .eq("student_id", studentId);

  if (existingSemesters?.length) {
    await adminSupabase.from("semesters").delete().in("id", existingSemesters.map((semester) => semester.id));
  }

  const { data: insertedSemester, error: semesterError } = await adminSupabase
    .from("semesters")
    .insert({
      student_id: studentId,
      name: semesterName,
      year,
      is_current: true
    })
    .select("id")
    .single();

  if (semesterError || !insertedSemester) {
    return NextResponse.json({ error: semesterError?.message || "Could not create semester." }, { status: 500 });
  }

  const palette = ["#C65D27", "#D98B4F", "#5B6C4F", "#7A8E6B", "#A14C25"];
  const prefix = user.id.slice(0, 8);

  const courseRows = courses.map((course, index) => ({
    id: `${prefix}-${slugify(course.title)}-${randomUUID().slice(0, 6)}`,
    semester_id: insertedSemester.id,
    title: course.title.trim(),
    professor: course.professor?.trim() || "Professor TBD",
    color: palette[index % palette.length],
    syllabus: "Add your syllabus to turn this class into a playable quest path.",
    xp: 0,
    completion_rate: 0,
    missions_completed: 0,
    quests_completed: 0
  }));

  const { error: courseError } = await adminSupabase.from("courses").insert(courseRows);

  if (courseError) {
    return NextResponse.json({ error: courseError.message }, { status: 500 });
  }

  await adminSupabase
    .from("students")
    .update({
      current_semester_id: insertedSemester.id
    })
    .eq("id", studentId);

  await authSupabase.auth.updateUser({
    data: {
      full_name: name,
      onboarding_completed: true
    }
  });

  return NextResponse.json({ ok: true });
}
