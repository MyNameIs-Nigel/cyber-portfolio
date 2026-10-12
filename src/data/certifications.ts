import type { Certification } from "@/types";
import { profile } from "@/data/profile";

export const CREDLY_PROFILE_URL = "https://www.credly.com/users/nigeld-smith";

/** Earned certs first; undated study plans are never counted as credentials. */
export const certifications: Certification[] = [
  { name: "CompTIA Security+", issuer: "CompTIA", date: "Jul 2026", status: "earned" },
  {
    name: "AWS Certified Cloud Practitioner",
    issuer: "Amazon Web Services",
    date: "Jul 2026",
    status: "earned",
  },
  { name: "CompTIA A+", issuer: "CompTIA", date: "May 2026", status: "earned" },
  {
    name: "ISC² Certified in Cybersecurity (CC)",
    issuer: "ISC²",
    date: "Aug 2025",
    status: "earned",
  },
  { name: profile.certificationStudy.name, issuer: profile.certificationStudy.issuer, status: "in-progress" },
];

export const earnedCertifications = certifications.filter((c) => c.status === "earned");
