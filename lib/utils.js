import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(date) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(date) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatRelativeTime(date) {
  if (!date) return "";
  const now = new Date();
  const d = new Date(date);
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export function formatSLACountdown(dueAt) {
  if (!dueAt) return { text: "No SLA", status: "none" };
  const now = new Date();
  const due = new Date(dueAt);
  const diffMs = due - now;
  const isOverdue = diffMs < 0;
  const absDiff = Math.abs(diffMs);

  const days = Math.floor(absDiff / 86400000);
  const hours = Math.floor((absDiff % 86400000) / 3600000);
  const minutes = Math.floor((absDiff % 3600000) / 60000);

  let text;
  if (days > 0) text = `${days}d ${hours}h`;
  else if (hours > 0) text = `${hours}h ${minutes}m`;
  else text = `${minutes}m`;

  if (isOverdue) text += " overdue";

  let status = "ok"; // green
  if (isOverdue) status = "breached"; // red
  else if (diffMs < absDiff * 0.25) status = "warning"; // amber

  return { text, status, isOverdue };
}

export function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getStatusColor(status) {
  const colors = {
    OPEN: "#3b82f6",
    IN_PROGRESS: "#f59e0b",
    ON_HOLD: "#6b7280",
    PENDING_CUSTOMER: "#eab308",
    RESOLVED: "#10b981",
    CLOSED: "#374151",
  };
  return colors[status] || "#6b7280";
}

export function getStatusLabel(status) {
  const labels = {
    OPEN: "Open",
    IN_PROGRESS: "In Progress",
    ON_HOLD: "On Hold",
    PENDING_CUSTOMER: "Pending Customer",
    RESOLVED: "Resolved",
    CLOSED: "Closed",
  };
  return labels[status] || status;
}

export function getPriorityColor(priority) {
  const colors = {
    URGENT: "#ef4444",
    HIGH: "#f97316",
    MEDIUM: "#eab308",
    LOW: "#6b7280",
  };
  return colors[priority] || "#6b7280";
}

export function getPriorityLabel(priority) {
  const labels = {
    URGENT: "Urgent",
    HIGH: "High",
    MEDIUM: "Medium",
    LOW: "Low",
  };
  return labels[priority] || priority;
}
