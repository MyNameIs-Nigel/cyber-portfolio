/** Career facts reconciled with the October 6, 2026 résumé and owner corrections. */
export const profile = {
  name: "Nigel Smith",
  location: "Rexburg, ID",
  email: "nigel.nds.smith@gmail.com",
  website: "https://nigel-smith.dev",
  github: "https://github.com/mynameis-nigel",
  linkedin: "https://www.linkedin.com/in/nigeld-smith/",
  summary: "Nigel Smith builds cloud infrastructure, automation, websites, and terminal games.",
  education: {
    school: "Brigham Young University–Idaho",
    degree: "B.S. Cybersecurity",
    graduation: "Expected July 2027",
    coursework: ["Networking", "Hands-on SOC", "Identity & Access Management", "DevOps"],
  },
  certificationStudy: {
    name: "Cisco Certified Network Associate (CCNA)",
    issuer: "Cisco",
    description: "Studying for CCNA alongside hands-on network troubleshooting at work.",
  },
  experience: [
    {
      company: "Roundsphere",
      title: "DevOps Intern",
      dates: "Nov 2025 – May 2026",
      location: "Remote / Athens, GA",
      bullets: [
        "Reduced cloud expenditure by 14% by auditing and consolidating AWS RDS infrastructure",
        "Migrated production applications off end-of-life operating systems onto AWS infrastructure defined in CloudFormation",
        "Oversaw small-scale Google Workspace migrations between organizations",
      ],
    },
    {
      company: "Fybercom",
      title: "Technical Support Representative",
      dates: "March 2026 – Present",
      location: "Idaho Falls, ID",
      bullets: [
        "Provision and troubleshoot fiber and fixed-wireless service for a 30,000-subscriber ISP, including ONUs, DHCP leases, Tarana, Cambium, Ubiquiti CPE, and managed routers",
        "Answer 200+ support calls monthly and coordinate technician dispatch for outages and installs",
        "Administer provisioning, billing changes, and post-installation audits of inventory, account data, and ONU optical levels",
      ],
    },
    {
      company: "Full Coverage Tech",
      title: "Cloud & IT Consultant",
      dates: "May 2023 – Present",
      location: "Monroe, GA",
      bullets: [
        "Sole technical point of contact for a managed IT client, responsible for M365 tenant administration, Exchange triage, and endpoint management",
        "Deploy and configure on-premises network infrastructure, including access points and remote access solutions",
      ],
    },
  ],
};

export const workHighlights = [
  profile.experience[0].bullets[0],
  profile.experience[0].bullets[2],
  "Built and launched client websites, including their DNS and domain setup",
];
