'use client';
import { useState } from 'react';
import type { PlayerSave, Employee, EmployeeAssignment } from '@/types/game';
import { EMPLOYEE_WAGES, TRAINING_SESSIONS } from '@/lib/stage2';

interface Props {
  save: PlayerSave;
  onHire: (assignment: EmployeeAssignment) => void;
  onTrain: (employeeId: string, sessionIdx: number) => void;
  onPromote: (employeeId: string) => void;
  onAssign: (employeeId: string, assignment: EmployeeAssignment) => void;
}

const ASSIGNMENTS: { id: EmployeeAssignment; label: string; emoji: string }[] = [
  { id: 'stand1',      label: 'Stand #1',    emoji: '🏪' },
  { id: 'stand2',      label: 'Stand #2',    emoji: '🏪' },
  { id: 'bakery',      label: 'Bakery',      emoji: '🥖' },
  { id: 'dog_walking', label: 'Dog Walking', emoji: '🐕' },
  { id: 'unassigned',  label: 'Off Duty',    emoji: '💤' },
];

export default function EmployeesPanel({ save, onHire, onTrain, onPromote, onAssign }: Props) {
  const [hiringFor, setHiringFor] = useState<EmployeeAssignment | null>(null);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const employees = save.employees ?? [];
  const tokensLeft = save.tokens.total - save.tokens.spent;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-2xl">👥</span>
        <div>
          <div className="font-bold text-gray-800">Your Team</div>
          <div className="text-xs text-gray-400">{employees.length}/4 employees · Hire → Train → Promote</div>
        </div>
      </div>

      {/* Progression reminder */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-xs text-indigo-700 leading-relaxed">
        💡 <strong>The arc:</strong> Do it yourself → Hire → Train → Delegate → Manager. Building a team takes time and money — but frees your energy for bigger things.
      </div>

      {/* Existing employees */}
      {employees.map(emp => {
        const isSelected = selectedEmp?.id === emp.id;
        const isInTraining = emp.trainingDaysRemaining > 0;
        const stageColor = emp.stage === 'manager' ? 'border-yellow-300 bg-yellow-50' : emp.stage === 'trained' ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50';
        return (
          <div key={emp.id} className={`rounded-2xl border-2 p-3 transition-all ${stageColor}`}>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setSelectedEmp(isSelected ? null : emp)}>
              <span className="text-2xl">{emp.emoji}</span>
              <div className="flex-1">
                <div className="font-bold text-gray-800 text-sm">{emp.name}
                  {emp.stage === 'manager' && <span className="ml-1 text-xs bg-yellow-200 text-yellow-700 px-1.5 py-0.5 rounded-full">Manager ⭐</span>}
                  {emp.stage === 'trained' && <span className="ml-1 text-xs bg-green-200 text-green-700 px-1.5 py-0.5 rounded-full">Trained</span>}
                </div>
                <div className="text-xs text-gray-500">
                  {ASSIGNMENTS.find(a => a.id === emp.assignment)?.emoji} {ASSIGNMENTS.find(a => a.id === emp.assignment)?.label}
                  {' · '}${emp.wage}/day
                  {isInTraining && <span className="text-amber-600"> · In training ({emp.trainingDaysRemaining}d left)</span>}
                </div>
              </div>
              {/* Training bar */}
              <div className="text-right flex-shrink-0">
                <div className="text-xs text-gray-400 mb-0.5">Training {emp.trainingLevel}%</div>
                <div className="w-16 bg-gray-200 rounded-full h-1.5">
                  <div className="bg-indigo-400 h-1.5 rounded-full" style={{ width: `${emp.trainingLevel}%` }} />
                </div>
              </div>
            </div>

            {isSelected && (
              <div className="mt-3 space-y-2 border-t border-gray-200 pt-3">
                {/* Assignment */}
                <div className="text-xs font-bold text-gray-500 mb-1">Assign to:</div>
                <div className="flex flex-wrap gap-1.5">
                  {ASSIGNMENTS.map(a => (
                    <button key={a.id} onClick={() => onAssign(emp.id, a.id)}
                      className={`text-xs px-2.5 py-1.5 rounded-xl font-bold border transition-all ${emp.assignment === a.id ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white border-gray-200 text-gray-500 hover:border-indigo-300'}`}>
                      {a.emoji} {a.label}
                    </button>
                  ))}
                </div>

                {/* Training sessions */}
                {!isInTraining && (
                  <>
                    <div className="text-xs font-bold text-gray-500 mb-1 mt-2">Training:</div>
                    <div className="space-y-1.5">
                      {TRAINING_SESSIONS.map((session, idx) => (
                        <button key={idx} onClick={() => onTrain(emp.id, idx)}
                          disabled={tokensLeft < session.energyCost || save.coins < session.cost}
                          className="w-full flex items-center gap-2 p-2 bg-amber-50 hover:bg-amber-100 disabled:opacity-40 border border-amber-200 rounded-xl text-xs transition-all text-left">
                          <span>📚</span>
                          <div className="flex-1">
                            <span className="font-bold text-gray-700">{session.name}</span>
                            <span className="text-gray-400 ml-1">· +{session.skillGain} training · {session.days} day{session.days > 1 ? 's' : ''}</span>
                          </div>
                          <span className="text-amber-600 font-bold flex-shrink-0">
                            {session.cost > 0 ? `$${session.cost} · ` : ''}{session.energyCost}⚡
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
                {isInTraining && (
                  <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl p-2 text-center">
                    📚 {emp.name} is in training — {emp.trainingDaysRemaining} day{emp.trainingDaysRemaining !== 1 ? 's' : ''} left
                  </div>
                )}

                {/* Promote button */}
                {emp.trainingLevel >= 50 && emp.stage !== 'manager' && (
                  <button onClick={() => onPromote(emp.id)}
                    className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-500 text-white font-bold rounded-xl text-sm transition-colors">
                    ⭐ Promote to Manager
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Hire new employee */}
      {employees.length < 4 && (
        <div className="space-y-2">
          {!hiringFor ? (
            <button onClick={() => setHiringFor('stand1')}
              disabled={save.coins < 40}
              className="w-full flex items-center gap-3 p-3 border-2 border-dashed border-purple-300 hover:border-purple-400 hover:bg-purple-50 disabled:opacity-40 rounded-2xl transition-all">
              <span className="text-2xl">👤</span>
              <div className="flex-1 text-left text-sm font-bold text-purple-700">
                Hire a New Employee
                <div className="text-xs font-normal text-purple-400">$40 hiring fee · assign them to any business</div>
              </div>
              <span className="text-xs bg-purple-100 text-purple-600 rounded-lg px-2 py-1 font-bold">$40</span>
            </button>
          ) : (
            <div className="border-2 border-purple-200 rounded-2xl p-3 space-y-2">
              <div className="text-xs font-bold text-gray-600">Assign to:</div>
              {ASSIGNMENTS.filter(a => a.id !== 'unassigned').map(a => (
                <button key={a.id} onClick={() => { onHire(a.id); setHiringFor(null); }}
                  className="w-full flex items-center gap-2 p-2.5 bg-white hover:bg-purple-50 border border-gray-200 hover:border-purple-300 rounded-xl text-sm transition-all text-left">
                  <span className="text-xl">{a.emoji}</span>
                  <div className="flex-1 font-bold text-gray-700">{a.label}</div>
                  <span className="text-xs text-gray-400">${EMPLOYEE_WAGES[a.id]}/day</span>
                </button>
              ))}
              <button onClick={() => setHiringFor(null)} className="text-xs text-gray-400 w-full text-center">Cancel</button>
            </div>
          )}
        </div>
      )}
      {employees.length === 0 && (
        <div className="text-xs text-center text-gray-400 bg-gray-50 rounded-xl p-3">
          Hire your first employee to start building a team. They'll need training before they're fully effective.
        </div>
      )}
    </div>
  );
}
