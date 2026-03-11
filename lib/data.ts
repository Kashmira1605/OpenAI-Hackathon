import { User } from "@supabase/supabase-js";

import { academicYear, badges as mockBadges, currentSemester, getNextAction, getQuest, getRecentUploads, getUpcomingMissions, student } from "@/lib/mockData";
import { ensureDemoStudentData } from "@/lib/demoSeed";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AcademicYear, Badge, Course, Material, Semester, Student, StudyQuest } from "@/lib/types";

type StudentRow = {
  id: string;
  auth_user_id: string;
  full_name: string;
  email: string | null;
  total_xp: number;
  streak: number;
  current_semester_id: string | null;
};

type SemesterRow = {
  id: string;
  student_id: string;
  name: string;
  year: number;
  is_current: boolean;
};

type CourseRow = {
  id: string;
  semester_id: string;
  title: string;
  professor: string;
  color: string;
  syllabus: string | null;
  xp: number;
  completion_rate: number;
  missions_completed: number;
  quests_completed: number;
};

type MaterialRow = {
  id: string;
  course_id: string;
  type: Material["type"];
  title: string;
  raw_text: string;
  storage_path: string | null;
  uploaded_at: string;
};

type QuestRow = {
  id: string;
  course_id: string;
  material_id: string;
  topic: string;
  summary: string;
  cards: StudyQuest["cards"];
  quiz: StudyQuest["quiz"];
  missions: StudyQuest["missions"];
  badge: string;
  xp: number;
  completed: boolean;
};

type BadgeRow = {
  id: string;
  label: string;
  description: string | null;
};

export type AppState = {
  student: Student;
  currentSemester: Semester;
  academicYear: AcademicYear;
  badges: Badge[];
  recentUploads: Material[];
  upcomingMissions: Array<StudyQuest["missions"][number] & { courseId: string; courseTitle: string; questId: string }>;
  nextAction: {
    classId: string;
    classTitle: string;
    questId?: string;
    title: string;
    durationMin: number;
    reason: string;
    xp: number;
  };
  source: "mock" | "supabase";
  authUser: User | null;
  onboardingComplete: boolean;
};

async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user;
}

function buildMockState(authUser: User | null): AppState {
  return {
    student,
    currentSemester,
    academicYear,
    badges: mockBadges,
    recentUploads: getRecentUploads(),
    upcomingMissions: getUpcomingMissions(),
    nextAction: getNextAction(),
    source: "mock",
    authUser,
    onboardingComplete: false
  };
}

function toStudent(row: StudentRow, currentSemesterId: string): Student {
  return {
    id: row.id,
    name: row.full_name,
    totalXp: row.total_xp,
    streak: row.streak,
    currentSemester: currentSemesterId,
    level: Math.max(1, Math.floor(row.total_xp / 200) + 1)
  };
}

function buildSemesters(data: {
  studentRow: StudentRow;
  semesterRows: SemesterRow[];
  courseRows: CourseRow[];
  materialRows: MaterialRow[];
  questRows: QuestRow[];
}): Semester[] {
  return data.semesterRows.map((semesterRow) => {
    const semesterCourses = data.courseRows
      .filter((course) => course.semester_id === semesterRow.id)
      .map((courseRow) => {
        const materials = data.materialRows
          .filter((material) => material.course_id === courseRow.id)
          .map<Material>((material) => ({
            id: material.id,
            courseId: material.course_id,
            type: material.type,
            title: material.title,
            rawText: material.raw_text,
            uploadedAt: material.uploaded_at
          }));

        const quests = data.questRows
          .filter((quest) => quest.course_id === courseRow.id)
          .map<StudyQuest>((quest) => ({
            id: quest.id,
            courseId: quest.course_id,
            materialId: quest.material_id,
            topic: quest.topic,
            summary: quest.summary,
            cards: quest.cards,
            quiz: quest.quiz,
            missions: quest.missions,
            badge: quest.badge,
            xp: quest.xp,
            completed: quest.completed
          }));

        return {
          id: courseRow.id,
          title: courseRow.title,
          professor: courseRow.professor,
          color: courseRow.color,
          syllabus: courseRow.syllabus ?? undefined,
          materials,
          quests,
          progress: {
            xp: courseRow.xp,
            completionRate: courseRow.completion_rate,
            missionsCompleted: courseRow.missions_completed,
            questsCompleted: courseRow.quests_completed
          }
        } satisfies Course;
      });

    return {
      id: semesterRow.id,
      name: semesterRow.name,
      year: semesterRow.year,
      classes: semesterCourses
    } satisfies Semester;
  });
}

function buildBadges(rows: BadgeRow[]): Badge[] {
  if (rows.length === 0) {
    return mockBadges;
  }

  return rows.map((row) => ({
    id: row.id,
    title: row.label,
    description: row.description ?? "Earned through consistent study momentum.",
    earned: true
  }));
}

function buildUpcomingMissions(semester: Semester) {
  return semester.classes.flatMap((course) =>
    course.quests.flatMap((quest) =>
      quest.missions.map((mission) => ({
        ...mission,
        courseId: course.id,
        courseTitle: course.title,
        questId: quest.id
      }))
    )
  );
}

function buildNextAction(semester: Semester) {
  const nextCourse = [...semester.classes].sort(
    (left, right) => left.progress.completionRate - right.progress.completionRate
  )[0];

  if (!nextCourse) {
    return {
      classId: "",
      classTitle: "No classes yet",
      title: "Create your first class",
      durationMin: 5,
      reason: "Once you add a class, Study Quest can generate the next best action.",
      xp: 10
    };
  }

  const nextQuest = nextCourse.quests[0];

  return {
    classId: nextCourse.id,
    classTitle: nextCourse.title,
    questId: nextQuest?.id,
    title: nextQuest?.topic ?? "Add your first study item",
    durationMin: nextQuest?.missions[0]?.durationMin ?? 5,
    reason: `${nextCourse.title} is the lowest-progress class this week, so one short mission moves the semester forward fastest.`,
    xp: nextQuest?.missions[0]?.xp ?? 10
  };
}

export async function getAppState(): Promise<AppState> {
  const authUser = await getAuthenticatedUser();
  const onboardingComplete = Boolean(authUser?.user_metadata?.onboarding_completed);

  if (!hasSupabaseEnv() || !authUser) {
    return buildMockState(authUser);
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return buildMockState(authUser);
  }

  if (!onboardingComplete) {
    return {
      ...buildMockState(authUser),
      authUser,
      source: "supabase",
      onboardingComplete
    };
  }

  await ensureDemoStudentData(authUser);

  const { data: studentRow } = await supabase
    .from("students")
    .select("id, auth_user_id, full_name, email, total_xp, streak, current_semester_id")
    .eq("auth_user_id", authUser.id)
    .single<StudentRow>();

  if (!studentRow) {
    return buildMockState(authUser);
  }

  const { data: semesterRows } = await supabase
    .from("semesters")
    .select("id, student_id, name, year, is_current")
    .eq("student_id", studentRow.id)
    .order("year", { ascending: true })
    .order("name", { ascending: true });

  const semesters = semesterRows ?? [];
  const semesterIds = semesters.map((semester) => semester.id);

  const { data: courseRows } = semesterIds.length
    ? await supabase
        .from("courses")
        .select("id, semester_id, title, professor, color, syllabus, xp, completion_rate, missions_completed, quests_completed")
        .in("semester_id", semesterIds)
    : { data: [] as CourseRow[] };

  const courses = courseRows ?? [];
  const courseIds = courses.map((course) => course.id);

  const { data: materialRows } = courseIds.length
    ? await supabase
        .from("materials")
        .select("id, course_id, type, title, raw_text, storage_path, uploaded_at")
        .in("course_id", courseIds)
        .order("uploaded_at", { ascending: false })
    : { data: [] as MaterialRow[] };

  const { data: questRows } = courseIds.length
    ? await supabase
        .from("study_quests")
        .select("id, course_id, material_id, topic, summary, cards, quiz, missions, badge, xp, completed")
        .in("course_id", courseIds)
    : { data: [] as QuestRow[] };

  const { data: badgeRows } = await supabase
    .from("earned_badges")
    .select("id, label, description")
    .eq("student_id", studentRow.id)
    .order("earned_at", { ascending: false });

  const builtSemesters = buildSemesters({
    studentRow,
    semesterRows: semesters,
    courseRows: courses,
    materialRows: materialRows ?? [],
    questRows: questRows ?? []
  });

  const current = builtSemesters.find((semester) => semester.id === studentRow.current_semester_id) ?? builtSemesters[0];

  if (!current) {
    return buildMockState(authUser);
  }

  return {
    student: toStudent(studentRow, current.id),
    currentSemester: current,
    academicYear: {
      label: builtSemesters.map((semester) => semester.year).join("-"),
      semesters: builtSemesters,
      archivedClasses: Math.max(0, builtSemesters.slice(0, -1).reduce((sum, semester) => sum + semester.classes.length, 0))
    },
    badges: buildBadges(badgeRows ?? []),
    recentUploads: (materialRows ?? []).map((material) => ({
      id: material.id,
      courseId: material.course_id,
      type: material.type,
      title: material.title,
      rawText: material.raw_text,
      uploadedAt: material.uploaded_at
    })),
    upcomingMissions: buildUpcomingMissions(current),
    nextAction: buildNextAction(current),
    source: "supabase",
    authUser,
    onboardingComplete
  };
}

export async function getSemesterData(semesterId: string) {
  const state = await getAppState();
  return {
    ...state,
    semester: state.academicYear.semesters.find((semester) => semester.id === semesterId) ?? null
  };
}

export async function getCourseData(classId: string) {
  const state = await getAppState();
  return {
    ...state,
    course:
      state.academicYear.semesters.flatMap((semester) => semester.classes).find((course) => course.id === classId) ?? null
  };
}

export async function getQuestData(questId: string) {
  const state = await getAppState();
  const course = state.academicYear.semesters
    .flatMap((semester) => semester.classes)
    .find((candidate) => candidate.quests.some((quest) => quest.id === questId));
  const quest = course?.quests.find((candidate) => candidate.id === questId) ?? getQuest(questId) ?? null;

  return {
    ...state,
    course: course ?? null,
    quest
  };
}
