import { Assessment, Course } from "@/lib/types";

export function daysUntilDate(dateString: string) {
  const now = new Date();
  const target = new Date(dateString);
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function getNearestAssessment(course: Course): Assessment | undefined {
  return [...course.assessments]
    .filter((assessment) => new Date(assessment.dueDate).getTime() >= new Date().setHours(0, 0, 0, 0))
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate))[0];
}

export function getAssessmentLabel(course: Course) {
  const next = getNearestAssessment(course);

  if (!next) {
    return {
      title: "General review mode",
      countdown: null,
      subtitle: "No assessment scheduled yet"
    };
  }

  return {
    title: next.title,
    countdown: daysUntilDate(next.dueDate),
    subtitle: `${next.type} · ${next.dueDate}`
  };
}
