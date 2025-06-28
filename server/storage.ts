import { users, applications, type User, type InsertUser, type Application, type InsertApplication } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, like, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Application methods
  createApplication(application: InsertApplication): Promise<Application>;
  getAllApplications(): Promise<Application[]>;
  getApplicationById(id: number): Promise<Application | undefined>;
  getApplicationsByFilter(filter: {
    position?: string;
    qualification?: string;
    experienceRange?: string;
    search?: string;
    specialization?: string;
    hasProfessionalLicense?: string;
    gender?: string;
  }): Promise<Application[]>;
  updateApplicationStatus(id: number, status: string): Promise<void>;
  deleteApplication(id: number): Promise<void>;
  deleteAllApplications(): Promise<void>;
  getSpecializationStats(): Promise<Record<string, number>>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const [application] = await db
      .insert(applications)
      .values(insertApplication)
      .returning();
    return application;
  }

  async getAllApplications(): Promise<Application[]> {
    return await db
      .select()
      .from(applications)
      .orderBy(
        sql`CASE 
          WHEN ${applications.status} = 'under_review' THEN 1 
          WHEN ${applications.status} = 'accepted' THEN 2 
          WHEN ${applications.status} = 'rejected' THEN 3 
          ELSE 4 
        END`,
        desc(applications.submittedAt)
      );
  }

  async getApplicationById(id: number): Promise<Application | undefined> {
    const [application] = await db
      .select()
      .from(applications)
      .where(eq(applications.id, id));
    return application || undefined;
  }

  async getApplicationsByFilter(filter: {
    position?: string;
    qualification?: string;
    experienceRange?: string;
    search?: string;
    specialization?: string;
    hasProfessionalLicense?: string;
    gender?: string;
  }): Promise<Application[]> {
    const conditions = [];

    if (filter.position) {
      conditions.push(eq(applications.position, filter.position));
    }

    if (filter.qualification) {
      conditions.push(eq(applications.qualification, filter.qualification));
    }

    if (filter.specialization) {
      // Handle both new standardized values and legacy values
      const specializationMapping: Record<string, string[]> = {
        'طفولة مبكرة': ['early_childhood', 'طفولة مبكرة', 'طفولة مبكره', 'معلم', 'معلم '],
        'لغة عربية': ['arabic', 'لغة عربية'],
        'لغة انجليزية': ['english', 'لغة انجليزية', 'بكالوريوس انجليش', 'بكالوريوس انجليش '],
        'حاسب الي': ['computer_science', 'حاسب الي'],
        'رياضيات': ['mathematics', 'رياضيات'],
        'كيمياء': ['chemistry', 'كيمياء'],
        'فيزياء': ['physics', 'فيزياء'],
        'تاريخ': ['history', 'تاريخ'],
        'جغرافيا': ['geography', 'جغرافيا'],
        'ادارة اعمال': ['business_administration', 'ادارة اعمال', 'ادارة اعمال '],
        'احياء': ['biology', 'احياء'],
        'اقتصاد منزلي': ['home_economics', 'اقتصاد منزلي'],
        'تربية إسلامية': ['islamic_education', 'تربية إسلامية', 'religion', 'دين', 'شريعة'],
        'تربية بدنية': ['تربية بدنية']
      };
      
      const matchingValues = specializationMapping[filter.specialization] || [filter.specialization];
      const specializationConditions = matchingValues.map(value => eq(applications.specialization, value));
      conditions.push(or(...specializationConditions));
    }

    if (filter.hasProfessionalLicense) {
      conditions.push(eq(applications.hasProfessionalLicense, filter.hasProfessionalLicense));
    }

    if (filter.experienceRange) {
      const [min, max] = filter.experienceRange.split('-').map(Number);
      conditions.push(
        and(
          sql`CAST(${applications.experience} AS INTEGER) >= ${min}`,
          sql`CAST(${applications.experience} AS INTEGER) <= ${max}`
        )
      );
    }

    if (filter.search) {
      const searchTerm = `%${filter.search}%`;
      conditions.push(
        or(
          like(applications.fullName, searchTerm),
          like(applications.nationalId, searchTerm),
          like(applications.specialization, searchTerm)
        )
      );
    }

    if (filter.hasProfessionalLicense) {
      conditions.push(
        eq(applications.hasProfessionalLicense, filter.hasProfessionalLicense)
      );
    }

    if (filter.gender) {
      conditions.push(eq(applications.gender, filter.gender));
    }

    if (conditions.length > 0) {
      return await db
        .select()
        .from(applications)
        .where(and(...conditions))
        .orderBy(
          sql`CASE 
            WHEN ${applications.status} = 'under_review' THEN 1 
            WHEN ${applications.status} = 'accepted' THEN 2 
            WHEN ${applications.status} = 'rejected' THEN 3 
            ELSE 4 
          END`,
          desc(applications.submittedAt)
        );
    }
    
    return await db
      .select()
      .from(applications)
      .orderBy(
        sql`CASE 
          WHEN ${applications.status} = 'under_review' THEN 1 
          WHEN ${applications.status} = 'accepted' THEN 2 
          WHEN ${applications.status} = 'rejected' THEN 3 
          ELSE 4 
        END`,
        desc(applications.submittedAt)
      );
  }

  async updateApplicationStatus(id: number, status: string): Promise<void> {
    await db
      .update(applications)
      .set({ status })
      .where(eq(applications.id, id));
  }

  async deleteApplication(id: number): Promise<void> {
    await db
      .delete(applications)
      .where(eq(applications.id, id));
  }

  async deleteAllApplications(): Promise<void> {
    await db.delete(applications);
  }

  async getSpecializationStats(): Promise<Record<string, number>> {
    const results = await db
      .select({
        specialization: applications.specialization,
        count: sql<number>`count(*)`.as('count')
      })
      .from(applications)
      .groupBy(applications.specialization);

    return results.reduce((acc, row) => {
      acc[row.specialization] = Number(row.count);
      return acc;
    }, {} as Record<string, number>);
  }
}

export const storage = new DatabaseStorage();
