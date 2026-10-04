/**
 * DO-DEEL CDS MANAGER - Type Definitions & Schema Models
 * Digital Onboarders – Digital Literacy, Employability, Entrepreneurship & Leadership Mentoring
 */

export type UserRole =
  | 'CDS_COORDINATOR'
  | 'STATE_PRESIDENT'
  | 'VP_GROWTH'
  | 'VP_ACCOUNTABILITY'
  | 'VP_COMMUNITY_IMPACT'
  | 'LG_PRESIDENT'
  | 'EXECUTIVE'
  | 'GROUP_LEADER'
  | 'MEMBER';

export type MembershipStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING';
export type AccountStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED';

export type TaskStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
export type TaskManualProgress = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export type EvidenceType =
  | 'IMAGE'
  | 'PDF'
  | 'DOCUMENT'
  | 'URL'
  | 'SOCIAL_URL'
  | 'DESCRIPTION';

export interface TaskEvidence {
  id?: string;
  taskId?: string;
  type: EvidenceType;
  url?: string;
  description: string;
  submittedAt: string;
  submittedBy: string;
  submittedByName: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface TaskComment {
  id: string;
  taskId?: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  text: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface Task {
  id: string;
  title: string;
  responsibility?: string; // Responsibility title / operational area
  description: string;
  assignedTo: string; // User ID
  assignedToName?: string;
  assignedToRole?: UserRole;
  assignedUserId: string; // Compatibility alias
  assignedUserName: string;
  assignedUserRole: UserRole;
  assignedBy: string; // User ID
  assignedByName?: string;
  assignedLG: string; // LG ID
  assignedLGName?: string;
  lgId: string; // Compatibility alias
  lgName: string;
  team: string; // e.g. "Publicity & Media", "Training & Mentorship", "Logistics", "Impact Monitoring"
  kpi: string; // Expected result
  priority: TaskPriority;
  startDate: string; // ISO date string YYYY-MM-DD
  deadline: string; // ISO date string YYYY-MM-DD
  manualProgress: TaskManualProgress; // Internal manual state set by user
  calculatedStatus?: TaskStatus; // Computed automatically based on manualProgress and deadline
  status?: TaskStatus; // Persisted status
  completedAt?: string; // Completion date
  completionDate?: string; // Compatibility alias
  result?: string;
  evidence?: TaskEvidence;
  hasEvidence?: boolean;
  comments: TaskComment[];
  // Reopening fields for authorized leadership review
  reopenedAt?: string;
  reopenedBy?: string;
  reopenedByName?: string;
  reopenReason?: string;
  reopenHistory?: Array<{
    reopenedAt: string;
    reopenedBy: string;
    reopenedByName: string;
    reason: string;
  }>;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocalGovernment {
  id: string;
  name: string;
  state: string;
  presidentId?: string;
  presidentName?: string;
  meetingVenue: string;
  meetingDay: string;
  activeMemberCount: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface Member {
  id: string; // Document ID (usually Firebase Auth UID once activated)
  uid?: string; // Explicit Firebase Auth UID
  fullName: string;
  email: string;
  phone: string;
  lgId: string;
  lgName: string;
  state: string;
  role: UserRole;
  groupId?: string; // Group / Team assignment
  membershipStatus: MembershipStatus; // Operational status: ACTIVE | INACTIVE | PENDING
  accountStatus: AccountStatus; // Auth access state: PENDING | ACTIVE | SUSPENDED
  invitationCode?: string; // One-time activation code for pending invites
  invitedBy?: string;
  invitedAt?: string;
  activatedAt?: string;
  dateJoined: string;
  profilePhoto?: string;
  skills: string[];
  callUpNo?: string;
  stateCode?: string; // e.g. "LA/24B/1042"
  operationalBatch?: string; // e.g. "2026 Batch A"
  bio?: string;
  assignedTeam?: string;
  fcmbAccount?: string;
  ppaName?: string;
  ppaAddress?: string;
  requiresProfileUpdate?: boolean;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export type ActivityLocationType = 'IN_PERSON' | 'ONLINE';
export type ActivityStatus = 'UPCOMING' | 'COMPLETED' | 'CANCELLED';

export interface AttendanceRecord {
  id?: string;
  activityId?: string;
  memberId: string;
  memberName: string;
  lgId?: string;
  status: 'PRESENT' | 'ABSENT';
  markedAt: string;
  markedBy: string;
  markedByName?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  locationType: ActivityLocationType;
  location: string; // Physical address or meeting link
  lgId: string; // "ALL" for state-wide or specific LG ID
  lgName: string;
  organizerId: string;
  organizerName: string;
  organizerRole: UserRole;
  status: ActivityStatus;
  expectedAttendance: number;
  attendanceRecords: AttendanceRecord[];
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

export type DocumentCategory =
  | 'Governance'
  | 'Executive Resources'
  | 'Training Materials'
  | 'Programme Guides'
  | 'Reports & Templates'
  | 'Forms'
  | 'Branding'
  | 'Other';

export type DocumentVisibility = 'ALL' | 'EXECUTIVES_ONLY' | 'LEADERSHIP_ONLY';

export interface CDSDocument {
  id: string;
  title: string;
  description: string;
  category: DocumentCategory;
  fileUrl: string;
  fileSize: string;
  fileType: string; // e.g., 'PDF', 'DOCX', 'XLSX'
  uploadDate: string;
  uploadedBy: string;
  uploadedByName: string;
  visibility: DocumentVisibility;
  version: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export type LearningType = 'YOUTUBE' | 'PDF' | 'EXTERNAL_URL';

export type LearningCategory =
  | 'Digital Literacy'
  | 'Employability'
  | 'Entrepreneurship'
  | 'Leadership'
  | 'Digital Marketing'
  | 'Web Development'
  | 'Data Analysis'
  | 'Community Impact'
  | 'Other';

export interface LearningResource {
  id: string;
  title: string;
  description: string;
  type: LearningType;
  url: string;
  youtubeVideoId?: string;
  thumbnailUrl?: string;
  category: LearningCategory;
  durationOrPages?: string;
  status?: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  publishedBy: string;
  publisherName: string;
  publisherRole: UserRole;
  publishedAt?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface MonthlyReport {
  id: string;
  reportingMonth?: string;
  month: string; // e.g. "October 2026"
  year: number;
  monthIndex: number; // 0-11
  userId?: string;
  userName?: string;
  userRole?: UserRole;
  submitterId: string;
  submitterName: string;
  submitterRole: UserRole;
  lgId: string;
  lgName: string;
  state: string;
  // 8 prompt-mandated sections:
  activitiesAssigned: number;
  activitiesCompleted: number;
  evidence: string;
  results: string;
  beneficiaries?: number;
  beneficiariesReached: number;
  challenges: string;
  outstandingTasks: string;
  nextMonthPlan: string;
  submittedAt: string;
  status: 'SUBMITTED' | 'REVIEWED';
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  targetLG: string; // 'ALL' or specific lgId
  priority: 'NORMAL' | 'URGENT';
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface SystemSettings {
  stateSecretariat: string;
  operationalBatch: string;
  operationalBatches: string[];
  state: string;
}

