import { applications, type Application, type InsertApplication, type User, type InsertUser } from "@shared/schema";

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private applications: Map<number, Application>;
  private currentUserId: number;
  private currentApplicationId: number;

  constructor() {
    this.users = new Map();
    this.applications = new Map();
    this.currentUserId = 1;
    this.currentApplicationId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const id = this.currentApplicationId++;
    const application: Application = {
      ...insertApplication,
      id,
      submittedAt: new Date(),
      cvFilename: insertApplication.cvFilename || null,
      cvOriginalName: insertApplication.cvOriginalName || null,
    };
    this.applications.set(id, application);
    return application;
  }

  async getAllApplications(): Promise<Application[]> {
    return Array.from(this.applications.values()).sort(
      (a, b) => b.submittedAt.getTime() - a.submittedAt.getTime()
    );
  }

  async getApplicationById(id: number): Promise<Application | undefined> {
    return this.applications.get(id);
  }

  async getApplicationsByFilter(filter: {
    position?: string;
    qualification?: string;
    experienceRange?: string;
    search?: string;
  }): Promise<Application[]> {
    let apps = Array.from(this.applications.values());

    if (filter.position) {
      apps = apps.filter(app => app.position === filter.position);
    }

    if (filter.qualification) {
      apps = apps.filter(app => app.qualification === filter.qualification);
    }

    if (filter.experienceRange) {
      apps = apps.filter(app => {
        const exp = parseInt(app.experience);
        switch (filter.experienceRange) {
          case '0-2':
            return exp >= 0 && exp <= 2;
          case '3-5':
            return exp >= 3 && exp <= 5;
          case '6-10':
            return exp >= 6 && exp <= 10;
          default:
            return true;
        }
      });
    }

    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      apps = apps.filter(app => 
        app.fullName.toLowerCase().includes(searchLower) ||
        app.email.toLowerCase().includes(searchLower) ||
        app.specialization.toLowerCase().includes(searchLower)
      );
    }

    return apps.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
  }
}

export const storage = new MemStorage();
