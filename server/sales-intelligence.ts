import { protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  getDecisionMakers, createDecisionMaker, updateDecisionMaker, deleteDecisionMaker,
  getCompetitorComparisons, createCompetitorComparison, deleteCompetitorComparison,
  getIronTriangleReviews, createIronTriangleReview, getLatestIronTriangleReview,
  getIntelRecords, createIntelRecord,
  getLTCWeeklyTasks, createLTCWeeklyTask, updateLTCWeeklyTask,
  getEnhancedSalesLeads, getEnhancedSalesLead,
  getHuaweiSalesStats,
} from "../supabase/sales-intelligence-client";
import { updateSalesLead } from "../supabase/sales-client";

// Sales Intelligence Router - Huawei-style CRM
export const salesIntelligenceRouter = router({
  // ==================== Dashboard Stats ====================

  getHuaweiStats: protectedProcedure.query(async () => {
    try {
      const stats = await getHuaweiSalesStats();
      return stats;
    } catch (error) {
      console.error("Error fetching Huawei stats:", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch stats" });
    }
  }),

  // ==================== Enhanced Leads ====================

  listEnhancedLeads: protectedProcedure
    .input(z.object({
      valueRating: z.enum(["A", "B", "C", "D"]).optional(),
      ltcStage: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      try {
        const leads = await getEnhancedSalesLeads({
          value_rating: input?.valueRating,
          ltc_stage: input?.ltcStage,
        });
        return leads.map(l => ({
          id: l.id.toString(),
          name: l.name,
          company: l.company,
          title: l.title || "",
          email: l.email,
          status: l.status,
          score: l.score,
          aiInsights: l.ai_insights || [],
          suggestedActions: l.suggested_actions || [],
          valueRating: l.value_rating,
          competitorName: l.competitor_name || "",
          competitorAdvantage: l.competitor_advantage || "",
          ourAdvantage: l.our_advantage || "",
          paymentRisk: l.payment_risk,
          decisionCycle: l.decision_cycle,
          needPrepayment: l.need_prepayment,
          estimatedValue: l.estimated_value ? parseFloat(l.estimated_value) : null,
          industry: l.industry || "",
          powerMapVersion: l.power_map_version,
          ltcStage: l.ltc_stage,
          lastContact: l.last_contact,
          nextFollowUp: l.next_follow_up,
        }));
      } catch (error) {
        console.error("Error fetching enhanced leads:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch leads" });
      }
    }),

  getEnhancedLead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        const lead = await getEnhancedSalesLead(parseInt(input.id));
        return {
          id: lead.id.toString(),
          name: lead.name,
          company: lead.company,
          title: lead.title || "",
          email: lead.email,
          status: lead.status,
          score: lead.score,
          aiInsights: lead.ai_insights || [],
          suggestedActions: lead.suggested_actions || [],
          valueRating: lead.value_rating,
          competitorName: lead.competitor_name || "",
          competitorAdvantage: lead.competitor_advantage || "",
          ourAdvantage: lead.our_advantage || "",
          paymentRisk: lead.payment_risk,
          decisionCycle: lead.decision_cycle,
          needPrepayment: lead.need_prepayment,
          estimatedValue: lead.estimated_value ? parseFloat(lead.estimated_value) : null,
          industry: lead.industry || "",
          powerMapVersion: lead.power_map_version,
          ltcStage: lead.ltc_stage,
          lastContact: lead.last_contact,
          nextFollowUp: lead.next_follow_up,
        };
      } catch (error) {
        console.error("Error fetching enhanced lead:", error);
        throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });
      }
    }),

  updateLeadHuaweiFields: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: z.object({
        valueRating: z.enum(["A", "B", "C", "D"]).optional(),
        competitorName: z.string().optional(),
        competitorAdvantage: z.string().optional(),
        ourAdvantage: z.string().optional(),
        paymentRisk: z.enum(["low", "medium", "high"]).optional(),
        decisionCycle: z.enum(["1_week", "2_weeks", "1_month", "1_quarter", "long", "unknown"]).optional(),
        needPrepayment: z.boolean().optional(),
        estimatedValue: z.number().nullable().optional(),
        industry: z.string().optional(),
        ltcStage: z.enum(["ML", "MO", "ATC", "delivery", "collection"]).optional(),
        powerMapVersion: z.number().optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      try {
        const updateData: Record<string, any> = {};
        const fieldMap: Record<string, string> = {
          valueRating: "value_rating",
          competitorName: "competitor_name",
          competitorAdvantage: "competitor_advantage",
          ourAdvantage: "our_advantage",
          paymentRisk: "payment_risk",
          decisionCycle: "decision_cycle",
          needPrepayment: "need_prepayment",
          estimatedValue: "estimated_value",
          industry: "industry",
          ltcStage: "ltc_stage",
          powerMapVersion: "power_map_version",
        };
        for (const [key, value] of Object.entries(input.data)) {
          if (value !== undefined) updateData[fieldMap[key]] = value;
        }
        await updateSalesLead(parseInt(input.id), updateData);
        return { success: true };
      } catch (error) {
        console.error("Error updating lead:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update lead" });
      }
    }),

  // ==================== Decision Makers (Power Map + Pain Chain) ====================

  listDecisionMakers: protectedProcedure
    .input(z.object({ leadId: z.string() }))
    .query(async ({ input }) => {
      try {
        const makers = await getDecisionMakers(parseInt(input.leadId));
        return makers.map(m => ({
          id: m.id.toString(),
          leadId: m.lead_id.toString(),
          name: m.name,
          title: m.title || "",
          department: m.department || "",
          roles: m.roles || [],
          businessPain: m.business_pain || "",
          personalGoal: m.personal_goal || "",
          fearPoint: m.fear_point || "",
          communicationStyle: m.communication_style,
          icebreaker: m.icebreaker || "",
          relationshipStrength: m.relationship_strength,
          arVerified: m.ar_verified,
          srVerified: m.sr_verified,
          frVerified: m.fr_verified,
          nextAction: m.next_action || "",
          nextActionDate: m.next_action_date,
          notes: m.notes || "",
        }));
      } catch (error) {
        console.error("Error fetching decision makers:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch decision makers" });
      }
    }),

  createDecisionMaker: protectedProcedure
    .input(z.object({
      leadId: z.string(),
      name: z.string().min(1),
      title: z.string().optional(),
      department: z.string().optional(),
      roles: z.array(z.enum(["initiator", "influencer", "decider", "approver", "buyer"])).optional(),
      businessPain: z.string().optional(),
      personalGoal: z.string().optional(),
      fearPoint: z.string().optional(),
      communicationStyle: z.enum(["data_driven", "relationship", "security", "mixed"]).optional(),
      icebreaker: z.string().optional(),
      relationshipStrength: z.number().min(0).max(100).optional(),
      nextAction: z.string().optional(),
      nextActionDate: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const dm = await createDecisionMaker({
          lead_id: parseInt(input.leadId),
          name: input.name,
          title: input.title || null,
          department: input.department || null,
          roles: input.roles || [],
          business_pain: input.businessPain || null,
          personal_goal: input.personalGoal || null,
          fear_point: input.fearPoint || null,
          communication_style: input.communicationStyle || "data_driven",
          icebreaker: input.icebreaker || null,
          relationship_strength: input.relationshipStrength || 0,
          last_contact: null,
          next_action: input.nextAction || null,
          next_action_date: input.nextActionDate || null,
          notes: input.notes || null,
          ar_verified: false,
          sr_verified: false,
          fr_verified: false,
        });
        return { success: true, id: dm.id.toString() };
      } catch (error) {
        console.error("Error creating decision maker:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create decision maker" });
      }
    }),

  updateDecisionMaker: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: z.object({
        name: z.string().min(1).optional(),
        title: z.string().optional(),
        department: z.string().optional(),
        roles: z.array(z.enum(["initiator", "influencer", "decider", "approver", "buyer"])).optional(),
        businessPain: z.string().optional(),
        personalGoal: z.string().optional(),
        fearPoint: z.string().optional(),
        communicationStyle: z.enum(["data_driven", "relationship", "security", "mixed"]).optional(),
        icebreaker: z.string().optional(),
        relationshipStrength: z.number().min(0).max(100).optional(),
        arVerified: z.boolean().optional(),
        srVerified: z.boolean().optional(),
        frVerified: z.boolean().optional(),
        nextAction: z.string().optional(),
        nextActionDate: z.string().nullable().optional(),
        notes: z.string().optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      try {
        const updateData: Record<string, any> = {};
        const fieldMap: Record<string, string> = {
          name: "name", title: "title", department: "department", roles: "roles",
          businessPain: "business_pain", personalGoal: "personal_goal", fearPoint: "fear_point",
          communicationStyle: "communication_style", icebreaker: "icebreaker",
          relationshipStrength: "relationship_strength",
          arVerified: "ar_verified", srVerified: "sr_verified", frVerified: "fr_verified",
          nextAction: "next_action", nextActionDate: "next_action_date", notes: "notes",
        };
        for (const [key, value] of Object.entries(input.data)) {
          if (value !== undefined) updateData[fieldMap[key]] = value;
        }
        await updateDecisionMaker(parseInt(input.id), updateData);
        return { success: true };
      } catch (error) {
        console.error("Error updating decision maker:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update decision maker" });
      }
    }),

  deleteDecisionMaker: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        await deleteDecisionMaker(parseInt(input.id));
        return { success: true };
      } catch (error) {
        console.error("Error deleting decision maker:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to delete decision maker" });
      }
    }),

  // ==================== Competitor Comparisons ====================

  listCompetitors: protectedProcedure
    .input(z.object({ leadId: z.string() }))
    .query(async ({ input }) => {
      try {
        const comps = await getCompetitorComparisons(parseInt(input.leadId));
        return comps.map(c => ({
          id: c.id.toString(),
          leadId: c.lead_id.toString(),
          competitorName: c.competitor_name,
          competitorSolution: c.competitor_solution || "",
          competitorPriceRange: c.competitor_price_range || "",
          competitorDeliveryCycle: c.competitor_delivery_cycle || "",
          competitorStrengths: c.competitor_strengths || "",
          competitorWeaknesses: c.competitor_weaknesses || "",
          ourDifferentiator: c.our_differentiator || "",
          comparisonDate: c.comparison_date,
        }));
      } catch (error) {
        console.error("Error fetching competitors:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch competitors" });
      }
    }),

  createCompetitor: protectedProcedure
    .input(z.object({
      leadId: z.string(),
      competitorName: z.string().min(1),
      competitorSolution: z.string().optional(),
      competitorPriceRange: z.string().optional(),
      competitorDeliveryCycle: z.string().optional(),
      competitorStrengths: z.string().optional(),
      competitorWeaknesses: z.string().optional(),
      ourDifferentiator: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const comp = await createCompetitorComparison({
          lead_id: parseInt(input.leadId),
          competitor_name: input.competitorName,
          competitor_solution: input.competitorSolution || null,
          competitor_price_range: input.competitorPriceRange || null,
          competitor_delivery_cycle: input.competitorDeliveryCycle || null,
          competitor_strengths: input.competitorStrengths || null,
          competitor_weaknesses: input.competitorWeaknesses || null,
          our_differentiator: input.ourDifferentiator || null,
          comparison_date: new Date().toISOString(),
        });
        return { success: true, id: comp.id.toString() };
      } catch (error) {
        console.error("Error creating competitor:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create competitor" });
      }
    }),

  deleteCompetitor: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        await deleteCompetitorComparison(parseInt(input.id));
        return { success: true };
      } catch (error) {
        console.error("Error deleting competitor:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to delete competitor" });
      }
    }),

  // ==================== Iron Triangle Reviews ====================

  listIronTriangleReviews: protectedProcedure
    .input(z.object({ leadId: z.string() }))
    .query(async ({ input }) => {
      try {
        const reviews = await getIronTriangleReviews(parseInt(input.leadId));
        return reviews.map(r => ({
          id: r.id.toString(),
          leadId: r.lead_id.toString(),
          reviewDate: r.review_date,
          arCoverage: r.ar_coverage || "",
          arNextStep: r.ar_next_step || "",
          srPainMatch: r.sr_pain_match || "",
          srProposalStatus: r.sr_proposal_status || "",
          frDeliveryRisk: r.fr_delivery_risk || "",
          frPaymentPlan: r.fr_payment_plan || "",
          overallActionPlan: r.overall_action_plan || "",
          winProbability: r.win_probability,
        }));
      } catch (error) {
        console.error("Error fetching iron triangle reviews:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch reviews" });
      }
    }),

  getLatestReview: protectedProcedure
    .input(z.object({ leadId: z.string() }))
    .query(async ({ input }) => {
      try {
        const review = await getLatestIronTriangleReview(parseInt(input.leadId));
        if (!review) return null;
        return {
          id: review.id.toString(),
          leadId: review.lead_id.toString(),
          reviewDate: review.review_date,
          arCoverage: review.ar_coverage || "",
          arNextStep: review.ar_next_step || "",
          srPainMatch: review.sr_pain_match || "",
          srProposalStatus: review.sr_proposal_status || "",
          frDeliveryRisk: review.fr_delivery_risk || "",
          frPaymentPlan: review.fr_payment_plan || "",
          overallActionPlan: review.overall_action_plan || "",
          winProbability: review.win_probability,
        };
      } catch (error) {
        console.error("Error fetching latest review:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch review" });
      }
    }),

  createIronTriangleReview: protectedProcedure
    .input(z.object({
      leadId: z.string(),
      arCoverage: z.string().optional(),
      arNextStep: z.string().optional(),
      srPainMatch: z.string().optional(),
      srProposalStatus: z.string().optional(),
      frDeliveryRisk: z.string().optional(),
      frPaymentPlan: z.string().optional(),
      overallActionPlan: z.string().optional(),
      winProbability: z.number().min(0).max(100).optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const review = await createIronTriangleReview({
          lead_id: parseInt(input.leadId),
          review_date: new Date().toISOString(),
          ar_coverage: input.arCoverage || null,
          ar_next_step: input.arNextStep || null,
          sr_pain_match: input.srPainMatch || null,
          sr_proposal_status: input.srProposalStatus || null,
          fr_delivery_risk: input.frDeliveryRisk || null,
          fr_payment_plan: input.frPaymentPlan || null,
          overall_action_plan: input.overallActionPlan || null,
          win_probability: input.winProbability || null,
        });
        return { success: true, id: review.id.toString() };
      } catch (error) {
        console.error("Error creating iron triangle review:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create review" });
      }
    }),

  // ==================== Intel Records ====================

  listIntelRecords: protectedProcedure
    .input(z.object({ leadId: z.string() }))
    .query(async ({ input }) => {
      try {
        const records = await getIntelRecords(parseInt(input.leadId));
        return records.map(r => ({
          id: r.id.toString(),
          leadId: r.lead_id.toString(),
          intelType: r.intel_type,
          source: r.source,
          title: r.title,
          content: r.content || "",
          impact: r.impact || "",
          recordedAt: r.recorded_at,
        }));
      } catch (error) {
        console.error("Error fetching intel records:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch intel records" });
      }
    }),

  createIntelRecord: protectedProcedure
    .input(z.object({
      leadId: z.string(),
      intelType: z.enum(["customer_public", "competitor", "industry", "other"]),
      source: z.string().min(1),
      title: z.string().min(1),
      content: z.string().optional(),
      impact: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const record = await createIntelRecord({
          lead_id: parseInt(input.leadId),
          intel_type: input.intelType,
          source: input.source,
          title: input.title,
          content: input.content || null,
          impact: input.impact || null,
          recorded_at: new Date().toISOString(),
        });
        return { success: true, id: record.id.toString() };
      } catch (error) {
        console.error("Error creating intel record:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create intel record" });
      }
    }),

  // ==================== LTC Weekly Tasks ====================

  listLTCWeeklyTasks: protectedProcedure
    .input(z.object({ leadId: z.string(), weekStart: z.string().optional() }))
    .query(async ({ input }) => {
      try {
        const tasks = await getLTCWeeklyTasks(parseInt(input.leadId), input.weekStart);
        return tasks.map(t => ({
          id: t.id.toString(),
          leadId: t.lead_id.toString(),
          weekStart: t.week_start,
          phase: t.phase,
          taskDescription: t.task_description,
          completed: t.completed,
          completedAt: t.completed_at,
          notes: t.notes || "",
        }));
      } catch (error) {
        console.error("Error fetching LTC tasks:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch LTC tasks" });
      }
    }),

  createLTCWeeklyTask: protectedProcedure
    .input(z.object({
      leadId: z.string(),
      weekStart: z.string(),
      phase: z.enum(["ML_clean", "ML_value_email", "MO_deep_update", "MO_strategy", "ATC_review", "delivery_monitor", "collection"]),
      taskDescription: z.string().min(1),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const task = await createLTCWeeklyTask({
          lead_id: parseInt(input.leadId),
          week_start: input.weekStart,
          phase: input.phase,
          task_description: input.taskDescription,
          completed: false,
          completed_at: null,
          notes: input.notes || null,
        });
        return { success: true, id: task.id.toString() };
      } catch (error) {
        console.error("Error creating LTC task:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create LTC task" });
      }
    }),

  toggleLTCWeeklyTask: protectedProcedure
    .input(z.object({
      id: z.string(),
      completed: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      try {
        await updateLTCWeeklyTask(parseInt(input.id), {
          completed: input.completed,
          completed_at: input.completed ? new Date().toISOString() : null,
        });
        return { success: true };
      } catch (error) {
        console.error("Error toggling LTC task:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update LTC task" });
      }
    }),
});
