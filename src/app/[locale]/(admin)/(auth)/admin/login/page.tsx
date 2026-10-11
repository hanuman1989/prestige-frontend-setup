import SignInForm from "@/components/admin/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description:
    "This is the admin dashboard for the Indian wedding invitation website.",
};

export default function SignIn() {
  return <SignInForm />;
}
