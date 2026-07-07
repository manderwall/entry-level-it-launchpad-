import { renderChrome, escapeHtml, wireCopyButtons } from "./common.mjs";

renderChrome("resume.html");

function copyBlock(text) {
  return `<button class="copy-btn" data-copy="${escapeHtml(text)}">Copy</button>`;
}

const HEADLINE = "CompTIA A+ Certified Technical Support Candidate | Per Scholas Graduate | Remote Customer Service Experience";
const SUMMARY = "CompTIA A+ certified IT support candidate trained through Per Scholas, with remote customer service experience and a foundation in hardware, Windows, networking basics, troubleshooting, ticketing, and user support. Known for clear communication, patience with non-technical users, accurate documentation, and calm escalation handling.";
const SKILLS = ["CompTIA A+", "Windows 10/11", "Hardware troubleshooting", "Software troubleshooting", "Password resets / account support", "Remote desktop support", "Ticketing systems", "Customer service", "Phone, chat, and email support", "Basic networking: IP, DNS, DHCP, Wi-Fi, VPN", "Microsoft 365 / Outlook / Teams", "Documentation", "Escalation and incident notes"];

const CS_BULLETS = [
  "Supported customers remotely through phone, chat, and email while maintaining quality and response-time standards.",
  "Documented issues, troubleshooting steps, and resolutions accurately in internal systems.",
  "De-escalated frustrated users and guided them through step-by-step problem resolution.",
  "Identified recurring issues and escalated complex cases to the appropriate team.",
  "Maintained professionalism and clear communication in a remote work environment.",
];
const TRAINING_BULLETS = [
  "Completed Per Scholas IT Support training focused on hardware, operating systems, networking basics, troubleshooting, and professional support workflows.",
  "Earned CompTIA A+ certification validating entry-level IT support, hardware, software, security, networking, and operational procedures.",
  "Practiced structured troubleshooting, documentation, and escalation for common end-user support issues.",
];

const ROLE_BULLETS = [
  { role: "Remote Technical Support / Help Desk", bullets: [
    "Resolved hardware, software, and connectivity issues remotely by phone, chat, and email while meeting response-time and quality standards.",
    "Documented troubleshooting steps and resolutions clearly in ticketing systems for accurate handoff and escalation.",
  ], opening: "I'm excited to apply for the [Role] position — as a CompTIA A+ certified Per Scholas graduate with remote customer service experience, I'm ready to bring troubleshooting, documentation, and calm user support to your help desk team." },
  { role: "SaaS / Product Support Specialist", bullets: [
    "Guided non-technical users through product features and account issues via chat and email, translating technical steps into plain language.",
    "Tracked recurring product issues and escalated patterns to technical teams, supporting faster fixes for other users.",
  ], opening: "I'm excited to apply for the [Role] position — I bring CompTIA A+ certified troubleshooting skills together with remote customer service experience, so I'm comfortable guiding users through product issues via chat and email while documenting patterns for the product team." },
  { role: "Application Support Analyst", bullets: [
    "Supported end users with application access, login, and functionality issues, escalating configuration or system-level problems appropriately.",
    "Practiced documenting application issues with enough technical detail for a support or engineering team to reproduce and resolve them.",
  ], opening: "I'm excited to apply for the [Role] position — my CompTIA A+ background and remote customer service experience have prepared me to support end users with application issues while documenting details clearly enough for escalation to engineering." },
  { role: "IT Asset Coordinator", bullets: [
    "Practiced accurate documentation and record-keeping for equipment, licenses, and account access as part of ticketing and Active Directory lab work.",
    "Comfortable with process-driven, detail-focused work such as tracking assignments, renewals, and inventory status.",
  ], opening: "I'm excited to apply for the [Role] position — I bring a detail-focused, process-driven approach from both my Per Scholas training and remote customer service work, and I'm comfortable with the accurate record-keeping this role requires." },
];

const LI_HEADLINE = "CompTIA A+ Certified | Per Scholas Graduate | Remote Customer Service | Entry-Level IT Support";
const LI_ABOUT = "CompTIA A+ certified IT support professional and Per Scholas graduate with a background in remote customer service. I help users solve hardware, software, account, and connectivity issues while staying calm, clear, and patient. My strengths are troubleshooting, documentation, and knowing when to escalate. I'm building hands-on experience through home-lab projects (Windows, Microsoft 365, Active Directory, and basic networking) and I'm looking for an entry-level help desk, technical support, or product support role — remote, hybrid, or local. Open to contract-to-hire.";

const COVER_LETTER = `Dear Hiring Team,

I'm excited to apply for the [Role] position at [Company]. I'm CompTIA A+ certified through Per Scholas and bring remote customer service experience, so I'm comfortable supporting users by phone, chat, and email while documenting issues clearly and escalating when needed.

In my customer service work, I resolved problems under time and quality standards, de-escalated frustrated users, and kept accurate notes — the same skills that make a strong help desk technician. I've also built hands-on practice through home-lab projects in Windows, Microsoft 365, Active Directory, and basic networking.

I'd welcome the chance to bring my troubleshooting foundation and customer-first approach to your team. Thank you for your time and consideration.

Sincerely, [Your Name] — [Phone] • [Email] • [LinkedIn]`;

const MESSAGE_TEMPLATES = [
  { title: "Recruiter message", text: "Hi [Name], I'm a Per Scholas graduate and CompTIA A+ certified. I also have remote customer service experience, so I'm comfortable supporting users by phone, chat, and email while documenting issues clearly. I'm looking for entry-level help desk, technical support, product support, or IT support roles around $20-$25/hr. Do you have any contract-to-hire or entry-level support roles where A+ and customer service would be a good fit?" },
  { title: "Per Scholas alumni message", text: "Hi [Name], I'm also connected to Per Scholas and recently earned A+. I'm looking for my first technical support/help desk role and have remote customer service experience. Would you be open to sharing where you found your first tech role or which employers were most open to new A+ grads?" },
  { title: "Follow-up after applying", text: "Hi [Name], I applied for the [Role] position and wanted to briefly introduce myself. I'm CompTIA A+ certified through Per Scholas and bring remote customer service experience, ticket documentation, and user-support skills. I'm especially interested in this role because it combines technical troubleshooting with customer support. Thank you for your consideration." },
];

document.getElementById("headline").innerHTML = `${escapeHtml(HEADLINE)} ${copyBlock(HEADLINE)}`;
document.getElementById("summary").innerHTML = `${escapeHtml(SUMMARY)} ${copyBlock(SUMMARY)}`;
document.getElementById("skills").innerHTML = SKILLS.map((s) => `<span class="pill">${escapeHtml(s)}</span>`).join(" ");
document.getElementById("cs-bullets").innerHTML = CS_BULLETS.map((b) => `<li>${escapeHtml(b)} ${copyBlock(b)}</li>`).join("");
document.getElementById("training-bullets").innerHTML = TRAINING_BULLETS.map((b) => `<li>${escapeHtml(b)} ${copyBlock(b)}</li>`).join("");

document.getElementById("role-bullets").innerHTML = ROLE_BULLETS.map((r) => `
  <div class="card">
    <h3>${escapeHtml(r.role)}</h3>
    <ul>${r.bullets.map((b) => `<li>${escapeHtml(b)} ${copyBlock(b)}</li>`).join("")}</ul>
  </div>`).join("");

document.getElementById("li-headline").innerHTML = `${escapeHtml(LI_HEADLINE)} ${copyBlock(LI_HEADLINE)}`;
document.getElementById("li-about").innerHTML = `${escapeHtml(LI_ABOUT)} ${copyBlock(LI_ABOUT)}`;
document.getElementById("cover-letter").innerHTML = `${escapeHtml(COVER_LETTER)}<br>${copyBlock(COVER_LETTER)}`;

document.getElementById("opening-swaps").innerHTML = ROLE_BULLETS.map((r) => `
  <div class="card"><h3>${escapeHtml(r.role)}</h3><p>${escapeHtml(r.opening)} ${copyBlock(r.opening)}</p></div>`).join("");

document.getElementById("message-templates").innerHTML = MESSAGE_TEMPLATES.map((m) => `
  <div class="card"><h3>${escapeHtml(m.title)}</h3><p>${escapeHtml(m.text)} ${copyBlock(m.text)}</p></div>`).join("");

wireCopyButtons();
