export interface ServiceDefinition {
  category: 'software' | 'cybersecurity' | 'engineering'
  name: string
}

export const LANTERN_SOFTWARE: ServiceDefinition[] = [
  { category: 'software', name: 'DOX' },
  { category: 'software', name: 'Kronyx' },
  { category: 'software', name: 'KillChain' },
  { category: 'software', name: 'Assetiq' },
  { category: 'software', name: 'Sentinel' },
  { category: 'software', name: 'CyberArena' },
]

export const CYBERSECURITY_SERVICES: ServiceDefinition[] = [
  // Cybersecurity Operations
  { category: 'cybersecurity', name: 'Red Team Operations' },
  { category: 'cybersecurity', name: 'Blue Team Operations' },
  { category: 'cybersecurity', name: 'Purple Team Operations' },
  { category: 'cybersecurity', name: 'Threat Hunting' },
  { category: 'cybersecurity', name: 'Incident Response' },
  { category: 'cybersecurity', name: 'Security Operations Center (SOC)' },
  // Identity & Security
  { category: 'cybersecurity', name: 'Identity & Access Governance' },
  { category: 'cybersecurity', name: 'Privileged Access Management' },
  { category: 'cybersecurity', name: 'Zero Trust Architecture' },
  { category: 'cybersecurity', name: 'Authentication & Access Control' },
  // Endpoint & Device Security
  { category: 'cybersecurity', name: 'System Control & Enforcement' },
  { category: 'cybersecurity', name: 'Endpoint Security' },
  { category: 'cybersecurity', name: 'Device Management' },
  { category: 'cybersecurity', name: 'Application Control' },
  { category: 'cybersecurity', name: 'Endpoint Compliance' },
  // GRC
  { category: 'cybersecurity', name: 'Risk Management' },
  { category: 'cybersecurity', name: 'Security Assessments' },
  { category: 'cybersecurity', name: 'Regulatory Compliance' },
  { category: 'cybersecurity', name: 'Security Framework Alignment' },
  { category: 'cybersecurity', name: 'Policy & Governance Development' },
]

export const ENGINEERING_SERVICES: ServiceDefinition[] = [
  // Secure Systems Engineering
  { category: 'engineering', name: 'Security Architecture & Design' },
  { category: 'engineering', name: 'Web Design & Development' },
  { category: 'engineering', name: 'Application Development' },
  { category: 'engineering', name: 'Business Process Automation' },
  { category: 'engineering', name: 'AI & Intelligent Automation' },
  { category: 'engineering', name: 'Cloud & Infrastructure Engineering' },
  { category: 'engineering', name: 'Systems Integration' },
  { category: 'engineering', name: 'DevSecOps & Security Engineering' },
  // R&D
  { category: 'engineering', name: 'Emerging Technology Research' },
  { category: 'engineering', name: 'Proof of Concept & Prototyping' },
  { category: 'engineering', name: 'AI & Automation R&D' },
  { category: 'engineering', name: 'Digital Platforms & Innovation' },
  { category: 'engineering', name: 'Strategic Innovation Programs' },
]

export const ALL_SERVICES = [...LANTERN_SOFTWARE, ...CYBERSECURITY_SERVICES, ...ENGINEERING_SERVICES]
