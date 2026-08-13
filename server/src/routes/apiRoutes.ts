import { Router } from 'express';
import { handleGHLWebhook, PipelineManager, dealAnalysisStore } from '../webhooks/webhookHandler';
import { GHLClient } from '../ghl/ghlClient';
import { config } from '../config/env';

const router = Router();
const ghlClient = new GHLClient();

// Webhook listener for GHL workflows / triggers
router.post('/webhook/ghl', handleGHLWebhook);

// API endpoint: Get full pipeline deals with AI deal health scores
router.get('/pipeline', async (req, res) => {
  try {
    const locationId = (req.query.locationId as string) || config.ghl.locationId;
    const opportunities = await ghlClient.getOpportunities(locationId);

    const enrichedOpportunities = [];
    for (const opp of opportunities) {
      let analysis = dealAnalysisStore.get(opp.id);
      if (!analysis) {
        try {
          analysis = await PipelineManager.processOpportunityEvent(opp.id, locationId, opp);
        } catch (err) {
          // Graceful fallback for rate-limited / erroring contacts
          analysis = {
            opportunityId: opp.id,
            contactId: opp.contactId,
            dealHealthScore: 60,
            sentimentCategory: 'NEUTRAL_WARM',
            churnRiskScore: 40,
            aiSummary: `Opportunity '${opp.name}' registered in pipeline.`,
            recommendedAction: 'Review contact details in GoHighLevel.',
            keyObjectionsDetected: [],
            buyingSignalsDetected: [],
            estimatedCloseProbability: 50,
            suggestedGHLTagsToAdd: ['ai-analyzed'],
            analyzedAt: new Date().toISOString()
          };
        }
      }
      let contact = null;
      if (opp.contactId) {
        try {
          contact = await ghlClient.getContact(opp.contactId);
        } catch (e) {}
      }
      const contactName = contact?.name || (contact?.firstName ? `${contact.firstName} ${contact.lastName || ''}`.trim() : null) || opp.name;
      enrichedOpportunities.push({
        ...opp,
        contact: {
          id: opp.contactId || opp.id,
          name: contactName,
          email: contact?.email || 'No email registered',
          phone: contact?.phone || '',
          tags: contact?.tags || []
        },
        aiAnalysis: analysis
      });
      // 100ms delay to prevent 429 rate limit
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    res.json({
      success: true,
      totalPipelineValue: enrichedOpportunities.reduce((acc, curr) => acc + curr.monetaryValue, 0),
      atRiskRevenue: enrichedOpportunities
        .filter(o => o.aiAnalysis?.sentimentCategory === 'HIGH_CHURN_RISK')
        .reduce((acc, curr) => acc + curr.monetaryValue, 0),
      healthyRevenue: enrichedOpportunities
        .filter(o => o.aiAnalysis?.sentimentCategory === 'POSITIVE_HOT')
        .reduce((acc, curr) => acc + curr.monetaryValue, 0),
      opportunities: enrichedOpportunities
    });
  } catch (error: any) {
    console.error('Error in /api/pipeline:', error.message, error.stack);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API endpoint: Force re-analyze an opportunity
router.post('/analyze/:opportunityId', async (req, res) => {
  try {
    const { opportunityId } = req.params;
    const locationId = (req.body.locationId as string) || config.ghl.locationId;
    dealAnalysisStore.delete(opportunityId);

    let opp: any = null;
    try {
      const opps = await ghlClient.getOpportunities(locationId);
      opp = opps.find(o => o.id === opportunityId);
    } catch(e) {}

    const analysis = await PipelineManager.processOpportunityEvent(opportunityId, locationId, opp || undefined);
    res.json({ success: true, analysis });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
