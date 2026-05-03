const API_URL = 'http://localhost:3000/api';

// Configura os headers com o token de autenticação
const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const api = {
  login: async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erro no login');
    return data;
  },

  getUsers: async () => {
    const res = await fetch(`${API_URL}/users`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  },

  createUser: async (userData) => {
    const res = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  },

  updateUser: async (id, userData) => {
    const res = await fetch(`${API_URL}/users/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  },

  deleteUser: async (id) => {
    const res = await fetch(`${API_URL}/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  },

  // ===================================
  // PACIENTES
  // ===================================
  getPatients: async () => {
    const res = await fetch(`${API_URL}/patients`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  },

  createPatient: async (patientData) => {
    const res = await fetch(`${API_URL}/patients`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(patientData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  },

  updatePatient: async (id, patientData) => {
    const res = await fetch(`${API_URL}/patients/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(patientData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  },

  deletePatient: async (id) => {
    const res = await fetch(`${API_URL}/patients/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  },

  // ===================================
  // LEITOS
  // ===================================
  getBeds: async () => {
    const res = await fetch(`${API_URL}/beds`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  },

  assignBed: async (bedId, patientId) => {
    const res = await fetch(`${API_URL}/beds/${bedId}/assign`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ patient_id: patientId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  },

  releaseBed: async (bedId) => {
    const res = await fetch(`${API_URL}/beds/${bedId}/release`, {
      method: 'PUT',
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  },

  // ===================================
  // ENFERMAGEM / PRONTUÁRIO
  // ===================================
  getClinicalRecord: async (patientId) => {
    const res = await fetch(`${API_URL}/patients/${patientId}/clinical-record`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  },

  addMedication: async (medicationData) => {
    const res = await fetch(`${API_URL}/medications`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(medicationData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  },

  deleteMedication: async (id) => {
    const res = await fetch(`${API_URL}/medications/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  },

  getActiveTimers: async () => {
    const res = await fetch(`${API_URL}/medications/timers`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  },

  toggleMedicationTimer: async (id, action) => {
    const res = await fetch(`${API_URL}/medications/${id}/timer`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ action })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  },

  addObservation: async (observationData) => {
    const res = await fetch(`${API_URL}/observations`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(observationData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  },

  deleteObservation: async (id) => {
    const res = await fetch(`${API_URL}/observations/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  }
};
