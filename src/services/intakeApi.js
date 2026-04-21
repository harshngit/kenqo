const BASE_URL = 'https://kenqo-api-409744260053.asia-south1.run.app';

const getHeaders = (isFormData = false) => {
  const token = localStorage.getItem('kenqo_token');
  const headers = {
    'Authorization': `Bearer ${token}`
  };
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'Request failed');
  }
  return data;
};

// Orders

export const createOrder = async (formData) => {
  const response = await fetch(`${BASE_URL}/intake/orders`, {
    method: 'POST',
    headers: getHeaders(true),
    body: formData
  });
  return handleResponse(response);
};

export const listOrders = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.status) query.append('status', params.status);
  if (params.patient_id) query.append('patient_id', params.patient_id);
  if (params.search) query.append('search', params.search);
  if (params.limit) query.append('limit', params.limit);
  if (params.offset) query.append('offset', params.offset);

  const queryString = query.toString();
  const url = `${BASE_URL}/intake/orders${queryString ? '?' + queryString : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders()
  });
  return handleResponse(response);
};

// Returns the full order status object including identity-review fields:
//   identity_review_required, identity_decision_status, identity_candidate_matches,
//   identity_suspicious, identity_incomplete, identity_mismatch,
//   patient_match_tier, patient_match_confidence, awaiting_csr,
//   extraction.identity_prepass_status, has_incomplete_prior_order,
//   has_completed_prior_order, incomplete_prior_order_id, latest_completed_order_id
export const getOrderStatus = async (orderId) => {
  const response = await fetch(`${BASE_URL}/intake/orders/${orderId}/status`, {
    method: 'GET',
    headers: getHeaders()
  });
  return handleResponse(response);
};

export const getOrderFields = async (orderId) => {
  const response = await fetch(`${BASE_URL}/intake/orders/${orderId}/fields`, {
    method: 'GET',
    headers: getHeaders()
  });
  return handleResponse(response);
};

export const getOrderDocuments = async (orderId) => {
  const response = await fetch(`${BASE_URL}/intake/orders/${orderId}/documents`, {
    method: 'GET',
    headers: getHeaders()
  });
  return handleResponse(response);
};

export const addOrderDocuments = async (orderId, formData) => {
  const response = await fetch(`${BASE_URL}/intake/orders/${orderId}/documents`, {
    method: 'POST',
    headers: getHeaders(true),
    body: formData
  });
  return handleResponse(response);
};

export const approveOrder = async (orderId, { overrideMissing = false } = {}) => {
  const query = overrideMissing ? '?override_missing=true' : '';
  const response = await fetch(`${BASE_URL}/intake/orders/${orderId}/approve${query}`, {
    method: 'POST',
    headers: getHeaders()
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.detail || data.message || 'Approval failed');
    error.status = response.status;
    error.missingFields = data.missing_fields || data.detail?.missing_fields || [];
    throw error;
  }
  return data;
};

export const editField = async (orderId, fieldName, value, editReason) => {
  const response = await fetch(`${BASE_URL}/intake/orders/${orderId}/fields/${fieldName}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ value, edit_reason: editReason })
  });
  return handleResponse(response);
};

export const resolveConflict = async (orderId, fieldName, chosenValue, editReason, resolutionType) => {
  const response = await fetch(`${BASE_URL}/intake/orders/${orderId}/resolve-conflict`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      field_name: fieldName,
      chosen_value: chosenValue,
      edit_reason: editReason,
      resolution_type: resolutionType
    })
  });
  return handleResponse(response);
};

export const deleteDocument = async (orderId, docId) => {
  const response = await fetch(`${BASE_URL}/intake/orders/${orderId}/documents/${docId}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return handleResponse(response);
};

export const deleteOrder = async (orderId) => {
  const response = await fetch(`${BASE_URL}/intake/orders/${orderId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// CSR decision
//
// Supported decision values:
//   continue_existing_patient | continue_new_patient | continue_existing_order |
//   start_new_order | confirm_identity | proceed_mismatch | cancel_mismatch |
//   resume | fresh | merge_into_existing
//
// payload shape: { decision, prior_order_id?, patient_id? }
export const submitCSRDecision = async (orderId, payload) => {
  const response = await fetch(`${BASE_URL}/intake/orders/${orderId}/csr-decision`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  return handleResponse(response);
};

// Patients

export const listPatients = async (search = '') => {
  const url = search
    ? `${BASE_URL}/intake/patients?search=${encodeURIComponent(search)}`
    : `${BASE_URL}/intake/patients`;
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders()
  });
  return handleResponse(response);
};

export const createPatient = async (data) => {
  const response = await fetch(`${BASE_URL}/intake/patients`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  return handleResponse(response);
};

export const updatePatient = async (patientId, data) => {
  const response = await fetch(`${BASE_URL}/intake/patients/${patientId}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  return handleResponse(response);
};

export const getPatientOrders = async (patientId) => {
  const response = await fetch(`${BASE_URL}/intake/patients/${patientId}/orders`, {
    method: 'GET',
    headers: getHeaders()
  });
  return handleResponse(response);
};

export const verifyEligibility = async (orderId) => {
  const response = await fetch(`${BASE_URL}/intake/orders/${orderId}/verify-eligibility`, {
    method: 'POST',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

export const viewDocument = async (orderId, docId) => {
  const response = await fetch(`${BASE_URL}/intake/orders/${orderId}/documents/${docId}/view`, {
    method: 'GET',
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch document');
  return response.json();
};
