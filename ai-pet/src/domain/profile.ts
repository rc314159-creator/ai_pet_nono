import type { PetProfile } from "./types";

export type PetDisplayIdentity = {
  displayName: string;
  profileImageUrl?: string;
};

export function getPetDisplayIdentity(profile: PetProfile): PetDisplayIdentity {
  return {
    displayName: profile.displayName || profile.name,
    profileImageUrl: profile.avatar?.profileImageUrl
  };
}

export function getPetGroupName(profile: PetProfile) {
  return `${getPetDisplayIdentity(profile).displayName}家庭群`;
}
