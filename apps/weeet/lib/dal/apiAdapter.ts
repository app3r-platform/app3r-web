/**
 * apps/weeet/lib/dal/apiAdapter.ts
 * Phase D-1 — API adapter skeleton สำหรับ WeeeT
 * ทุก method throw NotImplementedError("D-2 scope") — รอ Phase D-2 implement จริง
 */

import type { WeeeTDAL } from "./types";
import { NotImplementedError } from "./errors";

const SCOPE = "D-2 scope";

export const apiAdapter: WeeeTDAL = {
  jobAssign: {
    async getAssignedJobs(_technicianId) {
      throw new NotImplementedError(`jobAssign.getAssignedJobs — ${SCOPE}`);
    },
    async updateJobStatus(_jobId, _status) {
      throw new NotImplementedError(`jobAssign.updateJobStatus — ${SCOPE}`);
    },
  },
  jobStatus: {
    async getJobProgress(_jobId) {
      throw new NotImplementedError(`jobStatus.getJobProgress — ${SCOPE}`);
    },
    async advanceSubStage(_jobId, _subStage, _step) {
      throw new NotImplementedError(`jobStatus.advanceSubStage — ${SCOPE}`);
    },
    async markCompleted(_jobId, _step) {
      throw new NotImplementedError(`jobStatus.markCompleted — ${SCOPE}`);
    },
  },
  technician: {
    async getProfile(_technicianId) {
      throw new NotImplementedError(`technician.getProfile — ${SCOPE}`);
    },
    async updateProfile(_technicianId, _data) {
      throw new NotImplementedError(`technician.updateProfile — ${SCOPE}`);
    },
  },
  warranty: {
    async getWarranty(_jobId) {
      throw new NotImplementedError(`warranty.getWarranty — ${SCOPE}`);
    },
  },
};
