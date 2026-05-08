import { useState, useEffect } from 'react'
import './App.css'

interface User {
  id: number;
  nickname: string;
  tag: string;
  score: number;
  max_score: number;
  tier: string;
  rank: string;
  max_tier: string;
  max_rank: string;
}

type Tab = 'local' | 'global' | 'update';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('local');
  const [localRankings, setLocalRankings] = useState<User[]>([]);
  const [globalRankings, setGlobalRankings] = useState<User[]>([]);
  const [nickname, setNickname] = useState('');
  const [tag, setTag] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = 'http://localhost:8000';

  const fetchLocalRankings = async () => {
    try {
      const response = await fetch(`${API_URL}/rankings`);
      if (response.ok) {
        const data = await response.json();
        setLocalRankings(data);
      }
    } catch (error) {
      console.error('Failed to fetch local rankings:', error);
    }
  };

  const fetchGlobalRankings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/global-rankings`);
      if (response.ok) {
        const data = await response.json();
        setGlobalRankings(data);
      }
    } catch (error) {
      console.error('Failed to fetch global rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'local') {
      fetchLocalRankings();
    } else if (activeTab === 'global') {
      fetchGlobalRankings();
    }
  }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname || !tag) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nickname,
          tag,
        }),
      });

      if (response.ok) {
        setNickname('');
        setTag('');
        await fetchLocalRankings();
        setActiveTab('local'); // Switch to local leaderboard after update
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.detail || 'Failed to register user'}`);
      }
    } catch (error) {
      console.error('Failed to register user:', error);
      alert('Failed to connect to backend.');
    } finally {
      setLoading(false);
    }
  };

  const renderRankingTable = (data: User[], isGlobal: boolean) => (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Summoner</th>
            <th>Tier</th>
            <th>Current LP</th>
            {!isGlobal && <th>Season High</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((user, index) => (
            <tr key={`${isGlobal ? 'global' : 'local'}-${index}`}>
              <td className={`rank-cell ${index < 3 ? 'top-rank' : ''}`}>
                {index + 1}
              </td>
              <td className="player-cell">
                <span className="nickname">{user.nickname}</span>
                {user.tag && <span className="tag">#{user.tag}</span>}
              </td>
              <td className={`tier-cell tier-${user.tier}`}>
                {user.tier !== 'UNKNOWN' ? `${user.tier} ${user.rank}` : 'Unranked'}
              </td>
              <td className="score-cell">{user.score} LP</td>
              {!isGlobal && (
                <td className="max-score-cell">
                  <span className={`tier-${user.max_tier}`}>{user.max_tier} {user.max_rank}</span>
                  <span className="max-lp"> {user.max_score} LP</span>
                </td>
              )}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={isGlobal ? 4 : 5} className="empty-state">
                {loading ? 'Fetching rankings...' : 'No rankings found.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="container">
      <header>
        <h1>LoL Rankings</h1>
        <p>Track the ladder. Prove your worth.</p>
      </header>

      <nav className="tab-nav">
        <button 
          className={activeTab === 'local' ? 'active' : ''} 
          onClick={() => setActiveTab('local')}
        >
          Local Ranking
        </button>
        <button 
          className={activeTab === 'global' ? 'active' : ''} 
          onClick={() => setActiveTab('global')}
        >
          KR Top 50
        </button>
        <button 
          className={activeTab === 'update' ? 'active' : ''} 
          onClick={() => setActiveTab('update')}
        >
          Update My Rank
        </button>
      </nav>
      
      {activeTab === 'update' && (
        <section className="registration animate-in">
          <h2>Update Summoner</h2>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="nickname">Riot ID</label>
              <input
                id="nickname"
                type="text"
                placeholder="e.g. Hide on bush"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="tag">Tagline</label>
              <input
                id="tag"
                type="text"
                placeholder="e.g. KR1"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Scouting...' : 'Search'}
            </button>
          </form>
        </section>
      )}

      {activeTab === 'local' && (
        <section className="rankings animate-in">
          <h2>Local Leaderboard</h2>
          {renderRankingTable(localRankings, false)}
        </section>
      )}

      {activeTab === 'global' && (
        <section className="rankings animate-in">
          <h2>KR Server Top 50</h2>
          {renderRankingTable(globalRankings, true)}
        </section>
      )}
    </div>
  )
}

export default App
