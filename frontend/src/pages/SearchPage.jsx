import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { knowledgeService, assistantService, crudService } from '../services';
import { PageHeader, Card, Loading, Badge } from '../components/ui';
import { FiSearch, FiDatabase, FiFileText, FiBriefcase, FiUsers } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState({ knowledge: [], documents: [], reports: [] });
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const performSearch = async (searchTerm) => {
    if (!searchTerm.trim()) return;
    setSearching(true);
    setSearched(true);
    try {
      const [kbRes, diRes, reportsRes] = await Promise.allSettled([
        knowledgeService.search({ query: searchTerm.trim(), limit: 10 }),
        documentIntelligenceSearch(searchTerm),
        crudService('reports').getAll({ search: searchTerm.trim() }),
      ]);

      setResults({
        knowledge: kbRes.status === 'fulfilled' ? getItems(kbRes.value) : [],
        documents: diRes.status === 'fulfilled' ? diRes.value : [],
        reports: reportsRes.status === 'fulfilled' ? getItems(reportsRes.value) : [],
      });
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const documentIntelligenceSearch = async (term) => {
    try {
      const { documentIntelligenceService } = await import('../services');
      const res = await documentIntelligenceService.listDocuments({ search: term });
      return getItems(res);
    } catch {
      return [];
    }
  };

  const getItems = (res) => {
    const data = res.data?.data || res.data;
    return data?.results || data?.documents || data?.items || (Array.isArray(data) ? data : []);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSearchParams({ q: query });
    performSearch(query);
  };

  const renderResults = (items, Icon, emptyText) => (
    <div>
      {items.length === 0 ? (
        <div className="table-empty">{emptyText}</div>
      ) : (
        items.map((item, i) => (
          <div key={item._id || i} className="search-result-item">
            <Icon />
            <div>
              <strong>{item.title || item.name || item.filename || 'Result'}</strong>
              <p>{item.description || item.snippet || item.details || item.content?.slice(0, 200) || 'No details available'}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div>
      <PageHeader title="Search" subtitle="Search across your entire enterprise" />

      <Card style={{ marginBottom: 24 }}>
        <form className="search-bar" onSubmit={handleSubmit}>
          <FiSearch />
          <input
            type="text"
            className="form-input"
            placeholder="Search knowledge, documents, reports..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search"
          />
          <button type="submit" className="btn btn-primary" disabled={searching}>
            {searching ? 'Searching...' : 'Search'}
          </button>
        </form>
      </Card>

      {searched && (
        <>
          <div className="search-section" style={{ marginBottom: 24 }}>
            <h3 className="section-subtitle"><FiDatabase /> Knowledge Base</h3>
            <Card>
              {renderResults(results.knowledge, FiDatabase, 'No knowledge base results found')}
            </Card>
          </div>

          <div className="search-section" style={{ marginBottom: 24 }}>
            <h3 className="section-subtitle"><FiFileText /> Document Intelligence</h3>
            <Card>
              {renderResults(results.documents, FiFileText, 'No document results found')}
            </Card>
          </div>

          <div className="search-section">
            <h3 className="section-subtitle"><FiBriefcase /> Reports</h3>
            <Card>
              {renderResults(results.reports, FiBriefcase, 'No report results found')}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}