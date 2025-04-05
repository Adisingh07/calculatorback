import { UserData } from "./user";

declare module "express-session" {
  interface SessionData {
    currentUser?: UserData | null; // `?` optional bana dega jo error hatayega
  }
}
