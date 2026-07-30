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

// ── Real student → live internship matcher ────────────────────────────────────
/**
 * Matches the currently logged-in Supabase student profile against a single
 * live internship row and returns a fully structured result with a professional
 * 2–4 sentence summary.
 *
 * @param {object} profile  - merged profiles + students row from Supabase
 *   Expected fields: name, email, major, year (string), average_mark,
 *                    skills (string[]), location, preferred_location (optional)
 * @param {object} internship - internships row from Supabase
 *   Expected fields: id, internship_name, company_name, location,
 *                    skills_required (string[]), duration, type
 * @returns {object} match result with qualifies, skillPct, matched, missing, summary, criteria
 */
export function matchRealStudentToInternship(profile, internship) {
  // ── Parse student fields ──────────────────────────────────────────────────
  const nameParts   = (profile.name || "Student").trim().split(" ");
  const firstName   = nameParts[0];
  const lastName    = nameParts.slice(1).join(" ") || "";

  // Normalise year string → number for year-label logic in buildSummary
  const yearStr  = (profile.year || "").toLowerCase();
  const yearNum  =
    yearStr.includes("post") ? 5 :
    yearStr.includes("4th")  ? 4 :
    yearStr.includes("3rd")  ? 3 :
    yearStr.includes("2nd")  ? 2 : 1;

  const studentSkillsLow = (profile.skills || []).map(s => s.toLowerCase());
  const required         = (internship.skills_required || []);
  const reqLow           = required.map(s => s.toLowerCase());

  const matchedSkills = required.filter(s => studentSkillsLow.includes(s.toLowerCase()));
  const missingSkills = required.filter(s => !studentSkillsLow.includes(s.toLowerCase()));

  // ── Criteria evaluation ───────────────────────────────────────────────────
  // Skills: student must match at least 50% of required skills (or none required)
  const skillPct    = required.length
    ? Math.round((matchedSkills.length / required.length) * 100)
    : 100;
  const skillsMatch = skillPct >= 50;

  // Location: student's stored location or preferred_location matches internship
  const studentLoc  = (profile.preferred_location || profile.location || "").toLowerCase();
  const internLoc   = (internship.location || "").toLowerCase();
  const locationMatch = studentLoc === internLoc || internLoc.includes(studentLoc) || studentLoc.includes(internLoc) || studentLoc === "";

  // Average: only enforce if internship has a minimum_average set
  const minAvg      = internship.minimum_average || 0;
  const avgMark     = profile.average_mark ?? 0;
  const averageMatch = avgMark >= minAvg || minAvg === 0;

  const qualifies   = skillsMatch && locationMatch && averageMatch;

  // ── Score (0–100) ─────────────────────────────────────────────────────────
  // Weight: skills 50%, location 30%, average 20%
  const scorePercent = Math.round(skillPct * 0.5 + (locationMatch ? 30 : 0) + (averageMatch ? 20 : 0));

  // ── Build professional summary ────────────────────────────────────────────
  const fakeStudent = {
    firstName, lastName,
    programme: profile.major || "their programme",
    faculty:   profile.faculty || "",
    year:      yearNum,
    average:   avgMark,
    city:      profile.location || "",
    preferredLocation: profile.preferred_location || profile.location || "",
    relocate: false,
  };

  const fakeInternship = {
    title:          internship.internship_name,
    programme:      profile.major,   // live internships are open to all programmes
    faculty:        profile.faculty,
    location:       internship.location,
    minimumAverage: minAvg,
    skillsRequired: required,
  };

  const summary = buildSummary({
    student:        fakeStudent,
    internship:     fakeInternship,
    employer:       { company: internship.company_name },
    matchedSkills,
    missingSkills,
    programmeMatch: true,   // live listings don't filter by programme
    facultyMatch:   true,
    averageMatch,
    locationMatch,
    qualifies,
    scorePercent,
  });

  return {
    internship,
    skillPct,
    scorePercent,
    matched: matchedSkills,
    missing: missingSkills,
    qualifies,
    summary,
    criteria: [
      { label: "Skills",   pass: skillsMatch,   detail: required.length ? `${matchedSkills.length}/${required.length} matched` : "Open to all" },
      { label: "Location", pass: locationMatch, detail: internship.location },
      ...(minAvg > 0 ? [{ label: "Average", pass: averageMatch, detail: `${avgMark}% (min ${minAvg}%)` }] : []),
    ],
  };
}

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

// ── Summary generator ─────────────────────────────────────────────────────────
/**
 * Builds a 2–4 sentence professional explanation of why a student qualifies
 * (or does not qualify) for a given internship.
 *
 * Format (qualifying):
 *   "[Name] qualifies for [role] at [company] with a [score]% match because
 *    [programme/year], [skills], [average], [location]. [Learning X would…]"
 *
 * Format (not qualifying):
 *   "[Name] does not meet the requirements for [role] at [company] ([score]% match)
 *    due to [reasons]. [Recommendation.]"
 */
function buildSummary({ student, internship, employer, matchedSkills, missingSkills, programmeMatch, facultyMatch, averageMatch, locationMatch, qualifies, scorePercent }) {
  const fullName    = `${student.firstName} ${student.lastName}`;
  const company     = employer?.company || internship.company || "the company";
  const role        = internship.title;
  const location    = internship.location;
  const yearLabel   = student.year >= 4 ? "a final-year" : student.year === 3 ? "a third-year" : `a year-${student.year}`;

  if (qualifies) {
    // Build the "because" clause from what the student satisfies
    const reasons = [];
    if (programmeMatch) reasons.push(`is ${yearLabel} ${student.programme} student`);
    if (matchedSkills.length) reasons.push(`has ${matchedSkills.join(", ")} skill${matchedSkills.length > 1 ? "s" : ""}`);
    if (averageMatch) reasons.push(`meets the minimum academic average with ${student.average}%`);
    if (locationMatch) reasons.push(`matches the ${location} location requirement`);

    let sentence = `${fullName} qualifies for the ${role} at ${company} with a ${scorePercent}% match because ${reasons.join(", ")}.`;

    if (missingSkills.length) {
      sentence += ` Learning ${missingSkills.join(" and ")} would further strengthen this application.`;
    }
    return sentence;
  } else {
    // Build the "due to" clause from what the student fails
    const failures = [];
    if (!programmeMatch) failures.push(`programme mismatch (${student.programme} vs. required ${internship.programme})`);
    if (!facultyMatch)   failures.push(`faculty mismatch (${student.faculty} vs. required ${internship.faculty})`);
    if (!averageMatch)   failures.push(`academic average of ${student.average}% is below the ${internship.minimumAverage}% minimum`);
    if (!locationMatch)  failures.push(`preferred location does not match ${location} and relocation is not indicated`);

    let sentence = `${fullName} does not meet the requirements for the ${role} at ${company} (${scorePercent}% match) due to ${failures.join("; ")}.`;

    // Constructive recommendation
    const tips = [];
    if (!averageMatch)  tips.push(`raising their academic average above ${internship.minimumAverage}%`);
    if (missingSkills.length) tips.push(`developing skills in ${missingSkills.join(" and ")}`);
    if (tips.length) sentence += ` Focusing on ${tips.join(" and ")} could improve future eligibility.`;

    return sentence;
  }
}

// ── Mock matching engine ──────────────────────────────────────────────────────
/**
 * Matches MOCK_STUDENTS against MOCK_INTERNSHIPS using programme, faculty,
 * average mark and location criteria.
 *
 * Each result includes a professionally worded `summary` that explains
 * the match outcome in clear, encouraging language (2–4 sentences).
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

      const qualifies     = programmeMatch && facultyMatch && averageMatch && locationMatch;
      const criteriaCount = [programmeMatch, facultyMatch, averageMatch, locationMatch].filter(Boolean).length;
      const scorePercent  = Math.round((criteriaCount / 4) * 100);

      // Required skills from internship (mock internships don't have a skills list,
      // so we use the student's skills as matched — extend MOCK_INTERNSHIPS to add skillsRequired later)
      const required      = internship.skillsRequired || [];
      const reqLower      = required.map(s => s.toLowerCase());
      const skillNamesLow = skillNames.map(s => s.toLowerCase());
      const matchedSkills = required.length ? required.filter(s => skillNamesLow.includes(s.toLowerCase())) : skillNames;
      const missingSkills = required.filter(s => !skillNamesLow.includes(s.toLowerCase()));

      const summary = buildSummary({
        student, internship, employer,
        matchedSkills, missingSkills,
        programmeMatch, facultyMatch, averageMatch, locationMatch,
        qualifies, scorePercent,
      });

      results.push({
        student, internship, employer, skills, qualifies,
        criteria: [
          { label: "Programme", pass: programmeMatch, detail: student.programme },
          { label: "Faculty",   pass: facultyMatch,   detail: student.faculty   },
          { label: "Average",   pass: averageMatch,   detail: `${student.average}% (min ${internship.minimumAverage}%)` },
          { label: "Location",  pass: locationMatch,  detail: internship.location },
        ],
        summary,
        score: criteriaCount,
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
  const skills        = MOCK_STUDENT_SKILLS.filter(s => s.studentId === student.id);
  const skillNamesLow = skills.map(s => s.skill.toLowerCase());
  const required      = (internship.skillsRequired || []);
  const reqLower      = required.map(s => s.toLowerCase());
  const matchedSkills = required.filter(s => skillNamesLow.includes(s.toLowerCase()));
  const missingSkills = required.filter(s => !skillNamesLow.includes(s.toLowerCase()));

  const skillsMatch   = required.length === 0 || matchedSkills.length > 0;
  const locationMatch =
    student.preferredLocation?.toLowerCase() === internship.location?.toLowerCase() ||
    student.city?.toLowerCase()              === internship.location?.toLowerCase() ||
    student.relocate;

  const qualifies     = skillsMatch && locationMatch;
  const criteriaCount = [skillsMatch, locationMatch].filter(Boolean).length;
  const scorePercent  = Math.round((criteriaCount / 2) * 100);

  const summary = buildSummary({
    student,
    internship: { ...internship, minimumAverage: internship.minimumAverage || 0 },
    employer:   { company: internship.company },
    matchedSkills,
    missingSkills,
    programmeMatch: true,  // live internships don't filter by programme
    facultyMatch:   true,
    averageMatch:   true,
    locationMatch,
    qualifies,
    scorePercent,
  });

  return {
    student, internship,
    employer: { company: internship.company, city: internship.location },
    skills,
    qualifies,
    criteria: [
      { label: "Skills",   pass: skillsMatch,   detail: required.length ? `${matchedSkills.length}/${required.length} matched` : "Open" },
      { label: "Location", pass: locationMatch, detail: internship.location },
    ],
    summary,
    score: criteriaCount,
  };
}

// ── Live matching engine (real Supabase data) ─────────────────────────────────
/**
 * Matches real students from Supabase against real internships posted by employers.
 *
 * @param {object[]} students    - rows from students JOIN profiles
 *   Each row: { id, major, year, average_mark, skills[], location, profiles: { name, email } }
 * @param {object[]} internships - rows from internships (with employer join)
 *   Each row: { id, internship_name, company_name, location, skills_required[],
 *               duration, type, minimum_average, employers: { company } }
 * @returns {object[]} sorted results (qualified first, then by scorePercent desc)
 */
export function runLiveMatching(students = [], internships = []) {
  const results = [];

  for (const student of students) {
    const profile   = student.profiles || {};
    const fullName  = profile.name || "Unknown Student";
    const nameParts = fullName.trim().split(" ");
    const firstName = nameParts[0];
    const lastName  = nameParts.slice(1).join(" ") || "";

    const yearStr = (student.year || "").toLowerCase();
    const yearNum =
      yearStr.includes("post") ? 5 :
      yearStr.includes("4th")  ? 4 :
      yearStr.includes("3rd")  ? 3 :
      yearStr.includes("2nd")  ? 2 : 1;

    const studentSkillsLow = (student.skills || []).map(s => s.toLowerCase());
    const studentLoc       = (student.location || "").toLowerCase();

    for (const internship of internships) {
      const required      = internship.skills_required || [];
      const matchedSkills = required.filter(s => studentSkillsLow.includes(s.toLowerCase()));
      const missingSkills = required.filter(s => !studentSkillsLow.includes(s.toLowerCase()));

      // Skills: ≥50% match OR no skills specified
      const skillPct    = required.length
        ? Math.round((matchedSkills.length / required.length) * 100)
        : 100;
      const skillsMatch = skillPct >= 50;

      // Location: loose match — either matches or student has no location set
      const internLoc     = (internship.location || "").toLowerCase();
      const locationMatch = !studentLoc || studentLoc === internLoc ||
        internLoc.includes(studentLoc) || studentLoc.includes(internLoc);

      // Academic average: only enforced when minimum_average is set on the internship
      const minAvg       = internship.minimum_average || 0;
      const avgMark      = student.average_mark ?? 0;
      const averageMatch = avgMark >= minAvg || minAvg === 0;

      const qualifies     = skillsMatch && locationMatch && averageMatch;

      // Weighted score: skills 50% + location 30% + average 20%
      const scorePercent = Math.round(
        skillPct * 0.5 +
        (locationMatch ? 30 : 0) +
        (averageMatch  ? 20 : 0)
      );

      const fakeStudent = {
        firstName, lastName,
        programme: student.major || "their programme",
        faculty:   student.faculty || "",
        year:      yearNum,
        average:   avgMark,
        city:      student.location || "",
        preferredLocation: student.location || "",
        relocate:  false,
      };

      const fakeInternship = {
        title:          internship.internship_name,
        programme:      student.major,
        faculty:        student.faculty || "",
        location:       internship.location,
        minimumAverage: minAvg,
        skillsRequired: required,
      };

      const summary = buildSummary({
        student:        fakeStudent,
        internship:     fakeInternship,
        employer:       { company: internship.company_name || internship.employers?.company || "the company" },
        matchedSkills,
        missingSkills,
        programmeMatch: true,
        facultyMatch:   true,
        averageMatch,
        locationMatch,
        qualifies,
        scorePercent,
      });

      results.push({
        student: {
          id:         student.id,
          firstName,
          lastName,
          email:      profile.email || "",
          major:      student.major || "—",
          year:       student.year  || "—",
          average:    avgMark,
          location:   student.location || "—",
          skills:     student.skills || [],
        },
        internship: {
          id:       internship.id,
          title:    internship.internship_name,
          location: internship.location,
          duration: internship.duration,
          type:     internship.type,
          isLive:   true,
          skillsRequired: required,
        },
        employer: {
          company: internship.company_name || internship.employers?.company || "Unknown",
        },
        skillsList: (student.skills || []).map(s => ({ skill: s, level: "—" })),
        matchedSkills,
        missingSkills,
        skillPct,
        scorePercent,
        qualifies,
        criteria: [
          { label: "Skills",   pass: skillsMatch,   detail: required.length ? `${matchedSkills.length}/${required.length} matched` : "Open to all" },
          { label: "Location", pass: locationMatch, detail: internship.location || "Any" },
          ...(minAvg > 0 ? [{ label: "Average", pass: averageMatch, detail: `${avgMark}% (min ${minAvg}%)` }] : []),
        ],
        summary,
        score: scorePercent,
      });
    }
  }

  // Qualified first, then sort by scorePercent desc, then by average desc
  return results.sort((a, b) =>
    (b.qualifies ? 1 : 0) - (a.qualifies ? 1 : 0) ||
    b.scorePercent - a.scorePercent ||
    b.student.average - a.student.average
  );
}
