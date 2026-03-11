import { MaterialType, StudyQuest } from "@/lib/types";

const materialTopicMap: Record<MaterialType, string> = {
  syllabus: "Course map",
  lecture_notes: "Lecture focus",
  transcript: "Key concepts",
  study_guide: "Exam prep",
  assignment: "Assignment strategy"
};

const badgePool = [
  "Momentum Spark",
  "Focus Finder",
  "Pattern Hunter",
  "Recall Ranger",
  "Calm Crasher"
];

const sentenceChunks = (text: string) =>
  text
    .replace(/\s+/g, " ")
    .split(/[.!?]/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

export function buildQuestFromMaterial(input: {
  courseId: string;
  materialId: string;
  materialType: MaterialType;
  title: string;
  rawText: string;
}): Omit<StudyQuest, "id" | "completed"> {
  const parts = sentenceChunks(input.rawText);
  const seed = parts[0] ?? input.title;
  const summary = parts.slice(0, 2).join(". ") || `Review ${input.title} in a few short passes.`;
  const topic = `${materialTopicMap[input.materialType]}: ${input.title}`;
  const cards = Array.from({ length: 5 }).map((_, index) => ({
    title: `${input.title} card ${index + 1}`,
    explanation:
      parts[index] ??
      `Break ${input.title} into one concrete idea you can explain out loud in under 30 seconds.`,
    visualHint: [
      "Use arrows to show cause and effect.",
      "Draw a timeline with 3 checkpoints.",
      "Circle the term that unlocks the rest.",
      "Sketch a compare vs contrast box.",
      "Highlight the one idea most likely to show up again."
    ][index]
  }));

  const quiz = Array.from({ length: 3 }).map((_, index) => {
    const prompt = parts[index] ?? seed;
    const correct = `Best answer about ${prompt.slice(0, 36)}`;
    return {
      question: `Which idea best matches this section of ${input.title}?`,
      options: [
        correct,
        "A detail from a different chapter",
        "An unrelated example",
        "A distractor with similar wording"
      ],
      answer: correct
    };
  });

  const missions = [
    { title: `Read the summary for ${input.title}`, durationMin: 5, xp: 10 },
    { title: `Flip through 3 cards and say each one aloud`, durationMin: 7, xp: 15 },
    { title: `Answer the mini quiz without notes`, durationMin: 8, xp: 20 }
  ];

  return {
    courseId: input.courseId,
    materialId: input.materialId,
    topic,
    summary,
    cards,
    quiz,
    missions,
    badge: badgePool[(input.title.length + input.rawText.length) % badgePool.length],
    xp: 50
  };
}
