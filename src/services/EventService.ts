import { Event } from '../types';

class EventService {
  private events: Event[] = [];

  async createEvent(eventData: Omit<Event, 'id'>): Promise<Event> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newEvent: Event = {
      id: Date.now().toString(),
      ...eventData
    };
    
    this.events.push(newEvent);
    return newEvent;
  }

  async getEvents(filters?: {
    organizerId?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<Event[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let filteredEvents = [...this.events];
    
    if (filters) {
      const { organizerId, status, fromDate, toDate } = filters;
      
      if (organizerId) {
        filteredEvents = filteredEvents.filter(event => event.organizerId === organizerId);
      }
      
      if (status) {
        filteredEvents = filteredEvents.filter(event => event.status === status);
      }
      
      if (fromDate) {
        filteredEvents = filteredEvents.filter(event => new Date(event.date) >= new Date(fromDate));
      }
      
      if (toDate) {
        filteredEvents = filteredEvents.filter(event => new Date(event.date) <= new Date(toDate));
      }
    }
    
    return filteredEvents;
  }

  async getEventById(id: string): Promise<Event | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return this.events.find(event => event.id === id) || null;
  }

  async updateEvent(id: string, updates: Partial<Event>): Promise<Event> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const eventIndex = this.events.findIndex(event => event.id === id);
    if (eventIndex === -1) {
      throw new Error('Event not found');
    }
    
    const updatedEvent = {
      ...this.events[eventIndex],
      ...updates
    };
    
    this.events[eventIndex] = updatedEvent;
    return updatedEvent;
  }

  async deleteEvent(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const eventIndex = this.events.findIndex(event => event.id === id);
    if (eventIndex === -1) {
      throw new Error('Event not found');
    }
    
    this.events.splice(eventIndex, 1);
  }

  async getEventStats(eventId: string): Promise<{
    totalAttendees: number;
    ticketsSold: number;
    revenue: number;
    averageRating: number;
  }> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Simulate event statistics
    return {
      totalAttendees: Math.floor(Math.random() * 1000),
      ticketsSold: Math.floor(Math.random() * 800),
      revenue: Math.floor(Math.random() * 50000),
      averageRating: 4 + Math.random()
    };
  }

  async getUpcomingEvents(limit: number = 5): Promise<Event[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return this.events
      .filter(event => new Date(event.date) > new Date())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, limit);
  }

  async searchEvents(query: string): Promise<Event[]> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const searchTerm = query.toLowerCase();
    return this.events.filter(event => 
      event.title.toLowerCase().includes(searchTerm) ||
      event.description.toLowerCase().includes(searchTerm) ||
      event.location.toLowerCase().includes(searchTerm)
    );
  }
}

export const eventService = new EventService();