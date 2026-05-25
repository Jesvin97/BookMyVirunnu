import type { Request, Response } from "express";
import { AvailabilityRuleService } from "../services/availability-rule.service";
import { asyncHandler, sendSuccess } from "../utils/http";
import { toParam } from "../utils/params";
import { objectIdSchema } from "../validators/common";
import { createAvailabilityRuleSchema, updateAvailabilityRuleSchema } from "../validators/availability-rule";

const availabilityRuleService = new AvailabilityRuleService();

export class AvailabilityRuleController {
  list = asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth) {
      res.status(401).json({ success: false, error: { code: "unauthorized", message: "Missing authentication." } });
      return;
    }
    const eventId = objectIdSchema.parse(toParam(req.params.eventId));
    const rules = await availabilityRuleService.listRules(eventId, req.auth.id);
    sendSuccess(res, { rules });
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth) {
      res.status(401).json({ success: false, error: { code: "unauthorized", message: "Missing authentication." } });
      return;
    }
    const eventId = objectIdSchema.parse(toParam(req.params.eventId));
    const input = createAvailabilityRuleSchema.parse(req.body);
    const rule = await availabilityRuleService.createRule(eventId, req.auth.id, {
      ruleType: input.ruleType,
      daysOfWeek: input.daysOfWeek,
      date: input.date,
      rangeStart: input.rangeStart ? new Date(input.rangeStart) : undefined,
      rangeEnd: input.rangeEnd ? new Date(input.rangeEnd) : undefined,
      startTime: input.startTime,
      endTime: input.endTime,
      isBlocked: input.isBlocked,
      maxGuests: input.maxGuests,
      priority: input.priority,
      reason: input.reason
    });
    sendSuccess(res, { rule }, 201);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth) {
      res.status(401).json({ success: false, error: { code: "unauthorized", message: "Missing authentication." } });
      return;
    }
    const ruleId = objectIdSchema.parse(toParam(req.params.ruleId));
    const input = updateAvailabilityRuleSchema.parse(req.body);
    const rule = await availabilityRuleService.updateRule(ruleId, req.auth.id, {
      ...input,
      rangeStart: input.rangeStart ? new Date(input.rangeStart) : undefined,
      rangeEnd: input.rangeEnd ? new Date(input.rangeEnd) : undefined
    });
    sendSuccess(res, { rule });
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth) {
      res.status(401).json({ success: false, error: { code: "unauthorized", message: "Missing authentication." } });
      return;
    }
    const ruleId = objectIdSchema.parse(toParam(req.params.ruleId));
    const result = await availabilityRuleService.deleteRule(ruleId, req.auth.id);
    sendSuccess(res, result);
  });
}
