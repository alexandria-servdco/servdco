export interface ApiErrorResponse {
  success: boolean;
  message: string;
  code?: string;
}

export interface ApiSuccessResponse<T> {
  success: boolean;
  data: T;
}
