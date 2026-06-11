import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookingService } from "@/services/booking.service";
import { bookingQueryKeys } from "@/services/supabase/bookings.service";

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
      status: "pending" | "confirmed" | "completed" | "cancelled";
      reason?: string;
    }) => BookingService.updateStatus(id, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
