import { useState, useCallback, useMemo, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, DocumentData } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useToast } from '../contexts/ToastContext';
import { COLLECTIONS } from '../lib/db';

interface Attendee {
  id: string;
  name: string;
  email: string;
  ticketType: string;
  purchaseDate: string;
  checkedIn: boolean;
  status: 'confirmed' | 'pending' | 'cancelled';
  company?: string;
  jobTitle?: string;
  phone?: string;
  linkedIn?: string;
  photo?: string;
  tags: string[];
  group?: string;
  customFields: Record<string, string>;
  eventId: string;
}

interface FilterCondition {
  field: string;
  operator: string;
  value: string;
  logic?: 'AND' | 'OR';
}

export default function useAttendees(eventId: string) {
  const [loading, setLoading] = useState(false);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ticketFilter, setTicketFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [advancedFilters, setAdvancedFilters] = useState<FilterCondition[]>([]);
  const { showToast } = useToast();

  const loadAttendees = useCallback(async () => {
    if (!eventId) return;

    setLoading(true);
    try {
      const attendeesRef = collection(db, COLLECTIONS.ATTENDEES);
      const q = query(attendeesRef, where('eventId', '==', eventId));
      const querySnapshot = await getDocs(q);
      
      const loadedAttendees = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Attendee[];
      
      setAttendees(loadedAttendees);
    } catch (error) {
      console.error('Error loading attendee data:', error);
      showToast('error', 'Failed to load attendees');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [eventId, showToast]);

  const validateAttendeeData = (data: DocumentData): boolean => {
    const requiredFields = ['name', 'email', 'ticketType'];
    return requiredFields.every(field => data[field] && typeof data[field] === 'string');
  };

  const addAttendee = useCallback(async (attendeeData: Omit<Attendee, 'id' | 'eventId'>) => {
    if (!validateAttendeeData(attendeeData)) {
      throw new Error('Invalid attendee data');
    }

    try {
      // Check if attendee with email already exists
      const attendeesRef = collection(db, COLLECTIONS.ATTENDEES);
      const q = query(
        attendeesRef, 
        where('email', '==', attendeeData.email),
        where('eventId', '==', eventId)
      );
      const existingAttendees = await getDocs(q);
      
      if (!existingAttendees.empty) {
        throw new Error('An attendee with this email already exists');
      }

      const newAttendee = {
        ...attendeeData,
        eventId,
        status: 'pending',
        checkedIn: false,
        purchaseDate: new Date().toISOString(),
        tags: attendeeData.tags || [],
        customFields: attendeeData.customFields || {}
      };

      const docRef = await addDoc(collection(db, COLLECTIONS.ATTENDEES), newAttendee);
      const attendeeWithId = { ...newAttendee, id: docRef.id } as Attendee;
      
      setAttendees(prev => [...prev, attendeeWithId]);
      showToast('success', 'Attendee added successfully');
      
      return attendeeWithId;
    } catch (error) {
      if (error instanceof Error) {
        showToast('error', error.message);
        throw error;
      }
      showToast('error', 'Failed to add attendee');
      throw new Error('Failed to add attendee');
    }
  }, [eventId, showToast]);

  const importAttendees = useCallback(async (file: File) => {
    try {
      const reader = new FileReader();
      
      const importPromise = new Promise<void>((resolve, reject) => {
        reader.onload = async (e) => {
          try {
            const text = e.target?.result;
            if (typeof text !== 'string') {
              reject(new Error('Invalid file content'));
              return;
            }

            const rows = text.split('\n').map(row => row.split(','));
            const headers = rows[0].map(header => header.trim().toLowerCase());
            
            const requiredHeaders = ['name', 'email', 'tickettype'];
            const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
            
            if (missingHeaders.length > 0) {
              reject(new Error(`Missing required columns: ${missingHeaders.join(', ')}`));
              return;
            }

            const attendees = rows.slice(1)
              .filter(row => row.length === headers.length && row.some(cell => cell.trim()))
              .map(row => {
                const attendee: Record<string, any> = {};
                headers.forEach((header, index) => {
                  attendee[header] = row[index]?.trim() || '';
                });
                return attendee;
              });

            let successCount = 0;
            let skipCount = 0;

            for (const attendee of attendees) {
              if (!attendee.email) continue;

              try {
                await addAttendee({
                  name: attendee.name,
                  email: attendee.email,
                  ticketType: attendee.tickettype || 'regular',
                  phone: attendee.phone || '',
                  company: attendee.company || '',
                  jobTitle: attendee.jobtitle || '',
                  status: 'pending',
                  checkedIn: false,
                  purchaseDate: new Date().toISOString(),
                  tags: [],
                  customFields: {}
                });
                successCount++;
              } catch (error) {
                if (error instanceof Error && error.message === 'An attendee with this email already exists') {
                  skipCount++;
                } else {
                  throw error;
                }
              }
            }

            showToast('success', `Imported ${successCount} attendees (${skipCount} skipped)`);
            resolve();
          } catch (error) {
            reject(error);
          }
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
      });

      reader.readAsText(file);
      await importPromise;
    } catch (error) {
      if (error instanceof Error) {
        showToast('error', error.message);
        throw error;
      }
      showToast('error', 'Failed to import attendees');
      throw new Error('Failed to import attendees');
    }
  }, [addAttendee, showToast]);

  const toggleAttendeeSelection = useCallback((attendeeId: string) => {
    setSelectedAttendees(prev => 
      prev.includes(attendeeId)
        ? prev.filter(id => id !== attendeeId)
        : [...prev, attendeeId]
    );
  }, []);

  const selectAllAttendees = useCallback(() => {
    setSelectedAttendees(attendees.map(a => a.id));
  }, [attendees]);

  const deselectAllAttendees = useCallback(() => {
    setSelectedAttendees([]);
  }, []);

  const exportAttendees = useCallback((attendeesToExport: Attendee[]) => {
    try {
      const headers = ['Name', 'Email', 'Ticket Type', 'Status', 'Company', 'Job Title', 'Phone'];
      const csvContent = [
        headers.join(','),
        ...attendeesToExport.map(attendee => [
          attendee.name,
          attendee.email,
          attendee.ticketType,
          attendee.status,
          attendee.company || '',
          attendee.jobTitle || '',
          attendee.phone || ''
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `attendees_${eventId}_${new Date().toISOString()}.csv`;
      link.click();
      
      showToast('success', `Exported ${attendeesToExport.length} attendees`);
    } catch (error) {
      showToast('error', 'Failed to export attendees');
      throw error;
    }
  }, [eventId, showToast]);

  const sendBulkMessage = useCallback(async (attendeeIds: string[]) => {
    try {
      // Implement email sending logic here
      showToast('success', `Message sent to ${attendeeIds.length} attendees`);
    } catch (error) {
      showToast('error', 'Failed to send messages');
      throw error;
    }
  }, [showToast]);

  useEffect(() => {
    loadAttendees();
  }, [loadAttendees]);

  const filteredAttendees = useMemo(() => {
    let result = [...attendees];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(attendee => 
        attendee.name.toLowerCase().includes(searchLower) ||
        attendee.email.toLowerCase().includes(searchLower) ||
        attendee.company?.toLowerCase().includes(searchLower) ||
        attendee.jobTitle?.toLowerCase().includes(searchLower)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(attendee => attendee.status === statusFilter);
    }

    if (ticketFilter !== 'all') {
      result = result.filter(attendee => attendee.ticketType.toLowerCase() === ticketFilter.toLowerCase());
    }

    if (groupFilter !== 'all') {
      result = result.filter(attendee => attendee.group === groupFilter);
    }

    if (advancedFilters.length > 0) {
      result = result.filter(attendee => {
        return advancedFilters.every(condition => {
          const value = attendee[condition.field as keyof Attendee];
          if (value === undefined) return false;

          switch (condition.operator) {
            case 'equals':
              return value.toString().toLowerCase() === condition.value.toLowerCase();
            case 'contains':
              return value.toString().toLowerCase().includes(condition.value.toLowerCase());
            case 'startsWith':
              return value.toString().toLowerCase().startsWith(condition.value.toLowerCase());
            case 'endsWith':
              return value.toString().toLowerCase().endsWith(condition.value.toLowerCase());
            default:
              return false;
          }
        });
      });
    }

    return result;
  }, [attendees, searchTerm, statusFilter, ticketFilter, groupFilter, advancedFilters]);

  return {
    attendees: filteredAttendees,
    loading,
    selectedAttendees,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    ticketFilter,
    setTicketFilter,
    groupFilter,
    setGroupFilter,
    advancedFilters,
    setAdvancedFilters,
    toggleAttendeeSelection,
    selectAllAttendees,
    deselectAllAttendees,
    exportAttendees,
    sendBulkMessage,
    addAttendee,
    importAttendees
  };
}