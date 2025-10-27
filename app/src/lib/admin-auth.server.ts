"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { AdminLoginState } from "./admin-auth";

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "My742270";
const ADMIN_AUTH_COOKIE = "admin-auth";
const ADMIN_AUTH_VALUE = "verified";

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(ADMIN_AUTH_COOKIE);
  return cookie?.value === ADMIN_AUTH_VALUE;
}

export async function ensureAdminAuthenticated(): Promise<void> {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
}

export async function authenticateAdmin(
  _prevState: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {

  const username = formData.get("username");
  const password = formData.get("password");

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const cookieStore = await cookies();
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
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_AUTH_COOKIE);
  redirect("/admin/login");
}
