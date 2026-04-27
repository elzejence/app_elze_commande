import React, { useState, useEffect } from 'react';
import { API } from '../context/AuthContext';

export default function DebugPage() {
  const [status, setStatus] = useState('⏳ Test en cours...');
  const [color,  setColor]  = useState('#999');
  const [details, setDetails] = useState('');

  useEffect(() => {
    API.get('/health')
      .then(r => {
        setStatus('✅ Backend connecté !');
        setColor('#27AE60');
        setDetails(JSON.stringify(r.data, null, 2));
      })
      .catch(err => {
        setStatus('❌ Backend inaccessible');
        setColor('#E74C3C');
        setDetails(err.message);
      });
  }, []);

  const baseURL = process.env.REACT_APP_API_URL
    ? `${process.env.REACT_APP_API_URL}/api`
    : '/api (proxy → http://localhost:5000)';

  return (
    <div style={{ padding: 40, maxWidth: 600, margin: '0 auto', fontFamily: 'monospace' }}>
      <h2 style={{ fontFamily: 'serif', marginBottom: 24 }}>🔧 Diagnostic de connexion</h2>

      <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <div style={{ marginBottom: 8 }}>
          <strong>URL API utilisée :</strong><br/>
          <code style={{ color: '#2980B9' }}>{baseURL}</code>
        </div>
        <div style={{ marginBottom: 8 }}>
          <strong>Statut :</strong><br/>
          <span style={{ color, fontWeight: 700, fontSize: '1.1rem' }}>{status}</span>
        </div>
        {details && (
          <pre style={{ background: '#eee', padding: 10, borderRadius: 6, fontSize: '.82rem', overflow: 'auto', marginTop: 10 }}>
            {details}
          </pre>
        )}
      </div>

      <div style={{ background: '#FEF3C7', borderRadius: 8, padding: 16, fontSize: '.88rem', lineHeight: 1.7 }}>
        <strong>Si le backend est inaccessible :</strong>
        <ol style={{ marginTop: 8, paddingLeft: 20 }}>
          <li>Vérifiez que MySQL est démarré</li>
          <li>Dans <code>backend/</code> → lancez <code>npm run dev</code></li>
          <li>Vérifiez que <code>.env</code> contient les bons identifiants MySQL</li>
          <li>Si le proxy React ne fonctionne pas, ouvrez <code>frontend/.env</code> et décommentez :<br/>
            <code>REACT_APP_API_URL=http://localhost:5000</code>
          </li>
          <li>Redémarrez le frontend après avoir modifié <code>.env</code></li>
        </ol>
      </div>
    </div>
  );
}
