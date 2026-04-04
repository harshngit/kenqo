import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Sample extracted data for demo
const sampleExtractedData = {
  PATIENT_DEMOGRAPHICS: {
    patient_name: {
      value: "Aguilar, Regina",
      confidence: 0.95,
      reasoning: "Extracted 'Regina Aguilar' from 'Patient Name:' label on Rx document, confirmed by Clinical Notes, Insurance Card, and Garment Order Form.",
      source: {
        document: "Rx",
        page: 1,
        line: "Patient Name: Regina Aguilar"
      },
      not_found: false,
      needs_csr_review: false
    },
    patient_dob: {
      value: "11/22/1969",
      confidence: 0.95,
      reasoning: "Extracted from 'Date of Birth:' label on Rx document.",
      source: {
        document: "Rx",
        page: 1,
        line: "Date of Birth: 1969-11-22"
      },
      not_found: false,
      needs_csr_review: false
    },
    patient_age: {
      value: "57",
      confidence: 0.95,
      reasoning: "Extracted from Clinical Notes.",
      source: {
        document: "Clinical Notes",
        page: 1,
        line: "Regina Aguilar is a 57-year-old female"
      },
      not_found: false,
      needs_csr_review: false
    },
    patient_address: {
      value: "5775 Mission Street, Providence, RI 02905",
      confidence: 0.95,
      reasoning: "Extracted from 'Address:' label on Rx document.",
      source: {
        document: "Rx",
        page: 1,
        line: "Address: 5775 Mission Street, Providence, RI 02905"
      },
      not_found: false,
      needs_csr_review: false
    },
    patient_phone: {
      value: "(562) 555-1176",
      confidence: 0.95,
      reasoning: "Extracted from 'Phone:' label on Rx document.",
      source: {
        document: "Rx",
        page: 1,
        line: "Phone: (1) 562-555-1176"
      },
      not_found: false,
      needs_csr_review: false
    },
    patient_mrn: {
      value: null,
      confidence: 0.0,
      reasoning: "No explicit 'MRN:' label found in any document.",
      source: null,
      not_found: true,
      needs_csr_review: false
    },
    patient_sex: {
      value: "Female",
      confidence: 0.95,
      reasoning: "Extracted from 'Gender:' label on Rx document.",
      source: {
        document: "Rx",
        page: 1,
        line: "Gender: Female"
      },
      not_found: false,
      needs_csr_review: false
    },
    patient_ssn_last4: {
      value: null,
      confidence: 0.0,
      reasoning: "No explicit 'SSN:' label found in any document.",
      source: null,
      not_found: true,
      needs_csr_review: false
    }
  },
  INSURANCE_BILLING: {
    payer_name: {
      value: "Blue Cross Blue Shield of RI",
      confidence: 0.98,
      reasoning: "Extracted from the payer name block on the insurance card.",
      source: {
        document: "Insurance Card",
        page: 1,
        line: "BLUE CROSS BLUE SHIELD OF RI"
      },
      not_found: false,
      needs_csr_review: false
    },
    plan_type: {
      value: "Commercial PPO",
      confidence: 0.98,
      reasoning: "Explicitly stated as 'Commercial PPO Plan' on the insurance card.",
      source: {
        document: "Insurance Card",
        page: 1,
        line: "Commercial PPO Plan"
      },
      not_found: false,
      needs_csr_review: false
    },
    member_id: {
      value: "BCBS-RI-7829456",
      confidence: 0.98,
      reasoning: "Extracted verbatim from the 'MEMBER ID' field.",
      source: {
        document: "Insurance Card",
        page: 1,
        line: "MEMBER IDBCBS-RI-7829456"
      },
      not_found: false,
      needs_csr_review: false
    },
    group_number: {
      value: "GRP-44821",
      confidence: 0.98,
      reasoning: "Extracted verbatim from the 'GROUP' field.",
      source: {
        document: "Insurance Card",
        page: 1,
        line: "GROUPGRP-44821"
      },
      not_found: false,
      needs_csr_review: false
    },
    pa_required: {
      value: true,
      confidence: 0.95,
      reasoning: "The insurance card explicitly lists a 'DME Pre-Authorization' phone number.",
      source: {
        document: "Insurance Card",
        page: 1,
        line: "DME Pre-Authorization: 1-800-555-6526"
      },
      not_found: false,
      needs_csr_review: false
    },
    prior_auth_number: {
      value: null,
      confidence: 1.0,
      reasoning: "No 'Prior Authorization:' field with a value was found.",
      source: null,
      not_found: true,
      needs_csr_review: false
    },
    insurance_effective_date: {
      value: "01/01/2024",
      confidence: 0.98,
      reasoning: "Extracted verbatim from the 'EFFECTIVE' date field.",
      source: {
        document: "Insurance Card",
        page: 1,
        line: "EFFECTIVE01/01/2024"
      },
      not_found: false,
      needs_csr_review: false
    }
  },
  PROVIDER_FACILITY: {
    ordering_physician_name: {
      value: "Patricia Alvarez, MD",
      confidence: 1.0,
      reasoning: "Found 'Physician: Patricia Alvarez, MD' under 'ORDERING PHYSICIAN' label.",
      source: {
        document: "Prescription Order",
        page: 2,
        line: "Physician: Patricia Alvarez, MD"
      },
      not_found: false,
      needs_csr_review: false
    },
    ordering_physician_npi: {
      value: "2233445567",
      confidence: 1.0,
      reasoning: "Found 'NPI: 2233445567' under 'ORDERING PHYSICIAN' label.",
      source: {
        document: "Prescription Order",
        page: 2,
        line: "NPI: 2233445567"
      },
      not_found: false,
      needs_csr_review: false
    },
    treating_therapist_name: {
      value: "Jennifer Okafor, PT, DPT, CLT",
      confidence: 1.0,
      reasoning: "Found 'Evaluating Therapist: Jennifer Okafor, PT, DPT, CLT' in Clinical Notes.",
      source: {
        document: "Clinical Notes",
        page: 1,
        line: "Evaluating Therapist: Jennifer Okafor, PT, DPT, CLT"
      },
      not_found: false,
      needs_csr_review: false
    },
    facility_name: {
      value: "NORTHEAST LYMPHEDEMA & WOUND CARE",
      confidence: 1.0,
      reasoning: "Extracted from document letterhead block.",
      source: {
        document: "Prescription Order",
        page: 1,
        line: "+ NORTHEAST LYMPHEDEMA & WOUND CARE"
      },
      not_found: false,
      needs_csr_review: false
    },
    facility_npi: {
      value: "1234567891",
      confidence: 1.0,
      reasoning: "Found 'Facility NPI: 1234567891' in the letterhead block.",
      source: {
        document: "Prescription Order",
        page: 1,
        line: "Facility NPI: 1234567891"
      },
      not_found: false,
      needs_csr_review: false
    }
  },
  CLINICAL_FINDINGS: {
    icd_code_primary: {
      value: "I97.2",
      confidence: 1.0,
      reasoning: "Explicitly stated as 'Primary Diagnosis: Postmastectomy lymphedema syndrome (I97.2)'.",
      source: {
        document: "Rx",
        page: 1,
        line: "Primary Diagnosis: Postmastectomy lymphedema syndrome (I97.2)"
      },
      not_found: false,
      needs_csr_review: false
    },
    isl_stage: {
      value: "I",
      confidence: 1.0,
      reasoning: "Explicitly stated as 'ISL Stage I' in Rx and Clinical Notes.",
      source: {
        document: "Clinical Notes",
        page: 1,
        line: "ISL Stage: Stage I (Spontaneously Reversible)"
      },
      not_found: false,
      needs_csr_review: false
    },
    laterality: {
      value: "Right",
      confidence: 1.0,
      reasoning: "Consistently identified as 'Right Upper Extremity' in Rx and Clinical Notes.",
      source: {
        document: "Garment Order",
        page: 1,
        line: "[ ] Left    [X] Right    [ ] Bilateral"
      },
      not_found: false,
      needs_csr_review: false
    },
    body_region: {
      value: "Upper extremity",
      confidence: 1.0,
      reasoning: "Explicitly stated as 'Right Upper Extremity' in Rx.",
      source: {
        document: "Garment Order",
        page: 1,
        line: "[X] Upper Extremity    [ ] Lower Extremity"
      },
      not_found: false,
      needs_csr_review: false
    },
    stemmer_sign: {
      value: "Negative",
      confidence: 1.0,
      reasoning: "Clinical Notes explicitly state 'Stemmer sign that is negative'.",
      source: {
        document: "Clinical Notes",
        page: 2,
        line: "Physical examination reveals mild pitting edema with a Stemmer sign that is negative"
      },
      not_found: false,
      needs_csr_review: false
    },
    pitting_grade: {
      value: "1+",
      confidence: 1.0,
      reasoning: "Clinical Notes state 'Pitting assessment scores 1 out of 4'.",
      source: {
        document: "Clinical Notes",
        page: 2,
        line: "Pitting assessment scores 1 out of 4"
      },
      not_found: false,
      needs_csr_review: false
    },
    measurement_reference_point: {
      value: null,
      confidence: 0.0,
      reasoning: "A complete circumferential measurement table was not found.",
      source: null,
      not_found: true,
      needs_csr_review: true
    },
    circumference_table: {
      value: [],
      confidence: 0.0,
      reasoning: "A complete circumferential limb measurement table was not explicitly present.",
      source: null,
      not_found: true,
      needs_csr_review: true
    }
  },
  ORDER_DETAILS: {
    order_type: {
      value: "garment",
      confidence: 1.0,
      reasoning: "HCPCS A6549 falls within the A6519-A6611 range, indicating a garment order.",
      source: {
        document: "Prescription Order",
        page: 2,
        line: "Arm Sleeve - Juzo Dynamic, Class I (20-30 mmHg), right, Ready-Made, Qty: 2, HCPCS: A6549"
      },
      not_found: false,
      needs_csr_review: false
    },
    garment_type: {
      value: "sleeve",
      confidence: 0.95,
      reasoning: "Explicitly stated as 'Arm Sleeve' on the Prescription Order.",
      source: {
        document: "Prescription Order",
        page: 2,
        line: "Arm Sleeve - Juzo Dynamic, Class I (20-30 mmHg), right, Ready-Made, Qty: 2, HCPCS: A6549"
      },
      not_found: false,
      needs_csr_review: false
    },
    compression_class: {
      value: "20-30mmHg",
      confidence: 0.95,
      reasoning: "Explicitly stated as 'Class I (20-30 mmHg)' on the Prescription Order.",
      source: {
        document: "Prescription Order",
        page: 2,
        line: "Arm Sleeve - Juzo Dynamic, Class I (20-30 mmHg), right, Ready-Made, Qty: 2, HCPCS: A6549"
      },
      not_found: false,
      needs_csr_review: false
    },
    hcpcs_code: {
      value: "A6549",
      confidence: 1.0,
      reasoning: "Explicitly stated as 'HCPCS: A6549' on the Prescription Order.",
      source: {
        document: "Prescription Order",
        page: 2,
        line: "Arm Sleeve - Juzo Dynamic, Class I (20-30 mmHg), right, Ready-Made, Qty: 2, HCPCS: A6549"
      },
      not_found: false,
      needs_csr_review: false
    },
    garment_quantity: {
      value: 2,
      confidence: 0.95,
      reasoning: "Explicitly stated as 'Qty: 2' on the Prescription Order.",
      source: {
        document: "Prescription Order",
        page: 2,
        line: "Arm Sleeve - Juzo Dynamic, Class I (20-30 mmHg), right, Ready-Made, Qty: 2, HCPCS: A6549"
      },
      not_found: false,
      needs_csr_review: false
    }
  }
};

const initialDocuments = [
  {
    id: '1',
    userId: '2',
    patientId: 'p1',
    name: 'Aguilar_Regina_01_Prescription_Order.pdf',
    type: 'application/pdf',
    size: 1024 * 1024 * 2.5,
    uploadDate: '2024-03-01T10:30:00Z',
    url: '#',
    category: 'prescription',
    status: 'completed',
    extractedData: sampleExtractedData,
  },
  {
    id: '2',
    userId: '2',
    patientId: 'p1',
    name: 'Aguilar_Regina_02_Clinical_Notes.pdf',
    type: 'application/pdf',
    size: 1024 * 1024 * 1.8,
    uploadDate: '2024-03-05T14:20:00Z',
    url: '#',
    category: 'clinical_notes',
    status: 'completed',
  },
  {
    id: '3',
    userId: '2',
    patientId: 'p2',
    name: 'Insurance_Card_BlueCross.pdf',
    type: 'application/pdf',
    size: 1024 * 512,
    uploadDate: '2024-03-10T09:15:00Z',
    url: '#',
    category: 'insurance',
    status: 'processing',
  },
];

const initialPatients = [
  {
    id: 'p1',
    userId: '2',
    name: 'Aguilar, Regina',
    dateOfBirth: '11/22/1969',
    age: '57',
    address: '5775 Mission Street, Providence, RI 02905',
    phone: '(562) 555-1176',
    sex: 'Female',
  },
  {
    id: 'p2',
    userId: '2',
    name: 'Smith, John',
    dateOfBirth: '05/15/1985',
    age: '39',
    address: '123 Main St, Boston, MA 02101',
    phone: '(617) 555-1234',
    sex: 'Male',
  },
];

export const useUserStore = create(
  persist(
    (set, get) => ({
      documents: initialDocuments,
      patients: initialPatients,

      addDocument: (document) => {
        set((state) => ({ documents: [...state.documents, document] }));
      },

      deleteDocument: (id) => {
        set((state) => ({
          documents: state.documents.filter((doc) => doc.id !== id),
        }));
      },

      getUserDocuments: (userId) => {
        return get().documents.filter((doc) => doc.userId === userId);
      },

      updateDocumentStatus: (id, status) => {
        set((state) => ({
          documents: state.documents.map((doc) =>
            doc.id === id ? { ...doc, status } : doc
          ),
        }));
      },

      addExtractedData: (docId, data) => {
        set((state) => ({
          documents: state.documents.map((doc) =>
            doc.id === docId ? { ...doc, extractedData: data, status: 'completed' } : doc
          ),
        }));
      },
    }),
    {
      name: 'user-storage',
    }
  )
);
