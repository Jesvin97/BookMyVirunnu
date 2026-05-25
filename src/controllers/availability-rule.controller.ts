import type { Request, Response } from "express";
import { AvailabilityRuleService } from "../services/availability-rule.service";
import { asyncHandler, sendSuccess } from "../utils/http";
import { objectIdSchema } from "../validators/common";
import { createAvailabilityRuleSchema, updateAvailabilityRuleSchema } from "../validators/availability-rule";

const availabilityRuleService = new AvailabilityRuleService();

export class AvailabilityRuleController {
  list = asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth) {
      res.status(401).json({
        success: false,
        error: { code: "unauthorized", message: "Missing authentication." }
      });
      return;
    }
    objectIdSchema.parse(req.params.eventId);
    const rules = await availabilityRuleService.listRules(req.params.eventId, req.auth.id);
    sendSuccess(res, { rules });
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth) {
      res.status(401).json({
        success: false,
        error: { code: "unauthorized", message: "Missing authentication." }
      });
      return;
    }
    objectIdSchema.parse(req.params.eventId);
    const input = createAvailabilityRuleSchema.parse(req.body);
    const rule = await availabilityRuleService.createRule(req.params.eventId, req.auth.id, {
      ...input,
      rangeStart: input.rangeStart ? new Date(input.rangeStart) : undefined,
      rangeEnd: input.rangeEnd ? new Date(input.rangeEnd) : undefined
    });
    sendSuccess(res, { rule }, 201);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth) {
      res.status(401).json({
        success: false,
        error: { code: "unauthorized", message: "Missing authentication." }
      });
      return;
    }
    objectIdSchema.parse(req.params.ruleId);
    const input = updateAvailabilityRuleSchema.parse(req.body);
    const rule = await availabilityRuleService.updateRule(req.params.ruleId, req.auth.id, {
      ...input,
      rangeStart: input.rangeStart ? new Date(input.rangeStart) : undefined,
      rangeEnd: input.rangeEnd ? new Date(input.rangeEnd) : undefined
    });
    sendSuccess(res, { rule });
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth) {
      res.status(401).json({
        success: false,
        error: { code: "unauthorized", message: "Missing authentication." }
      });
      return;
    }
    objectIdSchema.parse(req.params.ruleId);
    const result = await availabilityRuleService.deleteRule(req.params.ruleId, req.auth.id);
    sendSuccess(res, result);
  });
}
