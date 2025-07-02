import { pgTable, text, serial, integer, timestamp, date, boolean } from "drizzle-orm/pg-core";
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
  // نفاذ integration fields
  nafathVerified: boolean("nafath_verified").default(false),
  nafathTransactionId: text("nafath_transaction_id"),
  nafathVerificationTime: timestamp("nafath_verification_time"),
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

// نفاذ Sessions table for OAuth flow management
export const nafathSessions = pgTable("nafath_sessions", {
  id: serial("id").primaryKey(),
  sessionToken: text("session_token").notNull().unique(),
  state: text("state").notNull(),
  gender: text("gender").notNull(), // 'male' or 'female'
  oauthCode: text("oauth_code"),
  accessToken: text("access_token"),
  userData: text("user_data"), // JSON string of نفاذ user data
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const insertNafathSessionSchema = createInsertSchema(nafathSessions).omit({
  id: true,
  createdAt: true,
});

export type InsertNafathSession = z.infer<typeof insertNafathSessionSchema>;
export type NafathSession = typeof nafathSessions.$inferSelect;
