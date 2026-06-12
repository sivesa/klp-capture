import React from 'react';
import type { AssignmentStatus } from '../types';

const LABELS: Record<AssignmentStatus, string> = {
  pending: 'Pending', captured: 'Captured', queued: 'In Queue',
  submitted: 'Submitted', graded: 'Graded', failed: 'Failed',
};
const ICONS: Record<AssignmentStatus, string> = {
  pending: '⏳', captured: '📷', queued: '🔄',
  submitted: '✅', graded: '🎯', failed: '❌',
};

interface Props { status: AssignmentStatus; }

const StatusBadge: React.FC<Props> = ({ status }) => (
  <span className={`badge badge-${status}`}>
    {ICONS[status]} {LABELS[status]}
  </span>
);

export default StatusBadge;
