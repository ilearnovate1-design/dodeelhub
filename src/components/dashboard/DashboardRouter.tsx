import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Activity, CDSDocument, LearningResource, LocalGovernment, Member, MonthlyReport, Task } from '../../types';
import { AccountabilityDashboard } from './AccountabilityDashboard';
import { ExecutiveDashboard } from './ExecutiveDashboard';
import { GrowthDashboard } from './GrowthDashboard';
import { LeadershipDashboard } from './LeadershipDashboard';
import { MemberDashboard } from './MemberDashboard';

interface DashboardRouterProps {
  tasks: Task[];
  activities: Activity[];
  documents: CDSDocument[];
  learning: LearningResource[];
  members: Member[];
  reports: MonthlyReport[];
  lgs: LocalGovernment[];
  onNavigate: (tab: string, filter?: string) => void;
  onOpenTask: (task: Task) => void;
  onOpenReport: (report: MonthlyReport) => void;
  onOpenLearning: (resource: LearningResource) => void;
  onNewTask?: () => void;
  onOpenActivityAttendance?: (activity: Activity) => void;
}

export const DashboardRouter: React.FC<DashboardRouterProps> = (props) => {
  const { currentRole } = useAuth();

  if (currentRole === 'MEMBER') {
    return (
      <MemberDashboard
        tasks={props.tasks}
        activities={props.activities}
        documents={props.documents}
        learning={props.learning}
        onNavigate={props.onNavigate}
        onOpenTask={props.onOpenTask}
        onOpenLearning={props.onOpenLearning}
      />
    );
  }

  if (currentRole === 'EXECUTIVE' || currentRole === 'GROUP_LEADER') {
    return (
      <ExecutiveDashboard
        tasks={props.tasks}
        activities={props.activities}
        onNavigate={props.onNavigate}
        onOpenTask={props.onOpenTask}
        onNewTask={props.onNewTask}
        onOpenActivityAttendance={props.onOpenActivityAttendance}
      />
    );
  }

  // VP Accountability dedicated command view focused on follow-up & operational metrics
  if (currentRole === 'VP_ACCOUNTABILITY') {
    return (
      <AccountabilityDashboard
        tasks={props.tasks}
        members={props.members}
        lgs={props.lgs}
        onNavigate={props.onNavigate}
        onOpenTask={props.onOpenTask}
        onNewTask={props.onNewTask}
      />
    );
  }

  // VP Growth dedicated command view focused on membership growth, visibility & campaigns
  if (currentRole === 'VP_GROWTH') {
    return (
      <GrowthDashboard
        tasks={props.tasks}
        members={props.members}
        activities={props.activities}
        lgs={props.lgs}
        onNavigate={props.onNavigate}
        onOpenTask={props.onOpenTask}
      />
    );
  }

  // Other Leadership roles: CDS_COORDINATOR, STATE_PRESIDENT, VP_COMMUNITY_IMPACT, LG_PRESIDENT
  return (
    <LeadershipDashboard
      members={props.members}
      tasks={props.tasks}
      activities={props.activities}
      reports={props.reports}
      lgs={props.lgs}
      onNavigate={props.onNavigate}
      onOpenTask={props.onOpenTask}
      onOpenReport={props.onOpenReport}
      onNewTask={props.onNewTask}
    />
  );
};
