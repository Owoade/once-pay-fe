// Shape returned by the backend's `respond` helper.
export type BackendResponse<T> = {
  status: "success" | "error";
  message?: string;
  data: T | null;
  status_code?: number;
  current_time?: string;
};

export const TOKEN_STORAGE_KEY = "op_token";
export const NAME_STORAGE_KEY = "op_name";

// Pending payloads kept around so the OTP pages can re-call the API on
// "Resend code" even after a reload.
export const SIGNUP_PENDING_KEY = "op_signup_pending";
export const FORGOT_PASSWORD_PENDING_KEY = "op_forgot_password_pending";