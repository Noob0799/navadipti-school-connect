import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type TermName } from "@prisma/client";
import { createSessionWithTemplate } from "../lib/academic";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const SUBJECTS = [
  "English",
  "Bengali",
  "Mathematics",
  "Drawing",
  "General Knowledge",
  "Science",
  "History",
  "Geography",
];

const SCHOOL_CLASSES = [
  "Nursery",
  "Transition",
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
];

async function seedProductionPrincipal() {
  const phone = process.env.SEED_PRINCIPAL_PHONE;
  const password = process.env.SEED_PRINCIPAL_PASSWORD;
  if (!phone || !password) return;
  await prisma.user.upsert({
    where: { phoneNumber: phone },
    update: {},
    create: {
      name: process.env.SEED_PRINCIPAL_NAME || "Principal",
      phoneNumber: phone,
      passwordHash: await bcrypt.hash(password, 10),
      role: "PRINCIPAL",
    },
  });
}

async function seedDevAccounts() {
  const password = process.env.SEED_DEV_PASSWORD;
  if (!password) return;
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { phoneNumber: "9000000000" },
    update: {},
    create: { name: "Principal Gupta", phoneNumber: "9000000000", passwordHash, role: "PRINCIPAL" },
  });

  await prisma.user.upsert({
    where: { phoneNumber: "9000000001" },
    update: {},
    create: {
      name: "Mrs. Sen",
      phoneNumber: "9000000001",
      passwordHash,
      role: "TEACHER",
      teacherProfile: { create: {} },
    },
  });

  await prisma.user.upsert({
    where: { phoneNumber: "9000000002" },
    update: {},
    create: {
      name: "Rahul Sen",
      phoneNumber: "9000000002",
      passwordHash,
      role: "STUDENT",
      studentProfile: { create: { schoolId: "ND-2026-0001" } },
    },
  });
}

async function seedDemoClassroom() {
  const teacher = await prisma.user.findUnique({ where: { phoneNumber: "9000000001" } });
  const student = await prisma.user.findUnique({ where: { phoneNumber: "9000000002" } });
  const session = await prisma.academicSession.findFirst({ where: { status: "ACTIVE" } });
  if (!teacher || !student || !session) return;

  const classOffering = await prisma.classOffering.findFirst({
    where: { academicSessionId: session.id, schoolClass: { name: "Class 4" } },
  });
  if (!classOffering) return;

  const offeringSubjects = await prisma.offeringSubject.findMany({
    where: { classOfferingId: classOffering.id, subject: { name: { in: ["Mathematics", "English"] } } },
    include: { subject: true },
  });
  const maths = offeringSubjects.find((o) => o.subject.name === "Mathematics");
  const english = offeringSubjects.find((o) => o.subject.name === "English");
  if (!maths || !english) return;

  await prisma.enrollment.upsert({
    where: { studentId_classOfferingId: { studentId: student.id, classOfferingId: classOffering.id } },
    update: {},
    create: { studentId: student.id, classOfferingId: classOffering.id, status: "ENROLLED" },
  });

  for (const os of [maths, english]) {
    await prisma.teacherAssignment.upsert({
      where: { offeringSubjectId: os.id },
      update: { teacherId: teacher.id },
      create: { offeringSubjectId: os.id, teacherId: teacher.id },
    });
  }

  const terms = await prisma.term.findMany({ where: { academicSessionId: session.id } });
  const term = (name: TermName) => terms.find((t) => t.name === name);
  const ct1 = term("CT1");
  const halfYearly = term("HALF_YEARLY");
  if (!ct1 || !halfYearly) return;

  if ((await prisma.homework.count({ where: { offeringSubjectId: maths.id } })) === 0) {
    await prisma.homework.create({
      data: {
        offeringSubjectId: maths.id,
        title: "Chapter 5 exercises",
        description: "Solve questions 1 to 10 from page 42. Show your steps.",
        deadlineDate: new Date("2026-10-08"),
        createdById: teacher.id,
      },
    });
    await prisma.homework.create({
      data: {
        offeringSubjectId: english.id,
        title: "Reading: The Kind Crow",
        description: "Read the story aloud twice. Write two lines on why the crow shared its food.",
        deadlineDate: new Date("2026-10-10"),
        createdById: teacher.id,
      },
    });
  }

  await prisma.syllabus.upsert({
    where: { offeringSubjectId_termId: { offeringSubjectId: maths.id, termId: ct1.id } },
    update: {},
    create: {
      offeringSubjectId: maths.id,
      termId: ct1.id,
      content: "Numbers up to 10,000. Addition and subtraction with carrying. Word problems.",
      publishedById: teacher.id,
    },
  });

  const mathsTest = await prisma.test.upsert({
    where: { offeringSubjectId_termId: { offeringSubjectId: maths.id, termId: ct1.id } },
    update: {},
    create: {
      offeringSubjectId: maths.id,
      termId: ct1.id,
      title: "Maths Class Test 1",
      deadlineDate: new Date("2026-10-02"),
      createdById: teacher.id,
    },
  });
  await prisma.testSubmission.upsert({
    where: { testId_studentId: { testId: mathsTest.id, studentId: student.id } },
    update: {},
    create: {
      testId: mathsTest.id,
      studentId: student.id,
      submittedAt: new Date("2026-10-02"),
      marksObtained: 20,
      remark: "Neat work",
      gradedById: teacher.id,
      gradedAt: new Date("2026-10-03"),
    },
  });

  await prisma.test.upsert({
    where: { offeringSubjectId_termId: { offeringSubjectId: english.id, termId: halfYearly.id } },
    update: {},
    create: {
      offeringSubjectId: english.id,
      termId: halfYearly.id,
      title: "English Half Yearly",
      deadlineDate: new Date("2026-11-20"),
      createdById: teacher.id,
    },
  });

  if ((await prisma.notification.count({ where: { classOfferingId: classOffering.id } })) === 0) {
    await prisma.notification.create({
      data: {
        type: "HOMEWORK_CHANGED",
        message: "New homework: Class 4 Mathematics, Chapter 5 exercises",
        classOfferingId: classOffering.id,
        createdById: teacher.id,
      },
    });
  }
}

async function main() {
  await seedProductionPrincipal();
  await seedDevAccounts();

  for (const name of SUBJECTS) {
    await prisma.subject.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  for (const [index, name] of SCHOOL_CLASSES.entries()) {
    await prisma.schoolClass.upsert({
      where: { name },
      update: { order: index + 1 },
      create: { name, order: index + 1 },
    });
  }

  const mrsSen = await prisma.user.findUnique({ where: { phoneNumber: "9000000001" } });
  const expertSubjects = await prisma.subject.findMany({ where: { name: { in: ["Mathematics", "English"] } } });
  if (mrsSen) {
    await prisma.teacherSubjectExpertise.createMany({
      data: expertSubjects.map((subject) => ({ teacherId: mrsSen.id, subjectId: subject.id })),
      skipDuplicates: true,
    });
  }

  if (!(await prisma.academicSession.findFirst())) {
    await createSessionWithTemplate(prisma, "2026-27", "ACTIVE");
  }

  await seedDemoClassroom();
}

main()
  .then(async () => {
    console.log(`Seeded ${SUBJECTS.length} subjects and ${SCHOOL_CLASSES.length} school classes.`);
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
