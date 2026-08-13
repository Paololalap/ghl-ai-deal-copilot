import { useState, useEffect } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Activity,
  DollarSign,
  UserCheck,
  RefreshCw,
  Zap,
  ArrowUpRight,
  ShieldAlert,
  Sparkles,
  Bot,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';

interface Deal {
  id: string;
  name: string;
  monetaryValue: number;
  status: string;
  contact: {
    id: string;
    name: string;
    email: string;
    phone: string;
    tags: string[];
  };
  aiAnalysis: {
    dealHealthScore: number;
    sentimentCategory: 'POSITIVE_HOT' | 'NEUTRAL_WARM' | 'AT_RISK_COLD' | 'HIGH_CHURN_RISK';
    churnRiskScore: number;
    aiSummary: string;
    recommendedAction: string;
    keyObjectionsDetected: string[];
    buyingSignalsDetected: string[];
    estimatedCloseProbability: number;
    suggestedGHLTagsToAdd: string[];
    analyzedAt: string;
  };
}

interface ApiResponse {
  success: boolean;
  totalPipelineValue: number;
  atRiskRevenue: number;
  healthyRevenue: number;
  opportunities: Deal[];
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export default function App() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const fetchPipeline = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/pipeline`);
      const json: ApiResponse = await res.json();
      if (json && json.success && Array.isArray(json.opportunities)) {
        setData(json);
        if (json.opportunities.length > 0) {
          setSelectedDeal(json.opportunities[0]);
        }
      } else {
        console.error('API Error:', json);
      }
    } catch (err) {
      console.error('Error fetching pipeline data:', err);
    } finally {
      setLoading(false);
    }
  };

  const reAnalyzeDeal = async (oppId: string) => {
    setAnalyzingId(oppId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/analyze/${oppId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const result = await res.json();
      if (result.success) {
        await fetchPipeline();
      }
    } catch (err) {
      console.error('Error re-analyzing deal:', err);
    } finally {
      setAnalyzingId(null);
    }
  };

  useEffect(() => {
    fetchPipeline();
  }, []);

  const getSentimentBadge = (cat: string) => {
    switch (cat) {
      case 'POSITIVE_HOT':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Sparkles className="w-3 h-3 mr-1" /> POSITIVE / HOT
          </span>
        );
      case 'HIGH_CHURN_RISK':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ShieldAlert className="w-3 h-3 mr-1" /> HIGH CHURN RISK
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Activity className="w-3 h-3 mr-1" /> NEUTRAL / WARM
          </span>
        );
    }
  };

  const totalPages = Math.ceil((data?.opportunities?.length || 0) / itemsPerPage);
  const paginatedOpportunities = data?.opportunities?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  ) || [];

  const chartData = data?.opportunities?.map(opp => ({
    name: (opp.contact?.name || opp.name || 'Deal').split(' ')[0],
    health: opp.aiAnalysis?.dealHealthScore || 50,
    churn: opp.aiAnalysis?.churnRiskScore || 20,
    value: opp.monetaryValue || 0
  })) || [];

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 p-6">
      {/* Header */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between pb-6 mb-8 border-b border-gray-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600/20 rounded-lg border border-indigo-500/30 text-indigo-400">
              <Bot className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              GHL AI Revenue & Lead Sentiment Copilot
            </h1>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Real-time Deal Health Scoring & Churn Prevention Engine powered by GHL API v2
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            GHL API v2 Connected
          </span>
          <button
            onClick={fetchPipeline}
            disabled={loading}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium px-4 py-2 rounded-lg border border-gray-700 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Pipeline
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-8">
        {/* KPI Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-6 relative overflow-hidden backdrop-blur-sm">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-semibold tracking-wider uppercase">Total Pipeline Value</span>
              <DollarSign className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">
              ${data?.totalPipelineValue ? data.totalPipelineValue.toLocaleString() : '0'}
            </div>
            <p className="text-xs text-gray-500 mt-2">Active opportunities synchronized from GHL API v2</p>
          </div>

          <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-6 relative overflow-hidden backdrop-blur-sm">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-semibold tracking-wider uppercase">Healthy Revenue (Hot Leads)</span>
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold text-emerald-400">
              ${data?.healthyRevenue ? data.healthyRevenue.toLocaleString() : '0'}
            </div>
            <p className="text-xs text-emerald-500/80 mt-2 font-medium">
              High closing probability detected by AI Copilot
            </p>
          </div>

          <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-6 relative overflow-hidden backdrop-blur-sm">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-semibold tracking-wider uppercase">At-Risk Revenue (Action Required)</span>
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            </div>
            <div className="text-3xl font-extrabold text-rose-400">
              ${data?.atRiskRevenue ? data.atRiskRevenue.toLocaleString() : '0'}
            </div>
            <p className="text-xs text-rose-500/80 mt-2 font-medium">
              Requires immediate executive or sales strategy intervention
            </p>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Opportunities List */}
          <div className="lg:col-span-5 bg-gray-900/60 border border-gray-800 rounded-xl p-6 backdrop-blur-sm flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2 pb-3 border-b border-gray-800/60">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-indigo-400" />
                    Opportunity Pipeline
                  </h2>
                  <span className="text-xs text-gray-400">
                    {data?.opportunities?.length || 0} Deals Analyzed • Page {currentPage} of {totalPages}
                  </span>
                </div>

                {/* Top Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-200 rounded border border-gray-700 transition flex items-center gap-1 text-xs"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Prev
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-200 rounded border border-gray-700 transition flex items-center gap-1 text-xs"
                    >
                      Next <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4 min-h-[440px]">
                {paginatedOpportunities.map((opp) => {
                  const isSelected = selectedDeal?.id === opp.id;
                  const isAnalyzing = analyzingId === opp.id;

                  return (
                    <div
                      key={opp.id}
                      onClick={() => setSelectedDeal(opp)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'bg-indigo-950/40 border-indigo-500/50 shadow-lg shadow-indigo-950/30'
                          : 'bg-gray-800/40 border-gray-800 hover:border-gray-700 hover:bg-gray-800/70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="font-bold text-white text-sm">{opp.name}</h3>
                          <p className="text-xs text-gray-400">{opp.contact?.name || 'Contact'} • {opp.contact?.email || 'N/A'}</p>
                        </div>
                        <span className="text-sm font-bold text-indigo-300">
                          ${opp.monetaryValue ? opp.monetaryValue.toLocaleString() : '0'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800/60">
                        {getSentimentBadge(opp.aiAnalysis.sentimentCategory)}
                        
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-xs text-gray-400 block">Health Score</span>
                            <span className={`text-xs font-extrabold ${
                              opp.aiAnalysis?.dealHealthScore > 75 ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                              {opp.aiAnalysis?.dealHealthScore || 50}/100
                            </span>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              reAnalyzeDeal(opp.id);
                            }}
                            disabled={isAnalyzing}
                            className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded border border-gray-700 transition"
                            title="Re-run AI Analysis"
                          >
                            <Zap className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-bounce text-amber-400' : ''}`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Health Score Overview Chart */}
            <div className="mt-8 pt-6 border-t border-gray-800">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
                Deal Health Index Distribution
              </h3>
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={11} />
                    <YAxis domain={[0, 100]} stroke="#6b7280" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px' }}
                    />
                    <Bar dataKey="health" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.health > 70 ? '#10b981' : entry.health > 50 ? '#f59e0b' : '#f43f5e'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* AI Copilot Deep Insight Panel */}
          <div className="lg:col-span-7 bg-gray-900/60 border border-gray-800 rounded-xl p-6 backdrop-blur-sm">
            {selectedDeal ? (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-800 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        OPPORTUNITY ID: {selectedDeal.id}
                      </span>
                      {getSentimentBadge(selectedDeal.aiAnalysis.sentimentCategory)}
                    </div>
                    <h2 className="text-xl font-extrabold text-white">{selectedDeal.name}</h2>
                    <p className="text-xs text-gray-400 mt-1">
                      Client Contact: <span className="text-gray-200 font-medium">{selectedDeal.contact.name}</span> ({selectedDeal.contact.email})
                    </p>
                  </div>

                  <div className="flex items-center gap-4 bg-gray-800/60 p-3 rounded-xl border border-gray-800">
                    <div className="text-center px-2">
                      <span className="text-[10px] uppercase font-semibold text-gray-400 block">Close Prob</span>
                      <span className="text-lg font-bold text-emerald-400">{selectedDeal.aiAnalysis.estimatedCloseProbability}%</span>
                    </div>
                    <div className="h-8 w-px bg-gray-700"></div>
                    <div className="text-center px-2">
                      <span className="text-[10px] uppercase font-semibold text-gray-400 block">Churn Risk</span>
                      <span className="text-lg font-bold text-rose-400">{selectedDeal.aiAnalysis.churnRiskScore}%</span>
                    </div>
                  </div>
                </div>

                {/* AI Executive Summary */}
                <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-xl p-5">
                  <h3 className="text-sm font-bold text-indigo-300 flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    AI Executive Summary
                  </h3>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {selectedDeal.aiAnalysis.aiSummary}
                  </p>
                </div>

                {/* Recommended Immediate Action */}
                <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-5">
                  <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Recommended Next Action
                  </h3>
                  <p className="text-sm text-emerald-200 font-medium">
                    {selectedDeal.aiAnalysis.recommendedAction}
                  </p>
                </div>

                {/* Buying Signals vs Objections Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Buying Signals */}
                  <div className="bg-gray-800/40 border border-gray-800 rounded-xl p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-3">
                      <ArrowUpRight className="w-4 h-4" /> Detected Buying Signals
                    </h4>
                    {selectedDeal.aiAnalysis.buyingSignalsDetected.length > 0 ? (
                      <ul className="space-y-2">
                        {selectedDeal.aiAnalysis.buyingSignalsDetected.map((signal, idx) => (
                          <li key={idx} className="text-xs text-gray-300 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0"></span>
                            {signal}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-500 italic">No strong buying signals detected yet.</p>
                    )}
                  </div>

                  {/* Objections */}
                  <div className="bg-gray-800/40 border border-gray-800 rounded-xl p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5 mb-3">
                      <AlertTriangle className="w-4 h-4" /> Detected Objections & Friction
                    </h4>
                    {selectedDeal.aiAnalysis.keyObjectionsDetected.length > 0 ? (
                      <ul className="space-y-2">
                        {selectedDeal.aiAnalysis.keyObjectionsDetected.map((obj, idx) => (
                          <li key={idx} className="text-xs text-gray-300 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0"></span>
                            {obj}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-500 italic">No major objections detected.</p>
                    )}
                  </div>
                </div>

                {/* GHL Automated Tags Synced */}
                <div className="pt-4 border-t border-gray-800">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Auto-Synced GHL Tags
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedDeal.aiAnalysis.suggestedGHLTagsToAdd.map((tag, i) => (
                      <span key={i} className="text-xs font-medium px-2.5 py-1 rounded bg-gray-800 text-indigo-300 border border-gray-700">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                Select an opportunity to view AI Copilot Insights
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
