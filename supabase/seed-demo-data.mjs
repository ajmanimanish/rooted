// Ports reference/rooted_demo_data_dusseldorf.json (the Düsseldorf subset of
// the prototype's 100-person demo dataset — the app's schema is single-city,
// so only Düsseldorf residents are seeded) into the live Supabase project,
// plus a hand-curated set of Housing/Knowledge/Resources/Marketplace/Events/
// Arrival-Help items so the deployed app isn't empty on first load.
//
// Safe to re-run: every insert is keyed off is_demo=true rows, and running
// `node supabase/seed-demo-data.mjs --wipe` first deletes all demo profiles
// (cascading to their content) before reseeding.
//
// Requires .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY.

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const env = Object.fromEntries(
  fs
    .readFileSync(path.join(root, ".env.local"), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

const STAGE_MAP = {
  "just arrived": "just_arrived",
  "settling in": "settling_in",
  "long-term": "long_term",
};

async function wipeExistingDemoData() {
  const { data: existing } = await admin.from("profiles").select("id").eq("is_demo", true);
  if (!existing || existing.length === 0) return;
  console.log(`Wiping ${existing.length} existing demo profiles...`);
  for (const p of existing) {
    await admin.auth.admin.deleteUser(p.id);
  }
}

async function createDemoUser(person) {
  const email = `demo+${person.id}@rooted.invalid`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: crypto.randomUUID(),
    email_confirm: true,
    user_metadata: { name: person.name },
  });
  if (error) throw new Error(`createUser ${person.id}: ${error.message}`);
  return data.user.id;
}

async function main() {
  const wipe = process.argv.includes("--wipe");
  if (wipe) await wipeExistingDemoData();

  const people = JSON.parse(
    fs.readFileSync(path.join(root, "reference/rooted_demo_data_dusseldorf.json"), "utf8"),
  );

  console.log(`Seeding ${people.length} demo profiles...`);
  const idMap = {}; // demo id ("u001") -> real auth.users id

  for (const person of people) {
    const userId = await createDemoUser(person);
    idMap[person.id] = userId;

    const { error } = await admin
      .from("profiles")
      .update({
        origin_country: person.originCountry,
        origin_region: person.originRegion,
        city: person.geo.city,
        state: person.geo.state,
        neighborhood: person.geo.neighborhood,
        employer: person.employer,
        role: person.role,
        stage: STAGE_MAP[person.stage] ?? "just_arrived",
        years_in_city: person.yearsInCity,
        linkedin_verified: person.verified.linkedin,
        employer_verified: person.verified.employer,
        verified_local: person.verified.verifiedLocal,
        is_demo: true,
      })
      .eq("id", userId);
    if (error) throw new Error(`update profile ${person.id}: ${error.message}`);
  }
  console.log("Profiles seeded.");

  // ── Vouches (from the dataset's vouchedBy graph, restricted to our seeded set) ──
  const vouchRows = [];
  for (const person of people) {
    for (const voucherDemoId of person.vouchedBy ?? []) {
      if (idMap[voucherDemoId]) {
        vouchRows.push({
          voucher_id: idMap[voucherDemoId],
          vouchee_id: idMap[person.id],
          invited: person.invitedBy === voucherDemoId,
        });
      }
    }
  }
  if (vouchRows.length > 0) {
    const { error } = await admin.from("vouches").insert(vouchRows);
    if (error) throw new Error(`vouches: ${error.message}`);
  }
  console.log(`Seeded ${vouchRows.length} vouches.`);

  // ── Groups synthesized from the dataset's origin/situation axes ──
  const NATIONALITY_GROUPS = [
    ["Turkey", "Turks in Düsseldorf"],
    ["Spain", "Spaniards in Düsseldorf"],
    ["USA", "Americans in Düsseldorf"],
    ["Brazil", "Brazilians in Düsseldorf"],
    ["Poland", "Poles in Düsseldorf"],
    ["China", "Chinese in Düsseldorf"],
  ];
  const SITUATION_GROUPS = [
    ["retiree", "Retirees in Düsseldorf", "situation"],
    ["solo", "Solo in Düsseldorf", "situation"],
    ["student", "Students in Düsseldorf", "situation"],
    ["family", "Families in Düsseldorf", "situation"],
    ["LGBTQ+", "LGBTQ+ Düsseldorf", "interest"],
    ["sports", "Sports & Fitness Düsseldorf", "interest"],
  ];

  const groupIds = {}; // group key -> group row id
  const ownerId = idMap[people[0].id];

  for (const [country, name] of NATIONALITY_GROUPS) {
    const { data, error } = await admin
      .from("groups")
      .insert({ name, axis: "nationality", created_by: ownerId })
      .select("id")
      .single();
    if (error) throw new Error(`group ${name}: ${error.message}`);
    groupIds[country] = data.id;
  }
  for (const [tag, name, axis] of SITUATION_GROUPS) {
    const { data, error } = await admin
      .from("groups")
      .insert({ name, axis, created_by: ownerId })
      .select("id")
      .single();
    if (error) throw new Error(`group ${name}: ${error.message}`);
    groupIds[tag] = data.id;
  }
  console.log(`Seeded ${Object.keys(groupIds).length} groups.`);

  // ── Group memberships ──
  const memberRows = [];
  for (const person of people) {
    const uid = idMap[person.id];
    if (groupIds[person.originCountry]) {
      memberRows.push({ group_id: groupIds[person.originCountry], profile_id: uid, role: "member" });
    }
    for (const tag of person.situation ?? []) {
      if (groupIds[tag]) {
        memberRows.push({ group_id: groupIds[tag], profile_id: uid, role: "member" });
      }
    }
  }
  if (memberRows.length > 0) {
    const { error } = await admin.from("group_members").insert(memberRows);
    if (error) throw new Error(`group_members: ${error.message}`);
  }
  console.log(`Seeded ${memberRows.length} group memberships.`);

  const uid = (demoId) => idMap[demoId];
  const tag = async (itemType, itemId, groupKeys) => {
    const rows = groupKeys.filter((k) => groupIds[k]).map((k) => ({ item_type: itemType, item_id: itemId, group_id: groupIds[k] }));
    if (rows.length > 0) await admin.from("item_group_tags").insert(rows);
  };

  // ── Housing ──
  const housing = [
    {
      author_id: uid("u023"),
      kind: "available",
      title: "Bright 2BR near Nordpark, available January",
      neighborhood: "Pempelfort",
      price: 1350,
      description: "Renovated kitchen, balcony facing the park, 5 min walk to U-Bahn.",
      groups: ["Poland"],
    },
    {
      author_id: uid("u091"),
      kind: "seeking",
      title: "Couple seeking 1BR in Flingern or Bilk",
      description: "Both working professionals, no pets, flexible move-in from March.",
      groups: ["LGBTQ+"],
    },
    {
      author_id: uid("u067"),
      kind: "handover",
      title: "Handover: cozy Altbau in Golzheim, moving back home",
      neighborhood: "Golzheim",
      price: 980,
      description: "2.5 rooms, high ceilings, quiet street. Landlord is easy to work with.",
      handover_knowledge: {
        plumber: "Klempner Meier — responsive, fair prices, speaks some English",
        tax_adviser: "TaxExpats Düsseldorf (see Resources)",
        doctor: "Dr. Bauer, Allgemeinmedizin Bilk",
        tips: "Building recycling pickup is Tuesdays. Neighbors are friendly, mostly long-term residents.",
      },
      groups: ["Poland", "retiree"],
    },
    {
      author_id: uid("u038"),
      kind: "available",
      title: "Room in shared flat, Flingern, student-friendly",
      neighborhood: "Flingern",
      price: 520,
      description: "3-person WG, fully furnished room, fast wifi, easy-going flatmates.",
      groups: ["Spain", "student"],
    },
  ];
  for (const h of housing) {
    const { groups, ...row } = h;
    const { data, error } = await admin.from("housing_listings").insert(row).select("id").single();
    if (error) throw new Error(`housing: ${error.message}`);
    await tag("listing", data.id, groups);
  }
  console.log(`Seeded ${housing.length} housing listings.`);

  // ── Knowledge (poll questions) ──
  const questions = [
    {
      author_id: uid("u082"),
      title: "Best pediatrician for a toddler in Düsseldorf?",
      topic: "healthcare",
      options: ["Dr. Keller (Pempelfort)", "Dr. Bauer (Bilk)", "Kinderarzt Flingern Praxis"],
      votes: [
        [uid("u082"), 0, "Great with anxious toddlers, speaks English"],
        [uid("u087"), 0, null],
        [uid("u100"), 1, null],
        [uid("u024"), 0, "Short wait times even without an appointment"],
      ],
      groups: ["family"],
    },
    {
      author_id: uid("u051"),
      title: "Which tax adviser actually speaks English well?",
      topic: "tax",
      options: ["Steuerberater Nowak", "Kanzlei Richter", "TaxExpats Düsseldorf"],
      votes: [
        [uid("u051"), 2, "Handled my freelance + employed situation without issues"],
        [uid("u002"), 2, null],
        [uid("u023"), 2, null],
        [uid("u073"), 0, null],
      ],
      groups: ["Poland"],
    },
    {
      author_id: uid("u018"),
      title: "Where do Turkish families usually settle — Flingern or Golzheim?",
      topic: "housing",
      options: ["Flingern", "Golzheim", "Pempelfort"],
      votes: [
        [uid("u018"), 0, "More Turkish shops and a mosque nearby"],
        [uid("u024"), 0, null],
        [uid("u072"), 1, null],
        [uid("u068"), 1, null],
        [uid("u087"), 0, null],
      ],
      groups: ["Turkey"],
    },
    {
      author_id: uid("u035"),
      title: "Best gym or sports club for beginners?",
      topic: "events",
      options: ["Fitness First Pempelfort", "ASV Düsseldorf running club", "Kö-Bogen swim club"],
      votes: [
        [uid("u035"), 1, null],
        [uid("u048"), 1, "Very welcoming to newcomers, free trial run"],
        [uid("u064"), 0, null],
        [uid("u080"), 1, null],
      ],
      groups: ["sports"],
    },
  ];
  for (const q of questions) {
    const { data: question, error } = await admin
      .from("questions")
      .insert({ author_id: q.author_id, title: q.title, topic: q.topic, format: "poll" })
      .select("id")
      .single();
    if (error) throw new Error(`question: ${error.message}`);

    const { data: opts, error: optErr } = await admin
      .from("question_options")
      .insert(q.options.map((label) => ({ question_id: question.id, label })))
      .select("id");
    if (optErr) throw new Error(`options: ${optErr.message}`);

    const voteRows = q.votes.map(([voterId, optIdx, tipText]) => ({
      option_id: opts[optIdx].id,
      voter_id: voterId,
      tip: tipText,
    }));
    const { error: voteErr } = await admin.from("votes").insert(voteRows);
    if (voteErr) throw new Error(`votes: ${voteErr.message}`);

    await tag("question", question.id, q.groups);
  }

  // One deep-answer question
  {
    const { data: dq, error } = await admin
      .from("questions")
      .insert({
        author_id: uid("u073"),
        title: "How does German tax class work when one partner is self-employed?",
        topic: "tax",
        format: "deep_answer",
      })
      .select("id")
      .single();
    if (error) throw new Error(`deep question: ${error.message}`);

    await admin.from("deep_answers").insert({
      question_id: dq.id,
      author_id: uid("u051"),
      body: "Short version: as a married couple you can pick tax class III/V or IV/IV. If one of you is self-employed (Freiberufler/Gewerbe), they're taxed separately via their own annual return regardless of class — the class mainly affects the employed partner's monthly withholding. Most self-employed + employed couples end up doing a joint Einkommensteuererklärung at year-end anyway, which reconciles everything. Worth 30 minutes with a Steuerberater in your first year to set the right prepayments.",
      helpful_count: 6,
    });
    await tag("question", dq.id, []);
  }
  console.log(`Seeded ${questions.length + 1} knowledge questions.`);

  // ── Resources ──
  const resources = [
    {
      category: "doctor",
      name: "Dr. Keller — Kinderarztpraxis Pempelfort",
      created_by: uid("u082"),
      votes: [
        [uid("u082"), "Great with anxious toddlers, speaks English"],
        [uid("u024"), "Short wait times"],
        [uid("u100"), null],
      ],
      groups: ["family"],
    },
    {
      category: "tax_adviser",
      name: "TaxExpats Düsseldorf",
      created_by: uid("u051"),
      votes: [
        [uid("u002"), null],
        [uid("u023"), null],
        [uid("u038"), null],
        [uid("u073"), "Handles freelancer + employed couple filings well"],
      ],
      groups: [],
    },
    {
      category: "handyman",
      name: "Handwerker Yılmaz",
      created_by: uid("u018"),
      votes: [
        [uid("u072"), "Fixed a leaking pipe same day"],
        [uid("u087"), null],
      ],
      groups: ["Turkey"],
    },
    {
      category: "cleaner",
      name: "CleanHome NRW",
      created_by: uid("u040"),
      votes: [
        [uid("u064"), null],
        [uid("u052"), "Reliable, bring their own supplies"],
      ],
      groups: [],
    },
    {
      category: "doctor",
      name: "Praxis Dr. Bauer — Allgemeinmedizin Bilk",
      created_by: uid("u001"),
      votes: [
        [uid("u042"), null],
        [uid("u052"), null],
      ],
      groups: [],
    },
  ];
  for (const r of resources) {
    const { data, error } = await admin
      .from("resources")
      .insert({ category: r.category, name: r.name, created_by: r.created_by })
      .select("id")
      .single();
    if (error) throw new Error(`resource: ${error.message}`);

    const voteRows = r.votes.map(([voterId, tipText]) => ({ resource_id: data.id, voter_id: voterId, tip: tipText }));
    const { error: voteErr } = await admin.from("resource_votes").insert(voteRows);
    if (voteErr) throw new Error(`resource_votes: ${voteErr.message}`);

    await tag("resource", data.id, r.groups);
  }
  console.log(`Seeded ${resources.length} resources.`);

  // ── Marketplace ──
  const marketplace = [
    { seller_id: uid("u042"), title: "IKEA desk + chair, barely used", price: 60, status: "available" },
    { seller_id: uid("u082"), title: "Winter coat bundle, kids 4-6y", price: 25, status: "available" },
    { seller_id: uid("u080"), title: "Road bike, size M", price: 180, status: "sold" },
  ];
  for (const m of marketplace) {
    const { error } = await admin.from("marketplace_listings").insert(m);
    if (error) throw new Error(`marketplace: ${error.message}`);
  }
  console.log(`Seeded ${marketplace.length} marketplace listings.`);

  // ── Events ──
  const inDays = (n) => new Date(Date.now() + n * 86400000).toISOString();
  const events = [
    {
      organizer_id: uid("u072"),
      group_id: groupIds["Turkey"],
      title: "Monthly Türkçe Kahve — Turkish coffee meetup",
      starts_at: inDays(14),
      location: "Café in Bilk",
      groups: ["Turkey"],
    },
    {
      organizer_id: uid("u068"),
      group_id: groupIds["LGBTQ+"],
      title: "LGBTQ+ Düsseldorf Stammtisch",
      starts_at: inDays(21),
      location: "Bar in Flingern",
      groups: ["LGBTQ+"],
    },
    {
      organizer_id: uid("u023"),
      group_id: groupIds["retiree"],
      title: "New Year Potluck 2026",
      starts_at: inDays(-40),
      location: "Community room, Pempelfort",
      groups: ["Poland", "retiree"],
    },
  ];
  for (const e of events) {
    const { groups, ...row } = e;
    const { data, error } = await admin.from("events").insert(row).select("id").single();
    if (error) throw new Error(`event: ${error.message}`);
    await tag("event", data.id, groups);
  }
  console.log(`Seeded ${events.length} events.`);

  // ── Arrival Help ──
  const arrivalHelp = [
    {
      requester_id: uid("u072"),
      traveler_note: "My mother, 66, flying alone from Istanbul — first time in Germany.",
      languages_needed: ["Turkish"],
      arrival_window: inDays(10),
      groups: ["Turkey"],
    },
    {
      requester_id: uid("u093"),
      traveler_note: "My grandfather (82) arriving from São Paulo, needs wheelchair assistance guidance.",
      languages_needed: ["Portuguese"],
      arrival_window: inDays(18),
      groups: ["Brazil"],
    },
  ];
  for (const a of arrivalHelp) {
    const { groups, ...row } = a;
    const { data, error } = await admin.from("arrival_help_requests").insert(row).select("id").single();
    if (error) throw new Error(`arrival_help: ${error.message}`);
    await tag("arrival_help", data.id, groups);
  }
  console.log(`Seeded ${arrivalHelp.length} arrival-help requests.`);

  // One offer from an eligible (verified + >=2 vouches) demo helper, if one exists.
  const { data: allVouches } = await admin.from("vouches").select("vouchee_id");
  const vouchCounts = {};
  for (const v of allVouches ?? []) vouchCounts[v.vouchee_id] = (vouchCounts[v.vouchee_id] ?? 0) + 1;
  const { data: turkeyMembers } = await admin.from("group_members").select("profile_id").eq("group_id", groupIds["Turkey"]);
  for (const m of turkeyMembers ?? []) {
    const { data: prof } = await admin.from("profiles").select("linkedin_verified, employer_verified").eq("id", m.profile_id).maybeSingle();
    if ((prof?.linkedin_verified || prof?.employer_verified) && (vouchCounts[m.profile_id] ?? 0) >= 2) {
      const { data: req } = await admin.from("arrival_help_requests").select("id").eq("requester_id", uid("u072")).maybeSingle();
      if (req) {
        await admin.from("arrival_help_offers").insert({ request_id: req.id, helper_id: m.profile_id });
        console.log("Seeded 1 arrival-help offer.");
      }
      break;
    }
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
