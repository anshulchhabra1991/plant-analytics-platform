const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:8000';

// Middleware
app.use(express.static('public'));
app.use(express.json());

// Authentication middleware
const getAuthHeaders = (req) => {
  const token = req.headers.authorization;
  return token ? { Authorization: token } : {};
};

// API proxy routes with authentication
app.get('/api/power-plants/states', async (req, res) => {
  try {
    const headers = getAuthHeaders(req);
    const response = await axios.get(`${API_GATEWAY_URL}/api/power-plants/states`, { headers });
    res.json(response.data);
  } catch (error) {
    if (error.response?.status === 401) {
      res.status(401).json({ error: 'Authentication required' });
    } else {
      res.status(500).json({ error: 'Failed to fetch states' });
    }
  }
});

app.get('/api/power-plants/top', async (req, res) => {
  try {
    const { limit = 10, state } = req.query;
    const params = new URLSearchParams({ limit: limit.toString() });
    if (state) params.append('state', state);
    
    const headers = getAuthHeaders(req);
    const response = await axios.get(`${API_GATEWAY_URL}/api/power-plants/top?${params}`, { headers });
    res.json(response.data);
  } catch (error) {
    if (error.response?.status === 401) {
      res.status(401).json({ error: 'Authentication required' });
    } else {
      res.status(500).json({ error: 'Failed to fetch power plants' });
    }
  }
});

// Authentication routes
app.post('/auth/login', async (req, res) => {
  try {
    const response = await axios.post(`${API_GATEWAY_URL}/auth/login`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Login failed' });
  }
});

app.post('/auth/register', async (req, res) => {
  try {
    const response = await axios.post(`${API_GATEWAY_URL}/auth/register`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Registration failed' });
  }
});

app.post('/auth/verify', async (req, res) => {
  try {
    const response = await axios.post(`${API_GATEWAY_URL}/auth/verify`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Token verification failed' });
  }
});

app.post('/auth/refresh', async (req, res) => {
  try {
    const response = await axios.post(`${API_GATEWAY_URL}/auth/refresh`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Token refresh failed' });
  }
});

// Serve the React app
app.get('*', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Plant Analytics</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://unpkg.com/axios/dist/axios.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: #f5f5f5;
            color: #333;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            padding: 30px 0; 
            text-align: center; 
            margin-bottom: 30px;
            border-radius: 12px;
        }
        .auth-container {
            background: white;
            border-radius: 12px;
            padding: 30px;
            max-width: 400px;
            margin: 50px auto;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .auth-form {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        .auth-form input {
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 14px;
        }
        .auth-form input:focus {
            border-color: #667eea;
            outline: none;
        }
        .auth-form button {
            background: #667eea;
            color: white;
            border: none;
            padding: 12px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.3s;
        }
        .auth-form button:hover {
            background: #5a6fd8;
        }
        .auth-toggle {
            text-align: center;
            margin-top: 20px;
        }
        .auth-toggle button {
            background: none;
            border: none;
            color: #667eea;
            cursor: pointer;
            text-decoration: underline;
        }
        .user-info {
            background: white;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .logout-btn {
            background: #dc3545;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
        }
        .logout-btn:hover {
            background: #c82333;
        }
        .controls { 
            background: white; 
            padding: 20px; 
            border-radius: 12px; 
            margin-bottom: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            display: flex;
            gap: 15px;
            align-items: center;
            flex-wrap: wrap;
        }
        .control-group { display: flex; flex-direction: column; gap: 5px; }
        .control-group label { font-weight: 600; color: #555; }
        select, input, button { 
            padding: 10px 15px; 
            border: 2px solid #ddd; 
            border-radius: 8px; 
            font-size: 14px;
        }
        select:focus, input:focus { border-color: #667eea; outline: none; }
        button { 
            background: #667eea; 
            color: white; 
            border: none; 
            cursor: pointer; 
            font-weight: 600;
            transition: background 0.3s;
        }
        button:hover { background: #5a6fd8; }
        button:disabled { background: #ccc; cursor: not-allowed; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .card { 
            background: white; 
            border-radius: 12px; 
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .card h3 { margin-bottom: 20px; color: #333; }
        table { width: 100%; border-collapse: collapse; }
        th, td { 
            text-align: left; 
            padding: 12px; 
            border-bottom: 1px solid #eee; 
        }
        th { 
            background: #f8f9fa; 
            font-weight: 600; 
            color: #555;
        }
        tr:hover { background: #f8f9fa; }
        .loading { 
            text-align: center; 
            padding: 40px; 
            color: #666; 
            font-size: 18px;
        }
        .error { 
            background: #fee; 
            border: 2px solid #fcc; 
            color: #c33; 
            padding: 15px; 
            border-radius: 8px; 
            margin: 20px 0;
        }
        
        /* Simple CSS Bar Chart */
        .chart-container { padding: 20px 0; }
        .bar-chart { display: flex; flex-direction: column; gap: 8px; }
        .bar-item { display: flex; align-items: center; gap: 10px; }
        .bar-label { 
            width: 200px; 
            font-size: 12px; 
            text-align: right;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .bar-visual { 
            height: 25px; 
            background: linear-gradient(90deg, #667eea, #764ba2);
            border-radius: 4px;
            min-width: 10px;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            padding-right: 8px;
            color: white;
            font-size: 11px;
            font-weight: 600;
        }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px; }
        .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
        }
        .stat-number { font-size: 24px; font-weight: bold; }
        .stat-label { font-size: 12px; opacity: 0.9; }
        
        @media (max-width: 768px) {
            .grid { grid-template-columns: 1fr; }
            .controls { flex-direction: column; align-items: stretch; }
            .bar-label { width: 120px; }
        }
    </style>
</head>
<body>
    <div id="root"></div>

    <script type="text/babel">
        const { useState, useEffect } = React;

        function AuthForm({ onLogin, onRegister, isLogin = true }) {
            const [formData, setFormData] = useState({
                email: '',
                password: '',
                firstName: '',
                lastName: ''
            });
            const [loading, setLoading] = useState(false);
            const [error, setError] = useState('');

            const handleSubmit = async (e) => {
                e.preventDefault();
                setLoading(true);
                setError('');

                try {
                    const endpoint = isLogin ? '/auth/login' : '/auth/register';
                    const response = await axios.post(endpoint, formData);
                    
                    if (isLogin) {
                        onLogin(response.data);
                    } else {
                        onRegister(response.data);
                    }
                } catch (err) {
                    setError(err.response?.data?.error || 'Authentication failed');
                } finally {
                    setLoading(false);
                }
            };

            return (
                <div className="auth-container">
                    <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>
                        {isLogin ? '🔐 Login' : '📝 Register'}
                    </h2>
                    
                    <form className="auth-form" onSubmit={handleSubmit}>
                        {!isLogin && (
                            <>
                                <input
                                    type="text"
                                    placeholder="First Name"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Last Name"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                                    required
                                />
                            </>
                        )}
                        <input
                            type="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            required
                        />
                        <button type="submit" disabled={loading}>
                            {loading ? 'Loading...' : (isLogin ? 'Login' : 'Register')}
                        </button>
                    </form>

                    {error && <div className="error">{error}</div>}

                    <div className="auth-toggle">
                        <button onClick={() => window.location.reload()}>
                            {isLogin ? 'Need an account? Register' : 'Have an account? Login'}
                        </button>
                    </div>
                </div>
            );
        }

        function PowerPlantsApp() {
            const [powerPlants, setPowerPlants] = useState([]);
            const [states, setStates] = useState([]);
            const [selectedState, setSelectedState] = useState('');
            const [limit, setLimit] = useState(10);
            const [loading, setLoading] = useState(false);
            const [error, setError] = useState('');
            const [user, setUser] = useState(null);
            const [showLogin, setShowLogin] = useState(true);

            // Check for existing token on mount
            useEffect(() => {
                const token = localStorage.getItem('accessToken');
                if (token) {
                    verifyToken(token);
                }
            }, []);

            const verifyToken = async (token) => {
                try {
                    axios.defaults.headers.common['Authorization'] = \`Bearer \${token}\`;
                    const response = await axios.post('/auth/verify', { token });
                    
                    if (response.data.valid) {
                        setUser(response.data.user);
                        loadStates();
                    } else {
                        // Try to refresh token
                        const refreshToken = localStorage.getItem('refreshToken');
                        if (refreshToken) {
                            await refreshUserToken(refreshToken);
                        } else {
                            handleLogout();
                        }
                    }
                } catch (err) {
                    handleLogout();
                }
            };

            const refreshUserToken = async (refreshToken) => {
                try {
                    const response = await axios.post('/auth/refresh', { refreshToken });
                    handleLogin(response.data);
                } catch (err) {
                    handleLogout();
                }
            };

            const handleLogin = (data) => {
                localStorage.setItem('accessToken', data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);
                axios.defaults.headers.common['Authorization'] = \`Bearer \${data.accessToken}\`;
                setUser(data.user);
                loadStates();
            };

            const handleRegister = (data) => {
                localStorage.setItem('accessToken', data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);
                axios.defaults.headers.common['Authorization'] = \`Bearer \${data.accessToken}\`;
                setUser(data.user);
                loadStates();
            };

            const handleLogout = () => {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                delete axios.defaults.headers.common['Authorization'];
                setUser(null);
                setPowerPlants([]);
                setStates([]);
            };

            // Load states on mount
            useEffect(() => {
                if (user) {
                    loadStates();
                }
            }, [user]);

            // Load power plants when filters change
            useEffect(() => {
                if (user) {
                    loadPowerPlants();
                }
            }, [selectedState, limit, user]);

            const loadStates = async () => {
                try {
                    const response = await axios.get('/api/power-plants/states');
                    setStates(response.data.data || []);
                } catch (err) {
                    if (err.response?.status === 401) {
                        handleLogout();
                    } else {
                        setError('Failed to load states');
                    }
                }
            };

            const loadPowerPlants = async () => {
                setLoading(true);
                setError('');
                try {
                    const params = new URLSearchParams({ limit: limit.toString() });
                    if (selectedState) params.append('state', selectedState);
                    
                    const response = await axios.get('/api/power-plants/top?' + params);
                    setPowerPlants(response.data.data || []);
                } catch (err) {
                    if (err.response?.status === 401) {
                        handleLogout();
                    } else {
                        setError('Failed to load power plants');
                    }
                } finally {
                    setLoading(false);
                }
            };

            const formatNumber = (num) => {
                const n = parseFloat(num);
                if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
                if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
                if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
                return n.toFixed(0);
            };

            // If not authenticated, show auth form
            if (!user) {
                return <AuthForm onLogin={handleLogin} onRegister={handleRegister} isLogin={showLogin} />;
            }

            // Calculate stats
            const totalGeneration = powerPlants.reduce((sum, plant) => sum + parseFloat(plant.netGeneration || 0), 0);
            const avgGeneration = powerPlants.length > 0 ? totalGeneration / powerPlants.length : 0;
            const uniqueStates = new Set(powerPlants.map(p => p.state)).size;

            // Prepare chart data (top 8 for visual clarity)
            const chartData = powerPlants.slice(0, 8);
            const maxValue = chartData.length > 0 ? Math.max(...chartData.map(p => parseFloat(p.netGeneration))) : 1;

            return (
                <div className="container">
                    <div className="header">
                        <h1>🏭 Plant Analytics Dashboard</h1>
                        <p>Explore US Power Generation Data</p>
                    </div>

                    <div className="user-info">
                        <div>
                            <strong>Welcome, {user.firstName} {user.lastName}</strong>
                            <br />
                            <small>{user.email} • {user.roles.join(', ')}</small>
                        </div>
                        <button className="logout-btn" onClick={handleLogout}>
                            Logout
                        </button>
                    </div>

                    <div className="controls">
                        <div className="control-group">
                            <label>State Filter</label>
                            <select 
                                value={selectedState} 
                                onChange={(e) => setSelectedState(e.target.value)}
                            >
                                <option value="">All States</option>
                                {states.map(state => (
                                    <option key={state} value={state}>{state}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="control-group">
                            <label>Results Limit</label>
                            <input 
                                type="number" 
                                value={limit} 
                                onChange={(e) => setLimit(parseInt(e.target.value) || 10)}
                                min="1" 
                                max="100" 
                            />
                        </div>
                        
                        <button 
                            onClick={loadPowerPlants} 
                            disabled={loading}
                        >
                            {loading ? 'Loading...' : 'Refresh'}
                        </button>
                    </div>

                    {error && <div className="error">{error}</div>}

                    {loading ? (
                        <div className="loading">Loading power plants...</div>
                    ) : (
                        <>
                            {powerPlants.length > 0 && (
                                <div className="stats-grid">
                                    <div className="stat-card">
                                        <div className="stat-number">{powerPlants.length}</div>
                                        <div className="stat-label">Power Plants</div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-number">{formatNumber(totalGeneration)}</div>
                                        <div className="stat-label">Total Generation (MWh)</div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-number">{formatNumber(avgGeneration)}</div>
                                        <div className="stat-label">Average Generation (MWh)</div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-number">{uniqueStates}</div>
                                        <div className="stat-label">States</div>
                                    </div>
                                </div>
                            )}

                            <div className="grid">
                                <div className="card">
                                    <h3>📊 Top Power Plants</h3>
                                    <div className="chart-container">
                                        <div className="bar-chart">
                                            {chartData.map((plant, index) => {
                                                const value = parseFloat(plant.netGeneration);
                                                const width = (value / maxValue) * 300; // max width 300px
                                                return (
                                                    <div key={index} className="bar-item">
                                                        <div 
                                                            className="bar-label" 
                                                            title={plant.plantName}
                                                        >
                                                            {plant.plantName.length > 25 
                                                                ? plant.plantName.substring(0, 25) + '...' 
                                                                : plant.plantName}
                                                        </div>
                                                        <div 
                                                            className="bar-visual" 
                                                            style={{ width: \`\${width}px\` }}
                                                        >
                                                            {formatNumber(value)}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div className="card">
                                    <h3>📋 Power Plants Table</h3>
                                    <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Plant Name</th>
                                                    <th>State</th>
                                                    <th>Net Generation (MWh)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {powerPlants.map((plant, index) => (
                                                    <tr key={index}>
                                                        <td title={plant.plantName}>
                                                            {plant.plantName.length > 30 
                                                                ? plant.plantName.substring(0, 30) + '...' 
                                                                : plant.plantName}
                                                        </td>
                                                        <td>{plant.state}</td>
                                                        <td>{formatNumber(plant.netGeneration)} MWh</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {powerPlants.length === 0 && !loading && (
                                        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                                            No power plants found
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            );
        }

        ReactDOM.render(<PowerPlantsApp />, document.getElementById('root'));
    </script>
</body>
</html>
  `);
});

app.listen(PORT, () => {
  console.log(`🚀 Plant Analytics running on http://localhost:${PORT}`);
  console.log(`📡 Proxying API calls to ${API_GATEWAY_URL}`);
  console.log(`🔐 Authentication enabled`);
}); 