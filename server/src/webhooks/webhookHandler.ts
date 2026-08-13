import { Request, Response } from 'express';
import { GHLClient } from '../ghl/ghlClient';
import { AISentimentEngine, DealHealthAnalysis } from '../ai/sentimentEngine';
import { config } from '../config/env';

// In-memory cache store for real-time dashboard updates
export const dealAnalysisStore: Map<string, DealHealthAnalysis> = new Map();

const ghlClient = new GHLClient();
const aiEngine = new AISentimentEngine();

// Simple alphanumeric + dash/underscore validator for IDs
function isValidId(id: unknown): id is string {
  return typeof id === 'string' && id.length > 0 && id.length <= 128 && /^[a-zA-Z0-9_\-]+$/.test(id);
}

export class PipelineManager {
  static async processOpportunityEvent(opportunityId: string, locationId: string, preFetchedOpp?: any) {
    try {
      let opportunity = preFetchedOpp;
      if (!opportunity) {
        opportunity = { id: opportunityId, name: 'Opportunity', contactId: '' };
      }

      if (!opportunity) throw new Error('Opportunity not found');

      // Fetch Contact & Conversation Notes from GHL API v2 (with fail-safe fallbacks)
      let contact: any = { id: opportunity.contactId, name: opportunity.name, email: '', phone: '', tags: [] };
      let notes: any[] = [];
      try {
        if (opportunity.contactId) {
          contact = await ghlClient.getContact(opportunity.contactId);
          notes = await ghlClient.getContactNotes(opportunity.contactId);
        }
      } catch (e) {}

      // Run AI Sentiment Engine Analysis
      const analysis = await aiEngine.analyzeOpportunity(opportunity, contact, notes);

      // Save analysis to internal store for dashboard live sync
      dealAnalysisStore.set(opportunity.id, analysis);

      // Sync back to GoHighLevel (Add AI Note + Tags) safely
      if (opportunity.contactId) {
        try {
          const aiNoteBody = `[AI COPILOT INSIGHTS]
Health Score: ${analysis.dealHealthScore}/100 (${analysis.sentimentCategory})
Close Prob: ${analysis.estimatedCloseProbability}% | Churn Risk: ${analysis.churnRiskScore}%
Summary: ${analysis.aiSummary}
Recommended Action: ${analysis.recommendedAction}
Buying Signals: ${analysis.buyingSignalsDetected.join(', ') || 'None detected'}
Objections: ${analysis.keyObjectionsDetected.join(', ') || 'None detected'}
Timestamp: ${analysis.analyzedAt}`;

          await ghlClient.addNote(opportunity.contactId, aiNoteBody);
          if (analysis.suggestedGHLTagsToAdd.length > 0) {
            await ghlClient.addTag(opportunity.contactId, analysis.suggestedGHLTagsToAdd);
          }
        } catch (e) {}
      }

      return analysis;
    } catch (error: any) {
      console.error('Pipeline process error:', error.message);
      throw error;
    }
  }
}

export const handleGHLWebhook = async (req: Request, res: Response) => {
  const { type, opportunityId, locationId } = req.body;

  // Validate webhook payload
  if (!isValidId(opportunityId)) {
    res.status(400).json({ status: 'error', error: 'Invalid or missing opportunityId.' });
    return;
  }

  console.log(`[GHL WEBHOOK INBOUND] Type: ${type}, OpportunityId: ${opportunityId}`);

  // Immediate response to GHL webhook caller
  res.status(200).json({ status: 'received', timestamp: new Date().toISOString() });

  // Async background processing
  try {
    const locId = isValidId(locationId) ? locationId : config.ghl.locationId;
    await PipelineManager.processOpportunityEvent(opportunityId, locId);
  } catch (err: any) {
    console.error('Webhook async processing failed:', err.message);
  }
};
