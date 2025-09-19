import React, { useMemo, useState, useCallback } from 'react';
import type { GamificationSettings, LevelDefinition, Employee, Line, ProductionEntry, DailyAttendance, EndLineCheck, Staff, FactorySettings, Style, Operation, InLineAudit, OperatorGrade } from '../types';
// FIX: Remove dummy icon components and import from IconComponents
import { UsersIcon, XIcon, PrinterIcon } from '../components/IconComponents';
import { AttendanceIcon, ProductionIcon, EfficiencyIcon, QualityIcon, MilestoneIcon, HelpIcon, TrainingIcon } from '../components/GamificationIcons';
import * as Avatars from '../components/LevelAvatars';
import { EmployeePerformanceModal } from '../components/EmployeePerformanceModal';

const avatarMap = Avatars as unknown as Record<string, React.FC<any>>;

interface GamificationDashboardPageProps {
  allData: {
    currentUser: Staff;
    lines: Line[];
    employees: Employee[];
    productionEntries: ProductionEntry[];
    dailyAttendances: DailyAttendance[];
    endLineChecks: EndLineCheck[];
    gamificationSettings: GamificationSettings;
    levelDefinitions: LevelDefinition[];
    factorySettings: FactorySettings;
    styles: Style[];
    operations: Operation[];
    operatorGrades: OperatorGrade[];
    inLineAudits: InLineAudit[];
  };
}

type Period = 'Week' | 'Month' | 'Year';
type Winner = { id: string; name: string; points: number; metrics: Record<string, number> } | null;
type EmployeeScore = { id: string; name: string; lineId: string; points: number; metrics: Record<string, number>, level: number, levelName: string, avatar: string, progressToNext: number };

const GamificationDashboardPage = ({ allData }: GamificationDashboardPageProps) => {
  const { employees = [], lines = [], productionEntries = [], dailyAttendances = [], endLineChecks = [], gamificationSettings, styles = [], levelDefinitions = [] } = allData;

  const [detailsModalData, setDetailsModalData] = useState<{ winner: Winner; period: Period; type: 'Star' | 'Team' } | null>(null);
  const [activeTab, setActiveTab] = useState<'levels' | 'points'>('levels');
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);

  const stylesMap = useMemo(() => new Map(styles.map(s => [s.id, s])), [styles]);

  const calculateScores = useCallback((startDate: Date, endDate: Date): EmployeeScore[] => {
    const scores = new Map<string, EmployeeScore>();
    
    (employees || []).forEach(emp => {
      scores.set(emp.id, { id: emp.id, name: emp.name, lineId: emp.currentLineId, points: 0, metrics: { attendance: 0, production: 0, efficiency: 0, quality: 0, milestone: 0, noDefects: 0, helping: 0, training: 0 }, level: 0, levelName: '', avatar: 'Avatar01', progressToNext: 0 });
    });
    
    const relevantAttendances = (dailyAttendances || []).filter(d => new Date(d.date) >= startDate && new Date(d.date) <= endDate);
    relevantAttendances.forEach(day => {
      day.presentEmployeeIds.forEach(empId => {
        const empScore = scores.get(empId);
        if (empScore) {
          empScore.points += gamificationSettings.pointsForAttendance;
          empScore.metrics.attendance += gamificationSettings.pointsForAttendance;
        }
      });
    });

    const relevantProduction = (productionEntries || []).filter(p => new Date(p.timestamp) >= startDate && new Date(p.timestamp) <= endDate);
    const prodByEmployee = relevantProduction.reduce((acc, entry) => {
        if(!acc[entry.employeeId]) acc[entry.employeeId] = [];
        acc[entry.employeeId].push(entry);
        return acc;
    }, {} as Record<string, ProductionEntry[]>);

    Object.keys(prodByEmployee).forEach(empId => {
      const empScore = scores.get(empId);
      if (!empScore) return;
      
      const entries = prodByEmployee[empId];
      const { totalUnits, totalSmv, hours } = entries.reduce((acc, p) => {
        acc.totalUnits += p.productionQuantity;
        const style = stylesMap.get(p.styleNumber);
        const op = style?.operationBulletin?.find(ob => ob.operationId === p.operation);
        const smv = op ? (op.pickupTime + op.sewingTime + op.trimAndDisposalTime) / 60 : 0;
        acc.totalSmv += p.productionQuantity * smv;
        acc.hours.add(`${p.timestamp.split('T')[0]}-${p.hourCounter}`);
        return acc;
      }, { totalUnits: 0, totalSmv: 0, hours: new Set<string>() });

      const prodPoints = (totalUnits / 1000) * gamificationSettings.pointsPerProductionUnit;
      empScore.points += prodPoints;
      empScore.metrics.production += prodPoints;

      const uniqueHours = hours.size;
      const efficiency = uniqueHours > 0 ? (totalSmv / (uniqueHours * 60)) * 100 : 0;
      if (efficiency > gamificationSettings.efficiencyBaseline) {
        const effPoints = (efficiency - gamificationSettings.efficiencyBaseline) * gamificationSettings.pointsPerEfficiencyPercent;
        empScore.points += effPoints;
        empScore.metrics.efficiency += effPoints;
      }
    });
    
    const relevantChecks = (endLineChecks || []).filter(c => new Date(c.timestamp) >= startDate && new Date(c.timestamp) <= endDate);
    const defectsByEmployee = new Map<string, number>();
    relevantChecks.forEach(check => {
      if (check.responsibleEmpId && (check.status === 'Rework' || check.status === 'Reject')) {
        defectsByEmployee.set(check.responsibleEmpId, (defectsByEmployee.get(check.responsibleEmpId) || 0) + 1);
      }
    });
    
    scores.forEach(score => {
        const totalOutput = (prodByEmployee[score.id] || []).reduce((sum, p) => sum + p.productionQuantity, 0);
        const totalDefects = defectsByEmployee.get(score.id) || 0;
        const rft = totalOutput > 0 ? ((totalOutput - totalDefects) / totalOutput) * 100 : 100;
        const qualityPoints = rft * gamificationSettings.pointsPerRFTPercent;
        score.points += qualityPoints;
        score.metrics.quality += qualityPoints;
    });

    const sortedLevels = [...(levelDefinitions || [])].sort((a,b) => b.level - a.level);
    
    return Array.from(scores.values()).map(score => {
        const currentLevel = sortedLevels.find(l => score.points >= l.pointsRequired) || sortedLevels[sortedLevels.length - 1] || { level: 0, name: '', avatar: 'Avatar01', pointsRequired: 0 };
        const nextLevel = (levelDefinitions || []).find(l => l.level === currentLevel.level + 1);
        
        let progressToNext = 100;
        if (nextLevel) {
            const pointsForLevel = nextLevel.pointsRequired - currentLevel.pointsRequired;
            const pointsInLevel = score.points - currentLevel.pointsRequired;
            progressToNext = pointsForLevel > 0 ? (pointsInLevel / pointsForLevel) * 100 : 100;
        }
        return { ...score, level: currentLevel.level, levelName: currentLevel.name, avatar: currentLevel.avatar, progressToNext };
    });
  }, [employees, dailyAttendances, productionEntries, endLineChecks, gamificationSettings, stylesMap, levelDefinitions]);

  const [weekScores, monthScores, yearScores] = useMemo(() => {
    const now = new Date();
    
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
    weekStart.setHours(0,0,0,0);
    const weekScores = calculateScores(weekStart, now);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthScores = calculateScores(monthStart, now);

    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearScores = calculateScores(yearStart, now);
    
    return [weekScores, monthScores, yearScores];
  }, [calculateScores]);

  const [weeklyStar, monthlyStar, yearlyStar] = useMemo(() => {
    const getWinner = (scores: any[]) => scores.length > 0 ? scores.sort((a,b) => b.points - a.points)[0] : null;
    return [getWinner(weekScores), getWinner(monthScores), getWinner(yearScores)];
  }, [weekScores, monthScores, yearScores]);
  
  const employeeLeaderboard = useMemo(() => monthScores.sort((a,b) => b.points - a.points), [monthScores]);
  
  const teamLeaderboard = useMemo(() => {
    const lineScores = new Map<string, { name: string; points: number; members: number }>();
    lines.forEach(line => lineScores.set(line.id, { name: line.name, points: 0, members: 0 }));
    
    monthScores.forEach(score => {
      const lineScore = lineScores.get(score.lineId);
      if (lineScore) {
        lineScore.points += score.points;
        lineScore.members++;
      }
    });
    
    return Array.from(lineScores.values())
        .map(line => ({ ...line, avgPoints: line.members > 0 ? line.points / line.members : 0 }))
        .sort((a,b) => b.avgPoints - a.avgPoints);
  }, [monthScores, lines]);


  const handlePrintCertificate = useCallback((winner: Winner) => {
    if (!winner) return;
    const printWindow = window.open('/certificateTemplate', '_blank', 'height=600,width=840');
  }, []);
  
  const WinnerCard = ({ winner, period, type, onDetailsClick, onPrintClick }: { winner: Winner, period: Period, type: 'Star' | 'Team', onDetailsClick: (data: any) => void, onPrintClick: (winner: Winner) => void }) => {
    const Avatar = winner ? avatarMap[employeeLeaderboard.find(e => e.id === winner.id)?.avatar || 'Avatar01'] : null;
    return (
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-md text-center">
            <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400">Star of the {period}</h3>
            {winner && Avatar ? (
                <>
                    <Avatar className="w-20 h-20 mx-auto mt-4" />
                    <p className="mt-2 text-xl font-semibold text-slate-800 dark:text-slate-200">{winner.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{Math.round(winner.points).toLocaleString()} Points</p>
                    <div className="mt-4 flex gap-2 justify-center">
                        <button onClick={() => onDetailsClick({ winner, period, type })} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">View Details</button>
                        <button onClick={() => onPrintClick(winner)} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400"><PrinterIcon className="w-4 h-4 inline-block mr-1"/>Print Certificate</button>
                    </div>
                </>
            ) : <p className="mt-12 text-slate-500 dark:text-slate-400">No winner yet</p>}
        </div>
    );
  };
  
  const Leaderboard = ({ title, data, isTeam, onRowClick }: { title: string, data: any[], isTeam: boolean, onRowClick?: (id: string) => void }) => {
    return (
        <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">{title}</h3>
            <div className="max-h-96 overflow-y-auto pr-2 space-y-2">
                {data.map((item, index) => {
                    const Avatar = !isTeam ? avatarMap[item.avatar] : null;
                    return (
                        <div key={item.id || item.name} className={`flex items-center gap-3 p-2 rounded-md ${onRowClick ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700' : ''}`} onClick={() => onRowClick && onRowClick(item.id)}>
                            <span className="font-bold text-slate-500 w-6 text-center">{index + 1}</span>
                            {!isTeam && Avatar && <Avatar className="w-10 h-10" />}
                            <div className="flex-1">
                                <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{item.name}</p>
                                <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
                                    {!isTeam && <div className="bg-amber-400 h-1.5 rounded-full" style={{width: `${item.progressToNext}%`}}></div>}
                                </div>
                            </div>
                            <p className="font-bold text-sm text-indigo-600 dark:text-indigo-400">{isTeam ? Math.round(item.avgPoints).toLocaleString() : Math.round(item.points).toLocaleString()} pts</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
  };

  const PointsSystem = ({ settings }: { settings: GamificationSettings }) => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
        <div className="flex items-center gap-2 p-2 bg-slate-50 rounded"><AttendanceIcon className="w-5 h-5 text-green-500"/><div><span className="font-semibold">{settings.pointsForAttendance}</span> pts / day</div></div>
        <div className="flex items-center gap-2 p-2 bg-slate-50 rounded"><ProductionIcon className="w-5 h-5 text-blue-500"/><div><span className="font-semibold">{settings.pointsPerProductionUnit}</span> pts / 1k units</div></div>
        <div className="flex items-center gap-2 p-2 bg-slate-50 rounded"><EfficiencyIcon className="w-5 h-5 text-purple-500"/><div><span className="font-semibold">{settings.pointsPerEfficiencyPercent}</span> pts / % &gt; {settings.efficiencyBaseline}%</div></div>
        <div className="flex items-center gap-2 p-2 bg-slate-50 rounded"><QualityIcon className="w-5 h-5 text-red-500"/><div><span className="font-semibold">{settings.pointsPerRFTPercent}</span> pts / % RFT</div></div>
        <div className="flex items-center gap-2 p-2 bg-slate-50 rounded"><MilestoneIcon className="w-5 h-5 text-amber-500"/><div><span className="font-semibold">{settings.pointsForMilestone}</span> pts / milestone</div></div>
        <div className="flex items-center gap-2 p-2 bg-slate-50 rounded"><HelpIcon className="w-5 h-5 text-cyan-500"/><div><span className="font-semibold">{settings.pointsForHelping}</span> pts / helping</div></div>
    </div>
  );

  const WinnerDetailsModal = ({ data, onClose }: { data: { winner: Winner, period: Period, type: string }, onClose: () => void }) => {
    if(!data.winner) return null;
    const { winner, period } = data;
    const metricConfig = [
        { key: 'attendance', label: 'Attendance', icon: AttendanceIcon },
        { key: 'production', label: 'Production', icon: ProductionIcon },
        { key: 'efficiency', label: 'Efficiency', icon: EfficiencyIcon },
        { key: 'quality', label: 'Quality (RFT)', icon: QualityIcon },
    ];
    return (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
                <header className="flex justify-between items-center p-4 border-b">
                    <h3 className="font-semibold">Star of the {period} Details</h3>
                    <button onClick={onClose}><XIcon className="w-5 h-5"/></button>
                </header>
                <div className="p-4">
                    <h4 className="font-bold text-lg text-center">{winner.name}</h4>
                    <p className="text-center font-mono text-indigo-600">{Math.round(winner.points).toLocaleString()} Total Points</p>
                    <div className="mt-4 space-y-2">
                        {metricConfig.map(({key, label, icon: Icon}) => (
                           <div key={key} className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded-md">
                               <div className="flex items-center gap-2"><Icon className="w-5 h-5 text-slate-500"/><span>{label}</span></div>
                               <span className="font-semibold font-mono">{Math.round(winner.metrics[key]).toLocaleString()} pts</span>
                           </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
  };

  return (
    <>
      <div className="p-4 sm:p-6 md:p-8 space-y-6">
        <header>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Gamification Dashboard</h1>
          <p className="text-slate-600 mt-2">Recognize top performers and track your progress.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <WinnerCard winner={weeklyStar} period="Week" type="Star" onDetailsClick={setDetailsModalData} onPrintClick={handlePrintCertificate} />
          <WinnerCard winner={monthlyStar} period="Month" type="Star" onDetailsClick={setDetailsModalData} onPrintClick={handlePrintCertificate} />
          <WinnerCard winner={yearlyStar} period="Year" type="Star" onDetailsClick={setDetailsModalData} onPrintClick={handlePrintCertificate} />
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg">
          <nav className="flex border-b dark:border-slate-700 mb-4">
            <button onClick={() => setActiveTab('levels')} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'levels' ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>Leaderboard</button>
            <button onClick={() => setActiveTab('points')} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'points' ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>Points System</button>
          </nav>
          
          {activeTab === 'levels' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Leaderboard title="Team Leaderboard (This Month)" data={teamLeaderboard} isTeam />
              <Leaderboard title="Individual Leaderboard (This Month)" data={employeeLeaderboard} isTeam={false} onRowClick={(id) => setViewingEmployee(employees.find(e => e.id === id) || null)} />
            </div>
          )}
          {activeTab === 'points' && (
            <PointsSystem settings={gamificationSettings} />
          )}
        </div>
      </div>

      {detailsModalData && <WinnerDetailsModal data={detailsModalData} onClose={() => setDetailsModalData(null)} />}
      {viewingEmployee && <EmployeePerformanceModal isOpen={!!viewingEmployee} onClose={() => setViewingEmployee(null)} employee={viewingEmployee} allData={allData} />}
    </>
  );
};

export default GamificationDashboardPage;