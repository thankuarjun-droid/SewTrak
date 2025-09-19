import React, { useMemo } from 'react';
import type { Employee, ProductionEntry, Style, OperatorGrade, DailyAttendance, InLineAudit, EndLineCheck, Line, LevelDefinition, GamificationSettings, Operation } from '../types';
import { XIcon, UsersIcon, CalendarDaysIcon, ChartBarIcon, ShieldCheckIcon } from '../components/IconComponents';
import * as Avatars from './LevelAvatars';
import { AttendanceIcon, ProductionIcon, EfficiencyIcon, QualityIcon, MilestoneIcon, HelpIcon, TrainingIcon } from './GamificationIcons';

const avatarMap = Avatars as unknown as Record<string, React.FC<any>>;

interface AllData {
    productionEntries: ProductionEntry[];
    endLineChecks: EndLineCheck[];
    dailyAttendances: DailyAttendance[];
    styles: Style[];
    operations: Operation[];
    operatorGrades: OperatorGrade[];
    inLineAudits: InLineAudit[];
    lines: Line[];
    levelDefinitions: LevelDefinition[];
    gamificationSettings: GamificationSettings;
}

interface EmployeePerformanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  allData: AllData;
}

const KpiCard = ({ title, value, icon: Icon }: { title: string, value: string, icon: React.ElementType }) => (
    <div className="bg-slate-100 p-3 rounded-lg flex items-start space-x-3">
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-white text-[#2c4e8a] rounded-full shadow-sm">
            <Icon className="w-5 h-5"/>
        </div>
        <div>
            <p className="text-xs text-slate-600">{title}</p>
            <p className="text-lg font-bold text-slate-900">{value}</p>
        </div>
    </div>
);

export const EmployeePerformanceModal = ({ isOpen, onClose, employee, allData }: EmployeePerformanceModalProps) => {

  const performanceData = useMemo(() => {
    if (!employee) return null;

    const { productionEntries, endLineChecks, dailyAttendances, styles, levelDefinitions, gamificationSettings } = allData;
    
    const empProdEntries = (productionEntries || []).filter(p => p.employeeId === employee.id);
    const stylesMap = new Map((styles || []).map(s => [s.id, s]));

    const score = { points: 0, metrics: { attendance: 0, production: 0, efficiency: 0, quality: 0, milestone: 0, noDefects: 0, helping: 0, training: 0 } };
    
    const daysPresent = (dailyAttendances || []).filter(d => d.presentEmployeeIds.includes(employee.id)).length;
    score.points += daysPresent * gamificationSettings.pointsForAttendance;
    score.metrics.attendance += daysPresent * gamificationSettings.pointsForAttendance;
    
    const { totalUnits, totalSmv, hours: uniqueHoursWorked } = empProdEntries.reduce((acc, p) => {
        acc.totalUnits += p.productionQuantity;
        const style = stylesMap.get(p.styleNumber);
        const op = style?.operationBulletin?.find(ob => ob.operationId === p.operation);
        const smv = op ? (op.pickupTime + op.sewingTime + op.trimAndDisposalTime) / 60 : 0;
        acc.totalSmv += p.productionQuantity * smv;
        acc.hours.add(`${p.timestamp.split('T')[0]}-${p.hourCounter}`);
        return acc;
    }, { totalUnits: 0, totalSmv: 0, hours: new Set<string>() });
    const uniqueHours = uniqueHoursWorked.size;

    const prodPoints = (totalUnits / 1000) * gamificationSettings.pointsPerProductionUnit;
    score.points += prodPoints;
    score.metrics.production += prodPoints;

    const overallEfficiency = uniqueHours > 0 ? (totalSmv / (uniqueHours * 60)) * 100 : 0;
    if (overallEfficiency > gamificationSettings.efficiencyBaseline) {
        const effPoints = (overallEfficiency - gamificationSettings.efficiencyBaseline) * gamificationSettings.pointsPerEfficiencyPercent;
        score.points += effPoints;
        score.metrics.efficiency += effPoints;
    }
    
    const totalDefectsCaused = (endLineChecks || []).filter(c => c.responsibleEmpId === employee.id && (c.status === 'Rework' || c.status === 'Reject')).length;
    const rftPercent = totalUnits > 0 ? ((totalUnits - totalDefectsCaused) / totalUnits) * 100 : 100;
    const qualityPoints = rftPercent * gamificationSettings.pointsPerRFTPercent;
    score.points += qualityPoints;
    score.metrics.quality += qualityPoints;
    
    // Simulate other points
    score.points += gamificationSettings.pointsForMilestone * 2; score.metrics.milestone += gamificationSettings.pointsForMilestone * 2;
    score.points += gamificationSettings.pointsForNoDefects * 15; score.metrics.noDefects += gamificationSettings.pointsForNoDefects * 15;
    score.points += gamificationSettings.pointsForHelping * 5; score.metrics.helping += gamificationSettings.pointsForHelping * 5;
    score.points += gamificationSettings.pointsForTraining; score.metrics.training += gamificationSettings.pointsForTraining;


    const defaultLevel = { level: 0, name: 'Newbie', avatar: 'Avatar01', pointsRequired: 0 };
    const sortedLevels = [...(levelDefinitions || [])].sort((a,b) => b.level - a.level);
    const currentLevel = sortedLevels.find(l => score.points >= l.pointsRequired) || sortedLevels[sortedLevels.length - 1] || defaultLevel;
    const nextLevel = (levelDefinitions || []).find(l => l.level === currentLevel.level + 1);
    
    let progressToNext = 100;
    let pointsToNext = 0;
    if(nextLevel) {
        const pointsForLevel = nextLevel.pointsRequired - currentLevel.pointsRequired;
        const pointsInLevel = score.points - currentLevel.pointsRequired;
        pointsToNext = nextLevel.pointsRequired - score.points;
        progressToNext = pointsForLevel > 0 ? (pointsInLevel / pointsForLevel) * 100 : 100;
    }

    const unlockedAvatars = (levelDefinitions || []).filter(l => l.level <= currentLevel.level);

    return {
        overallEfficiency, rftPercent,
        score, currentLevel, nextLevel, progressToNext, pointsToNext, unlockedAvatars
    };
  }, [employee, allData]);

  if (!isOpen || !employee || !performanceData) return null;
  
  const { currentLevel, nextLevel, progressToNext, pointsToNext, score, unlockedAvatars, overallEfficiency, rftPercent } = performanceData;
  const gradeName = allData.operatorGrades.find(g => g.id === employee.operatorGradeId)?.name || 'N/A';
  const CurrentAvatar = avatarMap[currentLevel.avatar];
  const metricConfig = [
      { key: 'attendance', label: 'Attendance', icon: AttendanceIcon },
      { key: 'production', label: 'Production', icon: ProductionIcon },
      { key: 'efficiency', label: 'Efficiency', icon: EfficiencyIcon },
      { key: 'quality', label: 'Quality (RFT)', icon: QualityIcon },
      { key: 'noDefects', label: 'No Defects', icon: QualityIcon },
      { key: 'milestone', label: 'Milestones', icon: MilestoneIcon },
      { key: 'helping', label: 'Helping', icon: HelpIcon },
      { key: 'training', label: 'Training', icon: TrainingIcon },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="flex-shrink-0 flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Employee Performance Dashboard</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100"><XIcon className="w-6 h-6"/></button>
        </header>
        
        <main className="flex-1 p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50">
            {/* Left Column - Player Card & Trophy Case */}
            <div className="md:col-span-1 space-y-6">
                <div className="bg-white border rounded-lg p-4 text-center">
                    <CurrentAvatar className="w-24 h-24 mx-auto"/>
                    <h3 className="mt-2 text-xl font-bold text-slate-800">{employee.name}</h3>
                    <p className="text-sm text-slate-600">{employee.designation} - {gradeName}</p>
                    <p className="mt-2 text-sm font-semibold text-indigo-600">Level {currentLevel.level} - {currentLevel.name}</p>
                    <div className="mt-4">
                        <div className="w-full bg-slate-200 rounded-full h-2.5">
                            <div className="bg-amber-400 h-2.5 rounded-full" style={{width: `${progressToNext}%`}}></div>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {nextLevel ? `${Math.round(pointsToNext).toLocaleString()} points to Level ${nextLevel.level}` : 'Max Level Reached!'}
                        </p>
                    </div>
                </div>
                <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-semibold text-slate-800 mb-2">Trophy Case</h3>
                    <div className="grid grid-cols-5 gap-2">
                        {unlockedAvatars.map(level => {
                            const Avatar = avatarMap[level.avatar];
                            return <Avatar key={level.level} className="w-full" title={`Level ${level.level}: ${level.name}`}/>;
                        })}
                    </div>
                </div>
            </div>

            {/* Right Column - KPIs & Points */}
            <div className="md:col-span-2 space-y-6">
                <div className="grid grid-cols-3 gap-4">
                    <KpiCard title="Overall Efficiency" value={`${overallEfficiency.toFixed(1)}%`} icon={ChartBarIcon} />
                    <KpiCard title="Right First Time" value={`${rftPercent.toFixed(1)}%`} icon={ShieldCheckIcon} />
                    <KpiCard title="Total Points" value={Math.round(score.points).toLocaleString()} icon={UsersIcon} />
                </div>
                <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-semibold text-slate-800 mb-2">Points Breakdown</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {metricConfig.map(({ key, label, icon: Icon }) => (
                            <div key={key} className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded-md">
                                <div className="flex items-center gap-2">
                                    <Icon className="w-5 h-5 text-slate-500"/>
                                    <span className="text-slate-700">{label}</span>
                                </div>
                                <span className="font-semibold font-mono text-slate-800">{Math.round(score.metrics[key as keyof typeof score.metrics]).toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </main>
      </div>
    </div>
  );
};