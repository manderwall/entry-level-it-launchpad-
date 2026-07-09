// Computes a single, concrete "do this next" recommendation from the
// visitor's own saved progress/tracker state. The single biggest reason
// people give up on a job search isn't lack of information, it's not
// knowing what to do today — this collapses the whole site into one
// action instead of ten open tabs. Reads the same localStorage keys
// progress.mjs and plan-tracker.mjs already own; no import coupling
// needed since this only ever reads, never writes, those keys.
import { getSettings } from "./settings.mjs";

const PROGRESS_KEY = "entry-level-it-launchpad:progress";
const TRACKER_KEY = "entry-level-it-launchpad:tracker-rows";
const WEEKLY_GOAL = 40; // matches data/weekly-tracker-schema.json's low end

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore corrupt storage
  }
  return fallback;
}

function startOfWeek() {
  const d = new Date();
  const day = d.getDay(); // 0 = Sunday
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d;
}

export function computeNextStep() {
  const progress = readJSON(PROGRESS_KEY, {});
  const rows = readJSON(TRACKER_KEY, []).filter((r) => r.company || r.role);

  const dueFollowUps = rows.filter((r) => {
    if (!r.followUpDate) return false;
    const today = new Date().toISOString().slice(0, 10);
    return r.followUpDate <= today && !["Rejected", "Withdrawn"].includes(r.status);
  });
  if (dueFollowUps.length) {
    return {
      text: `You have ${dueFollowUps.length} follow-up${dueFollowUps.length > 1 ? "s" : ""} due. Do these before anything else — they take minutes and keep you in the running.`,
      href: "plan-tracker.html",
      label: "Go to your tracker",
    };
  }

  // Checks the real setting, not just the manually-ticked checklist item —
  // someone who actually opens Settings and sets their city has done the
  // real thing, even if they never separately tick the checklist box for
  // it. Relying only on the checklist flag here caused this to nag people
  // to do something they'd already done.
  if (!getSettings().city) {
    return {
      text: "Start here: set your pay floor and city in Settings, so every page on this site is tailored to you.",
      href: "index.html",
      label: "Open Settings (⚙ in the header)",
    };
  }
  if (!progress["pick-roles"]) {
    return {
      text: "Pick your 2 primary target roles and 1 backup — this takes 5 minutes and focuses everything else you do.",
      href: "roles.html",
      label: "Pick your target roles",
    };
  }
  if (!progress["set-alerts"]) {
    return {
      text: "Set up 2-3 job search alerts so new postings come to you instead of needing a fresh search every day.",
      href: "search-toolkit.html",
      label: "Set up your alerts",
    };
  }

  if (!rows.length) {
    return {
      text: "Log your first application in the tracker — even one row starts building momentum you can see.",
      href: "search-toolkit.html",
      label: "Find something to apply to",
    };
  }

  const weekStart = startOfWeek().toISOString().slice(0, 10);
  const thisWeekCount = rows.filter((r) => r.date && r.date >= weekStart).length;
  if (thisWeekCount < WEEKLY_GOAL) {
    return {
      text: `You're at ${thisWeekCount}/${WEEKLY_GOAL} applications this week. That's a floor to aim for, not a pass/fail test — even a few more today keeps things moving.`,
      href: "search-toolkit.html",
      label: "Find more roles to apply to",
    };
  }

  return {
    text: "You're on pace this week. While you wait to hear back, strengthen your materials for the next round.",
    href: "story-bank.html",
    label: "Add a STAR story or practice your pitch",
  };
}
