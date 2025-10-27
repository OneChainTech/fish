import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const ADMIN_USERNAME = "admin";
export const ADMIN_PASSWORD = "My742270";
export const ADMIN_AUTH_COOKIE = "admin-auth";
const ADMIN_AUTH_VALUE = "verified";

export type AdminLoginState = {
  error?: string;
};

export function isAdminAuthenticated(): boolean {
  const cookieStore = cookies();
  const cookie = cookieStore.get(ADMIN_AUTH_COOKIE);
  return cookie?.value === ADMIN_AUTH_VALUE;
}

export function ensureAdminAuthenticated() {
  if (!isAdminAuthenticated()) {
    redirect("/admin/login");
  }
}

export async function authenticateAdmin(
  _prevState: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  "use server";

  const username = formData.get("username");
  const password = formData.get("password");

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const cookieStore = cookies();
    cookieStore.set({
      name: ADMIN_AUTH_COOKIE,
      value: ADMIN_AUTH_VALUE,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 6, // 6 hours
    });
    redirect("/admin/monitor");
  }

  return {
    error: "用户名或密码不正确",
  };
}

export async function logoutAdmin() {
  "use server";

  const cookieStore = cookies();
  cookieStore.delete(ADMIN_AUTH_COOKIE);
  redirect("/admin/login");
}
