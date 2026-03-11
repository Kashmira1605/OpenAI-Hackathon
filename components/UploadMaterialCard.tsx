"use client";

import { useState, useTransition } from "react";
import { LoaderCircle, Sparkles, Upload } from "lucide-react";
import Link from "next/link";

import { readSupportedFileText } from "@/lib/browserFileText";
import { MaterialType, StudyQuest } from "@/lib/types";

const materialTypes: MaterialType[] = ["syllabus", "lecture_notes", "transcript", "study_guide", "assignment"];

type GeneratedQuestResponse = StudyQuest & {
  generationMode?: "openai" | "fallback";
  persisted?: boolean;
};

export function UploadMaterialCard({
  courseId,
  courseTitle,
  initialType = "lecture_notes",
  headline = "Upload or paste class material",
  subcopy = "This is different from the sprint planner: the planner decides when to study, this section creates what you will study."
}: {
  courseId: string;
  courseTitle: string;
  initialType?: MaterialType;
  headline?: string;
  subcopy?: string;
}) {
  const [title, setTitle] = useState("");
  const [rawText, setRawText] = useState("");
  const [type, setType] = useState<MaterialType>(initialType);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<GeneratedQuestResponse | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const canGenerate = rawText.trim().length >= 20 || Boolean(file);

  const onGenerate = () => {
    startTransition(async () => {
      setStatus(null);
      let storagePath: string | undefined;
      let generatedRawText = rawText.trim();

      if (file) {
        const extracted = await readSupportedFileText(file);

        if (!generatedRawText && extracted.text) {
          generatedRawText = extracted.text.trim();
          setRawText(extracted.text);
        }

        if (!generatedRawText && !extracted.text) {
          setStatus(extracted.message);
          return;
        }

        const uploadFormData = new FormData();
        uploadFormData.append("courseId", courseId);
        uploadFormData.append("file", file);

        const uploadResponse = await fetch("/api/materials/upload", {
          method: "POST",
          body: uploadFormData
        });

        const uploadData = (await uploadResponse.json()) as {
          error?: string;
          mode?: "supabase" | "local";
          uploaded?: boolean;
          storagePath?: string;
          message?: string;
        };

        if (!uploadResponse.ok) {
          setStatus(uploadData.error || "File upload failed.");
          return;
        }

        storagePath = uploadData.storagePath;

        if (uploadData.message) {
          setStatus(uploadData.message);
        } else if (uploadData.uploaded) {
          setStatus("File uploaded to Supabase Storage.");
        }
      }

      if (generatedRawText.length < 20) {
        setStatus("Add a little more note content so Study Quest has enough material to build a quest.");
        return;
      }

      const response = await fetch("/api/generate-quest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          courseTitle,
          title: title || "New study item",
          rawText: generatedRawText,
          materialType: type,
          storagePath
        })
      });

      const data = (await response.json()) as GeneratedQuestResponse & { error?: string };

      if (!response.ok) {
        setStatus(data.error || "Quest generation failed.");
        return;
      }

      setPreview(data);
      setStatus(
        data.generationMode === "openai"
          ? `Quest generated with OpenAI${data.persisted ? " and saved to Supabase." : "."}`
          : `Quest generated with the local fallback${data.persisted ? " and saved to Supabase." : "."}`
      );
    });
  };

  return (
    <div className="grid gap-5 rounded-[2rem] border border-black/5 bg-cream p-6 shadow-card">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-sand p-3 text-ember">
          <Upload className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-ink">{headline}</h2>
          <p className="text-sm text-black/55">{subcopy}</p>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[0.8fr_1.2fr]">
        <label className="grid gap-2 text-sm font-medium text-black/70">
          Material type
          <select
            value={type}
            onChange={(event) => setType(event.target.value as MaterialType)}
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none ring-0"
          >
            {materialTypes.map((option) => (
              <option key={option} value={option}>
                {option.replace("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium text-black/70">
          Title
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Week 3 lecture notes"
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none"
          />
        </label>
      </div>

      <label className="grid gap-2 text-sm font-medium text-black/70">
        Notes, transcript, or syllabus text
        <textarea
          value={rawText}
          onChange={(event) => setRawText(event.target.value)}
          rows={6}
          placeholder="Paste class material here. The app will convert it into a summary, cards, quiz prompts, and short missions."
          className="rounded-[1.5rem] border border-black/10 bg-white px-4 py-3 outline-none"
        />
        <div className="text-xs text-black/45">
          {rawText.trim().length} characters
          {rawText.trim().length < 20 ? " · add a little more text to generate a quest" : " · enough text to generate"}
        </div>
      </label>

      <label className="grid gap-2 text-sm font-medium text-black/70">
        Optional source file
        <input
          type="file"
          onChange={async (event) => {
            const nextFile = event.target.files?.[0] ?? null;
            setFile(nextFile);

            if (!nextFile) {
              return;
            }

            const extracted = await readSupportedFileText(nextFile);

            if (extracted.text && !rawText.trim()) {
              setRawText(extracted.text);
              setStatus("Text was pulled from the file. You can edit it before generating the quest.");
              return;
            }

            if (extracted.message) {
              setStatus(extracted.message);
            }
          }}
          className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
        />
      </label>

      <button
        type="button"
        onClick={onGenerate}
        disabled={isPending || !canGenerate}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-ember px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-black/15"
      >
        {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {rawText.trim().length >= 20 ? "Generate quest from notes" : "Generate quest preview"}
      </button>

      {status ? <p className="text-sm text-black/60">{status}</p> : null}

      {preview ? (
        <div className="rounded-[1.75rem] bg-sand p-5">
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-black/45">Instant preview</div>
          <h3 className="text-xl font-semibold text-ink">{preview.topic}</h3>
          <p className="mt-2 text-sm leading-6 text-black/60">{preview.summary}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-3xl bg-white/90 p-4 text-sm">
              <p className="font-semibold text-ink">Cards</p>
              <p className="mt-1 text-black/55">{preview.cards.length} quick visual prompts</p>
            </div>
            <div className="rounded-3xl bg-white/90 p-4 text-sm">
              <p className="font-semibold text-ink">Quiz</p>
              <p className="mt-1 text-black/55">{preview.quiz.length} low-pressure checks</p>
            </div>
            <div className="rounded-3xl bg-white/90 p-4 text-sm">
              <p className="font-semibold text-ink">Reward</p>
              <p className="mt-1 text-black/55">
                {preview.badge} + {preview.xp} XP
              </p>
            </div>
          </div>
          {preview.persisted ? (
            <Link
              href={`/quest/${preview.id}`}
              className="mt-4 inline-flex rounded-full bg-ember px-4 py-3 text-sm font-semibold text-white transition hover:bg-emberDark"
            >
              Open playable quest
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
