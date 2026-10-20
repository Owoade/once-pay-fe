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

// The deployed backend that the server-side proxies forward to and that the
// docs page displays. Single source of truth for the API base URL.
export const BACKEND_URL = "https://oncepay-api.owoade.dev";

// Pending payloads kept around so the OTP pages can re-call the API on
// "Resend code" even after a reload.
export const SIGNUP_PENDING_KEY = "op_signup_pending";
export const FORGOT_PASSWORD_PENDING_KEY = "op_forgot_password_pending";