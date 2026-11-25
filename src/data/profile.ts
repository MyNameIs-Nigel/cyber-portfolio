/**
 * Career facts, reconciled with the October 6, 2026 résumé, owner corrections,
 * and the November 2026 move into Fybercom's security and infrastructure role.
 */

export interface Role {
  title: string;
  dates: string;
  bullets: string[];
}

export interface Job {
  company: string;
  location: string;
  /** Newest first. More than one entry reads as a promotion within the company. */
  roles: Role[];
}

export interface CertificationStudy {
  name: string;
  issuer: string;
}

export const profile = {
  name: "Nigel Smith",
  location: "Rexburg, ID",
  email: "nigel.nds.smith@gmail.com",
  website: "https://nigel-smith.dev",
  github: "https://github.com/mynameis-nigel",
  linkedin: "https://www.linkedin.com/in/nigeld-smith/",
  title: "Security & Infrastructure Engineer",
  summary:
    "Nigel Smith is a security and infrastructure engineer and cybersecurity student who builds CI/CD pipelines, self-hosted infrastructure, and AI-assisted automation.",
  education: {
    school: "Brigham Young University–Idaho",
    degree: "B.S. Cybersecurity",
    graduation: "Expected July 2027",
    coursework: ["Networking", "Hands-on SOC", "Identity & Access Management", "DevOps"],
  },
  /** Undated study plans. They are listed as "Studying" and never counted as earned. */
  certificationStudy: [
    { name: "TCM Practical SOC Analyst Associate (PSAA)", issuer: "TCM Security" },
    { name: "Cisco Certified Network Associate (CCNA)", issuer: "Cisco" },
    { name: "AWS Certified Solutions Architect – Associate", issuer: "Amazon Web Services" },
  ] satisfies CertificationStudy[],
  experience: [
    {
      company: "Fybercom",
      location: "Idaho Falls, ID",
      roles: [
        {
          title: "Security & Infrastructure Engineer",
          dates: "Nov 2026 – Present",
          bullets: [
            "Review the development team's pull requests with a focus on security",
            "Maintain and patch the company's Proxmox virtual machines, and build new VMs for the developers",
            "Watch for new CVEs and build tooling that tracks the packages installed on each VM against them",
            "Work with the company's outsourced security provider and meet weekly with the CTO on status and roadmap",
            "Help field technicians with fiber and wireless problems, including on-call coverage",
          ],
        },
        {
          title: "Technical Support Representative",
          dates: "Mar 2026 – Nov 2026",
          bullets: [
            "Provisioned and troubleshot fiber and fixed-wireless service for a 30,000-subscriber ISP, including ONUs, DHCP leases, managed routers, and Tarana, Cambium, and Ubiquiti radios",
            "Handled 200+ support calls a month and scheduled technicians for outages and installs",
            "Made billing changes and ran post-install audits of inventory, account data, and ONU optical levels",
          ],
        },
      ],
    },
    {
      company: "Full Coverage Tech",
      location: "Monroe, GA",
      roles: [
        {
          title: "Cloud & IT Consultant",
          dates: "May 2023 – Present",
          bullets: [
            "Act as the sole technical contact for a managed IT client, covering M365 tenant administration, Exchange issues, and endpoint management",
            "Deploy and configure on-site networks, including access points and remote access",
          ],
        },
      ],
    },
    {
      company: "Roundsphere",
      location: "Remote / Athens, GA",
      roles: [
        {
          title: "DevOps Intern",
          dates: "Nov 2025 – May 2026",
          bullets: [
            "Cut cloud spending by 14% by auditing and consolidating AWS RDS infrastructure",
            "Moved production applications off end-of-life operating systems onto AWS infrastructure defined in CloudFormation",
            "Ran small Google Workspace migrations between organizations",
          ],
        },
      ],
    },
  ] satisfies Job[],
};

export const workHighlights = [
  "Promoted at Fybercom from phone support to security and infrastructure engineering within eight months",
  "Built a release pipeline that ships five Go services to AWS through GitHub Actions, OIDC, and SSM, with no stored cloud keys",
  "Cut AWS spending by 14% at Roundsphere by consolidating RDS infrastructure",
  "Connected my self-hosted calendar app to Claude as a custom MCP server",
  "Built and launched client websites, including their DNS and domain setup",
];
