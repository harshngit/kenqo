import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const initialRules = [
  {
    id: '1',
    title: 'Patient Data Privacy',
    description: 'All patient data must be encrypted and stored securely. Access is restricted to authorized personnel only.',
    category: 'Privacy & Security',
    status: 'approved',
    createdBy: '1',
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-01-10T08:00:00Z',
  },
  {
    id: '2',
    title: 'Appointment Scheduling',
    description: 'Patients can schedule appointments up to 30 days in advance. Same-day appointments require emergency approval.',
    category: 'Appointments',
    status: 'approved',
    createdBy: '1',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
  },
  {
    id: '3',
    title: 'Prescription Refill Policy',
    description: 'Prescription refills can be requested 7 days before the current supply runs out. Controlled substances require in-person visit.',
    category: 'Prescriptions',
    status: 'pending',
    createdBy: '2',
    createdAt: '2024-03-20T14:00:00Z',
    updatedAt: '2024-03-20T14:00:00Z',
  },
  {
    id: '4',
    title: 'Lab Result Notification',
    description: 'Patients will be notified within 24 hours of lab results being available. Critical results require immediate phone call.',
    category: 'Lab Results',
    status: 'pending',
    createdBy: '2',
    createdAt: '2024-03-22T09:15:00Z',
    updatedAt: '2024-03-22T09:15:00Z',
  },
  {
    id: '5',
    title: 'Patient Data Privacy Policy',
    description: 'All patient information must be kept confidential and encrypted. Only authorized staff can access patient records.',
    category: 'Privacy & Security',
    status: 'pending',
    createdBy: '3',
    createdAt: '2024-03-25T11:00:00Z',
    updatedAt: '2024-03-25T11:00:00Z',
  },
];

export const useRuleStore = create(
  persist(
    (set, get) => ({
      rules: initialRules,

      addRule: (rule) => {
        const newRule = {
          ...rule,
          id: Math.random().toString(36).substr(2, 9),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ rules: [...state.rules, newRule] }));
      },

      updateRule: (id, data) => {
        set((state) => ({
          rules: state.rules.map((rule) =>
            rule.id === id
              ? { ...rule, ...data, updatedAt: new Date().toISOString() }
              : rule
          ),
        }));
      },

      deleteRule: (id) => {
        set((state) => ({
          rules: state.rules.filter((rule) => rule.id !== id),
        }));
      },

      mergeRules: (ruleIds, mergedRule) => {
        const newRule = {
          ...mergedRule,
          id: Math.random().toString(36).substr(2, 9),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          mergedFrom: ruleIds,
          isMerged: true,
        };
        set((state) => ({
          rules: [
            ...state.rules.filter((rule) => !ruleIds.includes(rule.id)),
            newRule,
          ],
        }));
      },

      getRulesByStatus: (status) => {
        return get().rules.filter((rule) => rule.status === status);
      },

      getPendingRules: () => {
        return get().rules.filter((rule) => rule.status === 'pending');
      },
    }),
    {
      name: 'rule-storage',
    }
  )
);
