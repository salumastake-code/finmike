'use client';
import { useState } from 'react';
import type { PlayerSave, EmployeeAssignment } from '@/types/game';

interface Props {
  save: PlayerSave;
  onConfirm: (assignments: { employeeId: string; assignment: EmployeeAssignment }[]) => void;
}

const ASSIGNMENT_OPTIONS: { value: EmployeeAssignment; label: string; emoji: string }[] = [
  { value: 'bakery',      label: 'Bakery',     emoji: '🥖' },
  { value: 'dog_walking', label: 'Dog Walking', emoji: '🐕' },
  { value: 'stand1',      label: 'Stand',      emoji: '🏪' },
  { value: 'unassigned',  label: 'Off Duty',   emoji: '💤' },
];

export default function DayPlanModal({ save, onConfirm }: Props) {
  const employees = save.employees ?? [];

  // Pre-select yesterday's assignments
  const [assignments, setAssignments] = useState<Record<string, EmployeeAssignment>>(
    Object.fromEntries(employees.map(e => [e.id, e.assignment]))
  );

  function setAssignment(empId: string, value: EmployeeAssignment) {
    setAssignments(prev => ({ ...prev, [empId]: value }));
  }

  function handleConfirm() {
    const result = employees.map(e => ({
      employeeId: e.id,
      assignment: assignments[e.id] ?? e.assignment,
    }));
    onConfirm(result);
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-indigo-600 px-5 py-4">
          <div className="text-white font-black text-xl">📋 Plan Your Day</div>
          <div className="text-indigo-200 text-sm mt-0.5">Day {save.dayNumber}</div>
        </div>

        <div className="p-5 space-y-4">
          {employees.length === 0 ? (
            <div className="text-center py-6 text-gray-500 text-sm">
              <div className="text-3xl mb-2">👥</div>
              <div>Hire your first employee from the Team tab to start delegating!</div>
            </div>
          ) : (
            <div className="space-y-3">
              {employees.map(emp => {
                const currentAssignment = assignments[emp.id] ?? emp.assignment;
                return (
                  <div key={emp.id} className="bg-gray-50 rounded-2xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{emp.emoji}</span>
                      <div>
                        <div className="font-bold text-gray-800 text-sm">{emp.name}</div>
                        <div className="text-xs text-gray-400">
                          Training {emp.trainingLevel}% · ${emp.wage}/day
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {ASSIGNMENT_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setAssignment(emp.id, opt.value)}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
                            currentAssignment === opt.value
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'
                          }`}
                        >
                          <span>{opt.emoji}</span>
                          <span>{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button
            onClick={handleConfirm}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-base rounded-2xl transition-colors shadow-lg"
          >
            Let's Go! ⚡
          </button>
        </div>
      </div>
    </div>
  );
}
