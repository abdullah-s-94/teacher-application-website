import { users, applications, applicationSettings, type User, type InsertUser, type Application, type InsertApplication, type ApplicationSettings, type InsertApplicationSettings } from "@shared/schema";
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
  getApplicationByNationalId(nationalId: string, gender: string): Promise<Application | undefined>;
  getApplicationsByFilter(filter: {
    position?: string;
    qualification?: string;
    experienceRange?: string;
    search?: string;
    specialization?: string;
    hasProfessionalLicense?: string;
    gender?: string;
    status?: string;
  }): Promise<Application[]>;
  updateApplicationStatus(id: number, status: string): Promise<void>;
  deleteApplication(id: number): Promise<void>;
  deleteAllApplications(): Promise<void>;
  getSpecializationStats(gender?: string): Promise<Record<string, number>>;
  
  // Application settings methods
  getApplicationSettings(gender: string): Promise<ApplicationSettings | undefined>;
  updateApplicationSettings(gender: string, isOpen: string): Promise<void>;
  initializeApplicationSettings(): Promise<void>;
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

  async getApplicationByNationalId(nationalId: string, gender: string): Promise<Application | undefined> {
    const [application] = await db
      .select()
      .from(applications)
      .where(and(
        eq(applications.nationalId, nationalId),
        eq(applications.gender, gender)
      ));
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
    status?: string;
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

    if (filter.status) {
      conditions.push(eq(applications.status, filter.status));
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

  async getSpecializationStats(gender?: string): Promise<Record<string, number>> {
    const query = db
      .select({
        specialization: applications.specialization,
        customSpecialization: applications.customSpecialization,
        count: sql<number>`count(*)`.as('count')
      })
      .from(applications);
    
    // Add gender filter if provided
    if (gender) {
      query.where(eq(applications.gender, gender));
    }
    
    const results = await query.groupBy(applications.specialization, applications.customSpecialization);

    return results.reduce((acc, row) => {
      // إذا كان التخصص "أخرى" ويوجد تخصص مخصص، استخدم التخصص المخصص
      const specializationKey = row.specialization === 'أخرى' && row.customSpecialization 
        ? row.customSpecialization 
        : row.specialization;
      
      acc[specializationKey] = (acc[specializationKey] || 0) + Number(row.count);
      return acc;
    }, {} as Record<string, number>);
  }

  async getApplicationSettings(gender: string): Promise<ApplicationSettings | undefined> {
    const [settings] = await db
      .select()
      .from(applicationSettings)
      .where(eq(applicationSettings.gender, gender));
    return settings || undefined;
  }

  async updateApplicationSettings(gender: string, isOpen: string): Promise<void> {
    await db
      .insert(applicationSettings)
      .values({ gender, isOpen })
      .onConflictDoUpdate({
        target: applicationSettings.gender,
        set: { 
          isOpen,
          lastUpdated: sql`NOW()`
        }
      });
  }

  async initializeApplicationSettings(): Promise<void> {
    // Initialize settings for both genders if they don't exist
    const maleSettings = await this.getApplicationSettings('male');
    const femaleSettings = await this.getApplicationSettings('female');
    
    if (!maleSettings) {
      await db.insert(applicationSettings).values({ gender: 'male', isOpen: 'yes' });
    }
    
    if (!femaleSettings) {
      await db.insert(applicationSettings).values({ gender: 'female', isOpen: 'yes' });
    }
  }
}

export const storage = new DatabaseStorage();
