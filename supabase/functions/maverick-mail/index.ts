// =====================================================================
// "maverick-mail" Edge Function
//
// Emails a Maverick creator (maverick.dubuddy.in) when the team moves their
// video in tools.dubuddy.in → Maverick Admin. Sent from maverick@dubuddy.in,
// replies go back to it. Body: { submission_id, event } where event is
//   approved    review passed, publish it and add the link
//   rejected    not approved, with the reason
//   needs_info  the team asked a question
//   sent_back   the published link didn't pass, with the reason
//   verified    published link checked, base pay is due
//   base_paid   base pay released to their UPI ID
//   bonus_paid  view bonus released to their UPI ID
//
// Who may send: only the Maverick team (public.maverick_is_staff(), checked
// with the caller's own login), only to that video's creator, and only when
// the video really is in that state, so nothing can be sent out of turn.
// The same email for the same video is not sent twice within 10 minutes.
// Every attempt is logged in public.maverick_emails (the ✉️ Emails tab).
//
// Secrets (Supabase → Edge Functions → Secrets):
//   MAVERICK_SMTP_USER  maverick@dubuddy.in
//   MAVERICK_SMTP_PASS  its Zoho app password
//   MAVERICK_SMTP_HOST  optional, default smtp.zoho.in
//
// DEPLOY: name exactly  maverick-mail , "Verify JWT" ON.
// =====================================================================

import { createClient } from "npm:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE = "https://maverick.dubuddy.in";
const FROM_NAME = "Maverick by DU Buddy";
const BASE = 50;   // base pay per video, keep in step with lib/config.js

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}
function esc(v: unknown) { return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function money(n: unknown) { return "₹" + Number(n || 0).toLocaleString("en-IN"); }

async function sendMail(to: string, subject: string, text: string, html: string): Promise<string | null> {
  const user = Deno.env.get("MAVERICK_SMTP_USER"), pass = Deno.env.get("MAVERICK_SMTP_PASS");
  if (!user || !pass) return "email isn't set up (MAVERICK_SMTP_USER / MAVERICK_SMTP_PASS missing)";
  try {
    const mailer = nodemailer.createTransport({
      host: Deno.env.get("MAVERICK_SMTP_HOST") || "smtp.zoho.in", port: 465, secure: true, auth: { user, pass },
    });
    await mailer.sendMail({ from: FROM_NAME + " <" + user + ">", replyTo: user, to, subject, text, html });
    return null;
  } catch (e) { return (e as Error)?.message || String(e); }
}

type Mail = { subject: string; paras: string[]; note?: string; noteLabel?: string; button: string };

/* what each email says; v = the video, c = the creator, p = the payout (for *_paid) */
function compose(event: string, v: any, c: any, p: any): Mail | null {
  const title = "“" + (v.title || "your video") + "”";
  switch (event) {
    case "approved": return {
      subject: "Your Maverick video is approved 🎉",
      paras: ["Great news: " + title + " is approved!",
        "Publish it on your channel now, then open My videos on your dashboard and add the published link and your channel link. We check it, and " + money(BASE) + " base pay lands on your UPI ID within 7 days of publishing.",
        "Views over the next 30 days can earn you a bonus on top."],
      button: "Add my published link" };
    case "rejected": return {
      subject: "About your Maverick video " + title,
      paras: ["Thanks for sending " + title + ". We couldn't approve this one."],
      noteLabel: "Why", note: v.reviewer_note,
      button: "Open my dashboard" };
    case "needs_info": return {
      subject: "A quick question about " + title,
      paras: ["We're reviewing " + title + " and have a question before we can decide."],
      noteLabel: "Our question", note: v.reviewer_note,
      button: "Reply on my dashboard" };
    case "sent_back": return {
      subject: "Please fix the published link for " + title,
      paras: ["We checked the link you added for " + title + ", and it didn't pass yet."],
      noteLabel: "What to fix", note: v.reviewer_note,
      button: "Add the link again" };
    case "verified": return {
      subject: "Your published video is verified ✅",
      paras: ["We checked " + title + " and it's all good. ✅",
        money(p.amount || BASE) + " base pay is now due" + (v.published_at ? ", within 7 days of " + new Date(v.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "") + ", to " + (c.upi_id || "the UPI ID on your profile") + ".",
        "We count the views 30 days after publishing for your bonus."],
      button: "See my payouts" };
    case "base_paid": return {
      subject: money(p.amount) + " sent to your UPI 💸",
      paras: ["We've released " + money(p.amount) + " base pay for " + title + " to " + (p.upi_id || c.upi_id || "your UPI ID") + ".",
        "It shows in your payment history now. If it hasn't reached you in 2 days, reply to this email."],
      button: "See my payment history" };
    case "bonus_paid": return {
      subject: "Your view bonus is here: " + money(p.amount) + " 🚀",
      paras: [title + " did great" + (v.views_30d ? ": " + Number(v.views_30d).toLocaleString("en-IN") + " views in 30 days" : "") + "!",
        "We've released a " + money(p.amount) + " bonus to " + (p.upi_id || c.upi_id || "your UPI ID") + ". It shows in your payment history now."],
      button: "See my payment history" };
  }
  return null;
}

function render(m: Mail, name: string, link: string) {
  const text = "Hi " + name + ",\n\n" + m.paras.join("\n\n")
    + (m.note ? "\n\n" + (m.noteLabel || "Note") + ": " + m.note : "")
    + "\n\n" + m.button + ": " + link + "\n\nQuestions? Just reply to this email.\n\n— Team Maverick, DU Buddy";
  const html = '<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#0F0F0F;max-width:560px">'
    + '<div style="font-weight:800;font-size:19px;margin-bottom:16px">DU <span style="color:#F1684C">Buddy</span> · Maverick</div>'
    + "<p>Hi " + esc(name) + ",</p>"
    + m.paras.map((p) => "<p>" + esc(p) + "</p>").join("")
    + (m.note ? '<div style="background:#FDEFEA;border:2px solid #0F0F0F;border-radius:12px;padding:12px 14px;margin:14px 0"><b>' + esc(m.noteLabel || "Note") + '</b><br>' + esc(m.note).replace(/\n/g, "<br>") + "</div>" : "")
    + '<p style="margin:22px 0"><a href="' + esc(link) + '" style="background:#F1684C;color:#fff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:99px;border:2px solid #0F0F0F;display:inline-block">' + esc(m.button) + "</a></p>"
    + '<p>Questions? Just reply to this email.</p><p>— Team Maverick, DU Buddy</p>'
    + '<p style="color:#9A8F89;font-size:12.5px;margin-top:26px">You got this because you are a Maverick creator at maverick.dubuddy.in.</p></div>';
  return { text, html };
}

const EVENTS = ["approved", "rejected", "needs_info", "sent_back", "verified", "base_paid", "bonus_paid"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (token.split(".").length !== 3) return json({ error: "Sign in first." }, 401);
  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Bad request" }, 400); }
  const id = String(body?.submission_id || ""), event = String(body?.event || "");
  if (!id || !EVENTS.includes(event)) return json({ error: "Bad request" }, 400);

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const caller = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: "Bearer " + token } } });
  const { data: staff } = await caller.rpc("maverick_is_staff");
  if (!staff) return json({ sent: false, reason: "Only the Maverick team can send these emails." }, 403);
  const { data: who } = await admin.auth.getUser(token);

  const { data: v } = await admin.from("maverick_submissions").select("*").eq("id", id).maybeSingle();
  if (!v) return json({ sent: false, reason: "video not found" }, 404);
  const { data: c } = await admin.from("maverick_creators").select("full_name, email, upi_id").eq("id", v.creator_id).maybeSingle();
  const { data: pays } = await admin.from("maverick_payouts").select("*").eq("submission_id", id);
  const pay = (k: string) => (pays || []).find((x: any) => x.kind === k && x.status === "paid") || null;

  /* only what is true right now can be emailed */
  const ok = event === "approved" ? v.status === "approved" && !v.published_link
    : event === "sent_back" ? v.status === "approved" && !v.published_link && !!v.reviewer_note
    : event === "rejected" ? v.status === "rejected"
    : event === "needs_info" ? v.status === "needs_info"
    : event === "verified" ? v.status === "verified"
    : event === "base_paid" ? !!pay("base")
    : event === "bonus_paid" ? !!pay("bonus") : false;
  if (!ok) return json({ sent: false, reason: "the video isn't in that state" }, 409);

  const recent = await admin.from("maverick_emails").select("id").eq("submission_id", id).eq("kind", event).eq("status", "sent")
    .gte("created_at", new Date(Date.now() - 10 * 60 * 1000).toISOString()).limit(1);
  if ((recent.data || []).length) return json({ sent: false, reason: "already emailed in the last 10 minutes" });

  const base = (pays || []).find((x: any) => x.kind === "base") || null;
  const m = compose(event, v, c || {}, (event === "bonus_paid" ? pay("bonus") : event === "verified" ? base : pay("base")) || {});
  const to = (c && c.email) || "";
  const log = (status: string, error: string | null) => admin.from("maverick_emails").insert({
    submission_id: id, creator_id: v.creator_id, kind: event, to_email: to || null, subject: m ? m.subject : null,
    status, error, sent_by: who?.user?.id || null,
  });
  if (!m) return json({ sent: false, reason: "no template" }, 500);
  if (!to) { await log("skipped", "the creator has no email on their profile"); return json({ sent: false, reason: "the creator has no email on their profile" }); }

  const link = SITE + (["base_paid", "bonus_paid", "verified"].includes(event) ? "/dashboard/payouts" : "/dashboard/videos/" + id);
  const name = String(c?.full_name || "").split(" ")[0] || "there";
  const r = render(m, name, link);
  const err = await sendMail(to, m.subject, r.text, r.html);
  await log(err ? "failed" : "sent", err);
  return json(err ? { sent: false, reason: err } : { sent: true, to });
});
