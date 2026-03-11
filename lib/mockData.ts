import { AcademicYear, Assessment, Badge, Course, Material, Semester, Student, StudyQuest } from "@/lib/types";
import { buildQuestFromMaterial } from "@/lib/questParser";

const materials: Material[] = [
  {
    id: "bio-notes-1",
    courseId: "biology-101",
    type: "lecture_notes",
    title: "Cell respiration foundations",
    rawText:
      "Cellular respiration converts glucose into ATP. Glycolysis happens in the cytoplasm. The Krebs cycle and electron transport chain depend on oxygen and occur in the mitochondria.",
    uploadedAt: "2026-09-03"
  },
  {
    id: "mkt-syllabus",
    courseId: "marketing-320",
    type: "syllabus",
    title: "Campaign strategy syllabus",
    rawText:
      "The course focuses on segmentation, positioning, and campaign planning. Students complete a case study, build a launch brief, and prepare a final pitch.",
    uploadedAt: "2026-08-28"
  },
  {
    id: "psy-transcript",
    courseId: "psych-110",
    type: "transcript",
    title: "Memory systems lecture transcript",
    rawText:
      "Sensory memory holds input very briefly before attention moves it into working memory. Rehearsal and chunking support encoding into long-term memory.",
    uploadedAt: "2026-09-05"
  },
  {
    id: "stats-guide",
    courseId: "stats-210",
    type: "study_guide",
    title: "Probability exam guide",
    rawText:
      "Probability measures uncertainty on a scale from zero to one. Independent events multiply, while conditional probability updates based on new information.",
    uploadedAt: "2026-09-07"
  }
];

const quests: StudyQuest[] = materials.map((material, index) => ({
  ...buildQuestFromMaterial({
    courseId: material.courseId,
    materialId: material.id,
    materialType: material.type,
    title: material.title,
    rawText: material.rawText
  }),
  id: `quest-${index + 1}`,
  completed: index === 0
}));

const assessments: Assessment[] = [
  {
    id: "bio-midterm-1",
    courseId: "biology-101",
    title: "Midterm 1",
    type: "midterm",
    dueDate: "2026-10-18",
    topics: ["Cell structure", "Nucleus", "Mitosis"]
  },
  {
    id: "mkt-quiz-1",
    courseId: "marketing-320",
    title: "Case study quiz",
    type: "quiz",
    dueDate: "2026-10-21",
    topics: ["MVP framing", "User validation", "Launch assumptions"]
  },
  {
    id: "psych-exam-1",
    courseId: "psych-110",
    title: "Memory systems exam",
    type: "exam",
    dueDate: "2026-10-24",
    topics: ["Sensory memory", "Working memory", "Encoding"]
  },
  {
    id: "stats-midterm",
    courseId: "stats-210",
    title: "Probability midterm",
    type: "midterm",
    dueDate: "2026-10-16",
    topics: ["Independent events", "Conditional probability", "Distributions"]
  }
];

const courseBase: Array<Omit<Course, "materials" | "quests" | "progress">> = [
  { id: "biology-101", number: 1, title: "Biology 101", professor: "Dr. Rivera", color: "#C65D27", syllabus: "Weeks 1-4: Cells and energy systems.", assessments: assessments.filter((item) => item.courseId === "biology-101") },
  { id: "marketing-320", number: 2, title: "Marketing 320", professor: "Prof. Patel", color: "#D98B4F", syllabus: "Brand strategy, customer research, and launch planning.", assessments: assessments.filter((item) => item.courseId === "marketing-320") },
  { id: "psych-110", number: 3, title: "Intro to Psychology", professor: "Dr. Nguyen", color: "#5B6C4F", syllabus: "Memory, cognition, development, and behavior.", assessments: assessments.filter((item) => item.courseId === "psych-110") },
  { id: "stats-210", number: 4, title: "Statistics", professor: "Prof. Ellis", color: "#7A8E6B", syllabus: "Descriptive stats, probability, inference, and testing.", assessments: assessments.filter((item) => item.courseId === "stats-210") }
];

export const currentSemester: Semester = {
  id: "fall-2026",
  name: "Fall",
  year: 2026,
  classes: courseBase.map((course, index) => {
    const courseMaterials = materials.filter((material) => material.courseId === course.id);
    const courseQuests = quests.filter((quest) => quest.courseId === course.id);
    const totalMissionCount = courseQuests.reduce((sum, quest) => sum + quest.missions.length, 0);
    const completedMissionCount = courseQuests.reduce(
      (sum, quest) => sum + quest.missions.filter((mission) => mission.completed).length,
      0
    );

    return {
      ...course,
      materials: courseMaterials,
      quests: courseQuests,
      progress: {
        xp: 120 + index * 35,
        completionRate: [74, 48, 63, 39][index],
        missionsCompleted: completedMissionCount + index + 2,
        questsCompleted: courseQuests.filter((quest) => quest.completed).length,
      }
    };
  })
};

export const springSemester: Semester = {
  id: "spring-2027",
  name: "Spring",
  year: 2027,
  classes: [
    {
      id: "econ-201",
      number: 1,
      title: "Economics 201",
      professor: "Prof. James",
      color: "#A14C25",
      syllabus: "Market structures and macro indicators.",
      materials: [],
      quests: [],
      assessments: [],
      progress: { xp: 0, completionRate: 0, missionsCompleted: 0, questsCompleted: 0 }
    }
  ]
};

export const student: Student = {
  id: "student-1",
  name: "Maya",
  totalXp: 1280,
  streak: 9,
  currentSemester: currentSemester.id,
  level: 7
};

export const badges: Badge[] = [
  { id: "badge-1", title: "Week Starter", description: "Completed your first mission of the week.", earned: true },
  { id: "badge-2", title: "Three-Day Flow", description: "Kept a 3 day focus streak alive.", earned: true },
  { id: "badge-3", title: "Cross-Class Hero", description: "Worked in three different classes this week.", earned: true },
  { id: "badge-4", title: "Syllabus Scout", description: "Turned a syllabus into a quest plan.", earned: false }
];

export const academicYear: AcademicYear = {
  label: "2026-2027",
  semesters: [currentSemester, springSemester],
  archivedClasses: 4
};

export function getSemester(semesterId: string) {
  return academicYear.semesters.find((semester) => semester.id === semesterId);
}

export function getCourse(classId: string) {
  return currentSemester.classes.find((course) => course.id === classId);
}

export function getQuest(questId: string) {
  return quests.find((quest) => quest.id === questId);
}

export function getNextAction() {
  const nextCourse = [...currentSemester.classes].sort(
    (left, right) => left.progress.completionRate - right.progress.completionRate
  )[0];
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

export function getRecentUploads() {
  return [...materials].sort((left, right) => right.uploadedAt.localeCompare(left.uploadedAt));
}

export function getUpcomingMissions() {
  return currentSemester.classes.flatMap((course) =>
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
