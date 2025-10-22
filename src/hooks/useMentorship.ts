import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import type { Database } from '@/integrations/supabase/types';

type Mentor = Database['public']['Tables']['mentors']['Row'];
type Session = Database['public']['Tables']['sessions']['Row'];
type Booking = Database['public']['Tables']['bookings']['Row'];

export function useMentorship() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all mentors
  const fetchMentors = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('mentors')
        .select('*')
        .eq('verified', true)
        .order('rating', { ascending: false });

      if (error) throw error;
      setMentors(data || []);
    } catch (error) {
      console.error('Error fetching mentors:', error);
      toast({
        title: "Error",
        description: "Failed to load mentors",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Fetch user sessions
  const fetchSessions = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .or(`mentor_id.eq.${user.id},learner_id.eq.${user.id}`)
        .order('date', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast({
        title: "Error",
        description: "Failed to load sessions",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  // Fetch user bookings
  const fetchBookings = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .or(`mentor_id.eq.${user.id},learner_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  // Get mentor availability
  const getMentorAvailability = useCallback(async (mentorId: string, date?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('get-mentor-availability', {
        body: { mentorId, date },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching mentor availability:', error);
      toast({
        title: "Error",
        description: "Failed to load availability",
        variant: "destructive",
      });
      return { availableTimes: [] };
    }
  }, [toast]);

  // Create booking
  const createBooking = useCallback(async (bookingData: {
    mentorId: string;
    date: string;
    duration: number;
    topic: string;
  }) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to book a session",
        variant: "destructive",
      });
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-booking', {
        body: bookingData,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Booking created successfully",
      });

      // Refresh bookings
      await fetchBookings();
      return data.booking;
    } catch (error: any) {
      console.error('Error creating booking:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create booking",
        variant: "destructive",
      });
      return null;
    }
  }, [user, toast, fetchBookings]);

  // Manage session
  const manageSession = useCallback(async (actionData: {
    action: 'start' | 'complete' | 'cancel' | 'update';
    sessionId: string;
    feedback?: string;
    rating?: number;
    notes?: string;
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-session', {
        body: actionData,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: data.message,
      });

      // Refresh sessions
      await fetchSessions();
      return data.session;
    } catch (error: any) {
      console.error('Error managing session:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update session",
        variant: "destructive",
      });
      return null;
    }
  }, [toast, fetchSessions]);

  // Confirm booking (convert booking to session after payment)
  const confirmBooking = useCallback(async (bookingId: string) => {
    try {
      // First get the booking
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (fetchError) throw fetchError;

      // Create session from booking
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          mentor_id: booking.mentor_id,
          learner_id: booking.learner_id,
          mentor_name: booking.mentor_name,
          learner_name: booking.learner_name,
          date: booking.date,
          duration: booking.duration,
          topic: booking.topic,
          status: 'scheduled',
          price: booking.price,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Delete the booking
      const { error: deleteError } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId);

      if (deleteError) throw deleteError;

      toast({
        title: "Success",
        description: "Session confirmed successfully",
      });

      // Refresh data
      await Promise.all([fetchSessions(), fetchBookings()]);
      return session;
    } catch (error: any) {
      console.error('Error confirming booking:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to confirm booking",
        variant: "destructive",
      });
      return null;
    }
  }, [toast, fetchSessions, fetchBookings]);

  // Load data on mount and when user changes
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchMentors(), fetchSessions(), fetchBookings()]);
      setIsLoading(false);
    };

    loadData();
  }, [user, fetchMentors, fetchSessions, fetchBookings]);

  return {
    mentors,
    sessions,
    bookings,
    isLoading,
    getMentorAvailability,
    createBooking,
    manageSession,
    confirmBooking,
    refetchData: () => Promise.all([fetchMentors(), fetchSessions(), fetchBookings()]),
  };
}