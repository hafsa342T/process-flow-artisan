export interface IndustryBenchmark {
  industry: string;
  commonProcesses: {
    core: string[];
    support: string[];
    management: string[];
  };
  keyInteractions: {
    from: string;
    to: string;
    type: 'information' | 'material' | 'service' | 'feedback';
    description: string;
    frequency: 'continuous' | 'daily' | 'weekly' | 'monthly' | 'as-needed';
  }[];
  industryRisks: string[];
  commonKPIs: string[];
}

export const industryBenchmarks: IndustryBenchmark[] = [
  {
    industry: "Manufacturing",
    commonProcesses: {
      core: [
        "Product Design & Development",
        "Production Planning",
        "Procurement & Supplier Management", 
        "Manufacturing & Assembly",
        "Quality Control & Testing",
        "Packaging & Labeling",
        "Warehousing & Inventory",
        "Order Fulfillment & Shipping",
        "Customer Service & Support"
      ],
      support: [
        "Human Resources Management",
        "Information Technology Support",
        "Maintenance & Facilities",
        "Health & Safety Management",
        "Environmental Management",
        "Training & Development",
        "Document Control",
        "Calibration & Metrology"
      ],
      management: []
    },
    keyInteractions: [
      {
        from: "Product Design & Development",
        to: "Production Planning",
        type: "information",
        description: "Product specifications, BOM, manufacturing requirements",
        frequency: "as-needed"
      },
      {
        from: "Production Planning",
        to: "Procurement & Supplier Management",
        type: "information",
        description: "Material requirements, delivery schedules",
        frequency: "weekly"
      },
      {
        from: "Procurement & Supplier Management",
        to: "Manufacturing & Assembly",
        type: "material",
        description: "Raw materials, components, supplies",
        frequency: "continuous"
      },
      {
        from: "Manufacturing & Assembly",
        to: "Quality Control & Testing",
        type: "material",
        description: "Finished products for inspection",
        frequency: "continuous"
      },
      {
        from: "Quality Control & Testing",
        to: "Packaging & Labeling",
        type: "material",
        description: "Approved products with certificates",
        frequency: "continuous"
      },
      {
        from: "Customer Service & Support",
        to: "Product Design & Development",
        type: "feedback",
        description: "Customer feedback, complaints, improvement suggestions",
        frequency: "monthly"
      }
    ],
    industryRisks: [
      "Supply chain disruption",
      "Equipment failure/downtime",
      "Quality defects reaching customers", 
      "Regulatory non-compliance",
      "Workplace safety incidents"
    ],
    commonKPIs: [
      "Overall Equipment Effectiveness (OEE)",
      "First Pass Yield",
      "Customer Complaint Rate",
      "On-Time Delivery",
      "Inventory Turnover"
    ]
  },
  {
    industry: "Software Development",
    commonProcesses: {
      core: [
        "Requirements Analysis",
        "System Architecture & Design",
        "Software Development",
        "Code Review & Testing",
        "Integration & Deployment",
        "Release Management",
        "Customer Support",
        "Product Management"
      ],
      support: [
        "Infrastructure Management",
        "Security & Compliance",
        "Human Resources",
        "Training & Development",
        "Vendor Management",
        "Legal & Contracts",
        "Marketing & Sales Support"
      ],
      management: []
    },
    keyInteractions: [
      {
        from: "Requirements Analysis",
        to: "System Architecture & Design",
        type: "information",
        description: "Functional and non-functional requirements",
        frequency: "as-needed"
      },
      {
        from: "System Architecture & Design",
        to: "Software Development",
        type: "information",
        description: "Technical specifications, design documents",
        frequency: "as-needed"
      },
      {
        from: "Software Development",
        to: "Code Review & Testing",
        type: "material",
        description: "Source code, builds, documentation",
        frequency: "daily"
      },
      {
        from: "Customer Support",
        to: "Requirements Analysis",
        type: "feedback",
        description: "Bug reports, feature requests, user feedback",
        frequency: "weekly"
      }
    ],
    industryRisks: [
      "Security vulnerabilities",
      "Performance degradation",
      "Data breaches",
      "Scope creep",
      "Technical debt accumulation"
    ],
    commonKPIs: [
      "Code Coverage",
      "Bug Escape Rate",
      "Customer Satisfaction Score",
      "Time to Market",
      "System Uptime"
    ]
  },
  {
    industry: "Healthcare Services",
    commonProcesses: {
      core: [
        "Patient Registration & Admission",
        "Clinical Assessment & Diagnosis",
        "Treatment Planning",
        "Care Delivery",
        "Medication Management",
        "Patient Monitoring",
        "Discharge Planning",
        "Follow-up Care"
      ],
      support: [
        "Medical Records Management",
        "Pharmacy Services",
        "Laboratory Services",
        "Radiology Services",
        "Facilities Management",
        "Supply Chain Management",
        "Infection Control",
        "Waste Management"
      ],
      management: []
    },
    keyInteractions: [
      {
        from: "Patient Registration & Admission",
        to: "Clinical Assessment & Diagnosis",
        type: "information",
        description: "Patient demographics, insurance, medical history",
        frequency: "continuous"
      },
      {
        from: "Clinical Assessment & Diagnosis",
        to: "Treatment Planning",
        type: "information",
        description: "Diagnosis results, clinical findings",
        frequency: "continuous"
      },
      {
        from: "Treatment Planning",
        to: "Care Delivery",
        type: "information",
        description: "Treatment protocols, care plans",
        frequency: "continuous"
      }
    ],
    industryRisks: [
      "Medical errors",
      "Healthcare-associated infections",
      "Patient safety incidents",
      "Regulatory violations",
      "Data privacy breaches"
    ],
    commonKPIs: [
      "Patient Satisfaction Score",
      "Infection Rate",
      "Average Length of Stay",
      "Readmission Rate",
      "Patient Safety Indicators"
    ]
  },
  {
    industry: "Consulting Services",
    commonProcesses: {
      core: [
        "Client Acquisition & Business Development",
        "Project Scoping & Proposal Development",
        "Contract Negotiation & Management",
        "Project Planning & Resource Allocation",
        "Stakeholder Analysis & Engagement",
        "Data Collection & Analysis",
        "Solution Design & Development",
        "Implementation & Change Management",
        "Progress Monitoring & Reporting",
        "Knowledge Transfer & Training",
        "Project Closure & Evaluation",
        "Client Relationship Management"
      ],
      support: [
        "Human Resources Management",
        "Information Technology Support",
        "Finance & Accounting",
        "Legal & Compliance",
        "Marketing & Communications",
        "Knowledge Management",
        "Document Management",
        "Facilities Management",
        "Vendor & Supplier Management",
        "Training & Professional Development"
      ],
      management: []
    },
    keyInteractions: [
      {
        from: "Client Acquisition & Business Development",
        to: "Project Scoping & Proposal Development",
        type: "information",
        description: "Client requirements, objectives, constraints",
        frequency: "as-needed"
      },
      {
        from: "Project Scoping & Proposal Development",
        to: "Contract Negotiation & Management",
        type: "information",
        description: "Project scope, deliverables, timeline, pricing",
        frequency: "as-needed"
      },
      {
        from: "Contract Negotiation & Management",
        to: "Project Planning & Resource Allocation",
        type: "information",
        description: "Signed contract, project parameters, resource requirements",
        frequency: "as-needed"
      },
      {
        from: "Data Collection & Analysis",
        to: "Solution Design & Development",
        type: "information",
        description: "Analysis results, insights, recommendations",
        frequency: "continuous"
      },
      {
        from: "Implementation & Change Management",
        to: "Progress Monitoring & Reporting",
        type: "information",
        description: "Implementation status, milestones, issues",
        frequency: "weekly"
      },
      {
        from: "Client Relationship Management",
        to: "Client Acquisition & Business Development",
        type: "feedback",
        description: "Client satisfaction, referrals, new opportunities",
        frequency: "monthly"
      }
    ],
    industryRisks: [
      "Scope creep and project overruns",
      "Client expectations misalignment",
      "Key personnel unavailability",
      "Confidentiality and data security breaches",
      "Intellectual property disputes",
      "Regulatory and compliance violations",
      "Market competition and pricing pressure"
    ],
    commonKPIs: [
      "Client Satisfaction Score",
      "Project Delivery On-Time Rate",
      "Budget Variance Percentage",
      "Consultant Utilization Rate",
      "Client Retention Rate",
      "Revenue per Consultant",
      "Proposal Win Rate"
    ]
  },
  {
    industry: "Financial Services",
    commonProcesses: {
      core: [
        "Customer Onboarding",
        "Account Management",
        "Transaction Processing",
        "Credit Assessment",
        "Risk Assessment",
        "Investment Management",
        "Claims Processing",
        "Customer Service"
      ],
      support: [
        "IT Systems Management",
        "Compliance & Regulatory Reporting",
        "Human Resources",
        "Facilities Management",
        "Vendor Management",
        "Security Management",
        "Document Management"
      ],
      management: []
    },
    keyInteractions: [
      {
        from: "Customer Onboarding",
        to: "Account Management",
        type: "information",
        description: "Customer data, account setup, KYC documentation",
        frequency: "as-needed"
      },
      {
        from: "Credit Assessment",
        to: "Risk Assessment",
        type: "information",
        description: "Credit scores, financial data, risk ratings",
        frequency: "as-needed"
      }
    ],
    industryRisks: [
      "Fraud and financial crime",
      "Regulatory non-compliance",
      "Data security breaches",
      "Market volatility",
      "Operational risk"
    ],
    commonKPIs: [
      "Customer Acquisition Cost",
      "Net Promoter Score",
      "Compliance Rating",
      "Risk-Adjusted Return",
      "Processing Time"
    ]
  }
];

export const getIndustryBenchmark = (industry: string): IndustryBenchmark | null => {
  const normalizedIndustry = industry.toLowerCase().trim();
  
  // Direct match
  let benchmark = industryBenchmarks.find(b => 
    b.industry.toLowerCase().includes(normalizedIndustry) ||
    normalizedIndustry.includes(b.industry.toLowerCase())
  );
  
  if (benchmark) return benchmark;
  
  // Fuzzy matching for common terms
  if (normalizedIndustry.includes('manufactur') || normalizedIndustry.includes('production')) {
    return industryBenchmarks.find(b => b.industry === 'Manufacturing') || null;
  }
  
  if (normalizedIndustry.includes('software') || normalizedIndustry.includes('tech') || normalizedIndustry.includes('development')) {
    return industryBenchmarks.find(b => b.industry === 'Software Development') || null;
  }
  
  if (normalizedIndustry.includes('health') || normalizedIndustry.includes('medical') || normalizedIndustry.includes('hospital')) {
    return industryBenchmarks.find(b => b.industry === 'Healthcare Services') || null;
  }
  
  if (normalizedIndustry.includes('financ') || normalizedIndustry.includes('bank') || normalizedIndustry.includes('insurance')) {
    return industryBenchmarks.find(b => b.industry === 'Financial Services') || null;
  }
  
  if (normalizedIndustry.includes('consult') || normalizedIndustry.includes('advisory') || normalizedIndustry.includes('professional services')) {
    return industryBenchmarks.find(b => b.industry === 'Consulting Services') || null;
  }
  
  return null;
};