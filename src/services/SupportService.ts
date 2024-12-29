interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date;
  updatedAt: Date;
  assignedTo?: string;
  tenantId: string;
}

export class SupportService {
  private tickets: Map<string, Ticket> = new Map();

  async createTicket(data: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>): Promise<Ticket> {
    const id = Date.now().toString();
    const ticket: Ticket = {
      ...data,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'open'
    };
    
    this.tickets.set(id, ticket);
    return ticket;
  }

  async getTicket(id: string): Promise<Ticket | undefined> {
    return this.tickets.get(id);
  }

  async updateTicket(id: string, data: Partial<Ticket>): Promise<Ticket | undefined> {
    const ticket = this.tickets.get(id);
    if (!ticket) return undefined;

    const updatedTicket = {
      ...ticket,
      ...data,
      updatedAt: new Date()
    };
    
    this.tickets.set(id, updatedTicket);
    return updatedTicket;
  }

  async getTicketsByTenant(tenantId: string): Promise<Ticket[]> {
    return Array.from(this.tickets.values())
      .filter(ticket => ticket.tenantId === tenantId);
  }

  async startChat(userId: string): Promise<{ chatId: string }> {
    // Simulated chat initialization
    return { chatId: `chat_${Date.now()}` };
  }
}

export const supportService = new SupportService();