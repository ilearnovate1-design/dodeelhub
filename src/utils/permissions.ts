import { UserRole } from '../types';

export const SUPER_ADMIN_EMAILS = [
  'kolawoles445@gmail.com',
  'jomaschools@gmail.com',
  'coordinator@dodeel.org',
];

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

export const ROLE_LABELS: Record<UserRole, string> = {
  CDS_COORDINATOR: 'CDS Coordinator (Super Admin)',
  STATE_PRESIDENT: 'State President',
  VP_GROWTH: 'VP Growth & Engagement',
  VP_ACCOUNTABILITY: 'VP Accountability & Monitoring',
  VP_COMMUNITY_IMPACT: 'VP Community Impact',
  LG_PRESIDENT: 'LG President',
  EXECUTIVE: 'Executive Officer',
  GROUP_LEADER: 'Group Leader',
  MEMBER: 'Member',
};

export const ROLE_HIERARCHY_LEVEL: Record<UserRole, number> = {
  CDS_COORDINATOR: 10,
  STATE_PRESIDENT: 9,
  VP_GROWTH: 8,
  VP_ACCOUNTABILITY: 8,
  VP_COMMUNITY_IMPACT: 8,
  LG_PRESIDENT: 7,
  EXECUTIVE: 5,
  GROUP_LEADER: 4,
  MEMBER: 1,
};

export function isLeadershipRole(role: UserRole): boolean {
  return [
    'CDS_COORDINATOR',
    'STATE_PRESIDENT',
    'VP_GROWTH',
    'VP_ACCOUNTABILITY',
    'VP_COMMUNITY_IMPACT',
    'LG_PRESIDENT',
  ].includes(role);
}

export function isExecutiveOrAbove(role: UserRole): boolean {
  return role !== 'MEMBER';
}

/**
 * Checks whether user can assign tasks to others
 */
export function canAssignTask(role: UserRole): boolean {
  return [
    'CDS_COORDINATOR',
    'STATE_PRESIDENT',
    'VP_GROWTH',
    'VP_ACCOUNTABILITY',
    'LG_PRESIDENT',
  ].includes(role);
}

/**
 * Checks whether user can reassign or delete tasks
 */
export function canManageTask(role: UserRole, taskAssignerId?: string, currentUserId?: string): boolean {
  if (role === 'CDS_COORDINATOR' || role === 'STATE_PRESIDENT' || role === 'VP_ACCOUNTABILITY') {
    return true;
  }
  if (role === 'LG_PRESIDENT' && taskAssignerId === currentUserId) {
    return true;
  }
  return false;
}

/**
 * Checks whether user can reopen a completed task
 * "Allow authorized leadership to reopen a completed task when necessary, recording the reason."
 */
export function canReopenTask(role: UserRole): boolean {
  return [
    'CDS_COORDINATOR',
    'STATE_PRESIDENT',
    'VP_ACCOUNTABILITY',
    'VP_GROWTH',
    'VP_COMMUNITY_IMPACT',
    'LG_PRESIDENT',
  ].includes(role);
}

/**
 * Checks whether user can access the full accountability scorecard & engine
 */
export function canAccessAccountability(role: UserRole): boolean {
  return isLeadershipRole(role) || role === 'EXECUTIVE';
}

/**
 * Can user publish learning resources (YouTube videos, PDFs, links)?
 * Prompt: "Authorized users: CDS Coordinator, State President, VP Growth can publish learning resources."
 */
export function canPublishLearning(role: UserRole): boolean {
  return ['CDS_COORDINATOR', 'STATE_PRESIDENT', 'VP_GROWTH'].includes(role);
}

/**
 * Can user upload, edit or delete CDS documents?
 * Prompt: "Only authorized administrators can upload, edit or delete documents."
 */
export function canManageDocuments(role: UserRole): boolean {
  return ['CDS_COORDINATOR', 'STATE_PRESIDENT'].includes(role);
}

/**
 * Can user access documents based on document visibility?
 */
export function canViewDocument(userRole: UserRole, visibility: 'ALL' | 'EXECUTIVES_ONLY' | 'LEADERSHIP_ONLY'): boolean {
  if (visibility === 'ALL') return true;
  if (visibility === 'EXECUTIVES_ONLY') {
    return isExecutiveOrAbove(userRole);
  }
  if (visibility === 'LEADERSHIP_ONLY') {
    return isLeadershipRole(userRole);
  }
  return false;
}

/**
 * Can user create/manage activities?
 */
export function canCreateActivity(role: UserRole): boolean {
  return [
    'CDS_COORDINATOR',
    'STATE_PRESIDENT',
    'VP_GROWTH',
    'VP_COMMUNITY_IMPACT',
    'LG_PRESIDENT',
    'EXECUTIVE',
    'GROUP_LEADER',
  ].includes(role);
}

/**
 * Can user mark attendance for an activity?
 * Prompt: "Authorized Executive/Group Leader/LG President should be able to: OPEN ACTIVITY → SELECT MEMBERS → MARK PRESENT/ABSENT → SAVE"
 */
export function canMarkAttendance(role: UserRole): boolean {
  return [
    'CDS_COORDINATOR',
    'STATE_PRESIDENT',
    'LG_PRESIDENT',
    'EXECUTIVE',
    'GROUP_LEADER',
  ].includes(role);
}

/**
 * Can user submit monthly reports?
 * Prompt: "Allow executives and LG Presidents to submit monthly reports."
 */
export function canSubmitReport(role: UserRole): boolean {
  return [
    'CDS_COORDINATOR',
    'STATE_PRESIDENT',
    'VP_GROWTH',
    'VP_ACCOUNTABILITY',
    'VP_COMMUNITY_IMPACT',
    'LG_PRESIDENT',
    'EXECUTIVE',
    'GROUP_LEADER',
  ].includes(role);
}

/**
 * Can user access the Administration panel?
 * CDS_COORDINATOR has highest administrative authority.
 */
export function canAccessAdmin(role: UserRole): boolean {
  return role === 'CDS_COORDINATOR';
}

/**
 * Does user have state-wide visibility or is scoped to their specific LG?
 * Prompt: LG President "Only see members and activities belonging to their LG unless explicitly authorized."
 */
export function isScopedToLG(role: UserRole): boolean {
  return role === 'LG_PRESIDENT';
}

/**
 * Can user register/invite new members?
 * Prompt: "Authorized roles that can create/register members: CDS Coordinator, State President, LG President"
 */
export function canRegisterMember(role: UserRole): boolean {
  return ['CDS_COORDINATOR', 'STATE_PRESIDENT', 'LG_PRESIDENT'].includes(role);
}

/**
 * Can user suspend or activate member accounts?
 */
export function canManageAccountStatus(
  actorRole: UserRole,
  targetRole?: UserRole,
  actorLgId?: string,
  targetLgId?: string
): boolean {
  if (actorRole === 'CDS_COORDINATOR') return true;
  if (actorRole === 'STATE_PRESIDENT' && targetRole !== 'CDS_COORDINATOR') return true;
  if (actorRole === 'LG_PRESIDENT') {
    // Can only manage accounts inside their own LG, and cannot suspend state executives or coordinator
    const isSameLg = actorLgId && targetLgId && actorLgId === targetLgId;
    const isSubordinate = targetRole === 'MEMBER' || targetRole === 'GROUP_LEADER' || targetRole === 'EXECUTIVE';
    return Boolean(isSameLg && isSubordinate);
  }
  return false;
}

/**
 * Can user change another member's role?
 */
export function canChangeMemberRole(actorRole: UserRole, targetRole?: UserRole): boolean {
  if (actorRole === 'CDS_COORDINATOR') return true;
  if (actorRole === 'STATE_PRESIDENT') {
    return targetRole !== 'CDS_COORDINATOR';
  }
  return false;
}

/**
 * Can user reassign a member to a different LG?
 */
export function canChangeMemberLG(actorRole: UserRole): boolean {
  return actorRole === 'CDS_COORDINATOR';
}
