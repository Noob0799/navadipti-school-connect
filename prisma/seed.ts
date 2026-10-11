import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type AttachmentOwnerType, type NotificationType, type TermName } from "@prisma/client";
import { createSessionWithTemplate, TERM_SCALE } from "../lib/academic";
import { saveFile } from "../lib/storage";

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

// Tiny but valid file bytes, so real upload/validation/thumbnail code paths
// actually run end to end instead of just inserting fake rows.
const SAMPLE_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);
const SAMPLE_PDF = Buffer.from(
  "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\nxref\n0 4\n0000000000 65535 f \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n0\n%%EOF",
  "utf-8",
);

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

type TeacherSeed = { phone: string; name: string; subjects: string[] };

const TEACHERS: TeacherSeed[] = [
  { phone: "9000000001", name: "Mrs. Sen", subjects: ["Mathematics", "English"] },
  { phone: "9000000003", name: "Mr. Dutta", subjects: ["Bengali", "Drawing"] },
  { phone: "9000000004", name: "Mr. Roy", subjects: ["Science", "History", "Geography"] },
  { phone: "9000000005", name: "Ms. Banerjee", subjects: ["General Knowledge"] },
  { phone: "9000000006", name: "Mrs. Kar", subjects: ["Mathematics", "English"] },
];

// Mathematics/English in the senior classes go to Mrs. Sen (the long-standing
// demo teacher); the same subjects in the junior classes go to Mrs. Kar, so
// every class has a teacher for every subject it offers.
function teacherPhoneForSubject(subjectName: string, className: string): string {
  if (subjectName === "Mathematics" || subjectName === "English") {
    return className === "Class 4" || className === "Class 5" ? "9000000001" : "9000000006";
  }
  if (subjectName === "Bengali" || subjectName === "Drawing") return "9000000003";
  if (subjectName === "General Knowledge") return "9000000005";
  return "9000000004"; // Science, History, Geography
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

  for (const t of TEACHERS) {
    await prisma.user.upsert({
      where: { phoneNumber: t.phone },
      update: {},
      create: { name: t.name, phoneNumber: t.phone, passwordHash, role: "TEACHER", teacherProfile: { create: {} } },
    });
    const teacher = await prisma.user.findUniqueOrThrow({ where: { phoneNumber: t.phone } });
    const subjects = await prisma.subject.findMany({ where: { name: { in: t.subjects } } });
    await prisma.teacherSubjectExpertise.createMany({
      data: subjects.map((s) => ({ teacherId: teacher.id, subjectId: s.id })),
      skipDuplicates: true,
    });
  }

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

// 41 new students on top of the existing Rahul Sen (ND-2026-0001), six per
// class, distributed as [class name, name, schoolId suffix, phone suffix].
const STUDENT_NAMES = [
  "Priya Das", "Arjun Roy", "Ananya Ghosh", "Vikram Chatterjee", "Sneha Banerjee", "Rohan Dutta",
  "Ishita Mukherjee", "Aditya Bose", "Riya Sarkar", "Kabir Chowdhury", "Meera Pal", "Siddharth Dey",
  "Tanvi Mitra", "Arnav Saha", "Nandini Chakraborty", "Dev Sengupta", "Pooja Nandi", "Karan Bhattacharya",
  "Simran Kar", "Aryan Biswas", "Divya Ganguly", "Rajat Majumdar", "Shreya Dasgupta", "Manav Sinha",
  "Tanisha Ray", "Yash Bagchi", "Avni Chanda", "Dhruv Basak", "Kiara Lahiri", "Omkar Guha",
  "Nikita Som", "Pranav Adhikari", "Mitali Halder", "Sahil Kundu", "Anusha Pramanik", "Varun Chakrabarti",
  "Trisha Mondal", "Kunal Haldar", "Esha Dam", "Rudra Kayal", "Ipsita Maitra",
];

const CLASS_ROSTER_RANGES: Record<string, [number, number]> = {
  Nursery: [0, 6],
  Transition: [6, 12],
  "Class 1": [12, 18],
  "Class 2": [18, 24],
  "Class 3": [24, 30],
  "Class 4": [30, 35], // plus Rahul Sen, below
  "Class 5": [35, 41],
};

async function seedStudents(password: string) {
  const passwordHash = await bcrypt.hash(password, 10);
  const studentsByClass = new Map<string, { id: string; name: string }[]>();

  for (const [className, [start, end]] of Object.entries(CLASS_ROSTER_RANGES)) {
    const roster: { id: string; name: string }[] = [];
    for (let i = start; i < end; i++) {
      const name = STUDENT_NAMES[i];
      const phone = `90000000${String(10 + i).padStart(2, "0")}`;
      const schoolId = `ND-2026-${String(100 + i).padStart(4, "0")}`;
      await prisma.user.upsert({
        where: { phoneNumber: phone },
        update: {},
        create: { name, phoneNumber: phone, passwordHash, role: "STUDENT", studentProfile: { create: { schoolId } } },
      });
      const user = await prisma.user.findUniqueOrThrow({ where: { phoneNumber: phone } });
      roster.push({ id: user.id, name });
    }
    studentsByClass.set(className, roster);
  }

  const rahul = await prisma.user.findUnique({ where: { phoneNumber: "9000000002" } });
  if (rahul) studentsByClass.get("Class 4")!.push({ id: rahul.id, name: "Rahul Sen" });

  return studentsByClass;
}

async function assignTeachersAndEnroll(sessionId: string, studentsByClass: Map<string, { id: string; name: string }[]>) {
  const classOfferings = await prisma.classOffering.findMany({
    where: { academicSessionId: sessionId },
    include: { schoolClass: true, offeringSubjects: { include: { subject: true } } },
  });

  for (const co of classOfferings) {
    for (const os of co.offeringSubjects) {
      const teacherPhone = teacherPhoneForSubject(os.subject.name, co.schoolClass.name);
      const teacher = await prisma.user.findUnique({ where: { phoneNumber: teacherPhone } });
      if (!teacher) continue;
      await prisma.teacherAssignment.upsert({
        where: { offeringSubjectId: os.id },
        update: { teacherId: teacher.id },
        create: { offeringSubjectId: os.id, teacherId: teacher.id },
      });
    }

    const roster = studentsByClass.get(co.schoolClass.name) ?? [];
    for (const student of roster) {
      await prisma.enrollment.upsert({
        where: { studentId_classOfferingId: { studentId: student.id, classOfferingId: co.id } },
        update: {},
        create: { studentId: student.id, classOfferingId: co.id, status: "ENROLLED" },
      });
    }
  }

  return classOfferings;
}

// ── Idempotent coursework helpers ───────────────────────────────────────

async function ensureHomework(offeringSubjectId: string, teacherId: string, title: string, description: string, deadlineDate: Date) {
  const existing = await prisma.homework.findFirst({ where: { offeringSubjectId, title } });
  if (existing) return existing;
  return prisma.homework.create({ data: { offeringSubjectId, title, description, deadlineDate, createdById: teacherId } });
}

async function ensureHomeworkSubmission(homeworkId: string, studentId: string, submittedAt: Date, remark?: string) {
  return prisma.homeworkSubmission.upsert({
    where: { homeworkId_studentId: { homeworkId, studentId } },
    update: {},
    create: { homeworkId, studentId, submittedAt, teacherRemark: remark ?? null },
  });
}

async function ensureTest(offeringSubjectId: string, termId: string, teacherId: string, deadlineDate: Date) {
  return prisma.test.upsert({
    where: { offeringSubjectId_termId: { offeringSubjectId, termId } },
    update: {},
    create: { offeringSubjectId, termId, deadlineDate, createdById: teacherId },
  });
}

async function ensureTestSubmission(testId: string, studentId: string, submittedAt: Date, marks: number | null, remark: string | undefined, gradedById: string | undefined) {
  return prisma.testSubmission.upsert({
    where: { testId_studentId: { testId, studentId } },
    update: {},
    create: {
      testId,
      studentId,
      submittedAt,
      marksObtained: marks,
      remark: remark ?? null,
      gradedById: marks !== null ? (gradedById ?? null) : null,
      gradedAt: marks !== null ? submittedAt : null,
    },
  });
}

async function ensureSyllabus(offeringSubjectId: string, termId: string, teacherId: string, content: string) {
  return prisma.syllabus.upsert({
    where: { offeringSubjectId_termId: { offeringSubjectId, termId } },
    update: {},
    create: { offeringSubjectId, termId, content, publishedById: teacherId },
  });
}

async function ensureNotification(type: NotificationType, message: string, classOfferingId: string | undefined, createdById: string, userId?: string) {
  const exists = await prisma.notification.findFirst({
    where: { type, message, classOfferingId: classOfferingId ?? null, userId: userId ?? null },
  });
  if (exists) return exists;
  return prisma.notification.create({ data: { type, message, classOfferingId, userId, createdById } });
}

async function ensureAttachment(ownerType: AttachmentOwnerType, ownerId: string, uploadedById: string, filename: string, bytes: Buffer) {
  const existing = await prisma.attachment.findFirst({ where: { ownerType, ownerId, originalFilename: filename } });
  if (existing) return existing;
  const key = await saveFile(bytes, filename);
  return prisma.attachment.create({ data: { ownerType, ownerId, fileUrl: key, originalFilename: filename, uploadedById } });
}

// ── Flagship coursework: full lifecycle of homework/test states ────────

async function seedCourseworkFor(params: {
  offeringSubjectId: string;
  teacherId: string;
  terms: Record<TermName, string>;
  roster: { id: string; name: string }[];
  classOfferingId: string;
  className: string;
  subjectName: string;
}) {
  const { offeringSubjectId, teacherId, terms, roster, classOfferingId, className, subjectName } = params;
  const slug = subjectName.toLowerCase().replace(/\s+/g, "-");

  // Syllabus: CT1 and Half Yearly published, CT2 and Annual left for later.
  await ensureSyllabus(offeringSubjectId, terms.CT1, teacherId, `${subjectName} syllabus for ${TERM_SCALE.CT1.label}: core topics and practice exercises.`);
  await ensureNotification("SYLLABUS_CHANGED", `New syllabus: ${className} ${subjectName}, ${TERM_SCALE.CT1.label}`, classOfferingId, teacherId);
  await ensureSyllabus(offeringSubjectId, terms.HALF_YEARLY, teacherId, `${subjectName} syllabus for ${TERM_SCALE.HALF_YEARLY.label}: revision of ${TERM_SCALE.CT1.label} plus two new units.`);
  await ensureNotification("SYLLABUS_CHANGED", `New syllabus: ${className} ${subjectName}, ${TERM_SCALE.HALF_YEARLY.label}`, classOfferingId, teacherId);

  // Homework 1 — past deadline, everyone submitted and remarked.
  const hw1 = await ensureHomework(offeringSubjectId, teacherId, `${subjectName} Worksheet 1`, "Complete all questions and show your working.", new Date("2026-09-20"));
  await ensureNotification("HOMEWORK_CHANGED", `New homework: ${className} ${subjectName}, ${hw1.title}`, classOfferingId, teacherId);
  for (const [i, student] of roster.entries()) {
    await ensureHomeworkSubmission(hw1.id, student.id, new Date("2026-09-19"), i % 2 === 0 ? "Well done, keep it up." : "Please show full working next time.");
  }

  // Homework 2 — past deadline, only half the class submitted (some remarked, some not).
  const hw2 = await ensureHomework(offeringSubjectId, teacherId, `${subjectName} Worksheet 2`, "Revision questions from the last two chapters.", new Date("2026-10-05"));
  await ensureNotification("HOMEWORK_CHANGED", `New homework: ${className} ${subjectName}, ${hw2.title}`, classOfferingId, teacherId);
  const half = Math.ceil(roster.length / 2);
  for (const [i, student] of roster.slice(0, half).entries()) {
    await ensureHomeworkSubmission(hw2.id, student.id, new Date("2026-10-06"), i % 2 === 0 ? "Good effort." : undefined);
  }

  // Homework 3 — upcoming deadline, nobody has submitted yet.
  const hw3 = await ensureHomework(offeringSubjectId, teacherId, `${subjectName} Worksheet 3`, "Preview questions for the next unit.", new Date("2026-11-10"));
  await ensureNotification("HOMEWORK_CHANGED", `New homework: ${className} ${subjectName}, ${hw3.title}`, classOfferingId, teacherId);

  // Test CT1 — past deadline, everyone submitted and graded, grades released.
  const testCT1 = await ensureTest(offeringSubjectId, terms.CT1, teacherId, new Date("2026-09-25"));
  await ensureNotification("TEST_CHANGED", `New test: ${className} ${subjectName}, ${TERM_SCALE.CT1.label}`, classOfferingId, teacherId);
  for (const [i, student] of roster.entries()) {
    const marks = 10 + ((i * 3) % 16);
    await ensureTestSubmission(testCT1.id, student.id, new Date("2026-09-25"), marks, marks >= TERM_SCALE.CT1.pass + 5 ? "Excellent work." : "Needs more practice.", teacherId);
  }
  await ensureNotification("GRADES_RELEASED", `Grades released: ${className} ${subjectName}, ${TERM_SCALE.CT1.label}`, classOfferingId, teacherId);

  // Test CT2 — past deadline, partially graded, one student never submitted.
  const testCT2 = await ensureTest(offeringSubjectId, terms.CT2, teacherId, new Date("2026-10-07"));
  await ensureNotification("TEST_CHANGED", `New test: ${className} ${subjectName}, ${TERM_SCALE.CT2.label}`, classOfferingId, teacherId);
  const gradedCount = Math.floor(roster.length / 2);
  for (const [i, student] of roster.entries()) {
    if (i === roster.length - 1) continue;
    const graded = i < gradedCount;
    await ensureTestSubmission(testCT2.id, student.id, new Date("2026-10-07"), graded ? 8 + (i % 15) : null, graded ? "Reviewed." : undefined, graded ? teacherId : undefined);
  }

  // Test Half Yearly — upcoming deadline, nobody has submitted yet.
  await ensureTest(offeringSubjectId, terms.HALF_YEARLY, teacherId, new Date("2026-11-20"));
  await ensureNotification("TEST_CHANGED", `New test: ${className} ${subjectName}, ${TERM_SCALE.HALF_YEARLY.label}`, classOfferingId, teacherId);

  // Real attachments through the full upload pipeline (question paper, syllabus notes, homework material).
  const ct1Syllabus = await prisma.syllabus.findUniqueOrThrow({ where: { offeringSubjectId_termId: { offeringSubjectId, termId: terms.CT1 } } });
  await ensureAttachment("SYLLABUS", ct1Syllabus.id, teacherId, `${slug}-ct1-notes.png`, SAMPLE_PNG);
  await ensureAttachment("TEST", testCT1.id, teacherId, `${slug}-ct1-question-paper.pdf`, SAMPLE_PDF);
  await ensureAttachment("HOMEWORK", hw1.id, teacherId, `${slug}-worksheet1.pdf`, SAMPLE_PDF);

  // One real submission file each, so student-side attachment views have something to show too.
  const firstStudent = roster[0];
  const hw1Sub = await prisma.homeworkSubmission.findUniqueOrThrow({ where: { homeworkId_studentId: { homeworkId: hw1.id, studentId: firstStudent.id } } });
  await ensureAttachment("HOMEWORK_SUBMISSION", hw1Sub.id, firstStudent.id, "my-answer.png", SAMPLE_PNG);
  const ct1Sub = await prisma.testSubmission.findUniqueOrThrow({ where: { testId_studentId: { testId: testCT1.id, studentId: firstStudent.id } } });
  await ensureAttachment("TEST_SUBMISSION", ct1Sub.id, firstStudent.id, "my-test-answer.png", SAMPLE_PNG);
}

async function seedRichCoursework(sessionId: string, studentsByClass: Map<string, { id: string; name: string }[]>) {
  const terms = await prisma.term.findMany({ where: { academicSessionId: sessionId } });
  const termMap: Record<TermName, string> = {
    CT1: terms.find((t) => t.name === "CT1")!.id,
    HALF_YEARLY: terms.find((t) => t.name === "HALF_YEARLY")!.id,
    CT2: terms.find((t) => t.name === "CT2")!.id,
    ANNUAL: terms.find((t) => t.name === "ANNUAL")!.id,
  };

  const flagships: { className: string; subjectName: string }[] = [
    { className: "Class 4", subjectName: "Mathematics" },
    { className: "Class 4", subjectName: "English" },
    { className: "Class 2", subjectName: "Science" },
  ];

  for (const { className, subjectName } of flagships) {
    const classOffering = await prisma.classOffering.findFirst({
      where: { academicSessionId: sessionId, schoolClass: { name: className } },
    });
    if (!classOffering) continue;
    const offeringSubject = await prisma.offeringSubject.findFirst({
      where: { classOfferingId: classOffering.id, subject: { name: subjectName } },
    });
    if (!offeringSubject) continue;
    const teacherPhone = teacherPhoneForSubject(subjectName, className);
    const teacher = await prisma.user.findUniqueOrThrow({ where: { phoneNumber: teacherPhone } });
    const roster = studentsByClass.get(className) ?? [];
    if (roster.length === 0) continue;

    await seedCourseworkFor({
      offeringSubjectId: offeringSubject.id,
      teacherId: teacher.id,
      terms: termMap,
      roster,
      classOfferingId: classOffering.id,
      className,
      subjectName,
    });
  }
}

async function main() {
  await seedProductionPrincipal();

  for (const name of SUBJECTS) {
    await prisma.subject.upsert({ where: { name }, update: {}, create: { name } });
  }

  for (const [index, name] of SCHOOL_CLASSES.entries()) {
    await prisma.schoolClass.upsert({
      where: { name },
      update: { order: index + 1 },
      create: { name, order: index + 1 },
    });
  }

  if (!(await prisma.academicSession.findFirst())) {
    await createSessionWithTemplate(prisma, "2026-27", "ACTIVE");
  }

  // Subjects must exist before this, since it looks up subject IDs by name
  // to seed each teacher's expertise.
  await seedDevAccounts();

  const devPassword = process.env.SEED_DEV_PASSWORD;
  if (!devPassword) {
    console.log(`Seeded ${SUBJECTS.length} subjects, ${SCHOOL_CLASSES.length} school classes. Set SEED_DEV_PASSWORD to also seed demo teachers, students and coursework.`);
    await prisma.$disconnect();
    return;
  }

  const session = await prisma.academicSession.findFirstOrThrow({ where: { status: "ACTIVE" } });
  const studentsByClass = await seedStudents(devPassword);
  await assignTeachersAndEnroll(session.id, studentsByClass);
  await seedRichCoursework(session.id, studentsByClass);

  const studentCount = [...studentsByClass.values()].reduce((sum, roster) => sum + roster.length, 0);
  console.log(`Seeded ${SUBJECTS.length} subjects, ${SCHOOL_CLASSES.length} school classes, ${TEACHERS.length} teachers, ${studentCount} students, and rich coursework for 3 flagship class/subject combos.`);
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
