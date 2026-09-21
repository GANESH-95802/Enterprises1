import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PageHeader, Card, FormField } from '../components/ui';
import { FiSave, FiBell, FiShield, FiGlobe } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      aiUpdates: false,
      securityAlerts: true,
    },
    preferences: {
      language: 'en',
      theme: 'light',
      timezone: 'UTC',
    },
    security: {
      twoFactor: false,
      sessionTimeout: '30',
    },
  });

  const handleSave = () => {
    localStorage.setItem('ai_hub_settings', JSON.stringify(settings));
    toast.success('Settings saved successfully');
  };

  const toggleSetting = (section, key) => {
    setSettings((prev) => ({
      ...prev,
      [section]: { ...prev[section], [key]: !prev[section][key] },
    }));
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Manage your application preferences"
        actions={
          <button className="btn btn-primary" onClick={handleSave}>
            <FiSave /> Save Settings
          </button>
        }
      />

      <div className="grid grid-2">
        <Card>
          <h3 className="card-title"><FiBell /> Notifications</h3>
          <div className="settings-list">
            {Object.entries(settings.notifications).map(([key, value]) => (
              <div key={key} className="settings-item">
                <div>
                  <strong className="text-capitalize">{key.replace(/([A-Z])/g, ' $1')}</strong>
                  <p>Receive {key.replace(/([A-Z])/g, ' $1').toLowerCase()} notifications</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={() => toggleSetting('notifications', key)}
                  />
                  <span className="slider" />
                </label>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="card-title"><FiGlobe /> Preferences</h3>
          <div className="settings-form">
            <FormField label="Language">
              <select
                className="form-select"
                value={settings.preferences.language}
                onChange={(e) => setSettings({ ...settings, preferences: { ...settings.preferences, language: e.target.value } })}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </FormField>
            <FormField label="Theme">
              <select
                className="form-select"
                value={settings.preferences.theme}
                onChange={(e) => setSettings({ ...settings, preferences: { ...settings.preferences, theme: e.target.value } })}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </FormField>
            <FormField label="Timezone">
              <select
                className="form-select"
                value={settings.preferences.timezone}
                onChange={(e) => setSettings({ ...settings, preferences: { ...settings.preferences, timezone: e.target.value } })}
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York</option>
                <option value="Europe/London">Europe/London</option>
                <option value="Asia/Kolkata">Asia/Kolkata</option>
              </select>
            </FormField>
          </div>
        </Card>
      </div>

      <Card style={{ marginTop: 24 }}>
        <h3 className="card-title"><FiShield /> Security</h3>
        <div className="settings-list">
          <div className="settings-item">
            <div>
              <strong>Two-Factor Authentication</strong>
              <p>Add an extra layer of security to your account</p>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.security.twoFactor}
                onChange={() => toggleSetting('security', 'twoFactor')}
              />
              <span className="slider" />
            </label>
          </div>
          <div className="settings-item">
            <div>
              <strong>Session Timeout</strong>
              <p>Automatically log out after inactivity</p>
            </div>
            <select
              className="form-select"
              style={{ width: 120 }}
              value={settings.security.sessionTimeout}
              onChange={(e) => setSettings({ ...settings, security: { ...settings.security, sessionTimeout: e.target.value } })}
            >
              <option value="15">15 min</option>
              <option value="30">30 min</option>
              <option value="60">1 hour</option>
              <option value="120">2 hours</option>
            </select>
          </div>
        </div>
      </Card>
    </div>
  );
}