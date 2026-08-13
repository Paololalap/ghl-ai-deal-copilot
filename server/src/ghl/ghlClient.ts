import axios, { AxiosInstance } from 'axios';
import { config } from '../config/env';

export interface GHLContact {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  tags?: string[];
  customFields?: Array<{ id: string; value: any }>;
  dateAdded?: string;
}

export interface GHLOpportunity {
  id: string;
  name: string;
  pipelineId: string;
  pipelineStageId: string;
  status: 'open' | 'won' | 'lost' | 'abandoned';
  monetaryValue: number;
  contactId: string;
  locationId: string;
  customFields?: Array<{ id: string; value: any }>;
  createdAt?: string;
}

export interface GHLNote {
  id: string;
  body: string;
  contactId: string;
  dateAdded: string;
}

export interface GHLMessage {
  id: string;
  body: string;
  direction: 'inbound' | 'outbound';
  type: string;
  dateAdded: string;
  contactId: string;
}

export class GHLClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.ghl.baseUrl,
      headers: {
        'Authorization': `Bearer ${process.env.GHL_API_KEY || config.ghl.apiKey}`,
        'Version': config.ghl.apiVersion,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  }

  // Get Contact Details
  async getContact(contactId: string): Promise<GHLContact> {
    if (config.mockGHL) {
      return this.getMockContact(contactId);
    }
    try {
      const response = await this.client.get(`/contacts/${contactId}`);
      const c = response.data.contact;
      let name = c.name;
      if (!name || name === '') {
        if (c.firstName || c.lastName) {
          name = `${c.firstName || ''} ${c.lastName || ''}`.trim();
        } else if (c.email) {
          name = c.email.split('@')[0];
        } else {
          name = 'Contact ' + contactId;
        }
      }
      return {
        ...c,
        name
      };
    } catch (err) {
      return {
        id: contactId,
        name: 'Contact ' + contactId,
        email: 'no-email@ghl.com',
        phone: '',
        tags: []
      };
    }
  }

  // Get Opportunities in Location
  async getOpportunities(locationId: string): Promise<GHLOpportunity[]> {
    if (config.mockGHL) {
      return this.getMockOpportunities(locationId);
    }
    // Fetch pipelines first
    let allOpps: any[] = [];
    try {
      const res = await this.client.get(`/opportunities/search`, {
        params: { location_id: locationId, limit: 100 }
      });
      if (res.data.opportunities) {
        allOpps = res.data.opportunities;
      }
    } catch (e) {
      try {
        const pipeRes = await this.client.get(`/opportunities/pipelines`, {
          params: { locationId }
        });
        const pipelines = pipeRes.data.pipelines || [];
        for (const p of pipelines) {
          const res = await this.client.get(`/opportunities/search`, {
            params: { location_id: locationId, pipeline_id: p.id, limit: 100 }
          });
          if (res.data.opportunities) {
            allOpps = allOpps.concat(res.data.opportunities);
          }
        }
      } catch (err) {}
    }

    return allOpps.map((o: any) => {
      let cId = o.contactId;
      if (!cId && o.contact && o.contact.id) cId = o.contact.id;
      if (!cId && o.relations && o.relations.length > 0) {
        const contactRel = o.relations.find((r: any) => r.objectKey === 'contact' || r.associationId === 'OPPORTUNITIES_CONTACTS_ASSOCIATION');
        if (contactRel) cId = contactRel.recordId;
      }
      return {
        id: o.id,
        name: o.name || 'Unnamed Deal',
        pipelineId: o.pipelineId,
        pipelineStageId: o.pipelineStageId,
        status: o.status || 'open',
        monetaryValue: o.monetaryValue || 0,
        contactId: cId || '',
        locationId: o.locationId,
        createdAt: o.createdAt
      };
    });
  }

  // Get Contact Notes / Conversations for sentiment analysis
  async getContactNotes(contactId: string): Promise<GHLNote[]> {
    if (config.mockGHL) {
      return this.getMockNotes(contactId);
    }
    try {
      const response = await this.client.get(`/contacts/${contactId}/notes`);
      return response.data.notes || [];
    } catch (err) {
      return [];
    }
  }

  // Update Opportunity Custom Fields / Status
  async updateOpportunity(
    opportunityId: string,
    data: Partial<GHLOpportunity> & { customFields?: Array<{ id: string; value: any }> }
  ): Promise<GHLOpportunity> {
    if (process.env.USE_MOCK_GHL === 'true') {
      return { id: opportunityId, ...data } as GHLOpportunity;
    }
    const response = await this.client.put(`/opportunities/${opportunityId}`, data);
    return response.data.opportunity;
  }

  // Create Note on Contact with AI Copilot Insights
  async addNote(contactId: string, noteBody: string): Promise<GHLNote> {
    if (process.env.USE_MOCK_GHL === 'true') {
      return {
        id: `note_${Date.now()}`,
        body: noteBody,
        contactId,
        dateAdded: new Date().toISOString()
      };
    }
    const response = await this.client.post(`/contacts/${contactId}/notes`, {
      body: noteBody
    });
    return response.data.note;
  }

  // Add Tag to Contact
  async addTag(contactId: string, tags: string[]): Promise<void> {
    if (process.env.USE_MOCK_GHL === 'true') return;
    await this.client.post(`/contacts/${contactId}/tags`, { tags });
  }

  // MOCK DATA GENERATORS FOR PORTFOLIO DEMO / OFFLINE TESTING
  private getMockContact(contactId: string): GHLContact {
    const mockContacts: Record<string, GHLContact> = {
      'c1': {
        id: 'c1',
        name: 'Sarah Jenkins',
        firstName: 'Sarah',
        lastName: 'Jenkins',
        email: 's.jenkins@acmecorp.com',
        phone: '+1 (555) 234-5678',
        tags: ['high-intent', 'enterprise'],
        dateAdded: new Date(Date.now() - 86400000 * 5).toISOString()
      },
      'c2': {
        id: 'c2',
        name: 'Marcus Vance',
        firstName: 'Marcus',
        lastName: 'Vance',
        email: 'marcus@nexustech.io',
        phone: '+1 (555) 876-5432',
        tags: ['pricing-inquiry', 'ghosting-risk'],
        dateAdded: new Date(Date.now() - 86400000 * 12).toISOString()
      },
      'c3': {
        id: 'c3',
        name: 'Elena Rostova',
        firstName: 'Elena',
        lastName: 'Rostova',
        email: 'elena@biopure.org',
        phone: '+1 (555) 432-1098',
        tags: ['decision-maker', 'demo-completed'],
        dateAdded: new Date(Date.now() - 86400000 * 2).toISOString()
      }
    };
    return mockContacts[contactId] || {
      id: contactId,
      name: 'Alex Mercer',
      email: 'alex@startup.co',
      phone: '+1 (555) 999-0000',
      tags: ['lead'],
      dateAdded: new Date().toISOString()
    };
  }

  private getMockOpportunities(locationId: string): GHLOpportunity[] {
    return [
      {
        id: 'opp_101',
        name: 'Acme Corp Enterprise SaaS License',
        pipelineId: 'pipe_sales_v2',
        pipelineStageId: 'stage_proposal',
        status: 'open',
        monetaryValue: 48000,
        contactId: 'c1',
        locationId,
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
      },
      {
        id: 'opp_102',
        name: 'NexusTech Custom Automation Work',
        pipelineId: 'pipe_sales_v2',
        pipelineStageId: 'stage_negotiation',
        status: 'open',
        monetaryValue: 18500,
        contactId: 'c2',
        locationId,
        createdAt: new Date(Date.now() - 86400000 * 12).toISOString()
      },
      {
        id: 'opp_103',
        name: 'BioPure Annual Support Retainer',
        pipelineId: 'pipe_sales_v2',
        pipelineStageId: 'stage_demo',
        status: 'open',
        monetaryValue: 24000,
        contactId: 'c3',
        locationId,
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
      }
    ];
  }

  private getMockNotes(contactId: string): GHLNote[] {
    const mockNotesMap: Record<string, GHLNote[]> = {
      'c1': [
        {
          id: 'n1',
          contactId: 'c1',
          dateAdded: new Date(Date.now() - 86400000 * 4).toISOString(),
          body: 'Call transcript: Sarah was extremely impressed by the security compliance features. Mentioned budget is approved for Q3 and wants to sign agreement by Friday.'
        },
        {
          id: 'n2',
          contactId: 'c1',
          dateAdded: new Date(Date.now() - 86400000 * 1).toISOString(),
          body: 'Email reply: Asked for final redline contract updates and implementation timeline.'
        }
      ],
      'c2': [
        {
          id: 'n3',
          contactId: 'c2',
          dateAdded: new Date(Date.now() - 86400000 * 10).toISOString(),
          body: 'Demo went okay, but Marcus pushed back hard on per-seat pricing. Claimed competitor X offers flat rate.'
        },
        {
          id: 'n4',
          contactId: 'c2',
          dateAdded: new Date(Date.now() - 86400000 * 6).toISOString(),
          body: 'Followed up 3 times. No response to phone call or email regarding updated proposal.'
        }
      ],
      'c3': [
        {
          id: 'n5',
          contactId: 'c3',
          dateAdded: new Date(Date.now() - 86400000 * 2).toISOString(),
          body: 'Initial discovery call: Elena needs HIPAA compliant automation. High urgency due to audit coming up next month.'
        }
      ]
    };
    return mockNotesMap[contactId] || [
      {
        id: 'n_default',
        contactId,
        dateAdded: new Date().toISOString(),
        body: 'Lead registered through web form. Requested pricing brochure.'
      }
    ];
  }
}
