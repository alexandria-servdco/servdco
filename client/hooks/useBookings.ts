import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { BookingStatus } from "@shared/booking";
import { BookingService } from "@/services/booking.service";
import { bookingQueryKeys } from "@/services/supabase/bookings.service";
import { bookingHistoryQueryKeys } from "@/services/supabase/booking-operations.service";
import { dispatchBookingStatusEmails } from "@/hooks/bookingEmailEvents";

export function useBookings() {
  return useQuery({
    queryKey: bookingQueryKeys.list(),
    queryFn: () => BookingService.getBookings(),
  });
}

export function useBooking(bookingId: string | undefined) {
  return useQuery({
    queryKey: bookingQueryKeys.detail(bookingId ?? ""),
    enabled: Boolean(bookingId),
    queryFn: () => BookingService.getBookingById(bookingId!),
  });
}

export function useBookingHistory(bookingId: string | undefined) {
  return useQuery({
    queryKey: bookingHistoryQueryKeys.byBooking(bookingId ?? ""),
    enabled: Boolean(bookingId),
    queryFn: () => BookingService.getStatusHistory(bookingId!),
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: Parameters<typeof BookingService.createBooking>[0]) =>
      BookingService.createBooking(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingQueryKeys.list() });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: BookingStatus;
      reason?: string;
    }) => BookingService.updateStatus(id, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useCookAcceptBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => BookingService.cookAccept(bookingId),
    onSuccess: (_data, bookingId) => {
      dispatchBookingStatusEmails(bookingId, "accepted");
      queryClient.invalidateQueries({ queryKey: bookingQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useCookRejectBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: string; reason?: string }) =>
      BookingService.cookReject(bookingId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useCookProgressBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      bookingId,
      currentStatus,
      nextStatus,
    }: {
      bookingId: string;
      currentStatus: BookingStatus;
      nextStatus: BookingStatus;
    }) => BookingService.cookProgress(bookingId, currentStatus, nextStatus),
    onSuccess: (_data, { bookingId, nextStatus }) => {
      dispatchBookingStatusEmails(bookingId, nextStatus);
      queryClient.invalidateQueries({ queryKey: bookingQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useFamilyCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      bookingId,
      currentStatus,
      reason,
    }: {
      bookingId: string;
      currentStatus: BookingStatus;
      reason?: string;
    }) => BookingService.familyCancel(bookingId, currentStatus, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useFamilyConfirmCompletion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) =>
      BookingService.familyConfirmCompletion(bookingId),
    onSuccess: (_data, bookingId) => {
      dispatchBookingStatusEmails(bookingId, "completed");
      queryClient.invalidateQueries({ queryKey: bookingQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
