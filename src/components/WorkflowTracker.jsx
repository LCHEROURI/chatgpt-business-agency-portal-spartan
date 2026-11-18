import React, { useState } from 'react';
import {
  Check,
  AlertTriangle,
  Clock,
  ChevronRight,
  CheckCircle2,
  Circle,
  ShieldCheck
} from 'lucide-react';
import { WORKFLOW_STEPS } from '../data/workflowBlueprint';

const STATUS_META = {
  completed: { label: 'Completed', className: 'badge-success' },
  in_progress: { label: 'In Progress', className: 'badge-primary' },
  action_required: { label: 'Action Required', className: 'badge-warning' },
  pending: { label: 'Pending', className: 'badge-neutral' }
};

export default function WorkflowTracker({ client, onUpdateClient }) {
  const [focusedStep, setFocusedStep] = useState(client.currentStep || 1);

  const activeStepDef = WORKFLOW_STEPS.find((s) => s.id === focusedStep) || WORKFLOW_STEPS[0];
  const completedCount = WORKFLOW_STEPS.filter(
    (s) => client.stepStatuses?.[s.id] === 'completed'
  ).length;
  const progressPct = Math.round((completedCount / WORKFLOW_STEPS.length) * 100);

  const handleToggleChecklist = (stepId, idx) => {
    const key = `${stepId}_${idx}`;
    const nextChecklist = {
      ...(client.checklistProgress || {}),
      [key]: !client.checklistProgress?.[key]
    };

    const totalItems = WORKFLOW_STEPS.find((s) => s.id === stepId)?.checklist.length || 3;
    const checkedItems = Array.from({ length: totalItems }).filter(
      (_, i) => nextChecklist[`${stepId}_${i}`]
    ).length;

    const nextStatuses = { ...(client.stepStatuses || {}) };
    if (checkedItems === totalItems) {
      nextStatuses[stepId] = 'completed';
    } else if (checkedItems > 0 && nextStatuses[stepId] === 'pending') {
      nextStatuses[stepId] = 'in_progress';
    }

    onUpdateClient({
      ...client,
      checklistProgress: nextChecklist,
      stepStatuses: nextStatuses
    });
  };

  const handleStepStatusChange = (stepId, newStatus) => {
    const nextStatuses = {
      ...(client.stepStatuses || {}),
      [stepId]: newStatus
    };
    let nextCurrent = client.currentStep;
    if (newStatus === 'completed' && stepId >= client.currentStep && stepId < 6) {
      nextCurrent = stepId + 1;
      if (nextStatuses[nextCurrent] === 'pending') {
        nextStatuses[nextCurrent] = 'in_progress';
      }
      setFocusedStep(nextCurrent);
    }
    onUpdateClient({
      ...client,
      currentStep: nextCurrent,
      stepStatuses: nextStatuses,
      insights:
        stepId === 6 && newStatus === 'completed'
          ? { ...(client.insights || {}), blueCheckActive: true }
          : client.insights
    });
  };

  return (
    <section className="card workflow-card" aria-label="Six-step registration workflow">
      <div className="workflow-header">
        <div>
          <div className="workflow-eyebrow">
            <ShieldCheck size={15} />
            <span>ChatGPT Business Registration Blueprint</span>
          </div>
          <h2 className="workflow-title">Six-Step Verification &amp; Launch Tracker</h2>
        </div>
        <div className="workflow-progress-summary">
          <div className="progress-stats">
            <span className="progress-count">
              {completedCount} of {WORKFLOW_STEPS.length} steps complete
            </span>
            <span className="progress-pct">{progressPct}%</span>
          </div>
          <div className="progress-bar-track" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
            <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      {/* Horizontal 6-Step Stepper */}
      <div className="stepper-grid" role="tablist" aria-label="Workflow steps">
        {WORKFLOW_STEPS.map((step) => {
          const status = client.stepStatuses?.[step.id] || 'pending';
          const isFocused = focusedStep === step.id;
          const isCurrent = client.currentStep === step.id;

          return (
            <button
              key={step.id}
              type="button"
              role="tab"
              aria-selected={isFocused}
              className={`step-node step-${status} ${isFocused ? 'is-focused' : ''} ${
                isCurrent ? 'is-current' : ''
              }`}
              onClick={() => setFocusedStep(step.id)}
            >
              <div className="step-node-top">
                <span className="step-indicator">
                  {status === 'completed' ? (
                    <Check size={14} strokeWidth={2.5} />
                  ) : status === 'action_required' ? (
                    <AlertTriangle size={14} />
                  ) : status === 'in_progress' ? (
                    <Clock size={14} />
                  ) : (
                    <span>{step.id}</span>
                  )}
                </span>
                <span className="step-number-label">Step {step.id}</span>
              </div>
              <div className="step-node-title">{step.shortTitle}</div>
              <div className="step-node-status">{STATUS_META[status]?.label || 'Pending'}</div>
            </button>
          );
        })}
      </div>

      {/* Focused Step Detail & Checklist */}
      <div className="step-detail-panel">
        <div className="step-detail-header">
          <div>
            <div className="step-detail-title-row">
              <span className="step-badge">Step {activeStepDef.id}</span>
              <h3>{activeStepDef.title}</h3>
              <span className={`status-pill ${STATUS_META[client.stepStatuses?.[activeStepDef.id] || 'pending'].className}`}>
                {STATUS_META[client.stepStatuses?.[activeStepDef.id] || 'pending'].label}
              </span>
            </div>
            <p className="step-detail-subtitle">{activeStepDef.subtitle}</p>
          </div>

          <div className="step-actions">
            <select
              aria-label={`Set status for Step ${activeStepDef.id}`}
              className="select-compact"
              value={client.stepStatuses?.[activeStepDef.id] || 'pending'}
              onChange={(e) => handleStepStatusChange(activeStepDef.id, e.target.value)}
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="action_required">Action Required</option>
              <option value="completed">Completed</option>
            </select>

            {client.stepStatuses?.[activeStepDef.id] !== 'completed' && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => handleStepStatusChange(activeStepDef.id, 'completed')}
              >
                <span>Complete Step {activeStepDef.id}</span>
                <ChevronRight size={15} />
              </button>
            )}
          </div>
        </div>

        <ul className="step-checklist">
          {activeStepDef.checklist.map((item, idx) => {
            const checked = Boolean(client.checklistProgress?.[`${activeStepDef.id}_${idx}`]);
            return (
              <li key={idx}>
                <button
                  type="button"
                  className={`checklist-item ${checked ? 'is-checked' : ''}`}
                  onClick={() => handleToggleChecklist(activeStepDef.id, idx)}
                >
                  {checked ? (
                    <CheckCircle2 size={17} className="check-icon-done" />
                  ) : (
                    <Circle size={17} className="check-icon-todo" />
                  )}
                  <span>{item}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
