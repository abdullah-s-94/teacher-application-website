import { pgTable, text, serial, integer, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  nationalId: text("national_id").notNull(),
  city: text("city").notNull(),
  birthDate: date("birth_date"),
  position: text("position").notNull(),
  qualification: text("qualification").notNull(),
  specialization: text("specialization").notNull(),
  experience: text("experience").notNull(),
  gradeType: text("grade_type").notNull(),
  grade: text("grade").notNull(),
  hasProfessionalLicense: text("has_professional_license").notNull(),
  cvFilename: text("cv_filename"),
  cvOriginalName: text("cv_original_name"),
  educationCertFilename: text("education_cert_filename"),
  educationCertOriginalName: text("education_cert_original_name"),
  workExperienceFilenames: text("work_experience_filenames"),
  workExperienceOriginalNames: text("work_experience_original_names"),
  status: text("status").default("under_review").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  status: true,
  submittedAt: true,
});

export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applications.$inferSelect;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
