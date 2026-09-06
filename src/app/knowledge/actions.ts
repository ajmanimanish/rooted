"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { tagItem, readGroupIds, readVisibility } from "@/lib/items";
import { redirect } from "next/navigation";

export async function createQuestion(formData: FormData) {
  const supabase = await createClient();
  const user = await requireUser(supabase);

  const title = String(formData.get("title") ?? "").trim();
  const topic = String(formData.get("topic") ?? "").trim() || null;
  const format = String(formData.get("format") ?? "poll") === "deep_answer" ? "deep_answer" : "poll";
  const options = [1, 2, 3, 4, 5]
    .map((i) => String(formData.get(`option_${i}`) ?? "").trim())
    .filter(Boolean);

  if (!title) return;
  if (format === "poll" && options.length < 2) return;

  const { data: question, error } = await supabase
    .from("questions")
    .insert({ author_id: user.id, title, topic, format, visibility: readVisibility(formData) })
    .select("id")
    .single();

  if (error || !question) return;

  if (format === "poll") {
    await supabase
      .from("question_options")
      .insert(options.map((label) => ({ question_id: question.id, label })));
  }

  await tagItem(supabase, "question", question.id, readGroupIds(formData));
  redirect(`/knowledge/${question.id}`);
}

export async function postDeepAnswer(formData: FormData) {
  const supabase = await createClient();
  const user = await requireUser(supabase);

  const questionId = String(formData.get("question_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!questionId || !body) return;

  await supabase.from("deep_answers").insert({ question_id: questionId, author_id: user.id, body });
  redirect(`/knowledge/${questionId}`);
}

export async function markAnswerHelpful(formData: FormData) {
  const supabase = await createClient();
  await requireUser(supabase);

  const answerId = String(formData.get("answer_id") ?? "");
  const questionId = String(formData.get("question_id") ?? "");
  if (!answerId) return;

  const { data: answer } = await supabase
    .from("deep_answers")
    .select("helpful_count")
    .eq("id", answerId)
    .maybeSingle();

  await supabase
    .from("deep_answers")
    .update({ helpful_count: (answer?.helpful_count ?? 0) + 1 })
    .eq("id", answerId);

  redirect(`/knowledge/${questionId}`);
}

export async function voteOnQuestion(formData: FormData) {
  const supabase = await createClient();
  const user = await requireUser(supabase);

  const questionId = String(formData.get("question_id") ?? "");
  const optionId = String(formData.get("option_id") ?? "");
  const tip = String(formData.get("tip") ?? "").trim() || null;
  if (!optionId) return;

  await supabase
    .from("votes")
    .upsert({ option_id: optionId, voter_id: user.id, tip }, { onConflict: "option_id,voter_id" });

  redirect(`/knowledge/${questionId}`);
}
