import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { getSupabaseEnv, hasSupabaseEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");
  const courseId = String(formData.get("courseId") || "");

  if (!(file instanceof File) || !courseId) {
    return NextResponse.json({ error: "file and courseId are required" }, { status: 400 });
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json({
      uploaded: false,
      mode: "local",
      fileName: file.name,
      message: "Supabase is not configured yet. File upload was skipped."
    });
  }

  const supabase = createSupabaseAdminClient();
  const authSupabase = await createSupabaseServerClient();

  if (!supabase || !authSupabase) {
    return NextResponse.json({ error: "Supabase client could not be created" }, { status: 500 });
  }

  const {
    data: { user }
  } = await authSupabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in before uploading files." }, { status: 401 });
  }

  const { bucket } = getSupabaseEnv();
  const extension = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const storagePath = `${courseId}/${randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from(bucket).upload(storagePath, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: false
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    uploaded: true,
    mode: "supabase",
    storagePath,
    fileName: file.name
  });
}
