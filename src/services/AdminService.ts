import { User, Tenant, Event, SystemHealth } from '../types';
import { aiService } from './AIService';
import { securityService } from './SecurityService';

class AdminService {
  private static instance: AdminService;
  private baseUrl = '/api/admin';

  // Tenant Management
  async getTenants(): Promise<Tenant[]> {
    const response = await fetch(`${this.baseUrl}/tenants`);
    return response.json();
  }

  async createTenant(tenantData: Partial<Tenant>): Promise<Tenant> {
    const response = await fetch(`${this.baseUrl}/tenants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tenantData)
    });
    return response.json();
  }

  async updateTenant(id: string, updates: Partial<Tenant>): Promise<Tenant> {
    const response = await fetch(`${this.baseUrl}/tenants/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return response.json();
  }

  async deleteTenant(id: string): Promise<void> {
    await fetch(`${this.baseUrl}/tenants/${id}`, {
      method: 'DELETE'
    });
  }

  // User Management
  async getUsers(tenantId?: string): Promise<User[]> {
    const url = tenantId ? 
      `${this.baseUrl}/tenants/${tenantId}/users` :
      `${this.baseUrl}/users`;
    const response = await fetch(url);
    return response.json();
  }

  async createUser(userData: Partial<User>, tenantId?: string): Promise<User> {
    const url = tenantId ?
      `${this.baseUrl}/tenants/${tenantId}/users` :
      `${this.baseUrl}/users`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return response.json();
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const response = await fetch(`${this.baseUrl}/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return response.json();
  }

  async deleteUser(userId: string): Promise<void> {
    await fetch(`${this.baseUrl}/users/${userId}`, {
      method: 'DELETE'
    });
  }

  // Event Management
  async getEvents(filters?: any): Promise<Event[]> {
    const queryString = filters ? `?${new URLSearchParams(filters)}` : '';
    const response = await fetch(`${this.baseUrl}/events${queryString}`);
    return response.json();
  }

  async updateEvent(eventId: string, updates: Partial<Event>): Promise<Event> {
    const response = await fetch(`${this.baseUrl}/events/${eventId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return response.json();
  }

  async deleteEvent(eventId: string): Promise<void> {
    await fetch(`${this.baseUrl}/events/${eventId}`, {
      method: 'DELETE'
    });
  }

  // System Health & Monitoring
  async getSystemHealth(): Promise<SystemHealth> {
    const response = await fetch(`${this.baseUrl}/system/health`);
    return response.json();
  }

  async getSystemMetrics(timeRange: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/system/metrics?range=${timeRange}`);
    return response.json();
  }

  // AI Insights
  async generateInsights(tenantId?: string): Promise<any> {
    const data = await this.getSystemMetrics('30d');
    return aiService.analyzeEngagement(data);
  }

  // Security & Compliance
  async updateSecuritySettings(settings: any): Promise<void> {
    await fetch(`${this.baseUrl}/security/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
  }

  async getAuditLogs(filters?: any): Promise<any[]> {
    const queryString = filters ? `?${new URLSearchParams(filters)}` : '';
    const response = await fetch(`${this.baseUrl}/audit-logs${queryString}`);
    return response.json();
  }

  // Backup & Recovery
  async createBackup(): Promise<{ id: string; status: string }> {
    const response = await fetch(`${this.baseUrl}/backups`, {
      method: 'POST'
    });
    return response.json();
  }

  async restoreBackup(backupId: string): Promise<{ status: string }> {
    const response = await fetch(`${this.baseUrl}/backups/${backupId}/restore`, {
      method: 'POST'
    });
    return response.json();
  }

  // API Management
  async getApiKeys(): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/api-keys`);
    return response.json();
  }

  async createApiKey(name: string, permissions: string[]): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api-keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, permissions })
    });
    return response.json();
  }

  async revokeApiKey(keyId: string): Promise<void> {
    await fetch(`${this.baseUrl}/api-keys/${keyId}`, {
      method: 'DELETE'
    });
  }

  // Support & Tickets
  async getSupportTickets(status?: string): Promise<any[]> {
    const queryString = status ? `?status=${status}` : '';
    const response = await fetch(`${this.baseUrl}/support/tickets${queryString}`);
    return response.json();
  }

  async updateTicketStatus(ticketId: string, status: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/support/tickets/${ticketId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return response.json();
  }

  // Content Moderation
  async getFlaggedContent(): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/moderation/flagged`);
    return response.json();
  }

  async moderateContent(contentId: string, action: 'approve' | 'reject', reason?: string): Promise<void> {
    await fetch(`${this.baseUrl}/moderation/${contentId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, reason })
    });
  }

  // Billing & Subscriptions
  async getSubscriptionPlans(): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/billing/plans`);
    return response.json();
  }

  async updateSubscriptionPlan(planId: string, updates: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/billing/plans/${planId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return response.json();
  }

  // Utility Methods
  async impersonateUser(userId: string): Promise<{ token: string }> {
    const response = await fetch(`${this.baseUrl}/impersonate/${userId}`, {
      method: 'POST'
    });
    return response.json();
  }

  async exportData(type: string, filters?: any): Promise<Blob> {
    const queryString = filters ? `?${new URLSearchParams(filters)}` : '';
    const response = await fetch(`${this.baseUrl}/export/${type}${queryString}`);
    return response.blob();
  }

  // Singleton Instance
  static getInstance(): AdminService {
    if (!AdminService.instance) {
      AdminService.instance = new AdminService();
    }
    return AdminService.instance;
  }
}

export const adminService = AdminService.getInstance();