import { cookies } from "next/headers";
import type { PublicExperienceMode } from "@/types/public";
import { dineInAccessCookieName } from "./session";

export async function getPublicExperienceMode(slug: string): Promise<PublicExperienceMode> {
  const cookieStore = await cookies();
  return cookieStore.get(dineInAccessCookieName(slug)) ? "DINE_IN" : "ONLINE";
}
