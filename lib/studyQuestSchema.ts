import { z } from "zod";

export const studyQuestSchema = z.object({
  topic: z.string(),
  summary: z.string(),
  cards: z.array(
    z.object({
      title: z.string(),
      explanation: z.string(),
      visualHint: z.string()
    })
  ),
  quiz: z.array(
    z.object({
      question: z.string(),
      options: z.array(z.string()).length(4),
      answer: z.string()
    })
  ),
  missions: z.array(
    z.object({
      title: z.string(),
      durationMin: z.number().int().positive(),
      xp: z.number().int().nonnegative()
    })
  ),
  badge: z.string(),
  xp: z.number().int().nonnegative()
});

export type StudyQuestPayload = z.infer<typeof studyQuestSchema>;

export const studyQuestPrompt = `You are an ADHD-friendly study coach for college students.

A student is taking multiple classes in a semester. They upload study materials for a specific class, such as lecture notes, a syllabus, or a transcript.

Convert the uploaded material into a gamified study quest.

Return valid JSON only in this format:
{
  "topic": "string",
  "summary": "string",
  "cards": [
    {
      "title": "string",
      "explanation": "string",
      "visualHint": "string"
    }
  ],
  "quiz": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "answer": "string"
    }
  ],
  "missions": [
    {
      "title": "string",
      "durationMin": 5,
      "xp": 10
    }
  ],
  "badge": "string",
  "xp": 50
}

Rules:
- Make the content simple, visual, and encouraging
- Break ideas into small digestible study pieces
- Keep mission tasks short and easy to start
- Make the missions feel ADHD-friendly and not overwhelming
- Assume the material belongs to one class within a semester system
- Return valid JSON only`;
