import { InternshipRole } from '../types';

export interface RoleInfo {
  role: InternshipRole;
  department: string;
  shortDescription: string;
  focusAreas: string[];
}

export const ROLE_DETAILS: Record<InternshipRole, RoleInfo> = {
  'Frontend Developer': {
    role: 'Frontend Developer',
    department: 'Engineering',
    shortDescription: 'Build intuitive, responsive, and accessible user interfaces using modern web technologies.',
    focusAreas: ['React & TypeScript', 'Tailwind CSS', 'Responsive UI/UX', 'Component Systems'],
  },
  'Backend Developer': {
    role: 'Backend Developer',
    department: 'Engineering',
    shortDescription: 'Design resilient APIs, implement server-side logic, and maintain secure database architectures.',
    focusAreas: ['Node.js & Express', 'REST & GraphQL APIs', 'Database Design', 'Cloud Deployments'],
  },
  'Full-Stack Developer': {
    role: 'Full-Stack Developer',
    department: 'Engineering',
    shortDescription: 'Work across the complete stack to deliver end-to-end features from database to frontend view.',
    focusAreas: ['Web Architectures', 'State Management', 'API Integration', 'Full-Lifecycle Testing'],
  },
  'AI/ML Engineer': {
    role: 'AI/ML Engineer',
    department: 'Technology',
    shortDescription: 'Implement intelligent features, evaluate generative model prompts, and integrate AI pipelines.',
    focusAreas: ['Gemini Models & SDKs', 'Data Pipelines', 'Prompt Optimization', 'Applied AI Workflows'],
  },
  'UI/UX Designer': {
    role: 'UI/UX Designer',
    department: 'Design',
    shortDescription: 'Craft user journeys, wireframes, and high-fidelity prototypes centered around user research.',
    focusAreas: ['Design Systems', 'Figma Prototyping', 'Accessibility (WCAG)', 'User Journey Mapping'],
  },
  'Graphic Designer': {
    role: 'Graphic Designer',
    department: 'Creative',
    shortDescription: 'Develop visual identities, presentation assets, digital media graphics, and brand illustrations.',
    focusAreas: ['Visual Storytelling', 'Brand Guidelines', 'Digital Media', 'Typography & Layout'],
  },
  'Digital Marketing Intern': {
    role: 'Digital Marketing Intern',
    department: 'Growth',
    shortDescription: 'Analyze outreach performance, plan campaign funnels, and assist in organic growth initiatives.',
    focusAreas: ['Campaign Analytics', 'SEO Fundamentals', 'Audience Research', 'Funnel Tracking'],
  },
  'Social Media Manager': {
    role: 'Social Media Manager',
    department: 'Growth',
    shortDescription: 'Plan editorial calendars, engage community channels, and draft compelling technical updates.',
    focusAreas: ['Content Scheduling', 'Community Engagement', 'Trend Analysis', 'Channel Strategy'],
  },
  'Content Writer': {
    role: 'Content Writer',
    department: 'Communications',
    shortDescription: 'Produce technical documentation, blog articles, case studies, and clear educational guides.',
    focusAreas: ['Technical Writing', 'Copywriting', 'Documentation', 'Editing & Proofreading'],
  },
  'Business Development Intern': {
    role: 'Business Development Intern',
    department: 'Strategy',
    shortDescription: 'Research market segments, evaluate industry trends, and support strategic partnerships.',
    focusAreas: ['Market Research', 'Partner Outreach', 'Competitive Analysis', 'Pitch Presentations'],
  },
  'Community Manager': {
    role: 'Community Manager',
    department: 'Operations',
    shortDescription: 'Foster welcoming tech community spaces, organize developer meetups, and gather feedback.',
    focusAreas: ['Event Planning', 'Discord/Forum Moderation', 'Developer Relations', 'Member Onboarding'],
  },
  'HR Intern': {
    role: 'HR Intern',
    department: 'People Operations',
    shortDescription: 'Support applicant lifecycles, coordinate onboarding logistics, and maintain HR operations.',
    focusAreas: ['Candidate Coordination', 'Onboarding Workflows', 'HR Records Management', 'Communication'],
  },
};
