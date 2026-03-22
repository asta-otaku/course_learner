"use client";

import React, { useEffect, useState } from "react";
import { useGetCurrentUser } from "@/lib/api/queries";
import { usePatchUser } from "@/lib/api/mutations";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ProfileForm = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
};

function parseProfileFromResponse(data: unknown): ProfileForm {
  const raw = data as Record<string, unknown> | null | undefined;
  if (!raw) {
    return { firstName: "", lastName: "", phone: "", email: "" };
  }
  const user = raw.user as Record<string, unknown> | undefined;
  return {
    firstName: String(raw.firstName ?? user?.firstName ?? ""),
    lastName: String(raw.lastName ?? user?.lastName ?? ""),
    phone: String(raw.phoneNumber ?? user?.phoneNumber ?? ""),
    email: String(raw.email ?? user?.email ?? ""),
  };
}

export default function ParentProfileSettings() {
  const { data: userResponse, isLoading } = useGetCurrentUser();
  const { mutateAsync: patchUser, isPending } = usePatchUser();

  const [profile, setProfile] = useState<ProfileForm>({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
  });
  const [initial, setInitial] = useState<ProfileForm | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const userData = userResponse?.data;

  useEffect(() => {
    if (userData) {
      const next = parseProfileFromResponse(userData);
      setProfile(next);
      setInitial(next);
      setHasChanges(false);
    }
  }, [userData]);

  useEffect(() => {
    if (!initial) return;
    const changed =
      profile.firstName !== initial.firstName ||
      profile.lastName !== initial.lastName ||
      profile.phone !== initial.phone;
    setHasChanges(changed);
  }, [profile, initial]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [hasChanges]);

  const handleReset = () => {
    if (initial) {
      setProfile(initial);
      setHasChanges(false);
    }
  };

  const handleSave = async () => {
    const firstName = profile.firstName.trim();
    const lastName = profile.lastName.trim();
    const phone = profile.phone.trim();

    if (!firstName) {
      toast.error("Please enter your first name");
      return;
    }
    if (!lastName) {
      toast.error("Please enter your last name");
      return;
    }
    if (!phone) {
      toast.error("Please enter a phone number");
      return;
    }
    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      toast.error("Please enter a valid phone number (at least 10 digits)");
      return;
    }

    try {
      const response = await patchUser({
        firstName,
        lastName,
        phoneNumber: phone,
      });
      if (response.status === 200) {
        toast.success("Profile updated successfully");
        const next = { ...profile, firstName, lastName, phone };
        setInitial(next);
        setProfile(next);
        setHasChanges(false);
      }
    } catch {
      // mutation handles toast on error
    }
  };

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primaryBlue" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-textGray font-semibold md:text-lg">
          Your profile
        </h1>
        <p className="text-textSubtitle text-xs -mt-0.5 font-medium">
          Update your name and phone number. Email cannot be changed here.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-black/15 shadow-sm p-6 space-y-6 max-w-xl">
        <div className="grid gap-2">
          <Label htmlFor="firstName" className="text-sm font-medium">
            First name
          </Label>
          <Input
            id="firstName"
            autoComplete="given-name"
            value={profile.firstName}
            onChange={(e) =>
              setProfile((p) => ({ ...p, firstName: e.target.value }))
            }
            placeholder="First name"
            className="rounded-xl"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="lastName" className="text-sm font-medium">
            Last name
          </Label>
          <Input
            id="lastName"
            autoComplete="family-name"
            value={profile.lastName}
            onChange={(e) =>
              setProfile((p) => ({ ...p, lastName: e.target.value }))
            }
            placeholder="Last name"
            className="rounded-xl"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="phone" className="text-sm font-medium">
            Phone number
          </Label>
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            value={profile.phone}
            onChange={(e) =>
              setProfile((p) => ({ ...p, phone: e.target.value }))
            }
            placeholder="Phone number"
            className="rounded-xl"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={profile.email}
            readOnly
            disabled
            className="rounded-xl bg-muted/50 text-muted-foreground"
          />
          <p className="text-xs text-textSubtitle">
            Contact support if you need to change your email address.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-full flex-1"
            disabled={!hasChanges || isPending}
            onClick={handleReset}
          >
            Reset
          </Button>
          <Button
            type="button"
            className="rounded-full flex-1 bg-primaryBlue hover:bg-primaryBlue/90"
            disabled={!hasChanges || isPending}
            onClick={handleSave}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving…
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
