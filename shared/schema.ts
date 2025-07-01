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
  customSpecialization: text("custom_specialization"), // للتخصص المخصص عند اختيار "أخرى"
  experience: text("experience").notNull(),
  gradeType: text("grade_type").notNull(),
  grade: text("grade").notNull(),
  hasProfessionalLicense: text("has_professional_license").notNull(),
  gender: text("gender").notNull(), // 'male' or 'female'
  cvFilename: text("cv_filename"),
  cvOriginalName: text("cv_original_name"),
  cvCloudinaryId: text("cv_cloudinary_id"),
  cvCloudinaryUrl: text("cv_cloudinary_url"),
  educationCertFilename: text("education_cert_filename"),
  educationCertOriginalName: text("education_cert_original_name"),
  educationCertCloudinaryId: text("education_cert_cloudinary_id"),
  educationCertCloudinaryUrl: text("education_cert_cloudinary_url"),
  workExperienceFilenames: text("work_experience_filenames"),
  workExperienceOriginalNames: text("work_experience_original_names"),
  workExperienceCloudinaryIds: text("work_experience_cloudinary_ids"),
  workExperienceCloudinaryUrls: text("work_experience_cloudinary_urls"),
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

export const applicationSettings = pgTable("application_settings", {
  id: serial("id").primaryKey(),
  gender: text("gender").notNull().unique(), // 'male' or 'female'
  isOpen: text("is_open").default("yes").notNull(), // 'yes' or 'no'
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const insertApplicationSettingsSchema = createInsertSchema(applicationSettings).omit({
  id: true,
  lastUpdated: true,
});

export type InsertApplicationSettings = z.infer<typeof insertApplicationSettingsSchema>;
export type ApplicationSettings = typeof applicationSettings.$inferSelect;
