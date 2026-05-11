// ============================================================
// lib/api/customer-jobs.ts — API functions for repair + maintain jobs
// Phase C-4.1b
// ============================================================
import { repairJobs } from '../mock/repair-jobs';
import { maintainJobs } from '../mock/maintain-jobs';
import type { PublicJobProjection, AuthenticatedJobProjection } from '../types/listings-customer-jobs';

export function getPublicProjection(job: AuthenticatedJobProjection): PublicJobProjection {
  const { problemDescription: _pd, photos: _ph, estimatedBudget: _eb, feePreview: _fp, customerName: _cn, customerPhone: _cp, ...pub } = job;
  void _pd; void _ph; void _eb; void _fp; void _cn; void _cp;
  return pub;
}

export function getRepairJobs(filters?: { serviceType?: number; area?: string }): PublicJobProjection[] {
  let jobs = repairJobs;
  if (filters?.serviceType) {
    jobs = jobs.filter((j) => j.serviceType === filters.serviceType);
  }
  if (filters?.area) {
    jobs = jobs.filter((j) => j.area === filters.area);
  }
  return jobs.map(getPublicProjection);
}

export function getMaintainJobs(filters?: { area?: string }): PublicJobProjection[] {
  let jobs = maintainJobs;
  if (filters?.area) {
    jobs = jobs.filter((j) => j.area === filters.area);
  }
  return jobs.map(getPublicProjection);
}

export function getJob(type: 'repair' | 'maintain', id: string): AuthenticatedJobProjection | undefined {
  if (type === 'repair') return repairJobs.find((j) => j.id === id);
  return maintainJobs.find((j) => j.id === id);
}
