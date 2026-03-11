import OpenAI from "openai";

import { getOpenAIEnv, hasOpenAIEnv } from "@/lib/env";
import { studyQuestPrompt, studyQuestSchema, StudyQuestPayload } from "@/lib/studyQuestSchema";
import { MaterialType } from "@/lib/types";

export async function generateQuestWithOpenAI(input: {
  courseTitle?: string;
  materialType: MaterialType;
  title: string;
  rawText: string;
}): Promise<StudyQuestPayload | null> {
  if (!hasOpenAIEnv()) {
    return null;
  }

  try {
    const { apiKey, model } = getOpenAIEnv();
    const client = new OpenAI({ apiKey });

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: studyQuestPrompt
        },
        {
          role: "user",
          content: JSON.stringify({
            courseTitle: input.courseTitle ?? "Unknown class",
            materialType: input.materialType,
            title: input.title,
            rawText: input.rawText
          })
        }
      ]
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return null;
    }

    return studyQuestSchema.parse(JSON.parse(content));
  } catch {
    return null;
  }
}
