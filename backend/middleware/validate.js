const { z } = require('zod');

/**
 * Validation schemas for request bodies and query params
 */

// Profile schemas
const extractProfileSchema = z.object({
  resumeText: z.string().min(10, 'Resume text too short').max(50000, 'Resume text too long'),
});

const updateProfileSchema = z.object({
  skills: z.array(z.string().max(100)).max(100).optional(),
  interests: z.array(z.string().max(100)).max(100).optional(),
  eligibility: z.object({
    year: z.string().optional(),
    branch: z.string().optional(),
  }).optional(),
  looking_for: z.array(
    z.enum(['hackathon', 'internship', 'competition', 'scholarship', 'workshop'])
  ).optional(),
}).refine(data => Object.keys(data).length > 0, { message: 'At least one field required' });

// Opportunity schemas
const extractOpportunitySchema = z.object({
  rawText: z.string().min(10, 'Opportunity text too short').max(50000, 'Opportunity text too long'),
});

const bulkSaveSchema = z.object({
  candidates: z.array(z.object({
    title: z.string().min(1).max(300),
    organization: z.string().max(300).nullable().optional(),
    type: z.enum(['hackathon', 'internship', 'competition', 'scholarship', 'workshop', 'other']),
    deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    eligibility: z.record(z.any()).optional().default({}),
    skills: z.array(z.string()).optional().default([]),
    tags: z.array(z.string()).optional().default([]),
    summary: z.string().max(2000).optional().default(''),
    url: z.string().max(2000).nullable().optional(),
    raw_snippet: z.string().max(2000).optional().default(''),
    dedupe_key: z.string().max(500).optional(),
  })).min(1).max(20),
});

const listOpportunitiesQuerySchema = z.object({
  type: z.enum(['hackathon', 'internship', 'competition', 'scholarship', 'workshop']).optional(),
  source: z.enum(['devpost', 'mlh', 'eventbrite', 'seed', 'user-submitted']).optional(),
  urgency: z.enum(['urgent', 'soon', 'normal', 'closed']).optional(),
});

// Pipeline schemas
const addToPipelineSchema = z.object({
  opportunityId: z.string().uuid('Invalid opportunity ID'),
  status: z.enum(['saved', 'preparing', 'applied', 'result']),
  notes: z.string().max(2000).optional().nullable(),
});

const updatePipelineSchema = z.object({
  status: z.enum(['saved', 'preparing', 'applied', 'result']).optional(),
  notes: z.string().max(2000).optional(),
}).refine(data => Object.keys(data).length > 0, { message: 'At least one field required' });

const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

/**
 * Generic validation middleware factory
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const data = req[source];
    const result = schema.safeParse(data);

    if (!result.success) {
      const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
      return res.status(400).json({ error: errors });
    }

    req[source] = result.data;
    next();
  };
}

module.exports = {
  // Profile
  validateExtractProfile: validate(extractProfileSchema, 'body'),
  validateUpdateProfile: validate(updateProfileSchema, 'body'),
  // Opportunity
  validateExtractOpportunity: validate(extractOpportunitySchema, 'body'),
  validateBulkSave: validate(bulkSaveSchema, 'body'),
  validateListOpportunities: validate(listOpportunitiesQuerySchema, 'query'),
  // Pipeline
  validateAddToPipeline: validate(addToPipelineSchema, 'body'),
  validateUpdatePipeline: validate(updatePipelineSchema, 'body'),
  validateUuidParam: validate(uuidParamSchema, 'params'),
};