export type MaterialType =
  | "syllabus"
  | "lecture_notes"
  | "transcript"
  | "study_guide"
  | "assignment";

export interface StudyCard {
  title: string;
  explanation: string;
  visualHint: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
}

export interface Mission {
  title: string;
  durationMin: number;
  xp: number;
  completed?: boolean;
}

export interface Material {
  id: string;
  courseId: string;
  type: MaterialType;
  title: string;
  rawText: string;
  uploadedAt: string;
}

export interface StudyQuest {
  id: string;
  courseId: string;
  materialId: string;
  topic: string;
  summary: string;
  cards: StudyCard[];
  quiz: QuizQuestion[];
  missions: Mission[];
  badge: string;
  xp: number;
  completed: boolean;
}

export interface Assessment {
  id: string;
  courseId: string;
  title: string;
  type: "quiz" | "exam" | "midterm" | "final" | "assignment";
  dueDate: string;
  topics: string[];
}

export interface CourseProgress {
  xp: number;
  completionRate: number;
  missionsCompleted: number;
  questsCompleted: number;
}

export interface Course {
  id: string;
  number?: number;
  title: string;
  professor: string;
  color: string;
  syllabus?: string;
  materials: Material[];
  quests: StudyQuest[];
  assessments: Assessment[];
  progress: CourseProgress;
}

export interface Semester {
  id: string;
  name: string;
  year: number;
  classes: Course[];
}

export interface Student {
  id: string;
  name: string;
  totalXp: number;
  streak: number;
  currentSemester: string;
  level: number;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  earned: boolean;
}

export interface AcademicYear {
  label: string;
  semesters: Semester[];
  archivedClasses: number;
}
