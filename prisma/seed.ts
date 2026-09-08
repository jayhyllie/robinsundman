import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@sundman/prisma";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const companies = [
    "Jämtkraft",
    "Diös",
    "Bilbolaget",
    "SCA",
    "Peab",
    "Länstrafiken",
    "Östersundshem",
    "Mittsverigebanan",
  ];

  for (const name of companies) {
    await prisma.company.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }

  const now = new Date();
  const seasonPeriod = await prisma.leaderboardPeriod.upsert({
    where: { id: "seed-season-25-26" },
    create: {
      id: "seed-season-25-26",
      nameSv: "Säsong 25/26",
      nameEn: "Season 25/26",
      type: "SEASON",
      startsAt: now,
      isActive: true,
    },
    update: {},
  });

  const monthNameSv = now.toLocaleString("sv-SE", {
    month: "long",
    year: "numeric",
  });
  const monthNameEn = now.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  await prisma.leaderboardPeriod.upsert({
    where: { id: "seed-monthly-current" },
    create: {
      id: "seed-monthly-current",
      nameSv: monthNameSv,
      nameEn: monthNameEn,
      type: "MONTHLY",
      startsAt: new Date(now.getFullYear(), now.getMonth(), 1),
      isActive: true,
    },
    update: {},
  });

  const jämtkraft = await prisma.company.findUnique({where: { name: "Jämtkraft" }});
  const diös = await prisma.company.findUnique({ where: { name: "Diös" } });
  const bilbolaget = await prisma.company.findUnique({ where: { name: "Bilbolaget" } });
  const sca = await prisma.company.findUnique({ where: { name: "SCA" } });
  const peab = await prisma.company.findUnique({ where: { name: "Peab" } });

  if (jämtkraft && diös && bilbolaget && sca && peab) {
    await prisma.companyScore.upsert({
      where: {
        companyId_periodId: {
          companyId: jämtkraft.id,
          periodId: seasonPeriod.id,
        },
      },
      create: { companyId: jämtkraft.id, periodId: seasonPeriod.id, points: 184 },
      update: {},
    });
    await prisma.companyScore.upsert({
      where: {
        companyId_periodId: {
          companyId: diös.id,
          periodId: seasonPeriod.id,
        },
      },
      create: { companyId: diös.id, periodId: seasonPeriod.id, points: 162 },
      update: {},
    });
    await prisma.companyScore.upsert({
      where: {
        companyId_periodId: {
          companyId: bilbolaget.id,
          periodId: seasonPeriod.id,
        },
      },
      create: { companyId: bilbolaget.id, periodId: seasonPeriod.id, points: 140 },
      update: {},
    });
    await prisma.companyScore.upsert({
      where: {
        companyId_periodId: {
          companyId: sca.id,
          periodId: seasonPeriod.id,
        },
      },
      create: { companyId: sca.id, periodId: seasonPeriod.id, points: 120 },
      update: {},
    });
    await prisma.companyScore.upsert({
      where: {
        companyId_periodId: {
          companyId: peab.id,
          periodId: seasonPeriod.id,
        },
      },
      create: { companyId: peab.id, periodId: seasonPeriod.id, points: 100 },
      update: {},
    });
  }

  const existingQuestions = await prisma.question.count();
  if (existingQuestions === 0) {
    await prisma.question.create({
      data: {
        textSv:
          "VILKEN SPELARE GJORDE ÖIK:S FÖRSTA MÅL NÅGONSIN I HOCKEYALLSVENSKAN?",
        textEn:
          "WHICH PLAYER SCORED ÖIK'S FIRST GOAL EVER IN HOCKEYALLSVENSKAN?",
        type: "MULTIPLE_CHOICE",
        inBank: true,
        options: {
          create: [
            {
              labelSv: "MARTIN MAGNUSSON",
              labelEn: "MARTIN MAGNUSSON",
              letter: "A",
              isCorrect: true,
              order: 0,
            },
            {
              labelSv: "DANIEL ÖHRN",
              labelEn: "DANIEL ÖHRN",
              letter: "B",
              isCorrect: false,
              order: 1,
            },
            {
              labelSv: "MARKUS LINDGREN",
              labelEn: "MARKUS LINDGREN",
              letter: "C",
              isCorrect: false,
              order: 2,
            },
            {
              labelSv: "KRISTOFFER LINDSTRÖM",
              labelEn: "KRISTOFFER LINDSTRÖM",
              letter: "D",
              isCorrect: false,
              order: 3,
            },
          ],
        },
      },
    });

    await prisma.question.create({
      data: {
        textSv: "VILKET ÅR GRUNDADES ÖSTERSUNDS IK?",
        textEn: "IN WHICH YEAR WAS ÖSTERSUNDS IK FOUNDED?",
        type: "MULTIPLE_CHOICE",
        inBank: true,
        options: {
          create: [
            {
              labelSv: "1965",
              letter: "A",
              isCorrect: true,
              order: 0,
            },
            {
              labelSv: "1972",
              letter: "B",
              isCorrect: false,
              order: 1,
            },
            {
              labelSv: "1958",
              letter: "C",
              isCorrect: false,
              order: 2,
            },
            {
              labelSv: "1985",
              letter: "D",
              isCorrect: false,
              order: 3,
            },
          ],
        },
      },
    });

    await prisma.question.create({
      data: {
        textSv: "VAD HETER ÖIK:S HEMMAAREN A?",
        textEn: "WHAT IS ÖIK'S HOME ARENA CALLED?",
        type: "FREE_TEXT",
        inBank: true,
      },
    });
  }

  console.log("Seed complete: companies, leaderboards, sample questions");

  // Tips / match prediction seed
  const oik = await prisma.hockeyTeam.upsert({
    where: { id: "seed-team-oik" },
    create: {
      id: "seed-team-oik",
      name: "Östersunds IK",
      shortName: "ÖIK",
      isHomeClub: true,
    },
    update: { isHomeClub: true },
  });

  const awayTeams = [
    { id: "seed-team-bjk", name: "Björklöven", shortName: "BJÖ" },
    { id: "seed-team-moj", name: "Modo Hockey", shortName: "MODO" },
    { id: "seed-team-aik", name: "AIK", shortName: "AIK" },
  ];

  for (const t of awayTeams) {
    await prisma.hockeyTeam.upsert({
      where: { id: t.id },
      create: { ...t, isHomeClub: false },
      update: {},
    });
  }

  const sponsor = await prisma.sponsor.upsert({
    where: { id: "seed-sponsor-jamtkraft" },
    create: {
      id: "seed-sponsor-jamtkraft",
      name: "Jämtkraft",
      campaignText: "Tippa rätt – vinn matchbiljetter",
      primaryColor: "#ffd700",
      accentColor: "#a4c639",
      isActive: true,
    },
    update: {},
  });

  const puckDrop = new Date(Date.now() + 3 * 60 * 60 * 1000);
  await prisma.predictionMatch.upsert({
    where: { slug: "oik-vs-bjorkloven" },
    create: {
      slug: "oik-vs-bjorkloven",
      homeTeamId: oik.id,
      awayTeamId: "seed-team-bjk",
      sponsorId: sponsor.id,
      puckDropAt: puckDrop,
      status: "OPEN",
      predictionCount: 0,
    },
    update: {
      puckDropAt: puckDrop,
      status: "OPEN",
    },
  });

  console.log("Seed complete: tips teams, sponsor, sample match");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
