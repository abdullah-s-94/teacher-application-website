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
  }): Promise<Application[]>;
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
      .orderBy(desc(applications.submittedAt));
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
  }): Promise<Application[]> {
    const conditions = [];

    if (filter.position) {
      conditions.push(eq(applications.position, filter.position));
    }

    if (filter.qualification) {
      conditions.push(eq(applications.qualification, filter.qualification));
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
          like(applications.email, searchTerm),
          like(applications.specialization, searchTerm)
        )
      );
    }

    if (conditions.length > 0) {
      return await db
        .select()
        .from(applications)
        .where(and(...conditions))
        .orderBy(desc(applications.submittedAt));
    }
    
    return await db
      .select()
      .from(applications)
      .orderBy(desc(applications.submittedAt));
  }
}

export const storage = new DatabaseStorage();
