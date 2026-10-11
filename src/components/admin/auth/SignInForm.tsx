"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import Checkbox from "@/components/admin/form/input/Checkbox";
import Input from "@/components/admin/form/input/InputField";
import Label from "@/components/admin/form/Label";
import Button from "@/components/admin/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";

import { useAuth } from "@/hooks/useAuth";
import { loginUser } from "@/store/slices/authSlice";

import ErrorMessage from "@/components/common/ErrorMessage";
import SuccessMessage from "@/components/common/SuccessMessage";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignInForm() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [email, setEmail] = useState("yadav.manu36@gmail.com");
  const [password, setPassword] = useState("12345689");
  const [touched, setTouched] = useState({ email: false, password: false });
  const [localError, setLocalError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const { login, isAuthenticated, initialized, loading, error } = useAuth();

  console.log("isAuthenticated:", isAuthenticated);

  useEffect(() => {
    if (initialized && isAuthenticated) {
      router.push("/admin/dashboard");
    }
  }, [isAuthenticated, initialized, router]);

  const emailError = !email.trim()
    ? "Email is required."
    : !emailRegex.test(email)
      ? "Please enter a valid email address."
      : "";

  const passwordError = !password
    ? "Password is required."
    : password.length < 8
      ? "Password must be at least 8 characters."
      : "";

  const isFormValid =
    !emailError &&
    !passwordError &&
    email.trim() !== "" &&
    password.length >= 8;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched({ email: true, password: true });
    setLocalError("");
    setShowSuccess(false);

    if (!email || !password) {
      setLocalError("Email and password are required");
      return;
    }

    if (!isFormValid) {
      return;
    }
    try {
      const result = await login(email, password, isChecked);
      if (result.type === loginUser.fulfilled.type) {
        setShowSuccess(true);
        setTimeout(() => router.push("/admin/dashboard"), 200);
      } else {
        const payload = result?.payload;
        const message =
          typeof payload === "string"
            ? payload
            : payload &&
                typeof payload === "object" &&
                "message" in payload &&
                typeof payload.message === "string"
              ? payload.message
              : "Login failed";
        setLocalError(message);
      }
    } catch (err) {
      setLocalError("Login failed. Please try again.");
    }
  };

  const showEmailError = touched.email && emailError;
  const showPasswordError = touched.password && passwordError;

  return (
    <div className="flex flex-col flex-1 w-full lg:w-1/2">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and password to sign in!
            </p>
          </div>
          <div>
            <form onSubmit={handleSubmit} noValidate>
              {showSuccess && (
                <SuccessMessage
                  message="Login successful! Redirecting..."
                  className="mb-4"
                  onClose={() => setShowSuccess(false)}
                />
              )}

              {(error || localError) && (
                <ErrorMessage
                  message={error || localError}
                  className="mb-4"
                  onClose={() => setLocalError("")}
                />
              )}
              <div className="space-y-6">
                <div>
                  <Label>
                    Email <span className="text-error-500">*</span>{" "}
                  </Label>
                  <Input
                    type="email"
                    placeholder="info@gmail.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (touched.email)
                        setTouched((prev) => ({ ...prev, email: true }));
                    }}
                    onBlur={() =>
                      setTouched((prev) => ({ ...prev, email: true }))
                    }
                    error={Boolean(showEmailError)}
                    hint={showEmailError ? emailError : ""}
                    disabled={loading}
                    autoComplete="email"
                    required
                  />
                </div>
                <div>
                  <Label>
                    Password <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (touched.password)
                          setTouched((prev) => ({ ...prev, password: true }));
                      }}
                      onBlur={() =>
                        setTouched((prev) => ({ ...prev, password: true }))
                      }
                      error={Boolean(showPasswordError)}
                      hint={showPasswordError ? passwordError : ""}
                      disabled={loading}
                      autoComplete="current-password"
                      required
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isChecked} onChange={setIsChecked} />
                    <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                      Keep me logged in
                    </span>
                  </div>
                  <Link
                    href="/reset-password"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div>
                  <Button
                    className="w-full"
                    size="sm"
                    disabled={loading || !isFormValid}
                  >
                    {loading ? "Signing in..." : "Sign in"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
