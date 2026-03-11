import { User } from "@supabase/supabase-js";

import { badges, currentSemester, springSemester, student } from "@/lib/mockData";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function prefixedId(prefix: string, value: string) {
  return `${prefix}-${value}`;
}

export async function ensureDemoStudentData(user: User) {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const { data: existingStudent } = await supabase
    .from("students")
    .select("id, current_semester_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (existingStudent) {
    return existingStudent;
  }

  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "Student";

  const { data: insertedStudent, error: studentError } = await supabase
    .from("students")
    .insert({
      auth_user_id: user.id,
      full_name: displayName,
      email: user.email,
      total_xp: student.totalXp,
      streak: student.streak
    })
    .select("id")
    .single();

  if (studentError || !insertedStudent) {
    throw new Error(studentError?.message || "Could not create student profile");
  }

  const { data: insertedSemesters, error: semesterError } = await supabase
    .from("semesters")
    .insert([
      {
        student_id: insertedStudent.id,
        name: currentSemester.name,
        year: currentSemester.year,
        is_current: true
      },
      {
        student_id: insertedStudent.id,
        name: springSemester.name,
        year: springSemester.year,
        is_current: false
      }
    ])
    .select("id, name, year, is_current");

  if (semesterError || !insertedSemesters) {
    throw new Error(semesterError?.message || "Could not create semesters");
  }

  const currentSemesterRow = insertedSemesters.find((semester) => semester.is_current);
  const springSemesterRow = insertedSemesters.find((semester) => !semester.is_current);

  if (!currentSemesterRow || !springSemesterRow) {
    throw new Error("Seeded semesters are incomplete");
  }

  const courseIdMap = new Map<string, string>();
  const prefix = user.id.slice(0, 8);
  const allSemesters = [
    { source: currentSemester, dbSemesterId: currentSemesterRow.id },
    { source: springSemester, dbSemesterId: springSemesterRow.id }
  ];

  const courseRows = allSemesters.flatMap(({ source, dbSemesterId }) =>
    source.classes.map((course) => {
      const courseId = prefixedId(prefix, course.id);
      courseIdMap.set(course.id, courseId);

      return {
        id: courseId,
        semester_id: dbSemesterId,
        title: course.title,
        professor: course.professor,
        color: course.color,
        syllabus: course.syllabus,
        xp: course.progress.xp,
        completion_rate: course.progress.completionRate,
        missions_completed: course.progress.missionsCompleted,
        quests_completed: course.progress.questsCompleted
      };
    })
  );

  const { error: courseError } = await supabase.from("courses").insert(courseRows);

  if (courseError) {
    throw new Error(courseError.message);
  }

  const materialRows = currentSemester.classes.flatMap((course) =>
    course.materials.map((material) => ({
      id: prefixedId(prefix, material.id),
      course_id: courseIdMap.get(course.id),
      type: material.type,
      title: material.title,
      raw_text: material.rawText,
      uploaded_at: material.uploadedAt
    }))
  );

  const { error: materialError } = await supabase.from("materials").insert(materialRows);

  if (materialError) {
    throw new Error(materialError.message);
  }

  const materialIdMap = new Map<string, string>();
  currentSemester.classes.forEach((course) => {
    course.materials.forEach((material) => {
      materialIdMap.set(material.id, prefixedId(prefix, material.id));
    });
  });

  const questRows = currentSemester.classes.flatMap((course) =>
    course.quests.map((quest) => ({
      id: prefixedId(prefix, quest.id),
      course_id: courseIdMap.get(course.id),
      material_id: materialIdMap.get(quest.materialId),
      topic: quest.topic,
      summary: quest.summary,
      cards: quest.cards,
      quiz: quest.quiz,
      missions: quest.missions,
      badge: quest.badge,
      xp: quest.xp,
      completed: quest.completed
    }))
  );

  const { error: questError } = await supabase.from("study_quests").insert(questRows);

  if (questError) {
    throw new Error(questError.message);
  }

  const earnedBadgeRows = badges
    .filter((badge) => badge.earned)
    .map((badge) => ({
      student_id: insertedStudent.id,
      label: badge.title,
      description: badge.description
    }));

  if (earnedBadgeRows.length > 0) {
    const { error: badgeError } = await supabase.from("earned_badges").insert(earnedBadgeRows);

    if (badgeError) {
      throw new Error(badgeError.message);
    }
  }

  const { error: updateError } = await supabase
    .from("students")
    .update({
      current_semester_id: currentSemesterRow.id
    })
    .eq("id", insertedStudent.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return {
    id: insertedStudent.id,
    current_semester_id: currentSemesterRow.id
  };
}
