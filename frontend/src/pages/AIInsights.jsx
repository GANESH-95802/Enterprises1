import { useState } from 'react';
import { aiAPI } from '../services/api';
import { FiCpu, FiTrendingUp, FiFileText, FiHeart, FiImage, FiAward, FiStar } from 'react-icons/fi';
import toast from 'react-hot-toast';

const aiFeatures = [
  { key: 'predictSales', label: 'Sales Prediction', icon: FiTrendingUp, color: '#dbeafe', iconColor: '#2563eb', desc: 'Predict future sales based on historical data' },
  { key: 'generateDocument', label: 'Document Generator', icon: FiFileText, color: '#d1fae5', iconColor: '#10b981', desc: 'Generate professional documents with AI' },
  { key: 'explainMedical', label: 'Medical Explainer', icon: FiHeart, color: '#fee2e2', iconColor: '#ef4444', desc: 'Get plain-language medical report explanations' },
  { key: 'analyzeImage', label: 'Image Analysis', icon: FiImage, color: '#fef3c7', iconColor: '#f59e0b', desc: 'Analyze images with computer vision' },
  { key: 'evaluateSkill', label: 'Skill Evaluation', icon: FiAward, color: '#f3e8ff', iconColor: '#8b5cf6', desc: 'Get AI-powered skill assessments' },
  { key: 'recommendations', label: 'AI Recommendations', icon: FiStar, color: '#fce7f3', iconColor: '#ec4899', desc: 'Personalized learning and career recommendations' },
];

export default function AIInsights() {
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [inputData, setInputData] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!inputData.trim()) {
      toast.error('Please enter some data');
      return;
    }
    try {
      setLoading(true);
      setResult(null);
      let data;
      const parsed = tryParseJSON(inputData);
      
      switch (selectedFeature) {
        case 'predictSales':
          data = await aiAPI.predictSales({ salesHistory: parsed || [{ date: new Date().toISOString(), quantity: 100, revenue: 5000 }] });
          break;
        case 'generateDocument':
          data = await aiAPI.generateDocument({ type: 'report', data: parsed || { content: inputData } });
          break;
        case 'explainMedical':
          data = await aiAPI.explainMedical({ reportData: parsed || { findings: inputData } });
          break;
        case 'analyzeImage':
          data = await aiAPI.analyzeImage({ image: btoa(inputData), mimeType: 'image/jpeg' });
          break;
        case 'evaluateSkill':
          data = await aiAPI.evaluateSkill({ skillData: parsed || { name: inputData, yearsOfExperience: 3 } });
          break;
        case 'recommendations':
          data = await aiAPI.getRecommendations({ userData: parsed || { skills: [inputData], interests: ['technology'] } });
          break;
      }
      setResult(data.data?.data || data.data);
      toast.success('Analysis complete!');
    } catch (err) {
      toast.error('AI analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="section-header">
        <div>
          <h1>AI Insights</h1>
          <p>Leverage AI for business intelligence and automation</p>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 24 }}>
        {aiFeatures.map((feature) => (
          <div
            key={feature.key}
            className={`card ${selectedFeature === feature.key ? 'card-selected' : ''}`}
            style={{ cursor: 'pointer', border: selectedFeature === feature.key ? '2px solid var(--primary)' : '' }}
            onClick={() => { setSelectedFeature(feature.key); setResult(null); setInputData(''); }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div className="stat-icon" style={{ background: feature.color }}>
                <feature.icon color={feature.iconColor} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600 }}>{feature.label}</h3>
                <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>{feature.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedFeature && (
        <div className="card">
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
            {aiFeatures.find(f => f.key === selectedFeature)?.label}
          </h3>
          <div className="form-group">
            <label className="form-label">Input Data (JSON text or plain text)</label>
            <textarea
              className="form-textarea"
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              placeholder="Enter your data here for AI analysis..."
              rows={5}
            />
          </div>
          <button className="btn btn-primary" onClick={handleAnalyze} disabled={loading}>
            <FiCpu /> {loading ? 'Analyzing...' : 'Run AI Analysis'}
          </button>

          {loading && <div className="loading-spinner"><div className="spinner" /></div>}

          {result && (
            <div style={{ marginTop: 24 }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--gray-600)' }}>AI Result:</h4>
              <pre style={{ background: 'var(--gray-50)', padding: 16, borderRadius: 8, fontSize: 13, overflow: 'auto', maxHeight: 400, whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function tryParseJSON(str) {
  try { return JSON.parse(str); } catch { return null; }
}