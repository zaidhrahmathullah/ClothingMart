"use client";

import {
  CheckCircle2,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  changePassword,
  updateProfile,
} from "@/services/auth";

import type { AuthUser } from "@/types/auth";

type ProfileManagerProps = {
  user: AuthUser;
};

const inputClassName =
  "mt-2 w-full rounded border border-neutral-300 bg-white px-3 py-2.5 text-[13px] text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500";

export default function ProfileManager({
  user,
}: ProfileManagerProps) {
  const router = useRouter();

  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);

  const [savingProfile, setSavingProfile] =
    useState(false);

  const [profileError, setProfileError] =
    useState<string | null>(null);

  const [profileSuccess, setProfileSuccess] =
    useState<string | null>(null);

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [
    changingPassword,
    setChangingPassword,
  ] = useState(false);

  const [passwordError, setPasswordError] =
    useState<string | null>(null);

  const profileChanged =
    name.trim() !== user.name ||
    email.trim().toLowerCase() !==
      user.email.toLowerCase();

  async function handleProfileSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (savingProfile || !profileChanged) {
      return;
    }

    try {
      setSavingProfile(true);
      setProfileError(null);
      setProfileSuccess(null);

      await updateProfile({
        name: name.trim(),
        email: email.trim().toLowerCase(),
      });

      setProfileSuccess(
        "Your profile has been updated.",
      );

      router.refresh();
    } catch (error) {
      setProfileError(
        error instanceof Error
          ? error.message
          : "Unable to update your profile.",
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (changingPassword) return;

    if (!currentPassword) {
      setPasswordError(
        "Enter your current password.",
      );
      return;
    }

    if (!newPassword) {
      setPasswordError(
        "Enter a new password.",
      );
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError(
        "Your new password must be at least 8 characters.",
      );
      return;
    }

    if (!confirmPassword) {
      setPasswordError(
        "Confirm your new password.",
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(
        "The new passwords you entered do not match.",
      );
      return;
    }

    try {
      setChangingPassword(true);
      setPasswordError(null);

      await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      /*
       * The API intentionally clears the
       * authentication cookies after a
       * successful password change.
       */
      router.push(
        "/login?passwordChanged=1",
      );
      router.refresh();
    } catch (error) {
      setPasswordError(
        error instanceof Error
          ? error.message
          : "Unable to change your password.",
      );
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile */}
      <section className="overflow-hidden rounded border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-neutral-100 text-neutral-600">
              <UserRound className="h-[17px] w-[17px]" />
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                Personal Information
              </p>

              <h2 className="mt-1 text-lg font-medium tracking-[-0.02em] text-neutral-950">
                Profile Details
              </h2>

              <p className="mt-1.5 text-[13px] leading-5 text-neutral-500">
                Keep your name and email
                address up to date.
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleProfileSubmit}
          className="p-5 sm:p-6"
          aria-busy={savingProfile}
        >
          {profileError && (
            <div className="mb-5 rounded border border-red-200 bg-red-50 px-3.5 py-3 text-[13px] text-red-700">
              {profileError}
            </div>
          )}

          {profileSuccess && (
            <div className="mb-5 flex items-center gap-2 rounded border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-[13px] text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />

              {profileSuccess}
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="profile-name"
                className="text-xs font-medium text-neutral-700"
              >
                Full name
              </label>

              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 mt-1 h-4 w-4 -translate-y-1/2 text-neutral-400" />

                <input
                  id="profile-name"
                  required
                  minLength={2}
                  maxLength={100}
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setProfileError(null);
                    setProfileSuccess(null);
                  }}
                  disabled={savingProfile}
                  className={`${inputClassName} pl-10`}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="profile-email"
                className="text-xs font-medium text-neutral-700"
              >
                Email address
              </label>

              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 mt-1 h-4 w-4 -translate-y-1/2 text-neutral-400" />

                <input
                  id="profile-email"
                  required
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setProfileError(null);
                    setProfileSuccess(null);
                  }}
                  disabled={savingProfile}
                  className={`${inputClassName} pl-10`}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-neutral-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] leading-5 text-neutral-500">
              Your email is also used to sign
              in to ClothingMart.
            </p>

            <button
              type="submit"
              disabled={
                savingProfile ||
                !profileChanged
              }
              className="inline-flex items-center justify-center gap-2 rounded bg-neutral-950 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {savingProfile ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}

              {savingProfile
                ? "Saving..."
                : "Save Changes"}
            </button>
          </div>
        </form>
      </section>

      {/* Password */}
      <section className="overflow-hidden rounded border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-neutral-950 text-white">
              <KeyRound className="h-[17px] w-[17px]" />
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                Security
              </p>

              <h2 className="mt-1 text-lg font-medium tracking-[-0.02em] text-neutral-950">
                Change Password
              </h2>

              <p className="mt-1.5 text-[13px] leading-5 text-neutral-500">
                Verify your current password
                before choosing a new one.
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handlePasswordSubmit}
          className="p-5 sm:p-6"
          aria-busy={changingPassword}
        >
          {passwordError && (
            <div className="mb-5 rounded border border-red-200 bg-red-50 px-3.5 py-3 text-[13px] text-red-700">
              {passwordError}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label
                htmlFor="current-password"
                className="text-xs font-medium text-neutral-700"
              >
                Current password
              </label>

              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 mt-1 h-4 w-4 -translate-y-1/2 text-neutral-400" />

                <input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={currentPassword}
                  onChange={(event) => {
                    setCurrentPassword(
                      event.target.value,
                    );
                    setPasswordError(null);
                  }}
                  disabled={changingPassword}
                  className={`${inputClassName} pl-10`}
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="new-password"
                  className="text-xs font-medium text-neutral-700"
                >
                  New password
                </label>

                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  maxLength={100}
                  value={newPassword}
                  onChange={(event) => {
                    setNewPassword(
                      event.target.value,
                    );
                    setPasswordError(null);
                  }}
                  disabled={changingPassword}
                  className={inputClassName}
                />
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="text-xs font-medium text-neutral-700"
                >
                  Confirm new password
                </label>

                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  maxLength={100}
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(
                      event.target.value,
                    );
                    setPasswordError(null);
                  }}
                  disabled={changingPassword}
                  className={inputClassName}
                />
              </div>

              <p className="text-[11px] leading-5 text-neutral-400">
                Your new password must contain at least 8 characters.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded border border-neutral-200 bg-neutral-50 p-4">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-[18px] w-[18px] shrink-0 text-neutral-500" />

              <div>
                <p className="text-[13px] font-semibold text-neutral-950">
                  Security protection
                </p>

                <p className="mt-1 text-[11px] leading-5 text-neutral-500">
                  Changing your password will
                  sign you out and revoke your
                  active refresh sessions. Sign
                  in again using the new
                  password.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end border-t border-neutral-200 pt-5">
            <button
              type="submit"
              disabled={
                changingPassword ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword
              }
              className="inline-flex items-center justify-center gap-2 rounded bg-neutral-950 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {changingPassword ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4" />
              )}

              {changingPassword
                ? "Updating..."
                : "Change Password"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}