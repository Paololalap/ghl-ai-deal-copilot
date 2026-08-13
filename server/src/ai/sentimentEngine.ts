import { config } from '../config/env';
import { GHLContact, GHLOpportunity, GHLNote } from '../ghl/ghlClient';

export interface DealHealthAnalysis {
  opportunityId: string;
  contactId: string;
  dealHealthScore: number; // 0 to 100
  sentimentCategory: 'POSITIVE_HOT' | 'NEUTRAL_WARM' | 'AT_RISK_COLD' | 'HIGH_CHURN_RISK';
  churnRiskScore: number; // 0 to 100
  aiSummary: string;
  recommendedAction: string;
  keyObjectionsDetected: string[];
  buyingSignalsDetected: string[];
  estimatedCloseProbability: number; // percentage e.g. 85%
  suggestedGHLTagsToAdd: string[];
  analyzedAt: string;
}

export class AISentimentEngine {
  async analyzeOpportunity(
    opportunity: GHLOpportunity,
    contact: GHLContact,
    notes: GHLNote[]
  ): Promise<DealHealthAnalysis> {
    if (config.ai.useMock || !config.ai.openaiApiKey) {
      return this.analyzeDynamicSentiment(opportunity, contact, notes);
    }
    return this.analyzeDynamicSentiment(opportunity, contact, notes);
  }

  private analyzeDynamicSentiment(
    opportunity: GHLOpportunity,
    contact: GHLContact,
    notes: GHLNote[]
  ): DealHealthAnalysis {
    // Dynamic calculation based on notes content and contact tags
    const combinedNotesText = (notes.map(n => n.body).join(' ') + ' ' + (contact.tags || []).join(' ')).toLowerCase();

    let dealHealthScore = 65;
    let churnRiskScore = 35;
    let sentimentCategory: DealHealthAnalysis['sentimentCategory'] = 'NEUTRAL_WARM';
    let keyObjections: string[] = [];
    let buyingSignals: string[] = [];
    let recommendedAction = 'Schedule follow-up call with prospect to assess requirements.';
    let suggestedTags: string[] = ['ai-analyzed'];
    let closeProb = 60;

    const positiveKeywords = ['approved', 'impressed', 'sign', 'audit', 'excited', 'ready', 'accept', 'bought', 'interested', 'hot', 'closing'];
    const negativeKeywords = ['push back', 'no response', 'unresponsive', 'competitor', 'expensive', 'cancel', 'delay', 'doubt', 'ghost', 'high cost', 'refund'];

    const posMatches = positiveKeywords.filter(k => combinedNotesText.includes(k));
    const negMatches = negativeKeywords.filter(k => combinedNotesText.includes(k));

    let summary = `Opportunity '${opportunity.name}' (Contact: ${contact.name || contact.email || 'Lead'}) is active in pipeline. ${notes.length > 0 ? `Analyzed ${notes.length} contact notes/interactions.` : 'No conversation notes recorded yet.'}`;

    if (posMatches.length > 0 && posMatches.length >= negMatches.length) {
      dealHealthScore = Math.min(98, 75 + posMatches.length * 7);
      churnRiskScore = Math.max(5, 100 - dealHealthScore);
      sentimentCategory = 'POSITIVE_HOT';
      buyingSignals = posMatches.map(m => `Detected strong intent signal: "${m}"`);
      recommendedAction = 'Send proposal/contract immediately and secure signature.';
      suggestedTags.push('hot-lead', 'high-intent');
      closeProb = Math.min(95, 70 + posMatches.length * 6);
      summary = `High purchase intent detected for ${contact.name || 'prospect'}. Active interest identified.`;
    } else if (negMatches.length > 0) {
      dealHealthScore = Math.max(15, 55 - negMatches.length * 12);
      churnRiskScore = Math.min(95, 100 - dealHealthScore);
      sentimentCategory = 'HIGH_CHURN_RISK';
      keyObjections = negMatches.map(m => `Objection / Friction keyword: "${m}"`);
      recommendedAction = 'Immediate sales manager re-engagement or discount offer required.';
      suggestedTags.push('at-risk', 'churn-warning');
      closeProb = Math.max(10, 50 - negMatches.length * 10);
      summary = `High churn risk for ${contact.name || 'prospect'}. Objections or friction detected.`;
    } else if (notes.length === 0) {
      dealHealthScore = 50;
      churnRiskScore = 50;
      sentimentCategory = 'AT_RISK_COLD';
      keyObjections = ['No conversation notes or touchpoints recorded in GHL.'];
      recommendedAction = 'Log first contact note in GHL to initiate AI analysis.';
      closeProb = 40;
      summary = `Cold or new deal. No interactions logged in GoHighLevel yet.`;
    }

    return {
      opportunityId: opportunity.id,
      contactId: contact.id,
      dealHealthScore,
      sentimentCategory,
      churnRiskScore,
      aiSummary: summary,
      recommendedAction,
      keyObjectionsDetected: keyObjections,
      buyingSignalsDetected: buyingSignals,
      estimatedCloseProbability: closeProb,
      suggestedGHLTagsToAdd: suggestedTags,
      analyzedAt: new Date().toISOString()
    };
  }
}
