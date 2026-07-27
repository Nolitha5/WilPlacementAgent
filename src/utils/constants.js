/**
 * src/utils/constants.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Application-wide constants: status definitions, navigation config, colour
 * maps, curated job listings, job boards and news seeds.
 *
 * To add a new role portal, extend NAV and THEME below.
 * To add more curated listings, push to CURATED_SA.
 */

// ── Application status definitions ───────────────────────────────────────────
export const STATUS = {
  pending:   { label: "Pending",             bg: "bg-amber-100", text: "text-amber-800", dot: "bg-amber-400" },
  interview: { label: "Interview Scheduled", bg: "bg-blue-100",  text: "text-blue-800",  dot: "bg-blue-500"  },
  declined:  { label: "Declined",            bg: "bg-red-100",   text: "text-red-700",   dot: "bg-red-500"   },
};

// ── Sidebar navigation per role ───────────────────────────────────────────────
// Icons are injected by Sidebar.jsx after importing Ico.
export const NAV_KEYS = {
  admin:    [
    { id: "dashboard",   label: "Dashboard"         },
    { id: "employers",   label: "Manage Employers"  },
    { id: "matching",    label: "WIL Matching"      },
  ],
  student:  [
    { id: "dashboard",    label: "Dashboard"             },
    { id: "internships",  label: "Available Internships" },
    { id: "opportunities",label: "Opportunities"         },
    { id: "applications", label: "My Applications"       },
  ],
  employer: [
    { id: "dashboard",  label: "Dashboard"      },
    { id: "post",       label: "Add Internship" },
    { id: "listings",   label: "My Internships" },
    { id: "applicants", label: "View Applicants"},
  ],
};

// ── Sidebar colour themes per role ────────────────────────────────────────────
export const THEME = {
  admin:    { from: "from-slate-800",   accent: "bg-slate-600",   ring: "bg-slate-500"   },
  student:  { from: "from-indigo-900",  accent: "bg-indigo-600",  ring: "bg-indigo-500"  },
  employer: { from: "from-emerald-900", accent: "bg-emerald-600", ring: "bg-emerald-500" },
};

// ── Reusable Tailwind input class ─────────────────────────────────────────────
export const inputCls =
  "w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

// ── Opportunities page ────────────────────────────────────────────────────────
export const CATEGORIES = ["All", "Internship", "WIL", "Graduate", "Junior", "Entry Level"];

export const CATEGORY_COLORS = {
  Internship:   { bg: "bg-indigo-100",  text: "text-indigo-800"  },
  WIL:          { bg: "bg-purple-100",  text: "text-purple-800"  },
  Graduate:     { bg: "bg-emerald-100", text: "text-emerald-800" },
  Junior:       { bg: "bg-blue-100",    text: "text-blue-800"    },
  "Entry Level":{ bg: "bg-amber-100",   text: "text-amber-800"   },
};

// Curated SA opportunities (shown even without an API key)
export const CURATED_SA = [
  { id:"c1",  title:"Software Engineer Intern",         company:"Absa Group",       location:"Johannesburg, Gauteng", type:"Internship",  duration:"12 months", logo:"🏦", url:"https://careers.absa.africa/jobs" },
  { id:"c2",  title:"Graduate Programme – Technology",  company:"Standard Bank",    location:"Johannesburg, Gauteng", type:"Graduate",    duration:"24 months", logo:"🏦", url:"https://careers.standardbank.com" },
  { id:"c3",  title:"WIL Student – Data Analytics",     company:"MTN South Africa", location:"Johannesburg, Gauteng", type:"WIL",         duration:"12 months", logo:"📡", url:"https://mtn.com/careers/" },
  { id:"c4",  title:"Junior Developer",                 company:"Vodacom",          location:"Midrand, Gauteng",      type:"Junior",      duration:"Permanent", logo:"📱", url:"https://www.vodacom.co.za/vodacom/about/careers" },
  { id:"c5",  title:"Graduate Trainee – Audit",         company:"Deloitte SA",      location:"Cape Town, WC",         type:"Graduate",    duration:"24 months", logo:"🏛️", url:"https://www2.deloitte.com/za/en/careers.html" },
  { id:"c6",  title:"IT Internship",                    company:"Eskom",            location:"Pretoria, Gauteng",     type:"Internship",  duration:"12 months", logo:"⚡", url:"https://www.eskom.co.za/careers" },
  { id:"c7",  title:"Entry Level Accountant",           company:"PwC South Africa", location:"Johannesburg, Gauteng", type:"Entry Level", duration:"Permanent", logo:"📊", url:"https://www.pwc.co.za/en/careers.html" },
  { id:"c8",  title:"Engineering Learnership",          company:"Sasol",            location:"Secunda, Mpumalanga",   type:"WIL",         duration:"12 months", logo:"🔬", url:"https://www.sasol.com/careers" },
];

// Quick-access SA job boards
export const JOB_BOARDS = [
  { name:"Careers24",           url:"https://www.careers24.com",                logo:"🔍", desc:"SA's largest job board" },
  { name:"PNet",                url:"https://www.pnet.co.za",                   logo:"💼", desc:"Professional placements" },
  { name:"Graduate Placements", url:"https://www.graduateplacements.co.za",     logo:"🎓", desc:"Graduate & WIL focus"    },
  { name:"LinkedIn Jobs SA",    url:"https://www.linkedin.com/jobs/south-africa",logo:"🔗", desc:"Network + apply"         },
  { name:"Indeed SA",           url:"https://za.indeed.com",                    logo:"🌐", desc:"Broad listing aggregator" },
  { name:"Jobmail SA",          url:"https://www.jobmail.co.za",                logo:"📧", desc:"Email alerts & search"   },
];

// ── Career News page ──────────────────────────────────────────────────────────
export const NEWS_CATEGORIES = ["All", "Career Tips", "Graduate", "Learnerships", "Tech", "Finance", "Engineering"];

export const NEWS_SOURCES = [
  { name: "Careers24",           url: "https://www.careers24.com/news/",                      logo: "🇿🇦" },
  { name: "MyBroadband Careers", url: "https://mybroadband.co.za/news/category/recruitment",  logo: "💻" },
  { name: "BusinessTech",        url: "https://businesstech.co.za/news/recruitment/",          logo: "📊" },
  { name: "Graduate Placements", url: "https://www.graduateplacements.co.za/news/",           logo: "🎓" },
];

export const CATEGORY_NEWS_COLORS = {
  "Career Tips":  { bg: "bg-indigo-100",  text: "text-indigo-800"  },
  "Graduate":     { bg: "bg-emerald-100", text: "text-emerald-800" },
  "Learnerships": { bg: "bg-purple-100",  text: "text-purple-800"  },
  "Tech":         { bg: "bg-blue-100",    text: "text-blue-800"    },
  "Finance":      { bg: "bg-amber-100",   text: "text-amber-800"   },
  "Engineering":  { bg: "bg-rose-100",    text: "text-rose-800"    },
};

// Curated seed articles – shown instantly while OpenAI fetches live news
export const SEED_ARTICLES = [
  { id:1,  title:"Top 10 Graduate Programmes Open for 2025 Applications",       source:"Careers24",          category:"Graduate",    date:"2025-06-10", readTime:"4 min", url:"https://www.careers24.com/news/",                               summary:"Major South African corporates including ABSA, Deloitte and MTN have opened applications for their 2025 graduate intake. Deadlines range from July to September." },
  { id:2,  title:"How to Write a CV That Gets You the Interview",               source:"Graduate Placements", category:"Career Tips", date:"2025-06-08", readTime:"5 min", url:"https://www.graduateplacements.co.za/",                         summary:"Recruiters spend an average of 7 seconds scanning a CV. Here's what SA hiring managers actually look for — and what gets you discarded instantly." },
  { id:3,  title:"Eskom Internship Programme: 2025 Intake Now Open",            source:"BusinessTech",        category:"Engineering", date:"2025-06-07", readTime:"3 min", url:"https://businesstech.co.za/news/recruitment/",                  summary:"Eskom has announced its annual internship programme for engineering, finance and IT graduates. 200 positions available across Gauteng and Mpumalanga." },
  { id:4,  title:"Tech Skills Most in Demand in South Africa Right Now",         source:"MyBroadband Careers", category:"Tech",        date:"2025-06-06", readTime:"6 min", url:"https://mybroadband.co.za/news/category/recruitment",           summary:"Python, cloud computing and cybersecurity top the list of skills SA employers are struggling to fill. Here's how to position yourself for these roles." },
  { id:5,  title:"SETA Learnerships Available in All 9 Provinces",              source:"Careers24",          category:"Learnerships",date:"2025-06-05", readTime:"4 min", url:"https://www.careers24.com/news/",                               summary:"The Services SETA has announced over 500 learnerships in business administration, IT and finance for graduates and school-leavers." },
  { id:6,  title:"Big 4 Accounting Firms Ramp Up Graduate Hiring in SA",        source:"BusinessTech",        category:"Finance",     date:"2025-06-04", readTime:"5 min", url:"https://businesstech.co.za/news/recruitment/",                  summary:"Deloitte, PwC, KPMG and EY are collectively hiring more than 1 200 graduates for their 2025 audit and advisory intakes." },
  { id:7,  title:"Interview Tips: What SA Recruiters Are Asking in 2025",       source:"Graduate Placements", category:"Career Tips", date:"2025-06-03", readTime:"5 min", url:"https://www.graduateplacements.co.za/",                         summary:"Competency-based questions are replacing traditional interviews at many SA corporates. We asked 15 recruiters what they're looking for." },
  { id:8,  title:"Remote Work vs Office: What SA Graduates Prefer in 2025",     source:"MyBroadband Careers", category:"Career Tips", date:"2025-06-02", readTime:"4 min", url:"https://mybroadband.co.za/news/category/recruitment",           summary:"A survey of 2 000 SA graduates reveals a sharp split — 60% prefer hybrid, 25% full remote." },
  { id:9,  title:"Vodacom & MTN Announce Joint Digital Skills Learnership",      source:"BusinessTech",        category:"Learnerships",date:"2025-06-01", readTime:"3 min", url:"https://businesstech.co.za/news/recruitment/",                  summary:"The two telecoms giants have partnered on a 12-month digital skills programme targeting 1 000 unemployed youth across SA." },
  { id:10, title:"LinkedIn Profile Tips for South African Job Seekers",         source:"Careers24",          category:"Career Tips", date:"2025-05-31", readTime:"6 min", url:"https://www.careers24.com/news/",                               summary:"A complete LinkedIn profile is 40x more likely to receive opportunities. Here's the exact checklist SA recruiters recommend." },
  { id:11, title:"AWS & Microsoft Partner to Train 50 000 SA Cloud Professionals",source:"MyBroadband Careers",category:"Tech",       date:"2025-05-30", readTime:"4 min", url:"https://mybroadband.co.za/news/category/recruitment",           summary:"A new initiative will offer free cloud certifications to South African youth through a government-backed digital skills programme." },
  { id:12, title:"Mechanical & Civil Engineering: Where the Jobs Are in 2025",  source:"BusinessTech",        category:"Engineering", date:"2025-05-29", readTime:"5 min", url:"https://businesstech.co.za/news/recruitment/",                  summary:"Infrastructure spend from Transnet, Eskom and municipalities is driving a surge in demand for engineers — especially outside Gauteng." },
];
