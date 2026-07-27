/**
 * src/utils/matchingEngine.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Skill-match helper + WIL matching engine.
 *
 * Mock data is loaded from the CSV exports in /data/.
 * To switch to live Supabase data, replace the MOCK_* constants with
 * real Supabase queries (see TODO comments below).
 *
 * Future AI integration point:
 *   Replace runMatching() with a call to src/services/ai.js → matchStudents()
 *   which will invoke the Claude AI recommendation engine.
 */

// ── Skill-match utility ───────────────────────────────────────────────────────
/**
 * Returns the overlap between a student's skills and required skills.
 * @param {string[]} studentSkills
 * @param {string[]} required
 * @returns {{ matched: string[], total: number, percent: number }}
 */
export const skillMatch = (studentSkills = [], required = []) => {
  const have    = studentSkills.map(s => s.toLowerCase());
  const req     = required.map(s => s.toLowerCase());
  const matched = req.filter(r => have.includes(r));
  return {
    matched,
    total:   req.length,
    percent: req.length ? Math.round((matched.length / req.length) * 100) : 0,
  };
};

// ── Mock data (sourced from /data/students.csv, employers.csv, etc.) ──────────
// TODO: replace with Supabase queries when the live dataset is ready.

export const MOCK_STUDENTS = [
  { id:"TUT2026001", firstName:"Lerato",  lastName:"Mokoena", email:"lerato@tut.ac.za",  faculty:"ICT",         programme:"Computer Science",       year:3, average:72, province:"Gauteng", city:"Pretoria", preferredLocation:"Gauteng", relocate:true  },
  { id:"TUT2026002", firstName:"Sipho",   lastName:"Nkosi",   email:"sipho@tut.ac.za",   faculty:"Engineering", programme:"Mechanical Engineering", year:3, average:68, province:"Gauteng", city:"Pretoria", preferredLocation:"Gauteng", relocate:false },
  { id:"TUT2026003", firstName:"Ayanda",  lastName:"Zulu",    email:"ayanda@tut.ac.za",  faculty:"Business",    programme:"Accounting",             year:3, average:75, province:"KZN",     city:"Durban",   preferredLocation:"Gauteng", relocate:true  },
];

export const MOCK_STUDENT_SKILLS = [
  { studentId:"TUT2026001", skill:"Python",  level:"Advanced"     },
  { studentId:"TUT2026001", skill:"React",   level:"Intermediate" },
  { studentId:"TUT2026002", skill:"AutoCAD", level:"Advanced"     },
  { studentId:"TUT2026003", skill:"Excel",   level:"Advanced"     },
];

export const MOCK_EMPLOYERS = [
  { id:1, company:"MTN",      industry:"Telecommunications", province:"Gauteng", city:"Johannesburg" },
  { id:2, company:"Deloitte", industry:"Finance",            province:"Gauteng", city:"Midrand"      },
  { id:3, company:"Eskom",    industry:"Energy",             province:"Gauteng", city:"Pretoria"     },
];

export const MOCK_INTERNSHIPS = [
  { id:101, employerId:1, title:"Software Developer Intern",     programme:"Computer Science",       faculty:"ICT",         location:"Johannesburg", durationMonths:12, minimumAverage:65 },
  { id:102, employerId:2, title:"Audit Intern",                  programme:"Accounting",             faculty:"Business",    location:"Midrand",      durationMonths:12, minimumAverage:60 },
  { id:103, employerId:3, title:"Mechanical Engineering Intern", programme:"Mechanical Engineering", faculty:"Engineering", location:"Pretoria",     durationMonths:12, minimumAverage:65 },
];

// ── Mock matching engine ──────────────────────────────────────────────────────
/**
 * Matches MOCK_STUDENTS against MOCK_INTERNSHIPS using programme, faculty,
 * average mark and location criteria.
 *
 * Returns an array of result objects sorted by score desc, then average desc.
 * Each result includes a natural-language `summary` field ready for display.
 *
 * Future AI hook: pipe these results into Claude for richer explanations.
 */
export function runMatching() {
  const results = [];

  for (const student of MOCK_STUDENTS) {
    const skills     = MOCK_STUDENT_SKILLS.filter(s => s.studentId === student.id);
    const skillNames = skills.map(s => s.skill);

    for (const internship of MOCK_INTERNSHIPS) {
      const employer = MOCK_EMPLOYERS.find(e => e.id === internship.employerId);

      const programmeMatch = student.programme === internship.programme;
      const facultyMatch   = student.faculty    === internship.faculty;
      const averageMatch   = student.average    >= internship.minimumAverage;
      const locationMatch  =
        student.preferredLocation?.toLowerCase() === employer?.province?.toLowerCase() ||
        student.city?.toLowerCase()              === internship.location?.toLowerCase() ||
        student.relocate;

      const qualifies = programmeMatch && facultyMatch && averageMatch && locationMatch;

      const reasons = [];
      if (skillNames.length) reasons.push(skillNames.join(" & ") + ` (${skills.map(s => s.level.toLowerCase()).join(", ")})`);
      if (averageMatch)      reasons.push(`${student.average}% average (min ${internship.minimumAverage}%)`);
      if (student.year === 3 || student.year === 4) reasons.push("final-year status");
      if (student.relocate && employer?.province !== student.province) reasons.push("willing to relocate");

      const summary = qualifies
        ? `${student.firstName} ${student.lastName} qualifies for ${internship.title} at ${employer?.company} in ${internship.location} based on ${reasons.join(", ")}.`
        : `${student.firstName} ${student.lastName} does not qualify for ${internship.title} at ${employer?.company} — ${[
            !programmeMatch ? `programme mismatch (${student.programme} ≠ ${internship.programme})` : "",
            !averageMatch   ? `average too low (${student.average}% < ${internship.minimumAverage}%)` : "",
            !locationMatch  ? "location not suitable and not willing to relocate" : "",
          ].filter(Boolean).join("; ")}.`;

      results.push({
        student, internship, employer, skills, qualifies,
        criteria: [
          { label: "Programme", pass: programmeMatch, detail: student.programme },
          { label: "Faculty",   pass: facultyMatch,   detail: student.faculty   },
          { label: "Average",   pass: averageMatch,   detail: `${student.average}% (min ${internship.minimumAverage}%)` },
          { label: "Location",  pass: locationMatch,  detail: internship.location },
        ],
        summary,
        score: [programmeMatch, facultyMatch, averageMatch, locationMatch].filter(Boolean).length,
      });
    }
  }

  return results.sort((a, b) => b.score - a.score || b.student.average - a.student.average);
}

/**
 * Matches a single mock student against a live Supabase internship.
 * Used by WILMatching to combine mock + real data in one results list.
 */
export function matchStudentToLive(student, internship) {
  const skills      = MOCK_STUDENT_SKILLS.filter(s => s.studentId === student.id);
  const skillNames  = skills.map(s => s.skill.toLowerCase());
  const required    = (internship.skillsRequired || []).map(s => s.toLowerCase());
  const matchedSkills = required.filter(r => skillNames.includes(r));
  const skillsMatch   = required.length === 0 || matchedSkills.length > 0;
  const locationMatch =
    student.preferredLocation?.toLowerCase() === internship.location?.toLowerCase() ||
    student.city?.toLowerCase()              === internship.location?.toLowerCase() ||
    student.relocate;
  const qualifies = skillsMatch && locationMatch;

  const reasons = [];
  if (skills.length)     reasons.push(skills.map(s => `${s.skill} (${s.level.toLowerCase()})`).join(", "));
  if (student.average)   reasons.push(`${student.average}% average`);
  if (student.year >= 3) reasons.push("final-year status");
  if (student.relocate && student.province !== internship.location) reasons.push("willing to relocate");

  const missingSkills = required.filter(r => !skillNames.includes(r));

  const summary = qualifies
    ? `${student.firstName} ${student.lastName} qualifies for ${internship.title} at ${internship.company} in ${internship.location} based on ${reasons.join(", ")}.`
    : `${student.firstName} ${student.lastName} does not qualify for ${internship.title} at ${internship.company} — ${[
        !skillsMatch   ? `missing required skills (${missingSkills.join(", ")})` : "",
        !locationMatch ? "location not suitable and not willing to relocate"      : "",
      ].filter(Boolean).join("; ")}.`;

  return {
    student, internship,
    employer: { company: internship.company, city: internship.location },
    skills,
    qualifies,
    criteria: [
      { label: "Skills",   pass: skillsMatch,   detail: required.length ? `${matchedSkills.length}/${required.length} matched` : "Any" },
      { label: "Location", pass: locationMatch, detail: internship.location },
    ],
    summary,
    score: [skillsMatch, locationMatch].filter(Boolean).length,
  };
}
