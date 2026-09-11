import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@sundman/prisma";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Deleting existing questions...");

  await prisma.question.deleteMany();

  type SeedQuestion = {
    textSv: string;
    textEn: string;
    options: [string, boolean][];
  };

  const questions: SeedQuestion[] = [
    {
      textSv:
        "VILKA TVÅ FÖRENINGAR LÅG BAKOM BILDANDET AV ÖSTERSUNDS IK 1965?",
      textEn: "WHICH TWO CLUBS FORMED ÖSTERSUNDS IK IN 1965?",
      options: [
        ["IK BOSTON & JÄRPENS IF", false],
        ["IFK ÖSTERSUND & BRUNFLO IK", false],
        ["IK BOSTON & IFK ÖSTERSUNDS ISHOCKEYSEKTION", true],
        ["IFK ÖSTERSUND & KROKOMS IF", false],
      ],
    },
    {
      textSv:
        "VILKET NAMN SPELADE KLUBBENS A-LAGSVERKSAMHET UNDER MELLAN 2003–2006?",
      textEn:
        "WHAT NAME DID THE CLUB'S SENIOR TEAM OPERATE UNDER BETWEEN 2003–2006?",
      options: [
        ["JÄMTLAND HC", false],
        ["BRUNFLO/ÖSTERSUND IF", false],
        ["ÖSTERSUND HOCKEY", false],
        ["JÄMTLAND HOCKEY", true],
      ],
    },
    {
      textSv:
        "VILKEN TIDIGARE NHL-SPELARE FANNS MED I ÖIK:S LAG NÄR KLUBBEN NÅDDE PLAYOFF TILL ELITSERIEN 1984/85?",
      textEn:
        "WHICH FORMER NHL PLAYER WAS PART OF ÖIK'S TEAM DURING THE 1984/85 PLAYOFF RUN?",
      options: [
        ["PETER FORSBERG", false],
        ["TOMMY SALO", false],
        ["ULF DAHLÉN", true],
        ["NIKLAS SUNDSTRÖM", false],
      ],
    },
    {
      textSv: "VAD HETTE ÖIK:S FÖRSTA ISHALL SOM INVIGDES 1975?",
      textEn: "WHAT WAS THE NAME OF ÖIK'S FIRST ICE ARENA OPENED IN 1975?",
      options: [
        ["ÖSTERSUND ARENA", false],
        ["JÄMTLANDSHALLEN", false],
        ["Z-HALLEN", false],
        ["Z-KUPOLEN", true],
      ],
    },
    {
      textSv: "VILKEN MINUT SÄKRADE ÖIK AVANCEMANGET TILL HOCKEYALLSVENSKAN 2022?",
      textEn:
        "IN WHICH MINUTE DID ÖIK SECURE PROMOTION TO HOCKEYALLSVENSKAN IN 2022?",
      options: [
        ["18:47", false],
        ["19:12", false],
        ["19:45", false],
        ["19:59", true],
      ],
    },
    {
      textSv: "EFTER VILKEN HÄNDELSE RITADES ÖIK:S NUVARANDE LOGOTYP OM?",
      textEn: "AFTER WHICH EVENT WAS ÖIK'S CURRENT LOGO REDESIGNED?",
      options: [
        ["UPPFLYTTNING TILL ALLSVENSKAN", false],
        ["FUSION MED BRUNFLO IK", false],
        ["Z-KUPOLEN BRANN NED", true],
        ["FLYTT TILL ÖSTERSUND ARENA", false],
      ],
    },
    {
      textSv: "VILKET NHL-LAG SÄGS INDIREKT HA BIDRAGIT TILL ATT ÖIK BILDADES?",
      textEn:
        "WHICH NHL TEAM IS SAID TO HAVE INDIRECTLY CONTRIBUTED TO THE FORMATION OF ÖIK?",
      options: [
        ["TORONTO MAPLE LEAFS", false],
        ["NEW YORK RANGERS", false],
        ["CHICAGO BLACKHAWKS", false],
        ["BOSTON BRUINS", true],
      ],
    },
    {
      textSv:
        "HUR MÅNGA ÅR TOG DET FÖR ÖIK ATT TA SIG TILLBAKA TILL SVERIGES NÄST HÖGSTA SERIE INNAN AVANCEMANGET 2022?",
      textEn:
        "HOW MANY YEARS DID IT TAKE ÖIK TO RETURN TO SWEDEN'S SECOND HIGHEST LEAGUE BEFORE 2022?",
      options: [
        ["20 ÅR", false],
        ["22 ÅR", false],
        ["25 ÅR", false],
        ["27 ÅR", true],
      ],
    },
    {
      textSv:
        "VILKEN SPELARE GJORDE DET AVGÖRANDE MÅLET SOM SÄKRADE AVANCEMANGET TILL HOCKEYALLSVENSKAN?",
      textEn:
        "WHICH PLAYER SCORED THE DECISIVE GOAL THAT SECURED PROMOTION TO HOCKEYALLSVENSKAN?",
      options: [
        ["LINUS ROTBAKKEN", false],
        ["ELIAS BJUHR", false],
        ["DAVID WESTERLUND", true],
        ["HENRIK MARKLUND", false],
      ],
    },
    {
      textSv:
        "VAD VAR ÖIK:S STÖRSTA SPORTSLIGA FRAMGÅNG FÖRE AVANCEMANGET TILL HOCKEYALLSVENSKAN 2022?",
      textEn:
        "WHAT WAS ÖIK'S GREATEST SPORTING ACHIEVEMENT BEFORE PROMOTION IN 2022?",
      options: [
        ["SM-SILVER", false],
        ["SEGER I HOCKEYETTAN", false],
        ["CHAMPIONS HOCKEY LEAGUE", false],
        ["PLAYOFF TILL ELITSERIEN 1985", true],
      ],
    },
  ];

  for (const question of questions) {
    await prisma.question.create({
      data: {
        textSv: question.textSv,
        textEn: question.textEn,
        type: "MULTIPLE_CHOICE",
        inBank: true,
        options: {
          create: question.options.map(([label, isCorrect], index) => ({
            labelSv: label,
            labelEn: label,
            letter: ["A", "B", "C", "D"][index]!,
            isCorrect,
            order: index,
          })),
        },
      },
    });
  }

  console.log(`Seed complete. Created ${questions.length} questions.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });